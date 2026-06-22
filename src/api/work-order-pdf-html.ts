// Monta o HTML da OS IDÊNTICO ao da impressão de produção
// (src/app/(authenticated)/work-orders/[id]/print/page.tsx), para gerar o PDF
// no app (expo-print) no ambiente de teste. CSS e estrutura portados 1:1 da
// página de impressão (página principal — anexos/fotos ficam fora do escopo).

import type { TimelineEvent, WorkOrder, WorkOrderPriority, WorkOrderResolution, WorkOrderStatus } from '../data/mock';

const NA = 'Não se aplica';

type Tone = { fg: string; bg: string; border: string };

const statusLabel: Record<WorkOrderStatus, string> = {
  open: 'Aberta', in_progress: 'Em andamento', waiting: 'Aguardando',
  delivered: 'Entregue', completed: 'Concluída', cancelled: 'Cancelada',
};
const statusTone: Record<WorkOrderStatus, Tone> = {
  open: { fg: '#0728CA', bg: '#E0E7FF', border: '#0728CA' },
  in_progress: { fg: '#1D4ED8', bg: '#DBEAFE', border: '#1D4ED8' },
  waiting: { fg: '#B45309', bg: '#FEF3C7', border: '#B45309' },
  delivered: { fg: '#047857', bg: '#D1FAE5', border: '#047857' },
  completed: { fg: '#047857', bg: '#D1FAE5', border: '#047857' },
  cancelled: { fg: '#B91C1C', bg: '#FEE2E2', border: '#B91C1C' },
};
const priorityLabel: Record<WorkOrderPriority, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
const priorityTone: Record<WorkOrderPriority, Tone> = {
  low: { fg: '#0E7490', bg: '#CFFAFE', border: '#0E7490' },
  normal: { fg: '#1F2937', bg: '#E5E7EB', border: '#9CA3AF' },
  high: { fg: '#B45309', bg: '#FEF3C7', border: '#B45309' },
  urgent: { fg: '#B91C1C', bg: '#FEE2E2', border: '#B91C1C' },
};
const resolutionLabel: Record<WorkOrderResolution, string> = {
  resolved: 'Resolvida', partial: 'Parcialmente resolvida', unresolved: 'Não resolvida',
};
const resolutionTone: Record<WorkOrderResolution, Tone> = {
  resolved: { fg: '#047857', bg: '#D1FAE5', border: '#047857' },
  partial: { fg: '#B45309', bg: '#FEF3C7', border: '#B45309' },
  unresolved: { fg: '#B91C1C', bg: '#FEE2E2', border: '#B91C1C' },
};

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function valueOrNA(value?: string | number | null): string {
  const text = String(value ?? '').trim();
  return text ? esc(text) : NA;
}
function hasText(value?: string | null): boolean {
  return Boolean(String(value ?? '').trim());
}
function fmtDt(value?: string | null): string {
  if (!value) return NA;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? NA : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}
function sourceLabel(value: WorkOrder['source']): string {
  if (value === 'whatsapp') return 'WhatsApp';
  if (value === 'external') return 'Externa';
  return 'Web';
}
function pill(tone: Tone, label: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10.5px;font-weight:800;color:${tone.fg};background:${tone.bg};border:1px solid ${tone.border};text-transform:uppercase;letter-spacing:.3px">${esc(label)}</span>`;
}

