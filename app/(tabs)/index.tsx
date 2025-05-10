import { Image, StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Platform, StatusBar, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useThemeColor } from "@/hooks/useThemeColor";
import { getSpotifyToken } from '@/utils/spotifyAuth';
import { Ionicons } from "@expo/vector-icons";

const statusBarHeight = Platform.OS === "ios" ? 8 : StatusBar.currentHeight || 0;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [topFriendSongs, setTopFriendSongs] = useState([]);
  const [topWeeklySongs, setTopWeeklySongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const [friendsResponse, weeklyResponse] = await Promise.all([
          axiosInstance.get('/friends/top-tracks'),
          axiosInstance.get('/rankings/top-weekly')
        ]);

        const friendsSongs = Array.isArray(friendsResponse.data) ? friendsResponse.data : [];
        const weeklySongs = Array.isArray(weeklyResponse.data) ? weeklyResponse.data : [];

        setTopFriendSongs(friendsSongs);
        setTopWeeklySongs(weeklySongs);

      } catch (error) {
        console.error('Error fetching songs:', error);
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        }
        setTopFriendSongs([]);
        setTopWeeklySongs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const handleSongPress = (song: { title: string; artist: string; cover_uri: string; preview_uri: string; spotify_uri: string }) => {
    router.push({
      pathname: "/songPreview",
      params: {
        spotifyUrl: song.spotify_uri,
        title: song.title,
        artist: song.artist,
        imageUri: song.cover_uri,
        previewUrl: song.preview_uri
      }
    });
  };

  const handleGenrePress = async (genre: string) => {
    try {
      const token = await getSpotifyToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please connect your Spotify account in the Profile tab.');
        return;
      }

      const response = await axiosInstance.get(`/api/${genre}/10`, {
        headers: { 'Spotify-Token': `Bearer ${token}` }
      });
      const songs = Array.isArray(response.data) ? response.data : [];
      router.push({
        pathname: "/genreList",
        params: {
          genre,
          songs: JSON.stringify(songs)
        }
      });
    } catch (error) {
      console.error('Error fetching genre songs:', error);
      Alert.alert('Error', `Failed to load ${genre} songs`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.formContainer}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor }]} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
              </View>
            ) : (
              <>
                {/* Top 5 Songs Section */}
                {topFriendSongs.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Top 5 Songs Between Friends</Text>
                    {topFriendSongs.map((song, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSongPress(song)}
                        style={[styles.card, { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(42, 42, 42, 0.8)' }]}
                      >
                        <View style={styles.songSquare}>
                          <Image
                            source={{ uri: song.cover_uri }}
                            style={styles.songIcon}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.songInfo}>
                          <Text style={[styles.songText, { color: textColor }]}>{song.title}</Text>
                          <Text style={[styles.artistText, { color: textColor, opacity: 0.7 }]}>{song.artist}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                          <Text style={styles.ratingText}>★ {song.avg_rank.toFixed(1)}</Text>
                          <Text style={[styles.ratingCount, { color: textColor }]}>({song.rating_count})</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Top 5 Weekly Songs Section */}
                {topWeeklySongs.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Top 5 Weekly Songs</Text>
                    {topWeeklySongs.map((song, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSongPress(song)}
                        style={[styles.card, { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(42, 42, 42, 0.8)' }]}
                      >
                        <View style={styles.songSquare}>
                          <Image
                            source={{ uri: song.cover_uri }}
                            style={styles.songIcon}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.songInfo}>
                          <Text style={[styles.songText, { color: textColor }]}>{song.title}</Text>
                          <Text style={[styles.artistText, { color: textColor, opacity: 0.7 }]}>{song.artist}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Discover by Genre Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Discover by Genre</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                    {[
                      { name: 'Pop', color: '#FF69B4', darkColor: '#FF1493', icon: 'musical-notes' },
                      { name: 'Rock', color: '#8B0000', darkColor: '#FF0000', icon: 'guitar' },
                      { name: 'Reggaeton', color: '#FF8C00', darkColor: '#FFA500', icon: 'radio' },
                      { name: 'Salsa', color: '#FF4500', darkColor: '#FF6347', icon: 'disc' },
                    ].map((genre, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.genreSquare,
                          { 
                            backgroundColor: backgroundColor === '#fff' ? genre.color : genre.darkColor,
                            borderWidth: 1,
                            borderColor: backgroundColor === '#fff' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                          }
                        ]}
                        onPress={() => handleGenrePress(genre.name)}
                      >
                        <Ionicons name={genre.icon} size={32} color="#FFFFFF" style={styles.genreIcon} />
                        <Text style={[
                          styles.genreText,
                          { 
                            color: '#FFFFFF',
                            textShadowColor: 'rgba(0, 0, 0, 0.5)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2
                          }
                        ]}>{genre.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: statusBarHeight,
  },
  formContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.85,
    alignSelf: 'center',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    ...Platform.select({
      ios: {
        borderWidth: 1,
        borderColor: 'rgba(98, 0, 238, 0.05)',
      }
    })
  },
  songSquare: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  songIcon: {
    width: '100%',
    height: '100%',
  },
  songInfo: {
    flex: 1,
  },
  songText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistText: {
    fontSize: 14,
  },
  ratingContainer: {
    marginLeft: 12,
    alignItems: 'flex-end',
    minWidth: 60,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  genreScroll: {
    flexDirection: 'row',
  },
  genreSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  genreIcon: {
    marginBottom: 8,
  },
  genreText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});