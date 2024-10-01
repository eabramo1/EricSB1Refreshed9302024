/* ****************************************************************************************************************************** */
/* ATTENTION!!  THE LIBRARY SCRIPT library_environment_script.js MUST BE USED WITH THIS WINSER SCRIPT TO DETERMINE ENVIRONMENT    */
/* ****************************************************************************************************************************** */

/* Revision Log:-
 * ******************************************************************************************************************************** 
 * Script file name: 		client_opportunity_winser.js
 * 
 * KMcCormack	06-02-2016	US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM
 * 									  - A new library script has been created which can be used by any form's client side script when
 * 										there is a reason for different values or logic based on the current environment.  This 
 * 										will remove the need for recoding of these values/scripts when a sandbox is refreshed and 
 * 										also when future changes are migrated from dev to QA to prod environments.
 * 
 * 										Also, global javascript values created to hold the various popup template urls that apply
 * 										to the various environments.
 * 
 *  CNeale		12-19-2016	US167245	Adjustments to info. on LSD Pricing Template (now called APA Single Site Quote Price Template).
 *	eAbramo		09-26-2017	US288579	Ability for OPS and Finance (Nor'Easter and Orion) to edit Winser Opportunities 
 *										this is based on Employee Department = 46
 *  eAbramo		10-12-2017	US192398	Marketo/CRM/WinSeR integration
 *  JOliver		04-19-2018 	TA247503	Updated lpu for SB1-refresh-2024-09-30 (added '_SB1' to company) and updated full URL for Preview (relating to Sandbox Re-architecture).
 *  									None of the other Sandboxes required an update (their lpu's remained the same)
 *  eAbramo		10-28-2019	US563017	Add new "pipeline notes" field to the WinSer opportunity
 *  PKelleher	5-5-2021	US792503	Lock down two new fields on WinSer Oppy form (First Year Retail Amount AND First Year Weighted Amount) (update 6/23/21 - removed these from code b/c they were never used)
 *  PKelleher	6-23-2021	US818114	Lock down four new fields on WinSer Oppy form (Total Order Amount USD & Total Order Amount non-USD & Total Order Weighted Amount USD & Total Order Weighted Amount non-USD AND remove two fields added on 5/5/2021
 *  
 * ********************************************************************************************************************************
 */

/*Global Forms Object*/
var Forms = {
		wsr_form: 121,
		winser_form: 129
}

// 2017-09-26 Change to detect Nor'Easter/Orion team members so they can edit WinSeR Opportunities
var this_user = nlapiGetUser();
var user_dept = nlapiLookupField('employee', this_user, 'department');

//alert('DEBUG: in client_opp_winser, CurrentEnv.name = ' + CurrentEnvironment.name);

//06-02-2016  US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM - Code to set environment specific popup url
//US167245 Root relative links applied (but still different between environments!)
function getLSDPopupURL () {  
	var lpu = '';	
	switch(CurrentEnvironment.name) {
	case "PRODUCTION":
		lpu = "/core/media/media.nl?id=37890&c=392875&h=7827153ec4775ca0b23d&_xt=.html";
		break;
	case "SANDBOX1":
		lpu = "/core/media/media.nl?id=37890&c=392875_SB1&h=955dd4bfccf1660cc345&_xt=.html";
		break;
	case "SANDBOX2":
		lpu = "/core/media/media.nl?id=37890&c=392875_SB2&h=3ef47e7c7ae7e3552e0c&_xt=.html";
		break;
	case "SANDBOX3":
		lpu = "/core/media/media.nl?id=37890&c=392875_SB3&h=cf89a31b30bdf0f56144&_xt=.html";
		break;
	case "PREVIEW":
		lpu = "/core/media/media.nl?id=37890&c=392875_RP&h=d19c69d92ceeb46dfe67&_xt=.html";
		break;
	default:
		alert('ERROR: CurrentEnvironment = ' + CurrentEnvironment.name);
	}
	//DEBUG: alert('within function, returning lpu = ' + lpu);
	return lpu;
}

// opptyForm_winser.js
// Created by eabramo 2014-12-23

