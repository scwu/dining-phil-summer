$(document).ready(function() {

function drawBubbles() {
  var diameter = 1200,
      format = d3.format(",d"),
      color = d3.scale.category20c();

  var bubble = d3.layout.pack()
      .sort(null)
      .size([diameter, diameter])
      .padding(1.5);

  var svg = d3.select(".bubblechart").append("svg")
      .attr("width", diameter)
      .attr("height", diameter)
      .attr("class", "bubble");

  d3.json("/companies/", function(error, root) {
    var node = svg.selectAll(".node")
        .data(bubble.nodes(classes(root))
        .filter(function(d) { return !d.children; }))
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
        .text(function(d) { return d.className + ": " + format(d.value); });

    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return color(d.packageName); });

    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.className.substring(0, d.r / 3); });
  });
  // Returns a flattened hierarchy containing all leaf nodes under the root.
  function classes(root) {
    var classes = [];

    function recurse(name, node) {
      if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
      else classes.push({packageName: name, className: node.name, value: node.size});
    }

    recurse(null, root);
    return {children: classes};
  }
  d3.select(self.frameElement).style("height", diameter + "px");
}

function drawUS() {
  var w = 1280,
    h = 800;

  var projection = d3.geo.azimuthal()
      .mode("equidistant")
      .origin([-98, 38])
      .scale(1400)
      .translate([640, 360]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select("#states_map").append("svg:svg")
      .attr("width", w)
      .attr("height", h);

  var states = svg.append("svg:g")
      .attr("id", "states");

  var circles = svg.append("svg:g")
      .attr("id", "circles");

  var cells = svg.append("svg:g")
      .attr("id", "cells");

  d3.select("input[type=checkbox]").on("change", function() {
    cells.classed("voronoi", this.checked);
  });

  d3.json("/media/js/us-states.json", function(collection) {
    states.selectAll("path")
        .data(collection.features)
      .enter().append("svg:path")
        .attr("d", path);
  });

  d3.csv("/media/js/flights-airport.csv", function(flights) {
    var linksByOrigin = {},
        countByAirport = {},
        locationByAirport = {},
        positions = [];

    var arc = d3.geo.greatArc()
        .source(function(d) { return locationByAirport[d.source]; })
        .target(function(d) { return locationByAirport[d.target]; });

    flights.forEach(function(flight) {
      var origin = flight.origin,
          destination = flight.destination,
          links = linksByOrigin[origin] || (linksByOrigin[origin] = []);
      links.push({source: origin, target: destination});
      countByAirport[origin] = (countByAirport[origin] || 0) + 1;
      countByAirport[destination] = (countByAirport[destination] || 0) + 1;
    });

    d3.csv("/media/js/airports.csv", function(airports) {

      // Only consider airports with at least one flight.
      airports = airports.filter(function(airport) {
        if (countByAirport[airport.iata]) {
          var location = [+airport.longitude, +airport.latitude];
          locationByAirport[airport.iata] = location;
          positions.push(projection(location));
          return true;
        }
      });

      // Compute the Voronoi diagram of airports' projected positions.
      var polygons = d3.geom.voronoi(positions);

      var g = cells.selectAll("g")
          .data(airports)
        .enter().append("svg:g");

      g.append("svg:path")
          .attr("class", "cell")
          .attr("d", function(d, i) { return "M" + polygons[i].join("L") + "Z"; })
          .on("mouseover", function(d, i) { d3.select("#footer span").text(d.city); });

      g.selectAll("path.arc")
          .data(function(d) { return linksByOrigin[d.iata] || []; })
        .enter().append("svg:path")
          .attr("class", "arc")
          .attr("d", function(d) { return path(arc(d)); });

      circles.selectAll("circle")
          .data(airports)
        .enter().append("svg:circle")
          .attr("cx", function(d, i) { return positions[i][0]; })
          .attr("cy", function(d, i) { return positions[i][1]; })
          .attr("r", function(d, i) { return Math.sqrt(countByAirport[d.iata]) * 10; })
          .sort(function(a, b) { return countByAirport[b.iata] - countByAirport[a.iata]; });
    });
  });
}

function drawPie() {
  var radius = 130,
    padding = 20;

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#3c7cc3","#ff8c00", "#196522", "#24a594", "#265ca3", "#515252"]);

  var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - 60);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.population; });

  d3.csv("company_types/", function(error, data) {
    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Year"; }));

    data.forEach(function(d) {
      d.ages = color.domain().map(function(name) {
        return {name: name, population: +d[name]};
      });
    });

    var legend = d3.select(".pie_chart").append("svg")
        .attr("class", "legend")
        .attr("width", radius * 1.3)
        .attr("height", radius * 2)
      .selectAll("g")
        .data(color.domain().slice().reverse())
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function(d) { return d; });

    var svg = d3.select(".pie_chart").selectAll(".pie")
        .data(data)
      .enter().append("svg")
        .attr("class", "pie")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
      .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    svg.selectAll(".arc")
        .data(function(d) { return pie(d.ages); })
      .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name); });

    svg.append("text")
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.Year; });

  });
}

function drawGraph() {
  // get the data
  d3.csv("/industries/", function(error, links) {

  var nodes = {};

  // Compute the distinct nodes from the links.
  links.forEach(function(link) {
      link.source = nodes[link.source] || 
          (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || 
          (nodes[link.target] = {name: link.target});
      link.value = +link.value;
  });

  var width = 960,
      height = 500;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(60)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select(".graph").append("svg")
      .attr("width", width)
      .attr("height", height);

  // build the arrow.
  svg.append("svg:defs").selectAll("marker")
      .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  // add the links and the arrows
  var path = svg.append("svg:g").selectAll("path")
      .data(force.links())
    .enter().append("svg:path")
  //    .attr("class", function(d) { return "link " + d.type; })
      .attr("class", "link")
      .attr("marker-end", "url(#end)");

  // define the nodes
  var node = svg.selectAll(".node")
      .data(force.nodes())
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  // add the nodes
  node.append("circle")
      .attr("r", 5);

  // add the text 
  node.append("text")
      .attr("x", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  // add the curvy lines
  function tick() {
      path.attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + 
              d.source.x + "," + 
              d.source.y + "A" + 
              dr + "," + dr + " 0 0,1 " + 
              d.target.x + "," + 
              d.target.y;
      });

      node
          .attr("transform", function(d) { 
          return "translate(" + d.x + "," + d.y + ")"; });
    }
  });
}
drawGraph();
drawPie();
drawUS();
drawBubbles();
});

var json_locations;
  $.ajax({
    type: 'GET',
    url: '/students/',
    async: false,
    dataType : 'json',
    success: function(response) {
      json_locations = response;
    },
  });
      google.load('visualization', '1', {'packages': ['geochart']});
     google.setOnLoadCallback(drawMarkersMap);

      function drawMarkersMap() {
        var data = google.visualization.arrayToDataTable(json_locations);
        var options = {};
        options['region'] = 'US';
        options['displayMode'] = 'markers';
        options['backgroundColor'] = '#3498DB';
        options['colorAxis'] =  {colors: ['blue', 'red']}
        options['sizeAxis'] = {minSize:10, maxSize: 60}
        var container = document.getElementById('map_locations');
        var geomap = new google.visualization.GeoChart(container);
        geomap.draw(data, options);
      };
  
