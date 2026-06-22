const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { USER_AGENT } = require('./safeHttp');
const { installDynamicNetworkGuard } = require('./dynamicNetworkGuard');

const FAKE_WALLETS = [
  { address: '0x1111111111111111111111111111111111111111', balanceHex: '0x16345785d8a0000', chainId: '0x1', label: 'low' },
  { address: '0x2222222222222222222222222222222222222222', balanceHex: '0x8ac7230489e80000', chainId: '0x1', label: 'medium' },
  { address: '0x3333333333333333333333333333333333333333', balanceHex: '0x3635c9adc5dea00000', chainId: '0x1', label: 'high' }
];

const CLICK_KEYWORDS = ['connect', 'claim', 'airdrop', 'reward', 'mint', 'verify', 'swap', 'approve', 'sign', 'stake', 'unlock', 'continue', 'start'];
const DOM_KEYWORDS = ['claim', 'airdrop', 'reward', 'connect wallet', 'approve', 'signature', 'free mint', 'verify wallet', 'eligibility', 'allocation', 'permit', 'seed phrase', 'recovery phrase'];

async function clickSuspiciousElements(page, logs) {
  const clicked = await page.evaluate(async (keywords) => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const elements = [...document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"],div[onclick],span[onclick]')];
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) !== 0;
    };
    const matches = elements.filter((el) => {
      const text = `${el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || ''}`.toLowerCase();
      return visible(el) && keywords.some((k) => text.includes(k));
    }).slice(0, 30);
    const labels = [];
    for (const el of matches) {
      const label = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || el.tagName || '').trim().slice(0, 100);
      labels.push(label || el.tagName);
      try {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        el.click();
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        await sleep(950);
      } catch {}
    }
    return labels;
  }, CLICK_KEYWORDS);
  if (clicked.length) logs.push(...clicked.map((label) => ({ type: 'dom_click', label })));
}

async function captureEvidenceScreenshot(page, auditId, logs) {
  if (process.env.CAPTURE_SCREENSHOTS !== 'true') return null;
  const safeAuditId = String(auditId || `bp411-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const dir = path.resolve(process.env.SCREENSHOT_DIR || path.join(__dirname, '..', 'data', 'screenshots'));
  await fs.promises.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${safeAuditId}.png`);
  await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled', timeout: 10000 });
  logs.push({ type: 'screenshot_captured', path: filePath });
  return { path: filePath, capturedAt: new Date().toISOString() };
}

