<?php

$lat = $_GET['lat'];
$lng = $_GET['lng'];
$data = file_get_contents("http://api.geonames.org/oceanJSON?lat=$lat&lng=$lng&radius=200&username=ShashAPI");
print_r($data);