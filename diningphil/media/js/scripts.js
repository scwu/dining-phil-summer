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
