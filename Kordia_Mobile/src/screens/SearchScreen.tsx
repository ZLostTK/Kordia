import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { api, type SearchResult } from '../services/api';
import { usePlayer } from '../services/PlayerContext';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { play } = usePlayer();

  const doSearch = async () => {
    if (!q.trim()) return;
    const r = await api.search(q.trim());
    setResults(r);
  };

  return (
    <View style={s.container}>
      <TextInput style={s.input} placeholder="Search YouTube..." value={q} onChangeText={setQ} onSubmitEditing={doSearch} returnKeyType="search" />
      <FlatList
        data={results}
        keyExtractor={i => i.ytid}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => play(item)}>
            <View style={s.info}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Text style={s.artist}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', margin: 12, padding: 14, borderRadius: 10, fontSize: 16 },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  artist: { color: '#888', fontSize: 13, marginTop: 2 },
});
