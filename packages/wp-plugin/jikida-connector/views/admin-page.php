<?php
if (! defined('ABSPATH')) {
    exit;
}

$jikida_connected = (bool) get_option('jikida_api_token');
$jikida_connected_at = get_option('jikida_connected_at');
$jikida_plan_label = (string) get_option('jikida_plan_label', 'Free');
$jikida_verified = get_option('jikida_verified', '1') === '1';
$jikida_rules_count = is_array(get_option('jikida_policy_cache')) ? count(get_option('jikida_policy_cache')['rules'] ?? []) : 0;
$jikida_queue_count = is_array(get_option('jikida_attack_log_queue')) ? count(get_option('jikida_attack_log_queue')) : 0;
$jikida_refreshed_at = (int) get_option('jikida_policy_refreshed_at', 0);
$jikida_refreshed_ago = $jikida_refreshed_at ? human_time_diff($jikida_refreshed_at, time()).' ago' : '—';
$jikida_manage_url = (string) get_option('jikida_manage_url', '');
if ($jikida_manage_url === '' || strpos($jikida_manage_url, JIKIDA_APP_URL.'/sites/') !== 0) {
    $jikida_manage_url = JIKIDA_APP_URL.'/sites';
}

// Local tool state (used for the section bodies + the tab issue-count badges).
$jikida_malware_stats = get_option('jikida_malware_stats');
$jikida_integrity_baseline_at = (int) get_option('jikida_integrity_baseline_at', 0);
$jikida_integrity_last_diff = get_option('jikida_integrity_last_diff');
$jikida_core_result = get_option('jikida_core_checksum_result');
$jikida_exposed_result = get_option('jikida_exposed_files_result');
$jikida_geo_blocklist = (array) get_option('jikida_geo_blocklist', []);
$jikida_login_max = (int) get_option('jikida_login_max', 5);
$jikida_login_window = (int) get_option('jikida_login_window', 900);
$jikida_recaptcha_site = (string) get_option('jikida_recaptcha_site_key', '');
$jikida_recaptcha_secret = (string) get_option('jikida_recaptcha_secret_key', '');
$jikida_activity = array_slice((array) get_option('jikida_activity_log', []), 0, 10);
$jikida_rl_rules = class_exists('Jikida_Rate_Limit') ? Jikida_Rate_Limit::get_rules() : [];
$jikida_rl_free = defined('JIKIDA_RL_FREE_RULES') ? JIKIDA_RL_FREE_RULES : 3;

// Count of outstanding findings, used to badge the "Scans" tab so the owner
// sees at a glance whether anything needs attention.
$jikida_scan_issues = 0;
if (is_array($jikida_malware_stats)) {
    $jikida_scan_issues += (int) ($jikida_malware_stats['files_flagged'] ?? 0);
}
if (is_array($jikida_core_result) && isset($jikida_core_result['counts'])) {
    $jikida_scan_issues += (int) ($jikida_core_result['counts']['modified'] ?? 0) + (int) ($jikida_core_result['counts']['missing'] ?? 0);
}
if (is_array($jikida_exposed_result) && isset($jikida_exposed_result['exposed'])) {
    $jikida_scan_issues += count((array) $jikida_exposed_result['exposed']);
}

// Resolve the active tab from the URL (?page=jikida&tab=…). Client-side JS
// also restores the last tab from localStorage on a plain reload. Whitelist the
// slug so nothing user-supplied reaches an attribute unescaped.
$jikida_tabs = ['overview', 'firewall', 'scans', 'filechanges', 'ratelimits', 'uptime', 'activity'];
// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only tab selector, no state change
$jikida_active_tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'overview';
if (! in_array($jikida_active_tab, $jikida_tabs, true)) {
    $jikida_active_tab = 'overview';
}

/**
 * Small helper: build the ?page=jikida&tab=X admin URL for a nav tab.
 */
