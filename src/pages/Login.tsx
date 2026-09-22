import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palmtree, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Module } from '../lib/domain';
import { Button } from '../components/ui';
import { moduleIcons } from '../components/layout';
export default function Login() {
  const { s, login, switchDemo } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('management@rrms.demo'),
    [password, setPassword] = useState('Resort@123');
  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          <Palmtree size={32} />
          rrms.
        </div>
        <div>
          <span className="eyebrow">THOUGHTFUL HOSPITALITY. SEAMLESSLY CONNECTED.</span>
          <h1>
            A warmer welcome.
            <br />A smoother every day.
          </h1>
          <p>
            Everything that makes an exceptional stay,
            <br />
            together in one thoughtful workspace.
          </p>
        </div>
        <span>
          {s.policies.resortName} · {s.policies.location}
        </span>
      </div>
      <div className="login-form">
        <div className="login-form-inner">
          <div className="eyebrow">WELCOME TO RRMS</div>
          <h1>Make yourself at home.</h1>
          <p className="muted">Sign in to your resort workspace.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (login(email, password)) {
                const account = s.accounts.find(
                  (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
                );
                navigate(`/${account!.module.toLowerCase()}/dashboard`);
              }
            }}
          >
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit">
              Sign in to your workspace
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="login-divider">
            <span>OR EXPLORE A DEMO</span>
          </div>
          <div className="demo-login-grid">
            {(['Guest', 'Management', 'Staff', 'Owner'] as Module[]).map((m) => {
              const Icon = moduleIcons[m];
              return (
                <button
                  key={m}
                  onClick={() => {
                    if (switchDemo(m)) navigate(`/${m.toLowerCase()}/dashboard`);
                  }}
                >
                  <Icon size={22} />
                  <strong>{m}</strong>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>
          <div className="login-note">
            <ShieldCheck size={18} />
            <p>
              Demo password: <code>Resort@123</code>
              <br />
              Guests receive access after reception confirms their stay.
            </p>
          </div>
        </div>
        <p className="login-copyright">Thoughtfully built for exceptional hospitality.</p>
      </div>
    </div>
  );
}
