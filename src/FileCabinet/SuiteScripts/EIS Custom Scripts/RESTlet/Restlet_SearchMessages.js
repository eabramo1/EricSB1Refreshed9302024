/*
 * File:  Restlet_SearchMessages.js
 *
 * Module Description:  This RESTlet searches for all case messages assigned to a specific case internal ID.  
 * The application calling this Restlet passes the case internal ID.  The Restlet returns an array which includes the case_id and any associated message_ids.
 * 		
 *
 * JSON input expected:  
 * {"case_id":"[case internalID]"}
 * 
 * Return JSON Object Parameters:
 * 		restlet_status
 * 		restlet_status_details
 * 		message_array object with
 * 				casemessage_id
 * 
 * Version    Date            	Author(s)		Remarks
 * 1.00       2/14/2018			Jeff O
 */


function SearchMessages(datain) {
	nlapiLogExecution('debug', 'RESTLET SearchMessages started');

	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	var dataout = {};
	var searchResults = [];
	//var columnsout = ['case_id', 'case_number', 'case_stage', 'case_assignee', 'case_institution', 'case_subject'];
	var columnsout = ['message_id', 'case_id', 'message_internal_only'];
	//var columnsout = ['message_id'];
	//var columnsout = [];
	
	try
	{			
		if (L_JSONisEmpty(datain)) {						
			restlet_status_details = 'SearchMessages Restlet Datain Error:  Input JSON object is empty';
			restlet_status = 'ERROR';			
		}
		else {
			searchResults = L_dynamicSearch(datain, 'message', columnsout);		
			
			if(L_dynamicSearchDone) {
				restlet_status_details = 'SearchMessages Restlet found ' + searchResults.length + ' Messages.';
				restlet_status = 'SUCCESS';
			}			
			else {
				restlet_status_details = 'SearchMessages Restlet ERROR:  SEARCH FAILED...' + L_dynamicSearchMsg;
				restlet_status = 'ERROR';
			}
		}
	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			restlet_status_details = 'SearchMessages Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{		
			restlet_status_details = 'SearchMessages Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}
	
	nlapiLogExecution( 'DEBUG', 'restlet_status', restlet_status);
	nlapiLogExecution( 'DEBUG', 'restlet_status_details', restlet_status_details);
	
	// Return Case Data	
	dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, messages_array: searchResults};
	
	nlapiLogExecution('debug', 'RESTLET SearchMessages ended...');
	
	return(dataout);
}