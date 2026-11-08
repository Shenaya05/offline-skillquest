// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI ENHANCEMENTS — Ripple effect on buttons
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Timer pulse indicator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const origStartTimer = window.startTimer;
window.startTimer = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('running');
    return origStartTimer ? origStartTimer(id) : null;
};
const origStopTimer = window.stopTimer;
window.stopTimer = function() {
    document.querySelectorAll('.timer').forEach(el => el.classList.remove('running'));
    return origStopTimer ? origStopTimer() : null;
};

// ─── REMAINDER: FULL GAME LOGIC (unchanged except wire wizard canvas rendering) ───

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ♥ HEARTS — 5 lives per level; hearts left on a clear = the score basis
const MAX_HEARTS = 5;
const hearts = { cur: MAX_HEARTS, best: {} };
let heartsHeaderId = null;
let heartsFresh = false;
function heartsStr(n) { n = (n === undefined) ? hearts.cur : n; return '♥'.repeat(n) + '♡'.repeat(MAX_HEARTS - n); }
function paintHearts() {
    const el = heartsHeaderId && document.getElementById(heartsHeaderId);
    if (el) el.textContent = heartsStr();
    const s = document.getElementById('safetyLevelStars');
    if (s) s.textContent = heartsStr();
}
function resetHearts(headerId) { hearts.cur = MAX_HEARTS; heartsHeaderId = headerId; heartsFresh = false; paintHearts(); }
function syncHearts(headerId) { if (heartsFresh) resetHearts(headerId); else { heartsHeaderId = headerId; paintHearts(); } }
function loseHeart() {
    if (hearts.cur > 0) hearts.cur--;
    paintHearts();
    const el = heartsHeaderId && document.getElementById(heartsHeaderId);
    if (el) { el.classList.remove('heart-hit'); void el.offsetWidth; el.classList.add('heart-hit'); }
    return hearts.cur === 0;
}
function keepHearts(game, levelId) { const k = game + ':' + levelId; hearts.best[k] = Math.max(hearts.best[k] || 0, hearts.cur); }
function levelHeartsStr(game, levelId, done) { return heartsStr(done ? (hearts.best[game + ':' + levelId] || 0) : 0); }
function heartsSummary(game, levelIds, completed) {
    const earned = levelIds.reduce((s, id) => s + (completed.has(id) ? (hearts.best[game + ':' + id] || 0) : 0), 0);
    const max = levelIds.length * MAX_HEARTS;
    return { earned, max, pct: max ? Math.round(earned / max * 100) : 0 };
}
function showOutOfHearts(game, overlayId, p, hideScore) {
    if (!transition(game, 'FAIL')) return;
    stopTimer();
    if (state[game] && 'problem' in state[game]) state[game].problem = 0;
    const g = id => document.getElementById(p + id);
    g('FbIcon').textContent = '💔';
    g('FbTitle').textContent = 'Out of Hearts!';
    g('FbTitle').className = 'fb-title red';
    g('FbSub').textContent = 'You lost all ' + MAX_HEARTS + ' hearts. Retry the level!';
    const sc = g('FbScore');
    if (sc) {
        if (hideScore) sc.style.display = 'none';
        else sc.innerHTML = '<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">' + heartsStr() + '</span></div>';
    }
    const nx = g('FbNext'); if (nx) nx.style.display = 'none';
    const rp = g('FbReplay'); if (rp) { rp.style.display = ''; rp.textContent = '↻ RETRY LEVEL'; }
    document.getElementById(overlayId).classList.add('show');
}

const state = {
    symbol: { level: 0, completed: new Set() },
    wire: { level: 0, completed: new Set() },
    fault: { level: 0, completed: new Set() },
    code: { level: 0, completed: new Set() },
    timerInterval: null,
    seconds: 0,
    wireClueUsed: false,
};

