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

function drawChange() {
  var defaults = {
    scaleShowLabels : true,
    scaleLineColor : "rgba(255,255,255,1)",
    scaleOverride : true,
    scaleSteps : 10,
    scaleStepWidth : 1,
    scaleStartValue : 0,
    scaleFontColor : "#FFFFFF",
    scaleFontFamily : "'Open Sans'",
  }
 var lineChartData = {
			labels : ["Microsoft","Google","Facebook","Goldman Sachs","Palantir","Amazon","Research"],
			datasets : [
				{
					fillColor : "rgba(220,220,220,0.7)",
					strokeColor : "rgba(220,220,220,1)",
					pointColor : "rgba(220,220,220,1)",
					pointStrokeColor : "#fff",
					data : [8,10,8,5,3,4,10]
				},
				{
					fillColor : "rgba(151,187,205,0.7)",
					strokeColor : "rgba(151,187,205,1)",
					pointColor : "rgba(151,187,205,1)",
					pointStrokeColor : "#fff",
					data : [8,9,2,0,0,3,4]
				}
			]

		}

	var myLine = new Chart(document.getElementById("change_time").getContext("2d")).Line(lineChartData,defaults); 

}

function drawPie() {
  var radius = 200,
    padding = 20;

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#3c7cc3","#ff8c00", "#196522", "#24a594", "#265ca3", "#515252"]);

  var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - 90);

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

  var width = 1200,
      height = 800;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(180)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select(".graph").append("svg")
      .attr("width", width)
      .attr("height", height);



  // add the links and the arrows
  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link " + d.type; })
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
drawChange();
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
        options['backgroundColor'] = '#0099cc';
        options['colorAxis'] =  {colors: ['blue', 'red']}
        options['sizeAxis'] = {minSize:10, maxSize: 60}
        var container = document.getElementById('map_locations');
        var geomap = new google.visualization.GeoChart(container);
        geomap.draw(data, options);
      };
  
