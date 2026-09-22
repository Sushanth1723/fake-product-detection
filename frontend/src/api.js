const API_BASE_URL = "https://fake-product-detection-goix.onrender.com";

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  health: () => request("/api/health"),
  stats: () => request("/api/stats"),
  products: () => request("/api/products"),
  verify: (id) => request(`/api/products/verify/${encodeURIComponent(id)}`),
  register: (payload) =>
    request("/api/products/register", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
