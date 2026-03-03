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

    let data: any = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json().catch(() => ({}));
    } else {
        const text = await response.text();
        data = { message: `Unexpected response format: ${response.status} ${response.statusText}`, text };
    }

    if (!response.ok) {
        // Pass specifically 401s to error message to allow AuthContext to log out
        if (response.status === 401) {
            throw new Error("Token expired or unauthorized");
        }
        throw new Error(data.message || "An error occurred");
    }

    return data;
}
