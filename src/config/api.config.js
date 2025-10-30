const API_URL = process.env.REACT_APP_BACKEND_APP_URL;
const SITE_ID = process.env.REACT_APP_SITE_ID || '689255f6c544155ff0443a9b';
if (!API_URL) {
  console.warn('REACT_APP_BACKEND_APP_URL is not defined in .env file');
}

export const config = {
  API_URL,
  API_ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: `${API_URL}/api/auth/login`,
      REGISTER: `${API_URL}/api/auth/register`, 
      GOOGLE_LOGIN: `${API_URL}/api/auth/google`,
      GOOGLE_EXCHANGE: `${API_URL}/api/auth/google/exchange`,
      PROFILE: `${API_URL}/api/auth/profile`,
    },
    // User endpoints
    USER: {
      PROFILE: `${API_URL}/auth/api/profile`,
      UPDATE: `${API_URL}/api/update-profile`,
    },
    // Property endpoints
    PROPERTY: {
      LIST: `${API_URL}/api/properties`,
      DETAILS: (id) => `${API_URL}/api/properties/${id}`,
      CREATE: `${API_URL}/api/properties`,
      UPDATE: (id) => `${API_URL}/api/properties/${id}`,
      DELETE: (id) => `${API_URL}/api/properties/${id}`,
    },
    // Agency endpoints
    AGENCY: {
      LIST: `${API_URL}/api/agencies`,
      DETAILS: (id) => `${API_URL}/api/agencies/${id}`,
      CREATE: `${API_URL}/api/agencies`,
      UPDATE: (id) => `${API_URL}/api/agencies/${id}`,
      DELETE: (id) => `${API_URL}/api/agencies/${id}`,
      LOGIN: `${API_URL}/api/agencies/login`,
    },
    // Owner endpoints
    OWNER: {
      PROFILE: `${API_URL}/api/owners/profile`,
      UPDATE: `${API_URL}/api/owners/update`,
      PROPERTIES: `${API_URL}/api/owners/properties`,
    },
    // WebSocket
    WS_URL: process.env.REACT_APP_BACKEND_APP_URL || `${API_URL.replace('http', 'ws')}/socket.io`,
  }
};
