import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';

export default function SongPreview() {
  const params = useLocalSearchParams();
  const { title, artist, imageUri, previewUrl, spotifyUrl } = params;
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadSound = async () => {
    try {
      setIsLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl as string },
        { shouldPlay: true },
        (status) => setIsPlaying(status.isPlaying)
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
      const supported = await Linking.canOpenURL(spotifyUrl as string);
      if (supported) {
        await Linking.openURL(spotifyUrl as string);
      } else {
        Alert.alert("Error", "Cannot open Spotify");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open Spotify");
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
      <View style={styles.container}>
        <Image 
          source={{ uri: imageUri as string }}
          style={styles.image}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.artist}>{artist}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={togglePlayback}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '...' : isPlaying ? '⏸ Pause' : '▶ Preview'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={openInSpotify}
          >
            <Text style={styles.buttonText}>Open in Spotify</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: '#AAAAAA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});