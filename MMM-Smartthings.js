/* global Module */

/* Magic Mirror
 * Module: MMM-Smartthings
 *
 * By BuzzKC
 * MIT Licensed.
 */

Module.register("MMM-Smartthings", {
	deviceStatuses: [],

	defaults: {
		updateInterval: 30000, //API rate limit: A maximum of 250 executions per minute is allowed for each installed SmartApp or Device Handler.
		personalAccessToken: '', //setup personal access token at https://account.smartthings.com/tokens,
		capabilities: [],
		title: 'Devices'
	},

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

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		let self = this;

		//Flag for check if module is loaded
		this.loaded = false;
		this.sendConfig();
		this.getData();
		// Schedule update timer.
		setInterval(function() {
			self.updateDom();
			self.getData();
		}, this.config.updateInterval);

	},

	sendConfig: function() {
		Log.info(`[${this.name}]: SEND_CONFIG`, this.config);
		this.sendSocketNotification('SEND_CONFIG', this.config);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		Log.info(`[${this.name}]: GET_DEVICES`, null);
		this.sendSocketNotification("GET_DEVICES", null);
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		let nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		let self = this;
		setTimeout(function() {
			console.log("Scheduled update running");
			self.getData();

		}, nextLoad);
	},

	getDom: function() {
		let self = this;
		const wrapper = document.createElement('div');
		if (this.deviceStatuses === null || this.deviceStatuses.length === 0) {
			wrapper.innerHTML =
				'<div class="loading"><span class="zmdi zmdi-rotate-right zmdi-hc-spin"></span> Loading...</div>';

			//retry ui update in a few seconds, data may still be loading
			setTimeout(function() {
				console.log("Retrying update");
				self.updateDom();
			}, 5000);

			return wrapper;
		}

		this.deviceStatuses = this.deviceStatuses.sort(this.compareDeviceNames); //sort device names
		this.deviceStatuses = this.deviceStatuses.sort(this.compareDeviceTypes); //sort by device types

		const deviceKeys = Object.keys(this.deviceStatuses) || [];
		wrapper.innerHTML = `
      <h2 class="title">${this.config.title}</h2>
      <ul class="sensors">
        ${deviceKeys
			.map(sensorKey => {
				const device = this.deviceStatuses[sensorKey];
				let iconClass = 'zmdi';
				let rowClass = '';
				if (device.value === 'locked' || device.value === 'closed') {
					iconClass = `${iconClass} zmdi-lock`;
					rowClass = `${rowClass} ok`;
				} else if (device.value === 'unlocked' || device.value === 'open') {
					iconClass = `${iconClass} zmdi-lock-open`;
					rowClass = `${rowClass} error`;
				} else if (device.value === 'on') {
					iconClass = `${iconClass} zmdi-power`;
					rowClass = `${rowClass} error`;
				} else if (device.value === 'off') {
					iconClass = `${iconClass} zmdi-minus-circle-outline`;
					rowClass = `${rowClass} ok`;
				}
				return `
                <li class="sensor ${rowClass}">
                  <span class="sensor-icon ${device.deviceType}"></span>
                  <span class="sensor-name">${device.deviceName}</span>
                  <span class="sensor-status-icon ${iconClass}"></span>
                  <span class="sensor-status-name">${device.value}</span>
                </li>
            `;
			})
			.join('')}
		  </ul>
		`;
		return wrapper;
	},

	compareDeviceNames: function (a, b) {
		// Use toUpperCase() to ignore character casing
		const deviceNameA = a.deviceName.toUpperCase();
		const deviceNameB = b.deviceName.toUpperCase();

		let comparison = 0;
		if (deviceNameA > deviceNameB) {
			comparison = 1;
		} else if (deviceNameA < deviceNameB) {
			comparison = -1;
		}
		return comparison;
	},

	compareDeviceTypes: function (a, b) {
		// Use toUpperCase() to ignore character casing
		const deviceTypeA = a.deviceType.toUpperCase();
		const deviceTypeB = b.deviceType.toUpperCase();

		let comparison = 0;
		if (deviceTypeA > deviceTypeB) {
			comparison = 1;
		} else if (deviceTypeA < deviceTypeB) {
			comparison = -1;
		}
		return comparison;
	},

	getScripts: function() {
		return [
			'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js',
		];
	},

	getStyles: function () {
		return [
			'https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css',
			"MMM-Smartthings.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "DEVICE_STATUS_FOUND") {
			// set dataNotification
			//console.log(payload);
			this.deviceStatuses = payload;
		}

		//messages to display in console from node_helper and other backend processes.
		if (notification === "ConsoleOutput") {
			console.log("OUTPUT_LOG:");
			console.log(payload);
		}
	}
});