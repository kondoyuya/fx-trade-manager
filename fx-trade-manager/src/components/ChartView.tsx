import { useEffect, useRef, useState } from "react";
import {
    createChart,
    Time,
    ISeriesPrimitive,
    SeriesAttachedParameter,
    IPrimitivePaneView,
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

// --- Hardcoded Data for the Test
const candleData: CandlestickData<Time>[] = [
    { time: 1737032400 as Time, open: 238.0, high: 238.6, low: 237.5, close: 238.55 },
    { time: 1737036000 as Time, open: 238.55, high: 239.0, low: 237.8, close: 238.2 },
    { time: 1737039600 as Time, open: 238.2, high: 238.8, low: 236.5, close: 237.0 },
    { time: 1737043200 as Time, open: 237.0, high: 237.5, low: 233.5, close: 233.779 },
    { time: 1737046800 as Time, open: 233.779, high: 235.0, low: 233.0, close: 234.5 },
];

const singleTrade = {
    entry_time: "2025-01-16T13:00:00.000Z",
    entry_price: 238.55,
};

// --- Helper to parse time ---
const parseTime = (isoString: string) => (new Date(isoString).getTime() / 1000) as Time;

// --- Primitive Classes ---
class DebugPaneView implements IPrimitivePaneView {
    private readonly _primitive: DebugPrimitive;
    constructor(primitive: DebugPrimitive) {
        this._primitive = primitive;
    }
    renderer() {
        const paneView = this;
        return {
            draw: (target: any) => {
                target.useBitmapCoordinateSpace((scope: any) => {
                    if (scope.context === null) return;
                    const param = paneView._primitive.param();
                    if (!param) return;
                    const { series, chart } = param;
                    const ctx = scope.context;
                    const x = chart.timeScale().timeToCoordinate(parseTime(singleTrade.entry_time));
                    const y = series.priceToCoordinate(singleTrade.entry_price);
                    if (x !== null && y !== null) {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(x - 5, y - 5, 10, 10);
                    }
                });
            }
        };
    }
}

class DebugPrimitive implements ISeriesPrimitive<Time> {
    private _param: SeriesAttachedParameter<Time> | null = null;
    private readonly _paneView: DebugPaneView;
    constructor() {
        this._paneView = new DebugPaneView(this);
    }
    attached(param: SeriesAttachedParameter<Time>) { this._param = param; }
    detached() { this._param = null; }
    paneViews() { return [this._paneView]; }
    param() { return this._param; }
    updateAllViews() {}
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
