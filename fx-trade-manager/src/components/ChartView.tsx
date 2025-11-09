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

interface Trade {
  id: number;
  pair: string;
  side: string;
  lot: number;
  entry_rate: number;
  exit_rate: number;
  entry_time: number;
  exit_time: number;
  profit: number;
  swap: number;
  memo: string;
}

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
                    
                    const trades = paneView._primitive.trades();
                    for (const trade of trades) {
                        const isSell = (trade.side === "売");
                        const arrowSize = 10;

                            // --- 1. 座標計算 (省略) ---
                        const TIME_OFFSET = 3600 * 9; 
                        const entryTimeFloor = Math.floor(trade.entry_time / 60) * 60;
                        const exitTimeFloor = Math.floor(trade.exit_time / 60) * 60;

                        const entryX = chart.timeScale().timeToCoordinate((entryTimeFloor + TIME_OFFSET) as Time);
                        const entryY = series.priceToCoordinate(trade.entry_rate);
                        const exitX = chart.timeScale().timeToCoordinate((exitTimeFloor + TIME_OFFSET) as Time);
                        const exitY = series.priceToCoordinate(trade.exit_rate);
                        //console.log(entryX, entryY, exitX, entryY)
                        if (entryX !== null && entryY !== null && exitX !== null && exitY !== null) {
                            console.log("ok")
                            // --- 2. 2点間を点線で結ぶ ---
                            ctx.strokeStyle = trade.exit_rate >= trade.entry_rate ? 'blue' : 'red'; // 利益に応じて色分け
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]); 
                            
                            ctx.beginPath();
                            ctx.moveTo(entryX, entryY);
                            ctx.lineTo(exitX, exitY);
                            ctx.stroke();
                            
                            // 点線をリセット
                            ctx.setLineDash([]);
                            
                            const drawArrow = (x: number, y: number, isUp: boolean, color: string) => {
                                ctx.fillStyle = color;
                                ctx.beginPath();
                                
                                if (isUp) {
                                    // 上向き矢印: 頂点は下、底辺は上
                                    ctx.moveTo(x, y + arrowSize * 0.5); 
                                    ctx.lineTo(x - arrowSize * 0.5, y - arrowSize * 0.5); 
                                    ctx.lineTo(x + arrowSize * 0.5, y - arrowSize * 0.5); 
                                } else {
                                    // 下向き矢印: 頂点は上、底辺は下
                                    ctx.moveTo(x, y - arrowSize * 0.5); 
                                    ctx.lineTo(x - arrowSize * 0.5, y + arrowSize * 0.5); 
                                    ctx.lineTo(x + arrowSize * 0.5, y + arrowSize * 0.5); 
                                }
                                ctx.closePath();
                                ctx.fill();
                            };

                            // --- 4. エントリーポイントの矢印描画 ---
                            // 買い (isSell=false) なら上向き (isUp=true) で緑
                            // 売り (isSell=true) なら下向き (isUp=false) で赤
                            const entryIsUp = isSell;
                            const entryColor = isSell ? 'blue' : 'red';
                            drawArrow(entryX, entryY, entryIsUp, entryColor);
                            
                            // --- 5. イグジットポイントの矢印描画 ---
                            // エントリーと逆の向きと色
                            const exitIsUp = !isSell; // エントリー (isUp) の逆
                            const exitColor = isSell ? 'red' : 'blue';
                            drawArrow(exitX, exitY, exitIsUp, exitColor);
                        }
                    }
                });
            }
        };
    }
}

class DebugPrimitive implements ISeriesPrimitive<Time> {
    private _param: SeriesAttachedParameter<Time> | null = null;
    private readonly _paneView: DebugPaneView;
    private _trades: Trade[] = []; 
    
    constructor() {
        this._paneView = new DebugPaneView(this);
    }
    public trades() { return this._trades; }

    public updateTrades(trades: Trade[]) {
        this._trades = trades;
        if (this._param) {
            this._param.requestUpdate(); 
        }
    }

    attached(param: SeriesAttachedParameter<Time>) { this._param = param; }
    detached() { this._param = null; }
    paneViews() { return [this._paneView]; }
    param() { return this._param; }
    updateAllViews() {}
}

const ChartView: React.FC<ChartViewProps> = () => {
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const primitiveRef = useRef<DebugPrimitive | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [candleData, setCandleData] = useState<CandlestickData<Time>[]>([]);
    const [searchTime, setSearchTime] = useState<string>("");
    const [trades, setTrades] = useState<Trade[]>([]);

    // --- (1) DBからデータを取得 ---
    useEffect(() => {
        async function fetchCandles() {
            try {
                const candles: Candle[] = await invoke("get_candles");
                const formatted = candles.map((c) => ({
                    time: c.time + 3600*9 as Time,
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

        async function fetchTrades() {
            try {
                const data = await invoke<Trade[]>("get_all_trades");
                setTrades(data);
            } catch (err) {
                console.error("DBからトレード履歴取得失敗:", err);
            }
        }

        fetchCandles();
        fetchTrades();
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

        // チャート上にトレードを表示
        const primitive = new DebugPrimitive();
        primitiveRef.current = primitive;

        candleSeries.attachPrimitive(primitive);

        // 初期は直近100本を拡大表示
        const times = candleData.map(c => c.time  as Time);
        const to = times[times.length - 1];
        const from = times[Math.max(0, times.length - 100)];
        chart.timeScale().setVisibleRange({ from, to });

        return () => {
            chart.remove();
        };
    }, [candleData]); // データが入ったら実行

    useEffect(() => {
        if (primitiveRef.current) {
            // trades Stateが更新されたらPrimitiveに最新のデータを渡し、再描画を要求
            primitiveRef.current.updateTrades(trades);
        }
    }, [trades]); // tradesデータが入ったら実行

    // --- (3) 指定時刻検索 ---
    const handleSearch = () => {
        if (!chartRef.current || candleData.length === 0 || !searchTime) return;
        const targetUnix = Math.floor(new Date(searchTime).getTime() / 1000) + 3600*9;
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
