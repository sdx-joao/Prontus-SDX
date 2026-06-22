import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { FieldLabel } from './ui';
import { T } from '../theme/theme';
import { useKeyboardHeight } from './use-keyboard-height';
import type { WorkOrderRequester } from '../api/mobile';

function normalizeForSearch(value: string) {
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
 * Seletor de Solicitante: tocar abre um modal com busca. Selecionar um
 * solicitante existente preenche nome + setor + telefone. Quando o nome buscado
 * não existe, o botão "+ Adicionar" abre um mini-formulário com os campos
 * conjuntos (nome, telefone e setor sugerido) e devolve tudo de uma vez.
 */
export function RequesterPicker({
  value,
  department,
  requesters,
  onPick,
}: {
  value: string;
  department: string;
  requesters: WorkOrderRequester[];
  onPick: (requester: WorkOrderRequester) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDept, setNewDept] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const dept = normalizeForSearch(department);
  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    return requesters
      .filter(item => !q || normalizeForSearch(item.name).includes(q))
      .sort((a, b) => {
        if (!dept) return a.name.localeCompare(b.name, 'pt-BR');
        const aRank = a.department && normalizeForSearch(a.department) === dept ? 0 : a.department ? 2 : 1;
        const bRank = b.department && normalizeForSearch(b.department) === dept ? 0 : b.department ? 2 : 1;
        return aRank - bRank || a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [requesters, query, dept]);

  const trimmed = query.trim();
  const exactExists = trimmed.length > 0 && requesters.some(r => normalizeForSearch(r.name) === normalizeForSearch(trimmed));
  const canAdd = trimmed.length > 0 && !exactExists;

  const reset = () => {
    setQuery('');
    setAdding(false);
    setNewName('');
    setNewPhone('');
    setNewDept('');
  };

  const close = () => { setOpen(false); reset(); };

  const startAdding = () => {
    setNewName(trimmed);
    setNewDept(department || '');
    setNewPhone('');
    setAdding(true);
  };

  const confirmExisting = (requester: WorkOrderRequester) => {
    onPick(requester);
    close();
  };

  const confirmNew = () => {
    const name = newName.trim();
    if (!name) return;
    onPick({
      id: `new-${Date.now()}`,
      source: 'catalog',
      name,
      department: newDept.trim() || null,
      phone: newPhone.trim() || null,
      linkedUserId: null,
    });
    close();
  };

  return (
    <View>
      <FieldLabel required>Solicitante</FieldLabel>
      <Pressable
        onPress={() => { reset(); setOpen(true); }}
        style={{ ...SHEET_INPUT, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, color: value ? T.text : T.faint }}>
          {value || 'Quem solicitou'}
        </Text>
        <Icon name="chevron-down" size={18} color={T.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end', paddingBottom: keyboardHeight }}>
            <Pressable onPress={() => {}} style={{ backgroundColor: T.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 480, paddingTop: 10 }}>
              <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.border }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: T.text }}>
                  {adding ? 'Novo solicitante' : 'Solicitante'}
                </Text>
                <Pressable onPress={close} hitSlop={10}><Icon name="x" size={20} color={T.muted} /></Pressable>
              </View>

              {adding ? (
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
                  <View style={{ gap: 11 }}>
                    <View>
                      <FieldLabel required>Nome</FieldLabel>
                      <TextInput value={newName} onChangeText={setNewName} placeholder="Nome completo" placeholderTextColor={T.faint} autoFocus style={SHEET_INPUT} />
                    </View>
                    <View>
                      <FieldLabel>Telefone</FieldLabel>
                      <TextInput value={newPhone} onChangeText={setNewPhone} placeholder="(00) 00000-0000" placeholderTextColor={T.faint} keyboardType="phone-pad" style={SHEET_INPUT} />
                    </View>
                    <View>
                      <FieldLabel>Setor sugerido</FieldLabel>
                      <TextInput value={newDept} onChangeText={setNewDept} placeholder="Setor" placeholderTextColor={T.faint} style={SHEET_INPUT} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <Pressable onPress={() => setAdding(false)} style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>Voltar</Text>
                      </Pressable>
                      <Pressable onPress={confirmNew} disabled={!newName.trim()} style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: newName.trim() ? 1 : 0.5 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Usar solicitante</Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Buscar ou escrever novo nome..."
                      placeholderTextColor={T.faint}
                      autoFocus
                      style={SHEET_INPUT}
                    />
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
                    {canAdd && (
                      <Pressable
                        onPress={startAdding}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 13, paddingHorizontal: 13, borderRadius: 11, marginBottom: 8, borderWidth: 1, borderColor: T.primary, backgroundColor: `${T.primary}10` }}
                      >
                        <Icon name="plus" size={17} color={T.primary} />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: T.primary }} numberOfLines={1}>Adicionar “{trimmed}” (nome, telefone, setor)</Text>
                      </Pressable>
                    )}
                    {filtered.length === 0 && !canAdd ? (
                      <Text style={{ fontSize: 13, color: T.muted, paddingVertical: 18, textAlign: 'center' }}>Nenhum solicitante encontrado.</Text>
                    ) : (
                      filtered.map(item => {
                        const deptMatch = !!dept && !!item.department && normalizeForSearch(item.department) === dept;
                        const selected = normalizeForSearch(value) === normalizeForSearch(item.name);
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => confirmExisting(item)}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12, paddingHorizontal: 13, borderRadius: 11, marginBottom: 6, borderWidth: 1, borderColor: selected ? T.primary : deptMatch ? '#059669' : T.border, backgroundColor: selected ? `${T.primary}10` : deptMatch ? '#E6F6EF' : T.surface }}
                          >
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: selected ? T.primary : T.text }}>{item.name}</Text>
                              <Text numberOfLines={1} style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>
                                {[item.department, item.phone].filter(Boolean).join(' · ') || 'Sem setor/telefone'}
                              </Text>
                            </View>
                            {selected && <Icon name="check" size={17} color={T.primary} />}
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                </>
              )}
            </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
