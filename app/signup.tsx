import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function SignupScreen() {
   const router = useRouter();
   const textColor = useThemeColor({}, "text");

   return (
      <View style={styles.container}>
         <Text style={[styles.text, { color: textColor }]}>Signup Screen</Text>
         <Button title="Go to Login" onPress={() => router.push("/login")} />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   text: {
      fontSize: 18,
   },
});
