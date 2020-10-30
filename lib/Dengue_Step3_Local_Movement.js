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
 {"label":"City","startRow":srow,"numRows":nrow-0.3,"startCol":scol,"numCols":ncol,"color":"#919191"},
 {"label":"Zone1","startRow":srow,"numRows": Math.floor(nrow/2),"startCol":scol,"numCols": Math.floor(ncol/2),"color":"#42884b"},
 {"label":"Zone2","startRow": srow ,"numRows": Math.floor(nrow/2),"startCol":scol+Math.floor(ncol/2)+1,"numCols": Math.floor(ncol/2),"color":"#42884b"},
 {"label":"Zone3","startRow": srow + Math.floor(nrow/2)+1,"numRows": Math.floor(nrow/2),"startCol":scol,"numCols": Math.floor(ncol/2),"color":"#42884b"},
 {"label":"Zone4","startRow": srow + Math.floor(nrow/2)+1,"numRows": Math.floor(nrow/2),"startCol":scol+Math.floor(ncol/2)+1,"numCols": Math.floor(ncol/2),"color":"#42884b"}	
]

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

// create indexes of building positions for each zone
// buildings for zone 1
var rowBuildings1 = range(srow+1, srow+(nrow/2)-1, 3);
var colBuildings1 = range(scol+1, scol+(ncol/2)-1, 3);
console.log("rows of zone 1", rowBuildings1)

// buildings for zone 2
var rowBuildings2 =  range(srow+1, srow+(nrow/2)-1, 3);
var colBuildings2 = range(scol+(ncol/2)+1.5, scol+ncol-1, 3);
console.log("columns of zone 2",colBuildings2)

// buildings for zone 3
var rowBuildings3 =  range(srow+(nrow/2)+1.5, srow+(nrow)-1, 3);
var colBuildings3 = range(scol+1, scol+(ncol/2)-1, 3);
console.log("rows of zone 3",rowBuildings3)
console.log("col of zone 3",colBuildings3)

// buildings for zone 4
var rowBuildings4 =  range(srow+(nrow/2)+1.5, srow+(nrow)-1, 3);
var colBuildings4 = range(scol+(ncol/2)+1.5, scol+ncol-1, 3);
console.log("col of zone 4", colBuildings4)
   
// Create all possible combinations of building coordinates for each zone
function generateBuildings(rowList, colList){
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newbuilding ={"row":rowList[i], "col":colList[j]};
	    	Buildings.push(newbuilding); 
		}
	}}

// zone 1
generateBuildings(rowBuildings1,colBuildings1);
//zone 2
generateBuildings(rowBuildings2,colBuildings2);
//zone 3
generateBuildings(rowBuildings3,colBuildings3);
//zone 4
generateBuildings(rowBuildings4,colBuildings4);
console.log("buildings are " ,Buildings);

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

// Define density of each entity in each zone
// human density
var humanDensityZone1 = 0.4;
var humanDensityZone2 = 0.4;
var humanDensityZone3 = 0.6;
var humanDensityZone4 = 1;

// trap density
var trapDensityZone1 = 0.2;
var trapDensityZone2 = 0.3;
var trapDensityZone3 = 0.15;
var trapDensityZone4 = 0.3;

// water sources (for reproduction of mosquito) density
var waterDensityZone1 = 0.2;
var waterDensityZone2 = 0.35;
var waterDensityZone3 = 0.2;
var waterDensityZone4 = 0.1;

