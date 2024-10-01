// Script:		scheduled_find_marketo_dupes_andflag.js
// Created by:		eabramo
// 
// Summary:	Main function: find_possible_marketo_dupe calls two other functions 
//				1) run_contact_dupe_search()
//				2) run_customer_dupe_search();
//				each of those runs through a pre-defined UI Search (by ID)
//				and for each result calls another function to determine if there are possible Dupes
//				if possible dupes found then flag the checkbox field indicating Dupe
//
// Post To Production	eAbramo		2017-04-06
// Revisions:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function find_possible_marketo_dupe()
{
	run_contact_dupe_search();
	run_customer_dupe_search();
}

// FIND CONTACT DUPES -- BEGIN
function run_contact_dupe_search()
{	// search created: SB1-refresh-2024-09-30 search ID is 39616 Prod ID is 42780
	// This search is called "System - Contacts with Marketo Activity (used in scheduled script)"
	// var recent_marketo_contacts = nlapiLoadSearch('contact', 39616);
	var recent_marketo_contacts = nlapiLoadSearch('contact', 42780);	
	var resultSet = recent_marketo_contacts.runSearch();
	// Iterate through search results using method .forEachResult - call the find_contact_duplicates function
	resultSet.forEachResult(find_contact_duplicates);
}

function find_contact_duplicates(eachResult)
{
	var this_contact = eachResult.getValue('internalid');
	// call the nlapiSearchDuplicate API function
	var duplicate_results = nlapiSearchDuplicate('contact', null, this_contact);
	if (duplicate_results)
	{	// flag the Contact as needing review
		nlapiSubmitField('contact', this_contact, 'custentity_needs_dupe_review', 'T');
		nlapiLogExecution('DEBUG', 'Found Dupe', 'Contact is: '+this_contact);
	}
	return true;
}
//FIND CONTACT DUPES -- END


//FIND CUSTOMER/LEAD/PROSPECT DUPES -- BEGIN
function run_customer_dupe_search()
{	// search created: in SB1-refresh-2024-09-30 Search ID is 39620.  Prod ID is 42782
	// This search is called "POC: Lead/Prospects/Customers created by Marketo - not OE Approved"
	// var marketo_custs_notApproved = nlapiLoadSearch('customer', 39620);
	var marketo_custs_notApproved = nlapiLoadSearch('customer', 42782);
	var resultSet = marketo_custs_notApproved.runSearch();
	// Iterate through search results using method .forEachResult - call the search_duplicates function
	resultSet.forEachResult(find_customer_duplicates);
}

function find_customer_duplicates(eachResult)
{
	var this_customer = eachResult.getValue('internalid');
	// call the nlapiSearchDuplicate API function
	var duplicate_results = nlapiSearchDuplicate('customer', null, this_customer);
	if (duplicate_results)
	{	// flag the Customer as needing review
		nlapiSubmitField('customer', this_customer, 'custentity_needs_dupe_review', 'T');
		nlapiLogExecution('DEBUG', 'Found Dupe', 'Customer is: '+this_customer);
	}
	return true;
}
//FIND CUSTOMER/LEAD/PROSPECT DUPES -- END

// AFTER THIS RUNS...
// Utilize the following searches to expose the Duplicates that need to be reviewed:
//	1) POC: Lead/Prospect/Customer Marketo - Needs duplicate Review
//			https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?searchid=39621&whence=
//	2) POC: Marketo Contact Needs Duplicate Review
//			https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?searchid=39618&saverun=T&whence=


