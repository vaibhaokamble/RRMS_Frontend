import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Coffee,
  IndianRupee,
  Leaf,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Sun,
  Users,
  Waves,
  ShieldCheck,
  Receipt,
  Wrench,
  Utensils,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserPlus,
  Gift,
  CreditCard
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import HeroSlider from '../components/HeroSlider';
import { AccountsTable } from '../components/AccountsTable';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  Counter,
  Empty,
  PageMotion,
  PageTitle,
  Modal,
  FormModal
} from '../components/ui';
import { can, dashboard, dateOffset, folio, money, shortDate, today, roles } from '../lib/domain';
import { useStore } from '../lib/store';
import { toast } from 'sonner';

export function Stat({
  label,
  value,
  icon: Icon,
  detail,
  format,
  color = 'primary',
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
  format?: (n: number) => string;
  color?: 'primary' | 'accent' | 'warning' | 'danger' | string;
}) {
  const tone = ['amber', 'accent', 'warning'].includes(color)
    ? 'amber'
    : ['rose', 'danger'].includes(color)
      ? 'rose'
      : color;

  return (
    <Card className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon ${tone}`}>
          <Icon size={19} />
        </div>
      </div>
      <div className="stat-value">
        <Counter value={value} format={format} />
      </div>
      <div className="stat-detail">
        <span className="stat-detail-dot" />
        {detail}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { actor } = useStore();
  if (actor?.module === 'Guest') return <GuestDashboard />;
  if (actor?.module === 'Staff') return <StaffRoleDashboard />;
  return <OperationsDashboard />;
}

function OperationsDashboard() {
  const reduced = useReducedMotion();
  const { s, actor } = useStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7');
  const d = dashboard(s),
    owner = actor!.module === 'Owner',
    base = `/${actor!.module.toLowerCase()}`;
  const periodDays = Number(period);
  const chart = Array.from({ length: periodDays }, (_, i) => {
    const date = dateOffset(i - periodDays + 1);
    return {
      date: shortDate(date),
      revenue: s.payments
        .filter((p) => p.date.slice(0, 10) === date)
        .reduce((n, p) => n + (p.type === 'Refund' ? -p.amount : p.amount), 0),
      bookings: s.reservations.filter((r) => r.checkIn === date).length,
    };
  });
  const chartTotal = chart.reduce((n, p) => n + p.revenue, 0);
  const colors = ['#1F3A2E', '#C9A227', '#D98E04', '#6B7160', '#C1443A'];
  const roomData = ['Occupied', 'Ready', 'Dirty', 'Inspection', 'Maintenance'].map((status, i) => ({
    name: status,
    value: s.rooms.filter((r) => r.status === status).length,
    color: colors[i],
  }));
  const arrivals = s.reservations.filter((r) => r.checkIn === today() && r.status === 'Confirmed');
  const dailyRevenue = s.payments
    .filter((p) => p.date.startsWith(today()))
    .reduce((n, p) => n + (p.type === 'Refund' ? -p.amount : p.amount), 0);
  const average = s.reviews.length
    ? s.reviews.reduce((n, r) => n + r.rating, 0) / s.reviews.length
    : 0;
  const go = (path: string) => navigate(`${base}/${path}`);

  return (
    <PageMotion>
      <PageTitle
        eyebrow={new Date()
          .toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase()}
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${actor!.name.split(' ')[0]}`}
        description={
          owner
            ? 'Executive overview of performance, financials, and account management.'
            : 'Here’s what’s happening at your resort today.'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => go('reports?period=Daily')}>
              <CalendarDays size={16} />
              Today
              <ChevronRight size={14} />
            </Button>
            {can(s, actor!, 'reservations') && !owner && (
              <Button onClick={() => go('reservations?new=1')}>
                <Plus size={17} />
                New reservation
              </Button>
            )}
            {owner && (
              <Button onClick={() => go('reports')}>
                <BarIcon />
                View reports
              </Button>
            )}
          </>
        }
      />
      
      <HeroSlider resortName={s.policies.resortName} location={s.policies.location} onExplore={() => go('rooms')} />

      {/* Core Executive & Operational Stats */}
      <div className="stats-grid">
        <Stat
          label="Room occupancy"
          value={d.occupancy}
          format={(n) => `${n}%`}
          icon={BedDouble}
          detail={`${d.occupied} of ${s.rooms.length} rooms occupied`}
          color="primary"
        />
        <Stat
          label={owner ? 'Total collected' : 'Available rooms'}
          value={owner ? d.revenue : d.available}
          format={owner ? money : undefined}
          icon={owner ? IndianRupee : CalendarDays}
          detail={owner ? 'Net payments after refunds' : 'Inspected and ready to welcome'}
          color="amber"
        />
        <Stat
          label={owner ? 'Operating expenses' : 'Today’s revenue'}
          value={owner ? d.expenses : dailyRevenue}
          format={money}
          icon={IndianRupee}
          detail={owner ? 'Recorded expenses across the resort' : 'Net collections recorded today'}
          color="primary"
        />
        <Stat
          label={owner ? 'Cancellation rate' : 'Today’s arrivals'}
          value={
            owner
              ? Math.round(
                  (s.reservations.filter((r) => r.status === 'Cancelled').length /
                    Math.max(1, s.reservations.length)) *
                    100,
                )
              : d.arrivals
          }
          format={owner ? (n) => `${n}%` : undefined}
          icon={owner ? CalendarDays : Users}
          detail={
            owner
              ? `${s.reservations.length} total reservations`
              : `${d.departures} departures scheduled today`
          }
          color="rose"
        />
      </div>

      <div className="dashboard-middle">
        <Card className="revenue-card">
          <CardHead
            title="Revenue overview"
            subtitle="A clear view of your daily net collections"
            action={
              <select
                className="compact-select border border-[#F0EBE1] rounded-lg px-2 py-1 text-xs"
                aria-label="Revenue period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            }
          />
          <div className="chart-summary p-4 flex items-center justify-between border-b border-[#F0EBE1]">
            <div>
              <span className="text-2xl font-bold font-serif text-[#22261F]">{money(chartTotal)}</span>
              <span className="text-xs text-[#6B7160] block">Net collections ({period} days)</span>
            </div>
            <span className="text-xs text-[#6B7160]">
              {shortDate(dateOffset(1 - periodDays))} – {shortDate(today())}
            </span>
          </div>
          <div className="revenue-chart h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#44796A" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#44796A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#F0EBE1" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7160' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7160' }}
                  tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), 'Collections']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #F0EBE1', fontSize: 12 }}
                />
                <Area
                  isAnimationActive={!reduced}
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1F3A2E"
                  strokeWidth={2.5}
                  fill="url(#revenue-fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="room-overview">
          <CardHead
            title="Rooms at a glance"
            subtitle="Current availability across your resort"
            action={
              <Button variant="ghost" size="icon" aria-label="View room availability" onClick={() => go('rooms')}>
                <ArrowUpRight size={18} />
              </Button>
            }
          />
          <div className="donut-wrap flex flex-col items-center justify-center p-4 relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  isAnimationActive={!reduced}
                  data={roomData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={78}
                  paddingAngle={4}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {roomData.map((r) => (
                    <Cell key={r.name} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} rooms`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label text-center absolute">
              <strong className="text-2xl font-serif font-bold block">{s.rooms.length}</strong>
              <span className="text-xs text-[#6B7160]">Total rooms</span>
            </div>
          </div>
          <div className="room-legend p-4 border-t border-[#F0EBE1] grid grid-cols-2 gap-2 text-xs">
            {roomData.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[#6B7160] flex-1">{r.name}</span>
                <strong className="font-mono text-[#22261F]">{r.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-bottom">
        <Card>
          <CardHead
            title={owner ? 'Recent reservations' : 'Today’s arrivals'}
            subtitle={owner ? 'Latest guest bookings across the resort' : 'Welcoming today’s confirmed arrivals'}
            action={
              <Button variant="ghost" size="sm" onClick={() => go(owner ? 'reports' : 'reservations')}>
                View all <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="table-scroll">
            <table className="arrival-table w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] text-[#6B7160]">
                <tr>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {(owner ? s.reservations.slice(0, 5) : arrivals).map((r) => {
                  const g = s.guests.find((g) => g.id === r.guestId)!,
                    room = s.rooms.find((x) => x.id === r.roomId)!;
                  return (
                    <tr key={r.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-3">
                        <div className="person-cell flex items-center gap-2">
                          <Avatar name={g.name} />
                          <div>
                            <strong className="block text-[#22261F]">{g.name}</strong>
                            <small className="text-[#6B7160]">{r.id}</small>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <strong className="block text-[#22261F]">Room {room.number}</strong>
                        <small className="text-[#6B7160]">{room.type}</small>
                      </td>
                      <td className="p-3 text-[#22261F]">
                        {shortDate(r.checkIn)} – {shortDate(r.checkOut)}
                        <small className="block text-[#6B7160]">{r.adults} guests</small>
                      </td>
                      <td className="p-3">
                        <Badge>{r.status}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`View ${g.name} reservation`}
                          onClick={() => go(owner ? 'reports' : `reservations/${r.id}`)}
                        >
                          <ArrowUpRight size={17} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="attention-card">
          <CardHead title="Attention needed" subtitle="Action items requiring staff attention" />
          <div className="space-y-3 mt-3">
            <button
              onClick={() => go(owner ? 'reports' : 'tasks')}
              className="w-full p-3 rounded-xl border border-[#F0EBE1] hover:border-[#C9A227] flex items-center justify-between text-left transition-all bg-[#FAF7F2]/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D98E04]/10 text-[#D98E04] flex items-center justify-center">
                  <ClipboardCheck size={18} />
                </div>
                <div>
                  <strong className="block text-xs text-[#22261F]">Open tasks</strong>
                  <span className="text-[11px] text-[#6B7160]">Housekeeping & Maintenance</span>
                </div>
              </div>
              <span className="font-bold text-xs bg-[#D98E04]/20 text-[#D98E04] px-2 py-0.5 rounded-full">
                {d.pending}
              </span>
            </button>

            <button
              onClick={() => go(owner ? 'reports' : 'support')}
              className="w-full p-3 rounded-xl border border-[#F0EBE1] hover:border-[#C9A227] flex items-center justify-between text-left transition-all bg-[#FAF7F2]/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C1443A]/10 text-[#C1443A] flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <strong className="block text-xs text-[#22261F]">Guest requests</strong>
                  <span className="text-[11px] text-[#6B7160]">Concierge & Support tickets</span>
                </div>
              </div>
              <span className="font-bold text-xs bg-[#C1443A]/20 text-[#C1443A] px-2 py-0.5 rounded-full">
                {d.complaints}
              </span>
            </button>

            <div className="guest-love p-4 rounded-xl bg-[#1F3A2E] text-white flex items-center justify-between mt-4">
              <div>
                <div className="flex items-center gap-1 text-[#C9A227]">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold font-serif text-lg">{average.toFixed(1)} / 5</span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">Overall guest feedback score</p>
              </div>
              <Leaf size={28} className="text-[#C9A227] opacity-80" />
            </div>
          </div>
        </Card>
      </div>
      <AccountsTable
        title={owner ? 'Management team' : 'Your resort team'}
        subtitle={owner ? 'Manage manager accounts and workspace access.' : 'Staff accounts, roles, and access in one place.'}
      />
    </PageMotion>
  );
}

function BarIcon() {
  return <IndianRupee size={16} />;
}

/* Status Chip Component for Guest Dashboard */
function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Checked in': 'bg-[#1F3A2E]/10 text-[#1F3A2E] border-[#1F3A2E]/25',
    'In progress': 'bg-[#D98E04]/10 text-[#D98E04] border-[#D98E04]/25',
    'Scheduled': 'bg-[#2E7D4F]/10 text-[#2E7D4F] border-[#2E7D4F]/25',
    'Completed': 'bg-[#1F3A2E]/10 text-[#1F3A2E] border-[#1F3A2E]/25',
    'Confirmed': 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/25',
    'Pending': 'bg-[#D98E04]/10 text-[#D98E04] border-[#D98E04]/25',
  };
  const style = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* Guest Portal Dashboard with Luxury Editorial UI & Interactive Steppers */
function GuestDashboard() {
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const [pulseGold, setPulseGold] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  const g = s.guests.find((x) => x.id === actor!.guestId) ?? s.guests[0];
  const r =
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Checked in') ??
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Confirmed') ??
    s.reservations[0];
  const room = s.rooms.find((x) => x.id === r?.roomId);
  const balance = r ? folio(s, r).balance : 0;

  // Booking Progress calculation
  let progressStep = 2; // Default Active Stay
  if (r?.status === 'Confirmed') progressStep = 1;
  if (r?.status === 'Checked in') progressStep = 2;
  if (r?.status === 'Completed') progressStep = 3;

  const triggerGoldPulse = () => {
    setPulseGold(true);
    setTimeout(() => setPulseGold(false), 1000);
  };

  const handleQuickRequest = (title: string, type: string) => {
    act(
      {
        type: 'complaint.create',
        payload: {
          guestId: g.id,
          roomId: room?.id ?? 'room-1',
          category: type,
          subject: title,
          description: `Guest requested ${title} from Guest Dashboard.`,
        },
      },
      `Request logged: ${title}. Our concierge team is on it!`
    );
  };

  const experiences = [
    {
      id: 'exp-1',
      title: 'Ananda Spa & Wellness',
      subtitle: 'Ayurvedic Healing Massage',
      duration: '60 Mins',
      price: '₹3,500',
      rating: '4.9',
      image: '/images/spa.jpg',
      category: 'Spa',
    },
    {
      id: 'exp-2',
      title: 'Sunset Catamaran Cruise',
      subtitle: 'Unlimited Drinks & Hors d’oeuvres',
      duration: '2 Hours',
      price: '₹5,000',
      rating: '5.0',
      image: '/images/cruise.jpg',
      category: 'Excursion',
    },
    {
      id: 'exp-3',
      title: 'Candlelight Beachfront Dinner',
      subtitle: '5-Course Chef’s Tasting Menu',
      duration: 'Gourmet',
      price: '₹8,500',
      rating: '4.8',
      image: '/images/dining.jpg',
      category: 'Dining',
    },
    {
      id: 'exp-4',
      title: 'Deep Sea Scuba & Water Sports',
      subtitle: 'PADI Instructor Guided Session',
      duration: '3 Hours',
      price: '₹4,200',
      rating: '4.9',
      image: '/images/scuba.jpg',
      category: 'Adventure',
    },
  ];

  const recentRequests = [
    { id: 'req-1', service: 'Extra Feather Pillows & Linens', time: '10 mins ago', status: 'In progress', category: 'Housekeeping' },
    { id: 'req-2', service: 'Continental Breakfast in Suite', time: 'Scheduled for 8:00 AM', status: 'Scheduled', category: 'Room Service' },
    { id: 'req-3', service: 'Airport Buggy Transfer', time: 'Yesterday', status: 'Completed', category: 'Concierge' },
  ];

  const dailySchedule = [
    { time: '08:30 AM', title: 'Sunrise Beachfront Yoga & Meditation', location: 'Beach Pavilion', icon: Sun },
    { time: '01:00 PM', title: 'Gourmet Poolside Grill & Live DJ', location: 'The Lagoon Bar', icon: Utensils },
    { time: '05:30 PM', title: 'Sunset Catamaran Champagne Cruise', location: 'Private Marina', icon: Waves },
    { time: '08:00 PM', title: 'Live Jazz Night & Artisanal Cocktail Tasting', location: 'The Palm Lounge', icon: Coffee },
  ];

  return (
    <PageMotion>
      <PageTitle
        eyebrow="GUEST PORTAL · LUXURY RESORT EXPERIENCE"
        title={`Welcome home, ${g.name.split(' ')[0]}.`}
        description="Your stay, experiences, billing, and concierge at your fingertips."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/guest/reservations')}>
              <CalendarDays size={16} />
              My Bookings
            </Button>
            <Button onClick={() => navigate('/guest/support')}>
              <MessageSquare size={16} />
              Ask Concierge
            </Button>
          </>
        }
      />

      {/* Hero Banner: Luxury Editorial Style */}
      <div className="resort-banner guest-banner">
        <div className="banner-content">
          <div className="guest-banner-kicker">
            <Sparkles size={13} />
            <span>EXCEPTIONAL STAYS · BRIGHTER TOMORROWS</span>
          </div>
          <h2>
            Somewhere between a getaway and a feeling.
          </h2>
          <p>
            Welcome to {s.policies.resortName}. Experience personalized concierge services, fine dining, restorative spa treatments, and unforgettable coastal moments.
          </p>
          <div className="guest-banner-actions">
            <Button onClick={() => navigate('/guest/services')}>
              Explore your experiences <ArrowUpRight size={17} />
            </Button>
            <Button variant="outline" onClick={() => navigate('/guest/support')}>
              Chat with Concierge
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Status Stepper with Status Chips */}
      <Card className="p-6 mb-8 border border-[#F0EBE1] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0EBE1]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-xl text-[#22261F]">My Booking Status</h3>
              <StatusChip status={r?.status ?? 'Checked in'} />
            </div>
            <p className="text-xs text-[#6B7160] mt-1">
              Reservation ID: <strong className="font-mono text-[#22261F]">{r.id}</strong> · {room?.type ?? 'Suite'} (Room {room?.number ?? '101'})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/guest/reservations/${r.id}`)}>
            View Reservation <ChevronRight size={15} />
          </Button>
        </div>

        {/* New 3-Step Progress Format (Card Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Step 1: Upcoming */}
          <div className={`flex flex-col p-4 rounded-xl border transition-all ${progressStep >= 1 ? 'bg-[#FAF7F2] border-[#C9A227]/40 shadow-sm' : 'bg-white border-[#F0EBE1] opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${progressStep >= 1 ? 'bg-[#C9A227] text-white shadow-md' : 'bg-[#F0EBE1] text-[#6B7160]'}`}>
                1
              </div>
              <StatusChip status="Confirmed" />
            </div>
            <strong className={progressStep >= 1 ? 'text-[#1F3A2E] text-sm font-semibold' : 'text-[#6B7160] text-sm'}>
              Upcoming Stay
            </strong>
            <span className="text-xs text-[#6B7160] mt-1">{shortDate(r.checkIn)}</span>
          </div>

          {/* Step 2: Active */}
          <div className={`flex flex-col p-4 rounded-xl border transition-all ${progressStep >= 2 ? 'bg-[#FAF7F2] border-[#C9A227]/40 shadow-sm' : 'bg-white border-[#F0EBE1] opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${progressStep >= 2 ? 'bg-[#C9A227] text-white shadow-md' : 'bg-[#F0EBE1] text-[#6B7160]'}`}>
                2
              </div>
              <StatusChip status="Checked in" />
            </div>
            <strong className={progressStep >= 2 ? 'text-[#1F3A2E] text-sm font-semibold' : 'text-[#6B7160] text-sm'}>
              Active Stay
            </strong>
            <span className="text-xs text-[#6B7160] mt-1">Room {room?.number ?? '101'}</span>
          </div>

          {/* Step 3: Completed */}
          <div className={`flex flex-col p-4 rounded-xl border transition-all ${progressStep >= 3 ? 'bg-[#FAF7F2] border-[#C9A227]/40 shadow-sm' : 'bg-white border-[#F0EBE1] opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${progressStep >= 3 ? 'bg-[#C9A227] text-white shadow-md' : 'bg-[#F0EBE1] text-[#6B7160]'}`}>
                3
              </div>
              <StatusChip status="Scheduled" />
            </div>
            <strong className={progressStep >= 3 ? 'text-[#1F3A2E] text-sm font-semibold' : 'text-[#6B7160] text-sm'}>
              Completed Stay
            </strong>
            <span className="text-xs text-[#6B7160] mt-1">{shortDate(r.checkOut)}</span>
          </div>
        </div>
      </Card>

      {/* Main Grid: Stay Overview, Rewards, Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
        {/* Current Stay Card */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <span className="text-xs font-bold text-[#C9A227] uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble size={16} />
                YOUR RESERVED SANCTUARY
              </span>
              <StatusChip status={r?.status ?? 'Checked in'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-5 h-48 rounded-xl overflow-hidden border border-[#F0EBE1] shadow-sm">
                <img
                  src="/images/suite.jpg"
                  alt="Resort Suite"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80');
                  }}
                />
              </div>

              <div className="md:col-span-7 space-y-3">
                <div>
                  <h2 className="font-serif font-bold text-2xl text-[#22261F]">
                    {room?.type ?? 'Ocean Deluxe Suite'}
                  </h2>
                  <p className="text-xs text-[#6B7160] mt-1">
                    Room Number: <strong className="text-[#22261F]">{room?.number ?? '204'}</strong> · Floor: <strong className="text-[#22261F]">{room?.floor ?? '2nd Floor'}</strong> · View: <strong className="text-[#22261F]">Oceanfront Pavilion</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#F0EBE1]">
                    <small className="text-[#6B7160] block font-semibold uppercase text-[10px]">CHECK-IN</small>
                    <strong className="text-sm text-[#1F3A2E] block mt-0.5">{shortDate(r.checkIn)}</strong>
                    <span className="block text-[10px] text-[#6B7160]">After 2:00 PM</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#F0EBE1]">
                    <small className="text-[#6B7160] block font-semibold uppercase text-[10px]">CHECK-OUT</small>
                    <strong className="text-sm text-[#1F3A2E] block mt-0.5">{shortDate(r.checkOut)}</strong>
                    <span className="block text-[10px] text-[#6B7160]">Before 11:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 mt-5 border-t border-[#F0EBE1]">
            <Button variant="outline" size="sm" onClick={() => navigate(`/guest/reservations/${r.id}`)}>
              Stay Details & Keycard
            </Button>
            <Button size="sm" onClick={() => handleQuickRequest('In-Room Dining Request', 'Room Service')}>
              <Utensils size={15} /> Order Room Service
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleQuickRequest('Housekeeping Extra Towels', 'Housekeeping')}>
              <Sparkles size={15} /> Extra Towels & Amenities
            </Button>
          </div>
        </Card>

        {/* Loyalty & Billing Cards Column */}
        <div className="flex flex-col gap-6">
          {/* Palm Rewards Card */}
          <Card className={`p-6 flex-1 flex flex-col justify-between transition-all duration-300 ${pulseGold ? 'gold-pulse-effect border-[#C9A227]' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#6B7160] uppercase tracking-wider block">PALM REWARDS BALANCE</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-3xl font-bold font-serif text-[#C9A227]">
                    <Counter value={g.points || 1250} />
                  </h2>
                  <span className="text-xs font-bold text-[#6B7160]">PTS</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#C9A227]/10 text-[#C9A227] px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-2 border border-[#C9A227]/20">
                  <Sparkles size={12} /> Gold Tier VIP Member
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A227]/20 to-[#C9A227]/5 text-[#C9A227] flex items-center justify-center font-bold border border-[#C9A227]/20 shadow-sm shrink-0">
                <Gift size={24} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 justify-center border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10"
              onClick={() => {
                triggerGoldPulse();
                navigate('/guest/loyalty');
              }}
            >
              Redeem Palm Points <ArrowRight size={14} />
            </Button>
          </Card>

          {/* Charges & Payments Card */}
          <Card className="p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#6B7160] uppercase tracking-wider block">FOLIO OUTSTANDING BALANCE</span>
                <h2 className="text-2xl font-bold font-serif text-[#22261F] mt-1">{money(Math.max(0, balance))}</h2>
                <p className="text-[11px] text-[#6B7160] mt-1">Room Rate + Add-on Experiences</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#1F3A2E]/10 text-[#1F3A2E] flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-[#F0EBE1]">
              <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => navigate('/guest/billing')}>
                View Folio Bill
              </Button>
              <Button size="sm" className="flex-1 justify-center" onClick={() => toast.success('Redirecting to secure payment portal...')}>
                Pay Now
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Grid Row 2: Today at the Resort & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today at the Resort Card */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EBE1]">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#22261F] flex items-center gap-2">
                <Sun size={20} className="text-[#C9A227]" />
                Today at the Resort
              </h3>
              <p className="text-xs text-[#6B7160]">Curated daily schedule, activities, and dining events</p>
            </div>
            <Badge>4 Highlights Today</Badge>
          </div>

          <div className="space-y-3">
            {dailySchedule.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[#F0EBE1] hover:border-[#C9A227] transition-all bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#1F3A2E]/10 text-[#1F3A2E] flex items-center justify-center font-bold shrink-0">
                      <Icon size={19} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#C9A227]">{item.time}</span>
                        <span className="text-[11px] text-[#6B7160]">· {item.location}</span>
                      </div>
                      <strong className="block text-sm text-[#22261F] mt-0.5">{item.title}</strong>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success(`Reserved entry for ${item.title}!`)}
                  >
                    Reserve <ChevronRight size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Service Requests Section */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#22261F]">Recent Requests</h3>
                <p className="text-xs text-[#6B7160]">Track active service orders</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate('/guest/support')}>
                <Plus size={18} />
              </Button>
            </div>

            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl border border-[#F0EBE1] bg-[#FAF7F2]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#6B7160] uppercase">{req.category}</span>
                    <StatusChip status={req.status} />
                  </div>
                  <strong className="block text-xs text-[#22261F]">{req.service}</strong>
                  <span className="text-[11px] text-[#6B7160] block">{req.time}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 justify-center"
            onClick={() => navigate('/guest/support')}
          >
            View All Concierge Tickets <ArrowRight size={14} />
          </Button>
        </Card>
      </div>

      {/* Explore Experiences Section (Marketplace Cards) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif font-bold text-2xl text-[#22261F]">Explore Resort Experiences</h2>
            <p className="text-xs text-[#6B7160]">Handcrafted activities, wellness therapies, and gourmet dining</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/guest/services')}>
            View Full Experiences Marketplace <ArrowUpRight size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {experiences.map((exp) => (
            <Card key={exp.id} className="overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-40 overflow-hidden bg-gray-100">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80');
                  }}
                />
                <span className="absolute top-3 left-3 bg-[#1F3A2E]/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {exp.category}
                </span>
                <span className="absolute bottom-3 right-3 bg-white/90 text-[#22261F] text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Star size={12} className="text-[#C9A227] fill-[#C9A227]" />
                  {exp.rating}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-serif font-bold text-base text-[#22261F] group-hover:text-[#C9A227] transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-[#6B7160] line-clamp-1">{exp.subtitle}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE1]">
                  <div>
                    <span className="text-[10px] text-[#6B7160] block uppercase">{exp.duration}</span>
                    <strong className="text-sm text-[#1F3A2E] font-serif">{exp.price}</strong>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      act(
                        {
                          type: 'complaint.create',
                          payload: {
                            guestId: g.id,
                            roomId: room?.id ?? 'room-1',
                            category: exp.category,
                            subject: `Booking Request: ${exp.title}`,
                            description: `Guest requested booking for ${exp.title} (${exp.price}).`,
                          },
                        },
                        `Experience booked: ${exp.title}! Our team will confirm timing shortly.`
                      );
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Help & Support / Concierge Quick Panel */}
      <Card className="p-6 bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#F0EBE1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#C9A227] uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <HelpCircle size={15} />
              24/7 GUEST CONCIERGE ASSISTANCE
            </span>
            <h3 className="font-serif font-bold text-xl text-[#22261F]">How can we elevate your stay today?</h3>
            <p className="text-xs text-[#6B7160]">Select a one-touch request below or reach our front desk instantly.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => handleQuickRequest('Housekeeping Cleaning Request', 'Housekeeping')}>
              🧹 Clean My Room
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRequest('In-Room Breakfast Order', 'Room Service')}>
              🍽️ Room Service
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRequest('Resort Buggy Pick-up', 'Concierge')}>
              🛺 Resort Buggy
            </Button>
            <Button size="sm" onClick={() => navigate('/guest/support')}>
              <MessageSquare size={15} /> Live Concierge Chat
            </Button>
          </div>
        </div>
      </Card>
    </PageMotion>
  );
}


/* Dedicated Role-Based Staff Dashboards (Strictly role-based via Login, no generic switcher) */
function StaffRoleDashboard() {
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const role = actor?.role as string;
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [damageReportOpen, setDamageReportOpen] = useState(false);

  // Role: Receptionist
  if (role === 'Receptionist') {
    return (
      <PageMotion>
        <PageTitle
          eyebrow="RECEPTIONIST WORKSPACE · FRONT DESK"
          title={`Front Desk Operations — Welcome, ${actor!.name.split(' ')[0]}`}
          description="Check room availability, register walk-in guests, generate guest portal logins, & process check-in/out."
          actions={
            <Button onClick={() => setGuestFormOpen(true)}>
              <UserPlus size={16} /> Walk-in Registration & Guest Credentials
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <Card className="p-5 md:col-span-2">
            <CardHead title="Today's Arrivals & Check-Ins" subtitle="Confirm guest arrival, assign room, and activate stay" />
            <div className="table-scroll mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] text-[#6B7160]">
                  <tr>
                    <th className="p-2.5">Guest Name</th>
                    <th className="p-2.5">Assigned Room</th>
                    <th className="p-2.5">Check-In / Out</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {s.reservations
                    .filter((r) => ['Confirmed', 'Checked in'].includes(r.status))
                    .slice(0, 6)
                    .map((r) => {
                      const g = s.guests.find((x) => x.id === r.guestId);
                      const room = s.rooms.find((x) => x.id === r.roomId);
                      return (
                        <tr key={r.id}>
                          <td className="p-2.5 font-bold text-[#22261F]">{g?.name ?? 'Guest'}</td>
                          <td className="p-2.5">Room {room?.number} ({room?.type})</td>
                          <td className="p-2.5">{shortDate(r.checkIn)} – {shortDate(r.checkOut)}</td>
                          <td className="p-2.5"><Badge>{r.status}</Badge></td>
                          <td className="p-2.5 text-right">
                            {r.status === 'Confirmed' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  act(
                                    { type: 'reservation.status', payload: { id: r.id, status: 'Checked in' } },
                                    `Guest ${g?.name} checked in successfully!`
                                  )
                                }
                              >
                                Check In
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <CardHead title="Room Availability Check" subtitle="Search ready rooms by wing" />
            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {s.rooms.slice(0, 8).map((rm) => (
                <div key={rm.id} className="p-2.5 border border-[#F0EBE1] rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <strong className="block text-[#22261F]">Room {rm.number}</strong>
                    <span className="text-[11px] text-[#6B7160]">{rm.type} · ₹{rm.rate}/night</span>
                  </div>
                  <Badge>{rm.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Walk-in Guest Registration & Auto Guest Credentials Popup Modal */}
        {guestFormOpen && (
          <FormModal
            title="Register Walk-in Guest & Issue Credentials"
            description="Create new reservation and auto-generate Guest Portal credentials for the guest."
            initial={{ checkIn: today(), checkOut: dateOffset(2) }}
            fields={[
              { name: 'name', label: 'Guest Full Name', required: true, placeholder: 'e.g. Ramesh Verma' },
              { name: 'email', label: 'Guest Email (Login ID)', type: 'email', required: true, placeholder: 'ramesh@example.com' },
              { name: 'phone', label: 'Phone Number', required: true, placeholder: '+91 98765 00000' },
              {
                name: 'roomId',
                label: 'Assign Room',
                type: 'select',
                required: true,
                options: s.rooms.filter((r) => r.status === 'Ready').map((r) => ({ value: r.id, label: `Room ${r.number} (${r.type} - ₹${r.rate})` })),
              },
              { name: 'checkIn', label: 'Check-In Date', type: 'date', required: true },
              { name: 'checkOut', label: 'Check-Out Date', type: 'date', required: true },
            ]}
            onClose={() => setGuestFormOpen(false)}
            onSubmit={(values) => {
              const res = act({
                type: 'reservation.create',
                payload: {
                  name: values.name,
                  email: values.email,
                  phone: values.phone,
                  roomId: values.roomId,
                  checkIn: values.checkIn || today(),
                  checkOut: values.checkOut || dateOffset(2),
                  adults: 2,
                },
              }, 'Walk-in reservation confirmed! Guest credentials generated.');
              return res;
            }}
            submit="Confirm Walk-In & Generate Login"
          />
        )}
      </PageMotion>
    );
  }

  // Role: Housekeeping
  if (role === 'Housekeeping') {
    return (
      <PageMotion>
        <PageTitle
          eyebrow="HOUSEKEEPING WORKSPACE · ROOM CLEANING & TURNOVER"
          title={`Housekeeping Board — Welcome, ${actor!.name.split(' ')[0]}`}
          description="View assigned turnover tasks, update cleaning statuses, and report room damage / lost & found items."
          actions={
            <Button variant="outline" onClick={() => setDamageReportOpen(true)}>
              <AlertCircle size={16} /> Report Damage / Lost & Found
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <Card className="p-5 md:col-span-2">
            <CardHead title="Assigned Turnover Cleaning Tasks" subtitle="Update status: Dirty → Cleaning → Inspection" />
            <div className="space-y-3 mt-3">
              {s.tasks
                .filter((t) => t.role === 'Housekeeping')
                .map((task) => {
                  const rm = s.rooms.find((r) => r.id === task.roomId);
                  return (
                    <div key={task.id} className="p-3.5 border border-[#F0EBE1] rounded-xl flex items-center justify-between bg-[#FAF7F2]/50">
                      <div>
                        <strong className="block text-sm text-[#22261F]">{task.title}</strong>
                        <span className="text-xs text-[#6B7160]">Room {rm?.number} ({rm?.type}) · Priority: {task.priority}</span>
                        <div className="mt-1"><Badge>{task.status}</Badge></div>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'Pending' && (
                          <Button
                            size="sm"
                            onClick={() => act({ type: 'task.update', payload: { id: task.id, status: 'In progress' } }, 'Cleaning started')}
                          >
                            Start Cleaning
                          </Button>
                        )}
                        {task.status === 'In progress' && (
                          <Button
                            size="sm"
                            onClick={() => act({ type: 'task.update', payload: { id: task.id, status: 'Inspection' } }, 'Task sent for management inspection')}
                          >
                            Request Inspection
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card className="p-5">
            <CardHead title="Dirty Rooms Board" subtitle="Rooms awaiting turnover" />
            <div className="space-y-2 mt-3">
              {s.rooms
                .filter((r) => r.status === 'Dirty')
                .map((r) => (
                  <div key={r.id} className="p-3 border border-[#F0EBE1] rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-[#22261F]">Room {r.number}</strong>
                      <span className="text-[#6B7160]">{r.type}</span>
                    </div>
                    <Badge>Dirty</Badge>
                  </div>
                ))}
              {!s.rooms.some((r) => r.status === 'Dirty') && (
                <p className="text-xs text-[#6B7160] py-4 text-center">All rooms cleaned!</p>
              )}
            </div>
          </Card>
        </div>

        {damageReportOpen && (
          <FormModal
            title="Report Room Damage or Lost & Found"
            description="Log item found or damage observed during turnover."
            fields={[
              {
                name: 'roomId',
                label: 'Room Number',
                type: 'select',
                required: true,
                options: s.rooms.map((r) => ({ value: r.id, label: `Room ${r.number}` })),
              },
              { name: 'title', label: 'Item / Damage Description', required: true, placeholder: 'e.g. Silver reading glasses found on table' },
            ]}
            onClose={() => setDamageReportOpen(false)}
            onSubmit={(values) => {
              return act({ type: 'found.create', payload: { roomId: values.roomId, title: values.title } }, 'Lost & Found item logged!');
            }}
            submit="Submit Report"
          />
        )}
      </PageMotion>
    );
  }

  // Role: Cashier
  if (role === 'Cashier') {
    return (
      <PageMotion>
        <PageTitle
          eyebrow="CASHIER WORKSPACE · BILLING & PAYMENTS"
          title={`Cashier Desk — Welcome, ${actor!.name.split(' ')[0]}`}
          description="View guest folios, accept payments via Card/UPI/Cash/Bank, issue refunds, and print formal invoices."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <Card className="p-5 md:col-span-2">
            <CardHead title="Guest Folios & Payment Processing" subtitle="Select a stay to collect payment or view charges" />
            <div className="table-scroll mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] text-[#6B7160]">
                  <tr>
                    <th className="p-2.5">Guest</th>
                    <th className="p-2.5">Room</th>
                    <th className="p-2.5">Total Bill</th>
                    <th className="p-2.5">Paid</th>
                    <th className="p-2.5">Balance</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {s.reservations
                    .filter((r) => ['Checked in', 'Completed'].includes(r.status))
                    .slice(0, 6)
                    .map((r) => {
                      const g = s.guests.find((x) => x.id === r.guestId);
                      const room = s.rooms.find((x) => x.id === r.roomId);
                      const f = folio(s, r);
                      return (
                        <tr key={r.id}>
                          <td className="p-2.5 font-bold text-[#22261F]">{g?.name}</td>
                          <td className="p-2.5">Room {room?.number}</td>
                          <td className="p-2.5">{money(f.total)}</td>
                          <td className="p-2.5 text-[#2E7D4F]">{money(f.paid)}</td>
                          <td className="p-2.5 font-bold text-[#C1443A]">{money(f.balance)}</td>
                          <td className="p-2.5 text-right">
                            {f.balance > 0 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  act({
                                    type: 'payment.create',
                                    payload: { reservationId: r.id, amount: f.balance, method: 'Card' },
                                  }, `Payment of ${money(f.balance)} collected!`)
                                }
                              >
                                Accept Payment
                              </Button>
                            ) : (
                              <span className="text-xs text-[#2E7D4F] font-bold">● Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <CardHead title="Recent Payment Transactions" subtitle="Live ledger of collections" />
            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {s.payments.slice(0, 6).map((p) => (
                <div key={p.id} className="p-2.5 border border-[#F0EBE1] rounded-lg text-xs flex justify-between">
                  <div>
                    <strong className="block text-[#22261F]">{p.type === 'Payment' ? 'Received' : 'Refund'}</strong>
                    <span className="text-[#6B7160]">{p.method}</span>
                  </div>
                  <strong className={`font-mono ${p.type === 'Payment' ? 'text-[#2E7D4F]' : 'text-[#C1443A]'}`}>
                    {p.type === 'Payment' ? '+' : '-'}{money(p.amount)}
                  </strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageMotion>
    );
  }

  // Default fallback for Maintenance, Gardener, F&B, Spa roles
  return (
    <PageMotion>
      <PageTitle
        eyebrow={`${role.toUpperCase()} WORKSPACE · DEPARTMENT OPERATIONS`}
        title={`${role} Portal — Welcome, ${actor!.name.split(' ')[0]}`}
        description={`Manage ${role} work requests, update service status, and complete resort duties.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Card className="p-5">
          <CardHead title={`Open ${role} Service Requests & Tasks`} subtitle="Manage active work orders" />
          <div className="space-y-3 mt-3">
            {s.services
              .filter((x) => x.status !== 'Completed')
              .slice(0, 5)
              .map((srv) => (
                <div key={srv.id} className="p-3 border border-[#F0EBE1] rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="block text-sm text-[#22261F]">{srv.name}</strong>
                    <span className="text-xs text-[#6B7160]">{srv.options || 'Standard request'} · {srv.time}</span>
                    <div className="mt-1"><Badge>{srv.status}</Badge></div>
                  </div>
                  {srv.status === 'Requested' && (
                    <Button
                      size="sm"
                      onClick={() => act({ type: 'service.update', payload: { id: srv.id, status: 'In progress' } }, 'Service started')}
                    >
                      Start Service
                    </Button>
                  )}
                  {srv.status === 'In progress' && (
                    <Button
                      size="sm"
                      onClick={() => act({ type: 'service.update', payload: { id: srv.id, status: 'Completed' } }, 'Service completed & charged to folio')}
                    >
                      Complete & Charge
                    </Button>
                  )}
                </div>
              ))}
            {!s.services.some((x) => x.status !== 'Completed') && (
              <p className="text-xs text-[#6B7160] py-6 text-center">No open service requests right now.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHead title="Department Tasks" subtitle="Assigned work orders" />
          <div className="space-y-3 mt-3">
            {s.tasks
              .filter((t) => t.role === (role as any))
              .map((task) => (
                <div key={task.id} className="p-3 border border-[#F0EBE1] rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="block text-xs text-[#22261F]">{task.title}</strong>
                    <span className="text-[11px] text-[#6B7160]">Priority: {task.priority}</span>
                  </div>
                  <Badge>{task.status}</Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </PageMotion>
  );
}
