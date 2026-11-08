// EMBEDDED MODE
const CSS_PARAMS = new URLSearchParams(window.location.search);
const AUTOSTART_GAME = CSS_PARAMS.get('game');
const EMBEDDED = CSS_PARAMS.get('embed') === '1';

// 🔊 SOUND ENGINE (generated WAV, HTML Audio)
const SFX = (() => {
    const SR = 22050, audio = {}; let muted = false, unlocked = false;
    function wav(notes) {
        const len = Math.floor((Math.max(...notes.map(n => n.t + n.d)) + .1) * SR), b = new Float32Array(len);
        notes.forEach(n => {
            let ph = 0; const s0 = Math.floor(n.t * SR), sn = Math.floor(n.d * SR);
            for (let i = 0; i < sn && s0 + i < len; i++) {
                const x = i / sn; ph += n.f / SR; const p = ph % 1;
                const w = n.w === 's' ? (p < .5 ? 1 : -1) : n.w === 'z' ? 2 * p - 1 : Math.sin(6.2832 * p);
                b[s0 + i] += w * Math.min(1, i / (SR * .01)) * (1 - x) * (n.v || .6);
            }
        });
        const d = new DataView(new ArrayBuffer(44 + len * 2));
        const W = (o, s) => [...s].forEach((c, i) => d.setUint8(o + i, c.charCodeAt(0)));
        W(0, 'RIFF'); d.setUint32(4, 36 + len * 2, true); W(8, 'WAVEfmt '); d.setUint32(16, 16, true);
        d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, SR, true); d.setUint32(28, SR * 2, true);
        d.setUint16(32, 2, true); d.setUint16(34, 16, true); W(36, 'data'); d.setUint32(40, len * 2, true);
        for (let i = 0; i < len; i++) d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, b[i])) * 32767, true);
        return URL.createObjectURL(new Blob([d], { type: 'audio/wav' }));
    }
    const DEF = {
        correct: [{f:784,t:0,d:.15,w:'s'},{f:1175,t:.12,d:.35,w:'s'}],
        wrong: [{f:220,t:0,d:.2,w:'z'},{f:140,t:.18,d:.4,w:'z'}],
        fanfare: [{f:523,t:0,d:.25,w:'s'},{f:659,t:.13,d:.25,w:'s'},{f:784,t:.26,d:.25,w:'s'},{f:1047,t:.39,d:.25,w:'s'},{f:1047,t:.6,d:.7,w:'n'},{f:1319,t:.6,d:.7,w:'n'}],
        gameover: [{f:392,t:0,d:.4,w:'z'},{f:330,t:.25,d:.4,w:'z'},{f:262,t:.5,d:.4,w:'z'},{f:196,t:.75,d:.6,w:'z'}]
    };
    Object.keys(DEF).forEach(k => { audio[k] = new Audio(wav(DEF[k])); audio[k].preload = 'auto'; });
    function unlock() {
        if (unlocked) return; unlocked = true;
        Object.values(audio).forEach(a => {
            a.muted = true; const p = a.play();
            if (p && p.then) p.then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; unlocked = false; });
        });
    }
    ['pointerdown', 'touchstart', 'click'].forEach(e => document.addEventListener(e, unlock, { passive: true }));
    return {
        play(n) { if (muted || !audio[n]) return; try { const a = audio[n]; a.pause(); a.currentTime = 0; a.volume = 1; a.play().catch(err => console.warn('SFX blocked', err)); } catch (e) {} },
        toggle() { muted = !muted; unlock(); if (!muted) this.play('correct'); return muted; }
    };
})();
(function () {
    const b = document.createElement('button'); b.textContent = '🔊';
    b.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(26,35,48,.9);color:#fff;font-size:20px;cursor:pointer;';
    b.onclick = () => { b.textContent = SFX.toggle() ? '🔇' : '🔊'; };
    document.body.appendChild(b);
})();

// 🎵 BACKGROUND MUSIC (generated in-browser, no audio files needed)
const BGM = (() => {
    const SR = 22050, BEAT = 0.6, BARS = 8;
    let audio = null, on = true, started = false, ducked = false;
    const VOL = 0.2, VOL_DUCK = 0.07;

    function build() {
        const chords = [
            { r: 110,    n: [220, 261.63, 329.63] },   // Am
            { r: 87.31,  n: [174.61, 220, 261.63] },   // F
            { r: 130.81, n: [261.63, 329.63, 392] },   // C
            { r: 98,     n: [196, 246.94, 293.66] }    // G
        ];
        const len = Math.floor(BARS * 4 * BEAT * SR);
        const b = new Float32Array(len);
        const tri = p => 2 * Math.abs(2 * p - 1) - 1;
        const sine = p => Math.sin(6.2832 * p);

        function add(f, t, d, v, wave, pad) {
            const s0 = Math.floor(t * SR), sn = Math.floor(d * SR);
            let ph = 0;
            for (let i = 0; i < sn; i++) {
                const x = i / sn;
                ph += f / SR;
                const env = pad ? Math.sin(Math.PI * x)
                                : Math.min(1, i / (SR * 0.01)) * Math.pow(1 - x, 2);
                b[(s0 + i) % len] += wave(ph % 1) * env * v;   // wraps → seamless loop
            }
        }

        for (let bar = 0; bar < BARS; bar++) {
            const c = chords[bar % 4], t0 = bar * 4 * BEAT, oct = bar >= 4 ? 2 : 1;
            for (let k = 0; k < 4; k++) add(c.r, t0 + k * BEAT, BEAT * 0.9, 0.5, sine, false);   // bass
            [0, 1, 2, 1, 0, 1, 2, 1].forEach((ni, k) =>                                          // arp
                add(c.n[ni] * oct, t0 + k * BEAT / 2, 0.45, 0.2, tri, false));
            c.n.forEach(f => add(f, t0, 4 * BEAT, 0.07, sine, true));                            // pad
        }

        let peak = 0;
        for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(b[i]));
        const g = peak ? 0.85 / peak : 1;

        const d = new DataView(new ArrayBuffer(44 + len * 2));
        const W = (o, s) => [...s].forEach((ch, i) => d.setUint8(o + i, ch.charCodeAt(0)));
        W(0, 'RIFF'); d.setUint32(4, 36 + len * 2, true); W(8, 'WAVEfmt '); d.setUint32(16, 16, true);
        d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, SR, true); d.setUint32(28, SR * 2, true);
        d.setUint16(32, 2, true); d.setUint16(34, 16, true); W(36, 'data'); d.setUint32(40, len * 2, true);
        for (let i = 0; i < len; i++) d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, b[i] * g)) * 32767, true);
        return URL.createObjectURL(new Blob([d], { type: 'audio/wav' }));
    }

    function vol() { return ducked ? VOL_DUCK : VOL; }
    function start() {
        if (started) return;
        started = true;
        audio = new Audio(build());
        audio.loop = true;
        audio.volume = vol();
        if (on) audio.play().catch(() => { started = false; });
    }
    ['pointerdown', 'touchstart', 'click'].forEach(e =>
        document.addEventListener(e, start, { passive: true }));
    document.addEventListener('visibilitychange', () => {
        if (!audio) return;
        if (document.hidden) audio.pause(); else if (on) audio.play().catch(() => {});
    });

    return {
        toggle() {
            on = !on; start();
            if (audio) { if (on) audio.play().catch(() => {}); else audio.pause(); }
            return on;
        },
        duck(v) { ducked = v; if (audio) audio.volume = vol(); }   // lower volume during voice calls
    };
})();
(function () {
    const b = document.createElement('button'); b.textContent = '🎵';
    b.style.cssText = 'position:fixed;top:64px;right:12px;z-index:9999;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(26,35,48,.9);color:#fff;font-size:20px;cursor:pointer;';
    b.onclick = () => { b.style.opacity = BGM.toggle() ? '1' : '0.4'; };
    document.body.appendChild(b);
})();

function cssLevelIds(game) {
    if (game === 'live') return LIVE_CALL_DATA.map((_, i) => i);
    return ({ script: SCRIPT_LEVELS, storm: STORM_LEVELS, quality: QUALITY_LEVELS })[game].map(l => l.id);
}

function notifyCssProgress(game, earnedXP) {
    try {
        const gameState = state[game];
        if (!gameState) return;
        const completed = gameState.completed.size;
        const total = (game === 'live') ? LIVE_CALL_DATA.length : 5;
        const hs = heartsSummary(game, cssLevelIds(game), gameState.completed);
        const pct = hs.pct;
        (window.parent || window).postMessage({
            type: 'EIM_MODULE_PROGRESS', game, completed, total, pct,
            earnedXP: earnedXP || 0,
            heartsLeft: hearts.cur, heartsEarned: hs.earned, heartsMax: hs.max,
            moduleComplete: completed >= total
        }, '*');
    } catch (e) { }
}

// ♥ HEARTS
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
    SFX.play(hearts.cur - 1 <= 0 ? 'gameover' : 'wrong');
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
    script: { level: 0, problem: 0, completed: new Set() },
    storm: { level: 0, problem: 0, completed: new Set() },
    quality: { level: 0, problem: 0, completed: new Set() },
    live: { level: 0, problem: 0, scenario: 0, turn: 0, completed: new Set() },
    timerInterval: null,
    seconds: 0,
};
const PROBLEMS_PER_LEVEL = 4;

