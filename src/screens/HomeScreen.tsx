import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { BlueHeader, Badge, EmptyState, LoadingState, SectionTitle, TextLink } from '../components/ui';
import { BrandTile } from '../components/Brand';
import { WOCard } from '../components/cards';
import { T } from '../theme/theme';
import { stockStatusOf, type WorkOrder, type InventoryItem } from '../data/mock';
import { useAuth } from '../auth/auth-context';
import { getInventory, getSummary, getWorkOrders, type Summary } from '../api/mobile';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

function StatTile({ value, label, icon, tone, onPress }: { value: number; label: string; icon: string; tone: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 13 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${tone}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
        <Icon name={icon} size={17} color={tone} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: T.text }}>{value}</Text>
      <Text style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>{label}</Text>
    </Pressable>
  );
}

function ModuleTile({ icon, label, sub, accent, onPress }: { icon: string; label: string; sub: string; accent: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${accent}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: T.text, lineHeight: 17 }}>{label}</Text>
      <Text style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{sub}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const accent = T.primary;
  const loader = useCallback(async () => {
    const [summary, orders, inventory] = await Promise.all([
      getSummary(token),
      getWorkOrders(token),
      getInventory(token),
    ]);
    return { summary, orders, inventory };
  }, [token]);
  const { data, loading, refreshing, error, reload } = useResource(loader, { reloadOnFocus: true });

  if (!user) return null;

  const summary: Summary = data?.summary ?? {
    workOrders: { activeNow: 0, openedToday: 0 },
    inventory: { totalItems: 0, lowStock: 0, equipment: 0, inMaintenance: 0 },
  };
  const inventory = data?.inventory ?? [];
  const orders = data?.orders ?? [];
  const lowItems = inventory.filter((i) => i.itemType !== 'equipment' && i.minQty > 0 && i.currentQty < i.minQty).slice(0, 4);
  const recent = orders.filter((w) => w.status === 'open' || w.status === 'in_progress' || w.status === 'waiting').slice(0, 3);

  const goOrders = () => nav.navigate('Tabs', { screen: 'Orders' });
  const goInventory = () => nav.navigate('Tabs', { screen: 'Inventory' });
  const openWO = (wo: WorkOrder) => nav.navigate('WorkOrderDetail', { id: wo.id });
  const openItem = (it: InventoryItem) => nav.navigate('InventoryDetail', { id: it.id });

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <BlueHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <BrandTile size={28} radius={9} shadow={false} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
            ScandexPRO<Text style={{ fontSize: 9, fontWeight: '600', opacity: 0.7 }}>™</Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>Bem-vindo de volta,</Text>
            <Text style={{ marginTop: 3, fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Icon name="building" size={13} color="rgba(255,255,255,.8)" />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{[user.unit, user.dept].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={44} radius={13} bgColor="rgba(255,255,255,.16)" textColor="#fff" />
        </View>
      </BlueHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} colors={[T.primary]} />}
      >
        {loading && <LoadingState />}
        {!!error && <EmptyState icon="alert" text={error} />}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatTile value={summary.workOrders.activeNow} label="OS ativas" icon="clipboard" tone={accent} onPress={goOrders} />
          <StatTile value={summary.workOrders.openedToday} label="Abertas hoje" icon="zap" tone="#EA580C" onPress={goOrders} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
          <StatTile value={summary.inventory.lowStock} label="Estoque baixo" icon="alert" tone="#DC2626" onPress={goInventory} />
          <StatTile value={summary.inventory.inMaintenance} label="Em manutenção" icon="wrench" tone="#CA8A04" onPress={goInventory} />
        </View>

        <SectionTitle>Módulos</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
          <ModuleTile icon="clipboard" label="Ordens de Serviço" sub={`${summary.workOrders.activeNow} ativas`} accent={accent} onPress={goOrders} />
          <ModuleTile icon="package" label="Inventário" sub={`${summary.inventory.lowStock} alertas`} accent={accent} onPress={goInventory} />
        </View>

        {lowItems.length > 0 && (
          <>
            <SectionTitle action={<TextLink onPress={goInventory}>Ver tudo</TextLink>}>Estoque em alerta</SectionTitle>
            <View style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 14, marginBottom: 22 }}>
              {lowItems.map((it, i) => {
                const tone = stockStatusOf(it);
                return (
                  <Pressable
                    key={it.id}
                    onPress={() => openItem(it)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: i < lowItems.length - 1 ? 1 : 0, borderBottomColor: T.surfaceMuted }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${tone.solid}14`, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="alert" size={16} color={tone.solid} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '600', color: T.text }}>{it.name}</Text>
                      <Text style={{ fontSize: 11.5, color: T.muted }}>{it.currentQty} {it.unit} · mín. {it.minQty}</Text>
                    </View>
                    <Badge tone={tone} size="sm" />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <SectionTitle action={<TextLink onPress={goOrders}>Ver tudo</TextLink>}>Ordens em aberto</SectionTitle>
        {recent.length === 0
          ? <EmptyState icon="clipboard" text="Nenhuma ordem em aberto." />
          : recent.map((wo) => <WOCard key={wo.id} wo={wo} onOpen={openWO} />)}
      </ScrollView>
    </View>
  );
}
