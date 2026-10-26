import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { UAParser } from 'ua-parser-js';
import { User, Link } from './models.js';
import { validateDestination, makeAlias, summarizeClicks, isExpired } from './core.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '100kb' }));
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const createLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Link creation limit reached. Try again later.' },
});
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-change-me');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
function tokenFor(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET || 'dev-only-secret-change-me',
    { expiresIn: '7d' },
  );
}
function safeLink(link) {
  return {
    id: link._id,
    originalUrl: link.originalUrl,
    alias: link.alias,
    shortUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/${link.alias}`,
    expiresAt: link.expiresAt,
    disabled: link.disabled,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    totalClicks: link.clicks.length,
  };
}
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'LinkScope API' }));
app.post('/api/auth/register', authLimit, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2)
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: 'Enter a valid email' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const normalized = email.toLowerCase().trim();
    if (await User.findOne({ email: normalized }))
      return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({
      name: name.trim(),
      email: normalized,
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res
      .status(201)
      .json({
        token: tokenFor(user),
        user: { id: user._id, name: user.name, email: user.email },
      });
  } catch (e) {
    return res.status(500).json({ error: 'Could not register account' });
  }
});
app.post('/api/auth/login', authLimit, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid email or password' });
    return res.json({
      token: tokenFor(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    return res.status(500).json({ error: 'Could not log in' });
  }
});
app.get('/api/links', auth, async (req, res) => {
  const links = await Link.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ links: links.map(safeLink) });
});
app.post('/api/links', auth, createLimit, async (req, res) => {
  try {
    const { originalUrl, alias, expiresAt } = req.body || {};
    const err = validateDestination(originalUrl);
    if (err) return res.status(400).json({ error: err });
    if (
      alias !== undefined &&
      (typeof alias !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(alias))
    )
      return res
        .status(400)
        .json({ error: 'Alias must be 3–30 characters: letters, numbers, _ or -' });
    let expiry = null;
    if (expiresAt) {
      expiry = new Date(expiresAt);
      if (Number.isNaN(expiry.getTime()) || expiry <= new Date())
        return res.status(400).json({ error: 'Expiry must be a valid future date' });
    }
    let chosen = alias || makeAlias();
    if (await Link.exists({ alias: chosen }))
      return res.status(409).json({ error: 'That alias is already taken' });
    const link = await Link.create({
      user: req.user.id,
      originalUrl: new URL(originalUrl).href,
      alias: chosen,
      expiresAt: expiry,
    });
    res.status(201).json({ link: safeLink(link) });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ error: 'That alias is already taken' });
    res.status(500).json({ error: 'Could not create link' });
  }
});
app.get('/api/links/:id/analytics', auth, async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
  if (!link) return res.status(404).json({ error: 'Link not found' });
  res.json({ link: safeLink(link), analytics: summarizeClicks(link.clicks) });
});
app.patch('/api/links/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    const { originalUrl, expiresAt, disabled } = req.body || {};
    if (originalUrl !== undefined) {
      const err = validateDestination(originalUrl);
      if (err) return res.status(400).json({ error: err });
      link.originalUrl = new URL(originalUrl).href;
    }
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') link.expiresAt = null;
      else {
        const date = new Date(expiresAt);
        if (Number.isNaN(date.getTime()) || date <= new Date())
          return res.status(400).json({ error: 'Expiry must be a valid future date' });
        link.expiresAt = date;
      }
    }
    if (disabled !== undefined) {
      if (typeof disabled !== 'boolean')
        return res.status(400).json({ error: 'Disabled must be true or false' });
      link.disabled = disabled;
    }
    await link.save();
    res.json({ link: safeLink(link) });
  } catch {
    return res.status(400).json({ error: 'Invalid link ID or update' });
  }
});
app.delete('/api/links/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Link deleted' });
  } catch {
    return res.status(400).json({ error: 'Invalid link ID' });
  }
});
app.get('/:alias', async (req, res) => {
  if (req.params.alias.startsWith('api')) return res.status(404).send('Not found');
  const link = await Link.findOne({ alias: req.params.alias });
  if (!link)
    return res
      .status(404)
      .send(page('Link not found', 'This short link does not exist.'));
  if (link.disabled)
    return res
      .status(410)
      .send(page('Link disabled', 'The owner has disabled this link.'));
  if (isExpired(link.expiresAt))
    return res
      .status(410)
      .send(page('Link expired', 'This short link is no longer active.'));
  const destination = link.originalUrl;
  const ua = new UAParser(req.get('user-agent') || '').getResult();
  const device = ua.device.type || 'Desktop';
  const browser = ua.browser.name || 'Unknown';
  const referrer = req.get('referer') || 'Direct';
  res.set('Cache-Control', 'no-store');
  res.redirect(302, destination);
  setImmediate(() => {
    Link.updateOne(
      { _id: link._id },
      { $push: { clicks: { clickedAt: new Date(), referrer, device, browser } } },
    ).catch((err) => console.error('Analytics write failed:', err.message));
  });
});
function page(title, message) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui;background:#0b1020;color:#eef2ff;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:440px;margin:24px;padding:32px;border:1px solid #28334f;border-radius:20px;background:#121a2d}p{color:#aab7d2}</style></head><body><main class="card"><h1>${title}</h1><p>${message}</p></main></body></html>`;
}
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});
export default app;
