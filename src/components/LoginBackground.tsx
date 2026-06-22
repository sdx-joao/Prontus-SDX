import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

/** Mancha de cor com borda esmaecida (gradiente radial) — a "gota" de líquido. */
function Blob({ id, size, color, opacity }: { id: string; size: number; color: string; opacity: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.5} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="50" cy="50" rx="50" ry="50" fill={`url(#${id})`} />
    </Svg>
  );
}

type Drop = {
  id: string;
  size: number;
  color: string;
  opacity: number;
  left: number;
  top: number;
  duration: number;
  // pontos do caminho (curva orgânica) em px relativos
  px: number[];
  py: number[];
  scale: [number, number];
};

const DROPS: Drop[] = [
  { id: 'd1', size: W * 1.1, color: '#3E7BFF', opacity: 0.55, left: -W * 0.3, top: -H * 0.05, duration: 9000, px: [0, 70, 30, 90, 0], py: [0, 40, 90, 50, 0], scale: [1, 1.18] },
  { id: 'd2', size: W * 1.25, color: '#7C3AED', opacity: 0.5, left: W * 0.25, top: H * 0.45, duration: 11500, px: [0, -80, -30, -70, 0], py: [0, -60, -20, -80, 0], scale: [1.1, 0.9] },
  { id: 'd3', size: W * 0.95, color: '#22D3EE', opacity: 0.42, left: W * 0.35, top: -H * 0.08, duration: 10000, px: [0, -50, 30, -40, 0], py: [0, 70, 110, 60, 0], scale: [0.95, 1.2] },
  { id: 'd4', size: W * 1.05, color: '#2563EB', opacity: 0.5, left: -W * 0.25, top: H * 0.5, duration: 12500, px: [0, 60, 100, 40, 0], py: [0, -40, -90, -50, 0], scale: [1.05, 0.92] },
];

function AnimatedDrop({ drop }: { drop: Drop }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(p, { toValue: 1, duration: drop.duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [p, drop.duration]);

  const range = [0, 0.25, 0.5, 0.75, 1];
  const translateX = p.interpolate({ inputRange: range, outputRange: drop.px });
  const translateY = p.interpolate({ inputRange: range, outputRange: drop.py });
  const scale = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [drop.scale[0], drop.scale[1], drop.scale[0]] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: drop.left,
        top: drop.top,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Blob id={drop.id} size={drop.size} color={drop.color} opacity={drop.opacity} />
    </Animated.View>
  );
}

/**
 * Fundo "líquido" da tela de login: gotas de cor grandes e esmaecidas que
 * fluem e se misturam bem devagar (estilo lava-lamp). Visível mas calmo, para
 * dar vida sem competir com o formulário. Não captura toques.
 */
export function LoginBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DROPS.map(drop => (
        <AnimatedDrop key={drop.id} drop={drop} />
      ))}
    </View>
  );
}
