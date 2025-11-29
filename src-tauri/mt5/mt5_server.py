import sys
import os

# PyInstaller 対応：MetaTrader5 パス追加
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    mt5_path = os.path.join(base_path, "MetaTrader5")
    if mt5_path not in sys.path:
        sys.path.append(mt5_path)

    numpy_path = os.path.join(base_path, "numpy")
    if numpy_path not in sys.path:
        sys.path.append(numpy_path)

from flask import Flask, request, jsonify
import MetaTrader5 as mt5
from datetime import datetime, timedelta
import pytz
import time

app = Flask(__name__)

if not mt5.initialize():
    print("MT5 initialize failed")
    exit()

def is_helsinki_dst(unix_timestamp: int) -> bool:
    utc_dt = datetime.fromtimestamp(unix_timestamp, tz=pytz.utc)

    helsinki_tz = pytz.timezone('Europe/Helsinki')

    helsinki_dt = utc_dt.astimezone(helsinki_tz)
    return helsinki_dt.dst() != timedelta(0)

def broker_to_utc_unixtime(broker_ts: int) -> int:
    if is_helsinki_dst(broker_ts):
        adjustment = timedelta(hours=-3)
    else:
        adjustment = timedelta(hours=-2)
        
    adjusted_unixtime = broker_ts + int(adjustment.total_seconds())
    
    return adjusted_unixtime


def get_ohlc_since(symbol: str, timeframe, since_time: int, batch_size=1000):
    all_rates = []
    pos = 1  # 今の足は確定足ではないので除く

    while True:
        print(pos)
        rates = mt5.copy_rates_from_pos(symbol, timeframe, pos, batch_size)
        if rates is None or len(rates) == 0:
            break

        new_rates = [
            r for r in rates
            if broker_to_utc_unixtime(int(r['time'])) > since_time
        ]

        if not new_rates:
            break

        all_rates.extend(new_rates)
        pos += batch_size

    all_rates.sort(key=lambda x: x['time'])
    return all_rates


@app.route("/get_ohlc")
def get_ohlc():
    since = int(request.args.get("since", 0))
    batch_size = int(request.args.get("batch_size", 1000))
    rates = get_ohlc_since("USDJPY", mt5.TIMEFRAME_M1, since, batch_size)

    result = []
    if rates is not None:
        for r in rates:
            utc_time = broker_to_utc_unixtime(int(r['time']))
            result.append({
                "time": utc_time,
                "open": float(r['open']),
                "high": float(r['high']),
                "low": float(r['low']),
                "close": float(r['close']),
                "pair": "USDJPY",
                "tickvol": int(r['tick_volume']),
                "vol": 0,
                "spread": 0,
            })

    return jsonify(result)

@app.route("/get_ticks")
def get_ticks():
    from_time = int(request.args.get("since", 0)) - 3600 * 24
    to_time = from_time + 3600 * 10

    current_unix_time = int(time.time())

    all_ticks = []
    while True:
        ticks = mt5.copy_ticks_range("USDJPY", from_time, to_time, mt5.COPY_TICKS_ALL)
        print(len(ticks))

        # レスポンスの時刻はヨーロッパ時刻で渡される
        for t in ticks:
            utc_time = broker_to_utc_unixtime(int(t['time']))
            utc_time_msc = utc_time * 1000 + (int(t['time_msc']) % 1000)

            all_ticks.append({
                "time": int(utc_time),
                "time_msc": int(utc_time_msc),
                "bid": float(t["bid"]),
                "ask": float(t["ask"]),
                "pair": "USDJPY"
            })
        
        if current_unix_time + 3600 * 24 < to_time :
            break

        from_time += 3600 * 10
        to_time += 3600 * 10


    unique = {tick["time_msc"]: tick for tick in all_ticks}
    sorted_ticks = sorted(unique.values(), key=lambda x: x["time_msc"])

    return jsonify(sorted_ticks)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
