/* Replaces emoji with a consistent line-icon set (inline SVG, works offline).
   Original character is kept as visually-hidden text so textContent stays unchanged.
   Unmapped emoji are left as-is. */
(function () {
    'use strict';
    var PATHS = {
 "bolt": "<path d=\"M13 2 4 14h7l-1 8 9-12h-7z\"/>",
 "headset": "<path d=\"M3 14v-2a9 9 0 0 1 18 0v2\"/><path d=\"M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z\"/><path d=\"M3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z\"/><path d=\"M18 17v1a3 3 0 0 1-3 3h-2\"/>",
 "laptop": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"11\" rx=\"2\"/><path d=\"M2 20h20\"/>",
 "monitor": "<rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/>",
 "play": "<path d=\"M7 4.5v15l12-7.5z\"/>",
 "grad": "<path d=\"m2 9 10-5 10 5-10 5z\"/><path d=\"M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5\"/><path d=\"M22 9v6\"/>",
 "medal": "<circle cx=\"12\" cy=\"15\" r=\"5\"/><path d=\"m8 3 4 7 4-7\"/><path d=\"M12 12.5v5\"/>",
 "key": "<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"m11 12 9-9\"/><path d=\"m16 7 3 3\"/>",
 "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c0-4 4-6 8-6s8 2 8 6\"/>",
 "school": "<path d=\"M3 21h18\"/><path d=\"M5 21V9l7-5 7 5v12\"/><path d=\"M10 21v-5h4v5\"/><path d=\"M12 10v.01\"/>",
 "home": "<path d=\"m3 11 9-8 9 8\"/><path d=\"M5 10v10h14V10\"/><path d=\"M10 20v-6h4v6\"/>",
 "clipboard": "<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"4\" rx=\"1\"/><path d=\"M9 12h6M9 16h4\"/>",
 "chart": "<path d=\"M4 4v16h16\"/><path d=\"M8 16v-4M12 16V8M16 16v-6\"/>",
 "trophy": "<path d=\"M8 4h8v6a4 4 0 0 1-8 0z\"/><path d=\"M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4\"/><path d=\"M12 14v4M9 21h6M10 18h4\"/>",
 "sparkle": "<path d=\"m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z\"/><path d=\"M19 16v4M17 18h4\"/>",
 "star": "<path d=\"m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z\"/>",
 "logout": "<path d=\"M10 4H5v16h5\"/><path d=\"m15 8 4 4-4 4\"/><path d=\"M19 12H9\"/>",
 "download": "<path d=\"M12 4v11\"/><path d=\"m7 11 5 5 5-5\"/><path d=\"M5 20h14\"/>",
 "lock": "<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/>",
 "warn": "<path d=\"M12 3 22 20H2z\"/><path d=\"M12 10v4M12 17.5v.01\"/>",
 "checkc": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.5 3 3 5-6\"/>",
 "xc": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m9 9 6 6M15 9l-6 6\"/>",
 "check": "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
 "x": "<path d=\"M6 6l12 12M18 6 6 18\"/>",
 "bulb": "<path d=\"M9 18h6M10 21h4\"/><path d=\"M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z\"/>",
 "target": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>",
 "search": "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m21 21-5-5\"/>",
 "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z\"/>",
 "shield": "<path d=\"m12 3 8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/><path d=\"m9 12 2 2 4-4\"/>",
 "plug": "<path d=\"M9 2v6M15 2v6\"/><path d=\"M6 8h12v4a6 6 0 0 1-12 0z\"/><path d=\"M12 18v4\"/>",
 "battery": "<rect x=\"2\" y=\"8\" width=\"18\" height=\"9\" rx=\"2\"/><path d=\"M22 11v3M6 11v3M10 11v3\"/>",
 "wave": "<path d=\"M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2\"/><path d=\"M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2\"/><path d=\"M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2\"/>",
 "mic": "<rect x=\"9\" y=\"3\" width=\"6\" height=\"11\" rx=\"3\"/><path d=\"M5 11a7 7 0 0 0 14 0M12 18v3\"/>",
 "folder": "<path d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
 "keyboard": "<rect x=\"2\" y=\"6\" width=\"20\" height=\"12\" rx=\"2\"/><path d=\"M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10\"/>",
 "phone": "<path d=\"M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z\"/>",
 "speaker": "<path d=\"M4 9v6h4l5 4V5L8 9z\"/><path d=\"M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12\"/>",
 "mute": "<path d=\"M4 9v6h4l5 4V5L8 9z\"/><path d=\"m17 9 5 6M22 9l-5 6\"/>",
 "music": "<path d=\"M9 18V5l11-2v13\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"17\" cy=\"16\" r=\"3\"/>",
 "fire": "<path d=\"M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z\"/>",
 "drop": "<path d=\"M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z\"/>",
 "crown": "<path d=\"m3 8 4 4 5-7 5 7 4-4-2 11H5z\"/>",
 "book": "<path d=\"M2 5h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z\"/><path d=\"M22 5h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z\"/>",
 "link": "<path d=\"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1\"/><path d=\"M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1\"/>",
 "refresh": "<path d=\"M20 11a8 8 0 0 0-14-4L4 9\"/><path d=\"M4 4v5h5\"/><path d=\"M4 13a8 8 0 0 0 14 4l2-2\"/><path d=\"M20 20v-5h-5\"/>",
 "save": "<path d=\"M5 3h11l3 3v15H5z\"/><path d=\"M8 3v5h7\"/><path d=\"M8 21v-7h8v7\"/>",
 "gear": "<circle cx=\"12\" cy=\"12\" r=\"3.5\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1\"/><circle cx=\"12\" cy=\"12\" r=\"7\"/>",
 "doc": "<path d=\"M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/>",
 "calendar": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/>",
 "wifi": "<path d=\"M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 20h.01\"/>",
 "package": "<path d=\"m21 8-9-5-9 5v8l9 5 9-5z\"/><path d=\"m3 8 9 5 9-5M12 13v8\"/>",
 "trash": "<path d=\"M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v6M14 10v6\"/>",
 "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 7 9 6 9-6\"/>",
 "image": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.5\"/><path d=\"m21 16-5-5-9 9\"/>",
 "cloud": "<path d=\"M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z\"/>",
 "mouse": "<path d=\"M12 3a5 5 0 0 1 5 5v8a5 5 0 0 1-10 0V8a5 5 0 0 1 5-5z\"/><path d=\"M12 3v6\"/>",
 "camera": "<path d=\"M4 7h3l2-3h6l2 3h3v13H4z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/>",
 "film": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 10h18M3 14h18M8 5v14M16 5v14\"/>",
 "eye": "<path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
 "ban": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m5.6 5.6 12.8 12.8\"/>",
 "trend": "<path d=\"m3 17 6-6 4 4 8-8\"/><path d=\"M15 7h6v6\"/>",
 "hash": "<path d=\"M5 9h14M5 15h14M10 4 8 20M16 4l-2 16\"/>",
 "type": "<path d=\"M4 7V5h16v2M12 5v14M9 19h6\"/>",
 "flask": "<path d=\"M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3\"/>",
 "plus": "<path d=\"M12 5v14M5 12h14\"/>",
 "undo": "<path d=\"M9 14 4 9l5-5\"/><path d=\"M4 9h10a6 6 0 0 1 0 12h-3\"/>",
 "help": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01\"/>"
};
    var MAP = {"⚡": "bolt", "💪": "bolt", "🎧": "headset", "💻": "laptop", "🖥": "monitor", "▶": "play", "🎓": "grad", "🏅": "medal", "🎖": "medal", "🥇": "medal", "🥈": "medal", "🥉": "medal", "🔑": "key", "🧑": "user", "🏫": "school", "🏠": "home", "📋": "clipboard", "📊": "chart", "🏆": "trophy", "🎉": "sparkle", "👋": "sparkle", "⭐": "star", "🌟": "star", "🚪": "logout", "⎋": "logout", "⬇": "download", "🔒": "lock", "⚠": "warn", "🚧": "warn", "✅": "checkc", "❌": "xc", "✔": "check", "✖": "x", "💡": "bulb", "🎯": "target", "🔍": "search", "🔎": "search", "🔧": "wrench", "🛠": "wrench", "🛡": "shield", "⛑": "shield", "🔌": "plug", "🔋": "battery", "🌊": "wave", "🎙": "mic", "📁": "folder", "📂": "folder", "⌨": "keyboard", "📞": "phone", "🔊": "speaker", "🔇": "mute", "🎵": "music", "🔥": "fire", "🩸": "drop", "👑": "crown", "📚": "book", "📖": "book", "🔗": "link", "↻": "refresh", "🔄": "refresh", "🔁": "refresh", "💾": "save", "⚙": "gear", "📄": "doc", "📅": "calendar", "📡": "wifi", "📦": "package", "🧹": "trash", "📧": "mail", "🖼": "image", "☁": "cloud", "🖱": "mouse", "📸": "camera", "🎬": "film", "👁": "eye", "🚫": "ban", "📈": "trend", "🔢": "hash", "🔤": "type", "🧪": "flask", "➕": "plus", "↩": "undo", "❓": "help"};

    var NS = 'http://www.w3.org/2000/svg';
    var RE = /[\p{Extended_Pictographic}\u25B6\u21BB\u2B07\u238B\u2714\u2716]\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*/gu;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1, NOSCRIPT: 1, SVG: 1, svg: 1 };

    function injectSprite() {
        if (document.getElementById('ic-sprite')) return;
        var s = '<svg id="ic-sprite" xmlns="' + NS + '" style="display:none" aria-hidden="true">';
        for (var k in PATHS) s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + PATHS[k] + '</symbol>';
        document.body.insertAdjacentHTML('afterbegin', s + '</svg>');
    }

    function makeIcon(name, original) {
        var span = document.createElement('span');
        span.className = 'ic';
        span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + name + '"/></svg>' +
            '<span class="ic-t"></span>';
        span.lastChild.textContent = original;
        return span;
    }

    function convert(node) {
        var text = node.nodeValue;
        RE.lastIndex = 0;
        var out = null, last = 0, m;
        while ((m = RE.exec(text))) {
            var name = MAP[m[0].charAt(0)] || MAP[String.fromCodePoint(m[0].codePointAt(0))];
            if (!name) continue;
            out = out || document.createDocumentFragment();
            if (m.index > last) out.appendChild(document.createTextNode(text.slice(last, m.index)));
            out.appendChild(makeIcon(name, m[0]));
            last = m.index + m[0].length;
        }
        if (out) {
            if (last < text.length) out.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(out, node);
        }
    }

    function skipped(el) {
        for (; el && el.nodeType === 1; el = el.parentNode) {
            if (SKIP[el.nodeName] || (el.classList && el.classList.contains('ic-t'))) return true;
        }
        return false;
    }

    function sweep(root) {
        if (!root) return;
        if (root.nodeType === 3) { if (!skipped(root.parentNode)) convert(root); return; }
        if (root.nodeType !== 1 || skipped(root)) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
        while ((n = w.nextNode())) if (!skipped(n.parentNode)) list.push(n);
        list.forEach(convert);
    }

    function start() {
        injectSprite();
        sweep(document.body);
        var obs = new MutationObserver(function (recs) {
            recs.forEach(function (r) {
                if (r.type === 'characterData') sweep(r.target);
                else r.addedNodes.forEach(sweep);
            });
            obs.takeRecords(); // drop our own mutations
        });
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
