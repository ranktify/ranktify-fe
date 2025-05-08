import { Image, StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useThemeColor } from "@/hooks/useThemeColor";

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

        // Debug logging
        console.log('Raw Friends Response:', friendsResponse);
        console.log('Raw Weekly Response:', weeklyResponse);

        // Ensure we're setting arrays, even if empty
        const friendsSongs = Array.isArray(friendsResponse.data) ? friendsResponse.data : [];
        const weeklySongs = Array.isArray(weeklyResponse.data) ? weeklyResponse.data : [];

        console.log('Processed Friends Songs:', friendsSongs);
        console.log('Processed Weekly Songs:', weeklySongs);

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
        // Set empty arrays on error to prevent null mapping errors
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
      console.log(`Fetching songs for genre: ${genre}`);
      const response = await axiosInstance.get(`api/${genre}/10`);
      console.log('Genre API response:', response.data);
      const songs = Array.isArray(response.data) ? response.data : [];
      console.log('Processed songs:', songs);
      router.push({
        pathname: "/genreList",
        params: {
          genre,
          songs: JSON.stringify(songs)
        }
      });
    } catch (error) {
      console.error('Error fetching genre songs:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      Alert.alert('Error', `Failed to load ${genre} songs`);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        {/* Top 5 Songs Section */}
        {!isLoading && topFriendSongs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Top 5 Songs Between Friends</Text>
            {topFriendSongs.map((song, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSongPress(song)}
                style={[styles.songItem, { backgroundColor: backgroundColor === '#fff' ? '#f5f5f5' : '#1E1E1E' }]}
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
                  <Text style={styles.ratingCount}>({song.rating_count})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top 5 Rated Songs in Our App Section */}
        {!isLoading && topWeeklySongs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Top 5 Weekly Songs</Text>
            {topWeeklySongs.map((song, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSongPress(song)}
                style={[styles.songItem, { backgroundColor: backgroundColor === '#fff' ? '#f5f5f5' : '#1E1E1E' }]}
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
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Discover by Genre Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Discover by Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            {['Pop', 'Rock', 'Reggaeton', 'Salsa'].map((genre, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.genreSquare, { backgroundColor: backgroundColor === '#fff' ? '#f5f5f5' : '#1E1E1E' }]}
                onPress={() => handleGenrePress(genre)}
              >
                <Image
                  source={{ uri: 'https://via.placeholder.com/100' }}
                  style={styles.genreImage}
                  resizeMode="cover"
                />
                <Text style={[styles.genreText, { color: textColor }]}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Friend Activity Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Friend Activity</Text>
          <View style={[styles.friendActivityBox, { backgroundColor: backgroundColor === '#fff' ? '#f5f5f5' : '#1E1E1E' }]}>
            <Text style={[styles.friendActivityText, { color: textColor }]}>Friend is rating a lot of music</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    // backgroundColor is set dynamically
  },
  container: {
    flex: 1,
    // backgroundColor is set dynamically
    padding: 16,
    paddingTop: 48,
    paddingBottom: 64,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    // color is set dynamically
    textAlign: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    // backgroundColor is set dynamically
    borderRadius: 8,
    padding: 8,
  },
  songSquare: {
    width: 50,
    height: 50,
    borderRadius: 8,
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
    // color is set dynamically
    marginBottom: 4,
  },
  artistText: {
    fontSize: 14,
    // color is set dynamically
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
    color: '#AAAAAA',
    fontSize: 12,
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
    // backgroundColor is set dynamically
    borderRadius: 8,
    overflow: 'hidden',
  },
  genreImage: {
    width: '100%',
    height: '100%',
  },
  genreText: {
    fontSize: 14,
    textAlign: 'center',
    // color is set dynamically
    position: 'absolute',
  },
  friendActivityBox: {
    // backgroundColor is set dynamically
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  friendActivityText: {
    fontSize: 16,
    textAlign: 'center',
    // color is set dynamically
  },
});