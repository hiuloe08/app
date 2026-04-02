/**

- ⚡ SPERNEW OPTIMIZE — EXTRA SCRIPTS PACK
- ~40 script tối ưu bổ sung, tương thích hoàn toàn với app
- Dán vào cuối <script> hiện tại hoặc import riêng
  */

// ============================================================
// [1] SCROLL MOMENTUM STOPPER
// Dừng quán tính scroll ngay lập tức khi touch end
// (Giảm CPU vô ích khi scroll xong)
// ============================================================
(function ScrollOptimizer() {
let scrollEls = [];
function registerScrollEl(el) {
if (!el || scrollEls.includes(el)) return;
scrollEls.push(el);
let startY, startScroll;
el.addEventListener(‘touchstart’, e => {
startY = e.touches[0].clientY;
startScroll = el.scrollTop;
}, { passive: true });
el.addEventListener(‘touchend’, () => {
// Force recalculate — flush pending paint
el.style.overflow = ‘hidden’;
requestAnimationFrame(() => { el.style.overflow = ‘’; });
}, { passive: true });
}
// Đăng ký tất cả page-scroll
document.querySelectorAll(’.page-scroll’).forEach(registerScrollEl);
// Observer để catch dynamic pages
new MutationObserver(() => {
document.querySelectorAll(’.page-scroll’).forEach(registerScrollEl);
}).observe(document.body, { childList: true, subtree: true });
})();

// ============================================================
// [2] FRAME BUDGET MANAGER
// Giới hạn JS chạy trong mỗi frame ≤ 8ms để giữ 60FPS
// ============================================================
const FrameBudget = {
_tasks: [],
_running: false,
BUDGET_MS: 8,

add(task, priority = 0) {
this._tasks.push({ task, priority });
this._tasks.sort((a, b) => b.priority - a.priority);
if (!this._running) this._run();
},

_run() {
this._running = true;
requestAnimationFrame((timestamp) => {
const deadline = timestamp + this.BUDGET_MS;
while (this._tasks.length && performance.now() < deadline) {
this._tasks.shift().task();
}
if (this._tasks.length) {
this._run(); // Còn task → frame tiếp theo
} else {
this._running = false;
}
});
}
};

// ============================================================
// [3] DOM MUTATION BATCHER
// Gom mọi thay đổi DOM vào 1 lần, tránh reflow liên tục
// ============================================================
const DOMBatcher = {
_reads: [],
_writes: [],
_scheduled: false,

read(fn)  { this._reads.push(fn);  this._schedule(); },
write(fn) { this._writes.push(fn); this._schedule(); },

_schedule() {
if (this._scheduled) return;
this._scheduled = true;
requestAnimationFrame(() => {
// All reads first (avoid forced reflow)
this._reads.forEach(fn => fn());
this._reads = [];
// Then all writes
this._writes.forEach(fn => fn());
this._writes = [];
this._scheduled = false;
});
}
};

// ============================================================
// [4] PASSIVE EVENT AUTO-PATCHER
// Tự động thêm passive:true cho mọi scroll/touch listener
// (Xử lý cả listeners được thêm sau này)
// ============================================================
(function PassivePatcher() {
const orig = EventTarget.prototype.addEventListener;
const passiveEvents = new Set([‘touchstart’,‘touchmove’,‘touchend’,‘scroll’,‘wheel’,‘mousewheel’]);
EventTarget.prototype.addEventListener = function(type, fn, options) {
if (passiveEvents.has(type)) {
if (typeof options === ‘boolean’) options = { capture: options, passive: true };
else if (!options) options = { passive: true };
else if (options.passive === undefined) options = { …options, passive: true };
}
return orig.call(this, type, fn, options);
};
})();

// ============================================================
// [5] IMAGE LAZY LOADER (cho avatar & icon)
// ============================================================
(function LazyImages() {
if (!(‘IntersectionObserver’ in window)) return;
const obs = new IntersectionObserver(entries => {
entries.forEach(e => {
if (!e.isIntersecting) return;
const img = e.target;
if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute(‘data-src’); }
obs.unobserve(img);
});
}, { rootMargin: ‘150px’ });
document.querySelectorAll(‘img[data-src]’).forEach(img => obs.observe(img));
})();

// ============================================================
// [6] CSS CONTAINMENT INJECTOR
// Thêm contain: layout style paint cho cards — giảm repaint
// ============================================================
(function ContainmentInjector() {
const style = document.createElement(‘style’);
style.textContent = `.stat-card, .rt-card, .feat-item, .vip-feat-card, .aimlock-btn, .sens-preset-btn, .admin-contact-card { contain: layout style paint; } .page { contain: strict; } .bottom-nav { contain: layout style; }`;
document.head.appendChild(style);
})();

// ============================================================
// [7] ANIMATION PAUSE ON HIDDEN TAB
// Dừng toàn bộ CSS animation khi tab bị ẩn
// ============================================================
(function AnimPauseOnHidden() {
const style = document.createElement(‘style’);
style.id = ‘**tab_hidden_anim**’;
document.addEventListener(‘visibilitychange’, () => {
if (document.visibilityState === ‘hidden’) {
style.textContent = ‘*, *::before, *::after { animation-play-state: paused !important; }’;
document.head.appendChild(style);
} else {
style.textContent = ‘’;
}
});
})();

// ============================================================
// [8] TOGGLE DEBOUNCE GUARD
// Ngăn user spam toggle quá nhanh gây race condition
// ============================================================
(function ToggleDebounce() {
let lastToggle = 0;
document.addEventListener(‘change’, e => {
if (e.target.type !== ‘checkbox’) return;
const now = Date.now();
if (now - lastToggle < 80) {
e.preventDefault();
e.stopImmediatePropagation();
return;
}
lastToggle = now;
}, true);
})();

// ============================================================
// [9] SLIDER PERFORMANCE BOOST
// Throttle slider oninput ở 60fps thay vì every-pixel
// ============================================================
(function SliderThrottle() {
let lastSlider = 0;
const LIMIT = 16; // ~60fps
document.addEventListener(‘input’, e => {
if (e.target.type !== ‘range’) return;
const now = performance.now();
if (now - lastSlider < LIMIT) {
e.stopImmediatePropagation();
// Schedule deferred update
requestAnimationFrame(() => e.target.dispatchEvent(new Event(‘input’, { bubbles: true })));
}
lastSlider = now;
}, true);
})();

// ============================================================
// [10] FONT DISPLAY SWAP INJECTOR
// Thêm font-display:swap vào Google Font requests
// ============================================================
(function FontDisplaySwap() {
document.querySelectorAll(‘link[href*=“fonts.googleapis.com”]’).forEach(link => {
if (!link.href.includes(‘display=swap’)) {
link.href += (link.href.includes(’?’) ? ‘&’ : ‘?’) + ‘display=swap’;
}
});
})();

// ============================================================
// [11] MODAL FOCUS TRAP + ESC CLOSE
// Key modal: giữ focus bên trong, ESC để đóng nếu đã VIP
// ============================================================
(function ModalFocusTrap() {
const modal = document.getElementById(‘key-modal’);
if (!modal) return;
const focusable = ‘button:not(:disabled), input, [tabindex]:not([tabindex=”-1”])’;

document.addEventListener(‘keydown’, e => {
if (modal.style.display !== ‘flex’) return;
if (e.key === ‘Escape’) { hideKeyModal?.(); return; }
if (e.key !== ‘Tab’) return;
const els = […modal.querySelectorAll(focusable)];
if (!els.length) return;
const first = els[0], last = els[els.length - 1];
if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
});
})();

// ============================================================
// [12] SCROLL TO TOP ON PAGE SWITCH
// Khi chuyển page, scroll về đầu ngay lập tức
// ============================================================
(function ScrollTopOnSwitch() {
const orig = window.switchPage;
if (typeof orig !== ‘function’) return;
window.switchPage = function(id) {
orig(id);
requestAnimationFrame(() => {
const page = document.getElementById(‘page-’ + id);
const scroll = page?.querySelector(’.page-scroll’);
if (scroll) scroll.scrollTop = 0;
});
};
})();

