import type { NavigatorScreenParams } from '@react-navigation/native';
import type { RecordPatient, RecordSurgery } from '../api/mobile';

export type TabParamList = {
  Records: undefined;
  Home: undefined;
  Orders: undefined;
  Inventory: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // Prontuários (Prontus-SDX)
  PatientDetail: { patient: RecordPatient };
  DocumentViewer: { surgery: RecordSurgery; patientName: string; prontuario: string };
  // Telas herdadas da base (não roteadas nas abas do Prontus, mantidas para reuso)
  WorkOrderDetail: { id: string };
  WorkOrderEdit: { id: string };
  WorkOrderAttachmentCapture: { id: string; category?: 'before' | 'after' | 'general' };
  NewWorkOrder: undefined;
  InventoryDetail: { id: string };
  Scan: undefined;
  WorkOrderSignature: { id: string; status: 'completed' | 'delivered'; signerName?: string };
  MyData: undefined;
  Notifications: undefined;
};
