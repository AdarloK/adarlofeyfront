import { useState } from 'react';
import { login, register, parseError, session } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setFields({});
    setNotice('');
  };

  const doLogin = async (username, password) => {
    const { data } = await login(username, password);
    session.save({ tokens: data.tokens, user: data.user });
    onLoggedIn(data.user);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    setNotice('');
    try {
      if (mode === 'register') {
        await register(form);
        await doLogin(form.username, form.password); // sign in right after registering
      } else {
        await doLogin(form.username, form.password);
      }
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
      setFields(parsed.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login-side" aria-hidden="true">
        <div className="tag">
          <span className="tag-hole" />
          <p className="tag-title">Stockroom</p>
          <p className="tag-sub">Product inventory</p>
          <dl className="tag-rows">
            <div><dt>SKU</dt><dd>PM-0001</dd></div>
            <div><dt>Qty</dt><dd>48</dd></div>
            <div><dt>Price</dt><dd>₱499.00</dd></div>
          </dl>
        </div>
      </section>

      <section className="login-main">
        <form className="login-card" onSubmit={submit} noValidate>
          <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="muted">
            {mode === 'login'
              ? 'Sign in to manage your products.'
              : 'Register a new account to get started.'}
          </p>

          {error && <div className="alert" role="alert">{error}</div>}
          {notice && <div className="alert ok">{notice}</div>}

          <label>
            {mode === 'login' ? 'Username or email' : 'Username'}
            <input
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              autoFocus
              required
            />
            {fields.username && <span className="field-error">{fields.username}</span>}
          </label>

          {mode === 'register' && (
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
              {fields.email && <span className="field-error">{fields.email}</span>}
            </label>
          )}

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {fields.password && <span className="field-error">{fields.password}</span>}
          </label>

          <button className="btn primary block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" className="link" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
