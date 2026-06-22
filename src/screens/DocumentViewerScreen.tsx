import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { DOC_STATUS, statusKey } from '../components/RecordStatus';
import { IS_TEST_BUILD } from '../api/client';
import { T } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'DocumentViewer'>;

export function DocumentViewerScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { surgery, patientName, prontuario } = useRoute<R>().params;
  const st = DOC_STATUS[statusKey(surgery)] ?? DOC_STATUS.absent;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020' }}>
      {/* Header compacto */}
      <LinearGradient
        colors={IS_TEST_BUILD ? ['#8B93A4', '#5A6373'] : [T.primary, T.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="arrow-left" size={19} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: '#fff' }}>{surgery.name || 'Documento'}</Text>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: 'rgba(255,255,255,.72)' }}>
            {(patientName || '').split(' ').slice(0, 2).join(' ')} · Pront. {prontuario}
          </Text>
        </View>
      </LinearGradient>

      {/* Área do documento (placeholder v1) */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Icon name={surgery.documentType === 'image' ? 'image' : 'file-text'} size={32} color="#94A3B8" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: st.color, borderWidth: 2, borderColor: st.ring }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#E2E8F0' }}>{st.label}</Text>
        </View>
        <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', lineHeight: 20 }}>
          {surgery.documentType ? `Documento ${surgery.documentType.toUpperCase()} vinculado.` : 'Sem documento vinculado.'}
        </Text>
        <Text style={{ marginTop: 8, fontSize: 12.5, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
          A visualização completa (zoom, páginas) chega na próxima versão, com o
          serviço de arquivo autenticado para o app.
        </Text>
      </View>
    </View>
  );
}
