let country_boundary;
let map;
let cities_fg;
let wikipedia_fg;
let quakes_fg;
let country_code_global = "";
let east;
let west;
let north;
let south;
let country_name;
let lat;
let lng;
let cntrLng;
let cntrLat;
let currency;
let layer= "cities";
let changes =0;

$(document).ready(function () {
  $("#country_info .card-body").css(
    "max-height",
    $(window).height() - 71 - 10 + "px"
  );

  let Esri_WorldStreetMap = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
    }
  );

  map = L.map("map", {
    attributionControl: false,
  }).setView([0, 0], 1.5);

  map.addLayer(Esri_WorldStreetMap);

  L.control.scale().addTo(map);
  map.zoomControl.setPosition("topright");

  country_boundary = new L.geoJson().addTo(map);
  
  cities_fg = new L.MarkerClusterGroup({maxClusterRadius:30});
  

  weather_fg = new L.MarkerClusterGroup();
  

  wikipedia_fg = new L.MarkerClusterGroup();
  
  quakes_fg = new L.MarkerClusterGroup();

  get_country_codes();
  get_user_location();

  var overlayMaps = {
    "Cities": cities_fg,
    "Earthquakes":quakes_fg,
    "Wikipedia":wikipedia_fg,
    "Weather":weather_fg

};
var layerControl = L.control.layers(null, overlayMaps).addTo(map);
});

function get_country_codes() {
  $.ajax({
    url: "php/getCountriesCode.php?",
    type: "GET",
    success: function (json) {
      let countries = JSON.parse(json);
      let option = "";
      for (country of countries) {
        option +=
          '<option value="' + country[1] + '">' + country[0] + "</option>";
      }
      $("#country_list").append(option).select2();
    },
  });
}

function get_user_location() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const {
          latitude
        } = position.coords;
        const {
          longitude
        } = position.coords;
        // const coords = [latitude, longitude];
        map.spin(true);
        $.ajax({
          url: "php/getCountryCodeFromLatLng.php",
          type: "GET",
          dataType: 'json',
          data:{
            lat:latitude,
            lng: longitude,
          },
          success: function (json) {
            map.spin(false); // Parse the string data to JavaScript object
            const country_code = json?.countryCode;
            $("#country_list").val(country_code).trigger("change");
            
          },
        });
       
      },
      function () {
        $("#country_list").val("DZ").trigger("change");
        alert("Could not get your position!");
      }
    );
  }
}

function get_country_border(country_code) {
  $.ajax({
    url: "php/getCountryBorder.php",
    type: "GET",
    data: {
      country_code: country_code,
    },
    success: function (json) {
      json = JSON.parse(json);
      country_boundary.clearLayers();
      country_boundary.addData(json).setStyle(polystyle());
      const bounds = country_boundary.getBounds();
      map.fitBounds(bounds);
      cities_fg.clearLayers();
      weather_fg.clearLayers();
      quakes_fg.clearLayers();
      wikipedia_fg.clearLayers();
      east = bounds.getEast();
      west = bounds.getWest();
      north = bounds.getNorth();
      south = bounds.getSouth();
      get_nearby_cities(east, west, north, south);
      get_nearby_weather(east, west, north, south);
      get_nearby_wikipedia(east, west, north, south);
      get_earthquakes(east, west, north, south);
      get_wikipedia();
      //get_weather(cntrLat,cntrLng);
      
      get_news();
      get_covid();
      const settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://covid-19-tracking.p.rapidapi.com/v1/${country_name}`,
        "method": "GET",
        "headers": {
          "X-RapidAPI-Key": "9f1a253b08msh458c5a8bfa3e980p1fa091jsnb0fee8a3daac",
          "X-RapidAPI-Host": "covid-19-tracking.p.rapidapi.com"
        }
      };
      
      /*$.ajax(settings).done(function (response) {
        
        $('#covidCases').html(response["Total Cases_text"]);
        $('#covidDeaths').html(response["Total Deaths_text"]);
        $('#covidRecover').html(response["Total Recovered_text"]);
      
      });*/
     
    },
  });
}


