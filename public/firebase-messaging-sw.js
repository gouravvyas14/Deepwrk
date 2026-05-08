self.addEventListener("push", function (event) {
  if (!event.data) return;
  var payload = {};
  try { payload = event.data.json(); } catch (e) { return; }

  var title = (payload.notification && payload.notification.title) ? payload.notification.title : "Deepwrk";
  var options = {
    body: (payload.notification && payload.notification.body) ? payload.notification.body : "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: (payload.data && payload.data.tag) ? payload.data.tag : "deepwrk",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf("/focus") !== -1 && "focus" in list[i]) {
          return list[i].focus();
        }
      }
      return clients.openWindow("/focus");
    })
  );
});
