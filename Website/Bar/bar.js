function draw_bars(name) {
    // set the dimensions and margins of the graph
    let margin = {top: 10, right: 30, bottom: 90, left: 40},
        bar_width = 460 - margin.left - margin.right,
        bar_height = 450 - margin.top - margin.bottom;

    document.getElementById("bar_plot").innerHTML = ""

    // append the svg object to the body of the page
    let svg_bar = d3.select("#bar_plot")
        .append("svg")
        .attr("width", bar_width + margin.left + margin.right)
        .attr("height", bar_height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    
    // parse data
    d3.csv("../stations/" + name + ".csv").then(function(data) {
        // X axis
        let x = d3.scaleBand()
            .range([ 0, bar_width ])
            .domain(["Maximum snow fall", "Maximum average depth", "Maximum depth"])
            .padding(0.2);
        svg_bar.append("g")
            .attr("transform", "translate(0," + bar_height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        // domain = max Werte aus Columns

        let y = d3.scaleLinear()
            .domain([0, 816])
            .range([ bar_height, 0]);
        svg_bar.append("g")
            .call(d3.axisLeft(y));

        // Bars

        //d3.max(data, function(d) { return +d.value; })])

        max_sum = d3.max(data, function(d) {return +d.HNsum;});
        max_mean = d3.max(data, function(d) {return +d.HSmean_gapfill;});
        max_max = d3.max(data, function(d) {return +d.HSmax_gapfill;});

        /*if (typeof max_sum == "undefined") {max_sum =0;};
          if (typeof max_mean == "undefined") {max_mean =0;};
          if (typeof max_max == "undefined") {max_max =0;};

        */
        temp_data = [
            {"measure": "Maximum snow fall", "value":max_sum},
            {"measure": "Maximum average depth", "value":max_mean},
            {"measure": "Maximum depth", "value":max_max}
        ]


        svg_bar.selectAll("mybar")
            .data(temp_data)
            .enter()
            .append("rect")
            .attr("x", function(temp_data) { return x(temp_data.measure); })
            .attr("width", x.bandwidth())
            .attr("fill", "#69b3a2")

        // without animation
        /*.attr("y", function(temp_data) { return y(temp_data.value); })
          .attr("width", x.bandwidth())
          .attr("height", function(temp_data) { return height - y(temp_data.value); })
          .attr("fill", "#69b3a2")
        */
        // no bar at the beginning thus:
            .attr("height", function(d) { return bar_height - y(0); }) // always equal to 0
            .attr("y", function(d) { return y(0); })

        // Animation

        svg_bar.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", function(temp_data) { 
                return y(temp_data.value); })
            .attr("height", function(temp_data) { return bar_height - y(temp_data.value); })
            .delay(function(temp_data,i){return(i*100)})

        /*
          svg_bar.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Awesome Barchart");
        */
        svg_bar.selectAll(".bar")
            .data(temp_data)
            .enter()
            .append("text")
            .text(function(d) { 
                
                if (typeof d.value == "undefined" ) {
                    return "no data available"
                } else {
                    return d.value;
                }
            })
            .attr("x", function(d){
                //return x(temp_data[d]) + x.bandwidth() * (0.5 + 0.1);
                return x(d.measure) + x.bandwidth() / 2;
                
            })
            .attr("y", function(d){
                //console.log(temp_data.value);
                //console.log(y(temp_data.value));
                //return y(temp_data[d]) + 10; // here 0.1 is the padding scale
                //return h - yScale(d) + 14;

                if (typeof (d.value) == "undefined") {
                    return bar_height - 15
                }else{
                    return y(d.value) - 10;
                }

            })
            .attr("font-family" , "sans-serif")
            .attr("font-size" , "14px")
            .attr("fill" , "white")
            .attr("text-anchor", "middle");

    })
}
