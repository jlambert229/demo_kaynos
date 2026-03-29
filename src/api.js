const BASE = "/api";

const DEFAULT_TIMEOUT_MS = 30000;

async function request(path, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  // Vitest's fetch (undici) rejects AbortSignal.timeout() as wrong realm; skip in test.
  const signal =
    !import.meta.env.TEST && timeout ? AbortSignal.timeout(timeout) : undefined;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...fetchOptions.headers },
    signal,
    ...fetchOptions,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  auth: {
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
    updateProfile: (body) => request("/auth/profile", { method: "PATCH", body: JSON.stringify(body) }),
    changePassword: (body) => request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  },
  members: {
    list: () => request("/members/"),
    add: (body) => request("/members/", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/members/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id) => request(`/members/${id}`, { method: "DELETE" }),
    resetPassword: (id) => request(`/members/${id}/reset-password`, { method: "POST" }),
  },
  sessions: {
    list: (studentId) => request(`/sessions/${studentId ? `?studentId=${studentId}` : ""}`),
    get: (id) => request(`/sessions/${id}`),
    create: (body) => request("/sessions/", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id) => request(`/sessions/${id}`, { method: "DELETE" }),
    trackView: (body) => request("/sessions/view", { method: "POST", body: JSON.stringify(body) }),
  },
  classes: {
    list: () => request("/classes/"),
    get: (id) => request(`/classes/${id}`),
    create: (body) => request("/classes/", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id) => request(`/classes/${id}`, { method: "DELETE" }),
    trackView: (body) => request("/classes/view", { method: "POST", body: JSON.stringify(body) }),
  },
  notes: {
    addToSession: (sessionId, body) =>
      request(`/notes/session/${sessionId}`, { method: "POST", body: JSON.stringify(body) }),
    addToClass: (classId, body) =>
      request(`/notes/class/${classId}`, { method: "POST", body: JSON.stringify(body) }),
    update: (noteId, body) =>
      request(`/notes/${noteId}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (noteId) =>
      request(`/notes/${noteId}`, { method: "DELETE" }),
  },
  video: {
    getUploadUrl: (body) => request("/video/upload-url", { method: "POST", body: JSON.stringify(body) }),
    completeMultipart: (body) => request("/video/complete-multipart", { method: "POST", body: JSON.stringify(body) }),
    abortMultipart: (body) => request("/video/abort-multipart", { method: "POST", body: JSON.stringify(body) }),
    confirmUpload: (body) => request("/video/confirm-upload", { method: "POST", body: JSON.stringify(body) }),
    getPlaybackUrl: (type, id) => request(`/video/playback-url?type=${type}&id=${id}`),
    usage: () => request("/video/usage"),
  },
  school: {
    get: () => request("/school"),
    update: (body) => request("/school", { method: "PATCH", body: JSON.stringify(body) }),
    stats: () => request("/school/stats"),
    activity: (days = 7) => request(`/school/activity?days=${days}`),
    tags: () => request("/school/tags"),
  },
  signup: {
    createSchool: (body) => request("/signup", { method: "POST", body: JSON.stringify(body) }),
  },
  support: {
    submit: (body) => request("/support", { method: "POST", body: JSON.stringify(body) }),
  },
  tenant: {
    login: (body) => request("/tenant/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request("/tenant/me"),
    schools: () => request("/tenant/schools"),
    getSchool: (id) => request(`/tenant/schools/${id}`),
    createSchool: (body) => request("/tenant/schools", { method: "POST", body: JSON.stringify(body) }),
    updateSchool: (id, body) => request(`/tenant/schools/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteSchool: (id) => request(`/tenant/schools/${id}`, { method: "DELETE" }),
    stats: () => request("/tenant/stats"),
  },
};