function get_nearby_cities(east, west, north, south) {
  cities_fg.clearLayers();
  $.ajax({
    url: "php/getNearByCities.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
      
    },
    success: function (json) {
      json = JSON.parse(json);
     
      const data = json?.geonames;
    
      const city_icon = L.ExtraMarkers.icon({
        icon: "fa-building",
        markerColor: "black",
        shape: "square",
        prefix: "fa",
      });
      for (let i = 0; i < data.length; i++) {
        const marker = L.marker([data[i].lat, data[i].lng], {
          icon: city_icon,
        }).bindPopup(
          "<b>" +
          data[i].name +
          "</b><br>Population: " +
          parseInt(data[i].population).toLocaleString("en")
        );
        cities_fg.addLayer(marker);
      }
      map.addLayer(cities_fg);
    },
  });
}
function get_nearby_weather(east, west, north, south) {
  weather_fg.clearLayers;
  
  $.ajax({
    url: "php/getNearByWeather.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
      
    },
    success: function (json) {
      json = JSON.parse(json);
    
      const data = json?.weatherObservations;
   
      
      const city_icon = L.ExtraMarkers.icon({
        icon: "fa-sun",
        markerColor: "yellow",
        shape: "square",
        prefix: "fa",
      });
      for (let i = 0; i < data.length; i++) {
        const marker = L.marker([data[i].lat, data[i].lng], {
          icon: city_icon,
        }).bindPopup(
          "<b>Humidity:</b> " +
          data[i].humidity+
          "<br><b>Temperature:</b> " +
          parseInt(data[i].temperature).toLocaleString("en")
        );
        weather_fg.addLayer(marker);
      }
    },
  });
}

function get_wikipedia() {
  const cntrname = country_name.replace(/ +/g, "");
  $.ajax({
    url: "php/getWikipedia.php",
    type: "GET",
    data: {
      country:cntrname,
      
    },
    success: function (xml) {
      var x2js = new X2JS();
      var json = x2js.xml_str2json(xml);
      summary = json["geonames"]["entry"][0]["summary"];
    
      $('#wikiSummary').html(summary);
      
      
    },
  });
}

function get_ocean(latitude,longitude) {
  
  $.ajax({
    url: "php/getOcean.php",
    type: "GET",
    data: {
      lat: latitude,
      lng: longitude,  
    },
    success: function (json) {
     
      json = JSON.parse(json);
      
      $('#Ocean').html(json.ocean?.name);
    },
  });
}
function get_weather(capital) {
  
  $.ajax({
    url: "php/getWeather.php",
    type: "GET",
    data: {
      capital: capital,  
    },
    success: function (json) {
      json = JSON.parse(json);
     
      $("#temp").html(Math.round(json?.main?.temp_max));
      $("#wind_speed").html("Wind Speed: " + json?.wind?.speed + " kmh");
      $("#icon").html('<img src="../img/'+json?.weather[0]?.icon+'.png" height="70px">');
      $("#weather_type").html(json?.weather[0]?.description);
      $("#unit2").on("click", function(){
        $("#temp").html(Math.round((json.main?.temp_max* 9/5)+32)).addClass("animated fadeIn");
        $("#c_icon").css({ "color":"rgba(255,255,255,0.7)" });
        $('#unit2').css({"color":"white"});
       });
          //back to celsius
      $("#c_icon").on("click", function(){
        $("#temp").html(Math.round(json.main?.temp_max)).addClass("animated fadeIn").removeClass("animate fadeIn");
        $("#unit2").css({"color":"rgba(255,255,255,0.7)"});
        $(this).css({"color":"white"});
      });
    },
  });
}

