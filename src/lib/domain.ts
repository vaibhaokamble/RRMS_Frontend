export type Module = 'Guest' | 'Management' | 'Staff' | 'Owner';
export const roles = [
  'Receptionist',
  'Housekeeping',
  'Cashier',
  'Maintenance',
  'Gardener',
  'F&B',
  'Spa',
] as const;
export type StaffRole = (typeof roles)[number];
export type Role = Module | StaffRole;
export type Permission =
  | 'reservations'
  | 'rooms'
  | 'guests'
  | 'tasks'
  | 'services'
  | 'billing'
  | 'refunds'
  | 'reports'
  | 'settings'
  | 'team'
  | 'support'
  | 'promotions';
export const permissions: Permission[] = [
  'reservations',
  'rooms',
  'guests',
  'tasks',
  'services',
  'billing',
  'refunds',
  'reports',
  'settings',
  'team',
  'support',
  'promotions',
];
export type RoomStatus = 'Ready' | 'Occupied' | 'Dirty' | 'Inspection' | 'Maintenance';
export type ReservationStatus = 'Confirmed' | 'Checked in' | 'Completed' | 'Cancelled' | 'No-show';
export interface Room {
  id: string;
  number: string;
  type: string;
  floor: string;
  rate: number;
  capacity: number;
  status: RoomStatus;
}
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  preferences: string;
  document: string;
  points: number;
}
export interface Account {
  id: string;
  name: string;
  email: string;
  password: string;
  module: Module;
  role: Role;
  active: boolean;
  createdBy?: string;
  guestId?: string;
  shift: string;
}
export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  rate: number;
  discount: number;
  taxRate: number;
  source: string;
  adults: number;
  notes: string;
  created: string;
  history: { date: string; text: string }[];
}
export interface Service {
  id: string;
  reservationId: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  options: string;
  status: 'Requested' | 'Accepted' | 'In progress' | 'Completed' | 'Cancelled';
  assignee: string;
}
export interface Task {
  id: string;
  title: string;
  role: StaffRole;
  roomId: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  status: 'Pending' | 'In progress' | 'Inspection' | 'Completed';
  notes: string;
  kind: 'Cleaning' | 'Maintenance' | 'Property' | 'General';
}
export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  type: 'Payment' | 'Refund';
  method: string;
  date: string;
  note: string;
}
export interface Complaint {
  id: string;
  guestId: string;
  subject: string;
  description: string;
  category: string;
  status: 'Open' | 'In progress' | 'Resolved';
  response: string;
  assignee: string;
  date: string;
}
export interface ChangeRequest {
  id: string;
  reservationId: string;
  kind: 'Modification' | 'Cancellation';
  checkOut: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Declined';
}
export interface Review {
  id: string;
  reservationId: string;
  guestId: string;
  rating: number;
  roomRating: number;
  serviceRating: number;
  text: string;
  date: string;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  audience: string;
  readBy: string[];
}
export interface Audit {
  id: string;
  date: string;
  actor: string;
  role: Role;
  action: string;
  detail: string;
}
export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
}
export interface Promotion {
  id: string;
  name: string;
  code: string;
  discount: number;
  start: string;
  end: string;
  active: boolean;
  kind: string;
}
export interface Policy {
  resortName: string;
  location: string;
  email: string;
  phone: string;
  description: string;
  tax: number;
  checkIn: string;
  checkOut: string;
  cancellationHours: number;
  maxDiscount: number;
  payments: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  notifications: boolean;
  minPassword: number;
}
export interface State {
  version: number;
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  accounts: Account[];
  tasks: Task[];
  services: Service[];
  payments: Payment[];
  complaints: Complaint[];
  changes: ChangeRequest[];
  reviews: Review[];
  notifications: Notification[];
  audit: Audit[];
  expenses: Expense[];
  promotions: Promotion[];
  loyalty: { id: string; guestId: string; date: string; amount: number; description: string }[];
  found: { id: string; title: string; roomId: string; date: string; status: string }[];
  policies: Policy;
  permissions: Record<string, Permission[]>;
}
export const today = () => dateOffset(0);
export function dateOffset(n: number, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const nights = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const money = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v);
export const shortDate = (s: string) =>
  new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
