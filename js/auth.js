// KODO.DIY lightweight auth helpers.
// Production admin access requires Google Identity Services and a real client id.
(function () {
  const ADMIN_EMAIL = "kododiy@gmail.com";
  const SESSION_KEY = "KODO_AUTH_SESSION";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: String(session.email || "").toLowerCase(),
      name: session.name || "",
      picture: session.picture || "",
      provider: session.provider || "google",
      signedInAt: new Date().toISOString()
    }));
  }

  function signOut(redirectTo = "index.html") {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = redirectTo;
  }

  function decodeJwt(token) {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  }

  function requireAdminAccess() {
    const session = getSession();
    if (session?.email === ADMIN_EMAIL) return true;

    document.body.innerHTML = `
      <main class="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <section class="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center">
          <img src="assets/kodo-logo.png?v=4" alt="KODO" class="h-10 mx-auto mb-5 object-contain">
          <div class="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-2">Merchant Admin Locked</div>
          <h1 class="font-syne text-2xl font-black uppercase mb-3">Owner Sign In Required</h1>
          <p class="text-sm text-neutral-400 leading-relaxed mb-5">
            Admin opens only for <b class="text-white">${ADMIN_EMAIL}</b>. Configure a real Google OAuth client id in <code class="text-blue-300">js/backend-config.js</code> to enable secure sign in.
          </p>
          <div id="google-admin-signin" class="flex justify-center mb-4"></div>
          <a href="index.html" class="inline-flex items-center justify-center px-4 py-3 bg-white text-neutral-950 rounded-xl text-xs font-black uppercase">
            Back to Store
          </a>
        </section>
      </main>
    `;

    const clientId = window.KODO_GOOGLE_CLIENT_ID || "";
    const renderGoogleButton = () => {
      if (!clientId || !window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const profile = decodeJwt(response.credential);
          if (String(profile?.email || "").toLowerCase() !== ADMIN_EMAIL) {
            alert("This admin is restricted to kododiy@gmail.com only.");
            return;
          }
          setSession({
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            provider: "google"
          });
          window.location.reload();
        }
      });
      window.google.accounts.id.renderButton(document.getElementById("google-admin-signin"), {
        theme: "filled_black",
        size: "large",
        type: "standard",
        text: "signin_with"
      });
      return true;
    };

    if (!renderGoogleButton() && clientId) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (renderGoogleButton() || attempts > 30) window.clearInterval(timer);
      }, 300);
    }
    return false;
  }

  window.KODO_AUTH = {
    ADMIN_EMAIL,
    getSession,
    setSession,
    signOut,
    requireAdminAccess
  };
})();
