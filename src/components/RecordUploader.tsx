import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'

interface RecordUploaderProps {}

const RecordUploader: React.FC<RecordUploaderProps> = () => {
  const [fileContent, setStatus] = useState<string>('')

  const handleFileOpen = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (!selected) return;

    let csvPaths: string[] = [];

    if (Array.isArray(selected)) {
      csvPaths = selected as string[];
    } else if (typeof selected === "string") {
      csvPaths = [selected];
    } else {
      setStatus("Invalid file selection");
      return;
    }

    setStatus("Importing CSV...");

    try {
      console.log(csvPaths);
      await invoke("insert_record", { csvPaths });
      setStatus("CSV imported successfully!");
    } catch (e) {
      console.error(e);
      setStatus(`Failed to import CSV: ${JSON.stringify(e)}`);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-start gap-4">
        {/* ボタン */}
        <button
          onClick={handleFileOpen}
          className="
            px-6 py-3
            bg-blue-600 text-white font-semibold
            rounded-lg shadow-md
            hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
            transition-colors duration-200
          "
        >
          取引履歴をインポート
        </button>

        {/* ボタンの説明 */}
        <p className="text-gray-500 text-sm">
          ファイルを選択して内容を読み込みます。
          現在対応している口座はDMMとGMOです。
        </p>

        {/* ファイル内容 */}
        {fileContent && (
          <div className="w-full max-w-2xl bg-gray-50 p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-2">File Content:</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {fileContent}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}

export default RecordUploader
