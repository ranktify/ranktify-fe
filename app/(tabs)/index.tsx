import { Image, StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

export default function HomeScreen() {
  const router = useRouter();
  const [topFriendSongs, setTopFriendSongs] = useState([]);
  const [topWeeklySongs, setTopWeeklySongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        Alert.alert('Error', 'Failed to load songs');
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

  const handleGenrePress = (genre: string) => {
    Alert.alert('Genre Selected', `You selected ${genre}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Top 5 Songs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Songs Between Friends</Text>
          {isLoading ? (
            <Text style={[styles.songText, { textAlign: 'center' }]}>Loading...</Text>
          ) : (
            topFriendSongs.map((song, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSongPress(song)}
                style={styles.songItem}
              >
                <View style={styles.songSquare}>
                  <Image
                    source={{ uri: song.cover_uri }}
                    style={styles.songIcon}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songText}>{song.title}</Text>
                  <Text style={styles.artistText}>{song.artist}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>★ {song.avg_rank.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>({song.rating_count})</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Top 5 Rated Songs in Our App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Weekly Songs</Text>
          {isLoading ? (
            <Text style={[styles.songText, { textAlign: 'center' }]}>Loading...</Text>
          ) : (
            topWeeklySongs.map((song, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSongPress(song)}
                style={styles.songItem}
              >
                <View style={styles.songSquare}>
                  <Image
                    source={{ uri: song.cover_uri }}
                    style={styles.songIcon}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songText}>{song.title}</Text>
                  <Text style={styles.artistText}>{song.artist}</Text>
                </View>
                <View style={styles.ratingContainer}>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Discover by Genre Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover by Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            {['Pop', 'Rock', 'Hyper Pop', 'Country'].map((genre, index) => (
              <TouchableOpacity
                key={index}
                style={styles.genreSquare}
                onPress={() => handleGenrePress(genre)}
              >
                <Image
                  source={{ uri: 'https://via.placeholder.com/100' }}
                  style={styles.genreImage}
                  resizeMode="cover"
                />
                <Text style={styles.genreText}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Friend Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend Activity</Text>
          <View style={styles.friendActivityBox}>
            <Text style={styles.friendActivityText}>Friend is rating a lot of music</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistText: {
    fontSize: 14,
    color: '#AAAAAA',
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
    backgroundColor: '#1E1E1E',
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
    color: '#FFFFFF',
    position: 'absolute',
  },
  friendActivityBox: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  friendActivityText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});