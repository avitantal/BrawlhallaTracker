const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function sliceBetween(start, end) {
  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end, startIdx);
  assert.notEqual(startIdx, -1, `Missing start marker: ${start}`);
  assert.notEqual(endIdx, -1, `Missing end marker: ${end}`);
  return html.slice(startIdx, endIdx);
}

const syncSource = sliceBetween('function ensureSessionDefaults', 'function getPersistedState');
const presenceSource = sliceBetween('function countPresenceClients', 'async function refreshPresenceHeartbeatCount');

const context = {
  console,
  Date,
  Math,
  JSON,
  Object,
  Array,
  Map,
  Set,
  String,
  Number
};
vm.createContext(context);
vm.runInContext(`
var APP_VERSION = '1.07';
var CLIENT_ID = 'test-client';
var EPHEMERAL = false;
var PRESENCE_HEARTBEAT_TTL_MS = 55000;
var SPECIAL_MODE_IDS = ['palestine','hunted','kingslayer','underdog','pussy','pairs','solo'];
var state = {
  fighters: [],
  sessions: [],
  activeSessionId: null,
  archive: [],
  scoring: { 1: 10, 2: 6, 3: 3, 4: 1 },
  meta: { version: 1, appVersion: APP_VERSION, updatedAt: 0, updatedBy: CLIENT_ID }
};
${syncSource}
${presenceSource}
`, context);

function fighter(id, name) {
  return { id, name, emoji: 'x' };
}

function session(id, startTime, gameCount = 0, endTime = null) {
  const fighters = [fighter(1, 'A'), fighter(2, 'B')];
  const games = Array.from({ length: gameCount }, (_, idx) => ({
    id: `${id}-game-${idx + 1}`,
    fighters: [1, 2],
    placements: { 1: 1, 2: 2 },
    firstHitId: 2,
    mode: 'normal',
    knockouts: {},
    timestamp: startTime + idx + 1
  }));
  return {
    id,
    startTime,
    endTime,
    fighters,
    games,
    scores: { 1: gameCount * 10, 2: gameCount * 6 },
    currentGameStarted: false
  };
}

function persisted(overrides) {
  return {
    fighters: [fighter(1, 'A'), fighter(2, 'B')],
    sessions: [],
    activeSessionId: null,
    archive: [],
    scoring: { 1: 10, 2: 6, 3: 3, 4: 1 },
    meta: { version: 1, updatedAt: 1, updatedBy: 'seed' },
    ...overrides
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

{
  const remote = persisted({
    sessions: [session('live-session', 100, 1)],
    activeSessionId: 'live-session',
    archive: [session('old-archive', 10, 3, 30)],
    meta: { version: 1, updatedAt: 100, updatedBy: 'remote' }
  });
  const staleLocal = persisted({
    fighters: [fighter(1, 'A')],
    sessions: [],
    archive: [],
    meta: { version: 1, updatedAt: 999999, updatedBy: 'stale-local' }
  });

  const merged = context.mergePersistedStates(staleLocal, remote, { prefer: 'remote' });
  assert.deepEqual(plain(merged.archive.map(s => s.id)), ['old-archive']);
  assert.deepEqual(plain(merged.sessions.map(s => s.id)), ['live-session']);
  assert.equal(merged.activeSessionId, 'live-session');
  assert.deepEqual(plain(merged.fighters.map(f => f.id)), [1, 2]);
}

{
  const remoteMissingArchive = persisted({
    sessions: [],
    archive: [],
    meta: { version: 1, updatedAt: 100, updatedBy: 'remote' }
  });
  const localWithArchive = persisted({
    archive: [session('locally-preserved-archive', 10, 2, 40)],
    meta: { version: 1, updatedAt: 200, updatedBy: 'local' }
  });

  const merged = context.mergePersistedStates(localWithArchive, remoteMissingArchive, { prefer: 'local' });
  assert.deepEqual(plain(merged.archive.map(s => s.id)), ['locally-preserved-archive']);
}

{
  const active = session('same-id', 10, 1);
  const archived = session('same-id', 10, 2, 50);
  const merged = context.mergePersistedStates(
    persisted({ sessions: [active], activeSessionId: 'same-id' }),
    persisted({ archive: [archived] }),
    { prefer: 'remote' }
  );

  assert.deepEqual(plain(merged.sessions.map(s => s.id)), []);
  assert.deepEqual(plain(merged.archive.map(s => s.id)), ['same-id']);
  assert.equal(merged.archive[0].games.length, 2);
}

{
  const channel = {
    presenceState() {
      return {
        clientA: [{}, {}],
        clientB: [{}]
      };
    }
  };
  assert.equal(context.countPresenceClients(channel), 3);
}

{
  const now = Date.UTC(2026, 4, 21, 12, 0, 0);
  const rows = [
    { data: { mode: 'main' }, updated_at: new Date(now).toISOString() },
    { data: { mode: 'main' }, updated_at: new Date(now - 120000).toISOString() },
    { data: { mode: 'test' }, updated_at: new Date(now).toISOString() },
    { data: {}, updated_at: new Date(now + 4000).toISOString() }
  ];
  assert.equal(context.getActiveHeartbeatCount(rows, now), 2);
}

assert.match(html, /<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">/);
assert.match(html, /const APP_VERSION = '1\.07';/);
assert.match(html, /onclick="toggleArchiveDetail\('\$\{String\(sess\.id\)/);

console.log('sync regression tests passed');