// ━━━ FINITE STATE MACHINE (one phase per game) ━━━
// SELECT → INSTRUCTIONS → PLAYING → COMPLETE | GAME_OVER
// Phase changes ONLY through transition(); illegal events are ignored.
const GAME_FSM = {
    SELECT:       { START: 'INSTRUCTIONS' },
    INSTRUCTIONS: { PLAY: 'PLAYING', BACK: 'SELECT' },
    PLAYING:      { PASS: 'COMPLETE', FAIL: 'GAME_OVER', RESTART: 'PLAYING', EXIT: 'SELECT' },
    COMPLETE:     { REPLAY: 'PLAYING', NEXT: 'SELECT', FINISH: 'PROGRESS', EXIT: 'SELECT' },
    GAME_OVER:    { RETRY: 'PLAYING', EXIT: 'SELECT' },
    PROGRESS:     { EXIT: 'SELECT' }
};
['symbol', 'wire', 'fault', 'code'].forEach(g => { state[g].phase = 'SELECT'; });
function transition(game, ev) {
    const next = GAME_FSM[state[game].phase]?.[ev];
    if (!next) return false;
    state[game].phase = next;
    return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMBEDDED MODE — lets SkillQuest load a single module
// straight from its dashboard and receive progress back
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EIM_PARAMS = new URLSearchParams(window.location.search);
const AUTOSTART_GAME = EIM_PARAMS.get('game');
const EMBEDDED = EIM_PARAMS.get('embed') === '1';

function notifyEimProgress(game, levelsArr, earnedXP) {
    try {
        const completed = state[game].completed.size;
        const total = levelsArr.length;
        const hs = heartsSummary(game, levelsArr.map(l => l.id), state[game].completed);
        const pct = hs.pct;
        (window.parent || window).postMessage({
            type: 'EIM_MODULE_PROGRESS',
            game, completed, total, pct,
            earnedXP: earnedXP || 0,
            heartsLeft: hearts.cur, heartsEarned: hs.earned, heartsMax: hs.max,
            moduleComplete: completed >= total
        }, '*');
    } catch (e) { /* no parent listening — standalone mode */ }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMAGE MAPPING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYMBOL_IMAGES = {
    'Battery': '../assets/img/symbols/battery1.png',
    'Cell': '../assets/img/symbols/cell.png',
    'Diode': '../assets/img/symbols/diode.png',
    'Fixed Resistor': '../assets/img/symbols/resistors.png',
    'SPST Switch': '../assets/img/symbols/switched_open.png',
    'Switch close': '../assets/img/symbols/switch_close.png',
    'Lamp': '../assets/img/symbols/lamp.png',
    'Variable Resistor': '../assets/img/symbols/variable_resistor.png',
    'LED': '../assets/img/symbols/led.png',
    'Inductor': '../assets/img/symbols/inductor.png',
    'Three way switch': '../assets/img/symbols/3way.png',
    'Ammeter': '../assets/img/symbols/ammeter.png',
    'Buzzer': '../assets/img/symbols/buzzer.png',
    'Fuse': '../assets/img/symbols/fuse.png',
    'Ground': '../assets/img/symbols/ground.png',
    'Motor': '../assets/img/symbols/motor.png',
    'Single Switch': '../assets/img/symbols/single_switch.png',
    'Thermistor': '../assets/img/symbols/thermistor.png',
    'Voltmeter': '../assets/img/symbols/voltmeter.png',
    'Bell': '../assets/img/symbols/bell.png',
    'Circuit breaker': '../assets/img/symbols/circuit_breaker.png',
    'Conductor Wire': '../assets/img/symbols/conductor_wire__2_.png',
    'Connected Wire': '../assets/img/symbols/connected_wire.png',
    'Push Button': '../assets/img/symbols/push_button.png',
    'Wire not connected': '../assets/img/symbols/wire_not_connected.png'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SVG DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function svg(inner) {
    return `<svg class="symbol-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function p(d, cls) { return `<path d="${d}" class="${cls || ''}" />`; }

function l(x1, y1, x2, y2, cls) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls || ''}" />`; }

function c(cx, cy, r, cls) { return `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls || ''}" />`; }

function r(x, y, w, h, cls) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls || ''}" />`; }

function txt(x, y, text, cls) {
    return `<text x="${x}" y="${y}" class="${cls || 'label-text'}" font-size="14" font-weight="700" fill="#b0c0d0" text-anchor="middle" dominant-baseline="central">${text}</text>`;
}

const SYMBOL_DEFS = {
    'Fixed Resistor': { svg: () => svg(l(10, 40, 20, 40) + p('M20,40 L22,32 L26,48 L30,32 L34,48 L38,32 L42,48 L46,40 L56,40', 'stroke-gold') + l(56, 40, 68, 40)) },
    'Variable Resistor': { svg: () => svg(l(10, 40, 20, 40) + p('M20,40 L22,32 L26,48 L30,32 L34,48 L38,32 L42,48 L46,40 L56,40', 'stroke-gold') + l(56, 40, 68, 40) + l(42, 28, 48, 20, 'stroke-gold thin') + c(48, 20, 3, 'fill-gold')) },
    'Lamp': { svg: () => svg(c(40, 36, 18, 'stroke-gold') + l(26, 22, 54, 50, 'stroke-gold thin') + l(54, 22, 26, 50, 'stroke-gold thin') + l(30, 58, 50, 58) + l(34, 64, 46, 64)) },
    'Single Cell': { svg: () => svg(l(40, 18, 40, 28) + l(34, 28, 46, 28, 'thick') + l(34, 38, 46, 38, 'thick') + l(40, 46, 40, 62) + r(22, 44, 36, 4, 'fill')) },
    'Cell': { svg: () => svg(l(40, 18, 40, 28) + l(34, 28, 46, 28, 'thick') + l(34, 38, 46, 38, 'thick') + l(40, 46, 40, 62) + r(22, 44, 36, 4, 'fill')) },
    'Battery': { svg: () => svg(l(40, 10, 40, 20) + l(32, 20, 48, 20, 'thick') + l(34, 28, 46, 28) + l(30, 36, 50, 36, 'thick') + l(34, 44, 46, 44) + l(32, 52, 48, 52, 'thick') + l(40, 60, 40, 70)) },
    'SPST Switch': { svg: () => svg(l(10, 40, 22, 40) + l(22, 40, 32, 24) + c(32, 24, 4, 'fill-gold') + c(44, 40, 4, 'fill-gold') + l(44, 40, 68, 40)) },
    'Switch close': { svg: () => svg(l(10, 40, 22, 40) + l(22, 40, 32, 28) + c(32, 28, 4, 'fill-gold') + c(44, 40, 4, 'fill-gold') + l(44, 40, 68, 40) + l(32, 28, 32, 18) + r(26, 12, 12, 8, 'fill') + l(26, 28, 38, 28, 'dash-lg')) },
    'Diode': { svg: () => svg(l(10, 40, 22, 40) + p('M22,28 L22,52 L36,40 Z', 'fill') + l(36, 28, 36, 52, 'thick') + l(36, 40, 68, 40)) },
    'LED': { svg: () => svg(l(10, 40, 20, 40) + p('M20,26 L20,54 L34,40 Z', 'fill-gold') + l(34, 26, 34, 54, 'thick') + l(34, 40, 44, 40) + p('M44,32 L44,48 L52,40 Z', 'fill') + l(52, 32, 52, 48, 'thick') + l(52, 40, 68, 40)) },
    'Inductor': { svg: () => svg(l(10, 40, 16, 40) + p('M16,40 C18,26 22,26 24,40 C26,26 30,26 32,40 C34,26 38,26 40,40 C42,26 46,26 48,40 C50,26 54,26 56,40', 'stroke-gold') + l(56, 40, 68, 40)) },
    'Fuse': { svg: () => svg(l(10, 40, 22, 40) + r(22, 26, 24, 28, 'stroke-gold') + p('M28,34 L40,46 M28,46 L40,34', 'stroke-gold') + l(46, 40, 68, 40)) },
    'Voltmeter': { svg: () => svg(c(40, 40, 20, 'stroke-gold') + txt(40, 40, 'V')) },
    'Ammeter': { svg: () => svg(c(40, 40, 20, 'stroke-gold') + txt(40, 40, 'A')) },
    'Ground': { svg: () => svg(l(40, 10, 40, 36) + l(24, 36, 56, 36, 'thick') + l(30, 44, 50, 44, 'thick') + l(36, 52, 44, 52, 'thick')) },
    'Motor': { svg: () => svg(c(40, 40, 20, 'stroke-gold') + p('M24,40 A16,16 0 0,1 56,40 A16,16 0 0,1 24,40', 'stroke-gold') + l(28, 40, 34, 40) + l(46, 40, 52, 40) + l(40, 28, 40, 22) + l(40, 52, 40, 58) + txt(40, 40, 'M', 'label-text')) },
    'Buzzer': { svg: () => svg(r(24, 24, 32, 32, 'stroke-gold') + l(24, 40, 56, 40) + l(40, 24, 40, 56) + p('M28,28 L34,34 L28,40 L34,46 L28,52', 'stroke-gold') + p('M52,28 L46,34 L52,40 L46,46 L52,52', 'stroke-gold') + l(56, 40, 68, 40)) },
    'Thermistor': { svg: () => svg(l(10, 40, 18, 40) + r(18, 28, 28, 24, 'stroke-gold') + p('M22,34 L26,40 L22,46 L26,52', 'stroke-gold') + l(46, 40, 68, 40)) },
    'Bell': { svg: () => svg(p('M40,16 Q32,16 32,24 L32,32 Q32,40 24,40', 'stroke-gold') + p('M40,16 Q48,16 48,24 L48,32 Q48,40 56,40', 'stroke-gold') + l(24, 40, 56, 40, 'thick') + l(36, 40, 36, 52) + l(44, 40, 44, 52) + l(30, 52, 50, 52) + c(40, 58, 5, 'fill-gold') + l(40, 63, 40, 68)) },
    'Three way switch': { svg: () => svg(l(10, 40, 22, 40) + l(22, 40, 32, 24) + c(32, 24, 4, 'fill-gold') + c(44, 40, 4, 'fill-gold') + l(44, 40, 68, 40) + l(32, 24, 32, 14) + c(32, 14, 4, 'fill-gold')) },
    'Single Switch': { svg: () => svg(l(10, 40, 22, 40) + l(22, 40, 32, 24) + c(32, 24, 4, 'fill-gold') + c(44, 40, 4, 'fill-gold') + l(44, 40, 68, 40)) },
    'Circuit breaker': { svg: () => svg(l(10, 40, 22, 40) + r(22, 26, 24, 28, 'stroke-gold') + p('M28,34 L40,46 M28,46 L40,34', 'stroke-gold') + l(46, 40, 68, 40)) },
    'Conductor Wire': { svg: () => svg(l(8, 40, 72, 40, 'thick')) },
    'Connected Wire': { svg: () => svg(l(8, 40, 72, 40, 'thick') + c(40, 40, 6, 'fill-gold')) },
    'Push Button': { svg: () => svg(l(10, 40, 22, 40) + l(22, 40, 32, 28) + c(32, 28, 4, 'fill-gold') + c(44, 40, 4, 'fill-gold') + l(44, 40, 68, 40) + l(32, 28, 32, 18) + r(26, 12, 12, 8, 'fill')) },
    'Wire not connected': { svg: () => svg(l(8, 28, 30, 28, 'thick') + l(44, 28, 72, 28, 'thick') + l(8, 52, 30, 52, 'thick') + l(44, 52, 72, 52, 'thick') + c(30, 28, 4, 'stroke-gold') + c(44, 28, 4, 'stroke-gold') + c(30, 52, 4, 'stroke-gold') + c(44, 52, 4, 'stroke-gold')) },
};

window.__symbolImgFallback = function (imgEl, name) {
    const def = SYMBOL_DEFS[name];
    const html = (def && def.svg) ? def.svg() : svg(`<rect x="10" y="10" width="60" height="60" class="stroke-gold" />
            <text x="40" y="42" font-size="20" fill="#b0c0d0" text-anchor="middle">?</text>`);
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    imgEl.replaceWith(wrap.firstElementChild || wrap);
};

const renderSymbol = (symbolName) => {
    const imgFile = SYMBOL_IMAGES[symbolName];
    if (imgFile) {
        return `<img src="${imgFile}" alt="${symbolName.replace(/"/g, '&quot;')}" style="width:60px;height:60px;object-fit:contain;display:block;margin:0 auto;" onerror="window.__symbolImgFallback(this, '${symbolName.replace(/'/g, "\\'")}')" />`;
    }
    const def = SYMBOL_DEFS[symbolName];
    if (def && def.svg) return def.svg();
    return svg(`<rect x="10" y="10" width="60" height="60" class="stroke-gold" />
            <text x="40" y="42" font-size="20" fill="#b0c0d0" text-anchor="middle">?</text>`);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYMBOL LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYMBOL_LEVELS = [
    { id: 1, name: 'Basic Symbols', stars: 4, symbols: ['Cell', 'Battery', 'Lamp', 'Fixed Resistor', 'Fuse'] },
    { id: 2, name: 'Switches', stars: 4, symbols: ['SPST Switch', 'Switch close', 'Single Switch', 'Push Button',
            'Three way switch'
        ] },
    { id: 3, name: 'Components', stars: 4, symbols: ['Diode', 'LED', 'Variable Resistor', 'Inductor',
        'Thermistor'] },
    { id: 4, name: 'Meters & Devices', stars: 4, symbols: ['Ammeter', 'Voltmeter', 'Motor', 'Buzzer', 'Bell'] },
    { id: 5, name: 'Wiring & Safety', stars: 5, symbols: ['Ground', 'Circuit breaker', 'Conductor Wire',
            'Connected Wire', 'Wire not connected'
        ] }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIRE WIZARD LEVELS — SCALED FOR BIGGER CANVAS (1000x380)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WIRE_LEVELS = [
    { id: 1, name: 'Simple Series', desc: 'Connect the circuit correctly to turn on the light.' },
    { id: 2, name: 'Series+Res', desc: 'Add a resistor in series.' },
    { id: 3, name: 'Parallel', desc: 'Wire two lights in parallel.' },
    { id: 4, name: 'Series-Par', desc: 'Series resistor and parallel lamps.' },
    { id: 5, name: 'Complex', desc: 'Complex circuit with switches and protection.' },
];

// Scaled terminal positions for 1000x380 canvas
const WIRE_LEVEL_CONFIGS = [{
    terminals: [
        { id: 'T1', label: '+', x: 160, y: 70 },
        { id: 'T2', label: '−', x: 160, y: 310 },
        { id: 'S1', label: 'S1', x: 440, y: 70 },
        { id: 'S2', label: 'S2', x: 560, y: 70 },
        { id: 'L1', label: 'L1', x: 820, y: 70 },
        { id: 'L2', label: 'L2', x: 820, y: 310 },
    ],
    required: [
        ['T1', 'S1'],
        ['S2', 'L1'],
        ['L2', 'T2']
    ],
    components: [
        { type: 'battery', x: 160, y: 190 },
        { type: 'switch', x: 500, y: 70 },
        { type: 'light', x: 820, y: 190 }
    ],
    clue: 'Connect the battery (+) to the switch input (S1), then switch output (S2) to the light (L1), and finally light (L2) back to battery (−).'
}, {
    terminals: [
        { id: 'T1', label: '+', x: 110, y: 70 },
        { id: 'T2', label: '−', x: 110, y: 310 },
        { id: 'S1', label: 'S1', x: 320, y: 70 },
        { id: 'S2', label: 'S2', x: 420, y: 70 },
        { id: 'R1', label: 'R1', x: 640, y: 70 },
        { id: 'R2', label: 'R2', x: 640, y: 310 },
        { id: 'L1', label: 'L1', x: 870, y: 70 },
        { id: 'L2', label: 'L2', x: 870, y: 310 },
    ],
    required: [
        ['T1', 'S1'],
        ['S2', 'R1'],
        ['R2', 'L1'],
        ['L2', 'T2']
    ],
    components: [
        { type: 'battery', x: 110, y: 190 },
        { type: 'switch', x: 370, y: 70 },
        { type: 'resistor', x: 640, y: 190 },
        { type: 'light', x: 870, y: 190 }
    ],
    clue: 'Connect battery (+) → switch input (S1), switch output (S2) → resistor (R1), resistor output (R2) → light (L1), then light (L2) back to battery (−).'
}, {
    terminals: [
        { id: 'T1', label: '+', x: 110, y: 70 },
        { id: 'T2', label: '−', x: 110, y: 310 },
        { id: 'S1', label: 'S1', x: 320, y: 70 },
        { id: 'S2', label: 'S2', x: 420, y: 70 },
        { id: 'LA1', label: 'LA1', x: 660, y: 70 },
        { id: 'LA2', label: 'LA2', x: 660, y: 310 },
        { id: 'LB1', label: 'LB1', x: 870, y: 70 },
        { id: 'LB2', label: 'LB2', x: 870, y: 310 },
    ],
    required: [
        ['T1', 'S1'],
        ['S2', 'LA1'],
        ['S2', 'LB1'],
        ['LA2', 'T2'],
        ['LB2', 'T2']
    ],
    components: [
        { type: 'battery', x: 110, y: 190 },
        { type: 'switch', x: 370, y: 70 },
        { type: 'light', x: 660, y: 190 },
        { type: 'light', x: 870, y: 190 }
    ],
    clue: 'Connect battery (+) → switch (S1), then from switch output (S2) branch to both lights (LA1 and LB1). Connect both light outputs (LA2, LB2) back to battery (−).'
}, {
    terminals: [
        { id: 'T1', label: '+', x: 90, y: 70 },
        { id: 'T2', label: '−', x: 90, y: 310 },
        { id: 'S1', label: 'S1', x: 280, y: 70 },
        { id: 'S2', label: 'S2', x: 370, y: 70 },
        { id: 'R1', label: 'R1', x: 540, y: 70 },
        { id: 'R2', label: 'R2', x: 540, y: 310 },
        { id: 'LA1', label: 'LA1', x: 740, y: 70 },
        { id: 'LA2', label: 'LA2', x: 740, y: 310 },
        { id: 'LB1', label: 'LB1', x: 910, y: 70 },
        { id: 'LB2', label: 'LB2', x: 910, y: 310 },
    ],
    required: [
        ['T1', 'S1'],
        ['S2', 'R1'],
        ['R2', 'LA1'],
        ['R2', 'LB1'],
        ['LA2', 'T2'],
        ['LB2', 'T2']
    ],
    components: [
        { type: 'battery', x: 90, y: 190 },
        { type: 'switch', x: 325, y: 70 },
        { type: 'resistor', x: 540, y: 190 },
        { type: 'light', x: 740, y: 190 },
        { type: 'light', x: 910, y: 190 }
    ],
    clue: 'Connect battery (+) → switch (S1), switch output (S2) → resistor (R1). From resistor output (R2), branch to both lights (LA1 and LB1). Connect both light outputs (LA2, LB2) back to battery (−).'
}, {
    terminals: [
        { id: 'T1', label: '+', x: 80, y: 70 },
        { id: 'T2', label: '−', x: 80, y: 310 },
        { id: 'S1', label: 'S1', x: 230, y: 70 },
        { id: 'S2', label: 'S2', x: 310, y: 70 },
        { id: 'R1', label: 'R1', x: 470, y: 70 },
        { id: 'R2', label: 'R2', x: 470, y: 310 },
        { id: 'LA1', label: 'LA1', x: 650, y: 70 },
        { id: 'LA2', label: 'LA2', x: 650, y: 310 },
        { id: 'S3', label: 'S3', x: 820, y: 70 },
        { id: 'S4', label: 'S4', x: 900, y: 70 },
        { id: 'LB1', label: 'LB1', x: 820, y: 200 },
        { id: 'LB2', label: 'LB2', x: 820, y: 310 },
    ],
    required: [
        ['T1', 'S1'],
        ['S2', 'R1'],
        ['R2', 'LA1'],
        ['R2', 'S3'],
        ['S4', 'LB1'],
        ['LA2', 'T2'],
        ['LB2', 'T2']
    ],
    components: [
        { type: 'battery', x: 80, y: 190 },
        { type: 'switch', x: 270, y: 70 },
        { type: 'resistor', x: 470, y: 190 },
        { type: 'light', x: 650, y: 190 },
        { type: 'switch', x: 860, y: 70 },
        { type: 'light', x: 820, y: 255 }
    ],
    clue: 'Connect battery (+) → switch 1 (S1), output (S2) → resistor (R1). From resistor output (R2), go to light A (LA1) and also to switch 2 input (S3). Switch 2 output (S4) → light B (LB1). Connect both light outputs (LA2, LB2) back to battery (−).'
}];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAULT LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FAULT_LEVELS = [
    { id: 1, name: 'Open Circuit', stars: 4 },
    { id: 2, name: 'Short Circuit', stars: 4 },
    { id: 3, name: 'Wrong Connection', stars: 4 },
    { id: 4, name: 'Multiple Faults', stars: 4 },
    { id: 5, name: 'Advanced Troubleshooting', stars: 5 },
];

const FAULT_CONFIGS = [{
    title: 'Open Circuit',
    desc: 'Find the broken wire and fix the open circuit.',
    problemText: '❓ The circuit is incomplete. The connection between the lamp and the switch is broken.',
    diagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker">✖</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    fixedDiagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    inspectMsg: '🔍 The wire between the lamp and switch is broken!',
    inspectHighlight: (el) => { const marker = el.querySelector('#faultMarker'); if (marker) marker.className =
            'fault-highlight revealed'; },
    repairMsg: '✅ You bridged the broken connection! The lamp lights up!',
    successMsg: 'You repaired the open circuit! The lamp is now lit.',
    failMsg: 'The circuit is still broken. Try INSPECT first to find the fault.',
    options: ['Bridge the gap with a jumper wire', 'Replace the lamp with a new one',
        'Swap the battery terminals', 'Add a resistor in series'
    ],
    correctOption: 0,
}, {
    title: 'Short Circuit',
    desc: 'Remove the bypass wire causing the short circuit.',
    problemText: '⚠️ There is a bypass wire creating a short circuit around the lamp!',
    diagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker">⚡</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="component">[⏚]</span>',
    fixedDiagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="component">[⏚]</span>',
    inspectMsg: '🔍 A bypass wire is creating a short circuit around the lamp!',
    inspectHighlight: (el) => { const marker = el.querySelector('#faultMarker'); if (marker) marker.className =
            'fault-highlight revealed'; },
    repairMsg: '✅ You removed the short circuit! Current now flows through the lamp.',
    successMsg: 'You removed the bypass wire! The lamp is now lit.',
    failMsg: 'The short circuit is still there. Use INSPECT to locate it.',
    options: ['Cut the bypass wire', 'Add a fuse in parallel', 'Increase the battery voltage',
        'Replace the lamp with a resistor'
    ],
    correctOption: 0,
}, {
    title: 'Wrong Connection',
    desc: 'Identify the misconnected lamp and rearrange the parallel branches.',
    problemText: '🔍 A component is connected with reverse polarity!',
    diagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker">⊣</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    fixedDiagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fixed-highlight">⊢</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    inspectMsg: '🔍 A component is connected backwards (reverse polarity)!',
    inspectHighlight: (el) => { const marker = el.querySelector('#faultMarker'); if (marker) marker.className =
            'fault-highlight revealed'; },
    repairMsg: '✅ You corrected the polarity! The circuit now works.',
    successMsg: 'You fixed the wrong connection! The circuit is now correct.',
    failMsg: 'The connection is still wrong. Use INSPECT to see the issue.',
    options: ['Flip the component to correct polarity', 'Remove the component entirely',
        'Add a capacitor in parallel', 'Swap the battery polarity'
    ],
    correctOption: 0,
}, {
    title: 'Multiple Faults',
    desc: 'Find and repair all faults before the circuit can work.',
    problemText: '⚠️ Two faults detected: a broken wire AND a loose connection!',
    diagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker1">✖</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker2">~</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    fixedDiagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    inspectMsg: '🔍 Two faults found: a broken wire AND a loose connection!',
    inspectHighlight: (el) => { const m1 = el.querySelector('#faultMarker1'); const m2 = el.querySelector(
            '#faultMarker2'); if (m1) m1.className = 'fault-highlight revealed'; if (m2) m2.className =
            'fault-highlight revealed'; },
    repairMsg: '✅ You fixed both faults! The circuit is perfect.',
    successMsg: 'You repaired all faults! The circuit is fully functional.',
    failMsg: 'Some faults remain. INSPECT to find all of them.',
    options: ['Bridge the broken wire and tighten the loose connection',
        'Replace the lamp and the switch', 'Add a fuse and a resistor',
        'Swap the battery and rewire the ground'
    ],
    correctOption: 0,
}, {
    title: 'Advanced Troubleshooting',
    desc: 'Test each part and restore the full lighting system.',
    problemText: '⚠️ Advanced issue: the resistor is burnt out AND the switch is stuck open!',
    diagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker1">⚡</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fault-highlight" id="faultMarker2">⎓</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    fixedDiagram: '<span class="component">[🔋]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[💡]</span> <span class="component">──</span> <span class="fixed-highlight">✔</span> <span class="component">──</span> <span class="component">[🔌]</span>',
    inspectMsg: '🔍 Advanced: the resistor is burnt out AND the switch is stuck open!',
    inspectHighlight: (el) => { const m1 = el.querySelector('#faultMarker1'); const m2 = el.querySelector(
            '#faultMarker2'); if (m1) m1.className = 'fault-highlight revealed'; if (m2) m2.className =
            'fault-highlight revealed'; },
    repairMsg: '✅ You replaced the burnt resistor and repaired the switch! Full system restored.',
    successMsg: 'You restored the full lighting system! All components are working.',
    failMsg: 'The system still has faults. INSPECT to identify all issues.',
    options: ['Replace the resistor and repair the switch', 'Replace the lamp and the battery',
        'Add a capacitor and a fuse', 'Rewire the circuit in parallel'
    ],
    correctOption: 0,
}];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAFETY LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SAFETY_LEVELS = [
    { id: 1, name: 'Basic Safety', stars: 4 },
    { id: 2, name: 'PPE & Tools', stars: 4 },
    { id: 3, name: 'Lockout/Tagout', stars: 4 },
    { id: 4, name: 'Emergency Response', stars: 4 },
    { id: 5, name: 'Advanced Safety', stars: 5 },
];

const SAFETY_CONFIGS = [{
    hazard: 'Broken wire / exposed end',
    riskRating: 'Medium',
    riskClass: 'medium',
    control: 'Unconnected power before repair',
    correctPPE: ['Gloves worn', 'Glasses worn', 'Power OFF'],
    allPPE: ['Gloves worn', 'Glasses worn', 'Power OFF', 'Rubber Hat', 'Unshielded', 'Minor Gloves'],
}, {
    hazard: 'Short circuit / overheating',
    riskRating: 'High',
    riskClass: 'high',
    control: 'Remove bypass wire and check fuse',
    correctPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield'],
    allPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield', 'Fire Extinguisher', 'Hazard Gloves',
        'Injected Gears'
    ],
}, {
    hazard: 'Wavy Parallel Connection',
    riskRating: 'High',
    riskClass: 'high',
    control: 'Lockout/Tagout procedure required',
    correctPPE: ['Insulated Gloves', 'Safety Glasses', 'Multimeter', 'Insulated Screwdriver'],
    allPPE: ['Insulated Gloves', 'Safety Glasses', 'Multimeter', 'Insulated Screwdriver',
        'Connections verifier'
    ],
}, {
    hazard: 'Blown fuse / loose connection / possible arc flash',
    riskRating: 'High',
    riskClass: 'high',
    control: 'Replace fuse only with correct rating and retest',
    correctPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield', 'Fuse Puller', 'Multimeter'],
    allPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield', 'Fuse Puller', 'Multimeter',
        'Orre fault at tattiner'
    ],
}, {
    hazard: 'Complex circuit with multiple hazards',
    riskRating: 'High',
    riskClass: 'high',
    control: 'Use insulated tools and verify zero energy state',
    correctPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield', 'Voltage Tester', 'Ground Clamp',
        'Insulated Tools'
    ],
    allPPE: ['Insulated Gloves', 'Safety Glasses', 'Face Shield', 'Voltage Tester', 'Ground Clamp',
        'Insulated Tools'
    ],
}];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i +
        1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function $(sel) { return document.querySelector(sel); }

function $$(sel) { return document.querySelectorAll(sel); }

function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    $$('.feedback-overlay').forEach(f => f.classList.remove('show'));
    stopTimer();
    state.seconds = 0;
    if (id === 'screen-main') updateMainMenu();
}

