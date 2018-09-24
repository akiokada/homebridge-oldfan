var Service, Characteristic;
const gpio = require('rpi-gpio');
gpio.setMode(gpio.MODE_BCM);

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-oldfan", "OldFan", FanAccessory);
}

function FanAccessory(log, config) {
  this.log = log;
  this.fanName = config.name;
  this.pinLow = config.pinLow;
  this.pinMid = config.pinMid;
  this.pinHigh = config.pinHigh;
	this.log("Starting an old fan device with name '" + this.fanName + "'...");
  this.log("  Low Relay : " + this.pinLow);
  this.log("  Mid Relay : " + this.pinMid);
	this.log(" High Relay : " + this.pinHigh);
  this.state = {
    power: false,
    speed: 0,
  };
	gpio.setup(this.pinLow, gpio.DIR_LOW);
  gpio.setup(this.pinMid, gpio.DIR_LOW);
  gpio.setup(this.pinHigh, gpio.DIR_LOW);
}

FanAccessory.prototype.getFanState = function(callback) {
  var powerOn = this.powerState > 0;
  this.log("State [power, speed] for the '%s' is [%s, %s]", this.fanName, this.state.power, this.state.speed);
  callback(null, this.state);
}

FanAccessory.prototype.setFanState = function(state, callback) {
  this.log("Get state [power, speed] for the '%s' is [%s, %s]", this.fanName, this.state.power, this.state.speed);
  if (this.state.power && this.state.speed == 1) {
		gpio.write(this.pinLow, 1);
		gpio.write(this.pinMid, 0);
		gpio.write(this.pinHigh, 0);
  } else if (this.state.power && this.state.speed == 2) {
		gpio.write(this.pinLow, 0);
		gpio.write(this.pinMid, 1);
		gpio.write(this.pinHigh, 0);
  } else if (this.state.power && this.state.speed == 3) {
		gpio.write(this.pinLow, 0);
		gpio.write(this.pinMid, 0);
		gpio.write(this.pinHigh, 1);
  } else if (!this.state.power || this.state.speed == 0) {
		gpio.write(this.pinLow, 0);
		gpio.write(this.pinMid, 0);
		gpio.write(this.pinHigh, 0);
  }
  callback(null);
}

FanAccessory.prototype.getPowerOn = function(callback) {
  this.getFanState(function(error, state) {
    callback(null, state && state.power);
  });
}

FanAccessory.prototype.setPowerOn = function(value, callback) {
  if (this.state.power != value) {
    this.state.power = value;
    this.setFanState(this.state, callback);
  } else {
    callback(null);
  }
}

FanAccessory.prototype.getSpeed = function(callback) {
  this.getFanState(function(error, state) {
    callback(null, state && state.power);
  });
}

FanAccessory.prototype.setSpeed = function(value, callback) {
  if (this.state.speed != value) {
    this.state.speed = value;
    this.setFanState(this.state, callback);
  } else {
    callback(null);
  }
}

FanAccessory.prototype.getServices = function() {
    var fanService = new Service.Fan(this.name);
    
    fanService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
	fanService
	.getCharacteristic(Characteristic.RotationSpeed)
    .setProps({
      minValue: 0,
      maxValue: 3,
      minStep: 1,
    })
    .on('get', this.getSpeed.bind(this))
    .on('set', this.setSpeed.bind(this));
    
    return [fanService];
}
