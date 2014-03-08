var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width, zoom;

margin = {
  top: 50, right: 50, bottom: 50, left: 50
};

width = 960 - margin.left - margin.right;
height = 600 - margin.bottom - margin.top;

bbVis = {
  x: 0 + 100, y: 10, w: width - 100, h: 300
};

dataSet = [];

d3.csv("timeline.csv", function(error, data) {
  if (error) {console.log(error); }
  else {
    var keys = d3.keys(data[0]);
    keys.splice(keys.indexOf('Year'), 1);

    dataSet = keys.map( function(source) {
      var values = [];
      data.forEach( function(d) { if (d[source] && d.Year >= 0) { 
        values.push({'year': parseInt(d.Year), 'population': parseInt(d[source]) }); }
      });
      values.sort(function(a, b){ return a.year - b.year; });
      return {'source': source, 'values': values};
    });

    return createVis();
  }
});


createVis = function() {

  var xDom, xAxis, xScale, yAxis,  yScale, srcScale;

  var getSet = function(attr) {
    var set = [];
    dataSet.forEach(function(d) {
      d.values.forEach(function(e){ set[e[attr]] = e[attr]; }) 
    });
    return set;
  }  
  
  // setting scales and axes
  xDom = getSet('year');
  xScale = d3.scale.linear().domain(d3.extent(d3.values(xDom)))
            .range([0, bbVis.w]);
  yScale = d3.scale.linear().domain(d3.extent(d3.values(getSet('population'))))
            .range([bbVis.h, 0]);
  srcScale = d3.scale.category10().domain(dataSet.map(function(d) { 
            return d.source;} ));
  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  zoom = d3.behavior.zoom()
    .x(xScale)
    .y(yScale)
    .scaleExtent([1, 50])
    .on("zoom", zoomed);

  // setting constructors
  var line = d3.svg.line()
  .interpolate("linear")
  .x(function(e) { 
    return xScale(e.year) + bbVis.x; })
  .y(function(e) { 
    return yScale(e.population); });



  svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
  }).append("g").attr({
      transform: "translate(" + margin.left + "," + margin.top + ")"
    });

  svg.append("clipPath").attr("id", "clip")
    .append("rect")
    .attr({x: bbVis.x, y: bbVis.y, 
      width: bbVis.w, 
      height: bbVis.h});

  // append svgX, Y axes
  svg.append("g").attr("class", "x axis")
    .attr("transform", "translate("+bbVis.x+","+(bbVis.y + bbVis.h)+")")
    .call(xAxis)
    .append("text")
    .attr("x", bbVis.w)
    .attr("dx", 0)
    .attr("dy",  45)
    .style("text-anchor", "end")
    .text("Year");

  svg.append("g").attr("class", "y axis")
    .attr("transform", "translate("+bbVis.x+",0)")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", bbVis.y)
    .attr("dy", 10)
    .attr("dx", -2)
    .style("text-anchor", "end")
    .text("Population");
  
  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  var sources = svg.selectAll(".source").data(dataSet)
      .enter().append("g").attr("class", "source");

  var lines = sources.append("path").attr("class", "line")
    .attr("d", function(d) {return line(d.values) })
    .attr("clip-path", "url(#clip)")
    .style("stroke", function(d) {return srcScale(d.source)});

  var points = sources.append("g").attr("class", "points")
      .attr("fill", function(d) {return srcScale(d.source)})
      .attr("clip-path", "url(#clip)")
      .selectAll(".point")
      .data(function(d) {return d.values})
      .enter().append("svg:circle")
      .call(transform);

  function zoomed(){
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    lines.attr("d", function(d) {return line(d.values) })
    points.call(transform);

  }

  function transform(s){
    s.attr("cx", function(e) {return xScale(e.year) + bbVis.x;})
        .attr("cy", function(e) {return yScale(e.population); })
        .attr("r", 5);

  }

}