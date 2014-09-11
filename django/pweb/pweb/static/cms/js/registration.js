/**
 * 
 */

$(function() {
    //original field values
	var debug = true;
    var field_values = {
            //id        :  value
    		'home_agent': 'mg',
            'username'  : 'username',
            'password'  : 'password',
            'cpassword' : 'password',
            'fullname'  : 'full name',
            'email'  : 'email address',
            'affiliation' : 'affiliation',
            'country' : 'country'
    };

    //inputfocus
//    $('input#username').inputfocus({ value: field_values['username'] });
    $('input#username').inputfocus({ value: field_values['username'] });
    $('input#password').inputfocus({ value: field_values['password'] });
    $('input#cpassword').inputfocus({ value: field_values['cpassword'] });
    $('input#fullname').inputfocus({ value: field_values['fullname'] });
    $('input#email').inputfocus({ value: field_values['email'] });
    $('input#affiliation').inputfocus({ value: field_values['affiliation'] });
    $('input#country').inputfocus({ value: field_values['country'] });

    //reset progress bar
    $('#progress').css('width','0');
    $('#progress_text').html('0% Complete');

    //first_step
    $('form').submit(function(){ return false; });
    $('#submit_first').click(function(){
        //update progress bar
        $('#progress_text').html('33% Complete');
        $('#progress').css('width','113px');

    	$('#first_step').slideUp();
        $('#second_step').slideDown();
   	
    	return true; 
    });
    $('#submit_second').click(function(){
        //remove classes
        $('#second_step input').removeClass('error').removeClass('valid');

        //ckeck if inputs aren't empty
        var fields = $('#second_step input[type=text], #second_step input[type=password]');
        var error = 0;
        fields.each(function(){
            var value = $(this).val();
            if( value.length<4 || value==field_values[$(this).attr('id')] ) {
                $(this).addClass('error');
                $(this).effect("shake", { times:3 }, 50);
                error++;
            } else {
                $(this).addClass('valid');
            }
        });

        if(!error || debug) {
            if( $('#password').val() != $('#cpassword').val() ) {
                    $('#second_step input[type=password]').each(function(){
                        $(this).removeClass('valid').addClass('error');
                        $(this).effect("shake", { times:3 }, 50);
                    });

                    return false;
            } else {
                //update progress bar
                $('#progress_text').html('66% Complete');
                $('#progress').css('width','226px');

                //slide steps
                $('#second_step').slideUp();
                $('#third_step').slideDown();
            }
        } else return false;
    });
    $('#prev_second').click(function(){
        $('#progress').css('width','0');
        $('#progress_text').html('0% Complete');

        $('#second_step').slideUp();
        $('#first_step').slideDown();
    });
    $('#submit_third').click(function(){
    	
        //remove classes
        $('#third_step input').removeClass('error').removeClass('valid');

        var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        var fields = $('#third_step input[type=text]');
        var error = 0;
        fields.each(function(){
            var value = $(this).val();
            if( value.length<1 || value==field_values[$(this).attr('id')] || 
            			( $(this).attr('id')=='email' && !emailPattern.test(value) ) ) {
                $(this).addClass('error');
                $(this).effect("shake", { times:3 }, 50);
                error++;
            } else {
                $(this).addClass('valid');
            }
        });

        if(!error || debug) {
            //update progress bar
            $('#progress_text').html('100% Complete');
            $('#progress').css('width','339px');

            var fields = new Array(
                    $('#home_agent').val(),
                    $('#username').val(),
                    $('#password').val(),
                    $('#fullname').val(),
                    $('#email').val(),
                    $('#affiliation').val(),
                    $('#country').val()
                );
                var tr = $('#fourth_step tr');
                tr.each(function(){
                    //alert( fields[$(this).index()] )
                    $(this).children('td:nth-child(2)').html(fields[$(this).index()]);
                });

            //slide steps
            $('#third_step').slideUp();
            $('#fourth_step').slideDown();
        } else return false;

    });
    $('#prev_third').click(function(){
        $('#progress_text').html('33% Complete');
        $('#progress').css('width','113px');

        $('#third_step').slideUp();
        $('#second_step').slideDown();
    });
    
    $('#submit_fourth').click(function(){
        //send information to server
		var pweb = new pweb_api($("#home_agent").val());
		
		pweb.register_user(function (response) {
			if (response.status == "success") {
				login($('#username').val(), $('#password').val(), $('#home_agent').val());
			} else alert(response.status + " : " + response.error);
		}, $("#username").val(), $('#password').val(), $('#email').val(),
			$('#fullname').val(),  $('#country').val(), $('#affiliation').val());
    });
    $('#prev_fourth').click(function(){
        $('#progress_text').html('66% Complete');
        $('#progress').css('width','226px');
        $('#fourth_step').slideUp();
        $('#third_step').slideDown();
    });
	$("#username").change(function() { //if theres a change in the username textbox
		var username = $("#username").val();//Get the value in the username textbox
		var ha = $('#home_agent').val();
		if(username.length > 3) { //if the lenght greater than 3 characters
			//Add a loading image in the span id="availability_status"
			$("#availability_status").html('<img src="/static/cms/images/uname_loader.gif" align="absmiddle">&nbsp;Checking availability...');
			var pweb = new pweb_api($("#home_agent").val());
			pweb.is_username_available($("#username").val(), 
					function(response) {
						if (response.status == "success") {
							if (response.availability == "yes")
								$("#availability_status").html(
									'<img src="/static/cms/images/uname_available.png" align="absmiddle"> ' 
									+ '<font color="Green">Available</font> ');
							else 
								$("#availability_status").html(
									'<img src="/static/cms/images/uname_not_available.png" align="absmiddle"> '
									+ '<font color="red">Not Available</font>');								
							
						} else {
							$("#availability_status").html(
									'<img src="/static/cms/images/uname_error.png" style="width:24px;" align="absmiddle"> '
									+ '<font color="red">'+response.error+'</font>');								
							
						}
					});
		} else {  // user name less than 4
			$("#availability_status").html('<font color="#cc0000">Username too short</font>');
			//if in case the username is less than or equal 3 characters only 
		}
		return false;
	});
});
/*
			$.ajax({  //Make the Ajax Request
	    		type: "GET", // "POST"  
	    		url: "mg.pwebproject.net",  //file name
	    		data: "method=is_username_available&username="+ username,  //data
	    		dataType: 'json',
	    		success: function(server_response) {
	    			alert(server_response);
	   				$("#availability_status").ajaxComplete(function(event, request){ 
						if(server_response == '0') { //if ajax_check_username.php return value "0"
							$("#availability_status").html('<img src="images/uname_available.png" align="absmiddle"> <font color="Green"> Available </font>  ');
							//add this image to the span with id "availability_status"
						} else if(server_response == '1') { //if it returns "1"
							$("#availability_status").html('<img src="images/uname_not_available.png" align="absmiddle"> <font color="red">Not Available </font>');
						}  

 	   				});
	   			} // end of success function 
		   });    // end of ajax call  
*/