// ============================================================
// [13] NETWORK-AWARE IMAGE QUALITY
// Giảm chất lượng ảnh khi mạng yếu
// ============================================================
(function NetworkAwareImages() {
const conn = navigator.connection || navigator.mozConnection;
if (!conn) return;
if ([‘slow-2g’,‘2g’].includes(conn.effectiveType) || conn.saveData) {
const style = document.createElement(‘style’);
style.textContent = ‘img { image-rendering: pixelated; filter: contrast(0.95); }’;
document.head.appendChild(style);
console.log(’[SperNew] Mạng yếu — chất lượng ảnh giảm để tiết kiệm băng thông’);
}
})();

// ============================================================
// [14] REALTIME CLOCK OPTIMIZER
// Gộp mọi interval đếm thời gian vào 1 RAF loop duy nhất
// ============================================================
const ClockOptimizer = {
_cbs: new Map(),
_running: false,
_last: {},

register(id, fn, intervalMs) {
this._cbs.set(id, { fn, intervalMs, last: 0 });
if (!this._running) this._start();
},

unregister(id) { this._cbs.delete(id); },

_start() {
this._running = true;
const loop = (now) => {
this._cbs.forEach((entry, id) => {
if (now - entry.last >= entry.intervalMs) {
entry.fn();
entry.last = now;
}
});
if (this._cbs.size) requestAnimationFrame(loop);
else this._running = false;
};
requestAnimationFrame(loop);
}
};

// Ví dụ: đăng ký stats update vào ClockOptimizer
// ClockOptimizer.register(‘stats’, updateStats, 1200);

// ============================================================
// [15] TOAST QUEUE MANAGER
// Ngăn toast chồng lên nhau khi gọi liên tục
// ============================================================
(function ToastQueueManager() {
const orig = window.showToast;
if (typeof orig !== ‘function’) return;
const queue = [];
let busy = false;

window.showToast = function(msg) {
queue.push(msg);
if (!busy) flush();
};

function flush() {
if (!queue.length) { busy = false; return; }
busy = true;
orig(queue.shift());
setTimeout(flush, 2400);
}
})();

// ============================================================
// [16] BUTTON DOUBLE-CLICK GUARD
// Ngăn double-click vô tình kích hoạt boost 2 lần
// ============================================================
(function DoubleClickGuard() {
const LIMIT_MS = 600;
const lastClick = new WeakMap();
document.addEventListener(‘click’, e => {
const btn = e.target.closest(‘button’);
if (!btn) return;
const now = Date.now();
const last = lastClick.get(btn) || 0;
if (now - last < LIMIT_MS) {
e.stopImmediatePropagation();
e.preventDefault();
return;
}
lastClick.set(btn, now);
}, true);
})();

// ============================================================
// [17] CANVAS PIXEL RATIO OPTIMIZER
// Tự fix canvas blur trên màn hình retina
// ============================================================
function fixCanvasDPR(canvas) {
const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap ở 2x
const rect = canvas.getBoundingClientRect();
canvas.width  = Math.floor(rect.width  * dpr);
canvas.height = Math.floor(rect.height * dpr);
canvas.style.width  = rect.width  + ‘px’;
canvas.style.height = rect.height + ‘px’;
const ctx = canvas.getContext(‘2d’);
ctx.scale(dpr, dpr);
return ctx;
}

// ============================================================
// [18] MEMORY LEAK DETECTOR (Dev mode)
// Phát hiện event listener bị quên không remove
// ============================================================
const LeakDetector = {
_counts: new Map(),
warn_threshold: 20,

patch() {
const orig = EventTarget.prototype.addEventListener;
const self = this;
EventTarget.prototype.addEventListener = function(type) {
const key = type;
self._counts.set(key, (self._counts.get(key) || 0) + 1);
if (self._counts.get(key) > self.warn_threshold) {
console.warn(`[SperNew LeakDetector] ⚠️ Có ${self._counts.get(key)} listeners cho sự kiện "${type}" — kiểm tra memory leak`);
}
return orig.apply(this, arguments);
};
},

report() {
const sorted = […this._counts.entries()].sort((a, b) => b[1] - a[1]);
console.table(Object.fromEntries(sorted.slice(0, 10)));
}
};
// LeakDetector.patch(); // Uncomment khi debug

// ============================================================
// [19] GPU LAYER MANAGER
// Tự động bật/tắt GPU layer cho animated elements
// ============================================================
(function GPULayerManager() {
// Bật GPU layer cho elements quan trọng
const promote = [
‘#splash-screen’,
‘.boost-overlay’,
‘#key-modal’,
‘.bottom-nav’,
‘#virtual-crosshair’,
‘.score-ring’,
];
promote.forEach(sel => {
document.querySelectorAll(sel).forEach(el => {
el.style.willChange = ‘transform, opacity’;
el.style.transform = ‘translateZ(0)’;
});
});

// Tắt GPU layer sau khi splash xong (giải phóng VRAM)
window.addEventListener(‘load’, () => {
setTimeout(() => {
const splash = document.getElementById(‘splash-screen’);
if (splash) {
splash.style.willChange = ‘auto’;
splash.style.transform = ‘’;
}
}, 3000);
});
})();

// ============================================================
// [20] STORAGE AUTO-COMPRESS
// Tự xóa localStorage key cũ khi sắp đầy
// ============================================================
const StorageGuard = {
MAX_USAGE: 0.8, // 80% quota

async check() {
if (!navigator.storage?.estimate) return;
const { usage, quota } = await navigator.storage.estimate();
if (usage / quota > this.MAX_USAGE) {
this.cleanup();
}
},

cleanup() {
const keys = Object.keys(localStorage).filter(k =>
![‘vip_key’,‘vip_expires’,‘device_id’].includes(k)
);
keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
console.log(’[SperNew] 🧹 Storage cleaned —’, keys.length, ‘keys removed’);
}
};
StorageGuard.check();

// ============================================================
// [21] IDLE TASK SCHEDULER
// Chạy task nặng khi browser rảnh (không block UI)
// ============================================================
const IdleScheduler = {
_queue: [],

add(task, label = ‘task’) {
this._queue.push({ task, label });
this._run();
},

_run() {
if (‘requestIdleCallback’ in window) {
requestIdleCallback(deadline => {
while (deadline.timeRemaining() > 5 && this._queue.length) {
const { task, label } = this._queue.shift();
try { task(); } catch(e) { console.warn(’[IdleScheduler]’, label, e); }
}
if (this._queue.length) this._run();
}, { timeout: 3000 });
} else {
setTimeout(() => {
const item = this._queue.shift();
if (item) { try { item.task(); } catch(e) {} }
if (this._queue.length) this._run();
}, 100);
}
}
};

// ============================================================
// [22] PERFORMANCE MARK SYSTEM (tích hợp vào app)
// ============================================================
const PerfMark = {
marks: {},
start(label) { this.marks[label] = performance.now(); },
end(label) {
const d = performance.now() - (this.marks[label] || 0);
delete this.marks[label];
if (d > 16) console.warn(`[PerfMark] ⚠️ "${label}" took ${d.toFixed(1)}ms — cần tối ưu`);
return d;
}
};

// Hook vào boost để đo thời gian
(function PatchBoost() {
const orig = window.runBoost;
if (typeof orig !== ‘function’) return;
window.runBoost = function() {
PerfMark.start(‘boost’);
orig();
setTimeout(() => PerfMark.end(‘boost’), 3000);
};
})();

// ============================================================
// [23] OVERSCROLL LOCK (Android scroll chained)
// Ngăn overscroll parent khi đang scroll trong card
// ============================================================
(function OverscrollLock() {
document.querySelectorAll(’.page-scroll, .sens-sliders, .aimlock-detail’).forEach(el => {
el.style.overscrollBehavior = ‘contain’;
});
// Dùng MutationObserver để áp dụng cho elements thêm sau
new MutationObserver(mutations => {
mutations.forEach(m => m.addedNodes.forEach(n => {
if (n.nodeType !== 1) return;
if (n.matches?.(’.page-scroll, .sens-sliders’)) n.style.overscrollBehavior = ‘contain’;
n.querySelectorAll?.(’.page-scroll, .sens-sliders’).forEach(el => {
el.style.overscrollBehavior = ‘contain’;
});
}));
}).observe(document.body, { childList: true, subtree: true });
})();

