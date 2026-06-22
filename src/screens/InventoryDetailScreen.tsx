import { useCallback } from 'react';
import { Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { Badge, DetailScaffold, EmptyState, LoadingState, SectionCard, StatItem } from '../components/ui';
import { MovementRow } from '../components/cards';
import { T, INV_TYPE } from '../theme/theme';
import { stockStatusOf } from '../data/mock';
import { useAuth } from '../auth/auth-context';
import { getInventoryItem } from '../api/mobile';
import { API_BASE_URL } from '../api/client';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

function Half({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={{ width: '50%', marginBottom: 14 }}>
      <StatItem label={label}>{value || '—'}</StatItem>
    </View>
  );
}

export function InventoryDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'InventoryDetail'>>();
  const { token } = useAuth();
  const loader = useCallback(() => getInventoryItem(token, route.params.id), [token, route.params.id]);
  const { data, loading, refreshing, error, reload } = useResource(loader, { reloadOnFocus: true });
  const item = data?.item;

  if (loading) {
    return (
      <DetailScaffold onBack={() => nav.goBack()} title="Carregando item">
        <LoadingState />
      </DetailScaffold>
    );
  }

  if (error || !item) {
    return (
      <DetailScaffold onBack={() => nav.goBack()} title="Item não encontrado">
        <EmptyState icon="package" text={error || 'Este item não existe no inventário.'} />
      </DetailScaffold>
    );
  }

  const tone = stockStatusOf(item);
  const ty = INV_TYPE[item.primaryType];
  const isEquip = item.itemType === 'equipment';
  const moves = data?.movements ?? [];
  const pct = item.maxQty ? Math.min(100, (item.currentQty / item.maxQty) * 100) : 100;
  const photoUrl = item.mainPhotoUrl ? `${API_BASE_URL}${item.mainPhotoUrl}` : null;

  return (
    <DetailScaffold
      onBack={() => nav.goBack()}
      eyebrow={item.sku || item.assetTag || ty.label}
      title={item.name}
      badge={<Badge tone={tone} badgeStyle="solid" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} colors={[T.primary]} />}
      headerExtra={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name={ty.icon} size={14} color="rgba(255,255,255,.78)" />
            <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,.78)' }}>{ty.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="map-pin" size={14} color="rgba(255,255,255,.78)" />
            <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,.78)' }}>{item.currentLocation}</Text>
          </View>
        </View>
      }
    >
      <View
        style={{
          height: 150, borderRadius: 14, marginBottom: 12, overflow: 'hidden',
          borderWidth: 1, borderColor: T.border, backgroundColor: T.surfaceMuted,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <>
            <Icon name="camera" size={24} color={T.faint} />
            <Text style={{ fontSize: 11.5, color: T.faint, marginTop: 7 }}>Sem foto cadastrada</Text>
          </>
        )}
        <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: 'rgba(15,23,42,.78)' }}>
          <Icon name="qr" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>QR</Text>
        </View>
      </View>

      {!isEquip ? (
        <SectionCard title="Estoque">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: tone.solid, lineHeight: 36 }}>{item.currentQty}</Text>
            <Text style={{ fontSize: 14, color: T.muted, marginBottom: 4 }}>{item.unit}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: T.surfaceMuted, overflow: 'hidden', marginVertical: 12 }}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: tone.solid, borderRadius: 4 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11.5, color: T.faint }}>Mínimo {item.minQty}</Text>
            <Text style={{ fontSize: 11.5, color: T.faint }}>Máximo {item.maxQty || '—'}</Text>
          </View>
        </SectionCard>
      ) : (
        <SectionCard title="Patrimônio">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Half label="Etiqueta" value={item.assetTag} />
            <Half label="Nº de série" value={item.serialNumber} />
            <Half label="Marca" value={item.brand} />
            <Half label="Modelo" value={item.model} />
            {item.operatingSystem && <Half label="Sistema" value={item.operatingSystem} />}
            <Half label="Estado" value={item.equipmentStatus} />
          </View>
        </SectionCard>
      )}

      {item.technicalSpecs.length > 0 && (
        <SectionCard title="Especificações técnicas">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {item.technicalSpecs.map((s, i) => (
              <View key={i} style={{ backgroundColor: T.surfaceMuted, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 11 }}>
                <Text style={{ fontSize: 10, color: T.faint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.key}</Text>
                <Text style={{ fontSize: 12.5, color: T.text, fontWeight: '600', marginTop: 2 }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      <SectionCard title="Identificação">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Half label="SKU" value={item.sku} />
          <Half label="Unidade" value={item.unit} />
          <Half label="Categoria" value={ty.label} />
          <Half label="Localização" value={item.currentLocation} />
        </View>
        {!!item.notes && (
          <Text style={{ marginTop: 2, fontSize: 13, color: T.textSoft, lineHeight: 20, backgroundColor: T.surfaceMuted, borderRadius: 10, padding: 11 }}>{item.notes}</Text>
        )}
      </SectionCard>

      {moves.length > 0 && (
        <SectionCard title="Histórico de movimentações">
          {moves.map((m) => <MovementRow key={m.id} m={m} />)}
        </SectionCard>
      )}
    </DetailScaffold>
  );
}
