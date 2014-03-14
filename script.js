//Map Styles
var myStyles = 
[{
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
}];
//Map Options, setup - includes myStyles previously defined.
var map_options = 
{
        disableDoubleClickZoom: true,
        center: new google.maps.LatLng(40.762861, -73.975274),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: myStyles
}

function createLatLngObject(Latitude, Longitude) 
{
       	var latlng = new google.maps.LatLng(parseFloat(Latitude), parseFloat(Longitude));
     	return latlng;
}
var TextContent = Backbone.View.extend(
{	
	tagName: 'div',
	id: 'textarea',

	events: {	
		"keyup textarea": "updateModel"
	},

	updateModel: function(event)
	{	
		this.model.set({text: event.target.value});
		this.model.save();
	},

	render: function(tagtype) 
	{	
		//lägg till textarea här, renderar endast om innehållet
		var text = this.model.get('text');
		if (tagtype == 'div' && text.length > 0)
		{
			arrayOfLines = text.match(/[^\r\n]+/g);
			arrayOfLines[0] = '<b>' + arrayOfLines[0] + '</b>';
			text = arrayOfLines.join('<br/>');
			//text = text.replace(/\r?\n/g, '<br/>');
		}
		var html = '<' + tagtype + '>' + text + '</' + tagtype + '>';
		$(this.el).html(html);
	}	
});

//Backbone view responsible for drawing the map, & content on it.
var MapView = Backbone.View.extend(
{
	tagName: 'div',
	id: 'map_canvas',
	map: null,
	activeContent: new TextContent(),
	infowindow: new google.maps.InfoWindow(),

	initialize: function() 
	{	
        this.collection.on('add', this.createMarker, this);
        google.maps.event.addListener(this.infowindow, 'content_changed', function(event)
        	{
        	});
    },

	render: function()
	{      
		var	view = this;
        map = new google.maps.Map(this.el, map_options);

		google.maps.event.addListener(map, 'dblclick', function(event) 
		{ 
			view.collection.addPin(event.latLng);
		});
		google.maps.event.addListener(map, 'click', function(event)
		{
			view.hideInfoWindow();
		});

		// return the view
        return this;
	},

	createMarker: function(pin) 
	{	
		view = this;
		var marker = new google.maps.Marker(
		{
			position: createLatLngObject(pin.get('lat'), pin.get('lng')),
			map: map,
			//link pin model to marker
			id: pin.get('id')
		});

		//add listener to the new marker so that it is removable
		google.maps.event.addListener(marker, 'dblclick', function(event) 
		{
			marker.setMap(null);
			view.collection.removePin(marker);
		});

		google.maps.event.addListener(marker, 'mouseover', function(event)
		{
			view.showInfoWindow(marker);
		});

		google.maps.event.addListener(marker, 'click', function(event)
		{
			view.updateInfo(marker);
		});
	},

	updateInfo: function(marker)
	{
		var activePin = this.collection.get(marker.id);
		this.activeContent.model = activePin;	
		this.activeContent.render('textarea rows="3"');

		this.infowindow.setContent(this.activeContent.el);
		this.infowindow.open(map, marker);
	},

	showInfoWindow: function(marker) {
		var activePin = this.collection.get(marker.id);
		this.activeContent.model = activePin;
		this.activeContent.render('div');
		this.infowindow.setContent(this.activeContent.el);
		this.infowindow.open(map, marker);
	},

	hideInfoWindow: function() {		
		this.infowindow.close();
	}
});

//Pin model
var Pin = Backbone.Model.extend(
{
	urlRoot: '/pins/'
});

//Pin collection, contains multiple Pin models.
var PinList = Backbone.Collection.extend(
{
	model: Pin,
	url: '/pins/',

	initialize: function() 
	{
		this.fetch();
	},

	addPin: function(latlng) 
	{	
		var that = this;
		var latitude = latlng.lat();
		var longitude = latlng.lng();
		var pin = new Pin({lat: latitude, lng: longitude, text: ""});
		pin.save(null, {
			success: function(model, response) {
				that.add(model);
			}
		});
	},
	
	removePin: function(marker) 
	{	
		var pin = this.get(marker.id);
		pin.destroy();
	}
});

var autocompleteMarker;
function addAutocompleteFunctions()
{	
	var input = (document.getElementById('searchTextField'));
	var autocomplete = new google.maps.places.Autocomplete(input);
	google.maps.event.addListener(autocomplete, 'place_changed', function() 
	{
		if (autocompleteMarker != null) 
		{	
			console.log("removing marker");
			autocompleteMarker.setVisible(false);
			autocompleteMarker.setMap(null);
		}		
		
		var place = autocomplete.getPlace();
		if (!place.geometry) { return; }
		if (place.geometry.viewport) {
      		map.fitBounds(place.geometry.viewport);
    	} else {
      		map.setCenter(place.geometry.location);
      		map.setZoom(17);
    	}
      	autocompleteMarker = new google.maps.Marker(
      	{
   			map: map
  		});

      	autocompleteMarker.setIcon((
      	{
			url: 'http://c.dryicons.com/images/icon_sets/symbolize_icons_set/png/128x128/arrow_down.png',
			size: new google.maps.Size(71, 71),
		   	origin: new google.maps.Point(0, 0),
		  	anchor: new google.maps.Point(17, 34),
		  	scaledSize: new google.maps.Size(35, 35)
	    }));
	    autocompleteMarker.setPosition(place.geometry.location);
	    autocompleteMarker.setVisible(true);	
	});
}

$('document').ready(function()
{	
	addAutocompleteFunctions();
	var pinList = new PinList();
	var mapView = new MapView({collection: pinList});
	$("body").append(mapView.render().el);
});
