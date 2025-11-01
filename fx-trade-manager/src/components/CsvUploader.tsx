import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface CsvUploaderProps {}

const CsvUploader: React.FC<CsvUploaderProps> = () => {

  const [fileContent, setStatus] = useState<string>("");
  
  const handleFileOpen = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });

    if (typeof selected === "string") {
      setStatus("Importing CSV...");

      try {
        await invoke("insert_record", { csvPath: selected });
        setStatus("CSV imported successfully!");
      } catch (e) {
        console.error(e);
        setStatus(`Failed to import CSV: ${JSON.stringify(e)}`);
      }
    }
  };

  return (
    <main className="container">
      <div>
        <button onClick={handleFileOpen}>Select File</button>
        {fileContent && (
          <div>
            <h3>FileContent:</h3>
            <pre>{fileContent}</pre>
          </div>
        )}
      </div>
    </main>
  );
}

export default CsvUploader
