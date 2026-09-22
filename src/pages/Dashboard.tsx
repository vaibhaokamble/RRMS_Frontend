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
  UserPlus
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
import RoomsCarousel from '../components/RoomsCarousel';
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
  const isAccent = color === 'amber' || color === 'accent';
  const chipBg = isAccent
    ? 'rgba(201, 162, 39, 0.12)'
    : color === 'rose' || color === 'danger'
      ? 'rgba(193, 68, 58, 0.12)'
      : 'rgba(31, 58, 46, 0.12)';
  const iconColor = isAccent ? '#C9A227' : color === 'rose' || color === 'danger' ? '#C1443A' : '#1F3A2E';

  return (
    <Card className="stat-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6B7160] uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: chipBg, color: iconColor }}>
          <Icon size={19} />
        </div>
      </div>
      <div className="text-3xl font-bold font-serif text-[#22261F]">
        <Counter value={value} format={format} />
      </div>
      <div className="text-xs text-[#6B7160] mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
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
      
      <HeroSlider />

      {/* Core Executive & Operational Stats */}
      <div className="stats-grid my-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    s.reservations.length) *
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

      {/* Hierarchical Account Creation & Management Table (Owner & Manager) */}
      <AccountsTable
        title={owner ? 'Owner Portal — Manager Accounts Created' : 'Manager Portal — Staff Accounts Created'}
        subtitle={
          owner
            ? 'Generate Manager credentials and manage system active statuses live'
            : 'Generate Staff accounts for Receptionists, Housekeeping, Cashiers, Maintenance, Gardeners, F&B, & Spa'
        }
      />

      <div className="dashboard-middle my-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="revenue-card md:col-span-2">
          <CardHead
            title="Revenue overview"
            subtitle="Daily revenue collection trend breakdown"
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
                    <stop offset="0%" stopColor="#C9A227" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
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
            title="Room status breakdown"
            subtitle="Real-time availability distribution"
            action={
              <Button variant="ghost" size="icon" onClick={() => go('rooms')}>
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

      <div className="dashboard-bottom grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
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

        <Card className="attention-card p-4">
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
    </PageMotion>
  );
}

function BarIcon() {
  return <IndianRupee size={16} />;
}

