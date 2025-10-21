// ---- データ定義 -----------------------------------------------------------
// 常にページ先頭から開始
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}

// Mobile-only: mitigate pinch/double-tap zoom on iOS and touch devices
(() => {
  const isMobile = (window.matchMedia && (matchMedia('(max-width: 768px)').matches)) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isMobile) return;
  // Prevent iOS Safari pinch zoom via gesture events
  const prevent = (e) => { try { e.preventDefault(); } catch (_) {} };
  document.addEventListener('gesturestart', prevent, { passive: false });
  document.addEventListener('gesturechange', prevent, { passive: false });
  document.addEventListener('gestureend', prevent, { passive: false });
})();

const SERVICES = [
  // 指定に基づく正しい組み合わせ（名称・URL・画像）
  { id: 1,  name: "Logopop",         url: "https://kaio724nobu.github.io/logo/",            img: "assets/1.jpg"  },
  { id: 2,  name: "SignCraft",       url: "https://kaio724nobu.github.io/sign/",            img: "assets/2.jpg"  },
  { id: 3,  name: "SoundScape",      url: "https://kaio724nobu.github.io/bgm/",             img: "assets/3.jpg"  },
  { id: 4,  name: "旅プランナー",     url: "https://kaio724nobu.github.io/tabi/",            img: "assets/4.jpg"  },
  { id: 5,  name: "彩り紙工房",       url: "https://kaio724nobu.github.io/paper/",           img: "assets/5.jpg"  },
  { id: 6,  name: "Randeverse",      url: "https://kaio724nobu.github.io/randeverce/",      img: "assets/6.jpg"  },
  { id: 7,  name: "Wakeup!",         url: "https://kaio724nobu.github.io/wakeup2/",         img: "assets/7.jpg"  },
  { id: 8,  name: "てまひま",         url: "https://kaio724nobu.github.io/temahima2/",       img: "assets/8.jpg"  },
  { id: 9,  name: "カスビジポータル", url: "https://kaio724nobu.github.io/kasubizi/",       img: "assets/9.jpg"  },
  { id: 10, name: "Weby",            url: "https://webysakigake.com/",   img: "assets/10.jpg" },
];

// カルーセルの表示順（10 → 9 → 1 → 2 → … → 8）
const CAROUSEL_ORDER = [10, 9, 1, 2, 3, 4, 5, 6, 7, 8];

const NEWS = [
  { date: "2025-09-24", title: "新ポータルを公開しました。", tag: "Info", link: "#" },
];

const SOCIALS = [
  { name: "X (Twitter)", label: "", url: "" },
  { name: "Instagram",   label: "", url: "" },
  { name: "YouTube",     label: "チャンネル", url: "" },
];


// ---- Utility --------------------------------------------------------------
const el = (tag, className, attrs = {}) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") e.textContent = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  return e;
};