const CSS = `
@page { size: A4; margin: 6mm 6mm 5mm; }
*{box-sizing:border-box}
body{margin:0;padding:0;background:#fff}
.os-print{position:relative;font-family:Arial,system-ui,-apple-system,sans-serif;color:#111827;background:#fff;width:100%;padding:0;margin:0}
.os-print .field-highlight{background:#EEF2FF}
.os-print .field-highlight .label{color:#0728CA}
.os-print .field-highlight .value{font-weight:800}
.os-print .header{display:grid;grid-template-columns:138px 1fr 138px;gap:8px;align-items:center;padding:5px 4px 7px;border-bottom:1.5px solid #6B7280}
.os-print .logo-box{display:flex;align-items:center;justify-content:center;min-height:46px}
.os-print .logo-box img{max-height:50px;width:auto;object-fit:contain}
.os-print h1{margin:0;color:#1F2937;font-size:19px;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:1px}
.os-print .code{display:inline-block;margin:4px auto 0;padding:2px 10px;background:#1F2937;color:#fff;border-radius:4px;font-family:"Courier New",monospace;font-size:13px;font-weight:800;letter-spacing:1.5px}
.os-print .header > div:nth-child(2){text-align:center}
.os-print section{margin-top:7px}
.os-print section h3{margin:0 0 4px;padding:2px 7px;background:#1F2937;color:#fff;border-radius:3px;font-size:9.8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;display:inline-block}
.os-print .field-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #9CA3AF;border-radius:4px;overflow:hidden;background:#fff}
.os-print .field{min-height:31px;border-right:1px solid #D1D5DB;border-bottom:1px solid #D1D5DB;padding:3px 5px;overflow:hidden}
.os-print .field:nth-child(4n){border-right:0}
.os-print .label{color:#374151;font-size:7.2px;font-weight:800;text-transform:uppercase;letter-spacing:.35px}
.os-print .value{margin-top:1px;font-size:9.4px;font-weight:700;line-height:1.15;overflow-wrap:anywhere;color:#111827;white-space:pre-line}
.os-print .box{min-height:44px;border:1px solid #9CA3AF;border-radius:4px;padding:6px;font-size:10px;font-weight:600;white-space:pre-wrap;line-height:1.25;background:#F9FAFB;overflow-wrap:anywhere}
.os-print table{width:100%;border-collapse:collapse;font-size:9.5px}
.os-print th,.os-print td{border:1px solid #9CA3AF;padding:4px 6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
.os-print th{background:#374151;color:#fff;font-size:7.8px;text-transform:uppercase;letter-spacing:.35px;font-weight:800}
.os-print tr:nth-child(even) td{background:#F3F4F6}
.os-print .print-signature-footer{margin-top:16px;padding-top:10mm;background:#fff}
.os-print .signature-row{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.os-print .sign-box{position:relative;border-top:1.3px solid #374151;padding-top:3px;text-align:center;font-size:7.9px;color:#4b5563;text-transform:uppercase;letter-spacing:.35px;font-weight:700;line-height:1.15}
.os-print .signature-image{position:absolute;left:50%;bottom:calc(100% + 1mm);transform:translateX(-50%);display:block;height:50px;max-width:96%}
.os-print .signature-image svg{height:50px;width:auto}
.os-print .signature-meta{display:block;margin-top:1px;font-size:6.8px;color:#64748b;text-transform:none;letter-spacing:0}
.os-print .footer-brand{margin-top:0;display:flex;justify-content:center;align-items:center;height:27px}
.os-print .footer-brand img{display:block;width:auto;height:26px;object-fit:contain}
.os-print .document-meta{margin-top:0;text-align:center;font-size:7.4px;font-weight:700;color:#64748b;letter-spacing:.25px}
.os-print .page-meta{margin-top:0;display:flex;align-items:center;justify-content:space-between;font-size:7.3px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.35px}
`;

