import React from "react";
import "./styles.css";

type Props = {
  brukernavn: string | null;
  onLoggUt: () => void;
  onToggleDarkMode: () => void;
};

const AppHeader: React.FC<Props> = ({ brukernavn, onLoggUt, onToggleDarkMode }) => {
  return (
    <header className="app-header">
      <div className="app-title-wrapper">
        <img
          src="https://www.cchristoffersen.no/wp-content/uploads/2018/08/cchristoffersen_logo.png"
          alt="CC Logo"
          className="header-logo"
        />

      </div>
      <div className="app-actions">
        <button onClick={onToggleDarkMode}>🌓</button>
        {brukernavn && (
          <>
            <span className="app-user">👤 {brukernavn}</span>
            <button onClick={onLoggUt}>Logg ut</button>
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
