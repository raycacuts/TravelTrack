import styles from "./Homepage.module.css";
import { Link } from "react-router-dom";
import PageNav from "../components/PageNav";

export default function Homepage() {
  return (
    <main className={styles.homepage}>
        <PageNav/>
      <section>
        <h1>
          You travel the world.
          <br />
          TravelTrack keeps track of your adventures.
        </h1>
        <h2>
          A world map that records every step of your journey, 
          marking each city you’ve explored. 
          Cherish your unforgettable adventures and share your travels with friends 
          as you showcase the places you’ve roamed across the globe.
        </h2>
        <Link to='/login' className='cta'>Start tracking now</Link>
      </section>
    </main>
  );
}
