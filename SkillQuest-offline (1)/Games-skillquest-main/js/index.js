// ══════════════════════════════════════════
// DATA LAYER
// ══════════════════════════════════════════

const TRACKS = {
    eim: { label: 'EIM NC II', full: 'Electrical Installation & Maintenance', color: '#f59e0b', icon: '⚡' },
    ccs: { label: 'CCS NC II', full: 'Contact Center Services', color: '#22d3a5', icon: '🎧' },
    pcops: { label: 'PC OPS NC II', full: 'PC Operations & Maintenance', color: '#a855f7', icon: '💻' },
};

function makePCopsQuestions() {
    return [
        { scenario: 'You are setting up a new computer workstation.', q: 'What is the correct posture for using a computer?', opts: ['Feet flat on floor, screen at eye level', 'Slouching in the chair', 'Screen below desk level', 'Feet crossed on chair'], ans: 0, xp: 10, feedback: 'Proper ergonomics prevents strain and injury. Keep your feet flat and screen at eye level.' },
        { scenario: 'You notice a frayed power cord in the office.', q: 'What is the safest course of action?', opts: ['Report it to IT and unplug it immediately', 'Ignore it if it still works', 'Wrap it with electrical tape', 'Continue using it carefully'], ans: 0, xp: 10, feedback: 'Frayed cords are a fire and shock hazard. Always report and unplug them immediately.' },
        { scenario: 'You are organizing a project folder on your PC.', q: 'Which file extension indicates an image file?', opts: ['.docx', '.jpg', '.exe', '.pdf'], ans: 1, xp: 10, feedback: '.jpg is a common image file extension used for photos and graphics.' },
        { scenario: 'You need to find a specific file you saved yesterday.', q: 'What is the most efficient way to find it?', opts: ['Search by file name in File Explorer', 'Browse every folder manually', 'Check the Recycle Bin', 'Restart the computer'], ans: 0, xp: 10, feedback: 'Using the search bar in File Explorer is the quickest way to locate a specific file.' },
        { scenario: 'You are typing a long report in a word processor.', q: 'What shortcut is used to save the file?', opts: ['Ctrl+S', 'Ctrl+C', 'Ctrl+V', 'Ctrl+Z'], ans: 0, xp: 10, feedback: 'Ctrl+S (or Cmd+S on Mac) is the universal shortcut to save the current file.' },
        { scenario: 'You need to quickly copy and paste text.', q: 'What is the correct shortcut sequence?', opts: ['Ctrl+C then Ctrl+V', 'Ctrl+V then Ctrl+C', 'Ctrl+X then Ctrl+V', 'Ctrl+Z then Ctrl+Y'], ans: 0, xp: 10, feedback: 'Copy (Ctrl+C) then Paste (Ctrl+V) is the standard shortcut sequence.' },
        { scenario: 'You are creating a budget in a spreadsheet.', q: 'Which formula correctly adds up a column of numbers?', opts: ['=SUM(A1:A10)', '=TOTAL(A1:A10)', '=ADD(A1:A10)', '=COUNT(A1:A10)'], ans: 0, xp: 10, feedback: '=SUM is the standard function for adding a range of cells in most spreadsheet software.' },
        { scenario: 'You want to freeze the header row so it stays visible while scrolling.', q: 'Where is the "Freeze Panes" option found?', opts: ['View tab', 'Home tab', 'Insert tab', 'Formulas tab'], ans: 0, xp: 10, feedback: 'The "Freeze Panes" option is typically located in the View tab of the ribbon.' },
        { scenario: 'Your computer is running unusually slow.', q: 'What is a good first step to improve performance?', opts: ['Run Disk Cleanup', 'Reboot the router', 'Reinstall Windows', 'Update the printer driver'], ans: 0, xp: 10, feedback: 'Disk Cleanup removes temporary files and system caches that can slow down your PC.' },
        { scenario: 'You are installing a new hardware device.', q: 'What should you do after physically connecting the device?', opts: ['Install the necessary drivers', 'Format the hard drive', 'Delete system files', 'Change the BIOS settings'], ans: 0, xp: 10, feedback: 'Installing the correct drivers ensures the hardware communicates properly with the operating system.' }
    ];
}

function makeCCSQuestions() {
    return [{ scenario: 'You are handling a customer call about a billing issue.', q: 'What is the first step in the call flow?', opts: ['Greet and verify identity', 'Immediately escalate to supervisor', 'Provide the solution', 'Put the customer on hold'], ans: 0, xp: 10, feedback: 'Always start by greeting the customer and verifying their identity to ensure security and professionalism.' },
        { scenario: 'A customer is very upset about a service outage.', q: 'Which de-escalation technique is most effective?', opts: ['Apologize and empathize', 'Argue with the customer', 'Promise a quick fix', 'Transfer the call'], ans: 0, xp: 10, feedback: 'Empathy and apology help calm the customer and build trust, even if you cannot solve the issue immediately.' },
        { scenario: 'You need to log a support ticket in the CRM.', q: 'What information is critical to include?', opts: ['Customer name and issue details', 'Only the customer name', 'Your employee ID', 'The date and time'], ans: 0, xp: 10, feedback: 'Always capture the customer\'s name and a clear description of the issue for proper ticket tracking.' },
        { scenario: 'You are reviewing a call for quality assurance.', q: 'Which metric indicates high quality service?', opts: ['First call resolution', 'Long call duration', 'Multiple transfers', 'Customer complained'], ans: 0, xp: 10, feedback: 'First call resolution (FCR) is a key quality indicator that shows efficiency and customer satisfaction.' },
        { scenario: 'You are about to start a live call simulation.', q: 'How should you prepare?', opts: ['Review the customer\'s history', 'Mute your microphone', 'Open multiple tabs', 'Start typing immediately'], ans: 0, xp: 10, feedback: 'Reviewing the customer\'s history helps you provide personalized and efficient service during the call.' }
    ];
}