// ---- カルーセル -----------------------------------------------------------
function buildCarousel() {
  const root = document.getElementById("carousel");
  const dotsRoot = document.getElementById("carouselDots");
  root.innerHTML = "";
  if (dotsRoot) dotsRoot.innerHTML = "";

  const ANIM_MS = 600;
  const INTERVAL_MS = 7000;

  // id → サービスのマップ
  const byId = new Map(SERVICES.map(s => [s.id, s]));
  const realData = CAROUSEL_ORDER.map(id => byId.get(id)).filter(Boolean);

  const makeSlide = (svc, opts = {}) => {
    const slide = el("div", "slide");
    if (opts.clone) slide.dataset.clone = String(opts.clone);
    const a = el("a", null, { href: svc.url, target: "_blank", rel: "noopener noreferrer", title: `${svc.name} を開く` });
    const img = el("img", null, { src: svc.img, alt: `${svc.name} のサムネイル`, loading: "lazy" });
    img.addEventListener("error", () => {
      console.warn("img load failed:", img.src);
      const fallback = el("div", "fallback", { text: svc.name });
      a.innerHTML = "";
      a.appendChild(fallback);
    });
    // 画像ロード後も高さ固定のみ再適用（トリミングは行わない）
    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', () => { if (lockedHeight !== null) applyHeight(lockedHeight); }, { once: true });
    }
    a.appendChild(img);
    slide.appendChild(a);
    return slide;
  };

  // 無限ローテーション用に両端にクローンを配置
  const first = makeSlide(realData[0]);
  const last = makeSlide(realData[realData.length - 1]);
  root.appendChild(makeSlide(realData[realData.length - 1], { clone: "head" }));
  realData.forEach(svc => root.appendChild(makeSlide(svc)));
  root.appendChild(makeSlide(realData[0], { clone: "tail" }));

  const slides = () => Array.from(root.children);
  const isSmallPortrait = (window.matchMedia && matchMedia('(max-width: 820px) and (orientation: portrait)').matches);
  // 縦画面時はカルーセル上での縦スクロール開始を明示的に抑止（外では通常スクロール）
  (() => {
    // Portrait-only: fully block vertical movement while keeping horizontal swipe via manual panning
    const PORTRAIT_Q = '(max-width: 820px) and (orientation: portrait)';
    let active = false;
    let startX = 0;
    let startScroll = 0;
    const isPortrait = () => (window.matchMedia && matchMedia(PORTRAIT_Q).matches);
    root.addEventListener('touchstart', (e) => {
      if (!isPortrait()) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      active = true;
      startX = t.clientX;
      startScroll = root.scrollLeft;
    }, { passive: true, capture: true });
    root.addEventListener('touchmove', (e) => {
      if (!active || !isPortrait()) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
      const dx = t.clientX - startX;
      root.scrollLeft = startScroll - dx; // natural swipe: drag left -> next
    }, { passive: false, capture: true });
    const end = () => { active = false; };
    root.addEventListener('touchend', end, { passive: true, capture: true });
    root.addEventListener('touchcancel', end, { passive: true, capture: true });
  })();
  const SIZE_SCALE = isSmallPortrait ? 1.0 : 0.56; // 縦向きスマホでは画像全体が入る高さを確保
  let lockedHeight = null;
  const applyHeight = (h) => { slides().forEach(sl => sl.style.height = h + 'px'); };
  const sizeSlides = () => {
    // 既にロック済みなら、その値を適用して終わり
    if (lockedHeight !== null) { applyHeight(lockedHeight); return; }
    // 現在の中心スライドを基準に高さ算出
    const cur = slides()[index];
    const img = cur ? cur.querySelector('img') : null;
    if (img && img.naturalWidth > 0) {
      const sw = cur.clientWidth || root.clientWidth;
      const raw = Math.round(sw * (img.naturalHeight / img.naturalWidth) * SIZE_SCALE);
      const MIN_H = 220;
      const MAX_H = isSmallPortrait ? Math.round(window.innerHeight * 0.8) : Math.max(520, Math.round(window.innerHeight * 0.6));
      lockedHeight = Math.max(MIN_H, Math.min(MAX_H, raw));
      applyHeight(lockedHeight);
      return;
    }
    // 画像が未ロードなら、ひとまず現在の見た目の高さを採用してロック
    const guessRaw = cur ? cur.clientHeight : Math.round(root.clientWidth * 9/16 * SIZE_SCALE);
    if (guessRaw > 0) {
      const MIN_H = 220;
      const MAX_H = isSmallPortrait ? Math.round(window.innerHeight * 0.8) : Math.max(520, Math.round(window.innerHeight * 0.6));
      lockedHeight = Math.max(MIN_H, Math.min(MAX_H, guessRaw));
      applyHeight(lockedHeight);
    }
  };

  // ドット作成（実スライド数ぶん）
  let dots = [];
  if (dotsRoot) {
    dots = realData.map((svc, i) => {
      const b = el("button", "carousel-dot", { 'aria-label': `スライド ${i+1}` });
      b.addEventListener('click', () => {
        index = i + 1; // クローン分ずらす
        scrollToIndex(index, true);
        reset();
      });
      dotsRoot.appendChild(b);
      return b;
    });
  }

  const centerLeftFor = (target) => {
    const centerPad = (root.clientWidth - target.clientWidth) / 2;
    return target.offsetLeft - Math.max(0, centerPad);
  };

  const scrollToIndex = (i, smooth = true) => {
    const target = slides()[i];
    if (!target) return;
    root.scrollTo({ left: centerLeftFor(target), behavior: smooth ? 'smooth' : 'auto' });
    updateUI(i);
  };

  const realCount = realData.length;
  let index = 1; // 先頭クローンの次＝実スライド1枚目
  const updateDots = (i) => {
    if (!dots.length) return;
    const pos = ((i - 1 + realCount) % realCount); // 0..realCount-1
    dots.forEach((d, di) => d.classList.toggle('active', di === pos));
  };

  const updateBg = (i) => {
    const bg = document.getElementById('carouselBg');
    if (!bg) return;
    const realIdx = ((i - 1 + realCount) % realCount); // 0..realCount-1
    const svc = realData[realIdx];
    bg.style.backgroundImage = `url('${svc.img}')`;
  };

  const updateActive = (i) => {
    const total = slides().length;
    for (let k = 0; k < total; k++) {
      slides()[k].classList.toggle('active', k === i);
    }
  };

  const updateUI = (i) => {
    updateDots(i);
    updateBg(i);
    updateActive(i);
  };

  // 初期サイズ計算と位置（初回の見た目をロック）
  sizeSlides();
  // 初期描画完了後の高さを再取得して確定（レイアウト安定後に一度だけ）
  setTimeout(() => {
    if (lockedHeight === null) {
      const cur = slides()[index];
      const h = cur ? cur.clientHeight : 0;
      if (h > 0) { lockedHeight = h; applyHeight(lockedHeight); }
    }
  }, 60);
  scrollToIndex(index, false);

  const jumpIfClone = () => {
    const total = slides().length; // = realCount + 2
    if (index === total - 1) { // 末尾の先頭クローン
      index = 1;
      scrollToIndex(index, false);
    } else if (index === 0) { // 先頭の末尾クローン
      index = total - 2;
      scrollToIndex(index, false);
    }
  };

  // 自動スクロール（7秒ごとに右へ）
  const tick = () => {
    index += 1;
    scrollToIndex(index, true);
    // アニメ後にクローンへ到達していたらジャンプ
    setTimeout(jumpIfClone, ANIM_MS + 30);
  };
  let timer = setInterval(tick, INTERVAL_MS);

  // 操作で一時停止→再開
  const reset = () => { clearInterval(timer); timer = setInterval(tick, INTERVAL_MS); };
  root.addEventListener("pointerdown", reset);
  root.addEventListener("wheel", reset, { passive: true });
  // リサイズ時も高さは維持（再計算しない）
  const recalcOnChange = () => { lockedHeight = null; sizeSlides(); scrollToIndex(index, false); };
  window.addEventListener('resize', recalcOnChange);
  window.addEventListener('orientationchange', recalcOnChange);

  // スクロールで中央スライドを追従判定（手動スワイプ時）
  let scrollT;
  root.addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      // 最も中央に近いスライドを探す
      const arr = slides();
      const center = root.scrollLeft + root.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      arr.forEach((sl, idx) => {
        const mid = sl.offsetLeft + sl.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; best = idx; }
      });
      index = best;
      updateUI(index);
      jumpIfClone();
    }, 120);
  }, { passive: true });

  // 矢印ナビ
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.addEventListener('click', () => { index -= 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); });
  if (next) next.addEventListener('click', () => { index += 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); });

  // キーボード操作（左右キー）
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { index -= 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); }
    if (e.key === 'ArrowRight') { index += 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); }
  });
}

