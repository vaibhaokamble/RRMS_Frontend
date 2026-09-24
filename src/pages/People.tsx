import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowUpRight,
  Upload,
  Download,
  Plus,
  MessageSquare,
  Star,
  Gift,
  Leaf,
  ShieldCheck,
  CalendarDays,
  Pencil,
  Check,
  Crown,
  BriefcaseBusiness,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { money, shortDate, today, roles, can } from '../lib/domain';
import type { Guest, Account, Complaint } from '../lib/domain';
import {
  PageTitle,
  Card,
  CardHead,
  Button,
  Badge,
  Avatar,
  DataTable,
  Modal,
  FormModal,
  Fields,
  Tabs,
  PageMotion,
  Empty,
} from '../components/ui';
import { downloadCsv } from '../lib/utils';
export function Guests() {
  const { s } = useStore();
  const [selected, setSelected] = useState<Guest | null>(null);
  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE PEOPLE BEHIND EVERY STAY"
        title="Guest directory"
        description="Preferences remembered. Details taken care of. A warmer welcome, every time."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                'guest-directory.csv',
                s.guests.map((g) => ({ ...g })),
              )
            }
          >
            <Download size={16} />
            Export guests
          </Button>
        }
      />
      <Card>
        <DataTable
          rows={s.guests}
          searchBy={(g) => `${g.name} ${g.email} ${g.phone}`}
          placeholder="Search guests by name, email or phone…"
          columns={[
            {
              key: 'name',
              label: 'Guest',
              sort: (g) => g.name,
              render: (g) => (
                <div className="person-cell">
                  <Avatar name={g.name} />
                  <div>
                    <strong>{g.name}</strong>
                    <small>{g.email}</small>
                  </div>
                </div>
              ),
            },
            {
              key: 'phone',
              label: 'Contact',
              render: (g) => (
                <>
                  {g.phone}
                  <small>{g.address}</small>
                </>
              ),
            },
            {
              key: 'stay',
              label: 'Stays',
              sort: (g) => s.reservations.filter((r) => r.guestId === g.id).length,
              render: (g) => s.reservations.filter((r) => r.guestId === g.id).length,
            },
            {
              key: 'tier',
              label: 'Membership',
              render: (g) => (
                <Badge>
                  {g.points >= 2000 ? 'Platinum' : g.points >= 1000 ? 'Gold' : 'Silver'}
                </Badge>
              ),
            },
            {
              key: 'id',
              label: 'Documents',
              render: (g) => <Badge>{g.document ? 'Verified demo' : 'Not provided'}</Badge>,
            },
            {
              key: 'action',
              label: '',
              render: (g) => (
                <Button variant="outline" size="sm" onClick={() => setSelected(g)}>
                  View profile
                  <ArrowUpRight size={14} />
                </Button>
              ),
            },
          ]}
        />
      </Card>
      {selected && (
        <Modal
          open
          wide
          onClose={() => setSelected(null)}
          title={selected.name}
          description="Guest profile, preferences, documents and stay history."
        >
          <div className="dialog-body">
            <ProfileEditor guest={s.guests.find((g) => g.id === selected.id)!} />
            <h3 className="section-title">Stay history</h3>
            <div className="simple-list">
              {s.reservations
                .filter((r) => r.guestId === selected.id)
                .map((r) => (
                  <div key={r.id}>
                    <span>
                      <strong>
                        {r.id} · Room {s.rooms.find((x) => x.id === r.roomId)?.number}
                      </strong>
                      <small>
                        {shortDate(r.checkIn)} – {shortDate(r.checkOut)}
                      </small>
                    </span>
                    <Badge>{r.status}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}
    </PageMotion>
  );
}
export function Profile() {
  const { s, actor, act } = useStore();
  const isGuest = actor!.module === 'Guest';
  const g = isGuest ? s.guests.find((g) => g.id === actor!.guestId) : null;
  
  if (isGuest && !g) return <Empty title="Profile unavailable" />;

  return (
    <PageMotion>
      <PageTitle
        eyebrow={isGuest ? 'A STAY THAT FEELS LIKE YOU' : 'YOUR ACCOUNT DETAILS'}
        title="My profile"
        description={isGuest ? 'Help us remember the little things that make you feel at home.' : 'Manage your staff profile and login credentials.'}
      />
      <Card className="profile-card">
        <CardHead
          title="Your personal details"
          subtitle={isGuest ? 'Prefilled by reception, always yours to update' : 'Your staff record'}
        />
        <div className="card-padding">
          {isGuest ? (
            <ProfileEditor guest={g!} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                if (name && email) {
                  act({ type: 'account.update', payload: { id: actor!.id, name, email } }, 'Profile updated');
                }
              }}
            >
              <div className="profile-header">
                <Avatar name={actor!.name} size="large" />
                <div>
                  <h2>{actor!.name}</h2>
                  <p>{actor!.role} · {actor!.module}</p>
                </div>
              </div>
              <Fields
                fields={[
                  { name: 'name', label: 'Full name', required: true, type: 'text' },
                  { name: 'email', label: 'Email address (Login ID)', required: true, type: 'email' },
                ]}
                values={{ name: actor!.name, email: actor!.email }}
                onChange={() => {}}
              />
              <Button type="submit">Save changes</Button>
            </form>
          )}
        </div>
      </Card>
    </PageMotion>
  );
}
function ProfileEditor({ guest }: { guest: Guest }) {
  const { act } = useStore();
  const [v, setV] = useState<Record<string, any>>({ ...guest });
  const change = (k: string, value: any) => setV({ ...v, [k]: value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act({ type: 'guest.update', payload: { ...v, id: guest.id } }, 'Guest profile updated');
      }}
    >
      <div className="profile-header">
        <Avatar name={v.name} size="large" />
        <div>
          <h2>{v.name}</h2>
          <p>{guest.id} · Palm member</p>
        </div>
      </div>
      <Fields
        fields={[
          { name: 'name', label: 'Full name', required: true },
          { name: 'email', label: 'Email address', type: 'email', required: true },
          { name: 'phone', label: 'Phone number', type: 'tel', required: true },
          { name: 'address', label: 'Address' },
          {
            name: 'preferences',
            label: 'Stay preferences',
            type: 'textarea',
            wide: true,
            hint: 'Dietary needs, room preferences, or anything that helps us care for you.',
          },
        ]}
        values={v}
        onChange={change}
      />
      <div className="document-upload">
        <ShieldCheck size={23} />
        <div>
          <strong>Identity document</strong>
          <p>{v.document || 'No document recorded'}</p>
          <small>Demo upload stores the filename only. No document contents are uploaded.</small>
        </div>
        <label className="btn btn-outline btn-sm">
          <Upload size={15} />
          Choose file
          <input
            aria-label="Upload identity document"
            className="sr-only"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error('Choose a file smaller than 5 MB.');
                return;
              }
              if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
                toast.error('Choose a PDF, JPG or PNG file.');
                return;
              }
              change('document', `${file.name} · Simulated upload`);
              toast.success('Demo document attached. Save to update your profile.');
            }}
          />
        </label>
      </div>
      <Button type="submit">
        Save profile
        <Check size={16} />
      </Button>
    </form>
  );
}
export function Support() {
  const { s, actor, act } = useStore();
  const [tab, setTab] = useState('All'),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Complaint | null>(null);
  const guest = actor!.module === 'Guest',
    staff = actor!.module === 'Staff';
  const list = s.complaints.filter(
    (c) =>
      (!guest || c.guestId === actor!.guestId) &&
      (!staff || c.assignee === actor!.id) &&
      (tab === 'All' || c.status === tab),
  );
  return (
    <PageMotion>
      <PageTitle
        eyebrow={guest ? 'A LITTLE HELP, WHENEVER YOU NEED IT' : 'CARE THAT GOES THE EXTRA MILE'}
        title={guest ? 'Help & requests' : 'Requests & feedback'}
        description={
          guest
            ? 'Let us take care of it. Your resort team is here to help.'
            : 'Listen, respond, and turn every request into a better stay.'
        }
        actions={
          !staff ? (
            <Button onClick={() => setCreate(true)}>
              <Plus size={16} />
              {guest ? 'How can we help?' : 'New guest request'}
            </Button>
          ) : undefined
        }
      />
      {guest && (
        <div className="support-banner">
          <MessageSquare size={35} />
          <div>
            <h2>Your comfort is our favorite detail.</h2>
            <p>For requests, feedback, or a little local advice, your concierge is right here.</p>
          </div>
          <span>
            {s.policies.phone}
            <small>Reception · available around the clock</small>
          </span>
        </div>
      )}
      <Card>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={['All', 'Open', 'Assigned', 'In progress', 'Resolved', 'Closed'].map((x) => ({ value: x, label: x }))}
        />
        <DataTable
          rows={list}
          searchBy={(c) => `${c.subject} ${c.description} ${c.category}`}
          placeholder="Search guest requests…"
          columns={[
            {
              key: 'subject',
              label: 'Request',
              sort: (c) => c.subject,
              render: (c) => (
                <>
                  <strong>{c.subject}</strong>
                  <small>
                    {c.id} · {c.category}
                  </small>
                </>
              ),
            },
            ...(!guest
              ? [
                  {
                    key: 'guest',
                    label: 'Guest',
                    render: (c: Complaint) => s.guests.find((g) => g.id === c.guestId)?.name,
                  },
                ]
              : []),
            {
              key: 'date',
              label: 'Created',
              sort: (c) => c.date,
              render: (c) => shortDate(c.date),
            },
            { key: 'status', label: 'Status', render: (c) => <Badge>{c.status}</Badge> },
            {
              key: 'action',
              label: '',
              render: (c) => (
                <Button variant="outline" size="sm" onClick={() => setSelected(c)}>
                  View request
                  <ArrowUpRight size={14} />
                </Button>
              ),
            },
          ]}
        />
      </Card>
      {!guest && (
        <Card className="mt-6">
          <CardHead title="Words from our guests" subtitle="The moments that made an impression" />
          <div className="review-grid">
            {s.reviews.map((r) => (
              <article key={r.id}>
                <div className="stars">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                <p>“{r.text}”</p>
                <div className="person-cell">
                  <Avatar name={s.guests.find((g) => g.id === r.guestId)!.name} />
                  <span>
                    {s.guests.find((g) => g.id === r.guestId)?.name}
                    <small>{shortDate(r.date)}</small>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}
      {create && (
        <FormModal
          title="Tell us how we can help"
          description="Your request goes directly to our resort team. We'll keep you updated here."
          initial={{ category: 'Request' }}
          fields={[
            ...(!guest
              ? [
                  {
                    name: 'guestId',
                    label: 'Guest',
                    type: 'select',
                    required: true,
                    options: s.guests.map((g) => ({ value: g.id, label: g.name })),
                    wide: true,
                  },
                ]
              : []),
            { name: 'subject', label: 'Subject', required: true },
            {
              name: 'category',
              label: 'Category',
              type: 'select',
              required: true,
              options: ['Request', 'Complaint', 'Maintenance', 'Food & Beverage', 'Other'].map(
                (x) => ({ value: x, label: x }),
              ),
            },
            {
              name: 'description',
              label: 'A few more details',
              type: 'textarea',
              required: true,
              wide: true,
            },
          ]}
          submit="Send request"
          onClose={() => setCreate(false)}
          onSubmit={(v) =>
            act({ type: 'complaint.create', payload: v }, 'Your request has reached our team')
          }
        />
      )}
      {selected && <SupportDetail id={selected.id} onClose={() => setSelected(null)} />}
    </PageMotion>
  );
}
function SupportDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, actor, act } = useStore();
  const c = s.complaints.find((c) => c.id === id)!;
  const [response, setResponse] = useState(c.response),
    [assignee, setAssignee] = useState(c.assignee);
  return (
    <Modal
      open
      onClose={onClose}
      title={c.subject}
      description={`${c.category} · ${shortDate(c.date)} · ${c.id}`}
    >
      <div className="dialog-body">
        <Badge>{c.status}</Badge>
        <p className="support-description">{c.description}</p>
        {c.response && (
          <div className="support-response">
            <span className="eyebrow">FROM YOUR RESORT TEAM</span>
            <p>{c.response}</p>
          </div>
        )}
        {actor!.module !== 'Guest' && (
          <>
            {actor!.module !== 'Staff' && c.status !== 'Resolved' && (
              <div className="inline-form">
                <label className="field">
                  <span>Assign to team member</span>
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                    <option value="">Select team member</option>
                    {s.accounts
                      .filter((a) => a.module === 'Staff' && a.active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {a.role}
                        </option>
                      ))}
                  </select>
                </label>
                <Button
                  variant="outline"
                  onClick={() =>
                    act({ type: 'complaint.update', payload: { id, assignee } }, 'Request assigned')
                  }
                >
                  Assign
                </Button>
              </div>
            )}
            {c.status !== 'Resolved' && c.status !== 'Closed' && (
              <label className="field">
                <span>Response to guest</span>
                <textarea
                  rows={4}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Let the guest know how we're taking care of this…"
                />
              </label>
            )}
          </>
        )}
      </div>
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {actor!.module !== 'Guest' && c.status !== 'Closed' && (
          <>
            {c.status !== 'Resolved' && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    act(
                      { type: 'complaint.update', payload: { id, status: 'In progress', response } },
                      'Guest updated',
                    )
                  }
                >
                  Update progress
                </Button>
                <Button
                  onClick={() => {
                    if (
                      act(
                        { type: 'complaint.update', payload: { id, status: 'Resolved', response } },
                        'Request resolved and guest notified',
                      )
                    )
                      onClose();
                  }}
                >
                  Resolve request
                  <Check size={15} />
                </Button>
              </>
            )}
            {c.status === 'Resolved' && (
              <Button
                onClick={() => {
                  if (
                    act(
                      { type: 'complaint.update', payload: { id, status: 'Closed' } },
                      'Request closed',
                    )
                  )
                    onClose();
                }}
              >
                Close Request
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
export function Team() {
  const { s, actor, act } = useStore();
  const [role, setRole] = useState('All'),
    [selected, setSelected] = useState<Account | null>(null);
  const staff = s.accounts.filter(
    (a) => a.module === 'Staff' && (role === 'All' || a.role === role),
  );
  
  if (actor?.module === 'Staff') {
    const tasksCompleted = s.tasks.filter((t) => t.assignee === actor.id && t.status === 'Completed').length;
    const tasksTotal = s.tasks.filter((t) => t.assignee === actor.id).length;
    return (
      <PageMotion>
        <PageTitle
          eyebrow="YOUR SCHEDULE"
          title="My Shift"
          description={`You are currently assigned to the ${actor.shift || 'standard'} shift.`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Card className="p-6">
            <h3 className="font-serif text-lg mb-2">Shift Details</h3>
            <div className="text-sm text-[#6B7160] mb-4">
              Your active working hours and department assignment.
            </div>
            <div className="flex items-center gap-4 py-3 border-t border-[#F0EBE1]">
              <CalendarDays size={20} className="text-[#506845]" />
              <div>
                <strong className="block text-[#22261F]">Schedule</strong>
                <span className="text-xs">{actor.shift || '09:00 - 17:00'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-t border-[#F0EBE1]">
              <BriefcaseBusiness size={20} className="text-[#506845]" />
              <div>
                <strong className="block text-[#22261F]">Department</strong>
                <span className="text-xs">{actor.role}</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-serif text-lg mb-2">Shift Performance</h3>
            <div className="text-sm text-[#6B7160] mb-4">
              Your task completion statistics for this shift.
            </div>
            <div className="flex items-center gap-4 py-3 border-t border-[#F0EBE1]">
              <Check size={20} className="text-[#2E7D4F]" />
              <div>
                <strong className="block text-[#22261F]">Tasks Completed</strong>
                <span className="text-xs">{tasksCompleted} of {tasksTotal} assigned</span>
              </div>
            </div>
          </Card>
        </div>
        
        <Card>
          <CardHead title="Your Assigned Tasks" subtitle="Active tasks for your current shift" />
          <DataTable
            rows={s.tasks.filter((t) => t.assignee === actor.id && t.status !== 'Completed')}
            searchBy={(t) => t.title + (t.notes || '')}
            columns={[
              { key: 'title', label: 'Task', render: (t) => <strong>{t.title}</strong> },
              { key: 'status', label: 'Status', render: (t) => <Badge>{t.status}</Badge> },
              {
                key: 'action',
                label: '',
                render: (t) => (
                  <Button size="sm" variant="outline" onClick={() => act({ type: 'task.update', payload: { id: t.id, status: 'Completed' } }, 'Task completed')}>
                    <Check size={14} />
                    Mark Complete
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE HEART OF GREAT HOSPITALITY"
        title="Team & shifts"
        description="The people who turn a beautiful resort into an unforgettable stay."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                'team-performance.csv',
                staff.map((a) => ({
                  name: a.name,
                  role: a.role,
                  shift: a.shift,
                  active: a.active,
                  assigned: s.tasks.filter((t) => t.assignee === a.id).length,
                  completed: s.tasks.filter((t) => t.assignee === a.id && t.status === 'Completed')
                    .length,
                })),
              )
            }
          >
            <Download size={16} />
            Export performance
          </Button>
        }
      />
      <Card>
        <DataTable
          rows={staff}
          searchBy={(a) => `${a.name} ${a.role}`}
          placeholder="Search team members…"
          filters={
            <select
              aria-label="Filter team by role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>All</option>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          }
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
            { key: 'role', label: 'Department', render: (a) => <Badge>{a.role}</Badge> },
            {
              key: 'shift',
              label: 'Assigned shift',
              render: (a) => (
                <>
                  <CalendarDays size={14} className="inline-icon" />
                  {a.shift}
                </>
              ),
            },
            {
              key: 'performance',
              label: 'Tasks completed',
              sort: (a) =>
                s.tasks.filter((t) => t.assignee === a.id && t.status === 'Completed').length,
              render: (a) =>
                `${s.tasks.filter((t) => t.assignee === a.id && t.status === 'Completed').length} / ${s.tasks.filter((t) => t.assignee === a.id).length}`,
            },
            {
              key: 'status',
              label: 'Status',
              render: (a) => <Badge>{a.active ? 'Active' : 'Inactive'}</Badge>,
            },
            {
              key: 'action',
              label: '',
              render: (a) => (
                <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                  <Pencil size={14} />
                  Edit shift
                </Button>
              ),
            },
          ]}
        />
      </Card>
      {selected && (
        <FormModal
          title={`Assign shift · ${selected.name}`}
          initial={selected}
          fields={[
            {
              name: 'shift',
              label: 'Shift hours',
              required: true,
              wide: true,
              hint: 'For example: 07:00 – 15:00',
            },
          ]}
          onClose={() => setSelected(null)}
          onSubmit={(v) =>
            act(
              { type: 'account.update', payload: { id: selected.id, shift: v.shift } },
              'Shift updated for the team member',
            )
          }
        />
      )}
    </PageMotion>
  );
}
export function Loyalty() {
  const { s, actor, act } = useStore();
  const [redeem, setRedeem] = useState(false);
  const g = s.guests.find((g) => g.id === actor!.guestId)!;
  const tier = g.points >= 2000 ? 'Platinum' : g.points >= 1000 ? 'Gold' : 'Silver';
  const stays = s.reservations.filter((r) => r.guestId === g.id && r.status === 'Checked in');
  return (
    <PageMotion>
      <PageTitle
        eyebrow="GOOD STAYS DESERVE A LITTLE MORE"
        title="Palm rewards"
        description="Our way of saying thank you, one memorable stay at a time."
      />
      <div className="loyalty-banner">
        <div>
          <span className="eyebrow">THE PALM COLLECTION</span>
          <h2>{tier} looks good on you.</h2>
          <p>
            Earn 1 point for every ₹100 of your completed stay.
            <br />
            Redeem 10 points for ₹1 toward an active stay.
          </p>
          <Button onClick={() => setRedeem(true)}>
            <Gift size={16} />
            Redeem your points
            <ArrowUpRight size={16} />
          </Button>
        </div>
        <div className="loyalty-card">
          <Leaf size={30} />
          <span>PALM REWARDS</span>
          <strong>{g.points.toLocaleString('en-IN')}</strong>
          <small>POINTS TO MAKE YOUR NEXT MOMENT SPECIAL</small>
          <div>
            {g.name}
            <span>{tier.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div className="membership-tiers">
        {[
          { name: 'Silver', points: '0–999 points', text: 'A warm welcome, every time' },
          { name: 'Gold', points: '1,000–1,999 points', text: 'A little more recognition' },
          {
            name: 'Platinum',
            points: '2,000+ points',
            text: 'Our most cherished returning guests',
          },
        ].map((t) => (
          <Card key={t.name} className={tier === t.name ? 'tier-selected' : ''}>
            <Crown size={26} />
            <h3>{t.name}</h3>
            <strong>{t.points}</strong>
            <p>{t.text}</p>
            {tier === t.name && <Badge>Current tier</Badge>}
          </Card>
        ))}
      </div>
      <Card>
        <CardHead title="Your rewards journey" subtitle="Every point has a story" />
        <DataTable
          rows={s.loyalty.filter((l) => l.guestId === g.id)}
          searchBy={(l) => l.description}
          columns={[
            {
              key: 'description',
              label: 'Activity',
              render: (l) => <strong>{l.description}</strong>,
            },
            { key: 'date', label: 'Date', render: (l) => shortDate(l.date), sort: (l) => l.date },
            {
              key: 'amount',
              label: 'Points',
              render: (l) => (
                <span className={l.amount > 0 ? 'positive' : 'muted'}>
                  {l.amount > 0 ? '+' : ''}
                  {l.amount}
                </span>
              ),
              sort: (l) => l.amount,
            },
          ]}
        />
      </Card>
      {redeem && (
        <FormModal
          title="A little reward, just for you"
          description={`You have ${g.points} points. Redeem at least 100 points; 10 points = ₹1.`}
          initial={{ points: 100, reservationId: stays[0]?.id ?? '' }}
          fields={[
            {
              name: 'reservationId',
              label: 'Active stay',
              type: 'select',
              required: true,
              wide: true,
              options: stays.map((r) => ({ value: r.id, label: r.id })),
            },
            {
              name: 'points',
              label: 'Points to redeem',
              type: 'number',
              min: 100,
              max: g.points,
              step: 1,
              required: true,
            },
          ]}
          submit="Redeem points"
          onClose={() => setRedeem(false)}
          onSubmit={(v) =>
            act(
              { type: 'loyalty.redeem', payload: v },
              'Rewards redeemed and applied to your folio',
            )
          }
        />
      )}
    </PageMotion>
  );
}
export function Reviews() {
  const { s, actor, act } = useStore();
  const [create, setCreate] = useState(false);
  const mine = s.reviews.filter((r) => r.guestId === actor!.guestId);
  const eligible = s.reservations.filter(
    (r) =>
      r.guestId === actor!.guestId &&
      r.status === 'Completed' &&
      !s.reviews.some((v) => v.reservationId === r.id),
  );
  return (
    <PageMotion>
      <PageTitle
        eyebrow="THE MEMORIES YOU TAKE WITH YOU"
        title="Reviews & feedback"
        description="Tell us about the moments that mattered. We’re always listening."
        actions={
          eligible.length ? (
            <Button onClick={() => setCreate(true)}>
              <Star size={16} />
              Share your experience
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardHead
          title="Your experiences at the Palm"
          subtitle="Reviews unlock after your stay is complete"
        />
        {mine.length ? (
          <div className="review-grid">
            {mine.map((r) => (
              <article key={r.id}>
                <div className="stars">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                <p>“{r.text}”</p>
                <small>
                  Resort {r.rating}/5 · Room {r.roomRating}/5 · Service {r.serviceRating}/5
                </small>
                <div className="review-meta">
                  {r.reservationId} · {shortDate(r.date)}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Every stay has a story"
            description={
              eligible.length
                ? 'Your completed stay is ready for a review. Share a little of your experience.'
                : 'Once you check out, you can rate your room, services and overall stay.'
            }
            action={
              eligible.length ? (
                <Button onClick={() => setCreate(true)}>Write your first review</Button>
              ) : undefined
            }
          />
        )}
      </Card>
      {create && (
        <FormModal
          title="How was your stay?"
          description="Your thoughtful feedback helps us make the next welcome even warmer."
          initial={{ reservationId: eligible[0]?.id, rating: 5, roomRating: 5, serviceRating: 5 }}
          fields={[
            {
              name: 'reservationId',
              label: 'Completed stay',
              type: 'select',
              required: true,
              wide: true,
              options: eligible.map((r) => ({
                value: r.id,
                label: `${r.id} · ${shortDate(r.checkIn)} – ${shortDate(r.checkOut)}`,
              })),
            },
            ...['rating', 'roomRating', 'serviceRating'].map((name, i) => ({
              name,
              label: ['Resort experience', 'Room experience', 'Service experience'][i],
              type: 'select',
              required: true,
              options: [5, 4, 3, 2, 1].map((n) => ({
                value: String(n),
                label: `${n} ${'★'.repeat(n)}`,
              })),
            })),
            {
              name: 'text',
              label: 'Your memories & feedback',
              type: 'textarea',
              required: true,
              wide: true,
            },
          ]}
          submit="Publish review"
          onClose={() => setCreate(false)}
          onSubmit={(v) =>
            act({ type: 'review.create', payload: v }, 'Thank you for sharing your experience')
          }
        />
      )}
    </PageMotion>
  );
}
export function Notifications() {
  const { s, actor, act } = useStore();
  const notices = s.notifications
    .filter((n) => ['all', actor!.id, actor!.role, actor!.module, actor!.guestId].includes(n.audience))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <PageMotion>
      <PageTitle
        eyebrow="YOUR ALERTS"
        title="Notifications"
        description="Updates and messages from around the resort."
        actions={
          <Button
            variant="outline"
            onClick={() => act({ type: 'notifications.read' }, 'All notifications marked as read')}
          >
            <Check size={16} />
            Mark all as read
          </Button>
        }
      />
      <Card>
        <div className="p-6 space-y-4">
          {notices.length ? (
            notices.map((n) => (
              <div key={n.id} className="flex gap-4 p-4 border rounded-md border-[#F0EBE1]">
                <div className="mt-1 text-[#506845]"><MessageSquare size={18} /></div>
                <div>
                  <h4 className="font-semibold text-[#22261F]">{n.title}</h4>
                  <p className="text-[#6B7160] mt-1">{n.message}</p>
                  <small className="text-[#9ea399] mt-2 block">{shortDate(n.date)}</small>
                </div>
              </div>
            ))
          ) : (
            <Empty title="No notifications" description="You're all caught up." />
          )}
        </div>
      </Card>
    </PageMotion>
  );
}
