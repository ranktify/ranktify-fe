import React, { useState, useEffect } from 'react';
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
  LogBox,
  Image,
  Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { searchAndGetLinks } from '@/utils/spotifySearch';
import { useThemeColor } from '@/hooks/useThemeColor';
import SongSwiper, { Song } from '@/components/SongSwiper';
import { getSpotifyToken } from '@/utils/spotifyAuth';
import axiosInstance from '@/api/axiosInstance';
import storage from '@/utils/storage';
import { trackImpression, trackClick } from '@/utils/ctrTracking';

LogBox.ignoreLogs([
  "Warning: useInsertionEffect must not schedule updates.",
]);

const statusBarHeight = Platform.OS === "ios" ? 8 : StatusBar.currentHeight || 0;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function RankPage() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'secondaryBackground');

  const [songs, setSongs] = useState<Song[]>([]);
  const [isRankingSessionActive, setIsRankingSessionActive] = useState(false);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [streaks, setStreaks] = useState(0);

  useEffect(() => {
    if (!isRankingSessionActive) {
      trackImpression('rank-container-onboarding');
      trackImpression('rank-btn-start');
      fetchStreaks();
    }
    trackImpression('rank-btn-start');
  }, [isRankingSessionActive]);

  const fetchStreaks = async () => {
    try {
      const response = await axiosInstance.get('/streaks');
      const streakCount = response.data.streaks || 0;
      setStreaks(streakCount);
    } catch (error) {
      console.log("Error fetching streaks:", error);
      setStreaks(0);
    }
  };

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
      const recSongsRaw = response.data['Recommended Songs'];
      const friendsSongsRaw = response.data['Songs From Friends'];
      
      const recSongs = Array.isArray(recSongsRaw) ? recSongsRaw : [];
      const friendsSongs = Array.isArray(friendsSongsRaw) ? friendsSongsRaw : [];
      console.log('Recommended Songs:', recSongs);
      console.log('Songs From Friends:', friendsSongs);

      const userInfoStr = await storage.getItem('user_info');
      let currentUserId: number | null = null;
      if (userInfoStr) {
        try {
          const parsed = JSON.parse(userInfoStr);
          currentUserId = parsed.userId;
        } catch {
          console.error('Failed to parse user_info');
        }
      } else {
        console.error('No user_info found in storage');
      }

      if (currentUserId) {
        try {
          const resp = await axiosInstance.get(`/friends/${currentUserId}`);
          const friends = resp.data?.friends ?? [];
          setFriendsList(friends);
        } catch (err) {
          console.error('Error fetching friends list', err);
        }
      }

      const recFetched: Song[] = recSongs.map((s: any) => ({
        id: `${s.song_id}`,
        title: s.title,
        artist: s.artist || '',
        album: s.album || '',
        year: s.release_date ? s.release_date.split('-')[0] : '',
        imageUri: s.cover_uri || '',
        genre: s.genre || '',
        audioUri: s.preview_uri || '',
        rank: 0,
        recommendedByUserId: null,
        spotifyUrl: '',
      }));
      const friendsFetched: Song[] = friendsSongs.map((s: any) => ({
        id: `${s.song_id}`,
        title: s.title,
        artist: s.artist || '',
        album: s.album || '',
        year: s.release_date ? s.release_date.split('-')[0] : '',
        imageUri: s.cover_uri || '',
        genre: s.genre || '',
        audioUri: s.preview_uri || '',
        rank: 0,
        recommendedByUserId: s.user_id,
        spotifyUrl: '',
      }));
      const fetched: Song[] = [...recFetched, ...friendsFetched];

      const previewPromises = fetched.map((song) => searchAndGetLinks(song.title));
      const previewResults = await Promise.all(previewPromises);
      const enriched: Song[] = fetched.map((song, idx) => {
        const result = previewResults[idx];
        if (result?.success && result.results.length > 0) {
          return { ...song,
            audioUri: result.results[0].audioUri || song.audioUri,
            spotifyUrl: result.results[0].spotifyUrl || song.spotifyUrl
          };
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
        <SongSwiper
          songs={songs}
          friendsList={friendsList}
          onRankingComplete={handleRankingComplete}
        />
      ) : (
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.header}>
            <View style={[styles.streakContainer, { backgroundColor: cardBackgroundColor }]}>
              <Ionicons name="flame" size={24} color="#FF9500" />
              <Text style={[styles.streakText, { color: textColor }]}>
                {streaks}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="queue-music" size={80} color={textColor} />
            </View>

            <Text style={[styles.title, { color: textColor }]}>
              Ready to Rank?
            </Text>

            <Text style={[styles.subtitle, { color: textColor }]}>
              Swipe right to rank songs from 1 to 5
            </Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#6200ee' }]}
              onPress={() => { 
                trackClick('rank-btn-start'); 
                startRankingSession(); 
              }}
              disabled={isFetchingSongs}
            >
              {isFetchingSongs ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start Ranking Session</Text>
              )}
            </TouchableOpacity>
          </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
