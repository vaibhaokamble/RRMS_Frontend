import { MotionConfig } from 'framer-motion';
import type { ErrorInfo, ReactNode } from 'react';
import { Component, lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout';
import { Button, Empty, Skeleton } from './components/ui';
import type { Permission } from './lib/domain';
import { can } from './lib/domain';
import { StoreProvider, useStore } from './lib/store';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Reservations = lazy(() => import('./pages/Reservations'));
const ReservationDetails = lazy(() =>
  import('./pages/Reservations').then((m) => ({ default: m.ReservationDetails })),
);
const Billing = lazy(() => import('./pages/Billing'));
const Rooms = lazy(() => import('./pages/Operations').then((m) => ({ default: m.Rooms })));
const Tasks = lazy(() => import('./pages/Operations').then((m) => ({ default: m.Tasks })));
const Services = lazy(() => import('./pages/Operations').then((m) => ({ default: m.Services })));
const Guests = lazy(() => import('./pages/People').then((m) => ({ default: m.Guests })));
const Profile = lazy(() => import('./pages/People').then((m) => ({ default: m.Profile })));
const Team = lazy(() => import('./pages/People').then((m) => ({ default: m.Team })));
const Support = lazy(() => import('./pages/People').then((m) => ({ default: m.Support })));
const Loyalty = lazy(() => import('./pages/People').then((m) => ({ default: m.Loyalty })));
const Reviews = lazy(() => import('./pages/People').then((m) => ({ default: m.Reviews })));
const Reports = lazy(() => import('./pages/Administration').then((m) => ({ default: m.Reports })));
const Accounts = lazy(() =>
  import('./pages/Administration').then((m) => ({ default: m.Accounts })),
);
const Permissions = lazy(() =>
  import('./pages/Administration').then((m) => ({ default: m.Permissions })),
);
const Audit = lazy(() => import('./pages/Administration').then((m) => ({ default: m.Audit })));
const Settings = lazy(() =>
  import('./pages/Administration').then((m) => ({ default: m.Settings })),
);
const Promotions = lazy(() =>
  import('./pages/Administration').then((m) => ({ default: m.Promotions })),
);
const screens: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  reservations: Reservations,
  rooms: Rooms,
  tasks: Tasks,
  services: Services,
  billing: Billing,
  guests: Guests,
  profile: Profile,
  team: Team,
  support: Support,
  loyalty: Loyalty,
  reviews: Reviews,
  reports: Reports,
  accounts: Accounts,
  permissions: Permissions,
  audit: Audit,
  settings: Settings,
  promotions: Promotions,
};
const access: Record<string, string[]> = {
  Guest: [
    'dashboard',
    'reservations',
    'services',
    'billing',
    'profile',
    'support',
    'loyalty',
    'reviews',
  ],
  Management: [
    'dashboard',
    'reservations',
    'rooms',
    'tasks',
    'services',
    'billing',
    'guests',
    'team',
    'support',
    'reports',
    'settings',
    'promotions',
  ],
  Staff: [
    'dashboard',
    'reservations',
    'rooms',
    'tasks',
    'services',
    'billing',
    'guests',
    'team',
    'support',
    'reports',
    'settings',
    'promotions',
  ],
  Owner: [
    'dashboard',
    'rooms',
    'billing',
    'reports',
    'accounts',
    'permissions',
    'audit',
    'settings',
  ],
};
function DefaultRoute() {
  const { actor } = useStore();
  return <Navigate to={actor ? `/${actor.module.toLowerCase()}/dashboard` : '/login'} replace />;
}
function Screen() {
  const { module, page, id } = useParams();
  const { s, actor } = useStore();
  if (!actor) return <Navigate to="/login" replace />;
  if (module !== actor.module.toLowerCase()) return <DefaultRoute />;
  if (!page || !screens[page])
    return (
      <Empty
        title="This page has wandered off"
        description="Use your workspace navigation to find your way back."
      />
    );
  const permission = page as Permission;
  const protectedPage =
    !['dashboard', 'profile', 'loyalty', 'reviews', 'accounts', 'permissions', 'audit'].includes(
      page,
    ) && !(page === 'reservations' && actor.module === 'Guest');
  if (!access[actor.module].includes(page) || (protectedPage && !can(s, actor, permission)))
    return (
      <Empty
        title="This screen isn’t available to your role"
        description="Your Owner can update access in Roles & permissions."
      />
    );
  const Comp = id && page === 'reservations' ? ReservationDetails : screens[page];
  return (
    <Suspense fallback={<Skeleton />}>
      <Comp key={`${actor.id}-${page}-${id ?? ''}`} />
    </Suspense>
  );
}
class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RRMS rendering error', error, info);
  }
  render() {
    if (this.state.error)
      return (
        <div className="error-page">
          <h1>Let’s get you back to your resort.</h1>
          <p>This screen couldn’t load. Your saved demo data is still on this device.</p>
          <Button onClick={() => window.location.assign('/')}>Reload workspace</Button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  // Allow forcing animations for debugging by adding `?animations=1` to the URL
  // e.g. http://localhost:5173/?animations=1
  const forceAnimations = typeof window !== 'undefined' && window.location.search.includes('animations=1');
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={forceAnimations ? 'never' : 'user'}>
        <StoreProvider>
          <BrowserRouter>
            <Suspense fallback={<Skeleton />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                  <Route path="/:module/:page/:id?" element={<Screen />} />
                </Route>
                <Route path="*" element={<DefaultRoute />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster richColors position="bottom-right" closeButton duration={4200} />
        </StoreProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