//Function used to compute the coordinates of each person
// Compute feasible row coordinates and column coordinates
function generatePersons(rowList, colList, density=1){
	let zonePersons = [];
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newperson1 ={"location":{"row":rowList[i], "col":colList[j]},"state":HEALTHY, "id": String(rowList[i])+","+String(colList[j])}; // position of top left square of a house
			var newperson2 ={"location":{"row":rowList[i], "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i])+","+String(colList[j]+1)}; // poistion of top right square of a house
			var newperson3 ={"location":{"row":rowList[i]+1, "col":colList[j]}, "state":HEALTHY, "id": String(rowList[i]+1)+","+String(colList[j])}; // position of bottom left square of a house
			var newperson4 ={"location":{"row":rowList[i]+1, "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i]+1)+","+String(colList[j]+1)}; // position of bottom right square of a house
			zonePersons.push(newperson1);
			zonePersons.push(newperson2);
			zonePersons.push(newperson3);
			zonePersons.push(newperson4);
		}
	}
	// calculate the number of persons to generate in that zone based on set density
	let personsToGenerate = Math.floor(zonePersons.length*density);
	return getRandom(zonePersons,personsToGenerate);
}

// generate persons coordinates for each zone according to human density
// zone 1
persons1 = generatePersons(rowBuildings1,colBuildings1,humanDensityZone1);
// zone 2
persons2 = generatePersons(rowBuildings2,colBuildings2,humanDensityZone2);
// zone 3
persons3 = generatePersons(rowBuildings3,colBuildings3,humanDensityZone3);
// zone 4
persons4 = generatePersons(rowBuildings4,colBuildings4,humanDensityZone4);

// consolidate into a persons list
persons = [...persons1,...persons2,...persons3,...persons4];
console.log("persons3 is ", persons3);
console.log("persons is", persons);

// initialize a random sick person
persons[0].state = SICK;


// create indexes of all positions for each zone; we will later filter this to get trap and water positions
// indexes for zone 1
var rowAll1 = range(srow, srow+(nrow/2)-1, 1);
var colAll1 = range(scol, scol+(ncol/2)-1, 1);
console.log("rows of zone 1 All", rowAll1);
console.log("cols of zone 1 All", colAll1);

// indexes for zone 2
var rowAll2 =  range(srow, srow+(nrow/2)-1, 1);
var colAll2 = range(scol+(ncol/2)+0.5, scol+ncol-1, 1);
console.log("cols of zone 2 traps",colAll2)

// indexes for zone 3
var rowAll3 =  range(srow+(nrow/2)+0.5, srow+(nrow)-1, 1);
var colAll3 = range(scol, scol+(ncol/2)-1, 1);
console.log("rows of zone 3 traps",rowAll3)
console.log("col of zone 3",colAll3)

// indexes for zone 4
var rowAll4 =  range(srow+(nrow/2)+0.5, srow+(nrow)-1, 1);
var colAll4 = range(scol+(ncol/2)+0.5, scol+ncol-1, 1);
console.log("col of zone 4 traps", colAll4)


// Create all possible combinations of tile coordinates for each zone
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
// zone 1 (to be filtered)
var zone1Empty = generateAll(rowAll1,colAll1);
//zone 2 (to be filtered)
var zone2Empty = generateAll(rowAll2,colAll2);
//zone 3 (to be filtered)
var zone3Empty = generateAll(rowAll3,colAll3);
//zone 4 (to be filtered)
var zone4Empty = generateAll(rowAll4,colAll4);

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
var zone1Buildings = expandBuildings(rowBuildings1,colBuildings1);
var zone2Buildings = expandBuildings(rowBuildings2,colBuildings2);
var zone3Buildings = expandBuildings(rowBuildings3,colBuildings3);
var zone4Buildings = expandBuildings(rowBuildings4,colBuildings4);

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
remove_duplicates(zone1Buildings, zone1Empty);
remove_duplicates(zone2Buildings, zone2Empty);
remove_duplicates(zone3Buildings, zone3Empty);
remove_duplicates(zone4Buildings, zone4Empty);
console.log("available zone1", zone1Empty);
console.log("available zone2", zone1Empty);
console.log("available zone3", zone1Empty);
console.log("available zone4", zone1Empty);

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
// lists of possible positions for traps and water sources in each zone
var zone1TrapsWaters = splitTrapsWaters(zone1Empty);
zone1TrapsAvail = zone1TrapsWaters[0];
zone1WatersAvail = zone1TrapsWaters[1];

var zone2TrapsWaters = splitTrapsWaters(zone2Empty);
zone2TrapsAvail = zone2TrapsWaters[0];
zone2WatersAvail = zone2TrapsWaters[1];

var zone3TrapsWaters = splitTrapsWaters(zone3Empty);
zone3TrapsAvail = zone3TrapsWaters[0];
zone3WatersAvail = zone3TrapsWaters[1];

var zone4TrapsWaters = splitTrapsWaters(zone4Empty);
zone4TrapsAvail = zone4TrapsWaters[0];
zone4WatersAvail = zone4TrapsWaters[1];

console.log("zone1traps are",zone1TrapsAvail);
console.log("zone1waters are",zone1WatersAvail);

//Function used to compute the coordinates of each trap/water
function generateTraps(trapList, density=1){
	// calculate the number of traps to generate in that zone based on set density
	let trapsToGenerate = Math.floor(trapList.length*density);
	return getRandom(trapList,trapsToGenerate);
}

// generate traps for each zone
zone1Traps = generateTraps(zone1TrapsAvail,trapDensityZone1);
zone2Traps = generateTraps(zone2TrapsAvail,trapDensityZone2);
zone3Traps = generateTraps(zone3TrapsAvail,trapDensityZone3);
zone4Traps = generateTraps(zone4TrapsAvail,trapDensityZone4);
Traps = [...zone1Traps,...zone2Traps,...zone3Traps,...zone4Traps];

// generate water sources for each zone
zone1Waters = generateTraps(zone1WatersAvail,waterDensityZone1);
zone2Waters = generateTraps(zone2WatersAvail,waterDensityZone2);
zone3Waters = generateTraps(zone3WatersAvail,waterDensityZone3);
zone4Waters = generateTraps(zone4WatersAvail,waterDensityZone4);
Waters = [...zone1Waters,...zone2Waters,...zone3Waters,...zone4Waters];

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

// The probability of a mosquito spawning at a water source (probArrival);
var probArrival = 0.85;

// This variable defines what is the probability of a person getting bitten by a mosquito when they are on the same tile
var BitingRate=0.9;

// The probability of a SICK person recovering from dengue
var probRecover=0.05;

// The probability that a mosquito would die when it encounters a trap
var probTrap = 0.75;

// The probability that a mosquito will cross zones
var probCrossZone = 0.1;

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
    animationDelay = 550 - document.getElementById("slider1").value; 
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	
	// Re-initialize simulation variables
	currentTime = 0;
	// Initialize with several infected mosquitoes 
	mosquitoes = [];
	for (i=0; i < startingMosquito; i++){addMosquito(0,0,initialize=true);}
	console.log(mosquitoes);
	// zone 1
	persons1 = generatePersons(rowBuildings1,colBuildings1,density=0.2);
	// zone 2
	persons2 = generatePersons(rowBuildings2,colBuildings2,density=0.4);
	// zone 3
	persons3 = generatePersons(rowBuildings3,colBuildings3,density=0.6);
	// zone 4
	persons4 = generatePersons(rowBuildings4,colBuildings4,density=1);

	// consolidate into a persons list
	persons = [...persons1,...persons2,...persons3,...persons4];
	// initialize a random sick person
	persons[0].state = SICK;
		
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
	drawsurface.style.border = "thick solid #0000FF"; //The border is mainly for debugging; okay to remove it
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

}


function addMosquito(currentrow,currentcol, initialize = true, zone){
	// Mosquitoes are dynamic agents: they are spawned in zone 3 randomly, commute and then die
	// We have entering mosquitoes type "I" for initialization
	if (initialize){
			var homerow=11;
			var homecol=11;
			var targetrow=getRandom(rowAll3,1);
			var targetcol=getRandom(colAll3,1);
			var newmosquito = {"id":id++,"type":"I","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":'zone3'};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
		
	}
	// newly born mosquito from water sources are type "N"
	else{switch(zone){
		case 'zone1':
			// specify a new target in zone 1
			var homerow=currentrow-0.5;
			var homecol=currentcol-0.5;
			var targetrow=getRandom(rowAll1,1);
			var targetcol=getRandom(colAll1,1);
			var newmosquito = {"id":id++,"type":"N","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":zone};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			break;

		case 'zone2':
			// specify a new target in zone 2
			var homerow=currentrow-0.5;
			var homecol=currentcol-0.5;
			var targetrow=getRandom(rowAll2,1);
			var targetcol=getRandom(colAll2,1);
			var newmosquito = {"id":id++,"type":"N","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":zone};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			break;

		case 'zone3':
			// specify a new target in zone 3
			var homerow=currentrow-0.5;
			var homecol=currentcol-0.5;
			var targetrow=getRandom(rowAll3,1);
			var targetcol=getRandom(colAll3,1);
			var newmosquito = {"id":id++,"type":"N","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":zone};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			break;

		case 'zone4':
			// specify a new target in zone 4
			var homerow=currentrow-0.5;
			var homecol=currentcol-0.5;
			var targetrow=getRandom(rowAll4,1);
			var targetcol=getRandom(colAll4,1);
			var newmosquito = {"id":id++,"type":"N","location":{"row":homerow,"col":homecol},
			"target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":zone};
			//console.log(newmosquito)
			mosquitoes.push(newmosquito);
			break;

		default:
			break;

	}
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

	// increase the age of the mosquito by one simulation step
	mosquito.timeAdmitted += 1;

	// determine which zone the mosquito is in
	if (row >= srow+(nrow/2) && col < scol+(ncol/2)){
		mosquito.zone = 'zone3';
	}
	else if (row >= srow+(nrow/2) && col >= scol+(ncol/2)){
		mosquito.zone = 'zone4';
	}
	else if (row < srow+(nrow/2) && col >= scol+(ncol/2)){
		mosquito.zone = 'zone2';
	}
	else{
		mosquito.zone = 'zone1';
	}
	var zone = mosquito.zone;
	
	// determine if mosquito has arrived at the target
	var hasArrived = (Math.abs(mosquito.target.row-row)+Math.abs(mosquito.target.col-col))==0;
	
   	// Behavior of mosquito depends on its state
	switch(state){
		case FLYING:
			// kill the mosquito after at most 40 simulation steps
			if (mosquito.timeAdmitted > 35+Math.random()*5){
				mosquito.state = EXITED;
			}
			else if (hasArrived){
					// resolve any special interactions with the current tile first
					switch(zone){
						case 'zone1':
							var personToFind = String(row) + "," + String(col); // use the location of the mosquito to construct an id
							var validPersons = getID(persons1); // array of possible persons ids in the zone
							var validTraps = getID(zone1Traps); // array of possible trap ids in the zone
							var validWaters = getID(zone1Waters);// array of possible water ids in the zone
	
							// if current location has a person
							if (validPersons.includes(personToFind)){
								// locate the index of corresponding person in persons list
								var wantedIndex = persons.findIndex(x => x.id == personToFind);
								if (Math.random() < BitingRate){
									// mosquito will bite the person
									// check if mosquito is infected ; if yes, person falls sick
									if (mosquito.type == 'I'){
										persons[wantedIndex].state = SICK;
									}
									// else, check if person is sick; if yes, mosquito is infected
									else if(persons[wantedIndex].state==SICK){
										mosquito.type = 'I';
									}
								}}
							// if current location has a trap
							else if (validTraps.includes(personToFind)){
								if (Math.random()<probTrap){
								// mosquito will be trapped and die
								mosquito.state = EXITED;
								}
							}
							// if current location has a water
							else if (validWaters.includes(personToFind)){
								// spawn a mosquito
								if (Math.random()<probArrival){
									addMosquito(row,col, initialize=false, zone);
								}
							}
							break;
						case 'zone2':
							var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
							var validPersons = getID(persons2); // array of possible persons ids in the zone
							var validTraps = getID(zone2Traps); // array of possible trap ids in the zone
							var validWaters = getID(zone2Waters);// array of possible water ids in the zone
	
							// if current location has a person
							if (validPersons.includes(personToFind)){
								// locate the index of corresponding person in persons list
								var wantedIndex = persons.findIndex(x => x.id == personToFind);
								if (Math.random() < BitingRate){
									// mosquito will bite the person
									// check if mosquito is infected ; if yes, person falls sick
									if (mosquito.type == 'I'){
										persons[wantedIndex].state = SICK;
									}
									// else, check if person is sick; if yes, mosquito is infected
									else if(persons[wantedIndex].state==SICK){
										mosquito.type = 'I';
									}
								}}
							// if current location has a trap
							else if (validTraps.includes(personToFind)){
								if (Math.random()<probTrap){
								// mosquito will be trapped and die
								mosquito.state = EXITED;
								}
							}
							// if current location has a water
							else if (validWaters.includes(personToFind)){
								// spawn a mosquito
								if (Math.random()<probArrival){
									addMosquito(row,col, initialize=false, zone);
								}
							}
							break;
						case 'zone3':
							var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
							var validPersons = getID(persons3); // array of possible persons ids in the zone
							var validTraps = getID(zone3Traps); // array of possible trap ids in the zone
							var validWaters = getID(zone3Waters);// array of possible water ids in the zone
	
							// if current location has a person
							if (validPersons.includes(personToFind)){
								// locate the index of corresponding person in persons list
								var wantedIndex = persons.findIndex(x => x.id == personToFind);
								if (Math.random() < BitingRate){
									// mosquito will bite the person
									// check if mosquito is infected ; if yes, person falls sick
									if (mosquito.type == 'I'){
										persons[wantedIndex].state = SICK;
									}
									// else, check if person is sick; if yes, mosquito is infected
									else if(persons[wantedIndex].state==SICK){
										mosquito.type = 'I';
									}
								}}
							// if current location has a trap
							else if (validTraps.includes(personToFind)){
								if (Math.random()<probTrap){
								// mosquito will be trapped and die
								mosquito.state = EXITED;
								}
							}
							// if current location has a water
							else if (validWaters.includes(personToFind)){
								// spawn a mosquito
								if (Math.random()<probArrival){
									addMosquito(row,col, initialize=false, zone);
								}
							}
							break;
						case 'zone4':
							var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
							var validPersons = getID(persons4); // array of possible ids present in the zone
							var validTraps = getID(zone4Traps); // array of possible trap ids in the zone
							var validWaters = getID(zone4Waters);// array of possible water ids in the zone
	
							// if current location has a person
							if (validPersons.includes(personToFind)){
								// locate the index of corresponding person in persons list
								var wantedIndex = persons.findIndex(x => x.id == personToFind);
								if (Math.random() < BitingRate){
									// mosquito will bite the person
									// check if mosquito is infected ; if yes, person falls sick
									if (mosquito.type == 'I'){
										persons[wantedIndex].state = SICK;
									}
									// else, check if person is sick; if yes, mosquito is infected
									else if(persons[wantedIndex].state==SICK){
										mosquito.type = 'I';
									}
								}}
							// if current location has a trap
							else if (validTraps.includes(personToFind)){
								if (Math.random()<probTrap){
								// mosquito will be trapped and die
								mosquito.state = EXITED;
								}
							}
							// if current location has a water
							else if (validWaters.includes(personToFind)){
								// spawn a mosquito
								if (Math.random()<probArrival){
									addMosquito(row,col, initialize=false, zone);
									console.log("spawn", row,",", col);
								}
							}
							break;}


					// determine next target 
					if (Math.random()< probCrossZone){
						//Mosquito is still commuting// specifies a new target anywhere
						var targetrow=Math.floor(Math.random() * ((nrow+srow) - srow) +srow);
						var targetcol=Math.floor(Math.random() * ((ncol+scol) - scol) +scol);
						mosquito.target.row = targetrow;
						mosquito.target.col = targetcol;
					}
					else{switch(zone){
						case 'zone1':
							// specify a new target in zone 1
							var targetrow=getRandom(rowAll1,1);
							var targetcol=getRandom(colAll1,1);
							mosquito.target.row = targetrow;
							mosquito.target.col = targetcol;
							break;

						case 'zone2':
							// specify a new target in zone 2
							var targetrow=getRandom(rowAll2,1);
							var targetcol=getRandom(colAll2,1);
							mosquito.target.row = targetrow;
							mosquito.target.col = targetcol;
							break;

						case 'zone3':
							// specify a new target in zone 3
							var targetrow=getRandom(rowAll3,1);
							var targetcol=getRandom(colAll3,1);
							mosquito.target.row = targetrow;
							mosquito.target.col = targetcol;
							break;

						case 'zone4':
							// specify a new target in zone 4
							var targetrow=getRandom(rowAll4,1);
							var targetcol=getRandom(colAll4,1);
							mosquito.target.row = targetrow;
							mosquito.target.col = targetcol;
							break;
					}}
			}
			// check if current location of mosquito is on any special tile
			// narrow the search area by using zones and corresponding lists
			else{switch(zone){
					case 'zone1':
						var personToFind = String(row) + "," + String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons1); // array of possible persons ids in the zone
						var validTraps = getID(zone1Traps); // array of possible trap ids in the zone
						var validWaters = getID(zone1Waters);// array of possible water ids in the zone

						// if current location has a person
						if (validPersons.includes(personToFind)){
							// locate the index of corresponding person in persons list
							var wantedIndex = persons.findIndex(x => x.id == personToFind);
							if (Math.random() < BitingRate){
								// mosquito will bite the person
								// check if mosquito is infected ; if yes, person falls sick
								if (mosquito.type == 'I'){
									persons[wantedIndex].state = SICK;
								}
								// else, check if person is sick; if yes, mosquito is infected
								else if(persons[wantedIndex].state==SICK){
									mosquito.type = 'I';
								}
							}}
						// if current location has a trap
						else if (validTraps.includes(personToFind)){
							if (Math.random()<probTrap){
							// mosquito will be trapped and die
							mosquito.state = EXITED;
							}
						}
						// if current location has a water
						else if (validWaters.includes(personToFind)){
							// spawn a mosquito
							if (Math.random()<probArrival){
								addMosquito(row,col, initialize=false, zone);
							}
						}
						break;
					case 'zone2':
						var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons2); // array of possible persons ids in the zone
						var validTraps = getID(zone2Traps); // array of possible trap ids in the zone
						var validWaters = getID(zone2Waters);// array of possible water ids in the zone

						// if current location has a person
						if (validPersons.includes(personToFind)){
							// locate the index of corresponding person in persons list
							var wantedIndex = persons.findIndex(x => x.id == personToFind);
							if (Math.random() < BitingRate){
								// mosquito will bite the person
								// check if mosquito is infected ; if yes, person falls sick
								if (mosquito.type == 'I'){
									persons[wantedIndex].state = SICK;
								}
								// else, check if person is sick; if yes, mosquito is infected
								else if(persons[wantedIndex].state==SICK){
									mosquito.type = 'I';
								}
							}}
						// if current location has a trap
						else if (validTraps.includes(personToFind)){
							if (Math.random()<probTrap){
							// mosquito will be trapped and die
							mosquito.state = EXITED;
							}
						}
						// if current location has a water
						else if (validWaters.includes(personToFind)){
							// spawn a mosquito
							if (Math.random()<probArrival){
								addMosquito(row,col, initialize=false, zone);
							}
						}
						break;
					case 'zone3':
						var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons3); // array of possible persons ids in the zone
						var validTraps = getID(zone3Traps); // array of possible trap ids in the zone
						var validWaters = getID(zone3Waters);// array of possible water ids in the zone

						// if current location has a person
						if (validPersons.includes(personToFind)){
							// locate the index of corresponding person in persons list
							var wantedIndex = persons.findIndex(x => x.id == personToFind);
							if (Math.random() < BitingRate){
								// mosquito will bite the person
								// check if mosquito is infected ; if yes, person falls sick
								if (mosquito.type == 'I'){
									persons[wantedIndex].state = SICK;
								}
								// else, check if person is sick; if yes, mosquito is infected
								else if(persons[wantedIndex].state==SICK){
									mosquito.type = 'I';
								}
							}}
						// if current location has a trap
						else if (validTraps.includes(personToFind)){
							if (Math.random()<probTrap){
							// mosquito will be trapped and die
							mosquito.state = EXITED;
							}
						}
						// if current location has a water
						else if (validWaters.includes(personToFind)){
							// spawn a mosquito
							if (Math.random()<probArrival){
								addMosquito(row,col, initialize=false, zone);
							}
						}
						break;
					case 'zone4':
						var personToFind = String(row) + "," +String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons4); // array of possible ids present in the zone
						var validTraps = getID(zone4Traps); // array of possible trap ids in the zone
						var validWaters = getID(zone4Waters);// array of possible water ids in the zone

						// if current location has a person
						if (validPersons.includes(personToFind)){
							// locate the index of corresponding person in persons list
							var wantedIndex = persons.findIndex(x => x.id == personToFind);
							if (Math.random() < BitingRate){
								// mosquito will bite the person
								// check if mosquito is infected ; if yes, person falls sick
								if (mosquito.type == 'I'){
									persons[wantedIndex].state = SICK;
								}
								// else, check if person is sick; if yes, mosquito is infected
								else if(persons[wantedIndex].state==SICK){
									mosquito.type = 'I';
								}
							}}
						// if current location has a trap
						else if (validTraps.includes(personToFind)){
							if (Math.random()<probTrap){
							// mosquito will be trapped and die
							mosquito.state = EXITED;
							}
						}
						// if current location has a water
						else if (validWaters.includes(personToFind)){
							// spawn a mosquito
							if (Math.random()<probArrival){
								addMosquito(row,col, initialize=false, zone);
								console.log("spawn", row,",", col);
							}
						}
						break;
					
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
			if (Math.random()<probRecover){
				person.state = HEALTHY;
			}	
		break;
		default:
        break;
	}	
}

