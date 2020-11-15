// set global variables
const limit = 10000; // How many points can be on the graph before sliding occurs
const refreshInterval = 100; // Time between refresh intervals

// set functions to retrieve 
function getData0() {
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
	yaxis: {title: 'Current Active Dengue Cases'}
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
Plotly.plot('chart0',[{
	y:[getData0()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
	}], layout0);

Plotly.plot('chart1',[{
	y:[getData1()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
	}], layout1);

Plotly.plot('chart2',[{
	y:[getData2()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,255)',
		width: 3 }
}], layout2);	

Plotly.plot('chart3',[{
	y:[getData3()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout3);

Plotly.plot('chart4',[{
	y:[getData4()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout4);

Plotly.plot('chart5',[{
	y:[getData5()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout5);

// set refresh interval and graph limit
var cnt = 0;
setInterval(function(){
	if (isRunning == true) {

		Plotly.extendTraces('chart0',{ y:[[getData0()]]}, [0]);
		cnt++;
		if(cnt > limit) {
			Plotly.relayout("chart0", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
		Plotly.extendTraces('chart1',{ y:[[getData1()]]}, [0]);
		cnt++;
		if(cnt > limit) {
			Plotly.relayout("chart1", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
		Plotly.extendTraces('chart2',{ y:[[getData2()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart2", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}

			Plotly.extendTraces('chart3',{ y:[[getData3()]]}, [0]);
			if(cnt > limit) {
				Plotly.relayout("chart3", {
					xaxis: {
						range: [cnt-limit,cnt]
						}
					});
				}
				
				Plotly.extendTraces('chart4',{ y:[[getData4()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart4", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
			Plotly.extendTraces('chart5',{ y:[[getData5()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart5", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
	}},refreshInterval);
	
