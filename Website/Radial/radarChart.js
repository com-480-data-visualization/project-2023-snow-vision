// Inspired by code by Nadieh Bremer VisualCinnamon.com

var radarLine;
var blobWrapper;	
var allAxis;
var maxValue;
var cfg;
var rScale;
let radial_data;
let radar_done = false

async function createLineNPoints(N){
    radarLine = d3.radialLine()
	.curve(d3.curveCardinal)
	.radius(function(d,i) { 
	    if(i<N)
		return rScale(d.value); 
	    else
		return null;
	})
	.angle(function(d,i) {return (i%12)*angleSlice; });

    blobWrapper.selectAll(".radarStroke").remove()
    
    blobWrapper.append("path")
	.attr("class", "radarStroke")
	.attr("d", function(d,i) { return radarLine(d); })
	.style("stroke-width", cfg.strokeWidth + "px")
	.style("stroke", function(d,i) { return cfg.color(i); })
	.style("fill", "none");
}

async function getData(nameStation) {
	var nameStationCsv = "../stations/" + nameStation + ".csv";
	const response = await fetch(nameStationCsv);
	const csvData = await response.text();
  
	let rows = csvData.split('\n').slice(0,csvData.length);
	let data = rows.map(row => {
	  return row.split(',');
	});
	return data;
}
  
async function RadarChart(id, options, nameStation, endMonth, endYear) {

	let dataRaw;
	await getData(nameStation)
	.then(result => {
	  dataRaw = result
	})
	.catch(error => {
	  console.error('Error:', error);
	});

	//when rowStart == 1501 -> select rows from 1501 to 1512
	//corresponding to location Admont, Year 2000 and months from 1(January) to 12(December)
	
	var rowStart = 1501

	var nameLocation = dataRaw.slice(rowStart,rowStart+12).map(row => row[1]);
	var year = dataRaw.slice(rowStart,rowStart+12).map(row => row[2]);
	var monthNumeric = dataRaw.slice(rowStart,rowStart+12).map(row => row[3]);
	//var HNsum = dataRaw.slice(rowStart,rowStart+12).map(row => row[4]).map(Number);
	var HSmean = dataRaw.map(row => row[9]).map(Number);
	//var HSmax = dataRaw.slice(rowStart,rowStart+12).map(row => row[6]).map(Number);


	cfg = {
		w: 600,				//Width of the circle
		h: 600,				//Height of the circle
		margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
		levels: 3,				//How many levels or inner circles should there be drawn
		maxValue: 1, 			//What is the value that the biggest circle will represent
		labelFactor: 1.3, 	//How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 100, 		//The number of pixels after which a label needs to be given a new line
		opacityArea: 0, 	//The opacity of the area of the blob
		dotRadius: 0, 			// SIZE OF EACH POINT //The size of the colored circles of each blog
		opacityCircles: 0.1, 	// SIZE OF EACH LINE  //The opacity of the circles of each blob
		strokeWidth: 3, 		//The width of the stroke around each blob
		roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
		color: d3.schemeAccent	//Color function
	   };
	   
	//Put all of the options into a variable called cfg
	if('undefined' !== typeof options){
		for(var i in options){
		if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
		}//for i
	}
	
	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	maxValue = Math.max(...HSmean.filter(value => !isNaN(value)));

	
	let zeroVal = maxValue / cfg.levels;

	//input year and month and station name: goal draw until month year
	//console.log(dataRaw);
	radial_data = [];
	var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

	let k = 0;
	for (let i = 0; k < dataRaw.length; i++) {
		let newYearEntry = [];
		for(let j = 0; j< 12; j++){
			if(isNaN(HSmean[k])){
				HSmean[k] = 0;
			}
			let valToSet = parseFloat(HSmean[k] + zeroVal);
			let newMonthEntry = {axis: months[j], value: valToSet};
			newYearEntry.push(newMonthEntry);
			k++;
		};
		radial_data.push(newYearEntry);
	}

	allAxis = (radial_data[0].map(function(i, j){return i.axis})),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
		Format = d3.format('.1f'),			 	//Percentage formatting
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
	
	rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, maxValue]);
		
	// Create the container SVG and g 

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
			.attr("class", "radar"+id);
	//Append a g element		
	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

	// Draw the Circular grid
	
	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	//Draw the background circles
	axisGrid.selectAll(".levels")
	   .data(d3.range(1,(cfg.levels+2)).reverse())
	   .enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return radius/cfg.levels*d;})
		.style("fill", "lightgray")
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", cfg.opacityCircles);
		//.style("filter" , "url(#glow)");

	//Text indicating at what % each level is
	// console.log("maxValue == " + maxValue)
	axisGrid.selectAll(".axisLabel")
	   .data(d3.range(1,(cfg.levels+2)).reverse())
	   .enter().append("text")
	   .attr("class", "axisLabel")
	   .attr("x", 4)
	   .attr("y", function(d){return -(d)*radius/cfg.levels;})
	   .attr("dy", "0.4em")
	   .style("font-size", "10px")
	   .attr("fill", "white")
	   .text(function(d,i) { return Format((maxValue * (d-1)/(cfg.levels))); });

	// Draw the axes
	
	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(maxValue*1.25) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue*1.25) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "white")
		.style("stroke-width", "1px");

	//Append the labels at each axis
	axis.append("text")
	
		.attr("class", "legend")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
		.text(function(d){return d})
		.call(wrap, cfg.wrapWidth);

	// Draw the radar chart blobs
	
	//The radial line function
	radarLine = d3.radialLine()
		.curve(d3.curveCardinal)
		.radius(function(d,i) { 
			if(i<0)
				return rScale(d.value); 
			else
				return null;
		})
		.angle(function(d,i) {return (i%12)*angleSlice; });
		
				
	//Create a wrapper for the blobs	
	blobWrapper = g.selectAll(".radarWrapper")
		.data([radial_data.flat()])
		.enter().append("g")
		.attr("class", "radarWrapper");

	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0); 
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0);	
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
		

	//Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none");
		//.style("filter" , "url(#glow)");		
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8)
		.style("fill-opacity", 0.8);

	// Append invisible circles for tooltip
	
	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(radial_data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");
		
	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
					
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(Format(d.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
		
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);
	
	// Helper Function

	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}//wrap

    radar_done = true;
	
}//RadarChart
