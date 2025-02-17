import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ProfileScreen() {
   const router = useRouter();
   const textColor = useThemeColor({}, "text");

   return (
      <View style={styles.container}>
         <Text style={[styles.text, { color: textColor }]}>Profile Screen</Text>
         <Text>This is the Profile Screen</Text>
         <Button title="Go to Login" onPress={() => router.push("/login")} />
         <Button title="Go to Signup" onPress={() => router.push("/signup")} />
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
