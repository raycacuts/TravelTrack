import { createContext, useContext, useEffect, useReducer } from "react";

const AuthContext = createContext();
const API = import.meta.env.VITE_API; // e.g. http://localhost:8000/api

const initial = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      const { user, token } = action.payload || {};
      return {
        ...state,
        loading: false,
        isAuthenticated: !!token || (user?.id === "guest"),
        user: user || null,
        token: token || null,
      };
    }
    case "start":
      return { ...state, loading: true, error: null };
    case "login":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.user,
        token: action.token ?? null,
      };
    case "register":
      return { ...state, loading: false };
    case "updateUser":
      return { ...state, user: action.user };
    case "error":
      return { ...state, loading: false, error: action.error };
    case "logout":
      return { ...initial, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // hydrate once after mount
  useEffect(() => {
    const t = localStorage.getItem("ww_token");
    const u = localStorage.getItem("ww_user");
    dispatch({
      type: "hydrate",
      payload: { token: t || null, user: u ? JSON.parse(u) : null },
    });
  }, []);

  async function login(email, password) {
    try {
      dispatch({ type: "start" });
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("ww_token", data.token);
      localStorage.setItem("ww_user", JSON.stringify(data.user));
      dispatch({ type: "login", user: data.user, token: data.token });
    } catch (e) {
      dispatch({ type: "error", error: "Login failed" });
      throw e;
    }
  }

  async function register(name, email, password) {
    try {
      dispatch({ type: "start" });
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      dispatch({ type: "register" });
    } catch (e) {
      dispatch({ type: "error", error: "Register failed" });
      throw e;
    }
  }

  function logout() {
    localStorage.removeItem("ww_token");
    localStorage.removeItem("ww_user");
    dispatch({ type: "logout" });
  }

  // ⭐ Guest mode (no backend, no token)
  function loginGuest() {
    const guestUser = {
      id: "guest",
      name: "Guest",
      email: "guest@example.com",
      avatar: "https://i.pravatar.cc/100?u=guest",
    };
    // optional: persist guest between refreshes
    localStorage.setItem("ww_user", JSON.stringify(guestUser));
    localStorage.removeItem("ww_token"); // ensure no stale token
    dispatch({ type: "login", user: guestUser, token: null });
  }

  // Optional: allow avatar/name updates without reload
  function updateUser(user) {
    localStorage.setItem("ww_user", JSON.stringify(user));
    dispatch({ type: "updateUser", user });
  }

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, loginGuest, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
