import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from "@/api/axiosInstance";

type NotificationContextType = {
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  notificationCount: 0,
  setNotificationCount: () => {},
  refreshNotifications: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationCount, setNotificationCount] = useState(0);

  const refreshNotifications = async () => {
    try {
      const response = await axiosInstance.get('/friends/friend-requests');
      setNotificationCount(response.data.friend_request_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notifications when the app starts
  useEffect(() => {
    refreshNotifications();
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notificationCount, 
      setNotificationCount,
      refreshNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);