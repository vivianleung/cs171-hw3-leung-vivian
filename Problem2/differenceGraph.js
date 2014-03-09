var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width, zoom;
var sources;
margin = {
  top: 50, right: 50, bottom: 50, left: 50
};

width = 960 - margin.left - margin.right;
height = 600 - margin.bottom - margin.top;

bbVis = {
  x: 0 + 100, y: 10, w: width - 100, h: 300
};

var padding = 10;
var LBoxLen = 10;

var Yinput = 'population';
var lastConsensusInput = 'all';
var lastDivergenceSelected = 'raw';
var lastDivergeTypeInput = 'absolute';

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
        var percDiff = (absDiff/consensus[d.Year].population) * 100;
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

  var xDom, yDom, xAxis, xScale, yScale, yAxis, srcScale, line, consensusArea, consensusAreaMin, sSelected;
    
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

  area = d3.svg.area().interpolate("linear")
    .x(function(d) {return xScale(d.year) + bbVis.x })
    .y0(yScale(0))
    .y1(function(d) { return yScale(d[Yinput]) });

  zoom = d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([1, 50]).on("zoom", zoomed);

  svg = d3.select("#vis").append("svg").attr({
    width: width+margin.left+margin.right, height:height+margin.top+margin.bottom})
    .append("g").attr({ class: 'graph',
      transform: "translate(" + margin.left + "," + margin.top + ")"
    });

  // append svgX, Y axes, clip path
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

  // append legend
  var legendBox = d3.select('svg').append("g").attr("class", 'legendBox')
    .attr("transform", function(d) {
      var ly = margin.top+bbVis.h+d3.select('g.x.axis')[0][0].getBBox().height+padding;
      sSelected = dataSet.length;
      return "translate("+margin.left+","+ly+")"});
  
  var legend = legendBox.append("g").attr("class", "legend")
    .selectAll("g").data(dataSet.map(function(d, i){return [d.source, i]}))
    .enter().append("g")
    .attr("class", function(d) { return d[0]+" selected"})
    .attr("id", function(d) {return "k"+d[1]})
    .attr("fill", function(d) {return srcScale(d[0])})
    .on("click", selectThis);
  
  legend.append("rect")
    .attr({ width: LBoxLen, height: LBoxLen })
    .attr("y", function(d, i) {return i * 18 - LBoxLen});

  legend.append("text")
    .attr("x", 20)
    .attr("vertical-align", "text-top")
    .attr("y", function(d, i) {return i * 18})
    .text(function(d) {return d[0]});

  legendBox.append("g").selectAll('text')
    .data(['DESELECT ALL', 'SELECT ALL'])
    .enter().append('text')
    .attr("class", "legselectors")
    .attr("transform", function(d, i)  {
      var gy = d3.select('.legend')[0][0].getBBox().height+padding+i*18;
     return "translate(0,"+gy+")";})
    .on("click", selectThis)
    .text(function(d) {return d});

  var lines, points, areaMin, area, divergeAreas;
  var removedSources = {};

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

    svg.append("rect")
      .attr({class: "overlay", width: width, height: height})
      .call(zoom);
  }

  makeDataViz();
  zoomed();

  d3.select('body')
    .on("keyup", function() { zoom.y(yScale);  })
    .on("keydown", function() { if(d3.event.altKey) {zoom.y(null); } });

  var lastScaleInput = 'linear';
  // change from / reset linear and log scales
  d3.selectAll("input[name=scale]").on("click", function() {
    lastScaleInput = $(this).attr("value");
    scaleChange();
    resetParams();
    zoom();
  });

  function scaleChange () {
    if (lastScaleInput == "linear") {
      yScale = d3.scale.linear().range([bbVis.h, 0]);
    }
    else  {
      yScale = d3.scale.log().range([bbVis.h, 0]); 
    }
      xScale.domain(xDom);
      yScale.domain(yDom);

  }

  

  // switch views from all data to consensus analysis
  d3.selectAll("input[name=consensus]").on("click", function() {
    if ($(this).attr("value") != lastConsensusInput){
      lastConsensusInput = $(this).attr("value");
      if (lastConsensusInput == 'trends') {

        var sGs = d3.selectAll('.source:not(.consensus)')
        sGs.data([]);
        sGs.remove();
        svg.select('rect.overlay').remove();

        legend.classed('selected', false);
        legend.select('.consensus').classed('selected', true);


        makeTrends();
        resetParams();
        zoomed();

      } 
      else {
        var remaining = d3.selectAll('.source')
        remaining.data([]);
        remaining.remove();
        svg.select('rect.overlay').remove();
        Yinput="population";

        makeDataViz();
        zoomed();
      }
    }
  });

  function makeTrends() {
    xScale.domain(xDom);
    yScale.domain(yDom);

    var consensus = d3.select('.source.consensus');
    if (!consensus[0][0]) { 
      var sourceData = dataMap[dataMap.length-1]
      consensus = sources.append("g").data(sourceData)
          .attr("class", function(d) {return "source "+d.source});
    }
    if (!consensus.select('.line')) {
      consensus.append("path").attr("class", function(d) {return "line "+d.source})
        .style("stroke", function(d) {return srcScale(d.source)})
        .attr("clip-path", "url(#clip)");         
    }
    if (!consensus.select('.points')){
      consensus.append("g").attr("class", function(d) {return "points "+d.source})
        .attr("fill", function(d) {return srcScale(d.source)})
        .attr("clip-path", "url(#clip)")
        .selectAll(".point")
        .data(function(d) {return d.values})
        .enter().append("svg:circle");

    }

    Yinput = 'max';
    consensusArea = consensus.append("path")
            .attr({fill: 'steelblue', 'fill-opacity': 0.5, class: '.source.consensus'})
            .attr("clip-path", "url(#clip)");

    Yinput = 'min';
    consensusAreaMin = consensus.append("path")
            .attr({fill: 'white', 'fill-opacity': 1, class: '.source.consensus'})
            .attr("clip-path", "url(#clip)");

    svg.append("rect")
      .attr({class: "overlay", width: width, height: height})
      .call(zoom);
    Yinput = "population";
  }

  // switch to viz for divergence
  d3.selectAll("input[name=divergence]").on("click", function() { 

    if ($(this).attr("value") != lastDivergenceSelected) {
      lastDivergenceSelected = $(this).attr("value");
      if (lastDivergenceSelected == 'diverge') {
        makeDiverge();
        resetParams();
        zoomed();
      }

      else {
        d3.selectAll('.source').selectAll('.area').remove();
        Yinput = 'population';
        yDom = d3.extent(d3.values(getSet(Yinput)));
        lastDivergenceSelected = 'raw';
        scaleChange();
        resetParams();
        makeDataViz();
        zoomed();
      }
    }

  });

  function makeDiverge() {
    Yinput = lastDivergeTypeInput;
    yDom = d3.extent(d3.values(getSet(Yinput)));
    xScale.domain(xDom);
    yScale.domain(yDom);

    d3.selectAll('.source').remove();
    sources = svg.selectAll(".source").data(dataSet);
    sources.enter().append("g").attr("class", function(d) {return "source "+d.source});

    divergeAreas = sources.append("path")
        .attr("class", function(d) {return 'area '+d.source})
        .attr("fill", function(d) {return srcScale(d.source)})
        .attr("fill-opacity", 0.3)
        .attr("clip-path", "url(#clip)");

    svg.append("rect")
      .attr({class: "overlay", width: width, height: height})
      .call(zoom);

  }

  d3.selectAll("input[name=divergeType]").on("click", function() { 
    if (lastDivergenceSelected == 'diverge' && $(this).attr('value') != lastDivergeTypeInput)  {
        Yinput = $(this).attr('value');
        lastDivergeTypeInput = Yinput;
        yDom = d3.extent(d3.values(getSet(Yinput)));
        yScale.domain(yDom);
        resetParams();
        zoomed();
    }

  });

  function resetParams(){
    zoom.x(xScale).y(yScale);
    xAxis.scale(xScale);
    yAxis.scale(yScale);

    zoomed();
  }

  function zoomed(){
    area.x(function(d) {return xScale(d.year) + bbVis.x })
    .y0(yScale(0))
    .y1(function(d) { return yScale(d[Yinput]) });

    line.y(function(e) {return yScale(e[Yinput])})
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    if (lines) {lines.attr("d", function(d) {return line(d.values) });}
    if (points) {points.call(transform);}
    if (lastConsensusInput == "trends") { 
      datum = [consensusArea, area];
      tempInput = Yinput;
      consensusArea.attr("d", function(c) {Yinput = "max"; return area(c.values)});
      consensusAreaMin.attr("d", function(c) {Yinput = "min"; return area(c.values)});
      Yinput = tempInput;
    }
    if (lastDivergenceSelected == "diverge") {divergeAreas.attr('d', function(d) { return area(d.values)});
      d3.select('.source.consensus').select('.points').remove();
    }

  }

  function transform(s){
    s.attr("cx", function(e) {return xScale(e.year) + bbVis.x;})
        .attr("cy", function(e) {return yScale(e[Yinput]); })
        .attr("r", 2);

  }


