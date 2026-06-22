import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '../components/Avatar';
import { DetailScaffold, EmptyState, LoadingState, SectionCard } from '../components/ui';
import { T } from '../theme/theme';
import { useAuth } from '../auth/auth-context';
import { getMyProfile, updateMyProfile } from '../api/mobile';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

const ROLE_LABELS: Record<string, string> = {
  SuperAdministrador: 'Super Administrador',
  Admin: 'Administrador',
  Gerente: 'Gerente',
  Colaborador: 'Colaborador',
  User: 'Usuário',
};

function formatCpf(value?: string | null) {
  if (!value) return null;
  const d = String(value).replace(/\D/g, '');
  if (d.length !== 11) return value;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length >= 4) out += `.${d.slice(3, 6)}`;
  if (d.length >= 7) out += `.${d.slice(6, 9)}`;
  if (d.length >= 10) out += `-${d.slice(9, 11)}`;
  return out;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

function Row({ label, value }: { label: string; value?: string | null }) {
  const filled = value != null && String(value).trim().length > 0;
  return (
    <View style={{ paddingVertical: 9 }}>
      <Text style={{ fontSize: 11.5, fontWeight: '600', color: T.muted, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: filled ? T.text : T.faint }}>
        {filled ? value : '—'}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}) {
  return (
    <View style={{ paddingVertical: 7 }}>
      <Text style={{ fontSize: 11.5, fontWeight: '600', color: T.muted, marginBottom: 5 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.faint}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        style={{
          minHeight: 44,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: T.border,
          backgroundColor: T.surface,
          paddingHorizontal: 13,
          fontSize: 14,
          color: T.text,
        }}
      />
    </View>
  );
}

export function MyDataScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const loader = useCallback(() => getMyProfile(token), [token]);
  const { data, loading, refreshing, error, reload } = useResource(loader);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');

  // Hidrata o formulário a partir dos dados do backend.
  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName ?? '');
    setEmail(data.email ?? '');
    setPhone(data.phone ?? '');
    setCpf(formatCpf(data.cpf) ?? '');
  }, [data]);

  const startEdit = useCallback(() => {
    setFormError(null);
    setEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    if (data) {
      setFullName(data.fullName ?? '');
      setEmail(data.email ?? '');
      setPhone(data.phone ?? '');
      setCpf(formatCpf(data.cpf) ?? '');
    }
    setFormError(null);
    setEditing(false);
  }, [data]);

  const save = useCallback(async () => {
    if (saving) return;
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits && cpfDigits.length !== 11) {
      setFormError('CPF deve ter 11 dígitos.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('E-mail inválido.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await updateMyProfile(token, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cpf: cpfDigits,
      });
      setEditing(false);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }, [saving, cpf, email, phone, fullName, token, reload]);

  return (
    <DetailScaffold
      onBack={() => nav.goBack()}
      eyebrow="Perfil"
      title="Meus dados"
      headerExtra={
        data && !editing ? (
          <Pressable onPress={startEdit} style={{ alignSelf: 'flex-start', marginTop: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>Editar</Text>
          </Pressable>
        ) : undefined
      }
      refreshControl={!editing ? <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} colors={[T.primary]} /> : undefined}
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState icon="alert" text={error} />
      ) : !data ? (
        <EmptyState icon="user" text="Sem dados de perfil." />
      ) : editing ? (
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <Avatar name={fullName || data.username} avatarUrl={data.avatarUrl} size={88} radius={26} />
            <Text style={{ fontSize: 11.5, color: T.muted }}>Foto gerenciada no sistema web.</Text>
          </View>
          <SectionCard title="Editar dados">
            <Field label="Nome completo" value={fullName} onChangeText={setFullName} placeholder="Seu nome completo" />
            <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" />
            <Field label="Telefone / Celular" value={phone} onChangeText={setPhone} placeholder="(21) 99999-9999" keyboardType="phone-pad" />
            <Field label="CPF" value={cpf} onChangeText={(v) => setCpf(maskCpf(v))} placeholder="000.000.000-00" keyboardType="numeric" />
          </SectionCard>
          {!!formError && <Text style={{ color: T.danger, fontSize: 12.5, fontWeight: '600' }}>{formError}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={cancelEdit} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 13, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={save} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 13, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Salvar</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <Avatar name={data.fullName || data.username} avatarUrl={data.avatarUrl} size={88} radius={26} />
            <Text style={{ fontSize: 16.5, fontWeight: '800', color: T.text }}>{data.fullName || data.username}</Text>
          </View>
          <SectionCard title="Identificação">
            <Row label="Nome completo" value={data.fullName} />
            <Row label="Usuário" value={data.username} />
            <Row label="Função" value={ROLE_LABELS[data.role] ?? data.role} />
            <Row label="Setor" value={data.department} />
          </SectionCard>
          <SectionCard title="Contato">
            <Row label="E-mail" value={data.email} />
            <Row label="Telefone / Celular" value={data.phone} />
          </SectionCard>
          <SectionCard title="Documentos e conta">
            <Row label="CPF" value={formatCpf(data.cpf)} />
            <Row label="Registrado desde" value={formatDate(data.registeredSince)} />
            <Row label="Impressora de OS" value={data.workOrderPrinterName} />
          </SectionCard>
        </View>
      )}
    </DetailScaffold>
  );
}
