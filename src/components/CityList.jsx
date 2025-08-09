import { useMemo, useState } from "react";
import styles from "./CityList.module.css";
import Spinner from "./Spinner";
import CityItem from "./CityItem";
import Message from "./Message";
import SortBar from "./SortBar";
import { useCities } from "../contexts/CitiesContext";

function CityList() {
  const { cities, isLoading } = useCities();

  const [sortKey, setSortKey] = useState("date"); 
    const [sortOrder, setSortOrder] = useState("desc"); 

  const sorted = useMemo(() => {
    if (!Array.isArray(cities)) return [];
    const arr = [...cities];
    arr.sort((a, b) => {
      let av, bv;
      if (sortKey === "name") {
        av = (a.cityName || "").toLowerCase();
        bv = (b.cityName || "").toLowerCase();
        if (av < bv) return sortOrder === "asc" ? -1 : 1;
        if (av > bv) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else {
        // date
        av = new Date(a.date).getTime() || 0;
        bv = new Date(b.date).getTime() || 0;
        return sortOrder === "asc" ? av - bv : bv - av;
      }
    });
    return arr;
  }, [cities, sortKey, sortOrder]);

  function handleSortChange(patch) {
    if (patch.sortKey) setSortKey(patch.sortKey);
    if (patch.sortOrder) setSortOrder(patch.sortOrder);
  }

  if (isLoading) return <Spinner />;
  if (!cities?.length) return <Message message="Add your first city by clicking a city on the map" />;

  return (
    <div className={styles.wrapper}>
      <ul className={styles.cityList}>
        {sorted.map((city) => (
          <CityItem city={city} key={city.id} />
        ))}
      </ul>


      <SortBar sortKey={sortKey} sortOrder={sortOrder} onChange={handleSortChange} showDate />
    </div>
  );
}

export default CityList;