function formatTime(s) { const m = String(Math.floor(s / 60)).padStart(2, '0'); const sec = String(s % 60)
        .padStart(2, '0'); return m + ':' + sec; }

function startTimer(id) {
    stopTimer();
    state.seconds = 0;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('running');
    state.timerInterval = setInterval(() => { state.seconds++;
        el.textContent = formatTime(state.seconds); }, 1000);
}

function stopTimer() {
    if (state.timerInterval) { clearInterval(state.timerInterval);
        state.timerInterval = null; }
    document.querySelectorAll('.timer').forEach(el => el.classList.remove('running'));
}

function renderLevelGrid(container, levels, completed, current) {
    container.innerHTML = '';
    levels.forEach((lv, idx) => {
        const div = document.createElement('div');
        div.className = 'level-card';
        const isDone = completed.has(lv.id);
        const isActive = (idx === current);
        if (isDone) div.classList.add('completed');
        if (isActive) div.classList.add('active');
        const unlocked = idx === 0 || completed.has(levels[idx - 1].id);
        if (!unlocked) div.classList.add('locked');
        div.innerHTML =
            `<div class="num">${lv.id}</div><div class="name">${lv.name}</div><div class="stars">${levelHeartsStr(container.id.replace('LevelGrid', ''), lv.id, isDone)}</div>`;
        if (unlocked && !isDone) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                const all = container.querySelectorAll('.level-card');
                all.forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                if (container.id === 'symbolLevelGrid') state.symbol.level = idx;
                else if (container.id === 'wireLevelGrid') state.wire.level = idx;
                else if (container.id === 'faultLevelGrid') state.fault.level = idx;
                else if (container.id === 'codeLevelGrid') state.code.level = idx;
            });
        }
        container.appendChild(div);
    });
}

function getUnlockStatus() {
    const symbolTotal = SYMBOL_LEVELS.length;
    const wireTotal = WIRE_LEVELS.length;
    const faultTotal = FAULT_LEVELS.length;
    const safetyTotal = SAFETY_LEVELS.length;
    const symbolDone = state.symbol.completed.size === symbolTotal;
    const wireDone = state.wire.completed.size === wireTotal;
    const faultDone = state.fault.completed.size === faultTotal;
    const safetyDone = state.code.completed.size === safetyTotal;
    return {
        symbol: { unlocked: true, progress: `${state.symbol.completed.size}/${symbolTotal}`, done: symbolDone,
            level: state.symbol.level },
        wire: { unlocked: true, progress: `${state.wire.completed.size}/${wireTotal}`, done: wireDone,
            level: state.wire.level },
        fault: { unlocked: true, progress: `${state.fault.completed.size}/${faultTotal}`, done: faultDone,
            level: state.fault.level },
        code: { unlocked: true, progress: `${state.code.completed.size}/${safetyTotal}`, done: safetyDone,
            level: state.code.level },
    };
}

