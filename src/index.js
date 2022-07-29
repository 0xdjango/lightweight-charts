import "./styles.css";
import {createChart, CrosshairMode} from "lightweight-charts";

/**
 * 1. chart will load based on default ts.
 * 2. if user wants, can change starting ts using go to ts and input box.
 * 3. user can pause the replay using pause button
 *
 *
 *
 *
 *
 **/
var config = {
    delay: 1000  ,
    symbol: "BTCUSDT",
    interval: "15m",
    filling_interval: "1m",
    startTime: 1618862900000,
    limit: 1000,
    debug : false,
    played_bars: [],
    storage_bars : [],
    temp_storage:[],
    main_interval:setInterval(() => {})
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.has('startTime')){
    config['startTime'] = urlParams.get('startTime');
}
if(urlParams.has('symbol')){
    config['symbol'] = urlParams.get('symbol');
}
if(urlParams.has('timeframe')){
    config['interval'] = urlParams.get('timeframe');
}



export async function makeApiRequest(path) {
    try {
        const response = await fetch(`${path}`);
        return response.json();
    } catch (error) {
        throw new Error(`Request Error: ${error.status}`);
    }
}







const chart = createChart(document.getElementById('chart'), {
    width: window.innerWidth*0.95,
    height: window.innerHeight*0.89,
    layout: {
        backgroundColor: "#dfdfdf"
    },
    grid: {
        vertLines: {
            color: "#cccccc"
        },
        horzLines: {
            color: "#cccccc"
        }
    },
    crosshair: {
        mode: CrosshairMode.Normal
    },

    timeScale: {

        timeVisible:true,
        borderColor: "#485158"
    },
    watermark: {
        text: config['symbol'] + " " + config['interval'],
        fontSize: 64,
        color: "rgba(85,3,3,0.1)",
        visible: true
    }
});
chart.timeScale().fitContent();


const candleSeries = chart.addCandlestickSeries({
    upColor: "#1f867d",
    downColor: "#e65350",
    borderDownColor: "#131722",
    borderUpColor: "#131722",
    wickDownColor: "#131722",
    wickUpColor: "#131722"
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


//resize();
// initialization getting history (200-500) candles and future 1000 candles make chart and wait for play command
function init(ts) {
    const urlParameters = {
        symbol: config["symbol"],
        interval: config["interval"],
        endTime: ts,
        limit: 500
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
            if (config['debug']) {
                console.log("[init] making history of candles.")
            }
            let history_bars = []
            for (let i = 0; i < tempdata.length -1; i++) {  // -1 is for updating realtime data. without it nothing will updated.
                let ts =parseInt(tempdata[i][0])/1000
                let v = {
                    //timestamp:parseInt(tempdata[i][0]),
                    /*time: {
                        year: ts.getFullYear(),
                        month: ts.getMonth(),
                        day: ts.getDate(),
                    }*/
                    time: ts ,
                    open: parseFloat(tempdata[i][1]),
                    high: parseFloat(tempdata[i][2]),
                    low: parseFloat(tempdata[i][3]),
                    close: parseFloat(tempdata[i][4]),
                    volume: parseFloat(tempdata[i][5]),
                    color: tempdata[i][4] < tempdata[i][1]
                        ? "rgba(255, 128, 159, 0.25)"
                        : "rgba(107, 255, 193, 0.25)"
                };
                history_bars.push(v);

            }

            config['played_bars'] = history_bars;
            console.log("played_bars:inside:",config['played_bars'])
            candleSeries.setData(history_bars);


        }
    }
    xhr.send();


    const urlParameters1 = {
        symbol: config["symbol"],
        interval: config["interval"],
        startTime: ts,
        limit: 1000
    };
    const query1 = Object.keys(urlParameters1)
        .map((name) => `${name}=${encodeURIComponent(urlParameters1[name])}`)
        .join("&");
    var url1 = `https://fapi.binance.com/fapi/v1/klines?${query1}`;
    var xhr1 = new XMLHttpRequest();
    xhr1.open("GET", url1, true);
    xhr1.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const tempdata1 = JSON.parse(this.responseText);
            if (config['debug']) {
                console.log("[init] making history of candles.")
            }
            for (let i = 0; i < tempdata1.length -1; i++) {  // -1 is for updating realtime data. without it nothing will updated.
                let ts =parseInt(tempdata1[i][0])/1000
                let v = {
                    //timestamp:parseInt(tempdata[i][0]),
                    /*time: {
                        year: ts.getFullYear(),
                        month: ts.getMonth(),
                        day: ts.getDate(),
                    }*/
                    time: ts,
                    open: parseFloat(tempdata1[i][1]),
                    high: parseFloat(tempdata1[i][2]),
                    low: parseFloat(tempdata1[i][3]),
                    close: parseFloat(tempdata1[i][4]),
                    volume: parseFloat(tempdata1[i][5]),
                    color: tempdata1[i][4] < tempdata1[i][1]
                        ? "rgba(255, 128, 159, 0.25)"
                        : "rgba(107, 255, 193, 0.25)"
                };

                config['storage_bars'].push(v)
            }

        }
    }
    xhr1.send();



}




