import React, { useCallback, useState, useEffect } from "react";
import {
   View,
   Text,
   StyleSheet,
   TextInput,
   TouchableOpacity,
   Platform,
   Alert,
   SafeAreaView,
   StatusBar,
   Dimensions,
   ActivityIndicator,
   Image,
   ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NAVBAR_HEIGHT = 56;

const LoginScreen = React.memo(({ navbarHeight = NAVBAR_HEIGHT }) => {
   const router = useRouter();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const placeholderColor =
      backgroundColor === "#fff" ? "rgba(100, 100, 100, 0.8)" : "rgba(200, 200, 200, 0.9)";

   const inputTextColor = backgroundColor === "#fff" ? textColor : "#ffffff";
   const { login, isAuthenticated } = useAuth();

   useEffect(() => {
      if (isAuthenticated) {
         router.replace("/(tabs)");
      }
   }, [isAuthenticated, router]);

   const handleLoginPress = useCallback(async () => {
      if (!email || !password) {
         Alert.alert("Error", "Please enter both email and password");
         return;
      }

      setIsLoading(true);

      try {
         const result = await login({ email, password });

         if (result.success) {
            router.replace("/(tabs)/rank");
         } else {
            Alert.alert("Login Failed", result.error);
         }
      } catch (error) {
         console.error("Login error:", error);
         Alert.alert("Login Failed", "An unexpected error occurred. Please try again.");
      } finally {
         setIsLoading(false);
      }
   }, [email, password, login, router]);

   const handleSignupPress = useCallback(() => {
      router.push("/signup");
   }, [router]);

   const dynamicStyles = {
      safeArea: {
         flex: 1,
         backgroundColor,
         paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      },
      title: {
         ...styles.title,
         color: textColor,
      },
      subtitle: {
         ...styles.subtitle,
         color: textColor,
      },
      input: {
         ...styles.input,
         color: inputTextColor,
      },
      signupText: {
         ...styles.signupText,
         color: textColor,
      },
      inputContainer: {
         ...styles.inputContainer,
         backgroundColor: backgroundColor === "#fff" ? "white" : "#333333",
      },
   };

   return (
      <SafeAreaView style={dynamicStyles.safeArea}>
         <StatusBar barStyle={backgroundColor === "#fff" ? "dark-content" : "light-content"} />
         <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
         >
            <View style={styles.contentContainer}>
               <View style={styles.headerContainer}>
                  <View style={styles.logoContainer}>
                     <Image 
                        source={require('@/assets/images/AppIcon.png')} 
                        style={styles.logo}
                     />
                  </View>
                  <Text style={dynamicStyles.title}>Welcome to Ranktify</Text>
                  <Text style={dynamicStyles.subtitle}>Sign in to continue</Text>
               </View>

               <View style={styles.formContainer}>
                  <View style={dynamicStyles.inputContainer}>
                     <Ionicons
                        name="mail-outline"
                        size={24}
                        color="#6200ee"
                        style={styles.inputIcon}
                     />
                     <TextInput
                        placeholder="Email"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                     />
                  </View>

                  <View style={dynamicStyles.inputContainer}>
                     <Ionicons
                        name="lock-closed-outline"
                        size={24}
                        color="#6200ee"
                        style={styles.inputIcon}
                     />
                     <TextInput
                        placeholder="Password"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                     />
                  </View>

                  <TouchableOpacity style={styles.forgotPassword}>
                     <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={styles.loginButton}
                     onPress={handleLoginPress}
                     activeOpacity={0.8}
                     disabled={isLoading}
                  >
                     {isLoading ? (
                        <ActivityIndicator color="white" />
                     ) : (
                        <Text style={styles.loginButtonText}>LOGIN</Text>
                     )}
                  </TouchableOpacity>
               </View>

               <TouchableOpacity style={styles.signupContainer} onPress={handleSignupPress}>
                  <Text style={dynamicStyles.signupText}>
                     Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
                  </Text>
               </TouchableOpacity>
            </View>
         </ScrollView>
      </SafeAreaView>
   );
});

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   contentContainer: {
      flex: 1,
      padding: 16,
      minHeight: '100%',
      justifyContent: 'flex-start',
   },
   headerContainer: {
      alignItems: "center",
      marginTop: 12,
      marginBottom: 8,
   },
   title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 4,
      textAlign: "center",
   },
   subtitle: {
      fontSize: 18,
      textAlign: "center",
      marginBottom: 4,
      opacity: 0.8,
   },
   logoContainer: {
      marginBottom: 32,
      alignItems: 'center',
   },
   logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
   },
   formContainer: {
      width: "100%",
      maxWidth: SCREEN_WIDTH * 0.85,
      alignSelf: "center",
      marginTop: 8,
      marginBottom: 16,
   },
   inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
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
   forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 16,
   },
   forgotPasswordText: {
      color: "#6200ee",
      fontSize: 14,
      fontWeight: "600",
   },
   loginButton: {
      backgroundColor: "#6200ee",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: '#6200ee',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
   },
   loginButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
   },
   signupContainer: {
      marginTop: 24,
      alignItems: "center",
   },
   signupText: {
      fontSize: 14,
      opacity: 0.8,
   },
   signupLink: {
      color: "#6200ee",
      fontWeight: "600",
   },
   scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-start',
   },
});

export default LoginScreen;
