/* Sandbox 1
 * File:  Restlet_SearchSIs.js
 *
 * Module Description: This RESTlet searches for the Service Issue attached to a specified case internal ID.  
 * The application calling this Restlet passes the case internal ID and the Restlet returns an array which includes the case_id and the attached si_id.
 *
 * JSON Input Expected:  
 * {"si_case":"[Case InternalID]"}
 * 
 * Optional JSON Input
 * {"si_status":"[SI Status Internal ID]"}
		Assigned to Triage [13]
		Closed Unresolved [11]
		Deferred [5]
		In Progress [8]
		Information Needed [3]
		Not Started [2]
		Resolved [7]
		Scheduled [9]
 * 
 * Return JSON Object Parameters:
 * 		restlet_status
 * 		restlet_status_details
 * 		serviceissues_array object with
 * 				si_id
 *
 * Version	Date			Author(s)	Remarks
 * 1.00		4/10/2018		Mackie		Initial creation of the restlet file.
 * 1.01		4/18/2018		Mackie		Updating comments and renaming values.
 */
function SearchSIs(datain) {
	nlapiLogExecution('debug', 'RESTLET SearchSIs started');

	var restlet_status = 'ERROR';
	var restlet_status_details = '';
	var dataout = {};
	var searchResults = [];
	var columnsout = ['si_id'];

	try
	{
		if (L_JSONisEmpty(datain)) {						
			restlet_status_details = 'SearchSIs Restlet Datain Error:  Input JSON object is empty';
			restlet_status = 'ERROR';			
		}
		else {
			//Service Issue attached to Case is 'customrecord36'
			searchResults = L_dynamicSearch(datain, 'customrecord36', columnsout);
			if(L_dynamicSearchDone) {
				//Returns the number of found Service Issues
				restlet_status_details = 'SearchSIs Restlet found ' + searchResults.length + ' Service Issue[s].';
				restlet_status = 'SUCCESS';
			}			
			else {
				restlet_status_details = 'SearchSIs Restlet ERROR:  SEARCH FAILED...' + L_dynamicSearchMsg;
				restlet_status = 'ERROR';
			}
		}
	}
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			restlet_status_details = 'SearchSIs Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{		
			restlet_status_details = 'SearchSIs Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}
	}
	nlapiLogExecution( 'DEBUG', 'restlet_status', restlet_status);
	nlapiLogExecution( 'DEBUG', 'restlet_status_details', restlet_status_details);
	
	//Return the Restlet Status, Restlet details, and the Service Issue ID attached to the Case
	dataout = {restlet_status: restlet_status
			, restlet_status_details: restlet_status_details
			, serviceissues_array: searchResults};
	nlapiLogExecution('debug', 'RESTLET SearchSIs ended...');
	return(dataout);
}