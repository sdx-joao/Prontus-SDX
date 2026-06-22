import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { Badge, MetaRow } from './ui';
import { T, WO_STATUS, WO_PRIORITY, INV_TYPE, MOVE_TONE } from '../theme/theme';
import {
  fmtDate, fmtTime, stockStatusOf,
  type WorkOrder, type InventoryItem, type Movement,
} from '../data/mock';

const cardShadow = {
  shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
} as const;

function SourceMark({ source }: { source: WorkOrder['source'] }) {
  if (source === 'whatsapp') return <Icon name="whatsapp" size={14} color="#16A34A" />;
  if (source === 'external') return <Icon name="send" size={13} color={T.faint} />;
  return null;
}

// ── Cartão de OS ────────────────────────────────────────────────────────────
export function WOCard({
  wo,
  onOpen,
  onEdit,
  accent = T.primary,
}: {
  wo: WorkOrder;
  onOpen: (wo: WorkOrder) => void;
  onEdit?: (wo: WorkOrder) => void;
  accent?: string;
}) {
  const st = WO_STATUS[wo.status];
  const pr = WO_PRIORITY[wo.priority];
  const finished = wo.status === 'completed' || wo.status === 'delivered' || wo.status === 'cancelled';
  const overdue = !!wo.expectedCompletionAt && new Date(wo.expectedCompletionAt) < new Date() && !finished;

  // Chip "Aberta" pulsa sutilmente para chamar atenção das OS sem atendimento.
  const isOpen = wo.status === 'open';
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isOpen) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isOpen, pulse]);

  return (
    <Pressable
      onPress={() => onOpen(wo)}
      style={{
        backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
        borderLeftWidth: 3, borderLeftColor: pr.color, borderRadius: 14, padding: 14, marginBottom: 10,
        ...cardShadow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: accent, letterSpacing: 0.2 }}>{wo.code}</Text>
          <SourceMark source={wo.source} />
        </View>
        {isOpen ? (
          <Animated.View style={{ opacity: pulse }}><Badge tone={st} /></Animated.View>
        ) : (
          <Badge tone={st} />
        )}
      </View>
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: T.text, marginBottom: 3, lineHeight: 19 }}>{wo.serviceType}</Text>
      <Text style={{ fontSize: 12.5, color: T.faint, marginBottom: 10 }}>{wo.category}</Text>
      <View style={{ gap: 5 }}>
        <MetaRow icon="building">{wo.department} · {wo.unitName.replace('Hospital do Olho — ', 'HO ')}</MetaRow>
        <MetaRow icon="user">{wo.responsibleTechnicianName || 'Não atribuída'}</MetaRow>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.surfaceMuted }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {wo.priority === 'urgent' && <Icon name="flame" size={13} color={pr.color} />}
            <Text style={{ fontSize: 11.5, fontWeight: '600', color: pr.color }}>{pr.label}</Text>
          </View>
          {wo.escalationCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="trending-up" size={12} color="#C2410C" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#C2410C' }}>Escalada</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onEdit && !finished && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onEdit(wo);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 7, borderRadius: 8, backgroundColor: `${accent}10` }}
            >
              <Icon name="sliders" size={12} color={accent} />
              <Text style={{ fontSize: 11.5, color: accent, fontWeight: '800' }}>Editar</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={12} color={overdue ? T.danger : T.faint} />
            <Text style={{ fontSize: 11.5, color: overdue ? T.danger : T.faint, fontWeight: overdue ? '600' : '400' }}>
              {overdue ? 'Atrasada' : finished ? fmtTime(wo.finishedAt) : `Prev. ${fmtTime(wo.expectedCompletionAt)}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Cartão de item de inventário ────────────────────────────────────────────
export function InvCard({ item, onOpen, accent = T.primary }: { item: InventoryItem; onOpen: (it: InventoryItem) => void; accent?: string }) {
  const tone = stockStatusOf(item);
  const ty = INV_TYPE[item.primaryType];
  const isEquip = item.itemType === 'equipment';
  const low = !isEquip && item.minQty > 0 && item.currentQty < item.minQty;
  const pct = item.maxQty > 0
    ? Math.min(100, Math.round((item.currentQty / item.maxQty) * 100))
    : item.minQty > 0 ? Math.min(100, Math.round((item.currentQty / (item.minQty * 1.5)) * 100)) : 100;

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 13, marginBottom: 10, ...cardShadow }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 11, backgroundColor: `${accent}12`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={ty.icon} size={21} color={accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: T.text, lineHeight: 19 }}>{item.name}</Text>
            <Badge tone={tone} size="sm" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
            <Text style={{ fontSize: 11.5, color: accent, fontWeight: '600' }}>{item.sku || item.assetTag}</Text>
            <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: T.faint }} />
            <Text style={{ fontSize: 11.5, color: T.faint }}>{ty.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
            <Icon name="map-pin" size={13} color={T.faint} />
            <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, flexShrink: 1 }}>{item.currentLocation || 'Sem localização'}</Text>
          </View>
        </View>
      </View>

      {!isEquip && (
        <View style={{ marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: T.surfaceMuted }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: T.muted }}>
              <Text style={{ color: low ? T.danger : T.text, fontSize: 14, fontWeight: '700' }}>{item.currentQty}</Text> {item.unit} em estoque
            </Text>
            <Text style={{ fontSize: 11.5, color: T.faint }}>mín. {item.minQty}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: T.surfaceMuted, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: tone.solid }} />
          </View>
        </View>
      )}
      {isEquip && (
        <View style={{ marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: T.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="hash" size={13} color={T.faint} />
          <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, flexShrink: 1 }}>{item.brand} {item.model} · Série {item.serialNumber}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Linha de movimentação ───────────────────────────────────────────────────
export function MovementRow({ m }: { m: Movement }) {
  const tone = MOVE_TONE[m.movementType];
  const sign = m.movementType === 'in' ? '+' : m.movementType === 'out' ? '−' : '±';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.surfaceMuted }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${tone.color}14`, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={tone.icon} size={17} color={tone.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '500', color: T.text }}>{m.itemName}</Text>
        <Text style={{ fontSize: 11.5, color: T.faint, marginTop: 1 }}>{tone.label} · {m.sourceLabel} · {fmtDate(m.createdAt)} {fmtTime(m.createdAt)}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: tone.color }}>{sign}{m.qty}</Text>
    </View>
  );
}
