import React, { useCallback, useState, useEffect } from "react";
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
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const SCREEN_WIDTH = Dimensions.get("window").width;
const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 20 : StatusBar.currentHeight;
const NAVBAR_HEIGHT = 56;
const baseURL = Constants.expoConfig?.extra?.baseURL || "http://localhost:8080";

const SignUpScreen = React.memo(({ navbarHeight = NAVBAR_HEIGHT }) => {
   const router = useRouter();

   // State
   const [first_name, setfirst_name] = useState("");
   const [last_name, setlast_name] = useState("");
   const [email, setEmail] = useState("");
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isFormValid, setIsFormValid] = useState(false);
   const role = "";

   // Theming
   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const placeholderColor =
      backgroundColor === "#fff" ? "rgba(100, 100, 100, 0.8)" : "rgba(200, 200, 200, 0.9)";
   const inputTextColor = backgroundColor === "#fff" ? textColor : "#ffffff";

   // SecureStore-like object that uses localStorage on web
   const secureStore = {
      setItem: async (key, value) => {
         if (Platform.OS === "web") {
            localStorage.setItem(key, value);
            return;
         }
         return await SecureStore.setItemAsync(key, value);
      },
      getItem: async (key) => {
         if (Platform.OS === "web") {
            return localStorage.getItem(key);
         }
         return await SecureStore.getItemAsync(key);
      },
      deleteItem: async (key) => {
         if (Platform.OS === "web") {
            localStorage.removeItem(key);
            return;
         }
         return await SecureStore.deleteItemAsync(key);
      },
   };

   useEffect(() => {
      setIsFormValid(
         first_name.trim() !== "" &&
         last_name.trim() !== "" &&
         email.trim() !== "" &&
         username.trim() !== "" &&
         password.trim() !== "" &&
         confirmPassword.trim() !== ""
      );
   }, [first_name, last_name, email, username, password, confirmPassword]);

   // Validation helpers
   const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   };

   const validateName = (name) => {
      const nameRegex = /^[a-zA-Z]+$/;
      return nameRegex.test(name);
   };

   const validateUsername = (username) => {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      return usernameRegex.test(username);
   };

   const validatePassword = (password) => {
      // Must be 8-32 chars, include uppercase, number, special character
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
      return passwordRegex.test(password);
   };

   // Signup logic
   const handleSignupPress = useCallback(async () => {
      if (!validateName(first_name)) {
         Alert.alert("Error", "First name should contain only letters.");
         return;
      }
      if (!validateName(last_name)) {
         Alert.alert("Error", "Last name should contain only letters.");
         return;
      }
      if (!validateEmail(email)) {
         Alert.alert("Error", "Please enter a valid email address.");
         return;
      }
      if (!validateUsername(username)) {
         Alert.alert("Error", "Username can only contain letters, numbers, and underscores.");
         return;
      }
      if (!validatePassword(password)) {
         Alert.alert(
            "Error",
            "Password must be 8-32 characters long and include an uppercase letter, a number, and a special character."
         );
         return;
      }
      if (password !== confirmPassword) {
         Alert.alert("Error", "Passwords do not match.");
         return;
      }

      setIsLoading(true);

      try {
         const response = await axios.post(`${baseURL}/ranktify/user/register`, {
            first_name,
            last_name,
            email,
            username,
            password,
            role,
         });

         console.log("Signup successful:", response.data);

         // If the server returns a token upon successful signup:
         if (response.data?.token) {
            const { token } = response.data;

            // Store token in secureStore
            await secureStore.setItem("jwt_token", token);

            // Parse token to store user info (assuming your token has user_id, email, username)
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
               const payload = JSON.parse(atob(tokenParts[1]));
               await secureStore.setItem(
                  "user_info",
                  JSON.stringify({
                     userId: payload.user_id,
                     email: payload.email,
                     username: payload.username,
                  })
               );
            }

            setIsLoading(false);
            Alert.alert("Success", "Account created successfully!");
            // Navigate to rank screen (or wherever you want after signup)
            router.replace("/rank");
         } else {
            // If no token was returned, prompt the user to log in
            setIsLoading(false);
            Alert.alert("Success", "Account created. Please login.");
            router.replace("/login");
         }
      } catch (error) {
         setIsLoading(false);
         let errorMessage = "Signup failed. Please try again.";
         if (error.response) {
            if (error.response.status === 403) {
               errorMessage = "Username or Email is already taken.";
            } else {
               errorMessage = error.response.data?.message || errorMessage;
            }
         }
         console.error("Signup error:", error);
         Alert.alert("Signup Failed", errorMessage);
      }
   }, [
      first_name,
      last_name,
      email,
      username,
      password,
      confirmPassword,
      role,
      router,
      secureStore,
   ]);

   // Dynamic styles for light/dark mode
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
      inputHalfWidth: {
         ...styles.inputHalfWidth,
         color: inputTextColor,
         backgroundColor: backgroundColor === "#fff" ? "white" : "#333333",
      },
      inputContainer: {
         ...styles.inputContainer,
         color: inputTextColor,
         backgroundColor: backgroundColor === "#fff" ? "white" : "#333333",
      },
   };

   return (
      <SafeAreaView style={dynamicStyles.safeArea}>
         <StatusBar
            barStyle={backgroundColor === "#fff" ? "dark-content" : "light-content"}
         />
         <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
         >
            <View style={[styles.contentContainer, { paddingBottom: navbarHeight }]}>
               <View style={styles.headerContainer}>
                  <Text style={dynamicStyles.title}>Create an Account</Text>
                  <Text style={dynamicStyles.subtitle}>Sign up to get started</Text>
               </View>

               <View style={styles.formContainer}>
                  <View style={styles.rowContainer}>
                     <TextInput
                        placeholder="First Name"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.inputHalfWidth}
                        value={first_name}
                        onChangeText={setfirst_name}
                     />
                     <TextInput
                        placeholder="Last Name"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.inputHalfWidth}
                        value={last_name}
                        onChangeText={setlast_name}
                     />
                  </View>

                  <TextInput
                     placeholder="Email"
                     placeholderTextColor={placeholderColor}
                     style={dynamicStyles.inputContainer}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     value={email}
                     onChangeText={setEmail}
                  />

                  <TextInput
                     placeholder="Username"
                     placeholderTextColor={placeholderColor}
                     style={dynamicStyles.inputContainer}
                     value={username}
                     onChangeText={setUsername}
                  />

                  <TextInput
                     placeholder="Password"
                     placeholderTextColor={placeholderColor}
                     style={dynamicStyles.inputContainer}
                     secureTextEntry
                     value={password}
                     onChangeText={setPassword}
                  />
                  <Text style={styles.passwordHint}>
                     Password must be 8-32 characters long, include at least one uppercase
                     letter, one number, and one special character.
                  </Text>

                  <TextInput
                     placeholder="Confirm Password"
                     placeholderTextColor={placeholderColor}
                     style={dynamicStyles.inputContainer}
                     secureTextEntry
                     value={confirmPassword}
                     onChangeText={setConfirmPassword}
                  />

                  <TouchableOpacity
                     style={[
                        styles.signupButton,
                        { opacity: isFormValid ? 1 : 0.5 },
                     ]}
                     onPress={handleSignupPress}
                     activeOpacity={isFormValid ? 0.8 : 1}
                     disabled={isLoading || !isFormValid}
                  >
                     {isLoading ? (
                        <ActivityIndicator color="white" />
                     ) : (
                        <Text style={styles.signupButtonText}>SIGN UP</Text>
                     )}
                  </TouchableOpacity>
               </View>
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
   rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
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
   inputHalfWidth: {
      flex: 1,
      height: 56,
      fontSize: 16,
      backgroundColor: "#333",
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
   },
   signupButton: {
      backgroundColor: "#6200ee",
      borderRadius: 8,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
   },
   signupButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
   },
   passwordHint: {
      fontSize: 12,
      color: "rgba(200, 200, 200, 0.8)",
      marginTop: -10, // Moves the hint closer to the password input
      marginBottom: 10, // Adds space before the confirm password input
      marginLeft: 5,
   },
});

export default SignUpScreen;
