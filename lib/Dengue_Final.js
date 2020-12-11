var WINDOWBORDERSIZE = 10;
var HUGE = 999999; //Sometimes useful when testing for big or small numbers
var animationDelay = 300; //controls simulation and transition speed
var isRunning = false; // used in simStep and toggleSimStep
var surface; // Set in the redrawWindow function. It is the D3 selection of the svg drawing surface
var simTimer; // Set in the initialization function

//The drawing surface will be divided into logical cells
var maxCols = 48;
var cellWidth; //cellWidth is calculated in the redrawWindow function
var cellHeight; //cellHeight is calculated in the redrawWindow function

//You are free to change images to suit your purpose. These images came from flaticon.com.
// The copyright rules for flaticon.com require a backlink on any page where they appear.
// See the credits element on the html page for an example of how to comply with this rule.
const urlInfected = "images/infectedmosquito.png";
const urlNotInfected = "images/mosquito.png";

const urlHealthy = "images/People-Patient-Male-icon.png";
const urlSick = "images/infectedperson.png";

const urlTrap = "images/trap.png";
const urlWater = "images/water.png";

//a mosquito may be FLYING; or EXITED (i.e. left the system);
const FLYING=0;
const EXITED=1;

// a person may be HEALTHY; or SICK;
const HEALTHY=0;
const SICK=1;

// a water source may REMAIN or be EVAPORATED
const REMAIN = 0;
const EVAPORATED = 1;

// mosquitoes is a dynamic list, initially empty
mosquitoes = [];

// We can section our screen into different areas.
var srow=1
var nrow=Math.floor(maxCols/2.1-1)
var scol=1
var ncol=Math.floor(maxCols/2.1-1)

var areas =[
 {"label":"City","startRow":srow,"numRows":nrow+0.3,"startCol":scol,"numCols":ncol+1,"color":"#42884b"}
];

// At each simulation step we want to know how many active dengue cases, how many infected mosquitoes, total mosquito population etc.
var statistics = [
	// citizen stats
	{"name":"Cumulative Total Dengue Cases: ","location":{"row":srow+(nrow/1.5)+8,"col":scol+ncol-5},"count":0},
	{"name":"Current Active Dengue Cases: ","location":{"row":srow+(nrow/1.5)+9,"col":scol+ncol-5},"count":0},
	{"name":"Max Active Dengue Cases: ","location":{"row":srow+(nrow/1.5)+10,"col":scol+ncol-5},"count":0},
	// mosquito stats
	{"name":"Total Mosquito Population: ","location":{"row":srow+(nrow/1.5)+11,"col":scol+ncol-5},"count":0},
	{"name":"Infected Mosquito Population: ","location":{"row":srow+(nrow/1.5)+12,"col":scol+ncol-5},"count":0},
	{"name":"Max Infected Mosquitoes:  ","location":{"row":srow+(nrow/1.5)+13,"col":scol+ncol-5},"count":0},
  	{"name":"Current Time","location":{"row":srow+(nrow/1.5)+14,"col":scol+ncol-5},"count":0},
    ];

// prepare to store time-series data for output analysis
var activeDengueCases = '';
var totalMosquitoPopn = '';
var InfectedMosquitoPopn = '';

// We need to add buildings to the city. These buildings should be equally spaced from 3 to 3 cells.
// Buildings is a empty list
var Buildings = [];

//Function used to compute the coordinates of each building
// Compute feasible row coordinates and column coordinates
function range(start, end, step = 1) {
	let tracker = start;
	let outList = [];
	while(tracker <= end){
		outList.push(tracker);
		tracker += step;
	}
	return outList;
}

// create indexes of building positions
// building rows and columns
var rowBuildings = range(srow+1, srow+nrow-1, 3);
var colBuildings = range(scol+1, scol+ncol-1, 3);

// Create all possible combinations of building coordinates
function generateBuildings(rowList, colList){
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newbuilding ={"row":rowList[i], "col":colList[j]};
	    	Buildings.push(newbuilding);
		}
	}}

// buildings
generateBuildings(rowBuildings,colBuildings);

// define a function to select n random elements from an array; we will use this later
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

// Define density of each entity
// human density
var humanDensity = 0.5;

// trap density
var trapDensity = 0;

// water sources (for reproduction of mosquito) density
var waterDensity = 0.5;

// This variable defines what is the probability of a person getting bitten by a mosquito when they are on the same tile
var BitingRate=0.5;

// The rate of a mosquito spawning at a water source;
var SpawnRate = 0.5;

// The rate of a mosquito death when it encounters a trap
var TrapRate = 0.5;

