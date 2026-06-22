import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { LoginBackground } from '../components/LoginBackground';
import { useKeyboardHeight } from '../components/use-keyboard-height';
import { BrandTile, PoweredBy } from '../components/Brand';
import { T } from '../theme/theme';
import { useAuth } from '../auth/auth-context';
import { ApiError, IS_TEST_BUILD } from '../api/client';
import { getRegisteredUsername } from '../auth/token-store';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Trava: este aparelho já criou um usuário de teste? (some o botão de criar)
  const [deviceLocked, setDeviceLocked] = useState(true);

  useEffect(() => {
    getRegisteredUsername()
      .then((registered) => {
        if (registered !== null) {
          setDeviceLocked(true);
          if (registered) setUsername(registered);
        } else {
          setDeviceLocked(false);
        }
      })
      .catch(() => setDeviceLocked(false));
  }, []);

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError('Informe usuário e senha.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (e) {
      if (e instanceof ApiError) setError(e.status === 401 ? 'Usuário ou senha inválidos.' : e.message);
      else setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!fullName.trim() || !username.trim() || password.length < 4) {
      setError('Preencha nome, usuário e uma senha (mín. 4 caracteres).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(username.trim(), password, fullName.trim());
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError('Não foi possível criar o usuário.');
    } finally {
      setLoading(false);
    }
  }

  const submit = mode === 'register' ? handleRegister : handleLogin;

  const field = (
    icon: string,
    value: string,
    setValue: (v: string) => void,
    placeholder: string,
    opts?: { secure?: boolean; capitalize?: 'none' | 'words' },
  ) => (
    <View style={{ height: 50, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 }}>
      <Icon name={icon} size={18} color="rgba(255,255,255,.7)" />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,.5)"
        secureTextEntry={opts?.secure}
        autoCapitalize={opts?.capitalize ?? 'none'}
        autoCorrect={false}
        editable={!loading}
        onSubmitEditing={submit}
        returnKeyType={opts?.secure ? 'go' : 'next'}
        style={{ flex: 1, fontSize: 14.5, color: '#fff', padding: 0 }}
      />
    </View>
  );

  const isRegister = mode === 'register';

  return (
    <LinearGradient colors={IS_TEST_BUILD ? ['#5A6373', '#8B93A4', '#6B7384'] : [T.primaryDark, T.primary, '#0B1A8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <LoginBackground />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: insets.top }}>
          <BrandTile size={72} />
          {IS_TEST_BUILD && (
            <View style={{ alignSelf: 'flex-start', marginTop: 14, paddingVertical: 3, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#F59E0B' }}>
              <Text style={{ color: '#1F2937', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 }}>VERSÃO DE TESTE</Text>
            </View>
          )}
          <Text style={{ marginTop: IS_TEST_BUILD ? 14 : 24, fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Prontus-SDX</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,.78)', lineHeight: 21 }}>
            {isRegister ? 'Crie seu usuário de teste para acessar o app.' : 'Insira suas credenciais para acessar o Prontus-SDX.'}
          </Text>

          <View style={{ marginTop: 30, gap: 12 }}>
            {isRegister && field('user', fullName, setFullName, 'nome completo', { capitalize: 'words' })}
            {field('user', username, setUsername, 'usuário')}
            {field('tag', password, setPassword, 'senha', { secure: true })}
          </View>

          {!!error && <Text style={{ marginTop: 14, color: '#FECACA', fontSize: 13.5, fontWeight: '500' }}>{error}</Text>}

          <Pressable
            onPress={submit}
            disabled={loading}
            style={{ marginTop: 22, height: 52, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color={T.primary} />
            ) : (
              <>
                <Text style={{ color: T.primary, fontSize: 15.5, fontWeight: '700' }}>{isRegister ? 'Criar e entrar' : 'Entrar'}</Text>
                <Icon name="chevron-right" size={18} color={T.primary} />
              </>
            )}
          </Pressable>

          {/* Auto-cadastro: só no build de teste e enquanto o aparelho não criou um usuário */}
          {IS_TEST_BUILD && !deviceLocked && (
            <Pressable
              onPress={() => { setError(null); setMode(isRegister ? 'login' : 'register'); }}
              style={{ marginTop: 18, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>
                {isRegister ? 'Já tenho usuário — entrar' : 'Criar usuário de teste'}
              </Text>
            </Pressable>
          )}
        </View>

        {keyboardHeight === 0 && (
          <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 30, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontStyle: 'italic' }}>Hospital do Olho Júlio Cândido de Brito</Text>
            <PoweredBy tone="light" />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
