import { useState } from "react";
import { logout as apiLogout } from "../lib/api";

const useLogout = () => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const logoutMutation = async () => {
    setIsPending(true);
    setError(null);
    try {
      await apiLogout();
      localStorage.removeItem("authUser");
      // Notify app to re-fetch auth and reroute
      window.dispatchEvent(new Event("auth-changed"));
      return true;
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { logoutMutation, isPending, error };
};
export default useLogout;
