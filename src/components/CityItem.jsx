import styles from "./CityItem.module.css";
import { Link } from "react-router-dom";
import { useCities } from "../contexts/CitiesContext";

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

function CityItem({ city }) {
  const { currentCity, deleteCity } = useCities();
  const { cityName, emoji, date, id, position } = city || {};

  const isActive = String(id) === String(currentCity?.id);

  // Build link with lat/lng only if available
  const hasPos = position && typeof position.lat === "number" && typeof position.lng === "number";
  const href = hasPos
    ? `/app/cities/${id}?lat=${position.lat}&lng=${position.lng}`
    : `/app/cities/${id}`;

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    deleteCity(id);
  }

  return (
    <li>
      <Link
        className={`${styles.cityItem} ${isActive ? styles["cityItem--active"] : ""}`}
        to={href}
        title={cityName}
      >
        {emoji ? <span className={styles.emoji} aria-hidden="true">{emoji}</span> : null}
        <h3 className={styles.name}>{cityName}</h3>
        <time className={styles.date}>{formatDate(date)}</time>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label={`Delete ${cityName}`}
        >
          &times;
        </button>
      </Link>
    </li>
  );
}

export default CityItem;
