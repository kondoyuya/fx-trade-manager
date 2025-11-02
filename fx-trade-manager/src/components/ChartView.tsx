import { useEffect, useRef, useState } from "react";
import {
    createChart,
    Time,
    CandlestickSeries,
    CandlestickData,
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
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [candleData, setCandleData] = useState<CandlestickData<Time>[]>([]);

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

        // 初期は直近100本を拡大表示
        const times = candleData.map(c => c.time as Time);
        const to = times[times.length - 1];
        const from = times[Math.max(0, times.length - 100)];
        chart.timeScale().setVisibleRange({ from, to });

        return () => {
            chart.remove();
        };
    }, [candleData]); // ← データが入ったら実行

    return (
        <div className="flex justify-center mt-4">
            <div ref={chartContainerRef} style={{ width: "800px", height: "600px" }} />
        </div>
    );
};

export default ChartView;