const COMPETENCY_MODULES = {
    eim: [{ id: 'eim_safety', name: 'Electrical Safety & PPE', icon: '🦺', desc: 'Identify hazards, apply lockout/tagout, and select the correct PPE for electrical work.', type: 'game', gameFile: 'eim-game.html', gameMode: 'code', totalLevels: 5, moduleId: 'eim_safety' },
        { id: 'eim_circuit', name: 'Circuit Installation', icon: '🔌', desc: 'Wire series, parallel and combination circuits correctly to light the lamp.', type: 'game', gameFile: 'eim-game.html', gameMode: 'wire', totalLevels: 5, moduleId: 'eim_circuit' },
        { id: 'eim_symbols', name: 'Electrical Symbols', icon: '🔍', desc: 'Recognize standard schematic symbols used in circuit diagrams.', type: 'game', gameFile: 'eim-game.html', gameMode: 'symbol', totalLevels: 5, moduleId: 'eim_symbols' },
        { id: 'eim_troubleshoot', name: 'Circuit Troubleshooting', icon: '🛠️', desc: 'Inspect broken circuits, diagnose the fault, and apply the correct repair.', type: 'game', gameFile: 'eim-game.html', gameMode: 'fault', totalLevels: 5, moduleId: 'eim_troubleshoot' }
    ],
    ccs: [{ id: 'ccs_script', name: 'Script Savvy', icon: '📋', desc: 'Master call flow and standard phrases.', type: 'game', gameFile: 'ccs-game.html', gameMode: 'script', totalLevels: 5, moduleId: 'ccs_script' },
        { id: 'ccs_storm', name: 'Calm the Storm', icon: '🌊', desc: 'De-escalation and empathy skills.', type: 'game', gameFile: 'ccs-game.html', gameMode: 'storm', totalLevels: 5, moduleId: 'ccs_storm' },
        { id: 'ccs_quality', name: 'Quality Quest', icon: '⭐', desc: 'QA, compliance and metrics.', type: 'game', gameFile: 'ccs-game.html', gameMode: 'quality', totalLevels: 5, moduleId: 'ccs_quality' },
        { id: 'ccs_live', name: 'The Live Call', icon: '🎙️', desc: 'Full simulation assessment.', type: 'game', gameFile: 'ccs-game.html', gameMode: 'live', totalLevels: 5, moduleId: 'ccs_live' }
    ],
    pcops: [{ id: 'pc_ohs', name: 'OHS & Ergonomics', icon: '🛡️', desc: 'Learn computer workstation safety and ergonomics.', type: 'game', gameFile: 'pc-ops-game.html', gameMode: 'ohs', totalLevels: 5, moduleId: 'pc_ohs' },
        { id: 'pc_os', name: 'OS & File Management', icon: '📁', desc: 'Master file organization, extensions, and backup procedures.', type: 'game', gameFile: 'pc-ops-game.html', gameMode: 'os', totalLevels: 5, moduleId: 'pc_os' },
        { id: 'pc_typing', name: 'Typing & Shortcuts', icon: '⌨️', desc: 'Boost productivity with keyboard shortcuts and text management.', type: 'game', gameFile: 'pc-ops-game.html', gameMode: 'typing', totalLevels: 5, moduleId: 'pc_typing' },
        { id: 'pc_spread', name: 'Spreadsheet Ops', icon: '📊', desc: 'Build formulas, format data, and manage worksheets.', type: 'game', gameFile: 'pc-ops-game.html', gameMode: 'spreadsheet', totalLevels: 5, moduleId: 'pc_spread' },
        { id: 'pc_maint', name: 'System Maintenance', icon: '🔧', desc: 'Troubleshoot hardware, update drivers, and clean up your system.', type: 'game', gameFile: 'pc-ops-game.html', gameMode: 'maintenance', totalLevels: 5, moduleId: 'pc_maint' }
    ],
};

