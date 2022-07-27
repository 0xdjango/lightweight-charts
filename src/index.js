import "./styles.css";
import { createChart, CrosshairMode } from "lightweight-charts";

let config = {
  delay: 3000,
  symbol: "BTCUSDT",
  interval: "5m",
  startTime: 1648230840000
};

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

/**for (let i = 0; i < 150; i++) {
  
   * 1. get configuration ( start time, speed, tick_timeframe, symbol, candle timeframe)
   * 2. get requested candles ( 100*tick_timeframe/timeframe )
   * 3. update series using available data.
   * 4. puase and start button ( default all things are stopped.)
   * 5. date picker or using scroller change date..
   * 
  const bar = nextBar();
  candleSeries.update(bar);
  volumeSeries.update(bar);
}
**/

resize();

let maininterval = setInterval(() => {
  const bar = nextBar();
  candleSeries.update(bar);
  volumeSeries.update(bar);
}, config["delay"]);

window.addEventListener("resize", resize, false);

function resize() {
  chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });

  setTimeout(() => chart.timeScale().fitContent(), 0);
}
function nextbar() {
  let barstorage = [];
  const urlParameters = {
    symbol: config["symbol"],
    interval: config["interval"],
    endTime: config["startTime"]
  };
  //console.log(time * 1000)
  const query = Object.keys(urlParameters)
    .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
    .join("&");

  var xhr = new XMLHttpRequest();
  var url = `https://fapi.binance.com/fapi/v1/klines?${query}`;
  xhr.open("GET", url, true);
}

// buttons listeners
let play_button = document.getElementById("play_btn");
play_button.addEventListener("click", function () {
  maininterval = setInterval(() => {
    const bar = nextBar();
    candleSeries.update(bar);
    volumeSeries.update(bar);
  }, 1000);
});
let pause_button = document.getElementById("pause_btn");
pause_button.addEventListener("click", function () {
  clearInterval(maininterval);
});

let increase_button = document.getElementById("increase");
increase_button.addEventListener("click", function () {
  maininterval = setInterval(() => {
    const bar = nextBar();
    candleSeries.update(bar);
    volumeSeries.update(bar);
  }, config["delay"] - 100);
});

let decrease_button = document.getElementById("decrease");
decrease_button.addEventListener("click", function () {
  maininterval = setInterval(() => {
    const bar = nextBar();
    candleSeries.update(bar);
    volumeSeries.update(bar);
  }, config["delay"] + 100);
});

function nextBar() {
  if (!nextBar.date) nextBar.date = new Date(2020, 0, 0);
  if (!nextBar.bar) nextBar.bar = { open: 100, high: 104, low: 98, close: 103 };

  nextBar.date.setDate(nextBar.date.getDate() + 1);
  nextBar.bar.time = {
    year: nextBar.date.getFullYear(),
    month: nextBar.date.getMonth() + 1,
    day: nextBar.date.getDate()
  };

  let old_price = nextBar.bar.close;
  let volatility = 0.1;
  let rnd = Math.random();
  let change_percent = 2 * volatility * rnd;

  if (change_percent > volatility) change_percent -= 2 * volatility;

  let change_amount = old_price * change_percent;
  nextBar.bar.open = nextBar.bar.close;
  nextBar.bar.close = old_price + change_amount;
  nextBar.bar.high =
    Math.max(nextBar.bar.open, nextBar.bar.close) +
    Math.abs(change_amount) * Math.random();
  nextBar.bar.low =
    Math.min(nextBar.bar.open, nextBar.bar.close) -
    Math.abs(change_amount) * Math.random();
  nextBar.bar.value = Math.random() * 100;
  nextBar.bar.color =
    nextBar.bar.close < nextBar.bar.open
      ? "rgba(255, 128, 159, 0.25)"
      : "rgba(107, 255, 193, 0.25)";

  return nextBar.bar;
}
