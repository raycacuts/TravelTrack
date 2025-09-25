// src/contexts/CitiesContext.jsx
import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_API; // e.g. http://localhost:8000/api
const CitiesContext = createContext();

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: "" };

    case "cities/loaded":
      return { ...state, isLoading: false, cities: action.payload };

    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };

    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };

    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };

    case "rejected":
      return { ...state, isLoading: false, error: action.payload };

    default:
      throw new Error("Unknown action type");
  }
}

const GUEST_KEY = "guest_cities";
const isGuestUser = (user) => user?.id === "guest";

/* Optional demo seed for guests */
const DEMO_CITIES = [
  {
    id: "demo-van",
    cityName: "Vancouver",
    country: "Canada",
    emoji: "🇨🇦",
    date: new Date().toISOString(),
    notes: "Welcome to Guest Mode! This is sample data.",
    position: { lat: 49.2827, lng: -123.1207 },
  },
];

function loadGuestCities() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : DEMO_CITIES;
  } catch (e) {
    // Fallback safely if localStorage is blocked
    console.debug("Failed to read guest cities from localStorage:", e);
    return DEMO_CITIES;
  }
}

function saveGuestCities(cities) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(cities));
  } catch (e) {
    // Ignore write errors (private mode, quota, etc.)
    console.debug("Failed to write guest cities to localStorage:", e);
  }
}

function normalize(doc) {
  return doc && doc._id ? { ...doc, id: doc._id } : doc;
}

export function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );
  const { user, token, isAuthenticated } = useAuth();
  const guest = isGuestUser(user);

  const fetchWithAuth = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API}${path}`, { ...options, headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      try {
        return await res.json();
      } catch {
        return {};
      }
    },
    [token]
  );

  // Load cities (guest vs authed)
  useEffect(() => {
    dispatch({ type: "loading" });

    if (guest) {
      const data = loadGuestCities();
      dispatch({ type: "cities/loaded", payload: data });
      return;
    }

    if (!isAuthenticated || !token) {
      
      dispatch({ type: "cities/loaded", payload: [] });
      return;
    }

    (async () => {
      try {
        const data = await fetchWithAuth(`/cities`);
        dispatch({


          type: "cities/loaded",
          payload: Array.isArray(data) ? data.map(normalize) : [],
        });
      } catch {

        dispatch({

          type: "rejected",
          payload: "There was an error loading cities...",
        });
      }
    })();
  }, [guest, isAuthenticated, token, fetchWithAuth]);

  const getCity = useCallback(

    async function getCity(id) {
      if (!id) return;

      if (String(id) === String(currentCity.id)) return;

      dispatch({ type: "loading" });

      try {
        if (guest) {

          const found = (cities || []).find((c) => String(c.id) === String(id));
          
          if (!found) throw new Error("Not found");
          dispatch({ type: "city/loaded", payload: found });
          return;
        }

        const data = await fetchWithAuth(`/cities/${id}`);

        dispatch({ type: "city/loaded", payload: normalize(data) });
      }
      
      catch {
        dispatch({
          type: "rejected",
          payload: "There was an error loading the city...",
        });
      }
    },
    [guest, cities, currentCity.id, fetchWithAuth]
  );

  const createCity = useCallback(

    async function createCity(newCity) {
      dispatch({ type: "loading" });

      try {
        if (guest) {
          const created = {

            ...newCity,
            id: `guest-${Date.now()}`,

          };
          const updated = [...cities, created];
          saveGuestCities(updated);

          dispatch({ type: "city/created", payload: created });
          return;
        }

        const created = await fetchWithAuth(`/cities`, {
          method: "POST",
          body: JSON.stringify(newCity),

        });
        dispatch({ type: "city/created", payload: normalize(created) });
      } catch {
        dispatch({
          type: "rejected",

          payload: "There was an error creating the city...",
        });
      }
    },
    [guest, cities, fetchWithAuth]
  );

  const deleteCity = useCallback(
    async function deleteCity(id) {
      dispatch({ type: "loading" });

      try {
        if (guest) {

          const updated = cities.filter((c) => c.id !== id);
          saveGuestCities(updated);

          dispatch({ type: "city/deleted", payload: id });
          return;
        }

        await fetchWithAuth(`/cities/${id}`, { method: "DELETE" });
        dispatch({ type: "city/deleted", payload: id });


      } catch {
        dispatch({
          type: "rejected",
          payload: "There was an error deleting the city...",
        });
      }
    },
    [guest, cities, fetchWithAuth]
  );

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCities() {

  const ctx = useContext(CitiesContext);
  if (ctx === undefined)
    throw new Error("CitiesContext was used outside the CitiesProvider");
  return ctx;
}
