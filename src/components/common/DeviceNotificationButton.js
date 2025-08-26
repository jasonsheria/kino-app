import React, {useState, useEffect} from 'react';
import { Button } from '@mui/material';
import { showToast } from './ToastManager';

const STORAGE_KEY = 'ndaku_device_notifications_enabled';

export default function DeviceNotificationButton({ className, style }){
  const [enabled, setEnabled] = useState(()=>{
    try{ return localStorage.getItem(STORAGE_KEY) === '1'; }catch(e){ return false; }
  });
  useEffect(()=>{
    try{ if(enabled) localStorage.setItem(STORAGE_KEY, '1'); else localStorage.removeItem(STORAGE_KEY); }catch(e){}
  },[enabled]);

  const requestPermission = async ()=>{
    if (!('Notification' in window)){
      showToast('Notifications non supportées par cet appareil', 'warn');
      return;
    }
    try{
      // If permission already granted, just show a sample notification
      if (Notification.permission === 'granted'){
        fireTestNotification();
        setEnabled(true);
        return;
      }
      // If default, request
      if (Notification.permission === 'default'){
        const p = await Notification.requestPermission();
        if (p === 'granted'){
          showToast('Notifications activées', 'success');
          fireTestNotification();
          setEnabled(true);
        } else if (p === 'denied'){
          showToast('Vous avez refusé les notifications. Vous pouvez les activer depuis les paramètres du navigateur.', 'warn');
          setEnabled(false);
        }
        return;
      }
      // denied
      if (Notification.permission === 'denied'){
        showToast('Notifications refusées — activez-les dans les paramètres du navigateur pour les autoriser.', 'warn');
        setEnabled(false);
        return;
      }
    }catch(e){
      console.warn('ndaku: notification request failed', e);
      showToast('Impossible de demander l’autorisation de notification', 'error');
    }
  };

  const fireTestNotification = ()=>{
    try{
      const title = 'Ndaku — Notifications activées';
      const body = 'Vous recevrez des alertes importantes directement sur votre appareil.';
      // prefer serviceWorker if registered
      if (navigator.serviceWorker && navigator.serviceWorker.controller){
        navigator.serviceWorker.getRegistration().then(reg=>{
          if (reg && reg.showNotification){
            reg.showNotification(title, { body, tag: 'ndaku-device-notif', renotify: true, icon: '/logo192.png' });
            showToast('Notification test envoyée via le service worker', 'success');
            setEnabled(true);
          } else {
            new Notification(title, { body, tag: 'ndaku-device-notif', icon: '/logo192.png' });
            showToast('Notification test envoyée', 'success');
            setEnabled(true);
          }
        }).catch(()=>{
          try{ new Notification(title, { body, tag: 'ndaku-device-notif', icon: '/logo192.png' }); showToast('Notification test envoyée', 'success'); setEnabled(true);}catch(e){ showToast('Impossible d’afficher la notification', 'error'); }
        });
      } else {
        new Notification(title, { body, tag: 'ndaku-device-notif', icon: '/logo192.png' });
        showToast('Notification test envoyée', 'success');
        setEnabled(true);
      }
    }catch(e){ console.warn('ndaku: fireTestNotification', e); showToast('Impossible d’afficher la notification', 'error'); }
  };

  const handleClick = (e)=>{ e && e.stopPropagation(); requestPermission(); };

  return (
    <div className={className} style={style}>
      {enabled ? (
        <Button variant="outlined" color="primary" onClick={()=>{ setEnabled(false); showToast('Notifications désactivées pour cet appareil', 'info'); }}>
          Notifications activées (Cliquer pour désactiver)
        </Button>
      ) : (
        <Button variant="contained" color="primary" onClick={handleClick}>
          Activer les notifications de l’appareil
        </Button>
      )}
    </div>
  );
}
