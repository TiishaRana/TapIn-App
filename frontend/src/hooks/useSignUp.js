import { useState } from "react";
import { signup as apiSignup } from "../lib/api";

const useSignUp = () => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const signupMutation = async (credentials) => {
    setIsPending(true);
    setError(null);
    try {
      const user = await apiSignup(credentials);
      // Do NOT auto-login. Simply return created user.
      return user;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Signup failed";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { isPending, error, signupMutation };
};
export default useSignUp;
