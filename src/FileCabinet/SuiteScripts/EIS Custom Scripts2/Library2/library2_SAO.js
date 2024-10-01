/**
 * library2_SAO.js
 * @NApiVersion 2.0
 */

/* Script:     library2_SAO.js
 *
 * Created by: Christine Neale
 *
 * Functions etc:
 * 		Internal			External			Description
 * 		L2_SAO_Object 		L2_SAO_Object		Global variable to hold SAO related info for API call & response
 * 		SAO_Handler 		handleSAOaction		Function to call the SAO EBSCONET Order Approver API call
 * 		generateUUID		generateUUID		Function to generate a GUID
 *      validateParmData						Function to validate Parameters for SAO EBSCONET Order Approver API Call
 *      SAO_CustFlag		L2_checkSAOCustFlag	Function to determine correct value of Customer SAO flag
 *      setAPIendpoint							Function to determine SAO EBSCONET API endpoint to call
 *      setAPIkey								Function to determine Key to use with SAO EBSCONET endpoint
 *      loadAPIrequestBody						Function to verify info for SAO EBSCONET API call
 *      unloadAPIresponseData					Function to interpret response sent back from the SAO EBSCONET API call
 *
 * Revisions:  
 *	CNeale  	04/27/2020	US631219 Original version
 *	KMcCormack	05/27/2020	US631169 Configure and Implement Call to SSD API - EBSCONET Approver 
 *	CNeale		06/09/2020	US631176 Logic to handle Call to SSD API - EBSCONET Approver Response
 *	CNeale		07/10/2020	Correction to unloadAPIResponseData
 *	eAbramo		12/08/2020	US728084 Add NetCRM Site Name and Main Address to SSD request
*/

