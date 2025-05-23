import React, { useState, useRef, useEffect, useMemo } from "react";
import {
   View,
   Text,
   Image,
   StyleSheet,
   Animated,
   PanResponder,
   Dimensions,
   TouchableOpacity,
   SafeAreaView,
   StatusBar,
   Platform,
   Alert,
   Linking,
   Modal,
   TextInput,
   LogBox,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import * as WebBrowser from 'expo-web-browser';
const SpotifyIcon = require('../assets/images/spotify-icon.png');
import { useThemeColor } from "@/hooks/useThemeColor";
import axiosInstance from '@/api/axiosInstance';
import { storage } from '@/utils/storage';
import { createPlaylist, addTracksToPlaylist, getSpotifyUserProfile } from '@/utils/spotifyApi';
import { trackImpression, trackClick } from '@/utils/ctrTracking';

LogBox.ignoreLogs([
  "Warning: useInsertionEffect must not schedule updates.",
  "Error loading sound Error: The AVPlayerItem instance has failed with the error code -1002 and domain \"NSURLErrorDomain\"."
]);

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 0.15 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;
const NAVBAR_HEIGHT = 56;

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  imageUri: string;
  genre: string;
  audioUri: string;
  rank: number;
  spotifyUrl?: string;
  recommendedByUserId?: number | null;
}

