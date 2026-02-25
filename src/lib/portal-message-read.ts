function normalizeEmail(value: string | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function buildKey(hubId: string, email?: string): string {
  const normalized = normalizeEmail(email) || "anonymous";
  return `portal_message_last_read:${hubId}:${normalized}`;
}

export function getPortalMessageLastRead(hubId: string, email?: string): string | null {
  try {
    return localStorage.getItem(buildKey(hubId, email));
  } catch {
    return null;
  }
}

export function setPortalMessageLastRead(hubId: string, email: string | undefined, iso: string): void {
  try {
    localStorage.setItem(buildKey(hubId, email), iso);
  } catch {
    // Ignore storage write errors (private mode/quota); UI still works.
  }
}