// ============================================================
// [24] CRITICAL CSS PRELOADER
// Inline critical CSS trước khi font load xong
// ============================================================
(function CriticalCSS() {
const style = document.createElement(‘style’);
style.textContent = `/* Critical path — render ngay không cần font */ body { visibility: visible !important; } .topbar, .bottom-nav { display: flex !important; } #splash-screen { display: flex !important; }`;
style.setAttribute(‘data-critical’, ‘1’);
document.head.prepend(style);
// Xóa sau khi font load xong
document.fonts?.ready.then(() => {
document.querySelector(’[data-critical]’)?.remove();
});
})();

// ============================================================
// [25] POINTER EVENT OPTIMIZER
// Tắt pointer-events trên decorative elements
// ============================================================
(function PointerEventOptimizer() {
const style = document.createElement(‘style’);
style.textContent = `.splash-bg, .splash-grid, .splash-particles, .vip-hero-bg, .admin-hero-bg, .admin-scan-line, .hero-section::before, .hero-section::after, .stat-card::before, .stat-card::after, body::after { pointer-events: none !important; }`;
document.head.appendChild(style);
})();

// ============================================================
// [26] SVG ICON CACHER
// Cache SVG string để không parse lại DOM mỗi lần render
// ============================================================
const SVGCache = {
_cache: new Map(),
get(key, svgString) {
if (!this._cache.has(key)) {
const tmpl = document.createElement(‘template’);
tmpl.innerHTML = svgString.trim();
this._cache.set(key, tmpl.content.firstChild.cloneNode(true));
}
return this._cache.get(key).cloneNode(true);
}
};

// ============================================================
// [27] TOUCH PRESSURE DETECT
// Detect 3D Touch / Force Touch để trigger boost nhanh hơn
// ============================================================
(function TouchPressure() {
const boostBtn = document.getElementById(‘boost-btn’);
if (!boostBtn) return;
boostBtn.addEventListener(‘touchstart’, e => {
const touch = e.touches[0];
if (touch.force && touch.force > 0.8) {
showToast(‘⚡ Force Touch — Instant Boost!’);
runBoost?.();
}
}, { passive: true });
})();

// ============================================================
// [28] FPS ADAPTIVE INTERVAL
// Tự điều chỉnh interval của stat update theo FPS thực tế
// ============================================================
(function FPSAdaptiveInterval() {
let measureCount = 0;
let lastFrameTime = performance.now();
let sumDelta = 0;

function measure(now) {
sumDelta += now - lastFrameTime;
lastFrameTime = now;
measureCount++;

```
if (measureCount >= 30) {
  const avgFPS = 1000 / (sumDelta / measureCount);
  measureCount = 0;
  sumDelta = 0;

  // Giảm update rate nếu FPS thấp
  if (avgFPS < 30 && window.statsInterval) {
    clearInterval(window.statsInterval);
    window.statsInterval = setInterval(updateStats, 2000); // Chậm hơn
    console.log('[SperNew] FPS thấp — giảm stat update rate xuống 2s');
  } else if (avgFPS >= 50 && window.statsInterval) {
    clearInterval(window.statsInterval);
    window.statsInterval = setInterval(updateStats, 1200); // Normal
  }
}
requestAnimationFrame(measure);
```

}
requestAnimationFrame(measure);
})();

// ============================================================
// [29] DARK MODE SYSTEM SYNC
// Tự động sync với dark mode hệ thống
// ============================================================
(function DarkModeSync() {
const mediaQuery = window.matchMedia(’(prefers-color-scheme: dark)’);
function apply(isDark) {
const toggle = document.getElementById(‘s-dark’);
if (toggle) toggle.checked = isDark;
// App luôn dark, nhưng điều chỉnh độ tương phản
document.documentElement.style.filter = isDark ? ‘none’ : ‘brightness(1.05)’;
}
apply(mediaQuery.matches);
mediaQuery.addEventListener(‘change’, e => apply(e.matches));
})();

// ============================================================
// [30] REDUCE MOTION SUPPORT
// Respect prefers-reduced-motion của hệ thống
// ============================================================
(function ReducedMotionSupport() {
if (!window.matchMedia(’(prefers-reduced-motion: reduce)’).matches) return;
const style = document.createElement(‘style’);
style.textContent = `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`;
document.head.appendChild(style);
console.log(’[SperNew] Reduced motion detected — animations disabled’);
})();

// ============================================================
// [31] SUPABASE REQUEST CACHE
// Cache Supabase fetch 30s để không verify key mỗi giây
// ============================================================
const SupabaseCache = {
_store: new Map(),
TTL: 30000, // 30 giây

set(url, data) { this._store.set(url, { data, ts: Date.now() }); },
get(url) {
const item = this._store.get(url);
if (!item) return null;
if (Date.now() - item.ts > this.TTL) { this._store.delete(url); return null; }
return item.data;
},

async fetch(url, options) {
const cached = this.get(url);
if (cached) return cached;
const res = await fetch(url, options);
const data = await res.json();
this.set(url, data);
return data;
}
};

// ============================================================
// [32] BATTERY-AWARE GRAPH UPDATE
// Giảm đồ thị realtime khi pin yếu
// ============================================================
(async function BatteryGraphManager() {
if (!navigator.getBattery) return;
const bat = await navigator.getBattery();
function check() {
const isLow = bat.level < 0.2 && !bat.charging;
const graphs = document.querySelectorAll(’.rt-graph’);
graphs.forEach(g => {
g.style.display = isLow ? ‘none’ : ‘’; // Ẩn graph bars khi pin yếu
});
if (isLow) console.log(’[SperNew] 🔋 Pin yếu — tắt đồ thị realtime’);
}
bat.addEventListener(‘levelchange’, check);
bat.addEventListener(‘chargingchange’, check);
check();
})();

// ============================================================
// [33] NETWORK STATUS INDICATOR
// Hiện trạng thái online/offline ngay trên status bar
// ============================================================
(function NetworkStatusIndicator() {
function updateStatus() {
const dot  = document.getElementById(‘status-dot’);
const text = document.getElementById(‘status-text’);
if (!dot || !text) return;

```
if (!navigator.onLine) {
  dot.style.background = '#ff4d6a';
  dot.style.boxShadow  = '0 0 8px #ff4d6a';
  text.textContent = 'OFFLINE';
  text.style.color = '#ff4d6a';
  showToast('⚠️ Mất kết nối mạng');
} else {
  const conn = navigator.connection;
  const type = conn?.effectiveType || '4g';
  if (['slow-2g','2g'].includes(type)) {
    dot.style.background = '#ffe94d';
    dot.style.boxShadow  = '0 0 8px #ffe94d';
    text.textContent = 'WEAK';
    text.style.color = '#ffe94d';
  } else {
    dot.style.background = '#00ff88';
    dot.style.boxShadow  = '0 0 8px #00ff88';
    text.textContent = 'ACTIVE';
    text.style.color = '#00ff88';
  }
}
```

}

window.addEventListener(‘online’,  updateStatus);
window.addEventListener(‘offline’, updateStatus);
navigator.connection?.addEventListener(‘change’, updateStatus);
updateStatus();
})();

// ============================================================
// [34] DEVICE RAM DISPLAY
// Hiện RAM thiết bị thực ở stats card
// ============================================================
(function DeviceRAMDisplay() {
const ramEl = document.getElementById(‘status-ram’);
if (!ramEl || !navigator.deviceMemory) return;
const ram = navigator.deviceMemory; // GB
const lowRAM = ram <= 3;
if (lowRAM) {
ramEl.textContent = `RAM ${ram}GB — Thấp`;
ramEl.style.color = ‘#ff4d6a’;
}
})();

