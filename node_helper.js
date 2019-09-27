/* Magic Mirror
 * Node Helper: MMM-Smartthings
 *
 * By BuzzKC
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const smartthings = require("smartthings-node");
let st = new smartthings.SmartThings(this.config.personalAccessToken);

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
		if (notification === "MMM-Smartthings-NOTIFICATION_TEST") {
			console.log("Working notification system. Notification:", notification, "payload: ", payload);
			// Send notification
			//this.sendNotificationTest(this.anotherFunction()); //Is possible send objects :)
			st.devices.listDevicesByCapability('switch')
				.then(deviceList => {
					console.log(deviceList);
					this.sendSocketNotification('SENSORS_CHANGED', deviceList);
				})
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
