import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import JobblisteModal from "./JobblisteModal";
import varedataJson from "./data/varedata.json";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/logo.png";
import { hentVaredata, settInnVaredata } from "./indexedDb";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

const MVA_SATS = 1.25;

interface Vare {
  varenummer: string;
  beskrivelse: string;
  pris: number;
}

interface VareMedAntall extends Vare {
  kode: string;
  antall: number;
  tidspunkt: string;
  prisEksMva: number;
  totalEksMva: number;
  totalInkMva: number;
}

type Handlekurv = Record<string, VareMedAntall[]>;

export default function JobbVareUttak() {
  const [jobbId, setJobbId] = useState<string>("");
  const [handlekurv, setHandlekurv] = useState<Handlekurv>(() => {
    const data = localStorage.getItem("handlekurv");
    return data ? JSON.parse(data) : {};
  });
  const [skannetVare, setSkannetVare] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const [popup, setPopup] = useState<string>("");
  const [varedata, setVaredata] = useState<Record<string, Vare>>({});
  const [visJobbModal, setVisJobbModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<string>("");

  const varer = jobbId && handlekurv[jobbId] ? handlekurv[jobbId] : [];

  const getVarenavn = useCallback(
    (kode: string) => varedata[kode]?.beskrivelse || "Ukjent varenummer",
    [varedata]
  );

  useEffect(() => {
    hentVaredata().then((data) => {
      if (data) {
        setVaredata(data);
      } else {
        const parsed = Object.fromEntries(
          (varedataJson as any[]).map((v: any) => [v.strekkode, v])
        );
        settInnVaredata(parsed);
        setVaredata(parsed);
      }
    });
  }, []);

  useEffect(() => {
    return () => stopScanning();
  }, []);

  const startScanning = async () => {
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      codeReader.decodeFromVideoDevice(
        null,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const kode = result.getText().trim();
            if (kode && kode !== lastScannedRef.current) {
              lastScannedRef.current = kode;
              leggTilVare(kode);
              lastScannedRef.current = "";  // umiddelbar nullstilling
              
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("Skanningsfeil:", err);
          }
        }
      );
    } catch (err) {
      console.error("Klarte ikke starte kameraet:", err);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    codeReaderRef.current?.reset();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const oppdaterHandlekurv = (nyListe: VareMedAntall[]) => {
    const nyHandlekurv = { ...handlekurv, [jobbId]: nyListe };
    setHandlekurv(nyHandlekurv);
    localStorage.setItem("handlekurv", JSON.stringify(nyHandlekurv));
  };

  const leggTilVare = (kode: string) => {
    if (!varedata[kode]) {
      setPopup("❌ Ukjent vare – ikke lagt til");
      return;
    }
    const eksisterende = varer.find((v) => v.kode === kode);
    const nå = new Date().toISOString();
    const prisEksMva = varedata[kode].pris;
    const nyVare: VareMedAntall = eksisterende
      ? {
          ...eksisterende,
          antall: eksisterende.antall + 1,
          tidspunkt: nå,
          totalEksMva: prisEksMva * (eksisterende.antall + 1),
          totalInkMva: prisEksMva * (eksisterende.antall + 1) * MVA_SATS,
        }
      : {
          kode,
          antall: 1,
          tidspunkt: nå,
          varenummer: varedata[kode].varenummer,
          beskrivelse: varedata[kode].beskrivelse,
          pris: prisEksMva,
          prisEksMva,
          totalEksMva: prisEksMva,
          totalInkMva: prisEksMva * MVA_SATS,
        };
    const nyListe = eksisterende
      ? varer.map((v) => (v.kode === kode ? nyVare : v))
      : [...varer, nyVare];
    oppdaterHandlekurv(nyListe);
    setPopup(`✔️ Lagt til ${kode} – ${getVarenavn(kode)}`);
    setTimeout(() => setPopup(""), 2000);
  };

  const fjernVare = (kode: string) => {
    const nyListe = varer.filter((v) => v.kode !== kode);
    oppdaterHandlekurv(nyListe);
    setPopup(`🗑️ Fjernet vare ${kode}`);
    setTimeout(() => setPopup(""), 2000);
  };

  const endreAntall = (kode: string, endring: number) => {
    const eksisterende = varer.find((v) => v.kode === kode);
    if (!eksisterende) return;

    const nyAntall = eksisterende.antall + endring;
    if (nyAntall < 1) return;

    const prisEksMva = eksisterende.pris;
    const oppdatert = {
      ...eksisterende,
      antall: nyAntall,
      totalEksMva: prisEksMva * nyAntall,
      totalInkMva: prisEksMva * nyAntall * MVA_SATS,
    };

    const nyListe = varer.map((v) => (v.kode === kode ? oppdatert : v));
    oppdaterHandlekurv(nyListe);
  };

  const handleSelectJob = (selectedJobId: string) => {
    setJobbId(selectedJobId);
  };

  const lastNedPDF = () => {
    if (!varer.length || !jobbId) {
      alert("Ingen varer å skrive ut.");
      return;
    }

    const doc = new jsPDF();

    doc.addImage(logo, "PNG", 14, 10, 50, 15);
    doc.setFontSize(16);
    doc.text(`Ordre: ${jobbId}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Varenummer", "Beskrivelse", "Antall", "Tidspunkt", "Eks. MVA", "Ink. MVA"]],
      body: varer.map((v) => [
        varedata[v.kode]?.varenummer || v.kode,
        v.beskrivelse,
        v.antall,
        new Date(v.tidspunkt).toLocaleString("no-NO", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        `${v.totalEksMva.toFixed(2)} kr`,
        `${v.totalInkMva.toFixed(2)} kr`,
      ]),
      theme: "striped",
    });

    const totalEks = varer.reduce((sum, v) => sum + v.totalEksMva, 0).toFixed(2);
    const totalInk = varer.reduce((sum, v) => sum + v.totalInkMva, 0).toFixed(2);

    doc.text(`Totalt eks. MVA: ${totalEks} kr`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Totalt ink. MVA: ${totalInk} kr`, 14, doc.lastAutoTable.finalY + 20);

    doc.save(`Arbeidsordre_${jobbId}.pdf`);
  };

  return (
    <div className="theme-card">
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setVisJobbModal(true)}>Velg/legg til arbeidsordre</button>
      </div>

      {visJobbModal && (
        <JobblisteModal
          onSelectJob={handleSelectJob}
          onClose={() => setVisJobbModal(false)}
        />
      )}

      <h1>Arbeidsordre {jobbId || "(ingen valgt)"}</h1>

      {jobbId ? (
        <>
          <input
            placeholder="Skriv inn varenummer"
            value={skannetVare}
            onChange={(e) => setSkannetVare(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                leggTilVare(skannetVare);
                setSkannetVare("");
              }
            }}
          />
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
            <button onClick={startScanning}>📷 Start skanning</button>
            <button onClick={stopScanning}>❌ Stopp skanning</button>
            <button onClick={lastNedPDF}>📄 Last ned PDF</button>
          </div>

          {popup && <p>{popup}</p>}

          {scanning && (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%" }} />
          )}

          {varer.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Varenummer</th>
                    <th>Beskrivelse</th>
                    <th>Antall</th>
                    <th>Tidspunkt</th>
                    <th>Sum eks mva</th>
                    <th>Sum inkl mva</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {varer.map((v) => (
                    <tr key={v.kode} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td>{varedata[v.kode]?.varenummer || v.kode}</td>
                      <td>{getVarenavn(v.kode)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button onClick={() => endreAntall(v.kode, -1)} disabled={v.antall <= 1}>−</button>
                          <span>{v.antall}</span>
                          <button onClick={() => endreAntall(v.kode, 1)}>+</button>
                        </div>
                      </td>
                      <td>
                        {new Date(v.tidspunkt).toLocaleString("no-NO", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </td>
                      <td>{v.totalEksMva.toFixed(2)} kr</td>
                      <td>{v.totalInkMva.toFixed(2)} kr</td>
                      <td>
                        <button onClick={() => fjernVare(v.kode)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}><strong>Totalt</strong></td>
                    <td>{varer.reduce((sum, v) => sum + v.totalEksMva, 0).toFixed(2)} kr</td>
                    <td>{varer.reduce((sum, v) => sum + v.totalInkMva, 0).toFixed(2)} kr</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      ) : (
        <p>
          Velg eller opprett en arbeidsordre via popup-vinduet for å starte registreringen av varer.
        </p>
      )}
    </div>
  );
}