function updateMainMenu() {
    const status = getUnlockStatus();
    const gameIds = ['symbol', 'wire', 'fault', 'code'];
    gameIds.forEach(id => {
        const el = document.getElementById(`menu-${id}`);
        if (!el) return;
        const data = status[id];
        const badge = el.querySelector('.badge');
        if (data.unlocked) {
            el.classList.remove('locked');
            if (badge) {
                if (data.done) {
                    badge.textContent = '✅ Complete';
                    badge.style.background = '#2d8f5e';
                    badge.style.color = '#fff';
                } else {
                    const lv = data.level + 1;
                    badge.textContent = `Lv.${lv}`;
                    badge.style.background = '#f5a623';
                    badge.style.color = '#121820';
                }
            }
        } else {
            el.classList.add('locked');
            if (badge) {
                badge.textContent = '🔒 Locked';
                badge.style.background = '#4a5a70';
                badge.style.color = '#aab8c8';
            }
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.back;
        if (target === 'main' && EMBEDDED) {
            try { (window.parent || window).postMessage({ type: 'EIM_EXIT' }, '*'); } catch (e) {}
            return;
        }
        if (target === 'main') {
            showScreen('screen-main');
            ['symbol', 'wire', 'fault', 'code'].forEach(m => {
                state[m].phase = 'SELECT';
                const el = document.getElementById(m + '-select');
                if (el) el.style.display = '';
                const instr = document.getElementById(m + '-instructions');
                if (instr) instr.style.display = 'none';
                const game = document.getElementById(m + '-game');
                if (game) game.style.display = 'none';
                const prog = document.getElementById(m + '-progress');
                if (prog) prog.style.display = 'none';
                const fb = document.getElementById(m + 'Feedback');
                if (fb) fb.classList.remove('show');
            });
        }
    });
});

document.querySelectorAll('.menu-item[data-game]').forEach(item => {
    item.addEventListener('click', () => {
        const game = item.dataset.game;
        const status = getUnlockStatus();
        if (!status[game].unlocked) {
            item.classList.add('shake');
            setTimeout(() => item.classList.remove('shake'), 500);
            return;
        }
        if (game === 'symbol') initSymbolSavvy();
        else if (game === 'wire') initWireWizard();
        else if (game === 'fault') initFaultFinder();
        else if (game === 'code') initSafetyCheck();
        showScreen('screen-' + game);
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYMBOL SAVVY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let symbolPairs = [],
    symbolPlaced = {};
let symbolDragging = null,
    symbolDragData = null;

function initSymbolSavvy() {
    state.symbol.phase = 'SELECT';
    const container = document.getElementById('symbolLevelGrid');
    renderLevelGrid(container, SYMBOL_LEVELS, state.symbol.completed, state.symbol.level);
    document.getElementById('symbol-select').style.display = '';
    document.getElementById('symbol-instructions').style.display = 'none';
    document.getElementById('symbol-game').style.display = 'none';
    document.getElementById('symbol-progress').style.display = 'none';
    document.getElementById('symbolFeedback').classList.remove('show');
}

document.getElementById('symbolStartBtn').addEventListener('click', () => {
    const lv = state.symbol.level;
    const data = SYMBOL_LEVELS[lv];
    if (!data) return;
    if (!transition('symbol', 'START')) return;
    document.getElementById('symbol-select').style.display = 'none';
    document.getElementById('symbol-instructions').style.display = '';
    document.getElementById('symbolInstrObj').textContent = `🎯 Level ${data.id}: ${data.name}`;
    document.getElementById('symbolInstrDetail').textContent = 'Match each symbol to its correct name.';
});

document.getElementById('symbolPlayBtn').addEventListener('click', () => {
    if (!transition('symbol', 'PLAY')) return;
    document.getElementById('symbol-instructions').style.display = 'none';
    document.getElementById('symbol-game').style.display = '';
    startSymbolGame();
});

function startSymbolGame() {
    const lv = state.symbol.level;
    const levelData = SYMBOL_LEVELS[lv];
    if (!levelData) return;
    const symbolNames = levelData.symbols;
    const pairs = symbolNames.map(name => ({ name: name }));
    symbolPairs = pairs;
    const names = shuffle(pairs.map(p => p.name));
    symbolPlaced = {};
    symbolDragging = null;
    symbolDragData = null;

    const grid = document.getElementById('symbolDropGrid');
    grid.innerHTML = '';
    symbolPairs.forEach((pair, idx) => {
        const div = document.createElement('div');
        div.className = 'drop-target';
        div.dataset.idx = idx;
        div.innerHTML =
            `<div class="symbol-display">${renderSymbol(pair.name)}</div><div class="symbol-label">Symbol</div><div class="placed-name" id="symbolPlaced_${idx}"></div>`;
        div.addEventListener('dragover', (e) => { e.preventDefault();
            div.classList.add('drag-over'); });
        div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.classList.remove('drag-over');
            const name = e.dataTransfer.getData('text/plain');
            if (name) handleSymbolDrop(idx, name);
        });
        grid.appendChild(div);
    });

    const zone = document.getElementById('symbolDragZone');
    zone.innerHTML = '';
    names.forEach(name => {
        const el = document.createElement('div');
        el.className = 'drag-item';
        el.innerHTML = name;
        el.draggable = true;
        el.dataset.name = name;
        el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', name);
            el.classList.add('dragging'); });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            symbolDragging = el;
            symbolDragData = name;
            const ghost = document.getElementById('dragGhost');
            ghost.textContent = name;
            ghost.style.display = 'block';
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
            el.classList.add('dragging');
        });
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const ghost = document.getElementById('dragGhost');
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
            const targets = document.querySelectorAll('#symbolDropGrid .drop-target');
            targets.forEach(t => {
                const rect = t.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch
                    .clientY >= rect.top && touch.clientY <= rect.bottom) { t.classList
                        .add('drag-over'); } else { t.classList.remove('drag-over'); }
            });
        });
        el.addEventListener('touchend', (e) => {
            const ghost = document.getElementById('dragGhost');
            ghost.style.display = 'none';
            el.classList.remove('dragging');
            const touch = e.changedTouches[0];
            const targets = document.querySelectorAll('#symbolDropGrid .drop-target');
            let dropped = false;
            targets.forEach(t => {
                t.classList.remove('drag-over');
                const rect = t.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch
                    .clientY >= rect.top && touch.clientY <= rect.bottom) {
                    const idx = parseInt(t.dataset.idx);
                    if (!isNaN(idx) && symbolDragData) { handleSymbolDrop(idx,
                        symbolDragData);
                        dropped = true; }
                }
            });
            symbolDragging = null;
            symbolDragData = null;
        });
        zone.appendChild(el);
    });

    symbolPlaced = {};
    document.querySelectorAll('#symbolDropGrid .drop-target .placed-name').forEach(el => {
        el.textContent = '';
        el.className = 'placed-name';
    });
    document.querySelectorAll('#symbolDropGrid .drop-target').forEach(el => {
        el.classList.remove('correct', 'has-name');
        el.style.borderColor = '';
        el.style.borderStyle = 'dashed';
    });
    document.querySelectorAll('#symbolDragZone .drag-item').forEach(el => {
        el.classList.remove('placed');
        el.style.display = '';
        el.style.pointerEvents = '';
        el.style.opacity = '1';
    });
    document.getElementById('symbolGameLevel').textContent = 'Level ' + SYMBOL_LEVELS[state.symbol.level].id;
    resetHearts('symbolGameStars');
    startTimer('symbolGameTimer');
    document.getElementById('symbolFeedback').classList.remove('show');
    document.getElementById('symbolFbNext').style.display = 'none';
}

function handleSymbolDrop(idx, name) {
    if (symbolPlaced[idx]) return;

    const pair = symbolPairs[idx];
    if (!pair) return;

    const target = document.querySelector(`#symbolDropGrid .drop-target[data-idx="${idx}"]`);
    const placedEl = document.getElementById(`symbolPlaced_${idx}`);
    if (!target || !placedEl) return;

    placedEl.textContent = name;
    placedEl.className = 'placed-name';
    target.classList.add('has-name');
    target.style.borderColor = 'rgba(255,255,255,0.15)';
    target.style.borderStyle = 'solid';

    symbolPlaced[idx] = name;

    const items = document.querySelectorAll('#symbolDragZone .drag-item');
    items.forEach(el => {
        if (el.dataset.name === name) {
            el.classList.add('placed');
            el.style.display = 'none';
        }
    });

    const total = symbolPairs.length;
    const placedCount = Object.keys(symbolPlaced).length;
    if (placedCount === total) {
        setTimeout(() => checkSymbolAnswers(), 400);
    }
}

function checkSymbolAnswers() {
    if (state.symbol.phase !== 'PLAYING') return;
    let allCorrect = true;
    const total = symbolPairs.length;

    for (let i = 0; i < total; i++) {
        const placedName = symbolPlaced[i];
        const pair = symbolPairs[i];
        const target = document.querySelector(`#symbolDropGrid .drop-target[data-idx="${i}"]`);
        const placedEl = document.getElementById(`symbolPlaced_${i}`);

        if (!placedName || !pair) {
            allCorrect = false;
            continue;
        }

        const isCorrect = (placedName === pair.name);

        if (isCorrect) {
            target.classList.add('correct');
            placedEl.className = 'placed-name correct-name';
        } else {
            allCorrect = false;
            placedEl.className = 'placed-name wrong-name';
        }
    }

    if (allCorrect) {
        setTimeout(() => showSymbolComplete(true), 500);
    } else if (loseHeart()) {
        setTimeout(() => showOutOfHearts('symbol', 'symbolFeedback', 'symbol'), 500);
    } else {
        setTimeout(() => resetWrongAnswers(), 800);
    }
}

function resetWrongAnswers() {
    const total = symbolPairs.length;
    let hasWrong = false;

    for (let i = 0; i < total; i++) {
        const placedName = symbolPlaced[i];
        const pair = symbolPairs[i];
        const target = document.querySelector(`#symbolDropGrid .drop-target[data-idx="${i}"]`);
        const placedEl = document.getElementById(`symbolPlaced_${i}`);

        if (!placedName || !pair) continue;

        const isCorrect = (placedName === pair.name);

        if (!isCorrect) {
            hasWrong = true;
            const items = document.querySelectorAll('#symbolDragZone .drag-item');
            items.forEach(el => {
                if (el.dataset.name === placedName) {
                    el.classList.remove('placed');
                    el.style.display = '';
                    el.style.pointerEvents = '';
                    el.style.opacity = '1';
                }
            });

            placedEl.textContent = '';
            placedEl.className = 'placed-name';
            target.classList.remove('has-name', 'correct');
            target.style.borderColor = '';
            target.style.borderStyle = 'dashed';
            delete symbolPlaced[i];
        }
    }

    if (hasWrong) {
        const msg = document.createElement('div');
        msg.style.cssText = 'text-align:center;color:#f87171;font-weight:700;font-size:14px;margin:4px 0;';
        msg.textContent = '❌ Some answers were incorrect. They have been returned. Try again!';
        const existing = document.querySelector('.symbol-feedback-msg');
        if (existing) existing.remove();
        msg.className = 'symbol-feedback-msg';
        document.getElementById('symbol-game').appendChild(msg);
        setTimeout(() => { if (msg.parentNode) msg.remove(); }, 2500);
    }
}

