var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width, zoom;

margin = {
  top: 50, right: 50, bottom: 50, left: 50
};

width = 960 - margin.left - margin.right;
height = 600 - margin.bottom - margin.top;

bbVis = {
  x: 0 + 100, y: 10, w: width - 100, h: 300
};

var padding = 10;

dataSet = [];
var datum;
var getSet = function(attr) {
  var set = [];
  dataSet.forEach(function(d) {
    d.values.forEach(function(e){ set[e[attr]] = e[attr]; }) 
  });
  return set;
}  

d3.csv("timeline.csv", function(error, data) {
  if (error) {console.log(error); }
  else {
    var keys = d3.keys(data[0]);
    keys.splice(keys.indexOf('Year'), 1);
    dataSet = keys.map( function(source) {
      var values = [];
      data.forEach( function(d) { if (d[source] && d.Year >= 0) { 
        d.Year = parseInt(d.Year);
        d[source] = parseInt(d[source]);
        values.push({'year': d.Year, 'population': d[source] }); 
        }
      });
      values.sort(function(a, b){ return a.year - b.year; });
      return {'source': source, 'values': values};
    });

    var consensus= [];
    data.forEach(function(t) { if (t.Year >= 0) {
        var sum = 0;
        var num = 0;
        keys.forEach(function(d) { if (t[d]) { sum = sum+t[d]; num++; } })
        if (num > 0) {
          var avg = Math.floor(sum/num);
          consensus.push({'year': t.Year, 'population': avg });}
      }
    })
    dataSet.push({source: 'consensus', 'values': consensus});

    return createVis();
  }
});


createVis = function() {

  var xDom, xAxis, xScale, yAxis,  yScale, srcScale;

    
  // setting scales and axes
  xDom = d3.extent(d3.values(getSet('year')));
  yDom = d3.extent(d3.values(getSet('population')));
  xScale = d3.scale.linear().domain(xDom).range([0, bbVis.w]);
  yScale = d3.scale.linear().domain(yDom).range([bbVis.h, 0]);
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
  .x(function(e) { return xScale(e.year) + bbVis.x; })
  .y(function(e) { return yScale(e.population); });

  svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
  }).append("g").attr({
      transform: "translate(" + margin.left + "," + margin.top + ")"
    });


  // append svgX, Y axes
  svg.append("g").attr("class", "x axis")
    .attr("transform", "translate("+bbVis.x+","+(bbVis.y + bbVis.h)+")")
    .call(xAxis)
    .append("text")
    .attr({x: bbVis.w, dy: 45, class: "label"})
    .style("text-anchor", "end")
    .text("Year");

  svg.append("g").attr("class", "y axis")
    .attr("transform", "translate("+bbVis.x+",0)")
    .call(yAxis)
    .append("text")
    .attr({transform:"rotate(-90)", y: bbVis.y, dy:10, dx:-2, class:"label"})
    .style("text-anchor", "end")
    .text("Population");

  svg.append("clipPath").attr("id", "clip")
    .append("rect")
    .attr({ width: bbVis.w+padding, height: bbVis.h+bbVis.y+padding,
      transform: "translate("+bbVis.x+","+(padding*-1)+")"
    });
  
  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  var sources, lines, points;
  var makeDataViz = function() {
    sources = svg.selectAll(".source").data(dataSet);

    sources.enter().append("g").attr("class", function(d) {return "source "+d.source});

    lines = sources.append("path").attr("class", function(d) {return "line "+d.source})
      .attr("d", function(d) {return line(d.values) })
      .attr("clip-path", "url(#clip)")
      .style("stroke", function(d) {return srcScale(d.source)});

    points = sources.append("g").attr("class", function(d) {return "points "+d.source})
        .attr("fill", function(d) {return srcScale(d.source)})
        .attr("clip-path", "url(#clip)")
        .selectAll(".point")
        .data(function(d) {return d.values})
        .enter().append("svg:circle")
        .call(transform);

  }

  makeDataViz();

  // change from / reset linear and log scales
  d3.selectAll("input[name=scale]").on("click", function() {
    if ($(this).attr("value") == "linear") {yScale = d3.scale.linear().range([bbVis.h, 0]); }
    else  {yScale = d3.scale.log().range([bbVis.h, 0]); }
      xScale.domain(xDom);
      yScale.domain(yDom);
      xAxis.scale(xScale);
      yAxis.scale(yScale);
      zoom.x(xScale).y(yScale);
      zoomed();
  })

  // switch views from all data to consensus analysis
  d3.selectAll("input[name=consensus]").on("click", function() {
    console.log($(this).attr("value"))
    if ($(this).attr("value") == "trends"){
      var sGs = d3.selectAll('.source:not(.consensus)')
      sGs.data([]);
      sGs.remove();
    } 
    else {
      var remaining = d3.selectAll('.source')
      remaining.data([]);
      remaining.remove();
      return makeDataViz();
    }
  })

  function zoomed(){
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    lines.attr("d", function(d) {return line(d.values) })
    points.call(transform);

  }

  function transform(s){
    s.attr("cx", function(e) {return xScale(e.year) + bbVis.x;})
        .attr("cy", function(e) {return yScale(e.population); })
        .attr("r", 3);

  }

}