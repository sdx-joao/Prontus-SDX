import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { BlueHeader, SectionCard } from '../components/ui';
import { StatusLegend } from '../components/RecordStatus';
import { useKeyboardHeight } from '../components/use-keyboard-height';
import { T } from '../theme/theme';
import { useAuth } from '../auth/auth-context';
import { getPatient } from '../api/mobile';
import { ApiError } from '../api/client';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APPS = [
  { key: 'surg', label: 'Cirurgias — HO' },
  { key: 'legal', label: 'Jurídico — HO' },
];

function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

function FieldShell({
  icon, focused, valid, children,
}: { icon: string; focused: boolean; valid: boolean; children: ReactNode }) {
  const borderColor = focused ? T.primary : valid ? '#10B981' : T.border;
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14,
        backgroundColor: T.surface, borderRadius: 14, borderWidth: 1.5, borderColor,
      }}
    >
      <Icon name={icon} size={19} color={focused ? T.primary : T.faint} />
      {children}
      {valid && <Icon name="check-circle" size={18} color="#10B981" />}
    </View>
  );
}

export function ProntuariosSearchScreen() {
  const nav = useNavigation<Nav>();
  const { token } = useAuth();
  const [app, setApp] = useState('surg');
  const [pront, setPront] = useState('');
  const [cpf, setCpf] = useState('');
  const [focus, setFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const prontDigits = pront.replace(/\D/g, '');
  const cpfDigits = cpf.replace(/\D/g, '');
  const prontValid = prontDigits.length >= 5;
  const cpfValid = cpfDigits.length === 11;
  const canSearch = prontValid || cpfValid;

  async function submit() {
    if (!canSearch || loading) return;
    const identifier = prontValid ? prontDigits : cpfDigits;
    setLoading(true);
    try {
      const patient = await getPatient(token, identifier);
      nav.navigate('PatientDetail', { patient });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        if (prontValid) {
          nav.navigate('PatientDetail', {
            patient: { prontuario: prontDigits, name: '', cpf: '', isNew: true, surgeries: [] },
          });
        } else {
          Alert.alert('Não encontrado', 'Nenhum paciente encontrado para este CPF.');
        }
      } else {
        Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao buscar o paciente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <BlueHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <Icon name="file-text" size={20} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>Prontuários</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 25, fontWeight: '800', letterSpacing: -0.4 }}>Buscar paciente</Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,.78)', lineHeight: 18 }}>
          Informe o prontuário (≥5 dígitos) ou um CPF válido.
        </Text>
      </BlueHeader>

      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Aplicação */}
          <View style={{ flexDirection: 'row', backgroundColor: T.surfaceMuted, borderRadius: 12, padding: 4, marginBottom: 20 }}>
            {APPS.map((a) => {
              const on = app === a.key;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => setApp(a.key)}
                  style={{
                    flex: 1, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: on ? T.primary : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: on ? '#fff' : T.muted }}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Prontuário */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Prontuário</Text>
          <FieldShell icon="search" focused={focus === 'p'} valid={prontValid && focus !== 'p'}>
            <TextInput
              value={pront}
              onChangeText={(v) => setPront(v.replace(/[^\d]/g, ''))}
              onFocus={() => setFocus('p')}
              onBlur={() => setFocus(null)}
              onSubmitEditing={() => submit()}
              returnKeyType="search"
              blurOnSubmit={false}
              keyboardType="number-pad"
              placeholder="Ex.: 123456"
              placeholderTextColor={T.faint}
              style={{ flex: 1, fontSize: 16, fontWeight: '600', color: T.text, padding: 0 }}
            />
          </FieldShell>

          {/* separador */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: T.faint }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
          </View>

          {/* CPF */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>CPF</Text>
          <FieldShell icon="id-card" focused={focus === 'c'} valid={cpfValid && focus !== 'c'}>
            <TextInput
              value={cpf}
              onChangeText={(v) => setCpf(maskCPF(v))}
              onFocus={() => setFocus('c')}
              onBlur={() => setFocus(null)}
              onSubmitEditing={() => submit()}
              returnKeyType="search"
              blurOnSubmit={false}
              keyboardType="number-pad"
              placeholder="000.000.000-00"
              placeholderTextColor={T.faint}
              style={{ flex: 1, fontSize: 16, fontWeight: '600', color: T.text, padding: 0 }}
            />
          </FieldShell>

          {/* Buscar */}
          <Pressable
            onPress={submit}
            disabled={!canSearch || loading}
            style={{
              marginTop: 24, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 9,
              backgroundColor: canSearch ? T.primary : T.borderStrong,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="search" size={19} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15.5, fontWeight: '700' }}>Buscar</Text>
              </>
            )}
          </Pressable>

          {/* Legenda das cores */}
          <Pressable
            onPress={() => setShowLegend((s) => !s)}
            style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="alert" size={15} color={T.faint} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: T.muted }}>O que significam as cores de status?</Text>
          </Pressable>
          {showLegend && (
            <View style={{ marginTop: 14 }}>
              <SectionCard title="Status do documento">
                <StatusLegend />
              </SectionCard>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
