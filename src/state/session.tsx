import { createContext, useContext } from 'react';

// Sessão da demo (UX). Será substituída pelo AuthProvider real na fase de backend.
export type SessionValue = {
  user: { name: string; dept: string; unit: string; role: string; username: string };
  signOut: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve ser usado dentro de SessionContext.Provider');
  return ctx;
}
