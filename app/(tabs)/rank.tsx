import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  Platform,
  StatusBar,
  LogBox
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { searchAndGetLinks } from '@/utils/spotifySearch';
import { useThemeColor } from '@/hooks/useThemeColor';
import SongSwiper, { Song } from '@/components/SongSwiper';

const initialSongsData: Omit<Song, 'id' | 'imageUri' | 'audioUri' | 'album'>[] = [
  { title: 'Otro Atardecer', artist: 'Bad Bunny, The Marías', year: '2025', genre: 'Trap', rank: 0 },
  { title: 'PARANORMAL', artist: 'Tainy, Alvaro Diaz', year: '2025', genre: 'Pop', rank: 0 },
  { title: 'DtMF', artist: 'Bad Bunny', year: '2025', genre: 'Reggaeton', rank: 0 },
  { title: 'MONACO', artist: 'Bad Bunny', year: '2025', genre: 'Reggaeton', rank: 0 },
  { title: 'NUEVAYoL', artist: 'Bad Bunny', year: '2025', genre: 'Reggaeton', rank: 0 },
];

LogBox.ignoreLogs([
  "Warning: useInsertionEffect must not schedule updates.",
]);

export default function RankPage() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const [songs, setSongs] = useState<Song[]>([]);
  const [isRankingSessionActive, setIsRankingSessionActive] = useState(false);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);

  const startRankingSession = async () => {
    setIsFetchingSongs(true);
    try {
      const fetched: Song[] = (
        await Promise.all(
          initialSongsData.map(async (s, idx) => {
            const base: Song = {
              id: `${idx}`,
              title: s.title,
              artist: s.artist,
              album: '',
              year: s.year,
              imageUri: '',
              genre: s.genre,
              audioUri: '',
              rank: 0,
            };
            const result = await searchAndGetLinks(s.title);
            if (result.success && result.results.length) {
              const track = result.results[0];
              return {
                ...base,
                audioUri: track.audioUri ?? base.audioUri,
                imageUri: track.image  ?? base.imageUri,
                album:    track.album  ?? base.album,
              };
            }
            return base;
          })
        )
      ).filter(s => s.audioUri);

      if (!fetched.length) {
        Alert.alert('Error', 'No songs could be loaded. Please try again.');
        return;
      }
      setSongs(fetched);
      setIsRankingSessionActive(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch song details.');
    } finally {
      setIsFetchingSongs(false);
    }
  };

  const handleRankingComplete = () => {
    setIsRankingSessionActive(false);
    setSongs([]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {isRankingSessionActive ? (
        <SongSwiper songs={songs} onRankingComplete={handleRankingComplete} />
      ) : (
        <View style={styles.onboardingContainer}>
          <MaterialIcons name="queue-music" size={64} color={textColor} />
          <Text style={[styles.title, { color: textColor }]}>Ready to Rank?</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Swipe right to rank songs from 1 to 5
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={startRankingSession}
            disabled={isFetchingSongs}
          >
            {isFetchingSongs ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Start Ranking Session</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  onboardingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
});
