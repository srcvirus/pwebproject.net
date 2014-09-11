function Device(properties) {
	for (var p in properties) this[p] = properties[p];
	
	var html = $('<div class="device_info" id="dev-' + this.devicename + '"><div id="dev-info-'+ this.devicename + '"></div>' + 
	'<div class="device_links"><a class="device_link" id="dev-edit-' + this.devicename + '">Edit</a> &bull; <a class="device_link" id="dev-delete-' + this.devicename + '">Delete</a></div></div>');
	
	$('#device_list').append(html);
	
	var device = this;
	
	$('#dev-edit-' + this.devicename).on('click', function() {
		device.edit();
	});
	
	$('#dev-delete-' + this.devicename).on('click', function() {
		device.remove();
	});
	
	this._update_device_info();
}

Device.prototype = {
	edit: function() {
		$('#devicename').val(this.devicename);
		$('#devicename').attr('readonly', true);
		$('#devicetype').val(this.type);
		$('#deviceip').val(this.ip);
		$('#deviceport').val(this.port);
		$('#devicepublicfolder').val(this.public_folder);
		$('#deviceprivatefolder').val(this.private_folder);
		$('#deviceos').val(this.os);
		$('#devicedesc').val(this.description);
		$('input[name=deviceindexed]').val([this.is_indexed.toString()]);
		
		$.fancybox({'href': '#device_editor'});
		
		var device = this;
		$('#devicesubmit').off('click').on('click', function() {			
			device.devicename = $('#devicename').val();
			device.type = $('#devicetype').val();
			device.ip = $('#deviceip').val();
			device.port = $('#deviceport').val();
			device.public_folder = $('#devicepublicfolder').val();
			device.private_folder = $('#deviceprivatefolder').val();
			device.os = $('#deviceos').val();
			device.description = $('#devicedesc').val();
			device.is_indexed = $('input[name=deviceindexed]:checked').val();
			
			if (device.devicename == "" || device.ip == "" || device.port == "")
			{
				alert("Device name, IP address, and port number are manadory fields.");
				return;
			}
			
			device._update_device_info();
			
			papi.update_device({'devicename': device.devicename,
								'username': username,
								'password': password,
								'type': device.type,
								'ip': device.ip,
								'port': device.port,
								'public_folder': device.public_folder,
								'private_folder': device.private_folder,
								'os': device.os,
								'description': device.description,
								'is_indexed': device.is_indexed},
								function(response) {
									if (response.status != "success") {
										alert("Failed to update device information for " + device.devicename + " at the home agent.");
										location.reload(true);
									}
								});
			
			$.fancybox.close();
		});
	},
	
	remove: function() {
		var reallydelete = confirm("Are you sure that you want to delete the device " + this.devicename + "?");
		if (reallydelete) {
			$('#dev-' + this.devicename).remove();
			
			var device = this;
			papi.delete_device(this.devicename, username, password, function(response) {
				if (response.status != "success") {
					alert("Failed to delete device " + device.devicename + " at the home agent.");
					location.reload(true);
				}
			});
		}
	},
	
	_update_device_info: function() {
		var html = '<table>' +
		'<tr><th colspan="2"><h1>' + this.devicename + '</h1></th></tr>' +
		'<tr><th>Type</th><td><span class="devinfo">' + this.type + '</span></td></tr>' +
		'<tr><th>IP Address</th><td><span class="devinfo">' + this.ip + '</span></td></tr>' +
		'<tr><th>Port</th><td><span class="devinfo">' + this.port + '</span></td></tr>' +
		'<tr><th>Public Folder</th><td><span class="devinfo">' + this.public_folder + '</span></td></tr>' +
		'<tr><th>Private Folder</th><td><span class="devinfo">' + this.private_folder + '</span></td></tr>' +
		'<tr><th>Operating System</th><td><span class="devinfo">' + this.os + '</span></td></tr>' +
		'<tr><th>Description</th><td><span class="devinfo">' + this.description + '</span></td></tr>' +
		'<tr><th>Publicly Indexed</th><td><span class="devinfo">' + this.is_indexed + '</span></td></tr>' +
		'</table>';
		
		$('#dev-info-' + this.devicename).html(html);
	}
};

$(function() {
	$('.fancybox').fancybox();
	
	// global variables
	username = $.cookie('username');
	password = $.cookie('password');
	homeagent = $.cookie('homeagent');
	
	if (typeof username == 'undefined' || typeof password == 'undefined' || typeof homeagent == 'undefined')
		logout();
	
	// global variable
	papi = new pweb_api(homeagent);


	papi.authenticate_user(username, password, function(response) {
		if (response.status == "success") {
			update_device_list();
		} else {
			$('#device_list').text("Authentication failed: " + response.error);
		}
	});
});

function update_device_list() {
		papi.get_device_list(username, function(response) {
		if (response.status == "success") {
			$('#device_list').html('<h1><span>Your Devices</span></h1>' +
			'<div id="menu_bar"><a class="menu_link" id="new-device">Add Device</a> &bull; <a class="menu_link" id="logout">Logout</a>');
			$('#new-device').on('click', add_device);
			$('#logout').on('click', logout);
			
			// MOCK DATA
//			var response = {'devices': [{
//					'devicename': 'test device',
//					'type': 'laptop',
//					'ip': '184.106.242.193',
//					'port': '8080',
//					'public_folder': 'shared/Public',
//					'private_folder': 'notshared/Private',
//					'os': 'Ubuntu 14.04',
//					'description': 'My laptop on loan from the School of Computer Science',
//					'is_indexed': 'true'
//			}]};
			
			for (var i = 0; i < response.devices.length; ++i) {
				new Device(response.devices[i]);
			}
		} else {
			$('#device_list').text("Unable to retrieve device list: " + response.error);
		}
	});
}

function add_device() {
	$('#device_editor input[type=text]').val('');
	$('#devicename').attr('readonly', false);
	$('input[name=deviceindexed]').val(['true']);
	
	$.fancybox({'href': '#device_editor'});
	
	var deviceprops = {};
	$('#devicesubmit').off('click').on('click', function() {	
		deviceprops.devicename = $('#devicename').val();
		deviceprops.type = $('#devicetype').val();
		deviceprops.ip = $('#deviceip').val();
		deviceprops.port = $('#deviceport').val();
		deviceprops.public_folder = $('#devicepublicfolder').val();
		deviceprops.private_folder = $('#deviceprivatefolder').val();
		deviceprops.os = $('#deviceos').val();
		deviceprops.description = $('#devicedesc').val();
		deviceprops.is_indexed = $('input[name=deviceindexed]:checked').val() == 'true';
		
		if (deviceprops.devicename == "" || deviceprops.ip == "" || deviceprops.port == "")
		{
			alert("Device name, IP address, and port number are manadory fields.");
			return;
		}
		
		var device = new Device(deviceprops);
		device._update_device_info();
		
		papi.register_device({'devicename': device.devicename,
							'username': username,
							'password': password,
							'type': device.type,
							'ip': device.ip,
							'port': device.port,
							'public_folder': device.public_folder,
							'private_folder': device.private_folder,
							'os': device.os,
							'description': device.description,
							'is_indexed' : device.is_indexed},
							function(response) {
								if (response.status != "success") {
									alert("Failed to create device " + device.devicename + " at the home agent.");
									location.reload(true);
								}
							});
		
		$.fancybox.close();
	});
}

