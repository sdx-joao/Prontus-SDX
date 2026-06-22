export const colors = {
  primary: '#0728CA',
  primaryDark: '#051E9B',
  primaryForeground: '#FFFFFF',
  background: '#F5F7FB',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#D8E0EF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
};

// Espelha as cores de status da web (globals.css --sdx-status-*)
export const statusColors: Record<string, string> = {
  open: '#60a5fa',
  in_progress: '#facc15',
  waiting: '#fb923c',
  delivered: '#34d399',
  completed: '#34d399',
  cancelled: '#f87171',
};

export const priorityColors: Record<string, string> = {
  low: '#94a3b8',
  normal: '#60a5fa',
  high: '#fb923c',
  urgent: '#f87171',
};
