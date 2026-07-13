import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chromePath = await firstAccessible(chromeCandidates);
if (!chromePath) throw new Error(`Geen headless Chrome gevonden. Gecontroleerd: ${chromeCandidates.join(', ')}`);

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(ROOT, relative);
    if (!file.startsWith(`${ROOT}${path.sep}`)) throw new Error('Ongeldig pad');
    const body = await fs.readFile(file);
    response.writeHead(200, {
      'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'champions-browser-smoke-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-sandbox',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

try {
  const browserUrl = await devtoolsUrl(chrome);
  const cdp = await connectCdp(browserUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await Promise.all([
    cdp.send('Page.enable', {}, sessionId),
    cdp.send('Runtime.enable', {}, sessionId),
    cdp.send('Network.enable', {}, sessionId),
    cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    }, sessionId),
  ]);

  const failedAssets = [];
  cdp.on('Network.responseReceived', ({ response }) => {
    if (response.url.startsWith(origin) && response.status >= 400 && !response.url.endsWith('/favicon.ico')) {
      failedAssets.push({ status: response.status, url: response.url });
    }
  });

  await navigate(cdp, sessionId, `${origin}/`);
  await waitFor(cdp, sessionId, `document.querySelectorAll('.pokemon-card').length === 313`);

  const initial = await evaluate(cdp, sessionId, `({
    cards: document.querySelectorAll('.pokemon-card').length,
    autoLabel: document.querySelector('#randomUltraTeam').getAttribute('aria-label'),
    tabRole: document.querySelector('.view-tabs').getAttribute('role'),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    smallTargets: [...document.querySelectorAll('.add-button, .card-expand-button, .favorites-toggle-button')]
      .slice(0, 12)
      .map((element) => ({ label: element.getAttribute('aria-label') || element.title || element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      .filter(({ width, height }) => width < 44 || height < 44)
  })`);
  assert(initial.cards === 313, `verwacht 313 kaarten, kreeg ${initial.cards}`);
  assert(initial.autoLabel === 'Bouw het best scorende team', `oneerlijk auto-teamlabel: ${initial.autoLabel}`);
  assert(initial.tabRole === 'tablist', `tabsemantiek ontbreekt: ${initial.tabRole}`);
  assert(initial.overflow === false, 'mobiele pagina heeft horizontale overflow');
  assert(initial.smallTargets.length === 0, `te kleine touch targets: ${JSON.stringify(initial.smallTargets)}`);

  await evaluate(cdp, sessionId, `document.querySelector('#favoritesToggle').click()`);
  await waitFor(cdp, sessionId, `document.querySelectorAll('.pokemon-card').length === 0`);
  await evaluate(cdp, sessionId, `document.querySelector('#showAllPokemon').click()`);
  await waitFor(cdp, sessionId, `document.querySelectorAll('.pokemon-card').length === 313`);

  await evaluate(cdp, sessionId, `localStorage.setItem('championsBattleSim', JSON.stringify({ __v: 1, data: {
    opponentTeam: ['Garchomp', 'Starmie'],
    opponentSelection: ['Starmie'],
    opponentMode: 'manual'
  }}))`);
  await reload(cdp, sessionId);
  await waitFor(cdp, sessionId, `document.querySelectorAll('.pokemon-card').length === 313`);
  await evaluate(cdp, sessionId, `(async () => {
    const attempted = new Set();
    for (let index = 0; index < 20 && document.querySelectorAll('.team-slot.filled').length < 3; index += 1) {
      const card = [...document.querySelectorAll('.pokemon-card')]
        .find((entry) => !attempted.has(entry.querySelector('.name')?.textContent));
      const name = card?.querySelector('.name')?.textContent;
      if (!card || !name) break;
      attempted.add(name);
      card.querySelector('.add-button')?.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    document.querySelector('#battleTab').click();
  })()`);
  try {
    await waitFor(cdp, sessionId, `document.querySelectorAll('.battle-team-panel.opponent .battle-roster-card').length === 2`);
  } catch (error) {
    const debug = await evaluate(cdp, sessionId, `({
      stored: localStorage.getItem('championsBattleSim'),
      teamCards: document.querySelectorAll('.team-slot, .workbench-card').length,
      opponentCards: document.querySelectorAll('.battle-team-panel.opponent .battle-roster-card').length,
      battleText: document.querySelector('#battleView')?.textContent?.slice(0, 500),
      activeTab: document.querySelector('[role=tab][aria-selected=true]')?.id
    })`);
    console.error(`Browser-smoke debug: ${JSON.stringify(debug)}`);
    throw error;
  }

  const battle = await evaluate(cdp, sessionId, `({
    opponents: document.querySelectorAll('.battle-team-panel.opponent .battle-roster-card').length,
    header: document.querySelector('.battle-sim-header')?.textContent || '',
    builderHidden: document.querySelector('#builderView').hidden,
    battleHidden: document.querySelector('#battleView').hidden
  })`);
  assert(battle.opponents === 2, `battle-state niet hersteld: ${battle.opponents} opponents`);
  assert(battle.header.includes('Geen volledige battle-engine'), 'battle-disclaimer ontbreekt');
  assert(battle.builderHidden && !battle.battleHidden, 'tabpanel hidden-state klopt niet');

  await new Promise((resolve) => setTimeout(resolve, 250));
  assert(failedAssets.length === 0, `HTTP-fouten tijdens browser-smoke: ${JSON.stringify(failedAssets)}`);
  await cdp.send('Target.closeTarget', { targetId });
  cdp.close();
  console.log('browser smoke passed: mobile UI, filters, tabs, sprites and battle persistence');
} finally {
  const exited = chrome.exitCode == null
    ? new Promise((resolve) => chrome.once('exit', resolve))
    : Promise.resolve();
  chrome.kill('SIGTERM');
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
  server.close();
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

async function firstAccessible(paths) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  return null;
}

function devtoolsUrl(process) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(`Chrome DevTools startte niet: ${stderr.slice(-1000)}`)), 12_000);
    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
    process.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome stopte voortijdig met code ${code}: ${stderr.slice(-1000)}`));
    });
  });
}

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let sequence = 0;
    const pending = new Map();
    const listeners = new Map();
    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener('open', () => resolve({
      send(method, params = {}, sessionId) {
        const id = ++sequence;
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        return new Promise((resolveCall, rejectCall) => pending.set(id, { resolve: resolveCall, reject: rejectCall }));
      },
      on(method, handler) {
        const handlers = listeners.get(method) ?? [];
        handlers.push(handler);
        listeners.set(method, handlers);
      },
      wait(method, sessionId, timeoutMs = 10_000) {
        return new Promise((resolveEvent, rejectEvent) => {
          const timer = setTimeout(() => rejectEvent(new Error(`Timeout op CDP-event ${method}`)), timeoutMs);
          const handler = (params, eventSessionId) => {
            if (sessionId && eventSessionId !== sessionId) return;
            clearTimeout(timer);
            const handlers = listeners.get(method) ?? [];
            listeners.set(method, handlers.filter((entry) => entry !== handler));
            resolveEvent(params);
          };
          const handlers = listeners.get(method) ?? [];
          handlers.push(handler);
          listeners.set(method, handlers);
        });
      },
      close: () => socket.close(),
    }), { once: true });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && pending.has(message.id)) {
        const call = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) call.reject(new Error(message.error.message));
        else call.resolve(message.result ?? {});
        return;
      }
      (listeners.get(message.method) ?? []).slice().forEach((handler) => handler(message.params ?? {}, message.sessionId));
    });
  });
}

async function navigate(cdp, sessionId, url) {
  const loaded = cdp.wait('Page.loadEventFired', sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await loaded;
}

async function reload(cdp, sessionId) {
  const loaded = cdp.wait('Page.loadEventFired', sessionId);
  await cdp.send('Page.reload', { ignoreCache: true }, sessionId);
  await loaded;
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Browser-evaluatie faalde');
  return result.result?.value;
}

async function waitFor(cdp, sessionId, expression, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, sessionId, expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Browserconditie niet bereikt: ${expression}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
