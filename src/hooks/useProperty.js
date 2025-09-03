import { useState, useCallback } from 'react';
import axios from 'axios';

export const useProperty = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  
  const createProperty = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ndaku_auth_token');
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ndaku_auth_token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/owner/${params.ownerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            page: params.page || 1,
            limit: params.limit || 10,
            sort: params.sort || '-createdAt',
            ...params.filters
          }
        }
      );
      
      setProperties(response.data.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPropertyStats = useCallback(async (ownerId) => {
    try {
      const token = localStorage.getItem('ndaku_auth_token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/stats/${ownerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
    }
  }, []);

  const updateProperty = useCallback(async (id, formData) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ndaku_auth_token');
      
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ndaku_auth_token');
      
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    properties,
    stats,
    createProperty,
    fetchProperties,
    fetchPropertyStats,
    updateProperty,
    deleteProperty
  };
};