// ---- 事業一覧 -------------------------------------------------------------
function buildServices() {
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = "";
  SERVICES.forEach((svc) => {
    const card = el("div", "service-card");
    const thumb = el("div", "service-thumb");
    const img = el("img", null, { src: svc.img, alt: `${svc.name} のイメージ`, loading: "lazy" });
    img.addEventListener("error", () => {
      console.warn("img load failed:", img.src);
      thumb.innerHTML = `<div class="fallback">${svc.name}</div>`;
    });
    thumb.appendChild(img);
    const title = el("div", "service-title", { text: svc.name });
    const meta = el("p", "service-meta", { text: svc.url });
    const actions = el("div", "service-actions");
    const btn = el("a", "btn primary", { href: svc.url, target: "_blank", rel: "noopener noreferrer", text: "LPを開く" });
    actions.appendChild(btn);
    card.append(thumb, title, meta, actions);
    grid.appendChild(card);
  });
}

// ---- クリエイター（仮） ----------------------------------------------------
function buildCreators() {
  const grid = document.getElementById("creatorsGrid");
  grid.innerHTML = "";
  // 指定に合わせて2名に調整
  const placeholders = [
    { name: "細野 魁", role: "代表", links: ["https://kaio724nobu.github.io/hosonokaisong/"] },
    { name: "宮下 涼太", role: "副代表", links: [] },
  ];
  placeholders.forEach((c) => {
    const card = el("div", "creator-card");
    const name = el("div", "name", { text: c.name });
    const role = el("div", "muted small", { text: c.role });
    const links = el("div", "links");
    c.links.forEach((href, i) => {
      const label = (c.links.length === 1 && /^https?:/.test(href)) ? "公式サイト" : `Link ${i+1}`;
      const a = el("a", "btn subtle small", { href, target: /^https?:/.test(href) ? "_blank" : undefined, rel: "noopener", text: label });
      links.appendChild(a);
    });
    card.append(name, role, links);
    grid.appendChild(card);
  });
}

// ---- お知らせ --------------------------------------------------------------
function buildNews() {
  const list = document.getElementById("newsList");
  list.innerHTML = "";
  NEWS.forEach(n => {
    const li = el("li", "news-item");
    const date = el("div", "muted small", { text: n.date });
    const content = el("div");
    const a = el("a", null, { href: n.link, target: n.link.startsWith("http") ? "_blank" : undefined, rel: "noopener", text: n.title });
    const tag = el("span", "badge", { text: n.tag });
    content.append(a, document.createTextNode(" "), tag);
    li.append(date, content);
    list.appendChild(li);
  });
}

