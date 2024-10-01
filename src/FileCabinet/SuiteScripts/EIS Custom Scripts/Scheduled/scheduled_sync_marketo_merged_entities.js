// Script:		scheduled_sync_marketo_merged_entities.js
// Created by:		eabramo
// 
// Summary:	Main function: scheduled_sync_marketo_merged_entities runs two UI searches
//			1) search lists all Customers that had other Customers merged into them 
//				where customer Sync to Marketo is true - and pushDate is older then the Merge Date
//			for each result -- set custentity_muv_syncfield_lastmodified (function)
//				For Customers found we set the Push To Marketo Date on the Customer and also queries 
//				the Contacts with SyncTo Marketo of true and sets Push To Marketo Date as well
//			2) second search lists all Contacts that had other Contacts merged into them					
//			for each result -- set_contact_muvsynclastmodified (function)
//				for contacts found set the Push To Marketo Date  			
//						
// Post To Production	2017-04-24	eabramo
// Revisions:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var curr_Time = new Date();
var c_curr_Time = new Date();

function scheduled_sync_marketo_merged_entities()
{
	nlapiLogExecution('DEBUG', 'function scheduled_sync_marketo_merged_entities begins');
	// search created in UI: SB1-refresh-2024-09-30 search ID is 39646 - Prod ID is 42987
	// This search is called "System Notes Merge Search - Marketo Integration [do not alter]"
	// var merged_marketo_customers = nlapiLoadSearch('customer', 39646);
	var merged_marketo_customers = nlapiLoadSearch('customer', 42987);
	var custResultSet = merged_marketo_customers.runSearch();
	// Iterate thru results using method .forEachResult - call 'set_cust_muvsynclastmodified' function
	custResultSet.forEachResult(set_cust_muvsynclastmodified);
	// ALSO need to set Sync on Merged Contacts
	// search created in UI: SB1-refresh-2024-09-30 search ID is 39650 - Prod ID is 42993
	// This search is called "System Notes Merge Search - Marketo Integration [do not alter]"
	// var merged_marketo_contacts = nlapiLoadSearch('contact', 39650);	
	var merged_marketo_contacts = nlapiLoadSearch('contact', 42993);
	var contactResults = merged_marketo_contacts.runSearch();
	contactResults.forEachResult(set_contact_muvsynclastmodified);
}


// function sets the "custentity_muv_syncfield_lastmodified" field for each CUSTOMER result -- trigger for MUV
function set_cust_muvsynclastmodified(eachResult)
{
	curr_Time = new Date();
	curr_Time.setHours(curr_Time.getHours() + 3); // move from Pacific time to Eastern time 
	curr_Time = nlapiDateToString(curr_Time, 'datetimetz');	
	
	var this_customer = eachResult.getValue('internalid');	
	nlapiLogExecution('DEBUG', 'set CUSTOMER push date for '+this_customer, 'curr_Time is '+curr_Time);
	// set the Muv Sync Last Modified field
	nlapiSubmitField('customer', this_customer, 'custentity_push_marketo_date', curr_Time);

	// Gather all Contacts under this customer with Sync To Marketo = True and set the field on those as well
	// Create Search for Marketo Contacts
	var contact_filters = new Array();
	contact_filters[0] = new nlobjSearchFilter('company', null, 'anyof', this_customer);
	contact_filters[1] = new nlobjSearchFilter('custentity_sync_to_marketo', null, 'is', 'T'); 
	var contact_columns = new Array();
	contact_columns[0] = new nlobjSearchColumn('internalid', null, null);
	//execute search
	marketo_contact_results = nlapiSearchRecord('contact', null, contact_filters, contact_columns);
	if (marketo_contact_results)
	{
		for (var x=0; marketo_contact_results != null && x < marketo_contact_results.length; x++ )
		{
			var this_marketo_contact = marketo_contact_results[x].getValue('internalid');
			nlapiLogExecution('DEBUG', 'set CONTACT Push Date for '+this_marketo_contact, 'curr_Time is '+curr_Time);
			nlapiSubmitField('contact', this_marketo_contact, 'custentity_push_marketo_date', curr_Time);
		}
	}
	return true;
}


function set_contact_muvsynclastmodified(eachResult)
{
	c_curr_Time = new Date();
	c_curr_Time.setHours(c_curr_Time.getHours() + 3); // move from Pacific time to Eastern time 
	c_curr_Time = nlapiDateToString(c_curr_Time, 'datetimetz');	
	
	var this_merged_contact = eachResult.getValue('internalid');
	nlapiLogExecution('DEBUG', 'set CONTACT push date for '+this_merged_contact, 'c_curr_Time is '+c_curr_Time);
	// set the Muv Sync Last Modified field
	nlapiSubmitField('contact', this_merged_contact, 'custentity_push_marketo_date', c_curr_Time);
	return true;
}
