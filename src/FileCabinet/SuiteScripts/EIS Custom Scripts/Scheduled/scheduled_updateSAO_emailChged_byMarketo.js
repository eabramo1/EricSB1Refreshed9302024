// Script:     Scheduled_updateSAO_emailChged_byMarketo
// 			   
// Created by: Kate McCormack
//
//Function: This script identifies Contact records which have had their EMail field changed by a non-UI process since the last time that this script ran.
//			It then determines if this change should be reverted because an email change would cause problems. Situations requiring reverting are:
//				1. Contact is involved in the SAO (Semi-Automatic Ordering) process which relies on email to tie to EBSCONET
//				2. Contact is currently synced with EBSCO Connect and is active
//			
//			The last run time for this script is held on the custom "Scheduled Script Run Time" record ID#3. When this script finishes, it will update the 
//			'GENERIC SCRIPT LAST RUN TIMESTAMP (PST)' value in the 'custrecord_generic_script_last_run' field on that record for use with the next run.
//
//
// Library Scripts Used:	library_utility.js	
//							library_constants.js
//
// Revisions:  
//		
//		K McCormack		06/02/2020 	Created for US631318:  SAO: Scheduled job to handle Marketo Modifies SAO Contact Email address
//
//		K McCormack		10/29/2020 	Bug fixes: 
//							1. First need to check if Sys Notes non-UI email chg IS actually a value change and not just a different camel case of same value
//							2. Need to convert text values to lower case to avoid showing a mismatch simply due to text camel case
//							3. Fix typo of variable reference contInternalID which SHOULD be conInternalID 
//							4. Change email address to CRMescalation@ebsco.com for production
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CONTACT_SYS_NOTES_SEARCH_EMAIL = 'customsearch_sysnotes_contact_email_chg';
var CONTACT_SYS_NOTES_SEARCH_SAO_STATUS = 'customsearch_sysnotes_contact_status_chg';

