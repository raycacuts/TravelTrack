import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Button from "./Button";
import BackButton from "./BackButton";
import styles from "./Form.module.css";

import { useUrlPosition } from "../hooks/useUrlPosition";
import { useNavigate } from "react-router-dom";
import Message from "./Message";
import Spinner from "./Spinner";
import { usePlans } from "../contexts/PlansContext";

import { convertToEmoji } from "./Form"; // reuse your helper

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export default function PlanForm() {
  const [lat, lng] = useUrlPosition();
  const { createPlan } = usePlans();
  const navigate = useNavigate();

  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());


  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geocodingError, setGeocodingError] = useState("");

  useEffect(() => {

    if (!lat && !lng) return;


    (async () => {
      try {
        setIsLoadingGeocoding(true);
        setGeocodingError("");
        const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`);
        const data = await res.json();

        setCityName(data.city || data.locality || "");
        setCountry(data.countryName || "");

        setEmoji(data.countryCode ? convertToEmoji(data.countryCode) : "");
      } catch (err) {
        setGeocodingError(err.message);
      } finally {
        setIsLoadingGeocoding(false);
      }
    })();
  }, [lat, lng]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;
    const newPlan = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    await createPlan(newPlan);
    navigate("/app/plans");
  }

  if (isLoadingGeocoding) return <Spinner />;


  if (!lat && !lng) return <Message message="Start by clicking somewhere on the map" />;
  
if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>

        <label htmlFor="cityName">City to plan</label>

        <input id="cityName" value={cityName} onChange={(e) => setCityName(e.target.value)} />
       
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>

        <label htmlFor="date">When do you plan to go?</label>

        <DatePicker id="date" onChange={setDate} selected={date} dateFormat="dd/MM/yyyy" />
      </div>

      <div className={styles.row}>
        
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Save Plan</Button>
        <BackButton />
      </div>
    </form>
  );
}
