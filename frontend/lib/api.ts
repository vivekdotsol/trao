const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data as T;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ message: string; userId: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; name: string; email: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(body) }
      ),
  },
  trips: {
    list: () => request<import("@/types").Trip[]>("/api/dashboard"),
    get: (id: string) => request<import("@/types").Trip>(`/api/trips/${id}`),
    generate: (body: {
      destination: string;
      days: number;
      budgetType: string;
      interests: string[];
    }) =>
      request<import("@/types").Trip>("/api/trips/generate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<import("@/types").Trip>) =>
      request<import("@/types").Trip>(`/api/trips/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/trips/${id}`, { method: "DELETE" }),
    regenerateDay: (id: string, body: { day: number; instruction: string }) =>
      request<import("@/types").Trip>(`/api/trips/${id}/regenerate-day`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
