/**
 * Ajax library for wrapping home-agent and crawler api
 * Created by Reaz Ahmed on March 3, 2014 
 */

// Note: The paths for the cookies in login() must match the paths for the cookies in logout()
function login(username, password, homeagent) {
	$.cookie('username', username, {path: '/en/user_home'});
	$.cookie('password', password, {path: '/en/user_home'});
	$.cookie('homeagent', homeagent, {path: '/en/user_home'});
	document.location = "/en/user_home";
}

function logout() {
	$.removeCookie('username', {path: '/en/user_home'});
	$.removeCookie('password', {path: '/en/user_home'});
	$.removeCookie('homeagent', {path: '/en/user_home'});
	document.location = "/";
}

// creates a pweb_api object for accessing pweb API 
//   home_agent: optional. default: http://pwebproject.net/
//   port: optional. default empty.
function pweb_api(home_agent) {
	var ha_url;
	if (typeof home_agent == 'undefined')
		ha_url = "http://api.pwebproject.net";
	else ha_url = "http://"+home_agent;
	ha_url = ha_url + "/";
	
//	ha_url = "something.html"
	getErrorMessage = function (jqXHR, exception) {
		return jqXHR.status + '  ' + jqXHR.statusText + '  ' + exception;
	    if (jqXHR.status === 0) {
	        return ('Not connected.Please verify your network connection.');
	    } else if (jqXHR.status == 404) {
	        return ('The requested page not found. [404]');
	    } else if (jqXHR.status == 500) {
	        return ('Internal Server Error [500].');
	    } else if (exception === 'parsererror') {
	        return ('Requested JSON parse failed.');
	    } else if (exception === 'timeout') {
	        return ('Time out error.');
	    } else if (exception === 'abort') {
	        return ('Ajax request aborted.');
	    } else {
	        return ('Uncaught Error. ' + jqXHR.responseText + ' [' + jqXHR.status+']');
	    }
	};
	
	var authenticated_api_call = function(handler, parameters) {
		if (typeof parameters.username == 'undefined') 
		{
			handler({'status': 'error', 'error': 'Username undefined'});
			return false;
		}
		if (typeof parameters.password == 'undefined') 
		{
			handler({'status': 'error', 'error': 'Password undefined'});
			return false;
		}
		api_call(handler, parameters);
	};
	
	var api_call = function(handler, parameters) {
		$.ajax({
    		type: "GET", // "POST"  
    		url: ha_url,  //file name
    		data: parameters, 
    		dataType: 'json',
    		crossDomain : true, 
    		success: function(response, status) {
				if (status == "success") {
					if (typeof response.error !== 'undefined') {
						handler({"status": "error", "error": response.error});
					} else {
						handler(response);
					}
				} else {
					handler({"status": status, "error": "Ajax Error"});
				}
   			}, // end of success function
   			error : function(xhr, status, error_text) {
   				handler({"status": status, 
   					"error": getErrorMessage(xhr, error_text)});
   			}
			
		}); // end of ajax call
	};
	
	return {
		get_home_agent_list : 
			function(handler) {
				var ha_list_url = "http://mg.pwebproject.net/";
				$.ajax({  //Make the Ajax Request
		    		type: "GET", // "POST"  
		    		url: ha_list_url,  //file name
//		    		data: {"method": "get_homeagent_list" }, 
		    		dataType: 'json',
		    		crossDomain : true, 
		    		success: function(response, status) {
						if (status == "success") {
							handler(response);
						} else {
							handler({status: "error", error: "Ajax Error"});
						}
		   			}, // end of success function
		   			error : function(xhr, status, error_text) {
		   				handler({status: "error", 
		   								"error": getErrorMessage(xhr, error_text)});
		   			}
			   });    // end of ajax call
			}, 
		is_username_available : 
			function(username, handler) {
				$.ajax({  //Make the Ajax Request
		    		type: "GET", // "POST"  
		    		url: ha_url,  //file name
		    		data: {"method": "is_username_available", "username" : username }, 
		    		dataType: 'json',
		    		crossDomain : true, 
		    		success: function(response, status) {
						if (status == "success") {
							handler(response);
						} else {
							handler({status: "error", error: "Ajax Error"});
						}
		   			}, // end of success function
		   			error : function(xhr, status, error_text) {
		   				handler({status: "error", 
		   								"error": getErrorMessage(xhr, error_text)});
		   			}
			   });    // end of ajax call
			},
		register_user :
			function(handler, username, password, email, fullname, location, affiliation) {
				if (typeof fullname == 'undefined') fullname = '';
				if (typeof location == 'undefined') location = '';
				if (typeof affiliation == 'undefined') affiliation = '';
				$.ajax({
		    		type: "GET", // "POST"  
		    		url: ha_url,  //file name
		    		data: {"method": "register_user", 
		    				"username" : username,
		    				"password" : password,
		    				"email" : email,
		    				"fullname": fullname, 
		    				"location" : location,
		    				"affiliation" : affiliation }, 
		    		dataType: 'json',
		    		crossDomain : true, 
		    		success: function(response, status) {
						if (status == "success") {
							if (typeof response.error !== 'undefined') {
								handler({"status": "error", "error": response.error});
							} else {
								handler(response);
							}
						} else {
							handler({"status": status, "error": "Ajax Error"});
						}
		   			}, // end of success function
		   			error : function(xhr, status, error_text) {
		   				handler({"status": status, 
		   					"error": getErrorMessage(xhr, error_text)});
		   			}
					
				});
			},
		authenticate_user:
			function(username, password, handler) {
				authenticated_api_call(handler, {'method': 'authenticate_user', 'username': username, 'password': password});
			},
		get_device_list:
			function(username, handler) {
				api_call(handler, {'method': 'get_user_devices', 'username': username});
			},
		register_device:
			function(parameters, handler) {
				parameters.method = 'register_device';
				authenticated_api_call(handler, parameters);
			},
		update_device:
			function(parameters, handler) {
				parameters.method = 'update_device';
				authenticated_api_call(handler, parameters);
			},
		delete_device:
			function(devicename, username, password, handler) {
				authenticated_api_call(handler, {'method': 'delete_device', 'devicename': devicename, 'username': username, 'password': password});
			}
	};
}
