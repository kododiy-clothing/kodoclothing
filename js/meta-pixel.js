// Meta Pixel: KODO Website Pixel
(function () {
  const pixelId = "1761955588419473";
  if (!pixelId || window.fbq) return;

  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq("init", pixelId);
  fbq("track", "PageView");

  window.KODO_META_PIXEL = {
    id: pixelId,
    track(eventName, params = {}) {
      if (!window.fbq || !eventName) return;
      window.fbq("track", eventName, params);
    },
    trackCustom(eventName, params = {}) {
      if (!window.fbq || !eventName) return;
      window.fbq("trackCustom", eventName, params);
    }
  };
})();
