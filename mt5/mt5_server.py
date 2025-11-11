from flask import Flask, request, jsonify
import MetaTrader5 as mt5
from datetime import datetime, timedelta
import pytz

app = Flask(__name__)

if not mt5.initialize():
    print("MT5 initialize failed")
    exit()

# ---- Europe/Helsinkiの夏時間/冬時間の判定に基づき、UnixTimeを調整する ----
def broker_to_utc_unixtime(broker_ts: int) -> int:
    TARGET_TIMEZONE = 'Europe/Helsinki'
    helsinki_tz = pytz.timezone(TARGET_TIMEZONE)
    
    utc_dt = datetime.fromtimestamp(broker_ts, pytz.utc)
    local_dt = utc_dt.astimezone(helsinki_tz)
    
    is_dst = local_dt.dst() != timedelta(0)
    
    if is_dst:
        adjustment = timedelta(hours=-3)
    else:
        adjustment = timedelta(hours=-2)
        
    adjusted_unixtime = broker_ts + int(adjustment.total_seconds())
    
    return adjusted_unixtime

def get_ohlc_since(symbol: str, timeframe, since_time: int, batch_size=1000):
    all_rates = []
    pos = 1 # 今の足は確定足ではないので除く

    while True:
        print(pos)
        rates = mt5.copy_rates_from_pos(symbol, timeframe, pos, batch_size)
        if rates is None or len(rates) == 0:
            break

        new_rates = [r for r in rates if broker_to_utc_unixtime(int(r['time'])) > since_time]
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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
