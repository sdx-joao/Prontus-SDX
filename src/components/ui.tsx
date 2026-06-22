import type { ReactElement, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useKeyboardHeight } from './use-keyboard-height';
import { IS_TEST_BUILD } from '../api/client';
import { T, type Tone } from '../theme/theme';

// ── Badge (pílula com dot) ──────────────────────────────────────────────────
export function Badge({
  tone,
  label,
  badgeStyle = 'soft',
  size = 'md',
  dot = true,
}: {
  tone: Tone;
  label?: string;
  badgeStyle?: 'soft' | 'solid';
  size?: 'sm' | 'md';
  dot?: boolean;
}) {
  const compact = size === 'sm';
  const text = tone.label || label || '';
  if (badgeStyle === 'solid') {
    return (
      <View
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingVertical: compact ? 2 : 3, paddingHorizontal: compact ? 8 : 10,
          borderRadius: 999, backgroundColor: tone.solid,
        }}
      >
        <Text style={{ color: '#fff', fontSize: compact ? 10.5 : 11.5, fontWeight: '600' }}>{text}</Text>
      </View>
    );
  }
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingVertical: compact ? 2 : 3, paddingHorizontal: compact ? 8 : 10,
        borderRadius: 999, backgroundColor: tone.soft,
      }}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.solid }} />}
      <Text style={{ color: tone.fg || tone.solid, fontSize: compact ? 10.5 : 11.5, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

// ── Linha de chips de filtro (scroll horizontal) ────────────────────────────
export type Chip = { key: string; label: string; count?: number };
export function ChipRow({
  chips, active, onPick, accent,
}: { chips: Chip[]; active: string; onPick: (k: string) => void; accent: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 2 }}
    >
      {chips.map((c) => {
        const on = active === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onPick(c.key)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
              borderWidth: 1, borderColor: on ? accent : T.border,
              backgroundColor: on ? accent : T.surface,
            }}
          >
            <Text style={{ color: on ? '#fff' : T.textSoft, fontSize: 12.5, fontWeight: '600' }}>{c.label}</Text>
            {c.count != null && (
              <View
                style={{
                  minWidth: 16, paddingHorizontal: 5, borderRadius: 999, alignItems: 'center',
                  backgroundColor: on ? 'rgba(255,255,255,.25)' : T.surfaceMuted,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: on ? '#fff' : T.muted }}>{c.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Campo de busca ──────────────────────────────────────────────────────────
export function SearchField({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42,
        backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12,
      }}
    >
      <Icon name="search" size={17} color={T.faint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.faint}
        style={{ flex: 1, fontSize: 14, color: T.text, padding: 0 }}
      />
      {!!value && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Icon name="x" size={15} color={T.faint} />
        </Pressable>
      )}
    </View>
  );
}

// ── Cartão de seção ─────────────────────────────────────────────────────────
export function SectionCard({
  title, action, children,
}: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
        borderRadius: 14, padding: 14, marginBottom: 12,
      }}
    >
      {!!title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: T.text, letterSpacing: 0.2 }}>{title}</Text>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

export function StatItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ minWidth: 0 }}>
      <Text style={{ fontSize: 11, color: T.faint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</Text>
      <Text style={{ fontSize: 13.5, color: T.text, fontWeight: '500', lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Text style={{ fontSize: 12.5, fontWeight: '600', color: T.textSoft, marginBottom: 6 }}>
      {children}{required && <Text style={{ color: T.danger }}> *</Text>}
    </Text>
  );
}

// Campo "fake" (apenas visual) — usado nos formulários do conceito
export function FakeInput({ placeholder, value, chevron }: { placeholder?: string; value?: string; chevron?: boolean }) {
  return (
    <View
      style={{
        height: 44, borderRadius: 11, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13,
      }}
    >
      <Text numberOfLines={1} style={{ fontSize: 14, color: value ? T.text : T.faint }}>{value || placeholder}</Text>
      {chevron && <Icon name="chevron-right" size={16} color={T.faint} />}
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 56, paddingHorizontal: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: T.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} color={T.faint} />
      </View>
      <Text style={{ fontSize: 14, color: T.muted, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

export function MetaRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon name={icon} size={14} color={T.faint} />
      <Text numberOfLines={1} style={{ fontSize: 12.5, color: T.muted, flexShrink: 1 }}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: T.text, letterSpacing: 0.2 }}>{children}</Text>
      {action}
    </View>
  );
}

export function TextLink({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Text style={{ fontSize: 12.5, fontWeight: '600', color: T.primary }}>{children}</Text>
    </Pressable>
  );
}

// ── Header azul com gradiente ───────────────────────────────────────────────
export function BlueHeader({ children, compact }: { children: ReactNode; compact?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={IS_TEST_BUILD ? ['#8B93A4', '#5A6373'] : [T.primary, T.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + (compact ? 8 : 12),
        paddingBottom: compact ? 18 : 20,
        paddingHorizontal: 18,
      }}
    >
      {IS_TEST_BUILD && (
        <View style={{ alignSelf: 'center', marginBottom: 9, paddingVertical: 2, paddingHorizontal: 11, borderRadius: 999, backgroundColor: '#F59E0B' }}>
          <Text style={{ color: '#1F2937', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>VERSÃO DE TESTE</Text>
        </View>
      )}
      {children}
    </LinearGradient>
  );
}

// Botão circular (sino) no header
function HeaderBell() {
  return (
    <Pressable
      style={{
        width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.14)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon name="bell" size={19} color="#fff" />
      <View style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FBBF24', borderWidth: 1.5, borderColor: '#1538C9' }} />
    </Pressable>
  );
}

// Tela de módulo (lista): header azul + CTA + corpo rolável
export function ModuleScreen({
  title, subtitle, onNew, newLabel, newIcon = 'plus', accent = T.primary, children, contentStyle, refreshControl,
}: {
  title: string;
  subtitle?: string;
  onNew?: () => void;
  newLabel?: string;
  newIcon?: string;
  accent?: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  const keyboardHeight = useKeyboardHeight();
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <BlueHeader>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
            {!!subtitle && <Text style={{ marginTop: 5, fontSize: 13, color: 'rgba(255,255,255,.78)' }}>{subtitle}</Text>}
          </View>
          <HeaderBell />
        </View>
        {onNew && (
          <Pressable
            onPress={onNew}
            style={{
              marginTop: 16, height: 44, borderRadius: 12, backgroundColor: '#fff',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Icon name={newIcon} size={18} color={accent} />
            <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>{newLabel}</Text>
          </Pressable>
        )}
      </BlueHeader>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingTop: onNew ? 10 : 12, paddingBottom: 48 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

// Tela de detalhe: header azul com "Voltar" + corpo rolável
export function DetailScaffold({
  onBack, eyebrow, title, badge, headerExtra, compact, children, refreshControl,
}: {
  onBack: () => void;
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  headerExtra?: ReactNode;
  compact?: boolean;
  children: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  const keyboardHeight = useKeyboardHeight();
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <BlueHeader compact={compact}>
        <Pressable
          onPress={onBack}
          style={{
            alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
            paddingVertical: 6, paddingLeft: 6, paddingRight: 10, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.14)',
          }}
        >
          <Icon name="arrow-left" size={17} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Voltar</Text>
        </Pressable>
        {!!eyebrow && <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,.7)', letterSpacing: 0.3 }}>{eyebrow}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
          <Text style={{ flex: 1, color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.2, lineHeight: 25 }}>{title}</Text>
          {badge && <View style={{ marginTop: 3 }}>{badge}</View>}
        </View>
        {headerExtra}
      </BlueHeader>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

// Estado de carregando (spinner centralizado)
export function LoadingState() {
  return (
    <View style={{ paddingVertical: 64, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={T.primary} />
    </View>
  );
}

// Botão primário grande (CTA de formulário)
export function PrimaryButton({ label, icon, accent = T.primary, onPress }: { label: string; icon?: string; accent?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 50, borderRadius: 14, backgroundColor: accent,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {icon && <Icon name={icon} size={18} color="#fff" />}
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
