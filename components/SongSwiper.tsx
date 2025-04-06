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
import { searchAndGetLinks } from "../utils/spotifySearch"; // Import spotifySearch

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 20 : StatusBar.currentHeight;
const NAVBAR_HEIGHT = 56;

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
      },
      {
         id: "2",
         title: "PARANORMAL",
         artist: "Tainy, Alvaro Diaz",
         album: "",
         year: "2025",
         imageUri: "",
         genre: "",
         audioUri: "",
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
      setPlaybackStatus(status);
      if (status.isLoaded) {
         setIsPlaying(status.isPlaying);
      } else {
         setIsPlaying(false);
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

   const panResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => !isAnimating,
         onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy });
         },
         onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > SWIPE_THRESHOLD) {
               swipeRight();
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
               swipeLeft();
            } else {
               resetPosition();
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

      const currentSong = songs[currentIndex];
      setLikedSongs((prev) => [...prev, currentSong]);

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
                     <Text style={styles.title}>{displaySong.title}</Text>
                     <Text style={styles.artist}>{displaySong.artist}</Text>
                     <View style={styles.detailsRow}>
                        <Text style={styles.album}>{displaySong.album}</Text>
                        <Text style={styles.year}>{displaySong.year}</Text>
                     </View>
                     <View style={styles.genreContainer}>
                        <Text style={styles.genre}>{displaySong.genre}</Text>
                     </View>
                  </View>
               </Animated.View>
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
      borderRadius: 8,
      backgroundColor: "white",
      overflow: "hidden",
      elevation: 4,
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
   },
   artist: {
      fontSize: 18,
      color: "#424242",
      marginTop: 4,
   },
   detailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
   },
   album: {
      fontSize: 16,
      color: "#616161",
   },
   year: {
      fontSize: 16,
      color: "#757575",
   },
   genreContainer: {
      backgroundColor: "#e0e0e0",
      borderRadius: 16,
      padding: 6,
      paddingHorizontal: 12,
      marginTop: 10,
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
});

export default SongSwiper;
