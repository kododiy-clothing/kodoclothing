// KODO.DIY admin authentication helpers.
// Google Identity Services supplies an ID token. Merchant API routes verify the
// same token server-side before returning or mutating private store data.
(function () {
  const ADMIN_EMAIL = "kododiy@gmail.com";
  const SESSION_KEY = "KODO_ADMIN_SESSION";

  function decodeJwt(token) {
    try {
      const payload = String(token || "").split(".")[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(decodeURIComponent(escape(atob(padded))));
    } catch {
      return null;
    }
  }

  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (!session?.idToken || !session?.email) return null;
      const profile = decodeJwt(session.idToken);
      const exp = Number(profile?.exp || 0);
      if (!exp || exp * 1000 <= Date.now()) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      if (String(session.email).toLowerCase() !== ADMIN_EMAIL) return null;
      return session;
    } catch {
      return null;
    }
  }

  function setSession(session) {
    const profile = decodeJwt(session.idToken);
    if (!profile?.exp) throw new Error("Invalid Google credential");
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        email: String(session.email || "").toLowerCase(),
        name: session.name || "",
        picture: session.picture || "",
        provider: "google",
        idToken: session.idToken,
        expiresAt: Number(profile.exp) * 1000,
        signedInAt: new Date().toISOString(),
      })
    );
  }

  function getIdToken() {
    return getSession()?.idToken || "";
  }

  function signOut(redirectTo = "index.html") {
    sessionStorage.removeItem(SESSION_KEY);
    try {
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
    window.location.href = redirectTo;
  }

  function requireAdminAccess() {
    const session = getSession();
    if (session?.email === ADMIN_EMAIL && session?.idToken) return true;

    document.body.innerHTML = `
      <main class="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <section class="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center">
          <img src="assets/kodo-logo.png?v=4" alt="KODO" class="h-10 mx-auto mb-5 object-contain">
          <div class="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-2">Merchant Admin Locked</div>
          <h1 class="font-syne text-2xl font-black uppercase mb-3">Owner Sign In Required</h1>
          <p class="text-sm text-neutral-400 leading-relaxed mb-5">
            Merchant tools require the authorized KODO owner Google account.
          </p>
          <div id="google-admin-signin" class="flex justify-center mb-4"></div>
          <p id="google-admin-status" class="text-[11px] text-amber-300 leading-relaxed mb-4">
            Loading secure Google sign in...
          </p>
          <a href="index.html" class="inline-flex items-center justify-center px-4 py-3 bg-white text-neutral-950 rounded-xl text-xs font-black uppercase">
            Back to Store
          </a>
        </section>
      </main>
    `;

    const clientId = window.KODO_GOOGLE_CLIENT_ID || "";
    const status = document.getElementById("google-admin-status");

    const renderGoogleButton = () => {
      if (!clientId || !window.google?.accounts?.id) return false;

      if (status) status.textContent = "Sign in with the authorized KODO owner account.";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const profile = decodeJwt(response.credential);
          const email = String(profile?.email || "").toLowerCase();
          if (email !== ADMIN_EMAIL || profile?.email_verified === false) {
            alert("This Google account is not authorized for KODO Merchant Admin.");
            return;
          }

          try {
            setSession({
              email,
              name: profile.name,
              picture: profile.picture,
              idToken: response.credential,
            });
            window.location.reload();
          } catch {
            alert("Could not establish a secure admin session. Please sign in again.");
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-admin-signin"),
        {
          theme: "filled_black",
          size: "large",
          type: "standard",
          text: "signin_with",
        }
      );
      return true;
    };

    if (!clientId) {
      if (status) status.textContent = "Google Admin Sign-In is not configured.";
      return false;
    }

    if (!renderGoogleButton()) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (renderGoogleButton() || attempts > 30) {
          window.clearInterval(timer);
          if (attempts > 30 && status) status.textContent = "Google Sign-In could not be loaded. Refresh and try again.";
        }
      }, 300);
    }

    return false;
  }

  window.KODO_AUTH = {
    ADMIN_EMAIL,
    decodeJwt,
    getSession,
    setSession,
    getIdToken,
    signOut,
    requireAdminAccess,
  };
})();
