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

    var consensus = {};
    data.forEach(function(t) { 
      t.Year = parseInt(t.Year);
      if (t.Year >= 0) {
        var ests = [];
        var num = 0;
        keys.forEach(function(d) { if (t[d]) { ests.push(parseInt(t[d])); num++; } })
        if (num > 0) {
          var ext = d3.extent(d3.values(ests));
          var avg = Math.floor(d3.values(ests).reduce(function(a, b){return a+b;})/num);
          consensus[t.Year] = {'year': t.Year, 'population': avg, 'min': ext[0], 'max': ext[1], 'absolute':0, 'percent':0 };
        }
      }
    });

    dataSet = keys.map( function(source) {
      var values = [];
      data.forEach( function(d) { if (d[source] && d.Year >= 0) { 
        d.Year = parseInt(d.Year);
        d[source] = parseInt(d[source]);
        var absDiff = d[source] - consensus[d.Year].population;
        var percDiff = absDiff/consensus[d.Year].population * 100;

        values.push({'year': d.Year, 'population': d[source], 'absolute': absDiff, 'percent': percDiff }); 
        }
      });
      values.sort(function(a, b){ return a.year - b.year; });
      return {'source': source, 'values': values};
    });
    dataSet.push({source: 'consensus', 'values': d3.values(consensus)});


    return createVis();
  }
});



createVis = function() {

  var xDom, yDom, xAxis, xScale, yScale, yAxis, srcScale, line, consensusArea, consensusAreaMin;

    
  // setting scales and axes
  xDom = d3.extent(d3.values(getSet('year')));
  yDom = d3.extent(d3.values(getSet('population')));
  xScale = d3.scale.linear().domain(xDom).range([0, bbVis.w]);
  yScale = d3.scale.linear().domain(yDom).range([bbVis.h, 0]);
  srcScale = d3.scale.category10().domain(dataSet.map(function(d) { 
            return d.source;} ));
  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  // setting constructors
  line = d3.svg.line()
  .interpolate("linear")
  .x(function(e) { return xScale(e.year) + bbVis.x; })
  .y(function(e) { return yScale(e.population); });


  svg = d3.select("#vis").append("svg").attr({
    width: width+margin.left+margin.right, height:height+margin.top+margin.bottom})
    .append("g").attr({
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

  zoom = d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([1, 50]).on("zoom", zoomed);

  var sources, lines, points, areaMin, area, divergeAreas;

  var Yinput = 'population',
      lastDivergeTypeInput = 'absolute';

  var makeDataViz = function() {


    sources = svg.selectAll(".source").data(dataSet);

    sources.enter().append("g").attr("class", function(d) {return "source "+d.source});

    lines = sources.append("path").attr("class", function(d) {return "line "+d.source})
      .style("stroke", function(d) {return srcScale(d.source)})
      .attr("clip-path", "url(#clip)");

    points = sources.append("g").attr("class", function(d) {return "points "+d.source})
        .attr("fill", function(d) {return srcScale(d.source)})
        .attr("clip-path", "url(#clip)")
        .selectAll(".point")
        .data(function(d) {return d.values})
        .enter().append("svg:circle")
        .call(transform);

    area = d3.svg.area().interpolate("linear")
      .x(function(d) {return xScale(d.year) + bbVis.x })
      .y0(yScale(bbVis.h))
      .y1(function(d) { return yScale(d.max) });

    areaMin = d3.svg.area().interpolate("linear")
      .x(function(d) {return xScale(d.year) + bbVis.x})
      .y0(yScale(bbVis.h))
      .y1(function(d) { return yScale(d.min) });

    svg.append("rect")
      .attr({class: "overlay", width: width, height: height})
      .call(zoom);
  }

  makeDataViz();
  zoomed();

  d3.select('body')
    .on("keyup", function() { zoom.y(yScale);  })
    .on("keydown", function() { if(d3.event.altKey) {zoom.y(null); } });

  // change from / reset linear and log scales
  d3.selectAll("input[name=scale]").on("click", function() {
    if ($(this).attr("value") == "linear") {yScale = d3.scale.linear().range([bbVis.h, 0]); }
    else  {yScale = d3.scale.log().range([bbVis.h, 0]); }
      xScale.domain(xDom);
      yScale.domain(yDom);
      resetParams();
  });

  // switch views from all data to consensus analysis
  d3.selectAll("input[name=consensus]").on("click", function() {
    if ($(this).attr("value") == "trends"){
      var sGs = d3.selectAll('.source:not(.consensus)')
      sGs.data([]);
      sGs.remove();
      svg.select('rect.overlay').remove();

      var consensus = d3.select('.source.consensus');
      consensusArea = consensus.append("path")
              .attr("d", function(c) {return area(c.values)})
              .attr({fill: 'steelblue', 'fill-opacity': 0.5, class: '.source.consensus'})
              .attr("clip-path", "url(#clip)");

      consensusAreaMin = consensus.append("path")
              .attr("d", function(c) {return areaMin(c.values)})
              .attr({fill: 'white', 'fill-opacity': 1, class: '.source.consensus'})
              .attr("clip-path", "url(#clip)");

    } 
    else {
      var remaining = d3.selectAll('.source')
      remaining.data([]);
      remaining.remove();
      svg.select('rect.overlay').remove();
      console.log("elsed");
      return makeDataViz();
    }
  });

  // switch to viz for divergence
  d3.selectAll("input[name=divergence]").on("click", function() { 
    if ($(this).attr("value") == 'diverge') {
      console.log(Yinput);
      if (Yinput == 'population') {Yinput = 'absolute';}
      lastDivergenceSelected = 'diverge';

      if (consensusArea) { consensusArea.remove(); consensusAreaMin.remove()}
      yDom = d3.extent(d3.values(getSet(Yinput)));
      yScale.domain(yDom);


      divergeAreas = d3.select("svg g").selectAll('.source').append("path")
          .attr("class", function(d) {console.log(d.source); return 'area '+d.source})
          .attr("fill", function(d) {return srcScale(d.source)})
          .attr("fill-opacity", 0.3)
          .attr("clip-path", "url(#clip)");
      svg.append("rect")
        .attr({class: "overlay", width: width, height: height})
        .call(zoom);
      resetParams();
    }

    else {
      d3.selectAll('.source').selectAll('.area')
    }

  });

/*  d3.selectAll("input[name=divergeType]").on("click", function() { 
    if (lastDivergeSelected == 'diverge') {
      if ($(this).attr('value') == 'percent')  {

      }
      else {

      }
    }

  });*/

  function resetParams(){
    zoom.x(xScale).y(yScale);
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    zoomed();
  }

  function zoomed(){

    line.y(function(e) {return yScale(e[Yinput])})
    area.y0(yScale(0)).y1(function(d) { return yScale(d[Yinput] )});
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    if (lines) {lines.attr("d", function(d) {return line(d.values) });}
    if (points) {points.call(transform);}
    if (consensusArea) {consensusArea.attr("d", function(c) {return area(c.values)});}
    if (consensusAreaMin) {consensusAreaMin.attr("d", function(c) {return areaMin(c.values)});}
    if (divergeAreas) {divergeAreas.attr('d', function(d) { return area(d.values)});
      d3.select('.source.consensus').select('.points').remove();
    }

  }

  function transform(s){
    s.attr("cx", function(e) {return xScale(e.year) + bbVis.x;})
        .attr("cy", function(e) {return yScale(e[Yinput]); })
        .attr("r", 3);

  }
};