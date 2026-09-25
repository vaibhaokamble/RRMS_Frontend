import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { applyCommand, seed } from './domain';
import { normalizeState } from './property';
import type { State, Account, Command, Module, Role } from './domain';
const KEY = 'rrms-palm-v1';
const SESSION = 'rrms-session-v1';
function readState(): State {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const s = JSON.parse(stored);
      if (s.version === 1 && s.accounts && s.rooms) return normalizeState(s);
    }
  } catch {
    /* recover demo */
  }
  return normalizeState(seed());
}
type Context = {
  s: State;
  actor: Account | null;
  act: (command: Command, message?: string) => boolean;
  login: (email: string, password: string) => boolean;
  switchDemo: (module: Module, role?: Role) => boolean;
  logout: () => void;
  reset: () => void;
};
const StoreContext = createContext<Context>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setState] = useState<State>(readState);
  const current = useRef(s);
  current.current = s;
  const [actorId, setActorId] = useState<string | null>(() => {
    const x = localStorage.getItem(SESSION);
    return x === null ? 'manager' : x || null;
  });
  const actor = s.accounts.find((a) => a.id === actorId && a.active) ?? null;
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      toast.error('Browser storage is full. Changes will only last for this session.');
    }
  }, [s]);
  useEffect(() => {
    localStorage.setItem(SESSION, actorId ?? '');
  }, [actorId]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          const next = normalizeState(JSON.parse(e.newValue));
          if (next.version === 1) {
            current.current = next;
            setState(next);
          }
        } catch {
          /* ignore incomplete writes */
        }
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  const commit = (next: State) => {
    current.current = next;
    setState(next);
  };
  const act = useCallback(
    (command: Command, message = 'Changes saved') => {
      try {
        if (!actorId) throw new Error('Please sign in.');
        commit(applyCommand(current.current, actorId, command));
        if (message) toast.success(message);
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Unable to save. Please try again.');
        return false;
      }
    },
    [actorId],
  );
  const authenticate = (account: Account | undefined) => {
    if (!account?.active) {
      toast.error('This account is unavailable or has been deactivated.');
      return false;
    }
    if (
      account.module === 'Guest' &&
      !current.current.reservations.some(
        (r) =>
          r.guestId === account.guestId &&
          ['Confirmed', 'Checked in', 'Completed'].includes(r.status),
      )
    ) {
      toast.error('Guest access requires a reservation confirmed by reception.');
      return false;
    }
    commit(applyCommand(current.current, account.id, { type: 'login' }));
    setActorId(account.id);
    toast.success(`Welcome, ${account.name.split(' ')[0]}`);
    return true;
  };
  const login = (email: string, password: string) => {
    const account = current.current.accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!account) {
      toast.error('Email or demo password is incorrect.');
      return false;
    }
    return authenticate(account);
  };
  const switchDemo = (module: Module, role?: Role) =>
    authenticate(
      current.current.accounts.find(
        (a) => a.module === module && (!role || a.role === role) && a.active,
      ),
    );
  const reset = () => {
    const fresh = normalizeState(seed());
    commit(fresh);
    setActorId('manager');
    toast.success('Demo data reset. Your fresh resort workspace is ready.');
  };
  return (
    <StoreContext.Provider
      value={{ s, actor, act, login, switchDemo, logout: () => setActorId(null), reset }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export const useStore = () => useContext(StoreContext);
