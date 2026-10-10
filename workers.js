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
const SETTINGS_FILE = '.sys_settings.json';
const TURNSTILE_OFF_KEY = '.sys_turnstile_off';
const SESSION_PREFIX = '.session_';
const THROTTLE_PREFIX = '.throttle_';
const DIAG_PREFIX = '.diag_';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_DELETE_KEYS = 200;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const LIST_PAGE_SIZE = 1000;

// 自检端点按 IP 限流，避免被当成放大器的探测接口
const DIAG_MAX_CALLS = 10;
const DIAG_WINDOW_MS = 15 * 60 * 1000;

// siteverify 里代表「密钥本身有问题」的错误码 —— 请求方再努力也没用
const CONFIG_ERROR_CODES = ['missing-input-secret', 'invalid-input-secret', 'bad-request'];

// Cloudflare 侧故障：不是请求方能左右的，同样应当放行 + 告警，而不是把用户挡在门外
const REMOTE_FAILURE_CODES = ['network-error', 'internal-error'];

// 「非请求方原因」的完整集合 —— 探针分支与 token 分支共用同一份，避免两处判断逻辑漂移
const NON_REQUESTOR_CODES = CONFIG_ERROR_CODES.concat(REMOTE_FAILURE_CODES);

const TURNSTILE_HINTS = {
  'missing-input-response': '没有拿到验证 token：组件可能没渲染成功，或页面用的是旧配置。请强制刷新页面后重试。',
  'invalid-input-response': 'token 校验失败：最常见的原因是 Site Key 与 Secret Key 来自两个不同的 widget，请核对两把密钥是否同源。',
  'timeout-or-duplicate': 'token 已过期（有效期 300 秒）或被重复使用，请重新完成一次验证。',
  'missing-input-secret': '服务端没有配置 Secret Key。',
  'invalid-input-secret': 'Secret Key 无效，可能复制不完整，或与 Site Key 填反了。',
  'bad-request': '请求格式错误，Secret Key 可能填写不完整。',
  'internal-error': 'Cloudflare 验证服务内部故障，请稍后重试。',
  'network-error': '无法连接 Cloudflare 验证服务。',
};

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

    // 这两个必须公开：登录页要用，且「正因为配错而登不进去」的人也要能用
    if (path === '/api/turnstile/config' && method === 'GET') return await apiTurnstileConfig(env);
    if (path === '/api/turnstile/diagnose' && method === 'GET') return await apiTurnstileDiagnose(request, env);

    const session = await getSession(request, env);
    if (!session) return json({ error: '登录已过期，请重新登录', code: 'unauthorized' }, 401);

    if (path === '/api/settings' && method === 'GET') return await apiGetSettings(env);
    if (path === '/api/settings' && method === 'POST') return await apiUpdateSettings(request, env);
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

  // 顺序很重要：先查限流，再过人机验证，最后才比对口令。
  // 反过来的话，攻击者能用「不带 token 的请求」反复触发探针，把验证服务当放大器。
  const turnstile = await resolveTurnstileConfig(env);
  let warning = '';
  if (turnstile.enabled) {
    const verdict = await adjudicateTurnstile(
      String(body.cfToken || ''), turnstile.secretKey, turnstile.mode, ip, body.cfError
    );
    if (!verdict.pass) {
      // 验证失败也要计入限流
      const after = await bumpThrottle(env, ip);
      if (after.until > Date.now()) {
        return json({ error: '连续失败次数过多，已临时锁定 15 分钟' }, 429);
      }
      return json({
        error: '人机验证未通过',
        codes: verdict.codes,
        hint: hintForCodes(verdict.codes),
      }, 403);
    }
    warning = verdict.warning;
  }

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
  return json({ success: true, token: token, username: config.username, warning: warning });
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

/* ------------------------------------------------------------------ 设置与人机验证 */

async function readJson(env, key) {
  const object = await env.BUCKET.get(key);
  if (!object) return null;
  try {
    const value = await object.json();
    return value && typeof value === 'object' ? value : null;
  } catch (e) {
    return null;
  }
}

function putJson(env, key, value) {
  return env.BUCKET.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: 'application/json' },
  });
}

