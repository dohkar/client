let _sessionId: string | null = null;

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  if (_sessionId) return _sessionId;

  let id = localStorage.getItem("dohkar_session_id");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("dohkar_session_id", id);
  }

  _sessionId = id;
  return id;
}
