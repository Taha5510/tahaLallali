<?php




// The file_get_contents() reads a file into a string.
$data = file_get_contents("https://openexchangerates.org/api/latest.json?app_id=ed8f993ff6644e68af4e90dfdfb1f5d9&");
print_r($data);