export const uid = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;
export const demoPassword = (s: State) => 'Resort@123'.padEnd(s.policies.minPassword, '!');
export const initials = (s: string) =>
  s
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
export const live = (r: Reservation) => ['Confirmed', 'Checked in'].includes(r.status);
export const serviceMenu = [
  {
    name: 'Balinese massage',
    category: 'Spa',
    role: 'Spa',
    amount: 2800,
    description: '60 minutes of complete relaxation',
    icon: 'spa',
  },
  {
    name: 'Fresh & folded',
    category: 'Laundry',
    role: 'Housekeeping',
    amount: 450,
    description: 'Thoughtful care for your wardrobe',
    icon: 'laundry',
  },
  {
    name: 'In-room dining',
    category: 'Food & Beverage',
    role: 'F&B',
    amount: 1200,
    description: 'Fresh coastal flavors, at your door',
    icon: 'food',
  },
  {
    name: 'Sunset kayaking',
    category: 'Activities',
    role: 'Gardener',
    amount: 900,
    description: 'A little adventure on the water',
    icon: 'activity',
  },
  {
    name: 'Airport transfer',
    category: 'Other',
    role: 'Receptionist',
    amount: 1500,
    description: 'A seamless start to your journey',
    icon: 'car',
  },
] as const;
export function can(s: State, a: Account, p: Permission) {
  return a.active && (a.module === 'Owner' || (s.permissions[a.role] ?? []).includes(p));
}
export function folio(s: State, r: Reservation) {
  const room = ['Cancelled', 'No-show'].includes(r.status)
    ? 0
    : nights(r.checkIn, r.checkOut) * r.rate;
  const services = s.services.filter((x) => x.reservationId === r.id && x.status === 'Completed');
  const extras = services.reduce((n, x) => n + x.amount, 0);
  const discount = Math.min(room, r.discount);
  const subtotal = room - discount + extras;
  const tax = Math.round((subtotal * r.taxRate) / 100);
  const total = subtotal + tax;
  const paid = s.payments
    .filter((x) => x.reservationId === r.id)
    .reduce((n, x) => n + (x.type === 'Refund' ? -x.amount : x.amount), 0);
  return { room, services, extras, discount, subtotal, tax, total, paid, balance: total - paid };
}
export function available(s: State, roomId: string, start: string, end: string, exclude = '') {
  const room = s.rooms.find((x) => x.id === roomId);
  return (
    !!room &&
    room.status !== 'Maintenance' &&
    !s.reservations.some(
      (r) =>
        r.id !== exclude && r.roomId === roomId && live(r) && r.checkIn < end && r.checkOut > start,
    )
  );
}
export function dashboard(s: State) {
  const occupied = s.rooms.filter((r) => r.status === 'Occupied').length;
  const revenue = s.payments.reduce((n, p) => n + (p.type === 'Refund' ? -p.amount : p.amount), 0);
  return {
    occupied,
    occupancy: Math.round((occupied / s.rooms.length) * 100),
    revenue,
    available: s.rooms.filter((r) => r.status === 'Ready').length,
    arrivals: s.reservations.filter((r) => r.checkIn === today() && r.status === 'Confirmed')
      .length,
    departures: s.reservations.filter((r) => r.checkOut === today() && r.status === 'Checked in')
      .length,
    pending: s.tasks.filter((t) => t.status !== 'Completed').length,
    complaints: s.complaints.filter((c) => c.status !== 'Resolved').length,
    expenses: s.expenses.reduce((n, e) => n + e.amount, 0),
    outstanding: s.reservations.reduce((n, r) => n + Math.max(0, folio(s, r).balance), 0),
  };
}
export function seed(): State {
  const names = [
    'Alex Morgan',
    'Priya Sharma',
    'James Wilson',
    'Ananya Patel',
    'Oliver Smith',
    'Sofia Garcia',
    'Arjun Mehta',
    'Emma Thompson',
    'Rohan Kapoor',
    'Isabella Rossi',
    'Liam Anderson',
    'Neha Desai',
    'Ethan Brooks',
    'Maya Chen',
    'Noah Williams',
    'Zara Khan',
    'Lucas Martin',
    'Ava Johnson',
    'Aditya Rao',
    'Grace Lee',
  ];
  const guests: Guest[] = names.map((name, i) => ({
    id: `G${i + 1}`,
    name,
    email: i === 0 ? 'guest@rrms.demo' : `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: `+91 98${String(76543000 + i)}`,
    address: [
      'Mumbai, Maharashtra, India',
      'London, United Kingdom',
      'Bengaluru, Karnataka, India',
    ][i % 3],
    preferences: [
      'Vegetarian meals · High floor',
      'Quiet room · Extra pillows',
      'Ocean view · Early breakfast',
    ][i % 3],
    document: i < 12 ? 'Identity verified · Demo document' : '',
    points: i === 0 ? 1250 : 200 + i * 70,
  }));
  const rooms: Room[] = Array.from({ length: 30 }, (_, i) => ({
    id: `R${i + 1}`,
    number: String(101 + Math.floor(i / 10) * 100 + (i % 10)),
    type: ['Garden Deluxe', 'Ocean Suite', 'Pool Villa'][Math.floor(i / 10)],
    floor: ['Garden wing', 'Ocean wing', 'Villa collection'][Math.floor(i / 10)],
    rate: [6500, 10500, 16000][Math.floor(i / 10)],
    capacity: i >= 20 ? 4 : 2,
    status:
      i < 12
        ? 'Occupied'
        : i >= 28
          ? 'Maintenance'
          : i >= 25
            ? 'Dirty'
            : i === 24
              ? 'Inspection'
              : 'Ready',
  }));
  const reservations: Reservation[] = Array.from({ length: 25 }, (_, i) => {
    const active = i < 12;
    const confirmed = i >= 12 && i < 18;
    const completed = i >= 18 && i < 23;
    return {
      id: `RES-${2401 + i}`,
      guestId: `G${i === 18 ? 1 : (i % 20) + 1}`,
      roomId: `R${i < 18 ? i + 1 : 20 + (i - 18)}`,
      checkIn: dateOffset(
        active ? -2 - (i % 3) : confirmed ? (i < 15 ? 0 : 2) : -16 + (i - 18) * 2,
      ),
      checkOut: dateOffset(
        active ? (i < 3 ? 0 : 2 + (i % 3)) : confirmed ? (i < 15 ? 3 : 5) : -13 + (i - 18) * 2,
      ),
      status: active
        ? 'Checked in'
        : confirmed
          ? 'Confirmed'
          : completed
            ? 'Completed'
            : 'Cancelled',
      rate: rooms[i < 18 ? i : 19 + (i - 18)].rate,
      discount: i % 6 === 0 ? 500 : 0,
      taxRate: 12,
      source: ['Direct', 'Phone', 'Walk-in', 'Travel partner'][i % 4],
      adults: 2,
      notes: i % 4 === 0 ? 'Anniversary stay. A warm welcome, please.' : '',
      created: dateOffset(-24 + (i % 6)),
      history: [{ date: dateOffset(-24 + (i % 6)), text: 'Reservation confirmed by reception' }],
    };
  });
  const staffNames = [
    'Sarah Williams',
    'Meera Nair',
    'David Chen',
    'Raj Kumar',
    'Elena Davis',
    'Leo Fernandes',
    'Aisha Ali',
    'Daniel Park',
    'Kavita Rao',
    'Marcus Reed',
    'Isha Shah',
    'Vikram Singh',
    'Nina Costa',
    'Ben Taylor',
  ];
  const staff: Account[] = staffNames.map((name, i) => ({
    id: `A${i + 1}`,
    name,
    email:
      `${roles[i % 7].toLowerCase().replace('&', 'and')} ${i < 7 ? '' : '2'}`.replaceAll(' ', '') +
      '@rrms.demo',
    password: 'Resort@123',
    module: 'Staff',
    role: roles[i % 7],
    active: true,
    shift: i < 7 ? '07:00 – 15:00' : '15:00 – 23:00',
  }));
  const accounts: Account[] = [
    {
      id: 'manager',
      name: 'Ananya Kapoor',
      email: 'management@rrms.demo',
      password: 'Resort@123',
      module: 'Management',
      role: 'Management',
      active: true,
      shift: '09:00 – 18:00',
    },
    {
      id: 'owner',
      name: 'Vikram Oberoi',
      email: 'owner@rrms.demo',
      password: 'Resort@123',
      module: 'Owner',
      role: 'Owner',
      active: true,
      shift: '',
    },
    ...staff,
    ...guests.map((g) => ({
      id: `account-${g.id}`,
      name: g.name,
      email: g.email,
      password: 'Resort@123',
      module: 'Guest' as Module,
      role: 'Guest' as Role,
      active: true,
      guestId: g.id,
      shift: '',
    })),
  ];
  const tasks: Task[] = Array.from({ length: 14 }, (_, i) => ({
    id: `T${i + 1}`,
    title: [
      'Prepare room for next arrival',
      'Inspect air conditioning',
      'Refresh the poolside garden',
      'Restock guest amenities',
      'Clean and sanitize room',
      'Check balcony lighting',
      'Welcome arrival guests',
    ][i % 7],
    role:
      i === 0 || i === 4 || i === 7 || i === 11
        ? 'Housekeeping'
        : i === 1 || i === 5 || i === 8 || i === 12
          ? 'Maintenance'
          : i % 7 === 2
            ? 'Gardener'
            : 'Receptionist',
    roomId: i === 0 ? 'R25' : i === 1 ? 'R29' : `R${26 + (i % 3)}`,
    assignee: '',
    priority: i % 4 === 0 ? 'High' : i % 3 === 0 ? 'Low' : 'Medium',
    deadline: today() + 'T' + (10 + (i % 8)) + ':00',
    status: i === 0 ? 'Inspection' : i === 1 ? 'In progress' : i >= 10 ? 'Completed' : 'Pending',
    notes: '',
    kind:
      i === 0 || i === 4 || i === 7 || i === 11
        ? 'Cleaning'
        : i === 1 || i === 5 || i === 8 || i === 12
          ? 'Maintenance'
          : i % 7 === 2
            ? 'Property'
            : 'General',
  }));
  tasks[4].roomId = 'R26';
  tasks[7].roomId = 'R27';
  tasks[5].roomId = 'R30';
  tasks[8].roomId = 'R28';
  tasks[8].title = 'Clean and sanitize room';
  tasks[8].kind = 'Cleaning';
  tasks[8].role = 'Housekeeping';
  tasks[11].roomId = 'R24';
  tasks[12].roomId = 'R23';
  tasks.forEach((t) => (t.assignee = staff.find((a) => a.role === t.role)!.id));
  const services: Service[] = Array.from({ length: 10 }, (_, i) => {
    const m = serviceMenu[i % 5];
    return {
      id: `S${i + 1}`,
      reservationId: reservations[i % 8].id,
      name: m.name,
      category: m.category,
      amount: m.amount,
      date: today(),
      time: `${10 + i}:00`,
      options: ['For two guests', 'No special requests', 'Vegetarian preference'][i % 3],
      status: i < 3 ? 'Requested' : i < 6 ? 'In progress' : 'Completed',
      assignee: staff.find((a) => a.role === m.role)!.id,
    };
  });
  const state: State = {
    version: 1,
    rooms,
    guests,
    reservations,
    accounts,
    tasks,
    services,
    payments: [],
    complaints: [
      {
        id: 'C1',
        guestId: 'G4',
        subject: 'Air conditioning needs attention',
        description: 'The room is not cooling evenly. Please arrange an inspection.',
        category: 'Maintenance',
        status: 'Open',
        response: '',
        assignee: 'A4',
        date: today(),
      },
      {
        id: 'C2',
        guestId: 'G1',
        subject: 'Extra pillows, please',
        description: 'Could we have two extra pillows this evening?',
        category: 'Request',
        status: 'In progress',
        response: 'Housekeeping will deliver these shortly.',
        assignee: 'A2',
        date: today(),
      },
      {
        id: 'C3',
        guestId: 'G8',
        subject: 'Breakfast dietary request',
        description: 'Please confirm gluten-free options.',
        category: 'Food & Beverage',
        status: 'Resolved',
        response: 'Our chef has arranged a dedicated breakfast selection.',
        assignee: 'A6',
        date: dateOffset(-1),
      },
    ],
    changes: [],
    reviews: [
      {
        id: 'V1',
        reservationId: 'RES-2420',
        guestId: 'G20',
        rating: 5,
        roomRating: 5,
        serviceRating: 4,
        text: 'Beautiful gardens and wonderfully attentive staff. We will be back.',
        date: dateOffset(-4),
      },
    ],
    notifications: [
      {
        id: 'N1',
        title: 'A fresh start to a wonderful day',
        message: 'Your resort workspace is up to date. Three arrivals are expected today.',
        date: new Date().toISOString(),
        audience: 'all',
        readBy: [],
      },
      {
        id: 'N2',
        title: 'A little time for yourself',
        message: 'Discover a restorative treatment at the Palm Spa during your stay.',
        date: new Date().toISOString(),
        audience: 'G1',
        readBy: [],
      },
    ],
    audit: [
      {
        id: 'L1',
        date: new Date().toISOString(),
        actor: 'System',
        role: 'Owner',
        action: 'Demo initialized',
        detail: 'Linked resort records created',
      },
    ],
    expenses: Array.from({ length: 12 }, (_, i) => ({
      id: `E${i}`,
      name: ['Housekeeping supplies', 'Team payroll', 'Fresh produce', 'Property care'][i % 4],
      category: ['Operations', 'Payroll', 'F&B', 'Maintenance'][i % 4],
      amount: [3200, 18500, 7600, 4800][i % 4],
      date: dateOffset(-i * 2),
    })),
    promotions: [
      {
        id: 'P1',
        name: 'A little longer in paradise',
        code: 'STAYLONG',
        discount: 10,
        start: dateOffset(-10),
        end: dateOffset(30),
        active: true,
        kind: 'Package',
      },
      {
        id: 'P2',
        name: 'Monsoon moments',
        code: 'MONSOON',
        discount: 15,
        start: dateOffset(-5),
        end: dateOffset(20),
        active: true,
        kind: 'Seasonal pricing',
      },
    ],
    loyalty: guests.map((g) => ({
      id: `LP-${g.id}`,
      guestId: g.id,
      date: dateOffset(-20),
      amount: g.points,
      description: 'Previous stays · Opening balance',
    })),
    found: [
      {
        id: 'F1',
        title: 'Silver reading glasses',
        roomId: 'R26',
        date: today(),
        status: 'Stored at reception',
      },
    ],
    policies: {
      resortName: 'The Palm Resort',
      location: 'Candolim, Goa · India',
      email: 'hello@thepalmresort.example',
      phone: '+91 832 555 0142',
      description: 'A slower pace. A warmer welcome. Your coastal sanctuary in Goa.',
      tax: 12,
      checkIn: '14:00',
      checkOut: '11:00',
      cancellationHours: 24,
      maxDiscount: 20,
      payments: true,
      emailEnabled: true,
      smsEnabled: false,
      notifications: true,
      minPassword: 8,
    },
    permissions: {
      Management: [
        'reservations',
        'rooms',
        'guests',
        'tasks',
        'services',
        'billing',
        'refunds',
        'reports',
        'settings',
        'team',
        'support',
        'promotions',
      ],
      Guest: ['services', 'billing', 'support'],
      Receptionist: ['reservations', 'rooms', 'guests', 'tasks', 'support'],
      Housekeeping: ['tasks', 'services', 'support'],
      Cashier: ['billing', 'support'],
      Maintenance: ['tasks', 'support'],
      Gardener: ['tasks', 'services', 'support'],
      'F&B': ['services', 'tasks', 'support'],
      Spa: ['services', 'tasks', 'support'],
    },
  };
  reservations.forEach((r, i) => {
    if (r.status === 'Cancelled') return;
    const total = folio(state, r).total;
    state.payments.push({
      id: `PAY-${301 + i}`,
      reservationId: r.id,
      amount: r.status === 'Completed' ? total : Math.round(total * 0.4),
      type: 'Payment',
      method: i % 2 ? 'Bank transfer' : 'Card',
      date: r.status === 'Completed' ? r.checkOut : dateOffset(-i % 7),
      note: r.status === 'Completed' ? 'Stay settled' : 'Advance received outside RRMS',
    });
  });
  return state;
}

export type Command = { type: string; payload?: any };
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function clean(v: unknown, label: string) {
  const value = String(v ?? '').trim();
  assert(value, `${label} is required.`);
  return value;
}
function validDates(a: string, b: string) {
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(a) &&
      /^\d{4}-\d{2}-\d{2}$/.test(b) &&
      Number.isFinite(Date.parse(a)) &&
      Number.isFinite(Date.parse(b)) &&
      nights(a, b) > 0,
    'Check-out must be after a valid check-in date.',
  );
}
export function applyCommand(previous: State, actorId: string, command: Command): State {
  const s: State = structuredClone(previous);
  const a = s.accounts.find((x) => x.id === actorId);
  assert(a?.active, 'This account is inactive. Sign in with an active demo account.');
  const p = command.payload ?? {};
  const now = new Date().toISOString();
  const requirePermission = (permission: Permission) =>
    assert(can(s, a, permission), 'Your role does not have permission for this action.');
  const owner = () => assert(a.module === 'Owner', 'Only the Owner can perform this action.');
  const reservation = (id: string) => {
    const r = s.reservations.find((x) => x.id === id);
    assert(r, 'Reservation not found.');
    if (a.module === 'Guest')
      assert(r.guestId === a.guestId, 'This reservation is not available to your account.');
    return r;
  };
  const notify = (title: string, message: string, audience = 'all') => {
    if (s.policies.notifications)
      s.notifications.unshift({ id: uid('N'), title, message, date: now, audience, readBy: [] });
  };
  const history = (r: Reservation, text: string) => {
    r.history.push({ date: now, text });
    notify(text, `${r.id} · ${s.guests.find((g) => g.id === r.guestId)?.name}`, r.guestId);
  };
  const cleaning = (roomId: string) => {
    const room = s.rooms.find((r) => r.id === roomId)!;
    room.status = 'Dirty';
    if (
      !s.tasks.some((t) => t.roomId === roomId && t.kind === 'Cleaning' && t.status !== 'Completed')
    )
      s.tasks.unshift({
        id: uid('T'),
        title: `Turnover cleaning · Room ${room.number}`,
        roomId,
        role: 'Housekeeping',
        assignee: s.accounts.find((x) => x.role === 'Housekeeping' && x.active)?.id ?? '',
        priority: 'High',
        deadline: today() + 'T16:00',
        status: 'Pending',
        notes: 'Clean, then request management inspection.',
        kind: 'Cleaning',
      });
  };
  switch (command.type) {
    case 'login':
      break;
    case 'reservation.create': {
      requirePermission('reservations');
      validDates(p.checkIn, p.checkOut);
      assert(p.checkIn >= today(), 'New reservations cannot start in the past.');
      assert(
        available(s, p.roomId, p.checkIn, p.checkOut),
        'This room is unavailable or already reserved for these dates.',
      );
      const room = s.rooms.find((r) => r.id === p.roomId)!;
      assert(
        Number(p.adults) >= 1 && Number(p.adults) <= room.capacity,
        `This room accommodates up to ${room.capacity} guests.`,
      );
      let guest = s.guests.find((g) => g.id === p.guestId);
      if (!guest) {
        const email = clean(p.email, 'Email').toLowerCase();
        assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.');
        assert(
          !s.accounts.some((x) => x.email.toLowerCase() === email),
          'An account already uses this email. Select the existing guest.',
        );
        guest = {
          id: uid('G'),
          name: clean(p.name, 'Guest name'),
          email,
          phone: clean(p.phone, 'Phone'),
          address: p.address ?? '',
          preferences: p.preferences ?? '',
          document: '',
          points: 0,
        };
        s.guests.push(guest);
        s.accounts.push({
          id: uid('A'),
          name: guest.name,
          email,
          password: demoPassword(s),
          module: 'Guest',
          role: 'Guest',
          active: true,
          guestId: guest.id,
          shift: '',
        });
      }
      const base = nights(p.checkIn, p.checkOut) * room.rate;
      const discount = Number(p.discount) || 0;
      assert(
        discount >= 0 && discount <= (base * s.policies.maxDiscount) / 100,
        `Discount must be between 0 and ${s.policies.maxDiscount}% of room charges.`,
      );
      const r: Reservation = {
        id: uid('RES'),
        guestId: guest.id,
        roomId: room.id,
        checkIn: p.checkIn,
        checkOut: p.checkOut,
        status: 'Confirmed',
        rate: room.rate,
        discount,
        taxRate: s.policies.tax,
        source: p.source ?? 'Direct',
        adults: Number(p.adults),
        notes: p.notes ?? '',
        created: today(),
        history: [{ date: now, text: 'Reservation confirmed · Guest credentials issued' }],
      };
      s.reservations.unshift(r);
      notify(
        'Your stay is confirmed',
        `${r.id} · Your demo login is ${guest.email}. Credentials are available at reception.`,
        guest.id,
      );
      break;
    }
    case 'reservation.status': {
      requirePermission('reservations');
      const r = reservation(p.id);
      const room = s.rooms.find((x) => x.id === r.roomId)!;
      if (p.status === 'Checked in') {
        assert(r.status === 'Confirmed', 'Only confirmed reservations can check in.');
        assert(
          r.checkIn <= today() && r.checkOut >= today(),
          'Check-in is available only during the reserved dates.',
        );
        assert(
          room.status === 'Ready',
          'The room must be cleaned and inspection-approved before check-in.',
        );
        assert(
          !s.reservations.some(
            (x) => x.id !== r.id && x.roomId === r.roomId && x.status === 'Checked in',
          ),
          'Another guest is still checked into this room.',
        );
        room.status = 'Occupied';
      } else if (p.status === 'Completed') {
        assert(r.status === 'Checked in', 'Only an active stay can check out.');
        assert(folio(s, r).balance <= 0, 'Settle the guest folio before check-out.');
        assert(
          !s.services.some(
            (x) => x.reservationId === r.id && !['Completed', 'Cancelled'].includes(x.status),
          ),
          'Complete or cancel outstanding services before check-out.',
        );
        cleaning(r.roomId);
        const g = s.guests.find((x) => x.id === r.guestId)!;
        const earned = Math.floor(folio(s, r).total / 100);
        g.points += earned;
        s.loyalty.unshift({
          id: uid('LP'),
          guestId: g.id,
          date: today(),
          amount: earned,
          description: `Stay completed · ${r.id}`,
        });
      } else if (p.status === 'Cancelled' || p.status === 'No-show') {
        assert(
          r.status === 'Confirmed',
          'Only a confirmed reservation can be cancelled or marked no-show.',
        );
        if (p.status === 'No-show')
          assert(r.checkIn < today(), 'Mark no-show only after the scheduled arrival day.');
        s.services
          .filter((x) => x.reservationId === r.id && x.status === 'Requested')
          .forEach((x) => (x.status = 'Cancelled'));
      } else throw new Error('Invalid reservation status transition.');
      r.status = p.status;
      history(r, `Reservation ${p.status.toLowerCase()}`);
      break;
    }
    case 'reservation.edit': {
      requirePermission('reservations');
      const r = reservation(p.id);
      assert(live(r), 'Only confirmed or active stays can be modified.');
      const start = p.checkIn ?? r.checkIn,
        end = p.checkOut ?? r.checkOut,
        roomId = p.roomId ?? r.roomId;
      validDates(start, end);
      if (r.status === 'Checked in')
        assert(
          start === r.checkIn && end >= today(),
          'An active stay must keep its arrival date and cannot end in the past.',
        );
      assert(
        available(s, roomId, start, end, r.id),
        'These dates overlap another booking or the room is out of service.',
      );
      const room = s.rooms.find((x) => x.id === roomId)!;
      assert(r.adults <= room.capacity, 'The new room does not accommodate this guest party.');
      if (roomId !== r.roomId && r.status === 'Checked in') {
        assert(room.status === 'Ready', 'A transfer requires an inspection-approved room.');
        cleaning(r.roomId);
        room.status = 'Occupied';
      }
      r.roomId = roomId;
      r.checkIn = start;
      r.checkOut = end;
      if (p.discount !== undefined) {
        assert(
          Number(p.discount) >= 0 &&
            Number(p.discount) <= (nights(start, end) * r.rate * s.policies.maxDiscount) / 100,
          'Discount exceeds the Owner policy.',
        );
        r.discount = Number(p.discount);
      }
      r.notes = p.notes ?? r.notes;
      history(
        r,
        roomId !== previous.reservations.find((x) => x.id === r.id)?.roomId
          ? 'Room transferred (original nightly rate retained)'
          : 'Reservation dates / details updated',
      );
      break;
    }
    case 'change.create': {
      const r = reservation(p.reservationId);
      assert(
        a.module === 'Guest' && a.guestId === r.guestId,
        'Only the guest can request this change.',
      );
      assert(live(r), 'This booking cannot be changed.');
      assert(
        !s.changes.some((x) => x.reservationId === r.id && x.status === 'Pending'),
        'A change request is already awaiting approval.',
      );
      assert(['Modification', 'Cancellation'].includes(p.kind), 'Choose a valid request type.');
      if (p.kind === 'Cancellation') {
        assert(r.status === 'Confirmed', 'Contact reception to end an active stay.');
        assert(
          Date.parse(r.checkIn + 'T' + s.policies.checkIn) - Date.now() >=
            s.policies.cancellationHours * 3600000,
          `Cancellations require ${s.policies.cancellationHours} hours notice. Please contact reception.`,
        );
      } else validDates(r.checkIn, p.checkOut);
      s.changes.unshift({
        id: uid('CH'),
        reservationId: r.id,
        kind: p.kind,
        checkOut: p.checkOut ?? r.checkOut,
        reason: clean(p.reason, 'Reason'),
        status: 'Pending',
      });
      notify('Guest change request', `${r.id} · ${p.kind}`, 'Management');
      break;
    }
    case 'change.resolve': {
      requirePermission('reservations');
      const c = s.changes.find((x) => x.id === p.id);
      assert(c && c.status === 'Pending', 'This request has already been resolved.');
      const r = reservation(c.reservationId);
      if (p.approve) {
        assert(live(r), 'The reservation is no longer active.');
        if (c.kind === 'Cancellation') {
          assert(r.status === 'Confirmed', 'Only confirmed stays can be cancelled.');
          r.status = 'Cancelled';
          s.services
            .filter((x) => x.reservationId === r.id && x.status === 'Requested')
            .forEach((x) => (x.status = 'Cancelled'));
        } else {
          validDates(r.checkIn, c.checkOut);
          assert(
            available(s, r.roomId, r.checkIn, c.checkOut, r.id),
            'The room is unavailable for the requested dates.',
          );
          assert(
            r.status !== 'Checked in' || c.checkOut >= today(),
            'An active stay cannot end in the past.',
          );
          r.checkOut = c.checkOut;
        }
      }
      c.status = p.approve ? 'Approved' : 'Declined';
      history(r, `${c.kind} request ${c.status.toLowerCase()}`);
      break;
    }
    case 'service.create': {
      requirePermission('services');
      const r = reservation(p.reservationId);
      assert(live(r), 'Services require a confirmed or active stay.');
      const item = serviceMenu.find((x) => x.name === p.name);
      assert(item, 'Choose an available service.');
      assert(
        p.date >= today() && p.date >= r.checkIn && p.date <= r.checkOut,
        'Choose a service date within the stay, today or later.',
      );
      assert(/^\d{2}:\d{2}$/.test(p.time), 'Choose a service time.');
      s.services.unshift({
        id: uid('S'),
        reservationId: r.id,
        name: item.name,
        category: item.category,
        amount: item.amount,
        date: p.date,
        time: p.time,
        options: p.options ?? '',
        status: 'Requested',
        assignee: s.accounts.find((x) => x.role === item.role && x.active)?.id ?? '',
      });
      notify('New service request', `${item.name} · ${r.id}`, item.role);
      break;
    }
    case 'service.update': {
      requirePermission('services');
      assert(a.module !== 'Guest', 'Guests cannot process service requests.');
      const service = s.services.find((x) => x.id === p.id);
      assert(service, 'Service not found.');
      assert(
        a.module !== 'Staff' || service.assignee === a.id,
        'Only the assigned staff member can process this service.',
      );
      assert(live(reservation(service.reservationId)), 'This stay is no longer active.');
      if (p.assignee !== undefined) {
        assert(a.module !== 'Staff', 'Only management can reassign services.');
        const target = s.accounts.find((x) => x.id === p.assignee && x.active);
        const role = serviceMenu.find((x) => x.name === service.name)?.role;
        assert(target?.role === role, 'Assign an active staff member from the correct department.');
        service.assignee = p.assignee;
      }
      if (p.status) {
        if (['In progress', 'Completed'].includes(p.status))
          assert(
            reservation(service.reservationId).status === 'Checked in',
            'Check in the guest before starting the service.',
          );
        const transitions: Record<string, string[]> = {
          Requested: ['Accepted', 'Cancelled'],
          Accepted: ['In progress', 'Cancelled'],
          'In progress': ['Completed', 'Cancelled'],
          Completed: [],
          Cancelled: [],
        };
        assert(
          transitions[service.status].includes(p.status),
          'Invalid service status transition.',
        );
        service.status = p.status;
        notify(
          `Service ${p.status.toLowerCase()}`,
          `${service.name}${p.status === 'Completed' ? ' · Charge added to your folio.' : ''}`,
          reservation(service.reservationId).guestId,
        );
      }
      break;
    }
    case 'task.create': {
      requirePermission('tasks');
      if (a.module === 'Staff')
        assert(
          ['Maintenance', 'Property'].includes(p.kind) ||
            (p.kind === 'General' && p.role === 'Maintenance'),
          'Staff may report property, damage or maintenance issues.',
        );
      const room = s.rooms.find((x) => x.id === p.roomId);
      assert(room, 'Choose a room or property location.');
      const kind = p.kind as Task['kind'];
      assert(
        ['Cleaning', 'Maintenance', 'Property', 'General'].includes(kind),
        'Select a valid task category.',
      );
      const role: StaffRole =
        kind === 'Cleaning'
          ? 'Housekeeping'
          : kind === 'Maintenance'
            ? 'Maintenance'
            : kind === 'Property'
              ? 'Gardener'
              : (p.role ?? 'Receptionist');
      const assignee = p.assignee || s.accounts.find((x) => x.role === role && x.active)?.id || '';
      assert(
        !assignee || s.accounts.some((x) => x.id === assignee && x.role === role && x.active),
        'Choose an active staff member in the task department.',
      );
      if (kind === 'Maintenance') {
        assert(
          room.status !== 'Occupied',
          'Transfer the guest before taking this room out of service.',
        );
        room.status = 'Maintenance';
      }
      if (kind === 'Cleaning') {
        assert(
          !['Occupied', 'Maintenance'].includes(room.status),
          'This room is not available for turnover cleaning.',
        );
        assert(
          !s.tasks.some(
            (t) => t.roomId === room.id && t.kind === 'Cleaning' && t.status !== 'Completed',
          ),
          'A cleaning task is already open for this room.',
        );
        room.status = 'Dirty';
      }
      s.tasks.unshift({
        id: uid('T'),
        title: clean(p.title, 'Task title'),
        role,
        roomId: room.id,
        assignee,
        priority: p.priority ?? 'Medium',
        deadline: clean(p.deadline, 'Deadline'),
        status: 'Pending',
        notes: p.notes ?? '',
        kind,
      });
      notify('New task assigned', p.title, assignee || role);
      break;
    }
    case 'task.update': {
      requirePermission('tasks');
      const t = s.tasks.find((x) => x.id === p.id);
      assert(t, 'Task not found.');
      assert(
        a.module !== 'Staff' || t.assignee === a.id,
        'Only the assigned staff member can update this task.',
      );
      if (p.assignee !== undefined) {
        assert(a.module !== 'Staff', 'Only management can reassign tasks.');
        assert(
          s.accounts.some((x) => x.id === p.assignee && x.active && x.role === t.role),
          'Choose active staff from the correct department.',
        );
        t.assignee = p.assignee;
      }
      if (p.notes !== undefined) t.notes = p.notes;
      if (p.priority) t.priority = p.priority;
      if (p.deadline) t.deadline = p.deadline;
      if (p.status) {
        if (t.status === 'Inspection') {
          assert(
            a.module === 'Management' || a.module === 'Owner',
            'Management must approve the room inspection.',
          );
          assert(p.status === 'Completed', 'Inspection must be approved to finish this task.');
          const room = s.rooms.find((x) => x.id === t.roomId)!;
          assert(room.status !== 'Occupied', 'Occupied rooms cannot be approved for turnover.');
          const remaining = s.tasks.filter(
            (x) =>
              x.id !== t.id &&
              x.roomId === t.roomId &&
              ['Cleaning', 'Maintenance'].includes(x.kind) &&
              x.status !== 'Completed',
          );
          room.status = remaining.length
            ? remaining.every((x) => x.status === 'Inspection')
              ? 'Inspection'
              : remaining.some((x) => x.kind === 'Maintenance')
                ? 'Maintenance'
                : 'Dirty'
            : 'Ready';
        } else {
          assert(
            (t.status === 'Pending' && p.status === 'In progress') ||
              (t.status === 'In progress' &&
                p.status ===
                  (t.kind === 'Cleaning' || t.kind === 'Maintenance' ? 'Inspection' : 'Completed')),
            'Invalid task transition.',
          );
          if (p.status === 'Inspection') {
            const room = s.rooms.find((x) => x.id === t.roomId)!;
            assert(
              room.status !== 'Occupied',
              'Occupied rooms cannot enter a readiness inspection.',
            );
            room.status = 'Inspection';
          }
        }
        t.status = p.status;
        notify(`Task ${p.status.toLowerCase()}`, t.title, 'Management');
      }
      break;
    }
    case 'payment.create': {
      requirePermission('billing');
      assert(s.policies.payments, 'Simulated payments are disabled by the Owner.');
      const r = reservation(p.reservationId);
      assert(
        ['Checked in', 'Completed'].includes(r.status),
        'Stay payments are available after check-in. Advance payments are handled outside RRMS.',
      );
      const amount = Number(p.amount);
      assert(
        Number.isFinite(amount) && amount > 0 && amount <= folio(s, r).balance,
        'Enter a positive amount within the outstanding balance.',
      );
      assert(
        ['Card', 'UPI', 'Cash', 'Bank transfer'].includes(p.method),
        'Select a valid payment method.',
      );
      s.payments.unshift({
        id: uid('PAY'),
        reservationId: r.id,
        amount,
        type: 'Payment',
        method: p.method,
        date: now,
        note: 'Simulated stay payment',
      });
      history(r, `Demo payment received · ${money(amount)}`);
      break;
    }
    case 'payment.refund': {
      requirePermission('refunds');
      const r = reservation(p.reservationId);
      const amount = Number(p.amount);
      assert(
        Number.isFinite(amount) && amount > 0 && amount <= folio(s, r).paid,
        'Refund must be positive and cannot exceed net payments.',
      );
      s.payments.unshift({
        id: uid('REF'),
        reservationId: r.id,
        amount,
        type: 'Refund',
        method: p.method ?? 'Original method',
        date: now,
        note: clean(p.note, 'Refund reason'),
      });
      history(r, `Authorized demo refund · ${money(amount)}`);
      break;
    }
    case 'guest.update': {
      const g = s.guests.find((x) => x.id === p.id);
      assert(g, 'Guest not found.');
      if (a.module === 'Guest') assert(a.guestId === g.id, 'You can only edit your own profile.');
      else requirePermission('guests');
      const email = clean(p.email, 'Email').toLowerCase();
      assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email.');
      assert(
        !s.accounts.some((x) => x.email.toLowerCase() === email && x.guestId !== g.id),
        'This email belongs to another account.',
      );
      Object.assign(g, {
        name: clean(p.name, 'Name'),
        email,
        phone: clean(p.phone, 'Phone'),
        address: p.address ?? '',
        preferences: p.preferences ?? '',
        document: p.document ?? g.document,
      });
      const account = s.accounts.find((x) => x.guestId === g.id);
      if (account) {
        account.name = g.name;
        account.email = g.email;
      }
      break;
    }
    case 'complaint.create': {
      requirePermission('support');
      const guestId = a.module === 'Guest' ? a.guestId : p.guestId;
      assert(
        s.guests.some((g) => g.id === guestId),
        'Choose a guest.',
      );
      s.complaints.unshift({
        id: uid('C'),
        guestId,
        subject: clean(p.subject, 'Subject'),
        description: clean(p.description, 'Description'),
        category: p.category ?? 'Request',
        status: 'Open',
        response: '',
        assignee: '',
        date: now,
      });
      notify('New guest support request', p.subject, 'Management');
      break;
    }
    case 'complaint.update': {
      requirePermission('support');
      assert(a.module !== 'Guest', 'Only staff and management can resolve requests.');
      const c = s.complaints.find((x) => x.id === p.id);
      assert(c, 'Request not found.');
      assert(
        a.module !== 'Staff' || c.assignee === a.id,
        'Only the assigned staff member can resolve this request.',
      );
      if (p.assignee !== undefined) {
        assert(a.module !== 'Staff', 'Only management can assign support requests.');
        assert(
          s.accounts.some((x) => x.id === p.assignee && x.active && x.module === 'Staff'),
          'Choose an active staff member.',
        );
        c.assignee = p.assignee;
      }
      if (p.status) {
        assert(
          c.status !== 'Resolved' && ['In progress', 'Resolved'].includes(p.status),
          'Invalid support status transition.',
        );
        c.response = clean(p.response, 'Response to guest');
        c.status = p.status;
        notify('Your support request was updated', c.response, c.guestId);
      }
      break;
    }
    case 'review.create': {
      assert(a.module === 'Guest', 'Only guests can review their stays.');
      const r = reservation(p.reservationId);
      assert(r.status === 'Completed', 'Reviews unlock after check-out.');
      assert(
        !s.reviews.some((x) => x.reservationId === r.id),
        'You have already reviewed this stay.',
      );
      for (const k of ['rating', 'roomRating', 'serviceRating'])
        assert(
          Number.isInteger(Number(p[k])) && p[k] >= 1 && p[k] <= 5,
          'Ratings must be between 1 and 5.',
        );
      s.reviews.unshift({
        id: uid('V'),
        reservationId: r.id,
        guestId: r.guestId,
        rating: Number(p.rating),
        roomRating: Number(p.roomRating),
        serviceRating: Number(p.serviceRating),
        text: clean(p.text, 'Feedback'),
        date: now,
      });
      break;
    }
    case 'loyalty.redeem': {
      assert(a.module === 'Guest', 'Only guests can redeem their points.');
      const g = s.guests.find((x) => x.id === a.guestId)!;
      const r = reservation(p.reservationId);
      assert(r.status === 'Checked in', 'Rewards can be redeemed against an active stay.');
      const points = Number(p.points);
      assert(
        Number.isInteger(points) && points >= 100 && points <= g.points,
        'Redeem at least 100 points, within your available balance.',
      );
      assert(
        points / 10 <= folio(s, r).balance,
        'Reward value cannot exceed your outstanding balance.',
      );
      g.points -= points;
      s.loyalty.unshift({
        id: uid('LP'),
        guestId: g.id,
        amount: -points,
        date: today(),
        description: `Redeemed toward ${r.id}`,
      });
      s.payments.unshift({
        id: uid('PAY'),
        reservationId: r.id,
        amount: points / 10,
        type: 'Payment',
        method: 'Loyalty reward',
        date: now,
        note: `${points} points redeemed`,
      });
      notify('A little thank you', `${points} points redeemed for ${money(points / 10)}.`, g.id);
      break;
    }
    case 'room.update': {
      requirePermission('rooms');
      assert(a.module !== 'Staff', 'Room pricing is managed by management.');
      const r = s.rooms.find((x) => x.id === p.id);
      assert(r, 'Room not found.');
      assert(
        Number.isFinite(Number(p.rate)) && Number(p.rate) > 0,
        'Nightly rate must be a positive finite amount.',
      );
      r.rate = Number(p.rate);
      if (p.type) r.type = clean(p.type, 'Room type');
      break;
    }
    case 'account.create': {
      assert(a.module === 'Owner' || a.module === 'Management', 'Only Owner and Managers can create accounts.');
      if (a.module === 'Management') {
        assert(p.role !== 'Owner' && p.role !== 'Management', 'Managers can only create Staff accounts.');
      }
      const email = clean(p.email, 'Email').toLowerCase();
      assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.');
      assert(!s.accounts.some((x) => x.email.toLowerCase() === email), 'An account already exists with this email address.');
      assert(
        p.role === 'Management' || roles.includes(p.role),
        'Choose a staff or management role.',
      );
      const generatedPass = p.password || `PalmPass#${Math.floor(1000 + Math.random() * 9000)}`;
      s.accounts.push({
        id: uid('A'),
        name: clean(p.name, 'Name'),
        email,
        password: generatedPass,
        module: p.role === 'Management' ? 'Management' : 'Staff',
        role: p.role,
        active: true,
        createdBy: a.id,
        shift: p.shift ?? '09:00 – 17:00',
      });
      break;
    }
    case 'account.update': {
      const target = s.accounts.find((x) => x.id === p.id);
      assert(target, 'Account not found.');
      if (p.shift !== undefined) {
        requirePermission('team');
        target.shift = clean(p.shift, 'Shift');
      }
      if (p.active !== undefined) {
        assert(a.module === 'Owner' || a.module === 'Management', 'Only Owner or Manager can manage account status.');
        assert(target.id !== a.id, 'You cannot deactivate your own account.');
        if (a.module === 'Management') {
          assert(target.module === 'Staff', 'Managers can only manage Staff accounts.');
        }
        target.active = !!p.active;
      }
      if (p.reset) {
        assert(a.module === 'Owner' || a.module === 'Management', 'Only Owner or Manager can reset passwords.');
        assert(target.module !== 'Owner', 'Owner credential resets are unavailable in the demo.');
        target.password = p.password || demoPassword(s);
      }
      break;
    }
    case 'permissions.update': {
      owner();
      assert(p.role !== 'Owner', 'Owner access cannot be removed.');
      assert(permissions.includes(p.permission), 'Unknown permission.');
      const list = s.permissions[p.role] ?? [];
      s.permissions[p.role] = p.enabled
        ? [...new Set([...list, p.permission])]
        : list.filter((x) => x !== p.permission);
      break;
    }
    case 'policies.update': {
      requirePermission('settings');
      const allowed =
        a.module === 'Owner'
          ? Object.keys(s.policies)
          : ['resortName', 'location', 'email', 'phone', 'description'];
      Object.keys(p).forEach((k) => {
        assert(allowed.includes(k), 'Only the Owner can change operating policies.');
      });
      const next = { ...s.policies, ...p };
      assert(next.tax >= 0 && next.tax <= 30, 'Tax must be between 0 and 30%.');
      assert(
        next.maxDiscount >= 0 && next.maxDiscount <= 50,
        'Maximum discount must be between 0 and 50%.',
      );
      assert(
        next.cancellationHours >= 0 && next.cancellationHours <= 168,
        'Cancellation notice must be 0–168 hours.',
      );
      assert(
        next.minPassword >= 8 && next.minPassword <= 12,
        'Demo password policy supports 8–12 characters.',
      );
      assert(
        /^\d{2}:\d{2}$/.test(next.checkIn) && /^\d{2}:\d{2}$/.test(next.checkOut),
        'Enter valid check-in and check-out times.',
      );
      clean(next.resortName, 'Resort name');
      s.policies = next;
      break;
    }
    case 'promotion.save': {
      requirePermission('promotions');
      assert(
        Number(p.discount) > 0 && Number(p.discount) <= s.policies.maxDiscount,
        `Offer must be within the ${s.policies.maxDiscount}% discount policy.`,
      );
      assert(p.start <= p.end, 'Offer end must follow its start date.');
      const item: Promotion = {
        id: p.id || uid('P'),
        name: clean(p.name, 'Offer name'),
        code: clean(p.code, 'Code').toUpperCase(),
        discount: Number(p.discount),
        start: p.start,
        end: p.end,
        active: !!p.active,
        kind: p.kind ?? 'Package',
      };
      assert(
        !s.promotions.some((x) => x.id !== item.id && x.code === item.code),
        'Promotion code already exists.',
      );
      const index = s.promotions.findIndex((x) => x.id === item.id);
      if (index >= 0) s.promotions[index] = item;
      else s.promotions.unshift(item);
      break;
    }
    case 'expense.create': {
      owner();
      const amount = Number(p.amount);
      assert(Number.isFinite(amount) && amount > 0, 'Enter a positive expense amount.');
      s.expenses.unshift({
        id: uid('E'),
        name: clean(p.name, 'Description'),
        amount,
        category: clean(p.category, 'Category'),
        date: p.date || today(),
      });
      break;
    }
    case 'found.create': {
      requirePermission('tasks');
      assert(
        s.rooms.some((r) => r.id === p.roomId),
        'Choose a room.',
      );
      s.found.unshift({
        id: uid('F'),
        title: clean(p.title, 'Item description'),
        roomId: p.roomId,
        date: today(),
        status: 'Stored at reception',
      });
      break;
    }
    case 'found.return': {
      requirePermission('tasks');
      const item = s.found.find((x) => x.id === p.id);
      assert(item && item.status !== 'Returned to guest', 'Item already returned or missing.');
      item.status = 'Returned to guest';
      break;
    }
    case 'notifications.read': {
      s.notifications
        .filter((n) => !p.id || n.id === p.id)
        .forEach((n) => {
          if (!n.readBy.includes(a.id)) n.readBy.push(a.id);
        });
      return s;
    }
    case 'message.test': {
      owner();
      assert(
        p.channel === 'Email' ? s.policies.emailEnabled : s.policies.smsEnabled,
        `${p.channel} simulation is disabled.`,
      );
      notify(`Demo ${p.channel} queued`, 'Simulation only. No external message was sent.', a.id);
      break;
    }
    default:
      throw new Error('Unknown action.');
  }
  s.audit.unshift({
    id: uid('LOG'),
    date: now,
    actor: a.name,
    role: a.role,
    action: command.type,
    detail: p.id ?? p.reservationId ?? p.name ?? p.title ?? 'Workspace updated',
  });
  return s;
}