// ━━━ FINITE STATE MACHINE (one phase per game) ━━━
// SELECT → INSTRUCTIONS → PLAYING ⇄ PROBLEM_DONE → COMPLETE | GAME_OVER
// Phase changes ONLY through transition(); illegal events are ignored.
const GAME_FSM = {
    SELECT:       { START: 'INSTRUCTIONS' },
    INSTRUCTIONS: { PLAY: 'PLAYING', BACK: 'SELECT' },
    PLAYING:      { SOLVED: 'PROBLEM_DONE', PASS: 'COMPLETE', FAIL: 'GAME_OVER', RESTART: 'PLAYING', EXIT: 'SELECT' },
    PROBLEM_DONE: { NEXT_PROBLEM: 'PLAYING', EXIT: 'SELECT' },
    COMPLETE:     { REPLAY: 'PLAYING', NEXT: 'SELECT', EXIT: 'SELECT' },
    GAME_OVER:    { RETRY: 'PLAYING', EXIT: 'SELECT' }
};
['script', 'storm', 'quality', 'live'].forEach(g => { state[g].phase = 'SELECT'; });
function transition(game, ev) {
    const next = GAME_FSM[state[game].phase]?.[ev];
    if (!next) return false;
    state[game].phase = next;
    return true;
}
// replay-button event comes from the phase, never from the button label
function replayEvent(game) {
    const ph = state[game].phase;
    return ph === 'GAME_OVER' ? 'RETRY' : ph === 'COMPLETE' ? 'REPLAY' : 'RESTART';
}

// LEVEL DATA
const SCRIPT_LEVELS = [
    { id: 1, name: 'Opening', stars: 4 },
    { id: 2, name: 'Discovery', stars: 4 },
    { id: 3, name: 'Resolution', stars: 4 },
    { id: 4, name: 'Closing', stars: 4 },
    { id: 5, name: 'Full Flow', stars: 5 },
];

const SCRIPT_DATA = [
    [
        { steps: ['Greet the customer warmly', 'Introduce yourself and the company', 'Ask for the customer\'s name', 'Ask how you may help today', 'Thank them for calling'], hint: 'Think about a real phone greeting: first you say hi, then who you are, then get their name, then ask what they need.' },
        { steps: ['Answer within 3 rings', 'State the company name and your name', 'Verify the customer\'s account details', 'Confirm the reason for the call', 'Set a friendly, helpful tone'], hint: 'Answering the phone comes before introducing yourself, which comes before verifying who they are.' },
        { steps: ['Greet customer by name', 'State purpose of call', 'Ask open-ended questions', 'Listen actively', 'Confirm understanding'], hint: 'Start with the greeting, then say why you\'re speaking, before you start asking and listening.' },
        { steps: ['Welcome the caller', 'Ask a rapport-building question', 'Transition into the reason for the call', 'Note down the concern', 'Assure them you will help'], hint: 'Build rapport first, then move into the real reason for the call, then document, then reassure.' },
    ],
    [
        { steps: ['Identify customer need', 'Ask clarifying questions', 'Paraphrase the issue', 'Confirm pain points', 'Document key details'], hint: 'You must know the need before you can ask clarifying questions about it.' },
        { steps: ['Listen without interrupting', 'Ask probing questions', 'Repeat back what you heard', 'Ask if there is anything else', 'Log the full context'], hint: 'Listening always comes first — you can\'t ask good follow-up questions before you\'ve heard the customer out.' },
        { steps: ['Ask for the account or reference number', 'Pull up the account in the CRM', 'Ask the customer to describe the issue', 'Note the urgency level', 'Confirm you understand correctly'], hint: 'You need the account number before you can look it up in the CRM.' },
        { steps: ['Empathize with the situation', 'Ask targeted follow-up questions', 'Clarify the timeline of the issue', 'Summarize the concern', 'Check for related issues'], hint: 'Empathy comes first to build trust, then you dig deeper with questions.' },
    ],
    [
        { steps: ['Present solution options', 'Explain next steps', 'Set clear expectations', 'Check for understanding', 'Offer additional help'], hint: 'Present the options before you explain what happens next.' },
        { steps: ['Diagnose the root cause', 'Propose the best-fit solution', 'Walk the customer through the fix', 'Verify the issue is resolved', 'Ask if anything else is needed'], hint: 'You must diagnose the problem before you can propose a fix for it.' },
        { steps: ['Check available options in the system', 'Explain the chosen solution clearly', 'Set expectations on timeline', 'Confirm customer agreement', 'Document the resolution'], hint: 'Check the system for options first, then explain the one you chose.' },
        { steps: ['Apologize for the inconvenience', 'Offer a concrete remedy', 'Explain how it will be processed', 'Confirm the customer is satisfied', 'Provide a reference number'], hint: 'Start with the apology, then move into the actual fix you\'re offering.' },
    ],
    [
        { steps: ['Summarize resolution', 'Confirm customer satisfaction', 'Provide reference number', 'Thank the customer', 'End with positive note'], hint: 'Recap what was fixed before you ask if the customer is happy with it.' },
        { steps: ['Recap what was discussed', 'Ask if there is anything else needed', 'Provide any follow-up instructions', 'Thank the customer for their patience', 'Close the call politely'], hint: 'Recap first, then check for other needs, then give any final instructions.' },
        { steps: ['Confirm the issue is fully resolved', 'Offer additional assistance', 'Remind the customer of any next steps', 'Thank them for calling', 'Wish them a good day'], hint: 'Confirm the resolution before offering more help — you need to know it\'s actually fixed first.' },
        { steps: ['Restate the solution provided', 'Ask for final confirmation', 'Log the call outcome', 'Thank the customer sincerely', 'End the call professionally'], hint: 'Restate the solution, then get their confirmation, before you log anything.' },
    ],
    [
        { steps: ['Open with rapport', 'Gather information', 'Diagnose the problem', 'Propose solution', 'Close with commitment'], hint: 'This mirrors the whole call: open, gather info, diagnose, solve, then close.' },
        { steps: ['Greet and verify the customer', 'Listen and clarify the concern', 'Offer the best resolution', 'Confirm satisfaction', 'Thank and close professionally'], hint: 'Verify who they are first, then listen to the concern, before offering any resolution.' },
        { steps: ['Answer promptly and introduce yourself', 'Ask discovery questions', 'Present and explain the fix', 'Check understanding and agreement', 'End the call on a positive note'], hint: 'Introduce yourself, then discover the issue, before presenting any fix.' },
        { steps: ['Welcome the caller warmly', 'Understand their full concern', 'Resolve the issue step by step', 'Summarize what was done', 'Close with a thank-you and reference number'], hint: 'Understand the full concern before you start resolving it step by step.' },
    ],
];

const STORM_LEVELS = [
    { id: 1, name: 'Empathy Basics', stars: 4 },
    { id: 2, name: 'Angry Customer', stars: 4 },
    { id: 3, name: 'Confused Customer', stars: 4 },
    { id: 4, name: 'Urgent Issue', stars: 4 },
    { id: 5, name: 'Complex Escalation', stars: 5 },
];

