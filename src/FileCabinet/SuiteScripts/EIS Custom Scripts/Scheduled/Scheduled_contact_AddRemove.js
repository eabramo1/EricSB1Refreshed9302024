// Script:  Scheduled_contact_AddRemove.js 
// 			   
// Created by: Christine Neale
//
// Function: Script to identify Attach/Remove Contacts that have not been picked up by CRMDL & update "isUpdated" flag  
//			
// Library Scripts Used:	library_utility.js
//
// Revisions: 
//	CNeale		06/15/2020	Initial version in Audit mode only (no update of "isUpdated" Flag).
//	eAbramo		10/21/2020	US627280 Implement NetCRM Scheduled Job to find Contact relationship changes (exclude Merge)
//									
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function addRemoveProcess()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
	
	// Set count of Contacts identified for update & where main company removed (needed for Audit)
	var ContUpdCount = 0;
	var Cont_elim_1Count = 0;
	var Cont_elim_2Count = 0;
	var Cont_elim_3Count = 0;
	var reset_interval = true;
	var skip_contact = null;
	
 	// Determine date/time last run & date/time now	  
		  timRec = nlapiLoadRecord('customrecord_scheduled_script_runtime', 4); 
		  var start_s = timRec.getDateTimeValue('custrecord_generic_script_last_run'); // Retrieve "Last run" as starting point
		  nlapiLogExecution('debug', 'Last Run = ', start_s);
		  nlapiSubmitRecord(timRec, true);
		  
		  var end = nlapiLookupField('customrecord_scheduled_script_runtime', 4, 'lastmodified'); // Retrieve "Date last modified" as end point
		  nlapiLogExecution('debug', 'end filter = ', end);
		  
		  // Now add seconds to "end" and remove seconds from "start_s"
		  var start = start_s.substring(0, start_s.lastIndexOf(":")) + ' ' + start_s.substring(start_s.length-2); 
		  var end_s = end.substring(0, end.lastIndexOf(":")+3) + ':00 ' + end.substring(end.length-2);
		  
		  nlapiLogExecution('audit', 'Filters: Start Date = ' + start, 'End Date = ' + end);
		  
		  nlapiLogExecution('debug', 'start  = ' + start, 'start_s = ' + start_s);
		  nlapiLogExecution('debug', 'end  = ' + end, 'end_s = ' + end_s);
	
	// Perform Search to identify Contacts with date last modified within specific date/time 
	// Outer Search uses 'Last Modified Date' Set search criteria 
	var s1_filters = new Array();
	s1_filters[0] = new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', start);
	s1_filters[1] = new nlobjSearchFilter('lastmodifieddate', null, 'before', end);
	// s1_filters[2] = new nlobjSearchFilter('custentity_isupdated', null, 'is', 'F');
	var s1_columns = new Array();
 	s1_columns[0] = new nlobjSearchColumn('lastmodifieddate');
 	
 	// Use Celigo library function to return > 1000 rows
	var s1_searchResults = that.recordSearcher.search('contact', null, s1_filters, s1_columns);

	nlapiLogExecution('debug', 'Ran Saved Search');	
	
	if(s1_searchResults) 
	{
		nlapiLogExecution('audit', 'Total records found by S1 saved search:',s1_searchResults.length);
		// Iterate through each Contact
 		for(var z=0; z < s1_searchResults.length; z++)
		{
 			skip_contact = false; // assume we don't skip the contact 
 			
 			var result=s1_searchResults[z];
		    var resultColumns=result.getAllColumns();
		    var contId = result.getId();
		 // get the Contact Last Modified Date from this search result row
			var contLastMod = result.getValue(resultColumns[0]);
			nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID and Last Mod:', contId + ' ' + contLastMod);	
		
			//Begin search Code:  Round 1 for elimination of Contact records to flag (Parent OE Approved is false - OR -  isUpdated is true )	
			var con_elim_1_filters = new Array();
			con_elim_1_filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', contId);		
			//execute search - Round 1 for elimination of Contact records to flag (refer to library_constants for search_id)
			var con_elim_1_results = nlapiSearchRecord('contact', LC_Saved_search.con_sync_elim_1, con_elim_1_filters, null);	
			// nlapiLogExecution('DEBUG', 'con_elim_1_results ran');
			if (con_elim_1_results)
			{
				skip_contact = true;
				nlapiLogExecution('DEBUG', 'con_elim_1_results yielded result for contact '+contId, 'skip_contact set to true');
				// PULLED CHRISTINE'S CODE OUT HERE -- was used for audit and finds Removed Contacts
				Cont_elim_1Count = Cont_elim_1Count +1;
			}
			if (skip_contact == false){
				// Begin search code:  Round 2 for elimination of Contact records already syncing 
				//		where the Contact LMD matches to the date of a Contact System Note where isUpdated flag is being set from True to False			
				var con_elim_2_filters = new Array();
				con_elim_2_filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', contId);
				con_elim_2_filters[1] = new nlobjSearchFilter('date', 'systemnotes', 'onorafter', contLastMod);
				//execute search - Round 2 (refer to library_constants for search_id)			
				var con_elim_2_results = nlapiSearchRecord('contact', LC_Saved_search.con_sync_elim_2, con_elim_2_filters, null);
				// nlapiLogExecution('DEBUG', 'con_elim_2_results ran');
				if (con_elim_2_results){
					skip_contact = true;
					nlapiLogExecution('DEBUG', 'con_elim_2_results yielded result for contact '+contId, 'skip_contact set to true');
					Cont_elim_2Count = Cont_elim_2Count +1;
				}
			}
			if (skip_contact == false){
				// Begin search code:  Round 3 for elimination of Contact records 
				//		where System Note matches the LMD 
				// 		and whereby the System Context is 'CSV' or 'Script(Scheduled)' or 'Script(Suitelet)' or 'SOAP Web Services'		
				var con_elim_3_filters = new Array();
				con_elim_3_filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', contId);
				con_elim_3_filters[1] = new nlobjSearchFilter('date', 'systemnotes', 'onorafter', contLastMod);
				//execute search - Round 3 (refer to library_constants for search_id)			
				var con_elim_3_results = nlapiSearchRecord('contact', LC_Saved_search.con_sync_elim_3, con_elim_3_filters, null);
				// nlapiLogExecution('DEBUG', 'con_elim_2_results ran');
				if (con_elim_3_results){
					skip_contact = true;
					nlapiLogExecution('DEBUG', 'con_elim3_results yielded result for contact '+contId, 'skip_contact set to true');
					Cont_elim_3Count = Cont_elim_3Count +1;
				}
			}
		
			// Only continue if the number of Contacts updated doesn't reach the pre-designated threshold (refer to library_constants) 
			// nlapiLogExecution('DEBUG', 'skip_contact is '+skip_contact, 'ContUpdCount is '+ContUpdCount);     
			// nlapiLogExecution('DEBUG', 'LC_isupdated_threshold is '+LC_isupdated_threshold);
			if (skip_contact == false && ContUpdCount < LC_isupdated_threshold){
				try{
					nlapiSubmitField('contact', contId, 'custentity_isupdated', 'T');
					ContUpdCount = ContUpdCount + 1;
					nlapiLogExecution('debug', 'Contact isUpdated flag set to true', 'contId:  ' +contId+ '. contLastMod: '+contLastMod);				
				}
				catch(err)
				{
					nlapiLogExecution('DEBUG', 'err.name is '+err.name, 'err.message is '+err.message);
					nlapiSendEmail(LC_Employees.MercuryAlerts, LC_Email.CRMEscalation, 'Scheduled Contact Attach/Remove Error: Unable to set isUpdated flag', 'Contact with an internal ID of '+contId+' was found to need its isUpdated flag set to true.  There was an error in the scheduled script when trying to set the field to true.<BR><BR>The error is: '+err.message, null, null, null, null, null, null, null);
				}	
			}
			if (ContUpdCount == LC_isupdated_threshold){
				nlapiLogExecution('debug', 'Hit the designated threshold.  This Contact not processed', 'ContUpdCount: ' +ContUpdCount+ ' contId: ' +contId);
				reset_interval = false;
				break;
			}
		
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			// nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if (nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', contId);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', contId);  
			}

		} // End of For loop for each result
 		
	}// End of results found
	
	else
	{
		nlapiLogExecution('audit', 'Total records found by saved search:','0');
	}	
	
	nlapiLogExecution('debug', 'end  = ' + end, 'end_s = ' + end_s);
	// Update the Script Runtime custom record - if reset_interval is still true
	if (reset_interval == true){
		timRec2 = nlapiLoadRecord('customrecord_scheduled_script_runtime', 4);
		timRec2.setDateTimeValue('custrecord_generic_script_last_run', end_s);  //Last Run set to end limit date
		nlapiSubmitRecord(timRec2, true);		
	}

	// If in Audit mode write the audit summary record
	auditrec = nlapiCreateRecord('customrecord_audit_contact_add_remove');
	auditrec.setFieldValue('custrecord_audit_contacts_processed', s1_searchResults.length);
	auditrec.setFieldValue('custrecord_audit_count', ContUpdCount);
	auditrec.setFieldValue('custrecord_elim_count1', Cont_elim_1Count);
	auditrec.setFieldValue('custrecord_elim_count2', Cont_elim_2Count);
	auditrec.setFieldValue('custrecord_elim_count3', Cont_elim_3Count);
	if (reset_interval == false){
		auditrec.setFieldValue('custrecord_hit_threshold', 'T');
	}
	nlapiSubmitRecord(auditrec, true);
	
	nlapiLogExecution ('audit', 'Contact update count: ' +ContUpdCount);
	
	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');
}
