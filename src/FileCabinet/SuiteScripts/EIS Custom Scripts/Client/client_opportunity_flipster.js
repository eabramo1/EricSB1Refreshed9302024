/* ****************************************************************************************************************************** */
/* ATTENTION!!  THE LIBRARY SCRIPT library_environment_script.js MUST BE USED WITH THIS FLIPSTER SCRIPT TO DETERMINE ENVIRONMENT  */
/* ****************************************************************************************************************************** */

/* Revision Log:-
 * ******************************************************************************************************************************** 
 * KMcCormack	06-02-2016	US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM
 * 									  - A new library script has been created which can be used by any form's client side script when
 * 										there is a reason for different values or logic based on the current environment.  This 
 * 										will remove the need for recoding of these values/scripts when a sandbox is refreshed and 
 * 										also when future changes are migrated from dev to QA to prod environments.
 * 										Special * NEEDS ATTENTION * code based on environment can be removed with environment
 * 										sensitive code.
 * eAbramo		03-21-2017	Nor'Easter team requires editing on Flipster Opportunities.  Way to do this is qualify all disabling of fields
 * 										with new change, if you're role 1025 (Web Service) the disabling of fields doesn't occur   
 * eAbramo		04-04-2017	Error related to function "epEmailIsValid" found in 2017.1. Comment out code
 *  						no sign that a function of this name has ever existed
 *  			04-07-2022	TA702047 Flipster client script - allow Admins to do emergency modifications
 *
 * ********************************************************************************************************************************
 */
// hasTrialsOnLoad is used to store a value from Formload and use it to compare with later when running the save function
var hasTrialsOnLoad = false;
// FOREIGN CURRENCY - currency record ID for US Dollar
var USD_ID = '5';
// Trial Access Variable gets toggled to true if the Trial Accessing Sites field is modified - if true then 
// the "Resubmit Trials function is called on Save
var trial_access_modification = false;
var real_system_gen_renewal = false;
var trialCount = 0;
var trialCountLoad = 0;
var OpptyStatusOnLoad = null;
// 2014-03-28 Add Item-level Expected Close Date (1)
var ExpectedCloseOnLoad = null;
var newOpptyStatus = null;
// Add global variable to set if submitted Flipster Oppty - and then use variable to lock all the fields down 
var submittedFlipster = false;

// TRIALS:  variables used to compare line item initialization with line item validation
var previousEndDate;
var previousTrialState;
var previousItem;
var previousInterfaces = "";

	// var recalc_discount_fields = true

// OPPTY LOAD FUNCTION
function opptyFormLoad()
{
	// 2016-02-09 ALL Flipster Opportunities should be set to USD
	nlapiSetFieldValue('custbody_currency_code', USD_ID, false, true);

	// 2017-03-21 Nor'Easter needs to be able to EDIT Flipster fields
	// Begin Disabling of fields if not Web Service role
	if (nlapiGetRole()!='1025')
	{
		// Flipster // lock fields if it is a "Submitted" flipster Oppty
		if (nlapiGetFieldValue('custbody_flp_oppty_status') == 2)
		{
			submittedFlipster = true;
			// header level fields
			if (nlapiGetRole() != 3){
				nlapiDisableField('customform', true);				
			}
			nlapiDisableField('entity', true);
			nlapiDisableField('title', true);
			nlapiDisableField('expectedclosedate', true);
			nlapiDisableField('salesrep', true);
			nlapiDisableField('custbody_leadsource', true);
			nlapiDisableField('custbody1', true);
			nlapiDisableField('custbody_winser_reasonslost', true);
			nlapiDisableField('department', true);
			nlapiDisableField('custbody_no_accsites_oppty', true);
			nlapiDisableField('custbody_trial_group', true);
			nlapiDisableField('custbody_trial_email', true);
			nlapiDisableField('custbody_trial_email_language', true);
			nlapiDisableField('custbody_send_email', true);
			nlapiDisableField('custbody_trial_accessing_sites', true);
			nlapiDisableField('custbody_quote_contact', true);
			nlapiDisableField('custbody_flp_onbehalf_email', true);	
			nlapiDisableField('custbody_flp_fee_percent', true);
			nlapiDisableField('entitystatus', true);
			nlapiDisableLineItemField('item', 'item', true);
			nlapiDisableLineItemField('item', 'custcol_trial_enabled', true);
			nlapiDisableLineItemField('item','amount',true);
			nlapiDisableLineItemField('item', 'custcol_oppty_item_new_renewal', true);
			nlapiDisableLineItemField('item', 'custcol_oppty_item_status', true);	
			nlapiDisableLineItemField('item', 'custcol_note_for_renewal', true);
			nlapiDisableLineItemField('item', 'custcol_oppty_item_expected_close', true);
		}
	// cont.  opptyFormLoad()
		// 2014-07-07 disable header fields (fields now enabled by default because Web Service needs to create Flipster Opptys)
		nlapiDisableField('custbody_currency_code', true);
		nlapiDisableField('custbody_oppty_open_closed', true);
		nlapiDisableField('custbody_projected_total_usd', true);
		nlapiDisableField('custbody_usd_weighted', true);
		nlapiDisableField('custbody_previous_usd', true);
		nlapiDisableField('custbody_prev_subexp', true);
		nlapiDisableField('custbody_flp_oppty_status', true);
	
		// disable the Sales Order ID field and the Sales Order Link field
		nlapiDisableLineItemField('item','custcol_salesorder_id',true);
		nlapiDisableLineItemField('item','custcol_salesorder_link',true); 
		// WSR Disable some line item fields
		nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_usd', true);
		nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_foreign', true);
		nlapiDisableLineItemField('item', 'custcol_renew_amount_wasprorated', true);
		nlapiDisableLineItemField('item', 'custcol_prev_item_transdate', true);
		nlapiDisableLineItemField('item', 'custcol_prev_subscription_id', true);
		nlapiDisableLineItemField('item', 'custcol_previous_usd', true);
		nlapiDisableLineItemField('item', 'custcol_previous_foreign', true);
		nlapiDisableLineItemField('item', 'custcol_oppty_item_close_date', true);
		nlapiDisableLineItemField('item', 'custcol_oppty_item_probability', true);	
		// 2014-07-18 for Flipster Trial fix - the Service needs to set this value - needed to open field up on form by default
		// now lock it down via script
		nlapiDisableLineItemField('item', 'custcol_trial_begin', true);
		nlapiDisableLineItemField('item', 'custcol_trial_end', true);
		nlapiDisableLineItemField('item', 'custcol_trial_interface_names', true);
		nlapiDisableLineItemField('item', 'custcol_trial_interface_ids', true);		   // Trial Interface IDs
		nlapiDisableLineItemField('item', 'custcol_opx_item_id', true);
	}// End disabling of fields if NOT Web Service role

// cont.  opptyFormLoad()

	var fAmount = 0;
	var usAmount = 0;
	var lineCount = nlapiGetLineItemCount('item');
	
	// 2014-03-20 For two MKTG Roles (1009 and 1053) Entity Status should be set to a 1 (rather than a 2)
	// Item Status should follow suit through this code
	if ((nlapiGetRecordId() == null || nlapiGetRecordId() == '') && (nlapiGetRole() == 1009 || nlapiGetRole() == 1053))
	{
		nlapiSetFieldValue('entitystatus', 7, false, true);
	}	
	OpptyStatusOnLoad = nlapiGetFieldValue('entitystatus');
	// 2014-03-28 Add Item-level Expected Close Date (2)
	ExpectedCloseOnLoad = nlapiGetFieldValue('expectedclosedate');
	

	// unlock USD Amount fields // but only if it's NOT a Submitted Flipster Oppty
	if (submittedFlipster == false)
	{
		nlapiDisableLineItemField('item','amount', false);
	}

// cont.  opptyFormLoad()


	for (var i = 1; i <= lineCount; i++)
	{
		// WSR - Load New Renewal if it is empty
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_new_renewal', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_item_new_renewal', i) == null)
		{
			nlapiSetLineItemValue('item', 'custcol_oppty_item_new_renewal', i, 1);	
		}		
		// WSR - If Item Oppty Status is empty - set it to equal Header Status	/
		// also set the Item Probability 
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_status', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_item_status', i) == null)
		{
			if (OpptyStatusOnLoad == 7) 
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 1);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '.01');
			}
			else if (OpptyStatusOnLoad == 18)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 2);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '.25');
			}
			else if (OpptyStatusOnLoad == 10)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 3);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '.50');
			}
			else if (OpptyStatusOnLoad == 15)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 4);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '.90');
			}
			else if (OpptyStatusOnLoad == 25)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 5);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '.95');
			}
			else if (OpptyStatusOnLoad == 22)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 6);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '0');
			}
			else if (OpptyStatusOnLoad == 26)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', i, 7);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , i, '1');
			}
			// WSR set Item Weighted Amount USD 
			var item_probability = nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', i);
			var weighted_usd = usAmount * item_probability;
			nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , i, weighted_usd);
		}		
	}

