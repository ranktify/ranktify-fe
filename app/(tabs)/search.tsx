import React, { useState, useEffect } from "react";
import {
   View,
   Text,
   TextInput,
   FlatList,
   TouchableOpacity,
   Image,
   StatusBar,
   Platform,
   SafeAreaView,
   Alert,
   Linking,
   StyleSheet,
   Animated,
   Dimensions,
   ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getSpotifyToken } from "@/utils/spotifyAuth";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { searchAndGetLinks } from "@/utils/spotifySearch";
import SpotifyIcon from "@/assets/images/spotify-icon.png";

const statusBarHeight = Platform.OS === "ios" ? 8 : StatusBar.currentHeight || 0;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SEARCH_TYPES = ["track", "album", "artist"];
const SPOTIFY_ICON = SpotifyIcon;

const SpotifyAPI = {
   search: "https://api.spotify.com/v1/search",
   openWeb: (type, id) => `https://open.spotify.com/${type}/${id}`,
   openApp: (type, id) => `spotify:${type}:${id}`,
};

export default function SearchScreen() {
   const [query, setQuery] = useState("");
   const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
   const [results, setResults] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [searchType, setSearchType] = useState("track");
   const [fadeAnim] = useState(new Animated.Value(1));
   const [sound, setSound] = useState<Audio.Sound | null>(null);
   const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const titleColor = useThemeColor({}, "text");

   useEffect(() => {
      const fetchToken = async () => {
         const token = await getSpotifyToken();
         console.log('Current Spotify Token:', token);
         setSpotifyToken(token);
      };
      fetchToken();
   }, []);

   const executeQuery = async () => {
      if (!query) {
         Alert.alert("Input Needed", "Please enter a search query.");
         return;
      }

      setLoading(true);
      try {
         const token = await getSpotifyToken();
         if (!token) {
            Alert.alert(
               "Authentication Required",
               "Please connect your Spotify account in the Profile tab"
            );
            setLoading(false);
            return;
         }

         setSpotifyToken(token);

         if (searchType === 'track') {
            const result = await searchAndGetLinks(query);
            if (result.success) {
               setResults(result.results);
            } else {
               if (result.error?.includes("token")) {
                  Alert.alert(
                     "Session Expired",
                     "Your Spotify session has expired. Please reconnect in the Profile tab."
                  );
               } else {
                  Alert.alert("Error", result.error || "Failed to search Spotify");
               }
            }
         } else {
            const params = new URLSearchParams({
               q: query,
               type: searchType,
               limit: "20",
               market: "US",
            });

            const response = await fetch(`${SpotifyAPI.search}?${params}`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (!response.ok) {
               if (response.status === 429) {
                  const retryAfter = response.headers.get("Retry-After");
                  Alert.alert("Rate Limit", `Try again after ${retryAfter} seconds`);
               }
               throw new Error("Spotify API request failed");
            }

            const data = await response.json();
            let processedResults = [];

            if (searchType === 'album') {
               processedResults = data.albums.items.map(album => ({
                  id: album.id,
                  name: album.name,
                  artists: album.artists.map(a => a.name).join(", "),
                  images: album.images,
                  type: 'album'
               }));
            } else if (searchType === 'artist') {
               processedResults = data.artists.items.map(artist => ({
                  id: artist.id,
                  name: artist.name,
                  images: artist.images,
                  type: 'artist'
               }));
            }

            setResults(processedResults);
         }
      } catch (error) {
         console.error("Search error:", error);
         Alert.alert("Error", "Failed to search Spotify. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const openSpotifyLink = async (type, id) => {
      const spotifyUri = SpotifyAPI.openApp(type, id);
      const webUrl = SpotifyAPI.openWeb(type, id);

      try {
         const canOpenApp = await Linking.canOpenURL(spotifyUri);
         if (canOpenApp) {
            await Linking.openURL(spotifyUri);
         } else {
            await WebBrowser.openBrowserAsync(webUrl);
         }
      } catch (error) {
         console.error("Failed to open link:", error);
         Alert.alert("Error", "Unable to open Spotify link.");
      }
   };

   const handleTogglePress = (type) => {
      if (type !== searchType) {
         Haptics.selectionAsync();
         stopSound();
         setCurrentlyPlayingId(null);
         Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
         ]).start();
         setSearchType(type);
         setResults([]);
      }
   };

   const onPlaybackStatusUpdate = (status) => {
      if (status.isLoaded) {
         setIsPlaying(status.isPlaying);
         if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
         }
      } else {
         if (status.error) {
            console.error(`AUDIO ERROR: ${status.error}`);
         }
      }
   };

   const stopSound = async () => {
      try {
         if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
         }
      } catch (error) {
         console.error("Error stopping sound:", error);
      }
   };

   const handlePlayPreview = async (item) => {
      try {
         if (isLoading) return;
         setIsLoading(true);

         const previewUrl = item.previewUrl || item.preview_url;
         if (!previewUrl) {
            throw new Error("No preview URL available");
         }

         if (currentlyPlayingId === item.id) {
            if (sound && isPlaying) {
               await sound.pauseAsync();
               setIsPlaying(false);
            } else if (sound) {
               await sound.playAsync();
               setIsPlaying(true);
            }
            setIsLoading(false);
            return;
         }

         if (sound) {
            await sound.unloadAsync();
            setSound(null);
         }

         const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: previewUrl },
            { shouldPlay: true },
            onPlaybackStatusUpdate
         );

         setSound(newSound);
         setCurrentlyPlayingId(item.id);
         setIsPlaying(true);
         await newSound.playAsync();

         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
         console.error("Preview error:", error);
         Alert.alert("Error", "Could not play preview");
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      return () => {
         stopSound();
      };
   }, []);

   const renderResultItem = ({ item }) => {
      if (!item) return null;

      const id = item.id;
      const image = item.image || item.images?.[0]?.url || item.album?.images?.[0]?.url;
      const title = item.name || item.title;
      const subtitle =
         item.artists ||
         (item.artists ? item.artists.map((a) => a.name).join(", ") : item.label || "");
      const previewUrl = item.preview_url || item.previewUrl;
      const isCurrentlyPlaying = currentlyPlayingId === id;

      return (
         <View style={styles.card}>
            {image && <Image source={{ uri: image }} style={styles.cardImage} />}
            <View style={styles.cardTextContainer}>
               <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
               <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
               {searchType === "track" && (
                  <View style={styles.buttonRow}>
                     {previewUrl ? (
                        <TouchableOpacity
                           style={[
                              styles.button,
                              { backgroundColor: "#4CAF50", marginTop: 6, flex: 1, marginRight: 8 },
                           ]}
                           onPress={() => handlePlayPreview(item)}
                           disabled={isLoading}
                        >
                           {isLoading && currentlyPlayingId === item.id ? (
                              <ActivityIndicator color="white" size="small" />
                           ) : isCurrentlyPlaying && isPlaying ? (
                              <Ionicons name="pause" size={20} color="white" />
                           ) : (
                              <Ionicons name="play" size={20} color="white" />
                           )}
                           <Text style={styles.buttonText}>
                              {isLoading && currentlyPlayingId === item.id
                                 ? "Loading..."
                                 : isCurrentlyPlaying && isPlaying
                                 ? "Pause"
                                 : "Play Preview"}
                           </Text>
                        </TouchableOpacity>
                     ) : (
                        <TouchableOpacity
                           style={[
                              styles.button,
                              { backgroundColor: "#ccc", marginTop: 6, flex: 1, marginRight: 8 },
                           ]}
                           disabled={true}
                        >
                           <Text style={[styles.buttonText, { color: "#888" }]}>No Preview</Text>
                        </TouchableOpacity>
                     )}
                     <TouchableOpacity
                        style={[styles.button, { marginTop: 6 }]}
                        onPress={() => openSpotifyLink(searchType, id)}
                     >
                        <Image source={SPOTIFY_ICON} style={styles.spotifyIcon} />
                     </TouchableOpacity>
                  </View>
               )}
               {searchType !== "track" && (
                  <TouchableOpacity
                     style={[styles.button, { marginTop: 6 }]}
                     onPress={() => openSpotifyLink(searchType, id)}
                  >
                     <Image source={SPOTIFY_ICON} style={styles.spotifyIcon} />
                  </TouchableOpacity>
               )}
            </View>
         </View>
      );
   };

   const renderTypeToggles = () => (
      <View style={styles.toggleGroup}>
         {[
            { type: 'track', icon: 'musical-note' },
            { type: 'album', icon: 'disc' },
            { type: 'artist', icon: 'person' }
         ].map(({ type, icon }) => (
            <TouchableOpacity
               key={type}
               style={[styles.toggleButton, searchType === type && styles.activeToggle]}
               onPress={() => handleTogglePress(type)}
               accessibilityLabel={`Filter by ${type}`}
            >
               <Ionicons name={icon} size={20} color="white" style={styles.toggleIcon} />
               <Text style={styles.toggleText}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
         ))}
      </View>
   );

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
         <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.headerContainer}>
               <Text style={[styles.title, { color: titleColor }]}>Search Spotify</Text>
               <Text style={[styles.subtitle, { color: textColor }]}>Search tracks, albums, and artists</Text>
            </View>

            <View style={styles.formContainer}>
               <View style={styles.inputContainer}>
                  <Ionicons name="search-outline" size={24} color="#6200ee" style={styles.inputIcon} />
                  <TextInput
                     placeholder="Search tracks, albums, artists..."
                     value={query}
                     onChangeText={setQuery}
                     style={styles.input}
                     placeholderTextColor="#999"
                     returnKeyType="search"
                     onSubmitEditing={executeQuery}
                  />
                  {query.length > 0 && (
                     <TouchableOpacity 
                        style={styles.searchButton} 
                        onPress={executeQuery}
                        disabled={loading}
                     >
                        {loading ? (
                           <ActivityIndicator color="#6200ee" size="small" />
                        ) : (
                           <Ionicons name="arrow-forward" size={24} color="#6200ee" />
                        )}
                     </TouchableOpacity>
                  )}
               </View>

               {renderTypeToggles()}

               <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                  <FlatList
                     data={results}
                     keyExtractor={(item) => item.id}
                     renderItem={renderResultItem}
                     ListEmptyComponent={
                        loading ? (
                           <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color="#6200ee" />
                              <Text style={styles.loadingText}>Searching...</Text>
                           </View>
                        ) : query && !loading ? (
                           <Text style={styles.emptyText}>No results found</Text>
                        ) : null
                     }
                     showsVerticalScrollIndicator={false}
                  />
               </Animated.View>
            </View>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 20,
   },
   headerContainer: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 30,
   },
   title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 16,
      marginBottom: 20,
   },
   formContainer: {
      width: '100%',
      maxWidth: SCREEN_WIDTH * 0.85,
      alignSelf: 'center',
      flex: 1,
   },
   inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 8,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 56,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
   },
   inputIcon: {
      marginRight: 12,
   },
   input: {
      flex: 1,
      height: 56,
      fontSize: 16,
   },
   toggleGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 8,
   },
   toggleButton: {
      flex: 1,
      backgroundColor: "#cccccc",
      height: 56,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: 'row',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      gap: 8,
   },
   activeToggle: {
      backgroundColor: "#6200ee",
   },
   toggleIcon: {
      marginRight: 4,
   },
   toggleText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 14,
   },
   searchButton: {
      padding: 8,
      borderRadius: 20,
   },
   card: {
      backgroundColor: "white",
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
   },
   cardImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
      marginRight: 12,
   },
   cardTextContainer: {
      flex: 1,
   },
   cardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#222",
   },
   cardSubtitle: {
      fontSize: 14,
      color: "#666",
      marginBottom: 6,
   },
   spotifyIcon: {
      width: 32,
      height: 32,
      resizeMode: "contain",
   },
   button: {
      padding: 8,
      borderRadius: 16,
      backgroundColor: "#eeeeee",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
   },
   buttonRow: {
      flexDirection: "row",
      alignItems: "center",
   },
   buttonText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "white",
      marginLeft: 4,
   },
   emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: "#666",
      marginTop: 40,
   },
   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 40,
   },
   loadingText: {
      fontSize: 16,
      color: "#6200ee",
      marginTop: 10,
   },
   tokenText: {
      display: 'none',
   },
});
