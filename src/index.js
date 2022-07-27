import "./styles.css";
import { createChart, CrosshairMode } from "lightweight-charts";

let config = {
  delay: 10000,
  symbol: "BTCUSDT",
  interval: "5m",
  startTime: 1648230840000
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

/*const volumeSeries = chart.addHistogramSeries({
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
*/
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
  //console.log(bar)
  candleSeries.update(bar);
}, config["delay"]);

window.addEventListener("resize", resize, false);

function resize() {
  chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });

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
  console.log(config["delay"]);
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
  console.log(config["delay"]);
  maininterval = setInterval(() => {
    //const bar = nextBar();
    //candleSeries.update(bar);
    //volumeSeries.update(bar);
  }, config["delay"]);
});

function nextBar() {
  if (storage_bars.length === 0) {
    // it means nothing has started => we should build some history ( 1000 bars in enought)
    const urlParameters = {
      symbol: config["symbol"],
      interval: config["interval"],
      endTime: config["startTime"]
    };
    //console.log(time * 1000)
    const query = Object.keys(urlParameters)
      .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join("&");

    var url = `https://fapi.binance.com/fapi/v1/klines?${query}`;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        const tempdata = JSON.parse(this.responseText);
        //console.log(tempdata)

        let last_candle = tempdata.pop();
        let d = new Date(parseInt(last_candle[0]));
        nextBar.bar.time = d.getTime();
        nextBar.date = d.getDate();
        nextBar.bar.time = last_candle[0];
        nextBar.bar.open = last_candle[1];
        nextBar.bar.high = last_candle[2];
        nextBar.bar.low = last_candle[3];
        nextBar.bar.close = last_candle[4];
        tempdata.forEach((el) => {
          let v = {
            time: el[0],
            open: el[1],
            high: el[2],
            low: el[3],
            close: el[4]
          };
          played_bars.push(v);
        });
        candleSeries.setData = played_bars;
        return nextBar.bar;
      }
    };
    xhr.send();

    //addCandlestickSeries.setData
  } else if (storage_bars.length === 1) {
    // it means the series started to play but it run out of bars for playing . we should add new bars.
    const urlParameters = {
      symbol: config["symbol"],
      interval: config["interval"],
      startTime: config["startTime"]
    };
    //console.log(time * 1000)
    const query = Object.keys(urlParameters)
      .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join("&");

    var url = `https://fapi.binance.com/fapi/v1/klines?${query}`;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        const tempdata = JSON.parse(this.responseText);
        tempdata.forEach((el) => {
          let v = {
            time: el[0],
            open: el[1],
            high: el[2],
            low: el[3],
            close: el[4]
          };
          storage_bars.push(v);
        });
        let first_candle = storage_bars.shift();
        played_bars.push(first_candle);
        let d = new Date(parseInt(first_candle[0]));
        nextBar.bar.time = d.getTime();
        nextBar.date = d.getDate();
        nextBar.bar.open = first_candle[1];
        nextBar.bar.high = first_candle[2];
        nextBar.bar.low = first_candle[3];
        nextBar.bar.close = first_candle[4];
      }
    };
    return nextBar.bar;
  } else {
    let first_candle = storage_bars.shift();
    played_bars.push(first_candle);
    let d = new Date(parseInt(first_candle[0]));
    nextBar.bar.time = d.getTime();
    nextBar.date = d.getDate();
    nextBar.bar.time = first_candle[0];
    nextBar.bar.open = first_candle[1];
    nextBar.bar.high = first_candle[2];
    nextBar.bar.low = first_candle[3];
    nextBar.bar.close = first_candle[4];

    return nextBar.bar;
  }
}

/**
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
 **/
