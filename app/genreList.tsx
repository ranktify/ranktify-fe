import React from 'react';
import { useLocalSearchParams } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Alert, Platform, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from 'expo-web-browser';
import SpotifyIcon from "@/assets/images/spotify-icon.png";

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
    try {
      const url = spotifyUri;
      
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await WebBrowser.openBrowserAsync(url);
        }
      } catch (e) {
        console.error('Error opening Spotify URL', e);
        Alert.alert('Error', 'Failed to open Spotify URL');
      }
    } catch (error) {
      console.error('Error in handleOpenSpotify:', error);
      Alert.alert('Error', 'An unexpected error occurred');
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
                <View style={styles.cardContent}>
                  <Image source={{ uri: song.cover_uri }} style={styles.cover} />
                  <View style={styles.info}>
                    <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{song.title}</Text>
                    <Text style={[styles.artist, { color: textColor, opacity: 0.8 }]} numberOfLines={1}>{song.artist}</Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[
                          styles.button, 
                          { 
                            backgroundColor: '#6200ee',
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            padding: 0
                          }
                        ]}
                        onPress={() => handlePlayPreview(song.preview_url, idx)}
                        disabled={isLoading === idx}
                      >
                        {isLoading === idx ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : playingIndex === idx ? (
                          <Ionicons name="pause" size={24} color="white" />
                        ) : (
                          <Ionicons name="play" size={24} color="white" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.spotifyButton}
                        onPress={() => handleOpenSpotify(song.spotify_uri)}
                      >
                        <Image source={SpotifyIcon} style={styles.spotifyIcon} />
                      </TouchableOpacity>
                    </View>
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
    opacity: 0.8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 0,
    minHeight: 48,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    marginLeft: 4,
  },
  spotifyIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  spotifyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