//Function used to compute the coordinates of each person
// Compute feasible row coordinates and column coordinates
function generatePersons(rowList, colList, density=1){
	let zonePersons = [];
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newperson1 ={"location":{"row":rowList[i], "col":colList[j]},"state":HEALTHY, "id": String(rowList[i])+","+String(colList[j]), "timeInfected":0}; // position of top left square of a house
			var newperson2 ={"location":{"row":rowList[i], "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i])+","+String(colList[j]+1), "timeInfected":0}; // poistion of top right square of a house
			var newperson3 ={"location":{"row":rowList[i]+1, "col":colList[j]}, "state":HEALTHY, "id": String(rowList[i]+1)+","+String(colList[j]), "timeInfected":0}; // position of bottom left square of a house
			var newperson4 ={"location":{"row":rowList[i]+1, "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i]+1)+","+String(colList[j]+1), "timeInfected":0}; // position of bottom right square of a house
			zonePersons.push(newperson1);
			zonePersons.push(newperson2);
			zonePersons.push(newperson3);
			zonePersons.push(newperson4);
		}
	}
	// calculate the number of persons to generate based on set density
	let personsToGenerate = Math.floor(zonePersons.length*density);
	return getRandom(zonePersons,personsToGenerate);
}

// generate persons coordinates according to human density
persons = generatePersons(rowBuildings,colBuildings,humanDensity);

// create indexes of all positions; we will later filter this to get trap and water positions
// all possible indexes
var rowAll = range(srow, srow+nrow, 1);
var colAll = range(scol, scol+ncol, 1);

// Create all possible combinations of tile coordinates
function generateAll(rowList, colList){
	var zoneList = [];
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newindex ={"location":{"row":rowList[i], "col":colList[j]}, "id": String(rowList[i])+","+String(colList[j]), "state": REMAIN};
	    	zoneList.push(newindex);
		}
	}
	return zoneList;
}
// to be filtered
var allEmpty = generateAll(rowAll,colAll);

// expand list of building positions (to account for additional squares)
function expandBuildings(rowList, colList){
	let zoneBuildings = [];
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newbuilding1 ={"location":{"row":rowList[i], "col":colList[j]}, "id": String(rowList[i])+","+String(colList[j])}; // position of top left square of a house
			var newbuilding2 ={"location":{"row":rowList[i], "col":colList[j]+1}, "id": String(rowList[i])+","+String(colList[j]+1)}; // poistion of top right square of a house
			var newbuilding3 ={"location":{"row":rowList[i]+1, "col":colList[j]}, "id": String(rowList[i]+1)+","+String(colList[j])}; // position of bottom left square of a house
			var newbuilding4 ={"location":{"row":rowList[i]+1, "col":colList[j]+1}, "id": String(rowList[i]+1)+","+String(colList[j]+1)}; // position of bottom right square of a house
			zoneBuildings.push(newbuilding1);
			zoneBuildings.push(newbuilding2);
			zoneBuildings.push(newbuilding3);
			zoneBuildings.push(newbuilding4);
		}
	}
	return zoneBuildings;
}

// lists of expanded building positions in each zone
var expBuildings = expandBuildings(rowBuildings,colBuildings);


// filter out the empty tiles that can be used to generate water/traps
function remove_duplicates(a, b) {
	for (var i = 0, len = a.length; i < len; i++) {
        for (var j = 0, len2 = b.length; j < len2; j++) {
            if (a[i].id === b[j].id) {
                b.splice(j, 1); // remove a from b, based on id
                len2=b.length;
            }
        }
    }}

// we now have the available tile positions of each zone
remove_duplicates(expBuildings, allEmpty);

//Function used to compute the coordinates of each trap/water
// Compute feasible row coordinates and column coordinates
function splitTrapsWaters(zoneList, density=1){
	let obj = {};
	// randomly allocate half of the empty spaces to traps, the other half to water sources
	let zoneTraps = getRandom(zoneList, zoneList.length/2);
	let zoneWaters = zoneList.filter(f=>!zoneTraps.includes(f));
	obj[0] = zoneTraps;
	obj[1] = zoneWaters;
	return obj
}
// lists of possible positions for traps and water sources
var allTrapsWaters = splitTrapsWaters(allEmpty);
allTrapsAvail = allTrapsWaters[0];
allWatersAvail = allTrapsWaters[1];

//Function used to compute the coordinates of each trap/water
function generateTraps(trapList, density=1){
	// calculate the number of traps to generate in that zone based on set density
	let trapsToGenerate = Math.floor(trapList.length*density);
	return getRandom(trapList,trapsToGenerate);
}

