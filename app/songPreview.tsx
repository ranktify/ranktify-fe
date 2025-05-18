import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

const SpotifyAPI = {
  search: "https://api.spotify.com/v1/search",
  getUrl: (type: string, id: string) => `https://open.spotify.com/${type}/${id}`
};

export default function SongPreview() {
  const params = useLocalSearchParams();
  const { title, artist, imageUri, previewUrl, spotifyUrl } = params;
  
  // Add detailed logging of all params
  console.log('SongPreview - All params:', params);
  console.log('SongPreview - Extracted values:', {
    title,
    artist,
    imageUri,
    previewUrl,
    spotifyUrl,
    rawSpotifyUrl: params.spotifyUrl,
    rawSpotifyUri: params.spotify_uri
  });

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');
  const primaryColor = useThemeColor({}, 'primary');

  const loadSound = async () => {
    try {
      setIsLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl as string },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading sound", error);
      Alert.alert("Error", "Failed to load audio preview");
      setIsLoading(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await stopSound();
    } else {
      await loadSound();
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const openInSpotify = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const url = spotifyUrl as string;
      
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
      console.error('Error in openInSpotify:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: `${title} • ${artist}`,
          headerBackTitle: "Back",
        }}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.formContainer}>
          <View style={[styles.card, { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(42, 42, 42, 0.8)' }]}>
            <Image 
              source={{ uri: imageUri as string }}
              style={styles.image}
            />
            <View style={styles.infoContainer}>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              <Text style={[styles.artist, { color: textColor, opacity: 0.8 }]}>{artist}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6200ee' }]}
                onPress={togglePlayback}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Ionicons name="hourglass-outline" size={24} color="white" />
                ) : isPlaying ? (
                  <Ionicons name="pause" size={24} color="white" />
                ) : (
                  <Ionicons name="play" size={24} color="white" />
                )}
                <Text style={styles.buttonText}>
                  {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play Preview'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  { 
                    backgroundColor: '#1DB954',
                    opacity: 1
                  }
                ]}
                onPress={openInSpotify}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="musical-note" size={24} color="white" />
                <Text style={styles.buttonText}>
                  Open in Spotify
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 24,
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
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});