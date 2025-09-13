import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_APP_URL;

// Obtenir le profil utilisateur de base
export const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('ndaku_auth_token');
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtenir le profil propriétaire complet
export const fetchOwnerProfile = async () => {
  try {
    const token = localStorage.getItem('ndaku_auth_token');
    const response = await axios.get(`${BASE_URL}/api/owner/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour le profil
export const updateProfile = async (data, files = {}) => {
  try {
    const token = localStorage.getItem('ndaku_auth_token');
    const formData = new FormData();
    
    // Ajouter les données du profil
    formData.append('data', JSON.stringify(data));
    
    // Ajouter les fichiers
    if (files.avatar) {
      formData.append('profileImage', files.avatar);
    }

    const response = await axios.patch(
      `${BASE_URL}/api/auth/update-profile`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
};