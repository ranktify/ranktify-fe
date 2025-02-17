import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function SearchScreen() {
   const textColor = useThemeColor({}, "text");

   return (
      <View style={styles.container}>
         <Text style={[styles.text, { color: textColor }]}>Search Screen</Text>
         <Text style={[styles.text, { color: textColor }]}>This is the Search Screen</Text>
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
