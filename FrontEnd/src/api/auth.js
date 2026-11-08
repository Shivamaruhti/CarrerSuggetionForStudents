import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

export function registerStudent({ fullName, phone, password }) {
  return api.post("/auth/register", { fullName, phone, password });
}

export function loginStudent({ phone, password }) {
  return api.post("/auth/login", { phone, password });
}

export function getApiErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    if (!error.response || [502, 503, 504].includes(error.response.status)) {
      return "The backend server is not running or reachable. Please start it locally or deploy it, then try again.";
    }

    const responseMessage = error.response.data?.message || error.response.data?.detail;
    if (responseMessage) return responseMessage;

    return `The server returned HTTP ${error.response.status}. ${fallback}`;
  }

  return error?.response?.data?.message || fallback;
}
