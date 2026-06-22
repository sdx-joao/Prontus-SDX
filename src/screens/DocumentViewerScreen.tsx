import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { DOC_STATUS, statusKey } from '../components/RecordStatus';
import { useAuth } from '../auth/auth-context';
import { documentFileParam, mobileFileUrl } from '../api/mobile';
import { IS_TEST_BUILD } from '../api/client';
import { T } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'DocumentViewer'>;

const SCREEN = Dimensions.get('window');

export function DocumentViewerScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { surgery, patientName, prontuario } = useRoute<R>().params;
  const [sharing, setSharing] = useState(false);
  const [pages, setPages] = useState<{ cur: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const st = DOC_STATUS[statusKey(surgery)] ?? DOC_STATUS.absent;
  const fileParam = documentFileParam(surgery.documentUrl);
  const fileUrl = fileParam ? mobileFileUrl(fileParam) : null;
  const isImage = surgery.documentType === 'image';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  async function shareDoc() {
    if (!fileUrl) return;
    setSharing(true);
    try {
      const ext = isImage ? 'jpg' : 'pdf';
      const target = `${FileSystem.cacheDirectory ?? ''}prontuario-${Date.now()}.${ext}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, target, { headers: authHeaders });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao compartilhar.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020' }}>
      {/* Header compacto */}
      <LinearGradient
        colors={IS_TEST_BUILD ? ['#8B93A4', '#5A6373'] : [T.primary, T.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }}
      >
        <Pressable onPress={() => nav.goBack()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={19} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: '#fff' }}>{surgery.name || 'Documento'}</Text>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: 'rgba(255,255,255,.72)' }}>
            {(patientName || '').split(' ').slice(0, 2).join(' ')} · Pront. {prontuario}
          </Text>
        </View>
        {fileUrl && (
          <Pressable onPress={shareDoc} disabled={sharing} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
            {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="share" size={18} color="#fff" />}
          </Pressable>
        )}
      </LinearGradient>

      {/* Corpo: renderiza o documento NA TELA */}
      {!fileUrl ? (
        <Centered>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Icon name="file-text" size={32} color="#94A3B8" />
          </View>
          <Dot color={st.color} ring={st.ring} label={st.label} />
          <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', marginTop: 12 }}>Sem documento disponível para esta cirurgia.</Text>
        </Centered>
      ) : isImage ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }} maximumZoomScale={4} minimumZoomScale={1} centerContent>
          <Image source={{ uri: fileUrl, headers: authHeaders }} style={{ width: SCREEN.width - 24, height: (SCREEN.width - 24) * 1.4, borderRadius: 6 }} resizeMode="contain" />
        </ScrollView>
      ) : error ? (
        <Centered>
          <Icon name="alert" size={34} color="#F87171" />
          <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', marginTop: 14 }}>{error}</Text>
          <Pressable onPress={shareDoc} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 20, borderRadius: 12, backgroundColor: T.primary }}>
            <Icon name="download" size={17} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>Abrir externamente</Text>
          </Pressable>
        </Centered>
      ) : (
        <View style={{ flex: 1 }}>
          <Pdf
            source={{ uri: fileUrl, headers: authHeaders, cache: true }}
            style={{ flex: 1, width: SCREEN.width, backgroundColor: '#0B1020' }}
            trustAllCerts={false}
            onLoadComplete={(total) => setPages({ cur: 1, total })}
            onPageChanged={(cur, total) => setPages({ cur, total })}
            onError={() => setError('Não foi possível abrir o documento.')}
            renderActivityIndicator={() => <ActivityIndicator size="large" color="#fff" />}
          />
          {pages && pages.total > 1 && (
            <View style={{ position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: 'rgba(17,24,42,.85)', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{pages.cur} / {pages.total}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>{children}</View>;
}
function Dot({ color, ring, label }: { color: string; ring: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, borderWidth: 2, borderColor: ring }} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#E2E8F0' }}>{label}</Text>
    </View>
  );
}