// cont.  opptyFormLoad()

	// WSR - If has Items and NEW Body fields aren't populated then populate them
	// by calling OpptyUpdateBodyCalcs function
	var usProjected = nlapiGetFieldValue('custbody_projected_total_usd');
	if (lineCount > 0 && (usProjected == '' || usProjected == null))
	{
		// alert('run the OpptyUpdateBodyCalcs function - hit OK');
		opptyUpdateBodyCalcs();
	}		
	
	nlapiRefreshLineItems('item');
	// END WORKAROUND #2
	// END FOREIGN CURRENCY ON LOAD
		
	// if this is a new opportunity
	if(nlapiGetRecordId() == null || nlapiGetRecordId() == '')
	{
		// Set the expected close date
		// Note:  In Javascript, January = 0, Feb = 1, etc.
		var tDate = new Date()
		if (tDate.getMonth() <= 5)
		{
			//fiscal year = calendar year (Jan-June)
			nlapiSetFieldValue('expectedclosedate',nlapiDateToString(new Date(tDate.getFullYear(),5,30)), false, true);
		}
		else
		{
			//fiscal year = calendar year + 1 (July-Dec)	
			nlapiSetFieldValue('expectedclosedate',nlapiDateToString(new Date(tDate.getFullYear()+1,5,30)), false, true);
		}
		// 2014-03-28 Add Item-level Expected Close Date (3)
		var newExpectedClose = nlapiGetFieldValue('expectedclosedate');
		// call function
		setItemExpectedClose(newExpectedClose, ExpectedCloseOnLoad, false);
		
		
		// 2013-11-11 If new Oppty then open up EP Marketing Campaign Field
		nlapiDisableField('custbody_ep_mktg_campaign', false);

		// 2014-06-09 create title of Opportunity to "Flipster"
		nlapiSetFieldValue('title', 'Flipster');
		
// cont.  opptyFormLoad()
		// Add Flipster Item to Oppty
		nlapiSelectNewLineItem('item');
		nlapiSetCurrentLineItemValue('item', 'item', 4547, false, true);

		// Set Item Status to the Entity Status	
		var header_status = nlapiGetFieldValue('entitystatus');	
		if (header_status == 7) 
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 1, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.01', true, true);
		}
		else if (header_status == 18)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 2, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.25', true, true);
		}
		else if (header_status == 10)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 3, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.50', true, true);
		}
		else if (header_status == 15)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 4, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.90', true, true);
		}
		else if (header_status == 25)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 5, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.95', true, true);
		}
		else if (header_status == 22)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 6, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '0', true, true);
		}
		else if (header_status == 26)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 7, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '1', true, true);
		}

		// Set New/Renewal field to "New" (1)
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_new_renewal', 1, false, true);	
		nlapiCommitLineItem('item');


// cont.  opptyFormLoad()		
		// 02-14-2013 If new Oppty is clone of System Generated (Renewal Loaded) oppty clear System Generated fields
		if (nlapiGetUser() != '452592' && nlapiGetUser() != '808840') // User is not Web Service
		{
			// Flipster - Lead Source set to Account Executive (2)
			nlapiSetFieldValue('custbody_leadsource', '2');
			nlapiSetFieldValue('custbody_previous_usd', '');
			nlapiSetFieldValue('custbody_previous_foreign', '');
			nlapiSetFieldValue('custbody_prev_subexp', '');
			nlapiSetFieldValue('custbody_prev_transdate', '');
			nlapiSetFieldValue('custbody_change_usd', '');
			nlapiSetFieldValue('custbody_change_foreign', '');
			// Clear line item fields as well
			for (var i = 1; i <= lineCount; i++)
			{
				nlapiSetLineItemValue('item', 'custcol_previous_usd', i, '');
				nlapiSetLineItemValue('item', 'custcol_previous_foreign', i, '');
				nlapiSetLineItemValue('item', 'custcol_salesorder_id', i, '');
				nlapiSetLineItemValue('item', 'custcol_change_foreign', i, '');
				nlapiSetLineItemValue('item', 'custcol_change_usd', i, '');
			}
		}
	// End code if New Opportunity
	}
	// If this is NOT a new Opportunity then lock down the Custom Form field (if not an Administrator)
	else if (nlapiGetRole() != 3)
	{
		nlapiDisableField('customform', true);
	}
	
