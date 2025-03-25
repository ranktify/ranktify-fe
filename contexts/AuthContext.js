import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/authService";
import { router } from "expo-router";
import { Platform } from "react-native";

const debugLog = (message, data = null) => {
   console.log(`[AUTH DEBUG] ${message}`, data ? data : "");
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [isAuthenticated, setIsAuthenticated] = useState(false);

   useEffect(() => {
      const loadUserData = async () => {
         try {
            debugLog("Starting authentication check");
            setLoading(true);

            if (Platform.OS === "web") {
               debugLog("localStorage jwt_token:", localStorage.getItem("jwt_token"));
               debugLog("localStorage refresh_token:", localStorage.getItem("refresh_token"));
            }

            const authStatus = await authService.isAuthenticated();
            debugLog("Auth status from check:", authStatus);

            if (authStatus) {
               debugLog("Token is valid, getting user info");
               const userData = await authService.getUserInfo();
               debugLog("User info retrieved:", userData);
               setUser(userData);
               setIsAuthenticated(true);
            } else {
               debugLog("Token invalid or missing, trying refresh");
               try {
                  const refreshed = await authService.refreshToken();
                  debugLog("Token refresh result:", refreshed);

                  if (refreshed) {
                     const userData = await authService.getUserInfo();
                     debugLog("User info after refresh:", userData);
                     setUser(userData);
                     setIsAuthenticated(true);
                  } else {
                     debugLog("Token refresh failed, clearing auth state");
                     setUser(null);
                     setIsAuthenticated(false);
                  }
               } catch (refreshError) {
                  debugLog("Token refresh error:", refreshError);
                  setUser(null);
                  setIsAuthenticated(false);
               }
            }
         } catch (error) {
            debugLog("General error in auth check:", error);
            setUser(null);
            setIsAuthenticated(false);
         } finally {
            setLoading(false);
            debugLog("Auth check completed, loading:", false);
         }
      };

      loadUserData();
   }, []);

   // Login user
   const login = async (credentials) => {
      try {
         debugLog("Login attempt");
         setLoading(true);
         const data = await authService.login(credentials);
         debugLog("Login successful, data:", data);

         const userInfo = await authService.getUserInfo();
         debugLog("User info after login:", userInfo);

         setUser(userInfo);
         setIsAuthenticated(true);
         return { success: true };
      } catch (error) {
         debugLog("Login error:", error);
         return {
            success: false,
            error: error.response?.data?.message || "Login failed. Please try again.",
         };
      } finally {
         setLoading(false);
      }
   };

   // Register user
   const register = async (userData) => {
      try {
         debugLog("Register attempt");
         setLoading(true);
         const data = await authService.register(userData);
         debugLog("Registration response:", data);

         if (data.token) {
            const userInfo = await authService.getUserInfo();
            debugLog("User info after registration:", userInfo);
            setUser(userInfo);
            setIsAuthenticated(true);
            return { success: true };
         }

         return { success: true, requireLogin: true };
      } catch (error) {
         debugLog("Registration error:", error);
         return {
            success: false,
            error: error.response?.data?.message || "Registration failed. Please try again.",
         };
      } finally {
         setLoading(false);
      }
   };

   // Logout user
   const logout = async () => {
      try {
         debugLog("Logout attempt");
         await authService.logout();
         debugLog("Logout successful");
         setUser(null);
         setIsAuthenticated(false);
         router.replace("/login");
      } catch (error) {
         debugLog("Logout error:", error);
      }
   };

   const checkAuthStatus = async () => {
      try {
         debugLog("Manual auth status check");
         const authStatus = await authService.isAuthenticated();
         debugLog("Auth status from manual check:", authStatus);

         if (!authStatus) {
            debugLog("Manual refresh attempt");
            const refreshed = await authService.refreshToken();
            debugLog("Manual refresh result:", refreshed);

            setIsAuthenticated(refreshed);

            if (refreshed) {
               const userData = await authService.getUserInfo();
               debugLog("User data after manual refresh:", userData);
               setUser(userData);
            }

            return refreshed;
         }

         setIsAuthenticated(authStatus);
         return authStatus;
      } catch (error) {
         debugLog("Manual auth check error:", error);
         setIsAuthenticated(false);
         return false;
      }
   };

   const value = {
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      checkAuthStatus,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
};

export default AuthContext;
