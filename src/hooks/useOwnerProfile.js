import { useState, useEffect } from 'react';

export const useOwnerProfile = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOwnerProfile = async () => {
            try {
                const token = localStorage.getItem('ndaku_auth_token');
                // If there's no token, try to fall back to a locally saved draft (developer convenience)
                if (!token) {
                    try {
                        const draft = JSON.parse(localStorage.getItem('owner_request_draft') || 'null');
                        if (draft) {
                            setOwnerProfile(draft);
                            return;
                        }
                    } catch (e) {
                        // ignore and continue with null profile
                    }
                    // no token and no draft — do not treat as fatal error, just return empty profile
                    setOwnerProfile(null);
                    return;
                }

                const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    // non-fatal: log and keep ownerProfile null so UI can still render
                    console.warn('useOwnerProfile: profile fetch failed', response.status);
                    setOwnerProfile(null);
                    return;
                }

                const profileData = await response.json();
                setOwnerProfile(profileData);
                console.log("Fetched owner profile:", profileData);
            } catch (err) {
                console.warn('useOwnerProfile error', err);
                setOwnerProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerProfile();
    }, []);

    return { ownerProfile, loading, error };
};
