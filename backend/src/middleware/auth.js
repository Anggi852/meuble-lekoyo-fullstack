import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client(env.googleClientId || undefined);

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(payload = { role: 'customer' }) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 hari
    }),
  );
  const sig = crypto
    .createHmac('sha256', env.authSecret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

// Alias agar kode lama tetap kompatibel
export const signAdminToken = (payload = { role: 'owner' }) =>
  signToken({ role: 'owner', ...payload });

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac('sha256', env.authSecret)
    .update(`${header}.${body}`)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export const verifyAdminToken = verifyToken;

export async function verifyGoogleCredential(credential) {
  if (!env.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID belum diatur di server.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Token Google tidak valid.');
  }
  const email = payload.email.trim().toLowerCase();
  const isOwner = env.ownerEmails.includes(email);
  return {
    email,
    name: payload.name || email.split('@')[0],
    picture: payload.picture || '',
    role: isOwner ? 'owner' : 'customer',
  };
}

function extractBearer(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

export function optionalAuth(req, _res, next) {
  const decoded = verifyToken(extractBearer(req));
  if (decoded) {
    req.user = decoded;
    if (decoded.role === 'owner') req.admin = decoded;
  }
  return next();
}

export function requireAuth(req, res, next) {
  const decoded = verifyToken(extractBearer(req));
  if (!decoded) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Silakan login dengan akun Google terlebih dahulu.',
    });
  }
  req.user = decoded;
  if (decoded.role === 'owner') req.admin = decoded;
  return next();
}

export function requireAdmin(req, res, next) {
  const decoded = verifyToken(extractBearer(req));
  if (!decoded || decoded.role !== 'owner') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Akses ditolak. Khusus akun Owner Meuble Le\'Koyo.',
    });
  }
  req.admin = decoded;
  req.user = decoded;
  return next();
}