// ---- SNS（仮） -------------------------------------------------------------
function buildSNS() {
  const grid = document.getElementById("snsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const data = (typeof SOCIALS !== "undefined" && Array.isArray(SOCIALS)) ? SOCIALS : [];
  if (!data.length) {
    const p = el("p", "muted small", { text: "SNSリンクの設定がありません。" });
    grid.appendChild(p);
    return;
  }
  data.forEach(s => {
    const card = el("div", "sns-card");
    const row = el("div", "row");
    const left = el("div");
    left.appendChild(el("div", "service-title", { text: s.name || "SNS" }));
    left.appendChild(el("p", "service-meta", { text: s.label || (s.url || "") }));
    const right = el("div");
    let a;
    if (s.url && /^https?:/.test(s.url)) {
      a = el("a", "btn primary", { href: s.url, target: "_blank", rel: "noopener", text: s.action || "開く" });
    } else {
      a = el("button", "btn subtle", { text: s.action || "準備中" });
      a.setAttribute("disabled", "disabled");
    }
    right.appendChild(a);
    row.append(left, right);
    card.appendChild(row);
    grid.appendChild(card);
  });
}

// ---- Scroll Reveal ---------------------------------------------------------
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
      } else {
        e.target.classList.remove('revealed');
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ---- 初期化 ----------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  ensureTop();
  setupLoading();
  setupIntro();
  enhanceHeadline();
  enhanceBrandRoll();
  buildCarousel();
  buildServices();
  buildCreators();
  buildNews();
  buildSNS();
  setupReveal();
  setupParallax();
  setupHeroTabs();
});
// ページの完全ロード後も念のためトップへ
window.addEventListener('load', () => { setTimeout(ensureTop, 0); });

// ---- Headline: per-character reveal ---------------------------------------
function enhanceHeadline() {
  const h = document.querySelector('.hero .headline');
  if (!h) return;
  const text = h.textContent || '';
  h.setAttribute('aria-label', text);
  h.setAttribute('role', 'heading');
  h.setAttribute('aria-level', '1');
  h.textContent = '';
  let i = 0;
  for (const ch of text) {
    if (ch === ' ') {
      h.appendChild(document.createTextNode(' '));
    } else {
      const span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', i++);
      span.textContent = ch;
      h.appendChild(span);
    }
  }
  // JSでタイプライター的に1文字ずつ不透明化（入場のたびに実行）
  const delayPerChar = 80; // ms (faster)
  const spans = [...h.querySelectorAll('.ch')];
  let timers = [];
  const clearTimers = () => { timers.forEach(t => clearTimeout(t)); timers = []; };
  const reset = () => { clearTimers(); spans.forEach(s => { s.style.opacity = '0'; }); h.classList.remove('shown'); };
  const play = () => {
    reset();
    spans.forEach((s, idx) => {
      timers.push(setTimeout(() => { s.style.opacity = '1'; }, idx * delayPerChar));
    });
    timers.push(setTimeout(() => { h.classList.add('shown'); }, spans.length * delayPerChar + 100));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        play();
      } else {
        reset();
      }
    });
  }, { threshold: 0.6 });
  io.observe(h);
}

// ---- Hero tabs: highlight active section ----------------------------------
function setupHeroTabs() {
  const tabs = Array.from(document.querySelectorAll('.hero-tab'));
  if (!tabs.length) return;
  const sections = Array.from(document.querySelectorAll('.tabbed'));
  const byId = new Map(sections.map(s => [s.id, s]));
  // Move sections into tab content container so they appear under hero
  const container = document.getElementById('tabContent');
  if (container) {
    sections.forEach(s => { container.appendChild(s); });
  }
  const activate = (id) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.target === id));
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    // オプション: URLハッシュを更新（スクロールはしない）
    history.replaceState(null, '', '#' + id);
  };
  tabs.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    const id = t.dataset.target;
    if (byId.has(id)) activate(id);
  }));
  // 初期表示（ハッシュがあれば尊重）
  const initial = location.hash ? location.hash.replace('#','') : 'about';
  activate(byId.has(initial) ? initial : 'about');

  // ヘッダーのナビゲーションもタブと同期
  const headerLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  headerLinks.forEach(a => {
    const id = (a.getAttribute('href') || '').replace('#','');
    if (!id) return;
    a.addEventListener('click', (e) => {
      if (byId.has(id)) {
        e.preventDefault();
        activate(id);
        const hero = document.getElementById('catch');
        if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ハッシュ変更時もアクティブ切替
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#','');
    if (byId.has(id)) activate(id);
  });
}

// ---- Subline brand roll-in -----------------------------------------------
function enhanceBrandRoll() {
  const t = document.querySelector('.subline .brand-roll');
  if (!t) return;
  const text = t.textContent || '';
  t.setAttribute('aria-label', text);
  t.textContent = '';
  let i = 0;
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'br-ch';
    span.style.setProperty('--i', i++);
    span.textContent = ch;
    t.appendChild(span);
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if (e.isIntersecting) {
        t.classList.add('revealed');
      } else {
        t.classList.remove('revealed');
      }
    });
  }, { threshold: 0.4 });
  io.observe(t);
}

function ensureTop() {
  try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (_) {}
}

