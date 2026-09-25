import { beforeEach, describe, expect, it } from 'vitest';
import { applyCommand, available, dashboard, dateOffset, findRoom, folio, seed, today } from '../src/lib/domain';
import type { State } from '../src/lib/domain';
import { normalizeState, roomStatus } from '../src/lib/property';
let s: State;
const run = (type: string, payload: Record<string, unknown>, actor = 'manager') => { s = applyCommand(s, actor, { type, payload }); };
const roomInput = { number: '401', name: 'Coconut Grove Suite', floor: '4', type: 'Garden Suite', capacity: 3, bedType: 'King', beds: 1, rate: 8500, description: 'A quiet garden-facing suite with a private terrace.', images: [], amenityIds: ['AM-WIFI'], status: 'Available' };
const amenityInput = { name: 'Private cabana', category: 'Recreation', description: 'A peaceful spot by the pool.', type: 'Room', icon: 'waves', paid: true, price: 600, opening: '07:00', closing: '21:00', active: true, maintenance: false, image: '', roomIds: ['R1'] };
beforeEach(() => { s = normalizeState(seed()); });
describe('Shared room inventory and readiness', () => {
  it('adds and edits a room with validated details and live dashboard counts', () => {
    const before = dashboard(s).available;
    run('room.create', roomInput);
    const room = s.rooms.find(r => r.number === '401')!;
    expect(room.name).toBe('Coconut Grove Suite');
    expect(dashboard(s).available).toBe(before + 1);
    run('room.update', { id: room.id, name: 'Coconut Grove Retreat', rate: 9200 });
    expect(s.rooms.find(r => r.id === room.id)).toMatchObject({ name: 'Coconut Grove Retreat', rate: 9200, amenityIds: ['AM-WIFI'] });
  });
  it('rejects duplicates, invalid rates, invalid capacities and unsafe images atomically', () => {
    const before = structuredClone(s);
    for (const override of [{ number: '101' }, { rate: 0 }, { rate: Infinity }, { capacity: 1.5 }, { name: ' ' }, { images: ['javascript:alert(1)'] }]) {
      expect(() => run('room.create', { ...roomInput, ...override })).toThrow();
      expect(s).toEqual(before);
    }
  });
  it('blocks cleaning, inspection, maintenance, inactive and out-of-service rooms from booking', () => {
    for (const status of ['Dirty', 'Inspection', 'Maintenance', 'Out of Service'] as const) {
      s.rooms.find(r => r.id === 'R20')!.status = status;
      expect(available(s, 'R20', today(), dateOffset(2))).toBe(false);
      expect(() => run('reservation.create', { guestId: 'G1', roomId: 'R20', adults: 2, checkIn: today(), checkOut: dateOffset(2) })).toThrow('unavailable');
    }
    s.rooms.find(r => r.id === 'R20')!.status = 'Ready';
    run('room.toggle', { id: 'R20', active: false });
    expect(available(s, 'R20', today(), dateOffset(2))).toBe(false);
    run('room.toggle', { id: 'R20', active: true });
    expect(available(s, 'R20', today(), dateOffset(2))).toBe(true);
  });
  it('connects newly added room to booking, check-in, checkout, cleaning and inspection', () => {
    run('room.create', roomInput);
    const id = s.rooms.find(r => r.number === '401')!.id;
    run('reservation.create', { guestId: 'G1', roomId: id, adults: 2, checkIn: today(), checkOut: dateOffset(2) });
    const reservationId = s.reservations[0].id;
    expect(roomStatus(s, s.rooms.find(r => r.id === id)!)).toBe('Reserved');
    run('reservation.status', { id: reservationId, status: 'Checked in' });
    expect(roomStatus(s, s.rooms.find(r => r.id === id)!)).toBe('Occupied');
    run('payment.create', { reservationId, amount: folio(s, s.reservations[0]).balance, method: 'Cash' });
    run('reservation.status', { id: reservationId, status: 'Completed' });
    expect(roomStatus(s, s.rooms.find(r => r.id === id)!)).toBe('Cleaning');
    const task = s.tasks.find(t => t.roomId === id && t.kind === 'Cleaning')!;
    run('task.update', { id: task.id, status: 'In progress' }, task.assignee);
    run('task.update', { id: task.id, status: 'Inspection' }, task.assignee);
    expect(available(s, id, today(), dateOffset(2))).toBe(false);
    run('task.update', { id: task.id, status: 'Completed' });
    expect(roomStatus(s, s.rooms.find(r => r.id === id)!)).toBe('Available');
  });
  it('queues maintenance and optional follow-up cleaning instead of silently changing readiness', () => {
    run('room.status', { id: 'R20', status: 'Maintenance', notes: 'Repair balcony door.' });
    expect(s.tasks.find(t => t.roomId === 'R20' && t.kind === 'Maintenance')).toMatchObject({ status: 'Pending', assignee: 'A4' });
    expect(() => run('room.status', { id: 'R20', status: 'Available' })).toThrow('Complete the open');
    run('room.resolve', { id: 'R20', cleaningRequired: true });
    expect(s.rooms.find(r => r.id === 'R20')!.status).toBe('Dirty');
    expect(s.tasks.find(t => t.roomId === 'R20' && t.kind === 'Cleaning')).toMatchObject({ assignee: 'A2', status: 'Pending' });
  });
  it('resolves a maintenance block without cleaning when management confirms it is ready', () => {
    run('room.status', { id: 'R20', status: 'Maintenance' });
    run('room.resolve', { id: 'R20', cleaningRequired: false });
    expect(available(s, 'R20', today(), dateOffset(2))).toBe(true);
  });
  it('requires an occupied-room transfer, preserves the contracted rate, and blocks deactivation of live stays', () => {
    const r = s.reservations.find(x => x.roomId === 'R1' && x.status === 'Checked in')!;
    expect(() => run('room.status', { id: 'R1', status: 'Maintenance' })).toThrow('transfer');
    expect(() => run('room.toggle', { id: 'R1', active: false })).toThrow('live reservations');
    run('room.status', { id: 'R1', status: 'Maintenance', transferRoomId: 'R20' });
    expect(s.reservations.find(x => x.id === r.id)).toMatchObject({ roomId: 'R20', rate: r.rate });
    expect(s.rooms.find(x => x.id === 'R1')!.status).toBe('Maintenance');
    expect(s.rooms.find(x => x.id === 'R20')!.status).toBe('Occupied');
  });
});
describe('Amenities, authority and persistence', () => {
  it('adds, assigns, edits and deactivates an amenity in the same shared state', () => {
    run('amenity.save', amenityInput);
    const amenity = s.amenities.find(a => a.name === amenityInput.name)!;
    expect(s.rooms[0].amenityIds).toContain(amenity.id);
    run('amenity.save', { ...amenity, price: 700, roomIds: ['R2'] });
    expect(s.rooms[0].amenityIds).not.toContain(amenity.id);
    expect(s.rooms[1].amenityIds).toContain(amenity.id);
    run('amenity.maintenance', { id: amenity.id, maintenance: true });
    expect(s.amenities.find(a => a.id === amenity.id)!.maintenance).toBe(true);
    run('amenity.toggle', { id: amenity.id, active: false }, 'owner');
    expect(s.amenities.find(a => a.id === amenity.id)!.active).toBe(false);
  });
  it('records guest amenity usage in the folio with immutable price history and denies unavailable usage', () => {
    run('amenity.save', amenityInput);
    const amenity = s.amenities.at(-1)!;
    const reservation = s.reservations.find(r => r.guestId === 'G1' && r.status === 'Checked in')!;
    const before = folio(s, reservation).extras;
    run('amenity.use', { id: amenity.id, reservationId: reservation.id }, 'account-G1');
    expect(folio(s, reservation).extras).toBe(before + 600);
    run('amenity.save', { ...amenity, price: 900 });
    expect(s.amenityUsage[0].amount).toBe(600);
    run('amenity.maintenance', { id: amenity.id, maintenance: true });
    expect(() => run('amenity.use', { id: amenity.id, reservationId: reservation.id }, 'account-G1')).toThrow('unavailable');
    run('amenity.delete', { id: amenity.id, confirmed: true });
    expect(s.amenities.some(a => a.id === amenity.id)).toBe(false);
    expect(folio(s, reservation).extras).toBe(before + 600);
  });
  it('rejects unassigned room amenities, other guest stays and invalid amenity forms', () => {
    run('amenity.save', { ...amenityInput, roomIds: ['R2'] });
    const id = s.amenities.at(-1)!.id;
    expect(() => run('amenity.use', { id, reservationId: 'RES-2401' }, 'account-G1')).toThrow('not assigned');
    expect(() => run('amenity.use', { id: 'AM-POOL', reservationId: 'RES-2402' }, 'account-G1')).toThrow('Check in');
    for (const override of [{ price: -1 }, { opening: '25:00' }, { name: 'Wi-Fi' }, { roomIds: ['missing'] }]) expect(() => run('amenity.save', { ...amenityInput, ...override })).toThrow();
  });
  it('honors Owner admin authority while preserving monitoring controls and management access', () => {
    run('property.permissions', { enabled: false }, 'owner');
    expect(() => run('room.create', roomInput, 'owner')).toThrow('Administrative');
    expect(() => run('amenity.save', amenityInput, 'owner')).toThrow('Administrative');
    run('room.toggle', { id: 'R20', active: false }, 'owner');
    run('room.create', roomInput);
    for (const actor of ['A1', 'account-G1']) {
      expect(() => run('room.create', roomInput, actor)).toThrow('permission');
      expect(() => run('amenity.save', amenityInput, actor)).toThrow('permission');
    }
  });
  it('keeps staff updates scoped to the assigned person and required service stages', () => {
    const task = s.tasks.find(t => t.assignee === 'A2' && t.status === 'Pending')!;
    expect(() => run('task.update', { id: task.id, status: 'In progress' }, 'A9')).toThrow('assigned');
    const service = s.services.find(x => x.status === 'Requested')!;
    expect(() => run('service.update', { id: service.id, status: 'In progress' }, service.assignee)).toThrow('Invalid service');
    run('service.update', { id: service.id, status: 'Accepted' }, service.assignee);
  });
  it('migrates old local data without clearing stays, payments, or revoked permissions', () => {
    const old = structuredClone(s) as any;
    delete old.amenities; delete old.amenityUsage; delete old.ownerPropertyAdmin; delete old.propertySchema;
    const migrated = normalizeState(old);
    expect(migrated.reservations).toEqual(s.reservations);
    expect(migrated.payments).toEqual(s.payments);
    expect(migrated.amenities.length).toBeGreaterThan(0);
    migrated.permissions.Management = migrated.permissions.Management.filter(p => p !== 'amenities');
    expect(normalizeState(migrated).permissions.Management).not.toContain('amenities');
  });
});

