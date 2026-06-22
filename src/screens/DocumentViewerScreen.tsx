import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [busy, setBusy] = useState(false);

  const st = DOC_STATUS[statusKey(surgery)] ?? DOC_STATUS.absent;
  const fileParam = documentFileParam(surgery.documentUrl);
  const fileUrl = fileParam ? mobileFileUrl(fileParam) : null;
  const isImage = surgery.documentType === 'image';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  async function openPdf() {
    if (!fileUrl) return;
    setBusy(true);
    try {
      const target = `${FileSystem.cacheDirectory ?? ''}prontuario-${Date.now()}.pdf`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, target, { headers: authHeaders });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: surgery.name });
      } else {
        Alert.alert('Documento baixado', 'O compartilhamento não está disponível neste dispositivo.');
      }
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao abrir o documento.');
    } finally {
      setBusy(false);
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
        {!isImage && fileUrl && (
          <Pressable
            onPress={openPdf}
            disabled={busy}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}
          >
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="share" size={18} color="#fff" />}
          </Pressable>
        )}
      </LinearGradient>

      {/* Corpo */}
      {isImage && fileUrl ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
        >
          <Image
            source={{ uri: fileUrl, headers: authHeaders }}
            style={{ width: SCREEN.width - 24, height: (SCREEN.width - 24) * 1.4, borderRadius: 6 }}
            resizeMode="contain"
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Icon name="file-text" size={32} color="#94A3B8" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: st.color, borderWidth: 2, borderColor: st.ring }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#E2E8F0' }}>{st.label}</Text>
          </View>
          {fileUrl ? (
            <>
              <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                Documento PDF do prontuário. Abra para visualizar página por página.
              </Text>
              <Pressable
                onPress={openPdf}
                disabled={busy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 9, height: 52, paddingHorizontal: 24, borderRadius: 14, backgroundColor: T.primary, opacity: busy ? 0.8 : 1 }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Icon name="download" size={18} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{busy ? 'Abrindo…' : 'Abrir documento'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center', lineHeight: 20 }}>
              Sem documento disponível para esta cirurgia.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
