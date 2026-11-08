// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RIPPLE EFFECT
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
    ohs: { level: 0, completed: new Set() },
    os: { level: 0, completed: new Set() },
    typing: { level: 0, completed: new Set() },
    spreadsheet: { level: 0, completed: new Set() },
    maintenance: { level: 0, completed: new Set() },
    timerInterval: null,
    seconds: 0,
};

// ━━━ FINITE STATE MACHINE (one phase per module) ━━━
// SELECT → INSTRUCTIONS → PLAYING → COMPLETE | GAME_OVER
// Phase changes ONLY through transition(); illegal events are ignored.
const GAME_FSM = {
    SELECT:       { START: 'INSTRUCTIONS' },
    INSTRUCTIONS: { PLAY: 'PLAYING', BACK: 'SELECT' },
    PLAYING:      { PASS: 'COMPLETE', FAIL: 'GAME_OVER', RESTART: 'PLAYING', EXIT: 'SELECT' },
    COMPLETE:     { REPLAY: 'PLAYING', NEXT: 'SELECT', EXIT: 'SELECT' },
    GAME_OVER:    { RETRY: 'PLAYING', EXIT: 'SELECT' }
};
['ohs', 'os', 'typing', 'spreadsheet', 'maintenance'].forEach(m => { state[m].phase = 'SELECT'; });
function transition(game, ev) {
    const next = GAME_FSM[state[game].phase]?.[ev];
    if (!next) return false;
    state[game].phase = next;
    return true;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOSSARY DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GLOSSARY = {
    'OHS': 'Occupational Health and Safety',
    'ESD': 'Electrostatic Discharge',
    'PPE': 'Personal Protective Equipment',
    'OS': 'Operating System',
    'CRM': 'Customer Relationship Management',
    'QA': 'Quality Assurance',
    'AHT': 'Average Handling Time',
    'FCR': 'First Call Resolution',
    'CSAT': 'Customer Satisfaction',
    'ASA': 'Average Speed of Answer',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS FOR ACRONYM TOOLTIPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function wrapAcronyms(text) {
    if (!text) return text;
    // Replace known acronyms with <abbr> tag
    let result = text;
    for (const [acro, meaning] of Object.entries(GLOSSARY)) {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp('\\b' + acro + '\\b', 'g');
        result = result.replace(regex, `<abbr title="${meaning}">${acro}</abbr>`);
    }
    return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL DATA – 5 levels per module, 5 questions each
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MODULE_LEVELS = {};

// --- OHS ---
MODULE_LEVELS.ohs = [
    { name: 'Safety Basics', questions: [
            { type: 'dragdrop', title: 'Match safety gear to body part.',
                zones: ['Head', 'Hands', 'Feet'],
                items: ['Hard Hat', 'Gloves', 'Safety Shoes', 'Ear Plugs', 'Goggles'],
                correct: { 'Hard Hat': 'Head', 'Gloves': 'Hands', 'Safety Shoes': 'Feet', 'Ear Plugs': 'Head',
                    'Goggles': 'Head' } },
            { type: 'choice', title: 'What is the first step in preventing ESD?', options: ['Wear gloves',
                    'Use anti-static wrist strap', 'Turn off power', 'Remove jewelry'
                ], correct: 1 },
            { type: 'sequence', title: 'Tap steps for proper ergonomic setup.', steps: ['Adjust chair height',
                    'Set monitor at eye level', 'Place keyboard flat'
                ] },
            { type: 'dragdrop', title: 'Match hazard to control.',
                zones: ['Overload', 'Cable damage', 'Residual charge'],
                items: ['Use surge protector', 'Inspect regularly', 'Discharge before touching'],
                correct: { 'Use surge protector': 'Overload', 'Inspect regularly': 'Cable damage',
                    'Discharge before touching': 'Residual charge' } },
            { type: 'choice', title: 'What is the correct posture for wrists?', options: ['Bent upward',
                    'Flat and neutral', 'Resting on edge', 'Crossed'
                ], correct: 1 }
        ] },
    { name: 'Ergonomics & Electrical', questions: [
            { type: 'dragdrop', title: 'Place items in correct ergonomic position.',
                zones: ['Monitor', 'Chair', 'Keyboard'],
                items: ['Eye level', 'Back support', 'Flat wrist'],
                correct: { 'Eye level': 'Monitor', 'Back support': 'Chair', 'Flat wrist': 'Keyboard' } },
            { type: 'choice', title: 'What should you do if a power cord is frayed?', options: ['Ignore it',
                    'Wrap with tape', 'Replace immediately', 'Straighten it'
                ], correct: 2 },
            { type: 'sequence', title: 'Correct order for ESD safety.', steps: ['Put on wrist strap',
                    'Connect to ground', 'Handle components'
                ] },
            { type: 'dragdrop', title: 'Match electrical hazard to solution.',
                zones: ['Overloading', 'Damaged cable', 'Static charge'],
                items: ['Use power strip with breaker', 'Inspect and replace', 'Use anti-static mat'],
                correct: { 'Use power strip with breaker': 'Overloading',
                    'Inspect and replace': 'Damaged cable', 'Use anti-static mat': 'Static charge' } },
            { type: 'choice', title: 'What is the recommended break frequency for computer work?',
                options: ['Every 2 hours', 'Every 30 minutes', 'Every hour', 'Every 90 minutes'],
                correct: 1 }
        ] },
    { name: 'Safety Procedures', questions: [
            { type: 'sequence', title: 'Correct order for reporting a hazard.', steps: ['Identify hazard',
                    'Notify supervisor', 'Document incident'
                ] },
            { type: 'dragdrop', title: 'Match PPE to use case.',
                zones: ['Soldering', 'Heavy lifting', 'Chemical handling'],
                items: ['Safety glasses', 'Back belt', 'Gloves'],
                correct: { 'Safety glasses': 'Soldering', 'Back belt': 'Heavy lifting',
                    'Gloves': 'Chemical handling' } },
            { type: 'choice', title: 'What is the main purpose of a fire extinguisher in a lab?',
                options: ['Cool down equipment', 'Put out electrical fires', 'Clean surfaces',
                    'Prevent static'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match safety sign to meaning.',
                zones: ['Warning', 'Mandatory', 'Prohibition'],
                items: ['Yellow triangle', 'Blue circle', 'Red circle with slash'],
                correct: { 'Yellow triangle': 'Warning', 'Blue circle': 'Mandatory',
                    'Red circle with slash': 'Prohibition' } },
            { type: 'sequence', title: 'Steps for safe equipment shutdown.', steps: ['Save work',
                    'Close applications', 'Shut down OS', 'Turn off power'
                ] }
        ] },
    { name: 'Advanced Safety', questions: [
            { type: 'choice', title: 'What does "lockout/tagout" refer to?', options: [
                    'Securing cables', 'Disabling equipment during maintenance', 'Locking files',
                    'Tagging inventory'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match emergency procedure to action.',
                zones: ['Fire', 'Earthquake', 'Chemical spill'],
                items: ['Evacuate', 'Drop, cover, hold', 'Ventilate area'],
                correct: { 'Evacuate': 'Fire', 'Drop, cover, hold': 'Earthquake',
                    'Ventilate area': 'Chemical spill' } },
            { type: 'sequence', title: 'Correct order for first aid response.', steps: ['Assess situation',
                    'Call for help', 'Provide care', 'Report incident'
                ] },
            { type: 'dragdrop', title: 'Match electrical hazard to class.',
                zones: ['Class A', 'Class B', 'Class C'],
                items: ['Combustible materials', 'Flammable liquids', 'Electrical equipment'],
                correct: { 'Combustible materials': 'Class A', 'Flammable liquids': 'Class B',
                    'Electrical equipment': 'Class C' } },
            { type: 'choice', title: 'What is the safe distance from a live electrical panel?',
                options: ['1 meter', '3 meters', '5 meters', '10 meters'], correct: 2 }
        ] },
    { name: 'Comprehensive Safety', questions: [
            { type: 'sequence', title: 'Complete risk assessment steps.', steps: ['Identify hazards',
                    'Evaluate risks', 'Implement controls', 'Review and update'
                ] },
            { type: 'dragdrop', title: 'Match health symptom to ergonomic issue.',
                zones: ['Eye strain', 'Carpal tunnel', 'Back pain'],
                items: ['Blurry vision', 'Numb fingers', 'Lower back ache'],
                correct: { 'Blurry vision': 'Eye strain', 'Numb fingers': 'Carpal tunnel',
                    'Lower back ache': 'Back pain' } },
            { type: 'choice', title: 'What is the primary goal of OHS?', options: [
                    'Increase productivity', 'Prevent injury and illness', 'Save costs',
                    'Comply with regulations'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match control measure to hierarchy.',
                zones: ['Elimination', 'Substitution', 'Engineering'],
                items: ['Remove hazard', 'Replace with safer', 'Isolate with guard'],
                correct: { 'Remove hazard': 'Elimination', 'Replace with safer': 'Substitution',
                    'Isolate with guard': 'Engineering' } },
            { type: 'sequence', title: 'Correct order for incident investigation.', steps: ['Secure scene',
                    'Gather evidence', 'Interview witnesses', 'Analyze causes', 'Recommend actions'
                ] }
        ] }
];

// --- OS ---
MODULE_LEVELS.os = [
    { name: 'File Basics', questions: [
            { type: 'dragdrop', title: 'Sort files by type.',
                zones: ['Document', 'Spreadsheet', 'Image'],
                items: ['report.docx', 'budget.xlsx', 'photo.png', 'notes.txt', 'data.csv'],
                correct: { 'report.docx': 'Document', 'budget.xlsx': 'Spreadsheet', 'photo.png': 'Image',
                    'notes.txt': 'Document', 'data.csv': 'Spreadsheet' } },
            { type: 'choice', title: 'What does .xlsx indicate?', options: ['Word document',
                    'Excel spreadsheet', 'PowerPoint presentation', 'PDF'
                ], correct: 1 },
            { type: 'sequence', title: 'Steps to create a new folder.', steps: ['Open File Explorer',
                    'Navigate to location', 'Right-click → New → Folder', 'Name folder'
                ] },
            { type: 'dragdrop', title: 'Match attribute to description.',
                zones: ['Read-only', 'Hidden', 'Archive'],
                items: ['Cannot modify', 'Not visible', 'Backup flag'],
                correct: { 'Cannot modify': 'Read-only', 'Not visible': 'Hidden', 'Backup flag': 'Archive' } },
            { type: 'choice', title: 'Which shortcut opens File Explorer?', options: ['Windows+E',
                    'Windows+F', 'Windows+R', 'Windows+D'
                ], correct: 0 }
        ] },
    { name: 'Folder Management', questions: [
            { type: 'dragdrop', title: 'Sort files into correct folder.',
                zones: ['Work', 'Personal', 'Archive'],
                items: ['project_plan.docx', 'family_photo.jpg', 'old_reports.zip', 'invoice.xlsx',
                    'vacation_pic.png'
                ],
                correct: { 'project_plan.docx': 'Work', 'family_photo.jpg': 'Personal',
                    'old_reports.zip': 'Archive', 'invoice.xlsx': 'Work', 'vacation_pic.png': 'Personal' } },
            { type: 'choice', title: 'What is a directory tree?', options: ['File type',
                    'Folder hierarchy', 'Backup strategy', 'Network map'
                ], correct: 1 },
            { type: 'sequence', title: 'Steps to compress files.', steps: ['Select files',
                    'Right-click → Send to → Compressed folder', 'Name archive'
                ] },
            { type: 'dragdrop', title: 'Match backup type to description.',
                zones: ['Full', 'Differential', 'Incremental'],
                items: ['All data', 'Changes since last full', 'Changes since last backup'],
                correct: { 'All data': 'Full', 'Changes since last full': 'Differential',
                    'Changes since last backup': 'Incremental' } },
            { type: 'choice', title: 'Which tool is used for file compression?', options: ['Windows Explorer',
                    'ZIP/RAR', 'Task Manager', 'Device Manager'
                ], correct: 1 }
        ] },
    { name: 'Advanced File Ops', questions: [
            { type: 'sequence', title: 'Steps to set file permissions.', steps: ['Right-click file',
                    'Properties → Security', 'Edit permissions', 'Apply changes'
                ] },
            { type: 'dragdrop', title: 'Match extension to application.',
                zones: ['Word', 'Excel', 'PowerPoint'],
                items: ['.docx', '.xlsx', '.pptx'],
                correct: { '.docx': 'Word', '.xlsx': 'Excel', '.pptx': 'PowerPoint' } },
            { type: 'choice', title: 'What is a compressed folder?', options: ['A ZIP archive',
                    'A system folder', 'A shortcut', 'A network drive'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match storage type to use.',
                zones: ['Primary', 'Backup', 'Archive'],
                items: ['SSD', 'External HDD', 'Tape drive'],
                correct: { 'SSD': 'Primary', 'External HDD': 'Backup', 'Tape drive': 'Archive' } },
            { type: 'choice', title: 'Which attribute prevents file deletion?', options: ['Read-only',
                    'Hidden', 'System', 'Archive'
                ], correct: 0 }
        ] },
    { name: 'System Files', questions: [
            { type: 'sequence', title: 'Steps to show hidden files.', steps: ['Open File Explorer',
                    'View tab', 'Check "Hidden items"'
                ] },
            { type: 'dragdrop', title: 'Match system file to purpose.',
                zones: ['Boot', 'Config', 'Log'],
                items: ['boot.ini', 'settings.cfg', 'error.log'],
                correct: { 'boot.ini': 'Boot', 'settings.cfg': 'Config', 'error.log': 'Log' } },
            { type: 'choice', title: 'What does "system restore" do?', options: ['Backs up files',
                    'Reverts system settings', 'Deletes viruses', 'Updates drivers'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match backup schedule to frequency.',
                zones: ['Daily', 'Weekly', 'Monthly'],
                items: ['Incremental', 'Differential', 'Full'],
                correct: { 'Incremental': 'Daily', 'Differential': 'Weekly', 'Full': 'Monthly' } },
            { type: 'choice', title: 'Which tool manages disk partitions?', options: ['Disk Management',
                    'Device Manager', 'Task Scheduler', 'Event Viewer'
                ], correct: 0 }
        ] },
    { name: 'Data Management Mastery', questions: [
            { type: 'sequence', title: 'Steps to organize a messy folder.', steps: ['Create categories',
                    'Move files', 'Rename consistently', 'Delete duplicates'
                ] },
            { type: 'dragdrop', title: 'Match data type to storage.',
                zones: ['Documents', 'Media', 'Programs'],
                items: ['PDFs', 'Videos', 'Executables'],
                correct: { 'PDFs': 'Documents', 'Videos': 'Media', 'Executables': 'Programs' } },
            { type: 'choice', title: 'What is the best practice for data backup?', options: [
                    'Store only in cloud', 'Use 3-2-1 strategy', 'Backup once a year', 'No backup needed'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match recovery plan to scenario.',
                zones: ['Hardware failure', 'Ransomware', 'Accidental deletion'],
                items: ['Restore from backup', 'Use antivirus', 'Recover from recycle bin'],
                correct: { 'Restore from backup': 'Hardware failure', 'Use antivirus': 'Ransomware',
                    'Recover from recycle bin': 'Accidental deletion' } },
            { type: 'choice', title: 'Which command creates a new directory in CLI?', options: ['mkdir',
                    'rmdir', 'cd', 'dir'
                ], correct: 0 }
        ] }
];

// --- Typing ---
MODULE_LEVELS.typing = [
    { name: 'Home Row Basics', questions: [
            { type: 'dragdrop', title: 'Place fingers on correct home row keys.',
                zones: ['Left Hand', 'Right Hand'],
                items: ['ASDF', 'JKL;'],
                correct: { 'ASDF': 'Left Hand', 'JKL;': 'Right Hand' } },
            { type: 'choice', title: 'What is the correct home row for touch typing?', options: [
                    'QWERTY', 'ASDF JKL;', 'ZXCV BNM,', 'ABCD EFGH'
                ], correct: 1 },
            { type: 'sequence', title: 'Steps to improve typing speed.', steps: ['Sit straight',
                    'Place fingers on home row', 'Type without looking'
                ] },
            { type: 'dragdrop', title: 'Match shortcut to function.',
                zones: ['Copy', 'Paste', 'Undo'],
                items: ['Ctrl+C', 'Ctrl+V', 'Ctrl+Z'],
                correct: { 'Ctrl+C': 'Copy', 'Ctrl+V': 'Paste', 'Ctrl+Z': 'Undo' } },
            { type: 'choice', title: 'Which key is used for Caps Lock?', options: ['Shift', 'Caps Lock',
                    'Ctrl', 'Alt'
                ], correct: 1 }
        ] },
    { name: 'System Shortcuts', questions: [
            { type: 'dragdrop', title: 'Match shortcut to action.',
                zones: ['Task Manager', 'Switch App', 'Show Desktop'],
                items: ['Ctrl+Shift+Esc', 'Alt+Tab', 'Windows+D'],
                correct: { 'Ctrl+Shift+Esc': 'Task Manager', 'Alt+Tab': 'Switch App',
                    'Windows+D': 'Show Desktop' } },
            { type: 'choice', title: 'Which shortcut locks the PC?', options: ['Windows+L', 'Windows+M',
                    'Windows+P', 'Windows+Q'
                ], correct: 0 },
            { type: 'sequence', title: 'Steps to open Task Manager without a mouse.', steps: [
                    'Press Ctrl+Shift+Esc', 'Navigate with arrow keys', 'Press Enter to open'
                ] },
            { type: 'dragdrop', title: 'Match navigation shortcut to function.',
                zones: ['Open Explorer', 'Run dialog', 'Settings'],
                items: ['Windows+E', 'Windows+R', 'Windows+I'],
                correct: { 'Windows+E': 'Open Explorer', 'Windows+R': 'Run dialog',
                    'Windows+I': 'Settings' } },
            { type: 'choice', title: 'What does Alt+F4 do?', options: ['Close current window',
                    'Open file menu', 'Refresh screen', 'Switch user'
                ], correct: 0 }
        ] },
    { name: 'Text Editing Shortcuts', questions: [
            { type: 'dragdrop', title: 'Match editing shortcut to action.',
                zones: ['Select all', 'Find', 'Save'],
                items: ['Ctrl+A', 'Ctrl+F', 'Ctrl+S'],
                correct: { 'Ctrl+A': 'Select all', 'Ctrl+F': 'Find', 'Ctrl+S': 'Save' } },
            { type: 'choice', title: 'Which shortcut redoes the last undo?', options: ['Ctrl+Y', 'Ctrl+Z',
                    'Ctrl+X', 'Ctrl+C'
                ], correct: 0 },
            { type: 'sequence', title: 'Steps to copy and paste using only keyboard.', steps: ['Select text',
                    'Ctrl+C', 'Move cursor', 'Ctrl+V'
                ] },
            { type: 'dragdrop', title: 'Match formatting shortcut to result.',
                zones: ['Bold', 'Italic', 'Underline'],
                items: ['Ctrl+B', 'Ctrl+I', 'Ctrl+U'],
                correct: { 'Ctrl+B': 'Bold', 'Ctrl+I': 'Italic', 'Ctrl+U': 'Underline' } },
            { type: 'choice', title: 'What is the shortcut to open a new tab in a browser?', options: [
                    'Ctrl+T', 'Ctrl+N', 'Ctrl+W', 'Ctrl+P'
                ], correct: 0 }
        ] },
    { name: 'Advanced Shortcuts', questions: [
            { type: 'sequence', title: 'Steps to take a screenshot on Windows.', steps: ['Press Windows+Shift+S',
                    'Select area', 'Screenshot saved to clipboard'
                ] },
            { type: 'dragdrop', title: 'Match shortcut to system utility.',
                zones: ['Snipping Tool', 'Task Manager', 'File Explorer'],
                items: ['Windows+Shift+S', 'Ctrl+Shift+Esc', 'Windows+E'],
                correct: { 'Windows+Shift+S': 'Snipping Tool', 'Ctrl+Shift+Esc': 'Task Manager',
                    'Windows+E': 'File Explorer' } },
            { type: 'choice', title: 'Which shortcut opens the Windows settings?', options: ['Windows+I',
                    'Windows+S', 'Windows+P', 'Windows+A'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match shortcut to virtual desktop action.',
                zones: ['New desktop', 'Switch desktop', 'Close desktop'],
                items: ['Windows+Ctrl+D', 'Windows+Ctrl+Left/Right', 'Windows+Ctrl+F4'],
                correct: { 'Windows+Ctrl+D': 'New desktop', 'Windows+Ctrl+Left/Right': 'Switch desktop',
                    'Windows+Ctrl+F4': 'Close desktop' } },
            { type: 'choice', title: 'What does Windows+Shift+S do?', options: ['Opens Snipping Tool',
                    'Opens Settings', 'Opens Search', 'Opens Start menu'
                ], correct: 0 }
        ] },
    { name: 'Master Shortcuts', questions: [
            { type: 'sequence', title: 'Correct order to shut down using keyboard.', steps: ['Windows+X',
                    'U', 'U'
                ] },
            { type: 'dragdrop', title: 'Match shortcut to accessibility feature.',
                zones: ['Magnifier', 'Narrator', 'High Contrast'],
                items: ['Windows+Plus', 'Windows+Ctrl+Enter', 'Windows+Alt+Print Screen'],
                correct: { 'Windows+Plus': 'Magnifier', 'Windows+Ctrl+Enter': 'Narrator',
                    'Windows+Alt+Print Screen': 'High Contrast' } },
            { type: 'choice', title: 'Which shortcut opens the emoji panel?', options: ['Windows+Period',
                    'Windows+Semicolon', 'Windows+E', 'Windows+R'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match shortcut to clipboard history.',
                zones: ['Open history', 'Paste selected'],
                items: ['Windows+V', 'Click to paste'],
                correct: { 'Windows+V': 'Open history', 'Click to paste': 'Paste selected' } },
            { type: 'choice', title: 'What is the shortcut for "Select All" in most apps?', options: [
                    'Ctrl+A', 'Ctrl+S', 'Ctrl+Shift+A', 'Ctrl+E'
                ], correct: 0 }
        ] }
];

// --- Spreadsheet ---
MODULE_LEVELS.spreadsheet = [
    { name: 'Formula Basics', questions: [
            { type: 'dragdrop', title: 'Build SUM formula.',
                zones: ['=SUM(', ')', 'A1:A10'],
                items: ['=SUM(', 'A1:A10', ')'],
                correct: { '=SUM(': '=SUM(', 'A1:A10': 'A1:A10', ')': ')' } },
            { type: 'choice', title: 'What does =AVERAGE(B2:B8) do?', options: ['Adds all',
                    'Finds average', 'Counts cells', 'Finds max'
                ], correct: 1 },
            { type: 'sequence', title: 'Steps to apply currency format.', steps: ['Select cells',
                    'Open Format menu', 'Choose Currency', 'Set decimals'
                ] },
            { type: 'dragdrop', title: 'Build IF formula.',
                zones: ['=IF(', '>10', ',"Yes","No")'],
                items: ['=IF(', 'A1>10', ',"Yes","No")'],
                correct: { '=IF(': '=IF(', 'A1>10': '>10', ',"Yes","No")': ',"Yes","No")' } },
            { type: 'choice', title: 'Which function locks cells?', options: ['=LOCK()', '=PROTECT()',
                    'Format Cells → Protection', '=FREEZE()'
                ], correct: 2 }
        ] },
    { name: 'Advanced Formulas', questions: [
            { type: 'dragdrop', title: 'Build COUNT formula.',
                zones: ['=COUNT(', ')', 'A1:A10'],
                items: ['=COUNT(', 'A1:A10', ')'],
                correct: { '=COUNT(': '=COUNT(', 'A1:A10': 'A1:A10', ')': ')' } },
            { type: 'choice', title: 'What does =MAX(C2:C20) return?', options: ['Average', 'Largest value',
                    'Smallest value', 'Sum'
                ], correct: 1 },
            { type: 'sequence', title: 'Steps to sort data.', steps: ['Select range',
                    'Data → Sort', 'Choose column', 'Order'
                ] },
            { type: 'dragdrop', title: 'Build a formula to add two cells.',
                zones: ['=', '+', 'A1', 'B1'],
                items: ['=', 'A1', '+', 'B1'],
                correct: { '=': '=', 'A1': 'A1', '+': '+', 'B1': 'B1' } },
            { type: 'choice', title: 'Which function checks if a condition is true?', options: ['=IF()',
                    '=AND()', '=OR()', '=NOT()'
                ], correct: 0 }
        ] },
    { name: 'Data Analysis', questions: [
            { type: 'sequence', title: 'Steps to create a chart.', steps: ['Select data',
                    'Insert → Chart', 'Choose chart type', 'Format as needed'
                ] },
            { type: 'dragdrop', title: 'Match function to purpose.',
                zones: ['SUM', 'AVERAGE', 'COUNT'],
                items: ['=SUM', '=AVERAGE', '=COUNT'],
                correct: { '=SUM': 'SUM', '=AVERAGE': 'AVERAGE', '=COUNT': 'COUNT' } },
            { type: 'choice', title: 'What does =LEN(A1) return?', options: ['Number of characters',
                    'Number of words', 'Number of spaces', 'Cell address'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Build a formula to find average.',
                zones: ['=AVERAGE(', ')', 'B1:B10'],
                items: ['=AVERAGE(', 'B1:B10', ')'],
                correct: { '=AVERAGE(': '=AVERAGE(', 'B1:B10': 'B1:B10', ')': ')' } },
            { type: 'choice', title: 'Which tool removes duplicates?', options: ['Data → Remove Duplicates',
                    'Home → Delete', 'Formulas → Remove', 'Review → Remove'
                ], correct: 0 }
        ] },
    { name: 'Protection & Validation', questions: [
            { type: 'sequence', title: 'Steps to password-protect a sheet.', steps: ['Review tab',
                    'Protect Sheet', 'Enter password', 'Confirm'
                ] },
            { type: 'dragdrop', title: 'Match data validation to type.',
                zones: ['Whole number', 'Decimal', 'List'],
                items: ['Integer only', 'Number with decimals', 'Drop-down choices'],
                correct: { 'Integer only': 'Whole number', 'Number with decimals': 'Decimal',
                    'Drop-down choices': 'List' } },
            { type: 'choice', title: 'What does cell locking prevent?', options: ['Editing',
                    'Deleting the sheet', 'Adding rows', 'Formatting'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match protection to scope.',
                zones: ['Sheet', 'Workbook', 'Cell'],
                items: ['Protect Sheet', 'Protect Workbook', 'Lock Cell'],
                correct: { 'Protect Sheet': 'Sheet', 'Protect Workbook': 'Workbook',
                    'Lock Cell': 'Cell' } },
            { type: 'choice', title: 'Which feature restricts cell input to a list?', options: [
                    'Data Validation', 'Conditional Formatting', 'Protect Sheet', 'Sort'
                ], correct: 0 }
        ] },
    { name: 'Master Spreadsheet', questions: [
            { type: 'sequence', title: 'Steps to create a pivot table.', steps: ['Select data',
                    'Insert → PivotTable', 'Choose fields', 'Arrange layout'
                ] },
            { type: 'dragdrop', title: 'Match function to description.',
                zones: ['SUMIF', 'VLOOKUP', 'CONCATENATE'],
                items: ['Sum with condition', 'Lookup value', 'Join text'],
                correct: { 'Sum with condition': 'SUMIF', 'Lookup value': 'VLOOKUP',
                    'Join text': 'CONCATENATE' } },
            { type: 'choice', title: 'What does the $ sign in cell references do?', options: [
                    'Absolute reference', 'Relative reference', 'Mixed reference', 'Formats as currency'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Build a VLOOKUP formula.',
                zones: ['=VLOOKUP(', ',', 'A2', 'B:C', '2', 'FALSE)'],
                items: ['=VLOOKUP(', 'A2', ',', 'B:C', ',', '2', ',', 'FALSE)'],
                correct: { '=VLOOKUP(': '=VLOOKUP(', 'A2': 'A2', ',': ',', 'B:C': 'B:C', '2': '2',
                    'FALSE)': 'FALSE)' } },
            { type: 'choice', title: 'Which function is used for conditional summing?', options: [
                    '=SUMIF()', '=IF()', '=SUM()', '=COUNTIF()'
                ], correct: 0 }
        ] }
];

// --- Maintenance ---
MODULE_LEVELS.maintenance = [
    { name: 'Basic Troubleshooting', questions: [
            { type: 'sequence', title: 'Correct order for malware removal.', steps: [
                    'Update antivirus', 'Run full scan', 'Quarantine threats', 'Reboot'
                ] },
            { type: 'choice', title: 'What does a yellow exclamation mark in Device Manager indicate?',
                options: ['Missing driver', 'Disabled device', 'Conflict', 'Virus'], correct: 0 },
            { type: 'dragdrop', title: 'Match issue to solution.',
                zones: ['Blue screen', 'No internet', 'Slow PC'],
                items: ['Check memory', 'Reset router', 'Run disk cleanup'],
                correct: { 'Check memory': 'Blue screen', 'Reset router': 'No internet',
                    'Run disk cleanup': 'Slow PC' } },
            { type: 'sequence', title: 'Steps to clean a PC.', steps: ['Power off',
                    'Use compressed air', 'Wipe screen', 'Reconnect'
                ] },
            { type: 'choice', title: 'What is the first step in hardware troubleshooting?', options: [
                    'Replace part', 'Check Device Manager', 'Reinstall OS', 'Call IT'
                ], correct: 1 }
        ] },
    { name: 'Driver & System Updates', questions: [
            { type: 'sequence', title: 'Steps to update a driver.', steps: ['Open Device Manager',
                    'Right-click device', 'Update driver', 'Search automatically'
                ] },
            { type: 'dragdrop', title: 'Match driver to device.',
                zones: ['Graphics', 'Network', 'Audio'],
                items: ['Video card', 'Ethernet adapter', 'Sound card'],
                correct: { 'Video card': 'Graphics', 'Ethernet adapter': 'Network',
                    'Sound card': 'Audio' } },
            { type: 'choice', title: 'Where are driver updates typically found?', options: [
                    'Windows Update', 'Device Manager', 'Manufacturer website', 'All of the above'
                ], correct: 3 },
            { type: 'dragdrop', title: 'Match system tool to function.',
                zones: ['Disk Cleanup', 'Defragment', 'Check Disk'],
                items: ['Free up space', 'Optimize files', 'Repair disk errors'],
                correct: { 'Free up space': 'Disk Cleanup', 'Optimize files': 'Defragment',
                    'Repair disk errors': 'Check Disk' } },
            { type: 'choice', title: 'What is the best practice before installing a new driver?',
                options: ['Backup system', 'Disable antivirus', 'Close all apps', 'All of the above'],
                correct: 3 }
        ] },
    { name: 'Network & Security', questions: [
            { type: 'sequence', title: 'Steps to reset network settings.', steps: ['Open Settings',
                    'Network & Internet', 'Advanced network settings', 'Network reset'
                ] },
            { type: 'dragdrop', title: 'Match network issue to cause.',
                zones: ['No connectivity', 'Slow speed', 'Security warning'],
                items: ['Cable unplugged', 'Bandwidth limit', 'Untrusted certificate'],
                correct: { 'Cable unplugged': 'No connectivity', 'Bandwidth limit': 'Slow speed',
                    'Untrusted certificate': 'Security warning' } },
            { type: 'choice', title: 'What is a firewall?', options: ['Blocks unauthorized access',
                    'Speeds up internet', 'Cleans viruses', 'Manages passwords'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match security threat to symptom.',
                zones: ['Phishing', 'Ransomware', 'Spyware'],
                items: ['Suspicious email', 'Files encrypted', 'Pop-ups & tracking'],
                correct: { 'Suspicious email': 'Phishing', 'Files encrypted': 'Ransomware',
                    'Pop-ups & tracking': 'Spyware' } },
            { type: 'choice', title: 'Which built-in Windows tool scans for malware?', options: [
                    'Windows Defender', 'Disk Cleanup', 'System Restore', 'Task Manager'
                ], correct: 0 }
        ] },
    { name: 'Backup & Recovery', questions: [
            { type: 'sequence', title: 'Steps to restore from a system restore point.', steps: [
                    'Open System Restore', 'Choose a restore point', 'Confirm', 'Reboot'
                ] },
            { type: 'dragdrop', title: 'Match backup media to use case.',
                zones: ['Cloud', 'External drive', 'Network'],
                items: ['Off-site backup', 'Local full backup', 'Shared folder backup'],
                correct: { 'Off-site backup': 'Cloud', 'Local full backup': 'External drive',
                    'Shared folder backup': 'Network' } },
            { type: 'choice', title: 'What is a "full backup"?', options: ['Copies all selected files',
                    'Copies only changed files', 'Copies only system files', 'Copies only user files'
                ], correct: 0 },
            { type: 'dragdrop', title: 'Match recovery tool to failure type.',
                zones: ['Boot failure', 'File corruption', 'Driver issue'],
                items: ['Startup Repair', 'SFC /scannow', 'Safe Mode'],
                correct: { 'Startup Repair': 'Boot failure', 'SFC /scannow': 'File corruption',
                    'Safe Mode': 'Driver issue' } },
            { type: 'choice', title: 'How often should critical data be backed up?', options: [
                    'Daily', 'Weekly', 'Monthly', 'Yearly'
                ], correct: 0 }
        ] },
    { name: 'Advanced Maintenance', questions: [
            { type: 'sequence', title: 'Steps to run a system performance report.', steps: [
                    'Open Performance Monitor', 'Data Collector Sets', 'Start report'
                ] },
            { type: 'dragdrop', title: 'Match performance metric to issue.',
                zones: ['CPU', 'Memory', 'Disk'],
                items: ['High usage', 'Low free RAM', 'Slow read/write'],
                correct: { 'High usage': 'CPU', 'Low free RAM': 'Memory', 'Slow read/write': 'Disk' } },
            { type: 'choice', title: 'What does the "sfc /scannow" command do?', options: [
                    'Scans for malware', 'Checks system file integrity', 'Defragments the hard drive',
                    'Updates drivers'
                ], correct: 1 },
            { type: 'dragdrop', title: 'Match maintenance task to schedule.',
                zones: ['Weekly', 'Monthly', 'Quarterly'],
                items: ['Temp files cleanup', 'Disk defrag', 'Full system backup'],
                correct: { 'Temp files cleanup': 'Weekly', 'Disk defrag': 'Monthly',
                    'Full system backup': 'Quarterly' } },
            { type: 'choice', title: 'What is the best way to monitor system health?', options: [
                    'Task Manager', 'Performance Monitor', 'Event Viewer', 'All of the above'
                ], correct: 3 }
        ] }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function $(sel) { return document.querySelector(sel); }

function formatTime(s) { const m = String(Math.floor(s / 60)).padStart(2, '0'); const sec = String(s % 60).padStart(2,
        '0'); return m + ':' + sec; }

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

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    document.querySelectorAll('.feedback-overlay').forEach(f => f.classList.remove('show'));
    stopTimer();
    state.seconds = 0;
    if (id === 'screen-main') updateMainMenu();
}

function renderLevelGrid(container, levels, completed, current) {
    container.innerHTML = '';
    levels.forEach((lv, idx) => {
        const div = document.createElement('div');
        div.className = 'level-card';
        const isDone = completed.has(idx + 1);
        const isActive = (idx === current);
        if (isDone) div.classList.add('completed');
        if (isActive) div.classList.add('active');
        const unlocked = idx === 0 || completed.has(idx);
        if (!unlocked) div.classList.add('locked');
        div.innerHTML =
            `<div class="num">${idx+1}</div><div class="name">${lv.name}</div><div class="stars">${levelHeartsStr(container.id.replace('LevelGrid', ''), idx + 1, isDone)}</div>`;
        if (unlocked && !isDone) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                const all = container.querySelectorAll('.level-card');
                all.forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                const parent = container.closest('.screen');
                if (parent) {
                    const id = parent.id.replace('screen-', '');
                    if (id === 'ohs') state.ohs.level = idx;
                    else if (id === 'os') state.os.level = idx;
                    else if (id === 'typing') state.typing.level = idx;
                    else if (id === 'spreadsheet') state.spreadsheet.level = idx;
                    else if (id === 'maintenance') state.maintenance.level = idx;
                }
            });
        }
        container.appendChild(div);
    });
}

function getUnlockStatus() {
    const modules = ['ohs', 'os', 'typing', 'spreadsheet', 'maintenance'];
    const status = {};
    modules.forEach(m => {
        const total = MODULE_LEVELS[m].length;
        const done = state[m].completed.size;
        status[m] = { unlocked: true, progress: `${done}/${total}`, done: done === total,
            level: state[m].level };
    });
    return status;
}

function updateMainMenu() {
    const status = getUnlockStatus();
    const ids = ['ohs', 'os', 'typing', 'spreadsheet', 'maintenance'];
    ids.forEach(id => {
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
    let totalDone = 0,
        totalAll = 0;
    ids.forEach(id => {
        totalDone += state[id].completed.size;
        totalAll += MODULE_LEVELS[id].length;
    });
    const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
    document.getElementById('overallProgress').textContent = pct + '%';
    document.getElementById('overallFill').style.width = pct + '%';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOSSARY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function populateGlossary() {
    const list = document.getElementById('glossaryList');
    list.innerHTML = '';
    for (const [acro, meaning] of Object.entries(GLOSSARY)) {
        const item = document.createElement('div');
        item.className = 'glossary-item';
        item.innerHTML = `<span class="acronym">${acro}</span><span class="meaning">${meaning}</span>`;
        list.appendChild(item);
    }
}

function toggleGlossary(show) {
    const overlay = document.getElementById('glossaryOverlay');
    if (show === undefined) {
        overlay.classList.toggle('active');
    } else if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    populateGlossary();
    document.getElementById('glossaryCloseBtn').addEventListener('click', () => toggleGlossary(false));
    document.querySelectorAll('.glossary-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleGlossary(true);
        });
    });
    document.getElementById('glossaryOverlay').addEventListener('click', function(e) {
        if (e.target === this) toggleGlossary(false);
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.back === 'main') {
            showScreen('screen-main');
            ['ohs', 'os', 'typing', 'spreadsheet', 'maintenance'].forEach(m => {
                state[m].phase = 'SELECT';
                const sel = document.getElementById(m + '-select');
                if (sel) sel.style.display = '';
                const instr = document.getElementById(m + '-instructions');
                if (instr) instr.style.display = 'none';
                const game = document.getElementById(m + '-game');
                if (game) game.style.display = 'none';
                const fb = document.getElementById(m + 'FeedbackOverlay');
                if (fb) fb.classList.remove('show');
            });
        }
    });
});

document.querySelectorAll('.menu-item[data-game]').forEach(item => {
    item.addEventListener('click', function() {
        const game = this.dataset.game;
        const status = getUnlockStatus();
        if (!status[game].unlocked) {
            this.classList.add('shake');
            setTimeout(() => this.classList.remove('shake'), 500);
            return;
        }
        initModule(game);
        showScreen('screen-' + game);
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function initModule(moduleId) {
    const levels = MODULE_LEVELS[moduleId];
    if (!levels) return;
    const container = document.getElementById(moduleId + 'LevelGrid');
    if (!container) return;
    state[moduleId].phase = 'SELECT';
    renderLevelGrid(container, levels, state[moduleId].completed, state[moduleId].level);
    document.getElementById(moduleId + '-select').style.display = '';
    document.getElementById(moduleId + '-instructions').style.display = 'none';
    document.getElementById(moduleId + '-game').style.display = 'none';
    document.getElementById(moduleId + 'FeedbackOverlay').classList.remove('show');
    const nextBtn = document.getElementById(moduleId + 'NextBtn');
    if (nextBtn) nextBtn.disabled = true;
}

document.querySelectorAll('[id$="StartBtn"]').forEach(btn => {
    btn.addEventListener('click', function() {
        const moduleId = this.id.replace('StartBtn', '');
        const levels = MODULE_LEVELS[moduleId];
        const lv = state[moduleId].level;
        const data = levels[lv];
        if (!data) return;
        if (!transition(moduleId, 'START')) return;
        document.getElementById(moduleId + '-select').style.display = 'none';
        document.getElementById(moduleId + '-instructions').style.display = '';
        document.getElementById(moduleId + 'InstrObj').textContent = `🎯 Level ${lv+1}: ${data.name}`;
        document.getElementById(moduleId + 'InstrDetail').textContent = 'Complete all 5 challenges.';
    });
});

document.querySelectorAll('[id$="PlayBtn"]').forEach(btn => {
    btn.addEventListener('click', function() {
        const moduleId = this.id.replace('PlayBtn', '');
        if (!transition(moduleId, 'PLAY')) return;
        document.getElementById(moduleId + '-instructions').style.display = 'none';
        document.getElementById(moduleId + '-game').style.display = '';
        startGame(moduleId);
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GAME ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let currentGame = {
    moduleId: '',
    levelData: null,
    questions: [],
    currentQ: 0,
    answers: [],
    feedbackEl: null,
    nextBtn: null,
    resetBtn: null,
    gameArea: null,
    isComplete: false,
};

// Map module to icon sets for drag items, zones, etc.
const ICON_MAP = {
    ohs: { drag: { 'Hard Hat': '⛑️', 'Gloves': '🧤', 'Safety Shoes': '🥾', 'Ear Plugs': '🔇', 'Goggles': '🥽',
            'Eye level': '👁️', 'Back support': '🪑', 'Flat wrist': '✋', 'Use surge protector': '🔌',
            'Inspect regularly': '🔍', 'Discharge before touching': '⚡', 'Safety glasses': '👓',
            'Back belt': '🦺', 'Gloves': '🧤', 'Yellow triangle': '⚠️', 'Blue circle': '🔵',
            'Red circle with slash': '🚫', 'Evacuate': '🏃', 'Drop, cover, hold': '🛡️',
            'Ventilate area': '🌬️', 'Combustible materials': '🔥', 'Flammable liquids': '🧪',
            'Electrical equipment': '⚡', 'Remove hazard': '❌', 'Replace with safer': '🔄',
            'Isolate with guard': '🛡️', 'Blurry vision': '👀', 'Numb fingers': '🖐️', 'Lower back ache': '💢'
        }, zone: { 'Head': '🧠', 'Hands': '🤲', 'Feet': '🦶', 'Monitor': '🖥️', 'Chair': '🪑',
            'Keyboard': '⌨️', 'Overload': '⚡', 'Cable damage': '🔌', 'Residual charge': '💥',
            'Soldering': '🔥', 'Heavy lifting': '🏋️', 'Chemical handling': '🧪', 'Warning': '⚠️',
            'Mandatory': '🔵', 'Prohibition': '🚫', 'Fire': '🔥', 'Earthquake': '🌍',
            'Chemical spill': '🧪', 'Class A': '🔥', 'Class B': '🧪', 'Class C': '⚡',
            'Eye strain': '👁️', 'Carpal tunnel': '🖐️', 'Back pain': '💢', 'Elimination': '❌',
            'Substitution': '🔄', 'Engineering': '🛠️' } },
    os: { drag: { 'report.docx': '📄', 'budget.xlsx': '📊', 'photo.png': '🖼️', 'notes.txt': '📝',
            'data.csv': '📈', 'project_plan.docx': '📄', 'family_photo.jpg': '🖼️',
            'old_reports.zip': '📦', 'invoice.xlsx': '📊', 'vacation_pic.png': '🖼️',
            'Cannot modify': '🔒', 'Not visible': '👻', 'Backup flag': '💾', 'boot.ini': '⚙️',
            'settings.cfg': '⚙️', 'error.log': '📋', 'Incremental': '➕', 'Differential': '🔁',
            'Full': '📦', 'PDFs': '📄', 'Videos': '🎬', 'Executables': '⚙️',
            'Restore from backup': '💾', 'Use antivirus': '🛡️', 'Recover from recycle bin': '♻️'
        }, zone: { 'Document': '📄', 'Spreadsheet': '📊', 'Image': '🖼️', 'Work': '💼',
            'Personal': '👤', 'Archive': '📦', 'Read-only': '🔒', 'Hidden': '👻',
            'Archive': '📦', 'Word': '📄', 'Excel': '📊', 'PowerPoint': '📽️',
            'Primary': '💾', 'Backup': '🔁', 'Archive': '📦', 'Boot': '⚙️', 'Config': '⚙️',
            'Log': '📋', 'Daily': '📅', 'Weekly': '📅', 'Monthly': '📅', 'Documents': '📄',
            'Media': '🎬', 'Programs': '⚙️', 'Hardware failure': '💻', 'Ransomware': '💀',
            'Accidental deletion': '🗑️' } },
    typing: { drag: { 'ASDF': '🖐️', 'JKL;': '🖐️', 'Ctrl+Shift+Esc': '⌨️', 'Alt+Tab': '🔄',
            'Windows+D': '🖥️', 'Ctrl+C': '📋', 'Ctrl+V': '📋', 'Ctrl+Z': '↩️',
            'Windows+E': '📁', 'Windows+R': '▶️', 'Windows+I': '⚙️', 'Ctrl+A': '📋',
            'Ctrl+F': '🔍', 'Ctrl+S': '💾', 'Ctrl+B': '🔤', 'Ctrl+I': '🔤', 'Ctrl+U': '🔤',
            'Windows+Shift+S': '📸', 'Windows+Plus': '🔍', 'Windows+Ctrl+Enter': '🔊',
            'Windows+Alt+Print Screen': '🎨', 'Windows+V': '📋', 'Click to paste': '🖱️'
        }, zone: { 'Left Hand': '🖐️', 'Right Hand': '🖐️', 'Task Manager': '⚙️',
            'Switch App': '🔄', 'Show Desktop': '🖥️', 'Copy': '📋', 'Paste': '📋',
            'Undo': '↩️', 'Open Explorer': '📁', 'Run dialog': '▶️', 'Settings': '⚙️',
            'Select all': '📋', 'Find': '🔍', 'Save': '💾', 'Bold': '🔤', 'Italic': '🔤',
            'Underline': '🔤', 'Snipping Tool': '📸', 'Magnifier': '🔍', 'Narrator': '🔊',
            'High Contrast': '🎨', 'Open history': '📋', 'Paste selected': '🖱️' } },
    spreadsheet: { drag: { '=SUM(': '🔢', 'A1:A10': '🔢', ')': '🔢', '=COUNT(': '🔢', '=AVERAGE(': '🔢',
            'B1:B10': '🔢', '=': '🔢', '+': '➕', 'A1': '🔢', 'B1': '🔢', '=SUM': '🔢',
            '=AVERAGE': '🔢', '=COUNT': '🔢', '=IF(': '🔢', 'A1>10': '🔢', ',"Yes","No")': '🔢',
            '=VLOOKUP(': '🔢', 'A2': '🔢', ',': '🔢', 'B:C': '🔢', '2': '🔢', 'FALSE)': '🔢'
        }, zone: { '=SUM(': '🔢', 'A1:A10': '🔢', ')': '🔢', '=COUNT(': '🔢', '=AVERAGE(': '🔢',
            'B1:B10': '🔢', '=': '🔢', '+': '➕', 'A1': '🔢', 'B1': '🔢', 'SUM': '🔢',
            'AVERAGE': '🔢', 'COUNT': '🔢', '=IF(': '🔢', '>10': '🔢', ',"Yes","No")': '🔢',
            'SUMIF': '🔢', 'VLOOKUP': '🔢', 'CONCATENATE': '🔢', 'Whole number': '🔢',
            'Decimal': '🔢', 'List': '📋', 'Sheet': '📄', 'Workbook': '📚', 'Cell': '🔲' } },
    maintenance: { drag: { 'Check memory': '🧠', 'Reset router': '📡', 'Run disk cleanup': '🧹',
            'Video card': '🖥️', 'Ethernet adapter': '📡', 'Sound card': '🔊',
            'Free up space': '🧹', 'Optimize files': '📁', 'Repair disk errors': '🔧',
            'Cable unplugged': '🔌', 'Bandwidth limit': '📡', 'Untrusted certificate': '🔒',
            'Suspicious email': '📧', 'Files encrypted': '💀', 'Pop-ups & tracking': '🕵️',
            'Off-site backup': '☁️', 'Local full backup': '💾', 'Shared folder backup': '📁',
            'Startup Repair': '🔧', 'SFC /scannow': '🔧', 'Safe Mode': '🛡️',
            'High usage': '📈', 'Low free RAM': '🧠', 'Slow read/write': '💾',
            'Temp files cleanup': '🧹', 'Disk defrag': '📁', 'Full system backup': '💾'
        }, zone: { 'Blue screen': '💻', 'No internet': '📡', 'Slow PC': '🐢',
            'Graphics': '🖥️', 'Network': '📡', 'Audio': '🔊',
            'Disk Cleanup': '🧹', 'Defragment': '📁', 'Check Disk': '🔧',
            'No connectivity': '📡', 'Slow speed': '🐢', 'Security warning': '🔒',
            'Phishing': '📧', 'Ransomware': '💀', 'Spyware': '🕵️',
            'Cloud': '☁️', 'External drive': '💾', 'Network': '📡',
            'Boot failure': '💻', 'File corruption': '📄', 'Driver issue': '🔧',
            'CPU': '⚙️', 'Memory': '🧠', 'Disk': '💾',
            'Weekly': '📅', 'Monthly': '📅', 'Quarterly': '📅' } }
};

function getIcon(type, key, moduleId) {
    const map = ICON_MAP[moduleId]?.[type];
    if (map && map[key]) return map[key];
    return '';
}

// ─── RENDER FUNCTIONS WITH ICONS AND ACRONYM TOOLTIPS ───
function renderDragDropQ(area, q, moduleId) {
    const zonesDiv = document.createElement('div');
    zonesDiv.className = 'drop-zones';
    q.zones.forEach(zone => {
        const z = document.createElement('div');
        z.className = 'drop-zone';
        z.dataset.zone = zone;
        const icon = getIcon('zone', zone, moduleId);
        z.innerHTML = `<span class="zone-label">${icon ? `<span class="zone-icon">${icon}</span>` : ''} ${zone}</span><div class="zone-items" id="zone-${zone}"></div>`;
        zonesDiv.appendChild(z);
    });
    area.appendChild(zonesDiv);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'drag-items';
    itemsDiv.id = 'dragItems';
    q.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'drag-item';
        const icon = getIcon('drag', item, moduleId);
        el.innerHTML = `${icon ? `<span class="item-icon">${icon}</span>` : ''} ${wrapAcronyms(item)}`;
        el.draggable = true;
        el.dataset.item = item;
        el.addEventListener('dragstart', onDragStart);
        el.addEventListener('dragend', onDragEnd);
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        itemsDiv.appendChild(el);
    });
    area.appendChild(itemsDiv);

    zonesDiv.addEventListener('dragover', onDragOver);
    zonesDiv.addEventListener('drop', onDrop);
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragenter', onDragEnter);
        zone.addEventListener('dragleave', onDragLeave);
    });

    area.dataset.placed = JSON.stringify({});
    area.dataset.correct = JSON.stringify(q.correct);
}

function renderSequenceQ(area, q, moduleId) {
    const seqDiv = document.createElement('div');
    seqDiv.className = 'sequence-items';
    const shuffled = q.shuffledSteps || q.steps;
    shuffled.forEach((step, idx) => {
        const el = document.createElement('div');
        el.className = 'seq-item';
        const icon = getIcon('drag', step, moduleId) || '🔢';
        el.innerHTML = `${icon ? `<span class="seq-icon">${icon}</span>` : ''} ${wrapAcronyms(step)}`;
        el.dataset.idx = idx;
        el.dataset.step = step;
        el.addEventListener('click', function() {
            if (this.classList.contains('disabled') || this.classList.contains('correct')) return;
            handleSeqClick(area, q, this);
        });
        seqDiv.appendChild(el);
    });
    area.appendChild(seqDiv);
    area.dataset.seqIndex = '0';
    area.dataset.seqCorrect = JSON.stringify(q.correctOrder);
    area.dataset.seqClicked = JSON.stringify([]);
}

function renderChoiceQ(area, q, moduleId) {
    const optsDiv = document.createElement('div');
    optsDiv.className = 'choice-options';
    q.options.forEach((opt, idx) => {
        const el = document.createElement('div');
        el.className = 'choice-opt';
        const icon = getIcon('drag', opt, moduleId) || '🔘';
        el.innerHTML = `${icon ? `<span class="choice-icon">${icon}</span>` : ''} ${wrapAcronyms(opt)}`;
        el.dataset.idx = idx;
        el.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            handleChoiceClick(area, q, this);
        });
        optsDiv.appendChild(el);
    });
    area.appendChild(optsDiv);
    area.dataset.choiceAnswered = 'false';
}

function renderQuestion(moduleId, idx) {
    try {
        const q = currentGame.questions[idx];
        if (!q) {
            console.error('No question at index', idx);
            return;
        }
        const area = currentGame.gameArea;
        const feedback = currentGame.feedbackEl;
        const progress = document.getElementById('qProgress');
        area.innerHTML = '';
        area.appendChild(progress);
        area.appendChild(feedback);
        document.getElementById('qNum').textContent = idx + 1;

        const title = document.createElement('div');
        title.className = 'task-title';
        let icon = '';
        if (q.type === 'dragdrop') icon = '🔄';
        else if (q.type === 'sequence') icon = '🔢';
        else if (q.type === 'choice') icon = '✅';
        title.innerHTML = `${icon ? `<span class="task-icon">${icon}</span>` : ''} ${wrapAcronyms(q.title || 'Challenge')}`;
        area.appendChild(title);

        if (q.type === 'dragdrop') renderDragDropQ(area, q, moduleId);
        else if (q.type === 'sequence') renderSequenceQ(area, q, moduleId);
        else if (q.type === 'choice') renderChoiceQ(area, q, moduleId);
        else {
            feedback.textContent = 'Unknown challenge type.';
            feedback.className = 'game-feedback error';
        }

        currentGame.nextBtn.disabled = true;
        feedback.textContent = 'Complete the challenge to proceed.';
        feedback.className = 'game-feedback info';
        area.dataset.qidx = idx;
    } catch (e) {
        console.error('Error rendering question:', e);
        const area = currentGame.gameArea;
        area.innerHTML = `<div style="color:#f87171;padding:20px;text-align:center;">⚠️ Error loading question. Please reset.</div>`;
    }
}

// ─── DRAG EVENTS ───
let dragData = null;

function onDragStart(e) {
    const el = e.target.closest('.drag-item');
    if (!el) return;
    dragData = { item: el.dataset.item, el: el };
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', el.dataset.item);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.getElementById('dragGhost');
    ghost.innerHTML = el.innerHTML;
    ghost.style.display = 'block';
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
}

function onDragEnd(e) {
    const el = e.target.closest('.drag-item');
    if (el) el.classList.remove('dragging');
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    document.getElementById('dragGhost').style.display = 'none';
}

function onDragOver(e) { e.preventDefault();
    e.dataTransfer.dropEffect = 'move'; }

function onDragEnter(e) { e.preventDefault(); const zone = e.target.closest('.drop-zone'); if (zone) zone.classList.add(
        'drag-over'); }

function onDragLeave(e) { const zone = e.target.closest('.drop-zone'); if (zone) zone.classList.remove('drag-over'); }

function onDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.drop-zone');
    if (!zone) return;
    zone.classList.remove('drag-over');
    const item = e.dataTransfer.getData('text/plain');
    if (!item) return;
    placeDragItem(zone, item);
}

let touchDragItem = null;
let touchGhost = document.getElementById('dragGhost');

function onTouchStart(e) {
    const el = e.target.closest('.drag-item');
    if (!el) return;
    touchDragItem = el;
    const touch = e.touches[0];
    touchGhost.innerHTML = el.innerHTML;
    touchGhost.style.display = 'block';
    touchGhost.style.left = touch.clientX + 'px';
    touchGhost.style.top = touch.clientY + 'px';
    el.classList.add('dragging');
}

function onTouchMove(e) {
    if (!touchDragItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchGhost.style.left = touch.clientX + 'px';
    touchGhost.style.top = touch.clientY + 'px';
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = el ? el.closest('.drop-zone') : null;
    if (zone) zone.classList.add('drag-over');
}

function onTouchEnd(e) {
    if (!touchDragItem) return;
    touchGhost.style.display = 'none';
    touchDragItem.classList.remove('dragging');
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = el ? el.closest('.drop-zone') : null;
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    if (zone) {
        const item = touchDragItem.dataset.item;
        placeDragItem(zone, item);
    }
    touchDragItem = null;
}

function placeDragItem(zone, item) {
    const area = zone.closest('.game-area');
    const qidx = parseInt(area.dataset.qidx);
    const q = currentGame.questions[qidx];
    let placed = JSON.parse(area.dataset.placed || '{}');

    if (placed[item]) {
        const oldZone = document.querySelector(`.drop-zone[data-zone="${placed[item]}"]`);
        if (oldZone) {
            const container = oldZone.querySelector('.zone-items');
            const oldItem = container.querySelector(`[data-item="${item}"]`);
            if (oldItem) oldItem.remove();
        }
        const dragItems = area.querySelector('#dragItems');
        const existing = dragItems.querySelector(`[data-item="${item}"]`);
        if (!existing) {
            const newEl = document.createElement('div');
            newEl.className = 'drag-item';
            const icon = getIcon('drag', item, currentGame.moduleId);
            newEl.innerHTML = `${icon ? `<span class="item-icon">${icon}</span>` : ''} ${wrapAcronyms(item)}`;
            newEl.draggable = true;
            newEl.dataset.item = item;
            newEl.addEventListener('dragstart', onDragStart);
            newEl.addEventListener('dragend', onDragEnd);
            newEl.addEventListener('touchstart', onTouchStart, { passive: true });
            newEl.addEventListener('touchmove', onTouchMove, { passive: false });
            newEl.addEventListener('touchend', onTouchEnd, { passive: true });
            dragItems.appendChild(newEl);
        }
        delete placed[item];
    }

    const zoneItems = zone.querySelector('.zone-items');
    const itemEl = document.createElement('div');
    itemEl.className = 'zone-item';
    itemEl.textContent = item;
    itemEl.dataset.item = item;
    zoneItems.appendChild(itemEl);

    const dragItems = area.querySelector('#dragItems');
    const dragEl = dragItems.querySelector(`[data-item="${item}"]`);
    if (dragEl) dragEl.remove();

    placed[item] = zone.dataset.zone;
    area.dataset.placed = JSON.stringify(placed);

    const totalItems = q.items.length;
    if (Object.keys(placed).length === totalItems) {
        currentGame.nextBtn.disabled = false;
        currentGame.feedbackEl.textContent = 'All items placed! Click NEXT to check.';
        currentGame.feedbackEl.className = 'game-feedback success';
    } else {
        currentGame.feedbackEl.textContent = `Placed ${Object.keys(placed).length}/${totalItems} items.`;
        currentGame.feedbackEl.className = 'game-feedback info';
    }
}

// ─── SEQUENCE CLICK ───
function handleSeqClick(area, q, el) {
    if (el.classList.contains('disabled')) return;
    let seqIndex = parseInt(area.dataset.seqIndex || '0');
    const correctOrder = JSON.parse(area.dataset.seqCorrect);
    const clicked = JSON.parse(area.dataset.seqClicked || '[]');
    const step = el.dataset.step;
    const expected = correctOrder[seqIndex];
    if (step === expected) {
        el.classList.add('correct');
        el.classList.add('disabled');
        clicked.push(step);
        seqIndex++;
        area.dataset.seqIndex = seqIndex;
        area.dataset.seqClicked = JSON.stringify(clicked);
        currentGame.feedbackEl.textContent = `✅ Correct! (${seqIndex}/${correctOrder.length})`;
        currentGame.feedbackEl.className = 'game-feedback success';
        if (seqIndex === correctOrder.length) {
            currentGame.nextBtn.disabled = false;
            currentGame.feedbackEl.textContent = '🎉 Sequence complete! Click NEXT.';
        }
    } else {
        el.classList.add('wrong');
        currentGame.feedbackEl.textContent = `❌ Wrong. Expected "${expected}"`;
        currentGame.feedbackEl.className = 'game-feedback error';
        setTimeout(() => el.classList.remove('wrong'), 800);
        if (loseHeart()) finishLevel(currentGame.moduleId);
    }
}

// ─── CHOICE CLICK ───
function handleChoiceClick(area, q, el) {
    if (area.dataset.choiceAnswered === 'true') return;
    const idx = parseInt(el.dataset.idx);
    const correct = q.correct;
    const options = area.querySelectorAll('.choice-opt');
    options.forEach(opt => opt.classList.add('disabled'));
    if (idx === correct) {
        el.classList.add('selected-correct');
        currentGame.feedbackEl.textContent = '✅ Correct!';
        currentGame.feedbackEl.className = 'game-feedback success';
        area.dataset.choiceAnswered = 'true';
        currentGame.nextBtn.disabled = false;
    } else {
        el.classList.add('selected-wrong');
        options[correct].classList.add('selected-correct');
        currentGame.feedbackEl.textContent = `❌ Incorrect. The correct answer was: "${q.options[correct]}"`;
        currentGame.feedbackEl.className = 'game-feedback error';
        area.dataset.choiceAnswered = 'true';
        if (loseHeart()) finishLevel(currentGame.moduleId);
        else setTimeout(() => { currentGame.nextBtn.disabled = false; }, 500);
    }
}

// ─── GAME ENGINE FUNCTIONS ───
function startGame(moduleId) {
    const levels = MODULE_LEVELS[moduleId];
    const lv = state[moduleId].level;
    const data = levels[lv];
    if (!data) {
        console.error('No level data for', moduleId, lv);
        return;
    }

    currentGame.moduleId = moduleId;
    currentGame.levelData = data;
    currentGame.currentQ = 0;
    currentGame.answers = [];
    currentGame.isComplete = false;

    currentGame.questions = data.questions.map(q => {
        const qCopy = JSON.parse(JSON.stringify(q));
        if (qCopy.type === 'dragdrop') {
            const items = qCopy.items;
            const shuffledItems = shuffleArray([...items]);
            const newCorrect = {};
            shuffledItems.forEach(item => { newCorrect[item] = qCopy.correct[item]; });
            qCopy.items = shuffledItems;
            qCopy.correct = newCorrect;
        } else if (qCopy.type === 'sequence') {
            const steps = qCopy.steps;
            qCopy.shuffledSteps = shuffleArray([...steps]);
            qCopy.correctOrder = steps;
        } else if (qCopy.type === 'choice') {
            const options = qCopy.options;
            const shuffled = shuffleArray([...options]);
            const correctText = options[qCopy.correct];
            qCopy.options = shuffled;
            qCopy.correct = shuffled.indexOf(correctText);
        }
        return qCopy;
    });

    document.getElementById(moduleId + 'GameLevel').textContent = 'Level ' + (lv + 1);
    resetHearts(moduleId + 'GameStars');
    startTimer(moduleId + 'GameTimer');
    document.getElementById(moduleId + 'FeedbackOverlay').classList.remove('show');

    const area = document.getElementById(moduleId + 'GameArea');
    area.innerHTML = '';
    currentGame.gameArea = area;
    currentGame.feedbackEl = document.createElement('div');
    currentGame.feedbackEl.className = 'game-feedback';
    area.appendChild(currentGame.feedbackEl);

    const progressDiv = document.createElement('div');
    progressDiv.className = 'question-progress';
    progressDiv.id = 'qProgress';
    progressDiv.innerHTML = `Question <span id="qNum">1</span> / ${currentGame.questions.length}`;
    area.appendChild(progressDiv);

    const resetBtn = document.getElementById(moduleId + 'ResetBtn');
    const nextBtn = document.getElementById(moduleId + 'NextBtn');
    const newReset = resetBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newReset, resetBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    currentGame.resetBtn = document.getElementById(moduleId + 'ResetBtn');
    currentGame.nextBtn = document.getElementById(moduleId + 'NextBtn');

    currentGame.resetBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetCurrentLevel(moduleId);
    });

    currentGame.nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        nextQuestion(moduleId);
    });

    currentGame.nextBtn.disabled = true;
    currentGame.nextBtn.textContent = '➜ NEXT';

    renderQuestion(moduleId, 0);
}

function resetCurrentLevel(moduleId) {
    if (!transition(moduleId, 'RESTART')) return;
    document.getElementById(moduleId + 'FeedbackOverlay').classList.remove('show');
    startGame(moduleId);
}

function nextQuestion(moduleId) {
    if (state[moduleId].phase !== 'PLAYING') return;
    if (currentGame.isComplete) return;
    const idx = currentGame.currentQ;
    const area = currentGame.gameArea;
    const q = currentGame.questions[idx];
    let correct = false;

    if (q.type === 'dragdrop') {
        const placed = JSON.parse(area.dataset.placed || '{}');
        const correctMap = JSON.parse(area.dataset.correct || '{}');
        let allCorrect = true;
        for (const [item, zone] of Object.entries(placed)) {
            if (correctMap[item] !== zone) { allCorrect = false; break; }
        }
        correct = allCorrect && Object.keys(placed).length === q.items.length;
        document.querySelectorAll('.zone-item').forEach(el => {
            const item = el.dataset.item;
            const zone = el.closest('.drop-zone').dataset.zone;
            if (correctMap[item] === zone) el.classList.add('correct');
            else el.classList.add('wrong');
        });
    } else if (q.type === 'sequence') {
        const clicked = JSON.parse(area.dataset.seqClicked || '[]');
        const correctOrder = JSON.parse(area.dataset.seqCorrect);
        correct = clicked.length === correctOrder.length;
    } else if (q.type === 'choice') {
        correct = area.dataset.choiceAnswered === 'true';
        const opts = area.querySelectorAll('.choice-opt');
        let selectedCorrect = false;
        opts.forEach(opt => { if (opt.classList.contains('selected-correct')) selectedCorrect = true; });
        correct = selectedCorrect;
    }

    currentGame.answers.push(correct);
    if (!correct && q.type === 'dragdrop' && loseHeart()) { finishLevel(moduleId); return; }

    if (currentGame.currentQ < currentGame.questions.length - 1) {
        currentGame.currentQ++;
        renderQuestion(moduleId, currentGame.currentQ);
        currentGame.nextBtn.disabled = true;
    } else {
        finishLevel(moduleId);
    }
}

function notifyPcOpsProgress(game, earnedXP) {
    try {
        const completed = state[game].completed.size;
        const total = MODULE_LEVELS[game].length;
        const hs = heartsSummary(game, MODULE_LEVELS[game].map((_, i) => i + 1), state[game].completed);
        (window.parent || window).postMessage({
            type: 'PC_OPS_PROGRESS', game, completed, total, pct: hs.pct,
            earnedXP: earnedXP || 0,
            heartsLeft: hearts.cur, heartsEarned: hs.earned, heartsMax: hs.max,
            moduleComplete: completed >= total
        }, '*');
    } catch (e) { /* standalone mode */ }
}

function finishLevel(moduleId) {
    if (currentGame.isComplete) return;
    currentGame.isComplete = true;
    stopTimer();

    const correctCount = currentGame.answers.filter(a => a).length;
    const total = currentGame.answers.length;
    const allCorrect = hearts.cur > 0; // pass = survived with hearts left
    if (!transition(moduleId, allCorrect ? 'PASS' : 'FAIL')) return;

    if (allCorrect) {
        const lv = state[moduleId].level;
        state[moduleId].completed.add(lv + 1);
        keepHearts(moduleId, lv + 1);
        updateMainMenu();
    }

    const xp = 20 + correctCount * 10 + Math.max(0, 60 - state.seconds) * 0.5;
    if (allCorrect) notifyPcOpsProgress(moduleId, Math.round(xp));
    const overlay = document.getElementById(moduleId + 'FeedbackOverlay');

    if (allCorrect) {
        document.getElementById(moduleId + 'FbIcon').textContent = '🎉';
        document.getElementById(moduleId + 'FbTitle').textContent = 'Level Complete!';
        document.getElementById(moduleId + 'FbTitle').className = 'fb-title gold';
        document.getElementById(moduleId + 'FbSub').textContent = `You got ${correctCount}/${total} correct!`;
        document.getElementById(moduleId + 'FbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Time Bonus</span><span>+${Math.max(0, 60 - state.seconds)} XP</span></div><div class="row"><span class="label">Accuracy Bonus</span><span>+${correctCount * 10} XP</span></div><div class="row"><span class="label">TOTAL XP</span><span class="text-glow" style="color:#f5a623;">${Math.round(xp)} XP</span></div>`;
        document.getElementById(moduleId + 'FbNext').style.display = (state[moduleId].level < MODULE_LEVELS[
            moduleId].length - 1) ? '' : 'none';
        document.getElementById(moduleId + 'FbReplay').textContent = '↻ REPLAY';
    } else {
        document.getElementById(moduleId + 'FbIcon').textContent = '💔';
        document.getElementById(moduleId + 'FbTitle').textContent = 'Out of Hearts!';
        document.getElementById(moduleId + 'FbTitle').className = 'fb-title gold';
        document.getElementById(moduleId + 'FbSub').textContent = `You lost all ${MAX_HEARTS} hearts (${correctCount}/${total} correct). Retry the level!`;
        document.getElementById(moduleId + 'FbScore').innerHTML =
            `<div class="row"><span class="label">Hearts Left</span><span class="hearts-row">${heartsStr()}</span></div><div class="row"><span class="label">Score</span><span>${correctCount}/${total}</span></div>`;
        document.getElementById(moduleId + 'FbNext').style.display = 'none';
        document.getElementById(moduleId + 'FbReplay').textContent = '↻ RETRY';
    }
    overlay.classList.add('show');
    if (currentGame.nextBtn) currentGame.nextBtn.disabled = true;
}

document.querySelectorAll('[id$="FbReplay"]').forEach(btn => {
    btn.addEventListener('click', function() {
        const moduleId = this.id.replace('FbReplay', '');
        const replayEv = this.textContent === '↻ BACK' ? 'EXIT' : (state[moduleId].phase === 'GAME_OVER' ? 'RETRY' : 'REPLAY');
        if (!transition(moduleId, replayEv)) return;
        document.getElementById(moduleId + 'FeedbackOverlay').classList.remove('show');
        if (this.textContent === '↻ BACK') {
            document.getElementById(moduleId + '-game').style.display = 'none';
            document.getElementById(moduleId + '-select').style.display = '';
            return;
        }
        startGame(moduleId);
    });
});

document.querySelectorAll('[id$="FbNext"]').forEach(btn => {
    btn.addEventListener('click', function() {
        const moduleId = this.id.replace('FbNext', '');
        if (!transition(moduleId, 'NEXT')) return;
        document.getElementById(moduleId + 'FeedbackOverlay').classList.remove('show');
        const levels = MODULE_LEVELS[moduleId];
        if (state[moduleId].level < levels.length - 1) {
            state[moduleId].level++;
            document.getElementById(moduleId + '-game').style.display = 'none';
            document.getElementById(moduleId + '-select').style.display = '';
            renderLevelGrid(document.getElementById(moduleId + 'LevelGrid'), levels, state[moduleId]
                .completed, state[moduleId].level);
        } else {
            document.getElementById(moduleId + '-game').style.display = 'none';
            document.getElementById(moduleId + '-select').style.display = '';
            updateMainMenu();
        }
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Ensure glossary is populated before any interaction
document.addEventListener('DOMContentLoaded', function() {
    // Already done above
});

// Embedded mode: SkillQuest dashboard opens a single module and receives progress back
const PC_PARAMS = new URLSearchParams(window.location.search);
const PC_AUTOSTART = PC_PARAMS.get('game');
if (PC_PARAMS.get('embed') === '1' && MODULE_LEVELS[PC_AUTOSTART]) {
    initModule(PC_AUTOSTART);
    showScreen('screen-' + PC_AUTOSTART);
    try { (window.parent || window).postMessage({ type: 'EIM_GAME_READY', game: PC_AUTOSTART }, '*'); } catch (e) {}
} else {
    showScreen('screen-main');
    updateMainMenu();
}
console.log('💻 PC Ops Interactive – Icons, glossary, and acronym tooltips added!');