const STORM_DATA = [
    [
        { scenario: 'A customer sounds mildly annoyed about a short delay in their delivery.', options: ['I understand the wait is frustrating, let me check the status for you right away.', 'Delays happen, there\'s nothing I can do.', 'You\'ll just have to wait it out.', 'That\'s not really my department.'], correct: 0, feedback: '✅ Correct! Acknowledging the frustration first builds trust before you dig into the fix.' },
        { scenario: 'A first-time caller seems unsure how to explain their issue.', options: ['No worries, take your time — I\'m here to help you walk through it.', 'Please hurry up, I have other calls.', 'You need to be clearer.', 'Call back when you know what you want.'], correct: 0, feedback: '✅ Correct! Patience and reassurance put nervous callers at ease.' },
        { scenario: 'A customer apologizes for calling about a "small" issue.', options: ['No issue is too small — I\'m glad you called, let\'s sort it out.', 'Yes, this is a waste of time.', 'You should have looked it up online first.', 'This really isn\'t worth a call.'], correct: 0, feedback: '✅ Correct! Validating the customer\'s concern, however small, keeps trust high.' },
        { scenario: 'A customer thanks you mid-call for being helpful so far.', options: ['You\'re very welcome — let\'s keep going and get this fully sorted.', 'Ok, moving on.', 'That\'s my job.', 'Let\'s not waste time on pleasantries.'], correct: 0, feedback: '✅ Correct! Acknowledging appreciation warmly keeps the positive rapport going.' },
    ],
    [
        { scenario: 'A customer calls, furious about a $50 overcharge on their bill that they\'ve called about twice before.', options: ['Sir, I understand you\'re upset. Let me personally investigate this for you right now.', 'I apologize for the confusion. Let me transfer you to billing.', 'You need to calm down and I will look into this.', 'That charge is correct. Let me explain why.'], correct: 0, feedback: '✅ Perfect! You acknowledged their frustration and took ownership. This de-escalates and builds trust.' },
        { scenario: 'A customer is yelling because their service was disconnected without notice.', options: ['I hear how upsetting this is, and I\'m going to look into why this happened right now.', 'Please stop shouting or I will end the call.', 'That\'s a system issue, not mine to fix.', 'You probably missed a payment.'], correct: 0, feedback: '✅ Correct! Staying calm and taking immediate ownership defuses anger fastest.' },
        { scenario: 'A customer demands to speak to a supervisor immediately, very upset.', options: ['I understand you want this escalated — let me see what I can resolve first, and I\'ll loop in a supervisor if needed.', 'Supervisors are busy, you\'ll have to wait.', 'There\'s no need for that.', 'Fine, hold while I transfer you without explanation.'], correct: 0, feedback: '✅ Correct! Offering to help first while acknowledging the escalation request shows good judgment.' },
        { scenario: 'A customer says this is the third time they\'ve had to call about the same issue.', options: ['I\'m sorry you\'ve had to call multiple times — I\'ll make sure this gets resolved today.', 'That\'s unusual, are you sure?', 'I can only fix what\'s in front of me now.', 'You should have asked for a case number before.'], correct: 0, feedback: '✅ Correct! Owning the repeated inconvenience and committing to resolution rebuilds confidence.' },
    ],
    [
        { scenario: 'A customer is confused about how to use a new feature and feels overwhelmed.', options: ['I understand this can be confusing at first. Let me walk you through it step by step.', 'It\'s really simple, just follow the instructions.', 'You should watch the tutorial video.', 'I\'ll send you the user manual.'], correct: 0, feedback: '✅ Great! You validated their feeling and offered guided support, which reduces anxiety.' },
        { scenario: 'A customer doesn\'t understand the terms on their invoice.', options: ['Let me go through the invoice with you line by line so it\'s clear.', 'It\'s all explained on the invoice already.', 'That\'s standard, everyone gets the same thing.', 'You can look it up on our website.'], correct: 0, feedback: '✅ Correct! Walking through it together resolves confusion far better than pointing elsewhere.' },
        { scenario: 'A customer mixes up two different products and is unsure which one they have.', options: ['Let\'s check your account together so we can confirm exactly which product you have.', 'You should know what you bought.', 'Both products are basically the same.', 'Check your receipt.'], correct: 0, feedback: '✅ Correct! Checking together resolves the confusion directly instead of deflecting.' },
        { scenario: 'A customer keeps asking the same question because they didn\'t understand the first answer.', options: ['Let me explain that a different way to make sure it\'s clear.', 'I already told you that.', 'Please listen more carefully.', 'That\'s the only way I can explain it.'], correct: 0, feedback: '✅ Correct! Rephrasing patiently shows care and improves understanding.' },
    ],
    [
        { scenario: 'A customer is in a rush and needs an immediate solution for a technical issue.', options: ['I\'ll do my best to help you quickly. Let me start by checking your account.', 'You\'ll need to wait for a technician.', 'Why didn\'t you call earlier?', 'That\'s not our problem.'], correct: 0, feedback: '✅ Excellent! You acknowledged their urgency and started working on it immediately.' },
        { scenario: 'A customer says they have an important meeting in 10 minutes and needs their account unlocked now.', options: ['I understand the urgency — let\'s get your account unlocked right away.', 'I can\'t promise anything that fast.', 'You should have called earlier.', 'This will take a while, please be patient.'], correct: 0, feedback: '✅ Correct! Matching urgency with immediate action is exactly what the moment calls for.' },
        { scenario: 'A customer\'s payment failed right before a deadline and they are panicking.', options: ['Let\'s fix this together right now so you don\'t miss your deadline.', 'Payments fail sometimes, try again later.', 'That\'s a common issue, nothing urgent.', 'You\'ll need to contact billing separately.'], correct: 0, feedback: '✅ Correct! Immediate, reassuring action is the right response to a time-sensitive problem.' },
        { scenario: 'A customer says their business operations are affected by a service outage right now.', options: ['This is urgent — let me escalate and prioritize this for you immediately.', 'Outages usually resolve on their own.', 'I\'ll note it, but no promises on timing.', 'You\'ll need to wait for the next update cycle.'], correct: 0, feedback: '✅ Correct! Recognizing business impact and escalating promptly is the right call.' },
    ],
    [
        { scenario: 'A customer is upset because they were promised a callback that never happened.', options: ['I apologize for the missed callback. I will personally ensure you get a follow-up today.', 'That was probably an oversight. I\'ll note it.', 'You should have called us back.', 'I don\'t know why they didn\'t call you.'], correct: 0, feedback: '✅ Outstanding! You took responsibility and provided a concrete action to rebuild trust.' },
        { scenario: 'A customer is escalating because multiple agents couldn\'t solve their complex problem.', options: ['I understand how frustrating this must be. I am a senior agent and I will personally own this case.', 'Let me transfer you to another department.', 'I\'ll try to help but no promises.', 'You might need to speak with a manager.'], correct: 0, feedback: '✅ Exceptional! You showed empathy, authority, and commitment — exactly what they needed.' },
        { scenario: 'A long-time customer threatens to cancel after a series of repeated issues.', options: ['I completely understand your frustration after everything you\'ve been through — let me make this right.', 'We\'re sorry to see you go, I\'ll process the cancellation.', 'These things happen with any provider.', 'I\'ll transfer you to retention.'], correct: 0, feedback: '✅ Correct! Owning the history and committing to fix it shows real accountability.' },
        { scenario: 'A customer\'s issue involves two departments pointing fingers at each other.', options: ['I\'ll take ownership of coordinating between both teams so you don\'t have to.', 'That\'s between those two departments, not me.', 'You\'ll need to call each department separately.', 'I can\'t do anything about interdepartmental issues.'], correct: 0, feedback: '✅ Correct! Taking end-to-end ownership is exactly what a complex escalation needs.' },
    ],
];

const QUALITY_LEVELS = [
    { id: 1, name: 'QA Basics', stars: 4 },
    { id: 2, name: 'Compliance', stars: 4 },
    { id: 3, name: 'Metrics', stars: 4 },
    { id: 4, name: 'Process', stars: 4 },
    { id: 5, name: 'Advanced QA', stars: 5 },
];

const QUALITY_DATA = [
    [
        { question: 'What is the first step when handling a customer complaint?', options: ['Apologize and acknowledge the issue', 'Transfer to a manager', 'Blame the system', 'Promise a refund'], correct: 0 },
        { question: 'What is the ideal tone to use with an upset customer?', options: ['Calm, empathetic, and professional', 'Firm and dismissive', 'Rushed and short', 'Sarcastic'], correct: 0 },
        { question: 'What should you do before ending any call?', options: ['Confirm the issue is resolved and ask if there\'s anything else', 'Hang up immediately once the main issue is done', 'Ask the customer to call back later', 'Skip the closing entirely'], correct: 0 },
        { question: 'Why is active listening important in a contact center?', options: ['It ensures you understand and address the actual concern', 'It makes the call longer', 'It is only needed for VIP customers', 'It is optional'], correct: 0 },
    ],
    [
        { question: 'Which of these is a required compliance statement?', options: ['This call is being recorded for quality purposes', 'We are the best company', 'I will fix everything', 'Please hold'], correct: 0 },
        { question: 'What should you do with a customer\'s sensitive personal information?', options: ['Verify identity before discussing account details, per data privacy policy', 'Share it with anyone who asks', 'Read it out loud regardless of verification', 'Post it in team chat for reference'], correct: 0 },
        { question: 'What is required before offering a refund or discount outside policy?', options: ['Get supervisor or authorized approval first', 'Just offer it to keep the customer happy', 'Never mention refunds at all', 'Give the maximum discount automatically'], correct: 0 },
        { question: 'What should you do if a customer asks for something outside your authority?', options: ['Explain your limits and escalate appropriately', 'Promise it anyway to end the call', 'Say it\'s impossible without checking', 'Ignore the request'], correct: 0 },
    ],
    [
        { question: 'What is the target Average Handling Time (AHT) goal?', options: ['Under 6 minutes', 'Under 10 minutes', 'As long as needed', 'Under 3 minutes'], correct: 0 },
        { question: 'What does "First Call Resolution" (FCR) measure?', options: ['Whether the issue is resolved on the first contact', 'How fast the agent answers the phone', 'How many calls an agent takes per day', 'How long the customer waits on hold'], correct: 0 },
        { question: 'Why is Customer Satisfaction (CSAT) score important?', options: ['It reflects how satisfied customers are with the service received', 'It only matters for management reports', 'It has no impact on performance reviews', 'It measures call duration only'], correct: 0 },
        { question: 'What is Average Speed of Answer (ASA)?', options: ['The average time it takes to answer an incoming call', 'The average time to resolve an issue', 'The number of calls per agent', 'The customer\'s wait time after resolution'], correct: 0 },
    ],
    [
        { question: 'What should you do when you don\'t know an answer?', options: ['Put the customer on hold and find the answer', 'Make up an answer', 'Transfer the call', 'Tell the customer to call back'], correct: 0 },
        { question: 'What is the correct process before transferring a call?', options: ['Inform the customer and provide context to the next agent', 'Transfer immediately without explanation', 'Ask the customer to repeat everything to the next agent', 'Hang up and let them call back'], correct: 0 },
        { question: 'What should be documented after every customer interaction?', options: ['A clear summary of the issue and resolution in the CRM', 'Nothing, verbal handling is enough', 'Only the customer\'s name', 'Only escalated cases'], correct: 0 },
        { question: 'What is the proper way to place a customer on hold?', options: ['Ask permission, explain why, and check back periodically', 'Put them on hold without saying anything', 'Leave them on hold indefinitely', 'Transfer without placing on hold'], correct: 0 },
    ],
    [
        { question: 'How often should you summarize the conversation?', options: ['At key points and at the end of the call', 'Only at the beginning', 'Only at the end', 'Never'], correct: 0 },
        { question: 'What is the best practice when a customer becomes abusive?', options: ['Stay professional, set boundaries, and follow the escalation protocol', 'Match their tone to assert yourself', 'Hang up immediately without warning', 'Argue back to defend yourself'], correct: 0 },
        { question: 'Why is quality monitoring (call scoring) conducted?', options: ['To ensure consistent service quality and identify coaching opportunities', 'To penalize agents unfairly', 'It has no real purpose', 'Only for new hires'], correct: 0 },
        { question: 'What defines excellent quality assurance performance in a contact center?', options: ['Consistently applying empathy, accuracy, compliance, and resolution together', 'Handling calls as fast as possible regardless of accuracy', 'Avoiding escalations at all costs, even when needed', 'Following a script word-for-word with no flexibility'], correct: 0 },
    ],
];

