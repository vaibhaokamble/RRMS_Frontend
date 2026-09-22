import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palmtree, ArrowRight, ShieldCheck, KeyRound, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Module, StaffRole } from '../lib/domain';
import { Button } from '../components/ui';
import { moduleIcons } from '../components/layout';

export default function Login() {
  const { s, login, switchDemo } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@rrms.demo');
  const [password, setPassword] = useState('Resort@123');
  const [showAccountList, setShowAccountList] = useState(false);

  const presets = [
    { label: 'Owner', email: 'owner@rrms.demo', pass: 'Resort@123', module: 'Owner' },
    { label: 'Manager', email: 'management@rrms.demo', pass: 'Resort@123', module: 'Management' },
    { label: 'Receptionist', email: 'receptionist@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Housekeeping', email: 'housekeeping@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Cashier', email: 'cashier@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Maintenance', email: 'maintenance@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Gardener', email: 'gardener@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'F&B', email: 'fandb@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Spa', email: 'spa@rrms.demo', pass: 'Resort@123', module: 'Staff' },
    { label: 'Guest', email: 'guest@rrms.demo', pass: 'Resort@123', module: 'Guest' },
  ];

  const handleSelectPreset = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          <Palmtree size={32} />
          rrms.
        </div>
        <div>
          <span className="eyebrow">THE PALM RESORT MANAGEMENT SYSTEM</span>
          <h1 className="font-serif">
            Luxury hospitality.
            <br />Seamlessly managed.
          </h1>
          <p>
            Internal Operations + Guest Experience Portal.
            <br />
            Sign in to access your role dashboard.
          </p>
        </div>
        <span>
          {s.policies.resortName} · {s.policies.location}
        </span>
      </div>
      <div className="login-form">
        <div className="login-form-inner">
          <div className="eyebrow">INTERNAL ACCESS PORTAL</div>
          <h1 className="font-serif text-2xl font-bold">Sign In to Your Account</h1>
          <p className="muted">Enter your login ID and password created by management.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (login(email, password)) {
                const account = s.accounts.find(
                  (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
                );
                if (account) {
                  navigate(`/${account.module.toLowerCase()}/dashboard`);
                }
              }
            }}
            className="mt-4 space-y-4"
          >
            <label className="field block">
              <span>Email Address (Login ID)</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field block">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <Button type="submit" className="w-full justify-center">
              Sign In to Dashboard
              <ArrowRight size={17} />
            </Button>
          </form>

          {/* Quick Role Selector Presets */}
          <div className="login-divider my-4">
            <span>QUICK SIGN-IN PRESETS</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectPreset(p.email, p.pass)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                  email === p.email
                    ? 'bg-[#C9A227] text-white border-[#C9A227]'
                    : 'bg-[#FAF7F2] text-[#1F3A2E] border-[#F0EBE1] hover:border-[#C9A227]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAccountList(!showAccountList)}
            className="w-full text-xs text-[#6B7160] hover:text-[#1F3A2E] flex items-center justify-between py-2 border-t border-[#F0EBE1] mt-2"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <KeyRound size={14} className="text-[#C9A227]" />
              View All Live & Generated Accounts ({s.accounts.filter(a => a.active).length})
            </span>
            {showAccountList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAccountList && (
            <div className="max-h-48 overflow-y-auto border border-[#F0EBE1] rounded-lg p-2 bg-[#FAF7F2] space-y-1 my-2 text-xs">
              {s.accounts
                .filter((a) => a.active)
                .map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectPreset(acc.email, acc.password)}
                    className="w-full text-left p-1.5 rounded hover:bg-white flex items-center justify-between transition-colors border border-transparent hover:border-[#F0EBE1]"
                  >
                    <div>
                      <div className="font-semibold text-[#22261F]">{acc.name}</div>
                      <div className="font-mono text-[11px] text-[#6B7160]">{acc.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1F3A2E]/10 text-[#1F3A2E]">
                        {acc.role}
                      </span>
                      <div className="font-mono text-[10px] text-[#C9A227] mt-0.5">{acc.password}</div>
                    </div>
                  </button>
                ))}
            </div>
          )}

          <div className="login-note mt-3">
            <ShieldCheck size={18} />
            <p>
              Hierarchy: Owner creates Managers → Managers create Staff → Staff/Reception creates Guests.
            </p>
          </div>
        </div>
        <p className="login-copyright">Thoughtfully built for luxury resort hospitality.</p>
      </div>
    </div>
  );
}

