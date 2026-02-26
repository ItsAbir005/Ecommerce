const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type FetchOptions = RequestInit & { token?: string };

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
    const { token: overrideToken, ...fetchOptions } = options;
    const token = overrideToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "An error occurred");
    }

    return data;
}
