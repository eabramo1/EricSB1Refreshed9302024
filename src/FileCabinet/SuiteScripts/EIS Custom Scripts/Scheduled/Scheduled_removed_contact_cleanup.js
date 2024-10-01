// Script:     Scheduled_removed_contact_cleanup.js
// 			   
// Created by: Christine Neale
//
//Function: This script identifies Contact records which do not have a Company and works to reinstate the Company on the Contact with 
//			appropriate other Contact updates (inactivate &/or comments).
//
//			The situation this script is endeavouring to clean up is where the "Remove" button has been used to disassociate a Contact 
//			from a Customer.  This action circumvents scripted restrictions on inactivating a Contact and causes issues for systems
//          that integrate with NetCRM (OPS, Marketo, EBSCO Connect)
//
// Library Scripts Used:	library_utility.js	
//							library_constants.js
//
// Revisions:  
//		
//		CNeale			03/14/2019 	US39690 Created - added code to handle max comment length
//		JOliver			12/26/2019	US563424 Update script to handle contacts w dupe names (send email to CRM escalation)
//		eAbramo			06/01/2020	US631261 - SAO: Modify Scheduled jobs to handle SAO (Semi-Automated Ordering)
//		eAbramo			02/08/2021	US760823 Modifications to the Re-Attach Contact Scheduled Script
//		eAbramo			06/10/2022	US963983 & US966153 Replaced LC_PortalUserStatus.validPortalUser with L_hasECPortalAccess
//		JOliver			08/31/2023	TA834368 updating L_getECAccessFieldValues to use contact record
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CONT_SYS_NOTES_SEARCH = 'customsearch_orphan_contacts_sysnotes_2';
var ORPHANED_CUST = 907124;
var concat_comment_str = null;
// US963983 & US966153 new global variable
var g_ECAccessValues = {
		EC_CaseMgmtAS: null,
		EC_DiscGroupsAS: null,
		EC_AcadAS: null,
		EC_EnetOAS: null,
		EC_FolioCustAS: null,
		EC_TransAS: null
		};

