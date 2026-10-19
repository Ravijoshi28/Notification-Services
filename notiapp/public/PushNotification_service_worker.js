self.addEventListener("push", event => {
  let message = {};

  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data?.text() || "You have a new notification" };
  }

  const title = message.title || "New notification";
  const options = {
    body: message.body || "You have a new notification",
    data: { url: message.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(self.clients.openWindow(url));
});
