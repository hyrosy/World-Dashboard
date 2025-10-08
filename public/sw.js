// This is the service worker file. It runs in the background.

// Listen for the 'push' event, which is triggered when the server sends a notification.
self.addEventListener('push', function (event) {
    // Retrieve the notification data from the push message.
    const data = event.data ? event.data.json() : {};

    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'Something new happened!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
            url: data.url || '/', // URL to open when the notification is clicked
        },
    };

    // This waitUntil block does two things:
    // 1. It shows the notification.
    // 2. AFTER showing it, it messages the app to refresh.
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => {
                // ** THIS IS THE CORRECT LOCATION FOR THE NEW CODE **
                // After showing the notification, send a message to all active clients (your app).
                return self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                }).then((clientList) => {
                    // Send the message to the first available client.
                    if (clientList.length > 0) {
                        clientList[0].postMessage({ type: 'REFRESH_DATA' });
                    }
                });
            })
    );
});

// Listen for the 'notificationclick' event, which happens when a user clicks on the notification.
self.addEventListener('notificationclick', function (event) {
    // Close the notification pop-up.
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    // Open the URL associated with the notification in a new window.
    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});