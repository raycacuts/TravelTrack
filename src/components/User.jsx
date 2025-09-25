// src/components/User.jsx
import styles from "./User.module.css";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function User() {
  
  const { user, isAuthenticated, loading, logout } = useAuth();



  const navigate = useNavigate();

  if (loading || !isAuthenticated) return null;

  const name = user?.name || "Traveler";

  const avatar =
    user?.avatar ||
    `https://i.pravatar.cc/100?u=${user?.id || user?._id || name}`;

  function handleClickLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (

    <div className={styles.user}>
      <img

        src={avatar}
        alt={name}
        style={{ borderRadius: "50%" }}
      />
      <span>Welcome, {name}</span>
      <button onClick={handleClickLogout}>Logout</button>
    </div>
  );
}
