import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { searchAndGetLinks } from "../utils/spotifySearch";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 0.15 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 8 : StatusBar.currentHeight;
const NAVBAR_HEIGHT = 56;

const formatTime = (seconds) => {
   const mins = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SongSwiper = ({ navbarHeight = NAVBAR_HEIGHT }) => {
   const [songs, setSongs] = useState([
      {
         id: "0",
         title: "Otro Atardecer",
         artist: "Bad Bunny, The Marías",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "",
         audioUri: "",
         rank: 0,
      },
      {
         id: "2",
         title: "PARANORMAL",
         artist: "Tainy, Alvaro Diaz",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "Pop",
         audioUri: "",
         rank: 0,
      },
      {
         id: "3",
         title: "DtMF",
         artist: "Bad Bunny",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "",
         audioUri: "",
         rank: 0,
      },
      {
         id: "4",
         title: "MONACO",
         artist: "Bad Bunny",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "",
         audioUri: "",
         rank: 0,
      },
      {
         id: "5",
         title: "NUEVAYoL",
         artist: "Bad Bunny",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "",
         audioUri: "",
         rank: 0,
      },
   ]);

   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedSongs, setLikedSongs] = useState([]);
   const [dislikedSongs, setDislikedSongs] = useState([]);
   const [isAnimating, setIsAnimating] = useState(false);
   const [isPlaying, setIsPlaying] = useState(false);
   const [playbackStatus, setPlaybackStatus] = useState(null);
   const [sound, setSound] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [duration, setDuration] = useState(0);
   const [currentRank, setCurrentRank] = useState(0);

   const [displaySong, setDisplaySong] = useState(songs[0]);

   useEffect(() => {
      const fetchSongDetails = async () => {
         const updatedSongs = await Promise.all(
            songs.map(async (song) => {
               if (song.audioUri && song.imageUri && song.album) return song; // Skip if details exist

               const searchResult = await searchAndGetLinks(song.title);
               if (searchResult.success && searchResult.results.length > 0) {
                  const track = searchResult.results[0];
                  return {
                     ...song,
                     audioUri: track.audioUri || song.audioUri,
                     imageUri: track.image || song.imageUri,
                     album: track.album || song.album,
                  };
               }
               return song;
            })
         );
         setSongs(updatedSongs);
      };

      fetchSongDetails();
   }, []); // Fetch details on component mount

   useEffect(() => {
      if (currentIndex < songs.length) {
         setDisplaySong(songs[currentIndex]);
         if (sound) {
            stopSound();
         }
      }
   }, [currentIndex, songs]);

   const loadSound = async () => {
      try {
         setIsLoading(true);

         if (sound) {
            await sound.unloadAsync();
         }

         const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: displaySong.audioUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
         );

         setSound(newSound);
         setIsPlaying(true);
         setIsLoading(false);
      } catch (error) {
         console.error("Error loading sound", error);
         Alert.alert("Error", "Failed to load audio");
         setIsLoading(false);
      }
   };

   const onPlaybackStatusUpdate = (status) => {
      if (status.isLoaded) {
         setIsPlaying(status.isPlaying);
         setProgress(status.positionMillis / 1000);
         setDuration(status.durationMillis / 1000);
         if (status.didJustFinish) {
            setIsPlaying(false);
            setProgress(0);
         }
      } else {
         setIsPlaying(false);
         if (status.error) {
            console.error(`AUDIO ERROR: ${status.error}`);
         }
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
         console.error("Error playing sound", error);
         Alert.alert("Error", "Failed to play audio");
      }
   };

   const pauseSound = async () => {
      if (sound) {
         await sound.pauseAsync();
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
         await pauseSound();
      } else {
         await playSound();
      }
   };

   useEffect(() => {
      return () => {
         if (sound) {
            sound.unloadAsync();
         }
      };
   }, [sound]);

   const position = useRef(new Animated.ValueXY()).current;
   const rotation = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ["-10deg", "0deg", "10deg"],
      extrapolate: "clamp",
   });

   const likeOpacity = position.x.interpolate({
      inputRange: [0, SCREEN_WIDTH / 4],
      outputRange: [0, 1],
      extrapolate: "clamp",
   });

   const dislikeOpacity = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 4, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
   });

   const cardOpacity = useRef(new Animated.Value(1)).current;

   const triggerHapticFeedback = (isLike: boolean) => {
      if (isLike) {
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
   };

   const calculateRankFromSwipe = (xPosition) => {
      const maxSwipeDistance = SCREEN_WIDTH / 2;
      const normalizedPosition = Math.max(0, Math.min(xPosition, maxSwipeDistance));
      return Math.ceil((normalizedPosition / maxSwipeDistance) * 5);
   };

   const panResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => !isAnimating,
         onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy });
            if (gesture.dx > 0) {
               const newRank = calculateRankFromSwipe(gesture.dx);
               setCurrentRank(newRank);
            }
         },
         onPanResponderRelease: (_, gesture) => {
            const swipeThreshold = gesture.vx > 0.1 ? SWIPE_THRESHOLD / 2 : SWIPE_THRESHOLD;            
            if (gesture.dx > 0 && calculateRankFromSwipe(gesture.dx) > 0) {
               swipeRight();
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
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
         setCurrentIndex((prevIndex) => prevIndex + 1);

         position.setValue({ x: 0, y: 0 });

         Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
         }).start(() => {
            setIsAnimating(false);
         });
      });
   };

   const swipeRight = () => {
      if (currentIndex >= songs.length || isAnimating) return;

      setIsAnimating(true);
      triggerHapticFeedback(true);

      const currentSong = {
         ...songs[currentIndex],
         rank: currentRank || calculateRankFromSwipe(position.x._value),
      };
      setLikedSongs((prev) => [...prev, currentSong]);
      setCurrentRank(0);

      Animated.timing(position, {
         toValue: { x: SCREEN_WIDTH + 100, y: 0 },
         duration: SWIPE_OUT_DURATION,
         useNativeDriver: false,
      }).start(transitionToNextCard);
   };

   const swipeLeft = () => {
      if (currentIndex >= songs.length || isAnimating) return;

      setIsAnimating(true);

      triggerHapticFeedback(false);

      const currentSong = songs[currentIndex];
      setDislikedSongs((prev) => [...prev, currentSong]);

      Animated.timing(position, {
         toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
         duration: SWIPE_OUT_DURATION,
         useNativeDriver: false,
      }).start(transitionToNextCard);
   };

   const handleLike = () => {
      if (!isAnimating) swipeRight();
   };

   const handleDislike = () => {
      if (!isAnimating) swipeLeft();
   };

   const handleButtonPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   };

   const handleRankChange = (value) => {
      setCurrentRank(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   };

   if (currentIndex >= songs.length) {
      return (
         <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, { paddingBottom: navbarHeight }]}>
               <View style={styles.endCardContainer}>
                  <MaterialIcons name="music-note" size={50} color="#6200ee" />
                  <Text style={styles.endCardText}>No more songs to swipe!</Text>
                  <Text style={styles.endCardSubText}>You liked {likedSongs.length} songs</Text>

                  <TouchableOpacity
                     style={styles.restartButton}
                     onPress={() => {
                        handleButtonPress();
                        if (sound) {
                           stopSound();
                        }
                        setCurrentIndex(0);
                        setLikedSongs([]);
                        setDislikedSongs([]);
                        cardOpacity.setValue(1);
                     }}
                  >
                     <Text style={styles.restartButtonText}>Restart</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.safeArea}>
         <View style={[styles.container, { paddingBottom: navbarHeight }]}>
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
                     },
                  ]}
                  {...panResponder.panHandlers}
               >
                  <Animated.View style={[styles.likeContainer, { opacity: likeOpacity }]}>
                     <Text style={styles.likeText}>LIKE</Text>
                  </Animated.View>

                  <Animated.View style={[styles.dislikeContainer, { opacity: dislikeOpacity }]}>
                     <Text style={styles.dislikeText}>NOPE</Text>
                  </Animated.View>

                  <Image source={{ uri: displaySong.imageUri }} style={styles.image} />
                  <View style={styles.infoContainer}>
                     <Text style={styles.title} numberOfLines={2}>{displaySong.title}</Text>
                     <Text style={styles.artist} numberOfLines={1}>{displaySong.artist}</Text>
                     <Text style={styles.album} numberOfLines={1}>
                        {displaySong.album} {displaySong.year ? `• ${displaySong.year}` : ''}
                     </Text>
                     {isPlaying && (
                        <View style={styles.progressContainer}>
                           <View style={styles.progressBar}>
                              <View 
                                 style={[
                                    styles.progressFill, 
                                    { width: `${(progress / duration) * 100}%` }
                                 ]} 
                              />
                           </View>
                           <Text style={styles.timeText}>
                              {formatTime(duration - progress)}
                           </Text>
                        </View>
                     )}
                     {displaySong.genre && (
                        <View style={styles.genreContainer}>
                           <Text style={styles.genre}>{displaySong.genre}</Text>
                        </View>
                     )}
                  </View>
               </Animated.View>
            </View>

            <View style={styles.rankContainer}>
               <Text style={styles.rankLabel}>Song Rank {currentRank > 0 ? `(${currentRank})` : ''}</Text>
               <View style={styles.rankButtons}>
                  {[1, 2, 3, 4, 5].map((value) => (
                     <TouchableOpacity
                        key={value}
                        style={[
                           styles.rankButton,
                           currentRank === value && styles.rankButtonActive
                        ]}
                        onPress={() => handleRankChange(value)}
                     >
                        <Text style={[
                           styles.rankButtonText,
                           currentRank === value && styles.rankButtonTextActive
                        ]}>
                           {value}
                        </Text>
                     </TouchableOpacity>
                  ))}
               </View>
            </View>

            <View style={styles.buttonsContainer}>
               <TouchableOpacity
                  style={[styles.button, styles.dislikeButton]}
                  onPress={() => {
                     handleButtonPress();
                     handleDislike();
                  }}
                  disabled={isAnimating}
               >
                  <MaterialIcons name="close" size={30} color="white" />
               </TouchableOpacity>

               <TouchableOpacity
                  style={[styles.button, styles.playButton]}
                  onPress={() => {
                     handleButtonPress();
                     togglePlayback();
                  }}
                  disabled={isLoading}
               >
                  {isLoading ? (
                     <Text style={styles.loadingText}>...</Text>
                  ) : isPlaying ? (
                     <Ionicons name="pause" size={30} color="white" />
                  ) : (
                     <Ionicons name="play" size={30} color="white" />
                  )}
               </TouchableOpacity>

               <TouchableOpacity
                  style={[styles.button, styles.likeButton]}
                  onPress={() => {
                     handleButtonPress();
                     handleLike();
                  }}
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
      backgroundColor: "#f5f5f5",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
   },
   container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
   },
   cardsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 10,
   },
   cardContainer: {
      width: SCREEN_WIDTH * 0.85,
      height: SCREEN_WIDTH * 1.2,
      borderRadius: 16,
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : 'white',
      overflow: "hidden",
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
      width: "100%",
      height: "55%",
      backgroundColor: "#e0e0e0",
   },
   infoContainer: {
      flex: 1,
      padding: 16,
   },
   title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#212121",
      marginBottom: 8,
   },
   artist: {
      fontSize: 18,
      color: "#424242",
      marginBottom: 12,
   },
   album: {
      fontSize: 16,
      color: "#616161",
      marginBottom: 12,
   },
   progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
   },
   progressBar: {
      flex: 1,
      height: 3,
      backgroundColor: '#e0e0e0',
      borderRadius: 1.5,
      overflow: 'hidden',
   },
   progressFill: {
      height: '100%',
      backgroundColor: '#6200ee',
   },
   timeText: {
      fontSize: 12,
      color: '#616161',
      minWidth: 45,
      textAlign: 'right',
   },
   genreContainer: {
      backgroundColor: "#e0e0e0",
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      alignSelf: "flex-start",
   },
   genre: {
      fontSize: 14,
      color: "#424242",
   },
   buttonsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
      paddingHorizontal: 40,
   },
   button: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
   },
   dislikeButton: {
      backgroundColor: "#ff5252",
   },
   likeButton: {
      backgroundColor: "#6200ee",
   },
   playButton: {
      backgroundColor: "#4CAF50",
   },
   loadingText: {
      color: "white",
      fontSize: 12,
   },
   likeContainer: {
      position: "absolute",
      top: 50,
      right: 20,
      zIndex: 10,
      transform: [{ rotate: "20deg" }],
      borderWidth: 3,
      borderRadius: 5,
      padding: 10,
      borderColor: "#6200ee",
   },
   likeText: {
      color: "#6200ee",
      fontSize: 24,
      fontWeight: "bold",
   },
   dislikeContainer: {
      position: "absolute",
      top: 50,
      left: 20,
      zIndex: 10,
      transform: [{ rotate: "-20deg" }],
      borderWidth: 3,
      borderRadius: 5,
      padding: 10,
      borderColor: "#ff5252",
   },
   dislikeText: {
      color: "#ff5252",
      fontSize: 24,
      fontWeight: "bold",
   },
   endCardContainer: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "white",
      padding: 30,
      borderRadius: 8,
      elevation: 4,
      marginHorizontal: 20,
   },
   endCardText: {
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 16,
      color: "#212121",
   },
   endCardSubText: {
      fontSize: 16,
      color: "#616161",
      marginTop: 8,
   },
   restartButton: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: "#6200ee",
      borderRadius: 4,
      elevation: 2,
   },
   restartButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
   },
   rankContainer: {
      paddingHorizontal: 20,
      marginBottom: 15,
      alignItems: 'center',
   },
   rankLabel: {
      fontSize: 16,
      color: '#424242',
      marginBottom: 8,
   },
   rankButtons: {
      flexDirection: 'row',
      gap: 8,
   },
   rankButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderWidth: 1,
      borderColor: '#e0e0e0',
   },
   rankButtonActive: {
      backgroundColor: '#6200ee',
      borderColor: '#6200ee',
   },
   rankButtonText: {
      fontSize: 16,
      color: '#616161',
   },
   rankButtonTextActive: {
      color: '#ffffff',
   },
});

export default SongSwiper;