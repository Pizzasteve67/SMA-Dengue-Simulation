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

//a mosquito may be FLYING; or Exited (i.e. left the system); 
const FLYING=0;
const EXITED=1;

// a person may be HEALTHY; or SICK;
const HEALTHY=0;
const SICK=1;

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
	}
}
// zone 1
generateBuildings(rowBuildings1,colBuildings1);
//zone 2
generateBuildings(rowBuildings2,colBuildings2);
//zone 3
generateBuildings(rowBuildings3,colBuildings3);
//zone 4
generateBuildings(rowBuildings4,colBuildings4);
console.log(Buildings)

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

//Function used to compute the coordinates of each person
// Compute feasible row coordinates and column coordinates
function generatePersons(rowList, colList, density=1){
	let zonePersons = [];
	for (i = 0; i < rowList.length; i++){
		for (j = 0; j < colList.length; j++){
			var newperson1 ={"location":{"row":rowList[i], "col":colList[j]},"state":HEALTHY, "id": String(rowList[i])+String(colList[j])}; // position of top left square of a house
			var newperson2 ={"location":{"row":rowList[i], "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i])+String(colList[j]+1)}; // poistion of top right square of a house
			var newperson3 ={"location":{"row":rowList[i]+1, "col":colList[j]}, "state":HEALTHY, "id": String(rowList[i]+1)+String(colList[j])}; // position of bottom left square of a house
			var newperson4 ={"location":{"row":rowList[i]+1, "col":colList[j]+1}, "state":HEALTHY, "id": String(rowList[i]+1)+String(colList[j]+1)}; // position of bottom right square of a house
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
persons1 = generatePersons(rowBuildings1,colBuildings1,density=0.2);
// zone 2
persons2 = generatePersons(rowBuildings2,colBuildings2,density=0.4);
// zone 3
persons3 = generatePersons(rowBuildings3,colBuildings3,density=0.6);
// zone 4
persons4 = generatePersons(rowBuildings4,colBuildings4,density=1);

// consolidate into a persons list
persons = [...persons1,...persons2,...persons3,...persons4];
console.log("persons3 is ", persons3);
console.log("persons is", persons);
// initialize a random sick person
persons[0].state = SICK;

// define a function to return ids of persons in an array; we will use this in simulation step
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

// The probability of a mosquito spawning (probArrival); The probability of a mosquito dying (probDeparture).
var probArrival = 0.5;
var probDeparture = 0.2;

// We have different types of mosquitoes (infected=I and notinfected=N) according to a probability, probInfected.
var probInfected = 0.1;

// This variable defines what is the probability of a person getting bitten by a mosquito when they are on the same tile
var BitingRate=1;

// The probability of a SICK person recovering from dengue
var probRecover=0.2;

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
	mosquitoes = [];
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


	// Next, we would like to draw boxes around the different areas of our system. We can use d3 to do that too.

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
	.style("fill", function(d) { return "#CC6600"; })
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
}
	

id=1;
function addDynamicAgents(){
	// Mosquitoes are dynamic agents: they enter the city, commute and then leave
	// We have entering mosquitoes of two types "I" and "N"
	// We could specify their probabilities of arrival in any simulation step separately
	// Or we could specify a probability of arrival of all mosquitoes and then specify the probability of a Type I arrival.
	// We have done the latter. probArrival is probability of arrival a mosquito and probInfected is the probability of a type I mosquito who spawns.
	// First see if a mosquito arrives in this sim step. Then, the mosquito is generated in one of the buildings of the city. Then the mosquito type is selected
 
    if (Math.random()< probArrival){
		var homerow=Math.floor(Math.random() * ((nrow+srow) - srow) +srow)
        var homecol=Math.floor(Math.random() * ((ncol+scol) - scol) +scol)
        var targetrow=Math.floor(Math.random() * ((nrow+srow) - srow) +srow)
        var targetcol=Math.floor(Math.random() * ((ncol+scol) - scol) +scol)
        var newmosquito = {"id":id++,"type":"I","location":{"row":homerow,"col":homecol},
        "target":{"row":targetrow,"col":targetcol},"state":FLYING,"timeAdmitted":0, "zone":0};
        if (Math.random()<probInfected) {
         newmosquito.type = "I"}
        else{newmosquito.type = "N"};	
        //console.log(newmosquito)
    mosquitoes.push(newmosquito);
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
			if (hasArrived){
				if (Math.random()<probDeparture){
					//Mosquito is dead
					mosquito.state= EXITED;
                    
				} else {
                    //Mosquito is still commuting// specifies a new target (cannot be a building)
                    var targetrow=Math.floor(Math.random() * ((nrow+srow) - srow) +srow);
                    var targetcol=Math.floor(Math.random() * ((ncol+scol) - scol) +scol);
					mosquito.target.row = targetrow;
					mosquito.target.col = targetcol;
				}
			}
			// check if current location of mosquito is on any special tile
			// narrow the search area by using zones and corresponding lists
			else{switch(zone){
					case 'zone1':
						var personToFind = String(row) + String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons1); // array of possible persons ids in the zone
						// --> insert line for array of possible trap ids in the zone
						// --> insert line for array of possible water ids in the zone

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
						// --> insert lines 
						// if currrent location has a water
						// --> insert lines
						break;
					case 'zone2':
						var personToFind = String(row) + String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons2); // array of possible persons ids in the zone
						// --> insert line for array of possible trap ids in the zone
						// --> insert line for array of possible water ids in the zone

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
						// --> insert lines 
						// if currrent location has a water
						// --> insert lines
						break;
					case 'zone3':
						var personToFind = String(row) + String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons3); // array of possible persons ids in the zone
						// --> insert line for array of possible trap ids in the zone
						// --> insert line for array of possible water ids in the zone

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
						// --> insert lines 
						// if currrent location has a water
						// --> insert lines
						break;
					case 'zone4':
						var personToFind = String(row) + String(col); // use the location of the mosquito to construct an id
						var validPersons = getID(persons4); // array of possible ids present in the zone
						// --> insert line for array of possible trap ids in the zone
						// --> insert line for array of possible water ids in the zone

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
						// --> insert lines 
						// if currrent location has a water
						// --> insert lines
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
}

function updateDynamicAgents(){
	// loop over all the mosquitoes and update their states
	for (var mosquitoIndex in mosquitoes){
		updateMosquito(mosquitoIndex);
	}
	for (var personIndex in persons){
		updatePerson(personIndex);
	}
	updateSurface();	
}

function simStep(){
	//This function is called by a timer; if running, it executes one simulation step 
	//The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ //the isRunning variable is toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
		// Sometimes new agents will be created in the following function
		addDynamicAgents();
		// In the next function we update each agent
		updateDynamicAgents();
		// Sometimes agents will be removed in the following function
		removeDynamicAgents();
	}
}
