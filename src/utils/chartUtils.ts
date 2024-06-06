import Chart from 'chart.js/auto';
import { getWaveDirection } from './surfUtils';

// Create a vertical line on hover
const verticalHover = {
    id: 'verticalHoverLine',
    afterDraw: function(chart:any) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const { ctx, tooltip } = chart;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;

            ctx.save();

            ctx.beginPath();
            ctx.strokeStyle = 'rgb(0, 166, 255)';
            ctx.lineWidth = 2;
            ctx.moveTo(x, chart.chartArea.top);
            ctx.lineTo(x, chart.chartArea.bottom);
            ctx.stroke();

            ctx.restore();
        }
    }
};

// Creates the following chart with the dataset as input
export const createSwellEnergyChart = async (swellEnergyData:any) => {
    await (async function() {
        const data = swellEnergyData;

        new Chart(
            document.getElementById('swellEnergy'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => `${(1 / row.freq).toFixed(2)}s`),
                    datasets: [
                        {
                            label: 'Swell Energy (m^2/Hz) vs. Period (Seconds)',
                            data: data.map(row => row.spec.toFixed(2)),
                            pointHoverBackgroundColor: 'rgb(0, 119, 255)',
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 10
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [verticalHover]
            }
        );
    })();
}

// Creates the following chart with the dataset as input
export const createTideChart = async (tidePredictions:any, tideStation:string) => {
    await (async function() {
        const data = tidePredictions;

        let max = 0;
        let min = 0;

        data.forEach((point) => {
            if (Number(point.attributes.v) > max) {
                max = Number(point.attributes.v).toFixed(2);
            }
            if (Number(point.attributes.v) < min) {
                min = Number(point.attributes.v).toFixed(2);
            }
        })

        function customRadius(context) {
            let size = 0;
            let index = context.dataIndex;
            let value = context.dataset.data[ index ];

            if (value == max) {
                size = 4;
            } 

            if (value == min) {
                size = 4;
            }

            return size;
        }

        new Chart(
            document.getElementById('tideChart'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => `${new Date(row.attributes.t).getHours()}:00`),
                    datasets: [
                        {
                            label: `Tide Chart - ${tideStation}`,
                            data: data.map(row => Number(row.attributes.v).toFixed(2)),
                            fill: 'start',
                            pointBackgroundColor: 'blue',
                            pointHoverBackgroundColor: 'lime',
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 8
                            }
                        }, 
                        y: {
                            beginAtZero: true,                           
                            ticks: {
                                callback: function(value) {
                                    return value + ' Ft.';
                                }
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: customRadius
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [verticalHover]
            }
        );
    })();
}

// Creates the following chart with the dataset as input
export const createWaveForecastChart = async (waveForecastData:any) => {
    await (async function() {
        const data = waveForecastData;
        let max = 12;

        waveForecastData.forEach((swell) => {
            if (swell.sWVHT * 3.281 > max) {
                max = Math.ceil(swell.sWVHT * 3.281) + 6;
            }
        });

        console.log(data)

        // Append additional swell data to tooltip
        const createFooter = (context) => {
            let index = context[0].dataIndex;

            let swell1HeightValue = context[0].dataset.swell1Height[index];
            let swell1DirValue = context[0].dataset.swell1Dir[index];
            let swell1PeriodValue = context[0].dataset.swell1Period[index];

            let swell2HeightValue = context[0].dataset.swell2Height[index];
            let swell2DirValue = context[0].dataset.swell2Dir[index];
            let swell2PeriodValue = context[0].dataset.swell2Period[index];

            let swellCompStr1 = `${swell1HeightValue} ft. @ ${swell1PeriodValue}s ${getWaveDirection(swell1DirValue)} ${swell1DirValue}°`;
            let swellCompStr2 = `${swell2HeightValue} ft. @ ${swell2PeriodValue}s ${getWaveDirection(swell2DirValue)} ${swell2DirValue}°`;

            return `Swell Components\n${swellCompStr1}\n${swellCompStr2}`;
        }


        const poor = (ctx, value) => ctx.p0.parsed.y < 4 ? value : undefined;
        const fair = (ctx, value) => ctx.p0.parsed.y >= 4  ? value : undefined;

        new Chart(
            document.getElementById('forecastChart'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => row.day),
                    datasets: [
                        {
                            label: 'Forecasted Wave Height - NOAA WW3 GFS Model',
                            data: data.map(row => (row.sWVHT * 3.281).toFixed(2)),
                            swell1Height: data.map(row => (row.swell1Height * 3.281).toFixed(2)),
                            swell1Dir: data.map(row => row.swell1Dir),
                            swell1Period: data.map(row => row.swell1Period),
                            swell2Height: data.map(row => (row.swell2Height * 3.281).toFixed(2)),
                            swell2Dir: data.map(row => row.swell2Dir),
                            swell2Period: data.map(row => row.swell2Period),
                            fill: 'start',
                            pointHoverBackgroundColor: 'rgb(0, 119, 255)',
                            segment: {
                                backgroundColor: ctx => poor(ctx, 'rgba(208, 20, 20, 0.505)') || fair(ctx, 'rgba(14, 174, 14, 0.566)'),
                                borderColor: ctx => poor(ctx, 'rgba(208, 20, 20, 0.505)') || fair(ctx, 'rgba(14, 174, 14, 0.566)')
                            }
                        }
                    ]
                },
                options: {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                footer: createFooter
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 20
                            },
                            grid: {
                                lineWidth: 1
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: max,
                            ticks: {
                                callback: function(value) {
                                    return value + ' Ft.';
                                }
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 0,
                            hoverRadius: 6
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [verticalHover]
            }
        );
    })();
}