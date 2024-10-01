/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

// Script:    Suitelet2_docuSign.js
//        Written in SuiteScript 2.0
//
// Created by:  Eric Abramo  05-2021
//
// Purpose:   For Bringing a Sales User to DocuSign
//      
//
// Library Scripts Used:   library2_constants
//
// Revisions:  
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/ui/serverWidget', 'N/record', 'N/https', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
/**
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(serverWidget, record, https, runtime, LC2Constants) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	
	/* ******************************************************************************************************************************** 
	 *  Global Variables/Objects
	*/
	var g_docSign_token = '';	// Temporary Access Token that will be used to make the docLauncher Task API Call
	
	var g_environment = null;	// global variable storing the environment in which this is running (test or production)

	var g_Customer_Object = {
			custID:	null,          	// Input Customer ID e.g. ns123456
			sitename: null,			// Input SiteName
			geomarket: null,		// Input Geomarket
			country: null,			// Input Country
			segment: null,			// Input Segment
			state_prov: null		// Input State/Province
	};		

	var g_response = {
			code: null,				// Code returned from API request (if any)
			error: null,			// Error Description
			urlvalue: null			// URL to the DocuSign Task 
	};

	// *********************************************************************************************************************************
	
    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        var docAuthSuccess = false;   	//initialize to unsuccessful
        var docLaunchSuccess = false;	//initialize to unsuccessful
        
        if (request.method == 'GET') {
        	
        	// 1) get the Environment and set global g_environment
			setEnvironment();
			
        	// 2) Call function to Load Customer Parameters
        	load_customer_params(context);        	
        	log.debug('g_Customer_Object value is ', g_Customer_Object);
        	
			// 3) Call DocuSign Authorization Grant to get a new Access Token 
			docAuthSuccess = docAuth_Handler();
			
		 	// 4) If we've been granted an Access Token, call docLaunch_Handler - pass customer info and retrieve the DocuSign Task URL
			if(docAuthSuccess) {
				docLaunchSuccess = docLaunch_Handler();
				
				// 5) Give User URL to DocuSign Task
				if(docLaunchSuccess) {
					log.debug('docLaunchSuccess is', docLaunchSuccess);
						
					if (g_response.urlvalue != '') {
						log.audit('g_response.code is ', g_response.code); 
						log.audit('g_response.urlvalue is ', g_response.urlvalue);
					}
					else{
						log.audit('*** Error in retrieving URL from DocuSign DocLaunch call ***');
						g_response.error = 'Error encountered in DocuSign Integration.  Please send a screenshot of this page to CrmEscalation@ebsco.com and a ticket will be opened so that this issue can be investigated. Error in retrieving the URL from the DocLaunch response.';		
					}
				}
				else {
					log.audit('*** Error when calling DocuSign DocLaunch ***');
					g_response.error = 'Error encountered in DocuSign Integration.  Please send a screenshot of this page to CrmEscalation@ebsco.com and a ticket will be opened so that this issue can be investigated. Error when calling DocuSign DocLaunch API.';
				}				
			}
			else {
				log.audit('*** Error when calling DocuSign Auth API for access token ***');
				g_response.error = 'Error encountered in DocuSign Integration.  Please send a screenshot of this page to CrmEscalation@ebsco.com and a ticket will be opened so that this issue can be investigated. Error when calling DocuSign Authorization API for Access Token';
			}	
			// stringify the response object and send it back to the client (whether successful or not)
			s_g_response = JSON.stringify(g_response);
			context.response.write(s_g_response);
			return;                    
        }   
    }
    

	/* ********************************************************************************************************************************	
	Function: docAuth_Handler
	Purpose:  This function makes a call to the DocuSign Authentication API using the refresh_token to generate a new access token 
			  that will be used for the other function: docLaunch_Handler.
	********************************************************************************************************************************* */		
	function docAuth_Handler() {
		log.debug('entering Suitelet2_docuSign, function: docAuth_Handler ');

		// pull the Refresh Token down from netSuite -- load generic custom record to store Refresh Token
		var storedRefreshToken = record.load({
			type: 'customrecord_integration_token',
    		id: LC2_Integration_Token.DocSign_refresh_token
		});
		var refreshToken  = storedRefreshToken.getValue('custrecord_generic_token');		
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
		
		// Determine the correct API endpoint to call based on NS environment
		var auth_API_Endpoint_URL = setAUTHendpoint(g_environment);	 
		
		// Call DocuSign Authentication GRANT API with the refresh_token to have it generate a new access token
	    try {
	 		log.debug('BEFORE CALLING AUTH GRANT API');
		 	var auth_response = https.post({
		 		url: auth_API_Endpoint_URL, 			
		 		headers: auth_header,
		 		body: auth_data
		 	})		  	
		 	log.debug('AFTER CALLING AUTH GRANT API');
		 	
		 	// Interpret response from API to see if authentication and access token generation was successful or not
		 	authSuccessful = unloadAUTHresponse(auth_response);
	 	}
	 	catch(e) {
        	log.error(e.name);
        	g_response.error = e.name;
        	g_response.code = response.code;
        }	 			
	
		log.audit('authSuccessful is', authSuccessful);
		
		return (authSuccessful);	
	};	//**************************************************************************************************************************************	
    
    
	/* ********************************************************************************************************************************	
	Function: docLaunch_Handler
	Purpose:  This function makes a call to docLauncher Task API.  This API pre-populates a form in docuSign with customer information
		It returns a URL to the form whereby the user can login and complete the form and submit it to be saved
	********************************************************************************************************************************* */		
	function docLaunch_Handler() {
		log.debug('entering Suitelet2_docuSign, function: docLaunch_Handler ');
		
		var launchSuccessful = false;   //Init status to unsuccessful
		
		// Build Header ---------------
		var docLaunch_header = {
				"Content-Type": "application/json",
				"Accept": "application/xml",
				"Authorization": "Bearer "+g_docSign_token
		}
		// log.debug('docLaunch_header is ', docLaunch_header);
		
		// Build Body -- 4 Components (Data, DataType, DestinationFolder, DocLauncherConfiguration)
		// 1: DATA:  
		var docLaunch_data = '<CustomerContract><CustID>'+g_Customer_Object.custID+'</CustID><Geomarket>'+g_Customer_Object.geomarket+'</Geomarket><Country>'+g_Customer_Object.country+'</Country><CustomerName>'+g_Customer_Object.sitename+'</CustomerName><Segment>'+g_Customer_Object.segment+'</Segment><State_Province>'+ g_Customer_Object.state_prov +'</State_Province></CustomerContract>'		
		// log.debug('docLaunch_data is ', docLaunch_data);
		
		// 2: DataType (no code needed) "DataType": "xml"
		
		// 3: DESTINATION FOLDER
		var docLaunch_dest_folder = null;
		if (g_environment == 'production'){
			docLaunch_dest_folder = "https://apiuatna11.springcm.com/v2/"+LC2_DocSign_CLM_Body.ds_account_id+"/folders/"+LC2_DocSign_CLM_Body.folder_id;
		}
		else{
			docLaunch_dest_folder = "https://apiuatna11.springcm.com/v2/"+LC2_DocSign_CLM_Body.ds_account_id_test+"/folders/"+LC2_DocSign_CLM_Body.folder_id_test;
		}	
		// log.debug('docLaunch_dest_folder is ', docLaunch_dest_folder);
		
		
		// 4: DOCLAUNCHER CONFIGURATION
		// Set Configuration ID based on g_environment
		var docLaunchConfig = null;
		if (g_environment == 'production'){
			docLaunchConfig = "https://apiuatna11.springcm.com/v2/"+LC2_DocSign_CLM_Body.ds_account_id+"/docgenconfigurations/"+LC2_DocSign_CLM_Body.docgen_config_id;
		}
		else{
			docLaunchConfig = "https://apiuatna11.springcm.com/v2/"+LC2_DocSign_CLM_Body.ds_account_id_test+"/docgenconfigurations/"+LC2_DocSign_CLM_Body.docgen_config_id_test;
		}	
		// log.debug('docLaunchConfig is ', docLaunchConfig);
			
		// Combine  1-4
		var docLaunch_body = {
				"Data": docLaunch_data,
				"DataType": "xml",
			    "DestinationFolder": {
			    	"Href": docLaunch_dest_folder
			    },
			    "DocLauncherConfiguration": {
			        "Href": docLaunchConfig    
			    }
		};	
		var s_docLaunch_body = JSON.stringify(docLaunch_body);
		// var s_docLaunch_body = 'XYZ';  // LINE IS ONLY TO TRY TO MAKE AN ERROR OCCUR
		
		// Set Endpoint and make the Call to CLM DocLauncher API
		var CLM_API_Endpoint_URL = setCLMendpoint(g_environment);
		log.debug('CLM_API_Endpoint_URL is', CLM_API_Endpoint_URL);
		log.debug('docLaunch_header is', docLaunch_header);
		// log.debug('docLaunch_body is', docLaunch_body);
		log.audit('About to call CLM DocLauncher API. s_docLaunch_body is', s_docLaunch_body);
	    try {
	 		log.debug('BEFORE CALLING CLM DocLauncher API');
		 	var clm_response = https.post({
		 		url: CLM_API_Endpoint_URL, 			
		 		headers: docLaunch_header,
		 		body: s_docLaunch_body
		 	})		  	
		 	log.debug('AFTER CALLING CLM DocLauncher API');
		 	// Gather the information from the CLM response
			var launchSuccessful = unloadCLMresponse(clm_response);	//Interpret response from API to see if action was successful or not
	 	}
	 	catch(e) {
	       	log.error(e.name);
	       	g_response.error = e.name;
	       	g_response.code = response.code;
	 	}
	 	
	 	log.debug('launchSuccessful is', launchSuccessful); 	
	 return(launchSuccessful);	
	 	
	}; 	// ********************************************************************************************************************************


	
	/* ********************************************************************************************************************************	
	Function: loadCLMrequestBody
	Purpose:  This function verifies that the necessary information has been sent to build a call to the docLaunder API
	Returns:  Request body as a string
	********************************************************************************************************************************* */	
	function load_customer_params(contextIn) {	
		// Load Customer to get all the values
		var customerId = contextIn.request.parameters.customerId;
		log.audit('in Suitelet2_docuSign, function load_customer_params.  The customerId is ', customerId);

		var custRecordObject = record.load({
			type: record.Type.CUSTOMER, 
			id: customerId,
			isDynamic: false,
		});
	
		// load six customer parameters - replace ampersand for xml ingestion
		// sitename
		var orig_sitename = custRecordObject.getValue('companyname');
		var replaced_sitename = orig_sitename.replace('&', '&amp;');
		g_Customer_Object.sitename = replaced_sitename;
		// custID
		var custText = custRecordObject.getText({fieldId: 'entityid'});
	 	var n = custText.indexOf(" ");					
		g_Customer_Object.custID = custText.substring(0, n);
		// geomarket
		var orig_geomarket = custRecordObject.getText('custentity_geomarket_sourced');
		var replaced_geomarket = orig_geomarket.replace('&', '&amp;'); 
		g_Customer_Object.geomarket = replaced_geomarket;	
		// country
		var orig_country = custRecordObject.getValue('billcountry');
		var replaced_country = orig_country.replace('&', '&amp;');		
		g_Customer_Object.country = replaced_country;
		// segment
		var orig_segment = custRecordObject.getText('custentity_marketsegment');
		var replaced_segment = orig_segment.replace('&', '&amp;');
		g_Customer_Object.segment = replaced_segment;
		// state_prov
		var orig_state_prov = custRecordObject.getValue('billstate');
		var replaced_state_prov = orig_state_prov.replace('&', '&amp;');
		g_Customer_Object.state_prov = replaced_state_prov;		
		
    	return (JSON.stringify(g_Customer_Object));
	};	
	
	
	/* ********************************************************************************************************************************	
	Function: setEnvironment
	Purpose:  This function determines the Environment this code is running
	********************************************************************************************************************************* */
	function setEnvironment(){
		log.audit('entering Suitelet2_docuSign, function: setEnvironment');
			
		if(runtime.envType == 'PRODUCTION') {
			g_environment = 'production';			 
		}
		else{
			g_environment = 'test';	
		}
		log.debug('g_environment is', g_environment);
		return(g_environment);
	}	// ********************************************************************************************************************************
	
	
	/* ********************************************************************************************************************************	
	Function: setAUTHendpoint
	Purpose:  This function determines which DocuSign Authentication endpoint we should call for the access token
	********************************************************************************************************************************* */
	function setAUTHendpoint(environ_in) {
		log.debug('entering Suitelet2_docuSign, function: setAUTHendpoint');		

		var authEndpointURL = '';
		
		//Assign appropriate DocuSign Authentication API Endpoint URL based on environment
		if(environ_in == 'production') {
			 authEndpointURL = LC2Constants.LC2_AUTH_API_Endpoints.production.url;			 
		}
		else authEndpointURL = LC2Constants.LC2_AUTH_API_Endpoints.test.url;

		log.debug('AUTH API Endpoint returned = ', authEndpointURL);	
		
		return(authEndpointURL);	
	};	// ********************************************************************************************************************************
	
	
	/* ********************************************************************************************************************************	
	Function: setCLMendpoint
	Purpose:  This function determines which CLM API endpoint we should call for the requested action
	********************************************************************************************************************************* */
	function setCLMendpoint(environ_in) {
		log.debug('entering Suitelet2_docuSign, function: setCLMendpoint');		

		var clmEndpointURL = '';
		
		//Assign appropriate EBSCONET API Endpoint URL as defined by the EBSCONET API Contract
		if(environ_in == 'production') {
			 clmEndpointURL = LC2Constants.LC2_CLM_API_Endpoints.production.url;			 
		}
		else clmEndpointURL = LC2Constants.LC2_CLM_API_Endpoints.test.url;

		log.debug('CLM API Endpoint returned = ', clmEndpointURL);	
		
		return(clmEndpointURL);	
	};	// ********************************************************************************************************************************
	
	
	/* ********************************************************************************************************************************	
	Function: unloadAUTHresponse
	Purpose:  This function interprets the response sent back from the DocuSign Authentication call
	Returns:  true | false  based on success of the call
	********************************************************************************************************************************* */	
	function unloadAUTHresponse(response) {
		log.debug('entering Suitelet2_docuSign, function: unloadAUTHresponse ');
		
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
 		log.debug('unloadAUTHresponse response.header', response.headers); 		
		log.debug('unloadAUTHresponse response.body', response.body);
		
		if (response.code == 200){		
			try {		
				AUTH_Response_Object = JSON.parse(response.body);
				// log.debug('AUTH_Response_Object', AUTH_Response_Object);
				log.debug('AUTH_Response_Object.access_token is', AUTH_Response_Object.access_token);
				log.debug('AUTH_Response_Object.token_type is', AUTH_Response_Object.token_type);
				log.debug('AUTH_Response_Object.refresh_token is', AUTH_Response_Object.refresh_token);
				log.debug('AUTH_Response_Object.expires_in is', AUTH_Response_Object.expires_in);
				
				// Set global variable to hold new Access token so CLM Call can use it
				g_docSign_token = AUTH_Response_Object.access_token;
				successfulAuthResponse = true;				
			}
			catch(e)
			{
				log.error(e.name);
				g_response.error = e.name;
				g_response.code = response.code;
			}
		
		}
		else{
			g_response.code = response.code;
		}
    	return (successfulAuthResponse);
	};	// ********************************************************************************************************************************
	
	
	/* ********************************************************************************************************************************	
	Function: unloadCLMresponse
	Purpose:  This function interprets the response sent back from the EBSCONET API call
	Returns:  true | false  based on business logic that the CLM request was handled correctly
	********************************************************************************************************************************* */
	function unloadCLMresponse(response) {
		log.debug('entering library2_docuSign, function: unloadCLMresponseData');		

		var successfulCLMResponse = false;     //initialize to unsuccessful		
		
	 	log.audit('unloadCLMresponse code is', response.code);
	 	log.debug('unloadCLMresponse response header', response.headers); 		
		log.audit('unloadCLMresponse response body', response.body);
			
		if (response.code == 200 || response.code == 202){		
			try {
				CLM_Response_Object = JSON.parse(response.body);
				// log.debug('CLM_Response_Object', CLM_Response_Object);		
				log.debug('DocLauncherConfiguration is', CLM_Response_Object.DocLauncherConfiguration);
				log.debug('UrlExpirationDate is', CLM_Response_Object.UrlExpirationDate);
				log.audit('DocLauncherResultUrl is', CLM_Response_Object.DocLauncherResultUrl);
				log.debug('Status is', CLM_Response_Object.Status);
				log.debug('Href is', CLM_Response_Object.Href);
				
				g_response.urlvalue = CLM_Response_Object.DocLauncherResultUrl;
				g_response.code = CLM_Response_Object.Status;
				successfulCLMResponse = true;	
			}
			catch(e)
			{
				log.error(e.name);
				g_response.error = e.name;
				g_response.code = CLM_Response_Object.Status;
			}
		}
		else{
			g_response.code = response.code;
		}
		return (successfulCLMResponse);
	};	// ********************************************************************************************************************************

	

	
    return {
        onRequest: onRequest
    };
    
});