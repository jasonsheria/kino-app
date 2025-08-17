import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        if (!code) {
            setError('Code d\'autorisation manquant.');
            return;
        }
        async function doExchange() {
            try {
                const codeVerifier = localStorage.getItem('ndaku_pkce_code_verifier');
                const redirect_uri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
                const res = await fetch('/api/auth/google/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri })
                });
                if (!res.ok) throw new Error('Échange échoué: ' + res.status);
                const data = await res.json();
                // expected { access_token, id_token, refresh_token, user }
                if (data.access_token) {
                    localStorage.setItem('ndaku_auth_token', data.access_token);
                }
                if (data.user) {
                    localStorage.setItem('ndaku_user', JSON.stringify(data.user));
                }
                // connect websocket and listen
                try {
                    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8081');
                    ws.addEventListener('open', () => {
                        console.log('ws open');
                        // send a ready message with user id if available
                        const u = data.user || {};
                        ws.send(JSON.stringify({ type: 'hello', user: { id: u.id, name: u.name } }));
                        try{ window.__APP_SOCKET__ = ws; }catch(e){}
                    });
                    ws.addEventListener('message', (evt) => {
                        try {
                            const m = JSON.parse(evt.data);
                            console.log('ws msg', m);
                            if (m.type === 'welcome') {
                                // can store our ws id if needed
                                localStorage.setItem('ndaku_ws_id', m.id);
                            }
                        } catch (e) { console.warn('ws parse', e); }
                    });
                    ws.addEventListener('close', () => console.log('ws closed'));
                    // keep reference if needed
                    window.__ndaku_ws = ws;
                } catch (e) { console.warn('ws failed', e); }

                // redirect to dashboard
                navigate('/dashboard');
            } catch (e) {
                console.error(e);
                setError(e.message || String(e));
            }
        }
        doExchange();
    }, [navigate]);

    if (error) return <div className="container py-5"><h3>Erreur d'authentification</h3><p>{error}</p></div>;
    return <div className="container py-5"><h3>Connexion en cours...</h3><p>Merci de patienter, nous vous redirigeons.</p></div>;
}
