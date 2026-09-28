import { findRoom } from '../lib/domain';
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
  QrCode,
  Smartphone,
  Banknote,
  Search,
  CheckCircle2,
  Percent,
  FileText,
  Printer,
  Sparkles,
  Trash2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { folio, money, shortDate, nights, can, today, dashboard } from '../lib/domain';
import type { State, Reservation, Payment } from '../lib/domain';
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
  Tabs,
} from '../components/ui';
import { Stat } from './Dashboard';
import { download, downloadCsv } from '../lib/utils';

export function invoice(s: State, r: Reservation) {
  const f = folio(s, r),
    g = s.guests.find((g) => g.id === r.guestId)!,
    room = findRoom(s, r.roomId)!;
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

export function receipt(s: State, r: Reservation, p: Payment) {
  const g = s.guests.find((g) => g.id === r.guestId)!,
    room = s.rooms.find((x) => x.id === r.roomId)!;
  const esc = (x: unknown) =>
    String(x)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  download(
    `receipt-${p.id}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Receipt ${esc(p.id)}</title><style>body{font-family:Arial,sans-serif;max-width:500px;margin:40px auto;padding:24px;border:1px solid #e0d8cc;border-radius:12px;color:#283a30}h1{font-size:24px;margin-bottom:4px}header{border-bottom:1px dashed #506845;padding-bottom:16px;text-align:center}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px;border-bottom:1px solid #eee;text-align:left}td:last-child{text-align:right}.badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:bold;background:#e8f5e9;color:#2e7d32}.total{font-size:20px;font-weight:bold;color:#1b5e20}footer{margin-top:30px;font-size:11px;text-align:center;color:#777}@media print{body{border:none;margin:0}button{display:none}}</style></head><body><header><small>OFFICIAL CASHIER PAYMENT RECEIPT</small><h1>${esc(s.policies.resortName)}</h1><p>${esc(s.policies.location)}</p></header><div style="margin-top:16px"><p><strong>Receipt #:</strong> ${esc(p.id)}</p><p><strong>Date & Time:</strong> ${shortDate(p.date)}</p><p><strong>Guest:</strong> ${esc(g.name)} (Room ${esc(room.number)})</p><p><strong>Folio #:</strong> ${esc(r.id)}</p></div><table><tr><td>Payment Type</td><td><span class="badge">${esc(p.type)}</span></td></tr><tr><td>Payment Method</td><td><strong>${esc(p.method)}</strong></td></tr><tr><td>Transaction Note</td><td>${esc(p.note || 'Settlement payment')}</td></tr><tr><td class="total">Amount Received</td><td class="total">${money(p.amount)}</td></tr></table><footer>Thank you for staying at ${esc(s.policies.resortName)}. Cashier Desk verification complete. Demo Transaction.</footer><button onclick="window.print()" style="margin-top:16px;width:100%;padding:10px;background:#1F3A2E;color:#fff;border:none;border-radius:6px;cursor:pointer">Print Receipt</button></body></html>`,
    'text/html',
  );
  toast.success('Payment receipt downloaded');
}

export default function Billing() {
  const { s, actor, act } = useStore();
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState<'payment' | 'refund' | 'charge' | 'discount' | 'expense' | ''>('');
  const [activeTab, setActiveTab] = useState<'All' | 'Balance Due' | 'In-house' | 'Settled' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenderedCash, setTenderedCash] = useState<number | ''>('');

  const guest = actor!.module === 'Guest',
    owner = actor!.module === 'Owner',
    isCashier = actor!.module === 'Staff' && actor!.role === 'Cashier';

  const reservations = s.reservations.filter((r) => !guest || r.guestId === actor!.guestId);
  const selected = reservations.find((r) => r.id === params.get('reservation')) ?? reservations[0];
  const d = dashboard(s);

  if (!selected)
    return <Empty title="No folios yet" description="A confirmed stay creates a guest folio." />;

  const f = folio(s, selected),
    g = s.guests.find((x) => x.id === selected.guestId)!,
    room = findRoom(s, selected.roomId)!;
  const payments = s.payments.filter((p) => p.reservationId === selected.id);

  // Filtered reservations for the cashier folio table
  const filteredReservations = reservations.filter((r) => {
    const fol = folio(s, r);
    const guestObj = s.guests.find((x) => x.id === r.guestId);
    const roomObj = s.rooms.find((x) => x.id === r.roomId);
    const matchesSearch =
      `${guestObj?.name ?? ''} ${roomObj?.number ?? ''} ${r.id}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'Balance Due') return fol.balance > 0;
    if (activeTab === 'In-house') return r.status === 'Checked in';
    if (activeTab === 'Settled') return fol.balance <= 0;
    if (activeTab === 'Completed') return r.status === 'Completed';
    return true;
  });

  // Calculate Cashier shift register stats
  const cashPayments = s.payments.filter((p) => p.method === 'Cash' && p.type === 'Payment').reduce((sum, p) => sum + p.amount, 0);
  const cashRefunds = s.payments.filter((p) => p.method === 'Cash' && p.type === 'Refund').reduce((sum, p) => sum + p.amount, 0);
  const netCashInDrawer = Math.max(0, cashPayments - cashRefunds);
  const upiPayments = s.payments.filter((p) => p.method === 'UPI' && p.type === 'Payment').reduce((sum, p) => sum + p.amount, 0);
  const cardPayments = s.payments.filter((p) => p.method === 'Card' && p.type === 'Payment').reduce((sum, p) => sum + p.amount, 0);

  return (
    <PageMotion>
      <PageTitle
        eyebrow={guest ? 'EVERY DETAIL, CLEARLY ACCOUNTED FOR' : isCashier ? 'CASHIER WORKSPACE · FOLIO MANAGEMENT & SETTLEMENTS' : 'RESORT FINANCE'}
        title={owner ? 'Financial overview' : guest ? 'Bills & payments' : isCashier ? `Cashier Desk — Welcome, ${actor!.name.split(' ')[0]}` : 'Billing & payments'}
        description={
          guest
            ? 'A clear view of your stay, with no little surprises.'
            : isCashier
              ? 'Process guest payments, manage in-house folios, post room charges, issue refunds, and print official tax invoices.'
              : 'Connected folios, seamless payments, and a complete financial trail.'
        }
        actions={
          <>
            {['Checked in', 'Completed'].includes(selected.status) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModal('charge')}
                >
                  <Plus size={16} />
                  Post Room Charge
                </Button>
                {f.balance > 0 && (
                  <Button onClick={() => setModal('payment')}>
                    <CreditCard size={16} />
                    Collect Payment
                  </Button>
                )}
              </>
            )}
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
              Export Register
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

      {/* Cashier Shift KPIs & Net Collections */}
      {!guest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <Stat
            label="Net Collections"
            value={d.revenue}
            format={money}
            icon={IndianRupee}
            detail="Total payments less refunds"
          />
          <Stat
            label="Cash in Drawer"
            value={netCashInDrawer}
            format={money}
            icon={Banknote}
            detail={`${money(cashPayments)} cash in, ${money(cashRefunds)} refunded`}
          />
          <Stat
            label="Digital & UPI"
            value={upiPayments + cardPayments}
            format={money}
            icon={Smartphone}
            detail={`UPI: ${money(upiPayments)} · Card: ${money(cardPayments)}`}
          />
          <Stat
            label="Outstanding Balance"
            value={d.outstanding}
            format={money}
            icon={Wallet}
            detail="Unsettled balances across folios"
          />
        </div>
      )}

      {/* Cashier Folio Directory Table (for Staff & Cashier) */}
      {!guest && (
        <Card className="p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE1]">
            <div>
              <strong className="block text-base text-[#22261F]">Guest Folio & Billing Directory</strong>
              <span className="text-xs text-[#6B7160]">Select a guest folio to collect payments, post extra services, or print invoices</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7160] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search guest or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  className="pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#F0EBE1] rounded-lg focus:outline-none focus:border-[#1F3A2E] w-56"
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Tabs
              value={activeTab}
              onChange={(t) => setActiveTab(t as any)}
              tabs={[
                { value: 'All', label: 'All Stays', count: reservations.length },
                { value: 'Balance Due', label: 'Balance Due', count: reservations.filter((r) => folio(s, r).balance > 0).length },
                { value: 'In-house', label: 'In-House Guests', count: reservations.filter((r) => r.status === 'Checked in').length },
                { value: 'Settled', label: 'Settled', count: reservations.filter((r) => folio(s, r).balance <= 0).length },
                { value: 'Completed', label: 'Completed Stays', count: reservations.filter((r) => r.status === 'Completed').length },
              ]}
            />
          </div>

          <div className="table-scroll mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] text-[#6B7160] sticky top-0">
                <tr>
                  <th className="p-2.5">Guest & Stay</th>
                  <th className="p-2.5">Room</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Total Charges</th>
                  <th className="p-2.5">Paid</th>
                  <th className="p-2.5">Balance Due</th>
                  <th className="p-2.5 text-right">Cashier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredReservations.map((r) => {
                  const gObj = s.guests.find((x) => x.id === r.guestId);
                  const roomObj = s.rooms.find((x) => x.id === r.roomId);
                  const fol = folio(s, r);
                  const isCurrent = r.id === selected.id;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[#FAF7F2]/60 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-[#1F3A2E]/5 font-medium' : ''
                      }`}
                      onClick={() => setParams({ reservation: r.id })}
                    >
                      <td className="p-2.5">
                        <strong className="block text-[#22261F]">{gObj?.name ?? 'Guest'}</strong>
                        <span className="text-[11px] text-[#6B7160]">{r.id} · {shortDate(r.checkIn)} – {shortDate(r.checkOut)}</span>
                      </td>
                      <td className="p-2.5">
                        Room {roomObj?.number} <span className="text-[11px] text-[#6B7160]">({roomObj?.type})</span>
                      </td>
                      <td className="p-2.5">
                        <Badge>{r.status}</Badge>
                      </td>
                      <td className="p-2.5 font-semibold text-[#22261F]">{money(fol.total)}</td>
                      <td className="p-2.5 text-[#2E7D4F]">{money(fol.paid)}</td>
                      <td className="p-2.5">
                        {fol.balance > 0 ? (
                          <strong className="text-[#C1443A] font-bold">{money(fol.balance)}</strong>
                        ) : fol.balance < 0 ? (
                          <span className="text-[#A5783A] font-semibold">Credit: {money(Math.abs(fol.balance))}</span>
                        ) : (
                          <span className="text-[#2E7D4F] font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant={isCurrent ? 'default' : 'outline'}
                            onClick={() => setParams({ reservation: r.id })}
                          >
                            {isCurrent ? 'Viewing' : 'Select'}
                          </Button>
                          {fol.balance > 0 && ['Checked in', 'Completed'].includes(r.status) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setParams({ reservation: r.id });
                                setModal('payment');
                              }}
                            >
                              Collect
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-[#6B7160]">
                      No guest folios match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Guest Folio Selector for Guest View */}
      {guest && (
        <div className="folio-selector mb-6">
          <label className="field">
            <span>Select a stay folio</span>
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
      )}

      {/* 2-Column POS Cashiering & Detailed Invoice Layout */}
      <div className="billing-layout">
        {/* Left Column: Itemized Invoice & Folio Breakdown */}
        <Card className="invoice-card">
          <CardHead
            title="Itemized Guest Folio"
            subtitle={`${g.name} · Room ${room.number} (${room.type}) · ${shortDate(selected.checkIn)} – ${shortDate(selected.checkOut)}`}
            action={
              <div className="flex gap-2">
                {!guest && ['Checked in', 'Completed'].includes(selected.status) && (
                  <Button size="sm" variant="outline" onClick={() => setModal('charge')}>
                    <Plus size={13} /> Add Charge
                  </Button>
                )}
                {!guest && ['Checked in', 'Confirmed'].includes(selected.status) && (
                  <Button size="sm" variant="outline" onClick={() => setModal('discount')}>
                    <Percent size={13} /> Discount
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => invoice(s, selected)}>
                  <Download size={13} /> Invoice
                </Button>
              </div>
            }
          />
          <div className="invoice-brand">
            <span className="eyebrow">{s.policies.resortName.toUpperCase()}</span>
            <strong>{selected.id}</strong>
            <span>{selected.status === 'Completed' ? 'Final Settled Invoice' : 'Active Guest Folio'}</span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity / Time</th>
                  <th>Amount</th>
                  {!guest && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Room Accommodation ({room.type})</strong>
                    <small>Agreed nightly rate · {money(selected.rate)}/night</small>
                  </td>
                  <td>{nights(selected.checkIn, selected.checkOut)} nights</td>
                  <td>{money(f.room)}</td>
                  {!guest && <td className="text-xs text-[#6B7160]">Included</td>}
                </tr>
                {f.services.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>{x.name}</strong>
                      <small>
                        {x.category} · {shortDate(x.date)} {x.options ? `(${x.options})` : ''}
                      </small>
                    </td>
                    <td>1 item / service</td>
                    <td>{money(x.amount)}</td>
                    {!guest && (
                      <td>
                        <button
                          className="text-[#C1443A] hover:opacity-80 p-1"
                          title="Void / Remove charge"
                          onClick={() => {
                            if (window.confirm(`Void charge "${x.name}" of ${money(x.amount)} from folio?`)) {
                              act({ type: 'service.delete', payload: { id: x.id } }, 'Service charge voided from folio');
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-totals">
            <div>
              <span>Room & services subtotal</span>
              <strong>{money(f.room + f.extras)}</strong>
            </div>
            {f.discount > 0 && (
              <div>
                <span>Discount ({selected.discount}%)</span>
                <strong className="text-[#2E7D4F]">−{money(f.discount)}</strong>
              </div>
            )}
            <div>
              <span>Tax ({selected.taxRate}%)</span>
              <strong>{money(f.tax)}</strong>
            </div>
            <div className="total">
              <span>Total Invoice Amount</span>
              <strong>{money(f.total)}</strong>
            </div>
            <div>
              <span>Payments Received</span>
              <strong className="text-[#2E7D4F]">−{money(f.paid)}</strong>
            </div>
            <div className="balance">
              <span>{f.balance < 0 ? 'Credit Balance (Refundable)' : 'Net Amount Due'}</span>
              <strong className={f.balance > 0 ? 'text-[#C1443A]' : 'text-[#2E7D4F]'}>
                {money(Math.abs(f.balance))}
              </strong>
            </div>
          </div>

          <div className="invoice-footer">
            <span>Official Billing Record · {s.policies.resortName}</span>
            <Button variant="outline" size="sm" onClick={() => invoice(s, selected)}>
              <Printer size={14} /> Print Formal Bill
            </Button>
          </div>
        </Card>

        {/* Right Column: Cashier POS Payment Terminal & Transaction Log */}
        <div>
          <Card className="payment-card">
            <span className="payment-icon">
              <CreditCard size={25} />
            </span>
            <h2>
              {f.balance > 0
                ? 'Settle Stay Balance'
                : f.balance < 0
                  ? 'Credit Balance on Folio'
                  : 'Folio Fully Settled'}
            </h2>
            <p>
              {selected.status === 'Confirmed'
                ? 'Stay payments unlock upon check-in. Advance payments are tracked as deposits.'
                : f.balance > 0
                  ? 'Accept guest payment via Cash, UPI, Card, or Bank Transfer.'
                  : f.balance < 0
                    ? 'Return credit balance through authorized cashier refund.'
                    : 'All charges on this folio are settled in full.'}
            </p>

            <div className="payment-balance">
              <small>{f.balance < 0 ? 'CREDIT BALANCE' : 'OUTSTANDING BALANCE'}</small>
              <strong className={f.balance > 0 ? 'text-[#C1443A]' : 'text-[#2E7D4F]'}>
                {money(Math.abs(f.balance))}
              </strong>
            </div>

            {f.balance > 0 && ['Checked in', 'Completed'].includes(selected.status) && (
              <Button className="w-full" onClick={() => setModal('payment')}>
                <CreditCard size={16} />
                {guest ? 'Pay Stay Balance' : 'Accept Payment'}
              </Button>
            )}

            {f.paid > 0 && !guest && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setModal('refund')}
              >
                <RotateCcw size={15} />
                Process Refund
              </Button>
            )}

            {!guest && ['Checked in', 'Completed'].includes(selected.status) && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-xs"
                onClick={() => setModal('charge')}
              >
                <Plus size={14} />
                Add Extra Incidental / Minibar Charge
              </Button>
            )}

            <div className="demo-payment-note">CASHIER DESK · SIMULATED FINANCIAL ENGINE</div>
          </Card>

          {/* Payment History with Individual Printable Receipts */}
          <Card className="mt-6">
            <CardHead
              title="Folio Payment Ledger"
              subtitle={`${payments.length} transactions recorded`}
              action={
                payments.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadCsv(
                        `folio-${selected.id}-payments.csv`,
                        payments.map((p) => ({ ...p, guest: g.name, room: room.number })),
                      )
                    }
                  >
                    <Download size={13} /> CSV
                  </Button>
                )
              }
            />
            <div className="payment-history space-y-2 mt-3">
              {payments.map((p) => (
                <div key={p.id} className="p-3 border border-[#F0EBE1] rounded-xl flex items-center justify-between bg-[#FAF7F2]/50">
                  <div className="flex items-center gap-3">
                    <span className={`history-icon ${p.type === 'Refund' ? 'refund' : ''}`}>
                      {p.type === 'Refund' ? <RotateCcw size={17} /> : <CreditCard size={17} />}
                    </span>
                    <div>
                      <strong className="block text-sm text-[#22261F]">
                        {p.type === 'Refund' ? 'Refund Processed' : `${p.method} Payment`}
                      </strong>
                      <span className="text-xs text-[#6B7160]">
                        {shortDate(p.date)} · Ref: {p.id}
                      </span>
                      {p.note && <p className="text-[11px] text-[#6B7160] mt-0.5">{p.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className={`block text-sm ${p.type === 'Refund' ? 'text-[#C1443A]' : 'text-[#2E7D4F]'}`}>
                      {p.type === 'Refund' ? '−' : '+'}{money(p.amount)}
                    </strong>
                    <button
                      className="text-[11px] text-[#1F3A2E] hover:underline flex items-center justify-end gap-1 mt-1"
                      onClick={() => receipt(s, selected, p)}
                    >
                      <Printer size={11} /> Receipt
                    </button>
                  </div>
                </div>
              ))}
              {!payments.length && <Empty title="No payments recorded" description="Payments logged on this stay will appear here." />}
            </div>
          </Card>
        </div>
      </div>

      {/* Operating Expenses (Owner) */}
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

      {/* MODAL: Accept / Process Payment */}
      {modal === 'payment' && (
        <FormModal
          title="Process Guest Payment"
          description={`Collecting payment for ${g.name} · Room ${room.number} (Folio ${selected.id}).`}
          initial={{
            amount: Math.max(0, f.balance),
            method: 'Card',
            tendered: Math.max(0, f.balance),
            result: 'Approved',
          }}
          fields={[
            {
              name: 'amount',
              label: 'Payment Amount (₹)',
              type: 'number',
              min: 1,
              max: Math.max(0, f.balance),
              required: true,
            },
            {
              name: 'method',
              label: 'Payment Method',
              type: 'select',
              required: true,
              options: [
                { value: 'Card', label: 'Credit / Debit Card (POS Swiper)' },
                { value: 'UPI', label: 'UPI (QR Code / GPay / PhonePe / Paytm)' },
                { value: 'Cash', label: 'Cash (Drawer Collection)' },
                { value: 'Bank transfer', label: 'Bank Transfer / NEFT / IMPS' },
              ],
            },
            {
              name: 'result',
              label: 'Gateway / POS Authorization',
              type: 'select',
              required: true,
              options: [
                { value: 'Approved', label: 'Approved (Successful)' },
                { value: 'Declined', label: 'Declined (Simulate Failure)' },
              ],
              wide: true,
            },
          ]}
          submit="Confirm & Settle Payment"
          onClose={() => setModal('')}
          onSubmit={(v) => {
            if (v.result === 'Declined') {
              toast.error('Payment declined by card gateway / bank. Try another method.');
              return false;
            }
            return act(
              { type: 'payment.create', payload: { ...v, reservationId: selected.id } },
              `Payment of ${money(Number(v.amount))} collected via ${v.method}!`,
            );
          }}
        />
      )}

      {/* MODAL: Post Room Charge / Incidental / Minibar */}
      {modal === 'charge' && (
        <FormModal
          title="Post Room Charge / Incidental"
          description={`Add a charge to ${g.name}'s stay (Room ${room.number}). It will be added to the folio.`}
          initial={{
            category: 'Food & Beverage',
            name: 'In-room dining',
            amount: 750,
          }}
          fields={[
            {
              name: 'category',
              label: 'Charge Category',
              type: 'select',
              required: true,
              options: [
                { value: 'Food & Beverage', label: 'Food & Beverage (Dining / Bar)' },
                { value: 'Minibar', label: 'Minibar & Refreshments' },
                { value: 'Spa', label: 'Spa & Wellness Therapy' },
                { value: 'Laundry', label: 'Laundry & Dry Cleaning' },
                { value: 'Transport', label: 'Airport Transfer / Taxi' },
                { value: 'Late Checkout', label: 'Late Check-out Fee' },
                { value: 'Incidentals', label: 'Room Damage / Incidentals' },
                { value: 'Other', label: 'Other Service Charge' },
              ],
            },
            {
              name: 'name',
              label: 'Charge Description',
              required: true,
              placeholder: 'e.g. 2x Mango Smoothies / Extra Laundry',
            },
            {
              name: 'amount',
              label: 'Charge Amount (₹)',
              type: 'number',
              min: 1,
              required: true,
            },
            {
              name: 'options',
              label: 'Item Notes / Reference',
              placeholder: 'e.g. Bill #8492 / Mini-bar refilled',
              wide: true,
            },
          ]}
          submit="Post to Folio"
          onClose={() => setModal('')}
          onSubmit={(v) =>
            act(
              {
                type: 'service.create',
                payload: {
                  ...v,
                  reservationId: selected.id,
                  completed: true,
                  status: 'Completed',
                },
              },
              `Charge of ${money(Number(v.amount))} posted to folio!`,
            )
          }
        />
      )}

      {/* MODAL: Apply Discount / Waiver */}
      {modal === 'discount' && (
        <FormModal
          title="Apply Folio Discount or Waiver"
          description={`Apply promotional or manager discount on ${g.name}'s stay.`}
          initial={{ discount: selected.discount || 10 }}
          fields={[
            {
              name: 'discount',
              label: 'Discount Percentage (%)',
              type: 'number',
              min: 0,
              max: 100,
              required: true,
            },
          ]}
          submit="Apply Discount"
          onClose={() => setModal('')}
          onSubmit={(v) =>
            act(
              {
                type: 'reservation.discount',
                payload: { id: selected.id, discount: v.discount },
              },
              `Folio discount updated to ${v.discount}%!`,
            )
          }
        />
      )}

      {/* MODAL: Authorize Refund */}
      {modal === 'refund' && (
        <FormModal
          title="Authorize & Process Refund"
          description={`Process a refund for ${g.name}. Maximum refundable: ${money(f.paid)}.`}
          initial={{
            amount: Math.min(f.paid, Math.max(1, Math.abs(f.balance))),
            method: 'Original method',
          }}
          fields={[
            {
              name: 'amount',
              label: 'Refund Amount (₹)',
              type: 'number',
              min: 1,
              max: f.paid,
              required: true,
            },
            {
              name: 'method',
              label: 'Refund Method',
              type: 'select',
              required: true,
              options: [
                { value: 'Original method', label: 'Return to Original Payment Method' },
                { value: 'Cash', label: 'Cash from Drawer' },
                { value: 'UPI', label: 'Instant UPI Refund' },
                { value: 'Bank transfer', label: 'Direct Bank NEFT Transfer' },
              ],
            },
            {
              name: 'note',
              label: 'Authorization & Reason for Refund',
              type: 'textarea',
              required: true,
              placeholder: 'e.g. Early departure / guest service recovery adjustment',
              wide: true,
            },
          ]}
          submit="Process Refund"
          onClose={() => setModal('')}
          onSubmit={(v) =>
            act(
              { type: 'payment.refund', payload: { ...v, reservationId: selected.id } },
              `Authorized refund of ${money(Number(v.amount))} processed!`,
            )
          }
        />
      )}

      {/* MODAL: Record Expense */}
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
