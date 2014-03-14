<?php

mysql_connect('localhost', 'user', 'test123') or die(mysql_error());
mysql_select_db('maps') or die(mysql_error());

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('error_reporting', E_ALL);
ini_set('display_startup_errors', 'true');

require_once __DIR__ . '/vendor/autoload.php';
$klein = new \Klein\Klein();

#If /pin/id is requested, returns JSON containing information for that pin
$klein->respond('GET', '/pins/[:id]', function ($request) 
{
	$query = "SELECT * FROM pins WHERE id={$request->id}";
	$result = mysql_query($query) or die(mysql_error());	
	$row = mysql_fetch_array($result);
	return json_encode(array(
		"id" => $row['id'],
		"text" => $row['text'],
		"lat" => $row['lat'],
		"lng" => $row['lng']
		));
});

//If no specific pin is requested, return all in db. (Collection.fetch() case)
$klein->respond('GET', '/pins/', function() 
{
	$query = "SELECT * FROM pins";
	$result = mysql_query($query) or die(mysql_error());
	$temp = array();
	while ($row = mysql_fetch_array($result)) {
		$temp[] = array(
			"id" => $row['id'],
			"text" => $row['text'],
			"lat" => $row['lat'],
			"lng" => $row['lng']
			);
	}
	return json_encode($temp);
});

#Inserts a new pin to the database with a new ID (AI)
$klein->respond('POST', '/pins/', function()
{
	$data = json_decode(file_get_contents("php://input"), true);
	$text = $data['text'];
	$lat = $data['lat'];
	$lng = $data['lng'];
	$query = "INSERT INTO pins (text, lat, lng) VALUES ('$text', '$lat', '$lng')";
	mysql_query($query) or die(mysql_error());

	//return inserted object
	$lastid = mysql_insert_id();
	$returnquery = "SELECT * FROM pins WHERE id='$lastid'";
	$result = mysql_query($returnquery) or die(mysql_error());	
	$row = mysql_fetch_array($result);
	return json_encode(array(
		"id" => $row['id'],
		"text" => $row['text'],
		"lat" => $row['lat'],
		"lng" => $row['lng']
		));
});

#Updates a pin with id 'id' in the database
$klein->respond('PUT', '/pins/[:id]', function($request)
{
	$data = json_decode(file_get_contents("php://input"), true);
	$text = $data['text'];
	$lat = $data['lat'];
	$lng = $data['lng'];
	$query = "UPDATE pins SET text='$text', lat='$lat', lng='$lng' WHERE id={$request->id} LIMIT 1" or die(mysql_error());
	mysql_query($query);
});

#Deletes a pin with id 'id' from the database
$klein->respond('DELETE', '/pins/[:id]', function($request)
{
	$query = "DELETE FROM pins WHERE id={$request->id}";
	mysql_query($query) or die(mysql_error());

});


$klein->dispatch();
?>






