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
let capabilities = [];
let deviceStatuses = [];

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
			this.capabilities = this.config.capabilities;
		}

		//This doesn't work as I'm unable to get device passed to the promise that gets the status. The last device looped is used for all statuses
		if (notification === "GET_DEVICES") {
			if (this.capabilities) {
				this.deviceStatuses = [];
				for (let i = 0; i < this.capabilities.length; i++) {
					let capability = this.capabilities[i];
					this.getDevicesByCapability(capability);
				}
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
			}, reason => {this.sendSocketNotification('ConsoleOutput', reason)}
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

			if (!this.isDeviceNameExcluded(device.label)) { //filter out virtual devices created for Sense
				this.deviceStatuses.push({
					"id": device.deviceId,
					"deviceName": device.label,
					"deviceTypeNAME": device.deviceTypeName,
					"deviceType": capability,
					"value": statusType
				});

				//this.sendSocketNotification('ConsoleOutput', device.deviceId);
				this.sendSocketNotification('DEVICE_STATUS_FOUND', this.deviceStatuses);
			}
		}, reason => {this.sendSocketNotification('ConsoleOutput', reason)});
	},

	isDeviceNameExcluded: function(deviceName) {
		for (let i = 0; i < this.config.excludedDeviceNames.length; i++) {
			if (deviceName.includes(this.config.excludedDeviceNames[i])) {
				return true;
			}
		}
		return false;
	}
});