self.addEventListener("push", event => {
  let data={title:"LearnMate AI",body:"New learning update",url:"/"};
  try{ if(event.data) data={...data,...event.data.json()}; }catch{}
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,
    icon:"/icon.svg",
    badge:"/icon.svg",
    tag:data.type||"learnmate-update",
    renotify:true,
    data:{url:data.url||"/"}
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list){ if("focus" in c) return c.focus(); }
    if(clients.openWindow) return clients.openWindow(event.notification.data?.url||"/");
  }));
});
