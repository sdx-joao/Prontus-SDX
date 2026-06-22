import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme/theme';

const BADGE = require('../../assets/brand/badge.png');
const WORDMARK = require('../../assets/brand/wordmark.png');

// Tile branco arredondado segurando o badge circular (uso sobre fundo azul/escuro)
export function BrandTile({ size = 84, radius, badge = 0.74, shadow = true }: { size?: number; radius?: number; badge?: number; shadow?: boolean }) {
  const r = radius != null ? radius : Math.round(size * 0.27);
  return (
    <View
      style={{
        width: size, height: size, borderRadius: r, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        ...(shadow
          ? { shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 17, elevation: 10 }
          : {}),
      }}
    >
      <Image source={BADGE} style={{ width: size * badge, height: size * badge, resizeMode: 'contain' }} />
    </View>
  );
}

// Badge circular puro (uso sobre superfícies claras)
export function BrandBadge({ size = 32 }: { size?: number }) {
  return <Image source={BADGE} style={{ width: size, height: size, resizeMode: 'contain' }} />;
}

// Wordmark scandex+ — SOMENTE sobre fundo branco/claro (a imagem tem fundo branco)
export function Wordmark({ width = 132 }: { width?: number }) {
  return <Image source={WORDMARK} style={{ width, height: width * 0.26, resizeMode: 'contain' }} />;
}

// Lockup "powered by" dentro de uma pílula branca (seguro sobre qualquer fundo)
export function PoweredBy({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const light = tone === 'light';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: light ? 'rgba(255,255,255,.6)' : T.faint }}>powered by</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 5, paddingLeft: 6, paddingRight: 12 }}>
        <BrandBadge size={20} />
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#2B2B2B', letterSpacing: -0.2 }}>
          scandex<Text style={{ color: '#3E8FBE' }}>+</Text>
        </Text>
      </View>
    </View>
  );
}

// ── Splash / Loading ─────────────────────────────────────────────────────────
export function SplashScreen({ label = 'Carregando…' }: { label?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ).start();
  }, [pulse, progress]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const barX = progress.interpolate({ inputRange: [0, 1], outputRange: [-70, 168] });

  return (
    <LinearGradient
      colors={[T.primary, T.primaryDark, '#06165F']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
        <Animated.View
          style={{
            position: 'absolute', width: 104, height: 104, borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,.16)', transform: [{ scale: haloScale }], opacity: haloOpacity,
          }}
        />
        <BrandTile size={96} />
      </View>

      <Text style={{ fontSize: 27, fontWeight: '800', color: '#fff', letterSpacing: -0.4 }}>ScandexPRO™</Text>
      <Text style={{ marginTop: 7, fontSize: 13, color: 'rgba(255,255,255,.62)' }}>Gestão de serviços e inventário</Text>

      <View style={{ width: 168, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)', overflow: 'hidden', marginTop: 30 }}>
        <Animated.View style={{ height: '100%', width: 70, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.95)', transform: [{ translateX: barX }] }} />
      </View>
      <Text style={{ marginTop: 13, fontSize: 12, color: 'rgba(255,255,255,.5)', letterSpacing: 0.3 }}>{label}</Text>

      <View style={{ position: 'absolute', bottom: 38 }}>
        <PoweredBy tone="light" />
      </View>
    </LinearGradient>
  );
}