// OPPTY LOAD FUNCTION
function opptyFormLoad()
{	// Lock fields if user is not the Web Services User or Web Service 2 User
	if (this_user != '452592' && this_user != '808840')
	{
		// 2017-09-26 Only Nor'Easter and Orion Team Members are allowed to edit/save/delete a WinSer Opportunity
		//		Nor'Easter and Orion teams belong to department 46
		//		code has been updated from previously hard-coded user employee IDs (Steven, Dina, David Clark)
		if (user_dept != '46') 
		{
			if (nlapiGetRecordId() == null || nlapiGetRecordId() == '')
			{
				alert('You are not authorized to create a WinSeR Opportunity.  You will not be able to save.  Select Cancel to go back');
			}

			// Disable Opportunity Header Fields		
			nlapiDisableField('customform', true);
			nlapiDisableField('entity', true);
			nlapiDisableField('salesrep', true);
			nlapiDisableField('title', true);
			nlapiDisableField('custbody_oppty_form_type', true);
			nlapiDisableField('custbody1', true);
			nlapiDisableField('custbody_currency_code', true);
			nlapiDisableField('custbody_oppty_open_closed', true);
			nlapiDisableField('custbody_trial_email', true);
			nlapiDisableField('custbody_trial_email_language', true);
			nlapiDisableField('custbody_send_email', true);
			nlapiDisableField('custbody_has_ebook_trial_item', true);
			nlapiDisableField('custbody_trial', true);
			nlapiDisableField('expectedclosedate', true);
			nlapiDisableField('entitystatus', true);
			nlapiDisableField('custbody_isupdated', true);
			nlapiDisableField('custbody_updatedby', true);
			nlapiDisableField('custbody_updateditems', true);

			// Disable Line Item Fields
			nlapiDisableLineItemField('item', 'custcol_trial_enabled', true);		   // Trial
			nlapiDisableLineItemField('item', 'custcol_trial_begin', true);			   // Trial Begin
			nlapiDisableLineItemField('item', 'custcol_trial_end', true);			   // Trial End
			nlapiDisableLineItemField('item', 'custcol_trial_interface_names', true);	   // Trial Interfaces
			nlapiDisableLineItemField('item', 'custcol_trial_access_setting', true);	   // Trial Accessing Site Setting
			nlapiDisableLineItemField('item', 'custcol_trial_group', true);			   // Item Trial Group
			nlapiDisableLineItemField('item', 'custcol_has_ebook_trial', true);		   // Item has eBook Trial
			nlapiDisableLineItemField('item', 'custcol_oppty_amount_before_discount', true);   // Item Price Before Discount
			nlapiDisableLineItemField('item', 'custcol_oppty_item_discount_percent', true);	   // Item Discount Percent
			nlapiDisableLineItemField('item', 'custcol_oppty_item_discount_amount', true);	   // Item Discount Amount
			nlapiDisableLineItemField('item', 'custcol_foreign_amount', true);		   // Amount non-USD
			nlapiDisableLineItemField('item', 'custcol_renew_amount_wasprorated', true);	   // Renewed Amount was pro-rated
			nlapiDisableLineItemField('item', 'custcol_prev_item_transdate', true);		   // Previous Item Trans Date
			nlapiDisableLineItemField('item', 'custcol_prev_expire_date', true);		   // Previous Expire Date  (added 2015-08-17)
			nlapiDisableLineItemField('item', 'custcol_term_months', true);			   // Term Months
			nlapiDisableLineItemField('item', 'custcol_oppty_item_new_renewal', true);	   // New/Renewal
			nlapiDisableLineItemField('item', 'custcol_package_name', true);		   // Package Name
			nlapiDisableLineItemField('item', 'custcol_winser_create_date', true);		   // WinSeR Create Date  (added 2015-08-17)
			nlapiDisableLineItemField('item', 'custcol_oppty_item_status', true);		   // Item Status
			nlapiDisableLineItemField('item', 'custcol_oppty_item_probability', true);	   // Item Probability
			nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_usd', true);	   // Item Weighted Amount USD
			nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_foreign', true);	   // Item Weighted Amount non-USD
			nlapiDisableLineItemField('item', 'custcol_oppty_sim_users', true);		   // List Rate
			nlapiDisableLineItemField('item', 'custcol_lsd_cost', true);			   // Royalty
			nlapiDisableLineItemField('item', 'custcol_lsd_markup', true);			   // MarkUp (%)
			nlapiDisableLineItemField('item', 'custcol_oppty_item_margin', true);		   // Profit Margin
			nlapiDisableLineItemField('item', 'custcol_oppty_item_royalty_comment', true);	   // Royalty Comment
			nlapiDisableLineItemField('item', 'custcol_note_for_renewal', true);		   // Note for Renewal
			nlapiDisableLineItemField('item', 'custcol_pipeline_notes', true);			// Pipeline Note -- US563017 Add Pipeline Notes field to Winser Opportunity
			nlapiDisableLineItemField('item', 'custcol_oppty_item_expected_close', true);	   // Item Expected Close Date
			nlapiDisableLineItemField('item', 'custcol_oppty_item_close_date', true);	   // Item Close Date
			nlapiDisableLineItemField('item', 'custcol_previous_usd', true);		   // Previous USD
			nlapiDisableLineItemField('item', 'custcol_change_usd', true);			   // % Change USD
			nlapiDisableLineItemField('item', 'custcol_previous_foreign', true);		   // Previous Non-USD
			nlapiDisableLineItemField('item', 'custcol_change_foreign', true);		   // % Change Non-USD
			nlapiDisableLineItemField('item', 'custcol_prev_was_in_package', true);		   // Previously was in Package
			nlapiDisableLineItemField('item', 'custcol_prev_list_rate', true);		   // Previous List Rate
			nlapiDisableLineItemField('item', 'custcol_prev_sub_months', true);		   // Previous Subscription Months		
			nlapiDisableLineItemField('item', 'custcol_reasons_lost', true);		   // Reason(s) Lost
			nlapiDisableLineItemField('item', 'custcol_opx_item_id', true);			   // OPX Item ID
			nlapiDisableLineItemField('item', 'custcol_trial_interface_ids', true);		   // Trial Interface IDs			
			nlapiDisableLineItemField('item', 'custcol_trial_editor', true);		   // Trial Editor
			nlapiDisableLineItemField('item', 'custcol_trial_editor_email', true);		   // Trial Editor Email
			nlapiDisableLineItemField('item', 'custcol_total_order_amt_usd', true);				 // Total Order Amount (USD) (Opportunity Item)
			nlapiDisableLineItemField('item', 'custcol_total_order_amt_nonusd', true);			 // Total Order Amount (non-USD) (Opportunity Item)
			nlapiDisableLineItemField('item', 'custcol_total_order_weighted_amt_usd', true);	 // Total Order Weighted Amount (USD) (Opportunity Item)
			nlapiDisableLineItemField('item', 'custcol_total_order_weight_amt_nonusd', true);	 // Total Order Weighted Amount (non-USD) (Opportunity Item)
			
			// US192398 - 10-12-2017 Marketo/CRM/WinSeR integration
			nlapiDisableLineItemField('item', 'custcol_mlo_id', true);					// MLO ID
			nlapiDisableLineItemField('item', 'custcol_winser_last_updated', true);			// WinSeR Last Updated
			nlapiDisableLineItemField('item', 'custcol_foreign_amount', true);	  		// Non-USD Amount
			nlapiDisableLineItemField('item', 'custcol_item_currency', true);			 // Currency (Opportunity Item)
		}
	}
}