export interface SongSwiperProps {
  songs: Song[];
  friendsList: any[];
  navbarHeight?: number;
  onRankingComplete: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SongSwiper: React.FC<SongSwiperProps> = ({
  songs: songsProp,
  friendsList,
  onRankingComplete,
  navbarHeight = NAVBAR_HEIGHT,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const inputBackground = useThemeColor({}, 'inputBackground');

  const friendMap = useMemo(() => {
    const m: Record<number, string> = {};
    friendsList.forEach((f) => {
      if (f.id != null && f.username) {
        m[f.id] = f.username;
      }
    });
    return m;
  }, [friendsList]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [dislikedSongs, setDislikedSongs] = useState<Song[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentRank, setCurrentRank] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistNameSuffix, setPlaylistNameSuffix] = useState('');

  const [displaySong, setDisplaySong] = useState(songsProp[0]);
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const position = useRef(new Animated.ValueXY()).current;
  // animate image opacity for crossfade on song change
  const imageOpacity = useRef(new Animated.Value(1)).current;

  // fade out current image, switch song, then fade image in
  useEffect(() => {
    if (currentIndex < songsProp.length) {
      Animated.timing(imageOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setDisplaySong(songsProp[currentIndex]);
        if (sound) stopSound();
        Animated.timing(imageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }
  }, [currentIndex, songsProp]);

  useEffect(() => {
    trackImpression('rank-card-container');
    trackImpression('rank-btn-dislike');
    trackImpression('rank-btn-play');
    trackImpression('rank-btn-like');
    trackImpression('rank-btn-rank-1');
    trackImpression('rank-btn-rank-2');
    trackImpression('rank-btn-rank-3');
    trackImpression('rank-btn-rank-4');
    trackImpression('rank-btn-rank-5');
    trackImpression('rank-icon-open-spotify');
  }, [displaySong]);

  useEffect(() => {
    if (playlistModalVisible) {
      trackImpression('rank-btn-cancel-playlist-spotify');
      trackImpression('rank-btn-create-playlist-spotify');
    }
  }, [playlistModalVisible]);

  useEffect(() => {
    if (currentIndex >= songsProp.length) {
        trackImpression('rank-btn-restart-ranking');
        trackImpression('rank-btn-add-playlist-spotify');
    }
  }, [currentIndex, songsProp.length]);

  const loadSound = async () => {
    try {
        setIsLoading(true);
        setPlaybackError(false);
        if (sound) {
            try {
                await sound.unloadAsync();
            } catch (error) {
                console.log('Error unloading sound:', error);
            }
        }
        
        if (!displaySong.audioUri) {
            setPlaybackError(true);
            return;
        }

        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: displaySong.audioUri },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(true);
        } catch (error) {
            console.log('Error creating sound:', error);
            setPlaybackError(true);
        }
    } catch (error) {
        console.log('Error in loadSound:', error);
        setPlaybackError(true);
    } finally {
        setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setProgress((status.positionMillis ?? 0) / 1000);
      setDuration((status.durationMillis ?? 0) / 1000);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(0);
      }
    } else if (status.error) {
      console.log('Playback status error:', status.error);
      setPlaybackError(true);
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const playSound = async () => {
    try {
      if (!sound) {
        await loadSound();
        return;
      }
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
      setPlaybackError(true);
      setIsPlaying(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (sound) await sound.pauseAsync();
    } catch (error) {
      console.log('Error pausing sound:', error);
      setPlaybackError(true);
      setIsPlaying(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.log('Error stopping sound:', error);
      } finally {
        setSound(null);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayback = async () => {
    if (playbackError) return;
    if (isPlaying) await pauseSound();
    else await playSound();
  };

  // Cleanup on unmount or song change
  useEffect(() => {
    return () => {
      if (sound) {
        try {
          sound.unloadAsync();
        } catch (error) {
          console.log('Error unloading sound in cleanup:', error);
        }
      }
    };
  }, [sound]);

  // Reset playback state when song changes
  useEffect(() => {
    if (sound) {
      try {
        sound.unloadAsync();
      } catch (error) {
        console.log('Error unloading sound on song change:', error);
      }
    }
    setSound(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setPlaybackError(false);
  }, [displaySong]);

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const triggerHapticFeedback = (isLike: boolean) => {
    if (isLike)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const calculateRankFromSwipe = (x: number): number => {
    const max = SCREEN_WIDTH / 2;
    const clamped = Math.max(0, Math.min(x, max));
    return Math.ceil((clamped / max) * 5);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
        if (g.dx > 0) setCurrentRank(calculateRankFromSwipe(g.dx));
      },
      onPanResponderRelease: (_, g) => {
        const baseThreshold = SWIPE_THRESHOLD;
        const threshold = g.vx > 0.1 ? baseThreshold / 2 : baseThreshold;
        const smallThreshold = baseThreshold / 4;
        const swipeRank = calculateRankFromSwipe(g.dx);
        if (g.dx > smallThreshold && swipeRank === 1) {
          swipeRight(1);
        } else if (g.dx > threshold && swipeRank > 1) {
          swipeRight(swipeRank);
        } else if (g.dx < -baseThreshold) {
          swipeLeft();
        } else {
          resetPosition();
          setCurrentRank(0);
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
  };

  const transitionToNextCard = () => {
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((i) => i + 1);
      position.setValue({ x: 0, y: 0 });
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start(() => setIsAnimating(false));
    });
  };

  const swipeRight = async (rank: number) => {
    if (currentIndexRef.current >= songsProp.length || isAnimating) return;
    setIsAnimating(true);
    triggerHapticFeedback(true);
    const rankToSend = rank;
    const songIdNum = parseInt(songsProp[currentIndexRef.current].id, 10);
    if (isNaN(songIdNum)) {
      console.error('Invalid song ID for ranking:', songsProp[currentIndexRef.current].id);
    } else {
      const userInfoStr = await storage.getItem('user_info');
      let userId = null;
      if (userInfoStr) {
        try {
          const parsed = JSON.parse(userInfoStr);
          userId = parsed.userId;
        } catch {
          console.error('Failed to parse user_info');
        }
      } else {
        console.error('No user_info found in storage');
      }
      axiosInstance.post(
        `/rankings/${songIdNum}/${rankToSend}`,
        { userId }
      )
      .then((res) => console.log('Rank published:', res.status))
      .catch((error) => console.error('Error publishing rank', error.response?.data || error));
    }
    trackClick('rank-card-swipe');
    trackClick(`rank-card-swipe-rank-${rank}`);
    setLikedSongs((prev) => [...prev, { ...songsProp[currentIndexRef.current], rank: rankToSend }]);
    setCurrentRank(0);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(transitionToNextCard);
  };

  const swipeLeft = () => {
    if (currentIndex >= songsProp.length || isAnimating) return;
    setIsAnimating(true);
    triggerHapticFeedback(false);
    trackClick('rank-card-swipe'); 
    trackClick('rank-card-swipe-left');
    trackClick('rank-card-swipe-rank-1');
    setDislikedSongs((prev) => [...prev, songsProp[currentIndex]]);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(transitionToNextCard);
  };

  const handleLike = () => swipeRight(5);

  const handleDislike = () => swipeRight(1);
  const handleButtonPress = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const handleRankChange = async (v: number) => {
    setCurrentRank(v);
    await swipeRight(v);
  };

  const openInSpotify = async () => {
    const url = displaySong.spotifyUrl;
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.error('Error opening Spotify URL', e);
    }
  };

  const doCreatePlaylist = async (suffix: string) => {
    try {
      const profile = await getSpotifyUserProfile();
      const spotifyUserId = profile.id;
      const name = `Ranktify Picks - ${suffix}`;
      const resp = await createPlaylist(spotifyUserId, name, 'Your top songs from Ranktify', true);
      const playlistId = resp.id;
      const uris = likedSongs.map(s => {
        const parts = s.spotifyUrl?.split('/track/')[1] || '';
        const trackId = parts.split('?')[0];
        return `spotify:track:${trackId}`;
      }).filter(uri => uri);
      if (uris.length) await addTracksToPlaylist(playlistId, uris);
      Alert.alert('Playlist Created', 'Your Spotify playlist has been created.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create Spotify playlist.');
    }
  };

  if (currentIndex >= songsProp.length) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor, paddingBottom: navbarHeight }]}>
          <View style={styles.endCardContainer}>
            <MaterialIcons name="music-note" size={50} color={primaryColor} />
            <Text style={[styles.endCardText, { color: textColor }]}>
              No more songs to swipe!
            </Text>
            <Text style={[styles.endCardSubText, { color: secondaryColor }]}>
              You liked {likedSongs.length} songs
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.endPageButton, { backgroundColor: primaryColor, marginTop: 0 }]}
                onPress={() => {
                  trackClick('rank-btn-restart-ranking');
                  handleButtonPress();
                  if (sound) stopSound();
                  onRankingComplete();
                }}
              >
                <Text style={styles.endPageButtonText}>Rank Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.endPageButton, { backgroundColor: '#1DB954', marginLeft: 10, marginTop: 0 }]}
                onPress={() => {
                  trackClick('rank-btn-add-playlist-spotify');
                  handleButtonPress();
                  setPlaylistModalVisible(true);
                }}
              >
                <Text style={styles.endPageButtonText}>Add to Spotify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal transparent visible={playlistModalVisible} animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <View style={[styles.modalContainer, { 
              backgroundColor: cardBackgroundColor,
              borderColor,
              borderWidth: 1,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }]}>              
              <Text style={[styles.modalTitle, { color: textColor }]}>Enter playlist name:</Text>
              <TextInput
                placeholder="Playlist Name"
                placeholderTextColor={secondaryColor}
                value={playlistNameSuffix}
                onChangeText={setPlaylistNameSuffix}
                style={[styles.modalInput, { 
                  backgroundColor: inputBackground, 
                  borderColor,
                  color: textColor,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  marginBottom: 24,
                }]}
              />
              <View style={[styles.modalButtonRow, { gap: 12 }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { 
                    borderWidth: 1,
                    borderColor,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }]}
                  onPress={() => { 
                    trackClick('rank-btn-cancel-playlist-spotify');
                    setPlaylistModalVisible(false); 
                    setPlaylistNameSuffix(''); 
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { 
                    backgroundColor: primaryColor,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    elevation: 4,
                    shadowColor: primaryColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }]}
                  onPress={() => { 
                    trackClick('rank-btn-create-playlist-spotify');
                    doCreatePlaylist(playlistNameSuffix); 
                    setPlaylistModalVisible(false); 
                    setPlaylistNameSuffix(''); 
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor, paddingBottom: navbarHeight }]}>
        <View style={styles.cardsContainer}>
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: rotation },
                ],
                opacity: cardOpacity,
                backgroundColor: cardBackgroundColor,
                borderColor,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {displaySong.recommendedByUserId != null && (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText}>{
                  `Recommended from ${
                    friendMap[displaySong.recommendedByUserId] ?? `user ${displaySong.recommendedByUserId}`
                  }`
                }</Text>
              </View>
            )}
            <Animated.View
              style={[
                styles.likeContainer,
                {
                  opacity: likeOpacity,
                  borderColor: primaryColor,
                  backgroundColor: 'rgba(98, 0, 238, 0.1)',
                },
              ]}
            >
              <Text style={[styles.likeText, { color: primaryColor }]}>LIKE</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.dislikeContainer,
                {
                  opacity: dislikeOpacity,
                  borderColor: '#ff5252',
                  backgroundColor: 'rgba(255, 82, 82, 0.1)',
                },
              ]}
            >
              <Text style={styles.dislikeText}>NOPE</Text>
            </Animated.View>

            {/* crossfading song image */}
            <Animated.Image
              source={{ uri: displaySong.imageUri }}
              style={[styles.image, { opacity: imageOpacity }]}
            />
            <View style={[styles.infoContainer, { backgroundColor: cardBackgroundColor }]}>
              <Text
                style={[styles.title, { color: textColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displaySong.title}
              </Text>
              <Text
                style={[styles.artist, { color: secondaryColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displaySong.artist}
              </Text>
              <Text
                style={[styles.album, { color: secondaryColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displaySong.album} {displaySong.year ? `• ${displaySong.year}` : ''}
              </Text>
              {displaySong.genre && (
                <View style={[styles.genreContainer, { borderColor }]}>
                  <Text style={[styles.genre, { color: primaryColor }]}>{displaySong.genre}</Text>
                </View>
              )}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${(progress / (duration || 1)) * 100}%`,
                        backgroundColor: primaryColor,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.timeText, { color: secondaryColor }]}>
                  {formatTime(duration - progress)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
              onPress={() => { trackClick('rank-icon-open-spotify'); openInSpotify(); }}
              disabled={!displaySong.spotifyUrl}
            >
              <Image source={SpotifyIcon} style={{ width: 24, height: 24 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View
          style={[
            styles.rankContainer,
            { backgroundColor: cardBackgroundColor, borderColor },
          ]}
        >
          <Text style={[styles.rankLabel, { color: textColor }]}>
            What is your ranking?
          </Text>
          <View style={styles.rankButtons}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.rankButton,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: v === currentRank ? primaryColor : borderColor,
                  },
                  v === currentRank && {
                    backgroundColor: primaryColor,
                  },
                ]}
                onPress={() => { trackClick(`rank-btn-rank-${v}`); handleRankChange(v); }}
              >
                <Text
                  style={[
                    styles.rankButtonText,
                    {
                      color: v === currentRank ? '#ffffff' : secondaryColor,
                    },
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.dislikeButton]}
            onPress={() => { trackClick('rank-btn-dislike'); handleButtonPress(); handleDislike(); }}
            disabled={isAnimating}
          >
            <MaterialIcons name="close" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.playButton, playbackError && styles.errorButton]}
            onPress={() => { trackClick('rank-btn-play'); handleButtonPress(); togglePlayback(); }}
            disabled={isLoading || playbackError}
          >
            {isLoading ? (
              <Text style={styles.loadingText}>...</Text>
            ) : playbackError ? (
              <MaterialIcons name="error-outline" size={30} color="white" />
            ) : isPlaying ? (
              <Ionicons name="pause" size={30} color="white" />
            ) : (
              <Ionicons name="play" size={30} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={() => { trackClick('rank-btn-like'); handleButtonPress(); handleLike(); }}
            disabled={isAnimating}
          >
            <MaterialIcons name="favorite" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1 },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: 16,
    backgroundColor: Platform.OS === "ios" ? "rgba(255, 255, 255, 0.8)" : "white",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    ...Platform.select({
      ios: {
        borderWidth: 1,
        borderColor: "rgba(98, 0, 238, 0.05)",
      }
    })
  },
  image: {
    width: '100%',
    height: '55%',
    backgroundColor: '#e0e0e0',
  },
  infoContainer: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  artist: { fontSize: 20, marginBottom: 12 },
  album: { fontSize: 16, marginBottom: 16 },
  genreContainer: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  genre: { fontSize: 14, fontWeight: '600' },
  progressBarContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 40,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dislikeButton: { backgroundColor: '#ff5252' },
  playButton: { backgroundColor: '#4CAF50' },
  loadingText: { color: 'white', fontSize: 12 },
  likeContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    transform: [{ rotate: '20deg' }],
    borderWidth: 3,
    borderRadius: 5,
    padding: 10,
  },
  likeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dislikeContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    transform: [{ rotate: '-20deg' }],
    borderWidth: 3,
    borderRadius: 5,
    padding: 10,
  },
  dislikeText: { color: '#ff5252', fontSize: 24, fontWeight: 'bold' },
  endCardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    borderRadius: 8,
    elevation: 4,
    marginHorizontal: 20,
  },
  endCardText: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  endCardSubText: { fontSize: 16, marginTop: 8 },
  endPageButton: {
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
    minWidth: 160,
    minHeight: 48,
  },
  endPageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  rankContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    marginHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  rankLabel: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  rankButtons: { flexDirection: 'row', gap: 12 },
  rankButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankButtonText: { fontSize: 18, fontWeight: '600' },
  friendBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 20,
  },
  friendBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButton: {
    backgroundColor: '#FF9800',
  },
});

export default SongSwiper;