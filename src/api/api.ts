import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.100.19:5000", // ← your local server 192.168.100.19
  timeout: 10000,
});

let token: string | null = null;

// Add token setter
function setToken(t: string | null) {
  token = t;
}

// 🛰️ Request interceptor
instance.interceptors.request.use((config) => {
  // safer logging
  console.log(
    "[HTTP] →",
    (config.method || "GET").toUpperCase(),
    `${config.baseURL ?? ""}${config.url ?? ""}`,
    config.data ?? ""
  );

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🛰️ Response interceptor
instance.interceptors.response.use(
  (res) => {
    console.log("[HTTP] ←", res.status, res.config?.url ?? "", res.data);
    return res;
  },
  (err) => {
    console.log("[HTTP ERROR] ❌", err.response?.status, err.message);
    throw err;
  }
);

export default {
  get: instance.get,
  post: instance.post,
  put: instance.put,
  delete: instance.delete,
  setToken,
};
