interface Env {
  GH_TOKEN: string;
  GITHUB_CLIENT_ID: string;
  SESSION_SECRET: string;
}

const OWNER = 'turbodiazzz-star';
const REPO = 'powerlog-data';
const ORIGIN = 'https://turbodiazzz-star.github.io';

function cors(request: Request) {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': origin === ORIGIN ? ORIGIN : ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    Vary: 'Origin',
  };
}

function response(request: Request, body: BodyInit | null, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(cors(request))) headers.set(key, value);
  return new Response(body, { ...init, headers });
}

function cookies(request: Request) {
  return Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function base64url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesFromBase64url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

async function validSession(request: Request, env: Env) {
  const token = cookies(request).powerlog_session;
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== await hmac(payload, env.SESSION_SECRET)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(bytesFromBase64url(payload)));
    return data.login === OWNER && Number(data.exp) > Date.now();
  } catch { return false; }
}

async function github(env: Env, path: string, init: RequestInit = {}) {
  const result = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(body.message || `GitHub HTTP ${result.status}`);
  return body;
}

async function getState(env: Env) {
  const file = await github(env, `/repos/${OWNER}/${REPO}/contents/state.json?ref=main`);
  return atob(String(file.content).replace(/\n/g, ''));
}

async function saveState(env: Env, content: string) {
  const ref = await github(env, `/repos/${OWNER}/${REPO}/git/ref/heads/main`);
  const parentSha = ref.object.sha as string;
  const parent = await github(env, `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
  const blob = await github(env, `/repos/${OWNER}/${REPO}/git/blobs`, {
    method: 'POST', body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), encoding: 'base64' }),
  });
  const tree = await github(env, `/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST', body: JSON.stringify({ base_tree: parent.tree.sha, tree: [{ path: 'state.json', mode: '100644', type: 'blob', sha: blob.sha }] }),
  });
  const commit = await github(env, `/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST', body: JSON.stringify({ message: `cloud: sync ${new Date().toISOString()}`, tree: tree.sha, parents: [parentSha] }),
  });
  await github(env, `/repos/${OWNER}/${REPO}/git/refs/heads/main`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
}

async function createSession(request: Request, env: Env, accessToken: string) {
  const user = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }).then(r => r.json());
  if (user.login !== OWNER) return response(request, JSON.stringify({ error: 'Доступ разрешён только владельцу приложения' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ login: OWNER, exp: Date.now() + 1000 * 60 * 60 * 24 * 180 })));
  const session = `${payload}.${await hmac(payload, env.SESSION_SECRET)}`;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `powerlog_session=${session}; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=None`);
  return response(request, JSON.stringify({ status: 'connected' }), { headers });
}

async function pollDevice(request: Request, env: Env) {
  const body = await request.json().catch(() => ({})) as { deviceCode?: string };
  if (!body.deviceCode) return response(request, JSON.stringify({ error: 'Не передан код авторизации' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, device_code: body.deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }),
  });
  const token = await tokenResponse.json();
  if (!token.access_token) return response(request, JSON.stringify({ status: 'pending' }), { headers: { 'Content-Type': 'application/json' } });
  return createSession(request, env, token.access_token);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return response(request, null, { status: 204 });
    const url = new URL(request.url);
    if (url.pathname === '/auth/start' && request.method === 'POST') {
      const device = await fetch('https://github.com/login/device/code', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, scope: 'read:user' }) }).then(r => r.json());
      return response(request, JSON.stringify({ userCode: device.user_code, verificationUri: device.verification_uri, deviceCode: device.device_code, interval: device.interval || 5 }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/auth/poll' && request.method === 'POST') return pollDevice(request, env);
    if (!await validSession(request, env)) return response(request, JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    try {
      if (url.pathname === '/state' && request.method === 'GET') return response(request, await getState(env), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
      if (url.pathname === '/state' && request.method === 'PUT') {
        const content = await request.text();
        JSON.parse(content);
        await saveState(env, content);
        return response(request, JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
      }
      return response(request, 'Not found', { status: 404 });
    } catch (error) {
      return response(request, JSON.stringify({ error: error instanceof Error ? error.message : 'server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
};
