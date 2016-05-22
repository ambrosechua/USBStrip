var express = require("express");

var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort(process.argv[2], {
	  baudrate: 115200
});

var lightstate = false;

var tT;
var leds = 37;

var toHue = function (s) {
	return Math.floor(s / 64 * 256 % 256);
};

var hslToRgb = function (h, s, l) {
	var r, g, b;
	if (s == 0) {
		r = g = b = l; // achromatic
	} else {
		var hue2rgb = function (p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

var state = 42;
var lightness = 0.5;
var h;
var i = toHue(state);

var sp = 1;

var writeLED = function (i, r, g, b, cb) {
	serialPort.write(new Buffer([0x12, i, r, g, b]), function () {
		//serialPort.drain(function (err) {
		//	cb(err);
		cb();
		//});
	});
};

var update = function (cb) {
	serialPort.write(new Buffer([0x11]), function () {
		//serialPort.drain(function (err) {
		//	cb(err);
		cb();
		//});
	});
};

var writeAllLED = function (color, cb) {
	var buff = [];
	for (var i = 0; i < leds; i++) {
		var c = color(i);
		buff.push(0x12, i, c[0], c[1], c[2]);
	}
	var chunksize = 5;
	var j = 0;
	var loop = function () {
		serialPort.write(new Buffer(buff.slice(j, j + chunksize)), function () {
			//serialPort.drain(function (err) {
				j += chunksize;
				if (j < buff.length) {
					loop();
				}
				else {
					cb();
				}
			//});
		});
	};
	loop();
};

var flash = function (color, cb) {
	writeAllLED(color, function () {
		update(cb);
	});
};

var slide = function (color, cb, time) {
	var i = -1;
	var loop = function () {
		i++;
		if (i < leds) {
			var c = color(i);
			tT = setTimeout(function () {
				writeLED(i, c[0], c[1], c[2], function () {
					update(loop);	
				});
			}, time || 30);
		}
		else {
			cb();
		}
	};
	loop();
};

var fade = function (color, cb) {

};

serialPort.on("open", function () {
	serialPort.on("data", function (d) {
		var i = 0;
		var read = () => {
			if (d.length == i)
				return null;
			return d[i++];
		};
		var cmd;
		while (cmd = read()) {
			if (cmd == 0x17) {
				var n = read();
				if (n === null) {
					break;
				}
				var state = n == 0xff;
				// state
				//state slide(() => { return [0, 0, 0]; }, () => {}, 20);
				if (state) {
					lightstate = !lightstate;
					lightstate ? setLightness(0) : setLightness(1);
				}
			}
		}
	});
	/*
	setTimeout(function () {
		var bytes = [];
		bytes.push();
		for (var i = 0; i < leds; i++) {
			bytes.push(0x12, i, 0, 0, 255);
		}
		bytes.push(0x11);
		var data = new Buffer(bytes);
		console.log(data);
		serialPort.write(data);
		serialPort.drain(function (err, results) {
			console.log("all blue");
		});
	}, 5000);
	*/
	var a = function () {
		slide(function (i) {
			return [0, 0, 255];
		}, function () {
			slide(function (i) {
				return [255, 0, 0];
			}, function () {
				slide(function (i) {
					return [0, 255, 0];
				}, function () {
					a();
				});
			});
		});
	};
	//a();
});

var app = express();

app.get("/get", function (req, res) {
	res.end(state + "");	
});

app.get("/set/:i", function (req, res) {

	state = req.params.i * 1;
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
			clearInterval(h);
		}
		flash(function (la) {
			return hslToRgb(i / 256, 1, lightness);
		}, function () {
				
		});
	}, 20);

});

var lightnessT;
var setLightness = (l) => {
	clearTimeout(lightnessT);
	clearTimeout(tT);

	var from = lightness;
	var to = l * 1;

	var a = function () {
		flash(function (la) {
			return hslToRgb(toHue(state) / 256, 1, lightness);
		}, function () {
			lightness = lightness + (to - from) * 0.02;
			if ((to - from) < 0 ? lightness > to : lightness < to) {
				lightnessT = setTimeout(function () {
					a();
				}, 16);
			}
			else {
				lightness = to;
				lightnessT = setTimeout(() => {
					flash(() => { 
						return hslToRgb(toHue(state) / 256, 1, lightness);
					}, () => {
					});
				}, 16);
			}
		});
	};

	a();
};
app.get("/lightness/set/:i", function (req, res) {
	res.status(200).end();
	
	setLightness(req.params.i);
});

app.get("/demo1/start", function (req, res) {
	res.status(200).end();

	var a = function () {
		slide(function (la) {
			return hslToRgb(0, 1, 0);
		}, function () {
			setTimeout(b, 500);
		}, Math.floor(1000 / leds));
	};

	var b = function () {
		slide(function (la) {
			return hslToRgb(la / leds, 1, 0.5);
		}, function () {
			c(0);
		}, Math.floor(1000 / leds));
	};
	
	var c = function (i) {
		flash(function (la) {
			return hslToRgb((la / leds + i / 150) % 1 , 1, 0.5);
		}, function () {
			if (i < 400) {
				setTimeout(function () {
					c(i + 1);
				}, 16);
			}
			else {
				d(0);
			}
		});
	};

	var d = function () {
		slide(function (la) {
			return hslToRgb(0, 1, 0);
		}, function () {
			e(0);
		}, Math.floor(1000 / leds));
	};

	var e = function (i) {
		slide(function (la) {
			return hslToRgb((la / leds / 16 + i / 10) % 1, 1, 0.5);
		}, function () {
			if (i < 199) {
				e(i + 1);
			}
			else {
				f();
			}
		}, 50 / (i / 200 * 50)); 
	};
	
	var f = function () {
		slide(function (la) {
			return hslToRgb(i / 256, 1, 0.5);
		}, function () {

		}, Math.floor(1000 / leds));
	};

	a();
});

var demo2 = false;

app.get("/demo2/start", function (req, res) {
	res.status(200).end();

	demo2 = true;
	
	var a = function () {
		slide(function (la) {
			return hslToRgb(la / leds, 1, 0.5);
		}, function () {
			b(0);
		}, Math.floor(1000 / leds));
	};

	var b = function (i) {
		flash(function (la) {
			return hslToRgb((la / leds + i / 150) % 1 , 1, 0.5);
		}, function () {
			if (demo2) {
				setTimeout(function () {
					b(i + 1);
					if (i == 30000) {
						i = 0;
					}
				}, 16);
			}
			else {
				c();
			}
		});
	};

	var c = function () {
		slide(function (la) {
			return hslToRgb(i / 256, 1, 0.5);
		}, function () {

		}, Math.floor(1000 / leds));
	};

	a();
});
app.get("/demo2/stop", function (req, res) {
	res.status(200).end();

	demo2 = false;
});
app.listen(8026);
