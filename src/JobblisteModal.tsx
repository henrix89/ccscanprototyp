import { useState } from "react";

interface JobOrder {
  id: string;
  created: string;
}

interface JobblisteModalProps {
  onSelectJob: (jobId: string) => void;
  onClose: () => void;
}

export default function JobblisteModal({
  onSelectJob,
  onClose,
}: JobblisteModalProps) {
  const [jobbliste, setJobbliste] = useState<JobOrder[]>(() => {
    const data = localStorage.getItem("jobbliste");
    return data ? JSON.parse(data) : [];
  });
  const [nyJobbId, setNyJobbId] = useState("");

  const opprettNyJobb = () => {
    if (!nyJobbId.trim()) return;

    // Sjekk om jobb-ID allerede finnes
    if (jobbliste.some((job) => job.id === nyJobbId)) {
      alert("Jobb ID finnes allerede");
      return;
    }
    const nyJobb: JobOrder = {
      id: nyJobbId,
      created: new Date().toISOString(),
    };
    const nyListe = [...jobbliste, nyJobb];
    setJobbliste(nyListe);
    localStorage.setItem("jobbliste", JSON.stringify(nyListe));
    setNyJobbId("");
  };

  const velgJobb = (jobId: string) => {
    onSelectJob(jobId);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "80%",
          overflowY: "auto",
        }}
      >
        <h3>Velg arbeidsordre</h3>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Ny jobb ID"
            value={nyJobbId}
            onChange={(e) => setNyJobbId(e.target.value)}
            style={{ marginRight: "0.5rem", padding: "0.5rem" }}
          />
          <button onClick={opprettNyJobb} style={{ padding: "0.5rem 1rem" }}>
            ➕ Opprett
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {jobbliste.map((job) => (
            <li
              key={job.id}
              style={{
                padding: "0.5rem",
                borderBottom: "1px solid #ccc",
                cursor: "pointer",
              }}
              onClick={() => velgJobb(job.id)}
            >
              <strong>{job.id}</strong> – opprettet:{" "}
              {new Date(job.created).toLocaleString()}
            </li>
          ))}
        </ul>
        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem" }}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
