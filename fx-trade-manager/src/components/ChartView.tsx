import { useEffect, useRef } from "react";
import {
    createChart,
    Time,
    ISeriesPrimitive,
    SeriesAttachedParameter,
    IPrimitivePaneView,
    CandlestickSeries,
    CandlestickData,
} from 'lightweight-charts';

interface ChartViewProps {}

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

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current);
        const candleSeries = chart.addSeries(CandlestickSeries, {});
        candleSeries.setData(candleData);
        const primitive = new DebugPrimitive();
        candleSeries.attachPrimitive(primitive);
        chart.timeScale().fitContent();

        return () => {
            chart.remove();
        };
    }, []);

    return <div ref={chartContainerRef} style={{ width: '800px', height: '600px' }} />;
}

export default ChartView;
