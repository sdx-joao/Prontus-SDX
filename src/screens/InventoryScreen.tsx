import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ModuleScreen, SearchField, ChipRow, EmptyState, LoadingState, type Chip } from '../components/ui';
import { InvCard } from '../components/cards';
import { T } from '../theme/theme';
import type { InventoryItem } from '../data/mock';
import { useAuth } from '../auth/auth-context';
import { getInventory } from '../api/mobile';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

export function InventoryScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const loader = useCallback(() => getInventory(token), [token]);
  const { data, loading, refreshing, error, reload } = useResource(loader, { reloadOnFocus: true });
  const inventory = data ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inventory.length };
    inventory.forEach((i) => { c[i.primaryType] = (c[i.primaryType] || 0) + 1; });
    return c;
  }, [inventory]);

  const chips: Chip[] = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'EQUIPAMENTO', label: 'Equipamentos', count: counts.EQUIPAMENTO },
    { key: 'MATERIAL', label: 'Materiais', count: counts.MATERIAL },
    { key: 'SUPRIMENTO', label: 'Suprimentos', count: counts.SUPRIMENTO },
    { key: 'PERIFERICO', label: 'Periféricos', count: counts.PERIFERICO },
    { key: 'FERRAMENTA', label: 'Ferramentas', count: counts.FERRAMENTA },
  ].filter((c) => c.count);

  const list = inventory.filter((i) => {
    if (filter !== 'all' && i.primaryType !== filter) return false;
    if (q) {
      const t = (i.name + (i.sku || '') + (i.assetTag || '') + (i.brand || '') + (i.currentLocation || '')).toLowerCase();
      if (!t.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const openItem = (it: InventoryItem) => nav.navigate('InventoryDetail', { id: it.id });

  return (
    <ModuleScreen
      title="Inventário"
      subtitle={`${inventory.length} itens · somente consulta`}
      onNew={() => nav.navigate('Scan')}
      newLabel="Escanear QR Code"
      newIcon="scan"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} colors={[T.primary]} />}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
        <SearchField value={q} onChange={setQ} placeholder="Buscar item, SKU, patrimônio…" />
      </View>
      <ChipRow chips={chips} active={filter} onPick={setFilter} accent={T.primary} />
      <View style={{ padding: 16, paddingBottom: 24 }}>
        {loading
          ? <LoadingState />
          : error
            ? <EmptyState icon="alert" text={error} />
            : list.length === 0
          ? <EmptyState icon="package" text="Nenhum item encontrado." />
          : list.map((it) => <InvCard key={it.id} item={it} onOpen={openItem} />)}
      </View>
    </ModuleScreen>
  );
}
