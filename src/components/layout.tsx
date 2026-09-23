import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  ClipboardList,
  Sparkles,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings2,
  ShieldCheck,
  ScrollText,
  Gift,
  Star,
  UserRound,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Menu as MenuIcon,
  X,
  LogOut,
  ArrowUpRight,
  Palmtree,
  CircleHelp,
  RotateCcw,
  CheckCheck,
  BriefcaseBusiness,
  Crown,
  Leaf,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { can, roles, shortDate, initials } from '../lib/domain';
import type { Module, Permission, Role } from '../lib/domain';
import { Avatar, Button, Menu, MenuItem, Modal, Confirm, Badge, Empty } from './ui';
type Item = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  section?: string;
};
const general: Item[] = [
  { path: 'dashboard', label: 'Overview', icon: LayoutDashboard, section: 'WORKSPACE' },
  { path: 'reservations', label: 'Reservations', icon: CalendarDays, permission: 'reservations' },
  { path: 'rooms', label: 'Rooms & availability', icon: BedDouble, permission: 'rooms' },
  { path: 'guests', label: 'Guest directory', icon: Users, permission: 'guests' },
  {
    path: 'tasks',
    label: 'Tasks & housekeeping',
    icon: ClipboardList,
    permission: 'tasks',
    section: 'OPERATIONS',
  },
  { path: 'services', label: 'Guest services', icon: Sparkles, permission: 'services' },
  { path: 'team', label: 'Team & shifts', icon: BriefcaseBusiness, permission: 'team' },
  { path: 'support', label: 'Requests & feedback', icon: MessageSquare, permission: 'support' },
  {
    path: 'billing',
    label: 'Billing & payments',
    icon: CreditCard,
    permission: 'billing',
    section: 'BUSINESS',
  },
  { path: 'promotions', label: 'Offers & packages', icon: Gift, permission: 'promotions' },
  { path: 'reports', label: 'Reports & insights', icon: BarChart3, permission: 'reports' },
  { path: 'settings', label: 'Resort settings', icon: Settings2, permission: 'settings' },
];
const guest: Item[] = [
  { path: 'dashboard', label: 'My stay', icon: LayoutDashboard, section: 'YOUR RESORT EXPERIENCE' },
  { path: 'reservations', label: 'My bookings', icon: CalendarDays },
  { path: 'services', label: 'Services & experiences', icon: Sparkles, permission: 'services' },
  { path: 'billing', label: 'Bills & payments', icon: CreditCard, permission: 'billing' },
  { path: 'loyalty', label: 'Palm rewards', icon: Gift },
  { path: 'reviews', label: 'Reviews & feedback', icon: Star },
  { path: 'support', label: 'Help & requests', icon: MessageSquare, permission: 'support' },
  { path: 'profile', label: 'My profile', icon: UserRound },
];
const owner: Item[] = [
  {
    path: 'dashboard',
    label: 'Executive overview',
    icon: LayoutDashboard,
    section: 'YOUR RESORT AT A GLANCE',
  },
  { path: 'reports', label: 'Reports & insights', icon: BarChart3 },
  { path: 'billing', label: 'Financial overview', icon: CreditCard },
  { path: 'rooms', label: 'Rooms & pricing', icon: BedDouble },
  { path: 'accounts', label: 'Accounts & team', icon: Users, section: 'RESORT ADMINISTRATION' },
  { path: 'permissions', label: 'Roles & permissions', icon: ShieldCheck },
  { path: 'audit', label: 'Audit & activity', icon: ScrollText },
  { path: 'settings', label: 'Resort & system settings', icon: Settings2 },
];
export const moduleIcons = {
  Guest: Palmtree,
  Management: BriefcaseBusiness,
  Staff: Leaf,
  Owner: Crown,
};
export function Layout() {
  const { s, actor, switchDemo, logout, act, reset } = useStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key === 'k')) &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !target.isContentEditable
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [resetOpen, setResetOpen] = useState(false),
    [help, setHelp] = useState(false),
    [search, setSearch] = useState(''),
    [searchOpen, setSearchOpen] = useState(false),
    [searchIndex, setSearchIndex] = useState(0);
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setSearch('');
    setSearchOpen(false);
    setMobile(false);
  }, [location.pathname, actor?.id]);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarRef.current?.querySelector<HTMLButtonElement>('.mobile-close')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobile(false);
      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, [tabindex="0"]') ?? []).filter((node) => node.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 801px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobile(false); };
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      desktop.removeEventListener('change', closeOnDesktop);
      previous?.focus();
    };
  }, [mobile]);
  if (!actor) return <Navigate to="/login" replace />;
  const base = `/${actor.module.toLowerCase()}`;
  const nav = (
    actor.module === 'Guest' ? guest : actor.module === 'Owner' ? owner : general
  ).filter((i) => !i.permission || can(s, actor, i.permission));
  const current = nav.find((x) => location.pathname.startsWith(`${base}/${x.path}`));
  const notices = s.notifications.filter((n) =>
    ['all', actor.id, actor.role, actor.module, actor.guestId].includes(n.audience),
  );
  const unread = notices.filter((n) => !n.readBy.includes(actor.id)).length;
  const switchModule = (m: Module, role?: Role) => {
    if (switchDemo(m, role)) {
      navigate(`/${m.toLowerCase()}/dashboard`);
      setMobile(false);
    }
  };
  const results = search.trim()
    ? nav.filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase()))
    : [];
  return (
    <div className={`app-shell theme-${actor.module.toLowerCase()}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside ref={sidebarRef} id="workspace-navigation" className={`sidebar ${mobile ? 'sidebar-open' : ''}`} role={mobile ? 'dialog' : undefined} aria-modal={mobile || undefined} aria-label={mobile ? 'Workspace navigation' : undefined}>
        <Link to={`${base}/dashboard`} className="brand" onClick={() => setMobile(false)}>
          <span className="brand-mark">
            <Palmtree size={26} />
          </span>
          <span>
            rrms<span className="brand-dot">.</span>
            <small>HOSPITALITY, CONNECTED</small>
          </span>
        </Link>
        <button
          className="mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <Menu
          trigger={
            <button className="resort-switch">
              <div className="resort-thumb">
                <Palmtree size={19} />
              </div>
              <span>
                <strong>{s.policies.resortName}</strong>
                <small>{s.policies.location.split('·')[0]}</small>
              </span>
              <ChevronDown size={14} />
            </button>
          }
        >
          <div className="menu-label">DEMO WORKSPACES</div>
          {(['Guest', 'Management', 'Staff', 'Owner'] as Module[]).map((m) => {
            const Icon = moduleIcons[m];
            return (
              <MenuItem key={m} onSelect={() => switchModule(m)}>
                <Icon size={16} />
                <span>{m}</span>
                {actor.module === m && <span className="ml-auto">✓</span>}
              </MenuItem>
            );
          })}
        </Menu>
        <div className="workspace-chip">
          <span />
          {actor.module} workspace{actor.module === 'Staff' && <small> · {actor.role}</small>}
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {nav.map((item, i) => {
            const Icon = item.icon;
            const count =
              item.path === 'support'
                ? s.complaints.filter((c) => c.status === 'Open' && (actor.module !== 'Guest' || c.guestId === actor.guestId)).length
                : item.path === 'tasks'
                  ? s.tasks.filter(
                      (t) =>
                        t.status === 'Pending' &&
                        (actor.module !== 'Staff' || t.assignee === actor.id),
                    ).length
                  : 0;
            return (
              <div key={item.path}>
                {(item.section || i === 0) && (
                  <div className="nav-section">{item.section ?? 'MY WORKSPACE'}</div>
                )}
                <NavLink
                  to={`${base}/${item.path}`}
                  onClick={() => setMobile(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon size={18} />
                  <span>
                    {actor.module === 'Staff' && item.path === 'tasks' ? 'My tasks' : item.label}
                  </span>
                  {count > 0 && <small className="nav-count">{count}</small>}
                </NavLink>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="hospitality-note">
            <span className="note-sun">✳</span>
            <h3>Great stays start with you.</h3>
            <p>A little care makes all the difference.</p>
            <button onClick={() => setHelp(true)}>
              Your workspace guide <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> Help & getting started <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-footer">
            <span className="live-dot" /> All systems operational <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={mobile || undefined}>
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
            >
              <MenuIcon size={22} />
            </Button>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to={`${base}/dashboard`}>{actor.module}</Link>
              <ChevronRight size={13} className="crumb-sep" aria-hidden="true" />
              <Link
                to={`${base}/${current?.path ?? 'dashboard'}`}
                className={location.pathname.split('/').length <= 3 ? 'crumb-active' : ''}
                aria-current={location.pathname.split('/').length <= 3 ? 'page' : undefined}
              >
                {current?.label ?? 'Overview'}
              </Link>
              {location.pathname.split('/').length > 3 && (
                <>
                  <ChevronRight size={13} className="crumb-sep" aria-hidden="true" />
                  <span className="crumb-active" aria-current="page">
                    {location.search.includes('new=1')
                      ? 'New Reservation'
                      : location.pathname.includes('accounts')
                      ? 'Account Creation'
                      : 'Details'}
                  </span>
                </>
              )}
            </nav>
          </div>
          <div className="topbar-actions">
            <div className="global-search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false); }}>
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Search workspace"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={searchOpen && Boolean(search.trim())}
                aria-controls={searchOpen && search.trim() ? 'workspace-search-results' : undefined}
                aria-activedescendant={searchOpen && results[searchIndex] ? `workspace-result-${results[searchIndex].path}` : undefined}
                placeholder="Search your workspace…"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); setSearchIndex(0); }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setSearchOpen(false); e.stopPropagation(); }
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSearchOpen(true);
                    setSearchIndex((index) => results.length ? (index + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : 0);
                  }
                  if (e.key === 'Enter' && searchOpen && results[searchIndex]) {
                    e.preventDefault();
                    navigate(`${base}/${results[searchIndex].path}`);
                    setSearch('');
                    setSearchOpen(false);
                  }
                }}
              />
              <kbd>/</kbd>
              {search.trim() && searchOpen && (
                <div className="search-results" id="workspace-search-results" role="listbox" aria-label="Matching screens">
                  {results.length ? (
                    results.map((r, index) => (
                      <button
                        key={r.path}
                        id={`workspace-result-${r.path}`}
                        role="option"
                        aria-selected={searchIndex === index}
                        onMouseEnter={() => setSearchIndex(index)}
                        onClick={() => {
                          navigate(`${base}/${r.path}`);
                          setSearch('');
                          setSearchOpen(false);
                        }}
                      >
                        <r.icon size={16} />
                        {r.label}
                        <ArrowRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>No screens match “{search}”.</p>
                  )}
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <Button
              variant="ghost"
              size="icon"
              className="notification-button"
              onClick={() => setNotifications(true)}
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </Button>
            <Menu
              trigger={
                <button className="profile-trigger" aria-label="Open profile menu">
                  <Avatar name={actor.name} size="small" />
                  <div>
                    <strong>{actor.name}</strong>
                    <small>
                      {actor.module === 'Staff'
                        ? actor.role
                        : actor.module === 'Guest'
                          ? 'Palm member'
                          : 'Resort ' + actor.module.toLowerCase()}
                    </small>
                  </div>
                  <ChevronDown size={14} />
                </button>
              }
            >
              <div className="menu-label">{actor.email}</div>
              {actor.module === 'Guest' && (
                <MenuItem onSelect={() => navigate(`${base}/profile`)}>
                  <UserRound size={16} />
                  My profile
                </MenuItem>
              )}
              <MenuItem onSelect={() => setHelp(true)}>
                <CircleHelp size={16} />
                Demo accounts & guide
              </MenuItem>
              <MenuItem onSelect={() => setResetOpen(true)}>
                <RotateCcw size={16} />
                Reset demo data
              </MenuItem>
              <MenuItem
                onSelect={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={16} />
                Sign out
              </MenuItem>
            </Menu>
          </div>
        </header>
        <div className="demo-toolbar">
          <span>
            <span className="demo-pill">DEMO</span> A connected resort, four perspectives.
          </span>
          <div className="module-tabs" aria-label="Demo module switcher">
            {(['Guest', 'Management', 'Staff', 'Owner'] as Module[]).map((m) => (
              <button
                key={m}
                onClick={() => switchModule(m)}
                className={actor.module === m ? 'active' : ''}
                aria-pressed={actor.module === m}
              >
                {m}
              </button>
            ))}
          </div>
          {actor.module === 'Staff' && (
            <select
              aria-label="Staff demo role"
              value={actor.role}
              onChange={(e) => switchModule('Staff', e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} {s.policies.resortName} · Powered by RRMS
          </span>
          <span>
            <span className="live-dot" /> Changes saved on this device
          </span>
        </footer>
      </div>
      {notifications && (
        <Modal
          open
          onClose={() => setNotifications(false)}
          title="Your notifications"
          description={`${unread} unread updates from around the resort.`}
        >
          <div className="dialog-body notification-list">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                act({ type: 'notifications.read' }, 'All notifications marked as read')
              }
            >
              <CheckCheck size={16} />
              Mark all as read
            </Button>
            {notices.length ? (
              notices.map((n) => (
                <button
                  key={n.id}
                  className={`notification-row ${n.readBy.includes(actor.id) ? '' : 'unread'}`}
                  onClick={() => act({ type: 'notifications.read', payload: { id: n.id } }, '')}
                >
                  <span className="notification-icon">
                    <Bell size={17} />
                  </span>
                  <span>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>{shortDate(n.date)}</small>
                  </span>
                  {!n.readBy.includes(actor.id) && <span className="unread-dot" />}
                </button>
              ))
            ) : (
              <Empty title="You're all caught up" />
            )}
          </div>
        </Modal>
      )}
      {resetOpen && (
        <Confirm
          title="Reset the demo workspace?"
          description="This removes changes made on this device and restores all seeded resort records. This action cannot be undone."
          label="Reset demo data"
          onClose={() => setResetOpen(false)}
          onConfirm={() => {
            reset();
            navigate('/management/dashboard');
            return true;
          }}
        />
      )}
      {help && (
        <Modal
          open
          wide
          onClose={() => setHelp(false)}
          title="One resort. Every perspective."
          description="Explore the connected demo using the workspace switcher. All payments, credentials, uploads and messages are simulated."
        >
          <div className="dialog-body">
            <div className="info-box">
              Try the full journey: confirm a reservation → sign in as its guest → check in →
              request and complete a service → settle the bill → check out → leave a review.
            </div>
            <h3 className="section-title">Demo credentials</h3>
            <p className="muted">
              All seeded accounts use <code>Resort@123</code>. Owner changes to accounts and
              permissions take effect immediately.
            </p>
            <div className="credentials-grid">
              {s.accounts
                .filter(
                  (x) => ['manager', 'owner', 'account-G1'].includes(x.id) || /^A[1-7]$/.test(x.id),
                )
                .map((a) => (
                  <div key={a.id}>
                    <strong>{a.module === 'Staff' ? a.role : a.module}</strong>
                    <code>{a.email}</code>
                  </div>
                ))}
            </div>
            <p className="muted">
              Reception issues credentials after a confirmed booking. Guest room discovery and
              advance payments happen outside RRMS. Room readiness requires management inspection;
              check-out requires a settled folio and completed services.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setHelp(false);
                setResetOpen(true);
              }}
            >
              <RotateCcw size={16} />
              Reset demo data
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