// cont. opptyFormLoad()

	// Flipster - If Flipster Oppty Status is empty then set to In Progress
	if (nlapiGetFieldValue('custbody_flp_oppty_status') == '' || nlapiGetFieldValue('custbody_flp_oppty_status') == null)
	{
		nlapiSetFieldValue('custbody_flp_oppty_status', 1);
	}
	

	// Flag if this is REAL System Generated Oppty - and disable Lead Source field
	if (nlapiGetFieldValue('custbody_leadsource') == '18')
	{
		nlapiDisableField('custbody_leadsource',true);
		// set a variable - USED IN FORM SAVE 
		// allow SAVE if form is loaded w/ LeadSource of 'System Generated Renewal' - otherwise give user error
		real_system_gen_renewal = true;
	}

	// TRIALS:  On load, look for existing items on trial.  If found, disable the trial group field
	// also set the has TrialsOnLoad variable
	if(hasTrials())
	{
		hasTrialsOnLoad = true;
		nlapiDisableField('custbody_trial_group',true);	
		// get the count of Trial Items on Load -- Use later to make sure you don't have less if removing an item
		trialCountLoad = trialCount;
	}
	else
	{
		hasTrialsOnLoad = false;
	}
	
	// set the cursor to the Title field
	document.getElementById('title').focus();
}
// end form Load function


// OPPTY SAVE FUNCTION
function opptyFormSave()
{
	// alert('form Save function');
	
	// 03-04-2008 Require at least one line item
	if( nlapiGetLineItemCount('item') < 1)
	{
		alert("You must enter at least one item for this opportunity.");
		return false;
	}
	
	// 11-23-10 Do Not Allow EP Lead Source of "System Generated Renewal" if it's not already set to that upon load
	if ( real_system_gen_renewal == false && nlapiGetFieldValue('custbody_leadsource') == '18')
	{
		alert('You will not be able to save until you change the Lead Source to something OTHER than System Generated Renewal.');
		return false;
	}
	
	// Flipster - Reformat Subscription Fee Percent if decimals are beyond one place
	if(nlapiGetFieldValue('custbody_flp_fee_percent') != '' && nlapiGetFieldValue('custbody_flp_fee_percent') != null)
	{
		var fee_percent = nlapiGetFieldValue('custbody_flp_fee_percent');
		var stLength = fee_percent.length - 1 // need to minus one because of the '%' sign in the string
		var fee_percent2 = fee_percent.substring(0, stLength);  // remove the percent sign
		var numDec = fee_percent2.split(".")[1].length;  // get the length beyond the decimal place
		if (numDec > 1)
		{	
			var fee_percent_num = Number(fee_percent2); // convert it to number
			var updated_percent = fee_percent_num.toFixed(1); // take only one decimal place
			nlapiSetFieldValue('custbody_flp_fee_percent', updated_percent); // set the value
		}
	}

	// 2015-09-11 Don't allow User to choose WinSeR Opportunity Type
	var oppty_type = nlapiGetFieldValue('custbody1');
	if (oppty_type == '12' || oppty_type == '13'|| oppty_type == '14')
	{
		alert('Please choose another Opportunity Type.  WinSeR Opportunity Types are not allowed');
		return false;
	}
	
	//alert('DEBUG: in client_opp_flipster, CurrentEnv.name = ' + CurrentEnvironment.name);
	
	//06-02-2016  US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM - Replace commented out logic below with this new environment sensitive code.
	if(CurrentEnvironment.name != 'PRODUCTION') {
		var flip_email = nlapiGetFieldValue('custbody_quote_contact_email');
		if (flip_email != '' && flip_email != null )
		{	
			//alert('DEBUG: flip_email = '+ flip_email.toLowerCase());
			if (flip_email.toLowerCase().indexOf("ebscohost.com") == -1 && flip_email.toLowerCase().indexOf("ebsco.com") == -1)
			{
				alert("Flipster Contact Email Error Sandbox: Only Flipster Contact records with ...ebscohost.com and ...ebsco.com are allowed for QA UAT Sandbox Testing purposes.  Emails will actually be sent to this email address");
				return(false);
			}
		}		
	}
	
	// FLIPSTER - **************************************************
	// ATTENTION !!!!!!!!!!!*********************************************************
	// *********************  THIS CODE NEEDS TO BE REMOVED FOR PRODUCTION !!!!!!!******************
	// ATTENTION !!!!!!!!!!!*********************************************************
	//	var flip_email = nlapiGetFieldValue('custbody_quote_contact_email');
	//	if (flip_email != '' && flip_email != null )
	//	{	
	//		if (flip_email.toLowerCase().indexOf("ebscohost.com") == -1 && flip_email.toLowerCase().indexOf("ebsco.com") == -1)
	//		{
	//			alert("Flipster Contact Email Error Sandbox: Only Flipster Contact records with ...ebscohost.com and ...ebsco.com are allowed for QA UAT Sandbox Testing purposes.  Emails will actually be sent to this email address");
	//			return(false);
	//		}
	//	}
	// END FLIPSTER SB2 ALERT !!!!!!!!!!!*********************************************************



	// If Oppty Type isn't "Temp Access" and isn't "Group Purchase" 
	// 	AND all Items are Closed Lost 	Require at least one Reason Lost
	if (nlapiGetFieldValue('custbody1') != '5' && nlapiGetFieldValue('custbody1') != '6')
	{
		var all_lost = true;
		for ( r = 1; r <= nlapiGetLineItemCount('item'); r++)
		{	// Oppty Item Status   if not 6: "8-Lost" and if not 8: "0-Repeated Item for Quote - no volume"
			if (nlapiGetLineItemValue('item', 'custcol_oppty_item_status', r) != 6 && nlapiGetLineItemValue('item', 'custcol_oppty_item_status', r) != 8)
			{	// if an Item is NOT Closed-Lost change - break
				all_lost = false;
				break;
			}
		}
		if (all_lost == true)
		{	// now - require at least one Reason Lost
			if ( nlapiGetFieldValue('custbody_winser_reasonslost') == '' || nlapiGetFieldValue('custbody_winser_reasonslost') == null)
			{
				alert('All Items in your Opportunity are Closed-Lost and your Opportunity is not Type \'Temporary Access\' or \'Part of Group Purchase\'.  You must visit the Reason Lost section and select at least one Reason Lost');
				return false;
			}	
		}
	}	
// cont. opptyFormSave()
			
	
	// If role is Not Sales Administrator and if Opportunity Status is not 1-Qualify (7), 2-Develop (18), 7-Closed - Lost (22), 8-Closed - Won (26)
		// Require $'s in at least one Item 
		if (nlapiGetRole() != '1007')
		{
			if (nlapiGetFieldValue('entitystatus') != '7' && nlapiGetFieldValue('entitystatus') != '18' && nlapiGetFieldValue('entitystatus') != '22' && nlapiGetFieldValue('entitystatus') != '26' )
			{	var has_dollars = false;
				for ( d = 1; d <= nlapiGetLineItemCount('item'); d++)
				{
					var itemdollars = nlapiGetLineItemValue('item','amount', d);
					if (itemdollars > '0.00')
					{
						var has_dollars = true;
						break;
					}

				}
				if (has_dollars == false)
				{
					alert('If your Opportunity is a Status "3-Proposal/Negotiation" or greater (excluding Closed-Lost), items must include dollar amounts.');
					return false;
				}
			}
		}
// cont. opptyFormSave()


	// 2014-03-20 Don't allow Expected Close too far into future
	var today2 = new Date();
	// get difference in seconds
	var diff_seconds = nlapiStringToDate(nlapiGetFieldValue('expectedclosedate')) - today2;
	// convert seconds into days
	var SecToDays = 1000 * 60 * 60 * 24;
	var diff = diff_seconds / SecToDays;
	// 1095 days (3 years) as the limit
	if (diff > 1095)
	{
		alert('Expected Close Date is too far into the future, Please correct');
		return(false);
	}
		
	// 2016-01-21 Code updated
	// Error out if more than one of same Item in Oppty - (Flipster in contrast to WSR shouldn't consider Item Probability)
	// create two arrays - array 1 to inspect individual Item, array 2 is used to compare others to item in array 1
	var w_items_1 = new Array();
	var w_items_2 = new Array();	
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{	
		w_items_1[k] = nlapiGetLineItemValue('item', 'item', k);
		w_items_2[k] = nlapiGetLineItemValue('item', 'item', k);
	}	
	// Double loop to compare items to eachother
	for ( w1 = 1; w1 <= w_items_1.length; w1++)
	{
		var ComparisonItem = nlapiGetLineItemValue('item', 'item', w1);
		for ( w2 = 1; w2 <= w_items_2.length; w2++)
		{
			var w2Item = nlapiGetLineItemValue('item', 'item', w2);
			if (w1 != w2 && ComparisonItem == w2Item)
			{
				var CompItemName = nlapiLookupField('item', ComparisonItem, 'name', false);
				nlapiSetLineItemValue('item', 'custcol_trial_enabled', w2, 'F');	
				nlapiRemoveLineItem('item', w2);
				alert('For Flipster Opportunites, no more than one of the same item is allowed. You have more than one of the item '+CompItemName+'. If you intend to set up a new Trial for this item you will need to create a new Opportunity.');
				return false;
			}
		}
	}


	// Load the Quote Contact NSKEY into a Hidden Custom field - It is used for making an order
 	if (nlapiGetFieldValue('custbody_quote_contact') != '' && nlapiGetFieldValue('custbody_quote_contact') != null)
 	{
 		nlapiSetFieldValue('custbody_wsr_contact_nskey', nlapiGetFieldValue('custbody_quote_contact'));
 	}	


	// force all trials to end today if 
	// status is closed-lost (id=22) and type is NOT temp access (id=5) OR type is NOT Purchased with Group
	// Edited 07-17-08 E Abramo
	var oppty_status = nlapiGetFieldValue('entitystatus');
	var oppty_type = nlapiGetFieldValue('custbody1');
	if ((oppty_status == 22) && (oppty_type != 5) && (oppty_type != 6))
	{
		opptyEndTrials();
	}


// cont. opptyFormSave()	
	// clean up email delimiters and validate
	nlapiSetFieldValue('custbody_trial_email',nlapiGetFieldValue('custbody_trial_email').replace(/,/g,';'));
	// Comment out the below Validation of custbody_trial_email field -- there is no such function "epEmailIsValid" to be found
	/*
	if(!epEmailIsValid(nlapiGetFieldValue('custbody_trial_email')) && (nlapiGetFieldValue('custbody_trial_email') != '') && (nlapiGetFieldValue('custbody_trial_email') != null))
	{
		alert('Error:  Trial email address has an error.  If adding multiple email addresses please separate each with a semicolon (;)');
		return false;
	}
	*/

	
	// 12-18-08 Eric A added code to pick up a modification of the Trial Accessing Sites field
	if (trial_access_modification)
	{
		//alert('the Trial Access Modification flag is true');
		opptyResubmitTrials();
	}

	// 2015 WinSeR project - set the new "Opportunity Form Type" field appropriately (Flipster = 2)
	var form_type = nlapiGetFieldValue('custbody_oppty_form_type');
	if (form_type == null || form_type == '' || form_type != '2')
	{
		nlapiSetFieldValue('custbody_oppty_form_type', '2');
	}
	
	if (hasTrials())
	{	// 2016-01-22 There should ONLY EVER be one Flipster Trial - more than one Trial Item is not allowed
		// the hasTrials function loads the trialCount variable
		if (trialCount > 1)
		{
			alert('Error: Only one active trial is allowed within a Flipster Opportunity')
			return false;
		}
		else
		{
			// 2016-02-09 set the Header level trial flag
			nlapiSetFieldValue('custbody_trial','T');		
		}
	}
     	return true;
     	// End opptyFormSave()
}



