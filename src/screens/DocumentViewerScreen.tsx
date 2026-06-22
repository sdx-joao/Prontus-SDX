import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { useAuth } from '../auth/auth-context';
import { documentFileParam, mobileFileUrl } from '../api/mobile';
import { T } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'DocumentViewer'>;

const SCREEN = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export function DocumentViewerScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { surgery, patientName, prontuario } = useRoute<R>().params;

  const fileParam = documentFileParam(surgery.documentUrl);
  const fileUrl = fileParam ? mobileFileUrl(fileParam) : null;
  const isImage = surgery.documentType === 'image';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!fileUrl);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<{ cur: number; total: number } | null>(null);
  const [scale, setScale] = useState(1);

  const zoom = (d: number) => setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + d).toFixed(2))));

  // Baixa com Bearer (expo-file-system) e renderiza o arquivo LOCAL.
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

  const showZoom = !!localUri && !isImage && !error;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020' }}>
      {/* ── Documento ocupa a tela TODA ── */}
      {!fileUrl ? (
        <Centered insetsTop={insets.top}><Icon name="file-text" size={32} color="#94A3B8" /><Msg>Sem documento disponível.</Msg></Centered>
      ) : loading ? (
        <Centered insetsTop={insets.top}><ActivityIndicator size="large" color="#fff" /><Msg>Carregando documento…</Msg></Centered>
      ) : error ? (
        <Centered insetsTop={insets.top}><Icon name="alert" size={34} color="#F87171" /><Msg>{error}</Msg></Centered>
      ) : localUri && isImage ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }} maximumZoomScale={4} minimumZoomScale={1} centerContent>
          <Image source={{ uri: localUri }} style={{ width: SCREEN.width, height: SCREEN.height }} resizeMode="contain" />
        </ScrollView>
      ) : localUri ? (
        <Pdf
          source={{ uri: localUri }}
          style={{ flex: 1, width: SCREEN.width, height: SCREEN.height, backgroundColor: '#0B1020' }}
          scale={scale}
          minScale={MIN_SCALE}
          maxScale={MAX_SCALE}
          onLoadComplete={(total) => setPages({ cur: 1, total })}
          onPageChanged={(cur, total) => setPages({ cur, total })}
          onScaleChanged={(s) => setScale(s)}
          onError={() => setError('Não foi possível renderizar o PDF.')}
          renderActivityIndicator={() => <ActivityIndicator size="large" color="#fff" />}
        />
      ) : null}

      {/* ── Header flutuante translúcido ── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(11,16,32,0.55)' }}>
        <Pressable onPress={() => nav.goBack()} style={glassBtn}>
          <Icon name="arrow-left" size={19} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{surgery.name || 'Documento'}</Text>
          <Text numberOfLines={1} style={{ fontSize: 11, color: 'rgba(255,255,255,.72)' }}>
            {(patientName || '').split(' ').slice(0, 2).join(' ')} · Pront. {prontuario}
          </Text>
        </View>
        {localUri && (
          <Pressable onPress={shareDoc} style={glassBtn}>
            <Icon name="share" size={17} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* ── Controles flutuantes translúcidos (zoom + página) ── */}
      {showZoom && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(17,24,42,0.6)', borderRadius: 999, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
          <Pressable onPress={() => zoom(-0.5)} style={ctrlBtn}><Icon name="zoom-out" size={20} color="#fff" /></Pressable>
          <Text style={{ minWidth: 46, textAlign: 'center', color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{Math.round(scale * 100)}%</Text>
          <Pressable onPress={() => zoom(0.5)} style={ctrlBtn}><Icon name="zoom-in" size={20} color="#fff" /></Pressable>
          {pages && pages.total > 1 && (
            <>
              <View style={{ width: 1, height: 22, backgroundColor: 'rgba(255,255,255,.18)', marginHorizontal: 4 }} />
              <Text style={{ minWidth: 50, textAlign: 'center', color: 'rgba(255,255,255,.9)', fontSize: 12.5, fontWeight: '700' }}>{pages.cur}/{pages.total}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const glassBtn = { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center' as const, justifyContent: 'center' as const };
const ctrlBtn = { width: 40, height: 40, borderRadius: 999, alignItems: 'center' as const, justifyContent: 'center' as const };

function Centered({ children, insetsTop }: { children: React.ReactNode; insetsTop: number }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, paddingTop: insetsTop + 60 }}>{children}</View>;
}
function Msg({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', marginTop: 14 }}>{children}</Text>;
}
