//   Script:     scheduled_archiveAccessingItems.js
//   
//   Created by: Eric Abramo
//
//   Description:	Script runs saved search
//   			1) Accessing Items with Fiscal Date prior to July 1 2015 - archive data
//    			It iterates through the internal ID's of the results of the search and deletes the record
//				This script also re-schedules itself to run when the governance units get low
//   
//   Functions: 	search_and_delete_accessingitems
//
//	 Parameters: 	custscript_accessing_site_search_id 
//						stores the ID of the Saved Search used to generate the deletions
//
//    Revisions: 
//    06-09-2017	Eric Abramo	Created Script File
//
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Flag to use if low on NetSuite Governance Usage Units
var lowUsage = false;

function search_and_delete_accessingitems()
{
	var accitem_searchid = nlapiGetContext().getSetting('SCRIPT', 'custscript_accessing_site_search_id');
	nlapiLogExecution('DEBUG', 'Start of function', 'Search ID parameter is: '+accitem_searchid);	

	// Accessing Item record Deletions.  In NetCRM the record id for Accessing Item is 'customrecord60'
	// custscript_accessing_site_search_id is a parameter in the SCRIPT Record storing the Search ID
	var search = nlapiLoadSearch('customrecord60', accitem_searchid);
	var searchResults = search.runSearch();
	// Counter Variables to Control the Result Sets
	var resultIndex = 0; 
	var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
	var resultSet; // temporary variable used to store the result set
	do 
	{
	    // fetch one result set
	    resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);	
	    // increase pointer
	    resultIndex = resultIndex + resultStep;

	    // process or log the results
	    nlapiLogExecution('DEBUG', 'resultSet returned', resultSet.length +' records returned');		
		if (resultSet.length == 0)
		{
			return; // close out function if no results
		}		
		// If results then Loop (added lowUsage parameter to ensure don't go over usage limit)
		for (var i = 0; i < resultSet.length && lowUsage == false; i++)
		{
			// nlapiLogExecution('DEBUG', 'Get Remaining Usage', 'Remaining Usage is: '+nlapiGetContext().getRemainingUsage());
			if (nlapiGetContext().getRemainingUsage() >= 100 )
			{			
				var ai_searchresult = resultSet[i];
				var x = ai_searchresult.getAllColumns(); 	
				var aiId = ai_searchresult.getValue(x[0]);
				// nlapiLogExecution('DEBUG', 'Accessing Item to be deleted:', 'aiId= '+aiId);
				nlapiDeleteRecord('customrecord60', aiId);
			}
			else
			{	// Flag if low on NetSuite Governance Usage Units
				lowUsage = true;
			}
		}	
		nlapiLogExecution('DEBUG', 'Finished search_and_delete_accessingitems', 'Deleted Record Count = '+i);
	// once no records are returned we already got all of them
	}while (resultSet.length > 0 && lowUsage == false)
		
	//RESCHEDULING THE SCRIPT	            
	if (lowUsage == true)
	{
		nlapiLogExecution('DEBUG', 'Usage About to Be Exceeded', 'ReScheduling Script');
		// var status = nlapiScheduleScript('customscript_scheduled_delete_accitems', 'customdeploy_scheduled_delete_accitems');
		var context = nlapiGetContext();
		var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());	
		nlapiLogExecution('DEBUG', 'scheduled Script status', 'status is '+status);
	}
	else
	{
		nlapiLogExecution('DEBUG', 'scheduled Script status', 'No need to re-schedule the script');
	}
}

