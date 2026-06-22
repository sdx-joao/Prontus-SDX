import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { T, INV_TYPE } from '../theme/theme';
import type { InventoryItem } from '../data/mock';
import { useAuth } from '../auth/auth-context';
import { getInventory, resolveAsset } from '../api/mobile';
import { useResource } from '../api/use-resource';
import type { RootStackParamList } from '../navigation/types';

// Extrai o código patrimonial dos formatos suportados pela etiqueta de estoque:
//   sdxmobile://inventory/<code>   (custom scheme atual)
//   https://sdx.pro/i/<code>       (app link futuro)
//   SDX|INV|<code>|UNIDADE|...      (legado)
function parseAssetCode(raw: string): string | null {
  const v = raw.trim();
  const scheme = v.match(/^sdxmobile:\/\/inventory\/([^/?#]+)/i);
  if (scheme) return decodeURIComponent(scheme[1]);
  const link = v.match(/\/i\/([^/?#]+)/);
  if (link) return decodeURIComponent(link[1]);
  if (v.toUpperCase().startsWith('SDX|INV|')) return v.split('|')[2] || null;
  return null;
}

function Corner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const base = { position: 'absolute' as const, width: 30, height: 30, borderColor: color, borderWidth: 3 };
  const map = {
    tl: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
    tr: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
    bl: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
    br: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  };
  return <View style={[base, map[pos]]} />;
}

export function ScanScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [detecting, setDetecting] = useState<InventoryItem | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const locked = useRef(false);
  const accent = T.primary;
  const loader = useCallback(() => getInventory(token), [token]);
  const { data: inventory, loading: loadingInventory } = useResource(loader);

  const line = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(line, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ).start();
  }, [line]);
  const lineY = line.interpolate({ inputRange: [0, 1], outputRange: [14, 206] });

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const open = (item: InventoryItem) => {
    if (locked.current) return;
    locked.current = true;
    setDetecting(item);
    setTimeout(() => nav.replace('InventoryDetail', { id: item.id }), 700);
  };

  const onScanned = async (code: string) => {
    if (locked.current) return;
    setScanError(null);
    const asset = parseAssetCode(code);
    if (!asset) {
      setScanError('QR Code não reconhecido como etiqueta SDX.');
      return;
    }
    locked.current = true;
    try {
      const res = await resolveAsset(token, asset);
      setDetecting(res.item);
      setTimeout(() => nav.replace('InventoryDetail', { id: res.item.id }), 700);
    } catch {
      setScanError('Nenhum item encontrado para esta etiqueta.');
      locked.current = false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E18' }}>
      {permission?.granted && (
        <CameraView
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }: BarcodeScanningResult) => onScanned(data)}
        />
      )}
      {/* escurecedor sobre a câmera */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,11,20,.55)' }} />

      {/* top bar */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={19} color="#fff" />
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Escanear etiqueta</Text>
        <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="zap" size={18} color="#fff" />
        </View>
      </View>

      {/* viewfinder */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 24 }}>
        <View style={{ width: 234, height: 234, borderRadius: 12 }}>
          <Corner pos="tl" color={accent} /><Corner pos="tr" color={accent} />
          <Corner pos="bl" color={accent} /><Corner pos="br" color={accent} />
          {!detecting && (
            <Animated.View style={{ position: 'absolute', left: '5%', right: '5%', height: 2, borderRadius: 2, backgroundColor: accent, transform: [{ translateY: lineY }] }} />
          )}
          {detecting && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={28} color="#fff" strokeWidth={3} />
              </View>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Etiqueta reconhecida</Text>
            </View>
          )}
        </View>
        <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13.5, textAlign: 'center', lineHeight: 20, maxWidth: 240 }}>
          {detecting
            ? `Abrindo ${detecting.name}…`
            : permission?.granted
              ? 'Aponte a câmera para o QR Code da etiqueta do item para abrir os detalhes.'
              : 'Permita o acesso à câmera para escanear etiquetas.'}
        </Text>
        {!!scanError && <Text style={{ color: '#FECACA', fontSize: 12.5, textAlign: 'center', maxWidth: 260 }}>{scanError}</Text>}
        {permission && !permission.granted && (
          <Pressable onPress={requestPermission} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, backgroundColor: accent }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Permitir câmera</Text>
          </Pressable>
        )}
      </View>

      {/* bottom sheet — leitura manual para suporte e teste */}
      <View style={{ backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 11 }}>
          <Icon name="qr" size={14} color={T.faint} />
          <Text style={{ fontSize: 11.5, color: T.faint, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' }}>Itens recentes</Text>
        </View>
        {loadingInventory ? (
          <View style={{ height: 82, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={T.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
          {(inventory ?? []).slice(0, 20).map((it) => {
            const ty = INV_TYPE[it.primaryType];
            return (
              <Pressable
                key={it.id}
                onPress={() => open(it)}
                style={{ width: 118, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 11 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${accent}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                  <Icon name={ty.icon} size={17} color={accent} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: accent }}>{it.assetTag || it.sku}</Text>
                <Text numberOfLines={2} style={{ fontSize: 12, color: T.textSoft, marginTop: 3, lineHeight: 16 }}>{it.name}</Text>
              </Pressable>
            );
          })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
