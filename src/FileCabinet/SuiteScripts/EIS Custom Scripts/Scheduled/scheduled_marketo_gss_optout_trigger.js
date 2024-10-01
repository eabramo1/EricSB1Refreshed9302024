// Script:	scheduled_marketo_gss_optout_trigger.js
// Created by:	eabramo
// 
// Summary:	Main function: scheduled_get_marketo_optouts
//			1) Runs saved search to find Contacts who were updated by Marketo Integration in past 7 days
//				and have had an update to one of 5 fields, and have one of three fields set to true
//				and have Global Sub Status of Soft Opt In - yet USer Set GSS to Opt-In as false
//			2) For each result found update the Contact:set Global Subscription Status to Soft Opt-Out
//						
//		Uses Library Scripts: library_utility.js and library_constants.js
//
//
// Created:		08/02/2019
// Revisions:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function scheduled_get_marketo_optouts()
{
	nlapiLogExecution('DEBUG', 'function scheduled_get_marketo_optouts begins');
	
	// Required for Library script function call so that search can return more than 1000 rows
	var that = this;
	this.recordSearcher = new L_recordSearcher();	
	
	// search created in UI. this search is called "System search: Marketo Contacts OptOut field modified past 7 days"
		/* Criteria for the search:
	 	 	Marketo Lead Id (Custom)	is not empty	 	 		And
	 	 	System Notes : Set by		is Web Service 3 SB	 	 	And
	 	 	System Notes : Date		is on or after 7 days ago	 	And
	 	 	(	System Notes : Field	is Marketo Email Invalid	 	Or
				System Notes : Field	is Marketo Unsubscribed	 	 	Or
				System Notes : Field	is Marketo Marketing Suspended	 	Or
				System Notes : Field	is Marketo Marketing Suspended Reason	Or
				System Notes : Field	is Marketo Email Invalid Cause	 	)	And
			(	Marketo Email Invalid (Custom)	is true	 	 		Or
				Marketo Marketing Suspended (Custom)	is true	 		Or
				Marketo Unsubscribed (Custom)	is true	 	  		)	And
	 	 	Global Subscription Status	is Soft Opt-In	 	 		And
 	 		User Set GSS to Opt-In (Custom)	is false	 	 	 
		*/
	
	// var Marketo_Contacts_OptOuts = nlapiLoadSearch('contact', 52976);  // SB1-refresh-2024-09-30
	// var Marketo_Contacts_OptOuts = that.recordSearcher.search('contact', 'customsearch53139', null, null); // sb3
	var Marketo_Contacts_OptOuts = that.recordSearcher.search('contact', 'customsearch53361', null, null); //prod

	if(Marketo_Contacts_OptOuts)
	{
		nlapiLogExecution('DEBUG', 'Total records found by saved search:', Marketo_Contacts_OptOuts.length);	
		for(var z=0; z < Marketo_Contacts_OptOuts.length; z++)
		{	// Get single Internal ID
		    var this_contact = Marketo_Contacts_OptOuts[z].getValue('internalid');
		    // submit the Global Subscription Status field
			nlapiSubmitField('contact', this_contact, 'globalsubscriptionstatus', LC_glblSubsStatus.SoftOptOut);
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			// nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('DEBUG', '*** Yielding ***', 'Contact ID: '+ this_contact);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				// nlapiLogExecution('DEBUG', '*** Resuming from Yield ***', this_contact);
			}		    	
		}
	}
	nlapiLogExecution('DEBUG', 'function scheduled_get_marketo_optouts ends');
}