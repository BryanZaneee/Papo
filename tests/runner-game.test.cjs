// Headless check for src/runner-game.js: stubs the DOM + canvas, drives the
// rAF loop by hand and asserts the state machine, collisions, oranges and
// pacing. Run: node tests/runner-game.test.cjs
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm');

var listeners = {}, rafCb = null, now = 0;
function el(id) {
    var e = { id: id, dataset: {}, style: {}, textContent: '', _cls: new Set(),
        classList: { add: function (c) { e._cls.add(c); }, remove: function (c) { e._cls.delete(c); }, toggle: function () {} },
        addEventListener: function (t, fn) { (listeners[id + ':' + t] = listeners[id + ':' + t] || []).push(fn); },
        offsetWidth: 0, closest: function () { return null; } };
    return e;
}
var els = {};
function get(id) { return els[id] || (els[id] = el(id)); }
var ctx = new Proxy({}, { get: function (_, k) { return k === 'createLinearGradient' || k === 'createRadialGradient' ? function () { return { addColorStop: function () {} }; } : function () {}; }, set: function () { return true; } });
var canvas = get('gameCanvas'); canvas.getContext = function () { return ctx; };

var sandbox = {
    window: { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: function () {},
        matchMedia: function () { return { matches: false }; }, scrollTo: function () {} },
    document: { readyState: 'complete', getElementById: get, querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: function (t, fn) { (listeners['doc:' + t] = listeners['doc:' + t] || []).push(fn); }, body: { classList: { remove: function () {} } } },
    navigator: { maxTouchPoints: 0 }, location: { search: '?theme=night' }, URLSearchParams: URLSearchParams,
    performance: { now: function () { return now; } }, requestAnimationFrame: function (cb) { rafCb = cb; },
    setTimeout: function (fn) { fn(); }, Image: function () {}, Math: Math, Date: Date, console: console,
};
sandbox.matchMedia = sandbox.window.matchMedia;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/../src/runner-game.js', 'utf8'), sandbox);

var overlay = get('gameOverlay');
function key(code) { listeners['doc:keydown'].forEach(function (f) { f({ code: code, preventDefault: function () {} }); }); }
function click(id) { listeners[id + ':click'].forEach(function (f) { f({ stopPropagation: function () {} }); }); }
function run(seconds) { var end = now + seconds * 1000; while (now < end) { now += 1000 / 60; var cb = rafCb; rafCb = null; cb(now); } }
function runUntil(state, max) { var t0 = now; while (overlay.dataset.state !== state && now - t0 < max * 1000) run(1 / 60); return (now - t0) / 1000; }

// Math.random = 0 → rows alternate lanes 0/1, oranges land in lanes 1/2. Lane 2 is always safe.
Math.random = function () { return 0; };
assert.strictEqual(overlay.dataset.theme, 'night');
assert.strictEqual(overlay.dataset.state, 'title');

// 1. Standing still in lane 1 → crash
key('Space'); assert.strictEqual(overlay.dataset.state, 'playing');
var t = runUntil('crashed', 30);
assert.strictEqual(overlay.dataset.state, 'crashed', 'no crash while standing in an obstacle lane');
assert(t < 5, 'first obstacle should arrive within a few seconds, took ' + t);

// 2. Retry, move to lane 2 → clean run finishes in 8–15 s with oranges collected
click('gameRetry'); assert.strictEqual(overlay.dataset.state, 'playing');
key('ArrowRight');
t = runUntil('finished', 30);
assert.strictEqual(overlay.dataset.state, 'finished', 'lane 2 run never finished');
assert(t >= 8 && t <= 15, 'clean run should take 8–15 s, took ' + t.toFixed(1));
var score = +get('gameScore').textContent;
assert(score > 0, 'no oranges collected');
assert(/oranges? collected/.test(get('gameFinishStat').textContent));

// 3. Keep running → endless, no finish line, still alive after 20 s
click('gameKeepRunning'); assert.strictEqual(overlay.dataset.state, 'playing');
run(20);
assert.strictEqual(overlay.dataset.state, 'playing', 'endless run crashed in the safe lane');
assert(/ENDLESS/.test(get('gameProgressLabel').textContent));
assert(+get('gameScore').textContent > score, 'oranges stopped counting in endless');

// 4. Skip fades the overlay and stops the loop
click('gameSkip');
assert.strictEqual(overlay.style.opacity, '0');
now += 100; if (rafCb) { var last = rafCb; rafCb = null; last(now); }
assert.strictEqual(rafCb, null, 'rAF loop kept running after enterSite');

console.log('ok — clean run ' + t.toFixed(1) + 's, ' + score + ' oranges');