$jikida_tab_url = static function (string $tab): string {
    return esc_url(admin_url('admin.php?page=jikida&tab='.$tab));
};
?>
<div class="wrap jikida-wrap">
    <div class="jikida-header">
        <div class="jikida-brand">
            <div class="jikida-logo"></div>
            <div>
                <h1 style="margin:0;font-size:22px;">Jikida.io</h1>
                <p style="margin:2px 0 0;color:#6b7280;font-size:13px;"><?php echo esc_html__('Firewall &middot; hardening &middot; malware &amp; core-file scan &middot; login hardening &middot; WAF &middot; uptime', 'jikida-connector'); ?></p>
            </div>
        </div>
        <div class="jikida-status">
            <?php if ($jikida_connected) { ?>
                <span class="jikida-pill jikida-pill-ok">&#9679; <?php echo esc_html__('Connected', 'jikida-connector'); ?></span>
                <span id="jikida-verified-chip" class="jikida-pill <?php echo $jikida_verified ? 'jikida-pill-ok' : 'jikida-pill-warn'; ?>" style="margin-left:6px;">
                    <?php echo $jikida_verified ? '&#9679; '.esc_html__('Verified', 'jikida-connector') : '&#9680; '.esc_html__('Not verified', 'jikida-connector'); ?>
                </span>
                <span id="jikida-plan-badge" class="jikida-pill jikida-pill-ok" style="margin-left:6px;"><?php echo esc_html($jikida_plan_label); ?></span>
            <?php } else { ?>
                <span class="jikida-pill jikida-pill-warn">&#9680; <?php echo esc_html__('Not connected', 'jikida-connector'); ?></span>
            <?php } ?>
        </div>
    </div>

    <?php if (isset($_GET['connected']) && $_GET['connected'] === '1') { // phpcs:ignore WordPress.Security.NonceVerification.Recommended?>
        <div class="notice notice-success is-dismissible"><p><strong><?php echo esc_html__('Connected!', 'jikida-connector'); ?></strong> <?php echo esc_html__('Your site is now protected. WAF policy is being pulled in the background.', 'jikida-connector'); ?></p></div>
    <?php } ?>

    <h2 class="nav-tab-wrapper jikida-tabs" id="jikida-tabs">
        <a href="<?php echo $jikida_tab_url('overview'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'overview' ? ' nav-tab-active' : ''; ?>" data-tab="overview"><?php echo esc_html__('Overview', 'jikida-connector'); ?></a>
        <a href="<?php echo $jikida_tab_url('firewall'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'firewall' ? ' nav-tab-active' : ''; ?>" data-tab="firewall"><?php echo esc_html__('Firewall &amp; hardening', 'jikida-connector'); ?></a>
        <a href="<?php echo $jikida_tab_url('scans'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'scans' ? ' nav-tab-active' : ''; ?>" data-tab="scans"><?php echo esc_html__('Scans', 'jikida-connector'); ?><?php if ($jikida_scan_issues > 0) { ?><span class="jikida-tab-badge"><?php echo esc_html($jikida_scan_issues); ?></span><?php } ?></a>
        <a href="<?php echo $jikida_tab_url('filechanges'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'filechanges' ? ' nav-tab-active' : ''; ?>" data-tab="filechanges"><?php echo esc_html__('File changes', 'jikida-connector'); ?></a>
        <a href="<?php echo $jikida_tab_url('ratelimits'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'ratelimits' ? ' nav-tab-active' : ''; ?>" data-tab="ratelimits"><?php echo esc_html__('Rate limits', 'jikida-connector'); ?></a>
        <a href="<?php echo $jikida_tab_url('uptime'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'uptime' ? ' nav-tab-active' : ''; ?>" data-tab="uptime"><?php echo esc_html__('Uptime &amp; alerts', 'jikida-connector'); ?></a>
        <a href="<?php echo $jikida_tab_url('activity'); ?>" class="nav-tab jikida-tab<?php echo $jikida_active_tab === 'activity' ? ' nav-tab-active' : ''; ?>" data-tab="activity"><?php echo esc_html__('Activity log', 'jikida-connector'); ?></a>
    </h2>

    <?php /* ============================ OVERVIEW ============================ */ ?>
    <div class="jikida-panel" data-panel="overview"<?php echo $jikida_active_tab === 'overview' ? '' : ' style="display:none;"'; ?>>
        <?php if (! $jikida_connected) { ?>
            <div class="jikida-card">
                <h2><?php echo esc_html__('Optional: connect the Jikida.io service', 'jikida-connector'); ?></h2>
                <p><?php echo esc_html__('Every security tool in the tabs above works locally, no account needed. Connecting adds the cloud service on top: the managed WAF policy, uptime monitoring from our edge, upload scanning, the attack-log dashboard and CVE lookups.', 'jikida-connector'); ?></p>
                <p>
                    <button id="jikida-connect" class="button button-primary button-hero"><?php echo esc_html__('Connect to Jikida.io', 'jikida-connector'); ?></button>
                    <a href="https://jikida.io" target="_blank" class="button"><?php echo esc_html__("What's Jikida.io?", 'jikida-connector'); ?></a>
                </p>
                <p class="description"><?php echo esc_html__('The connector talks to the external Jikida.io service', 'jikida-connector'); ?> (<a href="https://jikida.io/tos" target="_blank"><?php echo esc_html__('Terms', 'jikida-connector'); ?></a> &middot; <a href="https://jikida.io/privacy" target="_blank"><?php echo esc_html__('Privacy', 'jikida-connector'); ?></a>).</p>
            </div>
        <?php } else { ?>
            <div class="jikida-grid">
                <div class="jikida-card">
                    <p class="jikida-eyebrow"><?php echo esc_html__('Live plan', 'jikida-connector'); ?></p>
                    <p class="jikida-metric-small" id="jikida-plan-name"><?php echo esc_html($jikida_plan_label); ?></p>
                    <p class="description">
                        <a id="jikida-upgrade-link" href="<?php echo esc_url($jikida_manage_url.'/billing/checkout'); ?>" target="_blank"><?php echo esc_html__('Upgrade', 'jikida-connector'); ?> &rarr;</a>
                    </p>
                </div>
                <div class="jikida-card">
                    <p class="jikida-eyebrow"><?php echo esc_html__('WAF rules active', 'jikida-connector'); ?></p>
                    <p class="jikida-metric"><?php echo esc_html($jikida_rules_count); ?></p>
                    <p class="description"><?php
                        /* translators: %s = relative time */
                        echo esc_html(sprintf(__('refreshed %s', 'jikida-connector'), $jikida_refreshed_ago)); ?></p>
                </div>
                <div class="jikida-card">
                    <p class="jikida-eyebrow"><?php echo esc_html__('Queued events', 'jikida-connector'); ?></p>
                    <p class="jikida-metric"><?php echo esc_html($jikida_queue_count); ?></p>
                    <p class="description"><?php echo esc_html__('shipping in the next request', 'jikida-connector'); ?></p>
                </div>
                <div class="jikida-card">
                    <p class="jikida-eyebrow"><?php echo esc_html__('Connected', 'jikida-connector'); ?></p>
                    <p class="jikida-metric-small"><?php echo esc_html($jikida_connected_at ? human_time_diff(strtotime($jikida_connected_at), time()).' ago' : '—'); ?></p>
                    <p class="description"><?php echo esc_html__('key scoped to this site', 'jikida-connector'); ?></p>
                </div>
            </div>
        <?php } ?>

        <?php // Vulnerability scan (service-backed CVE lookups) lives on Overview.?>
        <div class="jikida-card">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div>
                    <h3 style="margin:0;"><?php echo esc_html__('Vulnerability scan', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; Jikida.io service</span></h3>
                    <p class="description" style="margin:4px 0 0;"><?php echo esc_html__('Enumerates installed plugins and themes with versions and checks them against known CVEs via the external Jikida.io service', 'jikida-connector'); ?> (<a href="https://jikida.io/tos" target="_blank"><?php echo esc_html__('Terms', 'jikida-connector'); ?></a> &middot; <a href="https://jikida.io/privacy" target="_blank"><?php echo esc_html__('Privacy', 'jikida-connector'); ?></a>).</p>
                </div>
                <?php if ($jikida_connected) { ?>
                    <button id="jikida-vuln-scan" class="button button-primary"><?php echo esc_html__('Scan now', 'jikida-connector'); ?></button>
                <?php } else { ?>
                    <button type="button" class="button button-primary jikida-connect-alt"><?php echo esc_html__('Connect to run', 'jikida-connector'); ?></button>
                <?php } ?>
            </div>
            <div id="jikida-vuln-result"></div>
        </div>

        <?php if ($jikida_connected) { ?>
            <div class="jikida-card">
                <h3><?php echo esc_html__('Manage this site', 'jikida-connector'); ?></h3>
                <p><?php echo esc_html__('The cloud side (attack log, WAF rules, alerts, monitors, plan) is managed from your Jikida.io dashboard.', 'jikida-connector'); ?></p>
                <p>
                    <a class="button button-primary" href="<?php echo esc_url($jikida_manage_url); ?>" target="_blank"><?php echo esc_html__('Open Jikida.io dashboard', 'jikida-connector'); ?></a>
                    <a class="button" href="<?php echo esc_url(JIKIDA_APP_URL.'/developer'); ?>" target="_blank"><?php echo esc_html__('Manage API keys', 'jikida-connector'); ?></a>
                    <button id="jikida-disconnect" class="button-link" style="color:#b32d2e;margin-left:12px;"><?php echo esc_html__('Disconnect this site', 'jikida-connector'); ?></button>
                </p>
            </div>
        <?php } ?>
    </div>

    <?php /* ======================= FIREWALL & HARDENING ===================== */ ?>
    <div class="jikida-panel" data-panel="firewall"<?php echo $jikida_active_tab === 'firewall' ? '' : ' style="display:none;"'; ?>>
        <?php
        $jikida_hardening = class_exists('Jikida_Hardening') ? Jikida_Hardening::settings() : [];
$jikida_toggles = [
    'block_bad_bots' => [__('Block bad bots &amp; scanners', 'jikida-connector'), __('Rejects sqlmap, nikto, wpscan, nuclei and other known scanner user-agents.', 'jikida-connector')],
    'block_exploit_patterns' => [__('Block exploit request patterns', 'jikida-connector'), __('Blocks path traversal, LFI/RFI wrappers, code-in-querystring, wp-config &amp; dotfile probes.', 'jikida-connector')],
    'block_user_enum' => [__('Block username enumeration', 'jikida-connector'), __('Stops ?author=N scans and the anonymous REST /users endpoint from leaking usernames.', 'jikida-connector')],
    'security_headers' => [__('Security response headers', 'jikida-connector'), __('Adds X-Frame-Options, X-Content-Type-Options and Referrer-Policy to every page.', 'jikida-connector')],
    'hsts' => [__('Strict-Transport-Security (HSTS)', 'jikida-connector'), __('Forces HTTPS for a year. Only enable once your whole site is on HTTPS.', 'jikida-connector')],
    'remove_version' => [__('Hide WordPress version', 'jikida-connector'), __('Removes the generator meta tag that advertises your exact WP version.', 'jikida-connector')],
    'disable_file_edit' => [__('Disable theme/plugin file editor', 'jikida-connector'), __('Sets DISALLOW_FILE_EDIT so a compromised admin can\'t edit code from wp-admin.', 'jikida-connector')],
    'disable_xmlrpc' => [__('Disable XML-RPC', 'jikida-connector'), __('Turns off xmlrpc.php entirely (blocks pingback DDoS &amp; brute-force amplification).', 'jikida-connector')],
    'comment_hardening' => [__('Comment / pingback hardening', 'jikida-connector'), __('Drops pingback methods and the X-Pingback header.', 'jikida-connector')],
];
?>
        <div class="jikida-card">
            <h3 style="margin-top:0;"><?php echo esc_html__('Firewall &amp; hardening', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; <?php echo esc_html__('runs locally, free', 'jikida-connector'); ?></span></h3>
            <p class="description" style="margin:4px 0 14px;"><?php echo esc_html__('Cheap, self-contained WordPress protections. Everything here runs in the plugin, no account needed.', 'jikida-connector'); ?></p>
            <div class="jikida-toggle-grid">
                <?php foreach ($jikida_toggles as $jikida_key => $jikida_meta) { ?>
                    <label class="jikida-toggle">
                        <input type="checkbox" class="jikida-harden-cb" data-key="<?php echo esc_attr($jikida_key); ?>" <?php echo ! empty($jikida_hardening[$jikida_key]) ? 'checked' : ''; ?>>
                        <span>
                            <strong><?php echo wp_kses($jikida_meta[0], ['br' => []]); ?></strong>
                            <span class="description" style="display:block; margin-top:2px;"><?php echo wp_kses($jikida_meta[1], ['br' => []]); ?></span>
                        </span>
                    </label>
                <?php } ?>
            </div>
            <p style="margin-top:14px;">
                <button id="jikida-hardening-save" class="button button-primary"><?php echo esc_html__('Save hardening settings', 'jikida-connector'); ?></button>
                <span id="jikida-hardening-status" style="font-size:12px; color:#525252; margin-left:10px;"></span>
            </p>
        </div>

        <div class="jikida-card">
            <div>
                <h3 style="margin:0;"><?php echo esc_html__('Geo-block', 'jikida-connector'); ?></h3>
                <p class="description" style="margin:4px 0 12px;"><?php echo esc_html__('Reject requests from selected countries (ISO 3166-1 alpha-2, comma-separated). Works locally for everyone.', 'jikida-connector'); ?></p>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input id="jikida-geo-input" type="text" placeholder="<?php echo esc_attr__('e.g. RU, KP, IR', 'jikida-connector'); ?>" value="<?php echo esc_attr(implode(', ', $jikida_geo_blocklist)); ?>" style="min-width:260px; padding:8px 12px; font-family:Consolas, Monaco, monospace;">
                <button id="jikida-geo-save" class="button button-primary"><?php echo esc_html__('Save blocklist', 'jikida-connector'); ?></button>
                <span id="jikida-geo-status" style="font-size:12px; color:#525252;"></span>
            </div>
        </div>
    </div>

    <?php /* ============================== SCANS ============================= */ ?>
    <div class="jikida-panel" data-panel="scans"<?php echo $jikida_active_tab === 'scans' ? '' : ' style="display:none;"'; ?>>
        <div class="jikida-card">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div>
                    <h3 style="margin:0;"><?php echo esc_html__('Malware scan', 'jikida-connector'); ?></h3>
                    <p class="description" style="margin:4px 0 0;">
                        <?php if ($jikida_malware_stats) { ?>
                            <?php
                                /* translators: %1$s = relative time, %2$d = files inspected, %3$d = files flagged */
                                echo esc_html(sprintf(__('Last scan: %1$s ago', 'jikida-connector'), human_time_diff((int) $jikida_malware_stats['ran_at'], time()))); ?> &middot; <?php echo (int) $jikida_malware_stats['files_seen']; ?> <?php echo esc_html__('files inspected', 'jikida-connector'); ?> &middot; <strong><?php echo (int) $jikida_malware_stats['files_flagged']; ?> <?php echo esc_html__('flagged', 'jikida-connector'); ?></strong>
                        <?php } else { ?>
                            <?php echo esc_html__('Not run yet. Click Scan to run a local malware sweep.', 'jikida-connector'); ?>
                        <?php } ?>
                    </p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button id="jikida-bgscan" class="button button-primary"><?php echo esc_html__('Run full scan', 'jikida-connector'); ?></button>
                    <button id="jikida-malware-scan" class="button"><?php echo esc_html__('Quick sweep', 'jikida-connector'); ?></button>
                </div>
            </div>
            <?php /* Background-scan progress — runs on WP-Cron so the page never hangs. */ ?>
            <div id="jikida-bgscan-wrap" style="display:none;margin-top:14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">
                    <span id="jikida-bgscan-phase" style="font-size:12.5px;color:#374151;"></span>
                    <span id="jikida-bgscan-pct" style="font-size:12px;color:#6b7280;font-variant-numeric:tabular-nums;">0%</span>
                </div>
                <div style="height:8px;background:#eef0f2;border-radius:999px;overflow:hidden;">
                    <div id="jikida-bgscan-bar" style="height:100%;width:0;background:#1FA855;border-radius:999px;transition:width .4s ease;"></div>
                </div>
                <p style="font-size:11.5px;color:#9ca3af;margin:6px 0 0;"><?php echo esc_html__('Runs in the background — you can leave this page; we\'ll keep scanning and update the findings when done.', 'jikida-connector'); ?></p>
            </div>
            <div id="jikida-malware-findings"></div>
        </div>

        <div class="jikida-card">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div>
                    <h3 style="margin:0;"><?php echo esc_html__('File integrity', 'jikida-connector'); ?></h3>
                    <p class="description" style="margin:4px 0 0;">
                        <?php if ($jikida_integrity_baseline_at) { ?>
                            <?php
                                /* translators: %s = relative time */
                                echo esc_html(sprintf(__('Baseline: %s ago', 'jikida-connector'), human_time_diff($jikida_integrity_baseline_at, time()))); ?>
                            <?php if (is_array($jikida_integrity_last_diff) && isset($jikida_integrity_last_diff['counts'])) { ?>
                                &middot; <?php echo esc_html__('Last check flagged', 'jikida-connector'); ?>
                                <strong><?php echo (int) $jikida_integrity_last_diff['counts']['added']; ?></strong> <?php echo esc_html__('new', 'jikida-connector'); ?>,
                                <strong><?php echo (int) $jikida_integrity_last_diff['counts']['changed']; ?></strong> <?php echo esc_html__('changed', 'jikida-connector'); ?>,
                                <strong><?php echo (int) $jikida_integrity_last_diff['counts']['removed']; ?></strong> <?php echo esc_html__('removed', 'jikida-connector'); ?>.
                            <?php } ?>
                        <?php } else { ?>
                            <?php echo esc_html__('No baseline taken yet. Take one after a clean install / update.', 'jikida-connector'); ?>
                        <?php } ?>
                    </p>
                </div>
                <div>
                    <button id="jikida-integrity-baseline" class="button"><?php echo esc_html__('Take baseline', 'jikida-connector'); ?></button>
                    <button id="jikida-integrity-diff" class="button button-primary" <?php echo $jikida_integrity_baseline_at ? '' : 'disabled'; ?>><?php echo esc_html__('Check for changes', 'jikida-connector'); ?></button>
                </div>
            </div>
            <div id="jikida-integrity-result"></div>
        </div>

        <div class="jikida-card">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div>
                    <h3 style="margin:0;"><?php echo esc_html__('Core file &amp; exposure check', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; <?php echo esc_html__('free', 'jikida-connector'); ?></span></h3>
                    <p class="description" style="margin:4px 0 0;">
                        Verifies WordPress core files against the official WordPress.org checksums, and probes for publicly-reachable secrets (.env, .git, config backups, DB dumps).
                        <?php if (is_array($jikida_core_result) && isset($jikida_core_result['counts'])) { ?>
                            <br>Last core check: <strong><?php echo (int) $jikida_core_result['counts']['modified']; ?></strong> modified, <strong><?php echo (int) $jikida_core_result['counts']['missing']; ?></strong> missing.
                        <?php } ?>
                        <?php if (is_array($jikida_exposed_result) && isset($jikida_exposed_result['exposed'])) { ?>
                            <br>Last exposure check: <strong><?php echo count((array) $jikida_exposed_result['exposed']); ?></strong> exposed.
                        <?php } ?>
                    </p>
                </div>
                <div>
                    <button id="jikida-core-checksum" class="button button-primary"><?php echo esc_html__('Verify core files', 'jikida-connector'); ?></button>
                    <button id="jikida-exposed-files" class="button"><?php echo esc_html__('Check exposed files', 'jikida-connector'); ?></button>
                </div>
            </div>
            <div id="jikida-core-result"></div>
        </div>
    </div>

    <?php /* =========================== FILE CHANGES ========================= */ ?>
    <div class="jikida-panel" data-panel="filechanges"<?php echo $jikida_active_tab === 'filechanges' ? '' : ' style="display:none;"'; ?>>
        <?php
            $jikida_bl_at = (int) get_option('jikida_integrity_baseline_at', 0);
            $jikida_last_diff = (array) get_option('jikida_integrity_last_diff', []);
            $jikida_diff_counts = isset($jikida_last_diff['counts']) ? $jikida_last_diff['counts'] : ['added' => 0, 'changed' => 0, 'removed' => 0];
        ?>
        <div class="jikida-card">
            <h3 style="margin-top:0;"><?php echo esc_html__('File-change detection', 'jikida-connector'); ?></h3>
            <p style="color:#6b7280;font-size:13px;margin-top:2px;">
                <?php echo esc_html__('Take a trusted baseline right after a clean install or update. Jikida then flags any PHP/JS file that was added, changed, or removed since — the classic sign of an injected backdoor or a hacked file.', 'jikida-connector'); ?>
            </p>

            <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;">
                <button id="jikida-fi-baseline" class="button"><?php echo esc_html__('Take / refresh baseline', 'jikida-connector'); ?></button>
                <button id="jikida-fi-diff" class="button button-primary"<?php echo $jikida_bl_at ? '' : ' disabled'; ?>><?php echo esc_html__('Check for changes now', 'jikida-connector'); ?></button>
            </div>
            <p style="font-size:12px;color:#9ca3af;margin:0;">
                <?php if ($jikida_bl_at) { ?>
                    <?php printf(esc_html__('Baseline taken %s ago. Newly-modified files are re-checked automatically every week.', 'jikida-connector'), esc_html(human_time_diff($jikida_bl_at))); ?>
                <?php } else { ?>
                    <?php echo esc_html__('No baseline yet — take one to start watching for unexpected file changes.', 'jikida-connector'); ?>
                <?php } ?>
            </p>

            <div id="jikida-fi-summary" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <span class="jikida-pill"><?php echo esc_html__('Added', 'jikida-connector'); ?>: <b id="jikida-fi-added"><?php echo (int) $jikida_diff_counts['added']; ?></b></span>
                <span class="jikida-pill"><?php echo esc_html__('Changed', 'jikida-connector'); ?>: <b id="jikida-fi-changed"><?php echo (int) $jikida_diff_counts['changed']; ?></b></span>
                <span class="jikida-pill"><?php echo esc_html__('Removed', 'jikida-connector'); ?>: <b id="jikida-fi-removed"><?php echo (int) $jikida_diff_counts['removed']; ?></b></span>
            </div>
            <div id="jikida-fi-list" style="margin-top:12px;"></div>
        </div>
    </div>

    <?php /* =========================== RATE LIMITS ========================== */ ?>
    <div class="jikida-panel" data-panel="ratelimits"<?php echo $jikida_active_tab === 'ratelimits' ? '' : ' style="display:none;"'; ?>>
        <div class="jikida-card">
            <h3 style="margin-top:0;"><?php echo esc_html__('Login rate limiting', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; <?php echo esc_html__('runs locally, free', 'jikida-connector'); ?></span></h3>
            <p class="description" style="margin:4px 0 14px;"><?php echo wp_kses(__('Per-IP brute-force protection on <code>wp-login.php</code>. Too many failed attempts inside the window locks that IP out until it cools down. Fully adjustable and runs entirely in the plugin.', 'jikida-connector'), ['code' => []]); ?></p>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:14px; margin-top:4px;">
                <div>
                    <p class="jikida-eyebrow"><?php echo esc_html__('Max failed attempts', 'jikida-connector'); ?></p>
                    <input id="jikida-login-max" type="number" min="1" max="50" value="<?php echo esc_attr($jikida_login_max); ?>" style="width:120px; padding:6px 10px;">
                </div>
                <div>
                    <p class="jikida-eyebrow"><?php echo esc_html__('Window (seconds)', 'jikida-connector'); ?></p>
                    <input id="jikida-login-window" type="number" min="60" max="86400" value="<?php echo esc_attr($jikida_login_window); ?>" style="width:120px; padding:6px 10px;">
                </div>
                <div>
                    <p class="jikida-eyebrow"><?php echo esc_html__('reCAPTCHA v3 site key', 'jikida-connector'); ?> <span style="color:#a3a3a3;"><?php echo esc_html__('(optional)', 'jikida-connector'); ?></span></p>
                    <input id="jikida-recaptcha-site" type="text" value="<?php echo esc_attr($jikida_recaptcha_site); ?>" placeholder="6L…" style="width:100%; padding:6px 10px; font-family:Consolas, Monaco, monospace; font-size:11.5px;">
                </div>
                <div>
                    <p class="jikida-eyebrow"><?php echo esc_html__('reCAPTCHA v3 secret key', 'jikida-connector'); ?></p>
                    <input id="jikida-recaptcha-secret" type="password" value="<?php echo esc_attr($jikida_recaptcha_secret); ?>" placeholder="6L…" style="width:100%; padding:6px 10px; font-family:Consolas, Monaco, monospace; font-size:11.5px;">
                </div>
            </div>
            <p style="margin-top:14px;">
                <button id="jikida-login-save" class="button button-primary"><?php echo esc_html__('Save rate-limit settings', 'jikida-connector'); ?></button>
                <span id="jikida-login-status" style="font-size:12px; color:#525252; margin-left:10px;"></span>
            </p>
        </div>

        <?php /* ---- Local path rate limiting: slug/pattern rules, runs in the plugin ---- */ ?>
        <div class="jikida-card" id="jikida-rl-card"
             data-connected="<?php echo $jikida_connected ? '1' : '0'; ?>"
             data-free="<?php echo esc_attr($jikida_rl_free); ?>">
            <h3 style="margin-top:0;"><?php echo esc_html__('Path rate limiting', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; <?php echo esc_html__('runs locally, free', 'jikida-connector'); ?></span></h3>
            <p class="description" style="margin:4px 0 14px;"><?php echo wp_kses(__('Throttle any path on your site by client IP. Enter an exact slug like <code>/wp-login.php</code> or a pattern with a trailing <code>*</code> like <code>/wp-json/*</code>, set how many requests to allow per time window, and excess requests get a <code>429 Too Many Requests</code>. It is your WordPress — this runs entirely in the plugin, no account needed.', 'jikida-connector'), ['code' => []]); ?></p>

            <table class="widefat striped" id="jikida-rl-table" style="max-width:760px; margin-bottom:12px;">
                <thead>
                    <tr>
                        <th style="width:44%;"><?php echo esc_html__('Path or pattern', 'jikida-connector'); ?></th>
                        <th style="width:16%;"><?php echo esc_html__('Requests', 'jikida-connector'); ?></th>
                        <th style="width:20%;"><?php echo esc_html__('Per (seconds)', 'jikida-connector'); ?></th>
                        <th style="width:10%;"><?php echo esc_html__('On', 'jikida-connector'); ?></th>
                        <th style="width:10%;"></th>
                    </tr>
                </thead>
                <tbody id="jikida-rl-rows">
                    <!-- rows injected by JS from window.jikidaRlRules -->
                </tbody>
            </table>

            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="button" id="jikida-rl-add"><?php echo esc_html__('+ Add rule', 'jikida-connector'); ?></button>
                <button type="button" class="button button-primary" id="jikida-rl-save"><?php echo esc_html__('Save rules', 'jikida-connector'); ?></button>
                <span id="jikida-rl-status" style="font-size:12px; color:#525252;"></span>
            </div>

            <div id="jikida-rl-upsell" style="display:none; margin-top:14px; padding:12px 14px; border:1px solid #e5e5e5; border-radius:8px; background:#fafafa;">
                <p style="margin:0 0 8px; font-weight:600;"><?php
                    /* translators: %d is the number of free rules. */
                    echo esc_html(sprintf(__('You have used all %d free local rules.', 'jikida-connector'), $jikida_rl_free)); ?></p>
                <p class="description" style="margin:0 0 10px;"><?php echo esc_html__('Connect a free Jikida.io account to add more rules and get the managed edge rate-limiter (blocks abuse before it reaches WordPress) plus the attack log. Rules you already turned on keep working.', 'jikida-connector'); ?></p>
                <button type="button" class="button button-primary jikida-connect-alt"><?php echo esc_html__('Connect free to unlock more', 'jikida-connector'); ?></button>
            </div>

            <script type="text/javascript">
                window.jikidaRlRules = <?php echo wp_json_encode(array_values($jikida_rl_rules)); ?>;
            </script>
        </div>

        <div class="jikida-card">
            <h3 style="margin-top:0;"><?php echo esc_html__('Managed edge rate limits', 'jikida-connector'); ?> <span style="font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#a3a3a3;">&middot; Jikida.io service</span></h3>
            <?php if ($jikida_connected) { ?>
                <p class="description" style="margin:4px 0 0;"><?php echo esc_html__('Per-endpoint, per-IP and per-account velocity limits run on the Jikida.io edge, ahead of WordPress. Configure them, and see what they blocked, from your dashboard.', 'jikida-connector'); ?></p>
                <p style="margin-top:14px;"><a class="button button-primary" href="<?php echo esc_url($jikida_manage_url); ?>" target="_blank"><?php echo esc_html__('Open rate-limit rules', 'jikida-connector'); ?> &rarr;</a></p>
            <?php } else { ?>
                <p class="description" style="margin:4px 0 0;"><?php echo esc_html__('Connect a free Jikida.io account to add per-endpoint, per-IP and per-account velocity limits at the edge, ahead of WordPress. Higher plans raise the limits and custom-rule count.', 'jikida-connector'); ?></p>
                <p style="margin-top:14px;">
                    <button type="button" class="button button-primary jikida-connect-alt"><?php echo esc_html__('Connect to enable', 'jikida-connector'); ?></button>
                    <a class="button" href="https://jikida.io" target="_blank" rel="noopener"><?php echo esc_html__('Learn more', 'jikida-connector'); ?></a>
                </p>
            <?php } ?>
        </div>
    </div>

    <?php /* ========================= UPTIME & ALERTS ======================== */ ?>
    <div class="jikida-panel" data-panel="uptime"<?php echo $jikida_active_tab === 'uptime' ? '' : ' style="display:none;"'; ?>>
        <div class="jikida-card jikida-promo-card">
            <p class="jikida-eyebrow">Jikida.io cloud &middot; <?php echo esc_html__('optional', 'jikida-connector'); ?></p>
            <h3 style="margin:0 0 6px;"><?php echo esc_html__('Know the instant this site is in trouble', 'jikida-connector'); ?></h3>
            <p class="description" style="margin:0 0 4px;"><?php echo esc_html__('Uptime monitoring, SSL and domain-expiry checks, and multi-channel alerts all run on the Jikida.io edge, not in this plugin, so they keep working even if WordPress itself is down.', 'jikida-connector'); ?></p>

            <div class="jikida-promo-item">
                <span class="jikida-promo-ico">&#9201;&#65039;</span>
                <div>
                    <strong><?php echo esc_html__('Uptime monitoring', 'jikida-connector'); ?></strong>
                    <p class="description" style="margin:2px 0 0;"><?php echo esc_html__('Checks from multiple regions; SSL and domain-expiry alerts.', 'jikida-connector'); ?>
                        <a href="https://jikida.io/website-apps-uptime-monitoring" target="_blank" rel="noopener"><?php echo esc_html__('Learn more', 'jikida-connector'); ?> &rarr;</a></p>
                </div>
            </div>
            <div class="jikida-promo-item">
                <span class="jikida-promo-ico">&#128276;</span>
                <div>
                    <strong><?php echo esc_html__('Alerts everywhere', 'jikida-connector'); ?></strong>
                    <p class="description" style="margin:2px 0 0;"><?php echo esc_html__('Slack, Discord, Telegram, email and webhooks the moment something breaks.', 'jikida-connector'); ?></p>
                </div>
            </div>
            <div class="jikida-promo-item">
                <span class="jikida-promo-ico">&#128241;</span>
                <div>
                    <strong><?php echo esc_html__('Jikida Alerts app', 'jikida-connector'); ?></strong>
                    <p class="description" style="margin:2px 0 0;"><?php echo esc_html__('A call-style alarm on your phone for downtime and attacks. It rings even on silent.', 'jikida-connector'); ?>
                        <a href="https://play.google.com/store/apps/details?id=io.jikida.alerts" target="_blank" rel="noopener"><?php echo esc_html__('Get it on Google Play', 'jikida-connector'); ?> &rarr;</a></p>
                </div>
            </div>

            <p style="margin:16px 0 0;">
                <?php if ($jikida_connected) { ?>
                    <a class="button button-primary" href="<?php echo esc_url($jikida_manage_url); ?>" target="_blank" rel="noopener"><?php echo esc_html__('Set up monitoring &amp; alerts', 'jikida-connector'); ?></a>
                <?php } else { ?>
                    <button type="button" class="button button-primary jikida-connect-alt"><?php echo esc_html__('Connect a free account', 'jikida-connector'); ?></button>
                <?php } ?>
                <a class="button" href="https://jikida.io/website-monitor-app" target="_blank" rel="noopener"><?php echo esc_html__('Explore the app', 'jikida-connector'); ?></a>
            </p>
        </div>
    </div>

    <?php /* =========================== ACTIVITY LOG ========================= */ ?>
    <div class="jikida-panel" data-panel="activity"<?php echo $jikida_active_tab === 'activity' ? '' : ' style="display:none;"'; ?>>
        <div class="jikida-card">
            <h3 style="margin-top:0;"><?php echo esc_html__('Recent activity', 'jikida-connector'); ?></h3>
            <?php if (empty($jikida_activity)) { ?>
                <p class="description"><?php echo esc_html__('No admin events yet. Login, plugin activate/deactivate, and role changes show up here.', 'jikida-connector'); ?></p>
            <?php } else { ?>
                <table style="width:100%; margin-top:8px; border-collapse:separate; border-spacing:0 4px;">
                    <thead><tr>
                        <th style="text-align:left; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#737373; padding:0 10px;"><?php echo esc_html__('When', 'jikida-connector'); ?></th>
                        <th style="text-align:left; font-size:10px; padding:0 10px;"><?php echo esc_html__('Actor', 'jikida-connector'); ?></th>
                        <th style="text-align:left; font-size:10px; padding:0 10px;"><?php echo esc_html__('Event', 'jikida-connector'); ?></th>
                    </tr></thead>
                    <tbody>
                        <?php foreach ($jikida_activity as $jikida_ev) { ?>
                            <tr>
                                <td style="padding:6px 10px; font-size:11.5px; color:#737373;"><?php echo esc_html(human_time_diff((int) $jikida_ev['at'], time()).' ago'); ?></td>
                                <td style="padding:6px 10px; font-size:11.5px; font-family:Consolas, Monaco, monospace;"><?php echo esc_html($jikida_ev['actor'] ?? '—'); ?></td>
                                <td style="padding:6px 10px; font-size:12px;"><?php echo esc_html($jikida_ev['summary'] ?? $jikida_ev['kind']); ?></td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
            <?php } ?>
        </div>
    </div>

    <?php
    // The Jikida.io cloud upgrade content (uptime / alerts / mobile app) now
    // lives in the "Uptime & alerts" tab above. The dismissible promo notice
    // registered by Jikida_Promo still renders independently via admin_notices.
?>

    <p class="jikida-footer">
        <a href="https://jikida.io/docs" target="_blank"><?php echo esc_html__('Docs', 'jikida-connector'); ?></a> &middot;
        <a href="https://jikida.io" target="_blank">jikida.io</a> &middot;
        <a href="mailto:info@jikida.io"><?php echo esc_html__('Support', 'jikida-connector'); ?></a> &middot;
        v<?php echo esc_html(JIKIDA_VERSION); ?>
    </p>
</div>