async function dynamicAnalysis(url, options = {}) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-sync', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--no-sandbox']
  });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    acceptDownloads: false,
    viewport: { width: 1365, height: 900 },
    javaScriptEnabled: true,
    bypassCSP: false
  });
  const page = await context.newPage();
  const logs = [];
  const network = [];

  await installDynamicNetworkGuard(page, logs);

  page.on('console', (msg) => logs.push({ type: 'console', text: msg.text().slice(0, 700) }));
  page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: err.message.slice(0, 700) }));
  page.on('download', (download) => logs.push({ type: 'download_attempt', suggestedFilename: download.suggestedFilename() }));
  page.on('request', (req) => network.push({ type: 'request', method: req.method(), url: req.url().slice(0, 1200), resourceType: req.resourceType(), postData: (req.postData() || '').slice(0, 500) }));
  page.on('requestfailed', (req) => network.push({ type: 'request_failed', method: req.method(), url: req.url().slice(0, 1200), resourceType: req.resourceType(), failure: req.failure()?.errorText || null }));
  page.on('response', (res) => network.push({ type: 'response', status: res.status(), url: res.url().slice(0, 1200) }));

  await page.addInitScript((wallets) => {
    window.__bp411WalletRequests = [];
    window.__bp411RuntimeSignals = [];
    window.__bp411ActiveWallet = wallets[0];

    const recordSignal = (type, payload) => {
      try { window.__bp411RuntimeSignals.push({ type, payload, ts: Date.now() }); } catch {}
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      recordSignal('fetch_call', { url: String(args[0] && args[0].url ? args[0].url : args[0]), options: args[1] || null });
      return originalFetch.apply(window, args);
    };

    window.WebSocket = function blockedWebSocket(url) {
      recordSignal('websocket_blocked', { url: String(url) });
      const target = new EventTarget();
      target.url = String(url);
      target.readyState = 3;
      target.send = (data) => recordSignal('websocket_send_blocked', { url: String(url), data: String(data).slice(0, 500) });
      target.close = () => recordSignal('websocket_close', { url: String(url) });
      setTimeout(() => target.dispatchEvent(new Event('close')), 0);
      return target;
    };
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function patchedOpen(method, requestUrl, ...rest) {
      recordSignal('xhr_open', { method, url: String(requestUrl) });
      return originalOpen.call(this, method, requestUrl, ...rest);
    };

    const fakeSignature = '0x' + '41'.repeat(65);
    const fakeTxHash = '0x' + '42'.repeat(32);
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: wallets[0].address,
      chainId: '0x1',
      request: async (args = {}) => {
        const method = args.method;
        const params = args.params || [];
        window.__bp411WalletRequests.push({ method, params, activeWallet: window.__bp411ActiveWallet, ts: Date.now() });
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [window.__bp411ActiveWallet.address];
        if (method === 'eth_chainId') return '0x1';
        if (method === 'net_version') return '1';
        if (method === 'eth_getBalance') return window.__bp411ActiveWallet.balanceHex;
        if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain' || method === 'wallet_watchAsset') return null;
        if (method === 'personal_sign' || method === 'eth_sign' || String(method).startsWith('eth_signTypedData')) return fakeSignature;
        if (method === 'eth_sendTransaction') return fakeTxHash;
        if (method === 'eth_call') return '0x';
        return '0xBLOCKPAGES411_SIMULATED_RESPONSE';
      },
      on: () => {},
      removeListener: () => {},
      enable: async () => [window.__bp411ActiveWallet.address]
    };
    window.web3 = { currentProvider: window.ethereum };
  }, FAKE_WALLETS);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Number(process.env.DYNAMIC_TIMEOUT_MS || 30000) });
    await page.waitForTimeout(4500);

    for (const wallet of FAKE_WALLETS) {
      logs.push({ type: 'wallet_profile', label: wallet.label, address: wallet.address });
      await page.evaluate((w) => { window.__bp411ActiveWallet = w; window.ethereum.selectedAddress = w.address; }, wallet);
      await clickSuspiciousElements(page, logs);
      await page.waitForTimeout(2500);
    }

    const walletRequests = await page.evaluate(() => window.__bp411WalletRequests || []);
    const runtimeSignals = await page.evaluate(() => window.__bp411RuntimeSignals || []);
    const domSignals = await page.evaluate((keywords) => {
      const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
      const suspiciousInputs = [...document.querySelectorAll('input,textarea')]
        .map((el) => `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase())
        .filter((text) => /seed|recovery|secret|private|mnemonic/.test(text));
      const keywordMatches = keywords.filter((k) => bodyText.includes(k));
      if (suspiciousInputs.length) keywordMatches.push('seed/private-key input field');
      return [...new Set(keywordMatches)];
    }, DOM_KEYWORDS);

    const screenshot = await captureEvidenceScreenshot(page, options.auditId, logs).catch((err) => { logs.push({ type: 'screenshot_error', text: err.message }); return null; });
    await browser.close();
    const blockedRequests = logs.filter((l) => l.type === 'blocked_request');
    return {
      walletRequests,
      runtimeSignals: runtimeSignals.slice(0, 250),
      domSignals,
      logs,
      network: network.slice(0, 650),
      blockedRequests,
      screenshot,
      dynamicSuspicious: walletRequests.length > 0 || domSignals.length > 0 || blockedRequests.length > 0 || runtimeSignals.some((s) => JSON.stringify(s).toLowerCase().includes('airdrop')) || logs.some((l) => JSON.stringify(l).toLowerCase().includes('airdrop'))
    };
  } catch (err) {
    const screenshot = await captureEvidenceScreenshot(page, options.auditId, logs).catch((err) => { logs.push({ type: 'screenshot_error', text: err.message }); return null; });
    await browser.close();
    const blockedRequests = logs.filter((l) => l.type === 'blocked_request');
    return { walletRequests: [], runtimeSignals: [], domSignals: [], logs, network: network.slice(0, 650), blockedRequests, screenshot, dynamicSuspicious: blockedRequests.length > 0, error: err.message };
  }
}

module.exports = { dynamicAnalysis, FAKE_WALLETS };