// generate traps for each zone
Traps = generateTraps(allTrapsAvail,trapDensity);

// generate water sources for each zone
Waters = generateTraps(allWatersAvail,waterDensity);

// define a function to return ids of persons/water sources/traps in an array; we will use this in simulation step
function getID(inList){
	let outList = [];
	for (i=0; i<inList.length; i++){
		var obj = inList[i];
		var id = obj.id;
		outList.push(id);
	}
	return outList;
}

var currentTime = 0;

// The probability that water sources change (to simulate evaporation etc.)
var probChangeWater = 0.01;
var probChangeTrap = 0.02;

// How many infected mosquitoes to spawn at the start of the simulation
var startingMosquito = 10;


id=1;

// This next function is executed when the script is loaded. It contains the page initialization code.
(function() {
	// Your page initialization code goes here
	// All elements of the DOM will be available here
	window.addEventListener("resize", redrawWindow); //Redraw whenever the window is resized
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	// Initialize the slider bar to match the initial animationDelay;

	redrawWindow();
	setdefault();
})();

// We need a function to start and pause the simulation.
function toggleSimStep(){
	//this function is called by a click event on the html page.
	// Search BasicAgentModel.html to find where it is called.
	isRunning = !isRunning;
	console.log("isRunning: "+isRunning);
}

function redrawWindow(){
	isRunning = false; // used by simStep
	window.clearInterval(simTimer); // clear the Timer
	// overall tab
	animationDelay = 550 - document.getElementById("simspeed").value;
	// parameters
	humanDensity= document.getElementById("humandensity").value;
	BitingRate= document.getElementById("bitingrate").value;
	trapDensity= document.getElementById("trapdensity").value;
	TrapRate= document.getElementById("traprate").value;
	waterDensity= document.getElementById("waterdensity").value;
	SpawnRate = document.getElementById("spawnrate").value;

	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds

	// Re-initialize simulation variables
	currentTime = 0;
	statistics[0].count=0;
    statistics[1].count=0;
    statistics[2].count=0;
	statistics[3].count=0;
	statistics[4].count=0;
  	statistics[5].count=0;
  	statistics[6].count=0;


	// Initialize with several infected mosquitoes
	mosquitoes = [];
	for (i=0; i < startingMosquito; i++){addMosquito(0,0,initialize=true);}

	// entities
	persons = generatePersons(rowBuildings,colBuildings,density=humanDensity);
	Traps = generateTraps(allTrapsAvail,trapDensity);
	Waters = generateTraps(allWatersAvail,waterDensity);

	//resize the drawing surface; remove all its contents;
	var drawsurface = document.getElementById("surface");
	var creditselement = document.getElementById("credits");
	var w = window.innerWidth;
	var h = window.innerHeight;
	var surfaceWidth =(w - 3*WINDOWBORDERSIZE);
	var surfaceHeight= (h-creditselement.offsetHeight - 3*WINDOWBORDERSIZE);

	drawsurface.style.width = surfaceWidth+"px";
	drawsurface.style.height = surfaceHeight+"px";
	drawsurface.style.left = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.top = WINDOWBORDERSIZE/2+'px';
	//drawsurface.style.border = "thick solid #0000FF"; //The border is mainly for debugging; okay to remove it
	drawsurface.innerHTML = ''; //This empties the contents of the drawing surface, like jQuery erase().

	// Compute the cellWidth and cellHeight, given the size of the drawing surface
	numCols = maxCols;
	cellWidth = surfaceWidth/numCols;
	numRows = Math.ceil(surfaceHeight/cellWidth);
	cellHeight = surfaceHeight/numRows;

	// In other functions we will access the drawing surface using the d3 library.
	//Here we set the global variable, surface, equal to the d3 selection of the drawing surface
	surface = d3.select('#surface');
	surface.selectAll('*').remove(); // we added this because setting the inner html to blank may not remove all svg elements
	surface.style("font-size","100%");

	// rebuild contents of the drawing surface
	updateSurface();
};

// The window is resizable, so we need to translate row and column coordinates into screen coordinates x and y
function getLocationCell(location){
	var row = location.row;
	var col = location.col;
	var x = (col-1)*cellWidth; //cellWidth is set in the redrawWindow function
	var y = (row-1)*cellHeight; //cellHeight is set in the redrawWindow function
	return {"x":x,"y":y};
}

