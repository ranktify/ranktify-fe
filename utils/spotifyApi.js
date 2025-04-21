import { getSpotifyToken, refreshSpotifyToken } from "./spotifyAuth";

const BASE_URL = "https://api.spotify.com/v1";

const fetchFromSpotify = async (endpoint, options = {}) => {
   let token = await getSpotifyToken();
   if (!token) {
      token = await refreshSpotifyToken();
   }
   if (!token) {
      throw new Error("No Spotify token available");
   }

   const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
         Authorization: `Bearer ${token}`,
         "Content-Type": "application/json",
         ...options.headers,
      },
      ...options,
   });

   if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error?.message || "Spotify API request failed");
   }

   return response.json();
};

// Get user profile
export const getSpotifyUserProfile = async () => {
   return fetchFromSpotify("/me");
};

// Get user's top tracks
export const getTopTracks = async (timeRange = "medium_term", limit = 50) => {
   return fetchFromSpotify(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
};

// Get user's top artists
export const getTopArtists = async (timeRange = "medium_term", limit = 50) => {
   return fetchFromSpotify(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
};

// Get recently played tracks
export const getRecentlyPlayed = async (limit = 50) => {
   return fetchFromSpotify(`/me/player/recently-played?limit=${limit}`);
};

// Get a specific playlist
export const getPlaylist = async (playlistId) => {
   return fetchFromSpotify(`/playlists/${playlistId}`);
};

// Search Spotify
export const searchSpotify = async (query, types = ["track", "artist"], limit = 20) => {
   const typeString = types.join(",");
   return fetchFromSpotify(
      `/search?q=${encodeURIComponent(query)}&type=${typeString}&limit=${limit}`
   );
};

// Create a playlist
export const createPlaylist = async (userId, name, description = "", isPublic = false) => {
   return fetchFromSpotify(`/users/${userId}/playlists`, {
      method: "POST",
      body: JSON.stringify({
         name,
         description,
         public: isPublic,
      }),
   });
};

// Add tracks to a playlist
export const addTracksToPlaylist = async (playlistId, trackUris) => {
   return fetchFromSpotify(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({
         uris: trackUris,
      }),
   });
};
