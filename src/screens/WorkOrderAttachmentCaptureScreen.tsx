import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '../components/Icon';
import { T } from '../theme/theme';
import { uploadWorkOrderAttachment, type WorkOrderAttachmentCategory } from '../api/mobile';
import { useAuth } from '../auth/auth-context';
import type { RootStackParamList } from '../navigation/types';

const CATEGORY_OPTIONS: Array<{ key: WorkOrderAttachmentCategory; label: string }> = [
  { key: 'before', label: 'Antes' },
  { key: 'after', label: 'Depois' },
  { key: 'general', label: 'Geral' },
];

export function WorkOrderAttachmentCaptureScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WorkOrderAttachmentCapture'>>();
  const { token } = useAuth();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [category, setCategory] = useState<WorkOrderAttachmentCategory>(route.params.category || 'general');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const capture = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.72,
        skipProcessing: false,
        shutterSound: false,
      });
      if (!photo?.uri) throw new Error('Não foi possível capturar a foto.');
      await uploadWorkOrderAttachment(token, route.params.id, {
        uri: photo.uri,
        name: `os-${route.params.id}-${category}-${Date.now()}.jpg`,
        type: 'image/jpeg',
        category,
        comment,
      });
      Alert.alert('Foto enviada', 'A foto foi anexada à ordem de serviço.');
      nav.goBack();
    } catch (error) {
      Alert.alert('Erro ao anexar foto', error instanceof Error ? error.message : 'Falha inesperada.');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator color={T.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: T.bg }}>
        <Text style={{ fontSize: 19, fontWeight: '800', color: T.text, textAlign: 'center' }}>Permitir câmera</Text>
        <Text style={{ fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 20 }}>
          A câmera é necessária para anexar fotos à ordem de serviço.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{ height: 48, borderRadius: 14, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Permitir câmera</Text>
        </Pressable>
        <Pressable onPress={() => nav.goBack()} style={{ alignItems: 'center', padding: 8 }}>
          <Text style={{ color: T.muted, fontSize: 13, fontWeight: '700' }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 46, paddingHorizontal: 16 }}>
        <Pressable
          onPress={() => nav.goBack()}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 11,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,.48)',
          }}
        >
          <Icon name="arrow-left" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Voltar</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
       <View
        style={{
          padding: 16,
          paddingBottom: 28,
          gap: 12,
          backgroundColor: 'rgba(15,23,42,.86)',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CATEGORY_OPTIONS.map(option => {
            const active = category === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setCategory(option.key)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? '#fff' : 'rgba(255,255,255,.12)',
                  borderWidth: 1,
                  borderColor: active ? '#fff' : 'rgba(255,255,255,.22)',
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: active ? T.primary : '#fff' }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Comentário da foto"
          placeholderTextColor="rgba(255,255,255,.55)"
          style={{
            minHeight: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,.22)',
            color: '#fff',
            paddingHorizontal: 12,
            fontSize: 14,
            backgroundColor: 'rgba(255,255,255,.10)',
          }}
        />

        <Pressable
          onPress={capture}
          disabled={saving}
          style={{
            height: 54,
            borderRadius: 18,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 9,
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? <ActivityIndicator color={T.primary} /> : <Icon name="camera" size={20} color={T.primary} />}
          <Text style={{ color: T.primary, fontSize: 15.5, fontWeight: '800' }}>{saving ? 'Enviando...' : 'Capturar e anexar'}</Text>
        </Pressable>
       </View>
      </KeyboardAvoidingView>
    </View>
  );
}
