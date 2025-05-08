import { useLocalSearchParams } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function GenreListScreen() {
  const { genre, songs } = useLocalSearchParams<{ genre?: string; songs?: string }>();
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const parsedSongs = songs ? JSON.parse(songs) : [];
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlayPreview = async (previewUrl: string, index: number) => {
    try {
      // Stop previous sound if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingIndex === index) {
        setPlayingIndex(null);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
      soundRef.current = sound;
      setPlayingIndex(index);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) {
          setPlayingIndex(null);
        }
      });
    } catch (error) {
      Alert.alert("Playback Error", "Could not play preview.");
      setPlayingIndex(null);
    }
  };

  const handleOpenSpotify = (spotifyUri: string) => {
    // Try to open in Spotify app, fallback to web if not available
    const url = spotifyUri.startsWith("spotify:") 
      ? `https://open.spotify.com/track/${spotifyUri.split(":").pop()}`
      : spotifyUri;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open Spotify.");
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor }}>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.header, { color: textColor }]}>
          {genre ? `${genre} Songs` : "Songs"}
        </Text>
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
                      style={styles.iconButton}
                      onPress={() => handlePlayPreview(song.preview_uri, idx)}
                    >
                      <Ionicons
                        name={playingIndex === idx ? "pause-circle" : "play-circle"}
                        size={32}
                        color="#1DB954"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="musical-notes-outline" size={28} color="#aaa" style={{ marginRight: 12 }} />
                  )}
                  <TouchableOpacity
                    style={styles.spotifyButton}
                    onPress={() => handleOpenSpotify(song.spotify_uri)}
                  >
                    <Ionicons name="logo-spotify" size={20} color="#fff" />
                    <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  iconButton: {
    marginRight: 12,
  },
  spotifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  spotifyButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
});
