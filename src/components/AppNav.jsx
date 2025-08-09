import { NavLink } from "react-router-dom";
import styles from "./AppNav.module.css";
import PlanList from "./PlanList";

function AppNav() {
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <NavLink to="cities">Cities</NavLink>
        </li>
        <li>
          <NavLink to="countries">Countries</NavLink>
        </li>
        <li>
          <NavLink to="plans">Plans</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default AppNav;
