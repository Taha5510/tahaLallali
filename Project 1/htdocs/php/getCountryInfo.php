<?php
$country_code = $_GET['country_code'];
$data = file_get_contents("https://restcountries.com/v2/alpha?codes=$country_code");
print_r($data);