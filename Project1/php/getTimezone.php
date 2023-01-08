<?php

$lat = $_GET['lat'];
$lng = $_GET['lng'];
$data = file_get_contents("http://api.geonames.org/timezoneJSON?lat=$lat&lng=$lng&username=ShashAPI");
print_r($data);