function checkContactEmailChg()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();	
		
	// Fetch the current run time - this will be used later to update the Last runtime of this script
	var this_runtime = new Date();
	this_runtime_string = nlapiDateToString(this_runtime, 'datetimetz'); 	

	// Look at a single custom record of type 'Scheduled Script Run Time' (ID #3) which stores last run date/time for this particular script.
	// It will be used in the search filter (this will be the start date/time of the new search)
	var script_runtime_record = nlapiLoadRecord('customrecord_scheduled_script_runtime', '3');
	var scriptLastRunString = script_runtime_record.getFieldValue('custrecord_generic_script_last_run');
		
	nlapiLogExecution('audit', 'Script Last Run Datetime:  ', scriptLastRunString);		
	
	// DATE CONVERSION CODE - Need to  do this to remove seconds from the datetime because the saved search only wants hours & minutes
	last_runtime = nlapiStringToDate(scriptLastRunString, 'datetime');	
	//last_runtime.setHours(last_runtime.getHours() + 3);           //Note: Add 3 hours to date set in order to get it to current EST time
	//last_runtime.setMinutes(last_runtime.getMinutes() - 20);   	//Note: Subtract 20 minutes from current EST time to look backwards for any entities to push
	var last_runtime_date = nlapiDateToString(last_runtime, 'date');
	var last_runtime_time = nlapiDateToString(last_runtime, 'timeofday');
	var last_runtime_dateTime = last_runtime_date + ' ' + last_runtime_time;
		
	var totalEmailChgsReverted = 0;	 //Initialize counter
	
	//Search for all Contacts who have had their email changed by a non-UI process since the last time this script ran.
	var filter = new Array();	
	filter[0] = new nlobjSearchFilter('date', 'systemnotes', 'after', last_runtime_dateTime);
	var contactSysNotesSearch_results = that.recordSearcher.search('contact', CONTACT_SYS_NOTES_SEARCH_EMAIL, filter, null);	
	
	nlapiLogExecution('audit', 'Ran "' + CONTACT_SYS_NOTES_SEARCH_EMAIL +'" for Contact Email changes after:', last_runtime_dateTime);	
	
	var IDprocessed = '';   //Initialize ID storage variable. See notes below for the use of this variable
		
	//Process any results from the search
	if(contactSysNotesSearch_results) {
		nlapiLogExecution('audit', 'Total records found by saved search SysNotes: Contacts with non-UI updated email:',contactSysNotesSearch_results.length);
		//Work backwards from most recent changes to oldest changes (that occurred after the last run)
		for(var z=0; z < contactSysNotesSearch_results.length; z++)
		   {
		    var result=contactSysNotesSearch_results[z];
		    var resultColumns=result.getAllColumns();
	
		 // get the data from this search result row
			var conInternalID = result.getValue(resultColumns[0]);
			var sysNotes_date = result.getValue(resultColumns[1]);
			var emailOLDValue = result.getValue(resultColumns[2]);
			var emailNEWValue = result.getValue(resultColumns[3]);
			var conNameCurrValue = result.getValue(resultColumns[4]);
			var conCompanyCurrValue = result.getValue(resultColumns[5]);
			var conEmailCurrValue = result.getValue(resultColumns[6]);
			var conSAOAppStatusCurrValue = result.getValue(resultColumns[7]);				
			
			//The system notes saved search returns non-UI email change(s) for each Contact in the order of most recent change, to oldest change.
			//So, for each Contact ID returned in the search, we only care about the first, i.e. most recent, email change that was done.  The 
			//emailNEWValue associated with this most-recent change SHOULD be the same as the current email value... but check just to be sure before 
			//possibly reverting the change.  Also, once the most recent email change for a particular Contact in this results list has been processed, 
			//any earlier email changes returned for this given Contact can be ignored.  The variable IDprocessed is used for this purpose.
			
			//10-29-20 Bug fix:  First, convert OLD and NEW email values to lower case to rule out same value just in different camel case (which NS considers a change)
			if(emailNEWValue.toLowerCase() != emailOLDValue.toLowerCase()) {			
				//See if the current ID in the results list is different from the last one we processed
				if(!(IDprocessed == conInternalID)) {
					IDprocessed = conInternalID;   //Store the current Contact ID
			
					//See if the newValue from this most recent non-UI change is the same as the Contacts email now, i.e. nothing has happened to email since then
						//10-29-20 Bug fix:  Need to convert text values to lower case to avoid showing a mismatch simply due to text camel case
						if(emailNEWValue.toLowerCase() == conEmailCurrValue.toLowerCase()) {
						//nlapiLogExecution('audit', '++ emailNEW == emailCurrent ++');
						//Check and see what the LAST EBSCONet Approver Status value was for this Contact before this email change occurred
						
				/*		nlapiLogExecution('audit', '-- EMAIL CHG NOT ALLOWED -- check when SAO status changed the following');
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID and NAME:', conInternalID + ' ' + conNameCurrValue);				
						nlapiLogExecution('debug', 'result('+(z+1)+').System Notes Date:', sysNotes_date);	
						nlapiLogExecution('debug', 'result('+(z+1)+').OLD EMAIL:', emailOLDValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').NEW EMAIL:', emailNEWValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact Email CurrValue:', conEmailCurrValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact SAO Status:', conSAOAppStatusCurrValue);
				*/
						
						//Check and see what was this particular Contact's last change to EBSCONET Order Approver Status, (PRIOR to this non-UI email change)
						var emailChgDate = nlapiStringToDate(sysNotes_date, 'datetime');
						var sn_filters = new Array();
						sn_filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', conInternalID);
						sn_filters[1] = new nlobjSearchFilter('date', 'systemnotes', 'before', emailChgDate);  
		
						//Execute the search.  This search should return only one row, i.e., the most-recent change to this Contact's 
						//EBSCONET Order Approver Status field PRIOR to the non-UI email change.
						var contactSAOStatusSearch_results = nlapiSearchRecord('contact', CONTACT_SYS_NOTES_SEARCH_SAO_STATUS, sn_filters, null);
										
							nlapiLogExecution('audit', 'Ran "' + CONTACT_SYS_NOTES_SEARCH_SAO_STATUS +'" to check SAO status of email chged ContactID:', conInternalID);	
											
						if(contactSAOStatusSearch_results) {
							nlapiLogExecution('audit', 'Total SAO status chg records found by saved search SysNotes: SAO Contacts Status Change',contactSAOStatusSearch_results.length);
							
							//Search uses GROUP and MAXIMUM summary types to return only one row (the most recent one) for each Contact
						    var sn_result=contactSAOStatusSearch_results[0];
						    var sn_resultColumns=result.getAllColumns();
					
						    // get the data from the search result row
							var sn_conInternalID = sn_result.getValue(resultColumns[0]);						
							var sn_SAOapprover_NEWValue = sn_result.getValue(resultColumns[1]);					
							var sn_sysNotes_date = sn_result.getValue(resultColumns[2]);
							
							nlapiLogExecution('debug', 'sn_result((0)).Contact ID:', sn_conInternalID);						
							nlapiLogExecution('debug', 'sn_result((0)).NEW SAO Status:', sn_SAOapprover_NEWValue);
							nlapiLogExecution('debug', 'sn_result((0)).System Notes Date:', sn_sysNotes_date);	
						
							//If the Contacts status prior to the email change WOULD NOT have allowed the email change to take place,
							//then reinstate the old email value, reverting the change, so that OPS and EBSCONET don't get messed up.
							//Also, send an email to CRM Escalation so someone can investigate why a change was attempted.
							if(!(LC_ContactENOrdApprovSts.IsEmailCustChgAllowed(sn_SAOapprover_NEWValue))) {	
									nlapiLogExecution('audit', '--- EMAIL CHG NOT ALLOWED FOR ID DUE TO SAO STATUS ---', conInternalID);
									nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID and NAME:', conInternalID + ' ' + conNameCurrValue);				
									nlapiLogExecution('debug', 'result('+(z+1)+').System Notes Date:', sysNotes_date);	
									nlapiLogExecution('debug', 'result('+(z+1)+').OLD EMAIL:', emailOLDValue);
									nlapiLogExecution('debug', 'result('+(z+1)+').NEW EMAIL:', emailNEWValue);
									nlapiLogExecution('debug', 'result('+(z+1)+').Contact Email CurrValue:', conEmailCurrValue);
									nlapiLogExecution('debug', 'result('+(z+1)+').Contact SAO Status:', conSAOAppStatusCurrValue);
								//Put back old email value
								//nlapiSubmitField('contact', conInternalID, 'email',emailOLDValue);
								//Set isUpdated so OPS can be notified
								//nlapiSubmitField('contact', conInternalID, 'isUpdated', 'T');
								//Update the MKTO lastmodified timestamp so that Vertify will pick up the email change reversal and send it back to MKTO
								//nlapiSubmitField('contact', conInternalID, 'custentity_muv_syncfield_lastmodified', this_runtime_string)
								
								//Send notification email to 'CRM Escalation'
									//nlapiSendEmail('2870', 'CRMescalation@EBSCO.com', 'Contact Removed from Customer - unable to fix (DUPE name)', 'Contact '+contName+ ' with an internal ID of ' +conInternalID+ ' was incorrectly removed from custID "'+custId+'", and the scheduled cleanup script failed to fix it due to the existence of another contact with the same name.<BR><BR>Please change the contact name for Contact ID '+conInternalID+', reattach it to custID '+custId+', and inactivate it.<BR><BR>https://392875.app.netsuite.com/app/common/entity/contact.nl?id='+conInternalID+'&whence=', null, null, null, null, null,null, null);
									nlapiSendEmail('1469959', 'cmccormack@EBSCO.com', 'Non-UI Contact email change NOT allowed due to SAO status', 'A non-UI change of Email was attempted for Contact '+conNameCurrValue+ ' with an internal ID of ' +conInternalID+ ' and a  EBSCONET Approver Status at that time of "'+sn_SAOapprover_NEWValue+'". The change was revoked and the Contacts previous email value was reinstated.<BR><BR>Please investigate why the email change was attempted.<BR><BR>https://392875.app.netsuite.com/app/common/entity/contact.nl?id='+conInternalID+'&whence=', null, null, null, null, null,null, null);
								//Update reverted counter
								totalEmailChgsReverted++;
							}
							else {
								//Contact status prior to the email change WOULD have allowed the email change to take place, so leave email change alone
								nlapiLogExecution('audit', '+++ EMAIL CHG IS ALLOWED FOR ID +++', sn_conInternalID);
							}						
						} 
						//EBSCONET Order Approver Status field has never been changed for this Contact, so field is still blank and non-UI email change is allowed
						else nlapiLogExecution('audit', 'EBSCONET Order Approver Status field has not been previously changed.', 'Zero prior SAO status chg records found.');	
					}
					else {
						//Multiple email changes so bail out and send an email -- don't try to fix.  Just send an email to 'CRM Escalation'
							nlapiLogExecution('debug', '!!! EmailNew NOT equal to current for the following so multiple changes including via SOAP!!!');
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID and NAME:', conInternalID + ' ' + conNameCurrValue);				
						nlapiLogExecution('debug', 'result('+(z+1)+').System Notes Date:', sysNotes_date);	
						nlapiLogExecution('debug', 'result('+(z+1)+').OLD EMAIL:', emailOLDValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').NEW EMAIL:', emailNEWValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact Email CurrValue:', conEmailCurrValue);
						nlapiLogExecution('debug', 'result('+(z+1)+').Contact SAO Status:', conSAOAppStatusCurrValue);
										
							nlapiSendEmail('1469959', 'cmccormack@EBSCO.com', 'Non-UI Contact email changed multiple times', 'Multiple non-UI changes of Email were attempted for Contact '+conNameCurrValue+ ' with an internal ID of ' +conInternalID+ '.<BR><BR>Please investigate why the email change was attempted.<BR><BR>https://392875.app.netsuite.com/app/common/entity/contact.nl?id='+conInternalID+'&whence=', null, null, null, null, null,null, null);
					}
			   	}  //end conID in results list is different from the last ID processed
			//else we are still dealing with the same Contact ID, so ignore any earlier changes
			}  //end lowercase OLD and NEW values are the same, so no real change occurred
			//else the email value didn't REALLY change, just its capitalization 
		
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			//nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', contactInternalID);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', contactInternalID);
			}
		 }  //end for each result loop 
	}  //end results found
	else nlapiLogExecution('audit', 'Total records found by saved search SysNotes: SAO Contacts with updated email:','0');		
	
	nlapiLogExecution('audit', 'Total Records with email change reverted: ', totalEmailChgsReverted);	
		
	nlapiLogExecution('audit', 'Setting Script Last Run Timestamp to: ', this_runtime_string);	
	//Update the Custom record which stores the Search Start Date -- Used for next time this script runs	
	script_runtime_record.setFieldValue('custrecord_generic_script_last_run', this_runtime_string);
	nlapiSubmitRecord(script_runtime_record);		
		

	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');	
}	
	