function updateSurface(){
	// This function is used to create or update most of the svg elements on the drawing surface.
	// See the function removeDynamicAgents() for how we remove svg elements

	// First, we would like to draw boxes around the different areas of our system. We can use d3 to do that too.

	//First a box representing the city
	var allareas = surface.selectAll(".areas").data(areas);
	var newareas = allareas.enter().append("g").attr("class","areas");
	// For each new area, append a rectangle to the group
	newareas.append("rect")
	.attr("x", function(d){return (d.startCol-1)*cellWidth;})
	.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
	.attr("width",  function(d){return d.numCols*cellWidth;})
	.attr("height",  function(d){return d.numRows*cellWidth;})
	.style("fill", function(d) { return d.color; })
	.style("stroke","black")
	.style("stroke-width",1);

	//Second, boxes representing the buildings
	var allbuildings = surface.selectAll(".Buildings").data(Buildings);
	var newbuildings = allbuildings.enter().append("g").attr("class","Buildings");
	newbuildings.append("rect")
	.attr("x", function(d){return (d.col-1)*cellWidth;})
	.attr("y",  function(d){return (d.row-1)*cellHeight;})
	// make each building a 2x2 box
	.attr("width",  function(d){return 2*cellWidth;})
	.attr("height",  function(d){return 2*cellWidth;})
	.style("fill", function(d) { return "#b07e00"; })
	.style("stroke","black")
	.style("stroke-width",1);


	// We would also like to populate the city

	//Select all svg elements of class "person" and map it to the data list called persons
	var allpersons = surface.selectAll(".person").data(persons);

	// Excess elements need to be removed:
	allpersons.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the persons array)

	// Create an svg group ("g") for each new entry in the data list; give it class "persons"
	var newpersons = allpersons.enter().append("g").attr("class","person");
	//Append an image element to each new person svg group, position it according to the location data, and size it to fill a cell
	// Also note that we can choose a different image to represent the person based on the person type
	newpersons.append("svg:image")
	.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	.attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	.attr("width", Math.min(cellWidth,cellHeight)+"px")
	.attr("height", Math.min(cellWidth,cellHeight)+"px")
	.attr("xlink:href",function(d){if (d.state==SICK) return urlSick; else return urlHealthy;});

	// For the existing persons, we want to update their appearance/location on the screen

	//First, we select the image elements in the allpersons list
	var images = allpersons.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
     .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
     .attr("xlink:href",function(d){if (d.state==SICK) return urlSick; else return urlHealthy;})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.


	// We would like to add traps in the city

	//Select all svg elements of class "trap" and map it to the data list called Traps
	var alltraps = surface.selectAll(".trap").data(Traps);

	// Excess elements need to be removed:
	alltraps.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the traps array)

	// Create an svg group ("g") for each new entry in the data list; give it class "trap"
	var newtraps = alltraps.enter().append("g").attr("class","trap");
	//Append an image element to each new trap svg group, position it according to the location data, and size it to fill a cell
	newtraps.append("svg:image")
	.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	.attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	.attr("width", Math.min(cellWidth,cellHeight)+"px")
	.attr("height", Math.min(cellWidth,cellHeight)+"px")
	.attr("xlink:href",function(d){return urlTrap;});


	// We would like to add water sources in the city

	//Select all svg elements of class "water" and map it to the data list called Waters
	var allwaters = surface.selectAll(".water").data(Waters);

	// Excess elements need to be removed:
	allwaters.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the waters array)

	// Create an svg group ("g") for each new entry in the data list; give it class "water"
	var newwaters = allwaters.enter().append("g").attr("class","water");
	//Append an image element to each new trap svg group, position it according to the location data, and size it to fill a cell
	newwaters.append("svg:image")
	.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	.attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	.attr("width", Math.min(cellWidth,cellHeight)+"px")
	.attr("height", Math.min(cellWidth,cellHeight)+"px")
	.attr("xlink:href",function(d){return urlWater;});


	// Finally we want to add mosquitoes

	//Select all svg elements of class "mosquito" and map it to the data list called mosquitoes
	var allmosquitoes = surface.selectAll(".mosquito").data(mosquitoes);

	// If the list of svg elements is longer than the data list, the excess elements are in the .exit() list
	// Excess elements need to be removed:
	allmosquitoes.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the mosquitoes array)

	// If the list of svg elements is shorter than the data list, the new elements are in the .enter() list.
	// The first time this is called, all the elements of data will be in the .enter() list.
	// Create an svg group ("g") for each new entry in the data list; give it class "mosquito"
	var newmosquitoes = allmosquitoes.enter().append("g").attr("class","mosquito");
	//Append an image element to each new mosquito svg group, position it according to the location data, and size it to fill a cell
	// Also note that we can choose a different image to represent the mosquito based on the mosquito type
	newmosquitoes.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href",function(d){if (d.type=="I") return urlInfected; else return urlNotInfected;});

	// For the existing mosquitoes, we want to update their location on the screen
	// but we would like to do it with a smooth transition from their previous position.
	// D3 provides a very nice transition function allowing us to animate transformations of our svg elements.

	//First, we select the image elements in the allmosquitoes list
	var images = allmosquitoes.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
     .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
     .attr("xlink:href",function(d){if (d.type=="I") return urlInfected; else return urlNotInfected;})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.

	var allstatistics = surface.selectAll(".statistics").data(statistics);
	var newstatistics = allstatistics.enter().append("g").attr("class","statistics");
	// For each new statistic group created we append a text label
	newstatistics.append("text")
	.attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth+110)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text("");
}


