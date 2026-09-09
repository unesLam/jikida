<?php

/**
 * Cleanup on plugin delete. Called by WordPress when the user hits Delete
 * (not Deactivate — deactivate is handled inline in the main file).
 */
if (! defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('jikida_api_token');
delete_option('jikida_connected_at');
delete_option('jikida_setup_needed');
delete_option('jikida_policy_cache');
delete_option('jikida_policy_refreshed_at');
delete_option('jikida_attack_log_queue');
delete_option('jikida_plan_label');
delete_option('jikida_verified');
delete_option('jikida_malware_last_run');
delete_option('jikida_malware_findings');
delete_option('jikida_malware_stats');
delete_option('jikida_integrity_baseline');
delete_option('jikida_integrity_baseline_at');
delete_option('jikida_integrity_last_diff');
delete_option('jikida_vuln_last_run');
delete_option('jikida_vuln_findings');
delete_option('jikida_geo_blocklist');
delete_option('jikida_login_max');
delete_option('jikida_login_window');
delete_option('jikida_recaptcha_site_key');
delete_option('jikida_recaptcha_secret_key');
delete_option('jikida_activity_log');
wp_clear_scheduled_hook('jikida_policy_refresh');
