<?php

$capital = $_GET['capital'];
$data = file_get_contents("https://api.openweathermap.org/data/2.5/weather?q=$capital&appid=3504111d45fe5fee3825a73652c4f3c3&units=metric");
print_r($data);