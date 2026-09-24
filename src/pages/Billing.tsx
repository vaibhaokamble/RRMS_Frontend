import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  CreditCard,
  Receipt,
  ArrowUpRight,
  RotateCcw,
  IndianRupee,
  Wallet,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { folio, money, shortDate, nights, can, today, dashboard } from '../lib/domain';
import type { State, Reservation } from '../lib/domain';
import {
  PageTitle,
  Card,
  CardHead,
  Button,
  Badge,
  DataTable,
  FormModal,
  PageMotion,
  Empty,
} from '../components/ui';
import { Stat } from './Dashboard';
import { download, downloadCsv } from '../lib/utils';
export function invoice(s: State, r: Reservation) {
  const f = folio(s, r),
    g = s.guests.find((g) => g.id === r.guestId)!,
    room = s.rooms.find((x) => x.id === r.roomId)!;
  const esc = (x: unknown) =>
    String(x)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  const row = (label: string, value: number) =>
    `<tr><td>${esc(label)}</td><td>${money(value)}</td></tr>`;
  download(
    `invoice-${r.id}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(r.id)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;color:#283a30}h1{font-size:34px}header{border-bottom:2px solid #506845;padding-bottom:24px}table{width:100%;border-collapse:collapse;margin:28px 0}td,th{padding:15px;border-bottom:1px solid #ddd;text-align:left}td:last-child{text-align:right}small,p{color:#626b64}.total{font-size:22px;font-weight:bold}footer{margin-top:50px;font-size:12px}@media print{body{margin:0}button{display:none}}</style></head><body><header><small>RRMS · SIMULATED INVOICE</small><h1>${esc(s.policies.resortName)}</h1><p>${esc(s.policies.location)} · ${esc(s.policies.email)}</p></header><h2>Stay invoice · ${esc(r.id)}</h2><p>Billed to ${esc(g.name)} · ${esc(g.email)}</p><p>Room ${esc(room.number)} · ${shortDate(r.checkIn)} – ${shortDate(r.checkOut)} · ${nights(r.checkIn, r.checkOut)} nights</p><table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${row('Room accommodation', f.room)}${f.services.map((x) => row(x.name, x.amount)).join('')}${row('Discount', -f.discount)}${row(`Tax (${r.taxRate}%)`, f.tax)}${row('Invoice total', f.total)}${row('Net payments', -f.paid)}</tbody></table><p class="total">${f.balance < 0 ? 'Credit balance' : 'Amount due'}: ${money(Math.abs(f.balance))}</p><h3>Payment history</h3><table>${s.payments
      .filter((p) => p.reservationId === r.id)
      .map((p) =>
        row(
          `${shortDate(p.date)} · ${p.type} · ${p.method} · ${p.id}`,
          p.type === 'Refund' ? -p.amount : p.amount,
        ),
      )
      .join(
        '',
      )}</table><footer>Thank you for making memories with us. This invoice is generated from local demo data. No actual payment was processed. Generated ${new Date().toLocaleString('en-GB')}.</footer><button onclick="window.print()">Print / save as PDF</button></body></html>`,
    'text/html',
  );
  toast.success('Printable invoice downloaded');
}
export default function Billing() {
  const { s, actor, act } = useStore();
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState('');
  const guest = actor!.module === 'Guest',
    owner = actor!.module === 'Owner';
  const reservations = s.reservations.filter((r) => !guest || r.guestId === actor!.guestId);
  const selected = reservations.find((r) => r.id === params.get('reservation')) ?? reservations[0];
  const d = dashboard(s);
  if (!selected)
    return <Empty title="No folios yet" description="A confirmed stay creates a guest folio." />;
  const f = folio(s, selected),
    g = s.guests.find((x) => x.id === selected.guestId)!,
    room = s.rooms.find((x) => x.id === selected.roomId)!;
  const payments = s.payments.filter((p) => p.reservationId === selected.id);
  return (
    <PageMotion>
      <PageTitle
        eyebrow={guest ? 'EVERY DETAIL, CLEARLY ACCOUNTED FOR' : 'RESORT FINANCE'}
        title={owner ? 'Financial overview' : guest ? 'Bills & payments' : 'Billing & payments'}
        description={
          guest
            ? 'A clear view of your stay, with no little surprises.'
            : 'Connected folios, seamless payments, and a complete financial trail.'
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'payment-history.csv',
                  (guest
                    ? s.payments.filter((p) => reservations.some((r) => r.id === p.reservationId))
                    : s.payments
                  ).map((p) => ({ ...p })),
                )
              }
            >
              <Download size={16} />
              Export payments
            </Button>
            {owner && (
              <Button onClick={() => setModal('expense')}>
                <Plus size={16} />
                Record expense
              </Button>
            )}
          </>
        }
      />
      {(owner || actor!.module === 'Management') && (
        <div className="stats-grid">
          <Stat
            label="Net Profit"
            value={d.revenue - d.expenses}
            format={money}
            icon={IndianRupee}
            detail="Net collections minus expenses"
          />
          <Stat
            label="Net collections"
            value={d.revenue}
            format={money}
            icon={IndianRupee}
            detail="Payments less authorized refunds"
          />
          <Stat
            label="GST / Taxes"
            value={s.reservations.reduce((n, r) => n + folio(s, r).tax, 0)}
            format={money}
            icon={Receipt}
            detail="Taxes collected across all folios"
          />
          <Stat
            label="Outstanding"
            value={d.outstanding}
            format={money}
            icon={Wallet}
            detail="Positive balances across all folios"
          />
          <Stat
            label="Refunded"
            value={s.payments.filter((p) => p.type === 'Refund').reduce((n, p) => n + p.amount, 0)}
            format={money}
            icon={RotateCcw}
            detail="Authorized and recorded"
          />
          <Stat
            label="Operating expenses"
            value={d.expenses}
            format={money}
            icon={Receipt}
            detail="Recorded property expenses"
          />
        </div>
      )}
      <div className="folio-selector">
        <label className="field">
          <span>Select a guest folio</span>
          <select value={selected.id} onChange={(e) => setParams({ reservation: e.target.value })}>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {s.guests.find((g) => g.id === r.guestId)?.name} · {r.id} · {r.status}
              </option>
            ))}
          </select>
        </label>
        <Badge>{selected.status}</Badge>
      </div>
      <div className="billing-layout">
        <Card className="invoice-card">
          <CardHead
            title="Your stay, item by item"
            subtitle={`${g.name} · Room ${room.number} · ${shortDate(selected.checkIn)} – ${shortDate(selected.checkOut)}`}
            action={<Receipt size={21} />}
          />
          <div className="invoice-brand">
            <span className="eyebrow">{s.policies.resortName.toUpperCase()}</span>
            <strong>{selected.id}</strong>
            <span>{selected.status === 'Completed' ? 'Final bill' : 'Guest folio'}</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{room.type}</strong>
                    <small>Agreed nightly rate · {money(selected.rate)}</small>
                  </td>
                  <td>{nights(selected.checkIn, selected.checkOut)} nights</td>
                  <td>{money(f.room)}</td>
                </tr>
                {f.services.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>{x.name}</strong>
                      <small>
                        {x.id} · {shortDate(x.date)}
                      </small>
                    </td>
                    <td>1 service</td>
                    <td>{money(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="invoice-totals">
            <div>
              <span>Room & service subtotal</span>
              <strong>{money(f.room + f.extras)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>−{money(f.discount)}</strong>
            </div>
            <div>
              <span>Tax ({selected.taxRate}%)</span>
              <strong>{money(f.tax)}</strong>
            </div>
            <div className="total">
              <span>Total</span>
              <strong>{money(f.total)}</strong>
            </div>
            <div>
              <span>Payments less refunds</span>
              <strong>−{money(f.paid)}</strong>
            </div>
            <div className="balance">
              <span>{f.balance < 0 ? 'Credit balance' : 'Amount due'}</span>
              <strong>{money(Math.abs(f.balance))}</strong>
            </div>
          </div>
          <div className="invoice-footer">
            <span>Thank you for making memories with us.</span>
            <Button variant="outline" onClick={() => invoice(s, selected)}>
              <Download size={15} />
              Download invoice
            </Button>
          </div>
        </Card>
        <div>
          <Card className="payment-card">
            <span className="payment-icon">
              <CreditCard size={25} />
            </span>
            <h2>
              {f.balance > 0
                ? 'A seamless finish to your stay.'
                : f.balance < 0
                  ? 'A credit to take care of.'
                  : 'All taken care of.'}
            </h2>
            <p>
              {selected.status === 'Confirmed'
                ? 'Stay payments unlock after check-in. Advance payments are arranged outside RRMS.'
                : f.balance > 0
                  ? 'Settle your stay balance securely in our demo payment experience.'
                  : f.balance < 0
                    ? 'An authorized team member can return this credit through a simulated refund.'
                    : 'Your folio is settled. A little less to think about.'}
            </p>
            <div className="payment-balance">
              <small>{f.balance < 0 ? 'CREDIT BALANCE' : 'BALANCE DUE'}</small>
              <strong>{money(Math.abs(f.balance))}</strong>
            </div>
            {f.balance > 0 && ['Checked in', 'Completed'].includes(selected.status) && (
              <Button className="w-full" onClick={() => setModal('payment')}>
                <CreditCard size={16} />
                {guest ? 'Pay stay balance' : 'Record payment'}
              </Button>
            )}
            {can(s, actor!, 'refunds') && f.paid > 0 && (
              <Button variant="outline" className="w-full mt-3" onClick={() => setModal('refund')}>
                <RotateCcw size={15} />
                Authorized refund
              </Button>
            )}
            <div className="demo-payment-note">DEMO PAYMENTS · NO REAL MONEY MOVES</div>
          </Card>
          <Card className="mt-6">
            <CardHead
              title="Payment history"
              subtitle={`${payments.length} transactions on this folio`}
            />
            <div className="payment-history">
              {payments.map((p) => (
                <div key={p.id}>
                  <span className={`history-icon ${p.type === 'Refund' ? 'refund' : ''}`}>
                    {p.type === 'Refund' ? <RotateCcw size={17} /> : <CreditCard size={17} />}
                  </span>
                  <div>
                    <strong>{p.type === 'Refund' ? 'Refund' : p.method}</strong>
                    <small>
                      {shortDate(p.date)} · {p.id}
                    </small>
                    <small>{p.note}</small>
                  </div>
                  <b>
                    {p.type === 'Refund' ? '−' : ''}
                    {money(p.amount)}
                  </b>
                </div>
              ))}
              {!payments.length && <Empty title="No payments recorded" />}
            </div>
          </Card>
        </div>
      </div>
      {owner && (
        <Card className="mt-6">
          <CardHead title="Operating expenses" subtitle="The investment behind every great stay" />
          <DataTable
            rows={s.expenses}
            searchBy={(e) => `${e.name} ${e.category}`}
            columns={[
              {
                key: 'name',
                label: 'Description',
                render: (e) => <strong>{e.name}</strong>,
                sort: (e) => e.name,
              },
              { key: 'category', label: 'Category', render: (e) => <Badge>{e.category}</Badge> },
              { key: 'date', label: 'Date', render: (e) => shortDate(e.date), sort: (e) => e.date },
              {
                key: 'amount',
                label: 'Amount',
                render: (e) => money(e.amount),
                sort: (e) => e.amount,
              },
            ]}
          />
        </Card>
      )}
      {modal === 'payment' && (
        <FormModal
          title="A simple, simulated payment"
          description="No real card details or bank access are needed. This payment updates the guest folio and resort reports."
          initial={{ amount: Math.max(0, f.balance), method: 'Card', result: 'Approved' }}
          fields={[
            {
              name: 'amount',
              label: 'Amount (₹)',
              type: 'number',
              min: 1,
              max: Math.max(0, f.balance),
              required: true,
            },
            {
              name: 'method',
              label: 'Payment method',
              type: 'select',
              required: true,
              options: ['Card', 'UPI', 'Cash', 'Bank transfer'].map((x) => ({
                value: x,
                label: x,
              })),
            },
            {
              name: 'result',
              label: 'Demo gateway response',
              type: 'select',
              required: true,
              options: ['Approved', 'Declined'].map((x) => ({ value: x, label: x })),
              wide: true,
            },
          ]}
          submit="Simulate payment"
          onClose={() => setModal('')}
          onSubmit={(v) => {
            if (v.result === 'Declined') {
              toast.error('Demo payment declined. No charge was recorded. Try another method.');
              return false;
            }
            return act(
              { type: 'payment.create', payload: { ...v, reservationId: selected.id } },
              'Demo payment successful. Your folio is updated.',
            );
          }}
        />
      )}
      {modal === 'refund' && (
        <FormModal
          title={owner ? "Authorize a simulated refund" : "Request a simulated refund"}
          description={owner ? "Refunds are limited to the net amount received and are recorded in the audit log." : "Refunds require Owner approval. A request will be sent."}
          initial={{ amount: Math.min(f.paid, Math.abs(f.balance)), method: 'Original method' }}
          fields={[
            {
              name: 'amount',
              label: 'Refund amount (₹)',
              type: 'number',
              min: 1,
              max: f.paid,
              required: true,
            },
            {
              name: 'note',
              label: owner ? 'Authorization / reason' : 'Reason for refund request',
              type: 'textarea',
              required: true,
              wide: true,
            },
          ]}
          submit={owner ? "Authorize refund" : "Request refund approval"}
          onClose={() => setModal('')}
          onSubmit={(v) => {
            if (owner) {
              return act(
                { type: 'payment.refund', payload: { ...v, reservationId: selected.id } },
                'Authorized demo refund recorded',
              );
            } else {
              return act(
                {
                  type: 'approval.create',
                  payload: {
                    type: 'Refund',
                    details: `Refund of ₹${v.amount} requested for ${selected.id}. Reason: ${v.note}`,
                    amount: v.amount,
                  },
                },
                'Refund request sent to Owner for approval',
              );
            }
          }}
        />
      )}
      {modal === 'expense' && (
        <FormModal
          title="Record an expense"
          initial={{ date: today() }}
          fields={[
            { name: 'name', label: 'Description', required: true, wide: true },
            {
              name: 'category',
              label: 'Category',
              type: 'select',
              required: true,
              options: ['Operations', 'Payroll', 'F&B', 'Maintenance', 'Utilities', 'Other'].map(
                (x) => ({ value: x, label: x }),
              ),
            },
            { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
          ]}
          onClose={() => setModal('')}
          onSubmit={(v) => act({ type: 'expense.create', payload: v }, 'Expense recorded')}
        />
      )}
    </PageMotion>
  );
}
