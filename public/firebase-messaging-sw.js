// Firebase Messaging Service Worker
// Config is injected via URL search params at registration time to avoid
// hardcoding credentials in a static file.
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

const url = new URL(location.href);

firebase.initializeApp({
  apiKey: url.searchParams.get("apiKey"),
  authDomain: url.searchParams.get("authDomain"),
  projectId: url.searchParams.get("projectId"),
  storageBucket: url.searchParams.get("storageBucket"),
  messagingSenderId: url.searchParams.get("messagingSenderId"),
  appId: url.searchParams.get("appId"),
});

const messaging = firebase.messaging();

// Handle background (tab hidden / closed) push messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Deepwrk";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.tag ?? "deepwrk-notification",
    data: payload.data,
    requireInteraction: false,
  };
  self.registration.showNotification(title, options);
});
