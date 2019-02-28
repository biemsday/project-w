var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client',express.static(__dirname + '/client'));

serv.listen(3000);
console.log('server started.');

var SOCKET_LIST = {};
var PLAYER_LIST = {};

//player info

var Player = function(id){
	var self = {
		x:100,
		y:10,
		id:id,
		number:"" + Math.floor(10 * Math.random()),
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		speed:1,
	}
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += self.speed;
		if(self.pressingLeft)
			self.x -= self.speed;
		if(self.pressingUp)
			self.y -= self.speed;
		if(self.pressingDown)
			self.y += self.speed;
	}
	return self;
}

//start server

var io = require('socket.io')(serv,{});

//connection

io.sockets.on('connection', function(socket){

	console.log('user connection');
	socket.id = Math.random();
	var player = Player(socket.id);
	SOCKET_LIST[socket.id] = socket;
	PLAYER_LIST[socket.id] = player;

//disconnection

	socket.on('disconnect',function(){

		console.log('user disconnection');
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];

	});

//movements

	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
	});
});

//update loop

setInterval(function(){
	var pack = [];
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/60);