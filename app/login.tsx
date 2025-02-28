import React, { useCallback, useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   TextInput,
   TouchableOpacity,
   KeyboardAvoidingView,
   Platform,
   Alert,
   SafeAreaView,
   StatusBar,
   Dimensions,
   ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

const SCREEN_WIDTH = Dimensions.get("window").width;
const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 20 : StatusBar.currentHeight;
const NAVBAR_HEIGHT = 56;

const baseURL = Constants.expoConfig?.extra?.baseURL;

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

   const handleLoginPress = useCallback(async () => {
      if (!email || !password) {
         Alert.alert("Error", "Please enter both email and password");
         return;
      }

      setIsLoading(true);

      try {
         const response = await axios.post(`${baseURL}/ranktify/user/login`, {
            email,
            password,
         });

         console.log("Login successful:", response.data);
         setIsLoading(false);

         router.replace("/rank");
      } catch (error) {
         setIsLoading(false);

         const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
         console.error("Login error:", error);
         Alert.alert("Login Failed", errorMessage);
      }
   }, [email, password, router]);

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
         <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
         >
            <View style={[styles.contentContainer, { paddingBottom: navbarHeight }]}>
               <View style={styles.headerContainer}>
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
         </KeyboardAvoidingView>
      </SafeAreaView>
   );
});

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   contentContainer: {
      flex: 1,
      padding: 20,
      justifyContent: "flex-start",
   },
   headerContainer: {
      alignItems: "center",
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
   },
   formContainer: {
      width: "100%",
      maxWidth: SCREEN_WIDTH * 0.85,
      alignSelf: "center",
   },
   inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
      borderRadius: 8,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 56,
      elevation: 2,
      shadowColor: "#000",
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
   forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 24,
   },
   forgotPasswordText: {
      color: "#6200ee",
      fontSize: 14,
   },
   loginButton: {
      backgroundColor: "#6200ee",
      borderRadius: 8,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
   },
   loginButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
   },
   signupContainer: {
      marginTop: 20,
      alignItems: "center",
   },
   signupText: {
      fontSize: 14,
   },
   signupLink: {
      color: "#6200ee",
      fontWeight: "bold",
   },
});

export default LoginScreen;
