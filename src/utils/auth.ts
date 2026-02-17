/**
 * Authentication utilities
 */

/**
 * Get the current auth token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

/**
 * Create authenticated headers for fetch requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Wrapper for fetch that automatically includes authentication headers
 * Use this instead of direct fetch() calls to authenticated endpoints
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  // If we have a token, add it to the headers
  if (token) {
    const headers = new Headers(options.headers);
    headers.append("Authorization", `Bearer ${token}`);
    options.headers = headers;
  }

  return fetch(url, options);
}

/**
 * Wrapper for authenticated fetch with FormData
 * Use this for file uploads to automatically include auth headers
 */
export async function authFetchUpload(
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  // Don't set Content-Type for FormData - let browser set it with boundary

  return fetch(url, {
    ...options,
    method: options.method || "POST",
    headers,
    body: formData,
  });
}
