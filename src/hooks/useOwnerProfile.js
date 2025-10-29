import { useState, useEffect } from 'react';

export const useOwnerProfile = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOwnerProfile = async () => {
            try {
                const token = localStorage.getItem('ndaku_auth_token');
                if (!token) {
                    throw new Error('Token non trouvé');
                }

                const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du profil propriétaire');
                }

                const profileData = await response.json();
                setOwnerProfile(profileData);
                console.log("Fetched owner profile:", profileData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerProfile();
    }, []);

    return { ownerProfile, loading, error };
};
