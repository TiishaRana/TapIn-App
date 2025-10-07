import { useEffect, useState } from "react";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer backend auth
        const me = await getAuthUser();
        setAuthUser(me ? { ...me, id: me._id } : null);
        if (me) localStorage.setItem("authUser", JSON.stringify({ ...me, id: me._id }));
        else localStorage.removeItem("authUser");
      } catch {
        // Fallback to localStorage if backend not available
        try {
          const stored = localStorage.getItem("authUser");
          setAuthUser(stored ? JSON.parse(stored) : null);
        } catch {
          setAuthUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // Update when storage changes (e.g., in another tab)
    const onStorage = (e) => {
      if (e.key === "authUser") load();
    };
    // Update when our app explicitly changes auth (same-tab)
    const onAuthChanged = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  return { isLoading, authUser };
};
export default useAuthUser;
