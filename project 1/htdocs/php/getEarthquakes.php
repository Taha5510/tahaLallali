<?php

$east = $_GET['east'];
$west = $_GET['west'];
$north = $_GET['north'];
$south = $_GET['south'];
// The file_get_contents() reads a file into a string.
$data = file_get_contents("http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&username=ShashAPI");
print_r($data);