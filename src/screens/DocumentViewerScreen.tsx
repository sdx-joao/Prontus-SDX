import { useEffect, useState } from 'react';
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

  const st = DOC_STATUS[statusKey(surgery)] ?? DOC_STATUS.absent;
  const fileParam = documentFileParam(surgery.documentUrl);
  const fileUrl = fileParam ? mobileFileUrl(fileParam) : null;
  const isImage = surgery.documentType === 'image';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!fileUrl);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<{ cur: number; total: number } | null>(null);

  // Baixa o documento com o token (expo-file-system) e renderiza o arquivo LOCAL.
  // Evita o fetch autenticado dentro do react-native-pdf, que falha no Android.
  useEffect(() => {
    let cancelled = false;
    if (!fileUrl) { setLoading(false); return; }
    (async () => {
      setLoading(true); setError(null);
      try {
        const ext = isImage ? 'jpg' : 'pdf';
        const target = `${FileSystem.cacheDirectory ?? ''}doc-${Date.now()}.${ext}`;
        const res = await FileSystem.downloadAsync(fileUrl, target, { headers: authHeaders });
        if (cancelled) return;
        if (res.status >= 400) setError(`Não foi possível abrir o documento (erro ${res.status}).`);
        else setLocalUri(res.uri);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Não foi possível abrir o documento.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  async function shareDoc() {
    if (!localUri) return;
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(localUri);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao compartilhar.');
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
        {localUri && (
          <Pressable onPress={shareDoc} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="share" size={18} color="#fff" />
          </Pressable>
        )}
      </LinearGradient>

      {/* Corpo */}
      {!fileUrl ? (
        <Centered>
          <Icon name="file-text" size={32} color="#94A3B8" />
          <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', marginTop: 14 }}>Sem documento disponível para esta cirurgia.</Text>
        </Centered>
      ) : loading ? (
        <Centered>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 14 }}>Carregando documento…</Text>
        </Centered>
      ) : error ? (
        <Centered>
          <Icon name="alert" size={34} color="#F87171" />
          <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', marginTop: 14 }}>{error}</Text>
        </Centered>
      ) : localUri && isImage ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }} maximumZoomScale={4} minimumZoomScale={1} centerContent>
          <Image source={{ uri: localUri }} style={{ width: SCREEN.width - 24, height: (SCREEN.width - 24) * 1.4, borderRadius: 6 }} resizeMode="contain" />
        </ScrollView>
      ) : localUri ? (
        <View style={{ flex: 1 }}>
          <Pdf
            source={{ uri: localUri }}
            style={{ flex: 1, width: SCREEN.width, backgroundColor: '#0B1020' }}
            onLoadComplete={(total) => setPages({ cur: 1, total })}
            onPageChanged={(cur, total) => setPages({ cur, total })}
            onError={() => setError('Não foi possível renderizar o PDF.')}
            renderActivityIndicator={() => <ActivityIndicator size="large" color="#fff" />}
          />
          {pages && pages.total > 1 && (
            <View style={{ position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: 'rgba(17,24,42,.85)', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{pages.cur} / {pages.total}</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>{children}</View>;
}
