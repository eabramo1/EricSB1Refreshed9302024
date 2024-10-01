// Script:     Scheduled_pushCustomerSalesRepChg.js
// 			   
// Created by: Kate McCormack
//
//Function: This script identifies Customer records which have had their Sales Rep field changed since the last time that this script ran.  It then 
//			determines if the Customer record needs to be updated so that "Muv Sync Field Last Modified" will be updated so that the record will be
//			flagged for collection by Vertify. This script reads the 'Push Sales Rep Start Date' which is held on the custom "Scheduled Script Run Time" 
//			record ID#2.  When this script finishes, it will update the 'Push Sales Rep Start Date' field on that record for use with the next run.
//
//			The situation which this script is meant to clean up occurs if CRM Data Loader updates the Sales Rep assignment on the Customer without 
//			causing server scripts to be run and therefore the "MUV SYNC FIELD LAST MODIFIED" field is never updated by the CRM Data loader change.
//			Since Vertify collection keys off of "MUV SYNC FIELD LAST MODIFIED" timestamp to determine when to collect a Customer record, we need to 
//			update some field on the Customer so the scripts will be triggered and the "MUV SYNC FIELD LAST MODIFIED"will be set. The Customer 
//			field which we will update to trigger the save & script runs is the "PUSH TO MARKETO DATE" field.  If these situations are not cleaned up 
//			and collected by Vertify, then new incoming Marketo opportunities get incorrectly assigned to the old Sales Rep.
//
// Library Scripts Used:	library_utility.js						
//
// Revisions:  
//		
//		K McCormack		03/12/2019 	Created for US450319 Marketo Defects - Data Process Loopholes: 
//									DE31648 Marketo process creates MLO under incorrect Sales Rep:  Vertify has incorrect Sales Rep
//
//		K McCormack		03/14/2019 	Restructured code so that this could run for a certain time range based on the
//									the new deploy parameter 'ADDITIONAL DAYS (AFTER START DAY) TO BE SEARCHED'.  If this 
//									parameter is set to 0, then only the one day signified by Start Date will be searched.  If this
//									parameter is greater than 0, then the search will include that many additional days.
//
//		K McCormack		03/18/2019 	Correct bug of usage check not being within results loop.
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CUST_SYS_NOTES_SEARCH = 'customsearch_sysnotes_cust_sales_rep';

