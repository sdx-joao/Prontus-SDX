import { API_BASE_URL, ApiError, IS_TEST_BUILD, apiFetch } from './client';
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus, InventoryItem, Movement, TimelineEvent } from '../data/mock';
import type { MobileUser } from '../auth/types';

export type Summary = {
  workOrders: { activeNow: number; openedToday: number };
  inventory: { totalItems: number; lowStock: number; equipment: number; inMaintenance: number };
};

export type SelectOptionKind =
  | 'work_order_service_type'
  | 'work_order_category'
  | 'work_order_unit'
  | 'work_order_department'
  | 'work_order_technical_team'
  | 'work_order_responsible_technician'
  | 'work_order_material'
  | 'work_order_material_unit';

export type SelectOption = {
  kind: SelectOptionKind;
  value: string;
  label: string;
  sortOrder?: number;
};

export type WorkOrderRequester = {
  id: string;
  source: 'user' | 'catalog';
  name: string;
  department: string | null;
  phone: string | null;
  linkedUserId: string | null;
};

export type WorkOrderAttachmentCategory = 'before' | 'after' | 'document' | 'general';

export type WorkOrderAttachment = {
  id: string;
  workOrderId: string;
  category: WorkOrderAttachmentCategory;
  comment: string | null;
  originalFileName: string | null;
  mimeType: string;
  fileSize: number;
  uploadedByName: string | null;
  createdAt: string;
  url: string;
};

export function getSummary(token: string | null) {
  return apiFetch<Summary>('/api/mobile/summary', { token });
}

/** Dados completos do perfil do usuário logado (fonte de verdade: backend). */
export function getMyProfile(token: string | null) {
  return apiFetch<MobileUser>('/api/mobile/me', { token });
}

/** Atualiza os próprios dados de contato (espelha a edição do perfil web). */
export function updateMyProfile(
  token: string | null,
  fields: { fullName?: string; email?: string; phone?: string; cpf?: string },
) {
  return apiFetch<{ ok: true }>('/api/mobile/me', { method: 'PATCH', token, body: fields });
}

export type AppNotification = {
  id: string;
  type: 'os_moved' | 'os_assigned' | 'os_escalated' | 'os_new_in_department' | string;
  workOrderId: string | null;
  workOrderCode: string | null;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string | null;
};

export function getNotifications(token: string | null) {
  return apiFetch<{ notifications: AppNotification[]; unreadCount: number }>(
    '/api/mobile/notifications',
    { token },
  );
}

export function markNotificationsRead(token: string | null, ids?: string[]) {
  return apiFetch<{ ok: true }>('/api/mobile/notifications', {
    method: 'POST',
    token,
    body: ids && ids.length ? { ids } : {},
  });
}

export async function getWorkOrders(
  token: string | null,
  opts: { status?: string; q?: string } = {},
): Promise<WorkOrder[]> {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== 'all') params.set('status', opts.status);
  if (opts.q) params.set('q', opts.q);
  const qs = params.toString();
  const res = await apiFetch<{ orders: WorkOrder[] }>(`/api/mobile/work-orders${qs ? `?${qs}` : ''}`, { token });
  return res.orders ?? [];
}

export function getWorkOrder(token: string | null, id: string) {
  return apiFetch<{ workOrder: WorkOrder; timeline: TimelineEvent[] }>(`/api/mobile/work-orders/${id}`, { token });
}

export async function getWorkOrderAttachments(token: string | null, id: string): Promise<WorkOrderAttachment[]> {
  const res = await apiFetch<{ attachments: WorkOrderAttachment[] }>(`/api/mobile/work-orders/${id}/attachments`, { token });
  return res.attachments ?? [];
}

export type CreateWorkOrderInput = {
  serviceType: string;
  category: string;
  unitName: string;
  department: string;
  requestedByName: string;
  requesterContact?: string;
  technicalTeam?: string;
  responsibleTechnicianName?: string;
  technicianRequest: string;
  priority: WorkOrderPriority;
};

export type UpdateWorkOrderInput = Partial<CreateWorkOrderInput> & {
  status?: WorkOrderStatus;
  attendanceNotes?: string | null;
  attendanceNotesRequired?: boolean;
  resolutionStatus?: WorkOrder['resolutionStatus'];
  resolutionNotes?: string | null;
  expectedCompletionAt?: string | null;
  expectedCompletionHours?: number;
  finishedAt?: string | null;
  materials?: WorkOrder['materials'];
};