// OPPTY FIELD CHANGED FUNCTION - this function handles all the field change events by testing name
function opptyFieldChanged(type, name)
{	
	// WSR 
	if(name == 'amount')
	{
		var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
		// WSR calculate new weighted amount
		var item_probability = Number(nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability'));
		var weighted_usd = Number(usAmt * item_probability);
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd', weighted_usd, false, true);
	}

	// WSR 2014-03-28 Add Item-level Expected Close Date (4)
	if (name == 'expectedclosedate')
	{	// Make sure that the active item row is the extra empty row (not a real row)
		if ( (nlapiGetCurrentLineItemValue('item','item') == '') || (nlapiGetCurrentLineItemValue('item','item') == null))
		{
			newExpectedClose = nlapiGetFieldValue('expectedclosedate');
			// call function
			setItemExpectedClose(newExpectedClose, ExpectedCloseOnLoad, true);
		}
		else
		{	// an item row is active
			alert('An item row is currently active.  Please commit your item row changes before setting the Expected Close Date.  (click done/add)');
			nlapiSetFieldValue('expectedclosedate', ExpectedCloseOnLoad, false, true);
		}
	}


	// WSR - if Opportunity Status (Header) is moved - call function to move all the Item Statuses as well
	// resets the probabilities and weighted amounts - item level
	if (name == 'entitystatus')
	{	// Make sure that the active item row is the extra empty row (not a real row)
		if ( (nlapiGetCurrentLineItemValue('item','item') == '') || (nlapiGetCurrentLineItemValue('item','item') == null))
		{
			newOpptyStatus = nlapiGetFieldValue('entitystatus');
			setItemStatus(newOpptyStatus, OpptyStatusOnLoad);
		}
		else
		{	// an item row is active
			alert('An item row is currently active.  Please commit your item row changes before changing the status.  (click done/add)');
			nlapiSetFieldValue('entitystatus', OpptyStatusOnLoad, false, true);
		}
	}
	
// OPPTY FIELD CHANGED FUNCTION
	// WSR - If Item Status changes - set Weighted Amount fields
	if (name == 'custcol_oppty_item_status')
	{	// had to hard-code the Item Probability change into script because javascript moves faster 
		// than NetSuite's field sourcing - got unpredictable behavior using out-of-box field sourcing
		var item_status	= nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_status');
		if (item_status == 1) 
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.01', true, true);
		}
		else if (item_status == 2)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.25', true, true);
		}
		else if (item_status == 3)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.50', true, true);
		}
		else if (item_status == 4)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.90', true, true);
		}
		else if (item_status == 5)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.95', true, true);
		}
		else if (item_status == 6)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.0', true, true);
			// ID = 6 is "7-Closed - Lost Item" -- also need to set Item Close Date field
			var myDate = new Date();
			var stringDate= nlapiDateToString(myDate);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_close_date', stringDate, false, true);			
		}		
		else if (item_status == 7)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '1', true, true);
			// ID = 7 is "6-Closed - Won Item" -- also need to set Item Close Date field 
			var myDate = new Date();
			var stringDate= nlapiDateToString(myDate);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_close_date', stringDate, false, true);
		}		
		else if (item_status == 8)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.0', true, true);
		}		
		// WSR set Item Weighted Amount USD
		var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
		var weighted_usd = usAmount * item_probability;
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
		// Don't need to call update body calculations function -- covered in Line Validation
	}

