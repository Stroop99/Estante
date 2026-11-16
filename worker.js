/**
 * Estante · servidor personal (Cloudflare Worker, plan gratuito)
 * Consulta bases que no aceptan peticiones directas desde una app web:
 *   - Hardcover (libros, requiere token gratuito)  -> secreto HARDCOVER_TOKEN
 *   - UPCitemdb (códigos de barras de tiendas, incluye cómics; sin clave, ~100/día)
 *   - Google Books con clave del servidor (opcional) -> secreto GOOGLE_KEY
 * Rutas:  /ping   /lookup?code=ISBN_o_UPC
 */
const ALLOWED_ORIGINS = ['https://stroop99.github.io', 'http://localhost:8765'];
const UA = 'Estante/1.1 (catalogo personal de libros; https://stroop99.github.io/Estante/)';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
    const url = new URL(request.url);

    if (url.pathname === '/ping') {
      return out({ ok: true, version: 1, hardcover: !!env.HARDCOVER_TOKEN, google: !!env.GOOGLE_KEY, upcitemdb: true });
    }
    if (url.pathname === '/lookup') {
      const code = String(url.searchParams.get('code') || '').replace(/[^0-9Xx]/g, '').toUpperCase();
      if (code.length < 8) return out({ error: 'Falta el parámetro code' }, 400);
      const isbn = toIsbn13(code);
      const jobs = [];
      if (isbn && env.GOOGLE_KEY) jobs.push(run('Google Books', () => google(isbn, env)));
      if (isbn) jobs.push(env.HARDCOVER_TOKEN ? run('Hardcover', () => hardcover(isbn, env)) : Promise.resolve({ name: 'Hardcover', status: 'skip', detail: 'Falta el secreto HARDCOVER_TOKEN en el Worker' }));
      jobs.push(run('UPCitemdb', () => upcitemdb(code)));
      return out({ code, sources: await Promise.all(jobs) });
    }
    return out({ error: 'Ruta no encontrada. Usa /ping o /lookup?code=' }, 404);
  },
};

/* ---------- utilidades ---------- */
class HttpError extends Error { constructor(http, msg) { super(msg || 'HTTP ' + http); this.http = http; } }
async function run(name, fn) {
  const t = Date.now();
  try {
    const data = await fn();
    return { name, status: data && data.title ? 'ok' : 'notfound', data: data || null, ms: Date.now() - t };
  } catch (e) {
    return { name, status: 'error', http: e.http || 0, detail: String(e.message || e).slice(0, 200), ms: Date.now() - t };
  }
}
function toIsbn13(c) {
  if (c.length === 13 && /^97[89]\d{10}$/.test(c)) { let t = 0; for (let i = 0; i < 13; i++) t += +c[i] * (i % 2 ? 3 : 1); return t % 10 === 0 ? c : null; }
  if (c.length === 10 && /^\d{9}[\dX]$/.test(c)) {
    let t = 0; for (let i = 0; i < 10; i++) t += (c[i] === 'X' ? 10 : +c[i]) * (10 - i); if (t % 11) return null;
    const b = '978' + c.slice(0, 9); let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); return b + ((10 - s % 10) % 10);
  }
  return null;
}
function toIsbn10(i13) {
  if (!i13.startsWith('978')) return null;
  const b = i13.slice(3, 12); let t = 0; for (let i = 0; i < 9; i++) t += +b[i] * (10 - i);
  const c = (11 - t % 11) % 11; return b + (c === 10 ? 'X' : c);
}
const year = s => (String(s || '').match(/\d{4}/) || [])[0];

/* ---------- Google Books (con clave del servidor) ---------- */
async function google(isbn, env) {
  const call = async q => {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${q}&maxResults=3&country=MX&key=${env.GOOGLE_KEY}`, { headers: { 'User-Agent': UA } });
    if (!r.ok) { let m = ''; try { m = (await r.json()).error?.message || ''; } catch { } throw new HttpError(r.status, m); }
    return r.json();
  };
  let d = await call(isbn);
  if (!d.items?.length) { const i10 = toIsbn10(isbn); if (i10) d = await call(i10); }
  const v = d.items?.[0]?.volumeInfo; if (!v) return null;
  return {
    title: v.title, subtitle: v.subtitle, authors: v.authors || [], publisher: v.publisher, year: year(v.publishedDate),
    pages: v.pageCount, categories: v.categories || [], language: v.language, description: v.description,
    cover: (v.imageLinks?.thumbnail || '').replace('http://', 'https://').replace('&edge=curl', ''),
  };
}

/* ---------- Hardcover (GraphQL) ---------- */
async function hardcover(isbn, env) {
  const token = env.HARDCOVER_TOKEN.trim().startsWith('Bearer') ? env.HARDCOVER_TOKEN.trim() : 'Bearer ' + env.HARDCOVER_TOKEN.trim();
  const i10 = toIsbn10(isbn);
  const where = i10 ? `{_or:[{isbn_13:{_eq:"${isbn}"}},{isbn_10:{_eq:"${i10}"}}]}` : `{isbn_13:{_eq:"${isbn}"}}`;
  const full = `{ editions(where:${where}, limit:1) { title subtitle pages release_date image { url } publisher { name } book { title subtitle description image { url } contributions { author { name } } } } }`;
  const basic = `{ editions(where:${where}, limit:1) { title pages release_date publisher { name } book { title subtitle contributions { author { name } } } } }`;
  const gql = async query => {
    const r = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token, 'User-Agent': UA },
      body: JSON.stringify({ query }),
    });
    if (!r.ok) throw new HttpError(r.status, (await r.text()).slice(0, 150));
    return r.json();
  };
  let d = await gql(full);
  if (d.errors) d = await gql(basic);           // por si algún campo cambió de nombre en su esquema
  if (d.errors) throw new Error('Hardcover: ' + (d.errors[0]?.message || 'error'));
  const e = d.data?.editions?.[0]; if (!e) return null;
  return {
    title: e.title || e.book?.title, subtitle: e.subtitle || e.book?.subtitle,
    authors: (e.book?.contributions || []).map(c => c.author?.name).filter(Boolean),
    publisher: e.publisher?.name, year: year(e.release_date), pages: e.pages,
    cover: e.image?.url || e.book?.image?.url || '', description: e.book?.description || '',
  };
}

/* ---------- UPCitemdb (plan de prueba gratuito, sin clave) ---------- */
async function upcitemdb(code) {
  const r = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`, { headers: { 'Accept': 'application/json', 'User-Agent': UA } });
  let d = {}; try { d = await r.json(); } catch { }
  if (r.status === 429 || d.code === 'TOO_FAST' || d.code === 'EXCEED_LIMIT') throw new HttpError(429, d.message || 'límite diario de UPCitemdb');
  if (!r.ok && r.status !== 404) throw new HttpError(r.status, d.message);
  const it = d.items?.[0]; if (!it) return null;
  const m = String(it.title || '').match(/^(.*?)\s+by\s+(.+)$/i);
  return {
    title: m ? m[1] : it.title, authors: m ? m[2].split(/,|&| and /).map(s => s.trim()).filter(Boolean) : [],
    publisher: it.publisher || it.brand || '', description: it.description || '', cover: (it.images || [])[0] || '',
  };
}
