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
let capabilities = null;

/*
	Capabilities statuses implemented:
	"switch"
	"contactSensor"
	"lock"
	"temperatureMeasurement"
	"relativeHumidityMeasurement"
	"motionSensor"

	Other capabilities reference: https://docs.smartthings.com/en/latest/capabilities-reference.html
*/


module.exports = NodeHelper.create({

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'SEND_CONFIG') {
			this.config = payload;
			this.st = new smartthings.SmartThings(this.config.personalAccessToken);
			capabilities = this.config.capabilities;
		}

		//This doesn't work as I'm unable to get device passed to the promise that gets the status. The last device looped is used for all statuses
		if (notification === "GET_DEVICES") {
			for (let i = 0; i < capabilities.length; i++) {
				let capability = capabilities[i];
				this.getDevicesByCapability(capability);
			}
		}
	},

	getDevicesByCapability: function(capability) {
		this.st.devices.listDevicesByCapability(capability).then(deviceList => {
				//this.sendSocketNotification('ConsoleOutput', deviceList);
				for (let i = 0; i < deviceList.items.length; i++) {
					let device = deviceList.items[i];
					//this.sendSocketNotification('ConsoleOutput', device.deviceId);
					this.getDeviceStatus(device, capability);
				}
			}
		);
	},

	getDeviceStatus: function(device, capability) {
		this.st.devices.getDeviceCapabilityStatus(device.deviceId, "main", capability).then(deviceStatus => {
			//this.sendSocketNotification('ConsoleOutput', device);

			let statusType = null;
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
				case 'temperatureMeasurement':
					statusType = deviceStatus.temperature.value;
					break;
				case 'relativeHumidityMeasurement':
					statusType = deviceStatus.humidity.value;
					break;
				case 'motionSensor':
					statusType = deviceStatus.motion.value;
					break;

			}
			if (!device.deviceTypeName.startsWith("Sense ")) { //filter out virtual devices created for Sense
				let deviceStatuses = {
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
	}
});
