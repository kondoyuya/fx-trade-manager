from flask import Flask, request, jsonify
import MetaTrader5 as mt5

app = Flask(__name__)

if not mt5.initialize():
    print("MT5 initialize failed")
    exit()

@app.route("/get_ohlc")
def get_ohlc():
    since = int(request.args.get("since", 0))
    rates = mt5.copy_rates_from_pos("USDJPY", mt5.TIMEFRAME_M1, 0, 1000)
    result = []

    if rates is not None:
        for r in rates:
            if int(r['time']) > since:
                result.append({
                    "time": int(r['time']),
                    "open": float(r['open']),
                    "high": float(r['high']),
                    "low": float(r['low']),
                    "close": float(r['close']),
                    "pair": "USDJPY",
                    "tickvol": int(r['tick_volume']),
                    "vol": 0,
                    "spread": 0,
                })
                print(result[len(result) - 1])

    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
