// Requirements
var command = require('../commands');
var config = require('../config.js');
var exec = require('child_process').exec;
var express = require('express');
var fs = require('fs');
var johnny = require('../johnnybot');
var path = require("path");
var request = require('request');
var router = express.Router();
var SunCalc = require('suncalc');
// List of End points

// /

// /ping
// Your usual vanilla ping, nothing more than pong

// /ping/auth/<key>
// Same as above but requires authentication

// /tv/on/<key>
// Turns the TV on, duh

// /tv/off/<key>
// Same as above, but different

// /arriving/<key>
// Triggers a sequence of events when you ARRIVE at the geofence.
// If the current time is after sunset and before sunrise, it triggers the lights(True) command to turn on the lights when you get home.

// /leaving/<key>
// Triggers a sequence of events when you LEAVE the geofence

// /lights/<state>/<key>
// Turns the lights on or off. State accepts paramenter "on" or "off"

// /sunset/<key>
// Triggers a sequence of events when the sun sets

// /sunrise/<key>
// Triggers a sequence of events when the sun sets




/* GET home page. */
router.get('/', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Hello World' }));
});

router.get('/ping', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Pong' }));
});

router.get('/ping/auth/' + config.hashkey, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Auth Pong' }));
});

// /kodi/on/<key>
router.get('/kodi/on/' + config.hashkey, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Turning kodi ON' }));
	command.kodiOn();
});

// /kodi/off/<key>
router.get('/kodi/off/' + config.hashkey, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Turning kodi OFF' }));
	command.kodiOff();
});

// /tv/on/<key>
router.get('/tv/:state/' + config.hashkey, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Turning the tv ' + req.params.state + '!' }));
	command.tv(req.params.state);
});

// /tv/status/<key>
router.get('/tv/status/' + config.hashkey, function(req, res, next){
	 
	res.setHeader('Content-Type', 'application/json');
	command.tvStatus(res.send(JSON.stringify({ response: tv_status })));
	
});

// /arriving/<key>
router.get('/arriving/' + config.hashkey, function(req, res,next){
	try {
		command.house(false);
		var times = SunCalc.getTimes(new Date(), config.home.town_lat, config.home.town_long);

		var today = new Date();
		command.addActivity('Bruno', 'arriving', 'home', today);

		command.tv(true);
		console.log(times);
		if(today <= times['sunrise'] || today >= times['sunset'] ){
			johnny.sendMessage(config.telegram.telegram_chat_id, 'It\'s so dark! I am going to turn on the lights');
			command.lights(true);
		}

		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ response: 'Welcome home!' }));
	} catch (e) {
		console.log(e)
	}
});

// /leaving/<key>

router.get('/leaving/' + config.hashkey, function(req, res,next){

	command.house(true);
	command.tv(false)
	command.lights(false);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Godspeed!' }));
	johnny.sendMessage(config.telegram.telegram_chat_id, 'leaving' );

	var today = new Date();
	command.addActivity('Bruno', 'leaving', 'Home', today);

});


// /lights/<state>/<key>

router.get('/lights/:state/' + config.hashkey, function(req, res,next){

	command.lights(req.params.state);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Go go gadget lights!' }));

});

router.get('/alert/' + config.hashkey, function(req, res,next){

	var state = true;

	command.alert(state);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ response: 'Go go gadget lights!' }));

});

// /sunset/<key>
router.get('/sunset/' + config.hashkey, function(req, res,next){

		var db = new sqlite3.Database(database.prod.filename);
		var is_empty = null;
		db.serialize( function(){
		   db.all('select is_empty from house;', function(err,rows){
		    
		    if ( rows[0].is_empty === 1 ){
 
		    }else{
		    	// Do something
		    	command.lights(true);
		    }
		   } );

		});
		db.close(); 
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ response: 'Sun in the sky, you know how I feel ...' }));
		// It isn't accessible
	
});

// /sunrise/<key>

router.get('/sunrise/' + config.hashkey, function(req, res,next){

		var db = new sqlite3.Database(database.prod.filename);
		var is_empty = null;
		db.serialize(function() {
		    db.all('select is_empty from house;', function(err, rows) {

		        if (rows[0].is_empty === 1) {
		            //'There is no one home ';
		        } else {
		            var url = config.philips.philipsbridge + 'api/' + config.philips.philipsbridge_user + '/lights';
		            client.get(url, function(data, response) {
		                // parsed response body as js object 
		                if (data[1].state.on === true) {
		                    command.lights(false);
		                } else {

		                }

		            });

		        }
		    })
		});

		db.close(); 
		// Do something
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ response: 'Sunrise, sunrise Looks like mornin\' in your eyes' }));

		// It isn't accessible

});

router.get('/alloff/' + config.hashkey, function(req, res,next){
		command.tv(false);
		command.lights(false);
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ response: 'Good night!' }));
});

// Sense and respond ! 
router.put('/telegram/' + config.hashkey, function(req, res,next){
  try {
    var value = req.body.arg;
    johnny.sendMessage(config.telegram.telegram_chat_id, value );
	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ response: value }));

    // Do something
  } catch (e) {
    // It isn't accessible

  }
});

router.put('/activity/' + config.hashkey, function(req, res,next){
  try {
    var user = req.body.user;
    var action = req.body.action;
    var location = req.body.location;
    var time = new Date();

    var resp = 'I last saw ' + user + ' ' + action + ' at ' + location + ' on ' + time;
		
	command.addActivity(user, action, location, time);

    johnny.sendMessage(config.telegram.telegram_chat_id, resp );
	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ response: resp }));

    // Do something
  } catch (e) {
    // It isn't accessible

  }
});


module.exports = router;
