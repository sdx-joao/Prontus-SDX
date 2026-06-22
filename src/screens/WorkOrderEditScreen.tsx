import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { DetailScaffold, EmptyState, FieldLabel, LoadingState, PrimaryButton, SectionCard } from '../components/ui';
import { SuggestedInput } from '../components/SuggestedInput';
import { RequesterPicker } from '../components/RequesterPicker';
import { T, WO_PRIORITY, WO_RESOLUTION, WO_STATUS } from '../theme/theme';
import {
  getOptions,
  getWorkOrder,
  getWorkOrderRequesters,
  updateWorkOrder,
  type SelectOption,
  type SelectOptionKind,
  type WorkOrderRequester,
} from '../api/mobile';
import { useResource } from '../api/use-resource';
import { useAuth } from '../auth/auth-context';
import type { WorkOrder, WorkOrderMaterial, WorkOrderPriority, WorkOrderResolution, WorkOrderStatus } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';

const EDITABLE_STATUS: WorkOrderStatus[] = ['open', 'in_progress', 'waiting'];
const COMPLETION_PERIOD_OPTIONS = [
  { hours: 1, label: '1h' },
  { hours: 2, label: '2h' },
  { hours: 4, label: '4h' },
  { hours: 8, label: '8h' },
  { hours: 24, label: '24h' },
];
const OPTION_KINDS: SelectOptionKind[] = [
  'work_order_service_type',
  'work_order_category',
  'work_order_unit',
  'work_order_department',
  'work_order_technical_team',
  'work_order_responsible_technician',
  'work_order_material',
  'work_order_material_unit',
];

type MaterialDraft = {
  description: string;
  quantity: string;
  unit: string;
};

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={T.faint}
      multiline={multiline}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={{
        minHeight: multiline ? 92 : 44,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: T.border,
        backgroundColor: T.surface,
        paddingHorizontal: 13,
        paddingVertical: multiline ? 11 : 0,
        fontSize: 14,
        color: T.text,
      }}
    />
  );
}

function materialToDraft(material: WorkOrderMaterial): MaterialDraft {
  return {
    description: material.description,
    quantity: String(material.quantity || 1),
    unit: material.unit || '',
  };
}

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy, hh, min] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Formata progressivamente enquanto o usuário digita só os números: DD/MM/AAAA HH:mm
function maskDateTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i === 2 || i === 4) out += '/';
    else if (i === 8) out += ' ';
    else if (i === 10) out += ':';
    out += digits[i];
  }
  return out;
}

function isClosedStatus(status: WorkOrderStatus) {
  return status === 'completed' || status === 'delivered' || status === 'cancelled';
}

function isDeliveryOrCollectionService(value: string) {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return normalized.includes('ENTREGA') || normalized.includes('COLETA') || normalized.includes('TRANSPORTE');
}

