import axiosInstance from "./config";

export const fetchAllPages = async (url) => {
  let results = [];
  let nextUrl = url;

  while (nextUrl) {
    try {
      const response = await axiosInstance.get(nextUrl);
      const data = response.data;
      
      results = results.concat(data.results || []);
      nextUrl = data.next;
    } catch (error) {
      console.error(`Failed to fetch from ${nextUrl}:`, error);
      throw error; // Stop fetching on error
    }
  }

  return results;
}; 