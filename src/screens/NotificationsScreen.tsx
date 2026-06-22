import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { DetailScaffold, EmptyState, LoadingState } from '../components/ui';
import { T } from '../theme/theme';
import { useAuth } from '../auth/auth-context';
import { getNotifications, markNotificationsRead, type AppNotification } from '../api/mobile';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

const TYPE_ICON: Record<string, string> = {
  os_moved: 'shuffle',
  os_assigned: 'user',
  os_escalated: 'flame',
  os_new_in_department: 'clipboard',
};

function relativeTime(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

export function NotificationsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const loader = useCallback(() => getNotifications(token), [token]);
  const { data, loading, refreshing, error, reload } = useResource(loader, { reloadOnFocus: true });
  const [busy, setBusy] = useState(false);

  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const markAll = useCallback(async () => {
    if (busy || unread === 0) return;
    setBusy(true);
    try {
      await markNotificationsRead(token);
      reload();
    } finally {
      setBusy(false);
    }
  }, [busy, unread, token, reload]);

  const openItem = useCallback(async (item: AppNotification) => {
    if (!item.isRead) {
      markNotificationsRead(token, [item.id]).catch(() => undefined);
    }
    if (item.workOrderId) {
      nav.navigate('WorkOrderDetail', { id: item.workOrderId });
    }
  }, [token, nav]);

  return (
    <DetailScaffold
      onBack={() => nav.goBack()}
      eyebrow="Perfil"
      title="Notificações"
      headerExtra={
        unread > 0 ? (
          <Pressable onPress={markAll} disabled={busy} style={{ alignSelf: 'flex-start', marginTop: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>Marcar todas como lidas ({unread})</Text>
          </Pressable>
        ) : undefined
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} colors={[T.primary]} />}
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState icon="alert" text={error} />
      ) : items.length === 0 ? (
        <EmptyState icon="bell" text="Nenhuma notificação por enquanto." />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openItem(item)}
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 13,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: item.isRead ? T.border : T.primary,
                backgroundColor: item.isRead ? T.surface : `${T.primary}0C`,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${T.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={TYPE_ICON[item.type] ?? 'bell'} size={18} color={T.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: T.text }} numberOfLines={2}>{item.title}</Text>
                  {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.primary }} />}
                </View>
                {!!item.body && <Text style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }} numberOfLines={3}>{item.body}</Text>}
                <Text style={{ fontSize: 11, color: T.faint, marginTop: 5 }}>{relativeTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </DetailScaffold>
  );
}