// OPPTY FIELD CHANGED FUNCTION	
	// TRIALS:  if trial box is checked by user, configure the trial fields
	if(name == 'custcol_trial_enabled')
	{
		// check for OE approval
		if(nlapiGetFieldValue('custbody_parent_oeapproved') == 'T')
		{
			// check that item can be trialed
			if(nlapiGetCurrentLineItemValue('item','custcol_can_trial') == 'T')
			{
				// check if Trial checkbox is checked
				if(trialEnabled())
				{			
					// Begin Loop through all Line Items and see if another Active Trial exists
					// 2016-02-09 New Code - THE ITEM NO LONGER MATTERS
					for (e = 1; e <= nlapiGetLineItemCount('item'); e++)
					{
						var is_trial = nlapiGetLineItemValue('item', 'custcol_trial_enabled', e);
						var trial_end = nlapiStringToDate(nlapiGetLineItemValue('item', 'custcol_trial_end', e));
						var today2 = new Date();
						today2.setHours(0,0,0,0);						
						// if item is a Trial and End Date is greater than or equal to today - then it is an Active Trial
						if (is_trial == 'T' && trial_end > today2)
						{	
							var trial_not_allowed = true;
							break;
						}
					}
					
					// End Loop through all Line Items and see if another Active Trial exists
					// 2016-02-09 New Code 
					if (trial_not_allowed == true)
					{
						
						nlapiSetCurrentLineItemValue('item', 'custcol_trial_enabled', 'F', false, true);
						alert('Error: The Trial checkbox cannot be checked because there already is an active trial.  If you still want to setup another Trial within this Opportunity, you can select the \'End Trials\' button to end the current Trial and then you will be able to add a new Trial to this Opportunity');
					}
					else // SET ALL THE TRIAL FIELDS
					{
						// set Trial Dates (begin date to today - End Date based on # trial days for item
						nlapiSetCurrentLineItemValue('item','custcol_trial_begin', nlapiDateToString(new Date()), true, true);
						nlapiSetCurrentLineItemValue('item','custcol_trial_end', nlapiDateToString(nlapiAddDays(new Date(),nlapiGetCurrentLineItemValue('item','custcol_item_trialdays'))), true, true);
						// set default interface and group
						nlapiSetCurrentLineItemValue('item','custcol_item_interface_selector',nlapiGetCurrentLineItemValue('item','custcol_item_default_interface'), true, true);
						// if Trial Email language is null - set it to English
						if(nlapiGetFieldValue('custbody_trial_email_language') == null || nlapiGetFieldValue('custbody_trial_email_language') == '')
						{
							nlapiSetFieldValue('custbody_trial_email_language','1');
						}	

						// If Group is Null - set it to Trial (1)
						if(nlapiGetFieldValue('custbody_trial_group') == null || nlapiGetFieldValue('custbody_trial_group') == '')
						{
							nlapiSetFieldValue('custbody_trial_group','1');
						}	
						//enable the interface selector and end date
						nlapiDisableLineItemField('item','custcol_item_interface_selector',false);
						// set the send email flag
						nlapiSetFieldValue('custbody_send_email','T');
						// get item name to validate later
						previousItem = nlapiGetCurrentLineItemValue('item','item');
					}

				}
				else // Trial Checkbox being unchecked
				{
					// if trail was unchecked before commiting line-item, clear dates
					nlapiSetCurrentLineItemValue('item','custcol_trial_begin','', true, true)
					nlapiSetCurrentLineItemValue('item','custcol_trial_end','', true, true)
					// and clear interface, interface ids, group
					nlapiSetCurrentLineItemValue('item','custcol_trial_interface_ids','', true, true);
					nlapiSetCurrentLineItemValue('item','custcol_trial_interface_names','', true, true);
					// disable interface selector and end date
					nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
					nlapiDisableLineItemField('item','custcol_trial_end',true);
				}
			}
			else	// item cannot be trialed
			{
				alert('Trials for this item cannot be set up in CRM.');
				nlapiSetCurrentLineItemValue('item','custcol_trial_enabled',false,false, true);
			}
		}
		else	// not OE approved
		{
			alert('This customer must first be OE Approved (with at least one valid address and contact record) before a trial can be created.  Please email Order Entry (orderentry@epnet.com) for approval.');
			nlapiSetCurrentLineItemValue('item','custcol_trial_enabled',false, false, true);
		}
	}
// OPPTY FIELD CHANGED FUNCTION	
	// TRIALS:  if interface selector is modified, add or remove selection from the comma separated interface lists
	if(name == 'custcol_item_interface_selector' && nlapiGetCurrentLineItemValue('item','custcol_item_interface_selector') != '' && nlapiGetCurrentLineItemValue('item','custcol_item_interface_selector') != null)
	{
		var delimiter = ',';
		// grab the current selected interface name and ID
		var currIntName = nlapiGetCurrentLineItemText('item','custcol_item_interface_selector');
		var currIntId = nlapiGetCurrentLineItemValue('item','custcol_item_interface_selector');
		var currIntNameStr = nlapiGetCurrentLineItemValue('item','custcol_trial_interface_names');
		var currIntIdStr = nlapiGetCurrentLineItemValue('item','custcol_trial_interface_ids')
		currIntNameArray = new Array();
		currIntIdArray = new Array();
		prevIntIdArray = new Array();
		
		// check if string has a value.  If yes, split into the arrays (this prevents an array with an empty string)
		if( currIntIdStr != '' && currIntIdStr != null)
		{
			currIntNameArray = currIntNameStr.split(delimiter);
			currIntIdArray = currIntIdStr.split(delimiter);
		}	
		if (previousInterfaces != '' && previousInterfaces != null)
		{
			prevIntIdArray = previousInterfaces.split(delimiter);
		}		
		var found = false;
		var foundPrevious = false;
		
		for(i = 0; i < currIntIdArray.length; i++)
		{		
			if (currIntIdArray[i] == currIntId)
			{
				//found, so check with prevIntIdArray for any existing values which should not be removed
				foundPrevious = false;
				found = true;				
				for(p in prevIntIdArray)
				{
					if(prevIntIdArray[p] == currIntId)
					{
						foundPrevious = true;						
					}
				}			
				if(foundPrevious == true)
				{			
					// remove from array
					currIntIdArray.splice(i,1);
					currIntNameArray.splice(i,1);
					i--; // array item removed, so current pointer should not increment					
				}
				found = true;
			}
		}
		
		if(!found)
		{
			//add to array if not found
			currIntIdArray.push(currIntId);
			currIntNameArray.push(currIntName);
		}
		
		//convert to string and save
		nlapiSetCurrentLineItemValue('item','custcol_trial_interface_ids',currIntIdArray.join(','), true, true);
		nlapiSetCurrentLineItemValue('item','custcol_trial_interface_names',currIntNameArray.join(', '), true, true);
		nlapiSetCurrentLineItemValue('item','custcol_item_interface_selector','', true, true);
	}

	// 12-18-08 Pick up a modification of the Trial Accessing Sites field
	if (name == 'custbody_trial_accessing_sites')
	{
		trial_access_modification = true;
	}
}


