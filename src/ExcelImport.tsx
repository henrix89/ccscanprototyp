import React, { useState } from "react";
import * as XLSX from "xlsx";

interface Vare {
  varenummer: string;
  beskrivelse: string;
  ean: string;
  pris: number;
}

type Props = {
  onImport: (varer: Vare[]) => void;
};

const ExcelImport: React.FC<Props> = ({ onImport }) => {
  const [melding, setMelding] = useState<string>("");
  const [data, setData] = useState<Vare[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: Vare[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const processedData: Vare[] = jsonData.map((row: any) => {
          const varenummer = row["Varenummer"]?.toString().trim() || "";
          const beskrivelse = row["Beskrivelse"]?.toString().trim() || "";
          const ean = row["EAN"]?.toString().trim() || "";
          const prisStr = row["Pris"]?.toString().trim() || "0";
          const pris = parseFloat(prisStr.replace(",", "."));

          return { varenummer, beskrivelse, ean, pris };
        });

        localStorage.setItem("varedata", JSON.stringify(processedData));
        setData(processedData);
        onImport(processedData); // 🔥 Callback til AdminPanel
        setMelding("Excel-fil importert!");
      } catch (error) {
        console.error("Feil ved import:", error);
        setMelding("Feil ved import av Excel-fil");
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="excel-import">
      <h2>Importer Excel-fil</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {melding && <p>{melding}</p>}

      {data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>EAN</th>
              <th>Varenummer</th>
              <th>Beskrivelse</th>
              <th>Pris</th>
            </tr>
          </thead>
          <tbody>
            {data.map((vare, i) => (
              <tr key={i}>
                <td>{vare.ean}</td>
                <td>{vare.varenummer}</td>
                <td>{vare.beskrivelse}</td>
                <td>{vare.pris} kr</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExcelImport;
