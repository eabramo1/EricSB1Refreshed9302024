/*
* Script:     Scheduled_PushWinserToMarketingLead_batch.js
* 
* Created by: Eric Abramo  on  12/19/2017
* 
* Functions:  	write_winser_to_mlo:
*		Search for all Open and Closed WinSeR Opportunities (exclude Trial) 
*		with MLO ID and with Winser Last Updated after LastRunTime of this script
*			(Note: Last Run Time is adjusted from Pacific time and cushioned with 20 minutes)
* 		Write the appropriate data into the Marketing Lead Opportunity (the MLO) using the found MLO ID
* 
* Library Scripts used:		library_utility.js
* 
* Amendment Log:
*		
* 
* 
*/

function write_winser_to_mlo( )
{
	nlapiLogExecution('DEBUG', 'begin function write_winser_to_mlo');	
	
	// Handle Run Times for this scheduled script
	// load a single hard-coded record which stores the last runtime of this script
	// convert Time from Pacific to Eastern time and subtract 20 minutes (extra cushion)
	// It will be used in the search filter (take only MLO's updated after the Last Run Time
/*	
	var script_runtime_record = nlapiLoadRecord('customrecord_scheduled_script_runtime', '1');
	var last_runtime = script_runtime_record.getFieldValue('custrecord_last_winser_mlo_runtime');
	// DATE CONVERSION CODE
		last_runtime = nlapiStringToDate(last_runtime, 'datetimetz');
		last_runtime.setHours(last_runtime.getHours() + 3);           //Note: Add 3 hours to date set in order to get it to current EST time
		last_runtime.setMinutes(last_runtime.getMinutes() - 20);   	  //Note: Subtract 20 minutes from current EST time to look backwards for any entities to push
		var last_runtime_date = nlapiDateToString(last_runtime, 'date');
		var last_runtime_time = nlapiDateToString(last_runtime, 'timeofday');
		var last_runtime_dateTime = last_runtime_date + ' ' + last_runtime_time;
		
		nlapiLogExecution('DEBUG', 'last_runtime_dateTime is:', last_runtime_dateTime);
*/

	// Fetch the current run time - this will be used later to update the Last runtime of this script
	var this_runtime = new Date();
	this_runtime_string = nlapiDateToString(this_runtime, 'datetimetz');

	// Set Variables for DateTime Threshold
	var start_threshold_datetime = nlapiStringToDate('10/29/2020 00:00 AM', 'datetime');
	var start_threshold_date = nlapiDateToString(start_threshold_datetime, 'date');
	var start_threshold_time = nlapiDateToString(start_threshold_datetime, 'timeofday');
	var start_threshold = start_threshold_date + ' ' + start_threshold_time;
	
	var end_threshold_datetime 	= nlapiStringToDate('01/31/2021 11:59 PM', 'datetime');
	var end_threshold_date = nlapiDateToString(end_threshold_datetime, 'date');
	var end_threshold_time = nlapiDateToString(end_threshold_datetime, 'timeofday');
	var end_threshold = end_threshold_date + ' ' + end_threshold_time;
	
	nlapiLogExecution('DEBUG', 'start_threshold is:', start_threshold);
	nlapiLogExecution('DEBUG', 'end_threshold is:', end_threshold);
	
	// US582198 accommodate for API Governance limits
	var that = this;
	this.recordSearcher = new L_recordSearcher();		
		
	// Create Search Gather the Updated WinSeR Opportunity Items
	var winser_filters = new Array();
		winser_filters[0] = new nlobjSearchFilter('custbody_oppty_form_type', null, 'anyof', '4'); // 4 = Winser
		winser_filters[1] = new nlobjSearchFilter('custcol_mlo_id', null, 'isnotempty'); // has an MLO ID		
		winser_filters[2] = new nlobjSearchFilter('custbody1', null, 'noneof', '14'); // Opportunity Type is not WinSeR Trial
		winser_filters[3] = new nlobjSearchFilter('custcol_oppty_item_status', null, 'noneof', '@NONE@');
		winser_filters[4] = new nlobjSearchFilter('mainline', null, 'is', 'F');	// needed to get the item amount (not header amount)
		winser_filters[5] = new nlobjSearchFilter('custcol_winser_last_updated', null, 'after', start_threshold); 
		winser_filters[6] = new nlobjSearchFilter('custcol_winser_last_updated', null, 'before', end_threshold); 
		var winser_columns = new Array();
		winser_columns[0] = new nlobjSearchColumn('internalid', null, null);
		winser_columns[1] = new nlobjSearchColumn('custcol_mlo_id', null, null);
		winser_columns[2] = new nlobjSearchColumn('custcol_winser_last_updated', null, null);
		winser_columns[3] = new nlobjSearchColumn('custcol_oppty_item_status', null, null);		
		winser_columns[4] = new nlobjSearchColumn('amount', null, null);
		winser_columns[5] = new nlobjSearchColumn('custcol_oppty_item_probability', null, null);
		winser_columns[6] = new nlobjSearchColumn('custcol_oppty_item_weighted_usd', null, null);
		winser_columns[7] = new nlobjSearchColumn('custcol_oppty_item_expected_close', null, null);
		winser_columns[8] = new nlobjSearchColumn('custcol_oppty_item_close_date', null, null);
	//execute search
	winser_searchResults = nlapiSearchRecord('transaction', null, winser_filters, winser_columns);
	if (winser_searchResults)
	{
    	nlapiLogExecution('DEBUG', 'Number of Opportunity Items Returned:', winser_searchResults.length);
// /*
    	for (var x=0; winser_searchResults != null && x < winser_searchResults.length; x++ )
		{	// Get all values needed for the MLO Update
			var winser_internalid = winser_searchResults[x].getValue('internalid');
			var winser_mlo_id = winser_searchResults[x].getValue('custcol_mlo_id');
			// Log returned results info
			nlapiLogExecution('DEBUG', 'WinSeR Opportunity ID: '+winser_internalid , 'winser_mlo_id is: '+winser_mlo_id);
			var winser_last_updated = winser_searchResults[x].getValue('custcol_winser_last_updated');
			var winser_stage = winser_searchResults[x].getValue('custcol_oppty_item_status');
				// Lookup to get the correct lead status (through the mapping on the Opportunity Item Status record)
				var new_lead_status = nlapiLookupField('customrecord_oppty_item_status', winser_stage, 'custrecord_mlo_lead_status_map');
				// also lookup to get the correct Header-Level Entity Status
				var new_header_status = nlapiLookupField('customrecord_oppty_item_status', winser_stage, 'custrecord_mlo_header_status_map'); 
			var amount = winser_searchResults[x].getValue('amount');				
			var probability = winser_searchResults[x].getValue('custcol_oppty_item_probability');
				// convert the decimal to percent - multiply by 100
			probability = probability * 100;
			var weighted_total = winser_searchResults[x].getValue('custcol_oppty_item_weighted_usd');
			var expected_close = winser_searchResults[x].getValue('custcol_oppty_item_expected_close');
			var close_date = winser_searchResults[x].getValue('custcol_oppty_item_close_date');
			// nlapiLogExecution('DEBUG', 'WinSeR Opportunity ID: '+winser_internalid , 'winser_last_updated is: '+winser_last_updated);
			// Write data into the MLO (Marketing Lead Opportunity) - load record/Update fields/submit record	
			try
			{
				var mlo = nlapiLoadRecord('opportunity', winser_mlo_id);
				mlo.setFieldValue('custbody_lead_status', new_lead_status);
				mlo.setFieldValue('entitystatus', new_header_status);
				mlo.setFieldValue('projectedtotal', amount); // Set TWO fields (both Projected Total and  Item amount) to the WinSeR Item Amount
				mlo.setLineItemValue('item', 'amount', 1, amount);
				mlo.setFieldValue('probability', probability);
				mlo.setFieldValue('weightedtotal', weighted_total);
				mlo.setFieldValue('expectedclosedate', expected_close);			
				mlo.setFieldValue('closedate', close_date);
				nlapiSubmitRecord(mlo);
			}
			catch(err)
			{
				nlapiLogExecution('DEBUG', 'err.name is '+err.name, 'err.message is '+err.message);
			}
			
			// US582198 accommodate for API Governance limits			
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			if(nlapiGetContext().getRemainingUsage() < 110) 
			{
				nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('DEBUG', '*** Yielding ***', 'winser_internalid is  '+winser_internalid+ '. winser_mlo_id is '+winser_mlo_id);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('DEBUG', '*** Resuming from Yield ***', 'winser_internalid is  '+winser_internalid);
			}
		}
//    	*/
	}
	// Update the Custom record which stores the Last Run Time -- Used for next time this script runs
/*
	script_runtime_record.setFieldValue('custrecord_last_winser_mlo_runtime', this_runtime_string);
	nlapiSubmitRecord(script_runtime_record);
*/
	nlapiLogExecution('DEBUG', 'End function write_winser_to_mlo');
}

