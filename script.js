const socketBaseURL = 'wss://stream.binance.com:9443/ws/';
let socket;
let chart;

document.addEventListener('DOMContentLoaded', function () {
    const cryptoToggle = document.getElementById('crypto-toggle');
    const timeframeToggle = document.getElementById('timeframe-toggle');

    cryptoToggle.addEventListener('change', () => {
        const selectedCoin = cryptoToggle.value;
        const selectedInterval = timeframeToggle.value;
        updateChart(selectedCoin, selectedInterval);
    });

    timeframeToggle.addEventListener('change', () => {
        const selectedCoin = cryptoToggle.value;
        const selectedInterval = timeframeToggle.value;
        updateChart(selectedCoin, selectedInterval);
    });

    initChart();
    updateChart(cryptoToggle.value, timeframeToggle.value);
});

function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Candlestick Data',
                data: []
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    ticks: {
                        color: '#333'
                    },
                    grid: {
                        color: '#ccc'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#333',
                        callback: function(value) {
                            return value.toFixed(4); // Format y-axis values to 4 decimal places
                        }
                    },
                    grid: {
                        color: '#ccc'
                    }
                }
            },
            elements: {
                candlestick: {
                    barThickness: 3, // Reduce this value to make candles thinner
                    color: {
                        up: '#00ff00',
                        down: '#ff0000',
                        unchanged: '#999999'
                    },
                    wickColor: {
                        up: '#00ff00',
                        down: '#ff0000',
                        unchanged: '#999999'
                    }
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const o = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].o;
                        const h = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].h;
                        const l = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].l;
                        const c = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].c;
                        return `O: ${o} H: ${h} L: ${l} C: ${c}`;
                    }
                }
            }
        }
    });
}

function updateChart(symbol, interval) {
    if (socket) {
        socket.close();
    }

    const wsURL = `${socketBaseURL}${symbol}@kline_${interval}`;
    socket = new WebSocket(wsURL);

    socket.onopen = function () {
        console.log('WebSocket connection opened');
    };

    socket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        const candlestick = message.k;

        if (candlestick && candlestick.t) {
            const candlestickData = {
                x: new Date(candlestick.t),
                o: parseFloat(candlestick.o).toFixed(4),
                h: parseFloat(candlestick.h).toFixed(4),
                l: parseFloat(candlestick.l).toFixed(4),
                c: parseFloat(candlestick.c).toFixed(4)
            };

            const storedData = retrieveChartData(symbol) || [];
            storedData.push(candlestickData);
            storeChartData(symbol, storedData);

            chart.data.datasets[0].data = storedData;
            chart.update();
        } else {
            console.log('Invalid candlestick data:', candlestick);
        }
    };

    socket.onclose = function () {
        console.log('WebSocket connection closed');
    };

    socket.onerror = function (error) {
        console.log('WebSocket error:', error);
    };
}

function storeChartData(symbol, data) {
    localStorage.setItem(symbol, JSON.stringify(data));
}

function retrieveChartData(symbol) {
    return JSON.parse(localStorage.getItem(symbol));
}
