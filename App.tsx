import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { SplashScreen } from './src/components/Brand';
import { LoginScreen } from './src/screens/LoginScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/auth/auth-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { IS_TEST_BUILD } from './src/api/client';

Sentry.init({
  dsn: 'https://f970f6013e4d7cae4d4b4034bf865e06@o4511614147493888.ingest.us.sentry.io/4511614336172032',
  // Marca o app/ambiente no painel (mesma DSN do backend, separável por environment).
  environment: IS_TEST_BUILD ? 'prontus-test' : 'prontus-prod',
  // Não envia em dev (Expo Go / __DEV__).
  enabled: !__DEV__,
  // ⚠️ Dado médico: sem PII.
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});

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

function App() {
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

export default Sentry.wrap(App);
