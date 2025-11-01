import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

interface CsvUploaderProps {}

const CsvUploader: React.FC<CsvUploaderProps> = () => {

  const [fileContent, setFileContent] = useState<string>("");
  
  const handleFileOpen = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
      });

      if (selected && typeof selected === "string") {
        const content = await readTextFile(selected);
        setFileContent(content);
      }
    } catch (error) {
      console.error("Error has occured when read file: ", error);
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
