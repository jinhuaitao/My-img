/**
 * Cloudflare Workers 图床 · v9.0
 *
 * 相比 v8.8 的变化：
 *  - 鉴权：随机会话 token（64 位 hex）+ 服务端会话表 + 30 天过期 + 登出吊销
 *  - 口令：加盐 SHA-256 存储，旧明文配置在首次登录时自动升级
 *  - 限流：同一 IP 连续失败 5 次锁定 15 分钟
 *  - 上传：MIME 白名单 + 20MB 上限 + 文件名净化（去前导点 / 截断 / 防重名）
 *  - 列表：游标分页，不再被 1000 条上限截断
 *  - 安全：/file/ 加 nosniff，SVG 加 CSP 沙箱；API 响应 no-store
 *  - 前端：见 ui.js（自建设计系统，无 Tailwind / Font Awesome 依赖）
 */

import PAGE_HTML from './ui.js';

const CONFIG_FILE = '.sys_config.json';
const SESSION_PREFIX = '.session_';
const THROTTLE_PREFIX = '.throttle_';
const INTERNAL_PREFIXES = [SESSION_PREFIX, THROTTLE_PREFIX];

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_DELETE_KEYS = 200;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const LIST_PAGE_SIZE = 1000;

const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp',
  ico: 'image/x-icon', svg: 'image/svg+xml',
};
const ALLOWED_MIME = Object.values(MIME_BY_EXT);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/file/')) return serveFile(request, env, url);
    if (path.startsWith('/api/')) return handleApi(request, env, url);

    return new Response(PAGE_HTML, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

/* ------------------------------------------------------------------ 静态文件 */

async function serveFile(request, env, url) {
  let key = '';
  try {
    key = decodeURIComponent(url.pathname.slice('/file/'.length));
  } catch (e) {
    return new Response('Bad request', { status: 400 });
  }
  if (!key || isInternalKey(key)) return new Response('Forbidden', { status: 403 });

  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('X-Content-Type-Options', 'nosniff');

  // SVG 可以内嵌脚本，用 CSP 沙箱隔离，避免存储型 XSS
  const type = String(headers.get('Content-Type') || '');
  if (type.indexOf('svg') !== -1) {
    headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
  }
  return new Response(object.body, { headers });
}

/* ------------------------------------------------------------------ API 路由 */

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    if (path === '/api/status' && method === 'GET') return await apiStatus(request, env);
    if (path === '/api/setup' && method === 'POST') return await apiSetup(request, env);
    if (path === '/api/login' && method === 'POST') return await apiLogin(request, env);
    if (path === '/api/logout' && method === 'POST') return await apiLogout(request, env);

    const session = await getSession(request, env);
    if (!session) return json({ error: '登录已过期，请重新登录', code: 'unauthorized' }, 401);

    if (path === '/api/list' && method === 'GET') return await apiList(env, url);
    if (path === '/api/upload' && method === 'POST') return await apiUpload(request, env);
    if (path === '/api/delete' && method === 'POST') return await apiDelete(request, env);
    if (path === '/api/password' && method === 'POST') return await apiPassword(request, env, session);

    return json({ error: '接口不存在' }, 404);
  } catch (err) {
    return json({ error: '服务器内部错误', message: String((err && err.message) || err) }, 500);
  }
}

async function apiStatus(request, env) {
  const config = await readConfig(env);
  if (!config) return json({ setup: false, authed: false });
  const session = await getSession(request, env);
  return json({ setup: true, authed: Boolean(session), username: config.username });
}

async function apiSetup(request, env) {
  if (await readConfig(env)) return json({ error: '系统已完成初始化' }, 403);

  const body = await safeJson(request);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const invalid = validateCredentials(username, password);
  if (invalid) return json({ error: invalid }, 400);

  await writeConfig(env, await makeConfig(username, password));
  const token = await createSession(env, username);
  return json({ success: true, token, username });
}

