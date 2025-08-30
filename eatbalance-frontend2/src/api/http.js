// src/api/http.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  // si decides usar cookies en el backend, activa esto:
  // withCredentials: true,
});

// helper opcional: adjuntar Authorization si tienes token en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