// SEPARATE SOURCES.
// d3.selectAll('.line')[0].forEach(function(e) {console.log(e)})
  function selectThis(){
    var selectedS = d3.select(this);
    console.log(selectedS);
    if (selectedS.classed("legselectors")) {
      if (selectedS.text() == "DESELECT ALL") {
        removedSources = d3.selectAll('.source').remove();
        return legend.classed("selected", false);
      }
      else { 
        d3.select('.overlay').remove();
        if (Yinput == "population") {
          if (lastConsensusInput == "trends") { makeTrends(); }
          else {           
            legend.classed("selected", true);
            makeDataViz();
          }
        }
        else {
          legend.classed("selected", true);
          makeDiverge();
        }
        zoomed();
      }
    }
    else {
      var sName = '.'+selectedS.text().replace(/ /g,'.');
      if (selectedS.classed("selected")) { 
        selectedS.classed("selected",false)
        selected
        removed d3.select('.source'+sName).remove();
      }
      else {
        d3.select(this).classed("selected", true);
        d3.select('.overlay').remove();
        if (Yinput == "population" && lastConsensusInput == "trends") { makeTrends(); }
        else {           
          legend.classed("selected", true);
          var sourceData;
          dataSet.forEach(function(d) {
            if (d.source == selectedS.text()) {sourceData = d; return;}
          });

          var sourceG = sources.select(sName)
          /*var sourceG = d3.select('g.graph').append("g").data(sourceData)
            .attr("class", function(d) {return "source "+d.source});
*/
          if (Yinput == "population")  {
            sourceG.append("path").attr("class", function(d) {return "line "+d.source})
              .style("stroke", function(d) {return srcScale(d.source)})
              .attr("clip-path", "url(#clip)");         

            sourceG.append("g").attr("class", function(d) {return "points "+d.source})
              .attr("fill", function(d) {return srcScale(d.source)})
              .attr("clip-path", "url(#clip)")
              .selectAll(".point")
              .data(function(d) {return d.values})
              .enter().append("svg:circle");
          }
          
          else {
            Yinput = lastDivergeTypeInput;
            yDom = d3.extent(d3.values(getSet(Yinput)));
            xScale.domain(xDom);
            yScale.domain(yDom);

            sourceG.append("path")
                .attr("class", function(d) {return 'area '+d.source})
                .attr("fill", function(d) {return srcScale(d.source)})
                .attr("fill-opacity", 0.3).attr("clip-path", "url(#clip)");
          }

          svg.append("rect")
            .attr({class: "overlay", width: width, height: height}).call(zoom);          
        }
        // for all options, need to zoom to re-draw
        zoomed();
      }
    }
  };

};