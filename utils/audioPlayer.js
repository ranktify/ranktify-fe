import { Audio } from "expo-av";

let currentSound = null;
let currentlyPlayingId = null;
let isPlaying = false;
let statusUpdateCallback = null;

/**
 * Play audio from a URL
 * @param {string} audioUrl - URL of the audio to play
 * @param {string} id - Unique identifier for the track
 * @param {function} onPlaybackStatusUpdate - Optional callback for status updates
 */
export const playAudio = async (audioUrl, id, onPlaybackStatusUpdate = null) => {
   try {
      // If trying to play the currently loaded track
      if (id === currentlyPlayingId) {
         if (isPlaying) {
            await pauseAudio();
         } else {
            await resumeAudio();
         }
         return;
      }

      // Stop any currently playing sound
      await stopAudio();

      // Set the status callback
      statusUpdateCallback = onPlaybackStatusUpdate;

      // Create and play the new sound
      const { sound } = await Audio.Sound.createAsync(
         { uri: audioUrl },
         { shouldPlay: true },
         handlePlaybackStatusUpdate
      );

      currentSound = sound;
      currentlyPlayingId = id;
      isPlaying = true;

      // Configure audio session
      await Audio.setAudioModeAsync({
         playsInSilentModeIOS: true,
         staysActiveInBackground: true,
         interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
         interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
         shouldDuckAndroid: true,
      });

      return currentlyPlayingId;
   } catch (error) {
      console.error("Error playing audio:", error);
      throw error;
   }
};

export const pauseAudio = async () => {
   if (currentSound) {
      await currentSound.pauseAsync();
      isPlaying = false;
   }
};

export const resumeAudio = async () => {
   if (currentSound) {
      await currentSound.playAsync();
      isPlaying = true;
   }
};

export const stopAudio = async () => {
   if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      currentlyPlayingId = null;
      isPlaying = false;
   }
};

export const getCurrentPlayingId = () => {
   return currentlyPlayingId;
};

export const getIsPlaying = () => {
   return isPlaying;
};

const handlePlaybackStatusUpdate = (status) => {
   if (status.isLoaded) {
      isPlaying = status.isPlaying;

      // When track finishes playing
      if (status.didJustFinish) {
         isPlaying = false;
      }

      // Call any registered status update callback
      if (statusUpdateCallback) {
         statusUpdateCallback(status);
      }
   }
};
