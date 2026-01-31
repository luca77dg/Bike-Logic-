
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

const getClientId = () => (import.meta as any).env?.VITE_STRAVA_CLIENT_ID || process.env.VITE_STRAVA_CLIENT_ID || "";
const getClientSecret = () => (import.meta as any).env?.VITE_STRAVA_CLIENT_SECRET || process.env.VITE_STRAVA_CLIENT_SECRET || "";

export const stravaService = {
  isConfigured: () => !!getClientId() && !!getClientSecret(),

  getAuthUrl: () => {
    const redirectUri = window.location.origin;
    return `${STRAVA_AUTH_URL}?client_id=${getClientId()}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,profile:read_all,gear:read`;
  },

  exchangeToken: async (code: string) => {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        code,
        grant_type: 'authorization_code'
      })
    });
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('strava_auth', JSON.stringify(data));
    }
    return data;
  },

  getRefreshToken: async () => {
    const auth = localStorage.getItem('strava_auth');
    if (!auth) return null;
    const { refresh_token } = JSON.parse(auth);

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        refresh_token,
        grant_type: 'refresh_token'
      })
    });
    const data = await response.json();
    if (data.access_token) {
      const newAuth = { ...JSON.parse(auth), ...data };
      localStorage.setItem('strava_auth', JSON.stringify(newAuth));
      return data.access_token;
    }
    return null;
  },

  getValidToken: async () => {
    const auth = localStorage.getItem('strava_auth');
    if (!auth) return null;
    const { access_token, expires_at } = JSON.parse(auth);
    
    if (Date.now() / 1000 < expires_at - 60) {
      return access_token;
    }
    return await stravaService.getRefreshToken();
  },

  getAthleteData: async () => {
    const token = await stravaService.getValidToken();
    if (!token) return null;
    
    const response = await fetch(`https://www.strava.com/api/v3/athlete`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  getGearDetails: async (gearId: string) => {
    const token = await stravaService.getValidToken();
    if (!token) return null;

    const response = await fetch(`https://www.strava.com/api/v3/gear/${gearId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
};
