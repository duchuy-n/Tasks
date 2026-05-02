(function () {
  function create({ config, firebaseAdapter }) {
    const dataSource = config.DATA_SOURCE || "rest";
    const useFirebase = dataSource === "firebase";
    const apiBase = `${(config.API_BASE_URL || "").replace(/\/$/, "")}/api`;

    async function request(path, options = {}) {
      if (useFirebase) {
        if (!firebaseAdapter || !firebaseAdapter.isEnabled()) {
          const error = new Error("Firebase adapter failed to load.");
          error.status = 500;
          throw error;
        }
        return firebaseAdapter.api(path, options);
      }

      const headers = {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      };

      const token = options.tokenOverride || options.token || "";
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      let response;
      try {
        response = await fetch(`${apiBase}${path}`, {
          method: options.method || "GET",
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
      } catch {
        const error = new Error("Cannot reach the server.");
        error.status = 0;
        throw error;
      }

      let payload = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        payload = await response.json();
      }

      if (!response.ok) {
        const error = new Error(payload.error || `Request failed (${response.status}).`);
        error.status = response.status;
        throw error;
      }
      return payload;
    }

    return {
      dataSource,
      useFirebase,
      request,
    };
  }

  window.PlanboardApiClient = { create };
})();
