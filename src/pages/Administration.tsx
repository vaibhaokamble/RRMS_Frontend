import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Plus,
  Pencil,
  ShieldCheck,
  KeyRound,
  UserRoundCheck,
  UserRoundX,
  Check,
  Send,
  Building2,
  CalendarDays,
  IndianRupee,
  BedDouble,
  TrendingUp,
  Gift,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { dateOffset, today, shortDate, money, folio, roles, permissions } from '../lib/domain';
import type { Account, Promotion, Policy } from '../lib/domain';
import {
  PageTitle,
  Card,
  CardHead,
  Button,
  Badge,
  Avatar,
  DataTable,
  FormModal,
  Confirm,
  Modal,
  Fields,
  Tabs,
  PageMotion,
} from '../components/ui';
import type { FieldSpec } from '../components/ui';
import { downloadCsv } from '../lib/utils';
import { Stat } from './Dashboard';
export function Reports() {
  const reduced = useReducedMotion();
  const { s } = useStore();
  const [query] = useSearchParams();
  const [period, setPeriod] = useState(
      ['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(query.get('period') ?? '')
        ? query.get('period')!
        : 'Weekly',
    ),
    [end, setEnd] = useState(today());
  const dayCount = { Daily: 1, Weekly: 7, Monthly: 30, Yearly: 365 }[period] ?? 7;
  const start = dateOffset(1 - dayCount, new Date(end + 'T12:00:00'));
  const inRange = (date: string) => date.slice(0, 10) >= start && date.slice(0, 10) <= end;
  const paid = s.payments.filter((p) => inRange(p.date)),
    expenses = s.expenses.filter((e) => inRange(e.date)),
    reservations = s.reservations.filter((r) => inRange(r.checkIn));
  const collections = paid.reduce((n, p) => n + (p.type === 'Refund' ? -p.amount : p.amount), 0),
    cost = expenses.reduce((n, e) => n + e.amount, 0);
  const days = Array.from({ length: dayCount }, (_, i) =>
    dateOffset(i, new Date(start + 'T12:00:00')),
  );
  const rows = days.map((date) => ({
    id: date,
    date,
    collections: s.payments
      .filter((p) => p.date.slice(0, 10) === date)
      .reduce((n, p) => n + (p.type === 'Refund' ? -p.amount : p.amount), 0),
    expenses: s.expenses
      .filter((e) => e.date.slice(0, 10) === date)
      .reduce((n, e) => n + e.amount, 0),
    arrivals: s.reservations.filter(
      (r) => r.checkIn === date && !['Cancelled', 'No-show'].includes(r.status),
    ).length,
    occupied: s.reservations.filter(
      (r) => r.checkIn <= date && r.checkOut > date && !['Cancelled', 'No-show'].includes(r.status),
    ).length,
  }));
  const avgOccupancy = Math.round(
    (rows.reduce((n, r) => n + r.occupied, 0) / rows.length / s.rooms.length) * 100,
  );
  const chart =
    period === 'Yearly'
      ? Object.values(
          rows.reduce<
            Record<
              string,
              { date: string; collections: number; expenses: number; arrivals: number }
            >
          >((out, r) => {
            const key = r.date.slice(0, 7);
            out[key] ??= {
              date: new Date(key + '-15').toLocaleDateString('en-GB', {
                month: 'short',
                year: '2-digit',
              }),
              collections: 0,
              expenses: 0,
              arrivals: 0,
            };
            out[key].collections += r.collections;
            out[key].expenses += r.expenses;
            out[key].arrivals += r.arrivals;
            return out;
          }, {}),
        )
      : rows.map((r) => ({ ...r, date: shortDate(r.date) }));
  const booked = reservations.reduce(
    (o, r) => {
      const f = folio(s, r);
      return {
        room: o.room + f.room - f.discount,
        service: o.service + f.extras,
        tax: o.tax + f.tax,
      };
    },
    { room: 0, service: 0, tax: 0 },
  );
  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE STORY BEHIND YOUR NUMBERS"
        title="Reports & insights"
        description="Meaningful insights, grounded in the day-to-day life of your resort."
        actions={
          <Button
            onClick={() =>
              downloadCsv(
                `rrms-${period.toLowerCase()}-report-${end}.csv`,
                rows.map((r) => ({
                  date: r.date,
                  net_collections: r.collections,
                  expenses: r.expenses,
                  net_cash: r.collections - r.expenses,
                  arrivals: r.arrivals,
                  reserved_rooms: r.occupied,
                  occupancy_percent: Math.round((r.occupied / s.rooms.length) * 100),
                })),
              )
            }
          >
            <Download size={16} />
            Export report
          </Button>
        }
      />
      <Card className="report-filters">
        <Tabs
          tabs={['Daily', 'Weekly', 'Monthly', 'Yearly'].map((x) => ({ value: x, label: x }))}
          value={period}
          onChange={setPeriod}
        />
        <label>
          Period ending
          <input
            type="date"
            aria-label="Report period ending"
            value={end}
            onChange={(e) => setEnd(e.target.value || today())}
          />
        </label>
        <span>
          {shortDate(start)} – {shortDate(end)}
        </span>
      </Card>
      <div className="stats-grid">
        <Stat
          label="Net collections"
          value={collections}
          format={money}
          icon={IndianRupee}
          detail={`${paid.length} payment / refund transactions`}
        />
        <Stat
          label="Operating expenses"
          value={cost}
          format={money}
          icon={TrendingUp}
          detail={`${expenses.length} recorded expenses`}
        />
        <Stat
          label="Reserved occupancy"
          value={avgOccupancy}
          format={(n) => `${n}%`}
          icon={BedDouble}
          detail="Average reserved room nights in period"
        />
        <Stat
          label="Bookings arriving"
          value={reservations.length}
          icon={CalendarDays}
          detail={`${reservations.filter((r) => r.status === 'Cancelled').length} cancelled · ${reservations.filter((r) => r.status === 'No-show').length} no-shows`}
        />
      </div>
      <div className="dashboard-middle">
        <Card>
          <CardHead
            title="Collections & expenses"
            subtitle="Cash movement during the selected reporting period"
          />
          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ right: 20, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ecefe8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  width={45}
                />
                <Tooltip
                  formatter={(value, name) => [money(Number(value)), name]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                />
                <Area
                  isAnimationActive={!reduced}
                  type="monotone"
                  dataKey="collections"
                  name="Net collections"
                  fill="#e4eadc"
                  stroke="#71875e"
                  fillOpacity={0.7}
                />
                <Area
                  isAnimationActive={!reduced}
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f9efdd"
                  stroke="#c19b5a"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-key">
            <span>
              <i style={{ background: '#71875e' }} />
              Collections
            </span>
            <span>
              <i style={{ background: '#c19b5a' }} />
              Expenses
            </span>
          </div>
        </Card>
        <Card>
          <CardHead title="Booked revenue mix" subtitle="Stays starting within this period" />
          <div className="revenue-mix">
            {[
              { label: 'Room revenue', amount: booked.room, color: '#71875e' },
              { label: 'Service revenue', amount: booked.service, color: '#d4b574' },
              { label: 'Taxes charged', amount: booked.tax, color: '#a99eb8' },
            ].map((x) => (
              <div key={x.label}>
                <span>
                  {x.label}
                  <strong>{money(x.amount)}</strong>
                </span>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${Math.max(0, (x.amount / Math.max(1, booked.room + booked.service + booked.tax)) * 100)}%`,
                      background: x.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="net-cash">
              <small>NET CASH AFTER EXPENSES</small>
              <strong>{money(collections - cost)}</strong>
              <p>Net collections minus recorded operating expenses.</p>
            </div>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHead
          title="Booking trends"
          subtitle="Arrivals by scheduled check-in date, excluding cancellations and no-shows"
        />
        <div className="booking-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: 0, right: 20 }}>
              <CartesianGrid vertical={false} stroke="#ecefe8" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar
                isAnimationActive={!reduced}
                dataKey="arrivals"
                name="Arrivals"
                fill="#97a781"
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-6">
        <CardHead
          title="Daily operating ledger"
          subtitle="All values derive from shared reservation, payment and expense records"
        />
        <DataTable
          rows={[...rows].reverse()}
          searchBy={(r) => r.date}
          columns={[
            { key: 'date', label: 'Date', sort: (r) => r.date, render: (r) => shortDate(r.date) },
            {
              key: 'collections',
              label: 'Collections',
              sort: (r) => r.collections,
              render: (r) => money(r.collections),
            },
            {
              key: 'expenses',
              label: 'Expenses',
              sort: (r) => r.expenses,
              render: (r) => money(r.expenses),
            },
            {
              key: 'net',
              label: 'Net cash',
              sort: (r) => r.collections - r.expenses,
              render: (r) => <strong>{money(r.collections - r.expenses)}</strong>,
            },
            {
              key: 'arrivals',
              label: 'Arrivals',
              sort: (r) => r.arrivals,
              render: (r) => r.arrivals,
            },
            {
              key: 'rooms',
              label: 'Reserved rooms',
              render: (r) => `${r.occupied} / ${s.rooms.length}`,
            },
          ]}
          pageSize={10}
        />
      </Card>
    </PageMotion>
  );
}
export function Accounts() {
  const { s, actor, act } = useStore();
  const [create, setCreate] = useState(false),
    [reset, setReset] = useState<Account | null>(null),
    [toggle, setToggle] = useState<Account | null>(null),
    [credentials, setCredentials] = useState<Account | null>(null);
  const accounts = s.accounts.filter((a) => a.module !== 'Guest');
  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE RIGHT PEOPLE. THE RIGHT ACCESS."
        title="Accounts & team"
        description="Welcome new team members and manage access across your resort."
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={16} />
            Create account
          </Button>
        }
      />
      <Card>
        <DataTable
          rows={accounts}
          searchBy={(a) => `${a.name} ${a.email} ${a.role}`}
          placeholder="Search team accounts…"
          columns={[
            {
              key: 'name',
              label: 'Team member',
              sort: (a) => a.name,
              render: (a) => (
                <div className="person-cell">
                  <Avatar name={a.name} />
                  <div>
                    <strong>{a.name}</strong>
                    <small>{a.email}</small>
                  </div>
                </div>
              ),
            },
            { key: 'module', label: 'Workspace', render: (a) => a.module },
            { key: 'role', label: 'Role', render: (a) => <Badge>{a.role}</Badge> },
            {
              key: 'status',
              label: 'Status',
              render: (a) => <Badge>{a.active ? 'Active' : 'Inactive'}</Badge>,
            },
            {
              key: 'actions',
              label: 'Account actions',
              render: (a) =>
                a.id !== actor!.id && (
                  <div className="row-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCredentials(a)}
                      aria-label={`Credentials for ${a.name}`}
                    >
                      <KeyRound size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setReset(a)}>
                      Reset password
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToggle(a)}>
                      {a.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
            },
          ]}
        />
      </Card>
      {create && (
        <FormModal
          title="Welcome a new team member"
          description="A simulated account will be created with demo credentials. No email is sent."
          initial={{ role: 'Receptionist', shift: '09:00 – 17:00' }}
          fields={[
            { name: 'name', label: 'Full name', required: true },
            { name: 'email', label: 'Email address', type: 'email', required: true },
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              required: true,
              options: ['Management', ...roles].map((x) => ({ value: x, label: x })),
            },
            { name: 'shift', label: 'Assigned shift', required: true },
          ]}
          submit="Create account"
          onClose={() => setCreate(false)}
          onSubmit={(v) =>
            act(
              { type: 'account.create', payload: v },
              'Team account created. View credentials in the account row.',
            )
          }
        />
      )}
      {reset && (
        <Confirm
          title={`Reset ${reset.name}’s demo password?`}
          description="This replaces the current password with a new demo password that meets the Owner policy. View the credentials after resetting."
          label="Reset demo password"
          onClose={() => setReset(null)}
          onConfirm={() =>
            act(
              { type: 'account.update', payload: { id: reset.id, reset: true } },
              'Demo password reset. Open the key icon to view credentials.',
            )
          }
        />
      )}
      {toggle && (
        <Confirm
          title={`${toggle.active ? 'Deactivate' : 'Activate'} ${toggle.name}?`}
          description={
            toggle.active
              ? 'This account will no longer be able to access any workspace. Existing assignments are retained and can be reassigned.'
              : 'This account will regain access to the screens allowed by its role.'
          }
          label={toggle.active ? 'Deactivate account' : 'Activate account'}
          onClose={() => setToggle(null)}
          onConfirm={() =>
            act(
              { type: 'account.update', payload: { id: toggle.id, active: !toggle.active } },
              'Account access updated',
            )
          }
        />
      )}
      {credentials && (
        <Modal
          open
          onClose={() => setCredentials(null)}
          title="Demo credentials"
          description="These credentials are for a simulated local account."
        >
          <div className="dialog-body credential-box">
            <span>Email</span>
            <code>{credentials.email}</code>
            <span>Password</span>
            <code>{s.accounts.find((a) => a.id === credentials.id)?.password}</code>
          </div>
        </Modal>
      )}
    </PageMotion>
  );
}
export function Permissions() {
  const { s, act } = useStore();
  return (
    <PageMotion>
      <PageTitle
        eyebrow="CLEAR RESPONSIBILITIES. CONFIDENT TEAMS."
        title="Roles & permissions"
        description="Choose the screens and actions each role can access. Changes take effect immediately."
      />
      <div className="info-box">
        Staff always see their own assigned work. Guest data stays scoped to the signed-in guest.
        Owner access remains available to manage the resort.
      </div>
      <Card className="card-padding mb-6">
        <label className="property-checkbox"><input type="checkbox" aria-label="Owner property administration" checked={s.ownerPropertyAdmin !== false} onChange={e => act({ type: 'property.permissions', payload: { enabled: e.target.checked } }, 'Owner property administration updated')} /><span>Owner property administration<small>Allow Owner to add and edit rooms and amenities. Monitoring and activation controls remain available.</small></span></label>
      </Card>
      <Card>
        <div className="table-scroll">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Screen / action</th>
                {['Management', ...roles].map((r) => (
                  <th key={r}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p}>
                  <td>
                    <strong>{p.charAt(0).toUpperCase() + p.slice(1)}</strong>
                    <small>
                      {p === 'refunds'
                        ? 'Authorize simulated refunds'
                        : p === 'settings'
                          ? 'Edit resort profile'
                          : `View and manage ${p}`}
                    </small>
                  </td>
                  {['Management', ...roles].map((r) => (
                    <td key={r}>
                      <input
                        type="checkbox"
                        aria-label={`${r} ${p} permission`}
                        checked={(s.permissions[r] ?? []).includes(p)}
                        onChange={(e) =>
                          act(
                            {
                              type: 'permissions.update',
                              payload: { role: r, permission: p, enabled: e.target.checked },
                            },
                            `${r} permission updated`,
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="muted mt-4">
        Permissions control navigation and are checked again when an action is saved. These are demo
        UI permissions, not a production security boundary.
      </p>
    </PageMotion>
  );
}
export function Audit() {
  const { s } = useStore();
  const [type, setType] = useState('All');
  const rows = s.audit.filter(
    (l) =>
      type === 'All' ||
      (type === 'Logins'
        ? l.action === 'login'
        : type === 'Payments'
          ? l.action.startsWith('payment')
          : type === 'Configuration'
            ? ['policies', 'permissions', 'account'].some((x) => l.action.startsWith(x))
            : !['login', 'payment', 'policies', 'permissions', 'account'].some((x) =>
                l.action.startsWith(x),
              )),
  );
  return (
    <PageMotion>
      <PageTitle
        eyebrow="A CLEAR RECORD OF EVERY IMPORTANT MOMENT"
        title="Audit & activity"
        description="Follow account access, financial transactions, and changes around your resort."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                'audit-log.csv',
                rows.map((r) => ({ ...r })),
              )
            }
          >
            <Download size={16} />
            Export log
          </Button>
        }
      />
      <Card>
        <Tabs
          tabs={['All', 'Logins', 'Payments', 'Configuration', 'Operations'].map((x) => ({
            value: x,
            label: x,
          }))}
          value={type}
          onChange={setType}
        />
        <DataTable
          rows={rows}
          searchBy={(l) => `${l.actor} ${l.role} ${l.action} ${l.detail} ${l.date}`}
          placeholder="Search actor, action, record or date…"
          columns={[
            {
              key: 'date',
              label: 'Timestamp',
              sort: (l) => l.date,
              render: (l) => (
                <>
                  {shortDate(l.date)}
                  <small>{new Date(l.date).toLocaleTimeString('en-GB')}</small>
                </>
              ),
            },
            {
              key: 'actor',
              label: 'Actor',
              sort: (l) => l.actor,
              render: (l) => (
                <>
                  <strong>{l.actor}</strong>
                  <small>{l.role}</small>
                </>
              ),
            },
            {
              key: 'action',
              label: 'Action',
              sort: (l) => l.action,
              render: (l) => <Badge>{l.action}</Badge>,
            },
            { key: 'detail', label: 'Record / detail', render: (l) => l.detail },
          ]}
          pageSize={12}
        />
      </Card>
    </PageMotion>
  );
}
export function Settings() {
  const { s, actor, act } = useStore();
  const owner = actor!.module === 'Owner';
  const [tab, setTab] = useState('Resort profile'),
    [v, setV] = useState<Record<string, any>>({ ...s.policies });
  const tabs = owner
    ? ['Resort profile', 'Operating policies', 'Demo integrations', 'Security']
    : ['Resort profile'];
  const fields: FieldSpec[] =
    tab === 'Resort profile'
      ? [
          { name: 'resortName', label: 'Resort name', required: true },
          { name: 'location', label: 'Location', required: true },
          { name: 'email', label: 'Resort email', type: 'email', required: true },
          { name: 'phone', label: 'Phone number', required: true },
          { name: 'description', label: 'A little about the resort', type: 'textarea', wide: true },
        ]
      : tab === 'Operating policies'
        ? [
            {
              name: 'tax',
              label: 'Tax on new reservations (%)',
              type: 'number',
              min: 0,
              max: 30,
              required: true,
              hint: 'Existing stays keep their agreed tax rate.',
            },
            {
              name: 'maxDiscount',
              label: 'Maximum room discount (%)',
              type: 'number',
              min: 0,
              max: 50,
              required: true,
            },
            { name: 'checkIn', label: 'Check-in time', type: 'time', required: true },
            { name: 'checkOut', label: 'Check-out time', type: 'time', required: true },
            {
              name: 'cancellationHours',
              label: 'Guest cancellation notice (hours)',
              type: 'number',
              min: 0,
              max: 168,
              required: true,
              wide: true,
            },
          ]
        : tab === 'Demo integrations'
          ? [
              {
                name: 'payments',
                label: 'Simulated payment gateway',
                type: 'checkbox',
                hint: 'Allow simulated stay payments',
              },
              {
                name: 'notifications',
                label: 'In-app notifications',
                type: 'checkbox',
                hint: 'Create notifications for resort activity',
              },
              {
                name: 'emailEnabled',
                label: 'Email simulation',
                type: 'checkbox',
                hint: 'Allow simulated email queue',
              },
              {
                name: 'smsEnabled',
                label: 'SMS simulation',
                type: 'checkbox',
                hint: 'Allow simulated SMS queue',
              },
            ]
          : [
              {
                name: 'minPassword',
                label: 'Minimum length for issued demo passwords',
                type: 'number',
                min: 8,
                max: 12,
                required: true,
                wide: true,
                hint: 'Applies when accounts are created or passwords are reset. Existing passwords remain valid.',
              },
            ];
  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE DETAILS THAT KEEP EVERYTHING IN HARMONY"
        title={owner ? 'Resort & system settings' : 'Resort settings'}
        description="Shape a consistent welcome across every team and every guest experience."
      />
      <Card className="settings-card">
        <Tabs tabs={tabs.map((x) => ({ value: x, label: x }))} value={tab} onChange={setTab} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload = owner
              ? v
              : Object.fromEntries(
                  ['resortName', 'location', 'email', 'phone', 'description'].map((k) => [k, v[k]]),
                );
            act(
              { type: 'policies.update', payload },
              'Resort settings saved across all workspaces',
            );
          }}
        >
          <div className="card-padding">
            {tab === 'Resort profile' && (
              <div className="settings-property">
                <div>
                  <Building2 size={32} />
                </div>
                <span>
                  <h2>{v.resortName}</h2>
                  <p>{v.location}</p>
                </span>
                <Badge>30 rooms</Badge>
              </div>
            )}
            {tab === 'Security' && (
              <div className="info-box">
                This is a browser-only demo. Account access, role checks and audit logs are
                simulated; production requires server-side authentication and authorization.
              </div>
            )}
            <Fields
              fields={fields}
              values={v}
              onChange={(k, value) => setV({ ...v, [k]: value })}
            />
            {tab === 'Demo integrations' && (
              <div className="integration-test">
                <h3>Try your saved configuration</h3>
                <p>No external email, SMS, or payment provider is contacted.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    act(
                      { type: 'message.test', payload: { channel: 'Email' } },
                      'Demo email queued. No message was sent.',
                    )
                  }
                >
                  <Send size={15} />
                  Simulate email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    act(
                      { type: 'message.test', payload: { channel: 'SMS' } },
                      'Demo SMS queued. No message was sent.',
                    )
                  }
                >
                  <Send size={15} />
                  Simulate SMS
                </Button>
              </div>
            )}
          </div>
          <div className="settings-footer">
            <span>Changes apply across all four workspaces.</span>
            <Button type="submit">
              Save settings
              <Check size={16} />
            </Button>
          </div>
        </form>
      </Card>
    </PageMotion>
  );
}
export function Promotions() {
  const { s, act } = useStore();
  const [edit, setEdit] = useState<Promotion | Partial<Promotion> | null>(null);
  return (
    <PageMotion>
      <PageTitle
        eyebrow="A FEW MORE REASONS TO STAY"
        title="Offers & packages"
        description="Thoughtful offers for longer escapes and memorable seasons."
        actions={
          <Button
            onClick={() =>
              setEdit({ start: today(), end: dateOffset(30), active: true, kind: 'Package' })
            }
          >
            <Plus size={16} />
            Create an offer
          </Button>
        }
      />
      <div className="promotion-grid">
        {s.promotions.map((p) => (
          <Card className="promotion-card" key={p.id}>
            <div className="promotion-art">
              <Gift size={38} />
              <span>
                {p.discount}
                <small>% OFF</small>
              </span>
            </div>
            <div className="card-padding">
              <div className="flex-between">
                <span className="eyebrow">{p.kind}</span>
                <Badge>{p.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <h2>{p.name}</h2>
              <p>
                {shortDate(p.start)} – {shortDate(p.end)}
              </p>
              <div className="promo-code">{p.code}</div>
              <Button variant="outline" onClick={() => setEdit(p)}>
                <Pencil size={15} />
                Edit offer
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {edit && (
        <FormModal
          title={edit.id ? 'Edit your offer' : 'Create a thoughtful offer'}
          description={`Offers apply during manual reservation pricing. Owner discount limit: ${s.policies.maxDiscount}%.`}
          initial={edit}
          fields={[
            { name: 'name', label: 'Offer name', required: true, wide: true },
            { name: 'code', label: 'Promotion code', required: true },
            {
              name: 'discount',
              label: 'Discount (%)',
              type: 'number',
              min: 1,
              max: s.policies.maxDiscount,
              required: true,
            },
            { name: 'start', label: 'Start date', type: 'date', required: true },
            { name: 'end', label: 'End date', type: 'date', required: true },
            {
              name: 'kind',
              label: 'Offer type',
              type: 'select',
              required: true,
              options: ['Package', 'Seasonal pricing', 'Promotion'].map((x) => ({
                value: x,
                label: x,
              })),
            },
            { name: 'active', label: 'Availability', type: 'checkbox', hint: 'Offer is active' },
          ]}
          onClose={() => setEdit(null)}
          onSubmit={(v) =>
            act({ type: 'promotion.save', payload: v }, 'Offer saved and available to reception')
          }
        />
      )}
    </PageMotion>
  );
}