// ---- 0.5s Loading overlay --------------------------------------------------
function setupLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  const bar = document.getElementById('loadingBar');
  const MIN_SHOW_MS = 900; // ローディング画面の最小表示時間（ユーザー要望: +0.4s）
  const start = performance.now();
  let isLoaded = false;
  let finished = false;
  let rafId = 0;

  const setBar = (pct) => { if (bar) bar.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%'; };

  const tryFinish = () => {
    if (finished) return;
    const elapsed = performance.now() - start;
    if (isLoaded && elapsed >= MIN_SHOW_MS) {
      finished = true;
      setBar(100);
      ensureTop();
      overlay.classList.add('hide');
      setTimeout(() => { try { overlay.remove(); } catch (_) {} }, 350);
      if (rafId) cancelAnimationFrame(rafId);
    }
  };

  const tick = () => {
    if (finished) return;
    const elapsed = performance.now() - start;
    // 読み込み完了までは最大90%まで伸長、以降は100%へ
    const base = Math.min(1, elapsed / MIN_SHOW_MS);
    const targetBeforeLoad = 10 + base * 75; // 10% -> 85% 程度で推移
    const target = isLoaded ? (elapsed >= MIN_SHOW_MS ? 100 : 95) : Math.min(90, targetBeforeLoad);
    setBar(target);
    tryFinish();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  // ページ完全読込でフラグを立てる
  const onLoad = () => { isLoaded = true; tryFinish(); };
  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad, { once: true });
  }

  // フォールバック: 5秒で強制終了（万一loadが来ない環境対策）
  setTimeout(() => { isLoaded = true; tryFinish(); }, 5000);
}

// ---- Page-open intro -------------------------------------------------------
function setupIntro() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const played = sessionStorage.getItem('introDone') === '1';
  if (played || reduce) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 0);
    return;
  }
  const finish = () => {
    if (!overlay.isConnected) return;
    ensureTop();
    overlay.classList.add('intro-hide');
    sessionStorage.setItem('introDone','1');
    setTimeout(() => { try { overlay.remove(); } catch (_) {} }, 900);
  };
  // Auto-finish after duration
  setTimeout(finish, 1800);
  // Allow skip by click or key
  overlay.addEventListener('click', finish, { once: true });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
  }, { once: true });
}

