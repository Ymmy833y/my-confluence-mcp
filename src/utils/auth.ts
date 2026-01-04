import { ConfluenceAuth } from "@config/confluenceConfig";

export function authHeaders(auth: ConfluenceAuth): Record<string, string> {
  if (auth.kind === "bearer") return { Authorization: `Bearer ${auth.token}` };
  if (auth.kind === "basic") {
    const token = Buffer.from(`${auth.email}:${auth.apiToken}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${token}` };
  }
  return {};
}
