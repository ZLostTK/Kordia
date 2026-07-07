import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayer } from '../services/PlayerContext';

function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { track, playing, currentTime, duration, buffering, toggle, seek } = usePlayer();

  if (!track) {
    return (
      <View style={s.container}>
        <Text style={s.empty}>No track selected</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.art} />
      <Text style={s.title} numberOfLines={1}>{track.title}</Text>
      <Text style={s.artist}>{track.artist}</Text>

      <View style={s.progress}>
        <Text style={s.time}>{fmt(currentTime)}</Text>
        <Slider
          style={s.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          onSlidingComplete={seek}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#555"
          thumbTintColor="#1DB954"
        />
        <Text style={s.time}>{fmt(duration)}</Text>
      </View>

      <View style={s.controls}>
        <TouchableOpacity style={s.btn} onPress={toggle}>
          <Text style={s.btnText}>{buffering ? '...' : playing ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  art: { width: 250, height: 250, backgroundColor: '#222', borderRadius: 12, marginBottom: 30 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  artist: { color: '#888', fontSize: 16, marginTop: 4, textAlign: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 30 },
  slider: { flex: 1, marginHorizontal: 8 },
  time: { color: '#888', fontSize: 12, minWidth: 35 },
  controls: { flexDirection: 'row', marginTop: 30 },
  btn: { backgroundColor: '#1DB954', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
  btnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  empty: { color: '#555', fontSize: 18 },
});