function oppty_winserSave()
{	// runs if NOT a Web Service User
	if (this_user != '452592' && this_user != '808840')
	{	
		// 2017-09-26 Only Nor'Easter and Orion Team Members are allowed to edit/save/delete a WinSer Opportunity
		//		Nor'Easter and Orion teams belong to department 46
		//		code has been updated from previously hard-coded user employee IDs (Steven, Dina, David Clark)
		if (user_dept != '46') 		
		{
			alert('Error: WinSeR Opportunities cannot be edited.  This record will not be saved');
			return false;
		}
		else
		{
			return true;
		}
	}
	else
	{
		return true;
	}
}

function oppty_winserLineInit(type)
{
	if (this_user != '452592' && this_user != '808840')
	{
		// Disabling only works on the Item field and Amount field in Line Initiation function
		// 2017-09-26 Only Nor'Easter and Orion Team Members are allowed to edit/save/delete a WinSer Opportunity
		if (user_dept != '46') 	
		{
			nlapiDisableLineItemField('item', 'item', true);
			nlapiDisableLineItemField('item', 'amount', true);		
		}
	}
}


// LSD:  global arrays are used to pass oppty item data from parent window to child window
var itemArr = new Array();
var custArr = new Array();

// LSD:  function for the on-click event of the LSD template button
function opptyButtonLSD()
{
	var pub = '';
	var item = '';
	var lsdQ = '';
	var vend_id = null;
	// US167245 Determine whether all Items to be included are New or Renew
	var nw = 0;
	var rnw = 0;

	
	// clear the array in the event of a double-click
	for (var i in itemArr)
	{
		itemArr[i] = null;
	}
	
	// look for lsd's in items
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		pub = nlapiGetLineItemValue('item','custcol_lsd_publisher',k);
		item = nlapiGetLineItemText('item','item',k);
		lsdQ = nlapiGetLineItemValue('item','custcol_lsd_quote', k);		
		// criteria: must have a publisher and lsd quote flag set
		if (pub != null && pub != '' && lsdQ == 'T')
		{
			if (itemArr[pub] == null)
			{
				itemArr[pub] = new Array();
			}
			// 2015-05-14
			// If this Item isn't already in the Publisher Array then Add it
			if(itemArr[pub].indexOf(item)== -1)
			{
				itemArr[pub].push(item);
			}
			
			// US167245 Check whether items are new or renew... 
			var nwrnw = nlapiGetLineItemValue('item', 'custcol_oppty_item_new_renewal', k);
			switch(nwrnw) 
			{
			case "1":
				var nw = nw + 1;
				break;
			case "2":
				var rnw = rnw + 1;
				break;
			default:
				var nw = nw + 1;
				var rnw = rnw + 1;
				break;
			}
		}
	}
	
	// call the getApaVendorIds function -- Function gets the APA Vendor IDs
	vend_id = getApaVendorIds();
	
	// lookup the Primary Contact on the customer
	// US167245 Also add in Contact Role & Job Role to Contact info.
		var cust = nlapiGetFieldValue('entity');
		var contact_name = null;
		var contact_email = null;
		var contact_phone = null;
		var contact_role = null;
		var contact_job_role = null;
		// Create Search
		var con_filters = new Array();
		con_filters[0] = new nlobjSearchFilter('company', null,'anyof', cust);
		con_filters[1] = new nlobjSearchFilter('contactrole', null,'anyof', '-10');
		var con_columns = new Array();
		con_columns[0] = new nlobjSearchColumn('entityid', null, null); // name
		con_columns[1] = new nlobjSearchColumn('email', null, null); // email
		con_columns[2] = new nlobjSearchColumn('phone', null, null); // phone
		con_columns[3] = new nlobjSearchColumn('custentity_jobarea', null, null); // Job Role
		// Execute my search.  Vendor ID records are called "customrecord91"
		con_searchResults = nlapiSearchRecord('contact', null, con_filters, con_columns);
		if (con_searchResults)
		{	
			var mult_con_ids = false;
			for (var x=0; con_searchResults != null && x < con_searchResults.length; x++ )
			{	
				contact_name = con_searchResults[x].getValue('entityid');
				contact_email = con_searchResults[x].getValue('email');
				contact_phone = con_searchResults[x].getValue('phone');
				contact_job_role = con_searchResults[x].getText('custentity_jobarea');
				contact_role = 'Primary Contact';
			}
			//  alert('Contact info is: '+ contact_name + ', '+ contact_email+ ', '+contact_phone);
		}

	// create an array of customer data
	// US167245 Adjusted contents of array		