function removeContactCleanup()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	// Set comments variables for later use
	// For 'Inactivation comments' field
		var flipDupeComment = 'System Inactivated Contact: A NetCRM user removed this Contact from the Customer, the Customer has been reinstated & Flipster Renewal category removed as another Contact has already had this category added.';
		var	inactComment = 'System Inactivated Contact: A NetCRM user removed this contact from the Customer, the Customer was added back and the Contact inactivated.';
	// For regular Comments field
		var flipNoDupeComment = 'System Modified Contact: A NetCRM user removed this contact from the Customer, the Customer was added back because it is a Flipster Renewal Contact. Users should flag another Flipster Renewal Contact and then inactivate this contact.';
		var flipNoDupeShort = 'System Reinstated as Flipster.';
		var enetOrdApproverComment = 'System Modified Contact: A NetCRM user removed this contact from the Customer, the Customer was added back because it is either an EBSCONET Order Approver or its EBSCONET Order Approver status is being added or removed'
		var enetOrdApproverShort = 'System Reinstated due to ENET Order Approver.';
		var eConnectComment = 'System Modified Contact: A NetCRM user removed this contact from the Customer, the Customer was added back because it is an active EBSCO Connect user or is being set up to be an active EBSCO Connect user';  // US760823 
		var eConnectShort = 'System Reinstated due to EBSCO Connect User';

		
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
		
	// Perform Search to identify Contacts with no Customer & latest System Note
	var contSysNotesSearch_results = that.recordSearcher.search('contact', CONT_SYS_NOTES_SEARCH, null, null);	
	
	nlapiLogExecution('audit', 'Ran Saved Search', CONT_SYS_NOTES_SEARCH);	
	
	if(contSysNotesSearch_results) 
	{
		nlapiLogExecution('audit', 'Total records found by saved search:',contSysNotesSearch_results.length);
		
		for(var z=0; z < contSysNotesSearch_results.length; z++)
		{
			var flipRenewal = 'F';
			var flipRenewalDupe = 'F';						
			// Variable indicating if we should keep the Contact Active - assume 'No'
			var keep_active = false;
			
		    var result=contSysNotesSearch_results[z];
		    var resultColumns=result.getAllColumns();
	
		 // get the data from this search result row
			var contInternalID = result.getValue(resultColumns[0]);
			var custName = result.getValue(resultColumns[1]);
			var contName = result.getValue(resultColumns[2]);
			var sysnDate = result.getValue(resultColumns[3]);
			var custId = result.getValue(resultColumns[4]);
							
			nlapiLogExecution('debug', 'result('+(z+1)+').Contact ID and NAME:', contInternalID + ' ' + contName);							
			nlapiLogExecution('debug', 'result('+(z+1)+').Customer Name and ID,:', custName + ' ' + custId);
			nlapiLogExecution('debug', 'result('+(z+1)+').System Notes Date,:', sysnDate);
			
		// Set Customer Internal ID = Orphaned Customer - this is our default where we can't locate the true Customer for whatever reason...	
			var custIntId = ORPHANED_CUST;
			
		// Now get the Customer Internal ID from the custId			
			var cusfilters = new Array();
			cusfilters[0] = new nlobjSearchFilter('entityid', null,'is', custId);
			cusfilters[1] = new nlobjSearchFilter('isinactive', null,'is', 'F');	// US760823 Added Inactive is False 02-11-2021

			var cuscolumns = new Array();
			cuscolumns[0] = new nlobjSearchColumn('internalid', null, null);
			cuscolumns[1] = new nlobjSearchColumn('entityid', null, null);

			//execute Customer search
			cus_searchResults = nlapiSearchRecord('customer', null, cusfilters, cuscolumns);
			if (cus_searchResults)
			{	
				var noCus = cus_searchResults.length;		
				if (cus_searchResults.length == 1)
				{	
					custIntId = cus_searchResults[0].getValue('internalid');
					var custEntity = cus_searchResults[0].getValue('entityid');
				}
				nlapiLogExecution('debug', 'Customer result = ', noCus + ' ' + custIntId + ' ' + custEntity);
			}
			
			// Now load the Contact Record
			var cont = nlapiLoadRecord('contact', contInternalID);
			nlapiLogExecution('debug', 'Load Record', contInternalID);
			
		
			/* US760823 -02-09-2021 EA REFACTORED SCRIPT:  	
				1) if SAO Active - Add Customer back, don't inactivate, add comment to comments field
				2) if EBSCO Connect Active User - Add Customer back, don't inactivate, add comment to comments field
				3) if Flipster Renewal and another Dupe Flipster Renewal Contact doesn't exist - Add Customer back, don't inactivate, add comment to comments field	
				4) if Flipster Renewal and a Dupe Flipster Renewal Contact does exist - Add Customer back, inactivate and add Inactivation comment
				5) all else -  Add Customer back, inactivate and add Inactivation comment
			*/		
			
			// US631261 - SAO: Modify Scheduled jobs to handle SAO (Semi-Automated Ordering)
			// var enet_active = 'F';  // US631261
			var enet_OrdApprovStatus = cont.getFieldValue('custentity_enet_ordapprove_status'); // US631261		
			if (LC_ContactENOrdApprovSts.IsInactivateAllowed(enet_OrdApprovStatus) == false)
			{
				nlapiLogExecution('debug', 'enet order approver is true', 'adding comments now');
				// Call Function to Add Comments to the record
				addComments(cont, enetOrdApproverComment, enetOrdApproverShort);
				// set variable indicating that we are NOT going to inactivate this record
				keep_active = true;
				// For SAO, if status is listed as Approved update the customer field (Active EBSCONET Order Approvers if it isn't set) 
				if (enet_OrdApprovStatus == LC_ContactENOrdApprovSts.Approved)
				{
					var active_enet_approvers = nlapiLookupField('customer', custIntId, 'custentity_enet_order_eligible');
					nlapiLogExecution('DEBUG', 'active_enet_approvers value is ', active_enet_approvers);
					if (active_enet_approvers == 'F')
					{
						nlapiSubmitField('customer', custIntId, 'custentity_enet_order_eligible', 'T');	
						nlapiSubmitField('customer', custIntId, 'custentity_isupdated', 'T');
					}				
				}
			}	

			// US760823 -- Handle when a Contact is an active EBSCO Connect Portal User
			// US963983 & US966153 -- Commented out below lines of code determining EBSCO Connect Portal USer Status -- adding new code below
			// var ecPortalUserStatus = cont.getFieldValue('custentity_portal_user_status');
			// if (LC_PortalUserStatus.validPortalUser(ecPortalUserStatus) == true)
			// call function to get EC Access Values
			L_getECAccessFieldValues(g_ECAccessValues, cont);
			//nlapiLogExecution('debug', 'The value of g_ECAccessValues.EC_CaseMgmtAS is ' + g_ECAccessValues.EC_CaseMgmtAS);
			if(L_hasECPortalAccess(g_ECAccessValues) == true)			
			{
				nlapiLogExecution('debug', 'User is an active Portal User', 'adding comments now');
				// Call Function to Add Comments to the record 
				addComments(cont, eConnectComment, eConnectShort);
				// set variable indicating that we are NOT going to inactivate this record
				keep_active = true;
			}

						
			// Now check if the Contact is Flipster Renewal and if Customer already has had a new one added...
			var contact_category = cont.getFieldValues('custentity_contact_category');
			
			if (contact_category)
			{	// Check for Flipster Renewal
				var category_count = contact_category.length;
				for ( var c=0; category_count != null && c < category_count && flipRenewal != 'T'; c++ )
				{
					if (contact_category[c] == LC_ContactOpCat.FlipRenew)
					{	// Flipster Renewal - now check if Customer already has another one
						flipRenewal = 'T';
						nlapiLogExecution('debug', 'Contact is Flipster Renewal', 'Contact ID is '+contInternalID);
						// build a search to find other Flipster Renewal contacts under this customer
						var cFilter = new Array();
						cFilter[0] = new nlobjSearchFilter('company', null, 'anyof', custIntId);
						cFilter[1] = new nlobjSearchFilter('custentity_contact_category', null, 'anyof', LC_ContactOpCat.FlipRenew);
						cFilter[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
						cFilter[3] = new nlobjSearchFilter('internalid', null, 'noneof', contInternalID);
						var cColumn = new Array();
						cColumn[0] = new nlobjSearchColumn('internalid', null, null);
						// perform the search
						var cSearchResult = nlapiSearchRecord('Contact', null, cFilter, cColumn);
						if(cSearchResult != null)
						{	
							flipRenewalDupe = 'T';	
							nlapiLogExecution('debug', 'Flipster Renewal Dupe Found');
							// Now need to remove Flipster Renewal Category from Contact
							var catOut = new Array();
							var e = 0;
							if (category_count > 1)
							{
								nlapiLogExecution('debug', 'Resetting the Operational Category without flipster');
								for ( var d=0; d < category_count; d++ )
								{
									if (contact_category[d] != LC_ContactOpCat.FlipRenew)
									{
										catOut[e] = contact_category[d];
										e = e + 1;
									}	
								}	
							}
							cont.setFieldValues('custentity_contact_category', catOut);
						}
					}
				}
			}
			
			nlapiLogExecution('debug', 'keep_active is ' +keep_active, 'flipRenewal is '+flipRenewal+ '. flipRenewalDupe is '+flipRenewalDupe);
			
			// Contact has Flipster Renewal Set & Customer doesn't already have another Flipster Renewal
			if(flipRenewal == 'T' && flipRenewalDupe == 'F')
			{
				nlapiLogExecution('debug', 'Flipster Renewal and No FlipsterRenewal Dupe', 'adding comments now');
				// Call Function to Add Comments to the record 
				addComments(cont, flipNoDupeComment, flipNoDupeShort);
				// set variable indicating that we are NOT going to inactivate this record
				keep_active = true;	
			}
			
			// Handle Inactivation Section
			// Contact has Flipster Renewal Set & Customer already has another Flipster Renewal and keep_active still false
			if(flipRenewal == 'T' && flipRenewalDupe == 'T' && keep_active == false){
				cont.setFieldValue('custentity_inactivation_comments', flipDupeComment);
				cont.setFieldValue('isinactive', 'T');				
			}			
			// If 'keep_active' still false -- Inactivate the contact)
			else if (keep_active == false)
			{
				cont.setFieldValue('custentity_inactivation_comments', inactComment);
				cont.setFieldValue('isinactive', 'T');
			}	
			
			// In all scenarios Update the Customer on the Contact & update "isUpdated" flag
			// also unset the "IsPrimary" flag if set 
			cont.setFieldValue('custentity_isupdated', 'T');
			cont.setFieldValue('company', custIntId);
			// Unset Primary flag if set - as Primary is lost during "Remove"
			if (cont.getFieldValue('custentity_isprimary') == 'T')
			{
				cont.setFieldValue('custentity_isprimary', 'F');
			}	
			// Use Web Services Form to avoid issues with Mandatory fields
			cont.setFieldValue('customform', LC_Form.WebContact);
			nlapiLogExecution('debug', 'Set Company', custIntId);
			
		try
		{
			nlapiSubmitRecord(cont, true);
		}
		catch ( e )
		{
			if ( e instanceof nlobjError ) 
			{
				//US563424 Update script to handle contacts w dupe names (send email to CRM escalation)
				if (e.getCode() == 'CONTACT_ALREADY_EXISTS') {

					 nlapiLogExecution('DEBUG', 'DUPE CONTACT EXISTS', e.getCode() + ': ' + e.getDetails());
					 nlapiSendEmail('2870', 'CRMescalation@EBSCO.com', 'Contact Removed from Customer - unable to fix (DUPE name)', 'Contact '+contName+ ' with an internal ID of ' +contInternalID+ ' was incorrectly removed from custID "'+custId+'", and the scheduled cleanup script failed to fix it due to the existence of another contact with the same name.<BR><BR>Please change the contact name for Contact ID '+contInternalID+', reattach it to custID '+custId+', and inactivate it.<BR><BR>https://392875.app.netsuite.com/app/common/entity/contact.nl?id='+contInternalID+'&whence=', null, null, null, null, null,null, null);
				} 
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



// US760823  Created function to Add Comments to the Contact
//	input:  (record, NewCommentsIn, ShortCommentsIn)
// 				record = the record object
//				NewCommentsIn = The comments we want to add to the record
//				ShortCommentsIn = The short comments we want to add to the record - if theres limited space in the comments field
//	output: [NONE] 
function addComments(cont, newCommentsIn, ShortCommentsIn){
	var comm = cont.getFieldValue('comments');
	if (comm){
		// Concatenate the Comments into variable called "concat_comment_str"
		var existg_comm_length = comm.length;
		var add_comment_length = newCommentsIn.length;
		// nlapiLogExecution('debug', 'existg_comm_length is '+ existg_comm_length, 'add_comment_length is '+add_comment_length);
		// Total 999 chars in the Comments field but reserve 4 characters for spacing and vertical bars
		var usable_length = 995 - existg_comm_length;
		// nlapiLogExecution('debug', 'usable_length is '+ usable_length);
		if (add_comment_length < usable_length)
		{
			concat_comment_str = comm + ' || ' + newCommentsIn;
		}
		else
		{
			concat_comment_str =  ShortCommentsIn + ' | ' + comm;		
			if (concat_comment_str.length > 999)
			{
				concat_comment_str = concat_comment_str.substring(0,999);
			}
		}
		// set Comments to the Concatenated string
		cont.setFieldValue('comments', concat_comment_str);			
	}
	else
	{	
		// set Comments to the new Comments
		cont.setFieldValue('comments', newCommentsIn);
	}
}

