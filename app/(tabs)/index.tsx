import { Image, StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen() {
  const topSongs = [
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      imageUri: "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png",
    },
    {
      title: "Dance Monkey",
      artist: "Tones and I",
      imageUri: "https://i.scdn.co/image/ab67616d0000b27338802659d156935ada63c9e3",
    },
    {
      title: "Bohemian Rhapsody",
      artist: "Queen",
      imageUri: "https://i.scdn.co/image/ab67616d0000b27328581cfe196c266c132a9d62",
    },
    {
      title: "Sicko Mode",
      artist: "Travis Scott",
      imageUri: "https://i.scdn.co/image/ab67616d00001e02072e9faef2ef7b6db63834a3",
    },
    {
      title: "Bad Guy",
      artist: "Billie Eilish",
      imageUri: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    },
  ];

  const handleGenrePress = (genre: string) => {
    Alert.alert(`This is the "${genre}" genre`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Top 5 Songs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Songs Between Friends</Text>
          {topSongs.map((song, index) => (
            <View key={index} style={styles.songItem}>
              <View style={styles.songSquare}>
                <Image
                  source={{ uri: song.imageUri }}
                  style={styles.songIcon}
                  resizeMode="cover" // Ensures the image fills the square
                />
              </View>
              <View>
                <Text style={styles.songText}>{song.title}</Text>
                <Text style={styles.artistText}>{song.artist}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top 5 Rated Songs in Our App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Rated Songs in Our App</Text>
          {['Song A', 'Song B', 'Song C', 'Song D', 'Song E'].map((song, index) => (
            <View key={index} style={styles.songItem}>
              <View style={styles.songSquare}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/30' }}
                  style={styles.songIcon}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.songText}>{song}</Text>
            </View>
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
    flexGrow: 1, // Ensures the scrollable area adjusts dynamically
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Changed to dark background
    padding: 16,
    paddingTop: 48, // Added margin to prevent clipping with phone time
    paddingBottom: 64, // Added bottom margin to avoid collision with nav bar
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20, // Increased font size
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF', // Changed text color to white
    textAlign: 'center', // Centralized the header
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  songSquare: {
    width: 50,
    height: 50,
    backgroundColor: '#1E1E1E', // Changed to dark gray
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden', // Ensures the image doesn't overflow the square
  },
  songIcon: {
    width: '100%', // Ensures the image fills the square
    height: '100%',
  },
  songText: {
    fontSize: 16,
    color: '#FFFFFF', // Changed text color to white
  },
  artistText: {
    fontSize: 14,
    color: '#AAAAAA', // Lighter text for artist name
  },
  genreScroll: {
    flexDirection: 'row',
  },
  genreSquare: {
    alignItems: 'center',
    justifyContent: 'center', // Centered text vertically
    marginRight: 16,
    width: 100,
    height: 100,
    backgroundColor: '#1E1E1E', // Changed to dark gray
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
    color: '#FFFFFF', // Changed text color to white
    position: 'absolute', // Ensures text overlays the box
  },
  friendActivityBox: {
    backgroundColor: '#1E1E1E', // Changed to dark gray
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  friendActivityText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF', // Changed text color to white
  },
});
