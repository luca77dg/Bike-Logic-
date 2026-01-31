
/**
 * Strava Integration Guidelines for Vercel:
 * You need to set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in Vercel Environment Variables.
 */

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const REDIRECT_URI = window.location.origin;

export const stravaService = {
  getAuthUrl: (clientId: string) => {
    return `${STRAVA_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=read,profile:read_all,activity:read_all`;
  },

  exchangeToken: async (clientId: string, clientSecret: string, code: string) => {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });
    return response.json();
  },

  getGearDetails: async (accessToken: string, gearId: string) => {
    const response = await fetch(`https://www.strava.com/api/v3/gear/${gearId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.json();
  }
};
