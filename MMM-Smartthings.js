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
		updateInterval: 10000,
		retryDelay: 5000,
		personalAccessToken: '', //setup personal access token at https://account.smartthings.com/tokens,
		capabilities: [],
		title: 'Devices'
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;
		this.sendConfig();

		console.log("Smartthings - send socket notification");
		this.sendSocketNotification("GET_DEVICES", null);
		// Schedule update timer.

		//this.getData();
		setInterval(function() {
			self.updateDom();
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
		var self = this;

		//send socket notification to node_helper to initialize and return data.

		var urlApi = "https://jsonplaceholder.typicode.com/posts/1";
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function() {
			console.log(this.readyState);
			if (this.readyState === 4) {
				console.log(this.status);
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		const wrapper = document.createElement('div');
		if (this.deviceStatuses === null) {
			wrapper.innerHTML =
				'<div class="loading"><span class="zmdi zmdi-rotate-right zmdi-hc-spin"></span> Loading...</div>';
			return wrapper;
		}
		const sensorKeys = Object.keys(this.deviceStatuses) || [];
		wrapper.innerHTML = `
      <h2 class="title">${this.config.title}</h2>
      <ul class="sensors">
        ${sensorKeys
			.map(sensorKey => {
				const sensor = this.deviceStatuses[sensorKey];
				let iconClass = 'zmdi';
				let rowClass = '';
				if (sensor.value === 'locked' || sensor.value === 'closed') {
					iconClass = `${iconClass} zmdi-lock`;
					rowClass = `${rowClass} ok`;
				} else if (sensor.value === 'unlocked' || sensor.value === 'open') {
					iconClass = `${iconClass} zmdi-lock-open`;
					rowClass = `${rowClass} error`;
				} else if (sensor.value === 'on') {
					iconClass = `${iconClass} zmdi-power`;
					rowClass = `${rowClass} error`;
				} else if (sensor.value === 'off') {
					iconClass = `${iconClass} zmdi-minus-circle-outline`;
					rowClass = `${rowClass} ok`;
				}
				return `
                <li class="sensor ${rowClass}">
                  <span class="sensor-icon ${sensor.deviceType}"></span>
                  <span class="sensor-name">${sensor.deviceName}</span>
                  <span class="sensor-status-icon ${iconClass}"></span>
                  <span class="sensor-status-name">${sensor.value}</span>
                </li>
            `;
			})
			.join('')}
		  </ul>
		`;
		return wrapper;
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

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-Smartthings-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-Smartthings-NOTIFICATION_TEST") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}

		if(notification === "SENSORS_CHANGED") {
			// set dataNotification
			console.log(payload);
			for (var i = 0; i < payload.length; i++) {
				console.log(payload[i].id);
			}
		}

		if(notification === "DEVICES_FOUND") {
			var me = this;
			// set dataNotification
			//console.log(payload);
			for (var i = 0; i < payload.items.length; i++) {
				//console.log(payload.items[i]);
				me.sendSocketNotification("GET_DEVICE_STATUS", payload.items[i]);
			}
		}

		if(notification === "DEVICE_STATUS_FOUND") {
			// set dataNotification
			console.log(payload);
			this.deviceStatuses.push(payload);
			//console.log(this.deviceStatuses);
			//for (var i = 0; i < payload.length; i++) {
				//console.log(payload);
			//}

		}

		if (notification === "ConsoleOutput") {
			console.log("OUTPUT_LOG:");
			console.log(payload);
		}
	}
});
