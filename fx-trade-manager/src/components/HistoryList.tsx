import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Record {
  id: number;
  pair: string;
  side: string;
  trade_type: string;
  lot: number;
  rate: number;
  profit?: number;
  swap?: number;
  order_time: string;
}

interface HistoryListProps {}

const HistoryList: React.FC<HistoryListProps> = () => {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const data = await invoke<Record[]>("get_all_records");
        console.log("📄 Records fetched:", data);
        setRecords(data);
      } catch (error) {
        console.error("❌ Failed to fetch records:", error);
      }
    }

    fetchRecords();
  }, []);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Records</h1>
    　<p className="mb-4">Total records: {records.length}</p>
      <table className="table-auto border-collapse border border-gray-300 w-full">
        <thead>
          <tr className="bg-gray-100">
            {["ID","Pair","Side","Type","Lot","Rate","Profit","Swap","Order Time"].map((h) => (
              <th key={h} className="border border-gray-300 p-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td className="border border-gray-300 p-2">{r.id}</td>
              <td className="border border-gray-300 p-2">{r.pair}</td>
              <td className="border border-gray-300 p-2">{r.side}</td>
              <td className="border border-gray-300 p-2">{r.trade_type}</td>
              <td className="border border-gray-300 p-2">{r.lot}</td>
              <td className="border border-gray-300 p-2">{r.rate}</td>
              <td className="border border-gray-300 p-2">{r.profit ?? "-"}</td>
              <td className="border border-gray-300 p-2">{r.swap ?? "-"}</td>
              <td className="border border-gray-300 p-2">{r.order_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default HistoryList;