function updateWaterSources(zone1WatersAvail,zone2WatersAvail,zone3WatersAvail,zone4WatersAvail){
	// update water sources for each zone
	if (Math.random()<probChangeWater){
		// set all current water sources to evaporated
		for (waterIndex in Waters){
			Waters[waterIndex].state = EVAPORATED;
		}
		// create new water puddles
		newzone1Waters = generateTraps(zone1WatersAvail,waterDensityZone1);
		newzone2Waters = generateTraps(zone2WatersAvail,waterDensityZone2);
		newzone3Waters = generateTraps(zone3WatersAvail,waterDensityZone3);
		newzone4Waters = generateTraps(zone4WatersAvail,waterDensityZone4);
		// ensure the states of water sources are not evaporated
		for (waterIndex in newzone1Waters){
			newzone1Waters[waterIndex].state = REMAIN;
		}
		for (waterIndex in newzone2Waters){
			newzone2Waters[waterIndex].state = REMAIN;
		}
		for (waterIndex in newzone3Waters){
			newzone3Waters[waterIndex].state = REMAIN;
		}
		for (waterIndex in newzone4Waters){
			newzone4Waters[waterIndex].state = REMAIN;
		}
		// add them to the water list
		Waters = Waters.concat(newzone1Waters,newzone2Waters,newzone3Waters,newzone4Waters);
	}
}