const BADGES_DEF = {
    all: [
        { id: 'first_blood', icon: '🩸', name: 'First Steps', desc: 'Complete your very first question correctly.', condition: (s) => s.totalCorrect >= 1 },
        { id: 'sharpshooter', icon: '🎯', name: 'Sharpshooter', desc: 'Score 100% on any module.', condition: (s) => s.perfectModules >= 1 },
        { id: 'persistent', icon: '💪', name: 'Persistent', desc: 'Complete 3 modules (any result).', condition: (s) => s.modulesCompleted >= 3 },
        { id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Answer 10 questions within the time limit.', condition: (s) => s.timedCorrect >= 10 },
        { id: 'nc_ready', icon: '🎓', name: 'NC Ready', desc: 'Pass every module in your track (≥70%).', condition: (s) => s.passedInTrack >= (COMPETENCY_MODULES[s.track]?.length || 3) },
        { id: 'xp_100', icon: '🌟', name: 'Rising Star', desc: 'Earn 100 XP total.', condition: (s) => s.xp >= 100 },
        { id: 'xp_500', icon: '🔥', name: 'On Fire', desc: 'Earn 500 XP total.', condition: (s) => s.xp >= 500 },
        { id: 'level5', icon: '👑', name: 'Champion', desc: 'Reach Level 5.', condition: (s) => s.level >= 5 },
    ],
    eim: [
        { id: 'badge_eim_safety', icon: '🦺', name: 'Safety Certified', desc: 'Pass EIM Safety & PPE (≥70%).', condition: (s) => (s.modules['eim_safety']?.lastPct || 0) >= 70 },
        { id: 'badge_eim_circuit', icon: '🔌', name: 'Circuit Builder', desc: 'Pass EIM Circuit Installation (≥70%).', condition: (s) => (s.modules['eim_circuit']?.lastPct || 0) >= 70 },
        { id: 'badge_eim_symbols', icon: '🔍', name: 'Symbol Master', desc: 'Pass EIM Electrical Symbols (≥70%).', condition: (s) => (s.modules['eim_symbols']?.lastPct || 0) >= 70 },
        { id: 'badge_eim_troubleshoot', icon: '🛠️', name: 'Fault Finder', desc: 'Pass EIM Circuit Troubleshooting (≥70%).', condition: (s) => (s.modules['eim_troubleshoot']?.lastPct || 0) >= 70 },
    ],
    ccs: [
        { id: 'badge_ccs_script', icon: '📋', name: 'Script Savvy', desc: 'Pass CCS Script Savvy (≥70%).', condition: (s) => (s.modules['ccs_script']?.lastPct || 0) >= 70 },
        { id: 'badge_ccs_storm', icon: '🌊', name: 'Storm Calmer', desc: 'Pass CCS Calm the Storm (≥70%).', condition: (s) => (s.modules['ccs_storm']?.lastPct || 0) >= 70 },
        { id: 'badge_ccs_quality', icon: '⭐', name: 'Quality Star', desc: 'Pass CCS Quality Quest (≥70%).', condition: (s) => (s.modules['ccs_quality']?.lastPct || 0) >= 70 },
        { id: 'badge_ccs_live', icon: '🎙️', name: 'Call Hero', desc: 'Pass CCS The Live Call (≥70%).', condition: (s) => (s.modules['ccs_live']?.lastPct || 0) >= 70 },
    ],
    pcops: [
        { id: 'badge_pc_ohs', icon: '🛡️', name: 'Safety Savvy', desc: 'Pass PC OHS & Ergonomics (≥70%).', condition: (s) => (s.modules['pc_ohs']?.lastPct || 0) >= 70 },
        { id: 'badge_pc_os', icon: '📁', name: 'File Master', desc: 'Pass PC OS & File Management (≥70%).', condition: (s) => (s.modules['pc_os']?.lastPct || 0) >= 70 },
        { id: 'badge_pc_typing', icon: '⌨️', name: 'Keyboard Ninja', desc: 'Pass PC Typing & Shortcuts (≥70%).', condition: (s) => (s.modules['pc_typing']?.lastPct || 0) >= 70 },
        { id: 'badge_pc_spread', icon: '📊', name: 'Spreadsheet Pro', desc: 'Pass PC Spreadsheet Ops (≥70%).', condition: (s) => (s.modules['pc_spread']?.lastPct || 0) >= 70 },
        { id: 'badge_pc_maint', icon: '🔧', name: 'Tech Fixer', desc: 'Pass PC System Maintenance (≥70%).', condition: (s) => (s.modules['pc_maint']?.lastPct || 0) >= 70 },
    ]
};

function getBadgesForTrack(track) {
    const allBadges = BADGES_DEF.all || [];
    const trackBadges = BADGES_DEF[track] || [];
    return [...allBadges, ...trackBadges];
}

const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

const MOCK_LEADERBOARD = [
    { name: 'Maria Santos', track: 'eim', xp: 840, level: 5 },
    { name: 'Jose Reyes', track: 'ccs', xp: 720, level: 4 },
    { name: 'Ana Dela Cruz', track: 'pcops', xp: 615, level: 4 },
    { name: 'Carlo Bautista', track: 'eim', xp: 510, level: 3 },
    { name: 'Liza Mendoza', track: 'ccs', xp: 480, level: 3 },
    { name: 'Ramon Torres', track: 'pcops', xp: 355, level: 2 },
    { name: 'Grace Villanueva', track: 'ccs', xp: 290, level: 2 },
    { name: 'Paolo Garcia', track: 'eim', xp: 155, level: 1 },
];

// ══════════════════════════════════════════
// GAME STATE
// ══════════════════════════════════════════
let player = null;
let state = null;
let quizState = null;
let quizTimer = null;
let previousTab = 'dashboard';

function initState(track, name, id) {
    return {
        name, id, track,
        xp: 0, level: 1,
        modules: {}, badges: [],
        totalCorrect: 0, perfectModules: 0, modulesCompleted: 0,
        timedCorrect: 0, passedInTrack: 0,
        history: [],
    };
}

// ══════════════════════════════════════════
// BACKEND API
// ══════════════════════════════════════════
const API_BASE = window.SKILLQUEST_API_BASE || 'https://skillquest-api-llyp.onrender.com/api';

let authToken = null;
let currentUser = null;

async function apiCall(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

function saveSession() {
    if (authToken && currentUser) {
        localStorage.setItem('skillquest_session', JSON.stringify({ token: authToken, user: currentUser }));
        if (state && state.track === 'pcops') {
            localStorage.setItem('skillquest_actual_track', 'pcops');
        } else {
            localStorage.removeItem('skillquest_actual_track');
        }
    }
}

function loadSession() {
    try {
        const raw = localStorage.getItem('skillquest_session');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function clearSession() {
    localStorage.removeItem('skillquest_session');
    localStorage.removeItem('skillquest_actual_track');
    authToken = null;
    currentUser = null;
}

function progressToState(user, p) {
    const actualTrack = localStorage.getItem('skillquest_actual_track');
    let track = user.track;
    if (actualTrack === 'pcops' || (user.track === 'ccs' && actualTrack === 'pcops')) {
        track = 'pcops';
    }
    return {
        name: user.fullName,
        id: user.studentId || 'N/A',
        track: track,
        xp: p.xp,
        level: p.level,
        modules: p.modules || {},
        badges: p.badges || [],
        totalCorrect: p.totalCorrect || 0,
        perfectModules: p.perfectModules || 0,
        modulesCompleted: p.modulesCompleted || 0,
        timedCorrect: p.timedCorrect || 0,
        passedInTrack: p.passedInTrack || 0,
        history: p.history || [],
    };
}

function stateToProgressBody() {
    const backendTrack = state.track === 'pcops' ? 'ccs' : state.track;
    return {
        xp: state.xp,
        level: state.level,
        totalCorrect: state.totalCorrect,
        perfectModules: state.perfectModules,
        modulesCompleted: state.modulesCompleted,
        timedCorrect: state.timedCorrect,
        passedInTrack: state.passedInTrack,
        modules: state.modules,
        badges: state.badges,
        history: state.history,
        _actualTrack: state.track === 'pcops' ? 'pcops' : undefined,
    };
}

const OFFLINE_KEY = 'skillquest_offline_profile';

function saveState() {
    if (state && state.offline) {
        try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(state)); } catch (e) {}
        return;
    }
    if (!state || !authToken || currentUser?.role !== 'trainee') return;
    if (state.track === 'pcops') {
        localStorage.setItem('skillquest_actual_track', 'pcops');
    }
    apiCall('/progress', { method: 'PUT', body: stateToProgressBody() })
        .catch((e) => showToast('⚠ Could not save progress: ' + e.message));
}

async function resumeSession() {
    const saved = loadSession();
    if (!saved) { showToast('⚠ No saved session found'); return; }
    authToken = saved.token;
    currentUser = saved.user;
    try {
        if (currentUser.role === 'trainee') {
            const p = await apiCall('/progress');
            state = progressToState(currentUser, p);
            const actualTrack = localStorage.getItem('skillquest_actual_track');
            if (actualTrack === 'pcops') {
                currentUser.track = 'pcops';
            }
            updateHUD();
            showScreen('main');
            switchTab('dashboard', document.querySelector('.nav-tab'));
        } else {
            await openTrainerDashboard();
        }
    } catch (e) {
        showToast('⚠ Session expired — please log in again');
        clearSession();
        showScreen('login');
    }
}

function confirmLogout() {
    document.getElementById('logout-modal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logout-modal').style.display = 'none';
}

function doLogout() {
    document.getElementById('logout-modal').style.display = 'none';
    clearInterval(quizTimer);
    clearSession();
    state = null;
    showToast('Logged out');
    showScreen('splash');
    document.getElementById('continue-btn').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('continue-btn');
    if (btn && loadSession()) btn.style.display = '';
    const statusEl = document.getElementById('api-status');
    if (statusEl) {
        fetch(`${API_BASE}/health`).then(r => {
            statusEl.textContent = r.ok ? `API connected · ${API_BASE}` : `API unreachable · ${API_BASE}`;
        }).catch(() => { statusEl.textContent =
            `⚠ Backend not running at ${API_BASE} — start the /server first, or use Quick Demo`; });
    }
});

function calcLevel(xp) {
    for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
        if (xp >= XP_PER_LEVEL[i]) return i + 1;
    }
    return 1;
}

function xpForLevel(lvl) { return XP_PER_LEVEL[Math.min(lvl - 1, XP_PER_LEVEL.length - 1)]; }

