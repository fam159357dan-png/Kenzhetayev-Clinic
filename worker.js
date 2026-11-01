// Сайт клиники: страницы собираются на сервере из данных (для Google), правки хранятся в Cloudflare KV
// и редактируются в /admin. Пароль задаётся секретом: npx wrangler secret put ADMIN_PASSWORD (логин всегда "admin").
import { renderPage, pageFor, withSlugs, PAGES } from "./render.js";

const authorized = (request, env) =>
  !!env.ADMIN_PASSWORD && request.headers.get("Authorization") === "Basic " + btoa("admin:" + env.ADMIN_PASSWORD);

const challenge = () =>
  new Response("Нужен пароль", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' } });

const MAX_BYTES = 300_000;
const MAX_IMAGE = 3_000_000;
const MAX_FAILS = 10; // неверных паролей с одного адреса за 15 минут

// Данные сайта: правки из KV, а если их ещё не было — стартовые из data.js
async function loadSite(request, env) {
  const saved = await env.SITE_KV.get("site");
  if (saved) return withSlugs(JSON.parse(saved));
  const text = await (await env.ASSETS.fetch(new URL("/data.js", request.url))).text();
  return withSlugs(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
}

const xml = (body) => new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Главная, внутренние страницы и страницы направлений: готовый HTML
    const isPage = pathname === "/" || pathname.startsWith("/uslugi/") || PAGES.some((p) => pathname === `/${p}` || pathname === `/${p}/`);
    if (isPage) {
      const site = await loadSite(request, env);
      const page = pageFor(site, pathname) ?? { type: "notfound" };
      return new Response(renderPage(site, url.origin, page), {
        status: page.type === "notfound" ? 404 : 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" },
      });
    }

    // Для Google: карта сайта (все страницы направлений) и правила обхода
    if (pathname === "/sitemap.xml") {
      const site = await loadSite(request, env);
      const urls = [`${url.origin}/`, ...PAGES.map((p) => `${url.origin}/${p}`), ...site.services.items.map((s) => `${url.origin}/uslugi/${s.slug}`)];
      return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join("")}</urlset>\n`);
    }
    if (pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // Фото, загруженные в админке (хранятся в KV, адрес у каждого свой, поэтому кэшируем надолго)
    if (pathname.startsWith("/media/")) {
      const { value, metadata } = await env.SITE_KV.getWithMetadata(`img:${pathname.slice(7)}`, "arrayBuffer");
      if (!value) return new Response("Not found", { status: 404 });
      return new Response(value, { headers: { "Content-Type": metadata?.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    }

    // Данные для админки: если в KV есть правки — отдаём их вместо файла data.js.
    if (pathname === "/data.js") {
      const saved = await env.SITE_KV.get("site");
      if (!saved) return env.ASSETS.fetch(request);
      return new Response(`window.SITE = ${saved};\n`, {
        headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    if (!pathname.startsWith("/api/") && pathname !== "/admin") return env.ASSETS.fetch(request);

    // Вход в админку: после 10 неверных паролей подряд — пауза 15 минут
    const failKey = `fail:${request.headers.get("CF-Connecting-IP") || "local"}`;
    const fails = Number(await env.SITE_KV.get(failKey)) || 0;
    if (fails >= MAX_FAILS) return new Response("Слишком много попыток входа. Подождите 15 минут.", { status: 429 });
    if (!authorized(request, env)) {
      if (request.headers.get("Authorization")) await env.SITE_KV.put(failKey, String(fails + 1), { expirationTtl: 900 });
      return challenge();
    }

    if (pathname === "/api/upload" && request.method === "POST") {
      const type = request.headers.get("Content-Type") || "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return new Response("Нужна картинка JPG, PNG или WebP", { status: 415 });
      const data = await request.arrayBuffer();
      if (data.byteLength > MAX_IMAGE) return new Response("Фото слишком большое", { status: 413 });
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await env.SITE_KV.put(`img:${id}`, data, { metadata: { type } });
      return Response.json({ url: `/media/${id}` });
    }

    if (pathname === "/api/site" && request.method === "PUT") {
      const body = await request.text();
      if (body.length > MAX_BYTES) return new Response("Слишком большой объём", { status: 413 });
      let site;
      try {
        site = JSON.parse(body);
      } catch {
        return new Response("Неверные данные", { status: 400 });
      }
      const need = ["seo", "brand", "about", "tech", "finalCta", "popular", "why", "team", "reviews", "patients", "callback"];
      if (!site || need.some((k) => !site[k]) || !site.hero?.slides?.length || !site.services?.items || !site.faq?.items) {
        return new Response("Не хватает основных разделов", { status: 400 }); // иначе сайт сломается
      }
      await env.SITE_KV.put("site", body);
      return Response.json({ ok: true });
    }

    return env.ASSETS.fetch(request); // /admin -> admin.html
  },
};