// ---- Parallax for carousel background -------------------------------------
function setupParallax() {
  const bg = document.getElementById('carouselBg');
  const section = bg?.closest('.carousel-section');
  if (!bg || !section) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // 可視範囲にあるときのみ、セクション内の進捗に応じて上下に8%程度シフト
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const shift = (progress - 0.5) * 0.16 * vh; // -0.08vh .. +0.08vh相当
      bg.style.setProperty('--bg-shift', `${shift.toFixed(1)}px`);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

  // ---- Side bars grow with scroll -------------------------------------------
  // side bars now match hero height via CSS; no scroll sync needed

if (false) {
const SERVICES = [
  // 指定に基づく正しい組み合わせ（名称・URL・画像）
  { id: 1,  name: "Logopop",         url: "https://kaio724nobu.github.io/logo/",            img: "assets/1.png"  },
  { id: 2,  name: "SignCraft",       url: "https://kaio724nobu.github.io/sign/",            img: "assets/2.png"  },
  { id: 3,  name: "SoundScape",      url: "https://kaio724nobu.github.io/bgm/",             img: "assets/3.png"  },
  { id: 4,  name: "旅プランナー",     url: "https://kaio724nobu.github.io/tabi/",            img: "assets/4.jpg"  },
  { id: 5,  name: "彩り紙工房",       url: "https://kaio724nobu.github.io/paper/",           img: "assets/5.jpg"  },
  { id: 6,  name: "Randeverse",      url: "https://kaio724nobu.github.io/randeverce/",      img: "assets/6.jpg"  },
  { id: 7,  name: "Wakeup!",         url: "https://kaio724nobu.github.io/wakeup2/",         img: "assets/7.png"  },
  { id: 8,  name: "てまひま",         url: "https://kaio724nobu.github.io/temahima2/",       img: "assets/8.png"  },
  { id: 9,  name: "カスビジポータル", url: "https://kaio724nobu.github.io/kasubizi/",       img: "assets/9.png"  },
  { id: 10, name: "Weby",            url: "https://webysakigake.com/",   img: "assets/10.jpg" },
];

// カルーセルの表示順（10 → 9 → 1 → 2 → … → 8）
const CAROUSEL_ORDER = [10, 9, 1, 2, 3, 4, 5, 6, 7, 8];

const NEWS = [
  { date: "2025-09-24", title: "新ポータルを公開しました。", tag: "Info", link: "#" },
];

const SOCIALS = [
  { name: "X (Twitter)", label: "", url: "" },
  { name: "Instagram",   label: "", url: "" },
  { name: "YouTube",     label: "チャンネル", url: "" },
];


// ---- Utility --------------------------------------------------------------
const el = (tag, className, attrs = {}) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") e.textContent = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  return e;
};

// ---- カルーセル -----------------------------------------------------------
function buildCarousel() {
  const root = document.getElementById("carousel");
  const dotsRoot = document.getElementById("carouselDots");
  root.innerHTML = "";
  if (dotsRoot) dotsRoot.innerHTML = "";

  const ANIM_MS = 600;
  const INTERVAL_MS = 7000;

  // id → サービスのマップ
  const byId = new Map(SERVICES.map(s => [s.id, s]));
  const realData = CAROUSEL_ORDER.map(id => byId.get(id)).filter(Boolean);

  const makeSlide = (svc, opts = {}) => {
    const slide = el("div", "slide");
    if (opts.clone) slide.dataset.clone = String(opts.clone);
    const a = el("a", null, { href: svc.url, target: "_blank", rel: "noopener noreferrer", title: `${svc.name} を開く` });
    const img = el("img", null, { src: svc.img, alt: `${svc.name} のサムネイル` });
    img.addEventListener("error", () => {
      console.warn("img load failed:", img.src);
      const fallback = el("div", "fallback", { text: svc.name });
      a.innerHTML = "";
      a.appendChild(fallback);
    });
    // 画像ロード後も高さ固定のみ再適用（トリミングは行わない）
    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', () => { if (lockedHeight !== null) applyHeight(lockedHeight); }, { once: true });
    }
    a.appendChild(img);
    slide.appendChild(a);
    return slide;
  };

  // 無限ローテーション用に両端にクローンを配置
  const first = makeSlide(realData[0]);
  const last = makeSlide(realData[realData.length - 1]);
  root.appendChild(makeSlide(realData[realData.length - 1], { clone: "head" }));
  realData.forEach(svc => root.appendChild(makeSlide(svc)));
  root.appendChild(makeSlide(realData[0], { clone: "tail" }));

  const slides = () => Array.from(root.children);
  const SIZE_SCALE = 0.56; // さらに低く（約10%）
  let lockedHeight = null;
  const applyHeight = (h) => { slides().forEach(sl => sl.style.height = h + 'px'); };
  const sizeSlides = () => {
    // 既にロック済みなら、その値を適用して終わり
    if (lockedHeight !== null) { applyHeight(lockedHeight); return; }
    // 現在の中心スライドを基準に高さ算出
    const cur = slides()[index];
    const img = cur ? cur.querySelector('img') : null;
    if (img && img.naturalWidth > 0) {
      const sw = cur.clientWidth || root.clientWidth;
      const raw = Math.round(sw * (img.naturalHeight / img.naturalWidth) * SIZE_SCALE);
      const MIN_H = 220;
      const MAX_H = Math.max(520, Math.round(window.innerHeight * 0.6));
      lockedHeight = Math.max(MIN_H, Math.min(MAX_H, raw));
      applyHeight(lockedHeight);
      return;
    }
    // 画像が未ロードなら、ひとまず現在の見た目の高さを採用してロック
    const guessRaw = cur ? cur.clientHeight : Math.round(root.clientWidth * 9/16 * SIZE_SCALE);
    if (guessRaw > 0) {
      const MIN_H = 220;
      const MAX_H = Math.max(520, Math.round(window.innerHeight * 0.6));
      lockedHeight = Math.max(MIN_H, Math.min(MAX_H, guessRaw));
      applyHeight(lockedHeight);
    }
  };

  // ドット作成（実スライド数ぶん）
  let dots = [];
  if (dotsRoot) {
    dots = realData.map((svc, i) => {
      const b = el("button", "carousel-dot", { 'aria-label': `スライド ${i+1}` });
      b.addEventListener('click', () => {
        index = i + 1; // クローン分ずらす
        scrollToIndex(index, true);
        reset();
      });
      dotsRoot.appendChild(b);
      return b;
    });
  }

  const centerLeftFor = (target) => {
    const centerPad = (root.clientWidth - target.clientWidth) / 2;
    return target.offsetLeft - Math.max(0, centerPad);
  };

  const scrollToIndex = (i, smooth = true) => {
    const target = slides()[i];
    if (!target) return;
    root.scrollTo({ left: centerLeftFor(target), behavior: smooth ? 'smooth' : 'auto' });
    updateUI(i);
  };

  const realCount = realData.length;
  let index = 1; // 先頭クローンの次＝実スライド1枚目
  const updateDots = (i) => {
    if (!dots.length) return;
    const pos = ((i - 1 + realCount) % realCount); // 0..realCount-1
    dots.forEach((d, di) => d.classList.toggle('active', di === pos));
  };

  const updateBg = (i) => {
    const bg = document.getElementById('carouselBg');
    if (!bg) return;
    const realIdx = ((i - 1 + realCount) % realCount); // 0..realCount-1
    const svc = realData[realIdx];
    bg.style.backgroundImage = `url('${svc.img}')`;
  };

  const updateActive = (i) => {
    const total = slides().length;
    for (let k = 0; k < total; k++) {
      slides()[k].classList.toggle('active', k === i);
    }
  };

  const updateUI = (i) => {
    updateDots(i);
    updateBg(i);
    updateActive(i);
  };

  // 初期サイズ計算と位置（初回の見た目をロック）
  sizeSlides();
  // 初期描画完了後の高さを再取得して確定（レイアウト安定後に一度だけ）
  setTimeout(() => {
    if (lockedHeight === null) {
      const cur = slides()[index];
      const h = cur ? cur.clientHeight : 0;
      if (h > 0) { lockedHeight = h; applyHeight(lockedHeight); }
    }
  }, 60);
  scrollToIndex(index, false);

  const jumpIfClone = () => {
    const total = slides().length; // = realCount + 2
    if (index === total - 1) { // 末尾の先頭クローン
      index = 1;
      scrollToIndex(index, false);
    } else if (index === 0) { // 先頭の末尾クローン
      index = total - 2;
      scrollToIndex(index, false);
    }
  };

  // 自動スクロール（7秒ごとに右へ）
  const tick = () => {
    index += 1;
    scrollToIndex(index, true);
    // アニメ後にクローンへ到達していたらジャンプ
    setTimeout(jumpIfClone, ANIM_MS + 30);
  };
  let timer = setInterval(tick, INTERVAL_MS);

  // 操作で一時停止→再開
  const reset = () => { clearInterval(timer); timer = setInterval(tick, INTERVAL_MS); };
  root.addEventListener("pointerdown", reset);
  root.addEventListener("wheel", reset, { passive: true });
  // リサイズ時も高さは維持（再計算しない）
  window.addEventListener('resize', () => { if (lockedHeight !== null) applyHeight(lockedHeight); scrollToIndex(index, false); });

  // スクロールで中央スライドを追従判定（手動スワイプ時）
  let scrollT;
  root.addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      // 最も中央に近いスライドを探す
      const arr = slides();
      const center = root.scrollLeft + root.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      arr.forEach((sl, idx) => {
        const mid = sl.offsetLeft + sl.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; best = idx; }
      });
      index = best;
      updateUI(index);
      jumpIfClone();
    }, 120);
  }, { passive: true });

  // 矢印ナビ
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.addEventListener('click', () => { index -= 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); });
  if (next) next.addEventListener('click', () => { index += 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); });

  // キーボード操作（左右キー）
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { index -= 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); }
    if (e.key === 'ArrowRight') { index += 1; scrollToIndex(index, true); setTimeout(jumpIfClone, ANIM_MS+30); reset(); }
  });
}

