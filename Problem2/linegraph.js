/**
 * Created by hen on 2/20/14.
 */
  var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width;

  margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  };

  width = 960 - margin.left - margin.right;

  height = 600 - margin.bottom - margin.top;

  bbVis = {
    x: 0 + 100,
    y: 10,
    w: width - 100,
    h: 300
  };

  dataSet = [];

  svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
  }).append("g").attr({
      transform: "translate(" + margin.left + "," + margin.top + ")"
    });


  d3.csv("timeline.csv", function(error, data) {
    if (error) {console.log(error); }
    else {
      var keys = d3.keys(data[0]);
      keys.splice(keys.indexOf('Year'), 1);
      dataSet = keys.map( function(source) {
        var values = [];
        data.forEach( function(d) {if (d[source] && d.Year >= 0) { 
          values.push({'year': parseInt(d.Year), 'population': parseInt(d[source]) }); 
        }});
        values.sort(function(a, b){
          return a.year - b.year;
        })
        return {'source': source, 'values': values};
      });

      return createVis();
    }
  });
  var sourceME;

  createVis = function() {
    var xAxis, xScale, yAxis,  yScale, srcScale;

      var getSet = function(attr) {
        var set = [];
        dataSet.forEach(function(d) {d.values.forEach(function(e){ 
          set[e[attr]] = e[attr]; }) 
        });
        return set;
      }     
      xScale = d3.scale.linear().domain(d3.extent(d3.values(getSet('year'))))
                .range([0, bbVis.w]);
      yScale = d3.scale.linear().domain(d3.extent(d3.values(getSet('population'))))
                .range([bbVis.h, 0]);
      srcScale = d3.scale.category10().domain(dataSet.map(function(d) { return d.source;} ));
      xAxis = d3.svg.axis().scale(xScale).orient("bottom");
      yAxis = d3.svg.axis().scale(yScale).orient("left");

      var line = d3.svg.line()
      .interpolate("linear")
      .x(function(e) { return xScale(e.year) + bbVis.x; })
      .y(function(e) { return yScale(e.population); });

      // for each source, interpolate x,y of intermediate values
      var xDom = getSet('year');
      dataSet.forEach(function(s) {

        var interpol = function(a,b,u) { 
          return a.population + (u - a.year)*( (b.population-a.population)/(b.year-a.year) ); }

        var currDom = {};
        s.values.forEach( function(d, i) { currDom[d.year] = i; })
        var ext = d3.extent(d3.keys(currDom));

        var newDom = [];
        xDom.forEach( function(d) {
          if (d >= ext[0] && d <= ext[1]) { newDom.push(d); } });

        var prevI = 0;
        newDom.forEach( function(d) {
          if (currDom[d] != undefined) {
            s.values[currDom[d]].interpolated = false;
            prevI = currDom[d];
          }
          else {
            s.values.push( { 'year': d, 
            'population': interpol(s.values[prevI], s.values[prevI+1], d),
            'interpolated': true });
          }
        });
        s.values.sort(function(a, b) { return a.year-b.year; })
      });


      // append svgX, Y axes
      svg.append("g").attr("class", "x axis")
        .attr("transform", "translate("+bbVis.x+","+(bbVis.y + bbVis.h - 10)+")")
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

      var sources = svg.selectAll(".source").data(dataSet)
                        .enter().append("g").attr("class", "source");

      var lines = sources.append("path").attr("class", "line")
        .attr("d", function(d) {return line(d.values) })
        .style("stroke", function(d) {return srcScale(d.source)});
      
      var points = sources.append("g").attr("class", "points")
          .attr("fill", function(d) {return srcScale(d.source)})
          .selectAll(".point")
          .data(function(d) {return d.values})
          .enter().append("svg:circle")
          .attr("cx", function(e) {return xScale(e.year) + bbVis.x;})
          .attr("cy", function(e) {return yScale(e.population); })
          .attr("r", function(e) {
            if (e.interpolated) { return 3;} else {return 5;} })
          .attr("opacity", function(e) {
            if (e.interpolated) { return 0.5;}
            else {return 1;}
          });

      // append cities
      // append graph paths for each city

      // example that translates to the bottom left of our vis space:
/*      var visFrame = svg.append("g").attr({
        "transform": "translate(" + bbVis.x + "," + (bbVis.y + bbVis.h) + ")",
        //....
        
      });
      
      visFrame.append("rect");*/
      //....
      
//        yScale = .. // define the right y domain and range -- use bbVis

//        xAxis = ..
//        yAxis = ..
//        // add y axis to svg !


  };
