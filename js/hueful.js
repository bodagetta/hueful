var hueIP = "0.0.0.0";
var dataExt;
var status = "off";
var username = "userHueful"
var dataEval;
var activeLights = [];
var workingLights = [];
var changeGroup = true;
var groups = [];


//Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40485596-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


function findHue(){
	$.getJSON('https://www.meethue.com/api/nupnp', function(data) {
		$('#bridge').text("Looking for Bridge");
		$('#bridge').append("<br>");
		hueIP = data[0].internalipaddress;
		if (hueIP != "0.0.0.0")
		{
			$('#bridge').append("Found bridge at " + hueIP + "<br>");
			$('#bridge').append("Bridge ID " + data[0].id + "<br>");
			$('#bridge').append("Bridge MAC Address " + data[0].macaddress + "<br>");
			getAuthStatus();
		}
		else{
			$('#bridge').append("Bridge not found<br>");
		}
  	});


};

function addColorPicker() {
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

	if (!changeGroup){

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
	else
	{
		var URL = 'http://' + hueIP + '/api/' + username + '/groups/0/action';
		myColor = Color(newColor);
		var xyb = colorConverter.hexStringToXyBri(newColor.substring(1));
		var setColor = colorConverter.xyBriForModel(xyb, 'LCT001');
		console.log(xyb.x);
		dataString = '{"on":true, "bri":' + Math.floor(setColor.bri * 255) + ', "xy":[' + [setColor.x, setColor.y] + ']}';

		$.ajax({
			url: URL,
			type: 'PUT',
			data: dataString,
			success: function(response) {
			 console.log(response);
			}
		});
	}

}

function populateGroups(group){
	$.each(group, function(key, value){
		console.log("key: " + key + "value: " + value);
		$('#groups').append("<h4>Group " + (key+1) + "</h4>");
		$('#groups').append('<input type="button" id="destroyGroup_' + key + '" value="X">'); 
		$('#destroyGroup_' + key).click(function(){ 
			removeGroup(0);
		}); 
		$.each(value, function(key2, value2){
			$('#groups').append($('#' + value2).attr("value") + "<br>");
		});

	});
}

function removeGroup(group)
{
	console.log("removing" + group);
}


function colorLoop(state){

	if (!changeGroup){

		if (workingLights.length > 0)
		{
			lightChange = workingLights.pop(1);
			var URL = 'http://' + hueIP + '/api/' + username + '/lights/' + lightChange +  '/state';
			if (state)
			{
				dataString = '{"on":true, "effect":"colorloop"}';
			}
			else
			{
				dataString = '{"on":true, "effect":"none"}';
			}
			console.log(dataString);
			$.ajax({
				url: URL,
				type: 'PUT',
				data: dataString,
				success: function(response) {
				 console.log(response);
				 if (workingLights.length > 0){
				 	colorLoop(state);
				 }
				}
			});
		}
	}
	else
	{
		var URL = 'http://' + hueIP + '/api/' + username + '/groups/0/action';
		if (state)
		{
			dataString = '{"on":true, "effect":"colorloop"}';
		}
		else
		{
			dataString = '{"on":true, "effect":"none"}';
		}

		$.ajax({
			url: URL,
			type: 'PUT',
			data: dataString,
			success: function(response) {
			 console.log(response);
			}
		});
	}

}

function getAuthStatus(){
	$.getJSON('http://' + hueIP + '/api/' + username, function(data) {
		$('#bridge').append("Checking Authorization<br>");
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
			$('#connectStatus') 
				.append('<input type="button" id="linkButton" value="Link">') 
				.click(function(){ 
					addUser();
			}); // Add a click handler
		}
		else if (dataEval.hasOwnProperty('lights'))
		{
			$('#bridge').append("Authorized<br>");
			$.each(dataEval.lights, function(key, value){
				$('#connectStatus') 
					.append('<input class="light_select" type="checkbox" id=' + key + ' value="' + value.name + '">') 
				$('#connectStatus').append(key + ": " + value.name + "<br>");
			});



			$('.light_select').click(function(e){
				getActiveLights();
			});
			chrome.browserAction.setIcon({path:"img/light-bulb.png"});
			addControlButtons();
			addColorPicker();
			$.each(activeLights, function(index, value){
				//console.log(value);
				selector = '#' + index;
				console.log(index + ": " + selector);
				$(selector).prop("checked", true);
			});
			populateGroups(groups);
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
	localStorage["activeLights"] = JSON.stringify(activeLights);

}

function addControlButtons(){

	$('#connectStatus') 
		.append('<input class="btn btn-mini" type="button" id="buttonAllOn" value="All On">');
	
	$('#buttonAllOn').click(function(){ 
		allOn();
	}); 


	$('#connectStatus') 
		.append('<input class="btn btn-mini" type="button" id="buttonAllOff" value="All Off"><br>');
		
	$('#buttonAllOff').click(function(){ 
		allOff();
	}); 

	$('#connectStatus') 
		.append('<input class="btn btn-mini" type="button" id="buttonColorLoopOn" value="Color Loop On"><br>');

	$('#buttonColorLoopOn').click(function(){ 
		colorLoop(true);
	}); 

	$('#connectStatus') 
		.append('<input class="btn btn-mini" type="button" id="buttonColorLoopOff" value="Color Loop Off"><br>');

	$('#buttonColorLoopOff').click(function(){ 
		colorLoop(false);
	}); 
	$('#connectStatus') 
		.append('<input class="btn btn-mini" type="button" id="createGroup" value="Add Lights to New Group"><br>');

	$('#createGroup').click(function(){ 
		groups.push(activeLights);
		localStorage["groups"] = JSON.stringify(groups);
	}); 


	$('#connectStatus')
		.append('<input type="radio" name="group" value="yes" id="group_yes">All Lights');

	$('#connectStatus')
		.append('<input type="radio" name="group" value="no" id="group_no">Selected Lights');

	if(changeGroup){
		checked_id = '#group_yes';
	}
	else
	{
		checked_id = '#group_no';
	}

	$(checked_id).prop('checked', true);

	$('input[name=group]').click(function(){
		myRadio = $('input[name=group]');
		checkedValue = myRadio.filter(':checked').val();
		if (checkedValue == "yes")
		{
			changeGroup = true;
			localStorage["group"] = "true";
		}
		else if (checkedValue == "no")
		{
			changeGroup = false;
			localStorage["group"] = "false";
		}
	});
	$( "#slider" ).slider({ max: 255 });
	$( "#slider" ).on( "slidechange", function( event, ui ) {
		console.log(ui.value);
		setBrightness(ui.value);
	} );

	
}

function setBrightness(brightness)
{

	var URL = 'http://' + hueIP + '/api/userHueful/groups/0/action';
	dataString = '{"bri":' + brightness + '}';
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

function getVariables(){
	if(localStorage["group"] == "true")
	{
		changeGroup = true;
	}
	else if (localStorage["group"] == "false")
	{
		changeGroup = false;
	}
	else
	{
		localStorage["group"] = "true";
		changeGroup = false;
	}
	activeLights = JSON.parse(localStorage["activeLights"]);
	groups = JSON.parse(localStorage["groups"]);
	console.log(activeLights);


	

}

document.addEventListener('DOMContentLoaded', function () {
	getVariables();
  	findHue();
});
