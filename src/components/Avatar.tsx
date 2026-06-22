import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { T } from '../theme/theme';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Avatar do usuário: mostra a foto vinda do backend (com bearer token) e cai
 * para as iniciais se não houver foto ou der erro ao carregar.
 */
export function Avatar({
  name,
  avatarUrl,
  size = 52,
  radius,
  bgColor,
  textColor,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  radius?: number;
  bgColor?: string;
  textColor?: string;
}) {
  const { token } = useAuth();
  const [failed, setFailed] = useState(false);
  const br = radius ?? Math.round(size * 0.29);
  const showImage = !!avatarUrl && !failed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: br,
        backgroundColor: bgColor ?? `${T.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <Image
          source={{
            uri: `${API_BASE_URL}${avatarUrl}`,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: size * 0.34, fontWeight: '800', color: textColor ?? T.primary }}>{initials(name)}</Text>
      )}
    </View>
  );
}