function get_timezone(latitude,longitude) {
  
  $.ajax({
    url: "php/getTimezone.php",
    type: "GET",
    data: {
      lat: latitude,
      lng: longitude,  
    },
    success: function (json) {
      json = JSON.parse(json);
     
      $('#sunrise').html(json?.sunrise?.slice(11,20));
      $('#sunset').html(json?.sunset?.slice(11,20));
      $('#timeNow').html(json?.time?.slice(11,20));
      
    },
  });
}
function get_news() {
  
  $.ajax({
    url: "https://api.goperigon.com/v1/all?apiKey=27eddec6-811f-4565-b3fd-bbb07f9bb938&from=2022-12-29&sourceGroup=top100&showNumResults=true&showReprints=false&excludeLabel=Non-news&excludeLabel=Opinion&excludeLabel=Paid News&excludeLabel=Roundup&excludeLabel=Press Release&sortBy=date&q="+country_name+"",
    type: "GET",
    data: {
      name: country_name, 
    },
    success: function (json) {
      
    
      $('#newsTitle').html(json.articles[0]?.title);
      $('#newsTitle2').html(json.articles[1]?.title);
      $('#newsTitle3').html(json.articles[2]?.title);
      $('#newsDesc3').html(json.articles[2]?.description);
      $('#newsDesc2').html(json.articles[1]?.description);
      $('#newsDesc').html(json.articles[0]?.description);

    },
  });
}
function get_covid() {
  
  $.ajax({
    url: "https://disease.sh/v3/covid-19/countries",
    type: "GET",
    data: {
      name: country_name, 
    },
    success: function (json) {
      const cntr= json?.filter((a)=>a.country===country_name);
    
     $('#covidCases').html(cntr[0]?.cases);
        $('#covidDeaths').html(cntr[0]?.deaths);
        $('#covidRecover').html(cntr[0]?.recovered);
      
    },
  });
}



function get_earthquakes(east, west, north, south) {
  
  $.ajax({
    url: "php/getEarthquakes.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
      
    },
    success: function (json) {
      json = JSON.parse(json);
      
      const data = json?.earthquakes;
      
      const city_icon = L.ExtraMarkers.icon({
        icon: "fa-exclamation",
        markerColor: "red",
        shape: "square",
        prefix: "fa",
      });
      for (let i = 0; i < data.length; i++) {
        const marker = L.marker([data[i].lat, data[i].lng], {
          icon: city_icon,
        }).bindPopup(
          "<b>" +
          data[i].datetime.slice(0,10) +"</b>"+
          "<br><b>magnitude:</b> " +
          parseInt(data[i].magnitude).toLocaleString("en")
        );
        quakes_fg.addLayer(marker);
      }
    },
  });
}

function get_exchange_rate(base) {

  $.ajax({
    url: "php/getExchangeRate.php",
    type: "GET",
    data: { 
    },
    success: function (json) {
      json = JSON.parse(json);
      
     
      $('#exchangeCurrency').html(json?.rates[base]);
    },
  });
}



function polystyle() {
  return {
    fillColor: "green",
    weight: 1,
    opacity: 0.1,
    color: "white", //Outline color
    fillOpacity: 0.6,
  };
}



$('#country_list').change(function() {
  country_code =$("#country_list option:selected").val();
  if (country_code == "") return;
  country_name = $("#country_list option:selected").text();
  country_code_global = country_code;
  get_country_border(country_code);
  get_country_info(country_code);
  if(changes > 0){
    wikibtn.remove();
    countrybtn.remove();
    currencybtn.remove();
    covidbtn.remove();
    oceanbtn.remove();
    timebtn.remove();
    weatherebtn.remove();
    newsbtn.remove();
    }
  $("#covid_info").animate({
    left: "-999px",
  },
  1000
);
$("#currency_info").animate({
  left: "-999px",
},
1000
);
$("#wiki_info").animate({
  left: "-999px",
},
1000
);
$("#ocean_info").animate({
  left: "-999px",
},
1000
);

});



