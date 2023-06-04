const container_name = "#snowvision-voronoi-container"

var win = window,
    doc = document,
    docElem = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    x = win.innerWidth || docElem.clientWidth || body.clientWidth,
    y = win.innerHeight|| docElem.clientHeight|| body.clientHeight

let width = x,//document.querySelector(container_name).offsetWidth,
    height = y//document.querySelector(container_name).offsetHeight

let svg = d3.select(container_name).append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "svg_map")
    .attr("fill", "transparent")
    .append("g")
    .attr("fill", "transparent")

let svg_map = svg.append("g").attr("name", "map")
// We need this to have voronoi cells rendered behind the borders.
let svg_voronoi_cells = svg_map.append("g").attr("id", "cells")

let station_locations = []

// We make the root g element zoom- and draggable for performance
// reasons.  All other elements will be children of the svg_map g
// element.
svg.call(d3.zoom()
         .extent([[0, 0], [width, height]])
         .scaleExtent([1, 8])
         .on("zoom", zoomed))

let projection = d3.geoMercator()
    .center([ 11, 46 ])
    .scale([ width / .33 ])
    .translate([ width / 2, height / 2 ])

// URL to the GeoJSON itself
pathGenerator = d3.geoPath().projection(projection)
geoJsonUrl = "https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json"

function draw_map() {
    d3.json(geoJsonUrl)
        .then(geojson => {
            // Tell D3 to render a path for each GeoJSON feature
            svg_map
                .append("g")
                .selectAll("path")
                .data(geojson.features)
                .enter()
                .append("path")
                .attr("d", pathGenerator)
                .attr("stroke", "grey")
                .attr("stroke-width", "2")
                .attr("fill", "none")
        })
        .then(_ => {
            scatter_stations()
        })
}

function scatter_stations() {    
    d3.csv("../locations.csv").then(function(data, error) {
        if (error)
            throw error

        station_locations = data.map(x => {
            return {Name: x.Name, Longitude: x.Longitude, Latitude: x.Latitude}
        })

        load_stations_data(station_locations.map(x => x.Name))

        svg_map
            .append("g")
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return projection([+d.Longitude, +d.Latitude])[0]
            })
            .attr("cy", function(d) {
                return projection([+d.Longitude, +d.Latitude])[1]
            })
            .attr("r", .75)
            .attr("fill", "#fff")
            .attr("id", function(d) {
                return d.Name
            })
            .attr("class", "snow_station")

        hull_stations()
    })
}

function hull_stations() {
    d3.csv("../concave_hull.csv").then(function(data, error) {
        let points = data.map(d => {
            return projection([+d.Longitude, +d.Latitude])
        })

        const lineGen = d3.line()
              .x(d => d[0])
              .y(d => d[1])

        svg_map
            .append("defs")
            .append("clipPath")
            .attr("id", "voronoi-clip-path")
            .append("polygon")
            .attr("points", points.map(d => d.join(",")).join(" "))
            .attr("fill", "none")
        
        voronoi_stations(points)
    })
}

let voronoi_cells = null

function voronoi_stations(hull) {    
    let voronoi = d3.Delaunay
        .from(
            station_locations,
            d => projection([+d.Longitude, +d.Latitude])[0],
            d => projection([+d.Longitude, +d.Latitude])[1])
        .voronoi([0, 0, 2 * width, 2 * height])

    voronoi_cells = svg_voronoi_cells
        .append("g")
        .attr("id", "voronoi-cells")
        .attr("clip-path", "url(#voronoi-clip-path)")
        .selectAll("polygon")
        .data(station_locations)
        .join("polygon")
        .attr("id", d => "cell" + d.Name)
        .attr("points", (d, i) =>
            voronoi.cellPolygon(i))
        .attr("fill", (d, i) => {
            return "dimgrey"
        })
        .on("click", (d, i) => {
            click_on_station(d.target.id.replace(/^cell/, ""))
        })

    let mesh = svg_voronoi_cells
        .append("g")
        .attr("id", "voronoi-mesh")
        .attr("clip-path", "url(#voronoi-clip-path)")
        .append("path")
        .attr("id", "voronoi-mesh-path")
        .attr("stroke", "#ccc")
        .attr("stroke-width", .5)
        .attr("d", voronoi.render())
        .attr("fill", "none")

    const lineGen = d3.line()
          .x(d => d[0])
          .y(d => d[1])
    
    d3.select("#voronoi-mesh")
        .append("path")
        .attr("d", lineGen(hull) + 'Z')
        .attr("stroke", "#ccc")
        .attr("fill", "none")
    
}

function get_month(year, month) {
    let res = []
    for (const station of stations_data) {
        res.push({
            name: station.name,
            data: station.data.filter(s => s.year == year && s.month == month)
        })
    }

    return res;
}

/**
 * Get a color for snow depth from based on one of D3's color scale.
 * The parameter type indicates what we are plotting, either "HNsum",
 * "HSmean", or "HSmax".
 */
function get_color(value, type) {
    //const HNsum_max = 827
    //const HSmean_max = 762.1
    //const HSmax_max = 816

    // Choose values slightly above the 75th-percentile
    const HNsum_max = 20
    const HSmean_max = 400
    const HSmax_max = 200

    let normalized;

    if (type == "HNsum")
        normalized = value / HNsum_max
    else if (type == "HSmean")
        normalized = value / HSmean_max
    else if (type == "HSmax")
        normalized = value / HSmax_max
    else
        throw new Error("Unknown type to get color for.")

    // Invert the color scale.
    normalized = 1 - normalized

    // Make the scale respond logarithmically.
    normalized = 0.265 * Math.log(40 * normalized + 1)

    if (normalized > 1)
        normalized = 1

    //return d3.interpolateCool(1 - normalized)
    return d3.interpolateViridis(normalized)
}

/**
 * This function fills the `cells` of a voronoi plot according to
 * a given `year` and `month`.
 */
function fill_voronoi_cells(year, month) {
    let data = get_month(year, month)
    
    voronoi_cells
        .attr("fill", (d, i) => {
            if (data[i].data.length == 0)
                return "dimgrey"
            else {
                return get_color(data[i].data[0].HSmean_gapfill, "HSmean")}
        })
}

let stations_data = []
let loaded_stations = false

/**
 * Load station data for an array of station_names.
 */
async function load_stations_data(station_names) {
    stations_data = station_names.map(x => {
        return {Name: x}
    })
    const promises = []
    
    for (const station of station_names) {
        promises.push(new Promise((resolve) => {
            d3.csv("../stations/" + station + ".csv").then(function(data, error) {
                stations_data.find(x => x.Name == data[0].Name).data = data
                resolve()
            })
        }))
    }

    Promise.all(promises).then(_ => {
        loaded_stations = true

        const event = new CustomEvent("loaded_stations", {detail: null})

        document.dispatchEvent(event)
    })

    /*const event = new CustomEvent("loaded_stations", {detail: null})

      document.dispatchEvent(event)*/
}

function animate() {
    let year = 1970,
        month = 1;

    let interval = setInterval(() => {
        fill_voronoi_cells(year, month)
        
        if (month == 12) {
            month = 1
            year += 1
        } else {
            month += 1
        }

        if (year >= 2020)
            clearInterval(interval)
    }, 150)
}

function zoomed({transform}) {
    svg_map.attr("transform", transform)
}

draw_map()