function pushCustSalesRepChg()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();	
	
	// Fetch the current run time - this will be used later to update the Last runtime of this script
	var this_runtime = new Date();
	this_runtime_string = nlapiDateToString(this_runtime, 'datetimetz'); 	

	// Look at a single hard-coded record which stores the last search date for this script.
	// It will be used in the search filter (this will be the start date of the new search)
	var script_runtime_record = nlapiLoadRecord('customrecord_scheduled_script_runtime', '2');
	var scriptParmStartString = script_runtime_record.getFieldValue('custrecord_push_sales_rep_start_date');
	
	//Read deployment parameter to define the number of days from the start date of system notes to be searched
	var scriptDaysParmField = 'custscript_search_days';
	var scriptParmExtendNumOfDays = nlapiGetContext().getSetting('SCRIPT', scriptDaysParmField);	
	
	nlapiLogExecution('audit', 'PARAMETER VALUE: Start Date:  '+ scriptParmStartString);
	nlapiLogExecution('audit', 'PARAMETER VALUE: Days to extend search beyond start day: '+ scriptParmExtendNumOfDays);
	
	if(scriptParmStartString != null && scriptParmExtendNumOfDays != null) {
		var currentStartDateString = scriptParmStartString;	
		var currentEndDateString = '';
		var daysTillNextStart = parseInt(scriptParmExtendNumOfDays) + 1;
		var nextStartDateString = '';
			
		//Convert string start date to a dateObject so we can calculate additional days
		var scriptParmStartDate = nlapiStringToDate(scriptParmStartString, 'datetimetz');
		var addDateObjEnd = nlapiAddDays(scriptParmStartDate,scriptParmExtendNumOfDays);  		// add parameterized number of days to the date object
		var addDateObjNext = nlapiAddDays(scriptParmStartDate,daysTillNextStart); 	// next scheduled run will start search on following day
		currentEndDateString = nlapiDateToString(addDateObjEnd); // convert the date object to string	
		nextStartDateString = nlapiDateToString(addDateObjNext); // convert the date object to string	
	
		nlapiLogExecution('audit', 'End Search Date Value:  '+ currentEndDateString);		
		
		var totalRecsForced = 0;				
		var filter = new Array();	
		
		filter[0] = new nlobjSearchFilter('date', 'systemnotes', 'within', currentStartDateString, currentEndDateString);
		var custSysNotesSearch_results = that.recordSearcher.search('customer', CUST_SYS_NOTES_SEARCH, filter, null);	
		
		nlapiLogExecution('audit', 'Ran "' + CUST_SYS_NOTES_SEARCH +'" for SalesRep chg sysNotes.date within:', currentStartDateString + ' and ' + currentEndDateString);	
		
		if(custSysNotesSearch_results) {
			nlapiLogExecution('audit', 'Total records found by saved search:',custSysNotesSearch_results.length);
			for(var z=0; z < custSysNotesSearch_results.length; z++)
			   {
			    var result=custSysNotesSearch_results[z];
			    var resultColumns=result.getAllColumns();
		
			 // get the data from this search result row
				var custInternalID = result.getValue(resultColumns[0]);
				var custName = result.getValue(resultColumns[1]);
				var muvSyncLastMod = result.getValue(resultColumns[2]);
				var sysNotes_date = result.getValue(resultColumns[3]);				
								
				nlapiLogExecution('debug', 'result('+(z+1)+').Customer ID and NAME:', custInternalID + ' ' + custName);							
				nlapiLogExecution('debug', 'result('+(z+1)+').muvSyncLastModified:', muvSyncLastMod);
				nlapiLogExecution('debug', 'result('+(z+1)+').System Notes Date:', sysNotes_date);	
			
				//Convert string dates to actual date format so they can be compared.  (If you tried to compare 
				//'sysNotes_date' and 'muvSyncLastMod', they would be compared as STRINGS, not as TIMESTAMPS!)
				var muvSyncLastMod_timestamp = nlapiStringToDate(muvSyncLastMod, 'datetimetz');
				var sysNotes_date_timestamp = nlapiStringToDate(sysNotes_date, 'datetimetz');
				
				//See if this Sales Rep field update found in the system notes took place AFTER the last time this record moved to marketo
				if (sysNotes_date_timestamp > muvSyncLastMod_timestamp)			
				{	
					//Update a field on the customer, (custentity_push_marketo_date), which will cause Muv Sync Field Last Modified to be updated so Vertify will pick up
					nlapiLogExecution('audit', '*** SysNotes show SalesRep('+(z+1)+') chged ' + sysNotes_date + ', force modify Customer:', 'ID = ' + custInternalID + ' ... NAME = ' + custName);						
					nlapiSubmitField('customer', custInternalID, 'custentity_push_marketo_date',this_runtime_string);		
					totalRecsForced++;	
				}	
				//else nlapiLogExecution('audit', '*** SysNotes show SalesRep('+(z+1)+') chged ' + sysNotes_date + ', NO modify Customer:', 'ID = ' + custInternalID + ' ... NAME = ' + custName);
							
				// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
				nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				if(nlapiGetContext().getRemainingUsage() < 100) 
				{
					nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
					nlapiLogExecution('audit', '*** Yielding ***', custInternalID);
					nlapiSetRecoveryPoint();
					nlapiYieldScript();
					nlapiLogExecution('audit', '*** Resuming from Yield ***', custInternalID);
				}			   
			 }  //end for each result loop
		}  //end results found
		else nlapiLogExecution('audit', 'Total records found by saved search:','0');		
		
		nlapiLogExecution('audit', 'Total Records force modified: ', totalRecsForced);	
		//if(totalRecsForced > 0) nlapiLogExecution('audit', 'custentity_push_marketo_date value set for (' + totalRecsForced + ') recs: ', this_runtime_string);	
	
		nlapiLogExecution('audit', 'Setting Start Date field on Scheduled Script Record to: ', nextStartDateString);	
		//Update the Custom record which stores the Search Start Date -- Used for next time this script runs	
		script_runtime_record.setFieldValue('custrecord_push_sales_rep_start_date', nextStartDateString);
		nlapiSubmitRecord(script_runtime_record);		
	}	

	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');	
}	
	
