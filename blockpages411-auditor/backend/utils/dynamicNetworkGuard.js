const { classifyRequestUrl } = require('./urlSafety');

const BLOCKED_RESOURCE_TYPES = new Set(
  String(process.env.DYNAMIC_BLOCK_RESOURCE_TYPES || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
);

async function installDynamicNetworkGuard(page, logs) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const resourceType = request.resourceType();

    if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
      logs.push({ type: 'blocked_request', url: url.slice(0, 1200), resourceType, reason: `Blocked resource type: ${resourceType}` });
      return route.abort('blockedbyclient');
    }

    const decision = await classifyRequestUrl(url);
    if (!decision.allowed) {
      logs.push({ type: 'blocked_request', url: url.slice(0, 1200), resourceType, reason: decision.reason });
      return route.abort('blockedbyclient');
    }

    return route.continue();
  });
}

module.exports = { installDynamicNetworkGuard };