async function apiLogin(request, env) {
  const config = await readConfig(env);
  if (!config) return json({ error: '系统尚未初始化' }, 400);

  const ip = clientIp(request);
  const record = await readThrottle(env, ip);
  if (record && record.until > Date.now()) {
    const wait = Math.ceil((record.until - Date.now()) / 1000);
    return json({ error: '尝试次数过多，请 ' + Math.ceil(wait / 60) + ' 分钟后再试', retryAfter: wait }, 429);
  }

  const body = await safeJson(request);
  const username = String(body.username || '');
  const password = String(body.password || '');
  const matched = safeEqual(username, config.username) && (await verifyPassword(config, password));

  if (!matched) {
    const after = await bumpThrottle(env, ip);
    if (after.until > Date.now()) {
      const wait = Math.ceil((after.until - Date.now()) / 1000);
      return json({ error: '连续失败次数过多，已临时锁定 15 分钟', retryAfter: wait }, 429);
    }
    const left = Math.max(0, LOGIN_MAX_FAILS - after.count);
    return json({ error: '用户名或密码错误，还可尝试 ' + left + ' 次' }, 401);
  }

  await clearThrottle(env, ip);
  // 兼容 v8.x 的明文配置：登录成功后自动升级为加盐哈希
  if (!config.hash) await writeConfig(env, await makeConfig(config.username, password));

  const token = await createSession(env, config.username);
  return json({ success: true, token, username: config.username });
}

async function apiLogout(request, env) {
  const raw = String(request.headers.get('Authorization') || '').trim();
  if (isTokenShaped(raw)) await env.BUCKET.delete(SESSION_PREFIX + raw).catch(function () {});
  return json({ success: true });
}

async function apiList(env, url) {
  let cursor = url.searchParams.get('cursor') || undefined;
  const files = [];
  let truncated = false;
  let guard = 0;

  // 正常情况下一次 list 即可；仅当整页都被内部 key 占满时继续翻页，避免出现空列表
  do {
    const options = { limit: LIST_PAGE_SIZE };
    if (cursor) options.cursor = cursor;

    const result = await env.BUCKET.list(options);
    for (const item of result.objects) {
      if (isInternalKey(item.key)) continue;
      files.push({
        key: item.key,
        size: item.size,
        uploaded: toIso(item.uploaded),
      });
    }
    truncated = Boolean(result.truncated);
    cursor = truncated ? result.cursor : undefined;
    guard++;
  } while (truncated && files.length === 0 && guard < 5);

  return json({ files: files, cursor: truncated ? cursor : null });
}

async function apiUpload(request, env) {
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: '没有收到文件' }, 400);

  const size = Number(file.size || 0);
  if (size <= 0) return json({ error: '文件内容为空' }, 400);
  if (size > MAX_UPLOAD_BYTES) {
    return json({ error: '文件超过 ' + Math.round(MAX_UPLOAD_BYTES / 1024 / 1024) + 'MB 上限' }, 413);
  }

  const type = detectType(file);
  if (!type) return json({ error: '不支持的文件类型，仅允许常见图片格式' }, 415);

  const key = Date.now() + '_' + sanitizeName(file.name);
  await env.BUCKET.put(key, file, { httpMetadata: { contentType: type } });

  return json({ success: true, file: { key: key, size: size, uploaded: new Date().toISOString() } });
}

async function apiDelete(request, env) {
  const body = await safeJson(request);
  let keys = Array.isArray(body.keys) ? body.keys : (body.key ? [body.key] : []);
  keys = keys.filter(function (k) { return typeof k === 'string' && k && !isInternalKey(k); });

  if (!keys.length) return json({ error: '没有可删除的对象' }, 400);
  if (keys.length > MAX_DELETE_KEYS) return json({ error: '单次最多删除 ' + MAX_DELETE_KEYS + ' 个对象' }, 400);

  await env.BUCKET.delete(keys);
  return json({ success: true, deleted: keys.length });
}

async function apiPassword(request, env, session) {
  const config = await readConfig(env);
  if (!config) return json({ error: '系统尚未初始化' }, 400);

  const body = await safeJson(request);
  if (!(await verifyPassword(config, String(body.currentPassword || '')))) {
    return json({ error: '当前密码不正确' }, 400);
  }

  const username = String(body.username || config.username).trim();
  const password = String(body.password || '');
  const invalid = validateCredentials(username, password);
  if (invalid) return json({ error: invalid }, 400);

  await writeConfig(env, await makeConfig(username, password));

  // 改密后吊销其它设备上的会话
  let revoked = 0;
  try {
    const list = await env.BUCKET.list({ prefix: SESSION_PREFIX, limit: 1000 });
    const stale = list.objects
      .map(function (o) { return o.key; })
      .filter(function (k) { return k !== SESSION_PREFIX + session.token; });
    if (stale.length) {
      await env.BUCKET.delete(stale);
      revoked = stale.length;
    }
  } catch (e) { /* 吊销失败不影响改密结果 */ }

  return json({ success: true, revoked: revoked });
}

