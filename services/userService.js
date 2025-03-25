// src/services/userService.js
import axiosInstance from "../api/axiosInstance";

export const userService = {
   // Get user by ID
   async getUserById(id) {
      try {
         const response = await axiosInstance.get(`/user/${id}`);
         return response.data;
      } catch (error) {
         console.error(`Error getting user ${id}:`, error);
         throw error;
      }
   },

   // Get all users
   async getAllUsers() {
      try {
         const response = await axiosInstance.get("/user/");
         return response.data;
      } catch (error) {
         console.error("Error getting all users:", error);
         throw error;
      }
   },

   // Update user
   async updateUser(id, userData) {
      try {
         const response = await axiosInstance.put(`/user/${id}`, userData);
         return response.data;
      } catch (error) {
         console.error(`Error updating user ${id}:`, error);
         throw error;
      }
   },

   // Delete user
   async deleteUser(id) {
      try {
         const response = await axiosInstance.delete(`/user/${id}`);
         return response.data;
      } catch (error) {
         console.error(`Error deleting user ${id}:`, error);
         throw error;
      }
   },
};

export default userService;
