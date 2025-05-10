import React from 'react';
import { useLocalSearchParams } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from "react-native";
import { Audio } from "expo-av";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from 'expo-web-browser';

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
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setPlayingIndex(null);
        }
        return;
      }

      setIsLoading(index);
      
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

  const handleOpenSpotify = async (spotifyUri: string) => {
    if (!spotifyUri) return;
    const url = spotifyUri.startsWith("spotify:") 
      ? `https://open.spotify.com/track/${spotifyUri.split(":").pop()}`
      : spotifyUri;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.error('Error opening Spotify URL', e);
    }
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
              <View 
                key={idx} 
                style={[
                  styles.card, 
                  { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(42, 42, 42, 0.8)' }
                ]}
              >
                <Image source={{ uri: song.cover_uri }} style={styles.cover} />
                <View style={styles.info}>
                  <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{song.title}</Text>
                  <Text style={[styles.artist, { color: textColor, opacity: 0.7 }]} numberOfLines={1}>{song.artist}</Text>
                  <View style={styles.actions}>
                    {song.preview_uri ? (
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#1DB954', flex: 1 }]}
                        onPress={() => handlePlayPreview(song.preview_uri, idx)}
                        disabled={isLoading === idx}
                      >
                        {isLoading === idx ? (
                          <Ionicons name="hourglass-outline" size={20} color="white" />
                        ) : playingIndex === idx ? (
                          <Ionicons name="pause" size={20} color="white" />
                        ) : (
                          <Ionicons name="play" size={20} color="white" />
                        )}
                        <Text style={styles.buttonText} numberOfLines={1}>
                          {isLoading === idx ? 'Loading...' : playingIndex === idx ? 'Pause' : 'Preview'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.button, { backgroundColor: '#1DB954', opacity: 0.5, flex: 1 }]}>
                        <Ionicons name="musical-notes" size={20} color="white" />
                        <Text style={styles.buttonText} numberOfLines={1}>No Preview</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#1DB954', flex: 1 }]}
                      onPress={() => handleOpenSpotify(song.spotify_uri)}
                    >
                      <Ionicons name="musical-note" size={20} color="white" />
                      <Text style={styles.buttonText} numberOfLines={1}>Spotify</Text>
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
    padding: 20,
    minHeight: "100%",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    opacity: 0.7,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 16,
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
  cover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
