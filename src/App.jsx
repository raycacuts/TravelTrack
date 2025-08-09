import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import AppLayout from "./pages/AppLayout";
import Login from "./pages/Login";

import CityList from "./components/CityList";
import CountryList from "./components/CountryList";
import City from "./components/City";
import Form from "./components/Form";
import PlanList from "./components/PlanList";      
import Plan from "./components/Plan";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CitiesProvider } from "./contexts/CitiesContext";
import { PlansProvider } from "./contexts/PlansContext"; 
import ProtectedRoute from "./pages/ProtectedRoute";

function HomeGate() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" replace /> : <Homepage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlansProvider>         
          <CitiesProvider>
            <Routes>
              <Route index element={<HomeGate />} />         
              <Route path="login" element={<Login />} />
              <Route
                path="app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate replace to="cities" />} />
                <Route path="cities" element={<CityList />} />
                <Route path="cities/:id" element={<City />} />
                <Route path="countries" element={<CountryList />} />
                <Route path="plans" element={<PlanList />} />   
                <Route path="plans/:id" element={<Plan />} /> 
                <Route path="form" element={<Form />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </CitiesProvider>
        </PlansProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