// ---- 事業一覧 -------------------------------------------------------------
function buildServices() {
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = "";
  SERVICES.forEach((svc) => {
    const card = el("div", "service-card");
    const thumb = el("div", "service-thumb");
    const img = el("img", null, { src: svc.img, alt: `${svc.name} のイメージ` });
    img.addEventListener("error", () => {
      console.warn("img load failed:", img.src);
      thumb.innerHTML = `<div class="fallback">${svc.name}</div>`;
    });
    thumb.appendChild(img);
    const title = el("div", "service-title", { text: svc.name });
    const meta = el("p", "service-meta", { text: svc.url });
    const actions = el("div", "service-actions");
    const btn = el("a", "btn primary", { href: svc.url, target: "_blank", rel: "noopener noreferrer", text: "LPを開く" });
    actions.appendChild(btn);
    card.append(thumb, title, meta, actions);
    grid.appendChild(card);
  });
}

// ---- クリエイター（仮） ----------------------------------------------------
function buildCreators() {
  const grid = document.getElementById("creatorsGrid");
  grid.innerHTML = "";
  // 指定に合わせて2名に調整
  const placeholders = [
    { name: "細野 魁", role: "代表", links: ["https://kaio724nobu.github.io/hosonokaisong/"] },
    { name: "宮下 涼太", role: "副代表", links: [] },
  ];
  placeholders.forEach((c) => {
    const card = el("div", "creator-card");
    const name = el("div", "name", { text: c.name });
    const role = el("div", "muted small", { text: c.role });
    const links = el("div", "links");
    c.links.forEach((href, i) => {
      const label = (c.links.length === 1 && /^https?:/.test(href)) ? "公式サイト" : `Link ${i+1}`;
      const a = el("a", "btn subtle small", { href, target: /^https?:/.test(href) ? "_blank" : undefined, rel: "noopener", text: label });
      links.appendChild(a);
    });
    card.append(name, role, links);
    grid.appendChild(card);
  });
}

// ---- お知らせ --------------------------------------------------------------
function buildNews() {
  const list = document.getElementById("newsList");
  list.innerHTML = "";
  NEWS.forEach(n => {
    const li = el("li", "news-item");
    const date = el("div", "muted small", { text: n.date });
    const content = el("div");
    const a = el("a", null, { href: n.link, target: n.link.startsWith("http") ? "_blank" : undefined, rel: "noopener", text: n.title });
    const tag = el("span", "badge", { text: n.tag });
    content.append(a, document.createTextNode(" "), tag);
    li.append(date, content);
    list.appendChild(li);
  });
}

