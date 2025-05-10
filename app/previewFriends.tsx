import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
   SafeAreaView,
   ScrollView,
   StyleSheet,
   Text,
   View,
   TouchableOpacity,
   Alert,
} from "react-native";
import axiosInstance from "@/api/axiosInstance";

interface Friend {
   id: number;
   username: string;
   email?: string;
}

export default function PreviewFriendsScreen() {
   const params = useLocalSearchParams();
   const textColor = useThemeColor({}, "text");
   const backgroundColor = useThemeColor({}, "background");
   const userId = params.userId as string;

   const [friends, setFriends] = useState<Friend[]>([]);

   useEffect(() => {
      console.log('Raw params received:', params); // Debug log
      if (params.friends) {
         try {
            const friendsData = typeof params.friends === 'string' 
               ? JSON.parse(params.friends) 
               : params.friends;
            
            console.log('Friends data processed:', friendsData);
            setFriends(friendsData);
         } catch (error) {
            console.error("Error processing friends data:", error);
         }
      }
   }, [params.friends]);

   const removeFriend = async (friendId: number) => {
      try {
         await axiosInstance.delete(`/friends/${userId}/${friendId}`);
         setFriends(friends.filter((friend: Friend) => friend.id !== friendId));
      } catch (error) {
         console.error("Error removing friend:", error);
         Alert.alert("Error", "Failed to remove friend");
      }
   };

   const confirmRemoveFriend = (friend: Friend) => {
      Alert.alert(
         "Remove Friend",
         "Do you want to remove this friend?",
         [
            {
               text: "Cancel",
               style: "cancel"
            },
            {
               text: "Remove",
               onPress: () => removeFriend(friend.id),
               style: "destructive"
            }
         ]
      );
   };

   return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
         <Stack.Screen 
            options={{
               title: "Friends",
               headerBackTitle: "Back"
            }} 
         />
         <ScrollView style={styles.content}>
            {friends.map((friend: Friend, index: number) => (
               <View key={index} style={styles.friendItem}>
                  <Text style={[styles.friendText, { color: textColor }]}>
                     {friend.username || friend.email || 'Unknown Friend'}
                  </Text>
                  <TouchableOpacity
                     onPress={() => confirmRemoveFriend(friend)}
                     style={styles.removeButton}
                  >
                     <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
               </View>
            ))}
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   content: {
      flex: 1,
      padding: 16,
   },
   friendItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   friendText: {
      fontSize: 16,
   },
   removeButton: {
      padding: 8,
   },
   removeButtonText: {
      color: '#FF3B30',
      fontSize: 24,
      fontWeight: 'bold',
   },
});
