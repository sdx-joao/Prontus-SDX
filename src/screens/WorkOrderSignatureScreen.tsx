import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, PanResponder, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { T } from '../theme/theme';
import { useAuth } from '../auth/auth-context';
import { getWorkOrder, updateWorkOrderStatus } from '../api/mobile';
import { API_BASE_URL, IS_TEST_BUILD } from '../api/client';
import { buildWorkOrderPrintHtml } from '../api/work-order-pdf-html';
import type { RootStackParamList } from '../navigation/types';

type Point = { x: number; y: number };

const PAD_WIDTH = 720;
const PAD_HEIGHT = 320;

function pointsToPath(points: Point[]) {
  if (points.length < 2) return '';
  return points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

function svgDataUrl(strokes: Point[][], width: number, height: number) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const paths = strokes
    .map(pointsToPath)
    .filter(Boolean)
    .map(path => `<path d="${path}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/>${paths}</svg>`;
  return `data:image/svg+xml;base64,${asciiBase64(svg)}`;
}

function asciiBase64(value: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let index = 0;
  while (index < value.length) {
    const c1 = value.charCodeAt(index++);
    const c2 = value.charCodeAt(index++);
    const c3 = value.charCodeAt(index++);
    output += chars.charAt(c1 >> 2);
    output += chars.charAt(((c1 & 3) << 4) | (c2 >> 4));
    output += Number.isNaN(c2) ? '=' : chars.charAt(((c2 & 15) << 2) | (c3 >> 6));
    output += Number.isNaN(c3) ? '=' : chars.charAt(c3 & 63);
  }
  return output;
}

// SVG da assinatura (markup cru, embutido direto no HTML do PDF).
function svgMarkup(strokes: Point[][], width: number, height: number) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const paths = strokes
    .map(pointsToPath)
    .filter(Boolean)
    .map(path => `<path d="${path}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${paths}</svg>`;
}

// Gera um PDF da OS (layout idêntico ao da impressão de produção) e abre o
// compartilhamento — usado no build de teste.
async function shareWorkOrderPdf(token: string | null, id: string, signatureSvg: string, signerName: string) {
  const { workOrder: wo, timeline } = await getWorkOrder(token, id);
  const html = buildWorkOrderPrintHtml(wo, timeline ?? [], signatureSvg, signerName, API_BASE_URL);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `OS ${wo.code}`, UTI: 'com.adobe.pdf' });
  }
}

export function WorkOrderSignatureScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WorkOrderSignature'>>();
  const { token } = useAuth();
  const [signerName, setSignerName] = useState(route.params.signerName || '');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [saving, setSaving] = useState(false);
  const [padSize, setPadSize] = useState({ width: PAD_WIDTH, height: PAD_HEIGHT });
  const current = useRef<Point[]>([]);
  const padRef = useRef<View>(null);
  // Origem e tamanho do quadro em coordenadas de tela (medidos no layout).
  const padBox = useRef({ x: 0, y: 0, width: PAD_WIDTH, height: PAD_HEIGHT });

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  const measurePad = () => {
    padRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        padBox.current = { x, y, width, height };
        setPadSize({ width, height });
      }
    });
  };

  // Converte o toque (coordenadas de tela) para pixels reais dentro do quadro.
  const toLocal = (pageX: number, pageY: number): Point => {
    const { x, y, width, height } = padBox.current;
    return {
      x: Math.max(0, Math.min(width, pageX - x)),
      y: Math.max(0, Math.min(height, pageY - y)),
    };
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { pageX, pageY } = event.nativeEvent;
      current.current = [toLocal(pageX, pageY)];
      setStrokes(prev => [...prev, current.current]);
    },
    onPanResponderMove: (event) => {
      const { pageX, pageY } = event.nativeEvent;
      current.current = [...current.current, toLocal(pageX, pageY)];
      setStrokes(prev => [...prev.slice(0, -1), current.current]);
    },
  }), []);

  async function finish() {
    if (!signerName.trim()) {
      Alert.alert('Assinatura', 'Informe o nome de quem está assinando.');
      return;
    }
    if (strokes.flat().length < 8) {
      Alert.alert('Assinatura', 'Assine no quadro antes de concluir a OS.');
      return;
    }
    setSaving(true);
    try {
      await updateWorkOrderStatus(token, route.params.id, route.params.status, {
        signatureDataUrl: svgDataUrl(strokes, padSize.width, padSize.height),
        signerName: signerName.trim(),
        resolutionNotes: 'OS concluída com assinatura coletada no app mobile.',
      });
      // Volta o telefone para a vertical já ao salvar (junto com o compartilhamento).
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
      if (IS_TEST_BUILD) {
        // Ambiente de teste: gera o PDF da OS no aparelho e abre o compartilhamento.
        try {
          await shareWorkOrderPdf(token, route.params.id, svgMarkup(strokes, padSize.width, padSize.height), signerName.trim());
        } catch (pdfErr) {
          Alert.alert('OS concluída', 'OS salva, mas não foi possível gerar/compartilhar o PDF.');
          console.warn('Falha ao gerar/compartilhar PDF da OS:', pdfErr);
        }
      } else {
        Alert.alert('OS concluída', 'Assinatura salva e impressão solicitada ao Electron.');
      }
      nav.popToTop();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível concluir a OS.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0F172A', padding: 16, gap: 12 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={19} color="#fff" />
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Assinatura de conclusão</Text>
        <Pressable onPress={() => setStrokes([])} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="refresh" size={18} color="#fff" />
        </Pressable>
      </View>

      <View
        ref={padRef}
        style={{ backgroundColor: '#fff', borderRadius: 12, flex: 1, overflow: 'hidden' }}
        onLayout={measurePad}
        {...pan.panHandlers}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${padSize.width} ${padSize.height}`} preserveAspectRatio="none">
          {strokes.map((points, index) => <Path key={index} d={pointsToPath(points)} fill="none" stroke="#111827" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)}
        </Svg>
      </View>

      <TextInput
        value={signerName}
        onChangeText={setSignerName}
        placeholder="Nome de quem assinou"
        placeholderTextColor="rgba(255,255,255,.45)"
        style={{ height: 48, borderRadius: 12, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 15 }}
      />

      <Pressable
        onPress={finish}
        disabled={saving}
        style={{ height: 52, borderRadius: 14, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: saving ? 0.75 : 1 }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Concluir e solicitar impressão</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
