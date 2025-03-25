import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AuthGuard from "../../components/AuthGuard.js";

export default function TabLayout() {
   const colorScheme = useColorScheme();

   const getTabBarIcon = (name: string, iosName: string, androidName: string) => {
      return ({ color }: { color: string }) => {
         if (Platform.OS === "ios") {
            return <IconSymbol size={28} name={iosName} color={color} />;
         } else {
            return <MaterialIcons size={28} name={androidName} color={color} />;
         }
      };
   };

   return (
      <AuthGuard>
         <Tabs
            screenOptions={{
               tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
               headerShown: false,
               tabBarButton: HapticTab,
               tabBarBackground: TabBarBackground,
               tabBarStyle: Platform.select({
                  ios: {
                     // Use a transparent background on iOS to show the blur effect
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
                  tabBarIcon: getTabBarIcon("house", "house.fill", "home"),
               }}
            />
            <Tabs.Screen
               name="search"
               options={{
                  title: "Search",
                  tabBarIcon: getTabBarIcon("magnifyingglass", "magnifyingglass", "search"),
               }}
            />
            <Tabs.Screen
               name="rank"
               options={{
                  title: "Rank",
                  tabBarIcon: getTabBarIcon("star", "star.fill", "star"),
               }}
            />
            <Tabs.Screen
               name="notifications"
               options={{
                  title: "Notifications",
                  tabBarIcon: getTabBarIcon("bell", "bell.fill", "notifications"),
               }}
            />
            <Tabs.Screen
               name="profile"
               options={{
                  title: "Profile",
                  tabBarIcon: getTabBarIcon("person", "person.fill", "person"),
               }}
            />
         </Tabs>
      </AuthGuard>
   );
}
