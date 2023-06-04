// set the dimensions and margins of the graph
let line_margin = {top: 10, right: 30, bottom: 90, left: 40},
    line_width = 1500 - line_margin.left - line_margin.right,
    line_height = 600 - line_margin.top - line_margin.bottom;

function draw_double_line(name1, name2) {
    // append the svg object to the body of the page
    var line_svg = d3.select("#line_plot")
        .append("svg")
        .attr("width", line_width + line_margin.left + line_margin.right)
        .attr("height", line_height + line_margin.top + line_margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + line_margin.left + "," + line_margin.top + ")");// append the svg object to the body of the page

    svg.call(d3.zoom()
             .extent([[0, 0], [width, height]])
             .scaleExtent([1, 8])
             .on("zoom", zoomed))

    function zoomed({transform}) {
        svg_map.attr("transform", transform)
    }

    let dict = []

    let data1 = d3.csv("../stations/" + name1 + ".csv").then(function(d){
        //console.log(d)

        d.forEach(d => {
            let date = d.year + "-" + d.month + "-" + "01"
            let k1 = { date : d3.timeParse("%Y-%m-%d")(date), value1 : d.HSmean_gapfill }

            dict.push(k1)
        }
                 )

        let data2 = d3.csv("../stations/" + name2 + ".csv").then(function(d2){
            //console.log(d)
            //let date = d2.year + "-" + d2.month + "-" + "01"

            d2.forEach(d2 => {
                let date = d2.year + "-" + d2.month + "-" + "01"
                let k2 = { date : d3.timeParse("%Y-%m-%d")(date), value2 : d2.HSmean_gapfill }

                if ( dict.filter(x => {return x.date.getTime() == k2.date.getTime()}).length != 0){
                    index = dict.findIndex(x => {return x.date.getTime() == k2.date.getTime()});

                    dict[index].value2 = k2.value2;
                    //console.log(dict);
                } else {
                    dict.push(k2);

                }
            })

            function_plot_line(dict);
        })
    }
                                                            )

    function function_plot_line(data) {
        // Add X axis in date format
        let x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, line_width ]);

        // Add Y axis
        let y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { 
                //console.log(d)
                return Math.max(+d.value1, +d.value2); })])
            .range([ line_height / 2,0 ]);
        
        // Add the line
        line_svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                  .x(function(d) { return x(d.date) })
                  .y(function(d) { return y(d.value1) })
                 )
        
        let y2 = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { 
                //console.log(d)
                return Math.max(+d.value1, +d.value2); })])

            .range([0,line_height / 2])
        
        line_svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                  .x(function(d) { return x(d.date) })
                  .y(function(d) {
                      //console.log(y2(d.value2))

                      if (isNaN(y2(d.value2))) {
                          return 0 + line_height/2
                      }else{
                          return y2(d.value2) + line_height/2

                      }
                  })
                 )

        line_svg.append("g")
            .attr("transform", "translate(0," + line_height / 2 + ")")

            .call(d3.axisBottom(x));

        line_svg.append("g")
            .call(d3.axisLeft(y));

        line_svg.append("g").attr("id", "axis").
            attr("transform", "translate(0, " + line_height / 2 + ")")
            .call(d3.axisLeft(y2));
    }

}
