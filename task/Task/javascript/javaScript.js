$(window).on('load', function () {
    if ($('#preloader').length) 
    {$('#preloader').delay(1000).fadeOut('slow',
    function () {$(this).remove();
});
}});

$('#btnRun').click(function() {
$.ajax({
    url: "php/api.php",
    type: 'POST',
    dataType: 'json',
    data: {
        lng: $('#selLang').val(),
        lat: $('#selLati').val()
    },
    success: function(result) {

        console.log(JSON.stringify(result));

        if (result.status.name == "ok") {

            $('#txtDistance').html(result['data']['distance']);
            $('#txtGeonameID').html(result['data']['geonameId']);
            $('#txtName').html(result['data']['name']);
        }
        
    },
    error: function(jqXHR, textStatus, errorThrown) {
            // your error code
            alert("Numbers dont equal a result, try again");
    }
})});

$('#cCode').click(function() {
    
    $.ajax({
        url: "php/countryCode.php",
        type: 'POST',
        dataType: 'json',
        data:{ 
            lng: $('#selLng').val(),
            lat: $('#selLat').val()
        },
        success: function(result) {

            console.log(JSON.stringify(result));

            if (result.status.name == "ok") {

                $('#txtLang').html(result['data']['languages']);
                $('#txtDist').html(result['data']['distance']);
                $('#txtcountryCode').html(result['data']['countryCode']);
                $('#txtcountryName').html(result['data']['countryName']);

            //    $('#txtRadius').html(result['data']['radius']);
            }

        },
        error: function(jqXHR, textStatus, errorThrown) {
                // your error code
                alert("Numbers dont equal a country, try again");
        }
    })});

    $('#cInfo').click(function() {

		$.ajax({
			url: "php/getCountryInfo.php",
			type: 'POST',
			dataType: 'json',
			data: {
				country: $('#selCountry').val()
			},
			success: function(result) {

				console.log(JSON.stringify(result));

				if (result.status.name == "ok") {

					$('#txtContinent').html(result['data'][0]['continent']);
					$('#txtCapital').html(result['data'][0]['capital']);
					$('#txtLanguages').html(result['data'][0]['languages']);
					$('#txtPopulation').html(result['data'][0]['population']);
					$('#txtArea').html(result['data'][0]['areaInSqKm']);

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// your error code
                alert("Numbers dont equal a result, try again");
			}
		}); 
	
	});

    $('#neighbourhood').click(function() {
    
        $.ajax({
            url: 'php/neighbourhood.php',
            type: 'POST',
            dataType: 'json',
            data:{ 
                lng: $('#selLongditude').val(),
                lat: $('#selLatitude').val()
            },
            success: function(result) {
    
                console.log(JSON.stringify(result));
    
                if (result.status.name == "ok") {
    
                    $('#time').html(result['data']['time']);
                    $('#country').html(result['data']['countryName']);
                    $('#code').html(result['data']['countryCode']);
    
                //    $('#txtRadius').html(result['data']['radius']);
                }
    
            },
            error: function(jqXHR, textStatus, errorThrown) {
                    // your error code
                    alert("Numbers dont equal a country, try again");
            }
        })});