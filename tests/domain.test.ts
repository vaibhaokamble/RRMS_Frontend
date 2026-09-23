import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  seed,
  applyCommand,
  available,
  folio,
  dashboard,
  today,
  dateOffset,
} from '../src/lib/domain';
import type { State, Command } from '../src/lib/domain';
let s: State;
const run = (type: string, payload: any = {}, actor = 'manager') =>
  (s = applyCommand(s, actor, { type, payload }));
function makeStay() {
  run('reservation.create', {
    name: 'Test Guest',
    email: 'test.guest@example.com',
    phone: '+91 9999900000',
    roomId: 'R20',
    checkIn: today(),
    checkOut: dateOffset(3),
    adults: 2,
    discount: 0,
  });
  return s.reservations[0];
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-21T09:00:00+05:30'));
  s = seed();
});
afterEach(() => vi.useRealTimers());
describe('Linked seed data', () => {
  it('has exactly the requested room, guest, reservation and staff counts', () => {
    expect(s.rooms).toHaveLength(30);
    expect(s.guests).toHaveLength(20);
    expect(s.reservations).toHaveLength(25);
    expect(s.accounts.filter((a) => a.module === 'Staff')).toHaveLength(14);
    expect(new Set(s.accounts.filter((a) => a.module === 'Staff').map((a) => a.role)).size).toBe(7);
  });
  it('has valid links, non-overlapping live room reservations and fully paid completed stays', () => {
    s.reservations.forEach((r) => {
      expect(s.rooms.some((x) => x.id === r.roomId)).toBe(true);
      expect(s.guests.some((x) => x.id === r.guestId)).toBe(true);
      if (['Confirmed', 'Checked in'].includes(r.status))
        expect(available(s, r.roomId, r.checkIn, r.checkOut, r.id)).toBe(true);
      if (r.status === 'Completed') expect(folio(s, r).balance).toBe(0);
    });
  });
});
describe('Reservation → service → payment → checkout → review → report', () => {
  it('completes the entire linked lifecycle without duplicate charges or points', () => {
    const previousRevenue = dashboard(s).revenue;
    const r = makeStay();
    const account = s.accounts.find((a) => a.guestId === r.guestId)!;
    expect(account.active).toBe(true);
    expect(account.password).toBe('Resort@123');
    run('login', {}, account.id);
    run('reservation.status', { id: r.id, status: 'Checked in' }, 'A1');
    expect(s.rooms.find((x) => x.id === 'R20')?.status).toBe('Occupied');
    run(
      'service.create',
      {
        reservationId: r.id,
        name: 'Balinese massage',
        date: today(),
        time: '15:00',
        options: 'Gentle pressure',
      },
      account.id,
    );
    const service = s.services[0];
    expect(service.assignee).toBe('A7');
    run('service.update', { id: service.id, status: 'Accepted' }, 'A7');
    run('service.update', { id: service.id, status: 'In progress' }, 'A7');
    run('service.update', { id: service.id, status: 'Completed' }, 'A7');
    expect(() => run('service.update', { id: service.id, status: 'Completed' }, 'A7')).toThrow(
      'Invalid service',
    );
    expect(folio(s, s.reservations[0]).extras).toBe(2800);
    const total = folio(s, s.reservations[0]).total;
    run('payment.create', { reservationId: r.id, amount: total, method: 'Card' }, 'A3');
    expect(folio(s, s.reservations[0]).balance).toBe(0);
    expect(dashboard(s).revenue).toBe(previousRevenue + total);
    run('reservation.status', { id: r.id, status: 'Completed' }, 'A1');
    expect(s.rooms.find((x) => x.id === 'R20')?.status).toBe('Dirty');
    expect(s.guests.find((g) => g.id === r.guestId)?.points).toBe(Math.floor(total / 100));
    expect(() => run('reservation.status', { id: r.id, status: 'Completed' }, 'A1')).toThrow(
      'Only an active stay',
    );
    run(
      'review.create',
      {
        reservationId: r.id,
        rating: 5,
        roomRating: 4,
        serviceRating: 5,
        text: 'A memorable stay.',
      },
      account.id,
    );
    expect(s.reviews[0].guestId).toBe(r.guestId);
    expect(() =>
      run(
        'review.create',
        { reservationId: r.id, rating: 5, roomRating: 4, serviceRating: 5, text: 'Again' },
        account.id,
      ),
    ).toThrow('already reviewed');
    const task = s.tasks.find((t) => t.roomId === 'R20' && t.kind === 'Cleaning')!;
    run('task.update', { id: task.id, status: 'In progress' }, 'A2');
    run('task.update', { id: task.id, status: 'Inspection' }, 'A2');
    expect(s.rooms.find((x) => x.id === 'R20')?.status).toBe('Inspection');
    expect(() => run('task.update', { id: task.id, status: 'Completed' }, 'A2')).toThrow(
      'Management',
    );
    run('task.update', { id: task.id, status: 'Completed' });
    expect(s.rooms.find((x) => x.id === 'R20')?.status).toBe('Ready');
  });
});
describe('Reservation and stay safeguards', () => {
  it('rejects overlapping dates, invalid dates, maintenance rooms, excess capacity and duplicate emails', () => {
    const p = {
      guestId: 'G1',
      roomId: 'R13',
      checkIn: today(),
      checkOut: dateOffset(2),
      adults: 2,
    };
    expect(() => run('reservation.create', p)).toThrow('unavailable');
    expect(() => run('reservation.create', { ...p, roomId: 'R20', checkOut: today() })).toThrow(
      'Check-out',
    );
    expect(() => run('reservation.create', { ...p, roomId: 'R29' })).toThrow('unavailable');
    expect(() => run('reservation.create', { ...p, roomId: 'R20', adults: 4 })).toThrow(
      'accommodates',
    );
    expect(() =>
      run('reservation.create', {
        ...p,
        guestId: '',
        roomId: 'R20',
        email: 'guest@rrms.demo',
        name: 'Duplicate',
        phone: '123',
      }),
    ).toThrow('already uses');
  });
  it('allows back-to-back reservation date boundaries', () => {
    expect(available(s, 'R13', dateOffset(3), dateOffset(5))).toBe(true);
  });
  it('rejects guest reservation creation and unready check-in', () => {
    expect(() => run('reservation.create', {}, 'account-G1')).toThrow('permission');
    const r = makeStay();
    s.rooms.find((x) => x.id === 'R20')!.status = 'Dirty';
    expect(() => run('reservation.status', { id: r.id, status: 'Checked in' })).toThrow(
      'inspection-approved',
    );
  });
  it('requires settled folios and processed services before checkout', () => {
    expect(() => run('reservation.status', { id: 'RES-2401', status: 'Completed' })).toThrow(
      'Settle',
    );
    const r = s.reservations[0];
    run('payment.create', { reservationId: r.id, amount: folio(s, r).balance, method: 'UPI' });
    expect(() => run('reservation.status', { id: r.id, status: 'Completed' })).toThrow(
      'outstanding services',
    );
  });
  it('transfers an active guest and queues cleaning of the original room', () => {
    run('reservation.edit', { id: 'RES-2401', roomId: 'R19', checkOut: dateOffset(4) });
    expect(s.rooms.find((r) => r.id === 'R1')?.status).toBe('Dirty');
    expect(s.rooms.find((r) => r.id === 'R19')?.status).toBe('Occupied');
    expect(s.tasks.some((t) => t.roomId === 'R1' && t.kind === 'Cleaning')).toBe(true);
    expect(s.reservations[0].rate).toBe(6500);
  });
  it('blocks transfer into occupied or uninspected rooms', () => {
    expect(() => run('reservation.edit', { id: 'RES-2401', roomId: 'R2' })).toThrow('overlap');
    expect(() => run('reservation.edit', { id: 'RES-2401', roomId: 'R26' })).toThrow(
      'inspection-approved',
    );
  });
  it('cancels confirmed stays and enforces no-show date rules', () => {
    run('reservation.status', { id: 'RES-2413', status: 'Cancelled' });
    expect(folio(s, s.reservations.find((r) => r.id === 'RES-2413')!).total).toBe(0);
    expect(() => run('reservation.status', { id: 'RES-2414', status: 'No-show' })).toThrow('after');
    s.reservations.find((r) => r.id === 'RES-2414')!.checkIn = dateOffset(-1);
    run('reservation.status', { id: 'RES-2414', status: 'No-show' });
    expect(s.reservations.find((r) => r.id === 'RES-2414')?.status).toBe('No-show');
  });
  it('tracks guest modification and cancellation approvals', () => {
    run(
      'change.create',
      {
        reservationId: 'RES-2416',
        kind: 'Modification',
        checkOut: dateOffset(6),
        reason: 'One more night',
      },
      'account-G16',
    );
    const id = s.changes[0].id;
    run('change.resolve', { id, approve: true });
    expect(s.reservations.find((r) => r.id === 'RES-2416')?.checkOut).toBe(dateOffset(6));
    expect(s.changes[0].status).toBe('Approved');
    expect(() => run('change.resolve', { id, approve: true })).toThrow('already');
    run(
      'change.create',
      { reservationId: 'RES-2416', kind: 'Cancellation', reason: 'Plans changed' },
      'account-G16',
    );
    run('change.resolve', { id: s.changes[0].id, approve: true });
    expect(s.reservations.find((r) => r.id === 'RES-2416')?.status).toBe('Cancelled');
  });
  it('rejects duplicate pending changes and cancellation inside the notice window', () => {
    expect(() =>
      run(
        'change.create',
        { reservationId: 'RES-2413', kind: 'Cancellation', reason: 'Late request' },
        'account-G13',
      ),
    ).toThrow('hours notice');
    run(
      'change.create',
      {
        reservationId: 'RES-2416',
        kind: 'Modification',
        checkOut: dateOffset(6),
        reason: 'One more night',
      },
      'account-G16',
    );
    expect(() =>
      run(
        'change.create',
        {
          reservationId: 'RES-2416',
          kind: 'Modification',
          checkOut: dateOffset(7),
          reason: 'Again',
        },
        'account-G16',
      ),
    ).toThrow('already awaiting');
  });
});
describe('Maintenance, staff assignment and inspection', () => {
  it('keeps a room unavailable until all maintenance issues are inspected', () => {
    for (const title of ['Repair light', 'Repair fan'])
      run('task.create', {
        title,
        kind: 'Maintenance',
        roomId: 'R21',
        deadline: today() + 'T18:00',
      });
    const [second, first] = s.tasks;
    for (const task of [first, second]) {
      run('task.update', { id: task.id, status: 'In progress' }, 'A4');
      run('task.update', { id: task.id, status: 'Inspection' }, 'A4');
    }
    run('task.update', { id: first.id, status: 'Completed' });
    expect(s.rooms.find((r) => r.id === 'R21')?.status).toBe('Inspection');
    run('task.update', { id: second.id, status: 'Completed' });
    expect(s.rooms.find((r) => r.id === 'R21')?.status).toBe('Ready');
  });
  it('routes maintenance through work, inspection and room readiness', () => {
    run('task.create', {
      title: 'Repair balcony light',
      kind: 'Maintenance',
      roomId: 'R21',
      deadline: today() + 'T18:00',
    });
    const t = s.tasks[0];
    expect(t.assignee).toBe('A4');
    expect(s.rooms.find((r) => r.id === 'R21')?.status).toBe('Maintenance');
    expect(available(s, 'R21', today(), dateOffset(2))).toBe(false);
    expect(() => run('task.update', { id: t.id, status: 'In progress' }, 'A2')).toThrow('assigned');
    run('task.update', { id: t.id, status: 'In progress' }, 'A4');
    run('task.update', { id: t.id, status: 'Inspection', notes: 'Lamp replaced and tested' }, 'A4');
    run('task.update', { id: t.id, status: 'Completed' });
    expect(s.rooms.find((r) => r.id === 'R21')?.status).toBe('Ready');
  });
  it('requires a guest transfer before taking an occupied room out of service', () => {
    expect(() =>
      run('task.create', {
        title: 'AC issue',
        kind: 'Maintenance',
        roomId: 'R1',
        deadline: today() + 'T18:00',
      }),
    ).toThrow('Transfer');
  });
  it('prevents service processing by another staff member or skipping acceptance', () => {
    expect(() => run('service.update', { id: 'S1', status: 'Accepted' }, 'A14')).toThrow(
      'assigned',
    );
    expect(() => run('service.update', { id: 'S1', status: 'Completed' }, 'A7')).toThrow(
      'Invalid service',
    );
  });
});
describe('Finance, loyalty, permissions and account controls', () => {
  it('enforces the password policy on new guest credentials and account resets', () => {
    run('policies.update', { minPassword: 12 }, 'owner');
    const r = makeStay();
    expect(s.accounts.find((a) => a.guestId === r.guestId)?.password.length).toBe(12);
    run('account.update', { id: 'A1', reset: true }, 'owner');
    expect(s.accounts.find((a) => a.id === 'A1')?.password).toBe('Resort@123!!');
  });
  it('requires explicit refund permission and caps refunds at net payments', () => {
    expect(() =>
      run(
        'payment.refund',
        { reservationId: 'RES-2401', amount: 100, note: 'Service recovery' },
        'A3',
      ),
    ).toThrow('permission');
    run('permissions.update', { role: 'Cashier', permission: 'refunds', enabled: true }, 'owner');
    const before = folio(s, s.reservations[0]).paid;
    run(
      'payment.refund',
      { reservationId: 'RES-2401', amount: 100, note: 'Service recovery' },
      'A3',
    );
    expect(folio(s, s.reservations[0]).paid).toBe(before - 100);
    expect(() =>
      run('payment.refund', { reservationId: 'RES-2401', amount: before, note: 'Too much' }, 'A3'),
    ).toThrow('cannot exceed');
    expect(s.audit[0].action).toBe('payment.refund');
  });
  it('rejects advances, overpayments, zero and negative payments', () => {
    expect(() =>
      run('payment.create', { reservationId: 'RES-2413', amount: 100, method: 'Card' }),
    ).toThrow('after check-in');
    for (const amount of [0, -1, 999999, NaN])
      expect(() =>
        run('payment.create', { reservationId: 'RES-2401', amount, method: 'Card' }),
      ).toThrow('positive amount');
  });
  it('redeems points without a negative balance and reflects reward value in the bill', () => {
    const before = folio(s, s.reservations[0]).balance;
    run('loyalty.redeem', { reservationId: 'RES-2401', points: 100 }, 'account-G1');
    expect(s.guests[0].points).toBe(1150);
    expect(folio(s, s.reservations[0]).balance).toBe(before - 10);
    expect(() =>
      run('loyalty.redeem', { reservationId: 'RES-2401', points: 2000 }, 'account-G1'),
    ).toThrow('available balance');
    expect(() =>
      run('loyalty.redeem', { reservationId: 'RES-2401', points: -100 }, 'account-G1'),
    ).toThrow('at least');
  });
  it('scopes guest records and denies account or policy escalation', () => {
    expect(() =>
      run(
        'payment.create',
        { reservationId: 'RES-2402', amount: 100, method: 'Card' },
        'account-G1',
      ),
    ).toThrow('not available');
    expect(() => run('account.create', { name: 'X', role: 'Management' }, 'manager')).toThrow('Managers can only create Staff accounts');
    expect(() => run('policies.update', { tax: 18 }, 'manager')).toThrow('Only the Owner');
  });
  it('applies revoked permissions and inactive accounts on every mutation', () => {
    run(
      'permissions.update',
      { role: 'Management', permission: 'reservations', enabled: false },
      'owner',
    );
    expect(() => makeStay()).toThrow('permission');
    run('account.update', { id: 'A1', active: false }, 'owner');
    expect(() => run('reservation.status', { id: 'RES-2413', status: 'Checked in' }, 'A1')).toThrow(
      'inactive',
    );
  });
  it('applies new tax policies prospectively, retains existing rates and disables payments', () => {
    run('policies.update', { tax: 18, payments: false }, 'owner');
    expect(s.reservations[0].taxRate).toBe(12);
    const r = makeStay();
    expect(r.taxRate).toBe(18);
    expect(() =>
      run('payment.create', { reservationId: 'RES-2401', amount: 100, method: 'Card' }),
    ).toThrow('disabled');
  });
  it('keeps a rejected command atomic and the previous state immutable', () => {
    const original = structuredClone(s);
    expect(() =>
      run('reservation.create', {
        name: 'Must not persist',
        email: 'atomic@example.com',
        phone: '123',
        roomId: 'R20',
        checkIn: today(),
        checkOut: dateOffset(3),
        adults: 2,
        discount: 999999,
      }),
    ).toThrow('Discount');
    expect(s).toEqual(original);
  });
});
