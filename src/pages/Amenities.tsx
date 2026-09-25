import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Check, Coffee, Dumbbell, Eye, Leaf, Plus, Search, Sparkles, Waves, Wifi, Wrench, X } from 'lucide-react';
import { Badge, Button, Card, CardHead, Confirm, DataTable, Empty, Fields, Modal, PageMotion, PageTitle, Tabs } from '../components/ui';
import { money, shortDate } from '../lib/domain';
import { canEditProperty } from '../lib/property';
import type { Amenity } from '../lib/property';
import { useStore } from '../lib/store';
const amenityIcons = { sparkles: Sparkles, wifi: Wifi, waves: Waves, fitness: Dumbbell, leaf: Leaf, coffee: Coffee };
const availability = (a: Amenity) => !a.active ? 'Inactive' : a.maintenance ? 'Maintenance' : 'Available';
export default function Amenities() {
  const { s, actor, act } = useStore();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All'), [status, setStatus] = useState('All'), [type, setType] = useState('All'), [cost, setCost] = useState('All');
  const [form, setForm] = useState<Amenity | 'new' | null>(null), [detailId, setDetailId] = useState('');
  const [confirm, setConfirm] = useState<{ item: Amenity; kind: 'toggle' | 'maintenance' | 'delete' | 'use' } | null>(null);
  const guest = actor!.module === 'Guest', owner = actor!.module === 'Owner';
  const editable = canEditProperty(s, actor!, 'amenities');
  const tabs = guest ? ['All amenities', 'My visits'] : ['Overview', 'All amenities', 'Categories', 'Free / paid', 'Usage & revenue', 'Maintenance'];
  const tab = tabs.includes(params.get('tab') ?? '') ? params.get('tab')! : tabs[0];
  const stay = s.reservations.find(r => r.guestId === actor!.guestId && r.status === 'Checked in');
  const guestStays = s.reservations.filter(r => r.guestId === actor!.guestId && ['Confirmed', 'Checked in'].includes(r.status));
  const roomIds = guestStays.map(r => r.roomId);
  const accessible = s.amenities.filter(a => !guest || a.active && (a.type === 'Resort' || s.rooms.some(r => roomIds.includes(r.id) && r.amenityIds?.includes(a.id))));
  const rows = accessible.filter(a => `${a.name} ${a.category} ${a.description}`.toLowerCase().includes(query.trim().toLowerCase()) && (category === 'All' || a.category === category) && (status === 'All' || availability(a) === status) && (type === 'All' || a.type === type) && (cost === 'All' || (cost === 'Paid') === a.paid) && (tab !== 'Maintenance' || a.maintenance));
  const categories = [...new Set(accessible.map(a => a.category))].sort();
  const usage = s.amenityUsage.filter(u => (!guest || u.guestId === actor!.guestId) && (tab === 'My visits' || rows.some(a => a.id === u.amenityId)));
  const detail = accessible.find(a => a.id === detailId);
  const reset = () => { setQuery(''); setCategory('All'); setStatus('All'); setType('All'); setCost('All'); };
  const changeTab = (value: string) => { reset(); setParams({ tab: value }); };
  const confirmAction = () => {
    if (!confirm) return false;
    const { item, kind } = confirm;
    return act({ type: `amenity.${kind}`, payload: { id: item.id, active: !item.active, maintenance: !item.maintenance, reservationId: stay?.id, confirmed: kind === 'delete' } }, kind === 'use' ? `${item.name} visit recorded${item.paid ? '. Charge added to your folio.' : '.'}` : kind === 'delete' ? 'Amenity deleted' : 'Amenity updated across all workspaces');
  };
  const columns = [
    { key: 'name', label: 'Amenity', sort: (a: Amenity) => a.name, render: (a: Amenity) => <button className="table-link property-room-link" onClick={() => setDetailId(a.id)}><strong>{a.name}</strong><small>{a.category} · {a.type}</small></button> },
    { key: 'price', label: 'Price / visit', sort: (a: Amenity) => a.price, render: (a: Amenity) => a.paid ? money(a.price) : 'Complimentary' },
    { key: 'hours', label: 'Opening hours', render: (a: Amenity) => `${a.opening} – ${a.closing}` },
    { key: 'availability', label: 'Availability', render: (a: Amenity) => <Badge>{availability(a)}</Badge> },
    { key: 'assigned', label: 'Scope', render: (a: Amenity) => a.type === 'Resort' ? 'Resort-wide' : `${s.rooms.filter(r => r.amenityIds?.includes(a.id)).length} rooms` },
    { key: 'action', label: 'Actions', render: (a: Amenity) => <div className="property-row-actions"><Button size="sm" variant="ghost" aria-label={`View ${a.name}`} onClick={() => setDetailId(a.id)}><Eye size={14} /> View</Button>{editable && <Button size="sm" variant="outline" aria-label={`Edit ${a.name}`} onClick={() => setForm(a)}>Edit</Button>}{editable && <Button size="sm" variant="ghost" aria-label={`Delete ${a.name}`} onClick={() => setConfirm({ item: a, kind: 'delete' })}>Delete</Button>}</div> },
  ];
  return <PageMotion><PageTitle eyebrow={guest ? 'A LITTLE MORE TO ENJOY' : owner ? 'RESORT AMENITIES & PERFORMANCE' : 'THOUGHTFUL DETAILS. BETTER STAYS.'} title={guest ? 'Resort amenities' : 'Amenities management'} description={guest ? 'Discover what is available during your stay, with opening hours and pricing at a glance.' : 'Manage room essentials and shared experiences, with availability reflected everywhere.'} actions={editable ? <Button onClick={() => setForm('new')}><Plus size={16} />Add amenity</Button> : undefined} />
    <Card className="property-tabs"><Tabs value={tab} onChange={changeTab} tabs={tabs.map(value => ({ value, label: value }))} /></Card>
    {tab === 'Overview' ? <><div className="property-summary amenity-summary">{[{ label: 'All amenities', value: accessible.length, target: 'All amenities' }, { label: 'Available now', value: accessible.filter(a => a.active && !a.maintenance).length, target: 'All amenities', status: 'Available' }, { label: 'Maintenance', value: accessible.filter(a => a.maintenance).length, target: 'Maintenance' }, { label: 'Amenity charges', value: money(s.amenityUsage.reduce((n, u) => n + u.amount, 0)), target: 'Usage & revenue' }].map(x => <button className="property-metric" key={x.label} onClick={() => { changeTab(x.target); if (x.status) setStatus(x.status); }}><span>{x.label}<ArrowUpRight size={15} /></span><strong>{x.value}</strong><small>{x.label === 'Amenity charges' ? 'Recorded visit charges, before stay tax' : 'View details'}</small></button>)}</div><Card><CardHead title="Amenity categories" subtitle="A connected view of your resort offerings" /><div className="property-category-list">{categories.map(c => <button key={c} onClick={() => { changeTab('All amenities'); setCategory(c); }}><Sparkles size={20} /><span><strong>{c}</strong><small>{accessible.filter(a => a.category === c).length} amenities</small></span><ArrowUpRight size={16} /></button>)}</div></Card></> : <>
      {tab !== 'My visits' && <Card className="property-filter-card"><div className="property-filters"><label className="search-input"><Search size={16} /><input aria-label="Search amenities" placeholder="Search amenities or categories…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear amenity search" onClick={() => setQuery('')}><X size={15} /></button>}</label><select aria-label="Amenity category filter" value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select><select aria-label="Amenity availability filter" value={status} onChange={e => setStatus(e.target.value)}><option value="All">All availability</option>{['Available', 'Maintenance', ...(!guest ? ['Inactive'] : [])].map(c => <option key={c}>{c}</option>)}</select><select aria-label="Amenity type filter" value={type} onChange={e => setType(e.target.value)}><option value="All">Room & resort</option><option>Room</option><option>Resort</option></select><select aria-label="Amenity pricing filter" value={cost} onChange={e => setCost(e.target.value)}><option value="All">Free & paid</option><option>Free</option><option>Paid</option></select><Button variant="ghost" size="sm" onClick={reset}>Reset filters</Button></div></Card>}
      {tab === 'Usage & revenue' || tab === 'My visits' ? <Card><CardHead title={guest ? 'Your recorded visits' : 'Amenity usage & revenue'} subtitle={`${usage.length} visits · ${money(usage.reduce((n, u) => n + u.amount, 0))} in charges before stay tax. Payments are recorded in each stay folio.`} /><DataTable rows={usage} searchBy={u => `${u.name} ${u.reservationId} ${s.guests.find(g => g.id === u.guestId)?.name}`} columns={[{ key: 'amenity', label: 'Amenity', render: u => <strong>{u.name}</strong> }, { key: 'date', label: 'Date', sort: u => u.date, render: u => shortDate(u.date) }, ...(!guest ? [{ key: 'guest', label: 'Guest', render: (u: typeof usage[number]) => s.guests.find(g => g.id === u.guestId)?.name }] : []), { key: 'reservation', label: 'Stay', render: u => u.reservationId }, { key: 'amount', label: 'Charge', sort: u => u.amount, render: u => money(u.amount) }]} /></Card>
      : tab === 'Categories' ? <div className="property-type-grid">{categories.filter(c => rows.some(a => a.category === c)).map(c => <Card className="card-padding" key={c}><Sparkles size={24} /><h2>{c}</h2><p>{rows.filter(a => a.category === c).length} amenities</p><Button variant="outline" onClick={() => { changeTab('All amenities'); setCategory(c); }}>View category<ArrowUpRight size={15} /></Button></Card>)}{!rows.length && <Empty title="No matching categories" action={<Button variant="outline" onClick={reset}>Reset filters</Button>} />}</div>
      : guest ? <div className="amenity-grid">{rows.map(a => { const Icon = amenityIcons[a.icon as keyof typeof amenityIcons] ?? Sparkles; return <Card key={a.id} className="amenity-card">{a.image ? <img className="amenity-image" src={a.image} alt={a.name} loading="lazy" /> : <div className={`amenity-art amenity-art-${a.icon}`}><Icon size={40} /><span>{a.category}</span></div>}<div className="amenity-card-body"><div className="flex-between"><Badge>{availability(a)}</Badge><span>{a.paid ? money(a.price) : 'Complimentary'}</span></div><h2>{a.name}</h2><p>{a.description || 'A thoughtful extra for your resort stay.'}</p><small>{a.opening} – {a.closing}{a.closing < a.opening ? ' · closes next day' : ''} · {a.type} amenity</small><div className="property-row-actions"><Button variant="outline" size="sm" onClick={() => setDetailId(a.id)}>Details</Button><Button size="sm" disabled={!stay || a.maintenance} onClick={() => setConfirm({ item: a, kind: 'use' })}>{a.maintenance ? 'Unavailable' : !stay ? 'Available after check-in' : 'Record visit'}</Button></div></div></Card>; })}{!rows.length && <Empty title="No amenities to show" description="Try resetting your filters. Room amenities appear when assigned to your stay." action={<Button variant="outline" onClick={reset}>Reset filters</Button>} />}</div>
      : <Card><CardHead title={tab === 'Maintenance' ? 'Amenities under maintenance' : tab === 'Free / paid' ? 'Complimentary & paid amenities' : 'All amenities'} subtitle={`${rows.length} matching amenities`} /><DataTable key={`${query}-${category}-${type}-${status}-${cost}`} hideToolbar rows={rows} searchBy={a => a.name} columns={columns} /></Card>}
    </>}
    {detail && <Modal open title={detail.name} description={`${detail.category} · ${detail.type} amenity`} onClose={() => setDetailId('')}><div className="dialog-body property-details">{detail.image && <img className="amenity-detail-image" src={detail.image} alt={detail.name} />}<Badge>{availability(detail)}</Badge><p>{detail.description || 'No description added yet.'}</p><dl className="detail-grid"><div><dt>Price</dt><dd>{detail.paid ? `${money(detail.price)} / visit` : 'Complimentary'}</dd></div><div><dt>Opening hours</dt><dd>{detail.opening} – {detail.closing}</dd></div>{!guest && <><div><dt>Recorded visits</dt><dd>{s.amenityUsage.filter(u => u.amenityId === detail.id).length}</dd></div><div><dt>Charges before tax</dt><dd>{money(s.amenityUsage.filter(u => u.amenityId === detail.id).reduce((n, u) => n + u.amount, 0))}</dd></div></>}</dl>{detail.type === 'Room' && !guest && <p>Assigned rooms: {s.rooms.filter(r => r.amenityIds?.includes(detail.id)).map(r => r.number).join(', ') || 'None yet'}</p>}<div className="property-detail-actions">{editable && <Button onClick={() => { setDetailId(''); setForm(detail); }}>Edit amenity</Button>}{!guest && <><Button variant="outline" onClick={() => { setDetailId(''); setConfirm({ item: detail, kind: 'toggle' }); }}>{detail.active ? 'Deactivate' : 'Activate'}</Button><Button variant="outline" onClick={() => { setDetailId(''); setConfirm({ item: detail, kind: 'maintenance' }); }}><Wrench size={15} />{detail.maintenance ? 'Resolve maintenance' : 'Mark maintenance'}</Button>{editable && <Button variant="destructive" onClick={() => { setDetailId(''); setConfirm({ item: detail, kind: 'delete' }); }}>Delete amenity</Button>}</>}{guest && <Button disabled={!stay || detail.maintenance} onClick={() => { setDetailId(''); setConfirm({ item: detail, kind: 'use' }); }}>Record visit</Button>}</div></div><div className="dialog-footer"><Button variant="outline" onClick={() => setDetailId('')}>Close</Button></div></Modal>}
    {form && <AmenityForm amenity={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}
    {confirm && <Confirm title={confirm.kind === 'use' ? `Record a visit to ${confirm.item.name}?` : confirm.kind === 'delete' ? 'Are you sure you want to delete this amenity?' : confirm.kind === 'toggle' ? `${confirm.item.active ? 'Deactivate' : 'Activate'} ${confirm.item.name}?` : `${confirm.item.maintenance ? 'Resolve maintenance for' : 'Mark maintenance on'} ${confirm.item.name}?`} description={confirm.kind === 'use' ? confirm.item.paid ? `${money(confirm.item.price)} plus your stay tax will be added to your folio. This records one simulated visit.` : 'This complimentary visit will appear in your visit history.' : confirm.kind === 'delete' ? `“${confirm.item.name}” will be removed from the amenity list and all assigned rooms. Past visit charges will be retained.` : 'The updated availability will be reflected in Guest, Management, and Owner workspaces immediately.'} label={confirm.kind === 'use' ? 'Confirm visit' : confirm.kind === 'delete' ? 'Delete' : 'Confirm'} cancelLabel={confirm.kind === 'delete' ? 'Cancel' : 'Go back'} onClose={() => setConfirm(null)} onConfirm={confirmAction} />}
  </PageMotion>;
}
function AmenityForm({ amenity, onClose }: { amenity?: Amenity; onClose: () => void }) {
  const { s, act } = useStore();
  const [v, setV] = useState({ name: amenity?.name ?? '', category: amenity?.category ?? s.amenityCategories?.[0] ?? '', type: amenity?.type ?? 'Resort' });
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const change = (key: string, value: any) => {
    if (key === 'category' && value === '+ Add New Category') {
      setAddingCategory(true);
      return;
    }
    setV(previous => ({ ...previous, [key]: value }));
  };

  const addCategory = () => {
    const c = newCategory.trim();
    if (c) {
      act({ type: 'property.addAmenityCategory', payload: { category: c } }, '');
      setV(prev => ({ ...prev, category: c }));
    }
    setAddingCategory(false);
    setNewCategory('');
  };

  return <Modal open title={amenity ? 'Edit ' + amenity.name : 'Add amenity'} description="Keep your room essentials and resort amenities up to date." onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); if (act({ type: 'amenity.save', payload: { id: amenity?.id, ...v } }, amenity ? 'Amenity updated' : 'Amenity added')) onClose(); }}>
      <div className="dialog-body property-form"><Fields values={v} onChange={change} fields={[
        { name: 'name', label: 'Amenity Name', required: true },
        ...(!addingCategory ? [{ name: 'category', label: 'Category', type: 'select', required: true, options: [...(s.amenityCategories || []), '+ Add New Category'].map(value => ({ value, label: value })) }] : []),
        { name: 'type', label: 'Amenity Type', type: 'select', required: true, options: ['Room', 'Resort'].map(value => ({ value, label: value })) },
      ]} />
      {addingCategory && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '-12px', marginBottom: '16px' }}>
          <input autoFocus placeholder="New category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          <Button type="button" onClick={addCategory}>Add</Button>
          <Button type="button" variant="ghost" onClick={() => { setAddingCategory(false); setNewCategory(''); }}>Cancel</Button>
        </div>
      )}
      </div>
      <div className="dialog-footer"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{amenity ? 'Save amenity' : 'Add amenity'}<Check size={15} /></Button></div>
    </form>
  </Modal>;
}
