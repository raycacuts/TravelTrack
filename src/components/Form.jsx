// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Button from "./Button";
import BackButton from "./BackButton";

import styles from "./Form.module.css";
import { useUrlPosition } from "../hooks/useUrlPosition";
import Message from "./Message";
import Spinner from "./Spinner";
import { useCities } from "../contexts/CitiesContext";
import { usePlans } from "../contexts/PlansContext";
import { useNavigate } from "react-router-dom";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const { createPlan } = usePlans();
  const navigate = useNavigate();

  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geocodingError, setGeocodingError] = useState("");
  const [type, setType] = useState("visited"); // 'visited' | 'plan'

  useEffect(
    function () {
      if (!lat && !lng) return;

      async function fetchCityData() {
        try {
          setIsLoadingGeocoding(true);
          setGeocodingError("");

          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();

          if (!data.countryCode)
            throw new Error(
              "That doesn't seem to be a city. Click somewhere else 😉"
            );

          setCityName(data.city || data.locality || "");
          setCountry(data.countryName || "");
          setEmoji(convertToEmoji(data.countryCode));
        } catch (err) {
          setGeocodingError(err.message);
        } finally {
          setIsLoadingGeocoding(false);
        }
      }
      fetchCityData();
    },
    [lat, lng]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;

    const payload = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    if (type === "plan") {
      await createPlan(payload);
      navigate("/app/plans");
    } else {
      await createCity(payload);
      navigate("/app/cities");
    }
  }

  if (isLoadingGeocoding) return <Spinner />;

  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;

  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      {/* Type selector */}
      <div className={styles.row}>
        <label>Type</label>
        <div className={styles.inline}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="type"
              value="visited"
              checked={type === "visited"}
              onChange={() => setType("visited")}
            />
            Visited
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="type"
              value="plan"
              checked={type === "plan"}
              onChange={() => setType("plan")}
            />
            Plan
          </label>
        </div>
      </div>

      <div className={styles.row}>
        <label htmlFor="cityName">{type === "plan" ? "City to plan" : "City name"}</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">
          {type === "plan" ? `When do you plan to go?` : `When did you go to ${cityName || "this city"}?`}
        </label>

        <DatePicker
          id="date"
          onChange={(d) => setDate(d)}
          selected={date}
          dateFormat="dd/MM/yyyy"
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">{type === "plan" ? "Notes for your plan" : "Notes about your trip"}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">{type === "plan" ? "Save Plan" : "Add"}</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
