import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Download,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  BedDouble,
  Users,
  Check,
  KeyRound,
  CreditCard,
  LogIn,
  LogOut,
  Pencil,
  X,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import {
  available,
  dateOffset,
  today,
  shortDate,
  money,
  nights,
  folio,
  live,
  can,
} from '../lib/domain';
import type { Reservation } from '../lib/domain';
import {
  Button,
  PageTitle,
  Card,
  CardHead,
  DataTable,
  Badge,
  Avatar,
  Tabs,
  Modal,
  FormModal,
  Confirm,
  Fields,
  Empty,
  PageMotion,
} from '../components/ui';
import type { FieldSpec } from '../components/ui';
import { download, downloadCsv } from '../lib/utils';
export default function Reservations() {
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') ?? 'All');
  const guest = actor!.module === 'Guest';
  const base = `/${actor!.module.toLowerCase()}`;
  const all = s.reservations.filter((r) => !guest || r.guestId === actor!.guestId);
  const labels = guest
    ? ['Upcoming', 'Active', 'Completed', 'Cancelled']
    : ['All', 'Arrivals', 'In house', 'Upcoming', 'Completed', 'Cancelled'];
  const match = (r: Reservation, t: string) =>
    t === 'All' ||
    (t === 'Arrivals' && r.checkIn === today() && r.status === 'Confirmed') ||
    (['Active', 'In house'].includes(t) && r.status === 'Checked in') ||
    (t === 'Upcoming' && r.status === 'Confirmed') ||
    (t === 'Completed' && r.status === 'Completed') ||
    (t === 'Cancelled' && ['Cancelled', 'No-show'].includes(r.status));
  const current = guest && tab === 'All' ? 'Active' : tab;
  const rows = all.filter((r) => match(r, current));
  return (
    <PageMotion>
      <PageTitle
        eyebrow={guest ? 'YOUR STAYS, BEAUTIFULLY ORGANIZED' : 'FRONT DESK'}
        title={guest ? 'My bookings' : 'Reservations'}
        description={
          guest
            ? 'Everything you need for your next chapter at the Palm.'
            : 'From the first hello to the fondest farewell.'
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'reservations.csv',
                  rows.map((r) => ({
                    ...r,
                    guest: s.guests.find((g) => g.id === r.guestId)?.name,
                    history: r.history.map((h) => h.text).join('; '),
                  })),
                )
              }
            >
              <Download size={16} />
              Export
            </Button>
            {!guest && (
              <Button onClick={() => setParams({ new: '1' })}>
                <Plus size={17} />
                New reservation
              </Button>
            )}
          </>
        }
      />
      {!guest && s.changes.some((c) => c.status === 'Pending') && (
        <Card className="requests-banner">
          <div>
            <h3>
              {s.changes.filter((c) => c.status === 'Pending').length} guest changes awaiting your
              review
            </h3>
            <p>A quick decision helps your guests plan their stay.</p>
          </div>
          {s.changes
            .filter((c) => c.status === 'Pending')
            .map((c) => (
              <div className="request-inline" key={c.id}>
                <span>
                  <Link to={`${base}/reservations/${c.reservationId}`}>{c.reservationId}</Link> ·{' '}
                  {c.kind}
                  <small>
                    {c.reason}
                    {c.kind === 'Modification'
                      ? ` · Requested check-out: ${shortDate(c.checkOut)}`
                      : ''}
                  </small>
                </span>
                <Button
                  size="sm"
                  onClick={() =>
                    act(
                      { type: 'change.resolve', payload: { id: c.id, approve: true } },
                      'Guest request approved',
                    )
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    act(
                      { type: 'change.resolve', payload: { id: c.id, approve: false } },
                      'Guest request declined',
                    )
                  }
                >
                  Decline
                </Button>
              </div>
            ))}
        </Card>
      )}
      <Card>
        <Tabs
          tabs={labels.map((t) => ({
            value: t,
            label: t,
            count: all.filter((r) => match(r, t)).length,
          }))}
          value={current}
          onChange={setTab}
        />
        <DataTable
          rows={rows}
          searchBy={(r) =>
            `${r.id} ${s.guests.find((g) => g.id === r.guestId)?.name} ${s.rooms.find((x) => x.id === r.roomId)?.number}`
          }
          placeholder="Search guest, reservation or room…"
          columns={[
            {
              key: 'guest',
              label: guest ? 'Reservation' : 'Guest',
              sort: (r) => s.guests.find((g) => g.id === r.guestId)!.name,
              render: (r) => {
                const g = s.guests.find((g) => g.id === r.guestId)!;
                return (
                  <div className="person-cell">
                    <Avatar name={g.name} />
                    <div>
                      <Link className="table-link" to={`${base}/reservations/${r.id}`}>
                        {guest ? r.id : g.name}
                      </Link>
                      <small>{guest ? r.source : r.id}</small>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'room',
              label: 'Room',
              sort: (r) => r.roomId,
              render: (r) => {
                const room = s.rooms.find((x) => x.id === r.roomId)!;
                return (
                  <>
                    <strong>{room.number}</strong>
                    <small>{room.type}</small>
                  </>
                );
              },
            },
            {
              key: 'dates',
              label: 'Stay dates',
              sort: (r) => r.checkIn,
              render: (r) => (
                <>
                  {shortDate(r.checkIn)} → {shortDate(r.checkOut)}
                  <small>
                    {nights(r.checkIn, r.checkOut)} nights · {r.adults} guests
                  </small>
                </>
              ),
            },
            {
              key: 'total',
              label: 'Total',
              sort: (r) => folio(s, r).total,
              render: (r) => (
                <>
                  <strong>{money(folio(s, r).total)}</strong>
                  <small>{money(Math.max(0, folio(s, r).balance))} due</small>
                </>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              sort: (r) => r.status,
              render: (r) => <Badge>{r.status}</Badge>,
            },
            {
              key: 'action',
              label: '',
              render: (r) => (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`View reservation ${r.id}`}
                  onClick={() => navigate(`${base}/reservations/${r.id}`)}
                >
                  <ArrowUpRight size={17} />
                </Button>
              ),
            },
          ]}
        />
      </Card>
      {guest && (
        <Card className="mt-6">
          <CardHead
            title="Your change requests"
            subtitle="We’ll keep you updated every step of the way"
          />
          {s.changes.filter((c) => all.some((r) => r.id === c.reservationId)).length ? (
            <div className="simple-list">
              {s.changes
                .filter((c) => all.some((r) => r.id === c.reservationId))
                .map((c) => (
                  <div key={c.id}>
                    <span>
                      <strong>
                        {c.kind} · {c.reservationId}
                      </strong>
                      <small>{c.reason}</small>
                    </span>
                    <Badge>{c.status}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              title="No change requests"
              description="Open a booking to request a modification or cancellation."
            />
          )}
        </Card>
      )}
      {!guest && params.has('new') && <ReservationWizard onClose={() => setParams({})} />}
    </PageMotion>
  );
}
export function ReservationWizard({ onClose }: { onClose: () => void }) {
  const { s, act } = useStore();
  const [step, setStep] = useState(0),
    [created, setCreated] = useState(false);
  const [v, setV] = useState<Record<string, any>>({
    guestId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    preferences: '',
    checkIn: today(),
    checkOut: dateOffset(3),
    roomId: '',
    adults: 2,
    source: 'Walk-in',
    discount: 0,
    notes: '',
    offer: '',
  });
  const change = (k: string, value: any) =>
    setV((prev) => ({
      ...prev,
      [k]: value,
      ...(k === 'checkIn' || k === 'checkOut' ? { roomId: '' } : {}),
    }));
  const room = s.rooms.find((r) => r.id === v.roomId);
  const guest = s.guests.find((g) => g.id === v.guestId);
  const base = room ? nights(v.checkIn, v.checkOut) * room.rate : 0;
  const total = Math.round((base - Number(v.discount)) * (1 + s.policies.tax / 100));
  const steps = [
    'Guest details',
    'Dates & room',
    'Pricing & offers',
    'Review & confirm',
    'Guest credentials',
  ];
  const free = s.rooms.filter(
    (r) => available(s, r.id, v.checkIn, v.checkOut) && r.capacity >= v.adults,
  );
  const next = () => {
    if (
      step === 1 &&
      (!room || !available(s, room.id, v.checkIn, v.checkOut) || nights(v.checkIn, v.checkOut) <= 0)
    ) {
      toast.error('Choose valid dates and an available room.');
      return;
    }
    if (step === 2 && (v.discount < 0 || v.discount > (base * s.policies.maxDiscount) / 100)) {
      toast.error(`Discount cannot exceed ${s.policies.maxDiscount}%.`);
      return;
    }
    if (step === 3) {
      if (
        act(
          { type: 'reservation.create', payload: v },
          'Reservation confirmed. Guest access is now ready.',
        )
      ) {
        setCreated(true);
        setStep(4);
      }
      return;
    }
    setStep(step + 1);
  };
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={created ? 'A wonderful stay starts here' : 'Create a reservation'}
      description="Manually confirm a stay and provide your guest with secure demo access."
    >
      <div className="wizard-steps">
        {steps.map((name, i) => (
          <div key={name} className={`${step === i ? 'current' : ''} ${step > i ? 'done' : ''}`}>
            <span>{step > i ? <Check size={14} /> : i + 1}</span>
            <small>{name}</small>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <div className="dialog-body wizard-body">
          {step === 0 && (
            <>
              <Fields
                fields={[
                  {
                    name: 'guestId',
                    label: 'Existing guest (optional)',
                    type: 'select',
                    options: s.guests.map((g) => ({
                      value: g.id,
                      label: `${g.name} · ${g.email}`,
                    })),
                    wide: true,
                  },
                ]}
                values={v}
                onChange={change}
              />
              {guest ? (
                <div className="guest-summary">
                  <Avatar name={guest.name} size="large" />
                  <div>
                    <h3>{guest.name}</h3>
                    <p>
                      {guest.email} · {guest.phone}
                    </p>
                    <small>{guest.preferences}</small>
                  </div>
                </div>
              ) : (
                <Fields
                  fields={[
                    { name: 'name', label: 'Full name', required: true },
                    { name: 'email', label: 'Email address', type: 'email', required: true },
                    { name: 'phone', label: 'Phone number', type: 'tel', required: true },
                    { name: 'address', label: 'Address' },
                    {
                      name: 'preferences',
                      label: 'Guest preferences',
                      type: 'textarea',
                      wide: true,
                    },
                  ]}
                  values={v}
                  onChange={change}
                />
              )}
              <div className="info-box">
                Guest access is issued only after this reservation is confirmed.
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <Fields
                fields={[
                  {
                    name: 'checkIn',
                    label: 'Check-in',
                    type: 'date',
                    required: true,
                    min: today(),
                  },
                  {
                    name: 'checkOut',
                    label: 'Check-out',
                    type: 'date',
                    required: true,
                    min: dateOffset(1, new Date(v.checkIn + 'T12:00:00')),
                  },
                  {
                    name: 'adults',
                    label: 'Number of guests',
                    type: 'number',
                    min: 1,
                    max: 4,
                    required: true,
                  },
                  {
                    name: 'source',
                    label: 'Booking source',
                    type: 'select',
                    options: ['Walk-in', 'Phone', 'Direct', 'Travel partner'].map((x) => ({
                      value: x,
                      label: x,
                    })),
                    required: true,
                  },
                ]}
                values={v}
                onChange={change}
              />
              <h3 className="section-title">
                Available rooms <span className="muted">({free.length})</span>
              </h3>
              <div className="room-choice-grid">
                {free.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className={`room-choice ${v.roomId === r.id ? 'selected' : ''}`}
                    onClick={() => change('roomId', r.id)}
                  >
                    <span>
                      <BedDouble size={20} />
                      <strong>{r.number}</strong>
                      {v.roomId === r.id && <Check size={16} />}
                    </span>
                    <b>{r.type}</b>
                    <small>
                      {money(r.rate)} / night · {r.capacity} guests
                    </small>
                    <Badge>{r.status}</Badge>
                  </button>
                ))}
              </div>
              {!free.length && (
                <Empty
                  title="No rooms available"
                  description="Try different dates or a smaller guest party."
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="price-summary">
                <span>
                  {room?.type} · {nights(v.checkIn, v.checkOut)} nights × {money(room?.rate ?? 0)}
                </span>
                <strong>{money(base)}</strong>
              </div>
              <Fields
                fields={[
                  {
                    name: 'offer',
                    label: 'Available offer',
                    type: 'select',
                    wide: true,
                    options: s.promotions
                      .filter(
                        (p) =>
                          p.active &&
                          p.start <= v.checkIn &&
                          p.end >= v.checkIn &&
                          p.discount <= s.policies.maxDiscount,
                      )
                      .map((p) => ({ value: p.id, label: `${p.name} · ${p.discount}% off` })),
                  },
                  {
                    name: 'discount',
                    label: 'Discount (₹)',
                    type: 'number',
                    min: 0,
                    max: (base * s.policies.maxDiscount) / 100,
                    hint: `Owner policy: up to ${s.policies.maxDiscount}%`,
                    required: true,
                  },
                  { name: 'notes', label: 'Stay notes', type: 'textarea', wide: true },
                ]}
                values={v}
                onChange={(k, value) => {
                  if (k === 'offer') {
                    const offer = s.promotions.find((p) => p.id === value);
                    setV({
                      ...v,
                      offer: value,
                      discount: offer ? Math.round((base * offer.discount) / 100) : 0,
                    });
                  } else change(k, value);
                }}
              />
              <div className="price-summary">
                <span>Total including {s.policies.tax}% tax</span>
                <strong>{money(total)}</strong>
              </div>
              <p className="muted">Advance payments are handled outside this application.</p>
            </>
          )}
          {step === 3 && (
            <>
              <div className="review-banner">
                <ShieldCheck size={28} />
                <div>
                  <h3>One last look before a warm welcome.</h3>
                  <p>Confirm these details to create the reservation and unlock guest access.</p>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Guest</dt>
                  <dd>{guest?.name ?? v.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{guest?.email ?? v.email}</dd>
                </div>
                <div>
                  <dt>Room</dt>
                  <dd>
                    {room?.number} · {room?.type}
                  </dd>
                </div>
                <div>
                  <dt>Party</dt>
                  <dd>{v.adults} guests</dd>
                </div>
                <div>
                  <dt>Check-in</dt>
                  <dd>{shortDate(v.checkIn)}</dd>
                </div>
                <div>
                  <dt>Check-out</dt>
                  <dd>{shortDate(v.checkOut)}</dd>
                </div>
                <div>
                  <dt>Discount</dt>
                  <dd>{money(Number(v.discount))}</dd>
                </div>
                <div>
                  <dt>Total with tax</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              {v.notes && <div className="info-box">{v.notes}</div>}
            </>
          )}
          {step === 4 && (
            <div className="credentials-success">
              <span className="success-icon">
                <Check size={30} />
              </span>
              <h2>Confirmed. Let the stay begin.</h2>
              <p>Share these demo credentials with your guest at reception.</p>
              <div className="credential-box">
                <span>Email</span>
                <code>{guest?.email ?? v.email}</code>
                <span>Demo password</span>
                <code>
                  {s.accounts.find((a) => a.email === (guest?.email ?? v.email))?.password ??
                    'Resort@123'}
                </code>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  download(
                    'guest-credentials.txt',
                    `RRMS · ${s.policies.resortName}\nGuest: ${guest?.name ?? v.name}\nEmail: ${guest?.email ?? v.email}\nDemo password: ${s.accounts.find((a) => a.email === (guest?.email ?? v.email))?.password ?? 'Resort@123'}\nThis is a local demonstration account.`,
                  )
                }
              >
                <Download size={16} />
                Download guest credentials
              </Button>
              <small>No email or SMS was sent. This is a simulated account.</small>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          {step < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            >
              {step > 0 && <ArrowLeft size={15} />} {step === 0 ? 'Cancel' : 'Back'}
            </Button>
          )}
          {step < 4 ? (
            <Button type="submit">
              {step === 3 ? 'Confirm reservation' : 'Continue'}
              <ArrowRight size={15} />
            </Button>
          ) : (
            <Button type="button" onClick={onClose}>
              Done
              <Check size={15} />
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
export function ReservationDetails() {
  const { id } = useParams();
  const { s, actor, act } = useStore();
  const navigate = useNavigate();
  const [modal, setModal] = useState('');
  const r = s.reservations.find(
    (r) => r.id === id && (actor!.module !== 'Guest' || r.guestId === actor!.guestId),
  );
  if (!r)
    return (
      <Empty
        title="Reservation not found"
        description="This reservation is unavailable to your account."
      />
    );
  const guest = actor!.module === 'Guest';
  const g = s.guests.find((g) => g.id === r.guestId)!,
    room = s.rooms.find((x) => x.id === r.roomId)!,
    f = folio(s, r);
  const base = `/${actor!.module.toLowerCase()}`;
  return (
    <PageMotion>
      <PageTitle
        eyebrow={r.id}
        title={`${g.name}’s stay`}
        description={`${room.type} · Room ${room.number} · ${nights(r.checkIn, r.checkOut)} nights`}
        actions={
          <>
            <Badge>{r.status}</Badge>
            {live(r) && (
              <Button variant="outline" onClick={() => setModal(guest ? 'request' : 'edit')}>
                <Pencil size={16} />
                {guest ? 'Request a change' : 'Edit / transfer'}
              </Button>
            )}
            {!guest && r.status === 'Confirmed' && (
              <Button
                onClick={() =>
                  act(
                    { type: 'reservation.status', payload: { id: r.id, status: 'Checked in' } },
                    'Guest checked in. Welcome to the Palm.',
                  )
                }
              >
                <LogIn size={16} />
                Check in
              </Button>
            )}
            {!guest && r.status === 'Checked in' && (
              <Button onClick={() => setModal('checkout')}>
                <LogOut size={16} />
                Check out
              </Button>
            )}
          </>
        }
      />
      <div className="detail-layout">
        <Card>
          <CardHead title="Stay details" action={<BedDouble size={20} />} />
          <div className="detail-cover">
            <img src="/images/suite.jpg" alt="Palm Resort guest suite" />
            <div>
              <span>{room.floor}</span>
              <h2>{room.type}</h2>
              <p>Space to unwind. Room to make memories.</p>
            </div>
          </div>
          <div className="card-padding">
            <dl className="detail-grid">
              <div>
                <dt>Guest</dt>
                <dd>{g.name}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {g.email}
                  <small>{g.phone}</small>
                </dd>
              </div>
              <div>
                <dt>Check-in</dt>
                <dd>
                  {shortDate(r.checkIn)} · {s.policies.checkIn}
                </dd>
              </div>
              <div>
                <dt>Check-out</dt>
                <dd>
                  {shortDate(r.checkOut)} · {s.policies.checkOut}
                </dd>
              </div>
              <div>
                <dt>Room status</dt>
                <dd>
                  <Badge>{room.status}</Badge>
                </dd>
              </div>
              <div>
                <dt>Guests & source</dt>
                <dd>
                  {r.adults} guests · {r.source}
                </dd>
              </div>
              <div>
                <dt>Preferences</dt>
                <dd>{g.preferences || 'None specified'}</dd>
              </div>
              <div>
                <dt>Identity document</dt>
                <dd>{g.document || 'Not uploaded yet'}</dd>
              </div>
            </dl>
            {r.notes && <div className="info-box">{r.notes}</div>}
            <div className="flex gap-3 mt-5">
              {!guest && (
                <Button variant="outline" onClick={() => setModal('credentials')}>
                  <KeyRound size={16} />
                  Guest credentials
                </Button>
              )}
              {!guest && r.status === 'Confirmed' && (
                <>
                  <Button variant="ghost" onClick={() => setModal('cancel')}>
                    Cancel reservation
                  </Button>
                  {r.checkIn < today() && (
                    <Button variant="ghost" onClick={() => setModal('noshow')}>
                      Mark no-show
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
        <div>
          <Card>
            <CardHead title="Guest folio" subtitle="Every detail, clearly accounted for" />
            <div className="card-padding folio-summary">
              <div>
                <span>Room charges</span>
                <strong>{money(f.room)}</strong>
              </div>
              <div>
                <span>Services</span>
                <strong>{money(f.extras)}</strong>
              </div>
              <div>
                <span>Discount</span>
                <strong>−{money(f.discount)}</strong>
              </div>
              <div>
                <span>Tax ({r.taxRate}%)</span>
                <strong>{money(f.tax)}</strong>
              </div>
              <div className="total">
                <span>Total</span>
                <strong>{money(f.total)}</strong>
              </div>
              <div>
                <span>Net payments</span>
                <strong>{money(f.paid)}</strong>
              </div>
              <div className="balance">
                <span>Balance</span>
                <strong>{money(f.balance)}</strong>
              </div>
              {can(s, actor!, 'billing') && (
                <Button onClick={() => navigate(`${base}/billing?reservation=${r.id}`)}>
                  Open folio
                  <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </Card>
          <Card className="mt-6">
            <CardHead title="Stay timeline" />
            <div className="timeline">
              {[...r.history].reverse().map((h, i) => (
                <div key={i}>
                  <span className="timeline-dot" />
                  <strong>{h.text}</strong>
                  <small>{shortDate(h.date)}</small>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {modal === 'edit' && (
        <FormModal
          title="Edit stay / transfer room"
          description="Changing rooms retains the agreed nightly rate. Active stays can transfer only to an inspected room."
          initial={r}
          fields={[
            {
              name: 'checkIn',
              label: 'Check-in',
              type: 'date',
              required: true,
              disabled: r.status === 'Checked in',
            },
            { name: 'checkOut', label: 'Check-out', type: 'date', required: true },
            {
              name: 'roomId',
              label: 'Room assignment',
              type: 'select',
              options: s.rooms.map((x) => ({
                value: x.id,
                label: `${x.number} · ${x.type} · ${x.status}`,
              })),
              required: true,
              wide: true,
            },
            { name: 'discount', label: 'Discount (₹)', type: 'number', min: 0, required: true },
            { name: 'notes', label: 'Stay notes', type: 'textarea', wide: true },
          ]}
          onClose={() => setModal('')}
          onSubmit={(v) =>
            act({ type: 'reservation.edit', payload: { ...v, id: r.id } }, 'Stay updated')
          }
        />
      )}
      {modal === 'request' && (
        <FormModal
          title="Request a booking change"
          description={`Reception will review your request. Cancellation requires ${s.policies.cancellationHours} hours’ notice.`}
          initial={{ kind: 'Modification', checkOut: r.checkOut }}
          fields={[
            {
              name: 'kind',
              label: 'Request type',
              type: 'select',
              options: (r.status === 'Confirmed'
                ? ['Modification', 'Cancellation']
                : ['Modification']
              ).map((x) => ({ value: x, label: x })),
              required: true,
            },
            { name: 'checkOut', label: 'Requested check-out', type: 'date', required: true },
            {
              name: 'reason',
              label: 'Tell us what you need',
              type: 'textarea',
              required: true,
              wide: true,
            },
          ]}
          submit="Send for approval"
          onClose={() => setModal('')}
          onSubmit={(v) =>
            act(
              { type: 'change.create', payload: { ...v, reservationId: r.id } },
              'Request sent to reception',
            )
          }
        />
      )}
      {['cancel', 'noshow', 'checkout'].includes(modal) && (
        <Confirm
          title={
            modal === 'checkout'
              ? 'Ready for a fond farewell?'
              : modal === 'noshow'
                ? 'Mark this guest as a no-show?'
                : 'Cancel this reservation?'
          }
          description={
            modal === 'checkout'
              ? 'The folio must be settled and services completed. Check-out awards loyalty points and sends the room to housekeeping.'
              : 'The room will be released. Existing payments remain on the folio for an authorized refund.'
          }
          onClose={() => setModal('')}
          onConfirm={() =>
            act(
              {
                type: 'reservation.status',
                payload: {
                  id: r.id,
                  status:
                    modal === 'checkout'
                      ? 'Completed'
                      : modal === 'noshow'
                        ? 'No-show'
                        : 'Cancelled',
                },
              },
              'Reservation updated',
            )
          }
        />
      )}
      {modal === 'credentials' && (
        <Modal
          open
          onClose={() => setModal('')}
          title="Guest access"
          description="Share these simulated credentials with the guest at reception."
        >
          <div className="dialog-body">
            <div className="credential-box">
              <span>Email</span>
              <code>{g.email}</code>
              <span>Demo password</span>
              <code>{s.accounts.find((a) => a.guestId === g.id)?.password}</code>
            </div>
            <p className="muted">No email or SMS has been sent.</p>
          </div>
        </Modal>
      )}
    </PageMotion>
  );
}