// ============================================================
// [35] KEYBOARD SHORTCUT MANAGER
// Phím tắt nhanh cho desktop/controller
// ============================================================
(function KeyboardShortcuts() {
const map = {
‘h’: () => switchPage?.(‘home’),
‘f’: () => switchPage?.(‘features’),
‘s’: () => switchPage?.(‘stats’),
‘a’: () => switchPage?.(‘aimlab’),
‘b’: () => runBoost?.(),
‘k’: () => showKeyModal?.(),
};
document.addEventListener(‘keydown’, e => {
if ([‘INPUT’,‘TEXTAREA’].includes(document.activeElement.tagName)) return;
const fn = map[e.key.toLowerCase()];
if (fn) { fn(); e.preventDefault(); }
});
})();

// ============================================================
// [36] TOUCH VELOCITY TRACKER
// Đo tốc độ vuốt để phân biệt flick vs slow scroll
// ============================================================
const TouchVelocity = {
_start: { x:0, y:0, t:0 },
_vel: { x:0, y:0 },

init(el) {
el.addEventListener(‘touchstart’, e => {
const t = e.touches[0];
this._start = { x: t.clientX, y: t.clientY, t: Date.now() };
}, { passive: true });

```
el.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dt = Date.now() - this._start.t;
  if (dt === 0) return;
  this._vel = {
    x: (t.clientX - this._start.x) / dt,
    y: (t.clientY - this._start.y) / dt,
  };
}, { passive: true });
```

},

get() { return this._vel; },
isFlick() { return Math.abs(this._vel.y) > 0.5; }
};

// ============================================================
// [37] CSS VARIABLE UPDATER (Tối ưu batch)
// Batch update CSS variables thay vì ghi từng cái
// ============================================================
const CSSVarBatcher = {
_pending: {},
_scheduled: false,

set(varName, value) {
this._pending[varName] = value;
if (!this._scheduled) {
this._scheduled = true;
requestAnimationFrame(() => {
const root = document.documentElement;
Object.entries(this._pending).forEach(([k, v]) => root.style.setProperty(k, v));
this._pending = {};
this._scheduled = false;
});
}
}
};
// Dùng: CSSVarBatcher.set(’–cyan’, ‘#00ffaa’);

// ============================================================
// [38] INTERSECTION OBSERVER POOL
// Tái sử dụng 1 IntersectionObserver cho nhiều elements
// ============================================================
const IOPool = {
_io: null,
_callbacks: new WeakMap(),

observe(el, fn, options = {}) {
if (!this._io) {
this._io = new IntersectionObserver(entries => {
entries.forEach(e => {
const cb = this._callbacks.get(e.target);
if (cb) cb(e);
});
}, options);
}
this._callbacks.set(el, fn);
this._io.observe(el);
},

unobserve(el) {
this._io?.unobserve(el);
this._callbacks.delete(el);
}
};

// Áp dụng cho stat cards — chỉ animate khi nhìn thấy
document.querySelectorAll(’.stat-card, .rt-card’).forEach(card => {
IOPool.observe(card, entry => {
if (entry.isIntersecting) {
card.style.opacity = ‘1’;
card.style.transform = ‘translateY(0)’;
}
});
});

// ============================================================
// [39] APP STATE SNAPSHOT
// Lưu state quan trọng vào sessionStorage — khôi phục khi reload
// ============================================================
const AppSnapshot = {
KEYS: [‘vch-toggle’,‘assist-toggle’,‘hold-toggle’,‘gyro-toggle’,‘headlock-toggle’],

save() {
const state = {};
this.KEYS.forEach(id => {
const el = document.getElementById(id);
if (el) state[id] = el.checked;
});
// Save slider values
document.querySelectorAll(’.sens-slider’).forEach(sl => {
if (sl.id) state[‘slider_’ + sl.id] = sl.value;
});
sessionStorage.setItem(‘spernew_state’, JSON.stringify(state));
},

restore() {
try {
const state = JSON.parse(sessionStorage.getItem(‘spernew_state’) || ‘{}’);
this.KEYS.forEach(id => {
const el = document.getElementById(id);
if (el && state[id] !== undefined) {
el.checked = state[id];
el.dispatchEvent(new Event(‘change’));
}
});
Object.entries(state).forEach(([k, v]) => {
if (k.startsWith(‘slider_’)) {
const el = document.getElementById(k.replace(‘slider_’, ‘’));
if (el) { el.value = v; el.dispatchEvent(new Event(‘input’)); }
}
});
} catch(e) {}
}
};

// Auto save khi thay đổi
document.addEventListener(‘change’, () => {
clearTimeout(AppSnapshot._saveTimer);
AppSnapshot._saveTimer = setTimeout(() => AppSnapshot.save(), 500);
});

// Restore sau khi app init
(function() {
const origInit = window.initApp;
window.initApp = function() {
origInit?.();
setTimeout(() => AppSnapshot.restore(), 800);
};
})();

// ============================================================
// [40] GLOBAL ERROR BOUNDARY
// Bắt mọi JS error — ngăn app crash, hiện toast thay vì die
// ============================================================
(function GlobalErrorBoundary() {
window.addEventListener(‘error’, e => {
console.error(’[SperNew Error]’, e.message, e.filename, e.lineno);
// Không hiện toast mọi error — chỉ critical
if (e.message?.includes(‘fetch’) || e.message?.includes(‘network’)) {
showToast?.(‘⚠️ Lỗi kết nối, thử lại sau’);
}
return true; // Prevent default error dialog
});

window.addEventListener(‘unhandledrejection’, e => {
console.error(’[SperNew Promise Error]’, e.reason);
if (String(e.reason)?.includes(‘fetch’) || String(e.reason)?.includes(‘Failed to fetch’)) {
showToast?.(‘⚠️ Mất kết nối Supabase’);
}
e.preventDefault();
});
})();