/* Guest Portal Dashboard with Animated Booking Status Progress Timeline */
function GuestDashboard() {
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const [pulseGold, setPulseGold] = useState(false);
  const g = s.guests.find((x) => x.id === actor!.guestId) ?? s.guests[0];
  const r =
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Checked in') ??
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Confirmed') ??
    s.reservations[0];
  const room = s.rooms.find((x) => x.id === r?.roomId);
  const balance = r ? folio(s, r).balance : 0;

  // Booking Timeline Progress calculation
  let progressPct = 33; // Confirmed
  if (r?.status === 'Checked in') progressPct = 66; // Active Stay
  if (r?.status === 'Completed') progressPct = 100; // Completed

  const triggerGoldPulse = () => {
    setPulseGold(true);
    setTimeout(() => setPulseGold(false), 1000);
  };

  return (
    <PageMotion>
      <PageTitle
        eyebrow="GUEST PORTAL · LUXURY RESORT EXPERIENCE"
        title={`Welcome home, ${g.name.split(' ')[0]}.`}
        description="Your stay, experiences, billing, and concierge at your fingertips."
        actions={
          <Button variant="outline" onClick={() => navigate('/guest/support')}>
            <MessageSquare size={16} />
            Ask Concierge
          </Button>
        }
      />

      <div className="resort-banner guest-banner fade-in p-8 rounded-2xl bg-[#1F3A2E] text-white relative overflow-hidden mb-6">
        <div className="banner-content relative z-10 max-w-xl">
          <div className="banner-kicker text-xs text-[#C9A227] tracking-widest font-semibold mb-2">
            ● YOUR SANCTUARY AWAITS
          </div>
          <h2 className="font-serif text-3xl font-bold mb-2">
            Somewhere between a getaway and a feeling.
          </h2>
          <p className="text-xs text-[#FAF7F2]/80 mb-4">
            Welcome to {s.policies.resortName}. Request room dining, spa services, or concierge assistance.
          </p>
          <Button onClick={() => navigate('/guest/services')}>
            Explore Resort Experiences <ArrowUpRight size={17} />
          </Button>
        </div>
      </div>

      {/* Booking Status Animated Timeline (Upcoming -> Active Stay -> Completed) */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#22261F]">My Booking Status</h3>
            <p className="text-xs text-[#6B7160]">Reservation {r.id} · {room?.type ?? 'Suite'}</p>
          </div>
          <Badge>{r.status}</Badge>
        </div>

        {/* Animated Progress Line */}
        <div className="relative my-6 px-4">
          <div className="h-2 w-full bg-[#F0EBE1] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A227] transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs mt-3">
            <div className={`text-center ${progressPct >= 33 ? 'font-bold text-[#1F3A2E]' : 'text-[#6B7160]'}`}>
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-[10px] ${progressPct >= 33 ? 'bg-[#C9A227]' : 'bg-[#6B7160]'}`}>1</div>
              Upcoming Stay
              <span className="block text-[10px] text-[#6B7160]">{shortDate(r.checkIn)}</span>
            </div>

            <div className={`text-center ${progressPct >= 66 ? 'font-bold text-[#1F3A2E]' : 'text-[#6B7160]'}`}>
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-[10px] ${progressPct >= 66 ? 'bg-[#C9A227]' : 'bg-[#6B7160]'}`}>2</div>
              Active Stay
              <span className="block text-[10px] text-[#6B7160]">Room {room?.number ?? '101'}</span>
            </div>

            <div className={`text-center ${progressPct >= 100 ? 'font-bold text-[#1F3A2E]' : 'text-[#6B7160]'}`}>
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-[10px] ${progressPct >= 100 ? 'bg-[#C9A227]' : 'bg-[#6B7160]'}`}>3</div>
              Completed Stay
              <span className="block text-[10px] text-[#6B7160]">{shortDate(r.checkOut)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="guest-overview grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="stay-card md:col-span-2 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <img src="/images/suite.jpg" alt="Resort Suite" className="w-full md:w-5/12 h-44 object-cover rounded-xl" />
            <div className="flex-1 space-y-2">
              <span className="text-xs font-semibold text-[#C9A227]">YOUR RESERVED ROOM</span>
              <h2 className="font-serif font-bold text-xl text-[#22261F]">{room?.type ?? 'Ocean Deluxe Suite'}</h2>
              <p className="text-xs text-[#6B7160]">Room {room?.number} · {room?.floor}</p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F0EBE1]">
                <div>
                  <small className="text-[#6B7160] block">CHECK-IN</small>
                  <strong>{shortDate(r.checkIn)}</strong>
                </div>
                <div>
                  <small className="text-[#6B7160] block">CHECK-OUT</small>
                  <strong>{shortDate(r.checkOut)}</strong>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/guest/reservations/${r.id}`)}>
                  Stay Details
                </Button>
                <Button size="sm" onClick={() => navigate('/guest/services')}>
                  Request Add-on
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Loyalty Balance with Animated Counter */}
        <div className="space-y-4">
          <Card className={`p-4 ${pulseGold ? 'gold-pulse-effect border-[#C9A227]' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <small className="text-xs font-semibold text-[#6B7160]">PALM REWARDS BALANCE</small>
                <h2 className="text-2xl font-bold font-serif text-[#C9A227] mt-1">
                  <Counter value={g.points} /> <span className="text-xs font-sans font-normal text-[#6B7160]">PTS</span>
                </h2>
                <p className="text-[11px] text-[#6B7160] mt-1">Gold Tier Member</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#C9A227]/10 text-[#C9A227] flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 justify-center"
              onClick={() => {
                triggerGoldPulse();
                navigate('/guest/loyalty');
              }}
            >
              Redeem Points
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <small className="text-xs font-semibold text-[#6B7160]">FOLIO OUTSTANDING</small>
                <h2 className="text-xl font-bold font-serif text-[#22261F] mt-1">{money(Math.max(0, balance))}</h2>
                <p className="text-[11px] text-[#6B7160]">Room + Add-on charges</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/guest/billing')}>
                View Bill
              </Button>
            </div>
          </Card>
        </div>
      </div>
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
