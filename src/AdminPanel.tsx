import React, { useState, useEffect } from "react";
import ExcelImport from "./ExcelImport";
import varer from "./data/varedata.json";

const AdminPanel: React.FC = () => {
  const [aktivSide, setAktivSide] = useState<"varer" | "import" | "brukere" | null>(null);

  const [vareliste, setVareliste] = useState<any[]>([]);
  const [nyVare, setNyVare] = useState({ varenummer: "", beskrivelse: "", pris: "" });

  const [brukere, setBrukere] = useState<any[]>([]);
  const [nyBruker, setNyBruker] = useState("");
  const [nyttPassord, setNyttPassord] = useState("");
  const [rolle, setRolle] = useState<"admin" | "bruker">("bruker");

  useEffect(() => {
    const varerFraLagring = JSON.parse(localStorage.getItem("varer") || "[]");
    setVareliste(varerFraLagring.length ? varerFraLagring : varer);

    try {
      const raw = localStorage.getItem("brukere");
      const parsed = raw ? JSON.parse(raw) : [];
      const brukerliste = Array.isArray(parsed) ? parsed : [];

      // Legg til rootadmin om den ikke finnes
      const harRoot = brukerliste.some((b) => b.brukernavn === "rootadmin");
      if (!harRoot) {
        brukerliste.push({
          brukernavn: "rootadmin",
          passord: "Passord1234",
          rolle: "admin",
        });
      }

      setBrukere(brukerliste);
      localStorage.setItem("brukere", JSON.stringify(brukerliste));
    } catch {
      setBrukere([
        {
          brukernavn: "rootadmin",
          passord: "Passord1234",
          rolle: "admin",
        },
      ]);
    }
  }, []);

  const oppdaterVarer = (nyeVarer: any[]) => {
    setVareliste(nyeVarer);
    localStorage.setItem("varer", JSON.stringify(nyeVarer));
  };

  const leggTilVare = () => {
    const { varenummer, beskrivelse, pris } = nyVare;
    if (!varenummer || !beskrivelse || !pris) return alert("Fyll ut alle felter.");
    const ny = { ...nyVare };
    const oppdatert = [...vareliste, ny];
    oppdaterVarer(oppdatert);
    setNyVare({ varenummer: "", beskrivelse: "", pris: "" });
  };

  const slettVare = (varenummer: string) => {
    if (confirm(`Slett vare "${varenummer}"?`)) {
      const oppdatert = vareliste.filter((v) => v.varenummer !== varenummer);
      oppdaterVarer(oppdatert);
    }
  };

  const oppdaterBrukere = (nyListe: any[]) => {
    setBrukere(nyListe);
    localStorage.setItem("brukere", JSON.stringify(nyListe));
  };

  const leggTilBruker = () => {
    if (!nyBruker || !nyttPassord) return alert("Fyll ut bruker og passord.");
    if (nyBruker === "rootadmin") return alert("rootadmin eksisterer allerede.");
    const ny = { brukernavn: nyBruker, passord: nyttPassord, rolle };
    const oppdatert = [...brukere, ny];
    oppdaterBrukere(oppdatert);
    setNyBruker("");
    setNyttPassord("");
    setRolle("bruker");
  };

  const slettBruker = (brukernavn: string) => {
    if (brukernavn === "rootadmin") {
      alert("Du kan ikke slette rootadmin.");
      return;
    }

    if (confirm(`Slett bruker "${brukernavn}"?`)) {
      const filtrert = brukere.filter((b) => b.brukernavn !== brukernavn);
      oppdaterBrukere(filtrert);
    }
  };

  return (
    <div className="admin-container">
      <nav className="menu">
        <button onClick={() => setAktivSide("varer")}>📦 Vareliste</button>
        <button onClick={() => setAktivSide("import")}>📁 Import</button>
        <button onClick={() => setAktivSide("brukere")}>👥 Brukere</button>
      </nav>

      {aktivSide === "varer" && (
        <div className="section">
          <h2>Vareliste</h2>
          <div className="input-group">
            <input
              placeholder="Varenummer"
              value={nyVare.varenummer}
              onChange={(e) => setNyVare({ ...nyVare, varenummer: e.target.value })}
            />
            <input
              placeholder="Beskrivelse"
              value={nyVare.beskrivelse}
              onChange={(e) => setNyVare({ ...nyVare, beskrivelse: e.target.value })}
            />
            <input
              placeholder="Pris"
              value={nyVare.pris}
              onChange={(e) => setNyVare({ ...nyVare, pris: e.target.value })}
            />
            <button onClick={leggTilVare}>➕ Legg til</button>
          </div>
          {vareliste.map((v) => (
            <div key={v.varenummer} className="list-item">
              <span>
                {v.varenummer} - {v.beskrivelse} ({v.pris} kr)
              </span>
              <button className="delete-btn" onClick={() => slettVare(v.varenummer)}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {aktivSide === "import" && (
        <div className="section">
          <h2>Importér varer fra Excel/CSV</h2>
          <ExcelImport onImport={oppdaterVarer} />
        </div>
      )}

      {aktivSide === "brukere" && (
        <div className="section">
          <h2>Brukerliste</h2>
          <div className="input-group">
            <input
              placeholder="Brukernavn"
              value={nyBruker}
              onChange={(e) => setNyBruker(e.target.value)}
            />
            <input
              placeholder="Passord"
              type="password"
              value={nyttPassord}
              onChange={(e) => setNyttPassord(e.target.value)}
            />
            <select value={rolle} onChange={(e) => setRolle(e.target.value as "admin" | "bruker")}>
              <option value="bruker">Bruker</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={leggTilBruker}>➕ Legg til</button>
          </div>
          {brukere
            .filter((b) => b.brukernavn !== "rootadmin")
            .map((b) => (
              <div key={b.brukernavn} className="list-item">
                <span>
                  {b.brukernavn} ({b.rolle})
                </span>
                <button className="delete-btn" onClick={() => slettBruker(b.brukernavn)}>
                  🗑️
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
