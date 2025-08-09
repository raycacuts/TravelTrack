import { useMemo, useState } from "react";
import styles from "./CountryList.module.css";
import Spinner from "./Spinner";
import CountryItem from "./CountryItem";
import Message from "./Message";
import SortBar from "./SortBar";
import { useCities } from "../contexts/CitiesContext";

/**
 * Build countries with a representative date so we can sort by time.
 * We'll use the latest visit date for each country.
 */
function aggregateCountries(cities) {
  const map = new Map(); // country -> { country, emoji, latestDate }
  for (const c of cities || []) {
    const key = c.country;
    const prev = map.get(key);
    const d = new Date(c.date).getTime() || 0;
    if (!prev) {
      map.set(key, { country: c.country, emoji: c.emoji, latestDate: d });
    } else {
      if (d > prev.latestDate) prev.latestDate = d;
    }
  }
  return Array.from(map.values());
}

function CountryList() {
  const { cities, isLoading } = useCities();
  const [sortKey, setSortKey] = useState("name"); // 'name' | 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'

  const countries = useMemo(() => aggregateCountries(cities), [cities]);

  const sorted = useMemo(() => {
    const arr = [...countries];
    arr.sort((a, b) => {
      if (sortKey === "name") {
        const av = (a.country || "").toLowerCase();
        const bv = (b.country || "").toLowerCase();
        if (av < bv) return sortOrder === "asc" ? -1 : 1;
        if (av > bv) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else {
        // by latest visit date
        const av = a.latestDate || 0;
        const bv = b.latestDate || 0;
        return sortOrder === "asc" ? av - bv : bv - av;
      }
    });
    return arr;
  }, [countries, sortKey, sortOrder]);

  function handleSortChange(patch) {
    if (patch.sortKey) setSortKey(patch.sortKey);
    if (patch.sortOrder) setSortOrder(patch.sortOrder);
  }

  if (isLoading) return <Spinner />;
  if (!cities?.length) return <Message message="Add your first city by clicking a city on the map" />;

  return (
    <div className={styles.wrapper}>
      <ul className={styles.countryList}>
        {sorted.map((country) => (
          <CountryItem country={country} key={country.country} />
        ))}
      </ul>

      {/* Sort controls at the bottom */}
      <SortBar sortKey={sortKey} sortOrder={sortOrder} onChange={handleSortChange} showDate />
    </div>
  );
}

export default CountryList;