const LIVE_CALL_DATA = [
    {
        title: 'Billing Dispute', icon: '💳', desc: 'An angry repeat caller over an unexplained charge',
        turns: [
            { category: 'Greeting', text: 'Hi, this is the third time I\'m calling about a charge on my bill that I never agreed to. I\'m really frustrated.', options: ['Good day! I completely understand your frustration, and I\'m sorry you\'ve had to call multiple times. Let\'s get this sorted right now — may I have your account number?', 'Ok, what\'s the charge?', 'Please calm down, I\'ll check it.', 'That\'s strange, are you sure?'], correct: 0, feedback: '✅ Great opening — you acknowledged the frustration and asked for what you need to help.' },
            { category: 'Discovery', text: 'It\'s account number 4521. The charge is for $45 and I have no idea what it\'s for.', options: ['Let me pull that up and check exactly what that charge is for — one moment please.', 'That\'s probably a subscription you forgot about.', 'I can\'t see anything wrong on my end.', 'You\'ll need to dispute that with your bank.'], correct: 0, feedback: '✅ Correct — investigating before assuming keeps the customer informed and builds trust.' },
            { category: 'Resolution', text: 'Okay... so what is it then?', options: ['I found it — it was a duplicate charge from a system error on our end. I\'m processing a refund right now, and you\'ll see it in 3 to 5 business days.', 'It looks correct to me, sorry.', 'I don\'t know, I\'ll have to transfer you.', 'These things happen sometimes.'], correct: 0, feedback: '✅ Excellent — a clear explanation and a concrete fix with a timeline.' },
            { category: 'Resolution', text: 'Okay, thank you. Will this happen again?', options: ['I\'ve flagged this to prevent it from happening again, and I\'ll also send you a confirmation email of the refund.', 'I can\'t promise that.', 'Probably not, who knows.', 'That\'s not really something I can control.'], correct: 0, feedback: '✅ Correct — proactive reassurance and documentation close the loop well.' },
            { category: 'Closing', text: 'Alright, I appreciate the help today.', options: ['You\'re very welcome! Is there anything else I can help you with today? Thank you for your patience, and have a great day!', 'No problem, bye.', 'Ok, anything else?', 'Great, goodbye.'], correct: 0, feedback: '✅ Correct — a warm, complete closing leaves a great final impression.' },
        ],
    },
    {
        title: 'Service Outage', icon: '📡', desc: 'A business customer affected by an unexpected outage',
        turns: [
            { category: 'Greeting', text: 'Hello, our internet has been down for two hours and it\'s affecting our whole office. This is urgent.', options: ['I understand how urgent this is for your business — thank you for calling. Can I get your account number so I can check the outage status right away?', 'Outages happen sometimes, please be patient.', 'I\'ll need you to try restarting your router first.', 'There\'s nothing I can do about outages.'], correct: 0, feedback: '✅ Correct — matching their urgency and moving straight to action builds confidence.' },
            { category: 'Discovery', text: 'It\'s account 7734. We really need this fixed as soon as possible.', options: ['Let me check the outage map for your area right now to see what\'s happening.', 'It\'s probably just your equipment.', 'I can\'t check that from here.', 'You\'ll have to wait for the scheduled maintenance window.'], correct: 0, feedback: '✅ Correct — checking the actual outage status is the right first diagnostic step.' },
            { category: 'Resolution', text: 'So is it a wide outage or just us?', options: ['It\'s a confirmed outage affecting your area — our technicians are already working on it, with an estimated resolution in 45 minutes.', 'I really don\'t know, sorry.', 'It might be fixed eventually.', 'I can\'t give you an estimate.'], correct: 0, feedback: '✅ Excellent — a specific status and a timeframe give the customer something concrete.' },
            { category: 'Resolution', text: '45 minutes is a long time for a business. Is there anything else you can do?', options: ['I completely understand — I\'ll set up a courtesy credit for the downtime, and I\'ll personally follow up with you once it\'s resolved.', 'That\'s just how it is, nothing I can do.', 'You could try using your phone\'s hotspot.', 'I\'ll note your complaint.'], correct: 0, feedback: '✅ Correct — offering a concrete goodwill gesture and personal follow-up shows real ownership.' },
            { category: 'Closing', text: 'Alright, I\'ll wait for your follow-up then. Thanks.', options: ['Thank you for your patience — I\'ll call you personally the moment service is restored. Have a good rest of your day!', 'Ok bye.', 'Sure, whatever.', 'Alright, goodbye.'], correct: 0, feedback: '✅ Correct — reaffirming the commitment before closing leaves the customer reassured.' },
        ],
    },
    {
        title: 'Feature Confusion', icon: '❓', desc: 'A confused customer struggling with a new app feature',
        turns: [
            { category: 'Greeting', text: 'Hi, I just don\'t understand this new app update at all. I\'m so lost.', options: ['No worries at all, I\'m happy to walk you through it step by step. What are you trying to do first?', 'It\'s really simple, just explore the app.', 'Have you watched the tutorial video?', 'A lot of people are complaining about that.'], correct: 0, feedback: '✅ Correct — reassuring the customer and asking a focused question sets up a calm walkthrough.' },
            { category: 'Discovery', text: 'I\'m trying to set up auto-pay but I can\'t find the option anywhere.', options: ['Got it — let\'s check your Account Settings menu together, that\'s usually where it\'s located.', 'It should be obvious, just look around.', 'That feature might not exist anymore.', 'I\'m not sure, try searching online.'], correct: 0, feedback: '✅ Correct — guiding them to the exact location together resolves the confusion directly.' },
            { category: 'Resolution', text: 'Oh I see it now, under Billing. How do I turn it on?', options: ['Great! Just tap "Enable Auto-Pay," select your payment method, and confirm — I can stay on the line while you do it.', 'Just tap the button, it\'s easy.', 'You should be able to figure it out now.', 'I\'ll send you a link to read later.'], correct: 0, feedback: '✅ Correct — clear steps plus staying available shows real support.' },
            { category: 'Resolution', text: 'Done! That was easier than I thought. Thank you.', options: ['That\'s great to hear! Just to confirm, your next auto-payment will process on your usual billing date.', 'Good, glad that worked.', 'Ok, moving on.', 'No problem, anything else in general?'], correct: 0, feedback: '✅ Correct — confirming the outcome makes sure the customer fully understands what happens next.' },
            { category: 'Closing', text: 'Perfect, that\'s all I needed. Thanks for your patience with me.', options: ['It was truly no trouble at all — feel free to call anytime you have questions. Have a wonderful day!', 'No problem, bye now.', 'Alright, goodbye.', 'Sure, take care.'], correct: 0, feedback: '✅ Correct — a genuinely warm closing reinforces that asking for help is always welcome.' },
        ],
    },
];

// HELPERS
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    BGM.duck(id === 'screen-live');
    $$('.feedback-overlay').forEach(f => f.classList.remove('show'));
    stopTimer();
    state.seconds = 0;
    if (id === 'screen-main') updateMainMenu();
}

function formatTime(s) { const m = String(Math.floor(s / 60)).padStart(2, '0'); const sec = String(s % 60).padStart(2, '0'); return m + ':' + sec; }

function startTimer(id) {
    stopTimer();
    state.seconds = 0;
    const el = document.getElementById(id);
    if (!el) return;
    state.timerInterval = setInterval(() => { state.seconds++; el.textContent = formatTime(state.seconds); }, 1000);
}

function stopTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

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
        div.innerHTML = `<div class="num">${lv.id}</div><div class="name">${lv.name}</div><div class="stars">${levelHeartsStr(container.id.replace('LevelGrid', ''), lv.id, isDone)}</div>`;
        if (unlocked && !isDone) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                const all = container.querySelectorAll('.level-card');
                all.forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                if (container.id === 'scriptLevelGrid') state.script.level = idx;
                else if (container.id === 'stormLevelGrid') state.storm.level = idx;
                else if (container.id === 'qualityLevelGrid') state.quality.level = idx;
            });
        }
        container.appendChild(div);
    });
}

// UNLOCK STATUS
function getUnlockStatus() {
    const total = 5;
    const scriptDone = state.script.completed.size === total;
    const stormDone = state.storm.completed.size === total;
    const qualityDone = state.quality.completed.size === total;
    const liveTotal = LIVE_CALL_DATA.length;
    const liveDone = state.live.completed.size === liveTotal;
    return {
        script: { unlocked: true, progress: `${state.script.completed.size}/${total}`, done: scriptDone, level: state.script.level },
        storm: { unlocked: true, progress: `${state.storm.completed.size}/${total}`, done: stormDone, level: state.storm.level },
        quality: { unlocked: true, progress: `${state.quality.completed.size}/${total}`, done: qualityDone, level: state.quality.level },
        live: { unlocked: true, progress: `${state.live.completed.size}/${liveTotal}`, done: liveDone, level: state.live.scenario },
    };
}