function xpForNextLevel(lvl) { return XP_PER_LEVEL[Math.min(lvl, XP_PER_LEVEL.length - 1)]; }

function addXP(amount) {
    const prevLevel = state.level;
    state.xp += amount;
    state.level = calcLevel(state.xp);
    updateHUD();
    showXPPopup(amount);
    if (state.level > prevLevel) {
        document.getElementById('levelup-msg').textContent =
            `You reached Level ${state.level}! XP earned: ${state.xp}. Keep pushing toward NC readiness!`;
        openModal('levelup-modal');
    }
    checkBadges();
    saveState();
}

function checkBadges() {
    const trackBadges = getBadgesForTrack(state.track);
    trackBadges.forEach(b => {
        if (!state.badges.includes(b.id) && b.condition(state)) {
            state.badges.push(b.id);
            document.getElementById('badge-modal-icon').textContent = b.icon;
            document.getElementById('badge-modal-msg').textContent =
                `You earned the "${b.name}" badge! ${b.desc}`;
            setTimeout(() => openModal('badge-modal'), 800);
        }
    });
}

// ══════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
}

function showXPPopup(amount) {
    const el = document.createElement('div');
    el.className = 'xp-popup';
    el.textContent = `+${amount} XP`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 650);
}

function updateHUD() {
    if (!state) return;
    document.getElementById('hud-name').textContent = state.name;
    document.getElementById('hud-track').textContent = TRACKS[state.track]?.label || state.track;
    document.getElementById('hud-level').textContent = state.level;
    document.getElementById('hud-xp').textContent = state.xp;
    const next = xpForNextLevel(state.level);
    const prev = xpForLevel(state.level);
    document.getElementById('hud-next').textContent = next;
    const pct = Math.min(100, Math.round(((state.xp - prev) / (next - prev)) * 100));
    document.getElementById('hud-xp-bar').style.width = pct + '%';
}

function selectRole(role, el) {
    document.querySelectorAll('[data-role]').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    window._selectedRole = role;
    const trackGroup = document.getElementById('reg-track-group');
    const submitBtn = document.getElementById('reg-submit-btn');
    if (role === 'trainer') {
        trackGroup.style.display = 'none';
        submitBtn.textContent = 'Create Trainer Account →';
    } else {
        trackGroup.style.display = '';
        submitBtn.textContent = 'Create Account →';
    }
}
window._selectedRole = 'trainee';

function selectTrack(track, el) {
    document.querySelectorAll('.track-card[data-track]').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    el.dataset.track = track;
    window._selectedTrack = track;
    window._selectedActualTrack = track;
}

function showFormError(id, message) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.style.display = 'block';
}

function hideFormError(id) {
    document.getElementById(id).style.display = 'none';
}

function togglePasswordVisibility(inputId, toggleButton) {
    const input = document.getElementById(inputId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggleButton.textContent = isHidden ? 'Hide' : 'Show';
    toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    toggleButton.setAttribute('aria-pressed', String(isHidden));
}

async function registerAccount() {
    hideFormError('reg-error');
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value.trim();
    const id = document.getElementById('reg-id').value.trim();
    const role = window._selectedRole || 'trainee';
    const actualTrack = window._selectedActualTrack || window._selectedTrack;

    if (!username) return showFormError('reg-error', 'Please enter a username');
    if (!password || password.length < 6) return showFormError('reg-error', 'Password must be at least 6 characters');
    if (!name) return showFormError('reg-error', 'Please enter your full name');
    if (role === 'trainee' && !actualTrack) return showFormError('reg-error', 'Please select your NC track');

    let backendTrack = actualTrack;

    const btn = document.getElementById('reg-submit-btn');
    btn.disabled = true;
    try {
        const body = { username, password, role, fullName: name, studentId: id || undefined };
        if (role === 'trainee') body.track = backendTrack;
        const data = await apiCall('/auth/register', { method: 'POST', body, auth: false });
        authToken = data.token;
        currentUser = data.user;
        currentUser.track = actualTrack;
        saveSession();
        if (role === 'trainee') {
            state = progressToState(currentUser, {
                xp: 0,
                level: 1,
                modules: {},
                badges: [],
                totalCorrect: 0,
                perfectModules: 0,
                modulesCompleted: 0,
                timedCorrect: 0,
                passedInTrack: 0,
                history: [],
            });
            state.track = actualTrack;
            updateHUD();
            showScreen('main');
            switchTab('dashboard', document.querySelector('.nav-tab'));
        } else {
            await openTrainerDashboard();
        }
    } catch (e) {
        showFormError('reg-error', e.message);
    } finally {
        btn.disabled = false;
    }
}

async function loginAccount() {
    hideFormError('login-error');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) return showFormError('login-error', 'Enter your username and password');

    const btn = document.getElementById('login-submit-btn');
    btn.disabled = true;
    try {
        const data = await apiCall('/auth/login', { method: 'POST', body: { username, password }, auth: false });
        authToken = data.token;
        currentUser = data.user;
        saveSession();
        if (currentUser.role === 'trainee') {
            const p = await apiCall('/progress');
            const actualTrack = localStorage.getItem('skillquest_actual_track');
            if (actualTrack === 'pcops') {
                currentUser.track = 'pcops';
            }
            state = progressToState(currentUser, p);
            if (actualTrack === 'pcops') {
                state.track = 'pcops';
            }
            updateHUD();
            showScreen('main');
            switchTab('dashboard', document.querySelector('.nav-tab'));
        } else {
            await openTrainerDashboard();
        }
    } catch (e) {
        showFormError('login-error', e.message);
    } finally {
        btn.disabled = false;
    }
}

async function openTrainerDashboard(track) {
    showScreen('trainer-main');
    document.getElementById('trainer-hud-name').textContent = currentUser.fullName;
    const el = document.getElementById('trainer-content');
    el.innerHTML = `<p style="color:var(--muted);">Loading trainees…</p>`;
    try {
        const query = track ? `?track=${track}` : '';
        const trainees = await apiCall(`/trainer/trainees${query}`);
        renderTrainerDashboard(el, trainees, track);
    } catch (e) {
        el.innerHTML = `<p style="color:var(--accent4);">Could not load trainees: ${e.message}</p>`;
    }
}

