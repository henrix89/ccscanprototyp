import { useState } from "react";

interface JobOrder {
  id: string;
  created: string;
}

interface JobblisteProps {
  onSelectJob: (jobId: string) => void;
}

export default function Jobbliste({ onSelectJob }: JobblisteProps) {
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
  };

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        marginBottom: "1rem",
      }}
    >
      <h3>Jobbliste</h3>
      <div>
        <input
          type="text"
          placeholder="Ny jobb ID"
          value={nyJobbId}
          onChange={(e) => setNyJobbId(e.target.value)}
          style={{ marginRight: "0.5rem", padding: "0.5rem" }}
        />
        <button onClick={opprettNyJobb} style={{ padding: "0.5rem 1rem" }}>
          ➕ Opprett ny ordre
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {jobbliste.map((job) => (
          <li
            key={job.id}
            style={{ margin: "0.5rem 0", cursor: "pointer" }}
            onClick={() => velgJobb(job.id)}
          >
            {job.id} – opprettet: {new Date(job.created).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
