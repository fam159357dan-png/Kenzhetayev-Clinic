// Сборка страниц на сервере: Google получает готовый HTML каждой страницы.
// Данные берутся из window.SITE (data.js или правки из админки в KV).

const RU = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const slugify = (name) =>
  String(name).toLowerCase().replace(/[а-яё]/g, (c) => RU[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Адрес страницы направления: из поля slug или из названия; повторы получают номер
export function withSlugs(site) {
  const used = new Set();
  site.services.items.forEach((s, i) => {
    const base = slugify(s.slug || "") || slugify(s.name) || `napravlenie-${i + 1}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    s.slug = slug;
  });
  return site;
}

// Отдельные страницы сайта (кроме главной и страниц направлений)
export const PAGES = ["uslugi", "vrachi", "otzyvy", "o-klinike", "pacientam", "kontakty"];

export function pageFor(site, pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { type: "home" };
  const key = path.slice(1);
  if (PAGES.includes(key)) return { type: key };
  const m = path.match(/^\/uslugi\/([^/]+)$/);
  if (!m) return null;
  let slug;
  try {
    slug = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  const i = site.services.items.findIndex((s) => s.slug === slug);
  return i >= 0 ? { type: "service", i } : null;
}

// Значки: простые контурные рисунки 24×24 (цвет задаётся стилями)
const ICONS = {
  tooth: '<path d="M7.5 3.5C5 3.5 3.5 5.5 3.5 8c0 2.2 1 3.7 1.6 5.6.6 2 .8 5.2 2.2 6.6 1.2 1.1 2.1-.2 2.5-2.1.3-1.5.7-2.9 2.2-2.9s1.9 1.4 2.2 2.9c.4 1.9 1.3 3.2 2.5 2.1 1.4-1.4 1.6-4.6 2.2-6.6.6-1.9 1.6-3.4 1.6-5.6 0-2.5-1.5-4.5-4-4.5-1.7 0-2.7.9-4.5.9S9.2 3.5 7.5 3.5z"/>',
  scan: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><circle cx="12" cy="10" r="2.6"/>',
  sparkle: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  microscope: '<path d="M9 3l4 2-3 6-4-2z"/><path d="M11 10c3 .5 5 3 5 6a5 5 0 0 1-5 5H6"/><path d="M4 21h14"/>',
  cross: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  implant: '<path d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M10 14v1.5M14 14v1.5M9.5 17h5M10.5 19h3M11.2 21h1.6"/>',
  crown: '<path d="M4 18l1.5-10 4.5 4 2-7 2 7 4.5-4L20 18z"/><path d="M4 21h16"/>',
  braces: '<path d="M3 12h18"/><rect x="4.5" y="9" width="4" height="6" rx="1"/><rect x="10" y="9" width="4" height="6" rx="1"/><rect x="15.5" y="9" width="4" height="6" rx="1"/>',
  child: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h.01"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10h7M8.5 13h4"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
};
const icon = (name) => (ICONS[name] ? `<svg class="svg" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>` : esc(name));

const waLink = (S, text) => `https://wa.me/${S.brand.whatsapp}` + (text ? `?text=${encodeURIComponent(text)}` : "");
const mapLink = (b) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapQuery)}`;
const priceHtml = (p) => (p.price ? esc(p.price) : '<span class="none">по запросу</span>');
const rowsHtml = (prices) => prices.map((p) => `<div class="price-row"><span>${esc(p.name)}</span><b>${priceHtml(p)}</b></div>`).join("");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const abs = (origin, p) => (/^https?:\/\//.test(p) ? p : origin + p);
const initials = (name) => String(name).trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] ?? "").join("").toUpperCase();
const firstLetter = (name) => [...String(name).trim()][0]?.toUpperCase() ?? "";
const igId = (v) => esc(String(v.id).replace(/[^\w-]/g, ""));

// ---------- заголовки страниц и данные для Google ----------

function pageMeta(S, origin, page) {
  const b = S.brand;
  const rv = S.reviews;
  const at = (path, title, description) => ({ title: `${title} | ${b.name}`, description, url: `${origin}${path}` });
  switch (page.type) {
    case "service": {
      const s = S.services.items[page.i];
      return {
        title: `${s.name} в Петропавловске: цены | ${b.name}`,
        description: `${s.lead}. Цены на услуги направления «${s.name}» в клинике ${b.name}, Петропавловск. Запись через WhatsApp.`,
        url: `${origin}/uslugi/${s.slug}`,
      };
    }
    case "uslugi":
      return at("/uslugi", "Услуги и цены стоматологии в Петропавловске", "Полный прайс-лист: терапия под микроскопом, хирургия, имплантация, ортопедия, брекеты, детская стоматология и лечение под наркозом. Цены в тенге.");
    case "vrachi":
      return at("/vrachi", "Наши врачи", `${S.team.text} Запись на приём через WhatsApp.`);
    case "otzyvy":
      return at("/otzyvy", "Отзывы пациентов", `Отзывы пациентов о клинике ${b.name} из 2ГИС. Рейтинг ${rv.rating} из 5, 803 оценки и 710 отзывов.`);
    case "o-klinike":
      return at("/o-klinike", "О клинике", S.about.text.slice(0, 160));
    case "pacientam":
      return at("/pacientam", "Пациентам: как записаться и частые вопросы", S.patients.text);
    case "kontakty":
      return at("/kontakty", "Контакты и как добраться", `${b.address}. ${b.hours}. Телефон ${b.phone}.`);
    case "notfound":
      return { title: `Страница не найдена | ${b.name}`, description: S.seo.description, url: `${origin}/` };
    default:
      return { title: S.seo.title, description: S.seo.description, url: `${origin}/` };
  }
}

const CRUMB = { uslugi: "Услуги и цены", vrachi: "Наши врачи", otzyvy: "Отзывы", "o-klinike": "О клинике", pacientam: "Пациентам", kontakty: "Контакты" };

function head(S, origin, page) {
  const b = S.brand;
  const m = pageMeta(S, origin, page);
  const image = S.hero.slides?.find((s) => s.image)?.image || S.gallery?.items?.[0]?.image || b.logo;
  const clinic = {
    "@type": "Dentist",
    "@id": `${origin}/#clinic`,
    name: b.name,
    alternateName: b.legalName,
    url: `${origin}/`,
    description: S.seo.description,
    telephone: `+${b.whatsapp}`,
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Петропавловск", addressCountry: "KZ" },
    openingHours: b.openingHours,
    hasMap: mapLink(b),
    sameAs: [b.instagram, b.twogis],
  };
  if (b.logo) clinic.logo = abs(origin, b.logo);
  if (image) clinic.image = abs(origin, image);
  const graph = [clinic];
  if (page.type === "home") {
    graph.push({ "@type": "WebSite", url: `${origin}/`, name: b.name, inLanguage: "ru" });
  }
  if (page.type === "pacientam") {
    graph.push({
      "@type": "FAQPage",
      mainEntity: S.faq.items.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
    });
  }
  const crumbs = [];
  if (page.type === "service") {
    crumbs.push([CRUMB.uslugi, `${origin}/uslugi`], [S.services.items[page.i].name, m.url]);
  } else if (CRUMB[page.type]) {
    crumbs.push([CRUMB[page.type], m.url]);
  }
  if (crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [["Главная", `${origin}/`], ...crumbs].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
    });
  }
  return `<title>${esc(m.title)}</title>
  <meta name="description" content="${esc(m.description)}">
  <meta name="robots" content="${page.type === "notfound" ? "noindex" : "index, follow, max-image-preview:large"}">
  <link rel="canonical" href="${esc(m.url)}">
  <meta name="theme-color" content="#165a25">
  <meta property="og:title" content="${esc(m.title)}">
  <meta property="og:description" content="${esc(m.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(m.url)}">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="${esc(b.name)}">
  ${image ? `<meta property="og:image" content="${esc(abs(origin, image))}">` : ""}
  <script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

// ---------- шапка, подвал, общие блоки ----------

function header(S, page) {
  const b = S.brand;
  const cur = (key) => (page.type === key || (key === "uslugi" && page.type === "service") ? ' aria-current="page"' : "");
  return `<div class="topbar wrap">
      <a class="logo" href="/">${b.logoIcon ? `<img src="${esc(b.logoIcon)}" alt="Логотип ${esc(b.name)}" width="46" height="46">` : ""}<span class="logo-text">${esc(b.name)}<small>Стоматология · Петропавловск</small></span></a>
      <div class="top-actions">
        <a class="btn btn-outline btn-sm" href="${waLink(S)}" target="_blank" rel="noopener">Записаться на приём</a>
        <a class="btn btn-grad btn-sm" href="#callback">Обратный звонок</a>
        <a class="phone" href="tel:+${esc(b.whatsapp)}">${esc(b.phone)}</a>
      </div>
      <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mainnav"><span></span><span></span><span></span></button>
    </div>
    <div class="navbar wrap">
      <nav class="mainnav" id="mainnav" aria-label="Основное меню">
        <ul>
          <li class="has-sub"><a href="/o-klinike"${cur("o-klinike")}>О нас</a>
            <div class="sub"><a href="/o-klinike">О клинике</a><a href="/o-klinike#tech">Оборудование</a><a href="/o-klinike#gallery">Галерея</a><a href="/o-klinike#videos">Видео</a></div></li>
          <li class="has-sub"><a href="/uslugi"${cur("uslugi")}>Услуги и цены</a>
            <div class="sub"><a href="/uslugi">Весь прайс-лист</a>${S.services.items.map((s) => `<a href="/uslugi/${esc(s.slug)}">${esc(s.name)}</a>`).join("")}</div></li>
          <li><a href="/vrachi"${cur("vrachi")}>Наши врачи</a></li>
          <li><a href="/otzyvy"${cur("otzyvy")}>Отзывы</a></li>
          <li class="has-sub"><a href="/pacientam"${cur("pacientam")}>Пациентам</a>
            <div class="sub"><a href="/pacientam">Как записаться</a><a href="/pacientam#faq">Вопросы и ответы</a><a href="/pacientam#license">Лицензия</a></div></li>
          <li><a href="/kontakty"${cur("kontakty")}>Контакты</a></li>
        </ul>
        <div class="nav-mobile-cta"><a class="btn btn-grad" href="${waLink(S)}" target="_blank" rel="noopener">Записаться на приём</a><a class="phone" href="tel:+${esc(b.whatsapp)}">${esc(b.phone)}</a></div>
      </nav>
    </div>`;
}

function footer(S) {
  const b = S.brand;
  return `<div class="foot-wave" aria-hidden="true"></div>
    <div class="foot-body">
      <div class="wrap foot-grid">
        <div class="foot-brand">
          ${b.logo ? `<a class="foot-logo" href="/"><img src="${esc(b.logo)}" alt="${esc(b.name)}" loading="lazy"></a>` : ""}
          <p>${esc(b.legalName)}. ${esc(b.tagline)}.</p>
          <div class="socials">
            <a href="${esc(b.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>
            <a href="${esc(b.twogis)}" target="_blank" rel="noopener" aria-label="2ГИС">${icon("map")}</a>
            <a href="${waLink(S)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("chat")}</a>
          </div>
        </div>
        <div><h4>Услуги</h4>${S.services.items.map((s) => `<a href="/uslugi/${esc(s.slug)}">${esc(s.name)}</a>`).join("")}</div>
        <div><h4>Клиника</h4><a href="/o-klinike">О клинике</a><a href="/vrachi">Наши врачи</a><a href="/otzyvy">Отзывы</a><a href="/pacientam">Пациентам</a><a href="/kontakty">Контакты</a></div>
        <div><h4>Контакты</h4><p>${esc(b.address)}</p><p><a href="tel:+${esc(b.whatsapp)}">${esc(b.phone)}</a></p><p>${esc(b.hours)}</p></div>
      </div>
      <div class="wrap foot-note">
        <p>Имеются противопоказания. Необходима консультация специалиста. ${esc(b.licenseText || `Лицензия ${b.license}`)}</p>
        <p>© ${new Date().getFullYear()} ${esc(b.name)} · ${esc(b.legalName)} <a class="admin-link" href="/admin" rel="nofollow">Вход для персонала</a></p>
      </div>
    </div>`;
}

const sectionHead = (o, center = true) => `<div class="sec-head${center ? "" : " left"}"><h2 class="reveal">${esc(o.title)}</h2>${o.text ? `<p class="sub reveal">${esc(o.text)}</p>` : ""}</div>`;

function pageHead(S, title, lead, crumbs) {
  return `<section class="page-head">
      <div class="blob b1"></div><div class="blob b2"></div>
      <div class="wrap">
        <nav class="crumbs" aria-label="Путь"><a href="/">Главная</a>${crumbs.map(([t, h]) => ` › ${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join("")}</nav>
        <h1>${esc(title)}</h1>
        ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
      </div>
    </section>`;
}

function callback(S) {
  const c = S.callback;
  return `<section id="callback" class="callback">
      <div class="wrap">
        <div class="cb-card reveal">
          <div class="cb-text">
            <h2>${esc(c.title)}</h2>
            <p>${esc(c.text)}</p>
            <form class="cb-form" data-wa="${esc(S.brand.whatsapp)}">
              <input name="name" type="text" placeholder="Ваше имя" autocomplete="name" required>
              <input name="phone" type="tel" placeholder="Телефон" autocomplete="tel" required>
              <button class="btn btn-grad" type="submit">${esc(c.button)}</button>
            </form>
            <small>${esc(c.note)}</small>
          </div>
          ${c.image ? `<div class="cb-media"><img src="${esc(c.image)}" alt="" loading="lazy"></div>` : ""}
        </div>
      </div>
    </section>`;
}

function contacts(S) {
  const b = S.brand;
  const fc = S.finalCta;
  return `<section id="contacts" class="bg-mint">
      <div class="wrap">
        ${sectionHead({ title: "Как нас найти", text: fc.text })}
        <div class="contacts-grid">
          <div class="info-card reveal">
            <div class="info-row"><span class="ico-sm">${icon("pin")}</span><div><b>Адрес</b><p>${esc(b.address)}</p></div></div>
            <div class="info-row"><span class="ico-sm">${icon("phone")}</span><div><b>Телефон</b><p><a href="tel:+${esc(b.whatsapp)}">${esc(b.phone)}</a></p></div></div>
            <div class="info-row"><span class="ico-sm">${icon("clock")}</span><div><b>Режим работы</b><p>${esc(b.hours)}</p></div></div>
            <div class="actions left">
              <a class="btn btn-grad" href="${waLink(S)}" target="_blank" rel="noopener">${esc(fc.button)}</a>
              <a class="btn btn-ghost" href="${esc(mapLink(b))}" target="_blank" rel="noopener">Маршрут</a>
              <a class="btn btn-ghost" href="${esc(b.twogis)}" target="_blank" rel="noopener">2ГИС</a>
              <a class="btn btn-ghost" href="${esc(b.instagram)}" target="_blank" rel="noopener">Instagram</a>
            </div>
          </div>
          <iframe class="map reveal" title="Карта: ${esc(b.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(b.mapQuery)}&output=embed"></iframe>
        </div>
      </div>
    </section>`;
}

function carousel(cls, cards, auto) {
  return `<div class="carousel ${cls}" data-carousel${auto ? ` data-auto="${auto}"` : ""} role="region" aria-roledescription="карусель">
      <div class="track" tabindex="0">${cards.join("")}</div>
      <div class="car-ctl">
        <button class="car-btn" type="button" data-dir="-1" aria-label="Назад">←</button>
        <span class="car-count">1 / ${cards.length}</span>
        <button class="car-btn" type="button" data-dir="1" aria-label="Вперёд">→</button>
      </div>
    </div>`;
}

const reviewCard = (r) => `<article class="review"><p>«${esc(r.text)}»</p><div class="who"><span class="avatar">${esc(firstLetter(r.name))}</span><div><b>${esc(r.name)}</b><small>Отзыв из 2ГИС</small></div></div></article>`;

function doctorCard(S, d) {
  return `<article class="doc">
      <div class="doc-photo">${d.image ? `<img src="${esc(d.image)}" alt="${esc(d.name)}, ${esc(d.role)}" loading="lazy">` : `<span class="doc-initials">${esc(initials(d.name))}</span>`}</div>
      <h3>${esc(d.name)}</h3>
      <p class="doc-role">${esc(d.role)}</p>
      <p class="doc-text">${esc(d.text)}</p>
      <div class="doc-actions"><a class="btn btn-grad btn-sm" href="${waLink(S, `Здравствуйте! Хочу записаться к врачу: ${d.name}`)}" target="_blank" rel="noopener">${esc(S.team.button || "Записаться")}</a>${d.link ? `<a class="btn btn-ghost btn-sm" href="${esc(d.link)}" target="_blank" rel="noopener">Instagram</a>` : ""}</div>
    </article>`;
}

// ---------- страницы ----------

function hero(S) {
  const slides = S.hero.slides ?? [];
  return `<section class="hero" id="hero" role="region" aria-roledescription="карусель" aria-label="Главные предложения">
      <div class="track" tabindex="0">
        ${slides.map((s, i) => `
        <article class="hslide${i === 0 ? " active" : ""}" data-i="${i}" role="group" aria-label="${i + 1} из ${slides.length}">
          <svg class="hshape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M-6 -6H55L27 79L-6 30Z"/></svg>
          <div class="wrap hs-grid">
            <div class="hs-text">
              <span class="eyebrow">${esc(s.eyebrow)}</span>
              ${i === 0 ? `<h1>${esc(s.title)}</h1>` : `<p class="h1like">${esc(s.title)}</p>`}
              <p class="lead">${esc(s.text)}</p>
              <div class="actions left">
                <a class="btn btn-white" href="${waLink(S)}" target="_blank" rel="noopener">${esc(s.cta)}</a>
                <a class="btn btn-line" href="${esc(s.secondaryHref || "/uslugi")}">${esc(s.secondary)}</a>
              </div>
            </div>
            ${s.image ? `<div class="hs-img"><img src="${esc(s.image)}" alt="${esc(s.imageAlt || S.brand.name)}" draggable="false"${i === 0 ? "" : ' loading="lazy"'}></div>` : ""}
          </div>
        </article>`).join("")}
      </div>
      ${slides.length > 1 ? `<div class="wrap slider-ctl"><button class="sl-btn" type="button" data-dir="-1" aria-label="Предыдущий слайд">‹</button><div class="dots">${slides.map((_, i) => `<button type="button" class="dot${i === 0 ? " on" : ""}" data-go="${i}" aria-label="Слайд ${i + 1}"></button>`).join("")}</div><button class="sl-btn" type="button" data-dir="1" aria-label="Следующий слайд">›</button></div>` : ""}
    </section>`;
}

// одна карточка видео: ролик из файла (родной плеер) или Instagram-вставка
function videoCard(S, v) {
  const title = esc(v.title || "Видео " + S.brand.name);
  return v.file
    ? `<div class="video video-file"><video src="${esc(v.file)}" poster="${esc(v.poster || "")}" title="${title}" playsinline controls preload="none"></video></div>`
    : `<div class="video"><iframe src="https://www.instagram.com/reel/${igId(v)}/embed/" title="${title}" loading="lazy" allowfullscreen scrolling="no"></iframe></div>`;
}

function videosBlock(S, id, head) {
  const vids = (S.videos?.items ?? []).filter((v) => v.id || v.file);
  if (!vids.length) return "";
  return `<section id="${id}" class="bg-mint">
      <div class="wrap center">
        ${sectionHead(head ?? S.videos)}
        ${carousel("vids", vids.map((v) => videoCard(S, v)))}
        <div class="actions"><a class="btn btn-ghost" href="${esc(S.brand.instagram)}" target="_blank" rel="noopener">Все видео в Instagram</a></div>
      </div>
    </section>`;
}

function home(S) {
  const { brand: b, services: sv, popular: pp, why, team: tm, reviews: rv } = S;
  const gallery = S.gallery?.items?.filter((g) => g.image) ?? [];
  const docs = tm.items ?? [];
  const reviews = rv.items ?? [];
  return `
    ${hero(S)}

    <section id="services">
      <div class="wrap">
        ${sectionHead({ title: "Основные услуги", text: sv.text })}
        <div class="tiles">
          ${sv.items.map((x, i) => `
            <a class="tile reveal" href="/uslugi/${esc(x.slug)}" data-i="${i}" style="--d:${(i % 6) * 70}ms">
              <span class="tile-ico">${icon(x.icon)}</span>
              <b>${esc(x.name)}</b>
              <small>Подробнее</small>
            </a>`).join("")}
        </div>
      </div>
    </section>

    <section id="prices" class="bg-mint has-blob">
      <div class="blob b1"></div>
      <div class="wrap price-grid">
        <div class="price-intro reveal">
          <h2>${esc(pp.title)}</h2>
          <p>${esc(pp.text)}</p>
          <a class="btn btn-grad" href="/uslugi">${esc(pp.button)}</a>
        </div>
        <div class="price-card reveal">${pp.items.map((p) => `<div class="price-row"><span>${esc(p.name)}</span><b>${esc(p.price)}</b></div>`).join("")}</div>
      </div>
    </section>

    <section id="why">
      <div class="wrap">
        ${sectionHead(why)}
        <div class="why-grid">
          ${why.items.map((it, i) => `<div class="why-item reveal" style="--d:${(i % 2) * 80}ms"><span class="why-ico">${icon(it.icon)}</span><div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div></div>`).join("")}
        </div>
        ${why.stats?.length ? `<div class="stats">${why.stats.map((s) => `<div class="stat reveal"><b data-count="${esc(s.value)}">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
      </div>
    </section>

    ${docs.length ? `
    <section id="doctors" class="bg-mint">
      <div class="wrap">
        ${sectionHead(tm)}
        ${carousel("docs", docs.map((d) => doctorCard(S, d)))}
        <div class="actions"><a class="btn btn-ghost" href="/vrachi">Все врачи</a></div>
      </div>
    </section>` : ""}

    <section id="reviews">
      <div class="wrap center">
        ${sectionHead({ title: rv.title, text: rv.text })}
        <div class="rate-line reveal"><span class="stars" aria-hidden="true">★★★★★</span><b class="grad-text">${esc(rv.rating)}</b><small>из 5 в 2ГИС</small></div>
        ${reviews.length ? carousel("reviews", reviews.map(reviewCard), 5500) : ""}
        <div class="actions"><a class="btn btn-ghost" href="/otzyvy">Все отзывы</a><a class="btn btn-ghost" href="${esc(b.twogis)}" target="_blank" rel="noopener">${esc(rv.button)}</a></div>
      </div>
    </section>

    ${videosBlock(S, "reels", { title: "Клиника в видео", text: S.videos?.text })}

    ${gallery.length ? `
    <section id="gallery" class="bg-mint">
      <div class="wrap">
        ${sectionHead(S.gallery)}
        <div class="gallery">
          ${gallery.map((g) => `<figure class="reveal"><img src="${esc(g.image)}" alt="${esc(g.alt || b.name)}" loading="lazy"></figure>`).join("")}
        </div>
        <div class="actions"><a class="btn btn-ghost" href="${esc(b.instagram)}" target="_blank" rel="noopener">Больше в Instagram</a></div>
      </div>
    </section>` : ""}

    ${callback(S)}
    ${contacts(S)}`;
}

function servicesPage(S) {
  const sv = S.services;
  return `${pageHead(S, "Услуги и цены", sv.text, [["Услуги и цены"]])}
    <section>
      <div class="wrap">
        <div class="price-tools">
          <input class="price-search" type="search" placeholder="Найти услугу, например: имплантат" aria-label="Поиск по прайс-листу">
          <div class="chips">${sv.items.map((s) => `<a class="chip" href="#${esc(s.slug)}">${esc(s.name)}</a>`).join("")}</div>
        </div>
        <p class="price-empty" hidden>Ничего не найдено. Уточните услугу в WhatsApp.</p>
        ${sv.items.map((s) => `
        <details class="price-group reveal" id="${esc(s.slug)}" open>
          <summary><span class="tile-ico sm">${icon(s.icon)}</span><span><b>${esc(s.name)}</b><small>${esc(s.lead)}</small></span></summary>
          <div class="plist">${s.prices.length ? rowsHtml(s.prices) : '<p class="muted">Список услуг скоро появится. Уточните по телефону.</p>'}</div>
          <a class="more-link" href="/uslugi/${esc(s.slug)}">Страница направления →</a>
        </details>`).join("")}
        ${sv.note ? `<p class="note">${esc(sv.note)}</p>` : ""}
      </div>
    </section>
    ${callback(S)}`;
}

function doctorsPage(S) {
  const docs = S.team.items ?? [];
  return `${pageHead(S, S.team.title, S.team.text, [["Наши врачи"]])}
    <section>
      <div class="wrap"><div class="doc-grid">${docs.map((d) => `<div class="reveal">${doctorCard(S, d)}</div>`).join("")}</div></div>
    </section>
    ${callback(S)}`;
}

function reviewsPage(S) {
  const rv = S.reviews;
  const reviews = rv.items ?? [];
  return `${pageHead(S, rv.title, rv.text, [["Отзывы"]])}
    <section>
      <div class="wrap center">
        <div class="rate-line reveal"><span class="stars" aria-hidden="true">★★★★★</span><b class="grad-text">${esc(rv.rating)}</b><small>из 5 в 2ГИС</small></div>
        <div class="review-wall">${reviews.map((r) => `<div class="reveal">${reviewCard(r)}</div>`).join("")}</div>
        <div class="actions"><a class="btn btn-grad" href="${esc(S.brand.twogis)}" target="_blank" rel="noopener">${esc(rv.button)}</a></div>
      </div>
    </section>
    ${callback(S)}`;
}

function aboutPage(S) {
  const { about: a, tech: t, brand: b } = S;
  const gallery = S.gallery?.items?.filter((g) => g.image) ?? [];
  return `${pageHead(S, "О клинике", a.title, [["О клинике"]])}
    <section>
      <div class="wrap">
        <p class="about-text reveal">${esc(a.text)}</p>
        <div class="grid">${a.points.map((p) => `<div class="card reveal"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join("")}</div>
      </div>
    </section>
    <section id="tech" class="bg-mint">
      <div class="wrap">
        ${sectionHead(t)}
        <div class="grid">${t.items.map((i) => `<div class="card reveal"><h3>${esc(i.name)}</h3><p>${esc(i.text)}</p></div>`).join("")}</div>
      </div>
    </section>
    ${gallery.length ? `
    <section id="gallery">
      <div class="wrap">
        ${sectionHead(S.gallery)}
        <div class="gallery">${gallery.map((g) => `<figure class="reveal"><img src="${esc(g.image)}" alt="${esc(g.alt || b.name)}" loading="lazy"></figure>`).join("")}</div>
      </div>
    </section>` : ""}
    ${videosBlock(S, "videos")}
    <section id="license">
      <div class="wrap narrow"><div class="card license reveal"><span class="ico-sm">${icon("shield")}</span><div><h3>Лицензия</h3><p>${esc(b.licenseText || `Лицензия ${b.license}`)}</p></div></div></div>
    </section>
    ${callback(S)}`;
}

function patientsPage(S) {
  const p = S.patients;
  const f = S.faq;
  return `${pageHead(S, p.title, p.text, [["Пациентам"]])}
    <section id="zapis">
      <div class="wrap">
        ${sectionHead({ title: "Как записаться", text: "" })}
        <div class="steps">${p.steps.map((s, i) => `<div class="step reveal" style="--d:${i * 80}ms"><span class="step-n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join("")}</div>
        <div class="actions"><a class="btn btn-grad" href="${waLink(S)}" target="_blank" rel="noopener">Записаться в WhatsApp</a><a class="btn btn-ghost" href="tel:+${esc(S.brand.whatsapp)}">${esc(S.brand.phone)}</a></div>
      </div>
    </section>
    <section id="faq" class="bg-mint">
      <div class="wrap narrow">
        ${sectionHead({ title: f.title, text: "" })}
        <div class="faq">${f.items.map((q) => `<details class="reveal"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join("")}</div>
      </div>
    </section>
    <section id="license">
      <div class="wrap narrow"><div class="card license reveal"><span class="ico-sm">${icon("shield")}</span><div><h3>Лицензия</h3><p>${esc(S.brand.licenseText || `Лицензия ${S.brand.license}`)}</p></div></div></div>
    </section>
    ${callback(S)}`;
}

function contactsPage(S) {
  return `${pageHead(S, "Контакты", `${S.brand.address}. ${S.brand.hours}`, [["Контакты"]])}
    ${contacts(S)}
    ${callback(S)}`;
}

function servicePage(S, i) {
  const s = S.services.items[i];
  const others = S.services.items.map((x, j) => (j === i ? "" : `<a class="chip" href="/uslugi/${esc(x.slug)}">${esc(x.name)}</a>`)).join("");
  return `${pageHead(S, `${s.name}: услуги и цены в Петропавловске`, s.lead, [["Услуги и цены", "/uslugi"], [s.name]])}
    <section>
      <div class="wrap narrow">
        <div class="card plist reveal">${s.prices.length ? rowsHtml(s.prices) : '<p class="muted">Список услуг скоро появится. Уточните по телефону.</p>'}</div>
        ${S.services.note ? `<p class="note">${esc(S.services.note)}</p>` : ""}
        <div class="actions left">
          <a class="btn btn-grad" href="${waLink(S, `Здравствуйте! Интересует направление: ${s.name}`)}" target="_blank" rel="noopener">Записаться по этому направлению</a>
          <a class="btn btn-ghost" href="/uslugi">Весь прайс-лист</a>
        </div>
      </div>
    </section>
    <section class="bg-mint">
      <div class="wrap narrow">
        <h2>Другие направления</h2>
        <div class="chips">${others}</div>
      </div>
    </section>
    ${callback(S)}`;
}

function notFound() {
  return `
    <section class="page-head">
      <div class="blob b1"></div><div class="blob b2"></div>
      <div class="wrap center">
        <h1>Страница не найдена</h1>
        <p class="lead">Возможно, ссылка устарела. Вернитесь на главную страницу.</p>
        <div class="actions"><a class="btn btn-white" href="/">На главную</a></div>
      </div>
    </section>`;
}

const SHEET = `
  <div class="sheet" id="sheet" aria-hidden="true">
    <div class="scrim" data-close></div>
    <aside class="panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="panel-head">
        <h3 id="sheet-title"></h3>
        <button class="x" data-close aria-label="Закрыть">✕</button>
      </div>
      <div class="panel-body" id="sheet-body"></div>
      <div class="panel-foot">
        <a class="btn btn-grad wide" id="sheet-cta" target="_blank" rel="noopener">Записаться по этому направлению</a>
        <a class="more-link" id="sheet-page" href="/uslugi">Страница направления →</a>
      </div>
    </aside>
  </div>`;

const BODY = { service: (S, p) => servicePage(S, p.i), home, uslugi: servicesPage, vrachi: doctorsPage, otzyvy: reviewsPage, "o-klinike": aboutPage, pacientam: patientsPage, kontakty: contactsPage, notfound: notFound };

export function renderPage(S, origin, page) {
  const body = BODY[page.type](S, page);
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${head(S, origin, page)}
  <link rel="icon" href="${esc(S.brand.logoIcon || "data:,")}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
</head>
<body>
  <header class="top" id="top">${header(S, page)}</header>
  <main id="app">${body}</main>
  <footer class="foot" id="foot">${footer(S)}</footer>
  <a class="fab" href="${waLink(S)}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp">${icon("chat")}</a>
  ${SHEET}
  <script>window.SITE=${json(S)};</script>
  <script src="/script.js" defer></script>
</body>
</html>
`;
}
