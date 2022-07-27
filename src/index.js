import "./styles.css";
import {createChart, CrosshairMode} from "lightweight-charts";

let debug = true
let config = {
    delay: 500,
    symbol: "BTCUSDT",
    interval: "15m",
    startTime: 1567900800000
};

let played_bars = [];
let storage_bars = [];

export async function makeApiRequest(path) {
    try {
        const response = await fetch(`${path}`);
        return response.json();
    } catch (error) {
        throw new Error(`CryptoCompare request error: ${error.status}`);
    }
}

const chart = createChart(document.body, {
    width: window.innerWidth,
    height: window.innerHeight,
    layout: {
        backgroundColor: "#253248"
    },
    grid: {
        vertLines: {
            color: "#334158"
        },
        horzLines: {
            color: "#334158"
        }
    },
    crosshair: {
        mode: CrosshairMode.Normal
    },
    priceScale: {
        borderColor: "#485c7b"
    },
    timeScale: {
        tickMarkFormatter: (time) => {
            const date = new Date(time);
            return `${date.getHours()}`;
        },
        borderColor: "#485158"
    },
    watermark: {
        text: "XYZ",
        fontSize: 256,
        color: "rgba(256, 256, 256, 0.1)",
        visible: true
    }
});

const candleSeries = chart.addCandlestickSeries({
    upColor: "#4bffb5",
    downColor: "#ff4976",
    borderDownColor: "#ff4976",
    borderUpColor: "#4bffb5",
    wickDownColor: "#838ca1",
    wickUpColor: "#838ca1"
});

const volumeSeries = chart.addHistogramSeries({
    color: "#385263",
    lineWidth: 2,
    priceFormat: {
        type: "volume"
    },
    overlay: true,
    scaleMargins: {
        top: 0.9,
        bottom: 0
    }
});

//for (let i = 0; i < 150; i++) {
/**
 * 1. get configuration ( start time, speed, tick_timeframe, symbol, candle timeframe)
 * 2. get requested candles ( 100*tick_timeframe/timeframe )
 * 3. update series using available data.
 * 4. puase and start button ( default all things are stopped.)
 * 5. date picker or using scroller change date..
 **/
//const bar = nextBar();
//candleSeries.update(bar);
//volumeSeries.update(bar);
//}


resize();
let maininterval = setInterval(() => {
    if(storage_bars.length<2){
    storage_bars = check_bar_storage(storage_bars)}
    else {
        const bar = nextBar();
        console.log(bar.time)
        console.log("start time: ", config['startTime'], bar)

        if (debug) {
            console.log("storage bars: ", storage_bars, "bar", bar)
        }
        candleSeries.update(bar);
    }


    //volumeSeries.update(bar);
}, config["delay"]);

window.addEventListener("resize", resize, false);

function resize() {
    chart.applyOptions({width: window.innerWidth, height: window.innerHeight});
    setTimeout(() => chart.timeScale().fitContent(), 0);
}

// buttons listeners
let play_button = document.getElementById("play_btn");
play_button.addEventListener("click", function () {
    maininterval = setInterval(() => {
        const bar = nextBar();
        candleSeries.update(bar);
        //volumeSeries.update(bar);
    }, config["delay"]);
});
let pause_button = document.getElementById("pause_btn");
pause_button.addEventListener("click", function () {
    clearInterval(maininterval);
});

let increase_button = document.getElementById("increase");

increase_button.addEventListener("click", function () {
    clearInterval(maininterval);
    config["delay"] -= 100;
    if (debug) {
        console.log(config["delay"]);
    }
    maininterval = setInterval(() => {
        const bar = nextBar();
        candleSeries.update(bar);
        volumeSeries.update(bar);
    }, config["delay"]);
});

let decrease_button = document.getElementById("decrease");
decrease_button.addEventListener("click", function () {
    clearInterval(maininterval);
    config["delay"] += 100;
    if (debug) {
        console.log(config["delay"]);
    }
    maininterval = setInterval(() => {
        //const bar = nextBar();
        //candleSeries.update(bar);
        //volumeSeries.update(bar);
    }, config["delay"]);
});

function check_bar_storage(storage) {
    if (storage.length < 2) {
        if (debug) {
            console.log("[Storege Empty] storege is empty. try to fill history")
        }
        const urlParameters = {
            symbol: config["symbol"],
            interval: config["interval"],
            startTime: config["startTime"]
        };
        const query = Object.keys(urlParameters)
            .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
            .join("&");
        var url = `https://fapi.binance.com/fapi/v1/klines?${query}`;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                const tempdata = JSON.parse(this.responseText);
                if (debug) {
                    console.log("[Storege Empty] getting bars from server.")
                }
                for (let i = 0; i < tempdata.length; i++) {
                    let ts = new Date(parseInt(tempdata[i][0]))
                    let v = {
                        //timestamp:parseInt(tempdata[i][0]),
                        /*time: {
                            year: ts.getFullYear(),
                            month: ts.getMonth(),
                            day: ts.getDate(),
                        }*/
                        time:ts,
                        open: parseFloat(tempdata[i][1]),
                        high: parseFloat(tempdata[i][2]),
                        low: parseFloat(tempdata[i][3]),
                        close: parseFloat(tempdata[i][4]),
                        volume: parseFloat(tempdata[i][5]),
                        color: tempdata[i][4]<tempdata[i][1]
                            ? "rgba(255, 128, 159, 0.25)"
                            : "rgba(107, 255, 193, 0.25)"
                    };
                    storage.push(v);
                }

            }
        }
        xhr.send();

    }
    return storage
}

function nextBar() {
    if (debug) {
        console.log("[nextBar called ]", "storage bars : ", storage_bars)
    }

    //  we should construct new bar and release it
    // update config starttime
    // update played bars
    // remove item from storagebars

    let new_bar = storage_bars[0];
    nextBar.date = new Date(new_bar.timestamp);
    nextBar.bar = {
        time:new_bar.time,
        open:new_bar.open,
        high:new_bar.high,
        low:new_bar.low,
        close:new_bar.close,


    }
    config['startTime'] = new_bar.timestamp*1000
    played_bars.push(new_bar)
    storage_bars.shift()
    return nextBar.bar
}

