var hueIP = "0.0.0.0";
var dataExt;
var status = "off";
var username = "userHueful"
var dataEval;
var activeLights = [];
var workingLights = [];

function findHue(){
	$.getJSON('https://www.meethue.com/api/nupnp', function(data) {
		$('#connectStatus').append("Looking for Bridge<br>");
		hueIP = data[0].internalipaddress;
		if (hueIP != "0.0.0.0")
		{
			$('#connectStatus').append("Found bridge at " + hueIP + "<br>");
			getAuthStatus();
		}
		else{
			$('#connectStatus').append("Bridge not found<br>");
		}
  	});


};

function addColorPicker() {
	/*$('#colorPicker').colorpicker({
		value: { red: 51, green: 102, blue: 153 },

		change: function() {
			if (window.console) console.log("value changed", $(this).colorpicker('value'));
			workingLights = activeLights.slice(0);
			changeColorSelected($(this).colorpicker('value'));
		},

		
	});*/
	$("#flat").spectrum({
	    flat: true,
	    showInput: true,
	    preferredFormat: "hex",

	    move: function(color) {
    		//console.log(color.toHexString()); // #ff0000
    		workingLights = activeLights.slice(0);
			changeColorSelected(color.toHexString());
		}

	});
};

function changeColor(newColor){
	var URL = 'http://' + hueIP + '/api/newdeveloper/groups/0/action';
	myColor = Color(newColor);
	var xyb = colorConverter.hexStringToXyBri(newColor.substring(1));
	var setColor = colorConverter.xyBriForModel(xyb, 'LCT001');
	console.log(xyb.x);
	dataString = '{"on":true, "bri":' + Math.floor(setColor.bri * 255) + ', "xy":[' + [setColor.x, setColor.y] + ']}';
	console.log(dataString);
	$.ajax({
		url: URL,
		type: 'PUT',
		data: dataString,
		success: function(response) {
		 console.log(response);
		}
	});
}

function changeColorSelected(newColor){

	if (workingLights.length > 0)
	{
		lightChange = workingLights.pop(1);
		var URL = 'http://' + hueIP + '/api/' + username + '/lights/' + lightChange +  '/state';
		myColor = Color(newColor);
		var xyb = colorConverter.hexStringToXyBri(newColor.substring(1));
		var setColor = colorConverter.xyBriForModel(xyb, 'LCT001');
		console.log(xyb.x);
		dataString = '{"on":true, "bri":' + Math.floor(setColor.bri * 255) + ', "xy":[' + [setColor.x, setColor.y] + ']}';
		console.log(dataString);
		$.ajax({
			url: URL,
			type: 'PUT',
			data: dataString,
			success: function(response) {
			 console.log(response);
			 if (workingLights.length > 0){
			 	changeColorSelected(newColor);
			 }
			}
		});
	}

}

function getAuthStatus(){
	$.getJSON('http://' + hueIP + '/api/' + username, function(data) {
		$('#connectStatus').append("Checking Authorization<br>");
		dataExt = data;
		if ($.isArray(data))
		{
			dataEval = data[0];
		}
		else
		{
			dataEval = data;
		}
		if (dataEval.hasOwnProperty('error'))
		{
			$('#connectStatus').append("Press the link button on the bridge, then click link below<br>");
			$('#connectStatus') // Replace this selector with one suitable for you
				.append('<input type="button" id="linkButton" value="Link">') // Create the element
				.click(function(){ 
					addUser();
			}); // Add a click handler
		}
		else if (dataEval.hasOwnProperty('lights'))
		{
			$('#connectStatus').append("Authorized<br>");
			$.each(dataEval.lights, function(key, value){
				$('#connectStatus') 
					.append('<input class="light_select" type="checkbox" id=' + key + ' value="false">') 
				$('#connectStatus').append(key + ": " + value.name + "<br>");
			});

			$('.light_select').click(function(e){
				getActiveLights();
			});
			chrome.browserAction.setIcon({path:"light-bulb.png"});
			addControlButtons();
			addColorPicker();
		}
  	});
}

function getActiveLights(){
	activeLights = []
	var all_lights = $('.light_select');
	$.each(all_lights, function(index, value){
		//console.log(value);
		if($('#' + (index+1)).prop("checked"))
		{
			activeLights.push((index+1));
		}
		
	});
	console.log(activeLights);

}

function addControlButtons(){

	$('#connectStatus') 
		.append('<input type="button" id="buttonAllOn" value="All On">') 
	
	$('#buttonAllOn').click(function(){ 
		allOn();
	}); 


	$('#connectStatus') 
		.append('<input type="button" id="buttonAllOff" value="All Off">') 
		
	$('#buttonAllOff').click(function(){ 
		allOff();
	}); 

	
}

function addUser(){
	console.log("adding user");
	var URL = 'http://' + hueIP + '/api';
	dataString = '{"devicetype":"Hueful", "username":"' + username +'"}';
	console.log(dataString);
	$.ajax({
		url: URL,
		type: 'POST',
		data: dataString,
		success: function(response) {
		 console.log(response);
		 if (response[0].hasOwnProperty('error'))
		 {
		 	$('#connectStatus').append("Error: " + response[0].error.description + "<br>");
		 }
		 else if (response[0].hasOwnProperty('success'))
		 {
		 	$('#linkButton').remove();
		 	$('#connectStatus').append("Authorization successful<br>");
		 	getAuthStatus();
		 }
		}
	});

}

function allOn(){
	var URL = 'http://' + hueIP + '/api/' + username + '/groups/0/action';
	$.ajax({
		url: URL,
		type: 'PUT',
		data: '{"on":true}',
		success: function(response) {
		 console.log(response);
		}
	});
}

function allOff(){
	var URL = 'http://' + hueIP + '/api/' + username + '/groups/0/action';
	$.ajax({
		url: URL,
		type: 'PUT',
		data: '{"on":false}',
		success: function(response) {
		 console.log(response);
		}
	});
}

function getLights(){
	var URL = 'http://' + hueIP + '/api/newdeveloper/lights';
	var lights = [];
	$.getJSON(URL, function(data) {
		console.log(data);
		$.each(data, function(key, value){
			//console.log(key + ": " + value.name);
			var URL2 = 'http://' + hueIP + '/api/newdeveloper/lights/' + key;
			$.getJSON(URL2, function(data2){
				console.log(data2);
				console.log(URL2);
				/*if (data[0].state.on == true){
					status = "on";

				}*/
			});
			lights.push(key);
			

		});
	

  	});

}

document.addEventListener('DOMContentLoaded', function () {
  findHue();
});
