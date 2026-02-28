import axios, { type InternalAxiosRequestConfig } from "axios";
import { auth } from "./firebase";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await auth.currentUser.getIdToken(true);

        await axios.post(
          `${api.defaults.baseURL}/auth/session`,
          { idToken: newToken },
          { withCredentials: true },
        );

        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
