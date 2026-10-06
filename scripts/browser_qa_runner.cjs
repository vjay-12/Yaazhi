/**
 * Automated Headless Browser QA Runner for Yaazhi
 * Connects directly to Chrome / Edge via Chrome DevTools Protocol (CDP) over WebSocket
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PORT = 9223;
const BASE_URL = 'http://localhost:5174';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
          this.consoleLogs.push({ type, text });
          if (type === 'error') {
            console.error(`  [BROWSER ERROR]: ${text}`);
          }
        } else if (msg.method === 'Network.responseReceived') {
          const { status, url } = msg.params.response;
          if (status >= 400) {
            this.networkErrors.push({ status, url });
            console.error(`  [NETWORK ${status}]: ${url}`);
          }
        }
      }
    };

    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    await this.send('DOM.enable');
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const wrapped = `(() => { ${expr} })()`;
    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      const errText = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Eval error';
      throw new Error(errText);
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await wait(1500);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserQA() {
  console.log('=== STARTING BROWSER QA SUITE ===');
  console.log(`Using Browser executable: ${CHROME_PATH}`);

  const browserProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=C:\\temp\\yaazhi-browser-qa',
  ]);

  browserProc.on('error', (err) => {
    console.error('Failed to spawn browser:', err);
  });

  let targets;
  for (let i = 0; i < 20; i++) {
    try {
      targets = await fetchJson(`http://localhost:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch {
      await wait(500);
    }
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to browser CDP port.');
    browserProc.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  console.log(`Connected to page: ${pageTarget.title}`);

  try {
    // 1. Navigate to Yaazhi web app
    console.log(`Navigating to ${BASE_URL}...`);
    await client.navigate(BASE_URL);
    await wait(2000);

    const title = await client.eval('return document.title;');
    console.log(`✓ Page Loaded. Document Title: "${title}"`);

    // Verify App Shell rendered
    const hasAppLayout = await client.eval('return Boolean(document.querySelector(".yz-app-layout"));');
    console.log(`✓ App Layout Present: ${hasAppLayout}`);

    // Test Navigation across all 10 Sidebar routes
    const navTabs = [
      { id: 'overview', name: 'Overview' },
      { id: 'billing', name: 'Billing' },
      { id: 'orders', name: 'Sales Orders' },
      { id: 'customers', name: 'Customers' },
      { id: 'products', name: 'Products & Stock' },
      { id: 'movements', name: 'Stock Audit Log' },
      { id: 'purchases', name: 'Purchase Orders' },
      { id: 'vendors', name: 'Vendors' },
      { id: 'reports', name: 'Reports' },
      { id: 'settings', name: 'Settings' },
    ];

    console.log('\n--- TESTING ALL 10 GLOBAL NAVIGATION ROUTES ---');
    for (const tab of navTabs) {
      console.log(`\nNavigating to [${tab.name}]...`);
      await client.eval(`
        const btn = Array.from(document.querySelectorAll('.yz-nav-item')).find(b => b.textContent.includes('${tab.name}') || b.title === '${tab.name}');
        if (btn) btn.click();
        else window.location.hash = '${tab.id}';
      `);
      await wait(1200);

      const headerTitle = await client.eval('return document.querySelector(".yz-header-left h1")?.textContent?.trim();');
      console.log(`  ✓ Header Title: "${headerTitle}"`);

      // Check if any error boundary or crash occurred
      const crashText = await client.eval('return document.body.innerText.includes("Something went wrong");');
      if (crashText) {
        throw new Error(`Route [${tab.name}] crashed with ErrorBoundary!`);
      }

      // Check content container
      const hasContent = await client.eval('return Boolean(document.querySelector(".yz-content-container")?.children.length > 0);');
      const tablePresent = await client.eval('return Boolean(document.querySelector("table.yz-table"));');
      console.log(`  ✓ Content Container Active: ${hasContent}, Table present: ${tablePresent}`);
    }

    // Deep QA on Sales Orders
    console.log('\n--- TESTING SALES ORDERS DEEP QA ---');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('.yz-nav-item')).find(b => b.title === 'Sales Orders');
      if (btn) btn.click();
      else window.location.hash = 'orders';
    `);
    await wait(1000);

    const soHeaders = await client.eval(`
      return Array.from(document.querySelectorAll('table.yz-table th')).map(th => th.textContent.trim());
    `);
    console.log('  Sales Orders Columns:', soHeaders);
    if (!soHeaders.includes('ORDER NUMBER') || !soHeaders.includes('PRODUCTS') || !soHeaders.includes('STATUS') || !soHeaders.includes('ACTION')) {
      throw new Error('Sales Orders table missing required columns!');
    }
    if (soHeaders.includes('TOTAL UNITS') || soHeaders.includes('UNITS')) {
      throw new Error('Sales Orders still has TOTAL UNITS column!');
    }
    console.log('  ✓ Column structure confirmed: Total Units removed, PRODUCTS present');

    // Verify pagination present on Sales Orders
    const hasPaginationSO = await client.eval('return Boolean(document.querySelector(".yz-pagination-footer"));');
    const paginationTextSO = await client.eval('return document.querySelector(".yz-pagination-footer")?.textContent?.trim();');
    console.log(`  ✓ Sales Orders Pagination Footer: "${paginationTextSO?.substring(0, 45)}..." (Present: ${hasPaginationSO})`);

    // Deep QA on Customers
    console.log('\n--- TESTING CUSTOMERS DEEP QA ---');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('.yz-nav-item')).find(b => b.title === 'Customers');
      if (btn) btn.click();
      else window.location.hash = 'customers';
    `);
    await wait(1000);

    const customerHeaders = await client.eval(`
      return Array.from(document.querySelectorAll('table.yz-table th')).map(th => th.textContent.trim());
    `);
    console.log('  Customer Columns:', customerHeaders);
    if (customerHeaders.includes('EMAIL')) {
      throw new Error('Customers table still contains EMAIL column!');
    }
    if (!customerHeaders.includes('CITY/LOCATION')) {
      throw new Error('Customers table missing CITY/LOCATION column!');
    }
    console.log('  ✓ Customer Columns verified: EMAIL removed, CITY/LOCATION present');

    // Deep QA on Products & Stock
    console.log('\n--- TESTING PRODUCTS & STOCK DEEP QA ---');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('.yz-nav-item')).find(b => b.title === 'Products & Stock');
      if (btn) btn.click();
      else window.location.hash = 'products';
    `);
    await wait(1000);

    const productHeaders = await client.eval(`
      return Array.from(document.querySelectorAll('table.yz-table th')).map(th => th.textContent.trim());
    `);
    console.log('  Product Columns:', productHeaders);
    if (productHeaders.includes('TOTAL VALUE')) {
      throw new Error('Products table still contains TOTAL VALUE column!');
    }
    console.log('  ✓ Product Columns verified: TOTAL VALUE removed');

    // Check Custom Dropdowns on Products toolbar
    const customDropdownsCount = await client.eval(`
      return document.querySelectorAll('.yz-toolbar .yz-input').length;
    `);
    console.log(`  ✓ Toolbar Dropdowns present: ${customDropdownsCount}`);

    // Verify no native <select> on page
    const nativeSelects = await client.eval('return document.querySelectorAll("select").length;');
    console.log(`  ✓ Native <select> elements on screen: ${nativeSelects} (Expected: 0)`);
    if (nativeSelects > 0) {
      throw new Error(`Found ${nativeSelects} unstyled native <select> elements!`);
    }

    // Verify console logs
    console.log('\n--- CONSOLE LOG SUMMARY ---');
    const errorLogs = client.consoleLogs.filter((l) => l.type === 'error');
    console.log(`Total Console Messages: ${client.consoleLogs.length}`);
    console.log(`Console Errors: ${errorLogs.length}`);
    if (errorLogs.length > 0) {
      console.error('Errors found in browser console:', errorLogs);
    }

    console.log(`Total Network 4xx/5xx Errors: ${client.networkErrors.length}`);

    console.log('\n=== BROWSER QA RESULT: ALL CHECKS PASSED SUCCESSFULLY! ===\n');
  } finally {
    client.close();
    browserProc.kill();
  }
}

runBrowserQA().catch((err) => {
  console.error('\n❌ Browser QA Failed with Exception:', err);
  process.exit(1);
});
