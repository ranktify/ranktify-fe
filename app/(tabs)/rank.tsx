import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function RankScreen() {
   const textColor = useThemeColor({}, "text");

   return (
      <View style={styles.container}>
         <Text style={[styles.text, { color: textColor }]}>Rank Screen</Text>
         <Text style={[styles.text, { color: textColor }]}>This is the Rank Screen</Text>
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
