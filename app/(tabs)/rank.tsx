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
import { getSpotifyToken } from '@/utils/spotifyAuth';
import axiosInstance from '@/api/axiosInstance';

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
      const token = await getSpotifyToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please connect your Spotify account in the Profile tab.');
        return;
      }
      const limit = 5;
      const response = await axiosInstance.get(`/song-recommendation/${limit}`, {
        headers: { 'Spotify-Token': `Bearer ${token}` },
      });
      const recSongs = response.data['Recommended Songs'];
      const fetched: Song[] = recSongs.map((s: any) => ({
        id: `${s.song_id}`,
        title: s.title,
        artist: s.artist || '',
        album: s.album || '',
        year: s.release_date ? s.release_date.split('-')[0] : '',
        imageUri: s.cover_uri || '',
        genre: s.genre || '',
        audioUri: s.preview_uri || '',
        rank: 0,
      }));

      const previewPromises = fetched.map((song) => searchAndGetLinks(song.title));
      const previewResults = await Promise.all(previewPromises);
      const enriched: Song[] = fetched.map((song, idx) => {
        const result = previewResults[idx];
        if (result?.success && result.results.length > 0) {
          return { ...song, audioUri: result.results[0].audioUri || song.audioUri };
        }
        return song;
      });

      if (!enriched.length) {
        Alert.alert('Error', 'No songs could be loaded. Please try again.');
        return;
      }
      setSongs(enriched);
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
