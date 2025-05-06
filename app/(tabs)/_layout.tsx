import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AuthGuard from "../../components/AuthGuard.js";
import { NotificationProvider, useNotifications } from '@/components/NotificationContext';

function TabBarIcon({ name, iosName, androidName, color }: { name: string; iosName: string; androidName: string; color: string }) {
   if (Platform.OS === "ios") {
      return <IconSymbol size={28} name={iosName} color={color} />;
   } else {
      return <MaterialIcons size={28} name={androidName} color={color} />;
   }
}

function TabNavigator() {
   const colorScheme = useColorScheme();
   const { notificationCount, refreshNotifications } = useNotifications();

   // Refresh notifications when tab navigator mounts
   useEffect(() => {
      refreshNotifications();
   }, []);

   return (
      <Tabs
         screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
               ios: {
                  position: "absolute",
               },
               default: {},
            }),
         }}
      >
         <Tabs.Screen
            name="index"
            options={{
               title: "Home",
               tabBarIcon: ({ color }) => (
                  <TabBarIcon name="house" iosName="house.fill" androidName="home" color={color} />
               ),
            }}
         />
         <Tabs.Screen
            name="search"
            options={{
               title: "Search",
               tabBarIcon: ({ color }) => (
                  <TabBarIcon name="magnifyingglass" iosName="magnifyingglass" androidName="search" color={color} />
               ),
            }}
         />
         <Tabs.Screen
            name="rank"
            options={{
               title: "Rank",
               tabBarIcon: ({ color }) => (
                  <TabBarIcon name="star" iosName="star.fill" androidName="star" color={color} />
               ),
            }}
         />
         <Tabs.Screen
            name="notifications"
            options={{
               title: "Notifications",
               tabBarIcon: ({ color }) => (
                  <TabBarIcon name="bell" iosName="bell.fill" androidName="notifications" color={color} />
               ),
               tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
               tabBarBadgeStyle: {
                  backgroundColor: '#FF3B30',
               }
            }}
         />
         <Tabs.Screen
            name="profile"
            options={{
               title: "Profile",
               tabBarIcon: ({ color }) => (
                  <TabBarIcon name="person" iosName="person.fill" androidName="person" color={color} />
               ),
            }}
         />
      </Tabs>
   );
}

export default function TabLayout() {
   return (
      <AuthGuard>
         <NotificationProvider>
            <TabNavigator />
         </NotificationProvider>
      </AuthGuard>
   );
}