// ---- SNS（仮） -------------------------------------------------------------
function buildSNS() {
  const grid = document.getElementById("snsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const data = (typeof SOCIALS !== "undefined" && Array.isArray(SOCIALS)) ? SOCIALS : [];
  if (!data.length) {
    const p = el("p", "muted small", { text: "SNSリンクの設定がありません。" });
    grid.appendChild(p);
    return;
  }
  data.forEach(s => {
    const card = el("div", "sns-card");
    const row = el("div", "row");
    const left = el("div");
    left.appendChild(el("div", "service-title", { text: s.name || "SNS" }));
    left.appendChild(el("p", "service-meta", { text: s.label || (s.url || "") }));
    const right = el("div");
    let a;
    if (s.url && /^https?:/.test(s.url)) {
      a = el("a", "btn primary", { href: s.url, target: "_blank", rel: "noopener", text: s.action || "開く" });
    } else {
      a = el("button", "btn subtle", { text: s.action || "準備中" });
      a.setAttribute("disabled", "disabled");
    }
    right.appendChild(a);
    row.append(left, right);
    card.appendChild(row);
    grid.appendChild(card);
  });
}

// ---- Scroll Reveal ---------------------------------------------------------
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
      } else {
        e.target.classList.remove('revealed');
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ---- 初期化 ----------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  enhanceHeadline();
  enhanceBrandRoll();
  buildCarousel();
  buildServices();
  buildCreators();
  buildNews();
  buildSNS();
  setupReveal();
  setupParallax();
  setupHeroTabs();
});

// ---- Headline: per-character reveal ---------------------------------------
function enhanceHeadline() {
  const h = document.querySelector('.hero .headline');
  if (!h) return;
  const text = h.textContent || '';
  h.setAttribute('aria-label', text);
  h.setAttribute('role', 'heading');
  h.setAttribute('aria-level', '1');
  h.textContent = '';
  let i = 0;
  for (const ch of text) {
    if (ch === ' ') {
      h.appendChild(document.createTextNode(' '));
    } else {
      const span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', i++);
      span.textContent = ch;
      h.appendChild(span);
    }
  }
  // JSでタイプライター的に1文字ずつ不透明化（入場のたびに実行）
  const delayPerChar = 80; // ms (faster)
  const spans = [...h.querySelectorAll('.ch')];
  let timers = [];
  const clearTimers = () => { timers.forEach(t => clearTimeout(t)); timers = []; };
  const reset = () => { clearTimers(); spans.forEach(s => { s.style.opacity = '0'; }); h.classList.remove('shown'); };
  const play = () => {
    reset();
    spans.forEach((s, idx) => {
      timers.push(setTimeout(() => { s.style.opacity = '1'; }, idx * delayPerChar));
    });
    timers.push(setTimeout(() => { h.classList.add('shown'); }, spans.length * delayPerChar + 100));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        play();
      } else {
        reset();
      }
    });
  }, { threshold: 0.6 });
  io.observe(h);
}

// ---- Hero tabs: highlight active section ----------------------------------
function setupHeroTabs() {
  const tabs = Array.from(document.querySelectorAll('.hero-tab'));
  if (!tabs.length) return;
  const sections = Array.from(document.querySelectorAll('.tabbed'));
  const byId = new Map(sections.map(s => [s.id, s]));
  // Move sections into tab content container so they appear under hero
  const container = document.getElementById('tabContent');
  if (container) {
    sections.forEach(s => { container.appendChild(s); });
  }
  const activate = (id) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.target === id));
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    // オプション: URLハッシュを更新（スクロールはしない）
    history.replaceState(null, '', '#' + id);
  };
  tabs.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    const id = t.dataset.target;
    if (byId.has(id)) activate(id);
  }));
  // 初期表示（ハッシュがあれば尊重）
  const initial = location.hash ? location.hash.replace('#','') : 'about';
  activate(byId.has(initial) ? initial : 'about');

  // ヘッダーのナビゲーションもタブと同期
  const headerLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  headerLinks.forEach(a => {
    const id = (a.getAttribute('href') || '').replace('#','');
    if (!id) return;
    a.addEventListener('click', (e) => {
      if (byId.has(id)) {
        e.preventDefault();
        activate(id);
        const hero = document.getElementById('catch');
        if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ハッシュ変更時もアクティブ切替
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#','');
    if (byId.has(id)) activate(id);
  });
}

// ---- Subline brand roll-in -----------------------------------------------
function enhanceBrandRoll() {
  const t = document.querySelector('.subline .brand-roll');
  if (!t) return;
  const text = t.textContent || '';
  t.setAttribute('aria-label', text);
  t.textContent = '';
  let i = 0;
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'br-ch';
    span.style.setProperty('--i', i++);
    span.textContent = ch;
    t.appendChild(span);
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if (e.isIntersecting) {
        t.classList.add('revealed');
      } else {
        t.classList.remove('revealed');
      }
    });
  }, { threshold: 0.4 });
  io.observe(t);
}

// ---- Parallax for carousel background -------------------------------------
function setupParallax() {
  const bg = document.getElementById('carouselBg');
  const section = bg?.closest('.carousel-section');
  if (!bg || !section) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // 可視範囲にあるときのみ、セクション内の進捗に応じて上下に8%程度シフト
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const shift = (progress - 0.5) * 0.16 * vh; // -0.08vh .. +0.08vh相当
      bg.style.setProperty('--bg-shift', `${shift.toFixed(1)}px`);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

// ---- Side bars grow with scroll -------------------------------------------
// side bars now match hero height via CSS; no scroll sync needed
}
