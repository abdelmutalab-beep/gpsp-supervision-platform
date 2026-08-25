window.GPSP_AUTH = (() => {
  const cfg = window.GPSP_CONFIG || {};
  let profile = null;

  function init(buttonId, onReady) {
    if (!cfg.GOOGLE_CLIENT_ID) {
      console.warn("GOOGLE_CLIENT_ID_NOT_CONFIGURED");
      return;
    }

    google.accounts.id.initialize({
      client_id: cfg.GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          GPSP_API.setIdToken(response.credential);

          profile = await GPSP_API.me();

          if (typeof onReady === "function") {
            onReady(profile);
          }
        } catch (err) {
          console.error(err);
          alert("تعذر تسجيل الدخول: " + err.message);
        }
      }
    });

    google.accounts.id.renderButton(
      document.getElementById(buttonId),
      {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill"
      }
    );
  }

  function getProfile() {
    return profile;
  }

  function signOut() {
    profile = null;
    GPSP_API.setIdToken(null);
    google.accounts.id.disableAutoSelect();
    location.reload();
  }

  return {
    init,
    getProfile,
    signOut
  };
})();