function get_country_info(country_code) {
  if ($("#country_info").css("left") !== "5px") {
    $("#country_info").animate({
        left: "5px",
      },
      1000
    );
    $(".pull_country_info_popup").animate({
        left: "-40px",
      },
      1000
    );
  }
  map.spin(true, {
    top: 180,
    left: 150,
  });
  $("#left_arrow").prop("disabled",true);
  $.ajax({
    url: "php/getCountryInfo.php",
    type: "GET",
    data: {
      country_code: country_code,
    },
    success: function (response) {
      map.spin(false);
  $("#left_arrow").prop("disabled",false);

      let details = $.parseJSON(response);
    
      lat = details[0].latlng[0];
      lng = details[0].latlng[1];
      $('#countryRegion').html(details[0].region);
      $('#countrySubRegion').html(details[0].subregion);
      $('#countryName').html(details[0].name);

      $("#countryCapital").html(details[0].capital);
      $("#capital_weather").html('Weather in '+details[0].capital+'');

      $("#country_population").html(details[0].population.toLocaleString("en"));
      $("#country_wikipedia").attr(
        "href",
        "https://en.wikipedia.org/wiki/" + details[0].name
      );
      $("#country_flag").attr("src", details[0].flag);
      $("#countryCurrency").html(details[0].currencies[0].name);
      get_ocean(details[0].latlng[0],details[0].latlng[1]);
      get_timezone(details[0].latlng[0],details[0].latlng[1]);
      get_weather(details[0].capital);
      get_exchange_rate(details[0].currencies[0].code);
    },
  });
}
$('#left_arrow_news').click(function() {
  changes=1;
  $("#news_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();
weatherebtn.remove();


}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

})
$('#left_arrow').click(function() {
  changes=1;
  $("#country_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();
weatherebtn.remove();


}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

});
$('#left_arrow_weather').click(function() {
  changes=1;

  $("#weather_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();
weatherebtn.remove();


}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
wikibtn.remove();

countrybtn.remove();

covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
});
$('#left_arrow_ocean').click(function() {
  changes=1;
  
  $("#ocean_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
weatherebtn.remove();

timebtn.remove();

}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

});
$('#left_arrow_time').click(function() {
  changes=1;

  $("#time_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
weatherebtn.remove();

timebtn.remove();

}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

});
$('#left_arrow_covid').click(function() {
  changes=1;

  $("#covid_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();
countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
});

$('#left_arrow_currency').click(function() {
  changes=1;

  $("#currency_info").animate({
    left: "-999px",
  },
  1000
);
countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
weatherebtn.remove();

covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

});



$('#left_arrow_wiki').click(function() {
  changes=1;

  
  $("#wiki_info").animate({
    left: "-999px",
  },
  1000
);

countrybtn=  L.easyButton('fa-flag', function(){
  $("#country_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

weatherebtn.remove();

wikibtn.remove();
currencybtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

currencybtn = L.easyButton('fa-money-bill', function(){
  $("#currency_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

wikibtn = L.easyButton('fa-wikipedia-w', function(){
  $("#wiki_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
currencybtn.remove();
covidbtn.remove();
weatherebtn.remove();

oceanbtn.remove();
timebtn.remove();

}).addTo(map);
covidbtn = L.easyButton('fa-exclamation', function(){
  $("#covid_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();


}).addTo(map);
oceanbtn = L.easyButton('<p>Sea</p>', function(){
  $("#ocean_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
timebtn = L.easyButton('fa-clock', function(){
  $("#time_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
weatherebtn = L.easyButton('fa-cloud', function(){
  $("#weather_info").animate({
    left: "5px",
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();

countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);
newsbtn = L.easyButton('fa-newspaper', function(){
  $("#news_info").animate({
    left: "5px",timebtn
  },
  1000
);
this.remove();
newsbtn.remove();
weatherebtn.remove();
countrybtn.remove();
wikibtn.remove();
covidbtn.remove();
currencybtn.remove();
oceanbtn.remove();
timebtn.remove();

}).addTo(map);

});
   

function get_nearby_wikipedia(east, west, north, south) {
  wikipedia_fg.clearLayers();
  $.ajax({
    url: "php/getNearByWikipedia.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
    },
    success: function (json) {
      json = JSON.parse(json);
     
      const data = json?.geonames;
      const wiki_icon = L.ExtraMarkers.icon({
        icon: "fa-wikipedia-w",
        markerColor: "blue",
        shape: "square",
        prefix: "fa",
      });
      for (let i = 0; i < data.length; i++) {
        const marker = L.marker([data[i].lat, data[i].lng], {
          icon: wiki_icon,
        }).bindPopup(
          "<img src='" +
          data[i].thumbnailImg +
          "' width='100px' height='100px' alt='" +
          data[i].title +
          "'><br><b>" +
          data[i].title +
          "</b><br><a href='https://" +
          data[i].wikipediaUrl +
          "' target='_blank'>Wikipedia Link</a>"
        );
        wikipedia_fg.addLayer(marker);
      }
    },
  });
}
