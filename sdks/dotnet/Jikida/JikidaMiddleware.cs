namespace Jikida;

using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

// Jikida — fail-open WAF middleware for ASP.NET Core.
//
// Design (mirrors the Node / PHP / Python / Go / Ruby SDKs):
// - Fails open. If Jikida is unreachable or slow, the request is allowed.
// - Policy is cached. Rules are pulled on a background timer and evaluated
//   locally; the request path never blocks on a network call.
// - Logs are fire-and-forget.
public class JikidaOptions
{
    public string? Token { get; set; }
    public string ApiUrl { get; set; } = "https://app.jikida.io/api";
    public TimeSpan PolicyRefresh { get; set; } = TimeSpan.FromMinutes(5);
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(1);
}

internal sealed class CompiledRule
{
    public string Id = "";
    public string Action = "block";
    public string Target = "query";
    public string Category = "";
    public Regex Re = new("$^");
}

internal sealed class JikidaClient
{
    private readonly JikidaOptions _o;
    private readonly HttpClient _http;
    private volatile List<CompiledRule> _rules = new();
    private readonly List<object> _queue = new();
    private readonly object _lock = new();

    public JikidaClient(JikidaOptions o)
    {
        _o = o;
        _http = new HttpClient { Timeout = o.Timeout };
        _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {o.Token}");
        if (!string.IsNullOrEmpty(o.Token))
        {
            _ = Task.Run(RefreshLoopAsync);
        }
    }

    private async Task RefreshLoopAsync()
    {
        while (true)
        {
            await RefreshOnceAsync();
            await Task.Delay(_o.PolicyRefresh);
        }
    }

    private async Task RefreshOnceAsync()
    {
        try
        {
            var res = await _http.GetAsync($"{_o.ApiUrl.TrimEnd('/')}/policy");
            if (!res.IsSuccessStatusCode) return;
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
            var compiled = new List<CompiledRule>();
            if (doc.RootElement.TryGetProperty("rules", out var rules))
            {
                foreach (var r in rules.EnumerateArray())
                {
                    try
                    {
                        var flags = r.TryGetProperty("flags", out var f) ? f.GetString() ?? "" : "";
                        var opts = flags.Contains('i') ? RegexOptions.IgnoreCase : RegexOptions.None;
                        compiled.Add(new CompiledRule
                        {
                            Id = r.GetProperty("id").GetString() ?? "",
                            Action = r.TryGetProperty("action", out var a) ? a.GetString() ?? "block" : "block",
                            Target = r.TryGetProperty("target", out var t) ? t.GetString() ?? "query" : "query",
                            Category = r.TryGetProperty("category", out var c) ? c.GetString() ?? "" : "",
                            Re = new Regex(r.GetProperty("pattern").GetString() ?? "$^", opts),
                        });
                    }
                    catch { /* skip a bad rule, never fatal */ }
                }
            }
            _rules = compiled;
        }
        catch { /* fail open: keep last-known-good rules */ }
    }

    public CompiledRule? Evaluate(HttpContext ctx)
    {
        var rules = _rules;
        var query = ctx.Request.QueryString.HasValue ? ctx.Request.QueryString.Value! : "";
        var path = ctx.Request.Path.HasValue ? ctx.Request.Path.Value! : "";
        var headers = string.Join(" ", ctx.Request.Headers.Select(h => $"{h.Key}:{h.Value}"));
        foreach (var rule in rules)
        {
            // Body inspection is not done in-process (it would require
            // buffering the request body); skip a body-target rule rather
            // than mis-match it against the query string.
            var hay = rule.Target switch
            {
                "url" => path,
                "headers" => headers,
                "query" or "" => query,
                _ => null,
            };
            if (hay is not null && hay.Length > 0 && rule.Re.IsMatch(hay)) return rule;
        }
        return null;
    }

    public void QueueLog(CompiledRule m, HttpContext ctx)
    {
        var entry = new
        {
            at = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            verdict = new { action = "block", rule = new { id = m.Id }, reason = m.Category },
            request = new
            {
                method = ctx.Request.Method,
                url = ctx.Request.Path + ctx.Request.QueryString.ToString(),
                ip = ctx.Request.Headers.TryGetValue("CF-Connecting-IP", out var ip)
                    ? ip.ToString()
                    : ctx.Connection.RemoteIpAddress?.ToString(),
            },
        };
        List<object>? batch = null;
        lock (_lock)
        {
            _queue.Add(entry);
            if (_queue.Count >= 25)
            {
                batch = new List<object>(_queue);
                _queue.Clear();
            }
        }
        if (batch != null) _ = Task.Run(() => FlushAsync(batch));
    }

    private async Task FlushAsync(List<object> batch)
    {
        try
        {
            var body = new StringContent(JsonSerializer.Serialize(new { logs = batch }), Encoding.UTF8, "application/json");
            await _http.PostAsync($"{_o.ApiUrl.TrimEnd('/')}/attacks/ingest", body);
        }
        catch { /* logs are best-effort */ }
    }
}

public static class JikidaExtensions
{
    public static IApplicationBuilder UseJikida(this IApplicationBuilder app, Action<JikidaOptions> configure)
    {
        var options = new JikidaOptions();
        configure(options);
        options.Token ??= Environment.GetEnvironmentVariable("JIKIDA_TOKEN");
        var client = new JikidaClient(options);

        return app.Use(async (ctx, next) =>
        {
            if (string.IsNullOrEmpty(options.Token)) { await next(); return; }
            try
            {
                var m = client.Evaluate(ctx);
                if (m != null && m.Action == "block")
                {
                    client.QueueLog(m, ctx);
                    ctx.Response.StatusCode = 403;
                    ctx.Response.ContentType = "application/json";
                    await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = "Request blocked by Jikida", rule = m.Id }));
                    return;
                }
            }
            catch { /* fail open */ }
            await next();
        });
    }
}
