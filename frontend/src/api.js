const API_URL = "http://localhost:5000";


async function request(url, options = {}) {

  const token =
    localStorage.getItem("blockverify_token");

  const response = await fetch(
    `${API_URL}${url}`,
    {
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`
            }
          : {})
      },

      ...options
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Request failed"
    );

  }


  return data;
}


export const api = {


  /* =========================
     HEALTH
  ========================= */

  health: () =>
    request("/api/health"),


  /* =========================
     STATS
  ========================= */

  stats: () =>
    request("/api/stats"),


  /* =========================
     PRODUCTS
  ========================= */

  products: () =>
    request("/api/products"),


  verify: (id) =>
    request(
      `/api/products/verify/${encodeURIComponent(id)}`
    ),


  register: (payload) =>
    request(
      "/api/products/register",
      {
        method: "POST",

        body:
          JSON.stringify(payload)
      }
    ),


  /* =========================
     AUTH
  ========================= */

  registerUser: (payload) =>
    request(
      "/api/auth/register",
      {
        method: "POST",

        body:
          JSON.stringify(payload)
      }
    ),


  login: (payload) =>
    request(
      "/api/auth/login",
      {
        method: "POST",

        body:
          JSON.stringify(payload)
      }
    ),


  me: () =>
    request("/api/auth/me"),


  logout: () =>
    request(
      "/api/auth/logout",
      {
        method: "POST"
      }
    )

};