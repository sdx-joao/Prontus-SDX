import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { T } from '../theme/theme';
import type { RecordSurgery } from '../api/mobile';

// Linguagem visual de status de documento ("as bolinhas") — replicar fielmente.
export const DOC_STATUS: Record<string, { label: string; color: string; ring: string; soft: string }> = {
  available: { label: 'Documento disponível', color: '#10B981', ring: '#059669', soft: '#E7F8F0' },
  processing: { label: 'Em processamento', color: '#3B82F6', ring: '#2563EB', soft: '#E9F1FE' },
  altered: { label: 'Informação alterada', color: '#EAB308', ring: '#CA8A04', soft: '#FBF4DC' },
  missing_info: { label: 'Faltando páginas/info', color: '#F97316', ring: '#EA580C', soft: '#FEEEE1' },
  absent: { label: 'Documento ausente', color: '#EF4444', ring: '#DC2626', soft: '#FDECEC' },
  reported: { label: 'Reportado com problema', color: '#EAB308', ring: '#CA8A04', soft: '#FBF4DC' },
};

export function statusKey(surgery: RecordSurgery): string {
  if (surgery.isReported) return 'reported';
  return surgery.documentStatus ?? 'absent';
}

export function isDocViewable(surgery: RecordSurgery): boolean {
  const key = statusKey(surgery);
  return key === 'available' || key === 'altered' || key === 'missing_info';
}

export function StatusDot({ surgery, size = 16 }: { surgery: RecordSurgery; size?: number }) {
  const key = statusKey(surgery);
  const s = DOC_STATUS[key] ?? DOC_STATUS.absent;
  if (key === 'reported') {
    return <Icon name="alert" size={size + 3} color={s.color} />;
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: s.color, borderWidth: 2, borderColor: s.ring,
      }}
    />
  );
}

export function StatusLegend() {
  const items = ['available', 'processing', 'altered', 'missing_info', 'absent', 'reported'];
  return (
    <View style={{ gap: 10 }}>
      {items.map((k) => {
        const s = DOC_STATUS[k];
        return (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {k === 'reported' ? (
              <Icon name="alert" size={16} color={s.color} />
            ) : (
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: s.color, borderWidth: 2, borderColor: s.ring }} />
            )}
            <Text style={{ fontSize: 12.5, color: T.textSoft }}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
