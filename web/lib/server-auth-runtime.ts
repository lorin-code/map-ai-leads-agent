import { createRequire } from "node:module";

import { cookies } from "next/headers";

const require = createRequire(import.meta.url);
const { getAgentRuntime } = require("../../server/runtime");

export const AUTH_COOKIE_NAME = "aimapleads_auth";

export type CurrentUser = {
  id: string;
  username: string;
  display_name: string | null;
};

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || "";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const runtime = await getAgentRuntime();
  return runtime.auth.getUserByToken(token);
}

export async function loginPasswordUser(username: string, password: string) {
  const runtime = await getAgentRuntime();
  return runtime.auth.loginOrRegisterWithPassword({ username, password });
}

export async function logoutCurrentToken() {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }

  const runtime = await getAgentRuntime();
  return runtime.auth.logout(token);
}