describe('Confirmed property deletion and simplified amenity forms', () => {
  it('accepts exactly three amenity fields and preserves assignments on edit', () => {
    run('amenity.save', { name: 'Balcony seating', category: 'Comfort', type: 'Room' });
    const amenity = s.amenities.at(-1)!;
    expect(amenity).toMatchObject({ active: true, paid: false, price: 0 });
    run('room.update', { id: 'R1', amenityIds: [amenity.id] });
    run('amenity.save', { id: amenity.id, name: 'Private balcony', category: 'Outdoor', type: 'Room' });
    expect(s.rooms[0].amenityIds).toEqual([amenity.id]);
    expect(s.amenities.find(a => a.id === amenity.id)).toMatchObject({ name: 'Private balcony', category: 'Outdoor' });
    run('amenity.save', { id: amenity.id, name: 'Garden seating', category: 'Outdoor', type: 'Resort' });
    expect(s.rooms.every(r => !r.amenityIds?.includes(amenity.id))).toBe(true);
  });
  it('requires confirmation and removes a deleted amenity from every assigned room', () => {
    const before = structuredClone(s);
    expect(() => run('amenity.delete', { id: 'AM-WIFI' })).toThrow('Confirm');
    expect(s).toEqual(before);
    run('amenity.delete', { id: 'AM-WIFI', confirmed: true });
    expect(s.amenities).toHaveLength(before.amenities.length - 1);
    expect(s.rooms.every(r => !r.amenityIds?.includes('AM-WIFI'))).toBe(true);
  });
  it('removes deleted rooms from availability and counts while retaining historical references', () => {
    run('room.create', roomInput);
    const room = s.rooms.at(-1)!;
    const count = s.rooms.length, availableBefore = dashboard(s).available;
    s.reservations.push({ ...s.reservations[0], id: 'HISTORICAL', roomId: room.id, status: 'Completed' });
    expect(() => run('room.delete', { id: room.id })).toThrow('Confirm');
    run('room.delete', { id: room.id, confirmed: true });
    expect(s.rooms).toHaveLength(count - 1);
    expect(dashboard(s).available).toBe(availableBefore - 1);
    expect(available(s, room.id, today(), dateOffset(1))).toBe(false);
    expect(findRoom(s, room.id)).toMatchObject({ number: '401', active: false });
    expect(s.reservations.find(r => r.id === 'HISTORICAL')?.roomId).toBe(room.id);
    expect(findRoom(normalizeState(JSON.parse(JSON.stringify(s))), room.id)?.name).toBe(room.name);
  });
  it('protects live bookings, open tasks, and Owner administrative authority', () => {
    expect(() => run('room.delete', { id: 'R1', confirmed: true })).toThrow('live reservations');
    run('room.create', roomInput);
    const id = s.rooms.at(-1)!.id;
    run('room.status', { id, status: 'Maintenance' });
    expect(() => run('room.delete', { id, confirmed: true })).toThrow('open tasks');
    run('room.resolve', { id, cleaningRequired: false });
    run('property.permissions', { enabled: false }, 'owner');
    expect(() => run('room.delete', { id, confirmed: true }, 'owner')).toThrow('Administrative');
    expect(() => run('amenity.delete', { id: 'AM-WIFI', confirmed: true }, 'owner')).toThrow('Administrative');
    run('room.delete', { id, confirmed: true });
    expect(s.rooms.some(r => r.id === id)).toBe(false);
  });
  it('rejects blank fields, duplicate names, and invalid amenity types without changing state', () => {
    const before = structuredClone(s);
    for (const value of [{ name: ' ' }, { category: ' ' }, { type: 'Other' }, { name: 'wi-fi' }]) {
      expect(() => run('amenity.save', { name: 'Garden terrace', category: 'Outdoor', type: 'Resort', ...value })).toThrow();
      expect(s).toEqual(before);
    }
  });
});
