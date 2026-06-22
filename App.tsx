import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/components/Brand';
import { LoginScreen } from './src/screens/LoginScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/auth/auth-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function Root() {
  const { status } = useAuth();

  if (status === 'loading') return <SplashScreen label="Iniciando sessão…" />;
  if (status === 'unauthenticated') return <LoginScreen />;

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
