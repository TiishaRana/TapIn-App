import { useState } from "react";
import { login as apiLogin } from "../lib/api";

const useLogin = () => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const loginMutation = async (credentials) => {
    setIsPending(true);
    setError(null);
    try {
      const user = await apiLogin(credentials);
      // Persist for components still relying on localStorage
      localStorage.setItem("authUser", JSON.stringify({ ...user, id: user._id }));
      // Notify app to re-fetch auth and rerender routes
      window.dispatchEvent(new Event("auth-changed"));
      return user;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { error, isPending, loginMutation };
};

export default useLogin;
