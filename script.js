// Поведение страниц: меню, слайдер, карусели, счётчики, панель с ценами, форма звонка, счётчики Google.
// Сам HTML собирает сервер (render.js); данные для панели лежат в window.SITE.
const S = window.SITE;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const waLink = (text) => `https://wa.me/${S.brand.whatsapp}` + (text ? `?text=${encodeURIComponent(text)}` : "");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- шапка и меню ----------
function setupHeader() {
  const top = $("#top");
  const onScroll = () => top.classList.toggle("scrolled", scrollY > 8);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".burger");
  const nav = $("#mainnav");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  // на телефоне подменю раскрывается по нажатию на пункт со стрелкой
  $$(".has-sub > a", nav).forEach((a) => a.addEventListener("click", (e) => {
    if (!matchMedia("(max-width: 900px)").matches) return;
    const li = a.parentElement;
    if (!li.classList.contains("open")) {
      e.preventDefault();
      $$(".has-sub.open", nav).forEach((x) => x.classList.remove("open"));
      li.classList.add("open");
    }
  }));
  $$("a", nav).forEach((a) => a.addEventListener("click", (e) => {
    if (e.defaultPrevented) return; // нажатие на пункт с подменю только раскрывает его
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));
}

// ---------- первый экран: полоса слайдов, листается вбок (пальцем, мышью, стрелками, кнопками) ----------
function setupHero() {
  const hero = $("#hero");
  if (!hero) return;
  const track = $(".track", hero);
  const slides = $$(".hslide", hero);
  const dots = $$(".dot", hero);
  const n = slides.length;
  let cur = 0;
  const mark = (i) => {
    cur = i;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  };
  const go = (i) => track.scrollTo({ left: ((i + n) % n) * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== cur && i >= 0 && i < n) mark(i);
  }, { passive: true });
  addEventListener("resize", () => track.scrollTo({ left: cur * track.clientWidth, behavior: "auto" }));
  $$(".sl-btn", hero).forEach((b) => b.addEventListener("click", () => go(cur + Number(b.dataset.dir))));
  dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.go))));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
  });
  // мышь: тянем полосу влево-вправо (на телефоне и тачпаде работает прокрутка пальцем)
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("a, button")) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    track.classList.add("drag");
  });
  addEventListener("pointermove", (e) => { if (drag) track.scrollLeft = drag.left - (e.clientX - drag.x); });
  addEventListener("pointerup", () => {
    if (!drag) return;
    const moved = track.scrollLeft - drag.left;
    drag = null;
    track.classList.remove("drag");
    go(cur + (Math.abs(moved) > track.clientWidth * 0.15 ? Math.sign(moved) : 0));
  });
  // само листается раз в 7 секунд; останавливается, пока на слайдах мышь или палец
  if (!reduceMotion && n > 1) {
    let paused = false;
    ["mouseenter", "focusin", "touchstart"].forEach((ev) => hero.addEventListener(ev, () => { paused = true; }, { passive: true }));
    ["mouseleave", "focusout"].forEach((ev) => hero.addEventListener(ev, () => { paused = false; }));
    hero.addEventListener("touchend", () => setTimeout(() => { paused = false; }, 8000), { passive: true });
    setInterval(() => { if (!paused && !drag && !document.hidden) go(cur + 1); }, 7000);
  }
}

// ---------- карусели (отзывы, врачи) ----------
function setupCarousels() {
  $$("[data-carousel]").forEach((box) => {
    const track = $(".track", box);
    const cards = [...track.children];
    if (!cards.length) return;
    const count = $(".car-count", box);
    const step = () => cards[0].getBoundingClientRect().width + 20;
    const current = () => Math.min(cards.length, Math.round(track.scrollLeft / step()) + 1);
    const show = () => { count.textContent = `${current()} / ${cards.length}`; };
    const go = (dir) => {
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (dir > 0 && end) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: dir * step(), behavior: "smooth" });
    };
    $$(".car-btn", box).forEach((btn) => btn.addEventListener("click", () => go(Number(btn.dataset.dir))));
    track.addEventListener("scroll", show, { passive: true });
    const auto = Number(box.dataset.auto);
    if (auto && !reduceMotion) {
      let paused = false;
      ["mouseenter", "focusin", "touchstart"].forEach((ev) => box.addEventListener(ev, () => { paused = true; }, { passive: true }));
      ["mouseleave", "focusout"].forEach((ev) => box.addEventListener(ev, () => { paused = false; }));
      box.addEventListener("touchend", () => setTimeout(() => { paused = false; }, 8000), { passive: true });
      setInterval(() => { if (!paused && !document.hidden) go(1); }, auto);
    }
  });
}

