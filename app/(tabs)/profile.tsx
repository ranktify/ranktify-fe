import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Button,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { refreshSpotifyToken, useSpotifyAuth } from "../../utils/spotifyAuth";

const statusBarHeight = Platform.OS === "ios" ? 50 : StatusBar.currentHeight;

export default function ProfileScreen() {
   const router = useRouter();
   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");

   const { user, loading, logout, isAuthenticated } = useAuth();
   const [spotifyUsername, setSpotifyUsername] = useState(null);

   const {
      login: loginSpotify,
      logout: logoutSpotify,
      hasSpotifyToken,
      isAuthenticating,
   } = useSpotifyAuth((token) => {
      fetchSpotifyProfile(token);
   });

   useEffect(() => {
      const checkSpotifyConnection = async () => {
         const token = await AsyncStorage.getItem("@spotify_token");
         if (token) {
            fetchSpotifyProfile(token);
         }
      };

      if (isAuthenticated && user) {
         checkSpotifyConnection();
      }
   }, [isAuthenticated, user]);

   const fetchSpotifyProfile = async (token) => {
      try {
         const response = await fetch("https://api.spotify.com/v1/me", {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (response.ok) {
            const data = await response.json();
            setSpotifyUsername(data.display_name || data.id);
         } else {
            console.log("Failed to fetch Spotify profile");
            if (response.status === 401) {
               await AsyncStorage.removeItem("@spotify_token");
               await AsyncStorage.removeItem("@spotify_token_expiry");
               setSpotifyUsername(null);
            }
         }
      } catch (error) {
         console.error("Error fetching Spotify profile:", error);
      }
   };

   const handleSpotifyConnect = async () => {
      if (hasSpotifyToken) {
         Alert.alert(
            "Disconnect Spotify",
            "Are you sure you want to disconnect your Spotify account?",
            [
               {
                  text: "Cancel",
                  style: "cancel",
               },
               {
                  text: "Disconnect",
                  onPress: async () => {
                     await logoutSpotify();
                     setSpotifyUsername(null);
                  },
               },
            ]
         );
      } else {
         await loginSpotify();
      }
   };

   const handleLogout = async () => {
      try {
         await logoutSpotify();
         await logout();
      } catch (error) {
         console.error("Logout error:", error);
      }
   };

   const handleSpotifyRefresh = async () => {
      try {
         const oldToken = await AsyncStorage.getItem("@spotify_token");
         const newToken = await refreshSpotifyToken();
         console.log("Spotify token refresh", { oldToken, newToken });
         if (newToken) {
            Alert.alert("Token Refresh", `Old Token:\n${oldToken}\n\nNew Token:\n${newToken}`);
         } else {
            Alert.alert("Error", "Failed to refresh Spotify token.");
         }
      } catch (error) {
         console.error("Spotify refresh error:", error);
         Alert.alert("Error", error.message || "Error refreshing Spotify token.");
      }
   };

   if (loading) {
      return (
         <View style={[styles.loadingContainer, { backgroundColor }]}>
            <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
         </View>
      );
   }

   if (!isAuthenticated || !user) {
      return (
         <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.welcomeContainer}>
               <Text style={[styles.title, { color: textColor }]}>Welcome to Ranktify</Text>
               <Text style={[styles.text, { color: textColor, marginBottom: 30 }]}>
                  Please log in or sign up to continue
               </Text>

               <View style={styles.buttonContainer}>
                  <Button
                     title="Go to Login"
                     onPress={() => router.push("/login")}
                     color="#6200ee"
                  />
               </View>
               <View style={styles.buttonContainer}>
                  <Button
                     title="Go to Signup"
                     onPress={() => router.push("/signup")}
                     color="#03DAC6"
                  />
               </View>
            </View>
         </View>
      );
   }

   const getInitials = () => {
      if (!user || !user.username) return "?";
      return user.username.charAt(0).toUpperCase();
   };

   return (
      <ScrollView style={[styles.container, { backgroundColor }]}>
         <View style={styles.header}>
            <View style={styles.profileHeader}>
               <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                     <Text style={styles.avatarText}>{getInitials()}</Text>
                  </View>
               </View>

               <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text
                        style={[
                           styles.statLabel,
                           { color: backgroundColor === "#fff" ? "#999" : "#aaa" },
                        ]}
                     >
                        Ranked
                     </Text>
                  </View>

                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text
                        style={[
                           styles.statLabel,
                           { color: backgroundColor === "#fff" ? "#999" : "#aaa" },
                        ]}
                     >
                        Lists
                     </Text>
                  </View>

                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text
                        style={[
                           styles.statLabel,
                           { color: backgroundColor === "#fff" ? "#999" : "#aaa" },
                        ]}
                     >
                        Shared
                     </Text>
                  </View>
               </View>
            </View>

            <View style={styles.profileContainer}>
               <Text style={[styles.label, { color: textColor }]}>Username</Text>
               <Text style={[styles.info, { color: textColor }]}>{user.username}</Text>

               <Text style={[styles.label, { color: textColor }]}>Email</Text>
               <Text style={[styles.info, { color: textColor }]}>{user.email}</Text>

               <Text style={[styles.label, { color: textColor }]}>User ID</Text>
               <Text style={[styles.info, { color: textColor }]}>{user.userId}</Text>

               <Text style={[styles.label, { color: textColor }]}>Spotify</Text>
               <View style={styles.spotifyContainer}>
                  <Text style={[styles.info, { color: textColor, marginBottom: 0 }]}>
                     {spotifyUsername ? `Connected as ${spotifyUsername}` : "Not connected"}
                  </Text>
                  <TouchableOpacity
                     style={[
                        styles.spotifyButton,
                        { backgroundColor: hasSpotifyToken ? "#1DB954" : "#1DB954" },
                     ]}
                     onPress={handleSpotifyConnect}
                     disabled={isAuthenticating}
                  >
                     <Text style={styles.spotifyButtonText}>
                        {isAuthenticating
                           ? "Connecting..."
                           : hasSpotifyToken
                           ? "Disconnect Spotify"
                           : "Connect Spotify"}
                     </Text>
                  </TouchableOpacity>
               </View>
               {hasSpotifyToken && (
                  <View style={styles.buttonContainer}>
                     <Button
                        title="Refresh Spotify Token"
                        onPress={handleSpotifyRefresh}
                        color="#1DB954"
                     />
                  </View>
               )}
            </View>
         </View>

         <View
            style={[
               styles.contentSection,
               { borderTopColor: backgroundColor === "#fff" ? "#DBDBDB" : "#444" },
            ]}
         >
            <View
               style={[
                  styles.sectionHeader,
                  {
                     borderBottomColor: backgroundColor === "#fff" ? "#DBDBDB" : "#444",
                  },
               ]}
            >
               <Text style={[styles.sectionTitle, { color: textColor }]}>Your Rankings</Text>
            </View>

            <View style={styles.emptyContent}>
               <Text style={[styles.text, { color: textColor }]}>
                  {hasSpotifyToken
                     ? "You haven't ranked any songs yet."
                     : "Connect your Spotify account to start ranking songs."}
               </Text>
               {hasSpotifyToken ? (
                  <TouchableOpacity
                     style={styles.rankButton}
                     onPress={() => router.push("/(tabs)/rank")}
                  >
                     <Text style={styles.rankButtonText}>Start Ranking</Text>
                  </TouchableOpacity>
               ) : (
                  <TouchableOpacity
                     style={styles.rankButton}
                     onPress={handleSpotifyConnect}
                     disabled={isAuthenticating}
                  >
                     <Text style={styles.rankButtonText}>
                        {isAuthenticating ? "Connecting..." : "Connect Spotify"}
                     </Text>
                  </TouchableOpacity>
               )}
            </View>
         </View>

         <View style={styles.buttonContainer}>
            <Button title="Logout" onPress={handleLogout} color="#6200ee" />
         </View>
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      paddingTop: statusBarHeight,
   },
   spotifyContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
   },
   spotifyButton: {
      backgroundColor: "#1DB954",
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 15,
   },
   spotifyButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
   },
   loadingContainer: {
      flex: 1,
      paddingTop: statusBarHeight,
      justifyContent: "center",
      alignItems: "center",
   },
   loadingText: {
      fontSize: 18,
      textAlign: "center",
   },
   welcomeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
   },
   title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
   },
   text: {
      fontSize: 18,
      textAlign: "center",
   },
   buttonContainer: {
      width: "100%",
      marginBottom: 15,
      padding: 10,
   },
   header: {
      padding: 20,
   },
   profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
   },
   avatarContainer: {
      marginRight: 20,
   },
   avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#6200ee",
      justifyContent: "center",
      alignItems: "center",
   },
   avatarText: {
      color: "#fff",
      fontSize: 32,
      fontWeight: "bold",
   },
   statsContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
   },
   statItem: {
      alignItems: "center",
   },
   statNumber: {
      fontSize: 18,
      fontWeight: "bold",
   },
   statLabel: {
      fontSize: 14,
      color: "#999",
   },
   profileContainer: {
      width: "100%",
      marginBottom: 30,
      padding: 5,
   },
   label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
   },
   info: {
      fontSize: 16,
      marginBottom: 20,
   },
   contentSection: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#DBDBDB",
   },
   sectionHeader: {
      flexDirection: "row",
      justifyContent: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#DBDBDB",
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
   },
   emptyContent: {
      padding: 30,
      alignItems: "center",
      justifyContent: "center",
   },
   rankButton: {
      backgroundColor: "#6200ee",
      borderRadius: 5,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 15,
   },
   rankButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
   },
});
