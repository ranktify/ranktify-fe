import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
   ActivityIndicator,
	Alert,
	Button,
	Platform,
   SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
   Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { refreshSpotifyToken, useSpotifyAuth } from "../../utils/spotifyAuth";
import SpotifyIcon from "@/assets/images/spotify-icon.png";

const statusBarHeight = Platform.OS === "ios" ? 8 : StatusBar.currentHeight;

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

   const getInitials = () => {
      if (!user || !user.username) return "?";
      return user.username.charAt(0).toUpperCase();
   };

   if (loading) {
      return (
         <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <View style={[styles.loadingContainer, { backgroundColor }]}>
               <ActivityIndicator size="large" color="#6200ee" />
               <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
            </View>
         </SafeAreaView>
      );
   }

   if (!isAuthenticated || !user) {
      return (
         <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <View style={[styles.container, { backgroundColor }]}>
               <View style={styles.headerContainer}>
                  <Text style={[styles.title, { color: textColor }]}>Welcome to Ranktify</Text>
                  <Text style={[styles.subtitle, { color: textColor }]}>
                     Please log in or sign up to continue
                  </Text>
               </View>

               <View style={styles.formContainer}>
                  <TouchableOpacity
                     style={styles.authButton}
                     onPress={() => router.push("/login")}
                  >
                     <Text style={styles.authButtonText}>Go to Login</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[styles.authButton, { backgroundColor: "#03DAC6" }]}
                     onPress={() => router.push("/signup")}
                  >
                     <Text style={styles.authButtonText}>Go to Signup</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
         <ScrollView style={[styles.container, { backgroundColor }]}>
            <View style={styles.formContainer}>
               {/* User Info Section */}
               <View style={styles.section}>
                  <View style={styles.userHeader}>
                     <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                           <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                        <View style={styles.userTextInfo}>
                           <Text style={[styles.username, { color: textColor }]}>{user.username}</Text>
                           <Text style={[styles.email, { color: textColor }]}>{user.email}</Text>
                        </View>
                     </View>
                     <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                     >
                        <Ionicons name="log-out-outline" size={24} color={textColor} />
                     </TouchableOpacity>
                  </View>
               </View>

               {/* Stats Section */}
               <View style={[styles.statsSection, { borderColor: backgroundColor === '#fff' ? '#eee' : '#333' }]}>
                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text style={[styles.statLabel, { color: textColor }]}>Ranked</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: backgroundColor === '#fff' ? '#eee' : '#333' }]} />
                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text style={[styles.statLabel, { color: textColor }]}>Lists</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: backgroundColor === '#fff' ? '#eee' : '#333' }]} />
                  <View style={styles.statItem}>
                     <Text style={[styles.statNumber, { color: textColor }]}>0</Text>
                     <Text style={[styles.statLabel, { color: textColor }]}>Shared</Text>
                  </View>
               </View>

               {/* Spotify Connection - Without header */}
               <View style={styles.spotifySection}>
                  <View style={[styles.spotifyCard, { backgroundColor: backgroundColor === '#fff' ? '#f5f5f5' : '#2a2a2a' }]}>
                     <View style={styles.spotifyInfo}>
                        <Image 
                           source={SpotifyIcon} 
                           style={[
                              styles.spotifyStatusIcon,
                              { opacity: hasSpotifyToken ? 1 : 0.5 }
                           ]} 
                        />
                        <Text style={[styles.spotifyStatus, { color: textColor }]}>
                           {spotifyUsername ? `Connected as ${spotifyUsername}` : "Not connected"}
                        </Text>
                     </View>
                     <TouchableOpacity
                        style={[
                           styles.spotifyButton,
                           hasSpotifyToken && styles.spotifyDisconnectButton
                        ]}
                        onPress={handleSpotifyConnect}
                        disabled={isAuthenticating}
                     >
                        <Text style={styles.spotifyButtonText}>
                           {isAuthenticating
                              ? "Connecting..."
                              : hasSpotifyToken
                              ? "Disconnect"
                              : "Connect"}
                        </Text>
                     </TouchableOpacity>
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

               {/* Rankings Section */}
               <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Your Rankings</Text>
                  <Text style={[styles.emptyText, { color: textColor }]}>
                     {hasSpotifyToken
                        ? "You haven't ranked any songs yet."
                        : "Connect your Spotify account to start ranking songs."}
                  </Text>
                  {hasSpotifyToken && (
                     <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push("/(tabs)/rank")}
                     >
                        <Text style={styles.actionButtonText}>Start Ranking</Text>
                     </TouchableOpacity>
                  )}
               </View>
            </View>
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: statusBarHeight,
   },
   formContainer: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
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
   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   loadingText: {
      fontSize: 16,
      marginTop: 10,
   },
   section: {
      marginBottom: 16, // Reduced margin
   },
   userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16, // Reduced margin
   },
   avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#6200ee",
      justifyContent: "center",
      alignItems: "center",
   },
   avatarText: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "bold",
   },
   userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
   },
   userTextInfo: {
      marginLeft: 16,
      flex: 1,
   },
   username: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
   },
   email: {
      fontSize: 16,
      opacity: 0.8,
   },
   statsSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
   },
   statItem: {
      flex: 1,
      alignItems: 'center',
   },
   statNumber: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 6,
   },
   statLabel: {
      fontSize: 15,
      opacity: 0.7,
   },
   statDivider: {
      width: 1.5,
      height: 36,
      marginHorizontal: 4,
   },
   sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 16,
   },
   spotifySection: {
      marginBottom: 24,
   },
   spotifyCard: {
      borderRadius: 12,
      padding: 16,
   },
   spotifyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
   },
   spotifyStatusIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
   },
   spotifyStatus: {
      fontSize: 16,
      flex: 1,
   },
   spotifyButton: {
      backgroundColor: "#1DB954",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
   },
   spotifyDisconnectButton: {
      backgroundColor: "#ff6b6b",
   },
   spotifyButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
   },
   emptyText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
      opacity: 0.8,
   },
   actionButton: {
      backgroundColor: "#6200ee",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignSelf: 'center',
   },
   actionButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
   },
   logoutButton: {
      padding: 8,
      marginLeft: 16,
   },
});
