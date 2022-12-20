<?php

$name = $_GET['name'];
$data = file_get_contents("https://newsapi.org/v2/everything?q=$name&from=2022-12-16&sortBy=popularity&apiKey=645cf8c127fc455b923481b100641618");
print_r($data);