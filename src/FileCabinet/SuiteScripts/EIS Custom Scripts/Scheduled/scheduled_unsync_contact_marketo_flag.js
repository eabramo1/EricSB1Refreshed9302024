// Script:		scheduled_unsync_contact_marketo_flag.js
// Created by:		eabramo
// Associated with:  	Contact Record
// 
// Summary:		There are two fields on Contact that control synchronization of Contact to Marketo system
//				1) Move To Marketo
//				2) Sync To Marketo
//			Sync To Marketo flag is the real indicator to tell the MUV tool to synchronize the record
//			Move to Marketo is the User Controlled field.  
//				Users can set the "Move To Marketo" field to 'No' (2) if they want to unsync a Contact
//			In this use-case, Sync To Marketo needs to remain true for a final synchronization.
//			This script is scheduled to run twice a day and unset "Sync To Marketo" to false 
//			It assumes that the final synchronization to Marketo has occurred		
//
// Function:   	find_marketo_unsync(): Searches for all Contact records with Move To MArketo of No and Sync To Marketo of True 
//					For each search result set the Sync To Marketo to False (also if the company field is null set it to the orphan customer)
//
// Library Scripts used:	library_utility.js
//			
//
//Initial post To Production:   2017-03-07
// Revisions:		2019-09		eAbramo			US487261 Fixing this scheduled script to not fail under the following conditions
//												a) Customer has been removed from contact
//												b) Search results > 1000 records
//												c) NetSuite Governance limits are exceeded
//												d) A Contact with same name already exists under the customer
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


function find_marketo_unsync()
{
	nlapiLogExecution('DEBUG', 'function find_marketo_unsync begins');
	
	// Required for Library script function call so that search can return more than 1000 rows
	var that = this;
	this.recordSearcher = new L_recordSearcher();	
	
	// search for Contact records to update
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custentity_move_to_marketo', null, 'anyof', '2');
	filters[1] = new nlobjSearchFilter('custentity_sync_to_marketo', null, 'is', 'T');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid', null, null);
	columns[1] = new nlobjSearchColumn('company', null, null);
	columns[2] = new nlobjSearchColumn('entityid', null, null);
	var searchResults = that.recordSearcher.search('contact', null ,filters, columns);	
	if(searchResults)
	{
		nlapiLogExecution('DEBUG', 'Total Contacts found by search:', searchResults.length);
		for(var z=0; z < searchResults.length; z++)
		{
			// contact_dupe_exists	= false;
		    var this_contact = searchResults[z].getValue('internalid');
		    var this_contact_company = searchResults[z].getValue('company'); 
		    var this_contact_name = searchResults[z].getValue('entityid');
		    // nlapiLogExecution('DEBUG', 'Data before manipulation','this_contact is '+this_contact+', this_contact_company is '+this_contact_company+', this_contact_name is '+this_contact_name);
	    
			// Call Library function which determines if there are Dupe Contact Names under this Customer
				// The following parameters need to be passed in
					// this_contact - Contact Internal ID
					// this_contact_name - Entity ID of the Contact (the value in the 'Name' field in the UI)
					// this_contact_company - the company value of the Contact
				// Function Returns True if there exist at least one Dupe Contact Name under this Customer, False if none found
		    if (L_DupeNameUnderSameCustExists(this_contact, this_contact_name, this_contact_company) == false)
			{	// No dupe Name exists
				// Scenario A:  Contact is missing a Company
			    if (!this_contact_company)
			    {
				    nlapiLogExecution('DEBUG', 'Scenario A:  Contact is missing a Company - add the orphan contact customer', 'this_contact is '+this_contact);		    	
				    nlapiSubmitField('contact', this_contact, 'company', LC_orphaned_cust);
			    	nlapiSubmitField('contact', this_contact, 'custentity_sync_to_marketo', 'F');
			    }		    	
				// Scenario B (default):  Contact has valid Company and No Dupe is found within the customer
				else
				{
					// nlapiLogExecution('DEBUG', 'Scenario B - default', 'this_contact is '+this_contact);
				    nlapiSubmitField('contact', this_contact, 'custentity_sync_to_marketo', 'F');
				} 
			}
		    else
		    {		    	
			    nlapiLogExecution('AUDIT', 'A Contact dupe name exists', 'NOT Updating Contact: '+this_contact);
			    // Don't do anything		    	
		    }
		    
			// This section handles checking API governance and resumes at the same spot if we are running out of points... 
			// nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 50) 
			{
				nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('DEBUG', '*** Yielding ***', 'Contact ID: '+ this_contact);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('DEBUG', '*** Resuming from Yield ***', this_contact);
			}		
		}	
	}
	nlapiLogExecution('AUDIT', 'find_marketo_unsync ends with the following records found: '+ searchResults.length, 'Remaining usage: '+ nlapiGetContext().getRemainingUsage());
}