// ============================================================
// AUTO INIT — Chạy các tối ưu sau khi app sẵn sàng
// ============================================================
window.addEventListener(‘load’, () => {
// Idle tasks — không ảnh hưởng load time
IdleScheduler.add(() => StorageGuard.check(), ‘storage-check’);
IdleScheduler.add(() => {
document.querySelectorAll(’.page-scroll’).forEach(el => {
TouchVelocity.init(el);
});
}, ‘touch-velocity-init’);

console.log(’%c⚡ SperNew Extra Scripts — 40 modules loaded’,
‘color:#00ff88;font-family:monospace;font-weight:bold;font-size:13px’);
});
/**

- ⚡ PERFORMANCE OPTIMIZER SCRIPTS
- Tối ưu CPU, Memory, Rendering cho HTML App
- Thêm vào <script> cuối </body> hoặc import vào app
  */

// ============================================================
// 1. CPU THROTTLE — Giới hạn tác vụ nặng không chiếm hết CPU
// ============================================================
const CPUThrottle = {
/**

- Chạy task theo chunk, nhường CPU giữa các batch
- @param {Array} items - Danh sách cần xử lý
- @param {Function} processItem - Hàm xử lý từng item
- @param {number} chunkSize - Số item mỗi batch (mặc định 50)
  */
  processInChunks(items, processItem, chunkSize = 50) {
  let index = 0;
  function runChunk() {
  const end = Math.min(index + chunkSize, items.length);
  for (; index < end; index++) processItem(items[index], index);
  if (index < items.length) {
  // Nhường thread cho browser, tránh block UI
  setTimeout(runChunk, 0);
  }
  }
  runChunk();
  },

/**

- Dùng requestIdleCallback để chạy task khi CPU rảnh
- @param {Function} task
  */
  runWhenIdle(task) {
  if (‘requestIdleCallback’ in window) {
  requestIdleCallback(task, { timeout: 2000 });
  } else {
  setTimeout(task, 1);
  }
  },

/**

- Throttle function — giới hạn số lần gọi theo thời gian
- Dùng cho scroll, resize, mousemove
- @param {Function} fn
- @param {number} limit - ms
  */
  throttle(fn, limit = 100) {
  let lastCall = 0;
  return function (…args) {
  const now = Date.now();
  if (now - lastCall >= limit) {
  lastCall = now;
  return fn.apply(this, args);
  }
  };
  },

/**

- Debounce — chỉ chạy sau khi ngừng gọi
- Dùng cho input search, resize cuối cùng
- @param {Function} fn
- @param {number} delay - ms
  */
  debounce(fn, delay = 300) {
  let timer;
  return function (…args) {
  clearTimeout(timer);
  timer = setTimeout(() => fn.apply(this, args), delay);
  };
  },

/**

- Web Worker wrapper — đẩy tác vụ nặng ra khỏi main thread
- @param {Function} workerFn - Hàm thuần (không dùng closure)
- @param {*} data - Dữ liệu truyền vào
- @returns {Promise}
  */
  runInWorker(workerFn, data) {
  return new Promise((resolve, reject) => {
  const blob = new Blob(
  [`self.onmessage = function(e) { self.postMessage((${workerFn.toString()})(e.data)); }`],
  { type: ‘application/javascript’ }
  );
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  worker.onmessage = (e) => { resolve(e.data); worker.terminate(); URL.revokeObjectURL(url); };
  worker.onerror = (e) => { reject(e); worker.terminate(); URL.revokeObjectURL(url); };
  worker.postMessage(data);
  });
  }
  };

// ============================================================
// 2. MEMORY MANAGER — Tránh memory leak
// ============================================================
const MemoryManager = {
_listeners: new Map(),
_timers: new Set(),
_observers: new Set(),

/**

- Thêm event listener có quản lý — tự dọn khi cleanup()
  */
  addListener(el, event, fn, options) {
  el.addEventListener(event, fn, options);
  if (!this._listeners.has(el)) this._listeners.set(el, []);
  this._listeners.get(el).push({ event, fn, options });
  },

/**

- Tạo interval/timeout có quản lý
  */
  setInterval(fn, ms) {
  const id = setInterval(fn, ms);
  this._timers.add({ type: ‘interval’, id });
  return id;
  },
  setTimeout(fn, ms) {
  const id = setTimeout(() => { fn(); this._timers.delete(id); }, ms);
  this._timers.add({ type: ‘timeout’, id });
  return id;
  },

/**

- Đăng ký Observer để cleanup sau
  */
  observe(observer) {
  this._observers.add(observer);
  return observer;
  },

/**

- Dọn sạch toàn bộ — gọi khi component/page unmount
  */
  cleanup() {
  // Remove all listeners
  this._listeners.forEach((events, el) => {
  events.forEach(({ event, fn, options }) => el.removeEventListener(event, fn, options));
  });
  this._listeners.clear();

```
// Clear all timers
this._timers.forEach(({ type, id }) => {
  type === 'interval' ? clearInterval(id) : clearTimeout(id);
});
this._timers.clear();

// Disconnect all observers
this._observers.forEach(obs => obs.disconnect?.());
this._observers.clear();

console.log('🧹 Memory cleaned up');
```

},

/**

- Theo dõi memory usage (Chrome only)
  */
  monitor() {
  if (!performance.memory) return console.warn(‘⚠️ Chỉ hỗ trợ Chrome’);
  const mb = (b) => (b / 1048576).toFixed(1) + ’ MB’;
  const m = performance.memory;
  console.table({
  ‘Used Heap’:  mb(m.usedJSHeapSize),
  ‘Total Heap’: mb(m.totalJSHeapSize),
  ‘Heap Limit’: mb(m.jsHeapSizeLimit),
  ‘Usage %’:    ((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100).toFixed(1) + ‘%’
  });
  }
  };

// ============================================================
// 3. RENDER OPTIMIZER — Tối ưu DOM & Paint
// ============================================================
const RenderOptimizer = {
/**

- Batch DOM writes — gom tất cả thay đổi DOM vào 1 frame
- Tránh layout thrashing (đọc rồi viết xen kẽ)
- @param {Function} writeFn - Các thao tác DOM
  */
  batchWrite(writeFn) {
  requestAnimationFrame(writeFn);
  },

/**

- Read DOM trước, write sau — tránh forced reflow
- @param {Function} readFn - Đọc kích thước/vị trí
- @param {Function} writeFn - Cập nhật DOM
  */
  readThenWrite(readFn, writeFn) {
  const data = readFn();
  requestAnimationFrame(() => writeFn(data));
  },

/**

- Lazy render với IntersectionObserver
- Chỉ render element khi visible trong viewport
- @param {string} selector - CSS selector
- @param {Function} renderFn - fn(element) khi hiện
  */
  lazyRender(selector, renderFn) {
  const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
  if (entry.isIntersecting) {
  renderFn(entry.target);
  obs.unobserve(entry.target);
  }
  });
  }, { rootMargin: ‘100px’ });

```
document.querySelectorAll(selector).forEach(el => obs.observe(el));
MemoryManager.observe(obs);
return obs;
```

},

/**

- Virtual scroll đơn giản — chỉ render items đang nhìn thấy
- @param {HTMLElement} container
- @param {Array} items
- @param {Function} renderItem - fn(item) => HTMLElement
- @param {number} itemHeight - chiều cao mỗi item (px)
  */
  virtualScroll(container, items, renderItem, itemHeight = 40) {
  const visible = Math.ceil(container.clientHeight / itemHeight) + 2;
  const wrapper = document.createElement(‘div’);
  wrapper.style.height = items.length * itemHeight + ‘px’;
  wrapper.style.position = ‘relative’;
  container.appendChild(wrapper);

```
let lastStart = -1;
function update() {
  const start = Math.max(0, Math.floor(container.scrollTop / itemHeight) - 1);
  if (start === lastStart) return;
  lastStart = start;
  wrapper.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let i = start; i < Math.min(start + visible, items.length); i++) {
    const el = renderItem(items[i], i);
    el.style.position = 'absolute';
    el.style.top = i * itemHeight + 'px';
    el.style.width = '100%';
    fragment.appendChild(el);
  }
  wrapper.appendChild(fragment);
}

container.addEventListener('scroll', CPUThrottle.throttle(update, 16));
update();
```

},

/**

- GPU acceleration — bật layer riêng cho element animation
- @param {HTMLElement} el
  */
  promoteToGPU(el) {
  el.style.willChange = ‘transform’;
  el.style.transform = ‘translateZ(0)’;
  },

/**

- Tắt GPU layer khi không cần nữa (giải phóng VRAM)
- @param {HTMLElement} el
  */
  demoteFromGPU(el) {
  el.style.willChange = ‘auto’;
  el.style.transform = ‘’;
  }
  };

// ============================================================
// 4. ASSET OPTIMIZER — Tối ưu tải tài nguyên
// ============================================================
const AssetOptimizer = {
/**

- Lazy load ảnh khi vào viewport
- @param {string} selector - Mặc định ‘img[data-src]’
  */
  lazyLoadImages(selector = ‘img[data-src]’) {
  if (!(‘IntersectionObserver’ in window)) {
  // Fallback: load all
  document.querySelectorAll(selector).forEach(img => {
  img.src = img.dataset.src;
  });
  return;
  }
  const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
  if (entry.isIntersecting) {
  const img = entry.target;
  img.src = img.dataset.src;
  if (img.dataset.srcset) img.srcset = img.dataset.srcset;
  img.removeAttribute(‘data-src’);
  obs.unobserve(img);
  }
  });
  }, { rootMargin: ‘200px’ });

```
document.querySelectorAll(selector).forEach(img => obs.observe(img));
MemoryManager.observe(obs);
```

},

/**

- Preload tài nguyên quan trọng
- @param {Array<{href, as}>} resources
  */
  preload(resources) {
  resources.forEach(({ href, as }) => {
  const link = document.createElement(‘link’);
  link.rel = ‘preload’;
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
  });
  },

/**

- Cache dữ liệu fetch trong sessionStorage
- @param {string} url
- @param {number} ttl - ms (mặc định 5 phút)
  */
  async cachedFetch(url, ttl = 300000) {
  const key = ‘cache_’ + url;
  const cached = sessionStorage.getItem(key);
  if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < ttl) return data;
  }
  const res = await fetch(url);
  const data = await res.json();
  try {
  sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) { /* quota exceeded */ }
  return data;
  }
  };

