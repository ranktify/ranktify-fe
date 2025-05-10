import { useLocalSearchParams } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { Audio } from "expo-av";
import { Stack } from "expo-router";

export default function GenreListScreen() {
  const { genre, songs } = useLocalSearchParams<{ genre?: string; songs?: string }>();
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const parsedSongs = songs ? JSON.parse(songs) : [];
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPreview = async (previewUrl: string, index: number) => {
    try {
      if (playingIndex === index) {
        // Stop current playback
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setPlayingIndex(null);
        }
        return;
      }

      setIsLoading(index);
      
      // Stop previous playback
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded || status.didJustFinish) {
            setPlayingIndex(null);
            setSound(null);
          }
        }
      );

      setSound(newSound);
      setPlayingIndex(index);
      setIsLoading(null);
    } catch (error) {
      Alert.alert("Playback Error", "Could not play preview.");
      setPlayingIndex(null);
      setIsLoading(null);
    }
  };

  const handleOpenSpotify = (spotifyUri: string) => {
    const url = spotifyUri.startsWith("spotify:") 
      ? `https://open.spotify.com/track/${spotifyUri.split(":").pop()}`
      : spotifyUri;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open Spotify.");
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: genre ? `Genre: ${genre}` : "Genre",
          headerTintColor: textColor,
          headerStyle: { backgroundColor },
          headerBackTitle: "Back",
        }} 
      />
      <ScrollView style={{ flex: 1, backgroundColor }}>
        <View style={[styles.container, { backgroundColor }]}>
          {parsedSongs.length === 0 ? (
            <Text style={[styles.emptyText, { color: textColor }]}>No songs found.</Text>
          ) : (
            parsedSongs.map((song: any, idx: number) => (
              <View key={idx} style={[styles.songItem, { backgroundColor: backgroundColor === "#fff" ? "#f5f5f5" : "#1E1E1E" }]}>
                <Image source={{ uri: song.cover_uri }} style={styles.cover} />
                <View style={styles.info}>
                  <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{song.title}</Text>
                  <Text style={[styles.artist, { color: textColor, opacity: 0.7 }]} numberOfLines={1}>{song.artist}</Text>
                  <View style={styles.actions}>
                    {song.preview_uri ? (
                      <TouchableOpacity
                        style={[styles.playButton, playingIndex === idx && styles.playingButton]}
                        onPress={() => handlePlayPreview(song.preview_uri, idx)}
                        disabled={isLoading === idx}
                      >
                        <Text style={styles.buttonText}>
                          {isLoading === idx ? '...' : playingIndex === idx ? '⏸ Pause' : '▶ Preview'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.playButton, { opacity: 0.5 }]}>
                        <Text style={styles.buttonText}>No Preview</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.spotifyButton}
                      onPress={() => handleOpenSpotify(song.spotify_uri)}
                    >
                      <Text style={styles.buttonText}>Open in Spotify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minHeight: "100%",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    opacity: 0.7,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 16,
    padding: 10,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: "#ccc",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  playButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  playingButton: {
    backgroundColor: '#168D40',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
