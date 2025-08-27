import { useEffect, useCallback } from 'react';
import webSocketService from '../services/webSocketService';

export function useWebSocket() {
  const send = useCallback((message) => {
    webSocketService.send(message);
  }, []);

  const on = useCallback((messageType, handler) => {
    webSocketService.on(messageType, handler);
    // Cleanup on unmount
    return () => webSocketService.off(messageType, handler);
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  return {
    send,
    on,
    disconnect,
    isConnected
  };
}
