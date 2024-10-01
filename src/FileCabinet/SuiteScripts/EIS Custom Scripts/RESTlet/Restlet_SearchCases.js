/*
 * PRODUCTION File:  Restlet_SearchCases.js
 *
 * Module Description:  This RESTlet searches for all NetCRM cases assigned to a specific 
 * 		AssignedToEmployee and with a specific Stage (�OPEN�, �CLOSED� or �ESCALATED�).  
 * 		The application calling this Restlet passes the AssignedToEmployee and the Stage to 
 * 		the Restlet.  The Restlet returns an array which includes the NetCRM Case Internal ID 
 * 		and Case Number and Stage. 
 *
 * JSON input expected:  
 * {"case_assignee":"[employee internalID]",
 * "case_stage":"[CLOSED, OPEN, ESCALATED"}
 * 
 * Return JSON Object Parameters:
 * 		restlet_status
 * 		restlet_status_details
 * 		case_array object with
 * 				case_id
 * 				case_number
 * 				case_stage
 * 
 * Date            	Author(s)		Remarks
 * 1/25/2018			Jeff O & Eric A
 * 3/14/2018			Updated SearchCases Restlet to use library_dynamic_search script
 * 3/29/2018            Pat Kelleher  Moved to Production
 */


function SearchCases(datain)
{
	nlapiLogExecution('debug', 'RESTLET SearchCases started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	var dataout = {};
	var caseResults = [];
	//var columnsout = ['case_id', 'case_number', 'case_stage', 'case_assignee', 'case_institution', 'case_subject'];
	var columnsout = ['case_id', 'case_institution', 'case_assignee', 'case_subject', 'case_stage', 'case_date_created', 'case_priority'];
	//var columnsout = [];
	
	try
	{			
		if (L_JSONisEmpty(datain)) {						
			restlet_status_details = 'SearchCases Restlet Datain Error:  Input JSON object is empty';
			restlet_status = 'ERROR';			
		}
		else {
			caseResults = L_dynamicSearch(datain, 'supportcase', columnsout);		
			
			if(L_dynamicSearchDone) {
				restlet_status_details = 'SearchCases Restlet found ' + caseResults.length + ' cases.';
				restlet_status = 'SUCCESS';
			}			
			else {
				restlet_status_details = 'SearchCases Restlet ERROR:  SEARCH FAILED...' + L_dynamicSearchMsg;
				restlet_status = 'ERROR';
			}
		}
	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			restlet_status_details = 'SearchCases Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{		
			restlet_status_details = 'SearchCases Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}
	
	nlapiLogExecution( 'DEBUG', 'restlet_status', restlet_status);
	nlapiLogExecution( 'DEBUG', 'restlet_status_details', restlet_status_details);
	
	// Return Case Data	
	dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, case_array: caseResults};
	
	nlapiLogExecution('debug', 'RESTLET SearchCases ended...');
	
	return(dataout);
}  