// ============================================================
// 5. PERFORMANCE MONITOR — Đo lường real-time
// ============================================================
const PerfMonitor = {
_marks: {},

/** Bắt đầu đo */
start(label) {
this._marks[label] = performance.now();
},

/** Kết thúc đo và log */
end(label) {
const duration = performance.now() - (this._marks[label] || 0);
console.log(`⏱ [${label}]: ${duration.toFixed(2)}ms`);
delete this._marks[label];
return duration;
},

/** Đo FPS thực tế */
measureFPS(duration = 2000) {
let frames = 0;
let start = performance.now();
function count() {
frames++;
if (performance.now() - start < duration) requestAnimationFrame(count);
else console.log(`🎮 FPS: ${(frames / (duration / 1000)).toFixed(1)}`);
}
requestAnimationFrame(count);
},

/** Báo cáo Web Vitals */
reportVitals() {
// LCP
new PerformanceObserver((list) => {
const entries = list.getEntries();
const lcp = entries[entries.length - 1];
console.log(`📊 LCP: ${lcp.startTime.toFixed(0)}ms`, lcp.startTime < 2500 ? ‘✅’ : ‘⚠️’);
}).observe({ entryTypes: [‘largest-contentful-paint’] });

```
// CLS
let clsScore = 0;
new PerformanceObserver((list) => {
  list.getEntries().forEach(e => { if (!e.hadRecentInput) clsScore += e.value; });
  console.log(`📊 CLS: ${clsScore.toFixed(4)}`, clsScore < 0.1 ? '✅' : '⚠️');
}).observe({ entryTypes: ['layout-shift'] });

// FID / INP
new PerformanceObserver((list) => {
  list.getEntries().forEach(e => {
    console.log(`📊 INP: ${e.duration.toFixed(0)}ms`, e.duration < 200 ? '✅' : '⚠️');
  });
}).observe({ entryTypes: ['event'] });
```

},

/** Log toàn bộ resource timing */
reportResources() {
const entries = performance.getEntriesByType(‘resource’);
const sorted = entries.sort((a, b) => b.duration - a.duration).slice(0, 10);
console.table(sorted.map(e => ({
name: e.name.split(’/’).pop(),
duration: e.duration.toFixed(0) + ‘ms’,
size: e.transferSize ? (e.transferSize / 1024).toFixed(1) + ’ KB’ : ‘cached’,
type: e.initiatorType
})));
}
};

// ============================================================
// 6. AUTO OPTIMIZER — Tự động áp dụng khi page load
// ============================================================
(function AutoOptimizer() {
// Lazy load ảnh
AssetOptimizer.lazyLoadImages();

// Tối ưu scroll/resize listener
const originalAddEvent = EventTarget.prototype.addEventListener;
const heavyEvents = [‘scroll’, ‘resize’, ‘mousemove’, ‘touchmove’];
EventTarget.prototype.addEventListener = function(type, fn, options) {
if (heavyEvents.includes(type) && typeof fn === ‘function’) {
// Tự động passive để không block scroll
if (typeof options !== ‘object’) options = {};
if (options.passive === undefined) options.passive = true;
}
return originalAddEvent.call(this, type, fn, options);
};

// Báo cáo vitals khi load xong
window.addEventListener(‘load’, () => {
CPUThrottle.runWhenIdle(() => PerfMonitor.reportVitals());
CPUThrottle.runWhenIdle(() => PerfMonitor.reportResources());
CPUThrottle.runWhenIdle(() => MemoryManager.monitor());
});

console.log(‘⚡ Performance Optimizer loaded’);
})();

// ============================================================
// EXPORT — dùng được ở module hoặc browser global
// ============================================================
if (typeof module !== ‘undefined’) {
module.exports = { CPUThrottle, MemoryManager, RenderOptimizer, AssetOptimizer, PerfMonitor };
} else {
window.Optimizer = { CPUThrottle, MemoryManager, RenderOptimizer, AssetOptimizer, PerfMonitor };
}
/**

- ⚡ DEVICE & SYSTEM OPTIMIZER — PHẦN 2
- Tối ưu sâu: Network, Battery, GPU, Storage, Thread, Adaptive
  */

// ============================================================
// 7. NETWORK OPTIMIZER — Tối ưu mạng & băng thông
// ============================================================
const NetworkOptimizer = {
/**

- Lấy thông tin kết nối mạng hiện tại
  */
  getConnectionInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return console.warn(‘⚠️ Network API không được hỗ trợ’);
  console.table({
  ‘Loại mạng’:       conn.effectiveType,        // ‘4g’, ‘3g’, ‘2g’, ‘slow-2g’
  ‘Downlink (Mbps)’: conn.downlink,
  ‘RTT (ms)’:        conn.rtt,
  ‘Data Saver’:      conn.saveData ? ‘Bật’ : ‘Tắt’
  });
  return conn;
  },

/**

- Tự động điều chỉnh chất lượng theo tốc độ mạng
- @param {Object} handlers - { fast, slow, offline }
  */
  adaptToNetwork(handlers = {}) {
  const conn = navigator.connection;
  const apply = () => {
  if (!navigator.onLine) return handlers.offline?.();
  const type = conn?.effectiveType || ‘4g’;
  if ([‘slow-2g’, ‘2g’].includes(type) || conn?.saveData) {
  handlers.slow?.();
  } else {
  handlers.fast?.();
  }
  };
  apply();
  window.addEventListener(‘online’, apply);
  window.addEventListener(‘offline’, apply);
  conn?.addEventListener(‘change’, apply);
  },

/**

- Request queue có priority — tránh flood request
- @param {number} maxConcurrent - Số request đồng thời tối đa
  */
  createQueue(maxConcurrent = 3) {
  const queue = [];
  let running = 0;
  function next() {
  if (running >= maxConcurrent || !queue.length) return;
  running++;
  const { url, options, resolve, reject } = queue.shift();
  fetch(url, options)
  .then(resolve).catch(reject)
  .finally(() => { running–; next(); });
  }
  return {
  add(url, options = {}) {
  return new Promise((resolve, reject) => {
  queue.push({ url, options, resolve, reject });
  next();
  });
  },
  get size() { return queue.length; }
  };
  },

/**

- Retry fetch tự động khi lỗi mạng
- @param {string} url
- @param {Object} options
- @param {number} retries - Số lần thử lại
- @param {number} backoff - ms delay tăng dần
  */
  async fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  for (let i = 0; i <= retries; i++) {
  try {
  const res = await fetch(url, options);
  if (!res.ok && i < retries) throw new Error(`HTTP ${res.status}`);
  return res;
  } catch (err) {
  if (i === retries) throw err;
  console.warn(`🔄 Retry ${i + 1}/${retries} sau ${backoff * (i + 1)}ms`);
  await new Promise(r => setTimeout(r, backoff * (i + 1)));
  }
  }
  },

/**

- DNS prefetch + preconnect tự động cho các domain
- @param {string[]} domains
  */
  prefetchDomains(domains) {
  domains.forEach(domain => {
  [‘dns-prefetch’, ‘preconnect’].forEach(rel => {
  const link = document.createElement(‘link’);
  link.rel = rel;
  link.href = domain;
  document.head.appendChild(link);
  });
  });
  },

/**

- Gửi data khi tab đóng (không bị mất) — dùng sendBeacon
- @param {string} url
- @param {Object} data
  */
  sendOnExit(url, data) {
  window.addEventListener(‘visibilitychange’, () => {
  if (document.visibilityState === ‘hidden’) {
  navigator.sendBeacon(url, JSON.stringify(data));
  }
  });
  }
  };

