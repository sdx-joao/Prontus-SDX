import { Component, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

/**
 * Captura erros de render para mostrar a mensagem na tela em vez de uma tela
 * preta — facilita diagnosticar crashes em runtime no dev build.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0F172A', paddingTop: 60, paddingHorizontal: 20 }}>
          <Text style={{ color: '#F87171', fontSize: 18, fontWeight: '800', marginBottom: 10 }}>Erro na tela</Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 13, marginBottom: 12 }}>{this.state.error.message}</Text>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
