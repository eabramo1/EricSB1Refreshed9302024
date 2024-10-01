/*
 * File:  Restlet_SearchContacts.js
 *
 * Module Description:  This RESTlet searches for all NetCRM contacts associated with a specific customer.
 * 		The application calling this Restlet passes the customer's internalID to the Restlet.  
 * 		The Restlet returns an array which includes the NetCRM Contact Internal ID, the contact name, and the customer internalID
 * 		
 *
 * JSON input expected:  
 * {"contact_customer":"[customer internalID"}
 * 
 * Return JSON Object Parameters:
 * 		restlet_status
 * 		restlet_status_details
 * 		contact_array object with
 * 				internalID (of contact)
 * 				entityID (contact name)
 * 				company (cust internalID)
 * 				contact is inactive (true/not true)
 * 
 * Date            	Author(s)		Remarks
 * 1/xx/2018		Jeff O
 * 3/23/2018		Jeff O			updating Restlet to use library_dynamic_search
 * 3/28/2018		Pat Kelleher	Moved to Production
 * 4/10/2018		Christine Neale	Reinstated Library_dynamic_search code & moved to Production
 * 11/1/2018		Pat Kelleher	Added "Contact is Inactive" field (on columnsout) to allow field to return status in RESTlet   
 */
function SearchContacts(datain)
{
	nlapiLogExecution('debug', 'RESTLET SearchContacts started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	var dataout = {};
	var contactResults = [];
	var columnsout = ['contact_id', 'contact_firstlastname', 'contact_email', 'contact_altemail', 'contact_customer', 'contact_inactive'];

	try
	{			
		if (L_JSONisEmpty(datain)) {						
			restlet_status_details = 'SearchContacts Restlet Datain Error:  Input JSON object is empty';
			restlet_status = 'ERROR';			
		}
		else {
			contactResults = L_dynamicSearch(datain, 'contact', columnsout);		
			
			if(L_dynamicSearchDone) {
				restlet_status_details = 'SearchContacts Restlet found ' + contactResults.length + ' contacts.';
				restlet_status = 'SUCCESS';
			}			
			else {
				restlet_status_details = 'SearchContacts Restlet ERROR:  SEARCH FAILED...' + L_dynamicSearchMsg;
				restlet_status = 'ERROR';
			}
		}
	}
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			restlet_status_details = 'SearchContacts Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{		
			restlet_status_details = 'SearchContacts Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}
	
	nlapiLogExecution( 'DEBUG', 'restlet_status', restlet_status);
	nlapiLogExecution( 'DEBUG', 'restlet_status_details', restlet_status_details);
	
	// Return Contact Data	
	dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, contact_array: contactResults};
	
	nlapiLogExecution('debug', 'RESTLET SearchContacts ended...');
	
	return(dataout);
}