define(['N/https', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
/**
 * @param {https} 
 */
function(https, runtime, LC2Constants, search) {
	
/* ******************************************************************************************************************************** 
 *  Global Variable holding information required for & returned by the SAO/EBSCONET Order Approver API Call
 ********************************************************************************************************************************* */
	var L2_SAO_Object = {	
			custID:	null,          	// Input Customer ID e.g. ns123456
			sitename: null,			// Input SiteName -- added as part of US728084
			address: null,			// Input Customer Address -- added as part of US728084
			custActReq: null,		// Input Customer Action required (add/validate)
			contactID: null, 		// Input Contact Internal ID
			contactName: null,		// Input Contact First Name + ' ' + Last name
			contactEmail: null,		// Input Contact email
			requesterName: null,	// Input Requester Name  
			requesterEmail: null,	// Input Requester email 
			actionRequested: null,	// Input Action required for Contact (add/remove/validate)
			responseCode: '',		// Returned Response Code
			responseMsg: ''			// Returned Response Message
	};
	
/* ********************************************************************************************************************************	
	Function: SAO_Handler
	Purpose:  This function makes a call to an external API to request/revoke/check the EBSCONET Order Approver status of a Contact
			  and interprets the response from the EBSCONET API call according to business rules.
	Note:	  This function assumes that the Global Variable defined above has been populated.	I
********************************************************************************************************************************* */
	function SAO_Handler() {
		log.debug('entering library2_SAO, function: SAO_Handler ');		
		
		//JSON Header Object as defined by EBSCONET API Contract
		var SAO_API_Key = setAPIkey();
		var SAO_API_Header_Object = {"Content-Type": "application/json",
									"X-CLIENT-API-KEY": SAO_API_Key};
		
    	var actionSuccessSts = LC2_ContactENOrdApprovSts.CallFail;    //Initialize flag indicating if SAO API action requested was successful
    	
    	var requiredDataPresent = validateParmData();   //First ensure that all necessary info has been set by the calling script
    	
    	if(requiredDataPresent) {	    	
	    	var SAO_API_Endpoint_URL = setAPIendpoint();     		//Determine which API endpoint we need to call for this SAO action
	    	
	 		var SAO_API_Request_Body_Str = loadAPIrequestBody(); 	//Use the info set by the calling script to build the request body to send to the API   
	
	 		log.debug('SAO_API_Request_Header_Object ', SAO_API_Header_Object); 
	 		log.debug('SAO_API_Request_Body_Str ', SAO_API_Request_Body_Str);
			
	 		try {
	 			//Call the EBSCONET API to handle the SAO action for this customer & contact(s)	
		 		var response = https.post({
		 			url: SAO_API_Endpoint_URL, 			
		 			headers: SAO_API_Header_Object,
		 			body: SAO_API_Request_Body_Str
		 		})
		  	
		 		log.debug('AFTER CALLING EBSCONET API');
		 	
		 		actionSuccessSts = unloadAPIresponseData(response);	//Interpret response from API to see if action was successful or not	
	 		}
	 		catch(e) {
            		log.error(e.name);            	
            	}	 			
	 	}
  			
		return (actionSuccessSts);		
	}

/* ********************************************************************************************************************************	
	Function: validateParmData
	Purpose:  This function verifies that the necessary information has been sent to build a call to the EBSCONET API
	Note:	  It uses the dreaded double negative that we were all taught to avoid :)
********************************************************************************************************************************* */
	
	function validateParmData() {
		log.debug('entering library2_SAO, function: validateParmData ');		
		//If any input values are not present, inner clause of true is negated to return a false from the function

		// US728084: if Action is 'add' or 'remove' then include the Sitename and Address
		if (L2_SAO_Object.actionRequested == 'add' || L2_SAO_Object.actionRequested == 'remove' ){
			return(!(!L2_SAO_Object.custID ||
					 !L2_SAO_Object.sitename ||		// added as part of US728084
					 !L2_SAO_Object.address ||		//added as part of US728084
					 !L2_SAO_Object.custActReq ||
					 !L2_SAO_Object.contactID ||
					 !L2_SAO_Object.contactName ||
					 !L2_SAO_Object.contactEmail ||
					 !L2_SAO_Object.requesterName ||  
					 !L2_SAO_Object.requesterEmail ||
					 !L2_SAO_Object.actionRequested));			
		}			 
		// US728084: if Action is 'validate' exclude the Sitename and Address because they're not required
		else {
			return(!(!L2_SAO_Object.custID ||
					 !L2_SAO_Object.custActReq ||
					 !L2_SAO_Object.contactID ||
					 !L2_SAO_Object.contactName ||
					 !L2_SAO_Object.contactEmail ||
					 !L2_SAO_Object.requesterName ||  
					 !L2_SAO_Object.requesterEmail ||
					 !L2_SAO_Object.actionRequested));
		}
	};

/* ********************************************************************************************************************************	
	Function: setAPIendpoint
	Purpose:  This function determines which EBSCONET API endpoint we should call for the requested SAO action
********************************************************************************************************************************* */
	
	function setAPIendpoint() {
		log.debug('entering library2_SAO, function: setAPIendpoint ');		

		var apiEndpointURL = '';
		
		//Assign appropriate EBSCONET API Endpoint URL as defined by the EBSCONET API Contract
		if(runtime.envType == 'PRODUCTION') {
			 apiEndpointURL = LC2Constants.LC2_SAO_API_Endpoints.production.url;			 
		}
		else apiEndpointURL = LC2Constants.LC2_SAO_API_Endpoints.test.url;

		log.debug('API Endpoint returned = ', apiEndpointURL);	
		
		return(apiEndpointURL);	
	};	
	
/* ********************************************************************************************************************************	
	Function: setAPIkey
	Purpose:  This function determines which EBSCONET API Key we should use
********************************************************************************************************************************* */
	
	function setAPIkey() {
		log.debug('entering library2_SAO, function: setAPIkey ');		

		var apiKey = '';
		
		//Assign appropriate EBSCONET API Endpoint URL as defined by the EBSCONET API Contract
		if(runtime.envType == 'PRODUCTION') {
			 apiKey = LC2Constants.LC2_SAO_API_Keys.production.key;			 
		}
		else apiKey = LC2Constants.LC2_SAO_API_Keys.test.key;

		log.debug('API Key returned = ', apiKey);	
		
		return(apiKey);	
	};		

	
/* ********************************************************************************************************************************	
	Function: loadAPIrequestBody
	Purpose:  This function verifies that the necessary information has been sent to build a call to the EBSCONET API
	Returns:  Request body as a string
********************************************************************************************************************************* */
	
	function loadAPIrequestBody() {
		log.debug('entering library2_SAO, function: loadAPIrequestBody ');
		
		//JSON Request Object as defined by EBSCONET API Contract
		var SAO_API_Request_Object = {
				request: {
					 correlationId: '',
					 externalCorrelationId: ''
				 },
				customer: {
					id: '',
					sitename: '',		// US728084 Add NetCRM Site Name and Main Address to SSD request
					address: '',		// US728084 Add NetCRM Site Name and Main Address to SSD request
					action: '',
					contacts: [
					    {
					      id: '',
					      name: '',
					      email: '',
					      action:''
					    }
					  ]
				    },
				requester: {
					name: '',
					email: ''
				  }
		};
		
    	SAO_API_Request_Object.request.correlationId = generateUUID();    	
    	SAO_API_Request_Object.customer.id = L2_SAO_Object.custID;
    	SAO_API_Request_Object.customer.sitename = L2_SAO_Object.sitename;	// US728084 Add NetCRM Site Name and Main Address to SSD request
    	SAO_API_Request_Object.customer.address = L2_SAO_Object.address;		// US728084 Add NetCRM Site Name and Main Address to SSD request
    	SAO_API_Request_Object.customer.action = L2_SAO_Object.custActReq;	
    	SAO_API_Request_Object.customer.contacts[0].id = L2_SAO_Object.contactID;    	
    	SAO_API_Request_Object.customer.contacts[0].name = L2_SAO_Object.contactName;    	
    	SAO_API_Request_Object.customer.contacts[0].email = L2_SAO_Object.contactEmail;    	
    	SAO_API_Request_Object.customer.contacts[0].action = L2_SAO_Object.actionRequested;    	
    	SAO_API_Request_Object.requester.name = L2_SAO_Object.requesterName;    	
    	SAO_API_Request_Object.requester.email = L2_SAO_Object.requesterEmail;
	
    	return (JSON.stringify(SAO_API_Request_Object));
	};
	
/* ********************************************************************************************************************************	
	Function: unloadAPIresponseData
	Purpose:  This function interprets the response sent back from the EBSCONET API call
	Returns:  true | false  based on business logic that SAO action requested was handled correctly
********************************************************************************************************************************* */
	
	function unloadAPIresponseData(response) {
		log.debug('entering library2_SAO, function: unloadAPIresponseData ');
		
		//JSON Response Object as defined by EBSCONET API Contract
		var SAO_API_Response_Object = {		
				response: {
					correlationId: '',
					externalCorrelationId: ''
				  },
				customer: {
				   id: '',
				   viewAccountExists: false,
				   processingAccountExists: false,
				   messages: '',
				   contacts: [
				      {
				        id: '',
				        exists: false,
				        isAuthorizedApprover: false,
				        messages: ''
				      }
				    ]
				  }				
		};
		
		var actionSucceeded = LC2_ContactENOrdApprovSts.CallFail  //Assume "call fail" until we know differently
	
 		log.audit('code is', response.code);
 		log.audit('response header', response.headers); 		
		log.audit('response body', response.body);
		
		if (response.code == 200){
			
			try {
			// It seems we only get the correctly formatted response if the call is successful (& currently if the SSD Customer exists)	
			
				SAO_API_Response_Object = JSON.parse(response.body);		
				
				log.debug('SAO_API_Response_Object', SAO_API_Response_Object);
				// log.debug('viewAccount', SAO_API_Response_Object.customer.viewAccountExists);		
				// log.debug('SAO_API_Response_Object.customer.viewAccountExists is ', SAO_API_Response_Object.customer.viewAccountExists);
				// log.debug('SAO_API_Response_Object.customer.processingAccountExists is ', SAO_API_Response_Object.customer.processingAccountExists);
				// log.debug('SAO_API_Response_Object.customer.contacts[0].exists is ', SAO_API_Response_Object.customer.contacts[0].exists);
				// log.debug('SAO_API_Response_Object.customer.contacts[0].isAuthorizedApprover is ', SAO_API_Response_Object.customer.contacts[0].isAuthorizedApprover);
				//  Business logic to interpret results in API response 
				 
				switch (L2_SAO_Object.actionRequested) {
				   case 'add':
					   // Need to check 2 x Customer accounts exist, contact exists and approver status
					   if(SAO_API_Response_Object.customer.viewAccountExists == true &&
					   SAO_API_Response_Object.customer.processingAccountExists == true &&
					   SAO_API_Response_Object.customer.contacts[0].exists == true &&
					   SAO_API_Response_Object.customer.contacts[0].isAuthorizedApprover == true )
					   {
						   log.debug('add response', 'approved');
						   actionSucceeded = LC2_ContactENOrdApprovSts.Approved;
					   }
					   else{
						   log.debug('add response', 'in Progress');
						   actionSucceeded = LC2_ContactENOrdApprovSts.InProgress;
					   }
					break;
									
				   case 'remove': 
					 //In all scenarios this is going to return "Revoked" (as we are not facilitating "Revoke in Progress")
					 actionSucceeded = LC2_ContactENOrdApprovSts.Revoked;  
					break;
									
				   default: //validate
					   //Need to return whether "Approved" or not (use "Revoked")
					   if(SAO_API_Response_Object.customer.viewAccountExists == true &&
							   SAO_API_Response_Object.customer.processingAccountExists == true &&
							   SAO_API_Response_Object.customer.contacts[0].exists == true &&
							   SAO_API_Response_Object.customer.contacts[0].isAuthorizedApprover == true )
							   {
								   log.debug('Validate response', 'approved');
								   actionSucceeded = LC2_ContactValidateENOrdApprovSts.Approver;
							   }
							   else{
								   log.debug('Validate response', 'Not Approver');
								   actionSucceeded = LC2_ContactValidateENOrdApprovSts.NotApprover;
								   }  
					break;
				}
			}
			catch(e)
			{
				log.error(e.name);
			}
		
		}
	
    	return (actionSucceeded);
	};
	
		

/* ********************************************************************************************************************************	
	Function: generateUUID
	Purpose:  This function generates a GUID/UUID
********************************************************************************************************************************* */
	
	function generateUUID() { // Public Domain/MIT
		log.debug('entering library2_SAO, function: generateUUID ');
	    var d = new Date().getTime();//Timestamp
 	//  var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
	    // Set d2 to 0 as unsupported!
	    var d2 = 0;
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random() * 16;//random number between 0 and 16
	        if(d > 0){//Use timestamp until depleted
	            r = (d + r)%16 | 0;
	            d = Math.floor(d/16);
	        } else {//Use microseconds since page-load if supported
	            r = (d2 + r)%16 | 0;
	            d2 = Math.floor(d2/16);
	        }
	        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	    });
	}
   
/* ********************************************************************************************************************************	
	Function: SAO_CustFlag
	Purpose:  This function determines the correct value for the Customer SAO flag (excludes any contact update in progress)
	Requires: library2_constants
	Input:	  Customer internal ID
	    	  Contact internal ID to exclude (optional) 	
	Returns:  True/False based on Customer flag setting 	            	
********************************************************************************************************************************* */
	
	function SAO_CustFlag(CustId, ContId) { 
		log.debug('entering library2_SAO, function: SAO_CustFlag');
		
		var custFlag = null;
		
		// Sort out the (optional) Contact ID 
		if (!ContId){ContId = 0};
		log.debug('ContId ', ContId);
		
		// Load the search
		var callSearch = search.load({
	        id: 'customsearch_sao_enet_approver'
	    });
		log.debug('after Call Search Load');
		
		// Dynamically add Customer and Contact filters
 	     var filter1 = search.createFilter({
	        name: 'company',
	        operator: search.Operator.IS,
	        values: CustId
	    }); 
 	    callSearch.filters.push(filter1); 
 	    
 	    if (ContId != 0){
 	    	var filter2 = 	search.createFilter({
	    					name: 'internalid',
	    					operator: search.Operator.NONEOF,
	    					values: ContId
	    				});
 	    	callSearch.filters.push(filter2);
 	    }
 	    
	    var myResultSet = callSearch.run().getRange(0, 1);
	
		    log.debug('myResultSet = ', myResultSet);
		    log.debug('No. of results = ', myResultSet.length);

		    if (myResultSet.length > 0){
		    	custFlag = true		    		
		    }
		    else{
		    	custFlag = false
		    }

	    return custFlag;

	}
	

    return {
    	handleSAOaction: SAO_Handler,
    	L2_SAO_Object: L2_SAO_Object,
    	generateUUID: generateUUID,
    	L2_checkSAOCustFlag: SAO_CustFlag
        
    };
    
});