function updateMainMenu() {
    const status = getUnlockStatus();
    ['script', 'storm', 'quality', 'live'].forEach(id => {
        const el = document.getElementById(`menu-${id}`);
        if (!el) return;
        const data = status[id];
        const badge = el.querySelector('.badge');
        if (data.unlocked) {
            el.classList.remove('locked');
            if (badge) {
                if (data.done) { badge.textContent = '✅ Complete'; badge.className = 'badge complete'; }
                else { badge.textContent = `Lv.${data.level + 1}`; badge.className = 'badge'; }
            }
        } else {
            el.classList.add('locked');
            if (badge) { badge.textContent = '🔒 Locked'; badge.className = 'badge'; badge.style.background = '#4a5a70'; badge.style.color = '#aab8c8'; }
        }
    });
}

// NAVIGATION
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.back;
        if (target === 'main' && EMBEDDED) {
            try { (window.parent || window).postMessage({ type: 'EIM_EXIT' }, '*'); } catch (e) {}
            return;
        }
        if (target === 'main') {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            showScreen('screen-main');
            ['script', 'storm', 'quality', 'live'].forEach(m => {
                state[m].phase = 'SELECT';
                const el = document.getElementById(m + '-select');
                if (el) el.style.display = '';
                const instr = document.getElementById(m + '-instructions');
                if (instr) instr.style.display = 'none';
                const game = document.getElementById(m + '-game');
                if (game) game.style.display = 'none';
                const fb = document.getElementById(m + 'Feedback') || document.getElementById(m + 'FeedbackOverlay');
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
        if (game === 'script') initScriptSavvy();
        else if (game === 'storm') initCalmTheStorm();
        else if (game === 'quality') initQualityQuest();
        else if (game === 'live') initLiveCall();
        showScreen('screen-' + game);
    });
});

// SCRIPT SAVVY
let scriptSteps = [], scriptPlaced = [];

function initScriptSavvy() {
    state.script.phase = 'SELECT';
    renderLevelGrid(document.getElementById('scriptLevelGrid'), SCRIPT_LEVELS, state.script.completed, state.script.level);
    document.getElementById('script-select').style.display = '';
    document.getElementById('script-instructions').style.display = 'none';
    document.getElementById('script-game').style.display = 'none';
    document.getElementById('scriptFeedback').classList.remove('show');
}

document.getElementById('scriptStartBtn').addEventListener('click', () => {
    const data = SCRIPT_LEVELS[state.script.level];
    if (!data) return;
    if (!transition('script', 'START')) return;
    state.script.problem = 0;
    document.getElementById('script-select').style.display = 'none';
    document.getElementById('script-instructions').style.display = '';
    document.getElementById('scriptInstrObj').textContent = `📋 Level ${data.id}: ${data.name}`;
    document.getElementById('scriptInstrDetail').textContent = 'Arrange the call flow steps in the correct order. 4 problems this level.';
});

document.getElementById('scriptPlayBtn').addEventListener('click', () => {
    if (!transition('script', 'PLAY')) return;
    heartsFresh = true;
    document.getElementById('script-instructions').style.display = 'none';
    document.getElementById('script-game').style.display = '';
    startScriptGame();
});

function startScriptGame() {
    const lv = state.script.level;
    const data = SCRIPT_DATA[lv] && SCRIPT_DATA[lv][state.script.problem];
    if (!data) return;
    const steps = data.steps;
    scriptSteps = steps.map((s, i) => ({ text: s, correctIndex: i }));
    const shuffled = shuffle([...steps]);
    scriptPlaced = new Array(steps.length).fill(null);

    const board = document.getElementById('scriptBoard');
    board.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
        const div = document.createElement('div');
        div.className = 'flow-step';
        div.dataset.slot = i;
        div.innerHTML = `
      <span class="step-num">${i + 1}</span>
      <span class="step-text" id="scriptSlotText_${i}">⬇ Drop here</span>
      <span class="step-status" id="scriptSlotStatus_${i}">⬜</span>
    `;
        div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over'); });
        div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.classList.remove('drag-over');
            const text = e.dataTransfer.getData('text/plain');
            if (text) handleScriptDrop(i, text);
        });
        board.appendChild(div);
    }

    const zone = document.getElementById('scriptDragZone');
    zone.innerHTML = '';
    shuffled.forEach(text => {
        const el = document.createElement('div');
        el.className = 'drag-item';
        el.textContent = text;
        el.draggable = true;
        el.dataset.text = text;
        el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', text); el.classList.add('dragging'); });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const ghost = document.getElementById('dragGhost');
            ghost.textContent = text;
            ghost.style.display = 'block';
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
            el.classList.add('dragging');
            window._scriptDragText = text;
        });
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const ghost = document.getElementById('dragGhost');
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
        });
        el.addEventListener('touchend', (e) => {
            const ghost = document.getElementById('dragGhost');
            ghost.style.display = 'none';
            el.classList.remove('dragging');
            const touch = e.changedTouches[0];
            const slots = document.querySelectorAll('#scriptBoard .flow-step');
            slots.forEach(s => {
                s.classList.remove('drag-over');
                const rect = s.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    const idx = parseInt(s.dataset.slot);
                    if (!isNaN(idx) && window._scriptDragText) handleScriptDrop(idx, window._scriptDragText);
                }
            });
            window._scriptDragText = null;
        });
        zone.appendChild(el);
    });

    document.getElementById('scriptGameLevel').textContent = 'Level ' + SCRIPT_LEVELS[state.script.level].id + ' · Problem ' + (state.script.problem + 1) + '/' + PROBLEMS_PER_LEVEL;
    syncHearts('scriptGameStars');
    startTimer('scriptGameTimer');
    document.getElementById('scriptFeedback').classList.remove('show');
    const hintEl = document.getElementById('scriptHintText');
    hintEl.style.display = 'none';
    hintEl.textContent = '';
    document.getElementById('scriptHintBtn').disabled = false;
    document.getElementById('scriptHintBtn').style.opacity = '1';
}

function handleScriptDrop(slotIdx, text) {
    if (scriptPlaced[slotIdx]) return;
    if (scriptPlaced.includes(text)) return;
    scriptPlaced[slotIdx] = text;
    const slotEl = document.querySelector(`#scriptBoard .flow-step[data-slot="${slotIdx}"]`);
    if (slotEl) {
        slotEl.querySelector('.step-text').textContent = text;
        slotEl.querySelector('.step-status').textContent = '📌';
        slotEl.classList.add('filled');
    }
    document.querySelectorAll('#scriptDragZone .drag-item').forEach(el => {
        if (el.dataset.text === text) {
            el.classList.add('placed');
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.4';
        }
    });
    if (!scriptPlaced.includes(null)) {
        setTimeout(() => { document.getElementById('scriptCheckBtn').click(); }, 400);
    }
}

document.getElementById('scriptHintBtn').addEventListener('click', () => {
    const data = SCRIPT_DATA[state.script.level] && SCRIPT_DATA[state.script.level][state.script.problem];
    if (!data || !data.hint) return;
    const hintEl = document.getElementById('scriptHintText');
    hintEl.textContent = '💡 ' + data.hint;
    hintEl.style.display = '';
});

document.getElementById('scriptCheckBtn').addEventListener('click', () => {
    if (state.script.phase !== 'PLAYING') return;
    const total = scriptSteps.length;
    if (scriptPlaced.includes(null)) {
        const fb = document.getElementById('scriptFeedback');
        document.getElementById('scriptFbIcon').textContent = '📦';
        document.getElementById('scriptFbTitle').textContent = 'Incomplete';
        document.getElementById('scriptFbTitle').className = 'fb-title gold';
        document.getElementById('scriptFbSub').textContent = 'Place all steps first!';
        document.getElementById('scriptFbNext').style.display = 'none';
        document.getElementById('scriptFbReplay').style.display = '';
        document.getElementById('scriptFbReplay').textContent = '↻ OK';
        fb.classList.add('show');
        return;
    }
    let correct = true;
    for (let i = 0; i < total; i++) {
        const slot = document.querySelector(`#scriptBoard .flow-step[data-slot="${i}"]`);
        const isCorrect = scriptPlaced[i] === scriptSteps[i].text;
        if (slot) {
            slot.classList.remove('correct', 'wrong');
            if (isCorrect) { slot.classList.add('correct'); slot.querySelector('.step-status').textContent = '✅'; }
            else { slot.classList.add('wrong'); slot.querySelector('.step-status').textContent = '❌'; correct = false; }
        }
    }
    if (correct) {
        state.script.problem++;
        if (state.script.problem < PROBLEMS_PER_LEVEL) {
            showScriptComplete(true, false);
        } else {
            state.script.problem = 0;
            showScriptComplete(true, true);
        }
    } else {
        if (loseHeart()) { scriptLevelJustCompleted = false; showOutOfHearts('script', 'scriptFeedback', 'script'); return; }
        const fb = document.getElementById('scriptFeedback');
        document.getElementById('scriptFbIcon').textContent = '⚠️';
        document.getElementById('scriptFbTitle').textContent = 'Not Quite!';
        document.getElementById('scriptFbTitle').className = 'fb-title red';
        document.getElementById('scriptFbSub').textContent = 'The order is incorrect. Try again!';
        document.getElementById('scriptFbNext').style.display = 'none';
        document.getElementById('scriptFbReplay').style.display = '';
        document.getElementById('scriptFbReplay').textContent = '↻ TRY AGAIN';
        fb.classList.add('show');
    }
});

let scriptLevelJustCompleted = false;