function addMosquito(currentrow,currentcol, initialize = true){
	// Mosquitoes are dynamic agents: they are spawned in the middle randomly, commute and then die
	// We have entering mosquitoes type "I" for initialization
	if (initialize){
			var homerow=10;
			var homecol=10;
			var targetrow=getRandom(rowAll,1);
			var targetcol=getRandom(colAll,1);
			var newmosquito = {"id":id++,"type":"I","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			statistics[3].count++; // total mosquito popn
			statistics[4].count++; // infected mosquito popn

	}
	// newly born mosquito from water sources are type "N"
	else{
			// specify a new target
			var homerow=currentrow-0.5;
			var homecol=currentcol-0.5;
			var targetrow=getRandom(rowAll,1);
			var targetcol=getRandom(colAll,1);
			var newmosquito = {"id":id++,"type":"N","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			statistics[3].count++; // total mosquito popn

	}
}

function updateMosquito(mosquitoIndex){
	//mosquitoIndex is an index into the mosquitoes data array
	mosquitoIndex = Number(mosquitoIndex);
	var mosquito = mosquitoes[mosquitoIndex];
	// get the current location of the mosquito
	var row = mosquito.location.row;
    var col = mosquito.location.col;
	var state = mosquito.state;
	var type = mosquito.type;

	// increase the age of the mosquito by one simulation step
	mosquito.timeAdmitted += 1;

	// determine if mosquito has arrived at the target
	var hasArrived = (Math.abs(mosquito.target.row-row)+Math.abs(mosquito.target.col-col))==0;

   	// Behavior of mosquito depends on its state
	switch(state){
		case FLYING:
			// kill the mosquito after at most 35 simulation steps
			if (mosquito.timeAdmitted >= 30+Math.random()*5){
				mosquito.state = EXITED;
				statistics[3].count--; // total mosquito popn
				if(mosquito.type == 'I'){
					statistics[4].count--; // infected mosquito popn
				}
			}
			else if (hasArrived){
				// resolve any special interactions with the current tile first
				var personToFind = String(row) + "," + String(col); // use the location of the mosquito to construct an id
				var validPersons = getID(persons); // array of possible persons ids
				var validTraps = getID(Traps); // array of possible trap ids
				var validWaters = getID(Waters);// array of possible water ids

				// if current location has a person
				if (validPersons.includes(personToFind)){
					// locate the index of corresponding person in persons list
					var wantedIndex = persons.findIndex(x => x.id == personToFind);
					if (Math.random() < BitingRate){
						// mosquito will bite the person
						// check if mosquito is infected ; if yes, and person is not sick, person falls sick
						if (mosquito.type == 'I'){
							if (persons[wantedIndex].state != SICK){
								persons[wantedIndex].state = SICK;
								statistics[0].count++; // cummtotal dengue cases
								statistics[1].count++; // current active dengue cases
							}
						}
						// else, check if person is sick; if yes, mosquito is infected
						else if(persons[wantedIndex].state==SICK){
							mosquito.type = 'I';
							statistics[4].count++; //infected mosquito popn
						}
					}}
				// if current location has a trap
				else if (validTraps.includes(personToFind)){
					if (Math.random()<TrapRate){
					// mosquito will be trapped and die
					mosquito.state = EXITED;
					statistics[3].count--; // total mosquito popn
					if(mosquito.type == 'I'){
						statistics[4].count--; // infected mosquito popn
					}
					}
				}
				// if current location has a water
				else if (validWaters.includes(personToFind)){
					// spawn a mosquito
					if (Math.random()<SpawnRate){
						addMosquito(row,col, initialize=false);
					}
				}
				// determine next target
				//Mosquito is still commuting// specifies a new target anywhere
				var targetrow=Math.floor(Math.random() * ((nrow+srow) - srow) +srow);
				var targetcol=Math.floor(Math.random() * ((ncol+scol) - scol) +scol);
				mosquito.target.row = targetrow;
				mosquito.target.col = targetcol;
			}
			// check if current location of mosquito is on any special tile
			else{
				var personToFind = String(row) + "," + String(col); // use the location of the mosquito to construct an id
				var validPersons = getID(persons); // array of possible persons ids
				var validTraps = getID(Traps); // array of possible trap ids
				var validWaters = getID(Waters);// array of possible water ids

				// if current location has a person
				if (validPersons.includes(personToFind)){
					// locate the index of corresponding person in persons list
					var wantedIndex = persons.findIndex(x => x.id == personToFind);
					if (Math.random() < BitingRate){
						// mosquito will bite the person
						// check if mosquito is infected ; if yes, and person is not sick; person falls sick
						if (mosquito.type == 'I'){
							if (persons[wantedIndex].state != SICK){
								persons[wantedIndex].state = SICK;
								statistics[0].count++; // cummtotal dengue cases
								statistics[1].count++; // current active dengue cases
							}
						}
						// else, check if person is sick; if yes, mosquito is infected
						else if(persons[wantedIndex].state==SICK){
							mosquito.type = 'I';
							statistics[4].count++; //infected mosquito popn
						}
					}}
				// if current location has a trap
				else if (validTraps.includes(personToFind)){
					if (Math.random()<TrapRate){
					// mosquito will be trapped and die
					mosquito.state = EXITED;
					statistics[3].count--; // total mosquito popn
					if(mosquito.type == 'I'){
						statistics[4].count--; // infected mosquito popn
					}
					}
				}
				// if current location has a water
				else if (validWaters.includes(personToFind)){
					// spawn a mosquito
					if (Math.random()<SpawnRate){
						addMosquito(row,col, initialize=false);
					}
				}}
			break;
		default:
        break;
	}

   // set the current row and column of the mosquito
   	// set the destination row and column
	var targetRow = mosquito.target.row;
	var targetCol = mosquito.target.col;
	// compute the distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// set the speed
	var cellsPerStep = 1;
	// compute the cell to move to
	var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
	var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo);
	// update the location of the mosquito
	mosquito.location.row = newRow;
	mosquito.location.col = newCol;

}

function updatePerson(personIndex){
	//personIndex is an index into the persons data array
	personIndex = Number(personIndex);
	var person = persons[personIndex];
	// get the current location of the person
	var row = person.location.row;
    var col = person.location.col;
	var state = person.state;

   	// Behavior of person depends on its state
	switch(state){
		case SICK:
			// increase the duration for which the person has been sick by 1 sim step
			person.timeInfected += 1;
			// person recovers from dengue after at most 42 simulation steps
			if (person.timeInfected > 15+Math.random()*27){
				person.state = HEALTHY;
				person.timeInfected = 0;
				statistics[1].count--; // current active dengue cases
			}
		break;
		default:
        break;
	}
}

function updateWaterSources(allWatersAvail){
	// update water sources for each zone
	if (Math.random()<probChangeWater){
		// set all current water sources to evaporated
		for (waterIndex in Waters){
			Waters[waterIndex].state = EVAPORATED;
		}
		// create new water puddles
		newWaters = generateTraps(allWatersAvail,waterDensity);
		// ensure the states of water sources are not evaporated
		for (waterIndex in newWaters){
			newWaters[waterIndex].state = REMAIN;
		}
		// add them to the water list
		Waters = Waters.concat(newWaters);
	}
}

function updateTraps(allTrapsAvail){
	// update traps for each zone
	if (Math.random()<probChangeTrap){
		// set all current traps to evaporated
		for (trapIndex in Traps){
			Traps[trapIndex].state = EVAPORATED;
		}
		// create new traps
		newTraps = generateTraps(allTrapsAvail,trapDensity);
		// ensure the states of traps are not evaporated
		for (trapIndex in newTraps){
			newTraps[trapIndex].state = REMAIN;
		}
		// add them to the water list
		Traps = Traps.concat(newTraps);
	}
}

function removeDynamicAgents(){
	// We need to remove mosquitoes who have died.
	//Select all svg elements of class "mosquito" and map it to the data list called mosquitoes
	var allmosquitoes = surface.selectAll(".mosquito").data(mosquitoes);
	//Select all the svg groups of class "mosquito" whose state is EXITED
	var exitedmosquitoes = allmosquitoes.filter(function(d,i){return d.state==EXITED;});
	// Remove the svg groups of EXITED mosquitoes: they will disappear from the screen at this point
	exitedmosquitoes.remove();

	// Remove the EXITED mosquitoes from the mosquitoes list using a filter command
	mosquitoes = mosquitoes.filter(function(d){return d.state!=EXITED;});
	// At this point the mosquitoes list should match the images on the screen one for one
	// and no mosquitoes should have state EXITED

	// We need to remove evaporated water sources
	var allwaters = surface.selectAll(".water").data(Waters);
	var exitedwaters = allwaters.filter(function(d,i){return d.state==EVAPORATED;});
	exitedwaters.remove();
	Waters = Waters.filter(function(d){return d.state!=EVAPORATED;});

	// remove all old traps
	var alltraps = surface.selectAll(".trap").data(Traps);
	var exitedtraps = alltraps.filter(function(d,i){return d.state==EVAPORATED;});
	exitedtraps.remove();
	Traps = Traps.filter(function(d){return d.state!=EVAPORATED;});
}

function updateDynamicAgents(){
	// loop over all the mosquitoes and update their states
	for (var mosquitoIndex in mosquitoes){
		updateMosquito(mosquitoIndex);
	}
	for (var personIndex in persons){
		updatePerson(personIndex);
	}
	updateWaterSources(allWatersAvail);
	updateTraps(allTrapsAvail);
	updateSurface();
}
function updateStats(){
	// update the output statistics at each simstep
	// check for max active dengue cases; update if it is smaller than current active cases
	if (statistics[2].count < statistics[1].count){
		statistics[2].count = statistics[1].count;
	}
	// check for max infected mosquitoes; update if it is smaller than current infected mosquitoes
	if (statistics[5].count < statistics[4].count){
		statistics[5].count = statistics[4].count;
	}
	for (var cnt = 0; cnt < 7; cnt++)
		$('#stats_' + cnt).text(statistics[cnt].count.toFixed(2));  //toFixed() sets the decimal place, this function appends the statistics count to the html text

	// update time-series data
	activeDengueCases = activeDengueCases + String(statistics[1].count) + ',';
	totalMosquitoPopn = totalMosquitoPopn + String(statistics[3].count) + ',';
	InfectedMosquitoPopn = InfectedMosquitoPopn + String(statistics[4].count) + ',';
}


function simStep(){
	//This function is called by a timer; if running, it executes one simulation step
	//The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ //the isRunning variable is toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
    	statistics[6].count++;

		// 10 new mosquitoes will be spawned periodically every 70 sim step (2x lifespan of mosquito)
		if (currentTime%70 == 0){
			for (i = 0; i<10; i++){addMosquito(0,0,initialize=true);}
		}

		// In the next function we update each agent
		updateDynamicAgents();

		// Sometimes agents will be removed in the following function
		removeDynamicAgents();

		updateStats();

		// output time-series data for analysis at 2000 sim steps
		if (currentTime == 2000){
			console.log("Cumulative Total Dengue Cases is: ");
			console.log(statistics[0].count);
			console.log("Active Dengue cases is: ");
			console.log(activeDengueCases);
			console.log("Max active dengue cases is: ");
			console.log(statistics[2].count);
			console.log("Total Mosquito Popn is: ");
			console.log(totalMosquitoPopn);
			console.log("Infected Mosquito Popn is: ");
			console.log(InfectedMosquitoPopn);
			console.log("Max infected mosquitoes is: ");
			console.log(statistics[5].count);
		}
	}
}
// define functions to change sliders to pre-set values on button press
function setdefault(){
	// humanDensity
	var hd_slider = document.getElementById("humandensity");
	var hd_output = document.getElementById("humandensity_val");
	hd_slider.value = 0.5; // original value
	hd_output.innerHTML = hd_slider.value; // Display the default slider value

	// BitingRate
	var br_slider = document.getElementById("bitingrate");
	var br_output = document.getElementById("bitingrate_val");
	br_slider.value = 0.5; // original value
	br_output.innerHTML = br_slider.value; // Display the default slider value

	// trap Density
	var td_slider = document.getElementById("trapdensity");
	var td_output = document.getElementById("trapdensity_val");
	td_slider.value = 0; // original value
	td_output.innerHTML = td_slider.value; // Display the default slider value

	// trapRate
	var tr_slider = document.getElementById("traprate");
	var tr_output = document.getElementById("traprate_val");
	tr_slider.value = 0.5; // original value
	tr_output.innerHTML = tr_slider.value; // Display the default slider value

	// waterdensity
	var wd_slider = document.getElementById("waterdensity");
	var wd_output = document.getElementById("waterdensity_val");
	wd_slider.value = 0.5; // original value
	wd_output.innerHTML = wd_slider.value; // Display the default slider value

	// SpawnRate
	var sr_slider = document.getElementById("spawnrate");
	var sr_output = document.getElementById("spawnrate_val");
	sr_slider.value = 0.5; // original value
	sr_output.innerHTML = sr_slider.value; // Display the default slider value

	$('.reset').removeClass('clicked-btn');

	redrawWindow();
}