// OPPTY LINE INIT FUNCTION
function opptyLineInit(type)
{
	// TRIALS: grab initial values for end date, trial state (is it Trial Enabled), item, and interfaces
	//    these are used later for line item validation
	previousEndDate = nlapiGetCurrentLineItemValue('item','custcol_trial_end');
	previousTrialState = nlapiGetCurrentLineItemValue('item','custcol_trial_enabled');
	previousItem = nlapiGetCurrentLineItemValue('item','item');
	previousInterfaces = nlapiGetCurrentLineItemValue('item','custcol_trial_interface_ids');
	// Disable the Item field if the row already has an ID (it has been created) AND the Oppty record has already been created
	// WSR - Added to prevent users switching the items in rows that already exist
	if ( nlapiGetCurrentLineItemValue('item', 'line') != '' && nlapiGetFieldValue('id') != '')
	{
		nlapiDisableLineItemField('item','item',true);
	}

	if (submittedFlipster == true)
	{ 	// It's  a submitted Flipster Order
		nlapiDisableLineItemField('item','custcol_trial_enabled',true);
		nlapiDisableLineItemField('item','custcol_trial_begin',true);
		nlapiDisableLineItemField('item','custcol_trial_end',true);
		nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
	}
	else // It's NOT a submitted Flipster Order
	{	
		if(trialEnabled())
		{	// This Item is already on Trial - lock Trial fields from additional modification
			nlapiDisableLineItemField('item','custcol_trial_enabled',true);	
			nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
			nlapiDisableLineItemField('item','custcol_trial_end', true);		
		}
		else	// it isn't already on Trial
		{	// unlock Trial checkbox field
			nlapiDisableLineItemField('item','custcol_trial_enabled',false);
			nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
			nlapiDisableLineItemField('item','custcol_trial_end',true);			
		}
	}
}



// OPPTY validate line item function
function opptyValidateLine(type)
{	
	// Suppress "amount does not equal qty * rate" messages by setting rate = amount/qty
	var qty = Number(nlapiGetCurrentLineItemValue('item','quantity'));
	var amt = Number(nlapiGetCurrentLineItemValue('item','amount'));
	var rate = 0;
	if (!isNaN(qty) && qty !=0)
	{
		rate = amt/qty;
	}
	nlapiSetCurrentLineItemValue('item','rate',rate,false, true);
	
	var okToSave = true


	// WSR 2014-03-28 Add Item-level Expected Close Date (5)
	// WSR - If Item Expected Close Date is empty - set it to the header Expected Close Date
	var item_expected_close = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_expected_close');
	if (item_expected_close == '' || item_expected_close == null)
	{
		var header_close = nlapiGetFieldValue('expectedclosedate');
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_expected_close', header_close, false, true);		
	}

	// WSR - If Line Item Status is empty - set it to the Entity Status		
	var item_status = nlapiGetCurrentLineItemValue('item','custcol_oppty_item_status');	
	if (item_status == '' || item_status == null)
	{				
		var header_status = nlapiGetFieldValue('entitystatus');	
		if (header_status == 7) 
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 1, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.01', true, true);
		}
		else if (header_status == 18)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 2, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.25', true, true);			
		}
		else if (header_status == 10)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 3, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.50', true, true);
		}
		else if (header_status == 15)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 4, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.90', true, true);
		}
		else if (header_status == 25)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 5, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.95', true, true);
		}
		else if (header_status == 22)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 6, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '0', true, true);
		}
		else if (header_status == 26)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 7, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '1', true, true);
		}
	}

// validate line function

	// WSR Required fields
	if (nlapiGetCurrentLineItemValue('item', 'item') != '')
	{	
		// New Renewal Required
		if ( nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_new_renewal') == '' || nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_new_renewal') == null )
		{
			alert('You must select New or Renewal for this Item');
			okToSave = false;
		}
		// Item Status required
		if ( nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_status') == '' || nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_status') == null )
		{
			alert('You must select an Item Status for this Item');
			okToSave = false;
		}	
		// 2016-01-22 No $'s should ever be allowed to be added to the Flipster K-8 Trial Item
		var flpk8trial = '6165'
		// PRODUCTION CODE ONLY
		if ( nlapiGetCurrentLineItemValue('item', 'item') == flpk8trial )
		{
			if (nlapiGetCurrentLineItemValue('item', 'amount') != '0.00')
			{
				alert('You cannot add dollars to the Flipster K-8 Trial Item');
				okToSave = false;
			}
		}
	}

	// if this isn't a brand new Flipster Opportunity...
	if (nlapiGetRecordId() != null && nlapiGetRecordId() != '')
	{
		// 2016-01-22 Don't allow addition of Flipster Item if the Flipster Item already exists
		if (nlapiGetCurrentLineItemValue('item', 'item') == '4547' && nlapiGetCurrentLineItemValue('item', 'id') == '')
		{
			alert('Only one instance of the Flipster (flipster) item is allowed for automated Flipster order processing purposes');
			return false;	
		}
	}

// validate line function

	// TRIALS:  validate date data, prompt user with errors if necessary
	if(trialEnabled())
	{		
		var beginDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_trial_begin'));
		var endDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_trial_end'));
		var today = new Date();
		today.setHours(0,0,0,0);
		
		if(beginDate > endDate)
		{
			alert('Error:  Trial end date must be greater than trial begin date.');
			okToSave = false;
		}
		// if End date is not same as the Previous End Date AND end date is less than today
		else if( (endDate < today) && (previousEndDate != nlapiGetCurrentLineItemValue('item','custcol_trial_end')) )
		{
			alert('Error:  Trial end date can not occur in the past.  To end a trial now, please enter today as the end date.');
			okToSave = false;
		}
		else if(endDate > nlapiAddDays(beginDate,365))
		{
			alert('Error:  Trial end date can not be greater than 365 days from begin date.');
			okToSave = false;
		}
		
		if( (nlapiGetCurrentLineItemValue('item','custcol_trial_interface_names') == null) || (nlapiGetCurrentLineItemValue('item','custcol_trial_interface_names') == "" ))
		{
			alert('Error:  Trial must have at least one interface selected.');
			okToSave = false;
		}
		
		// Flipster - New Trial-Extension-Not-Allowed code -- if over Maximum Trial Days Then error
		var max_days = nlapiGetCurrentLineItemValue('item', 'custcol_sourced_max_trial_days');
		if (max_days != '' && max_days != null)
		{
			if (endDate > nlapiAddDays(beginDate, max_days))
			{
				alert('Error: There is a '+max_days+' day limit for this item to be on Trial. Please change the Trial End Date to a value within the limit');
				okToSave = false;
			}
		}		
		
		// If Item is different than the Original Item
		if (previousItem != nlapiGetCurrentLineItemValue('item','item'))
		{
			alert('Error: Once a trial is enabled, the item cannot change.  To create another trial, please add a new item to this opportunity.');
			okToSave = false;
		}	
	}
	
