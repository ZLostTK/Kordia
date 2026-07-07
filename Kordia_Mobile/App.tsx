import { Suspense } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DatabaseProvider } from './src/database/DatabaseProvider';
import { PlayerProvider } from './src/services/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';

function Fallback() {
  return (
    <View style={s.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={s.loadingText}>Loading...</Text>
    </View>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <DatabaseProvider>
        <PlayerProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </PlayerProvider>
      </DatabaseProvider>
    </Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 16 },
});