function readSettings(env) {
  return readJson(env, SETTINGS_FILE).then(function (value) { return value || {}; });
}

function writeSettings(env, settings) {
  // 剔除运行时内部标记，避免被展开后持久化成永久脏字段
  const clean = Object.assign({}, settings || {});
  delete clean.__turnstileOff;
  return putJson(env, SETTINGS_FILE, clean);
}

async function isTurnstileForceOff(env) {
  const object = await env.BUCKET.get(TURNSTILE_OFF_KEY);
  if (!object) return false;
  let text = '';
  try {
    text = String(await object.text()).trim();
  } catch (e) {
    return false;
  }
  return text !== '' && text !== '0';
}

/**
 * 人机验证配置的唯一出口。任何地方都不要再手写一遍「两把密钥是否都填了」的判断，
 * 否则破窗开关会在某些路径上失效（登录页渲染过一个加载不出来的组件）。
 *
 * 回退顺序：应用内设置 → 环境变量 → 未配置
 */
async function resolveTurnstileConfig(env) {
  const settings = await readSettings(env);
  const forceOff = await isTurnstileForceOff(env);
  const mode = settings.turnstileMode === 'lenient' ? 'lenient' : 'strict';

  const site = String(settings.turnstileSiteKey || '').trim();
  const secret = String(settings.turnstileSecretKey || '').trim();
  if (site && secret) {
    return { enabled: !forceOff, siteKey: site, secretKey: secret, mode: mode, source: 'settings', forceOff: forceOff };
  }

  const envSite = String(env.TURNSTILE_SITE_KEY || '').trim();
  const envSecret = String(env.TURNSTILE_SECRET_KEY || '').trim();
  if (envSite && envSecret) {
    return { enabled: !forceOff, siteKey: envSite, secretKey: envSecret, mode: mode, source: 'env', forceOff: forceOff };
  }

  return { enabled: false, siteKey: site || envSite, secretKey: '', mode: mode, source: 'none', forceOff: forceOff };
}

async function callSiteVerify(secretKey, token, ip) {
  const form = new FormData();
  form.append('secret', secretKey);
  form.append('response', token || '');
  if (ip && ip !== 'unknown') form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  try {
    return await res.json();
  } catch (e) {
    return { success: false, 'error-codes': ['bad-request'] };
  }
}

/**
 * 用「探针 token」区分两种情况：
 *  - 密钥坏了 / Cloudflare 侧故障（非请求方原因）→ configError = true，可以放行
 *  - 用户没做验证（请求方原因）→ configError = false，照常拦截
 * 探针只反映密钥自身的有效性与远端可用性，与请求方是谁无关，所以放行条件无法被攻击者制造。
 */
async function verifyTurnstile(token, secretKey, ip) {
  if (!secretKey) return { ok: true, codes: [], configError: false };

  if (!token) {
    try {
      const probe = await callSiteVerify(secretKey, 'XXXX.DUMMY.TOKEN.XXXX', ip);
      const codes = Array.isArray(probe['error-codes']) ? probe['error-codes'] : [];
      // 探针返回 internal-error / network-error 说明远端挂了，与请求方无关 → 同样放行
      const broken = codes.some(function (c) { return NON_REQUESTOR_CODES.indexOf(c) !== -1; });
      return {
        ok: false,
        codes: broken ? codes : ['missing-input-response'],
        configError: broken,
      };
    } catch (e) {
      return { ok: false, codes: ['network-error'], configError: true };
    }
  }

  try {
    const out = await callSiteVerify(secretKey, token, ip);
    const codes = Array.isArray(out['error-codes']) ? out['error-codes'] : [];
    const ok = Boolean(out.success);
    const configError = !ok && codes.some(function (c) {
      return NON_REQUESTOR_CODES.indexOf(c) !== -1;
    });
    return { ok: ok, codes: codes, configError: configError };
  } catch (e) {
    return { ok: false, codes: ['network-error'], configError: true };
  }
}

