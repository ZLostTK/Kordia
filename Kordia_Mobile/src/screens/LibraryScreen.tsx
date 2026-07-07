import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, type OfflineSong } from '../services/api';
import { usePlayer } from '../services/PlayerContext';

export default function LibraryScreen() {
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const { play } = usePlayer();

  useFocusEffect(useCallback(() => {
    api.getOfflineSongs().then(setSongs).catch(() => {});
  }, []));

  return (
    <View style={s.container}>
      <Text style={s.header}>Offline Songs</Text>
      <FlatList
        data={songs}
        keyExtractor={i => i.ytid}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => play(item)}>
            <View style={s.info}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Text style={s.artist}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>No offline songs yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', padding: 12 },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  artist: { color: '#888', fontSize: 13, marginTop: 2 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
});