/* ------------------------------------------------------------------ 鉴权 */

async function readConfig(env) {
  const object = await env.BUCKET.get(CONFIG_FILE);
  if (!object) return null;
  try {
    return await object.json();
  } catch (e) {
    return null;
  }
}

function writeConfig(env, config) {
  return env.BUCKET.put(CONFIG_FILE, JSON.stringify(config), {
    httpMetadata: { contentType: 'application/json' },
  });
}

async function makeConfig(username, password) {
  const salt = randomHex(16);
  return {
    version: 2,
    username: username,
    salt: salt,
    hash: await sha256Hex(salt + ':' + password),
    createdAt: Date.now(),
  };
}

async function verifyPassword(config, password) {
  if (!config) return false;
  if (config.hash && config.salt) {
    return safeEqual(await sha256Hex(config.salt + ':' + password), config.hash);
  }
  if (typeof config.password === 'string') return safeEqual(config.password, password);
  return false;
}

async function createSession(env, username) {
  const token = randomHex(32);
  await env.BUCKET.put(
    SESSION_PREFIX + token,
    JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS }),
    { httpMetadata: { contentType: 'application/json' } }
  );
  return token;
}

async function getSession(request, env) {
  const raw = String(request.headers.get('Authorization') || '').trim();
  if (!isTokenShaped(raw)) return null;

  const object = await env.BUCKET.get(SESSION_PREFIX + raw);
  if (!object) return null;

  let payload = null;
  try {
    payload = await object.json();
  } catch (e) {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    await env.BUCKET.delete(SESSION_PREFIX + raw).catch(function () {});
    return null;
  }
  return { token: raw, username: payload.u, exp: payload.exp };
}

function isTokenShaped(value) {
  return /^[0-9a-f]{64}$/.test(String(value || ''));
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
}

async function readThrottle(env, ip) {
  const object = await env.BUCKET.get(THROTTLE_PREFIX + ip);
  if (!object) return null;
  try {
    const value = await object.json();
    return value && typeof value === 'object' ? value : null;
  } catch (e) {
    return null;
  }
}

async function bumpThrottle(env, ip) {
  const record = (await readThrottle(env, ip)) || { count: 0, until: 0 };
  if (record.until && record.until < Date.now()) {
    record.count = 0;
    record.until = 0;
  }
  record.count = Number(record.count || 0) + 1;
  if (record.count >= LOGIN_MAX_FAILS) record.until = Date.now() + LOGIN_LOCK_MS;
  await env.BUCKET.put(THROTTLE_PREFIX + ip, JSON.stringify(record), {
    httpMetadata: { contentType: 'application/json' },
  });
  return record;
}

function clearThrottle(env, ip) {
  return env.BUCKET.delete(THROTTLE_PREFIX + ip).catch(function () {});
}

/* ------------------------------------------------------------------ 工具 */

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

function randomHex(byteLength) {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

function toHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function validateCredentials(username, password) {
  if (username.length < 2 || username.length > 32) return '用户名需为 2-32 个字符';
  if (password.length < 6) return '密码至少 6 位';
  if (password.length > 128) return '密码过长';
  return null;
}

function isInternalKey(key) {
  if (key === CONFIG_FILE) return true;
  for (const prefix of INTERNAL_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

function detectType(file) {
  const declared = String(file.type || '').toLowerCase();
  if (ALLOWED_MIME.indexOf(declared) !== -1) return declared;
  const name = String(file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  return MIME_BY_EXT[name.slice(dot + 1)] || null;
}

function sanitizeName(name) {
  let base = String(name || '');
  const slash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
  if (slash >= 0) base = base.slice(slash + 1);
  base = base
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^[._]+/, '');

  if (base.length > 120) {
    const dot = base.lastIndexOf('.');
    if (dot > 0 && base.length - dot <= 12) {
      base = base.slice(0, 120 - (base.length - dot)) + base.slice(dot);
    } else {
      base = base.slice(0, 120);
    }
  }
  return base || 'image_' + Date.now();
}

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  return String(value);
}

async function safeJson(request) {
  try {
    const value = await request.json();
    return value && typeof value === 'object' ? value : {};
  } catch (e) {
    return {};
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}