export function WorkOrderEditScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WorkOrderEdit'>>();
  const { token } = useAuth();
  const loader = useCallback(async () => {
    const [detail, options, requesters] = await Promise.all([
      getWorkOrder(token, route.params.id),
      getOptions(token, OPTION_KINDS),
      getWorkOrderRequesters(token),
    ]);
    return { detail, options, requesters };
  }, [token, route.params.id]);
  const { data, loading, error } = useResource(loader);
  const order = data?.detail.workOrder;
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [category, setCategory] = useState('');
  const [unitName, setUnitName] = useState('');
  const [department, setDepartment] = useState('');
  const [technicalTeam, setTechnicalTeam] = useState('');
  const [responsibleTechnicianName, setResponsibleTechnicianName] = useState('');
  const [requestedByName, setRequestedByName] = useState('');
  const [requesterContact, setRequesterContact] = useState('');
  const [technicianRequest, setTechnicianRequest] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus>('open');
  const [expectedCompletionAt, setExpectedCompletionAt] = useState<string | null>(null);
  const [finishedAtText, setFinishedAtText] = useState('');
  const [attendanceNotesRequired, setAttendanceNotesRequired] = useState(true);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<WorkOrderResolution | null>(null);
  const [priority, setPriority] = useState<WorkOrderPriority>('normal');
  const [materials, setMaterials] = useState<MaterialDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const optionsByKind = useMemo(() => {
    const grouped = new Map<SelectOptionKind, SelectOption[]>();
    for (const option of data?.options ?? []) {
      const current = grouped.get(option.kind) ?? [];
      current.push(option);
      grouped.set(option.kind, current);
    }
    return grouped;
  }, [data?.options]);

  useEffect(() => {
    if (!order || hydratedId === order.id) return;
    setHydratedId(order.id);
    setServiceType(order.serviceType || '');
    setCategory(order.category || '');
    setUnitName(order.unitName || '');
    setDepartment(order.department || '');
    setTechnicalTeam(order.technicalTeam || '');
    setResponsibleTechnicianName(order.responsibleTechnicianName || '');
    setRequestedByName(order.requestedByName || '');
    setRequesterContact(order.requesterContact || '');
    setTechnicianRequest(order.technicianRequest || '');
    setStatus(isClosedStatus(order.status) ? order.status : order.status || 'open');
    setExpectedCompletionAt(order.expectedCompletionAt || null);
    setFinishedAtText(toDateTimeInput(order.finishedAt));
    setAttendanceNotesRequired(Boolean(order.attendanceNotes));
    setAttendanceNotes(order.attendanceNotes || '');
    setResolutionNotes(order.resolutionNotes || '');
    setResolutionStatus(order.resolutionStatus || null);
    setPriority(order.priority || 'normal');
    setMaterials((order.materials || []).map(materialToDraft));
  }, [hydratedId, order]);

  if (loading) {
    return (
      <DetailScaffold onBack={() => nav.goBack()} title="Carregando edição">
        <LoadingState />
      </DetailScaffold>
    );
  }

  if (error || !order) {
    return (
      <DetailScaffold onBack={() => nav.goBack()} title="Editar OS">
        <EmptyState icon="clipboard" text={error || 'Ordem de serviço não encontrada.'} />
      </DetailScaffold>
    );
  }

  const setMaterial = (index: number, patch: Partial<MaterialDraft>) => {
    setMaterials(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const addMaterial = () => setMaterials(current => [...current, { description: '', quantity: '1', unit: 'UN' }]);
  const removeMaterial = (index: number) => setMaterials(current => current.filter((_, itemIndex) => itemIndex !== index));
  const locked = isClosedStatus(order.status);
  const canEditStatus = !locked;
  const pickRequester = (requester: WorkOrderRequester) => {
    setRequestedByName(requester.name);
    if (requester.department) setDepartment(requester.department);
    if (requester.phone) setRequesterContact(requester.phone);
  };

  const save = async () => {
    const parsedFinishedAt = fromDateTimeInput(finishedAtText);
    if (finishedAtText.trim() && parsedFinishedAt === undefined) {
      setFormError('Informe a hora final no formato DD/MM/AAAA HH:mm.');
      return;
    }
    const missing = [
      ['Tipo de serviço', serviceType],
      ['Categoria', category],
      ['Unidade', unitName],
      ['Setor', department],
      ['Solicitante', requestedByName],
      ['Solicitação', technicianRequest],
      ['Situação da OS', resolutionStatus],
    ].filter(([, value]) => !String(value).trim()).map(([label]) => label);
    if (status === 'in_progress' && !expectedCompletionAt) {
      missing.push('Prazo de conclusão');
    }
    if (resolutionStatus === 'resolved') {
      [
        ['Contato', requesterContact],
        ['Equipe técnica', technicalTeam],
        ['Técnico responsável', responsibleTechnicianName],
        ...(attendanceNotesRequired ? [['Observação do atendimento', attendanceNotes] as [string, unknown]] : []),
        ['Solução adotada', resolutionNotes],
      ]
        .filter(([, value]) => !String(value || '').trim())
        .forEach(([label]) => missing.push(label));
    }
    if (missing.length) {
      setFormError(`Preencha: ${missing.join(', ')}.`);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const shouldFinalizeWithSignature = resolutionStatus === 'resolved' && !isClosedStatus(order.status);
      const finalStatus: WorkOrderStatus = isDeliveryOrCollectionService(serviceType) ? 'delivered' : 'completed';
      await updateWorkOrder(token, order.id, {
        status: shouldFinalizeWithSignature ? order.status : status,
        serviceType,
        category,
        unitName,
        department,
        requestedByName,
        requesterContact,
        technicalTeam,
        responsibleTechnicianName,
        technicianRequest,
        attendanceNotes: attendanceNotesRequired ? attendanceNotes : '',
        attendanceNotesRequired,
        resolutionStatus,
        resolutionNotes,
        priority,
        expectedCompletionAt: status === 'in_progress' ? expectedCompletionAt : null,
        finishedAt: parsedFinishedAt,
        materials: materials
          .filter(item => item.description.trim())
          .map(item => ({
            description: item.description,
            quantity: Number(item.quantity.replace(',', '.')) || 1,
            unit: item.unit || null,
          })),
      });
      if (shouldFinalizeWithSignature) {
        nav.replace('WorkOrderSignature', { id: order.id, status: finalStatus, signerName: requestedByName });
        return;
      }
      Alert.alert('OS atualizada', `${order.code} foi salva com sucesso.`);
      nav.goBack();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível salvar a OS.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailScaffold onBack={() => nav.goBack()} eyebrow={order.code} title="Editar OS" compact>
      {locked && (
        <SectionCard title="Somente leitura">
          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
            <Icon name="alert" size={17} color={T.danger} />
            <Text style={{ flex: 1, color: T.textSoft, fontSize: 12.5, lineHeight: 18 }}>
              Esta OS já foi fechada e não pode mais ser editada.
            </Text>
          </View>
        </SectionCard>
      )}

      <SectionCard title="Fluxo">
        <View style={{ gap: 13 }}>
          <View>
            <FieldLabel>Status</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(locked ? [order.status] : EDITABLE_STATUS).map(item => {
                const meta = WO_STATUS[item];
                const active = status === item;
                return (
                  <Pressable
                    key={item}
                    disabled={!canEditStatus}
                    onPress={() => {
                      setStatus(item);
                      if (item === 'in_progress' && !expectedCompletionAt) setExpectedCompletionAt(addHours(4));
                      if (item !== 'in_progress') setExpectedCompletionAt(null);
                    }}
                    style={{
                      minHeight: 38,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: active ? meta.solid : T.border,
                      backgroundColor: active ? meta.soft : T.surface,
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                      opacity: canEditStatus ? 1 : 0.72,
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? meta.fg : T.muted }}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {status === 'in_progress' && (
            <View>
              <FieldLabel required>Prazo de conclusão</FieldLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
                {COMPLETION_PERIOD_OPTIONS.map(option => (
                  <Pressable
                    key={option.hours}
                    onPress={() => setExpectedCompletionAt(addHours(option.hours))}
                    style={{
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.surfaceMuted,
                    }}
                  >
                    <Text style={{ color: T.primary, fontSize: 12, fontWeight: '800' }}>+ {option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={{ marginTop: 7, fontSize: 12, color: T.muted }}>
                {expectedCompletionAt ? `Até ${toDateTimeInput(expectedCompletionAt)}` : 'Selecione um prazo.'}
              </Text>
            </View>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Identificação">
        <View style={{ gap: 14 }}>
          <SuggestedInput label="Tipo de serviço" required value={serviceType} onChangeText={setServiceType} placeholder="Tipo" options={optionsByKind.get('work_order_service_type') ?? []} />
          <SuggestedInput label="Categoria" required value={category} onChangeText={setCategory} placeholder="Categoria" options={optionsByKind.get('work_order_category') ?? []} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><SuggestedInput label="Unidade" required value={unitName} onChangeText={setUnitName} placeholder="Unidade" options={optionsByKind.get('work_order_unit') ?? []} /></View>
            <View style={{ flex: 1 }}><SuggestedInput label="Setor" required value={department} onChangeText={setDepartment} placeholder="Setor" options={optionsByKind.get('work_order_department') ?? []} /></View>
          </View>
          <SuggestedInput label="Equipe técnica" value={technicalTeam} onChangeText={setTechnicalTeam} placeholder="Equipe" options={optionsByKind.get('work_order_technical_team') ?? []} />
          <SuggestedInput label="Técnico responsável" value={responsibleTechnicianName} onChangeText={setResponsibleTechnicianName} placeholder="Responsável" options={optionsByKind.get('work_order_responsible_technician') ?? []} />
        </View>
      </SectionCard>

      <SectionCard title="Prioridade">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Object.entries(WO_PRIORITY).map(([key, meta]) => {
            const active = priority === key;
            return (
              <Pressable
                key={key}
                onPress={() => setPriority(key as WorkOrderPriority)}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 11,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  borderColor: active ? meta.color : T.border,
                  backgroundColor: active ? meta.soft : T.surface,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? meta.color : T.muted }}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Situação da OS">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(Object.entries(WO_RESOLUTION) as Array<[WorkOrderResolution, { label: string; color: string; soft: string }]>).map(([key, meta]) => {
            const active = resolutionStatus === key;
            return (
              <Pressable
                key={key}
                onPress={() => setResolutionStatus(active ? null : key)}
                style={{
                  flex: 1,
                  minHeight: 42,
                  borderRadius: 11,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  borderColor: active ? meta.color : T.border,
                  backgroundColor: active ? meta.soft : T.surface,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: active ? meta.color : T.muted, textAlign: 'center' }}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Solicitante e atendimento">
        <View style={{ gap: 14 }}>
          <RequesterPicker
            value={requestedByName}
            department={department}
            requesters={data?.requesters ?? []}
            onPick={pickRequester}
          />
          <View><FieldLabel>Contato</FieldLabel><Input value={requesterContact} onChangeText={setRequesterContact} placeholder="Contato" /></View>
          <View><FieldLabel required>Solicitação</FieldLabel><Input value={technicianRequest} onChangeText={setTechnicianRequest} placeholder="Descrição da solicitação" multiline /></View>
          <Pressable
            onPress={() => {
              setAttendanceNotesRequired(current => !current);
              if (attendanceNotesRequired) setAttendanceNotes('');
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                borderWidth: 1.5,
                borderColor: attendanceNotesRequired ? T.primary : T.border,
                backgroundColor: attendanceNotesRequired ? T.primary : T.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {attendanceNotesRequired && <Icon name="check" size={14} color="#fff" />}
            </View>
            <Text style={{ color: T.textSoft, fontSize: 12.5, fontWeight: '600' }}>Informar observação do atendimento</Text>
          </Pressable>
          {attendanceNotesRequired ? (
            <View><FieldLabel>Observação do atendimento</FieldLabel><Input value={attendanceNotes} onChangeText={setAttendanceNotes} placeholder="Anotações do atendimento" multiline /></View>
          ) : (
            <Text style={{ color: T.muted, fontSize: 12.5 }}>Sem observação registrada para esta OS.</Text>
          )}
          <View><FieldLabel>Solução adotada</FieldLabel><Input value={resolutionNotes} onChangeText={setResolutionNotes} placeholder="Solução executada" multiline /></View>
          <View>
            <FieldLabel>Hora final</FieldLabel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={finishedAtText}
                  onChangeText={(value) => setFinishedAtText(maskDateTimeInput(value))}
                  placeholder="DD/MM/AAAA HH:mm"
                  keyboardType="numeric"
                />
              </View>
              <Pressable
                onPress={() => setFinishedAtText(toDateTimeInput(new Date().toISOString()))}
                hitSlop={8}
                style={{ height: 44, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1, borderColor: T.primary, backgroundColor: `${T.primary}12`, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: T.primary, fontSize: 12.5, fontWeight: '700' }}>Agora</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        title={`Materiais (${materials.length})`}
        action={<Pressable onPress={addMaterial} hitSlop={8}><Text style={{ color: T.primary, fontSize: 12.5, fontWeight: '700' }}>Adicionar</Text></Pressable>}
      >
        <View style={{ gap: 12 }}>
          {materials.length === 0 && <Text style={{ fontSize: 12.5, color: T.muted }}>Nenhum material informado.</Text>}
          {materials.map((material, index) => (
            <View key={index} style={{ borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 10, gap: 9 }}>
              <SuggestedInput label="Material" value={material.description} onChangeText={(value) => setMaterial(index, { description: value })} placeholder="Descrição" options={optionsByKind.get('work_order_material') ?? []} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Quantidade</FieldLabel>
                  <Input value={material.quantity} onChangeText={(value) => setMaterial(index, { quantity: value })} placeholder="1" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <SuggestedInput label="Unidade" value={material.unit} onChangeText={(value) => setMaterial(index, { unit: value })} placeholder="UN" options={optionsByKind.get('work_order_material_unit') ?? []} />
                </View>
              </View>
              <Pressable onPress={() => removeMaterial(index)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="trash" size={14} color={T.danger} />
                <Text style={{ color: T.danger, fontSize: 12.5, fontWeight: '700' }}>Remover material</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </SectionCard>

      {!locked && (
        <SectionCard title="Fotos">
          <Text style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Capture fotos do atendimento. Elas aparecem nos anexos da OS.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([
              ['before', 'Foto antes'],
              ['after', 'Foto depois'],
              ['general', 'Foto geral'],
            ] as Array<['before' | 'after' | 'general', string]>).map(([category, label]) => (
              <Pressable
                key={category}
                onPress={() => nav.navigate('WorkOrderAttachmentCapture', { id: order.id, category })}
                style={{ flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: T.primary, backgroundColor: `${T.primary}10`, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
              >
                <Text style={{ color: T.primary, fontSize: 11.5, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      )}

      {!!formError && <Text style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{formError}</Text>}
      {locked ? null : saving ? (
        <View style={{ height: 50, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T.primary} />
        </View>
      ) : (
        <PrimaryButton label={resolutionStatus === 'resolved' ? 'Salvar e assinar' : 'Salvar alterações'} icon="check" onPress={save} />
      )}
      <View style={{ height: 12 }} />
    </DetailScaffold>
  );
}