function showScriptComplete(success, levelComplete) {
    if (success && !transition('script', levelComplete ? 'PASS' : 'SOLVED')) return;
    SFX.play(levelComplete ? 'fanfare' : 'correct');
    stopTimer();
    const fb = document.getElementById('scriptFeedback');
    if (success && levelComplete) {
        scriptLevelJustCompleted = true;
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('scriptFbIcon').textContent = '🎉';
        document.getElementById('scriptFbTitle').textContent = 'Level Complete!';
        document.getElementById('scriptFbTitle').className = 'fb-title gold';
        document.getElementById('scriptFbSub').textContent = 'You nailed all 4 call flows!';
        document.getElementById('scriptFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#00b4ff;">${xp + 30} XP</span></div>`;
        state.script.completed.add(SCRIPT_LEVELS[state.script.level].id);
        keepHearts('script', SCRIPT_LEVELS[state.script.level].id);
        notifyCssProgress('script', xp + 30);
        document.getElementById('scriptFbNext').style.display = (state.script.level < SCRIPT_LEVELS.length - 1) ? '' : 'none';
        document.getElementById('scriptFbNext').textContent = '➜ NEXT LEVEL';
        document.getElementById('scriptFbReplay').style.display = '';
        document.getElementById('scriptFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
    } else if (success) {
        scriptLevelJustCompleted = false;
        document.getElementById('scriptFbIcon').textContent = '✅';
        document.getElementById('scriptFbTitle').textContent = `Correct! (${state.script.problem}/${PROBLEMS_PER_LEVEL})`;
        document.getElementById('scriptFbTitle').className = 'fb-title gold';
        document.getElementById('scriptFbSub').textContent = 'On to the next problem.';
        document.getElementById('scriptFbScore').innerHTML = '';
        document.getElementById('scriptFbNext').style.display = '';
        document.getElementById('scriptFbNext').textContent = '➜ NEXT PROBLEM';
        document.getElementById('scriptFbReplay').style.display = 'none';
    }
    fb.classList.add('show');
}

document.getElementById('scriptFbReplay').addEventListener('click', () => {
    if (!transition('script', replayEvent('script'))) return;
    { const t = document.getElementById('scriptFbReplay').textContent; if (t === '↻ REPLAY' || t === '↻ RETRY LEVEL') heartsFresh = true; }
    document.getElementById('scriptFeedback').classList.remove('show');
    startScriptGame();
});

document.getElementById('scriptFbNext').addEventListener('click', () => {
    if (!transition('script', state.script.phase === 'PROBLEM_DONE' ? 'NEXT_PROBLEM' : 'NEXT')) return;
    document.getElementById('scriptFeedback').classList.remove('show');
    if (!scriptLevelJustCompleted) { startScriptGame(); return; }
    if (state.script.level < SCRIPT_LEVELS.length - 1) {
        state.script.level++;
        document.getElementById('script-game').style.display = 'none';
        document.getElementById('script-select').style.display = '';
        renderLevelGrid(document.getElementById('scriptLevelGrid'), SCRIPT_LEVELS, state.script.completed, state.script.level);
    } else {
        document.getElementById('script-game').style.display = 'none';
        document.getElementById('script-select').style.display = '';
        updateMainMenu();
    }
});

// CALM THE STORM
let stormAnswered = false;
let stormSelected = -1;

function initCalmTheStorm() {
    state.storm.phase = 'SELECT';
    renderLevelGrid(document.getElementById('stormLevelGrid'), STORM_LEVELS, state.storm.completed, state.storm.level);
    document.getElementById('storm-select').style.display = '';
    document.getElementById('storm-instructions').style.display = 'none';
    document.getElementById('storm-game').style.display = 'none';
    document.getElementById('stormFeedbackOverlay').classList.remove('show');
}

document.getElementById('stormStartBtn').addEventListener('click', () => {
    const data = STORM_LEVELS[state.storm.level];
    if (!data) return;
    if (!transition('storm', 'START')) return;
    state.storm.problem = 0;
    document.getElementById('storm-select').style.display = 'none';
    document.getElementById('storm-instructions').style.display = '';
    document.getElementById('stormInstrObj').textContent = `🌊 Level ${data.id}: ${data.name}`;
    document.getElementById('stormInstrDetail').textContent = 'Read the scenario and choose the best response. 4 problems this level.';
});

document.getElementById('stormPlayBtn').addEventListener('click', () => {
    if (!transition('storm', 'PLAY')) return;
    heartsFresh = true;
    document.getElementById('storm-instructions').style.display = 'none';
    document.getElementById('storm-game').style.display = '';
    startStormGame();
});

function startStormGame() {
    const data = STORM_DATA[state.storm.level] && STORM_DATA[state.storm.level][state.storm.problem];
    if (!data) return;
    stormAnswered = false;
    stormSelected = -1;

    document.getElementById('stormScenarioText').textContent = data.scenario;
    const opts = document.getElementById('stormOptions');
    opts.innerHTML = '';
    data.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.dataset.idx = idx;
        btn.addEventListener('click', function() {
            if (stormAnswered) return;
            opts.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected-correct', 'selected-wrong'));
            this.classList.add('selected-correct');
            stormSelected = idx;
        });
        opts.appendChild(btn);
    });

    const fb = document.getElementById('stormFeedback');
    fb.textContent = 'Choose the best response to de‑escalate.';
    fb.className = 'scenario-feedback info';

    document.getElementById('stormGameLevel').textContent = 'Level ' + STORM_LEVELS[state.storm.level].id + ' · Problem ' + (state.storm.problem + 1) + '/' + PROBLEMS_PER_LEVEL;
    syncHearts('stormGameStars');
    startTimer('stormGameTimer');
    document.getElementById('stormFeedbackOverlay').classList.remove('show');
}

document.getElementById('stormSubmitBtn').addEventListener('click', () => {
    if (state.storm.phase !== 'PLAYING') return;
    if (stormAnswered) return;
    const lv = state.storm.level;
    const data = STORM_DATA[lv] && STORM_DATA[lv][state.storm.problem];
    if (!data) return;
    if (stormSelected === -1) {
        const fb = document.getElementById('stormFeedback');
        fb.textContent = '👆 Please select a response first.';
        fb.className = 'scenario-feedback error';
        return;
    }
    stormAnswered = true;
    const correct = stormSelected === data.correct;
    const opts = document.querySelectorAll('#stormOptions .opt-btn');
    opts.forEach((btn, idx) => {
        if (idx === data.correct) btn.classList.add('selected-correct');
        if (idx === stormSelected && !correct) btn.classList.add('selected-wrong');
        btn.disabled = true;
    });
    const fb = document.getElementById('stormFeedback');
    if (correct) {
        fb.textContent = data.feedback;
        fb.className = 'scenario-feedback success';
        state.storm.problem++;
        if (state.storm.problem < PROBLEMS_PER_LEVEL) {
            setTimeout(() => { showStormComplete(true, false); }, 600);
        } else {
            state.storm.problem = 0;
            state.storm.completed.add(STORM_LEVELS[lv].id);
            keepHearts('storm', STORM_LEVELS[lv].id);
            notifyCssProgress('storm', 75);
            updateMainMenu();
            setTimeout(() => { showStormComplete(true, true); }, 600);
        }
    } else {
        if (loseHeart()) { stormLevelJustCompleted = false; showOutOfHearts('storm', 'stormFeedbackOverlay', 'storm'); return; }
        fb.textContent = '❌ That response could escalate the situation. Try again.';
        fb.className = 'scenario-feedback error';
        setTimeout(() => {
            stormAnswered = false;
            opts.forEach(b => { b.classList.remove('selected-correct', 'selected-wrong'); b.disabled = false; });
            fb.textContent = 'Choose the best response to de‑escalate.';
            fb.className = 'scenario-feedback info';
        }, 1200);
    }
});

let stormLevelJustCompleted = false;

