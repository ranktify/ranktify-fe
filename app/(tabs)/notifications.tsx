import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useNotifications } from '@/components/NotificationContext';
import { Ionicons } from "@expo/vector-icons";

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
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<{[key: number]: string}>({});
  const { setNotificationCount, refreshNotifications } = useNotifications();

  useEffect(() => {
    // Only fetch when the notifications screen mounts
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
      // Set the notification count
      setNotificationCount(response.data.friend_request_count || 0);
      // Fetch names for all senders if there are any requests
      if (response.data.friend_request && response.data.friend_request.length > 0) {
        response.data.friend_request.forEach((request: FriendRequest) => {
          fetchUserName(request.sender_id);
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // Set default values in case of error
      setResponseData({ friend_request: [], friend_request_count: 0 });
      setNotificationCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (request: FriendRequest) => {
    try {
      await axiosInstance.post(
        `/friends/accept/${request.request_id}/${request.sender_id}/${request.receiver_id}`
      );
      await fetchFriendRequests(); // This will update the notification count
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeny = async (request: FriendRequest) => {
    try {
      await axiosInstance.delete(
        `/friends/decline/${request.request_id}/${request.sender_id}/${request.receiver_id}`
      );
      await fetchFriendRequests(); // This will update the notification count
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : !responseData?.friend_request?.length ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            No new notifications
          </Text>
        </View>
      ) : (
        responseData.friend_request.map((request) => (
          <View 
            key={request.request_id} 
            style={[
              styles.requestBox,
              { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(42, 42, 42, 0.8)' }
            ]}
          >
            <View style={styles.requestContent}>
              <View style={styles.requestHeader}>
                <Ionicons name="person-add-outline" size={24} color={textColor} />
                <Text style={[styles.requestText, { color: textColor }]}>
                  {userNames[request.sender_id] || 'Loading...'} sent you a friend request
                </Text>
              </View>
              <Text style={[styles.dateText, { color: textColor, opacity: 0.7 }]}>
                {new Date(request.request_date).toLocaleDateString()}
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleAccept(request)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.denyButton]}
                  onPress={() => handleDeny(request)}
                >
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.buttonText}>Deny</Text>
                </TouchableOpacity>
              </View>
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
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  requestBox: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    ...Platform.select({
      ios: {
        borderWidth: 1,
        borderColor: 'rgba(98, 0, 238, 0.1)',
      }
    })
  },
  requestContent: {
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  acceptButton: {
    backgroundColor: '#1DB954',
  },
  denyButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
