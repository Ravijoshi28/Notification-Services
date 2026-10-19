const API_PATH = "/appNoti/api/push/v1/subscribe";

function decodeApplicationServerKey(key) {
  const base64 = key.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

// Run this in the browser after the user clicks a subscribe button.
export async function createPushSubscription({ applicationServerKey, serviceWorkerUrl = "/PushNotification_service_worker.js" }) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported in this browser");
  }

  if (!applicationServerKey) {
    throw new Error("An application server public key is required");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(`Notification permission was ${permission}`);
  }

  const worker = await navigator.serviceWorker.register(serviceWorkerUrl);
  const currentSubscription = await worker.pushManager.getSubscription();
  const subscription = currentSubscription || await worker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeApplicationServerKey(applicationServerKey),
  });

  return {
    subscription: subscription.toJSON(),
    domain: window.location.origin,
  };
}

// Run this on your app server. Never put the API key in browser code.
export async function savePushSubscription({ apiUrl, apiKey, userId, subscription, domain }) {
  if (typeof window !== "undefined") {
    throw new Error("Save subscriptions from your server so your API key stays private");
  }

  if (!apiUrl || !apiKey || !userId || !subscription || !domain) {
    throw new Error("apiUrl, apiKey, userId, subscription, and domain are required");
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${API_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ userId, subscription, domain }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || `Unable to save subscription (${response.status})`);
  }

  return result;
}
