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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NAVBAR_HEIGHT = 56;

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

   // State for password validation
   const [passwordValidations, setPasswordValidations] = useState({
      length: false,
      uppercase: false,
      number: false,
      specialChar: false,
   });

   // Add state for toggling password visibility
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

   // Theming
   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const placeholderColor =
      backgroundColor === "#fff" ? "rgba(100, 100, 100, 0.8)" : "rgba(200, 200, 200, 0.9)";
   const inputTextColor = backgroundColor === "#fff" ? textColor : "#ffffff";

   const { register, isAuthenticated } = useAuth();

   useEffect(() => {
      if (isAuthenticated) {
         router.replace("/(tabs)");
      }
   }, [isAuthenticated, router]);

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

   // Update password validation state
   useEffect(() => {
      setPasswordValidations({
         length: password.length >= 8 && password.length <= 32,
         uppercase: /[A-Z]/.test(password),
         number: /\d/.test(password),
         specialChar: /[@$!%*?&#]/.test(password),
      });
   }, [password]);

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
      const usernameRegex = /^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/;
      return usernameRegex.test(username);
   };

   const validatePassword = (password) => {
      // Must be 8-32 chars, include uppercase, number, special character
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/;
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
         const result = await register({
            first_name,
            last_name,
            email,
            username,
            password,
            role,
         });

         setIsLoading(false);

         if (result.success) {
            if (result.requireLogin) {
               Alert.alert("Success", "Account created. Please login.");
               router.replace("/login");
            } else {
               Alert.alert("Success", "Account created successfully!");
               router.replace("/(tabs)/rank");
            }
         } else {
            Alert.alert("Signup Failed", result.error);
         }
      } catch (error) {
         setIsLoading(false);
         console.error("Signup error:", error);
         Alert.alert("Signup Failed", "An unexpected error occurred. Please try again.");
      }
   }, [first_name, last_name, email, username, password, confirmPassword, role, register, router]);

   // Login page navigation
   const handleLoginPress = useCallback(() => {
      router.push("/login");
   }, [router]);

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
      input: {
         ...styles.input,
         color: inputTextColor,
      },
      loginText: {
         ...styles.loginText,
         color: textColor,
      },
      inputContainer: {
         ...styles.inputContainer,
         backgroundColor: backgroundColor === "#fff" ? "white" : "#333333",
      },
      halfInputContainer: {
         ...styles.inputContainer,
         ...styles.halfInputContainer,
         backgroundColor: backgroundColor === "#fff" ? "white" : "#333333",
      },
   };

   return (
      <SafeAreaView style={dynamicStyles.safeArea}>
         <StatusBar barStyle={backgroundColor === "#fff" ? "dark-content" : "light-content"} />
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
                     <View style={dynamicStyles.halfInputContainer}>
                        <Ionicons
                           name="person-outline"
                           size={24}
                           color="#6200ee"
                           style={styles.inputIcon}
                        />
                        <TextInput
                           placeholder="First Name"
                           placeholderTextColor={placeholderColor}
                           style={dynamicStyles.input}
                           value={first_name}
                           onChangeText={setfirst_name}
                        />
                     </View>
                     <View style={dynamicStyles.halfInputContainer}>
                        <Ionicons
                           name="person-outline"
                           size={24}
                           color="#6200ee"
                           style={styles.inputIcon}
                        />
                        <TextInput
                           placeholder="Last Name"
                           placeholderTextColor={placeholderColor}
                           style={dynamicStyles.input}
                           value={last_name}
                           onChangeText={setlast_name}
                        />
                     </View>
                  </View>

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
                        name="at-outline"
                        size={24}
                        color="#6200ee"
                        style={styles.inputIcon}
                     />
                     <TextInput
                        placeholder="Username"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.input}
                        value={username}
                        onChangeText={setUsername}
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
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={setPassword}
                     />
                     <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                        <Ionicons
                           name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                           size={24}
                           color="#6200ee"
                        />
                     </TouchableOpacity>
                  </View>
                  <View style={styles.passwordHintContainer}>
                     <Text style={[styles.passwordHint, { color: passwordValidations.length ? "green" : "red" }]}>
                        • 8-32 characters
                     </Text>
                     <Text style={[styles.passwordHint, { color: passwordValidations.uppercase ? "green" : "red" }]}>
                        • At least one uppercase letter
                     </Text>
                     <Text style={[styles.passwordHint, { color: passwordValidations.number ? "green" : "red" }]}>
                        • At least one number
                     </Text>
                     <Text style={[styles.passwordHint, { color: passwordValidations.specialChar ? "green" : "red" }]}>
                        • At least one special character (@$!%*?&#)
                     </Text>
                  </View>

                  <View style={dynamicStyles.inputContainer}>
                     <Ionicons
                        name="lock-closed-outline"
                        size={24}
                        color="#6200ee"
                        style={styles.inputIcon}
                     />
                     <TextInput
                        placeholder="Confirm Password"
                        placeholderTextColor={placeholderColor}
                        style={dynamicStyles.input}
                        secureTextEntry={!isConfirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                     />
                     <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                        <Ionicons
                           name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                           size={24}
                           color="#6200ee"
                        />
                     </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                     style={[styles.signupButton, { opacity: isFormValid ? 1 : 0.5 }]}
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

               <TouchableOpacity style={styles.loginContainer} onPress={handleLoginPress}>
                  <Text style={dynamicStyles.loginText}>
                     Already have an account? <Text style={styles.loginLink}>Login</Text>
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
   halfInputContainer: {
      flex: 1,
   },
   inputIcon: {
      marginRight: 12,
   },
   input: {
      flex: 1,
      height: 56,
      fontSize: 16,
   },
   signupButton: {
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
   signupButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
   },
   passwordHintContainer: {
      marginTop: -10,
      marginBottom: 10,
      marginLeft: 5,
   },
   passwordHint: {
      fontSize: 12,
      marginBottom: 2,
   },
   loginContainer: {
      marginTop: 20,
      alignItems: "center",
   },
   loginText: {
      fontSize: 14,
   },
   loginLink: {
      color: "#6200ee",
      fontWeight: "bold",
   },
});

export default SignUpScreen;