// validate line function	
	if(okToSave)
	{
		// TRIALS:  If modification to the End date OR Interfaces OR email status
		// Set isUpdated, set UpdatedBy, put the ItemId's into UpdatedItems field
		if( trialEnabled() && ( (nlapiGetCurrentLineItemValue('item','custcol_trial_enabled') != previousTrialState ) || (nlapiGetCurrentLineItemValue('item','custcol_trial_end') != previousEndDate ) || (nlapiGetCurrentLineItemValue('item','custcol_trial_interface_ids') != previousInterfaces)) )	
		{
			nlapiSetFieldValue('custbody_isupdated','T');
			nlapiSetFieldValue('custbody_updatedby',nlapiGetUser());
			
			var itemId = nlapiGetCurrentLineItemValue('item','item');
			var delimiter = ',';
			
			// grab the current selected interface name and ID
			var updatedItems = nlapiGetFieldValue('custbody_updateditems');
			
			// separate name and ID strings into an array
			updatedItemsArray = new Array();
			if (updatedItems != '' && updatedItems != null)
			{
				updatedItemsArray = updatedItems.split(delimiter);
			}
			var found = false;
			
			// traverse the ID array
			for(i in updatedItemsArray)
			{
				// flag found if current selection matches an item in the array
				if(updatedItemsArray[i] == itemId)
				{
					found = true;
				}
			}
			// if not found, push
			if(!found)
			{
				updatedItemsArray.push(itemId);
			}
			// save the new strings to the item fields
			nlapiSetFieldValue('custbody_updateditems',updatedItemsArray.join(delimiter));
		}
		return(true);
	}
	else
	{
		return(false);
	}
}


// TRIALS:  this function checks to see if the current line item is flagged for trial
function trialEnabled()
{
	if(nlapiGetCurrentLineItemValue('item','custcol_trial_enabled') == 'T' )
	{
		return(true);
	}
	else
	{
		return(false);
	}
}

// TRIALS:  check to see if the item machine has any trials
// 2016-02-09 - only those that are ACTIVE Trials qualify - added End Date criterion
// 2016-02-09 - Also count how many ACTIVE Trials here
function hasTrials()
{
	var hasTrials = false;
	trialCount = 0;
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		var trial_checked = nlapiGetLineItemValue('item','custcol_trial_enabled',k);
		if (trial_checked == 'T')
		{
			var trial_end = nlapiGetLineItemValue('item','custcol_trial_end', k);
			var today = new Date();
			today.setHours(0,0,0,0);
			// get difference in seconds
			var diff_seconds = nlapiStringToDate(trial_end) - today;
			// convert seconds into days
			var SecToDays = 1000 * 60 * 60 * 24;
			// Calculate Trial End minus Today's Date
			var daysDiff = diff_seconds / SecToDays;
			if( trial_checked == 'T' && daysDiff > 1)
			{
				hasTrials = true;
				trialCount = trialCount + 1;
			}
		}
	}
	return(hasTrials);
}


// TRIALS:  function for buttons to trials
function opptyEndTrials()
{
	// create a date for today
	var today = new Date();
	today.setHours(0,0,0,0);
	// updated items array
	updatedItemsArray = new Array();
	var delimiter = ',';

	// traverse the item machine looking for current trial items (endDate >= today)
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		if( nlapiGetLineItemValue('item','custcol_trial_enabled',k) == 'T' && nlapiStringToDate(nlapiGetLineItemValue('item','custcol_trial_end',k)) > today )
		{	// if found push onto array
			updatedItemsArray.push(nlapiGetLineItemValue('item','item',k));
			{
				nlapiSetLineItemValue('item','custcol_trial_end',k,nlapiDateToString(today));
			}				
		}
	}
	if(updatedItemsArray.length > 0)
	{
		// if any trial items were found, populate the updateditems string
		nlapiSetFieldValue('custbody_updateditems',updatedItemsArray.join(delimiter));
		// send email to false for an end update
		nlapiSetFieldValue('custbody_send_email','F');
		alert(updatedItemsArray.length + ' trial(s) set to end today.  Please save your opportunity to continue.');
		nlapiSetFieldValue('custbody_isupdated','T');
		showEndTrialMessage = true;
	}
}


// TRIALS:  function for buttons to resubmit trials
function opptyResubmitTrials()
{
	// create a date for today
	var today = new Date();
	today.setHours(0,0,0,0);
	// updated items array
	updatedItemsArray = new Array();
	var delimiter = ',';

	// traverse the item machine looking for current trial items (endDate >= today)
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		if( nlapiGetLineItemValue('item','custcol_trial_enabled',k) == 'T' && nlapiStringToDate(nlapiGetLineItemValue('item','custcol_trial_end',k)) > today )
		{
			// if found push onto array
			updatedItemsArray.push(nlapiGetLineItemValue('item','item',k));
		}
	}

	if(updatedItemsArray.length > 0)
	{
		// if any trial items were found, populate the updateditems string
		nlapiSetFieldValue('custbody_updateditems',updatedItemsArray.join(delimiter));
		// send email to true for a resubmit update
		nlapiSetFieldValue('custbody_send_email','T');
		alert(updatedItemsArray.length + ' trial(s) set to resubmit.  Please save your opportunity to continue.');
		nlapiSetFieldValue('custbody_isupdated','T');
	}
	else
	{
		alert('Error:  No current trials found.');
	}	
}