export function createWorkOrder(token: string | null, input: CreateWorkOrderInput) {
  return apiFetch<{ id: string; code: string }>('/api/mobile/work-orders', {
    method: 'POST',
    token,
    body: input,
  });
}

export function updateWorkOrder(token: string | null, id: string, input: UpdateWorkOrderInput) {
  return apiFetch<{ ok: true; printRequested?: boolean }>(`/api/mobile/work-orders/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function updateWorkOrderStatus(
  token: string | null,
  id: string,
  status: WorkOrderStatus,
  opts: {
    expectedCompletionHours?: number;
    signatureDataUrl?: string;
    signerName?: string;
    resolutionNotes?: string;
  } = {},
) {
  return apiFetch<{ ok: true; printRequested?: boolean }>(`/api/mobile/work-orders/${id}`, {
    method: 'PATCH',
    token,
    body: { status, ...opts },
  });
}

export async function uploadWorkOrderAttachment(
  token: string | null,
  id: string,
  input: {
    uri: string;
    name: string;
    type: string;
    category: WorkOrderAttachmentCategory;
    comment?: string;
  },
) {
  const form = new FormData();
  form.append('category', input.category);
  if (input.comment) form.append('comment', input.comment);
  if (IS_TEST_BUILD && input.type.startsWith('image/')) {
    form.append('retentionTag', 'test-photo-4h');
  }
  form.append('file', {
    uri: input.uri,
    name: input.name,
    type: input.type,
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/api/mobile/work-orders/${id}/attachments`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((payload && (payload.message || payload.error)) || `Erro ${res.status}`, res.status, payload?.code);
  }
  return payload as { message: string; attachmentId: string };
}

export async function getOptions(token: string | null, kinds: SelectOptionKind[]) {
  const qs = kinds.map(encodeURIComponent).join(',');
  const res = await apiFetch<{ options: SelectOption[] }>(`/api/mobile/options?kinds=${qs}`, { token });
  return res.options ?? [];
}

export async function getWorkOrderRequesters(token: string | null): Promise<WorkOrderRequester[]> {
  const res = await apiFetch<{ requesters: WorkOrderRequester[] }>('/api/mobile/work-orders/requesters', { token });
  return res.requesters ?? [];
}

// Busca todos os itens (filtro por primaryType é feito client-side, pois o
// backend só distingue consumable|equipment).
export async function getInventory(
  token: string | null,
  opts: { q?: string } = {},
): Promise<InventoryItem[]> {
  const qs = opts.q ? `?q=${encodeURIComponent(opts.q)}` : '';
  const res = await apiFetch<{ items: InventoryItem[] }>(`/api/mobile/inventory${qs}`, { token });
  return res.items ?? [];
}

export function getInventoryItem(token: string | null, id: string) {
  return apiFetch<{ item: InventoryItem; movements: Movement[] }>(`/api/mobile/inventory/${id}`, { token });
}

export function resolveAsset(token: string | null, code: string) {
  return apiFetch<{ item: InventoryItem; movements: Movement[] }>(
    `/api/mobile/inventory/assets/${encodeURIComponent(code)}`,
    { token },
  );
}

// ── Prontuários (Records) ────────────────────────────────────────────────────

export type DocumentStatus = 'available' | 'processing' | 'altered' | 'missing_info' | 'absent';

export type RecordSurgery = {
  id: string;
  date: string;
  name: string;
  specialty?: string;
  physician?: string;
  notes?: string;
  status: 'performed' | 'cancelled' | 'scheduled';
  cancellationReason?: string;
  documentType?: 'pdf' | 'image';
  documentUrl?: string | string[] | null;
  documentStatus?: DocumentStatus;
  isReported?: boolean;
  isFromFileServer?: boolean;
};

export type RecordPatient = {
  id?: string;
  prontuario: string;
  name: string;
  age?: number;
  birthDate?: string;
  cpf: string;
  susNumber?: string;
  bloodType?: string;
  cep?: string;
  address?: string;
  photoUrl?: string;
  barcodeBase?: string;
  isNew?: boolean;
  surgeries?: RecordSurgery[];
};

/**
 * Busca um paciente por prontuário (≥5 dígitos) ou CPF (11 dígitos).
 * Backend: GET /api/mobile/patients/[identifier] — mesma regra de vínculo de
 * documentos da web (reaproveita os helpers do GET de pacientes).
 * 404 vira ApiError(status 404) — a tela trata como "não encontrado".
 */
export function getPatient(token: string | null, identifier: string) {
  return apiFetch<RecordPatient>(
    `/api/mobile/patients/${encodeURIComponent(identifier)}`,
    { token },
  );
}