function showStormComplete(success, levelComplete) {
    if (success && !transition('storm', levelComplete ? 'PASS' : 'SOLVED')) return;
    SFX.play(levelComplete ? 'fanfare' : 'correct');
    stopTimer();
    const fb = document.getElementById('stormFeedbackOverlay');
    if (success && levelComplete) {
        stormLevelJustCompleted = true;
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('stormFbIcon').textContent = '🌊';
        document.getElementById('stormFbTitle').textContent = 'Level Complete!';
        document.getElementById('stormFbTitle').className = 'fb-title gold';
        document.getElementById('stormFbSub').textContent = 'Great empathy and de‑escalation skills!';
        document.getElementById('stormFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#00b4ff;">${xp + 30} XP</span></div>`;
        document.getElementById('stormFbNext').style.display = (state.storm.level < STORM_LEVELS.length - 1) ? '' : 'none';
        document.getElementById('stormFbNext').textContent = '➜ NEXT LEVEL';
        document.getElementById('stormFbReplay').style.display = '';
        document.getElementById('stormFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
    } else if (success) {
        stormLevelJustCompleted = false;
        document.getElementById('stormFbIcon').textContent = '✅';
        document.getElementById('stormFbTitle').textContent = `Correct! (${state.storm.problem}/${PROBLEMS_PER_LEVEL})`;
        document.getElementById('stormFbTitle').className = 'fb-title gold';
        document.getElementById('stormFbSub').textContent = 'On to the next problem.';
        document.getElementById('stormFbScore').innerHTML = '';
        document.getElementById('stormFbNext').style.display = '';
        document.getElementById('stormFbNext').textContent = '➜ NEXT PROBLEM';
        document.getElementById('stormFbReplay').style.display = 'none';
    }
    fb.classList.add('show');
}

document.getElementById('stormFbReplay').addEventListener('click', () => {
    if (!transition('storm', replayEvent('storm'))) return;
    { const t = document.getElementById('stormFbReplay').textContent; if (t === '↻ REPLAY' || t === '↻ RETRY LEVEL') heartsFresh = true; }
    document.getElementById('stormFeedbackOverlay').classList.remove('show');
    startStormGame();
});

document.getElementById('stormFbNext').addEventListener('click', () => {
    if (!transition('storm', state.storm.phase === 'PROBLEM_DONE' ? 'NEXT_PROBLEM' : 'NEXT')) return;
    document.getElementById('stormFeedbackOverlay').classList.remove('show');
    if (!stormLevelJustCompleted) { startStormGame(); return; }
    if (state.storm.level < STORM_LEVELS.length - 1) {
        state.storm.level++;
        document.getElementById('storm-game').style.display = 'none';
        document.getElementById('storm-select').style.display = '';
        renderLevelGrid(document.getElementById('stormLevelGrid'), STORM_LEVELS, state.storm.completed, state.storm.level);
    } else {
        document.getElementById('storm-game').style.display = 'none';
        document.getElementById('storm-select').style.display = '';
        updateMainMenu();
    }
});

// QUALITY QUEST
let qualityAnswered = false;
let qualitySelected = -1;

function initQualityQuest() {
    state.quality.phase = 'SELECT';
    renderLevelGrid(document.getElementById('qualityLevelGrid'), QUALITY_LEVELS, state.quality.completed, state.quality.level);
    document.getElementById('quality-select').style.display = '';
    document.getElementById('quality-instructions').style.display = 'none';
    document.getElementById('quality-game').style.display = 'none';
    document.getElementById('qualityFeedback').classList.remove('show');
}

document.getElementById('qualityStartBtn').addEventListener('click', () => {
    const data = QUALITY_LEVELS[state.quality.level];
    if (!data) return;
    if (!transition('quality', 'START')) return;
    state.quality.problem = 0;
    document.getElementById('quality-select').style.display = 'none';
    document.getElementById('quality-instructions').style.display = '';
    document.getElementById('qualityInstrObj').textContent = `⭐ Level ${data.id}: ${data.name}`;
    document.getElementById('qualityInstrDetail').textContent = 'Answer the quality assurance questions correctly. 4 problems this level.';
});

document.getElementById('qualityPlayBtn').addEventListener('click', () => {
    if (!transition('quality', 'PLAY')) return;
    heartsFresh = true;
    document.getElementById('quality-instructions').style.display = 'none';
    document.getElementById('quality-game').style.display = '';
    startQualityGame();
});

function startQualityGame() {
    const data = QUALITY_DATA[state.quality.level] && QUALITY_DATA[state.quality.level][state.quality.problem];
    if (!data) return;
    qualityAnswered = false;
    qualitySelected = -1;

    document.getElementById('qualityQuestion').textContent = data.question;
    const opts = document.getElementById('qualityOptions');
    opts.innerHTML = '';
    data.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.dataset.idx = idx;
        btn.addEventListener('click', function() {
            if (qualityAnswered) return;
            opts.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected-correct', 'selected-wrong'));
            this.classList.add('selected-correct');
            qualitySelected = idx;
        });
        opts.appendChild(btn);
    });

    document.getElementById('qualityGameLevel').textContent = 'Level ' + QUALITY_LEVELS[state.quality.level].id + ' · Problem ' + (state.quality.problem + 1) + '/' + PROBLEMS_PER_LEVEL;
    syncHearts('qualityGameStars');
    startTimer('qualityGameTimer');
    document.getElementById('qualityFeedback').classList.remove('show');
}

document.getElementById('qualitySubmitBtn').addEventListener('click', () => {
    if (state.quality.phase !== 'PLAYING') return;
    if (qualityAnswered) return;
    const lv = state.quality.level;
    const data = QUALITY_DATA[lv] && QUALITY_DATA[lv][state.quality.problem];
    if (!data) return;
    if (qualitySelected === -1) {
        const fb = document.getElementById('qualityFeedback');
        document.getElementById('qualityFbIcon').textContent = '👆';
        document.getElementById('qualityFbTitle').textContent = 'Select an Answer';
        document.getElementById('qualityFbTitle').className = 'fb-title gold';
        document.getElementById('qualityFbSub').textContent = 'Please choose an option first.';
        document.getElementById('qualityFbNext').style.display = 'none';
        document.getElementById('qualityFbReplay').style.display = '';
        document.getElementById('qualityFbReplay').textContent = '↻ OK';
        fb.classList.add('show');
        return;
    }
    qualityAnswered = true;
    const correct = qualitySelected === data.correct;
    const opts = document.querySelectorAll('#qualityOptions .opt-btn');
    opts.forEach((btn, idx) => {
        if (idx === data.correct) btn.classList.add('selected-correct');
        if (idx === qualitySelected && !correct) btn.classList.add('selected-wrong');
        btn.disabled = true;
    });
    if (correct) {
        state.quality.problem++;
        if (state.quality.problem < PROBLEMS_PER_LEVEL) {
            setTimeout(() => { showQualityComplete(true, false); }, 600);
        } else {
            state.quality.problem = 0;
            state.quality.completed.add(QUALITY_LEVELS[lv].id);
            keepHearts('quality', QUALITY_LEVELS[lv].id);
            notifyCssProgress('quality', 75);
            updateMainMenu();
            setTimeout(() => { showQualityComplete(true, true); }, 600);
        }
    } else {
        if (loseHeart()) { qualityLevelJustCompleted = false; showOutOfHearts('quality', 'qualityFeedback', 'quality'); return; }
        const fb = document.getElementById('qualityFeedback');
        document.getElementById('qualityFbIcon').textContent = '❌';
        document.getElementById('qualityFbTitle').textContent = 'Incorrect';
        document.getElementById('qualityFbTitle').className = 'fb-title red';
        document.getElementById('qualityFbSub').textContent = 'That\'s not the right answer. Try again!';
        document.getElementById('qualityFbNext').style.display = 'none';
        document.getElementById('qualityFbReplay').style.display = '';
        document.getElementById('qualityFbReplay').textContent = '↻ TRY AGAIN';
        fb.classList.add('show');
    }
});

let qualityLevelJustCompleted = false;

function showQualityComplete(success, levelComplete) {
    if (success && !transition('quality', levelComplete ? 'PASS' : 'SOLVED')) return;
    SFX.play(levelComplete ? 'fanfare' : 'correct');
    stopTimer();
    const fb = document.getElementById('qualityFeedback');
    if (success && levelComplete) {
        qualityLevelJustCompleted = true;
        const xp = 30 + Math.max(0, 60 - state.seconds);
        document.getElementById('qualityFbIcon').textContent = '⭐';
        document.getElementById('qualityFbTitle').textContent = 'Level Complete!';
        document.getElementById('qualityFbTitle').className = 'fb-title gold';
        document.getElementById('qualityFbSub').textContent = 'Excellent compliance knowledge!';
        document.getElementById('qualityFbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+30 XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#00b4ff;">${xp + 30} XP</span></div>`;
        document.getElementById('qualityFbNext').style.display = (state.quality.level < QUALITY_LEVELS.length - 1) ? '' : 'none';
        document.getElementById('qualityFbNext').textContent = '➜ NEXT LEVEL';
        document.getElementById('qualityFbReplay').style.display = '';
        document.getElementById('qualityFbReplay').textContent = '↻ REPLAY';
        updateMainMenu();
    } else if (success) {
        qualityLevelJustCompleted = false;
        document.getElementById('qualityFbIcon').textContent = '✅';
        document.getElementById('qualityFbTitle').textContent = `Correct! (${state.quality.problem}/${PROBLEMS_PER_LEVEL})`;
        document.getElementById('qualityFbTitle').className = 'fb-title gold';
        document.getElementById('qualityFbSub').textContent = 'On to the next problem.';
        document.getElementById('qualityFbScore').innerHTML = '';
        document.getElementById('qualityFbNext').style.display = '';
        document.getElementById('qualityFbNext').textContent = '➜ NEXT PROBLEM';
        document.getElementById('qualityFbReplay').style.display = 'none';
    }
    fb.classList.add('show');
}

document.getElementById('qualityFbReplay').addEventListener('click', () => {
    if (!transition('quality', replayEvent('quality'))) return;
    { const t = document.getElementById('qualityFbReplay').textContent; if (t === '↻ REPLAY' || t === '↻ RETRY LEVEL') heartsFresh = true; }
    document.getElementById('qualityFeedback').classList.remove('show');
    if (document.getElementById('qualityFbReplay').textContent === '↻ OK' || document.getElementById('qualityFbReplay').textContent === '↻ TRY AGAIN') {
        qualityAnswered = false;
        qualitySelected = -1;
        document.querySelectorAll('#qualityOptions .opt-btn').forEach(b => { b.classList.remove('selected-correct', 'selected-wrong'); b.disabled = false; });
        document.getElementById('qualitySubmitBtn').disabled = false;
    } else { startQualityGame(); }
});

document.getElementById('qualityFbNext').addEventListener('click', () => {
    if (!transition('quality', state.quality.phase === 'PROBLEM_DONE' ? 'NEXT_PROBLEM' : 'NEXT')) return;
    document.getElementById('qualityFeedback').classList.remove('show');
    if (!qualityLevelJustCompleted) { startQualityGame(); return; }
    if (state.quality.level < QUALITY_LEVELS.length - 1) {
        state.quality.level++;
        document.getElementById('quality-game').style.display = 'none';
        document.getElementById('quality-select').style.display = '';
        renderLevelGrid(document.getElementById('qualityLevelGrid'), QUALITY_LEVELS, state.quality.completed, state.quality.level);
    } else {
        document.getElementById('quality-game').style.display = 'none';
        document.getElementById('quality-select').style.display = '';
        updateMainMenu();
    }
});

// THE LIVE CALL
let liveSelected = -1;
let liveAnswered = false;
let liveCurrentTurn = null;
let liveScores = {};
let liveCorrectCount = 0;
const speechSupported = 'speechSynthesis' in window;

function speakLiveText(text) {
    if (!speechSupported) return;
    try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.98; utter.pitch = 1; utter.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length) {
            const preferred = voices.find(v => /en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0];
            if (preferred) utter.voice = preferred;
        }
        window.speechSynthesis.speak(utter);
    } catch (e) { }
}

