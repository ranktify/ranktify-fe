import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";

interface FriendRequest {
  request_id: number;
  sender_id: number;
  receiver_id: number;
  request_date: string;
  status: string;
}

interface ResponseData {
  friend_request: FriendRequest[];
  friend_request_count: number;
}

export default function NotificationsScreen() {
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "tint");
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchUserName = async (userId: number) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      console.log('User data:', response.data.user.username);
      setUserNames(prev => ({
        ...prev,
        [userId]: response.data.user.username
      }));
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axiosInstance.get('/friends/friend-requests');
      setResponseData(response.data);
      // Fetch names for all senders
      response.data.friend_request.forEach((request: FriendRequest) => {
        fetchUserName(request.sender_id);
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (request: FriendRequest) => {
    try {
      await axiosInstance.post(
        `/friends/accept/${request.request_id}/${request.sender_id}/${request.receiver_id}`
      );
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeny = async (request: FriendRequest) => {
    try {
      await axiosInstance.delete(
        `/friends/decline/${request.request_id}/${request.sender_id}/${request.receiver_id}`
      );
      fetchFriendRequests();
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerText, { color: textColor }]}>Notifications</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#1DB954" />
      ) : !responseData?.friend_request?.length ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            No new notifications
          </Text>
        </View>
      ) : (
        responseData.friend_request.map((request) => (
          <View key={request.request_id} style={[styles.requestBox]}>
            <Text style={styles.requestText}>
              {userNames[request.sender_id] || 'Loading...'} sent you a friend request
            </Text>
            <Text style={[styles.dateText]}>
              {new Date(request.request_date).toLocaleDateString()}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAccept(request)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.denyButton]}
                onPress={() => handleDeny(request)}
              >
                <Text style={styles.buttonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  requestBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#121212',  // Force dark background
  },
  requestText: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 4,
    color: '#FFFFFF',  // Force white text
  },
  dateText: {
    fontSize: 12,
    color: '#FFFFFF',  // Force white text
    fontFamily: 'System',
    opacity: 0.7, // Slightly dimmed for secondary text
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#1DB954',
  },
  denyButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'System',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
