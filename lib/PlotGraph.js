// set global variables
const limit = 10000; // How many points can be on the graph before sliding occurs
const refreshInterval = 100; // Time between refresh intervals

// set functions to retrieve
function getData0() {
	//console.log(statistics[0].count);
	return statistics[0].count;
	}
function getData1() {
	return statistics[1].count;
	}
function getData2() {
	return statistics[2].count;
}
function getData3() {
	return statistics[3].count;
	}
function getData4() {
	return statistics[4].count;
	}
function getData5() {
	return statistics[5].count;
	}
function getTime() {
	//console.log(statistics[6].count);
	//console.log(currentTime);
	return statistics[6].count;
}

// set chart layout
const layout0 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Cumulative Dengue Cases'}
	};

const layout1 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Active Dengue Cases'}
	};

const layout2 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Max Active Dengue Cases'}
};

const layout3 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Total Mosquito Population'}
};

const layout4 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Infected Mosquito Population'}
};

const layout5 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Max Infected Mosquitoes'}
};

// plot all charts
/* Plotly.plot('chart0',[{
	x:[getTime()],
	y:[getData0()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
	}], layout0); */

Plotly.plot('chart1',[{
	x:[getTime()],
	y:[getData1()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
	}], layout1);

/* Plotly.plot('chart2',[{
	x:[getTime()],
	y:[getData2()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
}], layout2); */

Plotly.plot('chart3',[{
	x:[getTime()],
	y:[getData3()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout3);

Plotly.plot('chart4',[{
	x:[getTime()],
	y:[getData4()],
	mode:'lines',
	line: {
		color: 'rgb(0,0,255)',
		width: 3 }
}], layout4);

/* Plotly.plot('chart5',[{
	x:[getTime()],
	y:[getData5()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout5); */



//Plotly.newPlot("chart0", statistics,layout0);
//Plotly.newPlot("chart1", statistics,layout1);

// set refresh interval and graph limit
var cnt = 0;
setInterval(function(){

	if (isRunning == true) {

		/* Plotly.extendTraces('chart0',{ x:[[getTime()]],y:[[getData0()]]}, [0]);
		cnt++;
		if(cnt > limit) {
			Plotly.relayout("chart0", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			} */
		Plotly.extendTraces('chart1',{ x:[[getTime()]], y:[[getData1()]]}, [0]);
		cnt++;
		if(cnt > limit) {
			Plotly.relayout("chart1", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
		/* Plotly.extendTraces('chart2',{ x:[[getTime()]], y:[[getData2()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart2", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			} */

			Plotly.extendTraces('chart3',{ x:[[getTime()]], y:[[getData3()]]}, [0]);
			if(cnt > limit) {
				Plotly.relayout("chart3", {
					xaxis: {
						range: [cnt-limit,cnt]
						}
					});
				}

				Plotly.extendTraces('chart4',{ x:[[getTime()]], y:[[getData4()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart4", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
	/* 		Plotly.extendTraces('chart5',{ x:[[getTime()]], y:[[getData5()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart5", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			} */
	}
	else if (currentTime == 0) {
		/* console.log("redraw"); */
;		/* Plotly.newPlot('chart0',[{
			x:[getTime()],
			y:[getData0()],
			mode:'lines',
			line: {
				color: 'rgb(255,0,255)',
				width: 3 }
			}], layout0); */

		Plotly.newPlot('chart1',[{
			x:[getTime()],
			y:[getData1()],
			mode:'lines',
			line: {
				color: 'rgb(255,0,255)',
				width: 3 }
			}], layout1);

		/* Plotly.newPlot('chart2',[{
			x:[getTime()],
			y:[getData2()],
			mode:'lines',
			line: {
				color: 'rgb(255,0,255)',
				width: 3 }
		}], layout2); */

		Plotly.newPlot('chart3',[{
			x:[getTime()],
			y:[getData3()],
			mode:'lines',
			line: {
				color: 'rgb(255,0,0)',
				width: 3 }
		}], layout3);

		Plotly.newPlot('chart4',[{
			x:[getTime()],
			y:[getData4()],
			mode:'lines',
			line: {
				color: 'rgb(0,0,255)',
				width: 3 }
		}], layout4);

		/* Plotly.newPlot('chart5',[{
			x:[getTime()],
			y:[getData5()],
			mode:'lines',
			line: {
				color: 'rgb(255,0,0)',
				width: 3 }
		}], layout5); */

	}
},refreshInterval);
