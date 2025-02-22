import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function LoginScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, "text");

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: textColor }]}>Login Screen</Text>
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
