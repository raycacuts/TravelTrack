import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Login.module.css";

export default function Login() {


  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [name, setName] = useState("");

  const [email, setEmail] = useState("rui@example.com");
  const [password, setPassword] = useState("secret123");


  const { login, register, loginGuest, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/app" replace />;


  async function handleSubmit(e) {
    e.preventDefault();
    try {

      if (mode === "register") {
        await register(name, email, password);

        await login(email, password);

      } else {
        await login(email, password);
      }
      navigate("/app", { replace: true });
    } catch {
      /* handled via error */
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>


        <p className={styles.subtitle}>
          {mode === "login"
            ? "Sign in to continue your journey"
            : "Join and start tracking your travels"}
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {mode === "register" && (
            <div className={styles.row}>
              <label className={styles.label} htmlFor="name">Name</label>
              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}


          <div className={styles.row}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>


          <div className={styles.row}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}

              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />

          </div>

          {error && <div className={styles.error}>{String(error)}</div>}

          <div className={styles.actions}>
            <button className={styles.primary} disabled={loading} type="submit">
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            </button>

            <button
              type="button"

              className={styles.ghost}
              onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
              disabled={loading}
            >

              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>

            {/* Guest Mode */}
            <button
              type="button"
              className={styles.ghost}
              onClick={() => {

                loginGuest();
                navigate("/app", { replace: true });
              }}
              
              disabled={loading}
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
