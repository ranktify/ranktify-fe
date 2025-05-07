import axiosInstance from '@/api/axiosInstance';

export const trackImpression = async (label) => {
  try {
    await axiosInstance.post(`/impression/${label}`, { impressions: 1, clicks: 0 });
  } catch (error) {
    console.error(`Error tracking impression for ${label}:`, error);
  }
};

export const trackClick = async (label) => {
  try {
    await axiosInstance.post(`/impression/${label}`, { impressions: 0, clicks: 1 });
  } catch (error) {
    console.error(`Error tracking click for ${label}:`, error);
  }
};