# Jikida.io Connector for WordPress

Official Jikida.io connector. One-click connect to Jikida.io, managed WAF, upload scan, uptime monitor, brute-force signal, attack log — installed in about 30 seconds.

## Quick install (developers)

```bash
cd /wp-content/plugins/
git clone --depth 1 https://github.com/unesLam/jikida.git tmp
mv tmp/packages/wp-plugin/jikida-connector .
rm -rf tmp
```

Activate from the WP admin. You'll be redirected to the setup wizard automatically.

## What connecting does

1. Opens a popup at `https://app.jikida.io/oauth/wp-connect`.
2. You sign in (or sign up).
3. Jikida.io mints a scoped API key just for this site, adds the site to your account (Free plan), and postMessages the key back to the plugin popup — origin-locked to `app.jikida.io`.
4. The plugin persists the key, pulls the WAF policy in the background, and starts inspecting every request.

No key paste, no config file, no CLI.

## What the plugin does at runtime

| Hook | What runs |
|---|---|
| `init` (priority 1) | Pull cached WAF policy, evaluate rules against URL / query / body / headers. Block / challenge / deceive on match. Fails-open on any error. |
| `wp_handle_upload_prefilter` | Extension blocklist + MIME/magic-byte polyglot detection on every upload. |
| `wp_login_failed` | Queue a signal for the attack log so the dashboard shows brute-force patterns. |
| `shutdown` | Ship queued attack logs to Jikida.io in a fire-and-forget POST (max 50/request). |

Admin dashboard widget shows active rules count + queued events. Full attack log + WAF rule management lives at [app.jikida.io](https://app.jikida.io).

## Files

```
jikida-connector/
├── jikida-connector.php   # Main plugin class
├── uninstall.php            # Options cleanup on delete
├── views/admin-page.php     # Setup + connected admin view
├── assets/css/admin.css
├── assets/js/admin.js       # Popup + postMessage handler
├── readme.txt               # WP plugin repo readme
└── README.md                # This file
```

## Distribution

Ships from the public `unesLam/jikida` monorepo under `packages/wp-plugin/`. WP.org submission uses the same tree with `readme.txt` at the plugin root.

## License

GPLv2 or later.
