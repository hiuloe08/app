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