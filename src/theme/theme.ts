// ScandexPRO Mobile — Design tokens
// Fonte de verdade do visual. Portado de:
//   design/scandexplus-mobile-design-system/export/scandex-mobile-concept/mobile/ui.jsx
//   (que por sua vez deriva de ScandexGed/src/app/globals.css)

export const T = {
  primary: '#0728CA',
  primaryDark: '#051E9B',
  primaryFg: '#FFFFFF',
  teal: '#0F9488',
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5FB',
  text: '#0F172A',
  textSoft: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F2',
  borderStrong: '#D8E0EF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
} as const;

export type Tone = { label: string; solid: string; soft: string; fg: string };

// Ordens de Serviço — status
export const WO_STATUS: Record<string, Tone> = {
  open: { label: 'Aberta', solid: '#2563EB', soft: '#EAF1FE', fg: '#1D4ED8' },
  in_progress: { label: 'Em andamento', solid: '#CA8A04', soft: '#FEF7E0', fg: '#A16207' },
  waiting: { label: 'Aguardando', solid: '#EA580C', soft: '#FEEFE4', fg: '#C2410C' },
  delivered: { label: 'Entregue', solid: '#059669', soft: '#E6F6EF', fg: '#047857' },
  completed: { label: 'Concluída', solid: '#059669', soft: '#E6F6EF', fg: '#047857' },
  cancelled: { label: 'Cancelada', solid: '#DC2626', soft: '#FDECEC', fg: '#B91C1C' },
};

export const WO_PRIORITY: Record<string, { label: string; color: string; soft: string }> = {
  low: { label: 'Baixa', color: '#64748B', soft: '#EEF2F7' },
  normal: { label: 'Normal', color: '#2563EB', soft: '#EAF1FE' },
  high: { label: 'Alta', color: '#EA580C', soft: '#FEEFE4' },
  urgent: { label: 'Urgente', color: '#DC2626', soft: '#FDECEC' },
};

export const WO_RESOLUTION: Record<string, { label: string; color: string; soft: string }> = {
  resolved: { label: 'Resolvida', color: '#059669', soft: '#E6F6EF' },
  partial: { label: 'Parcial', color: '#CA8A04', soft: '#FEF7E0' },
  unresolved: { label: 'Não resolvida', color: '#DC2626', soft: '#FDECEC' },
};

// Inventário — tipos principais
export const INV_TYPE: Record<string, { label: string; short: string; icon: string }> = {
  EQUIPAMENTO: { label: 'Equipamento', short: 'Equip.', icon: 'monitor' },
  PERIFERICO: { label: 'Periférico', short: 'Perif.', icon: 'mouse' },
  FERRAMENTA: { label: 'Ferramenta', short: 'Ferr.', icon: 'wrench' },
  MATERIAL: { label: 'Material', short: 'Mat.', icon: 'cable' },
  SUPRIMENTO: { label: 'Suprimento', short: 'Supr.', icon: 'package' },
};

// Estoque / equipamento — tons de status
export const STOCK_TONE: Record<string, Tone> = {
  funcionando: { label: 'Funcionando', solid: '#2563EB', soft: '#EAF1FE', fg: '#1D4ED8' },
  manutencao: { label: 'Manutenção', solid: '#CA8A04', soft: '#FEF7E0', fg: '#A16207' },
  defeito: { label: 'Não funcionando', solid: '#DC2626', soft: '#FDECEC', fg: '#B91C1C' },
  baixado: { label: 'Baixado', solid: '#64748B', soft: '#EEF2F7', fg: '#475569' },
  normal: { label: 'Normal', solid: '#059669', soft: '#E6F6EF', fg: '#047857' },
  atencao: { label: 'Atenção', solid: '#CA8A04', soft: '#FEF7E0', fg: '#A16207' },
  baixo: { label: 'Baixo', solid: '#DC2626', soft: '#FDECEC', fg: '#B91C1C' },
};

export const MOVE_TONE: Record<string, { label: string; color: string; icon: string }> = {
  in: { label: 'Entrada', color: '#059669', icon: 'arrow-down-circle' },
  out: { label: 'Saída', color: '#DC2626', icon: 'arrow-up-circle' },
  adjustment: { label: 'Ajuste', color: '#CA8A04', icon: 'refresh' },
  transfer: { label: 'Transferência', color: '#2563EB', icon: 'shuffle' },
};

// accent padrão (do TWEAK_DEFAULTS do conceito)
export const ACCENT = T.primary;
