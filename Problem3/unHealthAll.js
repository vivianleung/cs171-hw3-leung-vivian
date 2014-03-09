var bbDetail, bbOverview, dataSet, svg, createOverview, brush;

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

var keys;

var stories = [
  {dates: ["October 2011", "April 2012"], 
      story: "Increase in overall Twitter use causes increase in relevant tweets, as seen in this transitional period. Surprisingly, tweets on Women's Health remains low despite increases in overall women's and children's health tweets, until March 2012, the time of the annual Women's History Month. (click to escape)"},
  {dates: ["February 2012", "September 2012"], 
      story: "Women's health tweets drop to baseline levels after March, while total tweets maintain high levels, suggesting children's health tweets have increased. Women's health tweets remain a smaller fraction of all relevant tweets until August 2012. After this period, categorically and total relevant tweets stabilize. (click to escape)"}
]

var parseDate = d3.time.format("%B %Y").parse;
d3.csv("unHealthAll.csv", function(error, data) {
  if (error) {console.log(error); }
  else {
  
    keys = d3.keys(data[0]);
    keys.splice(keys.indexOf('Analysis Date'), 1);


    // for applicability's sake (if one wanted to add more datasets)
    // each category (e.g. "women's health") is grouped by 'cat'
    dataSet = keys.map( function(cat) {
      var values = [];
      data.forEach( function(d) { 
        values.push({'date': parseDate(d["Analysis Date"]), 
                'value': parseInt(d[cat]) });
      });
      return {'cat': cat.split(" ")[0].replace(/'/,""), 'health': values};
    });
    return createOverview();
}});
  var over, detail, scalesOverview, scalesDetail, axesOverview, axesDetail, area;
  var catOver, catDetail, pointsOver, pointsDetail, linesOver, linesDetail;

createOverview = function() {
  var brushPadding = 5;

  var axisDate = d3.time.format('%b %y');

  var legend = svg.append("g").attr({ class: 'legend',
    transform: "translate("+(margin.left+bbOverview.w*.87)+","+(margin.top-20)+")"})
    .selectAll("g").data(dataSet.map(function(d){return d.cat}))
    .enter().append("g")
    .append("rect")
    .attr("class", function(d) { return "legend "+d})
    .attr({ width: 10, height: 10 })
    .attr("y", function(d, i) {return i * 15 - 10});

  svg.select('.legend').selectAll("g")
    .append("text")
    .attr("class", function(d) { return "legend "+ d})
    .attr("x", 20)
    .attr("vertical-align", "text-top")
    .attr("y", function(d, i) {return i * 15})
    .text(function(d, i) {return keys[i]});

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

  detail.append("g").selectAll("path").data(dataSet)
  .enter().append("path")
  .attr("class", function(d) { return "detailArea "+d.cat })
  .attr("d", function(d) {return area(d.health); })
  .attr("clip-path", "url(#clip)");


  // adds stories, linked !!!!!!!!!!!!!!
  svg.append("g").attr('class', 'storylinks')
  .attr("transform", function() {
    var gY = margin.top + bbOverview.y + d3.select('g.legend')[0][0].getBBox().height+d3.select('g.overview')[0][0].getBBox().height + padding + d3.select('g.detail')[0][0].getBBox().height + 30;
    return "translate("+margin.left+","+gY+")";
  })
  .selectAll("text").data(stories)
  .enter().append("text")
  .attr("y", function(d, i) {return i * 20})
  .on("click", function(d) {clicked(d)})
  .text(function(d, i) {return "Story "+(i+1)+": "+d.dates[0]+" to "+d.dates[1]})

  var bubble = svg.append("g").attr("id", "storyexpand")
      .attr("transform", function() {
        var gY = margin.top + bbOverview.y + d3.select('g.legend')[0][0].getBBox().height+d3.select('g.overview')[0][0].getBBox().height - 5;
        return "translate("+bbDetail.x+","+gY+")"});

  over.append("g").attr("class", "brush")
    .attr({ width: bbOverview.w + brushPadding, transform: "translate("+bbOverview.x+",0)"})
    .call(brush)
    .selectAll("rect").attr({
      height: bbOverview.h + brushPadding, y: bbOverview.y - brushPadding });

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
    var xax = d3.svg.axis().scale(scales.x).orient("bottom")
          .tickFormat(function(d) {return axisDate(d)}); 

    var yAxis = d3.svg.axis().scale(scales.y).orient("left")
                .tickFormat( function(d) {return d/1000})
                .ticks(bb.h / 15); 
  
    g.append("g").attr("class", "x axis")
      .attr("transform", "translate("+bb.x+","+(bb.h+bb.y)+")")
      .call(xax)
      .selectAll("text")
      .attr("class", "ticklabels");

    var xAxis = function() {
      g.select('g.x.axis')
        .selectAll("text.ticklabels")
        .attr({ 'text-anchor': 'start', 'transform': "rotate(-45)","dy": 10, "dx": -30});
      return xax;
    }
    
    xAxis();

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
    return cat.append("g")
      .attr("class", function(d) { return "points "+d.cat })
      .selectAll(".point")
      .data(function(d) { return d.health})
      .enter().append("svg:circle")
        .attr("cx", function(e) { return scales.x(e.date) + bb.x;})
        .attr("cy", function(e) { return scales.y(e.value) + bb.y; })
        .attr("r", 3);
  }

  function makeLines(g, line) {
    return g.append("path")
    .attr("class", function(d) { return "path "+g.attr("class")+" "+d.cat })
    .attr("d", function(d) {return line(d.health) });
  }
  
  function brushed() {
    // if brush selection is empty, use original domain, else use brush extent
    scalesDetail.x.domain(brush.empty() ? scalesOverview.x.domain() : brush.extent());
    detail.selectAll(".detailArea").attr("d", function(d) {return area(d.health);});
    detail.selectAll(".path.cat").attr("d", function(d) {return lineDetail(d.health);});
    detail.selectAll("circle")
        .attr("cx", function(e) { return scalesDetail.x(e.date) + bbDetail.x;})
        .attr("cy", function(e) { return scalesDetail.y(e.value) + bbDetail.y; });
    detail.select(".x.axis").call(axesDetail.x);
  }

  function clicked(story) {

    var textPad = 4;
    var textWidth = bbDetail.w - textPad*2;
    bubble.append("text").text(story.story)
    wrap(d3.select('#storyexpand'), textWidth);


    var extent = story.dates.map(function(d) {return parseDate(d);})
    console.log(extent);
    brush = brush.extent(extent);
    var scaledE = scalesOverview.x(brush.extent()[1]);
    var scaledW = scalesOverview.x(brush.extent()[0]);
    var brushDom = d3.select('g.brush')
    brushDom.select('.extent').attr({width: scaledE-scaledW, x: scaledW});
    brushDom.select('resize.e').select('rect').attr("transform", "translate("+scaledE+",0)");
    brushDom.select('resize.w').select('rect').attr("transform", "translate("+scaledW+",0)");
    brushed();


    d3.select('#storybox').on("click", function(){
      this.remove();
      d3.selectAll('.storylines').remove();
      brush = brush.clear();
      brushDom.select('.extent').attr({width: 0, x: 0});
      brushDom.select('resize.e').select('rect').attr("transform", "translate(0,0)");
      brushDom.select('resize.w').select('rect').attr("transform", "translate(0,0)");
      brushed();
    })
  


  
  // adapted from mbostock http://bl.ocks.org/mbostock/7555321
  function wrap(tBox, width) {
    var text = tBox.select('text')[0][0];
    var totalLen = text.getComputedTextLength();
    var lperRow = text.innerHTML.length/(totalLen / width) ;
    var words = text.innerHTML.split(' ').reverse();
    var lineH = parseInt(window.getComputedStyle(text).fontSize) * 1.1;
    var w = words.pop();
    var counter = w.length;
    var line = "";
    var i = 0;
    var wrapping = [];
    tBox.select('text').remove();
    var max = 0;
    while (w != undefined) {
      if (w.length+counter > lperRow) {
        wrapping.push(line)
        line = ""; 
        counter = 0;
        i++; 
      }
      else {
        line = line + " "+w;
        counter = w.length + counter + 1;
        w = words.pop();
      }
    }
    wrapping.push(line);

    tBox.selectAll('text').data(d3.values(wrapping)).enter().append('text')
      .attr({ x:textPad, class: 'storylines', 'vertical-align': "text-top"})
    .attr("y", function(d, j) {return j*lineH;})
    .text(function(d) {return d});
    
    var rectH = (i+1)*lineH + 2*textPad;
    bubble.append("rect")
      .attr({id: "storybox", width: bbDetail.w, height: rectH, x: 0, y: -lineH})

    return;

  }
}
};




