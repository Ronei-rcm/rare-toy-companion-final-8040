import { useState, useEffect } from 'react';
import { pushApi } from '@/services/push-api';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
    isSubscribed: false,
    permission: 'default',
    subscription: null,
  });

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
        permission: Notification.permission,
      }));
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Push notifications não suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribe();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;

      // Obter VAPID public key do servidor
      const { publicKey } = await pushApi.getPublicKey();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
      });

      // Enviar subscription para o servidor
      await pushApi.subscribe(subscription);

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }));

      console.log('✅ Inscrito em push notifications');
      return true;
    } catch (error) {
      console.error('Erro ao inscrever em push:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.subscription) return false;

    try {
      await state.subscription.unsubscribe();

      // Remover do servidor
      // Only send endpoint if necessary, or check if pushApi.unsubscribe expects endpoint or subscription object.
      // push-api.ts defined unsubscribe(endpoint: string).
      await pushApi.unsubscribe(state.subscription.endpoint);

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));

      console.log('❌ Desinscrito de push notifications');
      return true;
    } catch (error) {
      console.error('Erro ao desinscrever:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

