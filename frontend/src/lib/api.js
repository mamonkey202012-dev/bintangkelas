import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });

export const getQuiz = () => api.get("/quiz").then((r) => r.data);
export const submitAnswers = (payload) => api.post("/submissions", payload).then((r) => r.data);
export const listSubmissions = () => api.get("/submissions").then((r) => r.data);
export const getMisconceptions = () => api.get("/analytics/misconceptions").then((r) => r.data);
export const getDefaultSlides = () => api.get("/slides/default").then((r) => r.data);
export const getLatestSlides = () => api.get("/slides/latest").then((r) => r.data);
export const generateSlides = () => api.post("/slides/generate").then((r) => r.data);
export const seedDemo = () => api.post("/seed").then((r) => r.data);