// WSR -  Full Re-write
function opptyUpdateBodyCalcs()
{	//alert('opptyUpdateBodyCalcs() function is going to run next - but commented out');
	var exRate = Number(nlapiGetFieldValue('custbody_exchange_rate'));
	var usProjected = 0;
	var fProjected = 0;
	var usWeighted = 0;
	var fWeighted = 0;

	// WSR calculate Header-Level US Projected and NonUSD Projected
	// WSR Also calculate Weighted Totals
	var lineCount = nlapiGetLineItemCount('item');
	for (var y = 1; y <= lineCount; y++)
	{	// Only add Item Amount fields to Projected (header fields) if Item Probability is not zero
		var item_probability = Number(nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', y));
		if (item_probability != '0' )
		{
			usProjected = Number(usProjected) + Number(nlapiGetLineItemValue('item', 'amount', y));
			fProjected = Number(fProjected) + Number(nlapiGetLineItemValue('item', 'custcol_foreign_amount', y));
			usWeighted = Number(usWeighted) + Number(nlapiGetLineItemValue('item', 'custcol_oppty_item_weighted_usd', y));
			fWeighted = Number(fWeighted) + Number(nlapiGetLineItemValue('item', 'custcol_oppty_item_weighted_foreign', y));
		}
	}
	nlapiSetFieldValue('custbody_projected_total_usd', usProjected, false);
	nlapiSetFieldValue('custbody_foreign_projected', fProjected, false);	
	nlapiSetFieldValue('custbody_usd_weighted', usWeighted, false);
	nlapiSetFieldValue('custbody_foreign_weighted', fWeighted, false);	

	// WSR Calculate % Change Values
	var fChange = 0;
	var usChange = 0;		
	var usPrev = Number(nlapiGetFieldValue('custbody_previous_usd'));
	var fPrev = Number(nlapiGetFieldValue('custbody_previous_foreign'));

	// calculate % foreign change (if Foreign Previous is not null and non zero)
	if (!isNaN(fPrev) && fPrev !=0)
	{
		fChange = Math.round( ((fProjected - fPrev) / fPrev) * 100 * 10) / 10;
		fChange = opptyFormatPercentChange(fChange);
		nlapiSetFieldValue('custbody_change_foreign',fChange);
	}
	// calculate % US change (if USD Previous is not null and non zero)
	if (!isNaN(usPrev) && usPrev !=0)
	{
		usChange = Math.round( ((usProjected - usPrev) / usPrev )* 100 * 10) / 10;
		usChange = opptyFormatPercentChange(usChange);
		nlapiSetFieldValue('custbody_change_usd',usChange);
	}
}


// FOREIGN CURRENCY - Formats the percent change value
function opptyFormatPercentChange(value)
{
	if(value > 0) value = '+'+value+'%';
	else if (value < 0) value = value +'%';
	else value = null;
	return(value);
}

function removeItem()
{
		// 03-06-2012 Validate that you have same Number of Trial Items (or more) 
		// as you did when record was when form loaded -- users can add more trial items but can't remove trial items		
		if (nlapiGetCurrentLineItemValue('item', 'custcol_trial_enabled') == 'T')
		{
			alert('Sorry, you cannot remove a Trial item from this Opportunity.  You can set the Trial End Date to today\'s date if you would like to remove the Trial from this Customer.');
			return false;
		}
		// 2016-01-22 - do not allow removal of the Flipster (flipster) Item		
		if ( nlapiGetCurrentLineItemValue('item', 'item') == '4547')
		{	// count how many flipster Items there are in the Opportunity
			var total_flipster_items = 0;
			for (e = 1; e <= nlapiGetLineItemCount('item'); e++)
			{
				var this_item = nlapiGetLineItemValue('item', 'item', e);
				if (this_item == '4547')
				{
					total_flipster_items = total_flipster_items+1;	
				}
			}	
			if (total_flipster_items == 1)
			{
				alert('The Flipster Order process relies on this item being in the Flipster Opportunity. It cannot be removed.');
				return false;
			}
		}
		
		return true;
}


// 2014-03-28 Add Item-level Expected Close Date(6)
function setItemExpectedClose(newExpectedClose, ExpectedCloseOnLoad, showMessage)
{	// Ask User to confirm change
	if (showMessage)
	{
		var e = confirm('You have chosen to update the Expected Close Date for all Open Items in this Opportunity. Select \'OK\' to continue, \'Cancel\' to go back');
	}
	else // expected close is set upon load don't ask user to confirm 
	{	// just set e = true to engage code
		e = true;
	}
	// code to set Item Level Expected Close Date
	if (e == true)
	{	// cancel the current line item
		nlapiCancelLineItem('item');
		var lineCount = nlapiGetLineItemCount('item');
		for (var w = 1; w <= lineCount; w++)
		{	// only change it for Open Items
			var curItemStatus = nlapiGetLineItemValue('item', 'custcol_oppty_item_status', w);
			var isItemOpen = true;
			// Item Status of 6 or 7 is a Closed Item
			if (curItemStatus == 6 || curItemStatus == 7)
			{
				isItemOpen = false;	
			}
			if (isItemOpen == true)
			{
				nlapiSetLineItemValue('item', 'custcol_oppty_item_expected_close', w, newExpectedClose);
			}
		}
	}
	else
	{
		nlapiSetFieldValue('expectedclosedate', ExpectedCloseOnLoad, false);		
	}
}

function setItemStatus(newOpptyStatus, OpptyStatusOnLoad)
{	// Ask User to confirm Change	
	var c = confirm('You have chosen to update the status of items in this Opportunity. All items that are NOT currently \'Repeated Item for Quote - No Volume\' will be updated to the new status.  Select \'OK\' to continue, \'Cancel\' to go back');
	if (c == true)
	{	// cancel the current line item
		nlapiCancelLineItem('item');
		var lineCount = nlapiGetLineItemCount('item');
		for (var w = 1; w <= lineCount; w++)
		{	// WSR - When changing the Header Oppty Status - set all non-Repeat Item statuses to Header Status
			// also set the Item Probability 
			if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_status', w) != 8)
			{
				if (newOpptyStatus == 7) 
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 1);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '.01');
				}
				else if (newOpptyStatus == 18)
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 2);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '.25');
				}
				else if (newOpptyStatus == 10)
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 3);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '.50');
				}
				else if (newOpptyStatus == 15)
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 4);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '.90');
				}
				else if (newOpptyStatus == 25)
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 5);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '.95');
				}
				else if (newOpptyStatus == 22)
				{	// is Closed-Lost
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 6);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '0');
					// Need to insert Item Close Date
					var myDate = new Date();
					var stringDate= nlapiDateToString(myDate);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_close_date', w, stringDate);
				}
				else if (newOpptyStatus == 26)
				{	// is Closed-Won
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 7);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '1');
					// Need to insert Item Close Date
					var myDate = new Date();
					var stringDate= nlapiDateToString(myDate);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_close_date', w, stringDate);
				}
				// WSR set Item Weighted Amount USD
				var usAmount = Number(nlapiGetLineItemValue('item','amount',w));
				var item_probability = nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', w);
				var weighted_usd = usAmount * item_probability;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , w, weighted_usd);
				// WSR set Item Weighted Amount Non-USD
				var fAmount = Number(nlapiGetLineItemValue('item','custcol_foreign_amount',w));
				var weighted_nonusd = fAmount * item_probability;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_foreign' , w, weighted_nonusd);
				// call the function to update the Body fields
				opptyUpdateBodyCalcs();
			}		
		}
	}
	else
	{
		nlapiSetFieldValue('entitystatus', OpptyStatusOnLoad, false);	
	}
}

function opptyRecalc()
{	//alert('recalc event');
	opptyUpdateBodyCalcs(false);
}