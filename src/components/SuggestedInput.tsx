import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { FieldLabel } from './ui';
import { T } from '../theme/theme';
import { useKeyboardHeight } from './use-keyboard-height';
import type { SelectOption } from '../api/mobile';

function norm(value: string) {
  return value.toUpperCase().trim();
}

const SHEET_INPUT = {
  minHeight: 44,
  borderRadius: 11,
  borderWidth: 1,
  borderColor: T.border,
  backgroundColor: T.surface,
  paddingHorizontal: 13,
  fontSize: 14,
  color: T.text,
} as const;

/**
 * Campo de catálogo no estilo "select": tocar abre um modal com busca e lista
 * vertical. Quando o texto buscado não retorna correspondência exata, mostra
 * um botão "+ Adicionar" que seleciona o novo valor e fecha. Bom para listas
 * grandes e ainda permite valores novos.
 */
export function SuggestedInput({
  label,
  value,
  onChangeText,
  placeholder,
  options,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return options;
    return options.filter(o => norm(o.label).includes(q) || norm(o.value).includes(q));
  }, [options, query]);

  const trimmed = query.trim();
  const exactExists = trimmed.length > 0 && options.some(o => norm(o.value) === norm(trimmed) || norm(o.label) === norm(trimmed));
  const canAdd = trimmed.length > 0 && !exactExists;

  const choose = (next: string) => {
    onChangeText(next);
    setQuery('');
    setOpen(false);
  };

  return (
    <View>
      <FieldLabel required={required}>{label}</FieldLabel>
      <Pressable
        onPress={() => { setQuery(''); setOpen(true); }}
        style={{ ...SHEET_INPUT, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, color: value ? T.text : T.faint }}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={T.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end', paddingBottom: keyboardHeight }}>
            <Pressable onPress={() => {}} style={{ backgroundColor: T.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 460, paddingTop: 10 }}>
              <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.border }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: T.text }}>{label}</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={10}><Icon name="x" size={20} color={T.muted} /></Pressable>
              </View>
              <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar ou escrever novo..."
                  placeholderTextColor={T.faint}
                  autoFocus
                  style={SHEET_INPUT}
                />
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
                {canAdd && (
                  <Pressable
                    onPress={() => choose(trimmed)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 13, paddingHorizontal: 13, borderRadius: 11, marginBottom: 8, borderWidth: 1, borderColor: T.primary, backgroundColor: `${T.primary}10` }}
                  >
                    <Icon name="plus" size={17} color={T.primary} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: T.primary }} numberOfLines={1}>Adicionar “{trimmed}”</Text>
                  </Pressable>
                )}
                {filtered.length === 0 && !canAdd ? (
                  <Text style={{ fontSize: 13, color: T.muted, paddingVertical: 18, textAlign: 'center' }}>Nenhuma opção encontrada.</Text>
                ) : (
                  filtered.map(option => {
                    const selected = value === option.value;
                    return (
                      <Pressable
                        key={`${option.kind}-${option.value}`}
                        onPress={() => choose(option.value)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 13, paddingHorizontal: 13, borderRadius: 11, marginBottom: 6, borderWidth: 1, borderColor: selected ? T.primary : T.border, backgroundColor: selected ? `${T.primary}10` : T.surface }}
                      >
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: selected ? '700' : '500', color: selected ? T.primary : T.text }}>{option.label}</Text>
                        {selected && <Icon name="check" size={17} color={T.primary} />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
