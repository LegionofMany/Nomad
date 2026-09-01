const axios = require('axios');
const { normalizeUrl, assertPublicUrl } = require('./urlSafety');

const USER_AGENT = process.env.AUDITOR_USER_AGENT || 'Blockpages411-Auditor/4.0';
const DEFAULT_TIMEOUT = Number(process.env.AUDITOR_HTTP_TIMEOUT_MS || 12000);

function toAbsoluteRedirect(currentUrl, location) {
  try { return new URL(location, currentUrl).toString(); } catch { return null; }
}

async function fetchTextSafe(inputUrl, options = {}) {
  let currentUrl = normalizeUrl(inputUrl);
  const maxRedirects = options.maxRedirects ?? 3;
  const maxContentLength = options.maxContentLength ?? 2_000_000;
  const redirects = [];

  for (let i = 0; i <= maxRedirects; i += 1) {
    if (process.env.ALLOW_PRIVATE_AUDIT !== 'true') await assertPublicUrl(currentUrl);

    const response = await axios.get(currentUrl, {
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      maxContentLength,
      responseType: 'text',
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: { 'User-Agent': USER_AGENT, Accept: options.accept || 'text/html,application/javascript,text/javascript,*/*;q=0.8' }
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      const nextUrl = toAbsoluteRedirect(currentUrl, location);
      if (!nextUrl) throw new Error(`Invalid redirect location from ${currentUrl}`);
      redirects.push({ from: currentUrl, to: nextUrl, status: response.status });
      currentUrl = nextUrl;
      continue;
    }

    return {
      finalUrl: currentUrl,
      status: response.status,
      headers: response.headers,
      text: String(response.data || ''),
      redirects
    };
  }

  throw new Error(`Too many redirects while fetching ${inputUrl}`);
}

module.exports = { fetchTextSafe, USER_AGENT };
