import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { T } from '../theme/theme';

const META: Record<string, { label: string; icon: string }> = {
  Home: { label: 'Início', icon: 'home' },
  Orders: { label: 'Ordens', icon: 'clipboard' },
  Inventory: { label: 'Inventário', icon: 'package' },
  Profile: { label: 'Perfil', icon: 'user' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const accent = T.primary;

  return (
    <View style={{ backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 8, paddingBottom: insets.bottom + 6, flexDirection: 'row' }}>
      {state.routes.map((route, index) => {
        const meta = META[route.name] ?? { label: route.name, icon: 'home' };
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 5 }}>
            <Icon name={meta.icon} size={22} color={focused ? accent : T.faint} strokeWidth={focused ? 2.4 : 2} />
            <Text style={{ fontSize: 10.5, fontWeight: focused ? '700' : '500', color: focused ? accent : T.faint }}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
