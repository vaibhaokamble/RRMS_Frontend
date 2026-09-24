import { useState } from 'react';
import { PageMotion, PageTitle, Card, Tabs, Button, Badge, Empty, Avatar, Modal } from '../components/ui';
import { useStore } from '../lib/store';
import { shortDate, money } from '../lib/domain';
import { Check, X, Eye } from 'lucide-react';

export default function Approvals() {
  const { s, act, actor } = useStore();
  const [tab, setTab] = useState('Pending');
  const [viewDetails, setViewDetails] = useState<string | null>(null);
  const approvals = s.approvals || [];
  
  const isOwner = actor?.module === 'Owner';
  const visibleApprovals = isOwner ? approvals : approvals.filter((a) => a.requestedBy === actor?.id);

  const tabs = [
    { value: 'Pending', label: 'Pending Approvals', count: visibleApprovals.filter((a) => a.status === 'Pending').length },
    { value: 'Approved', label: 'Approved', count: visibleApprovals.filter((a) => a.status === 'Approved').length },
    { value: 'Rejected', label: 'Rejected', count: visibleApprovals.filter((a) => a.status === 'Rejected').length },
  ];

  const filtered = visibleApprovals.filter((a) => a.status === tab);
  const detailItem = approvals.find((a) => a.id === viewDetails);

  const handleApprove = (id: string) => act({ type: 'approval.approve', payload: { id } }, 'Approval granted');
  const handleReject = (id: string) => act({ type: 'approval.reject', payload: { id } }, 'Approval rejected');

  return (
    <PageMotion>
      <PageTitle
        title="Approvals"
        description="Review and manage executive requests and overrides."
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <Card>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7160]">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filtered.map((a) => {
                  const requester = s.accounts.find(x => x.id === a.requestedBy);
                  return (
                    <tr key={a.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-3 font-mono">{a.id}</td>
                      <td className="p-3"><Badge>{a.type}</Badge></td>
                      <td className="p-3 flex items-center gap-2">
                        <Avatar name={requester?.name || 'System'} size="small" />
                        {requester?.name || 'System'}
                      </td>
                      <td className="p-3">{shortDate(a.date)}</td>
                      <td className="p-3">{a.amount ? money(a.amount) : '-'}</td>
                      <td className="p-3 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setViewDetails(a.id)}>
                          <Eye size={16} /> Details
                        </Button>
                        {isOwner && a.status === 'Pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(a.id)}>
                              <Check size={16} /> Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleReject(a.id)}>
                              <X size={16} /> Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={`No ${tab.toLowerCase()} approvals`} description="You're all caught up." />
        )}
      </Card>
      {viewDetails && detailItem && (
        <Modal
          open
          onClose={() => setViewDetails(null)}
          title={`Approval Request: ${detailItem.id}`}
          description={`Review details before making a decision.`}
        >
          <div className="dialog-body space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#F0EBE1]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Type</span>
                  <Badge>{detailItem.type}</Badge>
                </div>
                <div>
                  <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Status</span>
                  <Badge>{detailItem.status}</Badge>
                </div>
                <div>
                  <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Requested By</span>
                  <div className="flex items-center gap-2">
                    <Avatar name={s.accounts.find(x => x.id === detailItem.requestedBy)?.name || 'System'} size="small" />
                    {s.accounts.find(x => x.id === detailItem.requestedBy)?.name || 'System'}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Date</span>
                  {shortDate(detailItem.date)}
                </div>
                {detailItem.amount && (
                  <div>
                    <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Amount</span>
                    <strong className="text-lg">{money(detailItem.amount)}</strong>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[#6B7160] block text-xs uppercase font-bold mb-1">Details</span>
                  <p className="bg-white p-3 rounded-lg border border-[#F0EBE1] text-[#22261F]">{detailItem.details}</p>
                </div>
              </div>
            </div>
            {isOwner && detailItem.status === 'Pending' && (
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => { handleReject(detailItem.id); setViewDetails(null); }}>
                  <X size={16} /> Reject Request
                </Button>
                <Button onClick={() => { handleApprove(detailItem.id); setViewDetails(null); }}>
                  <Check size={16} /> Approve Request
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageMotion>
  );
}
