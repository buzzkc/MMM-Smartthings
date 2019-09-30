/* Magic Mirror
 * Node Helper: MMM-Smartthings
 *
 * By BuzzKC
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const smartthings = require("smartthings-node");
let st;
let config;
//var device;
var capability = 'switch';

/*
"capability.switch"
"capability.switchLevel"
"capability.thermostat"
"capability.motionSensor"
"capability.accelerationSensor"
"capability.contactSensor"
"capability.illuminanceMeasurement"
"capability.temperatureMeasurement"
"capability.relativeHumidityMeasurement"
"capability.presenceSensor"
"capability.lock"
"capability.battery"
"capability.powerMeter"
"capability.energyMeter"
 */


module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		//console.log("Smartthings socket received");

		if (notification === 'SEND_CONFIG') {
			this.config = payload;
			this.st = new smartthings.SmartThings(this.config.personalAccessToken);
		}

		
		if (notification === "GET_DEVICES") {
			this.st.devices.listDevicesByCapability(capability).then(deviceList => {
					this.sendSocketNotification('DEVICES_FOUND', deviceList);
				}
			);
		}

		if (notification === "GET_DEVICE_STATUS") {
			var device = payload;
			//this.sendSocketNotification('ConsoleOutput', device.deviceId);

			this.st.devices.getDeviceCapabilityStatus(device.deviceId, "main", capability).then(deviceStatus => {
				var deviceStatuses = {
					"id": device.deviceId,
					"label": device.label,
					"deviceTypeName": device.deviceTypeName,
					"capability": capability,
					"status": deviceStatus.switch.value //todo - needs to use capability variable
				};

				if (device.deviceTypeName !=="Sense Energy Device") {
					//this.sendSocketNotification('ConsoleOutput', device.deviceId);
					this.sendSocketNotification('DEVICE_STATUS_FOUND', deviceStatuses);
				}

			}).bind(device);
		}


		if (notification === "GET_DEVICES_LOOP") {

			this.st.devices.listDevicesByCapability(capability).then(deviceList => {
					//this.sendSocketNotification('ConsoleOutput', deviceList);
					for (var i = 0; i < deviceList.items.length; i++) {
						var device = deviceList.items[i];
						//this.sendSocketNotification('ConsoleOutput', device.deviceId);

						this.st.devices.getDeviceCapabilityStatus(device.deviceId, "main", capability).then(deviceStatus => {
							var deviceStatuses = {
								"id": device.deviceId,
								"label": device.label,
								"deviceTypeName": device.deviceTypeName,
								"capability": capability,
								"status": deviceStatus.switch.value //todo - needs to use capability variable
							};
							//this.sendSocketNotification('ConsoleOutput', device.deviceId);
							this.sendSocketNotification('DEVICE_STATUS_FOUND', deviceStatuses);
						}).bind(device);

					}
				}
			);
		}
	},

	// Example function send notification test
	sendNotificationTest: function(payload) {
		this.sendSocketNotification("MMM-Smartthings-NOTIFICATION_TEST", payload);
	},

	// this you can create extra routes for your module
	extraRoutes: function() {
		var self = this;
		this.expressApp.get("/MMM-Smartthings/extra_route", function(req, res) {
			// call another function
			values = self.anotherFunction();
			res.send(values);
		});
	},

	// Test another function
	anotherFunction: function() {
		return {date: new Date()};
	}
});
