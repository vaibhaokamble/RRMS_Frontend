import { findRoom } from '../lib/domain';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BedDouble,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  Check,
  Clock3,
  Wrench,
  Leaf,
  Coffee,
  Shirt,
  Waves,
  Car,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  MessageSquare,
  Download,
} from 'lucide-react';
import { useStore } from '../lib/store';
import {
  serviceMenu,
  available,
  dateOffset,
  today,
  shortDate,
  money,
  can,
  live,
} from '../lib/domain';
import type { Task, Service, Room, StaffRole } from '../lib/domain';
import {
  PageTitle,
  Card,
  CardHead,
  Button,
  Badge,
  Tabs,
  FormModal,
  Modal,
  Fields,
  Empty,
  PageMotion,
  Avatar,
  DataTable,
} from '../components/ui';
import { downloadCsv } from '../lib/utils';
const icons = {
  Spa: Leaf,
  Laundry: Shirt,
  'Food & Beverage': Coffee,
  Activities: Waves,
  Other: Car,
};
export function Tasks() {
  const { s, actor, act } = useStore();
  const [taskParams, setTaskParams] = useSearchParams();
  const statusFilter = taskParams.get('status') ?? 'All';
  const [tab, setTab] = useState('All tasks'),
    [newTask, setNewTask] = useState(taskParams.has('new')),
    [edit, setEdit] = useState<Task | null>(null),
    [found, setFound] = useState(false),
    [damage, setDamage] = useState(false);
  const own = actor!.module === 'Staff';
  const assigned = s.tasks.filter(t => !own || t.assignee === actor!.id);
  const taskTabs = ['All tasks',
    ...(!own || assigned.some(t => t.kind === 'Cleaning') ? ['Housekeeping'] : []),
    ...(!own || assigned.some(t => t.kind === 'Maintenance') ? ['Maintenance'] : []),
    ...(!own || assigned.some(t => t.kind === 'Property') ? ['Property care'] : []),
    ...(!own || assigned.some(t => ['Cleaning', 'Maintenance'].includes(t.kind)) ? ['Inspections'] : []),
    ...(!own || ['Receptionist', 'Housekeeping'].includes(actor!.role) ? ['Lost & found'] : []),
  ];
  const tasks = s.tasks.filter(
    (t) =>
      (!own || t.assignee === actor!.id) &&
      (tab === 'All tasks' ||
        (tab === 'Housekeeping' && t.kind === 'Cleaning') ||
        (tab === 'Maintenance' && t.kind === 'Maintenance') ||
        (tab === 'Property care' && t.kind === 'Property') ||
        (tab === 'Inspections' && t.status === 'Inspection')),
  );
  const [search, setSearch] = useState('');
  const shown = tasks.filter((t) =>
    (statusFilter === 'All' || t.status === statusFilter) && `${t.title} ${findRoom(s, t.roomId)?.number} ${s.accounts.find(a => a.id === t.assignee)?.name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const next = (t: Task) =>
    t.status === 'Pending'
      ? 'In progress'
      : t.status === 'In progress'
        ? t.kind === 'Cleaning' || t.kind === 'Maintenance'
          ? 'Inspection'
          : 'Completed'
        : 'Completed';
  return (
    <PageMotion>
      <PageTitle
        eyebrow="SMALL DETAILS. EXCEPTIONAL STAYS."
        title={own ? 'My tasks' : 'Tasks & housekeeping'}
        description={
          own
            ? 'Your assignments, organized around a smooth resort day.'
            : 'Coordinate your team and keep every corner of the resort at its best.'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setDamage(true)}>
              <Wrench size={16} />
              Report damage
            </Button>
            <Button onClick={() => setNewTask(true)}>
              <Plus size={16} />
              {own ? 'Report an issue' : 'Create task'}
            </Button>
          </>
        }
      />
      <Card>
        <Tabs
          value={tab}
          onChange={(value) => { setTab(value); setSearch(''); setTaskParams({}); }}
          tabs={taskTabs.map((x) => ({ value: x, label: x }))}
        />
        {tab !== 'Lost & found' && (
          <div className="table-toolbar">
            <label className="search-input">
              <ClipboardCheck size={17} />
              <input
                aria-label="Search tasks"
                placeholder="Search tasks or room…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select aria-label="Task status filter" value={statusFilter} onChange={e => setTaskParams(e.target.value === 'All' ? {} : { status: e.target.value })}><option value="All">All statuses</option>{['Pending', 'In progress', 'Inspection', 'Completed'].map(value => <option key={value}>{value}</option>)}</select>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTaskParams({}); setTab('All tasks'); }}>Reset filters</Button>
            <span className="muted">
              {tasks.filter((t) => t.status === 'Completed').length} of {tasks.length} completed
            </span>
          </div>
        )}
      </Card>
      {tab === 'Lost & found' ? (
        <Card className="mt-6">
          <CardHead
            title="Found with care"
            subtitle="Keep personal belongings safe until they find their way home"
            action={
              <Button onClick={() => setFound(true)}>
                <Plus size={16} />
                Log an item
              </Button>
            }
          />
          <DataTable
            rows={s.found}
            searchBy={(f) => f.title}
            columns={[
              { key: 'item', label: 'Item', render: (f) => <strong>{f.title}</strong> },
              {
                key: 'room',
                label: 'Found in',
                render: (f) => `Room ${findRoom(s, f.roomId)?.number}`,
              },
              { key: 'date', label: 'Date', render: (f) => shortDate(f.date) },
              { key: 'status', label: 'Status', render: (f) => <Badge>{f.status}</Badge> },
              {
                key: 'action',
                label: '',
                render: (f) =>
                  f.status !== 'Returned to guest' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        act(
                          { type: 'found.return', payload: { id: f.id } },
                          'Item returned to guest',
                        )
                      }
                    >
                      Mark returned
                    </Button>
                  ),
              },
            ]}
          />
        </Card>
      ) : (
        <div className="task-board">
          {['Pending', 'In progress', 'Inspection', 'Completed'].map((status) => (
            <div className="task-column" key={status}>
              <h3>
                <span className={`status-dot status-${status.toLowerCase().replace(' ', '-')}`} />
                {status}
                <small>{shown.filter((t) => t.status === status).length}</small>
              </h3>
              {shown
                .filter((t) => t.status === status)
                .map((t) => (
                  <Card className="task-card" key={t.id}>
                    <div className="flex-between">
                      <span className="task-room">
                        Room {findRoom(s, t.roomId)?.number}
                      </span>
                      <Badge>{t.priority}</Badge>
                    </div>
                    <button className="task-title" onClick={() => setEdit(t)}>
                      {t.title}
                    </button>
                    <p>
                      {t.kind} · {t.role}
                    </p>
                    {t.notes && <p className="task-note">{t.notes}</p>}
                    <div className="task-deadline">
                      <Clock3 size={13} />
                      {shortDate(t.deadline.slice(0, 10))}, {t.deadline.slice(11, 16)}
                    </div>
                    <div className="task-card-bottom">
                      <span><Avatar
                        name={s.accounts.find((a) => a.id === t.assignee)?.name ?? 'Unassigned'}
                        size="small"
                      />{s.accounts.find(a => a.id === t.assignee)?.name.split(' ')[0] ?? 'Unassigned'}</span>
                      <button onClick={() => setEdit(t)}>
                        Details
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                    {t.status !== 'Completed' && (t.status !== 'Inspection' || !own) && (
                      <Button
                        variant={t.status === 'Inspection' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full mt-3"
                        onClick={() =>
                          act(
                            { type: 'task.update', payload: { id: t.id, status: next(t) } },
                            t.status === 'Inspection'
                              ? 'Inspection approved. Room readiness updated.'
                              : 'Task status updated',
                          )
                        }
                      >
                        {t.status === 'Pending'
                          ? 'Start work'
                          : t.status === 'Inspection'
                            ? 'Approve inspection'
                            : next(t) === 'Inspection'
                              ? 'Request inspection'
                              : 'Complete task'}
                        <ArrowRight size={13} />
                      </Button>
                    )}
                    {t.status === 'Inspection' && own && (
                      <div className="info-box small">Awaiting management inspection</div>
                    )}
                  </Card>
                ))}
              {!shown.some((t) => t.status === status) && (
                <div className="board-empty">{status === 'Pending' ? 'No pending assignments' : status === 'In progress' ? 'No work in progress' : status === 'Inspection' ? 'No inspections waiting' : 'Completed work will appear here'}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {newTask && <TaskForm onClose={() => { setNewTask(false); const next = new URLSearchParams(taskParams); next.delete('new'); setTaskParams(next); }} />}
      {edit && (
        <FormModal
          title="Task details"
          initial={edit}
          fields={[
            ...(!own
              ? [
                  {
                    name: 'assignee',
                    label: 'Assigned team member',
                    type: 'select',
                    required: true,
                    options: s.accounts
                      .filter((a) => a.role === edit.role && a.active)
                      .map((a) => ({ value: a.id, label: a.name })),
                  },
                ]
              : []),
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              required: true,
              options: ['Low', 'Medium', 'High'].map((x) => ({ value: x, label: x })),
            },
            { name: 'deadline', label: 'Deadline', type: 'datetime-local', required: true },
            { name: 'notes', label: 'Progress notes', type: 'textarea', wide: true },
          ]}
          onClose={() => setEdit(null)}
          onSubmit={(v) =>
            act(
              {
                type: 'task.update',
                payload: {
                  id: edit.id,
                  notes: v.notes,
                  priority: v.priority,
                  deadline: v.deadline,
                  ...(!own ? { assignee: v.assignee } : {}),
                },
              },
              'Task details saved',
            )
          }
        />
      )}
      {found && (
        <FormModal
          title="Log a found item"
          fields={[
            { name: 'title', label: 'Item description', required: true, wide: true },
            {
              name: 'roomId',
              label: 'Room',
              type: 'select',
              required: true,
              options: s.rooms.map((r) => ({ value: r.id, label: r.number })),
            },
          ]}
          onClose={() => setFound(false)}
          onSubmit={(v) => act({ type: 'found.create', payload: v }, 'Item logged with reception')}
        />
      )}
      {damage && (
        <FormModal
          title="Report damage"
          description="Log damage for the maintenance team. Transfer any current guest before taking a room out of service."
          fields={[
            { name: 'title', label: 'Damage description', required: true, wide: true },
            {
              name: 'roomId',
              label: 'Room',
              type: 'select',
              required: true,
              options: s.rooms.map((r) => ({ value: r.id, label: r.number })),
            },
            { name: 'notes', label: 'Details', type: 'textarea', wide: true },
          ]}
          onClose={() => setDamage(false)}
          onSubmit={(v) =>
            act(
              {
                type: 'task.create',
                payload: {
                  ...v,
                  kind: 'General',
                  role: 'Maintenance',
                  priority: 'High',
                  deadline: today() + 'T18:00',
                },
              },
              'Damage report created',
            )
          }
        />
      )}
    </PageMotion>
  );
}
export function TaskForm({ onClose, roomId }: { onClose: () => void; roomId?: string }) {
  const { s, actor, act } = useStore();
  return (
    <FormModal
      title={actor!.module === 'Staff' ? 'Report an issue' : 'Create an operational task'}
      description="Tasks are routed to the matching department. Maintenance takes an unoccupied room out of service."
      initial={{
        roomId: roomId ?? '',
        kind: 'Maintenance',
        priority: 'Medium',
        deadline: today() + 'T17:00',
      }}
      fields={[
        { name: 'title', label: 'Task title', required: true, wide: true },
        {
          name: 'kind',
          label: 'Department / category',
          type: 'select',
          required: true,
          options: (actor!.module === 'Staff'
            ? ['Maintenance', 'Property']
            : ['Cleaning', 'Maintenance', 'Property', 'General']
          ).map((x) => ({ value: x, label: x })),
        },
        {
          name: 'roomId',
          label: 'Room / property location',
          type: 'select',
          required: true,
          options: s.rooms.map((r) => ({
            value: r.id,
            label: `${r.number} · ${r.type} (${r.status})`,
          })),
        },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High'].map((x) => ({ value: x, label: x })),
        },
        { name: 'deadline', label: 'Deadline', type: 'datetime-local', required: true },
        { name: 'notes', label: 'Instructions', type: 'textarea', wide: true },
      ]}
      onClose={onClose}
      onSubmit={(v) =>
        act({ type: 'task.create', payload: v }, 'Task created and routed to the team')
      }
    />
  );
}
export function Services() {
  const { s, actor, act } = useStore();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('All'),
    [selected, setSelected] = useState<Service | null>(null);
  const guest = actor!.module === 'Guest',
    staff = actor!.module === 'Staff';
  const myReservations = s.reservations.filter((r) => r.guestId === actor!.guestId);
  const services = s.services.filter(
    (x) =>
      (!guest || myReservations.some((r) => r.id === x.reservationId)) &&
      (!staff || x.assignee === actor!.id) &&
      (tab === 'All' || x.status === tab),
  );
  return (
    <PageMotion>
      <PageTitle
        eyebrow={
          guest ? 'A LITTLE MORE TO LOOK FORWARD TO' : 'THOUGHTFUL SERVICE, SEAMLESSLY DELIVERED'
        }
        title={guest ? 'Services & experiences' : 'Guest services'}
        description={
          guest
            ? 'Good food, fresh adventures, and a moment just for you.'
            : 'Every request is an opportunity to make someone’s stay.'
        }
        actions={
          !staff ? (
            <Button onClick={() => setParams({ new: '1' })}>
              <Plus size={16} />
              {guest ? 'Request a service' : 'Add service request'}
            </Button>
          ) : undefined
        }
      />
      {guest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {serviceMenu.map((item, idx) => {
            const Icon = icons[item.category];
            // Assigning some luxury placeholders based on category
            const imageMap: Record<string, string> = {
              Spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
              'Food & Beverage': 'https://images.unsplash.com/photo-1414235077428-33898dea23ea?auto=format&fit=crop&w=600&q=80',
              Activities: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80',
            };
            const defaultImage = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80';
            
            return (
              <Card key={item.name} className="service-catalog-card overflow-hidden group">
                <div className="relative h-48 overflow-hidden bg-[#FAF7F2]">
                  <img
                    src={imageMap[item.category] || defaultImage}
                    alt={item.name}
                    loading="lazy"
                    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/resort.jpg'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-4 left-4 bg-[#1F3A2E]/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                    {item.category}
                  </span>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 text-[#1F3A2E] flex items-center justify-center backdrop-blur-md shadow-sm">
                    <Icon size={16} />
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-serif font-bold text-lg text-[#22261F] group-hover:text-[#C9A227] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#6B7160] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#F0EBE1] mt-2">
                    <div>
                      <span className="text-[10px] text-[#6B7160] block uppercase font-semibold tracking-wider">Per Request</span>
                      <strong className="text-base text-[#1F3A2E] font-serif">{money(item.amount)}</strong>
                    </div>
                    <Button
                      size="sm"
                      aria-label={`Request ${item.name}`}
                      className="bg-[#1F3A2E] text-white hover:bg-[#1F3A2E]/90 group-hover:bg-[#C9A227] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setParams({ new: '1', service: item.name });
                      }}
                    >
                      Request <ArrowUpRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Card>
        <CardHead
          title={guest ? 'Your service requests' : 'Request queue'}
          subtitle={
            guest
              ? 'A little something to make your stay special'
              : 'Requests stay connected to staff assignments and guest folios'
          }
        />
        <Tabs
          tabs={['All', 'Requested', 'Accepted', 'In progress', 'Completed', 'Cancelled'].map(
            (x) => ({ value: x, label: x }),
          )}
          value={tab}
          onChange={setTab}
        />
        <DataTable
          rows={services}
          searchBy={(x) => `${x.name} ${x.reservationId} ${x.category}`}
          columns={[
            {
              key: 'service',
              label: 'Service',
              sort: (x) => x.name,
              render: (x) => (
                <>
                  <strong>{x.name}</strong>
                  <small>
                    {x.category} · {x.id}
                  </small>
                </>
              ),
            },
            {
              key: 'guest',
              label: 'Guest / room',
              render: (x) => {
                const r = s.reservations.find((r) => r.id === x.reservationId)!;
                return (
                  <>
                    {s.guests.find((g) => g.id === r.guestId)?.name}
                    <small>Room {findRoom(s, r.roomId)?.number}</small>
                  </>
                );
              },
            },
            {
              key: 'time',
              label: 'Scheduled',
              sort: (x) => x.date + x.time,
              render: (x) => (
                <>
                  {shortDate(x.date)}
                  <small>{x.time}</small>
                </>
              ),
            },
            {
              key: 'amount',
              label: 'Charge',
              sort: (x) => x.amount,
              render: (x) => money(x.amount),
            },
            { key: 'status', label: 'Status', render: (x) => <Badge>{x.status}</Badge> },
            {
              key: 'action',
              label: '',
              render: (x) => (
                <Button variant="outline" size="sm" onClick={() => setSelected(x)}>
                  {guest ? 'Details' : 'Manage'}
                  <ArrowUpRight size={13} />
                </Button>
              ),
            },
          ]}
        />
      </Card>
      {params.has('new') && !staff && (
        <ServiceWizard initial={params.get('service') ?? ''} onClose={() => setParams({})} />
      )}
      {selected && (
        <ServiceDetail
          service={s.services.find((x) => x.id === selected.id)!}
          onClose={() => setSelected(null)}
        />
      )}
    </PageMotion>
  );
}
function ServiceDetail({ service: x, onClose }: { service: Service; onClose: () => void }) {
  const { s, actor, act } = useStore();
  const [assignee, setAssignee] = useState(x.assignee);
  const guest = actor!.module === 'Guest';
  const role = serviceMenu.find((m) => m.name === x.name)!.role;
  const next =
    x.status === 'Requested' ? 'Accepted' : x.status === 'Accepted' ? 'In progress' : 'Completed';
  return (
    <Modal
      open
      onClose={onClose}
      title={x.name}
      description={`${shortDate(x.date)} at ${x.time} · ${x.reservationId}`}
    >
      <div className="dialog-body">
        <div className="flex-between">
          <Badge>{x.status}</Badge>
          <strong>{money(x.amount)}</strong>
        </div>
        <p className="service-detail-notes">{x.options || 'No additional instructions.'}</p>
        <p className="muted">
          Assigned to{' '}
          {s.accounts.find((a) => a.id === x.assignee)?.name ?? 'the next available team member'}.
        </p>
        {!guest && actor!.module !== 'Staff' && (
          <div className="inline-form">
            <label className="field">
              <span>Route to {role} team</span>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {s.accounts
                  .filter((a) => a.role === role && a.active)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              variant="outline"
              onClick={() =>
                act({ type: 'service.update', payload: { id: x.id, assignee } }, 'Service assigned')
              }
            >
              Assign
            </Button>
          </div>
        )}
        <div className="info-box">
          {x.status === 'Completed'
            ? 'The service charge is included once in the guest folio.'
            : 'The service charge will be added to the folio when completed.'}
        </div>
      </div>
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {!guest && !['Completed', 'Cancelled'].includes(x.status) && (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  act(
                    { type: 'service.update', payload: { id: x.id, status: 'Cancelled' } },
                    'Service cancelled',
                  )
                )
                  onClose();
              }}
            >
              Cancel service
            </Button>
            <Button
              onClick={() =>
                act(
                  { type: 'service.update', payload: { id: x.id, status: next } },
                  next === 'Completed'
                    ? 'Service completed. Charge added to guest folio.'
                    : 'Service status updated',
                )
              }
            >
              {next === 'Accepted'
                ? 'Accept request'
                : next === 'In progress'
                  ? 'Start service'
                  : 'Complete & add charge'}
              <Check size={15} />
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
export function ServiceWizard({
  onClose,
  initial = '',
}: {
  onClose: () => void;
  initial?: string;
}) {
  const { s, actor, act } = useStore();
  const stays = s.reservations.filter(
    (r) => live(r) && (actor!.module !== 'Guest' || r.guestId === actor!.guestId),
  );
  const first = stays[0];
  const [step, setStep] = useState(0),
    [v, setV] = useState<Record<string, any>>({
      name: initial,
      reservationId: first?.id ?? '',
      date: first && first.checkIn > today() ? first.checkIn : today(),
      time: '15:00',
      options: '',
    });
  const item = serviceMenu.find((x) => x.name === v.name),
    r = stays.find((r) => r.id === v.reservationId);
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Make your stay a little more you"
      description="Choose an experience. We’ll take care of the little details."
    >
      <div className="wizard-steps">
        {['Select service', 'Options & time', 'Review', 'Submitted'].map((name, i) => (
          <div key={name} className={i === step ? 'current' : i < step ? 'done' : ''}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            <small>{name}</small>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0 && !item) return;
          if (step === 2) {
            if (act({ type: 'service.create', payload: v }, 'Your request is with our team'))
              setStep(3);
          } else setStep(step + 1);
        }}
      >
        <div className="dialog-body">
          {step === 0 && (
            <div className="wizard-services">
              {serviceMenu.map((m) => {
                const Icon = icons[m.category];
                return (
                  <button
                    type="button"
                    key={m.name}
                    className={v.name === m.name ? 'selected' : ''}
                    onClick={() => setV({ ...v, name: m.name })}
                  >
                    <Icon size={25} />
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.description}</small>
                    </span>
                    <b>{money(m.amount)}</b>
                    {v.name === m.name && <Check size={17} />}
                  </button>
                );
              })}
            </div>
          )}
          {step === 1 && (
            <>
              {!stays.length ? (
                <Empty
                  title="A confirmed stay is needed"
                  description="Contact reception to arrange a stay before requesting services."
                />
              ) : (
                <Fields
                  fields={[
                    {
                      name: 'reservationId',
                      label: 'Your stay',
                      type: 'select',
                      required: true,
                      wide: true,
                      options: stays.map((r) => ({
                        value: r.id,
                        label: `${s.guests.find((g) => g.id === r.guestId)?.name} · ${r.id} · Room ${findRoom(s, r.roomId)?.number}`,
                      })),
                    },
                    {
                      name: 'date',
                      label: 'Preferred date',
                      type: 'date',
                      required: true,
                      min: r && r.checkIn > today() ? r.checkIn : today(),
                      max: r?.checkOut,
                    },
                    { name: 'time', label: 'Preferred time', type: 'time', required: true },
                    {
                      name: 'options',
                      label: 'Preferences & special requests',
                      type: 'textarea',
                      wide: true,
                      placeholder: 'Dietary needs, treatment preferences, number of items…',
                    },
                  ]}
                  values={v}
                  onChange={(k, value) => setV({ ...v, [k]: value })}
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="review-banner">
                <Leaf size={28} />
                <div>
                  <h3>{item?.name}</h3>
                  <p>{item?.description}</p>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>When</dt>
                  <dd>
                    {shortDate(v.date)} at {v.time}
                  </dd>
                </div>
                <div>
                  <dt>Service charge</dt>
                  <dd>{money(item?.amount ?? 0)} + stay tax</dd>
                </div>
                <div>
                  <dt>Reservation</dt>
                  <dd>{v.reservationId}</dd>
                </div>
                <div>
                  <dt>Preferences</dt>
                  <dd>{v.options || 'No special requests'}</dd>
                </div>
              </dl>
              <div className="info-box">
                Your request will be routed to our {item?.role} team. Charges are added only when
                the service is complete.
              </div>
            </>
          )}
          {step === 3 && (
            <div className="credentials-success">
              <span className="success-icon">
                <Check size={30} />
              </span>
              <h2>A little delight is on its way.</h2>
              <p>
                Your request has been sent to the team. You can follow its progress in your service
                requests.
              </p>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          {step < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => (step ? setStep(step - 1) : onClose())}
            >
              {step ? 'Back' : 'Cancel'}
            </Button>
          )}
          {step === 3 ? (
            <Button type="button" onClick={onClose}>
              Lovely, thank you
              <Check size={15} />
            </Button>
          ) : (
            <Button type="submit" disabled={(step === 0 && !item) || (step === 1 && !stays.length)}>
              {step === 2 ? 'Submit request' : 'Continue'}
              <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

