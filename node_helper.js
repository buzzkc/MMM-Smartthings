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
var capabilities = null;

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
			capabilities = this.config.capabilities;
		}

		//This doesn't work as I'm unable to get device passed to the promise that gets the status. The last device looped is used for all statuses
		if (notification === "GET_DEVICES") {
			for (var i = 0; i < capabilities.length; i++) {
				var capability = capabilities[i];
				this.getDevicesByCapability(capability);
			}
		}
	},

	getDevicesByCapability: function(capability) {
		this.st.devices.listDevicesByCapability(capability).then(deviceList => {
				//this.sendSocketNotification('ConsoleOutput', deviceList);
				for (var i = 0; i < deviceList.items.length; i++) {
					var device = deviceList.items[i];
					//this.sendSocketNotification('ConsoleOutput', device.deviceId);
					this.getDeviceStatus(device, capability);
				}
			}
		);
	},

	getDeviceStatus: function(device, capability) {
		this.st.devices.getDeviceCapabilityStatus(device.deviceId, "main", capability).then(deviceStatus => {
			//this.sendSocketNotification('ConsoleOutput', device);

			var statusType = null;
			switch (capability) {
				case 'switch':
					statusType = deviceStatus.switch.value;
					break;
				case 'contactSensor':
					statusType = deviceStatus.contact.value;
					break;
				case 'lock':
					statusType = deviceStatus.lock.value;
					break;
			}
			if (!device.deviceTypeName.startsWith("Sense ")) {
				var deviceStatuses = {
					"id": device.deviceId,
					"deviceName": device.label,
					"deviceTypeNAME": device.deviceTypeName,
					"deviceType": capability,
					"value": statusType
				};

				//this.sendSocketNotification('ConsoleOutput', device.deviceId);
				this.sendSocketNotification('DEVICE_STATUS_FOUND', deviceStatuses);
			}
		});
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