function initLiveCall() {
    state.live.phase = 'SELECT';
    const grid = document.getElementById('liveCallGrid');
    grid.innerHTML = '';
    LIVE_CALL_DATA.forEach((call, idx) => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.style.cursor = 'pointer';
        div.style.border = (idx === state.live.scenario) ? '2px solid #00b4ff' : '1px solid rgba(255,255,255,0.04)';
        const done = state.live.completed.has(idx);
        div.innerHTML = `
      <div class="icon">${call.icon}</div>
      <div class="info">
        <div class="name">${call.title} ${done ? '<span class="badge complete">✅</span>' : ''}</div>
        <div class="desc">${call.desc}</div>
      </div>
      <div class="arrow">›</div>
    `;
        div.addEventListener('click', () => {
            state.live.scenario = idx;
            grid.querySelectorAll('.menu-item').forEach(el => el.style.border = '1px solid rgba(255,255,255,0.04)');
            div.style.border = '2px solid #00b4ff';
        });
        grid.appendChild(div);
    });
    document.getElementById('live-select').style.display = '';
    document.getElementById('live-instructions').style.display = 'none';
    document.getElementById('live-game').style.display = 'none';
    document.getElementById('liveFeedbackOverlay').classList.remove('show');
}

document.getElementById('liveStartBtn').addEventListener('click', () => {
    const call = LIVE_CALL_DATA[state.live.scenario];
    if (!call) return;
    if (!transition('live', 'START')) return;
    document.getElementById('live-select').style.display = 'none';
    document.getElementById('live-instructions').style.display = '';
    document.getElementById('liveInstrObj').textContent = `🎙️ ${call.icon} ${call.title}`;
    document.getElementById('liveInstrDetail').textContent = call.desc +
        '. Listen to the customer and choose the best response at each of the ' + call.turns.length +
        ' turns.' + (speechSupported ? '' : ' (Voice playback isn\'t supported in this browser, but the transcript is fully readable.)');
});

document.getElementById('livePlayBtn').addEventListener('click', () => {
    if (!transition('live', 'PLAY')) return;
    document.getElementById('live-instructions').style.display = 'none';
    document.getElementById('live-game').style.display = '';
    startLiveCall();
});

function startLiveCall() {
    resetHearts('liveGameHearts');
    state.live.turn = 0;
    liveScores = {};
    liveCorrectCount = 0;
    startTimer('liveGameTimer');
    renderLiveTurn();
}

function renderLiveTurn() {
    const call = LIVE_CALL_DATA[state.live.scenario];
    const turnData = call.turns[state.live.turn];
    if (!turnData) return;

    const correctText = turnData.options[turnData.correct];
    const shuffledOpts = shuffle([...turnData.options]);
    liveCurrentTurn = { ...turnData, options: shuffledOpts, correct: shuffledOpts.indexOf(correctText) };

    liveAnswered = false;
    liveSelected = -1;

    document.getElementById('liveGameLevel').textContent = call.icon + ' ' + call.title;
    document.getElementById('liveGameTurn').textContent = 'Turn ' + (state.live.turn + 1) + '/' + call.turns.length;
    document.getElementById('liveScenarioText').textContent = liveCurrentTurn.text;
    document.getElementById('liveSpeakerLabel').textContent = '📞 CUSTOMER';

    const opts = document.getElementById('liveOptions');
    opts.innerHTML = '';
    liveCurrentTurn.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.dataset.idx = idx;
        btn.addEventListener('click', function() {
            if (liveAnswered) return;
            opts.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected-correct', 'selected-wrong'));
            this.classList.add('selected-correct');
            liveSelected = idx;
        });
        opts.appendChild(btn);
    });

    const fb = document.getElementById('liveFeedback');
    fb.textContent = 'Choose your response.';
    fb.className = 'scenario-feedback info';

    document.getElementById('liveFeedbackOverlay').classList.remove('show');
    speakLiveText(liveCurrentTurn.text);
}

document.getElementById('liveReplayVoiceBtn').addEventListener('click', () => {
    if (liveCurrentTurn) speakLiveText(liveCurrentTurn.text);
});

document.getElementById('liveSubmitBtn').addEventListener('click', () => {
    if (state.live.phase !== 'PLAYING') return;
    if (liveAnswered) return;
    const data = liveCurrentTurn;
    if (!data) return;
    if (liveSelected === -1) {
        const fb = document.getElementById('liveFeedback');
        fb.textContent = '👆 Please select a response first.';
        fb.className = 'scenario-feedback error';
        return;
    }
    liveAnswered = true;
    const correct = liveSelected === data.correct;
    const opts = document.querySelectorAll('#liveOptions .opt-btn');
    opts.forEach((btn, idx) => {
        if (idx === data.correct) btn.classList.add('selected-correct');
        if (idx === liveSelected && !correct) btn.classList.add('selected-wrong');
        btn.disabled = true;
    });

    const cat = data.category;
    if (!liveScores[cat]) liveScores[cat] = { correct: 0, total: 0 };
    liveScores[cat].total++;
    if (correct) { liveScores[cat].correct++; liveCorrectCount++; }
    if (correct) SFX.play('correct'); else loseHeart();

    const fb = document.getElementById('liveFeedback');
    fb.textContent = correct ? data.feedback : '❌ That wasn\'t the strongest response — the call moves on regardless, just like a real call.';
    fb.className = 'scenario-feedback ' + (correct ? 'success' : 'error');

    setTimeout(() => {
        if (state.live.phase !== 'PLAYING') return;
        const call = LIVE_CALL_DATA[state.live.scenario];
        state.live.turn++;
        if (state.live.turn < call.turns.length && hearts.cur > 0) renderLiveTurn();
        else finishLiveCall();
    }, 1400);
});

function finishLiveCall() {
    stopTimer();
    const call = LIVE_CALL_DATA[state.live.scenario];
    const totalTurns = call.turns.length;
    const pct = Math.round((liveCorrectCount / totalTurns) * 100);
    const passed = pct >= 60 && hearts.cur > 0;
    if (!transition('live', passed ? 'PASS' : 'FAIL')) return;
    if (passed) SFX.play('fanfare'); else if (hearts.cur > 0) SFX.play('gameover');
    if (passed) { state.live.completed.add(state.live.scenario); keepHearts('live', state.live.scenario); }
    updateMainMenu();

    const xp = liveCorrectCount * 20 + Math.max(0, 90 - state.seconds);

    document.getElementById('liveFbIcon').textContent = passed ? '🎉' : '📋';
    document.getElementById('liveFbTitle').textContent = passed ? 'Call Complete!' : 'Call Ended';
    document.getElementById('liveFbTitle').className = 'fb-title ' + (passed ? 'gold' : 'red');
    document.getElementById('liveFbSub').textContent = `Overall score: ${pct}% (${liveCorrectCount}/${totalTurns} turns)`;

    let rows = '';
    Object.keys(liveScores).forEach(cat => {
        const s = liveScores[cat];
        const catPct = Math.round((s.correct / s.total) * 100);
        rows += `<div class="row"><span class="label">${cat}</span><span>${s.correct}/${s.total} (${catPct}%)</span></div>`;
    });
    rows += `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div>`;
    rows += `<div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#00b4ff;">${xp} XP</span></div>`;
    document.getElementById('liveFbScore').innerHTML = rows;

    if (passed) notifyCssProgress('live', xp);

    document.getElementById('live-game').style.display = 'none';
    document.getElementById('liveFeedbackOverlay').classList.add('show');
}

document.getElementById('liveFbReplay').addEventListener('click', () => {
    if (!transition('live', state.live.phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY')) return;
    document.getElementById('liveFeedbackOverlay').classList.remove('show');
    document.getElementById('live-game').style.display = '';
    startLiveCall();
});

document.getElementById('liveFbNext').addEventListener('click', () => {
    if (!transition('live', state.live.phase === 'GAME_OVER' ? 'EXIT' : 'NEXT')) return;
    document.getElementById('liveFeedbackOverlay').classList.remove('show');
    document.getElementById('live-game').style.display = 'none';
    document.getElementById('live-select').style.display = '';
    initLiveCall();
    updateMainMenu();
});

// GLOBAL INIT
document.addEventListener('touchmove', (e) => {
    if (document.getElementById('dragGhost').style.display === 'block') e.preventDefault();
}, { passive: false });

if (EMBEDDED && ['script', 'storm', 'quality', 'live'].includes(AUTOSTART_GAME)) {
    if (AUTOSTART_GAME === 'script') initScriptSavvy();
    else if (AUTOSTART_GAME === 'storm') initCalmTheStorm();
    else if (AUTOSTART_GAME === 'quality') initQualityQuest();
    else if (AUTOSTART_GAME === 'live') initLiveCall();
    showScreen('screen-' + AUTOSTART_GAME);
    try { (window.parent || window).postMessage({ type: 'CSS_GAME_READY', game: AUTOSTART_GAME }, '*'); } catch (e) {}
} else {
    showScreen('screen-main');
}
updateMainMenu();
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
}
console.log('🎯 AGENT PRO loaded with sound!');
