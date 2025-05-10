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
import axiosInstance from "@/api/axiosInstance";
import * as SecureStore from "expo-secure-store";

const statusBarHeight = Platform.OS === "ios" ? 8 : StatusBar.currentHeight || 0;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SEARCH_TYPES = ["track", "album", "artist", "user"];
const SPOTIFY_ICON = SpotifyIcon;

const SpotifyAPI = {
   search: "https://api.spotify.com/v1/search",
   getUrl: (type: string, id: string) => `https://open.spotify.com/${type}/${id}`
};

interface FriendRequest {
   request_id: number;
   receiver_id: number;
   sender_id: number;
   request_date: string;
   status: string;
}

export default function SearchScreen() {
   const backgroundColor = useThemeColor({}, "background");
   const cardBackgroundColor = useThemeColor({}, "secondaryBackground");
   const borderColor = useThemeColor({}, "border");
   const textColor = useThemeColor({}, "text");
   const secondaryColor = useThemeColor({}, "secondary");

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
   const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
   const [existingRequests, setExistingRequests] = useState<{[key: string]: number}>({});

   useEffect(() => {
      console.log('SearchScreen useEffect triggered');
      const fetchToken = async () => {
         try {
            const token = await getSpotifyToken();
            console.log('Current Spotify Token:', token);
            setSpotifyToken(token);
         } catch (error) {
            console.error('Error fetching Spotify token:', error);
         }
      };
      
      const initialize = async () => {
         try {
            console.log('Starting initialization...');
            await fetchToken();
            console.log('Fetching friend requests...');
            await fetchExistingFriendRequests();
            console.log('Initialization complete');
         } catch (error) {
            console.error('Error during initialization:', error);
         }
      };

      initialize();
   }, []);

   const fetchExistingFriendRequests = async () => {
      try {
         const response = await axiosInstance.get('/friends/friend-requests-sent');
         
         // Check if the response has the expected structure
         if (!response.data || !response.data.friend_request) {
            return;
         }
         
         const requests: FriendRequest[] = response.data.friend_request || [];
         const requestMap: Record<number, number> = {};
         const sentSet = new Set<string>();
         
         // Sort requests by date in descending order to get the most recent ones first
         requests.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
         
         requests.forEach((request: FriendRequest) => {
            // Only add to map if there isn't already a request for this receiver
            // Since we sorted by date, the first one we encounter will be the most recent
            if (!requestMap[request.receiver_id]) {
               requestMap[request.receiver_id] = request.request_id;
               sentSet.add(request.receiver_id.toString());
            }
         });
         
         setExistingRequests(requestMap);
         setSentRequests(sentSet);
      } catch (error) {
         if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
         }
      }
   };

   const handleSendFriendRequest = async (receiverId: string) => {
      try {
         const userInfoStr = await SecureStore.getItemAsync('user_info');
         if (!userInfoStr) {
            Alert.alert('Error', 'Please log in to send friend requests');
            return;
         }

         const userInfo = JSON.parse(userInfoStr);
         const userId = userInfo.userId;

         await axiosInstance.post(`/friends/send/${userId}/${receiverId}`);
         
         // After sending the request, fetch the updated friend requests to get the new request ID
         await fetchExistingFriendRequests();
         
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
         console.error('Failed to send friend request:', error);
         Alert.alert('Error', 'Failed to send friend request');
      }
   };

   const handleCancelFriendRequest = async (receiverId: string) => {
      try {
         const requestId = existingRequests[receiverId];
         
         if (!requestId) {
            return;
         }

         await axiosInstance.delete(`/friends/friend-request/${requestId}`);
         
         // After canceling the request, fetch the updated friend requests
         await fetchExistingFriendRequests();
         
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
         console.error('Failed to cancel friend request:', error);
         Alert.alert('Error', 'Failed to cancel friend request');
      }
   };

   const removeDuplicates = (items) => {
      const seen = new Set();
      return items.filter(item => {
         const key = `${item.id}-${item.type || 'track'}-${
            item.artists ? 
               (typeof item.artists === 'string' ? item.artists : item.artists.map(a => a.name).join(', ')).split(', ')[0] : 
               item.label || ''
         }`;
         if (seen.has(key)) return false;
         seen.add(key);
         return true;
      });
   };

   const executeQuery = async () => {
      if (!query) {
         Alert.alert("Input Needed", "Please enter a search query.");
         return;
      }

      setLoading(true);
      try {
         if (searchType === 'user') {
            console.log('🔍 Starting user search for:', query);
            try {
               const response = await axiosInstance.get(`/user/search/${query}`);
               console.log('📥 User search response:', response.data);
               const processedResults = response.data.map(user => ({
                  id: user.id,
                  name: user.username,
                  image: user.profilePicture || null,
                  type: 'user'
               }));
               console.log('🔄 Processed user results:', processedResults);
               setResults(removeDuplicates(processedResults));
            } catch (error) {
               if (error.response?.status !== 404) {
                  console.error('❌ User search error:', error);
                  Alert.alert("Error", "Failed to search users");
               } else {
                  console.log('ℹ️ No users found');
                  setResults([]);
               }
            }
         } else {
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
                  setResults(removeDuplicates(result.results));
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

               const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
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
                  processedResults = removeDuplicates(data.albums.items.map(album => ({
                     id: album.id,
                     name: album.name,
                     artists: album.artists.map(a => a.name).join(", "),
                     images: album.images,
                     type: 'album'
                  })));
               } else if (searchType === 'artist') {
                  processedResults = removeDuplicates(data.artists.items.map(artist => ({
                     id: artist.id,
                     name: artist.name,
                     images: artist.images,
                     type: 'artist'
                  })));
               }

               setResults(processedResults);
            }
         }
      } catch (error) {
         console.error("Search error:", error);
         Alert.alert("Error", "Failed to search. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const openSpotifyLink = async (type, id) => {
      const url = SpotifyAPI.getUrl(type, id);
      if (!url) return;
      try {
         const supported = await Linking.canOpenURL(url);
         if (supported) await Linking.openURL(url);
         else await WebBrowser.openBrowserAsync(url);
      } catch (e) {
         console.error('Error opening Spotify URL', e);
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

      if (searchType === 'user') {
         const hasRequestBeenSent = sentRequests.has(item.id.toString());
         const requestId = existingRequests[item.id];
         const initials = item.name ? item.name.charAt(0).toUpperCase() : '?';
         
         return (
            <View style={[
               styles.card,
               styles.userCard,
               { 
                  backgroundColor: Platform.OS === 'ios' ? 
                     'rgba(255, 255, 255, 0.08)' :
                     'rgba(255, 255, 255, 0.05)',
                  borderColor: borderColor,
               }
            ]}>
               {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.userImage} />
               ) : (
                  <View style={[styles.userImage, styles.userPlaceholder]}>
                     <Text style={styles.avatarText}>{initials}</Text>
                  </View>
               )}
               <View style={styles.userInfo}>
                  <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity
                     style={[
                        styles.userButton,
                        { 
                           backgroundColor: hasRequestBeenSent ? '#FF4444' : '#6200ee',
                           opacity: hasRequestBeenSent ? 0.8 : 1
                        }
                     ]}
                     onPress={() => {
                        if (hasRequestBeenSent) {
                           handleCancelFriendRequest(item.id);
                        } else {
                           handleSendFriendRequest(item.id);
                        }
                     }}
                  >
                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {hasRequestBeenSent ? (
                           <>
                              <Ionicons name="close" size={20} color="white" />
                              <Text style={[styles.buttonText, { color: 'white' }]}>
                                 Cancel Request
                              </Text>
                           </>
                        ) : (
                           <>
                              <Ionicons name="person-add" size={20} color="white" />
                              <Text style={[styles.buttonText, { color: 'white' }]}>
                                 Send Request
                              </Text>
                           </>
                        )}
                     </View>
                  </TouchableOpacity>
               </View>
            </View>
         );
      }

      if (searchType === 'album') {
         const image = item.image || item.images?.[0]?.url;
         const title = item.name;
         const artist = item.artists || '';
         
         return (
            <View style={[
               styles.card,
               styles.albumCard,
               { 
                  backgroundColor: Platform.OS === 'ios' ? 
                     'rgba(255, 255, 255, 0.08)' :
                     'rgba(255, 255, 255, 0.05)',
                  borderColor: borderColor,
               }
            ]}>
               <Image source={{ uri: image }} style={styles.albumImage} />
               <View style={styles.albumInfo}>
                  <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{title}</Text>
                  <Text style={[styles.cardSubtitle, { color: secondaryColor }]} numberOfLines={1}>{artist}</Text>
               </View>
               <TouchableOpacity
                  style={styles.spotifyButton}
                  onPress={() => openSpotifyLink(searchType, item.id)}
               >
                  <Image source={SPOTIFY_ICON} style={styles.spotifyIcon} />
               </TouchableOpacity>
            </View>
         );
      }

      if (searchType === 'artist') {
         const image = item.image || item.images?.[0]?.url;
         const name = item.name;
         
         return (
            <View style={[
               styles.card,
               styles.artistCard,
               { 
                  backgroundColor: Platform.OS === 'ios' ? 
                     'rgba(255, 255, 255, 0.08)' :
                     'rgba(255, 255, 255, 0.05)',
                  borderColor: borderColor,
               }
            ]}>
               <Image source={{ uri: image }} style={styles.artistImage} />
               <View style={styles.artistInfo}>
                  <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{name}</Text>
               </View>
               <TouchableOpacity
                  style={styles.spotifyButton}
                  onPress={() => openSpotifyLink(searchType, item.id)}
               >
                  <Image source={SPOTIFY_ICON} style={styles.spotifyIcon} />
               </TouchableOpacity>
            </View>
         );
      }

      // Track search (default)
      const id = item.id;
      const image = item.image || item.images?.[0]?.url || item.album?.images?.[0]?.url;
      const title = item.name || item.title;
      const subtitle = item.artists || (item.artists ? item.artists.map((a) => a.name).join(", ") : item.label || "");
      const previewUrl = item.preview_url || item.previewUrl;
      const isCurrentlyPlaying = currentlyPlayingId === id;

      return (
         <View style={[
            styles.card,
            styles.trackCard,
            { 
               backgroundColor: Platform.OS === 'ios' ? 
                  'rgba(255, 255, 255, 0.08)' :
                  'rgba(255, 255, 255, 0.05)',
               borderColor: borderColor,
            }
         ]}>
            <Image source={{ uri: image }} style={styles.trackImage} />
            <View style={styles.trackInfo}>
               <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{title}</Text>
               <Text style={[styles.cardSubtitle, { color: secondaryColor }]} numberOfLines={1}>{subtitle}</Text>
               <View style={styles.buttonRow}>
                  {previewUrl ? (
                     <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#4CAF50", marginTop: 6, flex: 1 }]}
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
                        style={[styles.button, { backgroundColor: "#ccc", marginTop: 6, flex: 1 }]}
                        disabled={true}
                     >
                        <Text style={[styles.buttonText, { color: "#888" }]}>No Preview</Text>
                     </TouchableOpacity>
                  )}
                  <TouchableOpacity
                     style={styles.spotifyButton}
                     onPress={() => openSpotifyLink(searchType, id)}
                  >
                     <Image source={SPOTIFY_ICON} style={styles.spotifyIcon} />
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      );
   };

   const renderTypeToggles = () => (
      <View style={styles.toggleGroup}>
         {[
            { type: 'track', icon: 'musical-note' },
            { type: 'album', icon: 'disc' },
            { type: 'artist', icon: 'person' },
            { type: 'user', icon: 'people' }
         ].map(({ type, icon }) => (
            <TouchableOpacity
               key={type}
               style={[styles.toggleButton, searchType === type && styles.activeToggle]}
               onPress={() => handleTogglePress(type)}
               accessibilityLabel={`Filter by ${type}`}
            >
               <Ionicons name={icon} size={24} color="white" style={styles.toggleIcon} />
            </TouchableOpacity>
         ))}
      </View>
   );

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
         <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.formContainer}>
               <View style={styles.inputContainer}>
                  <Ionicons name="search-outline" size={24} color="#6200ee" style={styles.inputIcon} />
                  <TextInput
                     placeholder="Search tracks, albums, artists, users..."
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
                     keyExtractor={(item) => {
                        const uniqueKey = `${item.id}-${item.type || 'track'}-${
                           item.artists ? 
                              item.artists.split(', ')[0] : 
                              item.label || ''
                        }`;
                        return uniqueKey;
                     }}
                     renderItem={renderResultItem}
                     contentContainerStyle={styles.listContainer}
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
      paddingTop: 8,
   },
   headerContainer: {
      display: 'none',
   },
   title: {
      display: 'none',
   },
   subtitle: {
      display: 'none', 
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
      borderRadius: 16,
      marginBottom: 12,
      paddingHorizontal: 20,
      height: 56,
      elevation: 4,
      shadowColor: '#6200ee',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      gap: 12,
   },
   toggleButton: {
      flex: 1,
      backgroundColor: "#cccccc",
      height: 48,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: '#6200ee',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   activeToggle: {
      backgroundColor: "#6200ee",
   },
   toggleIcon: {
      marginRight: 0,
   },
   searchButton: {
      padding: 8,
      borderRadius: 20,
   },
   card: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
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
   cardImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
      marginRight: 16,
   },
   cardTextContainer: {
      flex: 1,
   },
   cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
   },
   cardSubtitle: {
      fontSize: 14,
      marginBottom: 8,
      opacity: 0.7,
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
   button: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: "#6200ee",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      elevation: 4,
      shadowColor: '#6200ee',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      minWidth: 140,
      minHeight: 48,
   },
   buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
   },
   buttonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "white",
      marginLeft: 8,
      flexShrink: 1,
   },
   emptyText: {
      textAlign: "center",
      fontSize: 16,
      opacity: 0.7,
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
   listContainer: {
      paddingBottom: 25,
   },
   userPlaceholder: {
      backgroundColor: 'rgba(98, 0, 238, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   avatarText: {
      color: "#6200ee",
      fontSize: 24,
      fontWeight: "bold",
   },
   userCard: {
      padding: 16,
   },
   userImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
   },
   userInfo: {
      flex: 1,
      justifyContent: 'center',
   },
   userButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
   },
   albumCard: {
      padding: 16,
   },
   albumImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 16,
   },
   albumInfo: {
      flex: 1,
      justifyContent: 'center',
   },
   artistCard: {
      padding: 16,
   },
   artistImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
   },
   artistInfo: {
      flex: 1,
      justifyContent: 'center',
   },
   trackCard: {
      padding: 16,
   },
   trackImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 16,
   },
   trackInfo: {
      flex: 1,
      justifyContent: 'center',
   },
});
