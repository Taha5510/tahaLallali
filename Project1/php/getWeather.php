<?php

$lat = $_GET['lat'];
$lng = $_GET['lng'];
$data = file_get_contents("https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lng&appid=3504111d45fe5fee3825a73652c4f3c3");
print_r($data);