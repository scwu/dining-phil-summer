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
    console.log(root);
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
    console.log(flights)
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
  
