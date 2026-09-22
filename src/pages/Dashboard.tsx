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
    Waves
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../components/ui';
import { can, dashboard, dateOffset, folio, money, shortDate, today } from '../lib/domain';
import { useStore } from '../lib/store';
export function Stat({
  label,
  value,
  icon: Icon,
  detail,
  format,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
  format?: (n: number) => string;
  color?: string;
}) {
  return (
    <Card className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color ?? ''}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">
        <Counter value={value} format={format} />
      </div>
      <div className="stat-detail">
        <span className="tiny-dot" />
        {detail}
      </div>
    </Card>
  );
}
export default function Dashboard() {
  const { actor } = useStore();
  if (actor?.module === 'Guest') return <GuestDashboard />;
  if (actor?.module === 'Staff') return <StaffDashboard />;
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
  const colors = ['#687e54', '#b9cba7', '#edc178', '#d9dee1', '#9dadae'];
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
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${actor!.name.split(' ')[0]} `}
        description={
          owner
            ? 'A thoughtful view of your resort’s performance.'
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
      <div className="stats-grid">
        <Stat
          label="Room occupancy"
          value={d.occupancy}
          format={(n) => `${n}%`}
          icon={BedDouble}
          detail={`${d.occupied} of ${s.rooms.length} rooms occupied`}
          color="olive"
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
          color="blue"
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
          color="purple"
        />
      </div>
      <div className="dashboard-middle">
        <Card className="revenue-card">
          <CardHead
            title="Revenue overview"
            subtitle="A closer look at your resort’s daily collections"
            action={
              <select
                className="compact-select"
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
          <div className="chart-summary">
            <strong>{money(chartTotal)}</strong>
            <span>
              <span className="legend-dot" />
              Net collections
            </span>
            <span className="chart-period">
              {shortDate(dateOffset(1 - periodDays))} – {shortDate(today())}
            </span>
          </div>
          <div className="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#829b69" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#829b69" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#ebeee8" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#92968d' }}
                  dy={8}
                  minTickGap={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#92968d' }}
                  tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), 'Collections']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8ece4', fontSize: 12 }}
                />
                <Area
                  isAnimationActive={!reduced}
                  type="monotone"
                  dataKey="revenue"
                  stroke="#748b5f"
                  strokeWidth={2.5}
                  fill="url(#revenue-fill)"
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="room-overview">
          <CardHead
            title="Room overview"
            subtitle="Every room, at a glance"
            action={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => go('rooms')}
                aria-label="View all rooms"
              >
                <ArrowUpRight size={18} />
              </Button>
            }
          />
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={176}>
              <PieChart>
                <Pie
                  isAnimationActive={!reduced}
                  data={roomData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={79}
                  paddingAngle={4}
                  cornerRadius={4}
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
            <div className="donut-label">
              <strong>{s.rooms.length}</strong>
              <span>Total rooms</span>
            </div>
          </div>
          <div className="room-legend">
            {roomData.map((r) => (
              <div key={r.name}>
                <span className="legend-dot" style={{ background: r.color }} />
                <span>{r.name}</span>
                <strong>{r.value.toString().padStart(2, '0')}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="dashboard-bottom">
        <Card>
          <CardHead
            title={owner ? 'Recent reservations' : 'Today’s arrivals'}
            subtitle={
              owner
                ? 'The latest chapters in your guest journey'
                : 'A warm welcome is the perfect beginning'
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go(owner ? 'reports' : 'reservations')}
              >
                View all
                <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="table-scroll">
            <table className="arrival-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(owner ? s.reservations.slice(0, 4) : arrivals).map((r) => {
                  const g = s.guests.find((g) => g.id === r.guestId)!,
                    room = s.rooms.find((x) => x.id === r.roomId)!;
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={g.name} />
                          <div>
                            <strong>{g.name}</strong>
                            <small>{r.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{room.number}</strong>
                        <small>{room.type}</small>
                      </td>
                      <td>
                        {shortDate(r.checkIn)} – {shortDate(r.checkOut)}
                        <small>{r.adults} guests</small>
                      </td>
                      <td>
                        <Badge>{r.status}</Badge>
                      </td>
                      <td>
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
            {!arrivals.length && !owner && (
              <Empty
                title="All arrivals are taken care of"
                description="Your reception team is up to date."
              />
            )}
          </div>
          <div className="card-bottom-note">
            <span className="live-dot" />{' '}
            {owner
              ? `${s.reservations.length} reservations across your resort`
              : 'Synced with the front desk, in real time'}
          </div>
        </Card>
        <Card className="attention-card">
          <CardHead
            title="A little attention needed"
            subtitle="The details that make a difference"
          />
          <button className="attention-row" onClick={() => go(owner ? 'reports' : 'tasks')}>
            <span className="attention-icon amber">
              <ClipboardCheck size={19} />
            </span>
            <span>
              <strong>Open tasks</strong>
              <small>Keep your resort day running smoothly</small>
            </span>
            <b>{d.pending}</b>
            <ChevronRight size={15} />
          </button>
          <button className="attention-row" onClick={() => go(owner ? 'reports' : 'support')}>
            <span className="attention-icon rose">
              <MessageSquare size={19} />
            </span>
            <span>
              <strong>Guest requests</strong>
              <small>A thoughtful response goes a long way</small>
            </span>
            <b>{d.complaints}</b>
            <ChevronRight size={15} />
          </button>
          <button className="attention-row" onClick={() => go(owner ? 'reports' : 'tasks')}>
            <span className="attention-icon blue">
              <BedDouble size={19} />
            </span>
            <span>
              <strong>Awaiting inspection</strong>
              <small>Ready for your final seal of approval</small>
            </span>
            <b>{s.rooms.filter((r) => r.status === 'Inspection').length}</b>
            <ChevronRight size={15} />
          </button>
          <div className="guest-love">
            <span>
              <Star size={18} fill="currentColor" />
            </span>
            <div>
              <strong>
                {average.toFixed(1)} <small>/ 5 guest happiness</small>
              </strong>
              <p>Little moments. Lasting memories.</p>
            </div>
            <Leaf size={30} />
          </div>
        </Card>
      </div>
    </PageMotion>
  );
}
function BarIcon() {
  return <IndianRupee size={16} />;
}
function GuestDashboard() {
  const { s, actor } = useStore();
  const navigate = useNavigate();
  const g = s.guests.find((x) => x.id === actor!.guestId)!;
  const r =
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Checked in') ??
    s.reservations.find((x) => x.guestId === g.id && x.status === 'Confirmed');
  const room = s.rooms.find((x) => x.id === r?.roomId);
  const balance = r ? folio(s, r).balance : 0;
  return (
    <PageMotion>
      <PageTitle
        eyebrow="YOUR PALM RESORT EXPERIENCE"
        title={`Welcome home, ${g.name.split(' ')[0]}.`}
        description="Unwind, explore, and leave the little details to us."
        actions={
          <Button variant="outline" onClick={() => navigate('/guest/support')}>
            <MessageSquare size={16} />
            Ask your concierge
          </Button>
        }
      />
      <div className="resort-banner guest-banner fade-in">
        <div className="banner-content">
          <div className="banner-kicker">
            <span /> YOUR TIME TO SLOW DOWN
          </div>
          <h2>
            Somewhere between
            <br />a getaway and a feeling.
          </h2>
          <p>
            Your coastal sanctuary is ready.
            <br />
            Make this stay a little more you.
          </p>
          <button onClick={() => navigate('/guest/services')}>
            Explore your experiences
            <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="banner-location">
          {s.policies.resortName}
          <small>{s.policies.location}</small>
        </div>
      </div>
      <div className="guest-overview">
        <Card className="stay-card">
          <img src="/images/suite.jpg" alt="Sunlit resort suite with a comfortable king bed" />
          <div>
            <div className="flex-between">
              <span className="eyebrow">YOUR STAY</span>
              {r && <Badge>{r.status}</Badge>}
            </div>
            <h2>{room?.type ?? 'Your next chapter awaits'}</h2>
            <p>
              {room
                ? `Room ${room.number} · ${room.floor}`
                : 'Contact reception to arrange your next visit.'}
            </p>
            {r && (
              <>
                <div className="stay-dates">
                  <div>
                    <small>CHECK-IN</small>
                    <strong>{shortDate(r.checkIn)}</strong>
                    <span>From {s.policies.checkIn}</span>
                  </div>
                  <ArrowRight size={20} />
                  <div>
                    <small>CHECK-OUT</small>
                    <strong>{shortDate(r.checkOut)}</strong>
                    <span>By {s.policies.checkOut}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="outline" onClick={() => navigate(`/guest/reservations/${r.id}`)}>
                    View stay details
                    <ArrowRight size={15} />
                  </Button>
                  <Button onClick={() => navigate('/guest/services')}>Add experience</Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="guest-small-stats">
          <div className="balance-card card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <small className="eyebrow">YOUR BALANCE</small>
                <h2 style={{ marginTop: 6 }}>{money(Math.max(0, balance))}</h2>
                <p className="muted" style={{ marginTop: 8 }}>View your itemized bill for details</p>
              </div>
              <div>
                <Button variant="soft">Settle</Button>
              </div>
            </div>
          </div>

          <div className="concierge-card">
            <img src="/images/suite.jpg" alt="Concierge" />
            <div>
              <strong>24/7 Concierge</strong>
              <p className="muted">Ask for dining, spa, or local recommendations.</p>
              <div style={{ marginTop: 10 }}>
                <Button variant="outline" size="sm" onClick={() => navigate('/guest/support')}>Message concierge</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-section" style={{ marginTop: 20 }}>
        <Card>
          <CardHead title="Make room for a little more" subtitle="Thoughtful experiences, just a request away" action={
            <Button variant="ghost" onClick={() => navigate('/guest/services')}>
              All experiences
              <ArrowRight size={15} />
            </Button>
          } />
          <div className="quick-experiences" style={{ padding: 12 }}>
            {[
              { name: 'Spa & wellness', text: 'Find your moment of calm', icon: Leaf },
              { name: 'In-room dining', text: 'A taste of the coast', icon: Coffee },
              { name: 'Activities', text: 'Follow your curiosity', icon: Waves },
              { name: 'Guest support', text: 'We’re here for the little things', icon: MessageSquare },
            ].map((x, i) => (
              <button key={x.name} onClick={() => navigate(i === 3 ? '/guest/support' : '/guest/services?new=1')}>
                <span>
                  <x.icon size={26} />
                </span>
                <div style={{ textAlign: 'left' }}>
                  <strong>{x.name}</strong>
                  <small className="muted">{x.text}</small>
                </div>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 18 }}>
        <Card>
          <CardHead title="Rooms & suites" subtitle="Handpicked stays you can book" />
          <div style={{ padding: 8 }}>
            <RoomsCarousel rooms={s.rooms.slice(0, 6)} />
          </div>
        </Card>
      </div>

      <div className="dashboard-middle" style={{ marginTop: 18 }}>
        <Card>
          <CardHead title="Special offers" subtitle="Handpicked for your stay" />
          <div className="offers-grid" style={{ padding: 12 }}>
            <a className="offer-card" href="#">
              <img src="/images/resort.jpg" alt="Offer" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div className="offer-content">
                <strong>Sunset dinner for two</strong>
                <p>Private beachfront dining with a cocktail and set menu.</p>
              </div>
            </a>
            <a className="offer-card" href="#">
              <img src="/images/suite.jpg" alt="Offer" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div className="offer-content">
                <strong>Spa indulgence</strong>
                <p>60 minute massage with aromatherapy oils.</p>
              </div>
            </a>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card className="card">
            <CardHead title="Resort map" subtitle="Explore our location" />
            <div style={{ height: 172, background: `url('/images/resort.jpg') center/cover no-repeat`, borderRadius: 8 }} />
          </Card>
          <Card>
            <CardHead title="Guest reviews" subtitle="Recent guest experiences" />
            <div className="reviews" style={{ padding: 12 }}>
              <div className="review">
                <strong>"Exceptional stay — staff were incredible."</strong>
                <p className="muted">"Lovely room, great food. Will return." — Jane D.</p>
              </div>
              <div className="review">
                <strong>"Perfect family resort."</strong>
                <p className="muted">"Kids loved the pool and activities." — The Singhs</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <CardHead
          title="Make room for a little more"
          subtitle="Thoughtful experiences, just a request away"
          action={
            <Button variant="ghost" onClick={() => navigate('/guest/services')}>
              All experiences
              <ArrowRight size={15} />
            </Button>
          }
        />
        <div className="quick-experiences">
          {[
            { name: 'Spa & wellness', text: 'Find your moment of calm', icon: Leaf },
            { name: 'In-room dining', text: 'A taste of the coast', icon: Coffee },
            { name: 'Activities', text: 'Follow your curiosity', icon: Waves },
            {
              name: 'Guest support',
              text: 'We’re here for the little things',
              icon: MessageSquare,
            },
          ].map((x, i) => (
            <button
              key={x.name}
              onClick={() => navigate(i === 3 ? '/guest/support' : '/guest/services?new=1')}
            >
              <span>
                <x.icon size={26} />
              </span>
              <strong>{x.name}</strong>
              <small>{x.text}</small>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </Card>
    </PageMotion>
  );
}
function StaffDashboard() {
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const tasks = s.tasks.filter((t) => t.assignee === actor!.id),
    services = s.services.filter((x) => x.assignee === actor!.id);
  const done = tasks.filter((t) => t.status === 'Completed').length;
  const workload =
    tasks.filter((t) => t.status !== 'Completed').length +
    services.filter((x) => !['Completed', 'Cancelled'].includes(x.status)).length;
  return (
    <PageMotion>
      <PageTitle
        eyebrow={`${actor!.role.toUpperCase()} · YOUR DAILY WORKSPACE`}
        title={`A great day starts with you, ${actor!.name.split(' ')[0]}.`}
        description="Your priorities, your team, and all the little details in one place."
      />
      <div className="staff-welcome">
        <div>
          <span className="eyebrow">TODAY’S SHIFT</span>
          <h2>{actor!.shift}</h2>
          <p>
            <span className="live-dot" /> You’re on the {actor!.role.toLowerCase()} team
          </p>
        </div>
        <div>
          <Sun size={38} />
          <span>Let’s make someone’s day.</span>
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          label="Open assignments"
          value={workload}
          icon={ClipboardCheck}
          detail="Your tasks and service requests"
        />
        <Stat
          label="Completed tasks"
          value={done}
          icon={Sparkles}
          detail="Every detail makes a difference"
        />
        <Stat
          label="High priority"
          value={tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length}
          icon={Clock3}
          detail="Give these a little attention first"
        />
        <Stat
          label="Service requests"
          value={services.filter((x) => x.status === 'Requested').length}
          icon={Coffee}
          detail="Awaiting your acceptance"
        />
      </div>
      <div className="dashboard-middle">
        <Card>
          <CardHead
            title="Your priorities"
            subtitle="A little focus for a seamless day"
            action={
              can(s, actor!, 'tasks') ? (
                <Button variant="ghost" onClick={() => navigate('/staff/tasks')}>
                  All tasks
                  <ArrowRight size={15} />
                </Button>
              ) : undefined
            }
          />
          <div className="task-preview-list">
            {tasks
              .filter((t) => t.status !== 'Completed')
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className="task-preview">
                  <div className="task-preview-check">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <strong>{t.title}</strong>
                    <p>
                      Room {s.rooms.find((r) => r.id === t.roomId)?.number} · Due{' '}
                      {t.deadline.replace('T', ' ')}
                    </p>
                    <Badge>{t.priority}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/staff/tasks')}>
                    Open
                    <ArrowUpRight size={14} />
                  </Button>
                </div>
              ))}
            {!tasks.some((t) => t.status !== 'Completed') && (
              <Empty
                title="A clear task list"
                description="New assignments from management will appear here."
              />
            )}
          </div>
        </Card>
        <Card>
          <CardHead title="Your activity" subtitle="Small steps, great hospitality" />
          <div className="timeline">
            {s.audit
              .filter((l) => l.actor === actor!.name)
              .slice(0, 6)
              .map((l) => (
                <div key={l.id}>
                  <span className="timeline-dot" />
                  <strong>{l.action.replaceAll('.', ' · ')}</strong>
                  <p>{l.detail}</p>
                  <small>
                    {shortDate(l.date)} ·{' '}
                    {new Date(l.date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </PageMotion>
  );
}
