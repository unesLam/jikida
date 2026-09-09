// Shared configuration for the Jikida extension.
// Local-first: almost everything runs in the browser. The API is used only for
// deeper server-side verification, account sync, rule updates and AI analysis.

export const JIKIDA = {
  APP: 'https://app.jikida.io',
  MARKETING: 'https://jikida.io',
  API: 'https://app.jikida.io/api',
  MCP: 'https://app.jikida.io/api/mcp',
  DEVELOPER_TOKEN_URL: 'https://app.jikida.io/developer',
  SIGNUP_URL: 'https://app.jikida.io/register',
  PRICING_URL: 'https://jikida.io/pricing',
  ADD_SITE_URL: 'https://app.jikida.io/sites/create',
  RULES_URL: 'https://app.jikida.io/api/extension/rules',
  RULES_TTL_MS: 24 * 60 * 60 * 1000,
};

// Severity ordering — higher = worse. Used for badge counts + sorting.
export const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
export const SEVERITY_COLOR = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#0F62FE',
  info: '#737373',
};

// Auto-scan hard cap. Never an uncontrolled crawler.
export const AUTOSCAN_MAX_DEFAULT = 10;

// Storage keys.
export const KEYS = {
  TOKEN: 'jikida_token',
  ACCOUNT: 'jikida_account', // { email, plan, sites: [...] }
  RULES: 'jikida_rules',
  RULES_AT: 'jikida_rules_at',
  RESULTS: 'jikida_results', // { [tabId or origin]: scanResult }
  SETTINGS: 'jikida_settings',
};

export async function getToken() {
  const o = await chrome.storage.local.get(KEYS.TOKEN);
  return o[KEYS.TOKEN] || null;
}

export async function getAccount() {
  const o = await chrome.storage.local.get(KEYS.ACCOUNT);
  return o[KEYS.ACCOUNT] || null;
}
