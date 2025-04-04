import React, { useState } from "react";
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
   AccessibilityInfo,
   Animated,
   Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useSpotifyAuth } from "../../utils/spotifyAuth";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as Haptics from "expo-haptics";

const statusBarHeight = Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SEARCH_TYPES = ["track", "album", "artist"];

const SPOTIFY_ICON =
   "https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png";

export default function SearchScreen() {
   const [query, setQuery] = useState("");
   const [results, setResults] = useState([]);
   const [loading, setLoading] = useState(false);
   const [token, setToken] = useState(null);
   const [searchType, setSearchType] = useState("track");
   const [fadeAnim] = useState(new Animated.Value(1));

   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const titleColor = useThemeColor({}, "text");

   const {
      login: loginSpotify,
      hasSpotifyToken,
      isAuthenticating,
   } = useSpotifyAuth((newToken) => {
      setToken(newToken);
   });

   const handleSpotifyConnect = async () => {
      await loginSpotify();
   };

   const executeQuery = async () => {
      if (!token) {
         Alert.alert("Error", "You need to connect to Spotify first");
         return;
      }

      if (!query) {
         Alert.alert("Input Needed", "Please enter a search query.");
         return;
      }

      setLoading(true);
      try {
         const params = new URLSearchParams({
            q: query,
            type: searchType,
            limit: "20",
            market: "US",
         });

         const url = `https://api.spotify.com/v1/search?${params}`;

         const response = await fetch(url, {
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
         const items = data[`${searchType}s`]?.items || [];
         setResults(items);
      } catch (error) {
         Alert.alert("Error", error.message);
      } finally {
         setLoading(false);
      }
   };

   const openSpotifyLink = async (type, id) => {
      const spotifyUri = `spotify:${type}:${id}`;
      const webUrl = `https://open.spotify.com/${type}/${id}`;

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
         Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
         ]).start();
         setSearchType(type);
         setResults([]);
      }
   };

   const renderResultItem = ({ item }) => {
      const id = item.id;
      const image = item.images?.[0]?.url || item.album?.images?.[0]?.url;
      const title = item.name || item.title;
      const subtitle = item.artists ? item.artists.map((a) => a.name).join(", ") : item.label || "";

      return (
         <View style={styles.card}>
            {image && <Image source={{ uri: image }} style={styles.cardImage} />}
            <View style={styles.cardTextContainer}>
               <Text style={styles.cardTitle}>{title}</Text>
               <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
               style={styles.spotifyIconButton}
               accessibilityLabel={`Open ${title} in Spotify`}
               onPress={() => openSpotifyLink(searchType, id)}
            >
               <Image source={{ uri: SPOTIFY_ICON }} style={styles.spotifyIcon} />
            </TouchableOpacity>
         </View>
      );
   };

   const renderTypeToggles = () => (
      <View style={styles.toggleGroup}>
         {SEARCH_TYPES.map((type) => (
            <TouchableOpacity
               key={type}
               style={[styles.toggleButton, searchType === type && styles.activeToggle]}
               onPress={() => handleTogglePress(type)}
               accessibilityLabel={`Filter by ${type}`}
            >
               <Text style={styles.toggleText}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
         ))}
      </View>
   );

   return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
         {!token ? (
            <View style={styles.connectContainer}>
               <Text style={[styles.infoText, { color: textColor }]}>Connect to Spotify</Text>
               <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleSpotifyConnect}
                  disabled={isAuthenticating}
               >
                  <Text style={styles.connectButtonText}>
                     {isAuthenticating ? "Connecting..." : "Connect"}
                  </Text>
               </TouchableOpacity>
            </View>
         ) : (
            <>
               <Text style={[styles.title, { color: titleColor }]}>Search Spotify</Text>
               <TextInput
                  placeholder="Search tracks, albums, artists..."
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                  placeholderTextColor="#999"
               />
               {renderTypeToggles()}
               <TouchableOpacity style={styles.executeButton} onPress={executeQuery}>
                  <Text style={styles.executeButtonText}>{loading ? "Loading..." : "Search"}</Text>
               </TouchableOpacity>
               <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                  <FlatList
                     data={results}
                     keyExtractor={(item) => item.id}
                     renderItem={renderResultItem}
                     ListEmptyComponent={
                        !loading && <Text style={styles.emptyText}>No results found</Text>
                     }
                     showsVerticalScrollIndicator={false}
                  />
               </Animated.View>
            </>
         )}
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 16,
      paddingTop: statusBarHeight,
   },
   connectContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   infoText: {
      fontSize: 16,
      marginBottom: 20,
   },
   connectButton: {
      backgroundColor: "#1DB954",
      padding: 12,
      borderRadius: 25,
   },
   connectButtonText: {
      color: "white",
      fontWeight: "bold",
   },
   title: {
      fontSize: 26,
      fontWeight: "bold",
      marginBottom: 16,
   },
   searchInput: {
      height: 48,
      backgroundColor: "#f2f2f2",
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      marginBottom: 12,
      elevation: 2,
   },
   toggleGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
   },
   toggleButton: {
      flex: 1,
      marginHorizontal: 4,
      backgroundColor: "#cccccc",
      paddingVertical: 8,
      borderRadius: 20,
      alignItems: "center",
   },
   activeToggle: {
      backgroundColor: "#1DB954",
   },
   toggleText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 14,
   },
   executeButton: {
      backgroundColor: "#1DB954",
      padding: 14,
      borderRadius: 30,
      alignItems: "center",
      marginBottom: 16,
   },
   executeButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
   },
   card: {
      backgroundColor: "#fff",
      borderRadius: 16,
      elevation: 4,
      padding: 12,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: Platform.OS === "ios" ? 0.5 : 1,
      borderColor: Platform.OS === "ios" ? "#e0e0e0" : "#dcdcdc",
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
   spotifyIconButton: {
      padding: 6,
   },
   spotifyIcon: {
      width: 32,
      height: 32,
      resizeMode: "contain",
   },
   emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: "#888",
      marginTop: 40,
   },
});
