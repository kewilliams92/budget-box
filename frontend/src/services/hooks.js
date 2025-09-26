import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useRef } from "react";

export const useAuthenticatedApi = (template = "BudgetBox") => {
  const { getToken, isSignedIn } = useAuth({ template });

  const api = useMemo(() => axios.create(), []);

  // NOTE: Ensure we only add one interceptor to prevent memory leaks
  const interceptorIdRef = useRef(null);
  useEffect(() => {
    if (interceptorIdRef.current != null) return;
    const id = api.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        } catch (error) {
          console.error("Failed to get auth token:", error);
          return config;
        }
      },
      (error) => Promise.reject(error),
    );
    interceptorIdRef.current = id;
    return () => {
      if (interceptorIdRef.current != null) {
        api.interceptors.request.eject(interceptorIdRef.current);
        interceptorIdRef.current = null;
      }
    };
  }, [api, getToken]);

  return { api, isSignedIn };
};
