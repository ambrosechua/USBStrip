var express = require("express");
var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyACM0", {
	  baudrate: 9600
});
serialPort.on("open", function () {
	/*serialPort.on('data', function(data) {
		process.stderr.write(data);
	});*/
	setTimeout(function () {
	serialPort.write("2,3\n", function (err, results) {
		setTimeout(function () {
			serialPort.write("1,255\n", function (err, results) {
			});
		}, 500);
	});
	}, 2000);
});

var toHue = function (s) {
	return Math.floor(s / 64 * 256 % 256);
};

var state = 42;
var h;
var i = toHue(state);

var sp = 1;

var app = express();

app.get("/get", function (req, res) {
	res.end(state + "");	
});

app.get("/set/:i", function (req, res) {

	state = req.params.i;
	//console.log("3," + Math.floor(state / 64 * 256 % 256));
	res.status(200).end();

	if (h) {
		clearInterval(h);
	}
	h = setInterval(function () {
		if (i - toHue(state) > toHue(state) - i + 255) {
			i += sp;
		}
		else if (toHue(state) - i > i - toHue(state) + 255) {
			i -= sp;
		}
		else if (toHue(state) < i) {
			i -= sp;
		}
		else if (toHue(state) > i) {
			i += sp;
		}
		if (i > 255) {
			i = 0;
		}
		else if (i < 0) {
			i = 255;
		}
		if (Math.floor(toHue(state) / sp * 2) == Math.floor(i / sp * 2)) {
			i = toHue(state);
			console.log(i);
			clearInterval(h);
		}
		serialPort.write("3," + Math.floor(i) + "\n", function (err, results) {
		});
	}, 50)

});

app.listen(8026);
