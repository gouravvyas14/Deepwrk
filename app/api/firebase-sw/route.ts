import { NextResponse } from "next/server";

// Serves the Firebase Messaging service worker with env vars injected at runtime.
// Registered from client as /firebase-messaging-sw.js via next.config.ts rewrite.
export async function GET() {
  const config = JSON.stringify({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  const sw = `
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(${config});
const messaging = firebase.messaging();

// Show notification when app is in the background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Deepwrk";
  const body  = payload.notification?.body  ?? "";
  const tag   = payload.data?.tag ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag,
    renotify: true,
  });
});

// Clicking the notification focuses/opens the focus page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("/focus") && "focus" in c) return c.focus();
      }
      return clients.openWindow?.("/focus");
    }),
  );
});
`;

  return new NextResponse(sw, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
