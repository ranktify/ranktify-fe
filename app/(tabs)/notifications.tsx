import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); 

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/friends/${user.id}/friend-requests`);
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user.id]);

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const handleProcessRequest = async (id, senderId, action) => {
    try {
      const route =
        action === "accept"
          ? `/ranktify/friends/accept/${id}/${senderId}/${user.id}`
          : `/ranktify/friends/decline/${id}/${senderId}/${user.id}`;

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend request`);
      }

      const result = await response.json();
      if (result.success) {
        Alert.alert("Success", `Friend request ${action}ed successfully.`);
        handleDismiss(id);
      } else {
        Alert.alert("Error", result.error || `Failed to ${action} friend request.`);
      }
    } catch (error) {
      console.error(`Error processing friend request (${action}):`, error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Notifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications at the moment.</Text>
      ) : (
        notifications.map((notif) => (
          <View key={notif.id} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>Friend Request</Text>
            <View style={styles.notificationContent}>
              <Image source={{ uri: notif.avatar }} style={styles.notificationAvatar} />
              <Text style={styles.notificationMessage}>
                <Text style={styles.notificationUsername}>{notif.user}</Text> has sent you a friend request
              </Text>
            </View>
            <View style={styles.notificationActions}>
              <TouchableOpacity
                onPress={() => handleProcessRequest(notif.id, notif.senderId, "accept")}
                style={styles.acceptButton}
              >
                <Text style={styles.acceptText}>✔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProcessRequest(notif.id, notif.senderId, "deny")}
                style={styles.denyButton}
              >
                <Text style={styles.denyText}>✖</Text>
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
    backgroundColor: "#121212",
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  text: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  username: {
    fontWeight: "bold",
    color: "#fff",
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 6,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  acceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  denyButton: {
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  denyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  notificationCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  notificationMessage: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  notificationUsername: {
    fontWeight: "bold",
    color: "#fff",
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});