// ============================================================
// 8. BATTERY OPTIMIZER — Tiết kiệm pin
// ============================================================
const BatteryOptimizer = {
_battery: null,
_reducedMode: false,

/**

- Lấy thông tin pin
  */
  async getInfo() {
  if (!navigator.getBattery) return console.warn(‘⚠️ Battery API không hỗ trợ’);
  const bat = await navigator.getBattery();
  this._battery = bat;
  console.table({
  ‘Pin còn’:      Math.round(bat.level * 100) + ‘%’,
  ‘Đang sạc’:     bat.charging ? ‘Có’ : ‘Không’,
  ‘Thời gian sạc đầy’: bat.chargingTime === Infinity ? ‘N/A’ : bat.chargingTime + ‘s’,
  ‘Thời gian hết pin’:  bat.dischargingTime === Infinity ? ‘N/A’ : bat.dischargingTime + ‘s’
  });
  return bat;
  },

/**

- Tự động giảm hiệu ứng khi pin yếu
- @param {number} threshold - % pin (mặc định 20%)
- @param {Function} onLow - callback khi pin yếu
- @param {Function} onNormal - callback khi pin bình thường
  */
  async adaptToBattery(threshold = 0.2, onLow, onNormal) {
  if (!navigator.getBattery) return;
  const bat = await navigator.getBattery();
  this._battery = bat;

```
const check = () => {
  const isLow = bat.level <= threshold && !bat.charging;
  if (isLow && !this._reducedMode) {
    this._reducedMode = true;
    console.warn(`🔋 Pin thấp (${Math.round(bat.level * 100)}%) — Kích hoạt chế độ tiết kiệm`);
    onLow?.();
    this._applyPowerSaving();
  } else if (!isLow && this._reducedMode) {
    this._reducedMode = false;
    onNormal?.();
    this._removePowerSaving();
  }
};

bat.addEventListener('levelchange', check);
bat.addEventListener('chargingchange', check);
check();
```

},

_applyPowerSaving() {
// Tắt animation
const style = document.createElement(‘style’);
style.id = ‘**battery_saver**’;
style.textContent = `*, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }`;
document.head.appendChild(style);
},

_removePowerSaving() {
document.getElementById(’**battery_saver**’)?.remove();
}
};

// ============================================================
// 9. GPU / RENDER PIPELINE OPTIMIZER
// ============================================================
const GPUOptimizer = {
/**

- Kiểm tra GPU tier (dựa trên canvas performance)
- @returns {‘high’|‘mid’|‘low’}
  */
  detectGPUTier() {
  const canvas = document.createElement(‘canvas’);
  const gl = canvas.getContext(‘webgl’) || canvas.getContext(‘experimental-webgl’);
  if (!gl) return ‘low’;
  const dbgInfo = gl.getExtension(‘WEBGL_debug_renderer_info’);
  if (dbgInfo) {
  const renderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
  console.log(‘🎮 GPU:’, renderer);
  if (renderer.includes(‘intel’) && !renderer.includes(‘iris’)) return ‘mid’;
  if (renderer.includes(‘swiftshader’) || renderer.includes(‘llvmpipe’)) return ‘low’;
  }
  // Benchmark nhỏ
  const start = performance.now();
  for (let i = 0; i < 10000; i++) Math.sqrt(i);
  const ms = performance.now() - start;
  return ms < 2 ? ‘high’ : ms < 10 ? ‘mid’ : ‘low’;
  },

/**

- Chọn chất lượng rendering theo GPU
- @param {Object} config - { high, mid, low } callbacks
  */
  adaptToGPU(config) {
  const tier = this.detectGPUTier();
  console.log(`🖥 GPU Tier: ${tier}`);
  config[tier]?.();
  return tier;
  },

/**

- Tắt pointer-events trên overlay khi scroll (tăng FPS)
- @param {HTMLElement} el - element cần tắt khi scroll
  */
  disablePointerOnScroll(el = document.body) {
  let timer;
  window.addEventListener(‘scroll’, () => {
  el.style.pointerEvents = ‘none’;
  clearTimeout(timer);
  timer = setTimeout(() => { el.style.pointerEvents = ‘’; }, 150);
  }, { passive: true });
  },

/**

- Tối ưu canvas 2D
- @param {HTMLCanvasElement} canvas
  */
  optimizeCanvas(canvas) {
  const ctx = canvas.getContext(‘2d’);
  // Scale theo devicePixelRatio để tránh blur
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width  = rect.width  + ‘px’;
  canvas.style.height = rect.height + ‘px’;
  ctx.scale(dpr, dpr);
  // Tắt image smoothing nếu không cần
  ctx.imageSmoothingEnabled = false;
  return ctx;
  },

/**

- RAF loop tối ưu — tự dừng khi không cần
- @param {Function} fn - fn(deltaTime)
  */
  createLoop(fn) {
  let id, last = 0, running = false;
  function tick(now) {
  const delta = now - last;
  last = now;
  fn(delta);
  if (running) id = requestAnimationFrame(tick);
  }
  return {
  start() { if (!running) { running = true; id = requestAnimationFrame(tick); } },
  stop()  { running = false; cancelAnimationFrame(id); },
  get running() { return running; }
  };
  }
  };

