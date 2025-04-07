import React, { useState } from "react";

type Props = {
  onLogin: (data: { brukernavn: string; rolle: "admin" | "bruker" }) => void;
};

const Login: React.FC<Props> = ({ onLogin }) => {
  const [brukernavn, setBrukernavn] = useState("");
  const [passord, setPassord] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Rootadmin bypass
    if (brukernavn === "rootadmin" && passord === "Passord1234") {
      onLogin({ brukernavn: "rootadmin", rolle: "admin" });
      return;
    }

    // Trygg parsing av brukere
    const raw = localStorage.getItem("brukere");
    let lagredeBrukere: any[] = [];

    try {
      const parsed = raw ? JSON.parse(raw) : [];
      lagredeBrukere = Array.isArray(parsed) ? parsed : [];
    } catch {
      lagredeBrukere = [];
    }

    // Sjekk bruker
    const funnet = lagredeBrukere.find(
      (b) => b.brukernavn === brukernavn && b.passord === passord
    );

    if (funnet) {
      onLogin({ brukernavn: funnet.brukernavn, rolle: funnet.rolle });
    } else {
      alert("Feil brukernavn eller passord.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Brukernavn"
        value={brukernavn}
        onChange={(e) => setBrukernavn(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Passord"
        value={passord}
        onChange={(e) => setPassord(e.target.value)}
        required
      />
      <button type="submit">Logg inn</button>
    </form>
  );
};

export default Login;
