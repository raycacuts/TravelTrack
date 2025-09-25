import { useId } from "react";
import styles from "./SortBar.module.css";

export default function SortBar({ sortKey, sortOrder, onChange, showDate = true }) {
  
  const nameId = useId();
  const dateId = useId();

  const ascId = useId();
  const descId = useId();

  return (
    <div className={styles.bar}>
      <div className={styles.group}>

      <span className={styles.label}>Sort by</span>
        <label className={styles.option}>
          <input
            type="radio"
            name="sortKey"
            value="name"
            checked={sortKey === "name"}
            onChange={() => onChange({ sortKey: "name" })}
            aria-labelledby={nameId}
          />
          <span id={nameId}>Name</span>
        </label>

        {showDate && (

          <label className={styles.option}>
            <input
           type="radio"
              name="sortKey"
              value="date"
            checked={sortKey === "date"}
              onChange={() => onChange({ sortKey: "date" })}
              aria-labelledby={dateId}
            />
            <span id={dateId}>Time</span>
          </label>
        )}
      </div>

      <div className={styles.group}>

        <span className={styles.label}>Order</span>
        <label className={styles.option}>
          <input
            type="radio"
              name="sortOrder"
            value="asc"
            checked={sortOrder === "asc"}
            onChange={() => onChange({ sortOrder: "asc" })}
            aria-labelledby={ascId}
          />
          <span id={ascId}>Asc</span>
        </label>




        <label className={styles.option}>
          <input
            type="radio"
            name="sortOrder"
            value="desc"

            checked={sortOrder === "desc"}
            onChange={() => onChange({ sortOrder: "desc" })}
            aria-labelledby={descId}
          />

          <span id={descId}>Desc</span>
        </label>

      </div>
    </div>
  );
}
