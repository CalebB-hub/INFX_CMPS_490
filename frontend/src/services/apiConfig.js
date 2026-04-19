const LOCAL_API_BASE = "http://localhost:8000/api";
const DEPLOYED_API_BASE = "https://infx-cmps-490.onrender.com/api";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = (configuredApiBase || (import.meta.env.DEV ? LOCAL_API_BASE : DEPLOYED_API_BASE)).replace(/\/+$/, "");
