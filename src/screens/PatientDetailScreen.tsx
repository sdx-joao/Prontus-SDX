import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { DetailScaffold, EmptyState } from '../components/ui';
import { StatusDot, isDocViewable } from '../components/RecordStatus';
import { T } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';
import type { RecordSurgery } from '../api/mobile';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'PatientDetail'>;

function PatientField({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <View style={{ width: full ? '100%' : '48%' }}>
      <Text style={{ fontSize: 10.5, color: T.faint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 14.5, color: T.text, fontWeight: '600', lineHeight: 19 }}>{value || '—'}</Text>
    </View>
  );
}

function SurgeryCard({ s, onOpen }: { s: RecordSurgery; onOpen: (s: RecordSurgery) => void }) {
  const cancelled = s.status === 'cancelled';
  const scheduled = s.status === 'scheduled';
  const viewable = isDocViewable(s);
  return (
    <View
      style={{
        backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14,
        marginBottom: 10, opacity: cancelled ? 0.92 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
        <View style={{ paddingTop: 3 }}>
          <StatusDot surgery={s} size={16} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={13} color={scheduled ? T.primary : T.faint} />
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: scheduled ? T.primary : T.muted }}>
              {scheduled ? `Data Prog. ${s.date || '—'}` : s.date || '—'}
            </Text>
          </View>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: T.text, marginTop: 5, lineHeight: 19 }}>{s.name || '—'}</Text>
          {!!s.specialty && <Text style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{s.specialty}</Text>}
          {cancelled && !!s.cancellationReason && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Icon name="x" size={12} color={T.danger} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: T.danger }}>{s.cancellationReason}</Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: T.surfaceMuted,
        }}
      >
        {s.documentType ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name={s.documentType === 'pdf' ? 'file-text' : 'image'} size={13} color={T.faint} />
            <Text style={{ fontSize: 11.5, color: T.faint, fontWeight: '600' }}>{s.documentType.toUpperCase()}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          onPress={() => viewable && onOpen(s)}
          disabled={!viewable}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 10,
            backgroundColor: viewable ? `${T.primary}14` : T.surfaceMuted,
          }}
        >
          <Icon name="file-text" size={14} color={viewable ? T.primary : T.faint} />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: viewable ? T.primary : T.faint }}>Ver Documento</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PatientDetailScreen() {
  const nav = useNavigation<Nav>();
  const { patient } = useRoute<R>().params;
  const [tab, setTab] = useState<'all' | 'performed' | 'cancelled'>('all');

  const surgeries = patient.surgeries ?? [];
  const performed = useMemo(() => surgeries.filter((s) => s.status !== 'cancelled'), [surgeries]);
  const cancelled = useMemo(() => surgeries.filter((s) => s.status === 'cancelled'), [surgeries]);
  const list = tab === 'all' ? surgeries : tab === 'performed' ? performed : cancelled;

  const initials = patient.name
    ? patient.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
    : '?';

  const openDoc = (s: RecordSurgery) =>
    nav.navigate('DocumentViewer', { surgery: s, patientName: patient.name, prontuario: patient.prontuario });

  return (
    <DetailScaffold
      onBack={() => nav.goBack()}
      eyebrow={`Prontuário ${patient.prontuario}`}
      title={patient.isNew ? 'Paciente não cadastrado' : patient.name || 'Paciente'}
      compact
    >
      {patient.isNew ? (
        <View style={{ borderWidth: 1.5, borderColor: '#D9A441', borderStyle: 'dashed', backgroundColor: '#FEF7E6', borderRadius: 16, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#FBEBC6', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="user" size={26} color="#B45309" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#92500E' }}>Paciente não encontrado</Text>
          <Text style={{ marginTop: 7, fontSize: 13, color: '#A16207', textAlign: 'center', lineHeight: 19 }}>
            O prontuário {patient.prontuario} ainda não está cadastrado no sistema.
          </Text>
        </View>
      ) : (
        <>
          {/* Cartão do paciente */}
          <View style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <View style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: `${T.primary}0d`, borderWidth: 2, borderColor: `${T.primary}33`, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: T.primary }}>{initials}</Text>
              </View>
              {!!patient.barcodeBase && (
                <Text style={{ marginTop: 9, fontSize: 12, fontStyle: 'italic', color: '#B7861F', fontWeight: '600', letterSpacing: 0.4 }}>{patient.barcodeBase}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <PatientField label="Nome Completo" value={patient.name} full />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
              <PatientField label="Idade" value={patient.age != null ? `${patient.age} anos` : undefined} />
              <PatientField label="Nascimento" value={patient.birthDate} />
              <PatientField label="CPF" value={patient.cpf} />
              <PatientField label="Tipo Sanguíneo" value={patient.bloodType} />
              <PatientField label="Prontuário" value={patient.prontuario} />
              <PatientField label="CEP" value={patient.cep} />
              <PatientField label="Cartão SUS" value={patient.susNumber} full />
              <PatientField label="Endereço" value={patient.address} full />
            </View>
          </View>

          {/* Histórico de cirurgias */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: T.text, letterSpacing: -0.2 }}>Histórico de Cirurgias</Text>
            <Text style={{ fontSize: 12, color: T.muted }}>{surgeries.length} registro{surgeries.length === 1 ? '' : 's'}</Text>
          </View>

          {surgeries.length === 0 ? (
            <EmptyState icon="file-text" text="Nenhuma cirurgia registrada para este paciente." />
          ) : (
            <>
              <View style={{ flexDirection: 'row', backgroundColor: T.surfaceMuted, borderRadius: 11, padding: 4, marginBottom: 14 }}>
                {([
                  ['all', 'Todas', surgeries.length],
                  ['performed', 'Realizadas', performed.length],
                  ['cancelled', 'Canceladas', cancelled.length],
                ] as const).map(([key, label, count]) => {
                  const on = tab === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setTab(key)}
                      style={{ flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, backgroundColor: on ? T.primary : 'transparent' }}
                    >
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: on ? '#fff' : T.muted }}>{label}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: on ? 'rgba(255,255,255,.85)' : T.faint }}>{count}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {list.map((s) => (
                <SurgeryCard key={s.id} s={s} onOpen={openDoc} />
              ))}
            </>
          )}
        </>
      )}
    </DetailScaffold>
  );
}
