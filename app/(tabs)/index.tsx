import { Image, StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  
  const topSongs = [
    {
      song_id: 1,
      spotify_id: "2QyuXBcV1LJ2rq01KhreMF",
      title: "Blinding Lights",
      artist: "The Weeknd",
      cover_uri: "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png",
      preview_uri: "",
      spotify_uri: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b?si=db7417a781ee46d6",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.8,
      rating_count: 15
    },
    {
      song_id: 2,
      spotify_id: "1rgnBhdG2JDFTbYkYRZAku",
      title: "Dance Monkey",
      artist: "Tones and I",
      cover_uri: "https://i.scdn.co/image/ab67616d0000b27338802659d156935ada63c9e3",
      preview_uri: "",
      spotify_uri: "https://open.spotify.com/track/2XU0oxnq2qxCpomAAuJY8K?si=d2fc682ed18c4ccc",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.5,
      rating_count: 41
    },
    {
      song_id: 3,
      spotify_id: "3z8h0TU7ReDPLIbEnYhWZb",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      cover_uri: "https://i.scdn.co/image/ab67616d0000b27328581cfe196c266c132a9d62",
      preview_uri: "",
      spotify_uri: "https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.3,
      rating_count: 20
    },
    {
      song_id: 4,
      spotify_id: "2xLMifQCjDGFmkHkpNLD9h",
      title: "Sicko Mode",
      artist: "Travis Scott",
      cover_uri: "https://i.scdn.co/image/ab67616d00001e02072e9faef2ef7b6db63834a3",
      preview_uri: "spotify:track:2xLMifQCjDGFmkHkpNLD9h",
      spotify_uri: "https://open.spotify.com/track/2xLMifQCjDGFmkHkpNLD9h",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.0,
      rating_count: 19
    },
    {
      song_id: 5,
      spotify_id: "2Fxmhks0bxGSBdJ92vM42m",
      title: "Bad Guy",
      artist: "Billie Eilish",
      cover_uri: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
      preview_uri: "spotify:track:2Fxmhks0bxGSBdJ92vM42m",
      spotify_uri: "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 3.8,
      rating_count: 9
    }
  ];

  const appTopSongs = [
    {
      song_id: 6,
      spotify_id: "",
      title: "BAILE INoLVIDABLE",
      artist: "Bad Bunny",
      cover_uri: "https://upload.wikimedia.org/wikipedia/en/e/ef/Bad_Bunny_-_Debí_Tirar_Más_Fotos.png",
      preview_uri: "https://p.scdn.co/mp3-preview/31078ee4e5d1705665fa46d8b68afc297031f54f",
      spotify_uri: "",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 5,
      rating_count: 1121
    },
    {
      song_id: 7,
      spotify_id: "",
      title: "FE!N",
      artist: "Travis Scott",
      cover_uri: "https://i1.sndcdn.com/artworks-lk6F9QhbgtCM-0-t500x500.jpg",
      preview_uri: "https://p.scdn.co/mp3-preview/4b0178cf6991f59db18e12e2219ff11e27474b0a",
      spotify_uri: "",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.8,
      rating_count: 1029
    },
    {
      song_id: 8,
      spotify_id: "",
      title: "Timeless",
      artist: "The Weeknd",
      cover_uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpGhWaJ4UK7zpN_divH3ofmBI7ig2jKk0Y0A&s",
      preview_uri: "https://p.scdn.co/mp3-preview/c27493ac0bcb3deb72a8e814ab6c7e8686cd2324",
      spotify_uri: "https://open.spotify.com/track/0FIDCNYYjNvPVimz5icugS",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.5,
      rating_count: 836
    },
    {
      song_id: 9,
      spotify_id: "",
      title: "Nightmare",
      artist: "Avenged Sevenfold",
      cover_uri: "https://i.scdn.co/image/ab67616d0000b273c34064a3c5e4a25892a091f3",
      preview_uri: "https://p.scdn.co/mp3-preview/c781eca2ae8f1196661b5dfb2314e85a7dd104d1",
      spotify_uri: "",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.3,
      rating_count: 742
    },
    {
      song_id: 10,
      spotify_id: "",
      title: "Birds of a Feather",
      artist: "Billie Eilish",
      cover_uri: "https://i1.sndcdn.com/artworks-BHI8P4kbIiY67cXS-K2kVZA-t500x500.jpg",
      preview_uri: "https://p.scdn.co/mp3-preview/2899f0275fc029d456d924a60ae6f747bda1ed80",
      spotify_uri: "",
      created_at: "0001-01-01T00:00:00Z",
      avg_rank: 4.0,
      rating_count: 550
    }
  ];

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

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Top 5 Songs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Songs Between Friends</Text>
          {topSongs.map((song, index) => (
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
          ))}
        </View>

        {/* Top 5 Rated Songs in Our App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Rated Songs in Our App</Text>
          {appTopSongs.map((song, index) => (
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
          ))}
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
