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
var scales = [];

createOverview = function() {
  var xDom, xAxis, xScale, yAxis,  yScale;

  var getSet = function(attr) {
    var set = [];
    dataSet.forEach(function(d) {
      d.health.forEach(function(e){ set[e[attr]] = e[attr]; }) 
    });
    return d3.values(set);
  }  
  var axisDate = d3.time.format('%b %y');
  xScale = d3.time.scale().domain(d3.extent(getSet('date')));
  yScale = d3.scale.linear().domain(d3.extent(getSet('value')));

  xAxis = d3.svg.axis().scale(xScale).orient("bottom")
            .tickFormat(function(d) {return axisDate(d)});
  yAxis = d3.svg.axis().scale(yScale).orient("left")
            .tickFormat( function(d) {return d/1000});

  var over = svg.append("g").attr({ class: "overview",
    transform: "translate(" + margin.left + "," + margin.top + ")"
  })

  var detail = svg.append("g").attr({ class: "detail", 
    transform: "translate(" + margin.left + "," + (margin.top+bbDetail.y+padding) + ")"
  });

  [[over, bbOverview], [detail, bbDetail]].forEach(function(g) {

    xScale.range([0, g[1].w]);
    yScale.range([g[1].h,0]);
    yAxis.ticks(g[1].h / 15);



    g[0].append("g").attr("class", "x axis")
      .attr("transform", "translate("+g[1].x+","+g[1].h+")")
      .call(xAxis)
      .selectAll("text")
      .attr({'text-anchor': 'start', 'transform': "rotate(-45)","dy": 10, "dx": -30})
    
    g[0].select('g.x.axis').append("text")
      .attr({x: g[1].w, dy: 75, class: 'label' })
      .style("text-anchor", "end")
      .text("Analysis Date");

    g[0].append("g").attr("class", "y axis")
    .attr("transform", "translate("+g[1].x+",0)")
    .call(yAxis)

    g[0].select('g.y.axis').append("text")
      .attr({transform: "rotate(-90)", dy: -45, dx: -2, class: 'label'})
      .style("text-anchor", "end")
      .text("pulse, 1000s");

    var tickSpace = g[1].x+d3.select('g.y.axis')[0][0].getBBox().width-g[1].w/xScale.ticks().length;

    var cat = g[0].selectAll(".cat").data(dataSet)
        .enter().append("g").attr("class", "cat")

    var points = cat.append("g").attr("class", "points").selectAll(".point")
        .data(function(d) { return d.health})
        .enter().append("svg:circle")
        .attr("cx", function(e) { return xScale(e.date) + g[1].x;})
        .attr("cy", function(e) { return yScale(e.value); })
        .attr("r", 3);



    var line = d3.svg.line().interpolate("linear")
        .x(function(d) { return xScale(d.date) + g[1].x; })
        .y(function(d) { return yScale(d.value); });

    var lines = g[0].selectAll('.cat').append("path")
      .attr("class", "path "+g[0].attr("class"))
      .attr("d", function(d) {return line(d.health) });
    
    if (g[0] == detail) {

      var area = d3.svg.area().interpolate("linear")
            .x(function(d) {return xScale(d.date) + bbDetail.x; })
            .y0(yScale(0) - 3)
            .y1(function(d) {return yScale(d.value) ; });

      detail.append("path").data(dataSet)
      .attr({class: "detailArea"})
      .attr("d", function(d) {return area(d.health); });

    }
    
  });
};


/*    var rects = cat.append("g").attr("class", "rects").selectAll(".rect")
            .data(function(d) { return d.health})
            .enter().append("svg:rect")
            .attr("x", function(e) { return xScale(e.date)+tickSpace;})
            .attr("y", g[1].y - 2*xAxis.tickSize())
            .attr("width", xAxis.tickSize()*2)
            .attr("height", g[1].h)
            .attr("fill", 'none')
            .on("mouseover", function() { console.log(d3.select(this)); return d3.select(this).attr("fill", "red")})
            .on("mouseout", function() { return d3.select(this).attr("fill", "none")});
*/