function updateTraps(zone1TrapsAvail,zone2TrapsAvail,zone3TrapsAvail,zone4TrapsAvail){
	// update traps for each zone
	if (Math.random()<probChangeTrap){
		// set all current traps to evaporated
		for (trapIndex in Traps){
			Traps[trapIndex].state = EVAPORATED;
		}
		// create new traps
		newzone1Traps = generateTraps(zone1TrapsAvail,trapDensityZone1);
		newzone2Traps = generateTraps(zone2TrapsAvail,trapDensityZone2);
		newzone3Traps = generateTraps(zone3TrapsAvail,trapDensityZone3);
		newzone4Traps = generateTraps(zone4TrapsAvail,trapDensityZone4);
		// ensure the states of traps are not evaporated
		for (trapIndex in newzone1Traps){
			newzone1Traps[trapIndex].state = REMAIN;
		}
		for (trapIndex in newzone2Traps){
			newzone2Traps[trapIndex].state = REMAIN;
		}
		for (trapIndex in newzone3Traps){
			newzone3Traps[trapIndex].state = REMAIN;
		}
		for (trapIndex in newzone4Traps){
			newzone4Traps[trapIndex].state = REMAIN;
		}
		// add them to the water list
		Traps = Traps.concat(newzone1Traps,newzone2Traps,newzone3Traps,newzone4Traps);
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
	updateWaterSources(zone1WatersAvail,zone2WatersAvail,zone3WatersAvail,zone4WatersAvail);
	updateTraps(zone1TrapsAvail,zone2TrapsAvail,zone3TrapsAvail,zone4TrapsAvail);
	updateSurface();	
}

function simStep(){
	//This function is called by a timer; if running, it executes one simulation step 
	//The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ //the isRunning variable is toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
		// Sometimes new agents will be created in the following function
		// addDynamicAgents();
		// New mosquitoes will be spawned from updateDynamicAgents instead
		
		// In the next function we update each agent
		updateDynamicAgents();

		// Sometimes agents will be removed in the following function
		removeDynamicAgents();
		console.log(mosquitoes);
	}
}