export function buildWorkOrderPrintHtml(
  wo: WorkOrder,
  timeline: TimelineEvent[],
  signatureSvg: string,
  signerName: string,
  baseUrl: string,
): string {
  const fields: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: 'Unidade', value: valueOrNA(wo.unitName) },
    { label: 'Tipo de serviço', value: valueOrNA(wo.serviceType) },
    { label: 'Categoria', value: valueOrNA(wo.category) },
    { label: 'Status', value: pill(statusTone[wo.status], statusLabel[wo.status]) },
    { label: 'Prioridade', value: pill(priorityTone[wo.priority], priorityLabel[wo.priority]) },
    { label: 'Setor', value: valueOrNA(wo.department), highlight: true },
    { label: 'Solicitante', value: valueOrNA(wo.requestedByName), highlight: true },
    { label: 'Contato do solicitante', value: valueOrNA(wo.requesterContact) },
    { label: 'Equipe técnica', value: valueOrNA(wo.technicalTeam), highlight: true },
    { label: 'Técnico responsável', value: valueOrNA(wo.responsibleTechnicianName), highlight: true },
    { label: 'Criada por', value: NA },
    { label: 'Criada em', value: NA },
    { label: 'Hora de início', value: fmtDt(wo.openedAt) },
    { label: 'Hora final', value: fmtDt(wo.finishedAt) },
    { label: 'Situação da OS', value: wo.resolutionStatus ? pill(resolutionTone[wo.resolutionStatus], resolutionLabel[wo.resolutionStatus]) : NA },
    { label: 'Origem', value: valueOrNA(sourceLabel(wo.source)) },
    { label: 'Última alteração por', value: NA },
    { label: 'Última alteração em', value: NA },
  ];

  const fieldGrid = fields
    .map(f => `<div class="field${f.highlight ? ' field-highlight' : ''}"><div class="label">${esc(f.label)}</div><div class="value">${f.value}</div></div>`)
    .join('');

  const materials = wo.materials.length
    ? `<section><h3>Materiais e suprimentos</h3><table><thead><tr><th>Item</th><th style="width:90px;text-align:right">Quantidade</th><th style="width:80px">Unidade</th></tr></thead><tbody>${wo.materials
        .map(m => `<tr><td>${valueOrNA(m.description)}</td><td style="text-align:right">${valueOrNA(m.quantity)}</td><td>${valueOrNA(m.unit)}</td></tr>`)
        .join('')}</tbody></table></section>`
    : '';

  const history = `<section><h3>Histórico de atualização</h3><table><thead><tr><th style="width:120px">Hora</th><th style="width:120px">Usuário</th><th>Evento</th><th style="width:120px">Status</th></tr></thead><tbody>${
    timeline.length
      ? timeline.map(ev => `<tr><td>${esc(ev.at)}</td><td>${valueOrNA(ev.by)}</td><td>${valueOrNA(ev.label)}</td><td>${pill(statusTone[ev.tone], statusLabel[ev.tone])}</td></tr>`).join('')
      : `<tr><td>${NA}</td><td>${NA}</td><td>${NA}</td><td>${NA}</td></tr>`
  }</tbody></table></section>`;

  const obs = hasText(wo.attendanceNotes)
    ? `<section><h3>Observação do atendimento</h3><div class="box">${valueOrNA(wo.attendanceNotes)}</div></section>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
  <div class="os-print">
    <div class="header">
      <div class="logo-box"><img src="${baseUrl}/images/ho-logo.png" alt="Hospital do Olho" onerror="this.style.display='none'"/></div>
      <div><h1>Ordem de Serviço</h1><p class="code">${esc(wo.code)}</p></div>
      <div class="logo-box"><img src="${baseUrl}/images/prefeitura-duque-caxias.png" alt="" onerror="this.style.display='none'"/></div>
    </div>
    <section><h3>Identificação</h3><div class="field-grid">${fieldGrid}</div></section>
    <section><h3>Solicitação</h3><div class="box">${valueOrNA(wo.technicianRequest)}</div></section>
    ${obs}
    <section><h3>Solução adotada</h3><div class="box">${valueOrNA(wo.resolutionNotes)}</div></section>
    ${materials}
    ${history}
    <div class="print-signature-footer">
      <div class="signature-row">
        <div class="sign-box">
          <div class="signature-image">${signatureSvg}</div>
          Assinatura do solicitante<br/>${valueOrNA(signerName || wo.requestedByName)}
          <span class="signature-meta">Assinado digitalmente em ${fmtDt(new Date().toISOString())}</span>
        </div>
        <div class="sign-box">Assinatura do técnico responsável<br/>${valueOrNA(wo.responsibleTechnicianName)}</div>
      </div>
      <div class="footer-brand"><img src="${baseUrl}/images/submarca.png" alt="" onerror="this.style.display='none'"/></div>
      <div class="document-meta">Documento emitido em ${fmtDt(new Date().toISOString())} · ${valueOrNA(wo.unitName)}</div>
      <div class="page-meta"><span>${esc(wo.code)}</span><span>Página 1 de 1</span></div>
    </div>
  </div>
  </body></html>`;
}
