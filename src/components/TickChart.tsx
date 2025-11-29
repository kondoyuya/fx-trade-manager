import { useEffect, useRef } from "react";
import { createChart, Time, LineSeries } from "lightweight-charts";
import { invoke } from '@tauri-apps/api/core'

interface Tick {
  pair: string
  time: string
  time_msc: number
  bid: number
  ask: number
}

interface TickChartProps {
    center: number
}

export const TickChart: React.FC<TickChartProps> = ({ center }) => {
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
        width: 800,
        height: 600,
        timeScale: { timeVisible: true, barSpacing: 12, rightOffset: 10 },
    })
    chartRef.current = chart

    const fetch_tick = async () => {
        try {
            const from = center - (3600 * 24 * 3 * 1000)
            const to = center + (3600 * 1000)
            console.log(from)
            console.log(to)
            const result: Tick[] = await invoke('get_ticks', { from, to })

            const bidLine = chart.addSeries(LineSeries, {
                color: "blue",
                lineWidth: 1,
            })
            const askLine = chart.addSeries(LineSeries, {
                color: "red",
                lineWidth: 1,
            })

            const bidPoints = result.map((t, i) => ({
                time: i as Time,
                value: t.bid,
            }));

            const askPoints = result.map((t, i) => ({
                time: i as Time,
                value: t.ask,
            }));

            chart.applyOptions({
                timeScale: {
                    tickMarkFormatter: (time: number) => {
                        const d = new Date(time/1000);
                        return `${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
                    }
                }
            });

            bidLine.setData(bidPoints);
            askLine.setData(askPoints);

            chart.applyOptions({
                timeScale: {
                    tickMarkFormatter: (i: number) => {
                        const t = result[i];
                        if (!t) return "";

                        const d = new Date(t.time_msc);

                        return d.toLocaleTimeString("ja-JP", {
                            hour12: false,
                        });
                    },
                },
            });

            let centerIndex = 0;
            let minDiff = Infinity;
            result.forEach((t, i) => {
            const diff = Math.abs(t.time_msc + 3600*9*1000 - center);
            if (diff < minDiff) {
                minDiff = diff;
                centerIndex = i;
            }
            });

            console.log(centerIndex)
            console.log(result[centerIndex].time)
            
            chart.timeScale().setVisibleRange({ from: centerIndex - 100 as Time, to: centerIndex + 100 as Time })

        } catch (err) {
            console.error('tick取得失敗:', err)
        }        
    }

    fetch_tick()


    return () => chart.remove();
  }, [center]);

  return <div ref={chartContainerRef} />;
};
