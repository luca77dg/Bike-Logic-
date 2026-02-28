import { supabaseService } from './supabase.ts';

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

const getClientId = () => (import.meta as any).env?.VITE_STRAVA_CLIENT_ID || process.env.VITE_STRAVA_CLIENT_ID || "";
const getClientSecret = () => (import.meta as any).env?.VITE_STRAVA_CLIENT_SECRET || process.env.VITE_STRAVA_CLIENT_SECRET || "";

export const stravaService = {
  isConfigured: () => !!getClientId() && !!getClientSecret(),

  getAuthUrl: () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    // Gli scope corretti per leggere profilo e attrezzatura sono 'read' e 'profile:read_all'
    // 'gear:read' non esiste più come scope separato ma è incluso in profile:read_all
    const scopes = "read,profile:read_all";
    return `${STRAVA_AUTH_URL}?client_id=${getClientId()}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scopes}`;
  },

  exchangeToken: async (code: string) => {
    try {
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
        await supabaseService.setSetting('strava_auth', data);
      }
      return data;
    } catch (err) {
      console.error("Strava Exchange Token Error:", err);
      return null;
    }
  },

  getRefreshToken: async () => {
    const auth = localStorage.getItem('strava_auth');
    if (!auth) return null;
    const { refresh_token } = JSON.parse(auth);

    try {
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
        await supabaseService.setSetting('strava_auth', newAuth);
        return data.access_token;
      }
    } catch (err) {
      console.error("Strava Refresh Token Error:", err);
    }
    return null;
  },

  getValidToken: async () => {
    let auth = localStorage.getItem('strava_auth');
    
    // Se non c'è in localStorage, prova a prenderlo da Supabase
    if (!auth) {
      const cloudAuth = await supabaseService.getSetting('strava_auth');
      if (cloudAuth) {
        auth = JSON.stringify(cloudAuth);
        localStorage.setItem('strava_auth', auth);
      }
    }

    if (!auth) return null;
    const { access_token, expires_at } = JSON.parse(auth);
    
    // Refresh se mancano meno di 5 minuti alla scadenza
    if (Date.now() / 1000 < expires_at - 300) {
      return access_token;
    }
    return await stravaService.getRefreshToken();
  },

  getAthleteData: async () => {
    const token = await stravaService.getValidToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`https://www.strava.com/api/v3/athlete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch athlete");
      return response.json();
    } catch (err) {
      console.error("Strava Get Athlete Error:", err);
      return null;
    }
  },

  getGearDetails: async (gearId: string) => {
    const token = await stravaService.getValidToken();
    if (!token) return null;

    try {
      const response = await fetch(`https://www.strava.com/api/v3/gear/${gearId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch gear");
      return response.json();
    } catch (err) {
      console.error("Strava Get Gear Error:", err);
      return null;
    }
  }
};