function renderTrainerDashboard(el, trainees, activeTrack) {
    const tabs = [
        ['', 'All Tracks'],
        ['eim', 'EIM NC II'],
        ['ccs', 'CCS NC II'],
        ['pcops', 'PC OPS NC II']
    ];
    el.innerHTML = `
    <div class="section-title">Trainee Results (${trainees.length})</div>
    <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
      ${tabs.map(([val, label]) => `
        <button class="btn ${((activeTrack||'')===val) ? 'btn-primary' : 'btn-secondary'}" style="padding:8px 16px;font-size:13px;flex:0 1 auto;"
          onclick="openTrainerDashboard(${val ? `'${val}'` : 'undefined'})">${label}</button>
      `).join('')}
    </div>
    ${trainees.length === 0 ? `<p style="color:var(--muted);">No trainees yet for this track.</p>` : `
    <div class="leaderboard-table">
      ${trainees.map((t, i) => {
        const displayTrack = t._actualTrack === 'pcops' ? 'pcops' : t.track;
        return `
          <div class="lb-row">
            <div class="lb-rank">${i + 1}</div>
            <div class="lb-player">
              <div class="lb-name">${t.fullName}${t.studentId ? ` <span style="color:var(--muted);font-size:11px;">(${t.studentId})</span>` : ''}</div>
              <div class="lb-track-tag">${TRACKS[displayTrack]?.label || displayTrack} · ${t.modulesCompleted} modules · ${(t.badges||[]).length} badges</div>
            </div>
            <div class="lb-level">Lv.${t.level}</div>
            <div class="lb-xp">${t.xp} XP</div>
          </div>`;
      }).join('')}
    </div>`}
  `;
}

function enterOffline() {
    if (state.track === 'pcops') localStorage.setItem('skillquest_actual_track', 'pcops');
    else localStorage.removeItem('skillquest_actual_track');
    updateHUD();
    showScreen('main');
    switchTab('dashboard', document.querySelector('.nav-tab'));
}

function openOffline() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(OFFLINE_KEY)); } catch (e) {}
    if (saved && saved.offline) { state = saved; enterOffline(); }
    else showScreen('offline');
}

function selectOfflineTrack(track, el) {
    document.querySelectorAll('[data-otrack]').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    window._offlineTrack = track;
}

function createOfflineProfile() {
    const name = document.getElementById('off-name').value.trim();
    const err = document.getElementById('off-error');
    if (!name || !window._offlineTrack) {
        err.textContent = !name ? 'Please enter your name' : 'Please select your NC track';
        err.style.display = 'block';
        return;
    }
    state = initState(window._offlineTrack, name, 'OFFLINE');
    state.offline = true;
    saveState();
    enterOffline();
}

function loadDemo() {
    state = initState('pcops', 'Demo Trainee', 'DEMO-001');
    state.xp = 320;
    state.level = 3;
    state.totalCorrect = 12;
    state.timedCorrect = 8;
    state.modulesCompleted = 2;
    state.modules['pc_ohs'] = { score: 4, attempts: 1, lastPct: 80 };
    state.modules['pc_os'] = { score: 3, attempts: 1, lastPct: 60 };
    state.badges = ['first_blood', 'xp_100'];
    state.history = [
        { id: 'pc_ohs', name: 'OHS & Ergonomics', pct: 80, rating: 'C', xpEarned: 90 },
        { id: 'pc_os', name: 'OS & File Management', pct: 60, rating: 'NYC', xpEarned: 60 },
    ];
    localStorage.setItem('skillquest_actual_track', 'pcops');
    updateHUD();
    showScreen('main');
    switchTab('dashboard', document.querySelector('.nav-tab'));
}

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════
function switchTab(tab, el) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
        const tabs = document.querySelectorAll('.nav-tab');
        const map = { dashboard: 0, modules: 1, analytics: 2, badges: 3, leaderboard: 4 };
        if (tabs[map[tab]]) tabs[map[tab]].classList.add('active');
    }
    const content = document.getElementById('main-content');
    if (tab === 'dashboard') renderDashboard(content);
    else if (tab === 'modules') renderModules(content);
    else if (tab === 'analytics') renderAnalytics(content);
    else if (tab === 'badges') renderBadges(content);
    else if (tab === 'leaderboard') renderLeaderboard(content);
}

