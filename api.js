window.GPSP_API = (() => {
  const cfg = window.GPSP_CONFIG || {};
  let idToken = null;

  function setIdToken(token) {
    idToken = token || null;
  }

  function getIdToken() {
    return idToken;
  }

  async function request(action, params = {}) {
    if (!cfg.API_URL) {
      throw new Error("API_URL_NOT_CONFIGURED");
    }

    if (!idToken) {
      throw new Error("AUTH_REQUIRED");
    }

    const payload = {
      action,
      idToken,
      ...params
    };

    const response = await fetch(cfg.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("HTTP_" + response.status);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "API_ERROR");
    }

    return result.data;
  }

  return {
    setIdToken,
    getIdToken,

    me: () =>
      request("me"),

    dashboard: () =>
      request("dashboard"),

    studentWorkspace: (studentId) =>
      request("studentWorkspace", { studentId }),

    saveSupervisorNote: (studentId, note, part = "General") =>
      request("saveSupervisorNote", {
        studentId,
        note,
        part
      }),

    saveReview: (payload) =>
      request("saveReview", payload),

    saveMilestone: (payload) =>
      request("saveMilestone", payload)
  };
})();
