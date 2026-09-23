import React, { useState } from 'react';
import { UserPlus, Copy, Check, Eye, EyeOff, ShieldCheck, Lock, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Role, StaffRole } from '../lib/domain';
import { roles } from '../lib/domain';
import { Button, Badge, Modal, FormModal, Fields } from './ui';
import { toast } from 'sonner';

export function AccountsTable({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { s, actor, act } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  if (!actor || (actor.module !== 'Owner' && actor.module !== 'Management')) {
    return null;
  }

  const isOwner = actor.module === 'Owner';

  // Filter accounts created by or relevant to this user
  // For Owner: Manager accounts (and any accounts created by Owner)
  // For Manager: Staff accounts (and any accounts created by Manager)
  const myAccounts = s.accounts.filter((a) => {
    if (a.id === actor.id) return false; // don't list self in created table
    if (isOwner) {
      return a.module === 'Management' || a.createdBy === actor.id;
    } else {
      return a.module === 'Staff' || a.createdBy === actor.id;
    }
  });

  const handleCreateAccount = (values: Record<string, any>): boolean => {
    const role: Role = isOwner ? 'Management' : (values.role as StaffRole || 'Receptionist');
    const autoPass = `PalmPass#${Math.floor(1000 + Math.random() * 9000)}`;

    const success = act(
      {
        type: 'account.create',
        payload: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          role,
          password: autoPass,
          shift: values.shift || (isOwner ? '09:00 – 18:00' : '07:00 – 15:00'),
        },
      },
      `${isOwner ? 'Manager' : 'Staff'} account created successfully!`
    );

    if (success) {
      setCreatedCredentials({
        name: values.name,
        email: values.email,
        password: autoPass,
        role,
      });
      return true;
    }
    return false;
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    act(
      {
        type: 'account.update',
        payload: { id, active: !currentActive },
      },
      `Account ${!currentActive ? 'activated' : 'deactivated'}`
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Could not copy. Please select and copy the text manually.');
    }
  };

  return (
    <div className="card accounts-panel overflow-hidden my-4">
      <div className="card-head border-b border-[#F0EBE1] pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#22261F]">
            {title ?? (isOwner ? 'Manager Accounts Created' : 'Staff Accounts Created')}
          </h2>
          <p className="text-xs text-[#6B7160]">
            {subtitle ??
              (isOwner
                ? 'Manage manager login credentials & active system permissions'
                : 'Create & manage staff logins for Reception, Housekeeping, Maintenance, F&B & Spa')}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus size={16} />
          {isOwner ? 'Add Manager' : 'Add Staff Account'}
        </Button>
      </div>

      <div className="table-scroll">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF7F2] text-[#6B7160] font-semibold border-b border-[#F0EBE1]">
            <tr>
              <th className="py-3 px-4">Account Holder</th>
              <th className="py-3 px-4">Role & Dept</th>
              <th className="py-3 px-4">Login ID (Email)</th>
              <th className="py-3 px-4">Password</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE1]">
            {myAccounts.map((acc) => {
              const isPassVisible = !!showPassMap[acc.id];
              return (
                <tr key={acc.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#22261F]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1F3A2E]/10 text-[#1F3A2E] font-bold flex items-center justify-center text-xs">
                        {acc.name.slice(0, 1)}
                      </div>
                      <div>
                        <div>{acc.name}</div>
                        <div className="text-[10px] text-[#6B7160] font-normal">{acc.shift || 'Standard shift'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#1F3A2E]/10 text-[#1F3A2E]">
                      {acc.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#22261F]">{acc.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#F0EBE1]">
                        {isPassVisible ? acc.password : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassMap((prev) => ({ ...prev, [acc.id]: !prev[acc.id] }))
                        }
                        className="text-[#6B7160] hover:text-[#1F3A2E]"
                        title={isPassVisible ? 'Hide password' : 'Show password'}
                        aria-label={`${isPassVisible ? 'Hide' : 'Show'} password for ${acc.name}`}
                        aria-pressed={isPassVisible}
                      >
                        {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.password, 'Password')}
                        className="text-[#6B7160] hover:text-[#C9A227]"
                        title="Copy password"
                        aria-label={`Copy password for ${acc.name}`}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge>{acc.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(acc.id, acc.active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        acc.active
                          ? 'bg-[#C1443A]/10 text-[#C1443A] hover:bg-[#C1443A]/20'
                          : 'bg-[#2E7D4F]/10 text-[#2E7D4F] hover:bg-[#2E7D4F]/20'
                      }`}
                    >
                      {acc.active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      {acc.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!myAccounts.length && (
          <div className="p-8 text-center text-[#6B7160]">
            <Lock size={24} className="mx-auto mb-2 opacity-40 text-[#C9A227]" />
            <p className="font-medium">No accounts created yet</p>
            <p className="text-xs mt-1">
              Click the button above to add a new {isOwner ? 'Manager' : 'Staff'} account with auto-generated credentials.
            </p>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {modalOpen && (
        <FormModal
          title={isOwner ? 'Create Manager Account' : 'Create Staff Account'}
          description={
            isOwner
              ? 'Add a new resort Manager. Login credentials will be generated automatically.'
              : 'Add a new Receptionist, Housekeeping, Cashier, Maintenance, Gardener, F&B, or Spa staff member.'
          }
          fields={[
            { name: 'name', label: 'Full Name', required: true, placeholder: 'e.g. Rahul Verma' },
            { name: 'email', label: 'Email Address (Login ID)', type: 'email', required: true, placeholder: 'rahul@rrms.demo' },
            { name: 'phone', label: 'Phone Number', required: true, placeholder: '+91 98765 43210' },
            ...(!isOwner
              ? [
                  {
                    name: 'role',
                    label: 'Staff Role',
                    type: 'select',
                    required: true,
                    options: roles.map((r) => ({ value: r, label: r })),
                  },
                ]
              : []),
            { name: 'shift', label: 'Shift Hours', placeholder: 'e.g. 07:00 – 15:00' },
          ]}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateAccount}
          submit="Generate Credentials & Save"
        />
      )}

      {/* Credentials Created Card Modal */}
      {createdCredentials && (
        <Modal
          open={true}
          onClose={() => setCreatedCredentials(null)}
          title="Credentials Created Successfully"
          description="Share these generated login details with the account holder manually."
        >
          <div className="p-4 bg-[#FAF7F2] border border-[#C9A227]/40 rounded-xl my-3 space-y-3">
            <div className="flex items-center gap-2 text-[#2E7D4F] font-bold text-sm">
              <ShieldCheck size={18} />
              <span>Account is Live & Ready for Immediate Sign-In</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7160]">Account Name:</span>
                <div className="font-semibold text-[#22261F]">{createdCredentials.name}</div>
              </div>
              <div>
                <span className="text-[#6B7160]">Assigned Role:</span>
                <div className="font-semibold text-[#1F3A2E]">{createdCredentials.role}</div>
              </div>
              <div>
                <span className="text-[#6B7160]">Login Email:</span>
                <div className="font-mono font-bold text-[#22261F]">{createdCredentials.email}</div>
              </div>
              <div>
                <span className="text-[#6B7160]">Generated Password:</span>
                <div className="font-mono font-bold text-[#C9A227]">{createdCredentials.password}</div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() =>
                  copyToClipboard(
                    `Resort Access Credentials\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`,
                    'Full Credentials Card'
                  )
                }
              >
                <Copy size={14} /> Copy Credentials Text
              </Button>
            </div>
          </div>

          <div className="dialog-footer">
            <Button onClick={() => setCreatedCredentials(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
