import { createContext, useContext, useEffect, useReducer, useCallback } from "react";

const PLANS_KEY = "planned_cities";

function safeRead() {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.debug("PlansContext: failed to read from localStorage", e);
    return [];
  }
}
function safeWrite(data) {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore write errors (private mode, quota, etc.) but keep block non-empty for ESLint
    console.debug("PlansContext: failed to write to localStorage", e);
  }
}

const PlansContext = createContext();

const initialState = {
  plans: [],
  isLoading: false,
  currentPlan: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: "" };
    case "plans/loaded":
      return { ...state, isLoading: false, plans: action.payload };
    case "plan/loaded":
      return { ...state, isLoading: false, currentPlan: action.payload };
    case "plan/created":
      return {
        ...state,
        isLoading: false,
        plans: [...state.plans, action.payload],
        currentPlan: action.payload,
      };
    case "plan/deleted":
      return {
        ...state,
        isLoading: false,
        plans: state.plans.filter((p) => p.id !== action.payload),
        currentPlan: {},
      };
    case "rejected":
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error("Unknown action type");
  }
}

export function PlansProvider({ children }) {
  const [{ plans, isLoading, currentPlan, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(() => {
    dispatch({ type: "loading" });
    const data = safeRead();
    dispatch({ type: "plans/loaded", payload: data });
  }, []);

  const createPlan = useCallback(
    async (newPlan) => {
      dispatch({ type: "loading" });
      try {
        const plan = { ...newPlan, id: `plan-${Date.now()}` };
        const updated = [...plans, plan];
        safeWrite(updated);
        dispatch({ type: "plan/created", payload: plan });
      } catch (e) {
        console.debug("PlansContext: createPlan failed", e);
        dispatch({ type: "rejected", payload: "Error creating plan..." });
      }
    },
    [plans]
  );

  const deletePlan = useCallback(
    async (id) => {
      dispatch({ type: "loading" });
      try {
        const updated = plans.filter((p) => p.id !== id);
        safeWrite(updated);
        dispatch({ type: "plan/deleted", payload: id });
      } catch (e) {
        console.debug("PlansContext: deletePlan failed", e);
        dispatch({ type: "rejected", payload: "Error deleting plan..." });
      }
    },
    [plans]
  );

  const getPlan = useCallback(
    async (id) => {
      if (!id) return;
      if (String(id) === String(currentPlan.id)) return;
      dispatch({ type: "loading" });
      try {
        const found = (plans || []).find((p) => String(p.id) === String(id));
        if (!found) throw new Error("Not found");
        dispatch({ type: "plan/loaded", payload: found });
      } catch (e) {
        console.debug("PlansContext: getPlan failed", e);
        dispatch({ type: "rejected", payload: "Error loading plan..." });
      }
    },
    [plans, currentPlan.id]
  );

  return (
    <PlansContext.Provider
      value={{ plans, isLoading, currentPlan, error, createPlan, deletePlan, getPlan }}
    >
      {children}
    </PlansContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error("PlansContext must be used within PlansProvider");
  return ctx;
}
