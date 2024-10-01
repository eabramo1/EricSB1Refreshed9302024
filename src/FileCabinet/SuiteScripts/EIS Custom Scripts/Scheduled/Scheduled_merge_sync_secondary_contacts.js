// Script:  Scheduled_merge_sync_secondary_contacts.js
// 			   
// Created by: Eric Abramo
//
// Function: findSecondaryMerges
// Purpose of the script:  Identify Customers that are merged into other Customers.  For all the Contacts underneath
//		the customer whereby the customer is not the contact's main Customer (the customer is considered a 'secondary' customer)
// 		This contact's "isUpdated" flag needs to be set to true so that OPS get's the information because there is a new Contact/Customer relationship 
//			
// Library Scripts Used:	library_utility.js
//							library_constants.js
//
// Revisions: 
//	eAbramo		11/04/2020	US697502 Implement NetCRM Scheduled Job to find Contact relationship changes for Merge
//									
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function findSecondaryMerges()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
	
	// Set count of Contacts identified for update & where main company removed (needed for Audit)
	var ContUpdCount = 0;
	
 	// Determine date/time last run & date/time now	  
		  timRec = nlapiLoadRecord('customrecord_scheduled_script_runtime', 5); 
		  var start_s = timRec.getDateTimeValue('custrecord_generic_script_last_run'); // Retrieve "Last run" as starting point
		  nlapiLogExecution('debug', 'Last Run = ', start_s);
		  nlapiSubmitRecord(timRec, true);
		  
		  var end = nlapiLookupField('customrecord_scheduled_script_runtime', 5, 'lastmodified'); // Retrieve "Date last modified" as end point
		  nlapiLogExecution('debug', 'end filter = ', end);
		  
		  // Now add seconds to "end" and remove seconds from "start_s"
		  var start = start_s.substring(0, start_s.lastIndexOf(":")) + ' ' + start_s.substring(start_s.length-2); 
		  var end_s = end.substring(0, end.lastIndexOf(":")+3) + ':00 ' + end.substring(end.length-2);
		  
		  nlapiLogExecution('audit', 'Filters: Start Date = ' + start, 'End Date = ' + end);
		  
		  nlapiLogExecution('debug', 'start  = ' + start, 'start_s = ' + start_s);
		  nlapiLogExecution('debug', 'end  = ' + end, 'end_s = ' + end_s);
	
	// Perform Search to identify Customers Merged
	var merged_custs_filters = new Array();
	merged_custs_filters[0] = new nlobjSearchFilter('date', 'systemnotes', 'onorafter', start);
	merged_custs_filters[1] = new nlobjSearchFilter('date', 'systemnotes', 'before', end);

 	// Use Celigo library function to return > 1000 rows
	var merged_custs_searchResults = that.recordSearcher.search('customer', LC_Saved_search.merged_scndry_cust, merged_custs_filters, null);
	nlapiLogExecution('debug', 'Ran merged_custs_searchResults Saved Search');	
	
	if(merged_custs_searchResults) 
	{
		nlapiLogExecution('audit', 'Total records found by merged_custs_searchResults saved search:', merged_custs_searchResults.length);
		// Iterate through each Customer
 		for(var z=0; z < merged_custs_searchResults.length; z++)
		{
 			var merged_cust_result= merged_custs_searchResults[z];
		    // var merged_cust_result_Columns = merged_cust_result.getAllColumns();
		    var mergeCust_Id = merged_cust_result.getId();
			nlapiLogExecution('debug', 'merged_cust_result '+(z+1), 'mergeCust_Id is: '+ mergeCust_Id);			
			//Begin Nested search:  Get every active Contact where Customer matches to mergeCust_Id
			var con_filters = new Array();
				// NOTE next filter MUST join to the company record in order to get contacts whose main customer isn't this one
			con_filters[0] = new nlobjSearchFilter('internalid', 'company', 'anyof', mergeCust_Id);
			con_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			var con_columns = new Array();	
		 	con_columns[0] = new nlobjSearchColumn('company');			
			//execute search
			var all_contacts = nlapiSearchRecord('contact', null, con_filters, con_columns);	
			// nlapiLogExecution('DEBUG', 'con_elim_1_results ran');
			if (all_contacts)
			{	
				nlapiLogExecution('audit', 'Total records found by all_contacts saved search:', all_contacts.length)
				for(var y=0; y < all_contacts.length; y++)
				{
					var contactId = all_contacts[y].getId();
					var cont_cust = all_contacts[y].getValue('company');
				    // nlapiLogExecution('debug', 'all_contacts('+(y+1)+'). contactId is: '+contactId, 'cont_cust is: '+cont_cust);		    	    
				    if (cont_cust != mergeCust_Id)
				    {
				    	nlapiLogExecution('debug', 'cont_cust does not equal mergeCust_Id', 'cont_cust is: '+cont_cust);
						try{
							nlapiSubmitField('contact', contactId, 'custentity_isupdated', 'T');
							ContUpdCount = ContUpdCount + 1;
							nlapiLogExecution('debug', 'Contact isUpdated flag set to true', 'contactId: ' +contactId);				
						}
						catch(err)
						{
							nlapiLogExecution('DEBUG', 'err.name is '+err.name, 'err.message is '+err.message);
							nlapiSendEmail(LC_Employees.MercuryAlerts, LC_Email.CRMEscalation, 'Scheduled_merge_sync_secondary_contacts Error: Unable to set isUpdated flag', 'Contact with an internal ID of '+contactId+' was found to need its isUpdated flag set to true.  There was an error in the scheduled script when trying to set the field to true.<BR><BR>The error is: '+err.message, null, null, null, null, null, null, null);
						}
						
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
				} // end For loop 2
			}		
		} // End of For loop 1	
	}	
	else
	{
		nlapiLogExecution('audit', 'Total records found by saved search:','0');
	}
	
	nlapiLogExecution('debug', 'end  = ' + end, 'end_s = ' + end_s);
	nlapiLogExecution('audit', 'isUpdated flag set to true on a total of '+ContUpdCount+' contacts');
	// Update the Script Runtime custom record - if reset_interval is still true
	timRec2 = nlapiLoadRecord('customrecord_scheduled_script_runtime', 5);
	timRec2.setDateTimeValue('custrecord_generic_script_last_run', end_s);  //Last Run set to end limit date
	nlapiSubmitRecord(timRec2, true);		
	
	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');
}
