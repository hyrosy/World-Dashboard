import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useNotifications(auth: { token: string | null; siteUrl: string | null }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(swReg => {
                    console.log('Service Worker is registered', swReg);
                    setPermission(Notification.permission);
                    swReg.pushManager.getSubscription().then(subscription => {
                        setIsSubscribed(!!subscription);
                    });
                })
                .catch(error => console.error('Service Worker Error', error));
        }
    }, []);

    const handleSubscription = async () => {
        if (!auth.siteUrl || !auth.token) return;
        setIsLoading(true);

        if (permission === 'denied') {
            alert('You have blocked notifications. Please enable them in your browser settings.');
            setIsLoading(false);
            return;
        }

        try {
            const swRegistration = await navigator.serviceWorker.ready;
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
                throw new Error("VAPID public key is not defined.");
            }
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await fetch(`${auth.siteUrl}/wp-json/my-listings/v1/save-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify(subscription)
            });
            setIsSubscribed(true);
        } catch (error) {
            console.error("Failed to subscribe:", error);
            setIsSubscribed(false); 
        } finally {
            setIsLoading(false);
        }
    };

    return { isSubscribed, permission, isLoading, handleSubscription };
}
