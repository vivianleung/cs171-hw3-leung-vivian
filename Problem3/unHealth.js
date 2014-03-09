var bbDetail, bbOverview, dataSet, svg, createOverview;

var margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

var width = 960 - margin.left - margin.right;

var height = 800 - margin.bottom - margin.top;

bbOverview = {
  x: 20,
  y: 10,
  w: width,
  h: 50
};

bbDetail = {
  x: 20,
  y: 100,
  w: width,
  h: 300
};

// padding between graphs
var padding = 30;


svg = d3.select("#visUN").append("svg").attr({
  width: width + margin.left + margin.right,
  height: height + margin.top + margin.bottom
})


d3.csv("unHealth.csv", function(error, data) {
  if (error) {console.log(error); }
  else {
  
    var keys = d3.keys(data[0]);
    keys.splice(keys.indexOf('Analysis Date'), 1);

    var parseDate = d3.time.format("%B %Y").parse;

    // for applicability's sake (if one wanted to add more datasets)
    // each category (e.g. "women's health") is grouped by 'cat'
    dataSet = keys.map( function(cat) {
      var values = [];
      data.forEach( function(d) { 
        values.push({'date': parseDate(d["Analysis Date"]), 
                'value': parseInt(d[cat]) });
      });
      return {'cat': cat, 'health': values};
    });
    return createOverview();
}});

createOverview = function() {
  var over, detail, scalesOverview, scalesDetail, axesOverview, axesDetail, area;
  var catOver, catDetail, pointsOver, pointsDetail, linesOver, linesDetail, brush;
  var brushPadding = 5;

  var axisDate = d3.time.format('%b %y');

  over = svg.append("g").attr({ class: "overview",
    transform: "translate(" + margin.left + "," + margin.top + ")"
  })

  detail = svg.append("g").attr({ class: "detail", 
    transform: "translate(" + margin.left + "," + (margin.top+bbDetail.y+padding) + ")"
  });

  detail.append("clipPath").attr("id", "clip").append("rect")
    .attr({x:bbDetail.x, y:bbDetail.y, width:bbDetail.w, height:bbDetail.h});

  scalesOverview = makeScales(bbOverview);
  scalesDetail = makeScales(bbDetail);
  axesOverview = makeAxes(bbOverview, scalesOverview, over);
  axesDetail = makeAxes(bbDetail, scalesDetail, detail);

  brush = d3.svg.brush().x(scalesOverview.x).on("brush", brushed);

  catOver = over.selectAll(".cat").data(dataSet)
      .enter().append("g").attr("class", "cat");

  catDetail = detail.selectAll(".cat").data(dataSet)
    .enter().append("g").attr("class", "cat");

  var lineOver = d3.svg.line().interpolate("linear")
      .x(function(d) { return scalesOverview.x(d.date) + bbOverview.x; })
      .y(function(d) { return scalesOverview.y(d.value)  + bbOverview.y; });
  
  var lineDetail = d3.svg.line().interpolate("linear")
      .x(function(d) { return scalesDetail.x(d.date) + bbDetail.x; })
      .y(function(d) { return scalesDetail.y(d.value)  + bbDetail.y; });

  pointsOver = makePoints(catOver, scalesOverview, bbOverview);
  pointsDetail = makePoints(catDetail, scalesDetail, bbDetail)
                .attr("clip-path", "url(#clip)");
  linesOver = makeLines(catOver, lineOver);
  linesDetail = makeLines(catDetail, lineDetail)
                .attr("clip-path", "url(#clip)");

  area = d3.svg.area().interpolate("linear")
        .x(function(d) {return scalesDetail.x(d.date) + bbDetail.x; })
        .y0(scalesDetail.y(0) + bbDetail.y - 3)
        .y1(function(d) {return scalesDetail.y(d.value) + bbDetail.y ; });

  detail.append("path").data(dataSet)
  .attr({class: "detailArea"})
  .attr("d", function(d) {return area(d.health); })
  .attr("clip-path", "url(#clip)");

  over.append("g").attr("class", "brush").call(brush)
    .selectAll("rect").attr({
      height: bbOverview.h + brushPadding,
      y: bbOverview.y - brushPadding
  });

  // gets the set of values of a prop across nested arrays of objects
  function getSet(attr) {
    var set = [];
    dataSet.forEach(function(d) {
      d.health.forEach(function(e){ set[e[attr]] = e[attr]; }) 
    });
    return d3.values(set);
  }  

  function makeScales (bb) {
    return { x: d3.time.scale().domain(d3.extent(getSet('date'))).range([0, bb.w]),
             y: d3.scale.linear().domain(d3.extent(getSet('value'))).range([bb.h, 0])};
  }

  function makeAxes (bb, scales, g) {
    var xAxis = d3.svg.axis().scale(scales.x).orient("bottom")
                .tickFormat(function(d) {return axisDate(d)});

    var yAxis = d3.svg.axis().scale(scales.y).orient("left")
                .tickFormat( function(d) {return d/1000})
                .ticks(bb.h / 15); 
  
    g.append("g").attr("class", "x axis")
      .attr("transform", "translate("+bb.x+","+(bb.h+bb.y)+")")
      .call(xAxis)
      .selectAll("text")
      .attr({'text-anchor': 'start', 'transform': "rotate(-45)","dy": 10, "dx": -30})
    
    g.select('g.x.axis').append("text")
      .attr({x: bb.w, dy: 75, class: 'label' })
      .style("text-anchor", "end")
      .text("Analysis Date");

    g.append("g").attr("class", "y axis")
    .attr("transform", "translate("+bb.x+","+bb.y+")")
    .call(yAxis)
    .append("text")
    .attr({transform: "rotate(-90)", dy: -45, dx: -2, class: 'label'})
    .style("text-anchor", "end")
    .text("pulse, 1000s");


    return { x: xAxis, y: yAxis} ;
  }
  
  function makePoints(cat, scales, bb) {
    return cat.append("g").attr("class", "points").selectAll(".point")
      .data(function(d) { return d.health})
      .enter().append("svg:circle")
        .attr("cx", function(e) { return scales.x(e.date) + bb.x;})
        .attr("cy", function(e) { return scales.y(e.value) + bb.y; })
        .attr("r", 3);
  }

  function makeLines(g, line) {
    return g.append("path")
    .attr("class", "path "+g.attr("class"))
    .attr("d", function(d) {return line(d.health) });
  }
  
  function brushed() {
    // if brush selection is empty, use original domain, else use brush extent
    scalesDetail.x.domain(brush.empty() ? scalesOverview.x.domain() : brush.extent());
    detail.select(".detailArea").attr("d", function(d) {return area(d.health);});
    detail.select(".path.cat").attr("d", function(d) {return lineDetail(d.health);});
    detail.selectAll("circle")
        .attr("cx", function(e) { return scalesDetail.x(e.date) + bbDetail.x;})
        .attr("cy", function(e) { return scalesDetail.y(e.value) + bbDetail.y; });
    detail.select(".x.axis").call(axesDetail.x);
  }
};


