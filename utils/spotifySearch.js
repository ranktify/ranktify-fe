import { getSpotifyToken } from "./spotifyAuth";

export async function extractSCDNLinksFromPage(url) {
   const response = await fetch(url);
   const html = await response.text();

   const matches = [...html.matchAll(/https:\/\/p\.scdn\.co\/[^"' >)]+\.mp3/g)];
   if (matches.length > 0) {
      return Array.from(new Set(matches.map((match) => match[0])));
   }

   const allMatches = [...html.matchAll(/https:\/\/p\.scdn\.co\/[^"' >)]+/g)];
   return Array.from(new Set(allMatches.map((match) => match[0])));
}


export async function searchAndGetLinks(songName) {
   try {
      const token = await getSpotifyToken();
      if (!token) {
         throw new Error("No Spotify token available");
      }

      const params = new URLSearchParams({
         q: songName,
         type: "track",
         limit: "10",
         market: "US",
      });

      const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });

      if (!response.ok) {
         if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            throw new Error(`Rate limited. Try again after ${retryAfter} seconds`);
         }
         throw new Error("Spotify API request failed");
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];

      const results = await Promise.all(
         tracks.map(async (track) => {
            const spotifyUrl = track.external_urls.spotify;
            let previewUrl = track.preview_url;

            try {
               const scrapedLinks = await extractSCDNLinksFromPage(spotifyUrl);
               if (scrapedLinks.length > 0) {
                  previewUrl = scrapedLinks[0];
               }
            } catch (e) {
               console.warn(`Failed to scrape preview for ${track.name}:`, e.message);
            }

            return {
               id: track.id,
               name: track.name,
               artists: track.artists.map((a) => a.name).join(", "),
               image: track.album.images[0]?.url,
               spotifyUrl,
               previewUrl,
               audioUri: previewUrl,
            };
         })
      );

      return {
         success: true,
         results,
      };
   } catch (error) {
      console.error("Error searching Spotify:", error);
      return {
         success: false,
         error: error.message,
         results: [],
      };
   }
}