function setbiting(){
	var br_slider = document.getElementById("bitingrate");
	var br_output = document.getElementById("bitingrate_val");
	br_slider.value = 0.25; // pre-determined value
	br_output.innerHTML = br_slider.value; // Display the default slider value
	console.log("set biting value");
	$('#set-biting-btn').toggleClass('clicked-btn');
	redrawWindow();
}

function settrap(){
	var td_slider = document.getElementById("trapdensity");
	var td_output = document.getElementById("trapdensity_val");
	td_slider.value = 0.3; // pre-determined value
	td_output.innerHTML = td_slider.value; // Display the default slider value
	console.log("set trap value");
	$('#set-trap-btn').toggleClass('clicked-btn');
	redrawWindow();
}

function setwater(){
	var wd_slider = document.getElementById("waterdensity");
	var wd_output = document.getElementById("waterdensity_val");
	wd_slider.value = 0.3; // pre-determined value
	wd_output.innerHTML = wd_slider.value; // Display the default slider value
	console.log("set water value");
	$('#set-water-btn').toggleClass('clicked-btn');
	redrawWindow();
}

function setspawn(){

	var sr_slider = document.getElementById("spawnrate");
	var sr_output = document.getElementById("spawnrate_val");
	sr_slider.value = 0.3; // pre-determined value
	sr_output.innerHTML = sr_slider.value; // Display the default slider value
	console.log("set spawn rate value");
	$('#set-spawn-btn').toggleClass('clicked-btn');
	redrawWindow();
}

