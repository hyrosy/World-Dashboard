// This is the service worker file. It runs in the background.

// Listen for the 'push' event, which is triggered when the server sends a notification.
self.addEventListener('push', function (event) {
  // Retrieve the notification data from the push message.
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'Something new happened!',
    icon: '/favicon.ico', // You can use your app's icon here
    badge: '/favicon.ico', // Icon for the notification bar on mobile
    data: {
      url: data.url || '/', // URL to open when the notification is clicked
    },
  };

  // Show the notification.
  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for the 'notificationclick' event, which happens when a user clicks on the notification.
self.addEventListener('notificationclick', function (event) {
  // Close the notification pop-up.
  event.notification.close();

  // Open the URL associated with the notification.
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
