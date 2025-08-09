import { useMemo, useState } from "react";
import styles from "./PlanList.module.css";
import Spinner from "./Spinner";
import Message from "./Message";
import SortBar from "./SortBar";
import PlanItem from "./PlanItem";
import { usePlans } from "../contexts/PlansContext";

function PlanList() {
  const { plans, isLoading } = usePlans();
  const [sortKey, setSortKey] = useState("date");   // 'name' | 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'

  const sorted = useMemo(() => {
    const arr = Array.isArray(plans) ? [...plans] : [];
    arr.sort((a, b) => {
      if (sortKey === "name") {
        const av = (a.cityName || "").toLowerCase();
        const bv = (b.cityName || "").toLowerCase();
        if (av < bv) return sortOrder === "asc" ? -1 : 1;
        if (av > bv) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else {
        const av = new Date(a.date).getTime() || 0;
        const bv = new Date(b.date).getTime() || 0;
        return sortOrder === "asc" ? av - bv : bv - av;
      }
    });
    return arr;
  }, [plans, sortKey, sortOrder]);

  function handleSortChange(p) {
    if (p.sortKey) setSortKey(p.sortKey);
    if (p.sortOrder) setSortOrder(p.sortOrder);
  }

  if (isLoading) return <Spinner />;
  if (!plans?.length) return <Message message="No plans yet — click on the map and choose Plan to add one!" />;

  return (
    <div className={styles.wrapper}>
      <ul className={styles.planList}>
        {sorted.map((plan) => <PlanItem plan={plan} key={plan.id} />)}
      </ul>
      <SortBar sortKey={sortKey} sortOrder={sortOrder} onChange={handleSortChange} showDate />
    </div>
  );
}

export default PlanList;