function getCurrentTabName() {
    const activeTab = document.querySelector('.nav-tab.active');
    if (!activeTab) return 'dashboard';
    const txt = activeTab.textContent || '';
    if (txt.includes('Dashboard')) return 'dashboard';
    if (txt.includes('Modules')) return 'modules';
    if (txt.includes('Analytics')) return 'analytics';
    if (txt.includes('Badges')) return 'badges';
    if (txt.includes('Leaderboard')) return 'leaderboard';
    return 'dashboard';
}

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════
function renderDashboard(el) {
    const modules = COMPETENCY_MODULES[state.track] || [];
    const completed = modules.filter(m => state.modules[m.id]?.lastPct >= 70).length;
    const overallPct = modules.length > 0 ?
        Math.round(modules.reduce((a, m) => a + (state.modules[m.id]?.lastPct || 0), 0) / modules.length) :
        0;

    el.innerHTML = `
    <h2 style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">
      Welcome back, ${state.name}!
    </h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:24px;">
      Track: <strong style="color:var(--text);">${TRACKS[state.track]?.full || state.track}</strong> &nbsp;·&nbsp; Student ID: ${state.id}
    </p>
    <div class="dash-grid">
      <div class="stat-card">
        <div class="stat-label">Total XP</div>
        <div class="stat-value" style="color:var(--accent3)">${state.xp}</div>
        <div class="stat-sub">Level ${state.level} Trainee</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Modules Passed</div>
        <div class="stat-value" style="color:var(--accent2)">${completed} / ${modules.length}</div>
        <div class="stat-sub">≥70% = Competent</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Overall Score</div>
        <div class="stat-value" style="color:${overallPct>=70?'var(--accent2)':'var(--accent4)'}">${overallPct}%</div>
        <div class="stat-sub">${overallPct>=70?'Competent':'Needs Practice'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Badges Earned</div>
        <div class="stat-value" style="color:var(--accent1)">${state.badges.length}</div>
        <div class="stat-sub">of ${getBadgesForTrack(state.track).length} total</div>
      </div>
    </div>

    ${certBannerHTML()}
    <div class="section-title">NC Readiness Progress</div>
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--r);padding:20px;margin-bottom:28px;">
      ${modules.map(m => {
        const mod = state.modules[m.id];
        const pct = mod?.lastPct || 0;
        return `
          <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;font-weight:500;">${m.icon} ${m.name}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:${pct>=70?'var(--accent2)':'var(--muted)'};">${pct}% ${pct>=70?'✓ C':'NYC'}</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${pct>=70?'var(--accent2)':'var(--accent1)'};border-radius:4px;transition:width .5s;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="section-title">Quick Play</div>
    <div class="competency-grid">
      ${modules.map((m,i) => {
        const mod = state.modules[m.id];
        const locked = i > 0 && !state.modules[modules[i-1].id];
        const pct = mod?.lastPct || 0;
        const status = !mod ? 'not-started' : pct >= 70 ? 'competent' : 'nyc';
        return `
          <div class="comp-card ${state.track} ${locked?'locked':''} ${status==='competent'?'completed':''}"
               onclick="${locked?'showToast(\'🔒 Complete the previous module first!\')':  `startGameModule('${m.id}')`}">
            <div class="comp-header">
              <div class="comp-icon">${m.icon}</div>
              <div class="comp-status ${status==='competent'?'competent':status==='nyc'?'nyc':status==='not-started'?'locked-s':'in-progress'}">
                ${status==='competent'?'✓ COMPETENT':status==='nyc'?'✗ NYC':'NOT STARTED'}
              </div>
            </div>
            <div class="comp-name">${m.name}</div>
            <div class="comp-desc">${m.desc}</div>
            <div class="comp-progress-bar"><div class="comp-progress-fill" style="width:${pct}%"></div></div>
            <div class="comp-meta">
              <span>${m.type === 'game' ? m.totalLevels + ' levels · interactive game' : 'questions'}</span>
              <span>${pct}%${mod?.attempts?` · ${mod.attempts} attempt${mod.attempts>1?'s':''}`:''}</span>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════
// MODULES
// ══════════════════════════════════════════
function renderModules(el) {
    const trackNames = Object.keys(COMPETENCY_MODULES);
    el.innerHTML = `
    <div class="section-title">All Qualification Modules</div>
    ${trackNames.map(tk => `
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="font-size:24px;">${TRACKS[tk]?.icon || '📚'}</span>
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;">${TRACKS[tk]?.label || tk}</div>
            <div style="font-size:12px;color:var(--muted);">${TRACKS[tk]?.full || tk}</div>
          </div>
          ${tk===state.track?'<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(168,85,247,.15);color:var(--pcops);font-family:\'JetBrains Mono\',monospace;">YOUR TRACK</span>':''}
        </div>
        <div class="competency-grid">
          ${COMPETENCY_MODULES[tk].map(m => {
            const mod = state.modules[m.id];
            const pct = mod?.lastPct || 0;
            const canPlay = tk === state.track;
            return `
              <div class="comp-card ${tk}" onclick="${canPlay?`startGameModule('${m.id}')`:  `showToast('Switch to ${TRACKS[tk]?.label || tk} to attempt this module')`}"
                   style="${!canPlay?'opacity:.6;cursor:not-allowed;':''}">
                <div class="comp-header">
                  <div class="comp-icon">${m.icon}</div>
                  <div class="comp-status ${pct>=70?'competent':mod?'nyc':'locked-s'}">
                    ${pct>=70?'✓ C':mod?'NYC':'OPEN'}
                  </div>
                </div>
                <div class="comp-name">${m.name}</div>
                <div class="comp-desc">${m.desc}</div>
                <div class="comp-progress-bar"><div class="comp-progress-fill" style="width:${pct}%"></div></div>
                <div class="comp-meta">
                  <span>${m.type === 'game' ? m.totalLevels + ' levels · interactive game' : 'questions'}</span>
                  <span>${pct}%</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

// ══════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════
function renderAnalytics(el) {
    const modules = COMPETENCY_MODULES[state.track] || [];
    el.innerHTML = `
    <div class="section-title">Performance Analytics</div>
    <div class="analytics-grid">
      <div class="analytics-card">
        <h3>Competency Unit Progress</h3>
        ${modules.map(m => {
          const pct = state.modules[m.id]?.lastPct || 0;
          return `
            <div class="competency-row">
              <div class="comp-row-name">${m.icon} ${m.name}</div>
              <div class="comp-row-bar"><div class="comp-row-fill" style="width:${pct}%;background:${pct>=70?'var(--accent2)':'var(--accent1)'}"></div></div>
              <div class="comp-row-pct">${pct}%</div>
            </div>`;
        }).join('')}
      </div>
      <div class="analytics-card">
        <h3>XP & Level Progression</h3>
        <div style="text-align:center;padding:20px 0;">
          <div style="font-family:'Rajdhani',sans-serif;font-size:64px;font-weight:700;color:var(--accent3);line-height:1;">${state.level}</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">Current Level</div>
          <div style="background:var(--border);height:12px;border-radius:6px;overflow:hidden;margin-bottom:8px;">
            <div style="height:100%;width:${Math.min(100,Math.round(((state.xp-xpForLevel(state.level))/(xpForNextLevel(state.level)-xpForLevel(state.level)))*100))}%;background:linear-gradient(90deg,var(--accent3),#f97316);border-radius:6px;transition:width .5s;"></div>
          </div>
          <div style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;">${state.xp} / ${xpForNextLevel(state.level)} XP to Level ${state.level+1}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
          <div style="background:var(--card);border-radius:8px;padding:14px;text-align:center;">
            <div style="font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:var(--accent2);">${state.totalCorrect}</div>
            <div style="font-size:11px;color:var(--muted);">Correct Answers</div>
          </div>
          <div style="background:var(--card);border-radius:8px;padding:14px;text-align:center;">
            <div style="font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:var(--accent1);">${state.modulesCompleted}</div>
            <div style="font-size:11px;color:var(--muted);">Modules Attempted</div>
          </div>
        </div>
      </div>
      <div class="analytics-card" style="grid-column:1/-1;">
        <h3>Attempt History</h3>
        ${state.history.length === 0
          ? '<div style="color:var(--muted);font-size:14px;text-align:center;padding:20px;">No attempts yet — complete a module to see your history.</div>'
          : `<div class="history-list">
              ${state.history.slice().reverse().map(h => {
                const mod = COMPETENCY_MODULES[state.track]?.find(m => m.id === h.id);
                return `
                  <div class="history-item">
                    <div class="hist-icon">${mod?.icon||'📋'}</div>
                    <div class="hist-name">${h.name}</div>
                    <div class="hist-score">${h.pct}% · +${h.xpEarned} XP</div>
                    <div class="hist-rating ${h.rating==='C'?'rating-c':'rating-nyc'}">${h.rating}</div>
                  </div>`;
              }).join('')}
            </div>`}
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════
function renderBadges(el) {
    const trackBadges = getBadgesForTrack(state.track);
    const earnedCount = state.badges.filter(id => trackBadges.some(b => b.id === id)).length;

    el.innerHTML = `
    <div class="section-title">🏅 ${TRACKS[state.track]?.label} Badges</div>
    <p style="color:var(--muted);font-size:14px;margin-bottom:20px;">
      You've earned <strong style="color:var(--accent3);">${earnedCount}</strong> out of <strong>${trackBadges.length}</strong> badges for your track.
      Complete modules with ≥70% to earn track-specific badges.
    </p>
    <div class="badges-grid">
      ${trackBadges.map(b => {
        const earned = state.badges.includes(b.id);
        return `
          <div class="badge-card ${earned?'earned':'locked-b'}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
            ${earned?'<div class="badge-earned-tag">✓ EARNED</div>':'<div style="font-size:10px;color:var(--border);margin-top:6px;">🔒 LOCKED</div>'}
          </div>`;
      }).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════
function renderLeaderboard(el) {
    el.innerHTML = `<p style="color:var(--muted);">Loading leaderboard…</p>`;

    const userTrack = state.track;
    const trackLabel = TRACKS[userTrack]?.label || userTrack;

    function getActualTrack(row) {
        if (row._actualTrack === 'pcops') return 'pcops';
        if (row.track === 'pcops') return 'pcops';
        return row.track;
    }

    function isInUserTrack(row) {
        const actual = getActualTrack(row);
        if (userTrack === 'pcops') {
            return actual === 'pcops' || row._actualTrack === 'pcops';
        }
        return actual === userTrack;
    }

    const me = {
        name: state.name,
        track: state.track,
        xp: state.xp,
        level: state.level,
        isMe: true,
        _actualTrack: state.track === 'pcops' ? 'pcops' : undefined
    };

    const finish = (rows) => {
        let filtered = rows.filter(r => isInUserTrack(r));

        const meIncluded = filtered.some(r => {
            if (r.isMe) return true;
            if (r.name === state.name) {
                const rTrack = getActualTrack(r);
                return rTrack === state.track;
            }
            return false;
        });
        if (!meIncluded) {
            filtered.push(me);
        }

        const sorted = filtered.sort((a, b) => b.xp - a.xp);

        const unique = [];
        const seen = new Set();
        for (const p of sorted) {
            const key = p.name + getActualTrack(p);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(p);
            }
        }

        const rankColors = ['gold', 'silver', 'bronze'];
        el.innerHTML = `
        <div class="section-title">🏆 ${trackLabel} Leaderboard</div>
        <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">
          Rankings among <strong style="color:var(--text);">${trackLabel}</strong> trainees.
          Keep earning XP to climb the board!
        </p>
        ${unique.length === 0 ? '<p style="color:var(--muted);">No other trainees in this track yet.</p>' : `
        <div class="leaderboard-table">
          ${unique.map((p, i) => {
            const isMe = p.isMe || (p.name === state.name && getActualTrack(p) === state.track);
            const displayTrack = getActualTrack(p);
            return `
              <div class="lb-row ${isMe?'me':''}">
                <div class="lb-rank ${rankColors[i]||''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
                <div class="lb-player">
                  <div class="lb-name">${p.name}${isMe?' <span style="font-size:10px;color:var(--accent1);">(You)</span>':''}</div>
                  <div class="lb-track-tag">${TRACKS[displayTrack]?.label || displayTrack}</div>
                </div>
                <div class="lb-level">Lv.${p.level}</div>
                <div class="lb-xp">${p.xp} XP</div>
              </div>`;
          }).join('')}
        </div>`}
      `;
    };

    if (authToken) {
        apiCall('/leaderboard')
            .then((rows) => {
                const mapped = rows.map(r => ({
                    name: r.name,
                    track: r.track,
                    xp: r.xp,
                    level: r.level,
                    _actualTrack: r._actualTrack,
                    isMe: r.name === state.name && (r.track === state.track || r._actualTrack === state
                    .track)
                }));
                finish(mapped);
            })
            .catch(() => {
                const filteredMock = MOCK_LEADERBOARD.filter(r => {
                    if (userTrack === 'pcops') {
                        return r.track === 'pcops';
                    }
                    return r.track === userTrack;
                });
                finish(filteredMock);
            });
    } else {
        const filteredMock = MOCK_LEADERBOARD.filter(r => {
            if (userTrack === 'pcops') {
                return r.track === 'pcops';
            }
            return r.track === userTrack;
        });
        finish(filteredMock);
    }
}

// ══════════════════════════════════════════
// CERTIFICATE
// ══════════════════════════════════════════
function isTrackComplete() {
    const mods = COMPETENCY_MODULES[state.track] || [];
    return mods.length > 0 && mods.every(m => (state.modules[m.id]?.lastPct || 0) >= 70);
}

function certBannerHTML() {
    const done = isTrackComplete();
    return `
    <div class="cert-banner ${done ? '' : 'locked'}">
      <div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;">🎓 Certificate of Accomplishment</div>
        <div style="font-size:13px;color:var(--muted);">${done
            ? 'You completed every module in your track. Claim your certificate!'
            : 'Pass all modules in your track (≥70%) to unlock.'}</div>
      </div>
      <button class="btn btn-success" ${done ? '' : 'disabled'} onclick="openCertificate()">View Certificate</button>
    </div>`;
}

function openCertificate() {
    if (!isTrackComplete()) return showToast('🔒 Finish all modules first');
    drawCertificate();
    openModal('cert-modal');
}

function drawCertificate() {
    const c = document.getElementById('cert-canvas');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const track = TRACKS[state.track];
    const mods = COMPETENCY_MODULES[state.track];
    const avg = Math.round(mods.reduce((a, m) => a + (state.modules[m.id]?.lastPct || 0), 0) / mods.length);
    const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 14; g.strokeRect(40, 40, W - 80, H - 80);
    g.strokeStyle = '#d4a017'; g.lineWidth = 4; g.strokeRect(65, 65, W - 130, H - 130);

    g.textAlign = 'center';
    g.fillStyle = '#1e3a8a'; g.font = 'bold 34px Rajdhani, sans-serif';
    g.fillText('SKILLQUEST · TESDA GAMIFIED ASSESSMENT', W / 2, 160);
    g.font = 'bold 84px Georgia, serif'; g.fillText('Certificate of Accomplishment', W / 2, 290);
    g.fillStyle = '#444'; g.font = '30px Georgia, serif';
    g.fillText('This is proudly presented to', W / 2, 380);

    g.fillStyle = '#b45309'; g.font = 'italic bold 96px Georgia, serif';
    g.fillText(state.name, W / 2, 510);
    g.strokeStyle = '#d4a017'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W / 2 - 420, 535); g.lineTo(W / 2 + 420, 535); g.stroke();

    g.fillStyle = '#444'; g.font = '30px Georgia, serif';
    g.fillText('for successfully completing all competency modules of', W / 2, 610);
    g.fillStyle = '#1e3a8a'; g.font = 'bold 54px Georgia, serif';
    g.fillText(`${track.full} (${track.label})`, W / 2, 690);
    g.fillStyle = '#444'; g.font = '28px Georgia, serif';
    g.fillText(`Overall Score: ${avg}%  ·  Level ${state.level}  ·  ${state.xp} XP  ·  ${state.badges.length} Badges`, W / 2, 770);
    g.fillText('Rating: COMPETENT', W / 2, 815);

    g.font = '24px Georgia, serif';
    g.textAlign = 'left'; g.fillText(`Date: ${date}`, 150, 960);
    g.fillText(`ID: ${state.id}`, 150, 1000);
    g.textAlign = 'right';
    g.fillText('City College of Calamba', W - 150, 960);
    g.fillText('Dept. of Computing and Informatics', W - 150, 1000);
    g.textAlign = 'center';
    g.font = 'italic 20px Georgia, serif'; g.fillStyle = '#888';
    g.fillText('Practice assessment only — not an official TESDA National Certificate.', W / 2, 1060);
}

function downloadCertificate() {
    drawCertificate();
    const a = document.createElement('a');
    a.href = document.getElementById('cert-canvas').toDataURL('image/png');
    a.download = `SkillQuest_Certificate_${state.name.replace(/\s+/g, '_')}.png`;
    a.click();
}

// ══════════════════════════════════════════
// GAME MODULE ENGINE
// ══════════════════════════════════════════
let currentGameModule = null;
const gameProgress = {};

function startGameModule(moduleId) {
    previousTab = getCurrentTabName();

    const module = Object.values(COMPETENCY_MODULES).flat().find(m => m.id === moduleId);
    if (!module) {
        showToast('Module not found');
        return;
    }

    currentGameModule = module;
    const track = Object.entries(COMPETENCY_MODULES).find(([k, v]) => v.some(m => m.id === module.id))?.[0];

    document.getElementById('gm-comp-name').textContent = `${module.icon} ${module.name}`;
    const badge = document.getElementById('gm-track-badge');
    badge.textContent = TRACKS[track]?.label || track;
    const colorMap = { eim: '245,158,11', ccs: '34,211,165', pcops: '168,85,247' };
    badge.style.background = `rgba(${colorMap[track] || '168,85,247'},.1)`;
    badge.style.color = TRACKS[track]?.color || '#a855f7';
    badge.style.border = `1px solid ${TRACKS[track]?.color || '#a855f7'}`;
    document.getElementById('gm-progress-text').textContent = 'Loading game...';

    const iframe = document.getElementById('gm-iframe');
    let gameFile = module.gameFile || 'eim-game.html';

    let url = 'games/' + gameFile;
    const params = new URLSearchParams();
    params.set('embed', '1');
    if (module.gameMode) {
        params.set('game', module.gameMode);
    }
    params.set('module', module.id);
    url += '?' + params.toString();

    iframe.src = url;

    const prev = state.modules[module.id];
    gameProgress[module.id] = prev ?
        { completed: Math.round((prev.lastPct / 100) * module.totalLevels), total: module.totalLevels,
            pct: prev.lastPct, xp: 0, moduleComplete: prev.lastPct >= 70 } :
        { completed: 0, total: module.totalLevels, pct: 0, xp: 0, moduleComplete: false };

    showScreen('game-module-screen');
}

window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || !currentGameModule) {
        if (data && data.type === 'MODULE_COMPLETE' && data.moduleId) {
            handleModuleComplete(data.moduleId, data.pct, data.xpEarned || 0);
        }
        return;
    }

    const moduleId = currentGameModule.id;

    if (data.type === 'PROGRESS_UPDATE' || data.type === 'EIM_MODULE_PROGRESS' ||
        data.type === 'CCS_MODULE_PROGRESS' || data.type === 'PC_OPS_PROGRESS') {

        const prog = gameProgress[moduleId] || { completed: 0, total: data.total || currentGameModule.totalLevels,
            pct: 0, xp: 0, moduleComplete: false };

        if (data.completed !== undefined) prog.completed = data.completed;
        if (data.total) prog.total = data.total;
        if (data.pct !== undefined) prog.pct = data.pct;
        if (data.earnedXP) prog.xp = (prog.xp || 0) + data.earnedXP;
        if (data.moduleComplete) prog.moduleComplete = true;

        gameProgress[moduleId] = prog;

        document.getElementById('gm-progress-text').textContent =
            `Level ${prog.completed} / ${prog.total} complete · ${prog.pct}%`;

        if (data.moduleComplete) {
            showToast(`🎉 ${currentGameModule.name} complete!`);
            setTimeout(() => {
                handleModuleComplete(moduleId, prog.pct, prog.xp);
            }, 1000);
        }
    }

    if (data.type === 'MODULE_COMPLETE') {
        handleModuleComplete(data.moduleId || moduleId, data.pct || 0, data.xpEarned || 0);
    }

    if (data.type === 'EIM_EXIT' || data.type === 'EXIT_MODULE') {
        exitGameModule();
    }

    if (data.type === 'CSS_GAME_READY' || data.type === 'EIM_GAME_READY') {
        document.getElementById('gm-progress-text').textContent =
            `Game ready! Complete all ${currentGameModule.totalLevels} levels.`;
    }
});

function handleModuleComplete(moduleId, pct, xpEarned) {
    const module = Object.values(COMPETENCY_MODULES).flat().find(m => m.id === moduleId);
    if (!module) return;

    const prev = state.modules[moduleId];
    const bestPct = Math.max(pct, prev?.lastPct || 0);
    const isImprovement = !prev || bestPct > prev.lastPct;
    const rating = bestPct >= 70 ? 'C' : 'NYC';

    state.modules[moduleId] = {
        score: Math.round((bestPct / 100) * module.totalLevels),
        attempts: (prev?.attempts || 0) + (isImprovement || !prev ? 1 : 0),
        lastPct: bestPct,
    };
    if (!prev) state.modulesCompleted++;
    if (bestPct === 100 && (!prev || prev.lastPct < 100)) state.perfectModules++;
    if (rating === 'C') {
        const trackModules = COMPETENCY_MODULES[state.track];
        state.passedInTrack = trackModules.filter(m => state.modules[m.id]?.lastPct >= 70).length;
    }
    if (isImprovement && xpEarned > 0) {
        state.history.push({ id: moduleId, name: module.name, pct: bestPct, rating, xpEarned });
        addXP(xpEarned);
    }

    currentGameModule = null;
    updateHUD();
    saveState();
    showMain();
    if (isTrackComplete()) setTimeout(() => { showToast('🎓 Certificate unlocked!'); openCertificate(); }, 600);
}

function exitGameModule() {
    if (currentGameModule) {
        const moduleId = currentGameModule.id;
        const prog = gameProgress[moduleId];
        if (prog && prog.completed > 0 && prog.pct > 0) {
            handleModuleComplete(moduleId, prog.pct, prog.xp || 0);
        } else {
            currentGameModule = null;
        }
    }
    document.getElementById('gm-iframe').src = 'about:blank';
    showMain();
}

function exitQuiz() {
    clearInterval(quizTimer);
    showMain();
}

function showMain() {
    showScreen('main');
    updateHUD();
    switchTab(previousTab);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