function sethuman(){
	var hd_slider = document.getElementById("humandensity");
	var hd_output = document.getElementById("humandensity_val");
	hd_slider.value = 0.7; // pre-determined value
	hd_output.innerHTML = hd_slider.value; // Display the default slider value
	console.log("set human value");
	$('#set-human-btn').toggleClass('clicked-btn');
	redrawWindow();
}

// displaying slider values

//simspeed
var ss_slider = document.getElementById("simspeed");
var ss_output = document.getElementById("simspeed_val");
ss_output.innerHTML = ss_slider.value; // Display the default slider value
ss_slider.oninput = function() {
  ss_output.innerHTML = this.value;
  console.log("sim speed changed");
}

// humanDensity
var hd_slider = document.getElementById("humandensity");
var hd_output = document.getElementById("humandensity_val");
hd_output.innerHTML = hd_slider.value; // Display the default slider value
hd_slider.oninput = function() {
  hd_output.innerHTML = this.value;
}

// BitingRate
var br_slider = document.getElementById("bitingrate");
var br_output = document.getElementById("bitingrate_val");
br_output.innerHTML = br_slider.value; // Display the default slider value
br_slider.oninput = function() {
  br_output.innerHTML = this.value;
}

// trap Density
var td_slider = document.getElementById("trapdensity");
var td_output = document.getElementById("trapdensity_val");
td_output.innerHTML = td_slider.value; // Display the default slider value
td_slider.oninput = function() {
  td_output.innerHTML = this.value;
}

// trapRate
var tr_slider = document.getElementById("traprate");
var tr_output = document.getElementById("traprate_val");
tr_output.innerHTML = tr_slider.value; // Display the default slider value
tr_slider.oninput = function() {
  tr_output.innerHTML = this.value;
}

// waterdensity
var wd_slider = document.getElementById("waterdensity");
var wd_output = document.getElementById("waterdensity_val");
wd_output.innerHTML = wd_slider.value; // Display the default slider value
wd_slider.oninput = function() {
  wd_output.innerHTML = this.value;
}

// SpawnRate
var sr_slider = document.getElementById("spawnrate");
var sr_output = document.getElementById("spawnrate_val");
sr_output.innerHTML = sr_slider.value; // Display the default slider value
sr_slider.oninput = function() {
  sr_output.innerHTML = this.value;
}


//Instructions on how to use buttons

function instructions(){
  alert("Welcome to our Dengue Simulation!\n\u2022Government Intervention buttons can be toggled to simulate the effect of policies used by the SG government to control the number of dengue cases (more than 1 can be toggled concurrently).\n\u2022  Parameter control sliders can be used to further fine tune the parameters or custom set to explore the impact of potential measures not implemented yet by the SG government ")
}
