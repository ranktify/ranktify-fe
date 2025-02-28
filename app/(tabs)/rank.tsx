import { StyleSheet, View } from "react-native";
import SongSwiper from "@/components/SongSwiper";

export default function RankPage() {
   return (
      <View style={styles.container}>
         <SongSwiper onSwipe={() => {}} onSwipeLeft={() => {}} onSwipeRight={() => {}} />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#ffffff",
   },
});
