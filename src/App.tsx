import React, { useState, useEffect } from "react";
import AdminPanel from "./AdminPanel";
import JobbVareUttak from "./JobbVareUttak";
import Login from "./Login";
import AppHeader from "./AppHeader";
import "./styles.css";
import logo from "./assets/logo.png";


function App() {
  const [innloggetBruker, setInnloggetBruker] = useState<string | null>(null);
  const [rolle, setRolle] = useState<"admin" | "bruker" | null>(null);
  const [visVelkomstmelding, setVisVelkomstmelding] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogin = (data: { brukernavn: string; rolle: "admin" | "bruker" }) => {
    setInnloggetBruker(data.brukernavn);
    setRolle(data.rolle);
    setVisVelkomstmelding(true);
  };

  const handleLoggUt = () => {
    setInnloggetBruker(null);
    setRolle(null);
    setVisVelkomstmelding(false);
  };

  useEffect(() => {
    if (visVelkomstmelding) {
      const timer = setTimeout(() => {
        setVisVelkomstmelding(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visVelkomstmelding]);

  return (
    <>
      <AppHeader
        brukernavn={innloggetBruker}
        onLoggUt={handleLoggUt}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className="app-wrapper">
        {innloggetBruker ? (
          <div className="app-card">
            {visVelkomstmelding && (
              <div className="welcome-message">Velkommen, {innloggetBruker}!</div>
            )}

            {rolle === "admin" ? <AdminPanel /> : <JobbVareUttak />}
          </div>
        ) : (
          <div className="app-card">
            <div className="logo-wrapper">
            <img src={logo} alt="Firma Logo" className="logo" />
            </div>
            <Login onLogin={handleLogin} />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
