import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function AuthGuard({ children }) {
   const { isAuthenticated, loading, checkAuthStatus } = useAuth();
   const backgroundColor = useThemeColor({}, "background");

   useEffect(() => {
      const verifyAuth = async () => {
         const isAuth = await checkAuthStatus();
         if (!isAuth) {
            router.replace("/login");
         }
      };

      if (!loading && !isAuthenticated) {
         verifyAuth();
      }
   }, [isAuthenticated, loading, checkAuthStatus]);

   if (loading) {
      return (
         <View style={[styles.container, { backgroundColor }]}>
            <ActivityIndicator size="large" color="#6200ee" />
         </View>
      );
   }

   if (!isAuthenticated) {
      return null;
   }

   return children;
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
});
