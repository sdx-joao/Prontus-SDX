import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkOrdersScreen } from '../screens/WorkOrdersScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WorkOrderDetailScreen } from '../screens/WorkOrderDetailScreen';
import { WorkOrderEditScreen } from '../screens/WorkOrderEditScreen';
import { WorkOrderAttachmentCaptureScreen } from '../screens/WorkOrderAttachmentCaptureScreen';
import { NewWorkOrderScreen } from '../screens/NewWorkOrderScreen';
import { InventoryDetailScreen } from '../screens/InventoryDetailScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { WorkOrderSignatureScreen } from '../screens/WorkOrderSignatureScreen';
import { MyDataScreen } from '../screens/MyDataScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={WorkOrdersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
      <Stack.Screen name="WorkOrderEdit" component={WorkOrderEditScreen} />
      <Stack.Screen name="WorkOrderAttachmentCapture" component={WorkOrderAttachmentCaptureScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} />
      <Stack.Screen name="NewWorkOrder" component={NewWorkOrderScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="WorkOrderSignature" component={WorkOrderSignatureScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="MyData" component={MyDataScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