// ============================================================
// 10. STORAGE OPTIMIZER — Quản lý lưu trữ
// ============================================================
const StorageOptimizer = {
/**

- Kiểm tra dung lượng storage còn lại
  */
  async checkQuota() {
  if (!navigator.storage?.estimate) return;
  const { usage, quota } = await navigator.storage.estimate();
  const mb = b => (b / 1048576).toFixed(1) + ’ MB’;
  console.table({
  ‘Đã dùng’: mb(usage),
  ‘Tổng’:    mb(quota),
  ‘Còn lại’: mb(quota - usage),
  ‘Tỷ lệ’:   ((usage / quota) * 100).toFixed(1) + ‘%’
  });
  return { usage, quota };
  },

/**

- LRU Cache trong memory — tự xóa item cũ khi đầy
- @param {number} maxSize
  */
  createLRUCache(maxSize = 100) {
  const cache = new Map();
  return {
  get(key) {
  if (!cache.has(key)) return undefined;
  const val = cache.get(key);
  cache.delete(key); cache.set(key, val); // Move to end
  return val;
  },
  set(key, value) {
  if (cache.has(key)) cache.delete(key);
  else if (cache.size >= maxSize) cache.delete(cache.keys().next().value);
  cache.set(key, value);
  },
  has(key) { return cache.has(key); },
  delete(key) { return cache.delete(key); },
  clear() { cache.clear(); },
  get size() { return cache.size; }
  };
  },

/**

- IndexedDB wrapper đơn giản cho lưu trữ lớn
- @param {string} dbName
- @param {string} storeName
  */
  openDB(dbName = ‘AppDB’, storeName = ‘store’) {
  const req = indexedDB.open(dbName, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(storeName);
  const dbPromise = new Promise((res, rej) => {
  req.onsuccess = e => res(e.target.result);
  req.onerror   = e => rej(e.target.error);
  });
  const tx = (mode) => dbPromise.then(db => db.transaction(storeName, mode).objectStore(storeName));
  const wrap = (req) => new Promise((res, rej) => { req.onsuccess = e => res(e.target.result); req.onerror = e => rej(e.target.error); });
  return {
  async get(key)         { return wrap((await tx(‘readonly’)).get(key)); },
  async set(key, value)  { return wrap((await tx(‘readwrite’)).put(value, key)); },
  async delete(key)      { return wrap((await tx(‘readwrite’)).delete(key)); },
  async clear()          { return wrap((await tx(‘readwrite’)).clear()); },
  async keys()           { return wrap((await tx(‘readonly’)).getAllKeys()); }
  };
  },

/**

- Dọn localStorage/sessionStorage hết hạn
- @param {Storage} storage - localStorage hoặc sessionStorage
  */
  cleanExpired(storage = localStorage) {
  const now = Date.now();
  let count = 0;
  Object.keys(storage).forEach(key => {
  try {
  const item = JSON.parse(storage.getItem(key));
  if (item?._exp && item._exp < now) { storage.removeItem(key); count++; }
  } catch {}
  });
  if (count > 0) console.log(`🧹 Đã xóa ${count} item hết hạn`);
  },

/**

- Set item có thời gian hết hạn
- @param {string} key
- @param {*} value
- @param {number} ttl - ms
- @param {Storage} storage
  */
  setWithTTL(key, value, ttl, storage = localStorage) {
  storage.setItem(key, JSON.stringify({ value, _exp: Date.now() + ttl }));
  },

getWithTTL(key, storage = localStorage) {
try {
const item = JSON.parse(storage.getItem(key));
if (!item) return null;
if (item._exp && item._exp < Date.now()) { storage.removeItem(key); return null; }
return item.value;
} catch { return null; }
}
};

// ============================================================
// 11. THREAD MANAGER — Quản lý đa luồng
// ============================================================
const ThreadManager = {
_pool: [],
_queue: [],
_maxWorkers: Math.max(1, (navigator.hardwareConcurrency || 4) - 1),

/**

- Worker pool — tái sử dụng worker thay vì tạo mới mỗi lần
- @param {string} workerScript - URL hoặc Blob code
- @param {number} poolSize
  */
  createPool(workerScript, poolSize = this._maxWorkers) {
  const workers = Array.from({ length: poolSize }, () => ({
  worker: new Worker(workerScript),
  busy: false
  }));
  const queue = [];

```
function dispatch(data, resolve, reject) {
  const slot = workers.find(w => !w.busy);
  if (!slot) { queue.push({ data, resolve, reject }); return; }
  slot.busy = true;
  slot.worker.onmessage = (e) => {
    slot.busy = false;
    resolve(e.data);
    if (queue.length) { const next = queue.shift(); dispatch(next.data, next.resolve, next.reject); }
  };
  slot.worker.onerror = (e) => { slot.busy = false; reject(e); };
  slot.worker.postMessage(data);
}

return {
  run: (data) => new Promise((res, rej) => dispatch(data, res, rej)),
  terminate: () => workers.forEach(w => w.worker.terminate()),
  get queueSize() { return queue.length; },
  get activeWorkers() { return workers.filter(w => w.busy).length; }
};
```

},

/**

- Thông tin CPU cores
  */
  getCPUInfo() {
  const cores = navigator.hardwareConcurrency || ‘unknown’;
  console.log(`💻 CPU Cores: ${cores}`);
  console.log(`🧵 Max Workers khuyến nghị: ${this._maxWorkers}`);
  return { cores, recommended: this._maxWorkers };
  },

/**

- SharedArrayBuffer task (nếu được phép) — shared memory giữa threads
  */
  createSharedBuffer(size = 1024) {
  if (typeof SharedArrayBuffer === ‘undefined’) {
  console.warn(‘⚠️ SharedArrayBuffer cần COOP/COEP headers’);
  return null;
  }
  return new SharedArrayBuffer(size);
  }
  };

// ============================================================
// 12. ADAPTIVE QUALITY MANAGER — Tự động thích nghi thiết bị
// ============================================================
const AdaptiveQuality = {
_profile: ‘high’,

/**

- Phát hiện khả năng thiết bị tổng hợp
- @returns {‘high’|‘mid’|‘low’}
  */
  detectDevice() {
  const cores    = navigator.hardwareConcurrency || 2;
  const memory   = navigator.deviceMemory || 2; // GB (Chrome only)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const prefersReduced = window.matchMedia(’(prefers-reduced-motion: reduce)’).matches;

```
let score = 0;
if (cores >= 8)  score += 3;
else if (cores >= 4) score += 2;
else score += 1;

if (memory >= 8)  score += 3;
else if (memory >= 4) score += 2;
else score += 1;

if (!isMobile) score += 1;
if (prefersReduced) score -= 2;

const profile = score >= 6 ? 'high' : score >= 4 ? 'mid' : 'low';
this._profile = profile;

console.table({
  'CPU Cores': cores,
  'RAM (GB)':  memory,
  'Mobile':    isMobile ? 'Có' : 'Không',
  'Reduced Motion': prefersReduced ? 'Có' : 'Không',
  'Profile':   profile.toUpperCase()
});

return profile;
```

},

/**

- Áp dụng cấu hình theo profile thiết bị
  */
  apply(config = {}) {
  const profile = this.detectDevice();
  const defaults = {
  high: () => {
  document.documentElement.style.setProperty(’–anim-speed’, ‘0.3s’);
  console.log(‘🚀 Chế độ HIGH — Bật toàn bộ hiệu ứng’);
  },
  mid: () => {
  document.documentElement.style.setProperty(’–anim-speed’, ‘0.15s’);
  console.log(‘⚡ Chế độ MID — Giảm hiệu ứng’);
  },
  low: () => {
  document.documentElement.style.setProperty(’–anim-speed’, ‘0ms’);
  // Tắt animation
  const s = document.createElement(‘style’);
  s.id = ‘**low_device**’;
  s.textContent = ’*, *::before, *::after { animation: none !important; transition: none !important; }’;
  document.head.appendChild(s);
  console.log(‘🐢 Chế độ LOW — Tắt hiệu ứng để tối ưu’);
  }
  };
  const merged = { …defaults, …config };
  merged[profile]?.();
  return profile;
  },

/**

- Theo dõi hiệu năng và tự hạ profile nếu FPS thấp
- @param {number} minFPS - Ngưỡng FPS tối thiểu
  */
  watchPerformance(minFPS = 30) {
  let frames = 0, start = performance.now();
  const loop = () => {
  frames++;
  const elapsed = performance.now() - start;
  if (elapsed >= 1000) {
  const fps = frames / (elapsed / 1000);
  frames = 0; start = performance.now();
  if (fps < minFPS && this._profile !== ‘low’) {
  console.warn(`⚠️ FPS thấp (${fps.toFixed(0)}) — Hạ chất lượng`);
  this._profile = this._profile === ‘high’ ? ‘mid’ : ‘low’;
  this.apply();
  }
  }
  requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  }
  };

// ============================================================
// 13. VISIBILITY OPTIMIZER — Dừng tác vụ khi tab ẩn
// ============================================================
const VisibilityOptimizer = {
_tasks: { hidden: [], visible: [] },

/**

- Đăng ký callback khi tab ẩn/hiện
  */
  on(event, fn) {
  this._tasks[event]?.push(fn);
  if (!this._initialized) this._init();
  return this;
  },

_initialized: false,
_init() {
this._initialized = true;
document.addEventListener(‘visibilitychange’, () => {
const isHidden = document.visibilityState === ‘hidden’;
this._tasks[isHidden ? ‘hidden’ : ‘visible’].forEach(fn => fn());
});
},

/**

- Tự động pause/resume mọi video khi tab ẩn
  */
  autoManageVideos() {
  this.on(‘hidden’,  () => document.querySelectorAll(‘video’).forEach(v => !v.paused && (v._wasPlaying = true) && v.pause()));
  this.on(‘visible’, () => document.querySelectorAll(‘video’).forEach(v => v._wasPlaying && v.play() && (v._wasPlaying = false)));
  return this;
  },

/**

- Đặt title tab khi bị ẩn (thông báo user)
- @param {string} hiddenTitle
  */
  setHiddenTitle(hiddenTitle = ‘⏸ Đang chờ…’) {
  const original = document.title;
  this.on(‘hidden’,  () => document.title = hiddenTitle);
  this.on(‘visible’, () => document.title = original);
  return this;
  }
  };

// ============================================================
// AUTO INIT
// ============================================================
(function SystemAutoInit() {
// Detect device ngay khi load
window.addEventListener(‘DOMContentLoaded’, () => {
AdaptiveQuality.apply();
StorageOptimizer.cleanExpired();
VisibilityOptimizer.autoManageVideos();
NetworkOptimizer.getConnectionInfo();
ThreadManager.getCPUInfo();
});

// Monitor battery nếu có
if (navigator.getBattery) {
BatteryOptimizer.adaptToBattery(0.2,
() => console.log(‘🔋 Đã bật chế độ tiết kiệm pin’),
() => console.log(‘🔋 Pin đủ — Khôi phục bình thường’)
);
}

console.log(‘⚡ System Optimizer v2 loaded —’, navigator.hardwareConcurrency || ‘?’, ‘cores,’, (navigator.deviceMemory || ‘?’) + ‘GB RAM’);
})();

// ============================================================
// EXPORT
// ============================================================
if (typeof module !== ‘undefined’) {
module.exports = { NetworkOptimizer, BatteryOptimizer, GPUOptimizer, StorageOptimizer, ThreadManager, AdaptiveQuality, VisibilityOptimizer };
} else {
Object.assign(window.Optimizer ||= {}, { NetworkOptimizer, BatteryOptimizer, GPUOptimizer, StorageOptimizer, ThreadManager, AdaptiveQuality, VisibilityOptimizer });
}