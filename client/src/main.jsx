import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import {
  Link2,
  MousePointerClick,
  ChartNoAxesCombined,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Power,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
  QrCode,
  Search,
  RefreshCw,
  Check,
  Clock3,
  Globe,
  Smartphone,
  Monitor,
  LinkIcon,
} from 'lucide-react';
import './style.css';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';function App() {
  const [token, setToken] = useState(localStorage.getItem('ls_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ls_user') || 'null'));
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({
    name: '',
    email: 'demo@example.com',
    password: 'DemoPass123!',
  });
  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ originalUrl: '', alias: '', expiresAt: '' });
  const [editing, setEditing] = useState(null);
  const request = async (path, opts = {}) => {
    const r = await fetch(API + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    const data = await r.json().catch(() => ({ error: 'Unexpected server response' }));
    if (!r.ok) throw Error(data.error || 'Request failed');
    return data;
  };
  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await request('/api/links');
      setLinks(d.links);
      if (active) {
        const l = d.links.find((x) => x.id === active.id);
        if (l) setActive(l);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [token]);
  useEffect(() => {
    if (!token || !active) return;
    request(`/api/links/${active.id}/analytics`)
      .then(setAnalytics)
      .catch((e) => setError(e.message));
  }, [token, active?.id, links.length]);
  const sign = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await request(
        `/api/auth/${authMode === 'login' ? 'login' : 'register'}`,
        { method: 'POST', body: JSON.stringify(auth) },
      );
      localStorage.setItem('ls_token', d.token);
      localStorage.setItem('ls_user', JSON.stringify(d.user));
      setToken(d.token);
      setUser(d.user);
      setNotice('Welcome to LinkScope');
    } catch (e) {
      setError(e.message);
    }
  };
  const signout = () => {
    localStorage.removeItem('ls_token');
    localStorage.removeItem('ls_user');
    setToken('');
    setUser(null);
    setLinks([]);
    setActive(null);
    setAnalytics(null);
  };
  const create = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const body = {
        originalUrl: form.originalUrl,
        ...(form.alias ? { alias: form.alias } : {}),
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
      };
      const d = await request('/api/links', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setForm({ originalUrl: '', alias: '', expiresAt: '' });
      setNotice('Short link created successfully');
      await load();
      setActive(d.link);
    } catch (e) {
      setError(e.message);
    }
  };
  const update = async (id, body) => {
    setError('');
    try {
      await request(`/api/links/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setNotice('Link updated');
      await load();
      if (active?.id === id) {
        const d = await request(`/api/links/${id}/analytics`);
        setAnalytics(d);
      }
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this link and its analytics permanently?')) return;
    try {
      await request(`/api/links/${id}`, { method: 'DELETE' });
      if (active?.id === id) {
        setActive(null);
        setAnalytics(null);
      }
      setNotice('Link deleted');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied to clipboard');
    } catch {
      setNotice(text);
    }
  };
  const filtered = useMemo(
    () =>
      links.filter((l) =>
        (l.originalUrl + ' ' + l.alias).toLowerCase().includes(search.toLowerCase()),
      ),
    [links, search],
  );
  const total = links.reduce((n, l) => n + l.totalClicks, 0);
  const activeCount = links.filter(
    (l) => !l.disabled && (!l.expiresAt || new Date(l.expiresAt) > new Date()),
  ).length;
  if (!token)
    return (
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="logo">
            <Link2 />
          </div>
          <span>LinkScope</span>
        </div>
        <div className="auth-card">
          <div className="eyebrow">LINK INTELLIGENCE PLATFORM</div>
          <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">Shorten links. Understand your audience.</p>
          {error && <div className="alert">{error}</div>}
          <form onSubmit={sign} className="stack">
            {authMode === 'register' && (
              <label>
                Full name
                <input
                  required
                  minLength="2"
                  value={auth.name}
                  onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                value={auth.email}
                onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                required
                minLength="8"
                type="password"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              />
            </label>
            <button className="btn primary full">
              {authMode === 'login' ? 'Sign in' : 'Create account'}{' '}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="auth-switch">
            {authMode === 'login' ? 'New to LinkScope?' : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {authMode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>
          <div className="secure-note">
            <ShieldCheck size={15} /> Your links, your data. Private by default.
          </div>
        </div>
        <div className="auth-foot">LINKS THAT WORK HARDER.</div>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            <Link2 />
          </div>
          <span>LinkScope</span>
          <span className="brand-tag">BETA</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item selected">
          <ChartNoAxesCombined size={18} /> Overview
        </button>
        <button
          className="nav-item"
          onClick={() =>
            document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Plus size={18} /> Create a link
        </button>
        <div className="side-bottom">
          <div className="plan-card">
            <div className="plan-icon">
              <ShieldCheck size={18} />
            </div>
            <b>Your links, in focus.</b>
            <p>Understand what works and where your audience comes from.</p>
            <div className="plan-line">
              <span>LINKS CREATED</span>
              <strong>{links.length}</strong>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">
              {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-text">
              <b>{user?.name || 'Your workspace'}</b>
              <small>{user?.email}</small>
            </div>
            <button className="icon-btn" title="Sign out" onClick={signout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="crumb">
              Workspace <span>/</span> Overview
            </div>
            <h1>
              Good to see you{user?.name ? ' , ' + user.name.split(' ')[0] : ''}{' '}
              <span className="wave">✳</span>
            </h1>
            <p className="muted">Here's what's happening with your links.</p>
          </div>
          <div className="top-actions">
            <div className="live-dot">
              <i /> All systems operational
            </div>
            <button className="btn secondary" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </header>
        {error && (
          <div className="alert inline-alert">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}
        <section className="stats">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total clicks</span>
              <div className="stat-icon purple">
                <MousePointerClick size={18} />
              </div>
            </div>
            <div className="stat-number">{total.toLocaleString()}</div>
            <div className="stat-foot">
              <span className="mini-up">↗</span> Across all your short links
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Links created</span>
              <div className="stat-icon blue">
                <Link2 size={18} />
              </div>
            </div>
            <div className="stat-number">{links.length}</div>
            <div className="stat-foot">Your complete link library</div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Active links</span>
              <div className="stat-icon green">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="stat-number">{activeCount}</div>
            <div className="stat-foot">
              <span className="status-dot" /> Ready to send visitors
            </div>
          </div>
        </section>
        <section className="content-grid">
          <div className="panel chart-panel">
            <div className="panel-head">
              <div>
                <h2>Click performance</h2>
                <p className="muted">
                  {active
                    ? 'Analytics for ' + active.alias
                    : 'Select a link to explore its analytics'}
                </p>
              </div>
              <div className="chart-legend">
                <span /> Clicks
              </div>
            </div>
            {analytics?.analytics?.overTime?.length ? (
              <>
                <div className="chart-total">
                  {analytics.analytics.totalClicks}
                  <small> total clicks</small>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.analytics.overTime}
                      margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8173ff" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#8173ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#202b43"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#7886a3', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#7886a3', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#10192b',
                          border: '1px solid #2a3651',
                          borderRadius: 10,
                          color: '#f3f5ff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Clicks"
                        stroke="#8d80ff"
                        strokeWidth={2.5}
                        fill="url(#fillClicks)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="empty-chart">
                <div className="empty-icon">
                  <ChartNoAxesCombined size={25} />
                </div>
                <b>No click data yet</b>
                <p>Select a link with activity to see its performance over time.</p>
              </div>
            )}
          </div>
          <div className="panel quick-panel">
            <div className="panel-head">
              <div>
                <h2>Quick create</h2>
                <p className="muted">Make a long link shareable.</p>
              </div>
              <div className="stat-icon purple">
                <Plus size={18} />
              </div>
            </div>
            <form id="create-form" onSubmit={create} className="stack create-stack">
              <label>
                Destination URL
                <div className="input-icon">
                  <Globe size={17} />
                  <input
                    required
                    type="url"
                    value={form.originalUrl}
                    onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
                    placeholder="https://yourwebsite.com/page"
                  />
                </div>
              </label>
              <label>
                Custom alias <span className="optional">OPTIONAL</span>
                <div className="alias-input">
                  <span>{API.replace(/^https?:\/\//, '')}/</span>
                  <input
                    value={form.alias}
                    onChange={(e) => setForm({ ...form, alias: e.target.value })}
                    minLength="3"
                    maxLength="30"
                    pattern="[a-zA-Z0-9_-]{3,30}"
                    placeholder="my-link"
                  />
                </div>
              </label>
              <label>
                Expiry date <span className="optional">OPTIONAL</span>
                <input
                  type="datetime-local"
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </label>
              <button className="btn primary full">
                <Plus size={17} /> Create short link
              </button>
              <div className="form-note">
                <ShieldCheck size={14} /> Only HTTP and HTTPS destinations are accepted.
              </div>
            </form>
          </div>
        </section>
        <section className="panel links-panel">
          <div className="panel-head links-head">
            <div>
              <h2>
                Your links <span className="count-pill">{links.length}</span>
              </h2>
              <p className="muted">Manage destinations and track engagement.</p>
            </div>
            <div className="search-box">
              <Search size={16} />
              <input
                placeholder="Search links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="empty-table">Loading your links...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-table">
              <div className="empty-icon">
                <Link2 size={24} />
              </div>
              <b>{search ? 'No matching links' : 'Your link library is empty'}</b>
              <p>
                {search
                  ? 'Try another search.'
                  : 'Create your first short link above to get started.'}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>LINK / DESTINATION</th>
                    <th>CLICKS</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className={active?.id === l.id ? 'active-row' : ''}
                      onClick={() => {
                        setActive(l);
                        setAnalytics(null);
                      }}
                    >
                      <td>
                        <div className="link-cell">
                          <div className="link-symbol">
                            <Link2 size={16} />
                          </div>
                          <div className="link-info">
                            <button
                              className="short-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                copy(l.shortUrl);
                              }}
                            >
                              {l.alias} <Copy size={12} />
                            </button>
                            <span title={l.originalUrl}>{l.originalUrl}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <b className="click-count">{l.totalClicks}</b>
                      </td>
                      <td>
                        <span
                          className={`pill ${l.disabled ? 'disabled' : l.expiresAt && new Date(l.expiresAt) <= new Date() ? 'expired' : 'active'}`}
                        >
                          <i />
                          {l.disabled
                            ? 'Disabled'
                            : l.expiresAt && new Date(l.expiresAt) <= new Date()
                              ? 'Expired'
                              : 'Active'}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            title="Open short link"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(l.shortUrl, '_blank', 'noopener');
                            }}
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            title={l.disabled ? 'Enable' : 'Disable'}
                            onClick={(e) => {
                              e.stopPropagation();
                              update(l.id, { disabled: !l.disabled });
                            }}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete link"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(l.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {active && analytics && (
          <section className="analytics-grid">
            <div className="panel analytics-panel">
              <div className="panel-head">
                <div>
                  <div className="eyebrow">LINK ANALYTICS</div>
                  <h2>{active.alias}</h2>
                  <p className="muted">{active.originalUrl}</p>
                </div>
                <button className="btn secondary" onClick={() => copy(active.shortUrl)}>
                  <Copy size={15} /> Copy short link
                </button>
              </div>
              <div className="breakdown-grid">
                <Breakdown
                  title="Top referrers"
                  rows={analytics.analytics.topReferrers}
                  icon={<Globe size={16} />}
                />
                <Breakdown
                  title="Devices"
                  rows={analytics.analytics.devices}
                  icon={<Smartphone size={16} />}
                />
                <Breakdown
                  title="Browsers"
                  rows={analytics.analytics.browsers}
                  icon={<Monitor size={16} />}
                />
              </div>
              <div className="edit-destination">
                <div>
                  <b>Edit destination</b>
                  <p className="muted">Update where this short link redirects.</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    update(active.id, { originalUrl: editing });
                    setEditing(null);
                  }}
                >
                  <input
                    type="url"
                    required
                    placeholder={active.originalUrl}
                    value={editing ?? active.originalUrl}
                    onChange={(e) => setEditing(e.target.value)}
                  />
                  <button
                    className="btn primary"
                    disabled={!editing || editing === active.originalUrl}
                  >
                    Save
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
        <footer className="footer">
          <span>© 2026 LinkScope</span>
          <span>
            <i /> Your links. Your insights.
          </span>
        </footer>
      </main>
    </div>
  );
}
function Breakdown({ title, rows = [], icon }) {
  return (
    <div className="breakdown">
      <div className="breakdown-title">
        {icon}
        <b>{title}</b>
      </div>
      {rows.length ? (
        rows.slice(0, 5).map((r) => (
          <div className="break-row" key={r.name}>
            <span title={r.name}>{r.name}</span>
            <b>{r.count}</b>
          </div>
        ))
      ) : (
        <p className="muted small">No data available yet.</p>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
