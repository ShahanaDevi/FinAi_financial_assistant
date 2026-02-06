export const getApiBaseUrl = (): string => {
  // Prefer Vite env when available; fallback to CRA/Next envs; default to localhost.
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
  const craEnv =
    typeof process !== "undefined" ? process.env.REACT_APP_API_BASE_URL : undefined;
  const nextEnv =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;

  return (viteEnv || craEnv || nextEnv || "http://localhost:8000").replace(/\/$/, "");
};
