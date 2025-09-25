import styles from "./PlanItem.module.css";
import { Link } from "react-router-dom";
import { usePlans } from "../contexts/PlansContext";

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

function PlanItem({ plan }) {
  
  const { currentPlan, deletePlan } = usePlans();
  const { cityName, date, id, position } = plan || {};

  const isActive = String(id) === String(currentPlan?.id);

  const hasPos =
    position &&
    typeof position.lat === "number" &&
    typeof position.lng === "number";
  const href = hasPos
    ? `/app/plans/${id}?lat=${position.lat}&lng=${position.lng}`
    : `/app/plans/${id}`;

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    deletePlan(id);
  }

  return (
    <li>
      <Link

        className={`${styles.planItem} ${isActive ? styles["planItem--active"] : ""}`}
        to={href}
        title={cityName}
      >

        <h3 className={styles.name}>{cityName}</h3>

        <time className={styles.date}>{formatDate(date)}</time>

        <button

          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label={`Delete plan for ${cityName}`}
        >
          &times;
        </button>
      </Link>
    </li>
  );
}

export default PlanItem;
