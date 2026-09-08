import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000, withCredentials: true });

export const getQuiz = () => api.get("/quiz").then((r) => r.data);
export const getCurrentMaterials = () => api.get("/materials/current").then((r) => r.data);
export const getSampleText = () => api.get("/materials/sample").then((r) => r.data);
export const generateMaterials = (source_text, difficulty = "sedang") =>
  api.post("/materials/generate", { source_text, difficulty }).then((r) => r.data);
export const applyMaterials = (payload) => api.post("/materials/apply", payload).then((r) => r.data);
export const resetMaterials = () => api.post("/materials/reset").then((r) => r.data);
export const listHistory = () => api.get("/materials/history").then((r) => r.data);
export const applyFromHistory = (id) => api.post(`/materials/history/${id}/apply`).then((r) => r.data);
export const deleteHistory = (id) => api.delete(`/materials/history/${id}`).then((r) => r.data);
export const submitAnswers = (payload) => api.post("/submissions", payload).then((r) => r.data);
export const listSubmissions = () => api.get("/submissions").then((r) => r.data);
export const getMisconceptions = () => api.get("/analytics/misconceptions").then((r) => r.data);
export const getDefaultSlides = () => api.get("/slides/default").then((r) => r.data);
export const getLatestSlides = () => api.get("/slides/latest").then((r) => r.data);
export const generateSlides = () => api.post("/slides/generate").then((r) => r.data);
export const seedDemo = () => api.post("/seed").then((r) => r.data);
