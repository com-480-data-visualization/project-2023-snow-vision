
// // Define the snow depth data for each month of the year
// let snowDepth = [10, 20, 30, 50, 60, 80, 100, 120, 80, 60, 30, 20];

// // Define the angles for each month of the year
// let angles = [];
// for (let i = 0; i < snowDepth.length; i++) {
//   angles.push((2 * Math.PI * i) / snowDepth.length);
// }

// // Get the canvas element
// let canvas = document.getElementById("myCanvas");

// // Set the canvas size
// canvas.width = 500;
// canvas.height = 500;

// // Get the canvas context
// let ctx = canvas.getContext("2d");

// // Move the origin to the center of the canvas
// ctx.translate(canvas.width / 2, canvas.height / 2);

// // Set the minimum radius of the chart
// let radius = 50;

// // Set the maximum radius of the chart
// let maxRadius = 200;

// // Calculate the scale for the chart
// let scale = (maxRadius - radius) / Math.max(...snowDepth);

// // Set the line color and width
// ctx.strokeStyle = "blue";
// ctx.lineWidth = 2;

// // Draw the chart
// for (let i = 0; i < snowDepth.length; i++) {
//   let r = radius + snowDepth[i] * scale;
//   let x = r * Math.cos(angles[i]);
//   let y = r * Math.sin(angles[i]);
//   if (i === 0) {
//     ctx.beginPath();
//     ctx.moveTo(x, y);
//   } else {
//     ctx.lineTo(x, y);
//   }
// }
// ctx.closePath();
// ctx.stroke();

// // Set the label color and font
// ctx.fillStyle = "black";
// ctx.font = "20px Arial";

// // Draw the labels
// for (let i = 0; i < snowDepth.length; i++) {
//   let r = maxRadius + 20;
//   let x = r * Math.cos(angles[i]);
//   let y = r * Math.sin(angles[i]);
//   ctx.fillText(
//     snowDepth[i] + " in",
//     x - ctx.measureText(snowDepth[i] + " in").width / 2,
//     y + 10
//   );
//   ctx.fillText(
//     monthLabels[i],
//     x - ctx.measureText(monthLabels[i]).width / 2,
//     y + 30
//   );
// }



var win = window,
    doc = document,
    docElem = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    x = win.innerWidth || docElem.clientWidth || body.clientWidth,
    y = win.innerHeight|| docElem.clientHeight|| body.clientHeight;

let width = x,
    height = y

let svg_map = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "svg_map")
    .append("g")

svg_map.call(d3.zoom()
             .extent([[0, 0], [width, height]])
             .scaleExtent([1, 8])
             .on("zoom", zoomed));

let projection = d3.geoMercator()
    .center([ 11, 46 ])
    .scale([ width / .3 ])
    .translate([ width / 2, height / 2 ])

// URL to the GeoJSON itself
pathGenerator = d3.geoPath().projection(projection)
geoJsonUrl = "https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json"

function draw_map() {
    d3.json(geoJsonUrl)
        .then(geojson => {
            // Tell D3 to render a path for each GeoJSON feature
            svg_map.append("g")
                .selectAll("path")
                .data(geojson.features)
                .enter()
                .append("path")
                .attr("d", pathGenerator) // This is where the magic happens
                .attr("stroke", "grey") // Color of the lines themselves
                .attr("fill", "white") // Color uses to fill in the lines
        })
        .then(_ => {
            scatter_stations()
        })
}

function scatter_stations() {    
    d3.csv("locations.csv").then(function(data, error) {
        if (error)
            throw error

        console.log("Loaded locations.")
        
        let station_locations = data.map(x => {
            return [x.Longitude, x.Latitude]
        })

        svg_map.append("g")
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return projection([+d.Longitude, +d.Latitude])[0];
            })
            .attr("cy", function(d) {
                return projection([+d.Longitude, +d.Latitude])[1];
            })
            .attr("r", 3)
            .attr("fill", "black")
            .attr("id", function(d) {
                return d.Name
            })
            .attr("class", "snow_station")

        hull_stations(station_locations, 5)
    })
}

function hull_stations(station_locations, padding) {
    let hull = d3.polygonHull(station_locations)
    let hull_centroid = d3.polygonCentroid(hull.map(x => {
        return [parseFloat(x[0]), parseFloat(x[1])]
    }))

    let expandedHull = hull.map(vertex => {
        let x = parseFloat(vertex[0])
        let y = parseFloat(vertex[1])
        //Create a new array of vertices, each of which is the result
        //of running this function on the corresponding vertex of the
        //original hull.
        //Each vertex is of the form [x,y]
        var vector = [x - parseFloat(hull_centroid[0]), 
                      y - parseFloat(hull_centroid[1]) ];
        //the vector representing the line from center to this point

        var vectorLength = Math.sqrt(x*x + y*y);
        //Pythagorus' theorem to get the length of the line

        var normalizedVector = [vector[0] / vectorLength, 
                                vector[1] / vectorLength];
        //the vector scaled down to length 1, but with the same angle
        //as the original vector

        return [x + normalizedVector[0]*padding,
                y + normalizedVector[1]*padding];
        //use the normalized vector to adjust the vertex point away from
        //the center point by a distance of `padding` 

    });

    svg_map.append("g")
        .append("polygon")
        .attr("points", expandedHull.map(d => {
            return projection([+d[0], +d[1]])
        }).join(" "))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none")

    voronoi_stations(station_locations)
}

function voronoi_stations(station_locations) {
    let delaunay = d3.Delaunay.from(
        station_locations,
        d => projection(d)[0],
        d => projection(d)[1]
    )

    let voronoi = delaunay.voronoi([-180, -90, 180, 90])

    console.log(delaunay)

    svg_map.append("g")
        .data(station_locations)
        .enter()
        .append("path")
        .attr("d", (d, i) => voronoi.renderCell(i))
        //.style("fill", (d) => d.color);
}

function zoomed({transform}) {
    svg_map.attr("transform", transform)
}

draw_map()