//	custArr[0] = nlapiLookupField('employee',nlapiGetContext().getUser(),'entityid'); // Account Executive
	custArr[0] = nlapiGetFieldText('entity'); // name and id
	custArr[1] = nlapiGetFieldValue('custbody_lsd_address'); // ship address
//	custArr[3] = '\n '; // Member Sites
	custArr[2] = nlapiGetFieldValue('custbody_lsd_fte'); // fte
//	custArr[5] = '\n '; // fte source
	custArr[3] = nlapiLookupField('customer', cust, 'custentity_marketsegment', true); // Market Segment
	custArr[4] = nlapiLookupField('customer', cust, 'url'); // website url;
	if (nw >= 1 && rnw == 0)
	{
		custArr[5] = 'Type: New \nStart Date: '; // new  + start date header
	}
	else if (nw == 0 && rnw >= 1)
	{
		custArr[5] = 'Type: Renew \nStart Date: '; // renewal + start date header
	}
	else
	{
		custArr[5] = '\nStart Date: '; // blank + start date header
	}
	custArr[6] = 'Name: ' + contact_name + '\nPhone: ' + contact_phone + '\nEmail: ' + contact_email + '\nRole: ' + contact_role + '\nJob Role: ' + contact_job_role;; // contact Info
	custArr[7] = vend_id; // AP Vendor ID(s)
