import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';
import { ProntuariosSearchScreen } from '../screens/ProntuariosSearchScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { DocumentViewerScreen } from '../screens/DocumentViewerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MyDataScreen } from '../screens/MyDataScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Records" component={ProntuariosSearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="MyData" component={MyDataScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
