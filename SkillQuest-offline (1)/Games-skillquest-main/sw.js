const CACHE = 'skillquest-v2';
const ASSETS = [
  "./",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-latin-500-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2",
  "assets/fonts/inter-latin-700-normal.woff2",
  "assets/fonts/inter-latin-800-normal.woff2",
  "assets/fonts/inter-latin-900-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-400-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-600-normal.woff2",
  "assets/fonts/orbitron-latin-400-normal.woff2",
  "assets/fonts/orbitron-latin-700-normal.woff2",
  "assets/fonts/orbitron-latin-900-normal.woff2",
  "assets/fonts/rajdhani-latin-500-normal.woff2",
  "assets/fonts/rajdhani-latin-600-normal.woff2",
  "assets/fonts/rajdhani-latin-700-normal.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/img/circuit/battery.png",
  "assets/img/circuit/bulb-off.png",
  "assets/img/circuit/bulb-on.png",
  "assets/img/circuit/switch-off.png",
  "assets/img/circuit/switch-on.png",
  "assets/img/cmdc-building.jpg",
  "assets/img/cmdc-logo.png",
  "assets/img/gear.svg",
  "assets/img/symbols/3way.png",
  "assets/img/symbols/ammeter.png",
  "assets/img/symbols/battery1.png",
  "assets/img/symbols/bell.png",
  "assets/img/symbols/buzzer.png",
  "assets/img/symbols/cell.png",
  "assets/img/symbols/circuit_breaker.png",
  "assets/img/symbols/conductor_wire__2_.png",
  "assets/img/symbols/connected_wire.png",
  "assets/img/symbols/diode.png",
  "assets/img/symbols/fuse.png",
  "assets/img/symbols/ground.png",
  "assets/img/symbols/inductor.png",
  "assets/img/symbols/lamp.png",
  "assets/img/symbols/led.png",
  "assets/img/symbols/motor.png",
  "assets/img/symbols/push_button.png",
  "assets/img/symbols/resistors.png",
  "assets/img/symbols/single_switch.png",
  "assets/img/symbols/switch_close.png",
  "assets/img/symbols/switched_open.png",
  "assets/img/symbols/thermistor.png",
  "assets/img/symbols/variable_resistor.png",
  "assets/img/symbols/voltmeter.png",
  "assets/img/symbols/wire_not_connected.png",
  "css/fonts.css",
  "css/icons.css",
  "css/index.css",
  "css/theme-bg.css",
  "games/ccs-game.html",
  "games/css/ccs-game.css",
  "games/css/eim-game.css",
  "games/css/pc-ops-game.css",
  "games/eim-game.html",
  "games/js/ccs-game.js",
  "games/js/eim-game.js",
  "games/js/pc-ops-game.js",
  "games/pc-ops-game.html",
  "index.html",
  "js/icons.js",
  "js/index.js",
  "manifest.json"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))
  );
});