//	custArr[9] = '\n '; // special instructions;
	
	// call popup
	// PRODUCTION NEXT LINE 
	// var popUp = window.open('https://system.netsuite.com/core/media/media.nl?id=37890&c=392875&h=7827153ec4775ca0b23d&_xt=.htm');
	
	// SB1-refresh-2024-09-30 Code NEXT LINE !!!!
	//var popUp = window.open('https://system.sandbox.netsuite.com/core/media/media.nl?id=37890&c=392875&h=7827153ec4775ca0b23d&_xt=.html');	
	
	// SB2 Code NEXT LINE !!!!
	//var popUp = window.open('https://system.sandbox.netsuite.com/core/media/media.nl?id=37890&c=392875_SB2&h=3ef47e7c7ae7e3552e0c&_xt=.html');
	
	// SB3 Code NEXT LINE !!!!
	// var popUp = window.open('https://system.sandbox.netsuite.com/core/media/media.nl?id=37890&c=392875_SB3&h=cf89a31b30bdf0f56144&_xt=.html');
	
	// Release Preview Code NEXT LINE !!!!
	//var popUp = window.open('https://system.na1.beta.netsuite.com/core/media/media.nl?id=37890&c=392875&h=7827153ec4775ca0b23d&_xt=.html');
	
	//06-02-2016  US131761:  NetCRM Sandbox Automation/PI.  Environment specific url is set in called function so above commented code no longer needed.
	var lsd_popup_url = getLSDPopupURL();
	var popUp = window.open(lsd_popup_url);
	if(!popUp.opener)
	{
		popUp.opener = this.window;
	}
}

function getApaVendorIds()
{
   	var vend_id = 'No IDs Found';
	// 2011-12-22 Create An String of APA Vendor ID's
		var cust = nlapiGetFieldValue('entity');	
		// Create Search for Vendor ID records that are APA Constituent ID's
		var ven_filters = new Array();
		ven_filters[0] = new nlobjSearchFilter('custrecord_vendorid_linked_customer', null,'anyof', cust);
		// type "APA Constituent ID" is "1" (in the Vendor Identifier Name list)
		ven_filters[1] = new nlobjSearchFilter('custrecord_name_vendor_identifier', null,'anyof', '1');

		var ven_columns = new Array();
		ven_columns[0] = new nlobjSearchColumn('custrecord_vendor_identifier', null, null);

		// Execute my search.  Vendor ID records are called "customrecord91"
		ven_searchResults = nlapiSearchRecord('customrecord91', null, ven_filters, ven_columns);
		if (ven_searchResults)
		{	
			var mult_ven_ids = false;
			for (var x=0; ven_searchResults != null && x < ven_searchResults.length; x++ )
			{	
				if (mult_ven_ids == false)
				{	//get Vendor ID
					vend_id = ven_searchResults[x].getValue('custrecord_vendor_identifier');
					// Set flag so that we can append the comma on next iteration through loop
					mult_ven_ids = true;
				}
				else
				{	//get Vendor ID -- append comma
					vend_id += ", ";
					// append the next search results
					vend_id += ven_searchResults[x].getValue('custrecord_vendor_identifier');

				}
			}
			// alert('My vendor id(s) are: '+ vend_id);
		}
		return vend_id;
}