function hintForCodes(codes) {
  const list = Array.isArray(codes) ? codes : [];
  for (const code of list) {
    if (TURNSTILE_HINTS[code]) return TURNSTILE_HINTS[code];
  }
  return '人机验证未通过，请重新完成验证后重试。';
}

function buildTurnstileWarning(result, mode) {
  const list = Array.isArray(result.codes) ? result.codes : [];
  // 注意：展示用字符串与判定用数组必须分开命名，否则 join 之后再调 some 会抛 TypeError
  const codes = list.join(', ') || 'unknown';
  if (list.indexOf('network-error') !== -1 || list.indexOf('internal-error') !== -1) {
    return '人机验证服务暂时不可达，本次登录已放行（错误码：' + codes + '）。请稍后重试或检查网络。';
  }
  if (mode === 'lenient') {
    return '当前为人机验证宽松模式，校验失败已放行（错误码：' + codes + '）。建议排查配置后切回严格模式。';
  }
  return '人机验证密钥配置有误，本次登录已放行（错误码：' + codes + '）。请到设置页检查两把密钥是否来自同一个 widget。';
}

async function adjudicateTurnstile(token, secretKey, mode, ip, clientError) {
  // 客户端上报的错误码只写日志，绝不参与放行判断（那是请求体里可以随便伪造的字段）
  if (clientError) console.log('[turnstile] 客户端错误码: ' + String(clientError).slice(0, 32));

  const result = await verifyTurnstile(token, secretKey, ip);
  if (result.ok) return { pass: true, warning: '', codes: [] };
  if (!result.configError && mode !== 'lenient') {
    return { pass: false, warning: '', codes: result.codes };
  }
  return { pass: true, warning: buildTurnstileWarning(result, mode), codes: result.codes };
}

function maskKey(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (s.length <= 12) return '••••••••';
  return s.slice(0, 6) + '••••••••' + s.slice(-4);
}

async function bumpDiagCounter(env, ip) {
  const key = DIAG_PREFIX + ip;
  const now = Date.now();
  const record = (await readJson(env, key)) || { count: 0, resetAt: 0 };
  if (!record.resetAt || record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + DIAG_WINDOW_MS;
  }
  record.count = Number(record.count || 0) + 1;
  await putJson(env, key, record);
  return record;
}

/* ------------------------------------------------------------------ 人机验证相关接口 */

/** 公开接口：登录页据此决定是否渲染验证组件。只回显 Site Key（本就是公开值）。 */
async function apiTurnstileConfig(env) {
  const cfg = await resolveTurnstileConfig(env);
  return json({
    enabled: cfg.enabled,
    siteKey: cfg.enabled ? cfg.siteKey : '',
    mode: cfg.mode,
    source: cfg.source,
    forceOff: cfg.forceOff,
  });
}

/** 公开接口：给「正因为配错而登不进去」的人用，所以不能加在登录墙后面。 */
async function apiTurnstileDiagnose(request, env) {
  const ip = clientIp(request);
  const record = await bumpDiagCounter(env, ip);
  if (record.count > DIAG_MAX_CALLS) {
    return json({ error: '自检请求过于频繁，请 15 分钟后再试' }, 429);
  }

  const cfg = await resolveTurnstileConfig(env);
  const host = new URL(request.url).host;

  const out = {
    domain: host,
    source: cfg.source,
    forceOff: cfg.forceOff,
    enabled: cfg.enabled,
    mode: cfg.mode,
    siteKeyMasked: maskKey(cfg.siteKey),
    secretKeyMasked: maskKey(cfg.secretKey),
    secretKeyValid: null,
    codes: [],
    conclusion: '',
    hints: [],
  };

  if (cfg.forceOff) {
    out.conclusion = 'emergency-off';
    out.hints.push('人机验证已被破窗开关关闭。删除 R2 桶中的 ' + TURNSTILE_OFF_KEY + ' 对象即可恢复。');
    return json(out);
  }

  if (!cfg.siteKey || !cfg.secretKey) {
    out.conclusion = 'not-configured';
    out.hints.push('尚未配置 Site Key / Secret Key，登录页不会显示人机验证。可在设置页填写，或改用环境变量。');
    return json(out);
  }

  let probe;
  try {
    probe = await callSiteVerify(cfg.secretKey, 'XXXX.DUMMY.TOKEN.XXXX', ip);
  } catch (e) {
    probe = { 'error-codes': ['network-error'] };
  }
  const codes = Array.isArray(probe['error-codes']) ? probe['error-codes'] : [];
  out.codes = codes;

  if (codes.some(function (c) { return CONFIG_ERROR_CODES.indexOf(c) !== -1; })) {
    out.secretKeyValid = false;
    out.conclusion = 'secret-invalid';
    out.hints.push(hintForCodes(codes));
    out.hints.push('常见原因：Secret Key 复制不完整，或与 Site Key 填反了。');
    return json(out);
  }

  if (codes.indexOf('network-error') !== -1 || codes.indexOf('internal-error') !== -1) {
    out.conclusion = 'unreachable';
    out.hints.push('无法连接 Cloudflare 验证服务。此时登录会放行并给出告警，不会把管理员锁在门外。');
    return json(out);
  }

  out.secretKeyValid = true;
  out.conclusion = 'secret-ok';
  out.hints.push('Secret Key 有效。若登录页仍看不到验证框，请检查该 widget 的 Hostname Management 是否包含 ' + host
    + '（*.workers.dev 需要显式填写，通配符无效）。');
  out.hints.push('若验证框显示 Troubleshoot，请核对 Site Key 与 Secret Key 是否来自同一个 widget。');
  return json(out);
}

