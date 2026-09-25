import type { Account, Command, Room, State, Task } from './domain';
import { available, can, dateOffset, live, today, uid } from './domain';

export interface Amenity {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  icon: string;
  paid: boolean;
  price: number;
  opening: string;
  closing: string;
  active: boolean;
  maintenance: boolean;
  type: 'Room' | 'Resort';
}
export interface AmenityUsage {
  id: string;
  amenityId: string;
  reservationId: string;
  guestId: string;
  name: string;
  amount: number;
  date: string;
}
export const roomStatuses = ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance', 'Out of Service'] as const;
export function initialAmenities(): Amenity[] {
  return [
    { id: 'AM-WIFI', name: 'Wi-Fi', category: 'Connectivity', description: 'Stay connected throughout your room.', type: 'Room' as const, icon: 'wifi', price: 0 },
    { id: 'AM-POOL', name: 'Swimming pool', category: 'Recreation', description: 'A refreshing pause beside the resort gardens.', type: 'Resort' as const, icon: 'waves', price: 0 },
    { id: 'AM-GYM', name: 'Fitness studio', category: 'Wellness', description: 'A quiet space for your daily movement.', type: 'Resort' as const, icon: 'fitness', price: 250 },
  ].map(x => ({ ...x, paid: x.price > 0, image: '', active: true, maintenance: false, opening: '06:00', closing: '22:00' }));
}
export function normalizeState(s: State): State {
  s.amenities ??= initialAmenities();
  s.amenityUsage ??= [];
  s.roomTypes ??= Array.from(new Set(s.rooms.map(r => r.type)));
  s.amenityCategories ??= Array.from(new Set(s.amenities.map(a => a.category)));
  s.ownerPropertyAdmin ??= true;
  // Migrate older demos without resetting guest, payment, or operational records.
  if (!s.permissions.Management?.includes('amenities') && !('propertySchema' in s)) {
    s.permissions.Management = [...(s.permissions.Management ?? []), 'amenities'];
    s.permissions.Guest = [...(s.permissions.Guest ?? []), 'amenities'];
  }
  (s as State & { propertySchema: number }).propertySchema = 1;
  s.rooms.forEach(r => {
    r.name ??= `${r.type} ${r.number}`;
    r.bedType ??= 'King';
    r.beds ??= 1;
    r.description ??= '';
    r.images ??= ['/images/suite.jpg'];
    r.amenityIds ??= s.amenities.some(a => a.id === 'AM-WIFI') ? ['AM-WIFI'] : [];
    r.active ??= true;
  });
  return s;
}
export function roomStatus(s: State, room: Room): typeof roomStatuses[number] {
  if (room.active === false || room.status === 'Out of Service') return 'Out of Service';
  if (room.status === 'Dirty' || room.status === 'Inspection') return 'Cleaning';
  if (room.status === 'Maintenance' || room.status === 'Occupied') return room.status;
  if (s.reservations.some(r => r.roomId === room.id && r.status === 'Confirmed' && r.checkIn <= today() && r.checkOut > today())) return 'Reserved';
  return 'Available';
}
export function canEditProperty(s: State, actor: Account, permission: 'rooms' | 'amenities') {
  return actor.active && (actor.module === 'Management' && can(s, actor, permission) || actor.module === 'Owner' && s.ownerPropertyAdmin !== false);
}
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function required(value: unknown, label: string) { const text = String(value ?? '').trim(); check(text, `${label} is required.`); return text; }
function positive(value: unknown, label: string, integer = false) {
  const n = Number(value);
  check(Number.isFinite(n) && n > 0 && (!integer || Number.isInteger(n)), `${label} must be a positive ${integer ? 'whole number' : 'finite amount'}.`);
  return n;
}
export function safeImage(value: string) {
  return !value || /^\/images\/[\w.-]+$/.test(value) || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value) || /^https:\/\/[^\s]+$/.test(value);
}
function queueTask(s: State, room: Room, kind: 'Maintenance' | 'Cleaning', notes: string) {
  if (s.tasks.some(t => t.roomId === room.id && t.kind === kind && t.status !== 'Completed')) return;
  const role = kind === 'Cleaning' ? 'Housekeeping' : 'Maintenance';
  s.tasks.unshift({ id: uid('T'), roomId: room.id, title: `${kind} · Room ${room.number}`, kind, role, assignee: s.accounts.find(a => a.active && a.role === role)?.id ?? '', priority: 'High', deadline: `${today()}T16:00`, status: 'Pending', notes });
}
function setRoomState(s: State, room: Room, next: string, p: Record<string, any>) {
  check(['Available', 'Ready', 'Cleaning', 'Dirty', 'Maintenance', 'Out of Service'].includes(next), 'Reserved and Occupied are controlled by reservations and check-in.');
  const stay = s.reservations.find(r => r.roomId === room.id && r.status === 'Checked in');
  if (stay) {
    check(next === 'Maintenance' || next === 'Out of Service', 'Check out the current guest before changing room readiness.');
    const replacement = s.rooms.find(r => r.id === p.transferRoomId);
    check(replacement && replacement.id !== room.id && replacement.status === 'Ready' && replacement.active !== false && replacement.capacity >= stay.adults && available(s, replacement.id, today(), stay.checkOut, stay.id), 'Select an available, ready replacement room and transfer the guest first.');
    stay.roomId = replacement.id;
    replacement.status = 'Occupied';
    stay.history.push({ date: new Date().toISOString(), text: `Transferred from room ${room.number} to ${replacement.number} for maintenance. Original nightly rate retained.` });
  }
  if (next === 'Available' || next === 'Ready') {
    check(!s.tasks.some(t => t.roomId === room.id && ['Cleaning', 'Maintenance'].includes(t.kind) && t.status !== 'Completed'), 'Complete the open cleaning or maintenance task and inspection first.');
    room.status = 'Ready';
  } else if (next === 'Cleaning' || next === 'Dirty') {
    check(!s.tasks.some(t => t.roomId === room.id && t.kind === 'Maintenance' && t.status !== 'Completed'), 'Resolve the maintenance issue before cleaning.');
    room.status = 'Dirty';
    queueTask(s, room, 'Cleaning', p.notes || 'Clean the room, then request management inspection.');
  } else {
    room.status = next as 'Maintenance' | 'Out of Service';
    if (next === 'Maintenance') queueTask(s, room, 'Maintenance', p.notes || 'Resolve the issue and request management inspection.');
  }
}
export function applyPropertyCommand(s: State, actor: Account, command: Command): boolean {
  const p = command.payload ?? {};
  if (command.type === 'property.permissions') {
    check(actor.module === 'Owner', 'Only the Owner can change administrative permission.');
    s.ownerPropertyAdmin = Boolean(p.enabled);
    return true;
  }
  if (command.type === 'property.addRoomType') {
    check(canEditProperty(s, actor, 'rooms'), 'Administrative permission is required.');
    if (!s.roomTypes) s.roomTypes = Array.from(new Set(s.rooms.map(r => r.type)));
    if (p.type && !s.roomTypes.includes(p.type)) s.roomTypes.push(p.type);
    return true;
  }
  if (command.type === 'property.addAmenityCategory') {
    check(canEditProperty(s, actor, 'amenities'), 'Administrative permission is required.');
    if (!s.amenityCategories) s.amenityCategories = Array.from(new Set(s.amenities.map(a => a.category)));
    if (p.category && !s.amenityCategories.includes(p.category)) s.amenityCategories.push(p.category);
    return true;
  }
  if (command.type.startsWith('room.')) {
    check(['Owner', 'Management'].includes(actor.module) && can(s, actor, 'rooms'), 'Your role does not have permission to manage rooms.');
    if (['room.create', 'room.update'].includes(command.type)) {
      check(canEditProperty(s, actor, 'rooms'), 'Administrative permission is required to add or edit rooms.');
      const old = command.type === 'room.update' ? s.rooms.find(r => r.id === p.id) : undefined;
      check(command.type === 'room.create' || old, 'Room not found.');
      const v = { ...old, ...p };
      const number = required(v.number, 'Room number');
      check(!s.rooms.some(r => r.id !== old?.id && r.number.toLowerCase() === number.toLowerCase()), 'This room number already exists.');
      const room: Room = {
        id: old?.id ?? uid('R'), number, name: required(v.name ?? `${v.type} ${number}`, 'Room name'), type: required(v.type, 'Room type'), floor: required(v.floor, 'Floor'),
        capacity: positive(v.capacity, 'Capacity', true), rate: positive(v.rate, 'Nightly rate'), bedType: required(v.bedType ?? 'King', 'Bed type'), beds: positive(v.beds ?? 1, 'Number of beds', true),
        description: String(v.description ?? '').trim(), images: v.images ?? ['/images/suite.jpg'], amenityIds: v.amenityIds ?? [], active: old?.active ?? true, status: old?.status ?? 'Ready',
      };
      check(room.images!.length <= 4 && room.images!.every(safeImage), 'Use up to four PNG, JPEG, WebP or HTTPS images.');
      check(room.amenityIds!.every(id => s.amenities.some(a => a.id === id && a.type === 'Room')), 'Select valid room amenities.');
      check(!s.reservations.some(r => r.roomId === room.id && live(r) && r.adults > room.capacity), 'Capacity cannot be lower than an existing reservation’s guest count.');
      if (old) Object.assign(old, room); else { s.rooms.push(room); setRoomState(s, room, p.status ?? 'Available', p); }
      if (!s.roomTypes?.includes(room.type)) s.roomTypes?.push(room.type);
      return true;
    }
    const room = s.rooms.find(r => r.id === p.id);
    check(room, 'Room not found.');
    if (command.type === 'room.delete') {
      check(canEditProperty(s, actor, 'rooms'), 'Administrative permission is required to delete rooms.');
      check(p.confirmed === true, 'Confirm room deletion first.');
      check(!s.reservations.some(r => r.roomId === room.id && live(r)), 'Transfer or cancel live reservations before deleting this room.');
      check(!s.tasks.some(t => t.roomId === room.id && t.status !== 'Completed'), 'Complete the room’s open tasks before deleting it.');
      // Keep a snapshot for past stays, invoices, and completed tasks, outside bookable inventory.
      (s.archivedRooms ??= []).push({ ...room, active: false });
      s.rooms = s.rooms.filter(r => r.id !== room.id);
      return true;
    }
    if (command.type === 'room.status') { setRoomState(s, room, p.status, p); return true; }
    if (command.type === 'room.toggle') {
      if (!p.active) check(!s.reservations.some(r => r.roomId === room.id && live(r)), 'Transfer or cancel live reservations before deactivating this room.');
      room.active = Boolean(p.active);
      return true;
    }
    if (command.type === 'room.resolve') {
      check(['Maintenance', 'Out of Service'].includes(room.status), 'This room has no unresolved maintenance block.');
      check(!s.reservations.some(r => r.roomId === room.id && r.status === 'Checked in'), 'Transfer the guest before resolving room readiness.');
      s.tasks.filter(t => t.roomId === room.id && t.kind === 'Maintenance' && t.status !== 'Completed').forEach(t => { t.status = 'Completed'; t.notes += '\nIssue resolved and inspected by management.'; });
      room.status = 'Ready';
      if (p.cleaningRequired || s.tasks.some(t => t.roomId === room.id && t.kind === 'Cleaning' && t.status !== 'Completed')) {
        room.status = 'Dirty'; queueTask(s, room, 'Cleaning', 'Clean after maintenance, then request inspection.');
      }
      return true;
    }
    return false;
  }
  if (!command.type.startsWith('amenity.')) return false;
  if (command.type === 'amenity.use') {
    check(actor.module === 'Guest' && can(s, actor, 'amenities'), 'Only a signed-in guest can record an amenity visit.');
    const amenity = s.amenities.find(x => x.id === p.id);
    const stay = s.reservations.find(r => r.id === p.reservationId && r.guestId === actor.guestId && r.status === 'Checked in');
    check(stay, 'Check in before using resort amenities.');
    check(amenity?.active && !amenity.maintenance, 'This amenity is currently unavailable.');
    check(amenity.type === 'Resort' || s.rooms.find(r => r.id === stay.roomId)?.amenityIds?.includes(amenity.id), 'This amenity is not assigned to your room.');
    s.amenityUsage.unshift({ id: uid('USE'), amenityId: amenity.id, reservationId: stay.id, guestId: actor.guestId!, name: amenity.name, amount: amenity.paid ? amenity.price : 0, date: new Date().toISOString() });
    return true;
  }
  check(['Owner', 'Management'].includes(actor.module) && can(s, actor, 'amenities'), 'Your role does not have permission to manage amenities.');
  const old = s.amenities.find(a => a.id === p.id);
  if (command.type === 'amenity.save') {
    check(canEditProperty(s, actor, 'amenities'), 'Administrative permission is required to add or edit amenities.');
    check(!p.id || old, 'Amenity not found.');
    const v = { description: '', image: '', icon: 'sparkles', paid: false, price: 0, opening: '06:00', closing: '22:00', active: true, maintenance: false, ...old, ...p };
    const name = required(v.name, 'Amenity name');
    check(!s.amenities.some(a => a.id !== old?.id && a.name.toLowerCase() === name.toLowerCase()), 'An amenity with this name already exists.');
    check(['Room', 'Resort'].includes(v.type), 'Select Room or Resort amenity type.');
    check(/^([01]\d|2[0-3]):[0-5]\d$/.test(v.opening) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.closing) && v.opening !== v.closing, 'Enter different valid opening and closing times.');
    check(safeImage(v.image || ''), 'Choose a PNG, JPEG, WebP or HTTPS image.');
    const amenity: Amenity = { id: old?.id ?? uid('AM'), name, category: required(v.category, 'Category'), description: String(v.description ?? ''), image: v.image ?? '', icon: v.icon || 'sparkles', paid: Boolean(v.paid), price: v.paid ? positive(v.price, 'Price') : 0, opening: v.opening, closing: v.closing, active: Boolean(v.active), maintenance: Boolean(v.maintenance), type: v.type };
    if (old) Object.assign(old, amenity); else s.amenities.push(amenity);
    if (!s.amenityCategories?.includes(amenity.category)) s.amenityCategories?.push(amenity.category);
    s.amenityUsage.filter(u => u.amenityId === amenity.id).forEach(u => { u.name = amenity.name; });
    if (p.roomIds !== undefined || amenity.type === 'Resort') {
      check(p.roomIds === undefined || Array.isArray(p.roomIds) && p.roomIds.every((id: string) => s.rooms.some(r => r.id === id)), 'Select valid rooms.');
      s.rooms.forEach(room => {
        room.amenityIds = (room.amenityIds ?? []).filter(id => id !== amenity.id);
        if (amenity.type === 'Room' && p.roomIds.includes(room.id)) room.amenityIds.push(amenity.id);
      });
    }
    return true;
  }
  check(old, 'Amenity not found.');
  if (command.type === 'amenity.toggle') { old.active = Boolean(p.active); return true; }
  if (command.type === 'amenity.maintenance') { old.maintenance = Boolean(p.maintenance); return true; }
  if (command.type === 'amenity.delete') {
    check(canEditProperty(s, actor, 'amenities'), 'Administrative permission is required.');
    check(p.confirmed === true, 'Confirm amenity deletion first.');
    s.amenities = s.amenities.filter(a => a.id !== old.id);
    [...s.rooms, ...(s.archivedRooms ?? [])].forEach(r => { r.amenityIds = (r.amenityIds ?? []).filter(id => id !== old.id); });
    return true;
  }
  return false;
}
