// Script:     Scheduled_ECInvite_syncMarketo.js
// 			   
// Created by: Christine Neale
//
// Function: This script identifies Contact records which have recently become active in EBSCO Connect and if they are eligible
//           to sync to Marketo sets the "Move to Marketo" field to achieve this. 
//
// Note: userEvent_contact_after_submit.js handles actually setting the "sync to Marketo" flag on the Contact
//
// Library Scripts Used:	library_utility.js	
//							
// Revisions:  
//		
//		CNeale			11/12/2019 	US562939 Created 
//									
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CONT_SYS_NOTES_SEARCH = 'customsearch_ec_uact_sysnotes';

function userActiveSyncMarketo()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
	
	// Perform Search to identify Contacts set to "User Active" for EBSCO Connect and "Sync to Marketo" False in last 3 days
	var contSysNotesSearch_results = that.recordSearcher.search('contact', CONT_SYS_NOTES_SEARCH, null, null);	
	nlapiLogExecution('audit', 'Ran Saved Search', CONT_SYS_NOTES_SEARCH);	
	
	if(contSysNotesSearch_results) 
	{
		nlapiLogExecution('audit', 'Total records found by saved search:',contSysNotesSearch_results.length);
		
		for(var z=0; z < contSysNotesSearch_results.length; z++)
		{
		    var result=contSysNotesSearch_results[z];
		    var resultColumns=result.getAllColumns();
	
		 // Get the data from this search result row
			var contInternalID = result.getValue(resultColumns[0]);
			var contEmail = result.getValue(resultColumns[1]);
			var contName = result.getValue(resultColumns[3]);
							
			nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID:', contInternalID);							
			nlapiLogExecution('debug', 'result('+(z+1)+').Email,:', contEmail);

		// Now see if there is already a Contact with "Sync to Marketo" set for this email			
			var confilters = new Array();
			confilters[0] = new nlobjSearchFilter('email', null,'is', contEmail);
			confilters[1] = new nlobjSearchFilter('internalid', null, 'noneof', contInternalID);
			confilters[2] = new nlobjSearchFilter('custentity_sync_to_marketo', null, 'is', 'T');

			var concolumns = new Array();
			concolumns[0] = new nlobjSearchColumn('internalid', null, null);
			concolumns[1] = new nlobjSearchColumn('entityid', null, null);

			//execute Contact search
			con_searchResults = nlapiSearchRecord('contact', null, confilters, concolumns);
			
			if (con_searchResults)
			{	
				var syncId = con_searchResults[0].getValue('internalid');
				var syncCon = con_searchResults[0].getValue('entityid');
				nlapiLogExecution('error', 'Contact ' + contInternalID + ' : ' + contName + ' : ' + contEmail + ' not synced to Marketo', 
						'Contact already synced with dupe email ' + syncId + ' : ' + syncCon);
			}
			else
			{
				try
				{
					nlapiLogExecution('debug', 'Contact sync to Marketo = ', contInternalID + ' : ' + contName);
					nlapiSubmitField('contact', contInternalID, 'custentity_move_to_marketo','1');
				}
				catch(e)
				{
					nlapiLogExecution('error', 'Contact sync to Marketo fail = ', contInternalID + ' : ' + contName);
				}
			}

			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', custIntId);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', custIntId);  
			}
			
		} // End of For loop for each result
		
	}// End of results found
	
	else
	{
		nlapiLogExecution('audit', 'Total records found by saved search:','0');
	}	
	
	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');
}
