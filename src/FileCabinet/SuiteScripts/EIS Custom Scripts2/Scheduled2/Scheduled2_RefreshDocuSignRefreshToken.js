/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/* Script:     Scheduled2_RefreshDocuSignRefreshToken.js
 * 
 * Purpose:  	This script Refreshes the DocuSign Refresh Token at a regular scheduled interval.  IMPORTANT to note that the DocuSign Refresh Token 
 * 				expires after 30 Days (if using Extended Scope) or in 8 hours (if NOT using extended scope).  Background: The DocuSign Refresh Token is 
 * 				part of the body of a request to the DocuSign Authorization Grant Request.  The DocuSign Authorization Grant Request is used to get an 
 * 				Access Token for the DocuSign DocLauncher Task CLM Request.   
 * 
 * Created by: Eric Abramo
 *
 * Revisions:  
 *	eAbramo  	05/20/2021
 *	eAbramo		11/30/2023	TA871866 Fix error in script.  LC2_Emp should be LC2_Employee in line 91 (sending error email to Mercury alerts)
*/


define(['N/record', 'N/runtime', 'N/https', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/email'],

function(record, runtime, https, LC2Constants, email) {
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	
	var g_environment = null;	// global variable storing the environment in which this is running (test or production)	
	var g_refresh_token = '';	// Store the Refresh Token so that it can be saved into the custom record
	
    function execute(scriptContext) {
    	// Make a request to the DocuSign Authorization Grant -- to get a new Refresh Token
		log.debug('Begin Scheduled2_RefreshDocuSignRefreshToken');
			
    	// 1) get the Environment and set global g_environment
		setEnvironment();

		// 2) Pull the current Refresh Token down from NetSuite
		var storedRefreshToken = record.load({
			type: 'customrecord_integration_token',
    		id: LC2Constants.LC2_Integration_Token.DocSign_refresh_token
		});
		var refreshToken  = storedRefreshToken.getValue('custrecord_generic_token');
		// 3) Build Request parameters to get new Refresh Token
		var base64Key =  '';
		if (g_environment == 'production'){
			base64Key = LC2Constants.LC2_DocSign_AuthKey.base64Key;
		}
		else{
			base64Key = LC2Constants.LC2_DocSign_AuthKey.base64Key_test;
		}
		
		var authSuccessful = false;   //Init status to unsuccessful		
		// Build Header --------------- 
		var auth_header = {
				"Authorization": base64Key
			};
		log.debug('auth_header', auth_header);				
		// Build Body ------------------
		var auth_data = {				  
			    "grant_type": "refresh_token",
				"refresh_token": refreshToken				
			};	
		log.debug('auth_data', auth_data);
		
		// 4) Determine the correct API endpoint to call based on NS environment
		var auth_API_Endpoint_URL = setAUTHendpoint(g_environment);	 
		
		// 5) Call DocuSign Authentication API	    

	 	try {
		 	log.debug('BEFORE CALLING AUTH GRANT API');	 		
			var auth_response = https.post({
				url: auth_API_Endpoint_URL, 			
			 	headers: auth_header,
			 	body: auth_data
			})		  	
			log.debug('AFTER CALLING AUTH GRANT API');
			// 6) Interpret response from API to see if authentication and access token generation was successful or not
			authSuccessful = unloadAUTHresponse(auth_response);	
		}
	 	catch(e) {
        	log.error(e.name);
        	// Send Email to Team Mercury
    		email.send({
                author: LC2Constants.LC2_Employee.MercuryAlerts, // TA871866
                recipients: LC2Constants.LC2_email.CRMEscalation,
                subject: 'Failure in Scheduled Job to update the DocuSign Refresh Token',
                body: 'Problem with Scheduled2_RefreshDocuSignRefreshToken.  The DocuSign Refresh Token was not updated by the scheduled script. <BR><BR>Please Investigate and if necessary update the DocuSign Refresh Token.'
            });
    		log.debug('after email send');    	
        }	

    	
		if (authSuccessful){
		 	log.audit('authSuccessful is ', authSuccessful);
	 		// 7) Reset the Refresh Token in NetSuite			
			storedRefreshToken.setValue({
				fieldId: 'custrecord_generic_token',
				value: g_refresh_token,
				ignoreFieldChange:	true
			})
			storedRefreshToken.save({
	    		enableSourcing: false,
	    		ignoreMandatoryFields: true
	    	});			
		}
		else {
		 	log.debug('ERROR: The Authorization call was not Successful - authSuccessful is ', authSuccessful);
		}
	    
		
		/* ********************************************************************************************************************************	
		Function: setEnvironment
		Purpose:  This function determines the Environment this code is running
		********************************************************************************************************************************* */
		function setEnvironment(){
			log.audit('entering Scheduled2_RefreshDocuSignRefreshToken, function: setEnvironment');
				
			if(runtime.envType == 'PRODUCTION') {
				g_environment = 'production';			 
			}
			else{
				g_environment = 'test';	
			}
			log.debug('g_environment is', g_environment);
			return(g_environment);
		}

		
		/* ********************************************************************************************************************************	
		Function: setAUTHendpoint
		Purpose:  This function determines which DocuSign Authentication endpoint we should call for the access token
		********************************************************************************************************************************* */
		function setAUTHendpoint(environ_in) {
			log.debug('entering Scheduled2_RefreshDocuSignRefreshToken, function: setAUTHendpoint');		

			var authEndpointURL = '';
			
			//Assign appropriate DocuSign Authentication API Endpoint URL based on environment
			if(environ_in == 'production') {
				 authEndpointURL = LC2Constants.LC2_AUTH_API_Endpoints.production.url;			 
			}
			else authEndpointURL = LC2Constants.LC2_AUTH_API_Endpoints.test.url;

			log.debug('AUTH API Endpoint returned = ', authEndpointURL);	
			
			return(authEndpointURL);	
		};

		
		/* ********************************************************************************************************************************	
		Function: unloadAUTHresponse
		Purpose:  This function interprets the response sent back from the DocuSign Authentication call
		Returns:  true | false  based on success of the call
		********************************************************************************************************************************* */	
		function unloadAUTHresponse(response) {
			log.debug('entering Scheduled2_RefreshDocuSignRefreshToken, function: unloadAUTHresponse ');
			
			//JSON Response Object as defined by DocuSign Authentication API
			var AUTH_Response_Object = {		
					response: {
						access_token: '',
						token_type: '',
						refresh_token: '',
						expires_in: ''
					  },
			};
			
			var successfulAuthResponse = false;     //initialize to unsuccessful
		
	 		log.audit('unloadAUTHresponse response.code is', response.code);
	 		log.audit('unloadAUTHresponse response.header', response.headers); 		
			log.audit('unloadAUTHresponse response.body', response.body);
			
			if (response.code == 200){		
				try {		
					AUTH_Response_Object = JSON.parse(response.body);
					// log.debug('AUTH_Response_Object', AUTH_Response_Object);
					log.debug('AUTH_Response_Object.access_token is', AUTH_Response_Object.access_token);
					log.debug('AUTH_Response_Object.token_type is', AUTH_Response_Object.token_type);
					log.debug('AUTH_Response_Object.refresh_token is', AUTH_Response_Object.refresh_token);
					log.debug('AUTH_Response_Object.expires_in is', AUTH_Response_Object.expires_in);
					
					// Set global variable
					g_refresh_token = AUTH_Response_Object.refresh_token;
					log.debug('g_refresh_token is', g_refresh_token);
					successfulAuthResponse = true;				
				}
				catch(e)
				{
					log.error(e.name);
				}
			
			}
	    	return (successfulAuthResponse);
		};	// ********************************************************************************************************************************
	
    };	
		
    return {
        execute: execute
    };

});
