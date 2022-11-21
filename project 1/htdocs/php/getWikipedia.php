<?php

$country = $_GET['country'];
// The file_get_contents() reads a file into a string.
$data = file_get_contents("http://api.geonames.org/wikipediaSearch?q=$country&maxRows=10&username=ShashAPI");
print_r($data);