document.getElementById('symbolCheckBtn').addEventListener('click', () => {
    const total = symbolPairs.length;
    const placed = Object.keys(symbolPlaced).length;

    if (placed === total) {
        checkSymbolAnswers();
    } else {
        for (let i = 0; i < total; i++) {
            if (!symbolPlaced[i]) {
                const target = document.querySelector(`#symbolDropGrid .drop-target[data-idx="${i}"]`);
                if (target) {
                    target.style.borderColor = '#f87171';
                    target.style.borderStyle = 'solid';
                    setTimeout(() => {
                        target.style.borderColor = '';
                        target.style.borderStyle = 'dashed';
                    }, 800);
                }
            }
        }
    }
});

function showSymbolComplete(success) {
    if (success && !transition('symbol', 'PASS')) return;
    stopTimer();
    const fb = document.getElementById('symbolFeedback');
    if (success) {
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('symbolFbIcon').textContent = '🎉';
        document.getElementById('symbolFbTitle').textContent = 'Well Done!';
        document.getElementById('symbolFbTitle').className = 'fb-title gold';
        document.getElementById('symbolFbSub').textContent = 'You identified all symbols correctly!';
        document.getElementById('symbolFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#f5a623;">${xp + 30} XP</span></div>`;
        document.getElementById('symbolFbReplay').textContent = '↻ REPLAY';
        state.symbol.completed.add(SYMBOL_LEVELS[state.symbol.level].id);
        keepHearts('symbol', SYMBOL_LEVELS[state.symbol.level].id);
        notifyEimProgress('symbol', SYMBOL_LEVELS, xp + 30);
        document.getElementById('symbolFbNext').style.display = (state.symbol.level < SYMBOL_LEVELS.length -
            1) ? '' : 'none';
    }
    fb.classList.add('show');
}

document.getElementById('symbolFbReplay').addEventListener('click', () => {
    if (!transition('symbol', state.symbol.phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY')) return;
    document.getElementById('symbolFeedback').classList.remove('show');
    startSymbolGame(); });

document.getElementById('symbolFbNext').addEventListener('click', () => {
    const lastSymbol = !(state.symbol.level < SYMBOL_LEVELS.length - 1);
    if (!transition('symbol', lastSymbol ? 'FINISH' : 'NEXT')) return;
    document.getElementById('symbolFeedback').classList.remove('show');
    if (state.symbol.level < SYMBOL_LEVELS.length - 1) {
        state.symbol.level++;
        document.getElementById('symbol-game').style.display = 'none';
        document.getElementById('symbol-select').style.display = '';
        renderLevelGrid(document.getElementById('symbolLevelGrid'), SYMBOL_LEVELS, state.symbol.completed,
            state.symbol.level);
    } else {
        document.getElementById('symbol-game').style.display = 'none';
        document.getElementById('symbol-progress').style.display = '';
        updateMainMenu();
    }
});

document.getElementById('symbolProgressBack').addEventListener('click', () => { transition('symbol', 'EXIT'); showScreen('screen-main');
    document.getElementById('symbol-progress').style.display = 'none';
    document.getElementById('symbol-select').style.display = ''; });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIRE WIZARD — ENHANCED CANVAS RENDERING WITH CLUE BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let circuitConnections = [];
let circuitSelected = null;
let circuitLightOn = false;
let circuitLevelIndex = 0;
const wireCanvas = document.getElementById('wireCanvas');
const wireCtx = wireCanvas.getContext('2d');
const TERM_R = 22;

// Image loading
const circuitImages = {
    battery: new Image(),
    switchOff: new Image(),
    switchOn: new Image(),
    bulbOff: new Image(),
    bulbOn: new Image()
};
circuitImages.battery.src = '../assets/img/circuit/battery.png';
circuitImages.switchOff.src = '../assets/img/circuit/switch-off.png';
circuitImages.switchOn.src = '../assets/img/circuit/switch-on.png';
circuitImages.bulbOff.src = '../assets/img/circuit/bulb-off.png';
circuitImages.bulbOn.src = '../assets/img/circuit/bulb-on.png';
let imagesReady = false;
let loadedCount = 0;
Object.values(circuitImages).forEach(img => {
    img.onload = () => { loadedCount++; if (loadedCount === 5) imagesReady = true;
        drawCircuit(); };
    img.onerror = () => { loadedCount++; if (loadedCount === 5) imagesReady = true; };
});

function initWireWizard() {
    state.wire.phase = 'SELECT';
    const status = getUnlockStatus();
    if (!status.wire.unlocked) { showScreen('screen-main'); return; }
    const container = document.getElementById('wireLevelGrid');
    renderLevelGrid(container, WIRE_LEVELS, state.wire.completed, state.wire.level);
    document.getElementById('wire-select').style.display = '';
    document.getElementById('wire-instructions').style.display = 'none';
    document.getElementById('wire-game').style.display = 'none';
    document.getElementById('wireFeedbackOverlay').classList.remove('show');
    state.wireClueUsed = false;
}

document.getElementById('wireStartBtn').addEventListener('click', () => {
    const lv = state.wire.level;
    const data = WIRE_LEVELS[lv];
    if (!data) return;
    if (!transition('wire', 'START')) return;
    document.getElementById('wire-select').style.display = 'none';
    document.getElementById('wire-instructions').style.display = '';
    document.getElementById('wireInstrObj').textContent = `🔌 Level ${data.id}: ${data.name}`;
    document.getElementById('wireInstrDetail').textContent = data.desc;
    const compList = document.getElementById('wireCompList');
    compList.innerHTML = '';
    const config = WIRE_LEVEL_CONFIGS[lv];
    if (config) {
        config.components.forEach(c => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = c.type;
            compList.appendChild(chip);
        });
    }
});

document.getElementById('wirePlayBtn').addEventListener('click', () => {
    if (!transition('wire', 'PLAY')) return;
    document.getElementById('wire-instructions').style.display = 'none';
    document.getElementById('wire-game').style.display = '';
    state.wireClueUsed = false;
    document.getElementById('wireClueBtn').disabled = false;
    startCircuitGame();
});

function getCircuitTerminalAt(mx, my) {
    const rect = wireCanvas.getBoundingClientRect();
    const scaleX = wireCanvas.width / rect.width;
    const scaleY = wireCanvas.height / rect.height;
    const cx = (mx - rect.left) * scaleX;
    const cy = (my - rect.top) * scaleY;
    const level = WIRE_LEVEL_CONFIGS[circuitLevelIndex];
    for (const t of level.terminals) {
        const dx = cx - t.x,
            dy = cy - t.y;
        if (dx * dx + dy * dy <= (TERM_R + 10) * (TERM_R + 10)) return t;
    }
    return null;
}

function circuitIsConnected(t1, t2) {
    return circuitConnections.some(c => (c.t1.id === t1.id && c.t2.id === t2.id) || (c.t1.id === t2.id && c.t2
        .id === t1.id));
}

function circuitToggleConnection(t1, t2) {
    if (t1.id === t2.id) return;
    const idx = circuitConnections.findIndex(c => (c.t1.id === t1.id && c.t2.id === t2.id) || (c.t1.id === t2
        .id && c.t2.id === t1.id));
    if (idx !== -1) { circuitConnections.splice(idx, 1); return; }
    circuitConnections.push({ t1, t2 });
}

function circuitCheckComplete() {
    const level = WIRE_LEVEL_CONFIGS[circuitLevelIndex];
    for (const [idA, idB] of level.required) {
        const tA = level.terminals.find(t => t.id === idA);
        const tB = level.terminals.find(t => t.id === idB);
        if (!tA || !tB) return false;
        if (!circuitIsConnected(tA, tB)) return false;
    }
    return true;
}

function drawCircuit() {
    const W = wireCanvas.width,
        H = wireCanvas.height;
    wireCtx.clearRect(0, 0, W, H);

    wireCtx.strokeStyle = 'rgba(255,255,255,0.02)';
    wireCtx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
        wireCtx.beginPath();
        wireCtx.moveTo(x, 0);
        wireCtx.lineTo(x, H);
        wireCtx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
        wireCtx.beginPath();
        wireCtx.moveTo(0, y);
        wireCtx.lineTo(W, y);
        wireCtx.stroke();
    }

    const level = WIRE_LEVEL_CONFIGS[circuitLevelIndex];

    for (const comp of level.components) {
        if (comp.type === 'battery') {
            if (imagesReady && circuitImages.battery.complete && circuitImages.battery.naturalWidth > 0) {
                wireCtx.drawImage(circuitImages.battery, comp.x - 72, comp.y - 90, 144, 180);
            } else {
                const bx = comp.x - 38,
                    by = comp.y - 57;
                wireCtx.fillStyle = '#1a202c';
                wireCtx.shadowColor = 'rgba(0,0,0,0.4)';
                wireCtx.shadowBlur = 20;
                if (wireCtx.roundRect) {
                    wireCtx.roundRect(bx, by, 76, 114, 8);
                } else {
                    wireCtx.rect(bx, by, 76, 114);
                }
                wireCtx.fill();
                wireCtx.shadowBlur = 0;
                wireCtx.strokeStyle = '#4a5568';
                wireCtx.lineWidth = 2;
                wireCtx.strokeRect(bx, by, 76, 114);
                wireCtx.fillStyle = '#dc2626';
                wireCtx.font = 'bold 26px sans-serif';
                wireCtx.textAlign = 'center';
                wireCtx.textBaseline = 'bottom';
                wireCtx.fillText('+', comp.x, by - 4);
                wireCtx.fillStyle = '#2563eb';
                wireCtx.textBaseline = 'top';
                wireCtx.fillText('−', comp.x, by + 116);
                wireCtx.fillStyle = '#94a3b8';
                wireCtx.font = 'bold 12px sans-serif';
                wireCtx.textBaseline = 'bottom';
                wireCtx.fillText('BATTERY', comp.x, by + 108);
            }
        } else if (comp.type === 'switch') {
            const img = circuitLightOn ? circuitImages.switchOn : circuitImages.switchOff;
            if (imagesReady && img.complete && img.naturalWidth > 0) {
                wireCtx.drawImage(img, comp.x - 52, comp.y - 69, 104, 138);
            } else {
                const sx = comp.x - 35,
                    sy = comp.y - 42;
                wireCtx.fillStyle = '#1e293b';
                wireCtx.shadowColor = 'rgba(0,0,0,0.3)';
                wireCtx.shadowBlur = 16;
                if (wireCtx.roundRect) {
                    wireCtx.roundRect(sx, sy, 70, 84, 6);
                } else {
                    wireCtx.rect(sx, sy, 70, 84);
                }
                wireCtx.fill();
                wireCtx.shadowBlur = 0;
                wireCtx.strokeStyle = '#475569';
                wireCtx.lineWidth = 2;
                wireCtx.strokeRect(sx, sy, 70, 84);
                wireCtx.strokeStyle = '#f5a623';
                wireCtx.lineWidth = 5;
                wireCtx.beginPath();
                wireCtx.moveTo(comp.x, sy + 14);
                wireCtx.lineTo(comp.x + (circuitLightOn ? 20 : -20), sy + 42);
                wireCtx.stroke();
                wireCtx.fillStyle = '#94a3b8';
                wireCtx.font = 'bold 11px sans-serif';
                wireCtx.textAlign = 'center';
                wireCtx.textBaseline = 'bottom';
                wireCtx.fillText('SW', comp.x, sy - 2);
            }
        } else if (comp.type === 'light') {
            const img = circuitLightOn ? circuitImages.bulbOn : circuitImages.bulbOff;
            if (imagesReady && img.complete && img.naturalWidth > 0) {
                wireCtx.drawImage(img, comp.x - 63, comp.y - 87, 126, 174);
            } else {
                const lx = comp.x - 40,
                    ly = comp.y - 52;
                if (circuitLightOn) {
                    const grad = wireCtx.createRadialGradient(comp.x, comp.y, 6, comp.x, comp.y, 75);
                    grad.addColorStop(0, 'rgba(251,191,36,0.25)');
                    grad.addColorStop(1, 'rgba(251,191,36,0)');
                    wireCtx.fillStyle = grad;
                    wireCtx.beginPath();
                    wireCtx.arc(comp.x, comp.y, 75, 0, 2 * Math.PI);
                    wireCtx.fill();
                }
                wireCtx.fillStyle = circuitLightOn ? '#fbbf24' : '#475569';
                wireCtx.shadowColor = circuitLightOn ? 'rgba(251,191,36,0.4)' : 'transparent';
                wireCtx.shadowBlur = circuitLightOn ? 50 : 0;
                wireCtx.beginPath();
                wireCtx.arc(comp.x, comp.y - 4, 35, 0, 2 * Math.PI);
                wireCtx.fill();
                wireCtx.shadowBlur = 0;
                wireCtx.strokeStyle = '#334155';
                wireCtx.lineWidth = 2;
                wireCtx.beginPath();
                wireCtx.arc(comp.x, comp.y - 4, 35, 0, 2 * Math.PI);
                wireCtx.stroke();
                wireCtx.fillStyle = '#64748b';
                wireCtx.fillRect(comp.x - 15, comp.y + 26, 30, 12);
                wireCtx.fillStyle = '#94a3b8';
                wireCtx.font = 'bold 12px sans-serif';
                wireCtx.textAlign = 'center';
                wireCtx.textBaseline = 'top';
                wireCtx.fillText(circuitLightOn ? '💡 ON' : '💡 OFF', comp.x, comp.y + 42);
            }
        } else if (comp.type === 'resistor') {
            const rx = comp.x - 44,
                ry = comp.y - 32;
            wireCtx.fillStyle = '#1e293b';
            wireCtx.shadowColor = 'rgba(0,0,0,0.3)';
            wireCtx.shadowBlur = 12;
            if (wireCtx.roundRect) {
                wireCtx.roundRect(rx, ry, 88, 64, 6);
            } else {
                wireCtx.rect(rx, ry, 88, 64);
            }
            wireCtx.fill();
            wireCtx.shadowBlur = 0;
            wireCtx.strokeStyle = '#475569';
            wireCtx.lineWidth = 2;
            wireCtx.strokeRect(rx, ry, 88, 64);
            wireCtx.strokeStyle = '#f5a623';
            wireCtx.lineWidth = 4;
            wireCtx.beginPath();
            wireCtx.moveTo(comp.x - 32, comp.y);
            wireCtx.lineTo(comp.x - 18, comp.y - 16);
            wireCtx.lineTo(comp.x - 4, comp.y + 16);
            wireCtx.lineTo(comp.x + 10, comp.y - 16);
            wireCtx.lineTo(comp.x + 24, comp.y + 16);
            wireCtx.lineTo(comp.x + 32, comp.y);
            wireCtx.stroke();
            wireCtx.fillStyle = '#94a3b8';
            wireCtx.font = 'bold 11px sans-serif';
            wireCtx.textAlign = 'center';
            wireCtx.textBaseline = 'bottom';
            wireCtx.fillText('R', comp.x, ry - 2);
        }
    }

    for (const conn of circuitConnections) {
        const grad = wireCtx.createLinearGradient(conn.t1.x, conn.t1.y, conn.t2.x, conn.t2.y);
        grad.addColorStop(0, 'rgba(37,99,235,0.15)');
        grad.addColorStop(0.5, 'rgba(37,99,235,0.25)');
        grad.addColorStop(1, 'rgba(37,99,235,0.15)');
        wireCtx.strokeStyle = grad;
        wireCtx.lineWidth = 18;
        wireCtx.lineCap = 'round';
        wireCtx.beginPath();
        wireCtx.moveTo(conn.t1.x, conn.t1.y);
        wireCtx.lineTo(conn.t2.x, conn.t2.y);
        wireCtx.stroke();

        wireCtx.strokeStyle = '#3b82f6';
        wireCtx.lineWidth = 5;
        wireCtx.shadowColor = 'rgba(59,130,246,0.4)';
        wireCtx.shadowBlur = 18;
        wireCtx.beginPath();
        wireCtx.moveTo(conn.t1.x, conn.t1.y);
        wireCtx.lineTo(conn.t2.x, conn.t2.y);
        wireCtx.stroke();
        wireCtx.shadowBlur = 0;
    }

    for (const t of level.terminals) {
        const isSel = circuitSelected && circuitSelected.id === t.id;
        const isCon = circuitConnections.some(c => c.t1.id === t.id || c.t2.id === t.id);

        if (isSel || isCon) {
            const glow = wireCtx.createRadialGradient(t.x, t.y, 4, t.x, t.y, TERM_R + 12);
            glow.addColorStop(0, isSel ? 'rgba(59,130,246,0.25)' : 'rgba(74,222,128,0.2)');
            glow.addColorStop(1, 'rgba(59,130,246,0)');
            wireCtx.fillStyle = glow;
            wireCtx.beginPath();
            wireCtx.arc(t.x, t.y, TERM_R + 12, 0, 2 * Math.PI);
            wireCtx.fill();
        }

        wireCtx.beginPath();
        wireCtx.arc(t.x, t.y, TERM_R, 0, 2 * Math.PI);
        wireCtx.fillStyle = isSel ? '#dbeafe' : isCon ? '#dcfce7' : '#f1f5f9';
        wireCtx.shadowColor = isSel ? 'rgba(59,130,246,0.3)' : isCon ? 'rgba(74,222,128,0.3)' :
        'rgba(0,0,0,0.2)';
        wireCtx.shadowBlur = isSel ? 20 : isCon ? 16 : 8;
        wireCtx.fill();
        wireCtx.shadowBlur = 0;
        wireCtx.strokeStyle = isSel ? '#2563eb' : isCon ? '#16a34a' : '#94a3b8';
        wireCtx.lineWidth = isSel ? 3.5 : 2.5;
        wireCtx.stroke();

        wireCtx.fillStyle = isSel ? '#1e40af' : isCon ? '#166534' : '#1e293b';
        wireCtx.font = isSel ? 'bold 13px sans-serif' : 'bold 11px sans-serif';
        wireCtx.textAlign = 'center';
        wireCtx.textBaseline = 'middle';
        wireCtx.fillText(t.label, t.x, t.y);

        if (!isSel && !isCon) {
            wireCtx.strokeStyle = 'rgba(148,163,184,0.15)';
            wireCtx.lineWidth = 1;
            wireCtx.beginPath();
            wireCtx.arc(t.x, t.y, TERM_R + 6, 0, 2 * Math.PI);
            wireCtx.stroke();
        }
    }
}

function startCircuitGame() {
    circuitLevelIndex = state.wire.level;
    circuitConnections = [];
    circuitSelected = null;
    circuitLightOn = false;
    const level = WIRE_LEVEL_CONFIGS[circuitLevelIndex];
    document.getElementById('wireInstruction').innerHTML = level ? '🔌 Connect correctly to <span>turn on</span> the light.' :
        'Connect correctly.';
    document.getElementById('wireGameLevel').textContent = 'Level ' + WIRE_LEVELS[circuitLevelIndex].id;
    resetHearts('wireGameStars');
    startTimer('wireGameTimer');
    document.getElementById('wireFeedback').classList.add('hidden');
    document.getElementById('wireFeedbackOverlay').classList.remove('show');
    document.querySelector('.circuit-area').classList.remove('glow-active');
    document.getElementById('wireFbNext').style.display = 'none';
    state.wireClueUsed = false;
    document.getElementById('wireClueBtn').disabled = false;
    drawCircuit();
}

// CLUE BUTTON
document.getElementById('wireClueBtn').addEventListener('click', function() {
    if (state.wireClueUsed) return;
    state.wireClueUsed = true;
    this.disabled = true;

    const level = WIRE_LEVEL_CONFIGS[circuitLevelIndex];
    const clueText = level.clue || 'Connect the terminals in the correct order to complete the circuit.';

    const fb = document.getElementById('wireFeedback');
    fb.textContent = '💡 CLUE: ' + clueText;
    fb.className = 'wire-feedback info';
    fb.classList.remove('hidden');

    setTimeout(() => {
        if (!fb.classList.contains('hidden') && fb.textContent.includes('CLUE')) {
            fb.textContent = '🔗 Connect the terminals.';
            fb.className = 'wire-feedback info';
        }
    }, 8000);
});

wireCanvas.addEventListener('click', (e) => {
    const clicked = getCircuitTerminalAt(e.clientX, e.clientY);
    if (!clicked) { circuitSelected = null;
        drawCircuit(); return; }
    if (circuitSelected) {
        if (circuitSelected.id === clicked.id) { circuitSelected = null;
            drawCircuit(); return; }
        circuitToggleConnection(circuitSelected, clicked);
        circuitSelected = null;
        updateCircuitFeedback();
        drawCircuit();
        return;
    }
    circuitSelected = clicked;
    drawCircuit();
    const fb = document.getElementById('wireFeedback');
    fb.textContent = `⚡ Selected ${clicked.id} — click another terminal.`;
    fb.className = 'wire-feedback info';
    fb.classList.remove('hidden');
});

function updateCircuitFeedback() {
    circuitLightOn = circuitCheckComplete();
    const fb = document.getElementById('wireFeedback');
    if (circuitLightOn) {
        fb.textContent = '✅ Correct! Light is ON!';
        fb.className = 'wire-feedback success';
        document.querySelector('.circuit-area').classList.add('glow-active');
    } else {
        document.querySelector('.circuit-area').classList.remove('glow-active');
        if (circuitConnections.length > 0) {
            fb.textContent = '⚡ Incomplete. Keep connecting!';
            fb.className = 'wire-feedback info';
        } else {
            fb.textContent = '🔗 Connect the terminals.';
            fb.className = 'wire-feedback info';
        }
    }
    fb.classList.remove('hidden');
    drawCircuit();
}

document.getElementById('wireSubmitBtn').addEventListener('click', () => {
    if (state.wire.phase !== 'PLAYING') return;
    circuitLightOn = circuitCheckComplete();
    if (circuitLightOn) {
        if (!transition('wire', 'PASS')) return;
        const fb = document.getElementById('wireFeedback');
        fb.textContent = '✅ PERFECT! Circuit is correctly installed!';
        fb.className = 'wire-feedback success';
        document.querySelector('.circuit-area').classList.add('glow-active');
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('wireFbIcon').textContent = '🎉';
        document.getElementById('wireFbTitle').textContent = 'Level Complete!';
        document.getElementById('wireFbTitle').className = 'fb-title gold';
        document.getElementById('wireFbSub').textContent = 'Great job! Circuit is correct.';
        document.getElementById('wireFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#f5a623;">${xp + 30} XP</span></div>`;
        state.wire.completed.add(WIRE_LEVELS[circuitLevelIndex].id);
        keepHearts('wire', WIRE_LEVELS[circuitLevelIndex].id);
        notifyEimProgress('wire', WIRE_LEVELS, xp + 30);
        document.getElementById('wireFbNext').style.display = (circuitLevelIndex < WIRE_LEVELS.length -
            1) ? '' : 'none';
        document.getElementById('wireFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
        document.getElementById('wireFeedbackOverlay').classList.add('show');
    } else {
        const fb = document.getElementById('wireFeedback');
        fb.textContent = '❌ Circuit incorrect. Check your connections.';
        if (loseHeart()) showOutOfHearts('wire', 'wireFeedbackOverlay', 'wire');
        fb.className = 'wire-feedback error';
        document.querySelector('.circuit-area').classList.remove('glow-active');
    }
});

document.getElementById('wireResetBtn').addEventListener('click', () => {
    circuitConnections = [];
    circuitSelected = null;
    circuitLightOn = false;
    document.querySelector('.circuit-area').classList.remove('glow-active');
    const fb = document.getElementById('wireFeedback');
    fb.textContent = '🔄 Circuit reset. Connect the terminals!';
    fb.className = 'wire-feedback info';
    fb.classList.remove('hidden');
    drawCircuit();
});

document.getElementById('wireFbReplay').addEventListener('click', () => {
    if (!transition('wire', state.wire.phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY')) return;
    document.getElementById('wireFeedbackOverlay').classList.remove('show');
    startCircuitGame();
});

document.getElementById('wireFbNext').addEventListener('click', () => {
    if (!transition('wire', 'NEXT')) return;
    document.getElementById('wireFeedbackOverlay').classList.remove('show');
    if (circuitLevelIndex < WIRE_LEVELS.length - 1) {
        state.wire.level++;
        document.getElementById('wire-game').style.display = 'none';
        document.getElementById('wire-select').style.display = '';
        renderLevelGrid(document.getElementById('wireLevelGrid'), WIRE_LEVELS, state.wire.completed,
            state.wire.level);
    } else {
        document.getElementById('wire-game').style.display = 'none';
        document.getElementById('wire-select').style.display = '';
        updateMainMenu();
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAULT FINDER — Shuffled choices & clearer UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fault Finder inner steps: initial → inspected → repaired
const FAULT_FSM = {
    initial:   { INSPECT: 'inspected', RESET: 'initial' },
    inspected: { REPAIR: 'repaired', RESET: 'initial' },
    repaired:  { RESET: 'initial' }
};
let faultState = 'initial';
function faultTransition(ev) {
    const next = FAULT_FSM[faultState]?.[ev];
    if (!next) return false;
    faultState = next;
    return true;
}
let faultLevelData = null;
let faultSelectedOption = -1;
let faultChoiceLocked = false;

function initFaultFinder() {
    state.fault.phase = 'SELECT';
    const status = getUnlockStatus();
    if (!status.fault.unlocked) { showScreen('screen-main'); return; }
    const container = document.getElementById('faultLevelGrid');
    renderLevelGrid(container, FAULT_LEVELS, state.fault.completed, state.fault.level);
    document.getElementById('fault-select').style.display = '';
    document.getElementById('fault-instructions').style.display = 'none';
    document.getElementById('fault-game').style.display = 'none';
    document.getElementById('faultFeedback').classList.remove('show');
    renderFaultProgressDots();
}

function renderFaultProgressDots() {
    const container = document.getElementById('faultProgressDots');
    container.innerHTML = '';
    const total = FAULT_LEVELS.length;
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        const levelId = FAULT_LEVELS[i].id;
        if (state.fault.completed.has(levelId)) dot.classList.add('done');
        if (i === state.fault.level) dot.classList.add('current');
        container.appendChild(dot);
    }
}

document.getElementById('faultStartBtn').addEventListener('click', () => {
    const lv = state.fault.level;
    const data = FAULT_LEVELS[lv];
    if (!data) return;
    if (!transition('fault', 'START')) return;
    document.getElementById('fault-select').style.display = 'none';
    document.getElementById('fault-instructions').style.display = '';
    const config = FAULT_CONFIGS[lv];
    document.getElementById('faultInstrObj').textContent = `🔎 Level ${data.id}: ${data.name}`;
    document.getElementById('faultInstrDetail').textContent = config ? config.desc :
    'Find and fix the circuit fault.';
});

document.getElementById('faultPlayBtn').addEventListener('click', () => {
    if (!transition('fault', 'PLAY')) return;
    document.getElementById('fault-instructions').style.display = 'none';
    document.getElementById('fault-game').style.display = '';
    startFaultGame();
});

function startFaultGame() {
    const lv = state.fault.level;
    const config = FAULT_CONFIGS[lv];
    if (!config) {
        const fb = document.getElementById('faultFeedback');
        document.getElementById('faultFbIcon').textContent = '🚧';
        document.getElementById('faultFbTitle').textContent = 'Coming Soon!';
        document.getElementById('faultFbTitle').className = 'fb-title gold';
        document.getElementById('faultFbSub').textContent = 'This level is under construction.';
        document.getElementById('faultFbNext').style.display = 'none';
        document.getElementById('faultFbReplay').textContent = '↻ BACK';
        fb.classList.add('show');
        return;
    }

    faultLevelData = config;
    faultTransition('RESET');
    faultSelectedOption = -1;
    faultChoiceLocked = false;
    document.getElementById('faultFeedback').classList.remove('show');

    const choicesContainer = document.getElementById('faultChoices');
    choicesContainer.style.display = 'none';
    document.getElementById('faultOptionsContainer').innerHTML = '';
    document.getElementById('faultChoiceFeedback').textContent = '';
    document.getElementById('faultChoiceFeedback').className = 'choice-feedback';

    document.getElementById('faultLevelName').textContent = `Level ${FAULT_LEVELS[lv].id}: ${config.title}`;
    document.getElementById('faultLevelDesc').textContent = config.desc;

    const problemBox = document.getElementById('faultProblemBox');
    problemBox.textContent = config.problemText || '❓ What\'s wrong? Tap INSPECT to find out.';
    problemBox.className = 'fault-problem-box';

    const circuitEl = document.getElementById('faultCircuitDisplay');
    circuitEl.innerHTML = config.diagram;

    const statusBar = document.getElementById('faultStatusBar');
    statusBar.className = 'fault-status-bar fault-active';
    document.getElementById('faultStatusText').textContent = `⚠️ Fault: ${config.desc}`;

    const box = document.getElementById('faultCircuitBox');
    box.className = 'fault-circuit-box';

    document.getElementById('faultInspectBtn').disabled = false;
    document.getElementById('faultRepairBtn').disabled = true;

    renderFaultProgressDots();

    document.getElementById('faultGameLevel').textContent = 'Level ' + FAULT_LEVELS[state.fault.level].id;
    resetHearts('faultGameStars');
    startTimer('faultGameTimer');

    document.getElementById('faultFeedback').classList.remove('show');
    const choicesDiv = document.getElementById('faultChoices');
    choicesDiv.style.display = 'none';
    document.getElementById('faultFbNext').style.display = 'none';
}

document.getElementById('faultInspectBtn').addEventListener('click', function() {
    if (faultState === 'repaired') return;
    const config = faultLevelData;
    if (!config) return;

    if (!faultTransition('INSPECT')) return;

    const problemBox = document.getElementById('faultProblemBox');
    problemBox.textContent = config.inspectMsg;
    problemBox.className = 'fault-problem-box revealed';

    const circuitEl = document.getElementById('faultCircuitDisplay');
    if (config.inspectHighlight) {
        config.inspectHighlight(circuitEl);
    }

    const statusBar = document.getElementById('faultStatusBar');
    statusBar.className = 'fault-status-bar fault-revealed';
    document.getElementById('faultStatusText').textContent = config.inspectMsg;

    document.getElementById('faultInspectBtn').disabled = true;
    document.getElementById('faultRepairBtn').disabled = true;

    document.getElementById('faultCircuitBox').style.borderColor = '#f5a623';

    const choicesContainer = document.getElementById('faultChoices');
    choicesContainer.style.display = 'block';
    const optionsContainer = document.getElementById('faultOptionsContainer');
    optionsContainer.innerHTML = '';
    document.getElementById('faultChoiceFeedback').textContent = '';
    document.getElementById('faultChoiceFeedback').className = 'choice-feedback';

    const shuffledOptions = shuffle([...config.options]);
    const correctIndex = shuffledOptions.indexOf(config.options[config.correctOption]);

    shuffledOptions.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = opt;
        btn.dataset.index = idx;
        btn.dataset.isCorrect = (opt === config.options[config.correctOption]);
        btn.addEventListener('click', function() {
            if (faultChoiceLocked) return;
            const isCorrect = this.dataset.isCorrect === 'true';
            handleFaultChoiceSelection(this, isCorrect);
        });
        optionsContainer.appendChild(btn);
    });

    faultSelectedOption = -1;
    faultChoiceLocked = false;
});

function handleFaultChoiceSelection(btn, isCorrect) {
    if (state.fault.phase !== 'PLAYING') return;
    const config = faultLevelData;
    if (!config) return;
    const buttons = document.querySelectorAll('#faultOptionsContainer .choice-btn');
    const feedback = document.getElementById('faultChoiceFeedback');

    buttons.forEach(b => b.classList.remove('selected-correct', 'selected-wrong'));

    if (isCorrect) {
        btn.classList.add('selected-correct');
        feedback.textContent = '✅ Correct! You can now REPAIR the circuit.';
        feedback.className = 'choice-feedback success';
        faultSelectedOption = config.options.indexOf(btn.textContent);
        faultChoiceLocked = true;
        document.getElementById('faultRepairBtn').disabled = false;
        const statusBar = document.getElementById('faultStatusBar');
        statusBar.className = 'fault-status-bar fault-revealed';
        document.getElementById('faultStatusText').textContent = '✅ Repair action selected. Tap REPAIR to fix.';
        buttons.forEach(b => b.disabled = true);
    } else {
        btn.classList.add('selected-wrong');
        if (loseHeart()) { showOutOfHearts('fault', 'faultFeedback', 'fault', true); return; }
        feedback.textContent = '❌ Wrong action. Try again.';
        feedback.className = 'choice-feedback error';
        setTimeout(() => {
            btn.classList.remove('selected-wrong');
            feedback.textContent = '❌ Wrong action. Try again.';
            feedback.className = 'choice-feedback error';
        }, 1000);
    }
}

document.getElementById('faultRepairBtn').addEventListener('click', function() {
    if (faultState === 'repaired') return;
    if (faultSelectedOption === -1) return;

    const config = faultLevelData;
    if (!config) return;

    if (!faultTransition('REPAIR')) return;
    if (!transition('fault', 'PASS')) return;

    const problemBox = document.getElementById('faultProblemBox');
    problemBox.textContent = config.repairMsg;
    problemBox.className = 'fault-problem-box fixed';

    const circuitEl = document.getElementById('faultCircuitDisplay');
    circuitEl.innerHTML = config.fixedDiagram;

    const statusBar = document.getElementById('faultStatusBar');
    statusBar.className = 'fault-status-bar fault-fixed';
    document.getElementById('faultStatusText').textContent = config.repairMsg;

    const box = document.getElementById('faultCircuitBox');
    box.className = 'fault-circuit-box fixed';

    document.getElementById('faultInspectBtn').disabled = true;
    document.getElementById('faultRepairBtn').disabled = true;

    document.getElementById('faultChoices').style.display = 'none';

    const lv = state.fault.level;
    state.fault.completed.add(FAULT_LEVELS[lv].id);
    updateMainMenu();
    renderFaultProgressDots();

    setTimeout(() => {
        showFaultComplete(true);
    }, 500);
});

function showFaultComplete(success) {
    stopTimer();
    const fb = document.getElementById('faultFeedback');
    const config = faultLevelData;
    if (success && config) {
        const timeBonus = Math.max(0, 60 - state.seconds);
        const accuracyBonus = (faultSelectedOption === config.correctOption) ? 30 : 10;
        const totalXP = timeBonus + accuracyBonus + 20;
        document.getElementById('faultFbIcon').textContent = '✅';
        document.getElementById('faultFbTitle').textContent = 'Fixed!';
        document.getElementById('faultFbTitle').className = 'fb-title green';
        document.getElementById('faultFbSub').textContent = config.successMsg;
        document.getElementById('fbTimeBonus').textContent = `+${timeBonus} XP`;
        document.getElementById('fbAccuracyBonus').textContent = `+${accuracyBonus} XP`;
        document.getElementById('fbTotalXP').textContent = `${totalXP} XP`;
        document.getElementById('faultFbNext').style.display = (state.fault.level < FAULT_LEVELS.length -
            1) ? '' : 'none';
        document.getElementById('faultFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
        keepHearts('fault', FAULT_LEVELS[state.fault.level].id);
        document.getElementById('faultFbScore').style.display = '';
        document.getElementById('fbHearts').textContent = heartsStr();
        notifyEimProgress('fault', FAULT_LEVELS, totalXP);
    }
    fb.classList.add('show');
}

document.getElementById('faultFbReplay').addEventListener('click', () => {
    const isBack = document.getElementById('faultFbReplay').textContent === '↻ BACK';
    if (!transition('fault', isBack ? 'EXIT' : (state.fault.phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY'))) return;
    document.getElementById('faultFeedback').classList.remove('show');
    if (document.getElementById('faultFbReplay').textContent === '↻ BACK') {
        document.getElementById('fault-game').style.display = 'none';
        document.getElementById('fault-select').style.display = '';
        return;
    }
    const lv = state.fault.level;
    if (state.fault.completed.has(FAULT_LEVELS[lv].id)) {
        state.fault.completed.delete(FAULT_LEVELS[lv].id);
        updateMainMenu();
        startFaultGame();
    } else {
        startFaultGame();
    }
});

document.getElementById('faultFbNext').addEventListener('click', () => {
    if (!transition('fault', 'NEXT')) return;
    document.getElementById('faultFeedback').classList.remove('show');
    if (state.fault.level < FAULT_LEVELS.length - 1) {
        state.fault.level++;
        document.getElementById('fault-game').style.display = 'none';
        document.getElementById('fault-select').style.display = '';
        renderLevelGrid(document.getElementById('faultLevelGrid'), FAULT_LEVELS, state.fault.completed,
            state.fault.level);
        renderFaultProgressDots();
    } else {
        document.getElementById('fault-game').style.display = 'none';
        document.getElementById('fault-select').style.display = '';
        updateMainMenu();
        renderFaultProgressDots();
    }
});

document.getElementById('faultResetBtn').addEventListener('click', () => {
    if (!transition('fault', 'RESTART')) return;
    startFaultGame();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAFETY CHECK — NO ANSWERS REVEALED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let safetySelected = new Set();
let safetySubmitted = false;

function initSafetyCheck() {
    state.code.phase = 'SELECT';
    const status = getUnlockStatus();
    if (!status.code.unlocked) { showScreen('screen-main'); return; }
    const container = document.getElementById('codeLevelGrid');
    renderLevelGrid(container, SAFETY_LEVELS, state.code.completed, state.code.level);
    document.getElementById('code-select').style.display = '';
    document.getElementById('code-instructions').style.display = 'none';
    document.getElementById('code-game').style.display = 'none';
    document.getElementById('codeFeedback').classList.remove('show');
}

document.getElementById('codeStartBtn').addEventListener('click', () => {
    const lv = state.code.level;
    const data = SAFETY_LEVELS[lv];
    if (!data) return;
    if (!transition('code', 'START')) return;
    document.getElementById('code-select').style.display = 'none';
    document.getElementById('code-instructions').style.display = '';
    document.getElementById('codeInstrObj').textContent = `🛡️ Level ${data.id}: ${data.name}`;
    document.getElementById('codeInstrDetail').textContent =
        'Review the Risk Assessment, then select the correct PPE items. Tap CHECK to submit your answer.';
});

document.getElementById('codePlayBtn').addEventListener('click', () => {
    if (!transition('code', 'PLAY')) return;
    document.getElementById('code-instructions').style.display = 'none';
    document.getElementById('code-game').style.display = '';
    startSafetyGame();
});

function updateSafetyCount() {
    if (safetySubmitted) return;
    const cfg = SAFETY_CONFIGS[state.code.level];
    if (!cfg) return;
    const need = cfg.correctPPE.length;
    const fb = document.getElementById('safetyFeedback');
    fb.textContent = `Select ${need} correct PPE items (${safetySelected.size}/${need} selected).`;
    fb.className = 'safety-feedback-text info';
}

function startSafetyGame() {
    safetySelected = new Set();
    safetySubmitted = false;

    const lv = state.code.level;
    const config = SAFETY_CONFIGS[lv];
    if (!config) {
        const fb = document.getElementById('codeFeedback');
        document.getElementById('codeFbIcon').textContent = '🚧';
        document.getElementById('codeFbTitle').textContent = 'Coming Soon!';
        document.getElementById('codeFbTitle').className = 'fb-title gold';
        document.getElementById('codeFbSub').textContent = 'This level is under construction.';
        document.getElementById('codeFbNext').style.display = 'none';
        document.getElementById('codeFbReplay').textContent = '↻ BACK';
        fb.classList.add('show');
        return;
    }

    document.getElementById('safetyLevelName').textContent = SAFETY_LEVELS[lv].name;

    document.getElementById('safetyHazard').textContent = `Hazard: ${config.hazard}`;
    const riskEl = document.getElementById('safetyRiskRating');
    riskEl.textContent = config.riskRating;
    riskEl.className = 'risk-value ' + config.riskClass;
    document.getElementById('safetyControl').textContent = config.control;

    const grid = document.getElementById('safetyPPEGrid');
    grid.innerHTML = '';
    const shuffledPPE = shuffle([...config.allPPE]);
    shuffledPPE.forEach(item => {
        const el = document.createElement('span');
        el.className = 'ppe-item';
        el.dataset.item = item;
        el.textContent = item;
        el.addEventListener('click', function() {
            if (safetySubmitted) return;
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                safetySelected.add(item);
            } else {
                safetySelected.delete(item);
            }
            updateSafetyCount();
        });
        grid.appendChild(el);
    });

    const fb = document.getElementById('safetyFeedback');
    updateSafetyCount();

    document.getElementById('safetySubmitBtn').textContent = '✅ CHECK';
    document.getElementById('safetySubmitBtn').disabled = false;

    document.getElementById('codeGameLevel').textContent = 'Level ' + SAFETY_LEVELS[state.code.level].id;
    resetHearts('codeGameStars');
    startTimer('codeGameTimer');
    document.getElementById('codeFeedback').classList.remove('show');
    document.getElementById('codeFbNext').style.display = 'none';

    safetySubmitted = false;
}

document.getElementById('safetySubmitBtn').addEventListener('click', function() {
    if (state.code.phase !== 'PLAYING') return;
    if (safetySubmitted) return;

    const lv = state.code.level;
    const config = SAFETY_CONFIGS[lv];
    if (!config) return;

    const correct = new Set(config.correctPPE);
    const selected = safetySelected;

    const allCorrectSelected = config.correctPPE.every(item => selected.has(item));
    const hasIncorrect = Array.from(selected).some(item => !correct.has(item));

    const fb = document.getElementById('safetyFeedback');
    const items = document.querySelectorAll('#safetyPPEGrid .ppe-item');

    if (allCorrectSelected && !hasIncorrect) {
        if (!transition('code', 'PASS')) return;
        safetySubmitted = true;
        fb.textContent = '✅ Perfect! All required PPE items selected. Level complete!';
        fb.className = 'safety-feedback-text success';
        this.disabled = true;
        this.textContent = '✅ COMPLETE';

        // DO NOT highlight correct items - no visual feedback on individual items
        items.forEach(el => {
            el.disabled = true;
            // Remove selected class so they don't show gold anymore
            el.classList.remove('selected');
        });

        state.code.completed.add(SAFETY_LEVELS[lv].id);
        updateMainMenu();

        setTimeout(() => {
            showSafetyComplete(true);
        }, 600);

    } else {
        // Generic error message - NO hints about which items are wrong
        fb.textContent = '❌ Incorrect selection. Please review the hazard and try again.';
        if (loseHeart()) showOutOfHearts('code', 'codeFeedback', 'code');
        fb.className = 'safety-feedback-text error';

        // DO NOT highlight any items as correct or wrong
        // Just a simple shake effect on the button to indicate error
        this.classList.add('shake');
        setTimeout(() => this.classList.remove('shake'), 500);

        // Reset all selections so user starts fresh
        items.forEach(el => {
            el.classList.remove('selected');
        });
        safetySelected = new Set();
    }
});

function showSafetyComplete(success) {
    stopTimer();
    const fb = document.getElementById('codeFeedback');
    const lv = state.code.level;
    if (success) {
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('codeFbIcon').textContent = '🎉';
        document.getElementById('codeFbTitle').textContent = 'Level Complete!';
        document.getElementById('codeFbTitle').className = 'fb-title gold';
        document.getElementById('codeFbSub').textContent =
        'Great safety knowledge! You selected the correct PPE.';
        document.getElementById('codeFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#f5a623;">${xp + 30} XP</span></div>`;
        document.getElementById('codeFbNext').style.display = (state.code.level < SAFETY_LEVELS.length -
            1) ? '' : 'none';
        document.getElementById('codeFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
        keepHearts('code', SAFETY_LEVELS[lv].id);
        notifyEimProgress('code', SAFETY_LEVELS, xp + 30);
    }
    fb.classList.add('show');
}

document.getElementById('codeFbReplay').addEventListener('click', () => {
    const isBack = document.getElementById('codeFbReplay').textContent === '↻ BACK';
    if (!transition('code', isBack ? 'EXIT' : (state.code.phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY'))) return;
    document.getElementById('codeFeedback').classList.remove('show');
    if (document.getElementById('codeFbReplay').textContent === '↻ BACK') {
        document.getElementById('code-game').style.display = 'none';
        document.getElementById('code-select').style.display = '';
        return;
    }
    const lv = state.code.level;
    if (state.code.completed.has(SAFETY_LEVELS[lv].id)) {
        state.code.completed.delete(SAFETY_LEVELS[lv].id);
        updateMainMenu();
        startSafetyGame();
    } else {
        startSafetyGame();
    }
});

document.getElementById('codeFbNext').addEventListener('click', () => {
    if (!transition('code', 'NEXT')) return;
    document.getElementById('codeFeedback').classList.remove('show');
    if (state.code.level < SAFETY_LEVELS.length - 1) {
        state.code.level++;
        document.getElementById('code-game').style.display = 'none';
        document.getElementById('code-select').style.display = '';
        renderLevelGrid(document.getElementById('codeLevelGrid'), SAFETY_LEVELS, state.code.completed,
            state.code.level);
    } else {
        document.getElementById('code-game').style.display = 'none';
        document.getElementById('code-select').style.display = '';
        updateMainMenu();
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('touchmove', (e) => {
    if (document.getElementById('dragGhost').style.display === 'block') { e.preventDefault(); }
}, { passive: false });

updateMainMenu();
if (EMBEDDED && ['symbol', 'wire', 'fault', 'code'].includes(AUTOSTART_GAME)) {
    if (AUTOSTART_GAME === 'symbol') initSymbolSavvy();
    else if (AUTOSTART_GAME === 'wire') initWireWizard();
    else if (AUTOSTART_GAME === 'fault') initFaultFinder();
    else if (AUTOSTART_GAME === 'code') initSafetyCheck();
    showScreen('screen-' + AUTOSTART_GAME);
    try { (window.parent || window).postMessage({ type: 'EIM_GAME_READY', game: AUTOSTART_GAME }, '*'); } catch (e) {}
} else {
    showScreen('screen-main');
}
console.log('⚡ EIM Circuit Master loaded — Safety Check: No answers revealed on wrong attempts!');
