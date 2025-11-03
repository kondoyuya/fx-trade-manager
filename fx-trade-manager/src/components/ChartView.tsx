import { useEffect, useRef, useState } from "react";
import {
    createChart,
    Time,
    CandlestickSeries,
    CandlestickData,
    UTCTimestamp,
} from 'lightweight-charts';
import { invoke } from "@tauri-apps/api/core";

interface ChartViewProps {}

interface Candle {
  time: number; // UNIX秒
  open: number;
  high: number;
  low: number;
  close: number;
}

const ChartView: React.FC<ChartViewProps> = () => {
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [candleData, setCandleData] = useState<CandlestickData<Time>[]>([]);
    const [searchTime, setSearchTime] = useState<string>("");

    // --- (1) DBからデータを取得 ---
    useEffect(() => {
        async function fetchCandles() {
            try {
                const candles: Candle[] = await invoke("get_candles");
                const formatted = candles.map((c) => ({
                    time: c.time as Time,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                }));
                setCandleData(formatted);
            } catch (err) {
                console.error("DBからローソク足取得失敗:", err);
            }
        }

        fetchCandles();
    }, []);

    // --- (2) データ取得後にチャートを描画 ---
    useEffect(() => {
        if (!chartContainerRef.current || candleData.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            width: 800,
            height: 600,
            timeScale: { 
                timeVisible: true, // 時間をHH:MMで表示する
                fixRightEdge: false,  // 右端を固定するか
                barSpacing: 12, 
                rightOffset: 10,
            },
        });
        const candleSeries = chart.addSeries(CandlestickSeries, {});
        candleSeries.setData(candleData);

        chartRef.current = chart;

        // 初期は直近100本を拡大表示
        const times = candleData.map(c => c.time as Time);
        const to = times[times.length - 1];
        const from = times[Math.max(0, times.length - 100)];
        chart.timeScale().setVisibleRange({ from, to });

        return () => {
            console.log("aa");
            chart.remove();
        };
    }, [candleData]); // データが入ったら実行

    // --- (3) 指定時刻検索 ---
    const handleSearch = () => {
        if (!chartRef.current || candleData.length === 0 || !searchTime) return;
        const targetUnix = Math.floor(new Date(searchTime).getTime() / 1000);
        console.log(targetUnix);

        // 最も近いローソク足を探す
        const closest = candleData.reduce((prev, curr) => {
            return Math.abs((curr.time as number) - targetUnix) <
                Math.abs((prev.time as number) - targetUnix)
                ? curr
                : prev;
        });

        console.log(closest);

        const rangeSize = 50; // 前後にどのくらい表示するか
        const from = ((closest.time as number) - rangeSize * 60) as UTCTimestamp;
        const to = ((closest.time as number) + rangeSize * 60) as UTCTimestamp;
        
        chartRef.current.timeScale().setVisibleRange({ from, to });
    };

    return (
        <div className="flex flex-col items-center mt-4 space-y-4">
            {/* 🔍 検索フォーム */}
            <div className="flex items-center space-x-2">
                <input
                    type="datetime-local"
                    value={searchTime}
                    onChange={(e) => setSearchTime(e.target.value)}
                    className="border rounded p-1"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                    検索
                </button>
            </div>

            {/* 📈 チャート本体 */}
            <div ref={chartContainerRef} style={{ width: "800px", height: "600px" }} />
        </div>
    );
};

export default ChartView;