// make history bars
init(config['startTime'])


console.log("storage_bars:",config['storage_bars'])
console.log("played_bars:",config['played_bars'])



// buttons listeners
let play_button = document.getElementById("play_btn");
play_button.addEventListener("click", function () {
    clearInterval(config['main_interval'])
    config['main_interval'] = setInterval(() => {
        const bar = nextBar();
        if (bar.time > config['played_bars'].at(-2).time) {
            config['played_bars'].push(bar)
            candleSeries.update(bar)
        }
        else{
            console.log(bar.time, config['played_bars'].at(-2).time)
        }
        //volumeSeries.update(bar);
    }, config["delay"]);
});


let pause_button = document.getElementById("pause_btn");
pause_button.addEventListener("click", function () {
    console.log("clearing:", config['main_interval']);
    clearInterval(config['main_interval']);
});

let slider = document.getElementById("customRange1")
slider.value = 5
slider.addEventListener("change",function (){
    //console.log(slider.value);
    config["delay"] = 1000*(5/slider.value)
    //console.log(config['delay'])
    clearInterval(config['main_interval'])
    config['main_interval'] = setInterval(() => {
        const bar = nextBar();
        if (bar.time > config['played_bars'].at(-2).time) {
            config['played_bars'].push(bar)
            candleSeries.update(bar)
        }
        else{
            console.log(bar.time, config['played_bars'].at(-2).time)
        }
        //volumeSeries.update(bar);
    }, config["delay"]);

});

let prev_bar = document.getElementById("prevbar");
prev_bar.addEventListener("click", function () {

    if(config['played_bars'].length>0){
        config['storage_bars'].unshift(config['played_bars'].at(-1))
        config['played_bars'].pop()
        candleSeries.setData(config['played_bars'])
    }
});
let next_bar = document.getElementById("nextbar");
next_bar.addEventListener("click", function () {
    if(config['storage_bars'].length>0){
        config['played_bars'].push(config['storage_bars'].at(0))
        config['storage_bars'].shift()
        candleSeries.setData(config['played_bars'])
    }


});



function nextBar() {
    if (config['debug']) {
        console.log("[nextBar called ]", "storage bars : ", config['storage_bars'])
    }

    if (config['storage_bars'].length < 2) {
        const urlParameters = {
            symbol: config["symbol"],
            interval: config["interval"],
            startTime: config['startTime'],
            limit: config['limit']
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
                if (config['debug']) {
                    console.log("[Storege Empty] getting bars from server.")
                }
                console.log(tempdata[0])
                for (let i = 0; i < tempdata.length; i++) {
                    let ts = parseInt(tempdata[i][0])/1000
                    let v = {

                        time: ts ,
                        open: parseFloat(tempdata[i][1]),
                        high: parseFloat(tempdata[i][2]),
                        low: parseFloat(tempdata[i][3]),
                        close: parseFloat(tempdata[i][4]),
                        volume: parseFloat(tempdata[i][5]),
                        color: tempdata[i][4] < tempdata[i][1]
                            ? "rgba(255, 128, 159, 0.25)"
                            : "rgba(107, 255, 193, 0.25)"
                    };
                    config['storage_bars'].push(v);
                }

            }
        }
        xhr.send();
        let new_bar = config['storage_bars'][0]
        config['startTime'] = new_bar.time
        nextBar.bar = {
            time: new_bar.time,
            open: new_bar.open,
            high: new_bar.high,
            low: new_bar.low,
            close: new_bar.close,
            color: new_bar.open < new_bar.close
                ? "rgba(255, 128, 159, 0.25)"
                : "rgba(107, 255, 193, 0.25)"

        }
        config['played_bars'].push(new_bar)
        config['storage_bars'].shift()
        return nextBar.bar

    } else {
        //  we should construct new bar and release it
        // update config starttime
        // update played bars
        // remove item from storagebars

        let new_bar = config['storage_bars'][0];
        //nextBar.date = new Date(new_bar.timestamp);
        nextBar.bar = {
            time: new_bar.time,
            open: new_bar.open,
            high: new_bar.high,
            low: new_bar.low,
            close: new_bar.close,


        }
        config['played_bars'].push(new_bar)
        config['startTime'] = new_bar.time
        config['storage_bars'].shift()

        return nextBar.bar
    }


}


var offsetTop = document.getElementById('row-floating').offset().top;
var actualWidth =document.getElementById('row-floating').width();
$(window).scroll(function() {
    if( window.scrollY >= offsetTop){
        $('.row-floating').css('position', 'fixed').css('top', 0).css('width',actualWidth);
    } else {
        $('.row-floating').css('position', 'relative').css('top', 'auto').css('width','auto');
    }
    });