async function apiGetSettings(env) {
  const settings = await readSettings(env);          // 用原始设置，不合并破窗标记
  const cfg = await resolveTurnstileConfig(env);
  const secret = String(settings.turnstileSecretKey || '').trim();

  return json({
    turnstileSiteKey: String(settings.turnstileSiteKey || '').trim(),
    turnstileSecretKeySet: Boolean(secret),
    turnstileSecretKeyMasked: maskKey(secret),
    turnstileMode: cfg.mode,
    source: cfg.source,
    enabled: cfg.enabled,
    forceOff: cfg.forceOff,
    envFallback: {
      siteKeySet: Boolean(String(env.TURNSTILE_SITE_KEY || '').trim()),
      secretKeySet: Boolean(String(env.TURNSTILE_SECRET_KEY || '').trim()),
    },
  });
}

async function apiUpdateSettings(request, env) {
  const body = await safeJson(request);
  const settings = await readSettings(env);

  const currentSite = String(settings.turnstileSiteKey || '').trim();
  const currentSecret = String(settings.turnstileSecretKey || '').trim();

  // 字段不传 = 不修改；显式传空串 = 清空
  const site = body.siteKey === undefined ? currentSite : String(body.siteKey || '').trim();
  const secret = body.secretKey === undefined ? currentSecret : String(body.secretKey || '').trim();

  if ((site && !secret) || (!site && secret)) {
    return json({ error: 'Site Key 与 Secret Key 必须同时配置或同时清空。若要清空请点「清空」按钮。' }, 400);
  }

  if (site) {
    const pattern = /^0x[0-9A-Za-z_-]{10,}$/;
    if (!pattern.test(site) || !pattern.test(secret)) {
      return json({ error: '密钥格式看起来不对：Turnstile 密钥通常以 0x 开头且较长，请检查是否复制完整' }, 400);
    }
    if (site === secret) {
      return json({ error: 'Site Key 与 Secret Key 不能相同，可能把两个值填反或填成同一个了' }, 400);
    }
  }

  settings.turnstileSiteKey = site;
  settings.turnstileSecretKey = secret;
  if (body.mode === 'lenient' || body.mode === 'strict') settings.turnstileMode = body.mode;
  await writeSettings(env, settings);

  const cfg = await resolveTurnstileConfig(env);
  return json({ success: true, enabled: cfg.enabled, source: cfg.source, mode: cfg.mode });
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
  // 所有内部对象都以点号开头（.sys_config.json / .sys_settings.json /
  // .sys_turnstile_off / .session_* / .throttle_* / .diag_*），
  // 而上传的文件名在净化阶段已被去掉前导点，不会误伤。
  return String(key).charAt(0) === '.';
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