// ---------- счётчики: цифры плавно растут, когда блок виден ----------
function setupCounters() {
  const els = $$("[data-count]");
  if (!els.length) return;
  const run = (el) => {
    const raw = el.dataset.count;
    const num = parseFloat(raw.replace(",", "."));
    if (Number.isNaN(num) || reduceMotion) return;
    const dec = (raw.split(/[,.]/)[1] || "").length;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      const v = num * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec).replace(".", ",");
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

// ---------- плавное появление при прокрутке ----------
function observeReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

// ---------- панель с ценами на главной: «проваливаемся» в направление ----------
function openSheet(i) {
  const item = S.services.items[i];
  $("#sheet-title").textContent = item.name;
  $("#sheet-body").innerHTML = item.prices.length
    ? item.prices.map((p) => `<div class="price-row"><span>${esc(p.name)}</span><b>${p.price ? esc(p.price) : '<span class="none">по запросу</span>'}</b></div>`).join("") +
      (S.services.note ? `<p class="note">${esc(S.services.note)}</p>` : "")
    : `<p class="muted">Список услуг скоро появится. Уточните по телефону.</p>`;
  $("#sheet-body").scrollTop = 0;
  $("#sheet-cta").href = waLink(`Здравствуйте! Интересует направление: ${item.name}`);
  $("#sheet-page").href = `/uslugi/${item.slug}`;
  $("#sheet").classList.add("open");
  $("#sheet").setAttribute("aria-hidden", "false");
}

function closeSheet() {
  $("#sheet").classList.remove("open");
  $("#sheet").setAttribute("aria-hidden", "true");
}

// ---------- поиск по прайс-листу ----------
function setupPriceSearch() {
  const input = $(".price-search");
  if (!input) return;
  const groups = $$(".price-group");
  const empty = $(".price-empty");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let any = false;
    groups.forEach((g) => {
      let hit = 0;
      $$(".price-row", g).forEach((r) => {
        const ok = !q || r.textContent.toLowerCase().includes(q);
        r.hidden = !ok;
        if (ok) hit++;
      });
      const nameHit = q && g.querySelector("summary").textContent.toLowerCase().includes(q);
      if (nameHit) $$(".price-row", g).forEach((r) => { r.hidden = false; });
      g.hidden = !!q && !hit && !nameHit;
      if (q && (hit || nameHit)) g.open = true;
      if (!g.hidden) any = true;
    });
    empty.hidden = any;
  });
}

// ---------- обратный звонок: откроется WhatsApp с готовым сообщением ----------
function setupCallback() {
  $$(".cb-form").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    open(waLink(`Здравствуйте! Прошу перезвонить. Имя: ${name}. Телефон: ${phone}.`), "_blank", "noopener");
    if (window.gtag) window.gtag("event", "generate_lead", { method: "callback_form" });
  }));
}

// Видео из файла: запускается по нажатию; при старте одного остальные ставятся на паузу
function setupFileVideos() {
  const all = $$(".video-file video");
  all.forEach((v) => v.addEventListener("play", () => all.forEach((o) => { if (o !== v) o.pause(); })));
}

// Google Analytics / Google Ads: включается, когда в админке вписан код (G-… или AW-…)
function setupTracking(id) {
  if (!/^(G|AW)-[A-Z0-9-]+$/i.test(id || "")) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
  // заявка: клик по WhatsApp или по телефону — конверсия для Google Ads
  document.addEventListener("click", (e) => {
    if (e.target.closest('a[href^="https://wa.me/"]')) window.gtag("event", "generate_lead", { method: "whatsapp" });
    else if (e.target.closest('a[href^="tel:"]')) window.gtag("event", "generate_lead", { method: "phone" });
  });
}

document.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile[data-i]");
  // обычный клик по плитке открывает панель; Ctrl/⌘-клик и роботы Google идут на страницу направления
  if (tile && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    openSheet(Number(tile.dataset.i));
  } else if (e.target.closest("[data-close]")) {
    closeSheet();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

setupHeader();
setupHero();
observeReveal();
setupCounters();
setupCarousels();
setupPriceSearch();
setupCallback();
setupFileVideos();
setupTracking(S.seo.googleTag);
