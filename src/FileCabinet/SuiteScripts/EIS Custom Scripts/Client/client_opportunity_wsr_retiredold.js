/* ****************************************************************************************************************************** */
/* ATTENTION!! THE LIBRARY SCRIPT library_environment_script.js MUST BE USED WITH THIS WSR SCRIPT TO DETERMINE ENVIRONMENT        */
/* ****************************************************************************************************************************** */

/* Revision Log:-
 * ******************************************************************************************************************************** 
 * KMcCormack	06-02-2016	US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM
 * 									  - A new library script has been created which can be used by any form's client side script when
 * 										there is a reason for different values or logic based on the current environment.  This 
 * 										will remove the need for recoding of these values/scripts when a sandbox is refreshed and 
 * 										also when future changes are migrated from dev to QA to prod environments.
 * 
 * 										Also, global javascript values created to hold the various popup template urls that apply
 * 										to the various environments.
 * CNeale		19-12-2016	US167245	Adjustments to info. on LSD Pricing Template (now called APA Sintle Site Quote Price Template).
 * eAbramo		2017-04-04				Error related to function "epEmailIsValid" found in 2017.1. Comment out code
 *  									no sign that a function of this name has ever existed
 * eAbramo		2017-09-01	US240125	As of May/June 2017 Exchange Rates are no longer being entered into NetCRM
 * 										Therefore NetCRM no longer supports non-USD currency Opportunities
 * 										Put temporary code in place to prevent non-USD WSR Opportunities
 *  JOliver		04-19-2018 	TA247503	Updated lpu for SB1-refresh-2024-09-30 (added '_SB1' to company) and updated full URL for Preview (relating to Sandbox Re-architecture).
 *  									None of the other Sandboxes required an update (their lpu's remained the same)
 * 
 * 
 * ********************************************************************************************************************************
 */

/*Global Forms Object*/
var Forms = {
		wsr_form: 121,
		winser_form: 129
}

//alert('DEBUG: in client_opp_wsr, CurrentEnv.name = ' + CurrentEnvironment.name);

//06-02-2016  US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM - Code to set environment specific popup url
// US167245 Root relative links applied (but still different between environments!) 
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

// hasTrialsOnLoad is used to store a value from Formload and use it to compare with later when running the save function
var hasTrialsOnLoad = false;
// FOREIGN CURRENCY - used to determine previous value of currency (on FormLoad)
var previousCurrency = '';
// FOREIGN CURRENCY - currency record ID for US Dollar
var USD_ID = '5';
// Trial Access Variable gets toggled to true if the Trial Accessing Sites field is modified - if true then 
// the "Resubmit Trials function is called on Save
var trial_access_modification = false;
var real_system_gen_renewal = false;
var trialCountLoad = 0;
var trialCountSave = 0;
var OpptyStatusOnLoad = null;
// 2014-03-28 Add Item-level Expected Close Date (1)
var ExpectedCloseOnLoad = null;
var newOpptyStatus = null;
var recalc_discount_fields = true

// TRIALS:  variables used to compare line item initialization with line item validation
var previousEndDate;
var previousTrialState;
var previousItem;
var previousInterfaces = "";


// OPPTY LOAD FUNCTION
function opptyFormLoad()
{
	// FOREIGN CURRENCY --  Set Currency Code	
	var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
	// set it to USD if empty
	if (currentCurrency == null || currentCurrency == '')
	{
		// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities
		// Set it based on Default Currency Code
				// var defaultCurrency = nlapiGetFieldValue('custbody_default_currency_oppty');
				// if (defaultCurrency == '' || defaultCurrency == null)
				//	{
				defaultCurrency = USD_ID;
				//	}
		nlapiSetFieldValue('custbody_currency_code', defaultCurrency, false, true);
		currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		// 2017-09-08 US240125 - lock the currency field now
		nlapiDisableField('custbody_currency_code', true);
	}

 	// disable the Sales Order ID field and the Sales Order Link field
 	nlapiDisableLineItemField('item','custcol_salesorder_id',true);
 	nlapiDisableLineItemField('item','custcol_salesorder_link',true); 
	// WSR Disable some line item fields		
	nlapiDisableLineItemField('item', 'custcol_oppty_item_discount_percent', true);	   // Item Discount Percent
	nlapiDisableLineItemField('item', 'custcol_oppty_item_discount_amount', true);	   // Item Discount Amount
	nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_usd', true);
	nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_foreign', true);
	nlapiDisableLineItemField('item', 'custcol_renew_amount_wasprorated', true);
	nlapiDisableLineItemField('item', 'custcol_prev_item_transdate', true);
	nlapiDisableLineItemField('item', 'custcol_prev_subscription_id', true);
	nlapiDisableLineItemField('item', 'custcol_previous_usd', true);
	nlapiDisableLineItemField('item', 'custcol_previous_foreign', true);
	nlapiDisableLineItemField('item', 'custcol_oppty_item_margin', true);		   // Profit Margin
	nlapiDisableLineItemField('item', 'custcol_trial_interface_ids', true);		   // Trial Interface IDs
	nlapiDisableLineItemField('item', 'custcol_oppty_item_probability', true);
	// 2014-07-17 Flipster - Added more fields on line item to disable	
	// Needed to open fields up on form by default - now lock them down via script
	nlapiDisableLineItemField('item', 'custcol_prev_was_in_package', true);
	nlapiDisableLineItemField('item', 'custcol_prev_list_rate', true);
	nlapiDisableLineItemField('item', 'custcol_prev_sub_months', true);
	nlapiDisableLineItemField('item', 'custcol_trial_begin', true);
	nlapiDisableLineItemField('item', 'custcol_trial_end', true);
	nlapiDisableLineItemField('item', 'custcol_trial_interface_names', true);	
	// 03-13-14 Item Close Date
	nlapiDisableLineItemField('item', 'custcol_oppty_item_close_date', true);
	// 02-02-2018 Found note in WinSeR code to update WSR code
	nlapiDisableLineItemField('item', 'custcol_change_usd', true);			   // % Change USD
	nlapiDisableLineItemField('item', 'custcol_change_foreign', true);		   // % Change Non-USD
	nlapiDisableLineItemField('item', 'custcol_has_ebook_trial', true);	
	nlapiDisableLineItemField('item', 'custcol_opx_item_id', true);
	
	var fAmount = 0;
	var usAmount = 0;
	var lineCount = nlapiGetLineItemCount('item');
	
	// 2014-03-20 For two Roles (1009 and 1053) Entity Status should be set to a 1 (rather than a 2)
	// Item Status should follow suit through this code
	if ((nlapiGetRecordId() == null || nlapiGetRecordId() == '') && (nlapiGetRole() == 1009 || nlapiGetRole() == 1053))
	{
		nlapiSetFieldValue('entitystatus', 7, false, true);
	}
	OpptyStatusOnLoad = nlapiGetFieldValue('entitystatus');
	// 2014-03-28 Add Item-level Expected Close Date (2)
	ExpectedCloseOnLoad = nlapiGetFieldValue('expectedclosedate');
	
	// FOREIGN CURRENCY:  if this is not USD on load, check for new exchange rate
	if (currentCurrency != USD_ID)
	{
		// If NOT a new Opportunity then compare previous to current exchange rate -- ask user to apply current rate
		if (nlapiGetRecordId() != '' && nlapiGetRecordId() != null)
		{
			// get exchange rate on the Oppty
			var previousExRate = Number(nlapiGetFieldValue('custbody_exchange_rate'));
			// lookup the current exchange rate on the currency record
			var exRate = Number(nlapiLookupField('customrecord_currency',currentCurrency,'custrecord_currency_exchangerate'));
			// if different...
			if(previousExRate != exRate)
			{
				// if Oppty isn't closed then...
				if ((OpptyStatusOnLoad != 22) && (OpptyStatusOnLoad != 26))
				{
					// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities				
					nlapiSetFieldValue('custbody_lineitem_exrate_update_needed','F');
					alert('NetCRM no longer supports non-USD Opportunities due to invalid Exchange Rates.  Please change your Currency to USD and ensure that all USD Amounts are correct before saving your Opportunity');
					// set flag to force user to click Update Line Items button
					// nlapiSetFieldValue('custbody_lineitem_exrate_update_needed','T');
					// alert('Exchange Rate has changed from ' + previousExRate + ' to ' + exRate + '. Please click "Apply Current Exchange Rate" button.');
				}
			}
		}		
		// lock fields (Projected USD Total (custom field) on body and columns: USD Amount, Prev USD, Prev Foreign) 
		nlapiDisableField('custbody_projected_total_usd', true);
		nlapiDisableLineItemField('item','amount',true);	
		// unlock foreign item field
		nlapiDisableLineItemField('item','custcol_foreign_amount',false);
	}
	else
	{
		// It is USD Oppty - should always be 1 -- added by EAbramo 10-22-08
		if (currentCurrency == USD_ID && (previousExRate == null || previousExRate == ''))
		{
			nlapiSetFieldValue('custbody_exchange_rate', '1', false);
		}	
		// lock Foreign Item fields: Foreign Amt, prev Foreign, prev USD
		nlapiDisableLineItemField('item','custcol_foreign_amount',true);
		// unlock USD Amount fields
		nlapiDisableLineItemField('item','amount',false);
	}
	
	// set the Previous Currency variable to the current currency
	previousCurrency = currentCurrency;

// cont.  opptyFormLoad()

	// WORKAROUND #2 - calculate percent change for each line item
	for (var i = 1; i <= lineCount; i++)
	{	
		//var itemid = nlapiGetLineItemValue('item', 'item', i);
		//alert('i = '+i+' and item is: '+itemid);
		fPrev = Number(nlapiGetLineItemValue('item','custcol_previous_foreign',i));
		usPrev = Number(nlapiGetLineItemValue('item','custcol_previous_usd',i));
		
		fAmount = Number(nlapiGetLineItemValue('item','custcol_foreign_amount',i));
		usAmount = Number(nlapiGetLineItemValue('item','amount',i));
		
		fChange = 0;
		usChange = 0;
		
		// if foreign previous has a value other than zero 
		if (!isNaN(fPrev) && fPrev !=0)
		{	// Calculate Foreign % change: take foreign amount and subtract the foreign previous -- convert
			fChange = Math.round( ((fAmount - fPrev) / fPrev )* 100 * 10) / 10;
		}	
		// if USD previous has a value other than zero 
		if (!isNaN(usPrev) && usPrev !=0)
		{	// Calculate US % Change: take USD Amount and subtract the US previous -- convert
			usChange = Math.round( ((usAmount - usPrev) / usPrev )* 100 * 10) / 10;
		}		
		// Call function to format the percent change - and set the Foreign percent change column
		fChange = opptyFormatPercentChange(fChange);
		nlapiSetLineItemValue('item','custcol_change_foreign',i,fChange);
		// Call function to format the percent change - and set the USD percent change column
		usChange = opptyFormatPercentChange(usChange);
		if (usChange != null)
		{
			nlapiSetLineItemValue('item','custcol_change_usd',i,usChange);
		}

		// WSR - Load PriceBeforeDiscount if it is empty
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_amount_before_discount', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_amount_before_discount', i) == null)
		{
			if (currentCurrency != USD_ID)
			{	// Non-USD
				nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', i, fAmount);
			}
			else
			{	// its USD Currency
				nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', i, usAmount);
			}
		}


		// WSR - Load Discount Fields if Package Item and Package has Discount
		var package_id = nlapiGetLineItemValue('item', 'custcol_include_in_package', i);
		if (package_id != '' && package_id != null)
		{
			var package_discount = nlapiLookupField('customrecord_oppty_package', package_id, 'custrecord_package_discount');
			var cur_discount = Number(nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_percent', i));
			if (cur_discount == null)
			{
				cur_discount = 0
			}
			// Compare Package Discount to current discount
			if (package_discount != cur_discount)
			{	// if different set Item Discount equal to Package Discount
				nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_percent', i, package_discount);
				var pbd = Number(nlapiGetLineItemValue('item','custcol_oppty_amount_before_discount', i));
				// re-calculate dollar discount and Amount
				var newAmount = pbd * (1 - (package_discount * .01));
				var d_discount = pbd - newAmount;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', i, d_discount);		
				if (currentCurrency != USD_ID)
				{
					recalc_discount_fields = false;
					nlapiSetLineItemValue('item', 'custcol_foreign_amount', i, newAmount);
				}
				else
				{
					recalc_discount_fields = false;
					nlapiSelectLineItem('item',i);
					alert('a Package discount update is required for item '+i+'. The Amount field will be adjusted. Select OK to continue');
					nlapiSetCurrentLineItemValue('item', 'amount', newAmount, false, true);
					nlapiCommitLineItem('item');
				}
			}
			// Also if there's a Package with a Discount -- need to disable the Apply Discount to All Items field
			if (package_discount != '0' && package_discount != null && package_discount != '')	
			{	// Lock the Apply Discount to All Items field
				nlapiDisableField('custbody_apply_discount_allitems', true);
			}	
		}
		

		// WSR - Load DiscountAmount if it is empty		
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_amount', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_amount', i) == null)
		{
			nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', i, 0);	
		}	
		// WSR - Load DiscountPercent if it is empty
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_percent', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_percent', i) == null)
		{
			nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_percent', i, 0);	
		}		
		// WSR - Load Term Months if it is empty
		if ( nlapiGetLineItemValue('item', 'custcol_term_months', i) == "" || nlapiGetLineItemValue('item', 'custcol_term_months', i) == null)
		{
			nlapiSetLineItemValue('item', 'custcol_term_months', i, 12);
		}
		// WSR - Load New Renewal if it is empty
		if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_new_renewal', i) == "" || nlapiGetLineItemValue('item', 'custcol_oppty_item_new_renewal', i) == null)
		{
			nlapiSetLineItemValue('item', 'custcol_oppty_item_new_renewal', i, 1);	
		}		
// cont.  opptyFormLoad()

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
			if (currentCurrency != USD_ID)
			{	//Non-USD
				var weighted_nonusd = fAmount * item_probability;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_foreign', i, weighted_nonusd);
				var weighted_usd = usAmount * item_probability;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , i, weighted_usd);
			}
			else
			{	//USD
				var weighted_usd = usAmount * item_probability;
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , i, weighted_usd);
			}
		}		
	}

// cont.  opptyFormLoad()

	// WSR Load the Terms and Conditions field if empty - and set Mktg description on Quote field to True
	if (nlapiGetFieldValue('custbody_quote_terms_conditions') == '' || nlapiGetFieldValue('custbody_quote_terms_conditions') == null )
	{
		nlapiSetFieldValue('custbody_quote_terms_conditions', 'Terms and Conditions: Prices for EBSCO proprietary databases include unlimited local and remote access (for authorized users of the institution).\r \rEBSCO Publishing price quotations are strictly prohibited from being placed on a library\'s homepage or anywhere else on the World Wide Web.\r \rPayment terms net 30 days.  Prices are subject to tax, if applicable.\r \rEDS pricing is contingent upon the customer supplying catalog data to EBSCO in MARC record format');
		nlapiSetFieldValue('custbody_show_mktg_onquote', 'T', false);
	}
	// WSR set Default Language to English if no Language set
	if ( nlapiGetFieldValue('custbody_quote_language') == '' || nlapiGetFieldValue('custbody_quote_language') == null)
	{
		nlapiSetFieldValue('custbody_quote_language', '1');
	}
	// WSR set Quote Expire Days to 90, if Quote Expire isn't set
	if ( nlapiGetFieldValue('custbody_quote_expire_days') == '' || nlapiGetFieldValue('custbody_quote_expire_days') == null)
	{
		nlapiSetFieldValue('custbody_quote_expire_days', '90');
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
		
				
		// WSR - lock the Include in Package field
		nlapiDisableLineItemField('item', 'custcol_include_in_package',true);

		// 2013-11-11 If new Oppty then open up EP Marketing Campaign Field
		nlapiDisableField('custbody_ep_mktg_campaign', false);
		
		// 02-14-2013 If new Oppty is clone of System Generated (Renewal Loaded) oppty clear System Generated fields
		if (nlapiGetUser() != '452592' && nlapiGetUser() != '808840') // User is not Web Service
		{
			nlapiSetFieldValue('custbody_leadsource', '');
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
	}
	// End code if New Opportunity
	// Flipster: if NOT a new Opportunity then lock down the Custom Form field (if not an Administrator)
	else if (nlapiGetRole() != 3)
	{
		nlapiDisableField('customform', true);	
	}	
	
// cont. opptyFormLoad()	

	// Load the custbody_oppty_internal_id (Duplicated Oppty ID field) used for WSR to filter the Include In Package DropDown list
	if (nlapiGetFieldValue('custbody_oppty_internal_id') == '' || nlapiGetFieldValue('custbody_oppty_internal_id') == null)
	{
		nlapiSetFieldValue('custbody_oppty_internal_id', nlapiGetFieldValue('id'));		
	}

	// Subs Merge Code Added 10-2013:  Search to find Revenue Year
	if (nlapiGetFieldValue('custbody_subs_revenue_year') == '' || nlapiGetFieldValue('custbody_subs_revenue_year') == null)
	{	// for some reason we get errors if we don't convert field to date first then secondly convert it to string
		var ecDate = nlapiDateToString(nlapiStringToDate(nlapiGetFieldValue('expectedclosedate')));
		var rev_filters = new Array();
		rev_filters[0] = new nlobjSearchFilter('custrecord_fiscal_year_start', null, 'onorbefore', ecDate);
		rev_filters[1] = new nlobjSearchFilter('custrecord_fiscal_year_end', null, 'onorafter', ecDate);
		var rev_columns = new Array();
		rev_columns[0] = new nlobjSearchColumn('internalid', null, null); // name
		// Execute my search.
		rev_searchResults = nlapiSearchRecord('customrecordfiscal_year', null, rev_filters, rev_columns);
		if (rev_searchResults)
		{
			for (var x=0; rev_searchResults != null && x < rev_searchResults.length; x++ )
			{
				var rev_year = rev_searchResults[x].getValue('internalid');
				nlapiSetFieldValue('custbody_subs_revenue_year', rev_year);
			}	
		}
	}

	// 2013-11-11 If Role is Marketing enable the EP Marketing Campaign field (1008 and 1009 are Mktg roles
	// role 1007 is Sales Admin and 3 is Admin
	var role = nlapiGetRole();
	if (role == '1008' || role == '1009' || role == '1007' | role == '3')
	{
		nlapiDisableField('custbody_ep_mktg_campaign', false);
	}

	// Flag if this is REAL System Generated Oppty - and disable Lead Source field
	if (nlapiGetFieldValue('custbody_leadsource') == '18')
	{
		nlapiDisableField('custbody_leadsource',true);
		// also set a variable - USED IN FORM SAVE 
		// allow SAVE if form is loaded w/ LeadSource of 'System Generated Renewal' - otherwise give user error
		real_system_gen_renewal = true;
	}
	
	// TRIALS:  on load, look for existing items on trial.  If found, disable the trial group field
	// also set the has TrialsOnLoad variable
	if(hasTrials())
	{
		hasTrialsOnLoad = true;
		nlapiDisableField('custbody_trial_group',true);
		
		// get the count of Trial Items -- Make sure you don't have less if removing an item
		for (t=1; t <= nlapiGetLineItemCount('item'); t++)
		{	// get number of line items on Trial
			if(nlapiGetLineItemValue('item','custcol_trial_enabled', t) == 'T')
			{
				trialCountLoad = trialCountLoad + 1;
			}
		}					
	}
	else
	{
		hasTrialsOnLoad = false;
	}
}
// end form Load function


// OPPTY SAVE FUNCTION
function opptyFormSave()
{	
	// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities	
	// require user to click Update Line Items button
//		if( nlapiGetFieldValue('custbody_lineitem_exrate_update_needed') == 'T')
//		{
//			alert('Please click "Apply Current Exchange Rate" button before saving');
//			return false;
//		}	
	

	// 03-04-2008 Require at least one line item
	if( nlapiGetLineItemCount('item') < 1)
	{
		alert("You must enter at least one item for this opportunity.");
		return false;
	}
	
	// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities
	// US240125 - if not USD make user change to USD
	if (nlapiGetFieldValue('custbody_currency_code') != '5')
	{
		alert('NetCRM no longer supports non-USD Opportunities due to invalid Exchange Rates.  Please change your Currency to USD and ensure that all USD Amounts are correct before saving your Opportunity');
		return false;
	}
	
	// 11-23-10 Do Not Allow EP Lead Source of "System Generated Renewal" if it's not already set to that upon load
	if ( real_system_gen_renewal == false && nlapiGetFieldValue('custbody_leadsource') == '18')
	{
		alert('You will not be able to save until you change the Lead Source to something OTHER than System Generated Renewal.');
		return false;
	}
	
	// 2015-09-11 Don't allow User to choose WinSeR Opportunity Type - US39208
	var oppty_type = nlapiGetFieldValue('custbody1');
	if (oppty_type == '12' || oppty_type == '13'|| oppty_type == '14')	
	{
		alert('Please choose another Opportunity Type.  WinSeR Opportunity Types are not allowed');
		return false;
	}


	// WSR - If Oppty Type isn't "Temp Access" and isn't "Group Purchase" 
	// 	AND all Items are Closed Lost 	Require at least one Reason Lost
	if (nlapiGetFieldValue('custbody1') != '5' && nlapiGetFieldValue('custbody1') != '6')
	{
		var all_lost = true;
		for ( r = 1; r <= nlapiGetLineItemCount('item'); r++)
		{
			if (nlapiGetLineItemValue('item', 'custcol_oppty_item_status', r) != 6 && nlapiGetLineItemValue('item', 'custcol_oppty_item_status', r) != 8)
			{	// if an Item is NOT Closed-Lost change - break
				all_lost = false;
				break;
			}
		}
		if (all_lost == true)
		{	// now - require at least one Reason Lost (checkbox field)
			if ( nlapiGetFieldValue('custbody_rl_functionality_ep_lacks') == 'F'
				&& nlapiGetFieldValue('custbody_rl_other') == 'F'
				&& nlapiGetFieldValue('custbody_rl_business_model_eb') == 'F'
				&& nlapiGetFieldValue('custbody_rl_staying_w_epdbs') == 'F'
				&& nlapiGetFieldValue('custbody_rl_staying_w_competitor') == 'F'
				&& nlapiGetFieldValue('custbody_rl_switch_to_competitor') == 'F'
				&& nlapiGetFieldValue('custbody_rl_price') == 'F'
				&& nlapiGetFieldValue('custbody_rl_content') == 'F'
				&& nlapiGetFieldValue('custbody_rl_lackofuse') == 'F'
				&& nlapiGetFieldValue('custbody_rl_false_lead') == 'F'
				&& nlapiGetFieldValue('custbody_rl_duplicate_oppty') == 'F'
				&& nlapiGetFieldValue('custbody_rl_budget') == 'F'
				&& nlapiGetFieldValue('custbody_rl_library_closed') == 'F' 
				&& nlapiGetFieldValue('custbody_rl_tech_diff_service') == 'F'  
				&& nlapiGetFieldValue('custbody_rl_contact_gone') == 'F' 
				&& nlapiGetFieldValue('custbody_rl_company_merger') == 'F' 
				&& nlapiGetFieldValue('custbody_rl_site_closed') == 'F'
				&& nlapiGetFieldValue('custbody_rl_upgrade') == 'F')
			{
				alert('All Items in your Opportunity are Closed-Lost and your Opportunity is not Type \'Temporary Access\' or \'Part of Group Purchase\'.  You must visit the Reason Lost section and select at least one Reason Lost checkbox');
				return false;
			}	
		}
	}	
// cont. opptyFormSave()

	// Require Explanation for three Reason Lost checkboxes
		// other
		if ( nlapiGetFieldValue('custbody_rl_other') == 'T' && (nlapiGetFieldValue('custbody_rl_other_explanation')== '' || nlapiGetFieldValue('custbody_rl_other_explanation')== null) )
		{
			alert('If you checked \'Other\' as a Reason Lost, please complete \'Explanation of Other Reason Lost\'');
			return false;
		}
		// Functionality (EP Lacks)
		if ( nlapiGetFieldValue('custbody_rl_functionality_ep_lacks') == 'T' && (nlapiGetFieldValue('custbody_rl_functionality_explanation')== '' || nlapiGetFieldValue('custbody_rl_functionality_explanation')== null) )
		{
			alert('If you checked \'Functionality (EP Lacks)\' as a Reason Lost, please complete \'Explanation of Lacking Functionality\'');
			return false;
		}
		// Service/Technical Difficulties
		if ( nlapiGetFieldValue('custbody_rl_tech_diff_service') == 'T' && (nlapiGetFieldValue('custbody_rl_service_techdiff_explanati')== '' || nlapiGetFieldValue('custbody_rl_service_techdiff_explanati')== null) )
		{
			alert('If you checked \'Service/Technical Difficulties\' as a Reason Lost, please complete \'Explanation of Service/Tech Difficulties \'');
			return false;
		}	

		
	// WSR Fix -- remove this code at formSave Level and put down into Item Validation level	
	// If role is Not Sales Administrator and if Opportunity Status is not 1-Qualify (7), 2-Develop (18), 7-Closed - Lost (22), 8-Closed - Won (26)
		// Require $'s in at least one Item 
/*
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
*/
		
// cont. opptyFormSave()		
	// 2009-11-10 Warn User about Special Trial Situations
	var this_item = null;
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		// hard-coded the item ID's to look for
		this_item = nlapiGetLineItemValue('item', 'item', k);
		if (	
		(this_item == '2301' || // A- Z
		this_item == '2314' ||
		this_item == '2337' ||
		this_item == '861' || // Business Book Summaries
		this_item == '2343' ||
		this_item == '479' ||  // COIN
		this_item == '480' ||
		this_item == '481' ||
		this_item == '377' || // Content Cafe
		this_item == '2192' || // EBSCO Discovery Service
		this_item == '932' ||  // EhIS
		this_item == '2333' ||
		this_item == '2344' ||
		this_item == '2177' ||  // LinkSource
		this_item == '2338' || 
		this_item == '435' ||  // NextReads
		this_item == '680' ||  // Novelist Select
		this_item == '2303' ||     
		this_item == '2187' || // RIPM ONLINE
		this_item == '383' || // HEALTH  LIBRARY Items
		this_item == '387' ||
		this_item == '388' ||
		this_item == '706' ||
		this_item == '2406' ||
		this_item == '2407' ||
		this_item == '2408' ||
		this_item == '2827' ||
		this_item == '2828' ||
		this_item == '2948') && nlapiGetFieldValue('custbody_special_trial') == '')
		{
			//alert ('the SpecialTrialPossible flag is true');
			if (!confirm('At least one of the items in your Opportunity may require special Trial setup.  If this Opportunity is NOT a Trial click OK to continue, if the Opportunity is a trial for this \'non-Admin\' item, select Cancel to return to the Opportunity and designate your Opportunity as a trial by using the Special Trial field'))
			{
				return false;
			}
			break;
		}
	}	

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

		
// cont. opptyFormSave()
	// WSR - If more than one of same Item in Oppty - only one can have Item Status with probability that is NOT zero 
	// create two arrays - array 1 to inspect individual Item, array 2 is used to compare others to item in array 1
	var w_items_1 = new Array();
	var w_items_2 = new Array();	
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{	
		w_items_1[k] = nlapiGetLineItemValue('item', 'item', k);
		w_items_2[k] = nlapiGetLineItemValue('item', 'item', k);
	}
	// Double loop to compare weighted items to eachother
	for ( w1 = 1; w1 <= w_items_1.length; w1++)
	{
		// WSR fix 02-14 - but only if Item is not "eBook Content Purchase Custom Order" (ID = 2425)
		// Also if Item is NOT "eAudiobook Purchase Custom Order (eapco)" (ID = 2500)
		if (nlapiGetLineItemValue('item', 'item', w1) != '2425' && nlapiGetLineItemValue('item', 'item', w1) != '2500')
		{
			// but Only if Item probability is not zero
			if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', w1) != '0' )
			{
				var ComparisonItem = nlapiGetLineItemValue('item', 'item', w1);
				// alert ('The ComparisonItem is: ' +ComparisonItem);
				for ( w2 = 1; w2 <= w_items_2.length; w2++)
				{	// Only Do comparison for items with a non-zero probability
					if ( nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', w2) != '0' )
					{
						var w2Item = nlapiGetLineItemValue('item', 'item', w2);
						// alert('w2Item is: ' +w2Item);
						if (w1 != w2 && ComparisonItem == w2Item)					
						{
							var CompItemName = nlapiLookupField('item', ComparisonItem, 'name', false)
							alert('You have more than one of the item '+CompItemName+' in this Opportunity with an item status counting towards Weighted dollars. Please set your Item Status to \'Repeat Item\' for all but one of these in order to prevent double/triple counting toward sales projections.');
							return false;						
						}
					}
				}
			}
		}
	}

	//********************************************************************
	// WSR - Package Validation
	// All Items within a Package must have same Discount Amount
	// All Items within a Package must be unique
	var unique_packages = new Array();
	var u = 0;	
	for (p = 1; p <= nlapiGetLineItemCount('item'); p++)
	{	//Create Array of Unique Packages with the Package ID's	
		var this_package = nlapiGetLineItemValue('item', 'custcol_include_in_package', p);
		if (this_package != '' && this_package != null)	
		{
			if (u == 0)
			{	// first iteration - just load into the array
				u = u+1;
				unique_packages[u] = this_package;
			} 
			else
			{
				if (unique_packages[u] != this_package) 
				{
					u = u+1;
					unique_packages[u] = this_package;
					// alert('u is '+u+'. unique_packages[u] is '+unique_packages[u]);
				}
			}
		}
	}		
// cont. opptyFormSave()	
	var packages = new Array();
	var p_items = new Array();
	var p_discounts = new Array();
	var p2_items = new Array();
	var p2_discounts = new Array();		
	// For each Unique package, iterate through Items and populate arrays with values
	// 	also applying 'na' where appropriate (non-packages or different Packages)
	for (up = 1; up <= u; up++)
	{
		// Create new arrays to store the Item ID and the Discount percent	
		// alert('U Loop: the value for unique_packages '+up+' is: '+unique_packages[up]);
		for (p2 = 1; p2 <= nlapiGetLineItemCount('item'); p2++)
		{
			var this_package2 = nlapiGetLineItemValue('item', 'custcol_include_in_package', p2);
			//alert('p2 Loop begins now where p2 = '+p2+ '. this_package2 is: '+this_package2);
			if (this_package2 != '' && this_package2 != null)	
			{	
				packages[p2] = this_package2;
				//alert('Package found and stored in packages[p2] variable.  It is '+packages[p2]);
				if (packages[p2] == unique_packages[up])
				{	// Load the Arrays for comparison to eachother
					p_items[p2] = nlapiGetLineItemValue('item', 'item', p2);
					p2_items[p2] = nlapiGetLineItemValue('item', 'item', p2);		
					p_discounts[p2] =  nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_percent', p2);
					p2_discounts[p2] = nlapiGetLineItemValue('item', 'custcol_oppty_item_discount_percent', p2);
					//alert('This matches Unique Package. Setting four variables.  p_items[p2] is: '+p_items[p2]+', and p_discounts[p2] is '+p_discounts[p2]);
				}
				else
				{	// If it is a package but not the Unique package, set variables to 'na'
					p_items[p2] = 'na';
					p2_items[p2] = 'na';		
					p_discounts[p2] = 'na';
					p2_discounts[p2] = 'na';
					//alert('This Doesnt match Unique Package. p_items[p2] is: '+p_items[p2]+', and p_discounts[p2] is '+p_discounts[p2]);	
				}
			}
			else
			{	// No package set p2 variable to 'na'
				// alert('No Package where p2 = '+p2+'.  Setting four variables to na');
				p_items[p2] = 'na';
				p2_items[p2] = 'na';		
				p_discounts[p2] = 'na';
				p2_discounts[p2] = 'na';
			}
		}
		// Run through the packages array AGAIN and this time make comparisons to eachother
		for (p3 = 1; p3 <= nlapiGetLineItemCount('item'); p3++)
		{	
			var comparison_item_a = p_items[p3];
			var comparison_discount_a = p_discounts[p3];
			//alert('p3 Loop begins now where p3 = '+p3+'. Comparison_item_a is '+comparison_item_a+'. Comparison_discount_a is '+comparison_discount_a);
			// Only run comparison if the Item is Relevent to UniquePackage
			if (comparison_item_a != 'na' && comparison_discount_a != 'na')
			{
				for ( c = 1; c <= nlapiGetLineItemCount('item'); c++ )
				{	//alert('c Loop begins now where c = '+c);						
					var p3_item = p2_items[c];
					var p3_discount = p2_discounts[c];
					//alert('NonComparison item p3_item is '+p3_item+ ' Noncomparison p3_discount is '+p3_discount);
					if (p3_item != 'na' && p3 != c && comparison_item_a == p3_item)					
					{
						var CompItemName_a = nlapiLookupField('item', comparison_item_a, 'name', false);
						var unique_package_name = nlapiLookupField('customrecord_oppty_package', unique_packages[up], 'name', false);
						alert('Each Package must contain unique Items. You have more than one of the item '+CompItemName_a+' in your Package called '+unique_package_name);
						return false;	
					}
					if (p3_discount != 'na' && p3 != c && comparison_discount_a != p3_discount)
					{
						var unique_package_name = nlapiLookupField('customrecord_oppty_package', unique_packages[up], 'name', false);
						alert('Each Package must contain one and only one percent discount. Your Package called '+unique_package_name+' has multiple discount percents.');
						return false;					
					}
				}
			}
		}
		// Clear all the arrays for this Unique Package
		packages.length = 0;
		p_items.length = 0;
		p_discounts.length = 0;
		p2_items.length = 0;
		p2_discounts.length = 0;
	}	
// cont. opptyFormSave()

	// WSR - Validation of Non-Package Items
	// All Items Not in a Package must be unique
	var np_items1 = new Array();
	var np_items2 = new Array();
	// load 2 arrays with all non-package item IDs that are flagged as "include in Quote"
	for (a = 1; a <= nlapiGetLineItemCount('item'); a++)
	{ 	
		var package_id = nlapiGetLineItemValue('item', 'custcol_include_in_package', a);
		var included = nlapiGetLineItemValue('item', 'custcol_includein_quote_order', a);
		if ( (package_id == '' || package_id == null) && included == 'T')
		{	// Load the NonPackage Items into arrays for comparison to eachother
			np_items1[a] = nlapiGetLineItemValue('item', 'item', a);
			np_items2[a] = nlapiGetLineItemValue('item', 'item', a);		
		}
		else
		{	// Otherwise set variable to 'na'
			np_items1[a] = 'na';
			np_items2[a] = 'na';
		}
		package_id = null;
		included = null;
	}
	
	// Begin Loop to compare Items to eachother (that are not 'na'
	for ( c = 1; c <= nlapiGetLineItemCount('item'); c++ )
	{	//alert('c Loop begins now where c = '+c);						
		var np_comparison_item1 = np_items1[c]
		//start another FOR loop and go through the np_items2 array to compare items to it
		for (np = 1; np <= nlapiGetLineItemCount('item'); np++ )
		{	// load variable with item in the second array
			var np_comparison_item2 = np_items2[np]
			if (np_comparison_item1 != 'na')
			{
				if (c != np && np_comparison_item1 == np_comparison_item2)
				{
					var compItemName_c = nlapiLookupField('item', np_comparison_item1, 'name', false);				
					alert('No more than one instance of the same item can be included on a Quote/Order, outside of a Package.  You have more than one instance of the item '+compItemName_c+'. You can uncheck \'Include in Quote/Order\' or put an instance of the item into a Package.');
					return false;
				}		
			}
		}
	} // end package validation	
	//********************************************************************


	// WSR - Load the Opportunity ID into a Custom field - It must be loaded here because the custom field is used 
		// for Filtering the Package Name list in "Include In Package" item field.
		// filter won't work off of the real Internal ID for some reason
 	if (nlapiGetFieldValue('custbody_oppty_internal_id') == '' || nlapiGetFieldValue('custbody_oppty_internal_id') == null)
 	{
 		nlapiSetFieldValue('custbody_oppty_internal_id', nlapiGetFieldValue('id'));		
 	}


	// WSR - Load the Quote Contact NSKEY into a Hidden Custom field - It is used for making an order
 	if (nlapiGetFieldValue('custbody_quote_contact') != '' && nlapiGetFieldValue('custbody_quote_contact') != null)
 	{
 		nlapiSetFieldValue('custbody_wsr_contact_nskey', nlapiGetFieldValue('custbody_quote_contact'));		
 	}	


	// WSR fix 02-14 - flag Opportunity as Closed or Open (Custom field) 
	// Runs all the time
	for (m = 1; m <= nlapiGetLineItemCount('item'); m++ )
	{
		var i_status = nlapiGetLineItemValue('item', 'custcol_oppty_item_status', m);
		// Open Item Status's: 1, 2, 3, 4, 5, 8 -- if any items exist in Open status then it is Open opportunity
		// 2016-02-15 added 9, 2016-05-09 added 10, 2016-06-29 added 11 (new Opportunity Item Status for WINSER upgrade)
		if (i_status == '1'  || i_status == '2' || i_status == '3' || i_status == '4' || i_status == '5' || i_status == '8'|| i_status == '9'|| i_status == '10'|| i_status == '11')
		{	// Important to break so it is Open if ANY item is open
			nlapiSetFieldValue('custbody_oppty_open_closed', '1');
			break;
		}
		else
		{	// Important NOT to break to ensure that it closes ONLY when all items are closed
			nlapiSetFieldValue('custbody_oppty_open_closed', '2');
		}
	}

	// Flipster - if Flipster Status is Set to In Progress (1), then clear it -- this is NOT the Flipster form
	// the field is used in BeforeLoad script and affects lots of Flipster/non-Flipster stuff
	if ( nlapiGetFieldValue('custbody_flp_oppty_status') == 1)
	{
		nlapiSetFieldValue('custbody_flp_oppty_status', '')
	}
	// Flipster - if Flipster Status is Set to Submitted (2), Users shouldn't edit Submitted Flipster Opptys	
	if (nlapiGetFieldValue('custbody_flp_oppty_status') == 2)
	{
		alert('Error: You are editing a Flipster Opportunity which has been converted to an Order');
		return false;
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
	// Subscriptions Merge code added 10/2013: 
	// If it's an Opportunity Type of Threat then require Reason for Threat
	if (oppty_type == '11' && (nlapiGetFieldValue('custbody_threat_reason') == '' || nlapiGetFieldValue('custbody_threat_reason') == null) )
	{
		alert('Reason for Threat is required for all Opportunities with an Opportunity Type of \'Threat\'');
		return false;
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
	
	// create two variables to store if this contains eBook Trial items and eAdmin Trial Items
	// created so that the setting of the real field doesn't happen until the user confirms it
	var hasAdminTrial = false;
	var haseBookTrial = false;
	
	if (hasTrials() )
	{
		for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
		{
			// NetLibrary Change - flag on Body Level that there's a NetLibrary Trial
			if( nlapiGetLineItemValue('item','custcol_sourced_business_line', k) == 'NL - NetLibrary' && nlapiGetLineItemValue('item','custcol_trial_enabled', k) == 'T' )
			{
				haseBookTrial = true;
			}
			if ( nlapiGetLineItemValue('item','custcol_sourced_business_line', k) != 'NL - NetLibrary' && nlapiGetLineItemValue('item','custcol_trial_enabled', k) == 'T' )
			{
				hasAdminTrial = true;
			}
		}
		if ( nlapiGetFieldValue('custbody_send_email') == 'T')
		{
			nlapiSetFieldValue('custbody_isupdated','T');
		}
	}

	
	// if saved and there are trials - set the Trial Flags
	if( nlapiGetFieldValue('custbody_isupdated') == 'T' && hasTrials())
	{	
		if (haseBookTrial == true && hasAdminTrial == true)
		{	// If new Trial Oppty then Confirm group with user 
			if (hasTrialsOnLoad == false)
			{
				if(!confirm('EBSCOAdmin Trial(s) in this opportunity will be set-up using the selected group (' + nlapiGetFieldText('custbody_trial_group') + ').  eBook Trials will be generated.  \nAre you sure you want to continue?'))
				{
					return false;
				}
			}
			nlapiSetFieldValue('custbody_trial','T');
			nlapiSetFieldValue('custbody_has_ebook_trial_item', 'T');
		}
		else if (haseBookTrial == true && hasAdminTrial == false)
		{	// If new Trial Oppty then Confirm group with user 
			if (hasTrialsOnLoad == false)
			{		
				if(!confirm('eBook Trial(s) will be generated  \nAre you sure you want to continue?'))
				{
					return false;
				}
			}
			nlapiSetFieldValue('custbody_has_ebook_trial_item', 'T');
		}
		else if (haseBookTrial == false && hasAdminTrial == true)
		{	// If new Trial Oppty then Confirm group with user 
			if (hasTrialsOnLoad == false)
			{		
				if(!confirm('EBSCOAdmin Trial(s) in this opportunity will be set-up using the selected group (' + nlapiGetFieldText('custbody_trial_group') + ').  \nAre you sure you want to continue?'))
				{
					return false;
				}
			}
			nlapiSetFieldValue('custbody_trial','T');
		}
	}
	// 2015 WinSeR project - set the new "Opportunity Form Type" field appropriately (WSR = 1)
	var form_type = nlapiGetFieldValue('custbody_oppty_form_type');
	if (form_type == null || form_type == '' || form_type != '1')
	{
		nlapiSetFieldValue('custbody_oppty_form_type', '1');
	}
	
    return true;
}



// UPDATE LINE ITEMS CUSTOM BUTTON - Updates Foreign Currency for each line item - and Body fields
function lineItemsButton()
{
	var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
	if (currentCurrency == null || currentCurrency == '')
	{
		nlapiSetFieldValue('custbody_currency_code',USD_ID, false);
		currentCurrency = nlapiGetFieldValue('custbody_currency_code');
	}
	
	var fAmount = 0;
	var usAmount = 0;
	var lineCount = nlapiGetLineItemCount('item');
		
	// if this is not USD, get exchange rate
	if (currentCurrency != USD_ID)
	{
		// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities
		nlapiSetFieldValue('custbody_lineitem_exrate_update_needed','F');
		alert('NetCRM no longer supports non-USD Opportunities due to invalid Exchange Rates.  Please change your Currency to USD and ensure that all USD Amounts are correct before saving your Opportunity');
		/*
					var previousExRate = Number(nlapiGetFieldValue('custbody_exchange_rate'));
					var exRate = Number(nlapiLookupField('customrecord_currency',currentCurrency,'custrecord_currency_exchangerate'));
						
					if(previousExRate != exRate)
					{
						nlapiSetFieldValue('custbody_exchange_rate',exRate,false);
						
						// ORIGINAL CODE - Unable to use nlapiSetLineItemValue with amount field
						//
						//// calculate new USD amount for each line
						//for (var i = 1; i <= lineCount; i++)
						//{
						//	fAmount = nlapiGetLineItemValue('item','custcol_foreign_amount', i);
						//	usAmount = 0;
						//	
						//	usAmount = fAmount * exRate;
						//	
						//	// API does not work with amount field
						//	nlapiSetLineItemValue('item','amount',i,usAmount);
						//}
						
						// WORKAROUND #1 - use nlapiSetCurrentLineItemValue and walk user through each line update
						//alert('Exchange rate has changed.  Please click OK to the following updates.');
						nlapiCancelLineItem('item');
						for (var i = 1; i <= lineCount; i++)
						{
							fAmount = nlapiGetLineItemValue('item','custcol_foreign_amount', i);
							usAmount = 0;
							usAmount = fAmount * exRate;
			
			 				nlapiSelectLineItem('item',i);
							// alert is used to ensure that sourcing from nlapiSelectLineItem has completed before nlapiSetCurrentLineItemValue is run
							alert('Updating USD Amount. Please continue for ' + (1+lineCount - i) + ' more items.' );
							nlapiSetCurrentLineItemValue('item','amount',usAmount, true, true);			
							// WSR Need to recalculate the Price Before Discount field - and $ Discount field
								var perc_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));
								// If Percent Discount is set to zero: Set Dollar Discount to Zero
								// set Price Before Discount "pbd" to Foreign Amount or Amount
								if (perc_discount == 0)
								{
									nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
									nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', fAmount, false, true);
								}
								else
								// If Percent Discount is not zero, calculate pbd based on Percent Discount and Foreign Amount
								// set PBD and Dollar Discount					
								{ 
									var pbd = fAmount/(1-(perc_discount * .01));					
									var d_discount = pbd - fAmount;				
									nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', pbd, false, true);			
									nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);
								}	
							nlapiCommitLineItem('item');
						}
						//alert('Exchange rate update complete!');
						nlapiSetFieldValue('custbody_lineitem_exrate_update_needed','F');
						// END WORKAROUND #1
					}
		*/
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
	
	// US167245 Do not allow Pricing Template if Company is not set
	var cust = nlapiGetFieldValue('entity');
	if (!cust)
	{
		alert('Please ensure Company is set before requesting APA Pricing Template.');
		return;
	}
	
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
			itemArr[pub].push(item);
			// call the getApaVendorIds function -- Function gets the APA Vendor IDs
			vend_id = getApaVendorIds();
			
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
	
	

	// lookup the Primary Contact on the customer
	// US167245 Also add in Contact Role & Job Role to Contact info.
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
			// alert('Contact info is: '+ contact_name + ', '+ contact_email+ ', '+contact_phone);
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


// OPPTY FIELD CHANGED FUNCTION - this function handles all the field change events by testing name
function opptyFieldChanged(type, name)
{
	// Currency Code change 
	// FOREIGN CURRENCY - lock and unlock foreign fields based on currency code selection
	if( name == 'custbody_currency_code')
	{
		// Make sure that the active item row is the extra empty row (not a real row)
		if ( (nlapiGetCurrentLineItemValue('item','item') == '') || (nlapiGetCurrentLineItemValue('item','item') == null))
		{
			var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
			var exRate = Number(nlapiLookupField('customrecord_currency',currentCurrency,'custrecord_currency_exchangerate'));
			var fAmount = 0;
			var usAmount = 0;
			
			// only allow change from USD to FOREIGN, or FOREIGN to USD
			if( (currentCurrency == USD_ID) && (previousCurrency != USD_ID)  )
			{
				// FROM FOREIGN TO USD 				
					// confirm returns true if user clicks OK, or false if user clicks cancel
				// if(confirm('Changing currency to USD will clear out all non-USD values.  Are you sure you want to do this?'))
				// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities
				if (1 == 1)
				{
					// clear foreign amounts
					nlapiSetFieldValue('custbody_foreign_projected',0,false, true);
					nlapiSetFieldValue('custbody_foreign_weighted',0,false, true);
					for (var k = 1; k <= nlapiGetLineItemCount('item'); k++)
					{	// new select line item added and use of nlapiSetCurrentLineItemValue
						// this is because nlapiSetLineItemValue no longer supported
						nlapiSelectLineItem('item', k);
						// nlapiSetLineItemValue('item','custcol_foreign_amount',k,'');
						nlapiSetCurrentLineItemValue('item','custcol_foreign_amount','', false, true);				
						// nlapiSetLineItemValue('item','custcol_change_foreign',k,'');
						nlapiSetCurrentLineItemValue('item','custcol_change_foreign','', false, true);
						// nlapiSetLineItemValue('item','custcol_oppty_item_weighted_foreign',k,'');
						nlapiSetCurrentLineItemValue('item','custcol_oppty_item_weighted_foreign','', false, true);
						// WSR Need to recalculate the Price Before Discount field - and $ Discount field
						// var perc_discount = Number(nlapiGetLineItemValue('item','custcol_oppty_item_discount_percent', k));
						var perc_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));				
						// usAmount = nlapiGetLineItemValue('item','amount', k);
						usAmount = nlapiGetCurrentLineItemValue('item','amount');
						// If Percent Discount is set to zero: Set Dollar Discount to Zero
						// Set PBD equal to Amount
						if (perc_discount == 0)
						{
							// nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', k, 0);
							nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
							// nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', k, usAmount);
							nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', usAmount, false, true);
						}
						else
						{ 
							var pbd = usAmount/(1-(perc_discount * .01));
							var d_discount = pbd - usAmount;
							// nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', k, pbd);
							nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', pbd, false, true);
							// nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', k, d_discount);
							nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);
						}
						nlapiCommitLineItem('item');
					}
					// lock foreign Amount Item field
					nlapiDisableLineItemField('item','custcol_foreign_amount',true);
					// unlock USD Amount Item field
					nlapiDisableLineItemField('item','amount',false);

					// set previous currency values
					previousCurrency = currentCurrency;
					//clear flag to allow user to save without updating exchange rate
					nlapiSetFieldValue('custbody_lineitem_exrate_update_needed','F');
					// NetSuite Glitch discovered 9-6-07 - Opportunity will not save until User selects line item again through the UI
					// can't figure out what the problem is here
					alert('All non-USD values have been cleared');
				}
				else
				{
					// user selected cancel, so revert back to previous currency
					nlapiSetFieldValue('custbody_currency_code',previousCurrency,false);
				}
				
			}
			else if ( (currentCurrency != USD_ID) && (previousCurrency == USD_ID))
			{
				// FROM USD TO FOREIGN
				// 2017-09-01 - US240125 No more CRM support for non-USD Currency Opportunities
				alert('NetCRM no longer supports non-USD Opportunities due to invalid Exchange Rates.  Please change your Currency to USD and ensure that all USD Amounts are correct before saving your Opportunity');
				/*
								// lock USD Item Amount field
								nlapiDisableLineItemField('item','amount',true);
								// unlock foreign Item Amount fields
								nlapiDisableLineItemField('item','custcol_foreign_amount',false);
								
								// calculate new foreign amount for each line (only runs when currency goes from USD to foreign)		
								for (var i = 1; i <= nlapiGetLineItemCount('item'); i++)
								{
									usAmount = nlapiGetLineItemValue('item','amount', i);
									fAmount = 0;
									
									if (!isNaN(exRate) && exRate !=0)
									{
										fAmount = (usAmount / exRate);
									}
									nlapiSetLineItemValue('item','custcol_foreign_amount',i, fAmount.toFixed(2));
									// alert('Item # '+i+': non-usd amount just calculated and applied');
									// WSR Need to recalculate the Price Before Discount field - and $ Discount field
									var perc_discount = Number(nlapiGetLineItemValue('item','custcol_oppty_item_discount_percent', i));
									// If Percent Discount is set to zero: Set Dollar Discount to Zero and set PBD equal to FAmount
									if (perc_discount == 0)
									{
										nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', i, 0);
										nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', i, fAmount);
									}
									else	// Set Price Before Discount and Dollar Discount based on percent discount
									{ 
										var pbd = fAmount/(1-(perc_discount * .01));
										var d_discount = pbd - fAmount;
										nlapiSetLineItemValue('item', 'custcol_oppty_amount_before_discount', i, pbd);
										nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', i, d_discount);
									}
									// alert('Item # '+i+': Dollar Discount Amount and PBD were just calculated and applied');
									// Call function to change weighted amounts
									var item_probability = nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', i);
									calculateItemWeightedChange(false, fAmount, item_probability, i);
									// call function to change percent change amounts
									calculateItemPercentChange(false, fAmount, i);
								}
				
								// WSR - Call Function to CALCULATE Header fields: USD Projected (new field) and FOREIGN PROJECTED(existing field)
									// As well as the weighted Body fields and Percent Change Body fields
								opptyUpdateBodyCalcs(false);
					
								// changes complete, now set previous currency variable to the current
								previousCurrency = currentCurrency;
				 */				
			}		
			else if ((currentCurrency != USD_ID) && (previousCurrency != USD_ID))
			{
				// going from foreign to foreign
				alert('You cannot switch from one non-USD currency to another.  Please convert to USD first.');
				// set currency back
				nlapiSetFieldValue('custbody_currency_code',previousCurrency,false);
			}
		}
		else
		{
			// an item row is active
			alert('An item row is currently active.  Please commit your item row changes before changing currency.  (click done/add)');
			nlapiSetFieldValue('custbody_currency_code',previousCurrency,false);
		}
	}


	// FOREIGN CURRENCY - calculate usd amount if foreign amount on current line changes, then calc percent change foreign
	if(name == 'custcol_foreign_amount')
	{
		// calculate USD amount
		var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
		var exRate = Number(nlapiGetFieldValue('custbody_exchange_rate'));
		var usAmount = 0;	
		usAmount = Number(fAmount * exRate);
		nlapiSetCurrentLineItemValue('item','amount', usAmount, true, true);
		if (recalc_discount_fields == true)
		{
			// WSR Need to recalculate the Price Before Discount field - and $ Discount field
			var perc_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));
			// If Percent Discount is set to zero: Set Dollar Discount to Zero
			if (perc_discount == 0)
			{
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', fAmount, false, true);
			}
			else
			{ 
				var pbd = fAmount/(1-(perc_discount * .01));
				var d_discount = pbd - fAmount;
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', pbd, false, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);
			}
		}
		recalc_discount_fields = true;
		// WSR calculate new weighted amounts
		var item_probability = Number(nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability'));
		var weighted_nonusd = Number(fAmount * item_probability);
 		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_foreign', weighted_nonusd, false, true);
		// calculate % change Foreign
		var fPrev = Number(nlapiGetCurrentLineItemValue('item','custcol_previous_foreign'));
		var fChange = 0;	
		if (!isNaN(fPrev) && fPrev !=0)
		{
			fChange = Math.round( ((fAmount - fPrev) / fPrev )* 100 * 10) / 10;
		}	
		fChange = opptyFormatPercentChange(fChange);
		nlapiSetCurrentLineItemValue('item','custcol_change_foreign',fChange, false, true);
	}

	
	// FOREIGN CURRENCY - calculate percent change for the current line if amount changes
	// WSR 
	// LSD
	if(name == 'amount')
	{
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		// calculate % US change
		var usPrev = Number(nlapiGetCurrentLineItemValue('item','custcol_previous_usd'));
		var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var usChange = 0;
		if (!isNaN(usPrev) && usPrev !=0)
		{
			usChange = Math.round( ((usAmt - usPrev) / usPrev )* 100 * 10) / 10;
		}
		usChange = opptyFormatPercentChange(usChange);
		//if (usChange != null)
		//{
		nlapiSetCurrentLineItemValue('item','custcol_change_usd',usChange, false, true);
		//}
		// WSR calculate new weighted amount
		var item_probability = Number(nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability'));
		var weighted_usd = Number(usAmt * item_probability);
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd', weighted_usd, false, true);
		if (recalc_discount_fields == true)
		{	
			// WSR - Set the Price Before Discount, Dollar Discount and Percent Discount Fields
			// but only if this actually a USD Oppty -- It might not be because this field change could be fired
				// from a field change of Non-USD Amount field
			if (currentCurrency == USD_ID)
			{
				var percent_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));
				if (percent_discount == 0)
				{
					if (currentCurrency == USD_ID)
					{
						nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', usAmt, false, true);
						nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
					}
				}
				else
				{
					var pbd = usAmt/(1 - (percent_discount * .01));
					var d_discount = pbd - usAmt;
					var perc_discount = (d_discount / pbd) * 100;
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', pbd, false, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', perc_discount, false, true);
				}
			}
		}
		recalc_discount_fields = true;
		// LSD:  if amount is total, adjust the markup		
		if (isLsdItem())
		{
			var mkup;
			var cost = Number(nlapiGetCurrentLineItemValue('item','custcol_lsd_cost'));
			var total = Number(nlapiGetCurrentLineItemValue('item','amount'));

			if (!isNaN(cost) && !isNaN(total) && cost !=0 && total != 0)
			{
				mkup = Math.round(((total / cost - 1) * 100) * 100)/100;
				nlapiSetCurrentLineItemValue('item','custcol_lsd_markup', mkup, false, true);
				// WSR Set Profit Margin
				var margin;
				margin = Math.round(((total - cost) / total) * 100);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_margin', margin, false, true);
			}
		}
	}

	// WSR Amount Before Discount - Price Before Discount
	if(name == 'custcol_oppty_amount_before_discount')
	{
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		var pbd = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_amount_before_discount'));
		if (pbd == 0)
		{
			if (currentCurrency != USD_ID)
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, true, true);
				nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', pbd, true, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', pbd, true, true);
			}
			else
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', pbd, true, true);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', pbd, true, true);
			}
		}
		else
		{
			// set US Amount, Dollar Discount and Percent Discount field appropriately
			var percent_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));
			var newAmount2 = Number((1 - (percent_discount * .01)) *  pbd);			
			var d_discount = Number(pbd - newAmount2);
			var perc_discount = Number((d_discount / pbd) * 100);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', perc_discount, false, true);
			if (currentCurrency != USD_ID)
			{
				recalc_discount_fields = false;
				// error occurs on next line
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', newAmount2, true, true);
			}
			else
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'amount', newAmount2, true, true);
			}				
		}
	}

 	
	// WSR Dollar Discount Amount
	if(name == 'custcol_oppty_item_discount_amount')
	{
		// WSR - Discount Amount field must be positive value
		if (nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount') < 0)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', 0, true, true);
			alert('Your discount was removed.  You cannot set the Discount Amount to a negative value.');
		}	
	
		// WSR - Check if in Package with Discount - and if so just reset to the Package Discount 
		var package_id = nlapiGetLineItemValue('item', 'custcol_include_in_package', i);
		if (package_id != '' && package_id != null)
		{	
			var cur_pbd = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount')
			if (cur_pbd != 0)
			{
				var package_discount = nlapiLookupField('customrecord_oppty_package', package_id, 'custrecord_package_discount');
				var cur_d_discount = Number(nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount'));
				var cur_discount = (cur_d_discount/cur_pbd) * 100;
				// Compare Package Discount to current discount
				if (package_discount != cur_discount)
				{	// if different set Item Discount equal to Package Discount
					alert('This Discount cannot be changed because it is already associated to a Package with its own discount. The discount will be reset to the Package Discount');
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', package_discount, true, true)
				}		
			}
		}
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		var d_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_amount'));
		// if Dollar Discount is set to zero: Set Percent Discount to Zero
		/// Set PBD equal to Amount
		var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var fAmount = Number(nlapiGetCurrentLineItemValue('item', 'custcol_foreign_amount'));
		var pbd = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_amount_before_discount'));
		if (d_discount == 0)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', 0, false, true);
			if (currentCurrency != USD_ID)
			{
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, false, true);
			}
			else
			{
				nlapiSetCurrentLineItemValue('item', 'amount', pbd, false, true);
			}
		}
		else
		{ 	// set New US Amount and set new Percent Discount

			var newAmt = pbd - d_discount;
			var perc_discount = (d_discount / pbd) * 100;			
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', perc_discount, false, true);			
			if (currentCurrency != USD_ID)
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', newAmt, true, true);
			}
			else
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'amount', newAmt, true, true);
			}
		}
	}

	// WSR Discount Percent
	if(name == 'custcol_oppty_item_discount_percent')
	{	// WSR - Check if in Package with Discount - and if so just reset to the Package Discount 
		var package_id = nlapiGetCurrentLineItemValue('item', 'custcol_include_in_package');
		if (package_id != '' && package_id != null)
		{		
			var package_discount = nlapiLookupField('customrecord_oppty_package', package_id, 'custrecord_package_discount');
			var cur_discount = Number(nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent'));
			if (cur_discount == null)
			{
				cur_discount = 0
			}
			// Compare Package Discount to current discount
			if (package_discount != cur_discount)
			{	// if different set Item Discount equal to Package Discount
				alert('This Discount cannot be changed because it is already associated to a Package with its own discount. The discount will be reset to the Package Discount');
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', package_discount, false, true);
			}		
		}
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		var perc_discount = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_item_discount_percent'));
		var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
		// If Percent Discount is set to zero: Set Dollar Discount to Zero
		var pbd = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_amount_before_discount'));
		if (perc_discount == 0)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
			if (currentCurrency != USD_ID)
			{
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, true, true);
			}
			else
			{
				nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
			}	
		}
		else
		{ 	// set New US Amount and set new Dollar Discount
			var newAmount = pbd * (1 - (perc_discount * .01));
			// alert('alert 10: newAmount is '+newAmount)
			var d_discount = pbd - newAmount;
			// alert('Alert 20: the pbd is: '+pbd+'. the newAmount is: '+newAmount +'. the d_discount is: '+d_discount);
			// Next Line is the error line
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);		
			// alert('Alert 30: Just set the Dollar Discount field');
			if (currentCurrency != USD_ID)
			{
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', newAmount, true, true);
			}
			else
			{
				// alert('Alert 40: Now will set the Amount field');
				recalc_discount_fields = false;
				nlapiSetCurrentLineItemValue('item', 'amount', newAmount, true, true);
				// alert('Alert 50: Just set the Amount field');		
			}
		}
	}

	// WSR - "Include All Items in Quote/Order" (field at Header sets fields at Item level)
	if(name == 'custbody_include_allitems_quoteorder')
	{
		if (nlapiGetFieldValue('custbody_include_allitems_quoteorder') == 'T')
		{
			var f= confirm('Select OK to check \'Include In Quote\' for items. Select Cancel to prevent changes');
			if (f == true)
			{
				var atleast_one_notinops = false;
				var atleast_one_missingroy = false;
				var not_in_ops = false;
				var missing_roy = false;
				var lineCount = nlapiGetLineItemCount('item');
				for (var w = 1; w <= lineCount; w++)
				{	
					var item_id = nlapiGetLineItemValue('item', 'item', w);
					var roy = nlapiGetLineItemValue('item', 'custcol_lsd_cost', w);
					var roy_required = nlapiGetLineItemValue('item', 'custcol_roy_required_sentry', w);
					not_in_ops = false;
					missing_roy = false;
					// Only apply checkbox to an Item that is in OPS
					if (nlapiLookupField('item', item_id, 'custitem_business_line') == 4)
					{
						not_in_ops = true;
						atleast_one_notinops = true;
					}
					// Only apply checkbox to an Item that has a Royalty if it is an LSD Royalty required Item
					if (roy == '' && roy_required == 'T')
					{
						missing_roy = true;
						atleast_one_missingroy = true
					}
					if (not_in_ops == false && missing_roy == false)
					{
						nlapiSetLineItemValue('item', 'custcol_includein_quote_order', w, 'T');	
					}	
				}
				if (atleast_one_notinops == true)
				{
					alert('At least one of your items is a \'Not for Sale\' item.  It was not checked to be included in Quote/Order');
				}
				if (atleast_one_missingroy == true)
				{
					alert('At least one of the items is a \'Royalty Required\' Item without a Royalty Amount.  It was not checked to be included in Quote/Order');
				}
			}
			else
			{	
				alert('No changes will been made');
				nlapiSetFieldValue('custbody_include_allitems_quoteorder', 'F', false, true);
			} 			
		}
		else if (nlapiGetFieldValue('custbody_include_allitems_quoteorder') == 'F')
		{
			var f= confirm('Select OK to uncheck \'Include In Quote\' for all items. Select Cancel to prevent changes');
			if (f == true)
			{
				var lineCount = nlapiGetLineItemCount('item');
				for (var w = 1; w <= lineCount; w++)
				{
					nlapiSetLineItemValue('item', 'custcol_includein_quote_order', w, 'F');	
				}	
			}
			else
			{	
				alert('No changes will been made');
				nlapiSetFieldValue('custbody_include_allitems_quoteorder', 'T', false, true);
			} 				
		}	
	}


	// WSR - "Apply Discount to all Items" (field at Header sets fields at Item level)
	if(name == 'custbody_apply_discount_allitems')
	{	// Make sure that the active item row is the extra empty row (not a real row)
		if ( (nlapiGetCurrentLineItemValue('item','item') == '') || (nlapiGetCurrentLineItemValue('item','item') == null))
		{
			// Have User Confirm that they want to make the change
			var r= confirm('Select OK to update Discount Amounts and Amounts of all Opportunity Items. Select \'Cancel\' to prevent changes')
			if (r == true)
			{
				var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
				var discount_all = nlapiGetFieldValue('custbody_apply_discount_allitems');
				var lineCount = nlapiGetLineItemCount('item');
				nlapiCancelLineItem('item');
				for (var d = 1; d <= lineCount; d++)
				{
					var usAmt = Number(nlapiGetLineItemValue('item','amount', d));
					var fAmount = Number(nlapiGetLineItemValue('item', 'custcol_foreign_amount', d));
					var item_probability = nlapiGetLineItemValue('item', 'custcol_oppty_item_probability', d);
					var pbd = Number(nlapiGetLineItemValue('item','custcol_oppty_amount_before_discount', d));
					if (discount_all == 0)
					{	// setting discount to zero
						nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_percent', d, 0);
						nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', d, 0);
						if (currentCurrency != USD_ID)
						{	// Non-USD
							recalc_discount_fields = false;
							nlapiSelectLineItem('item', d);
							alert('Updating Non-USD Amount. Please continue for ' + (1+lineCount - d) + ' more items.' );
							nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, true, true);
							//added below line on 11-01-2013
							// calculateItemWeightedChange(false, newAmt, item_probability, d)
							nlapiCommitLineItem('item');
						}
						else
						{	// USD
							recalc_discount_fields = false;
							nlapiSelectLineItem('item', d);
							alert('Updating USD Amount. Please continue for ' + (1+lineCount - d) + ' more items.' );
							nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
							//added below line on 11-01-2013
							//calculateItemWeightedChange(false, newAmt, item_probability, d)
							nlapiCommitLineItem('item');
						}
						// alert('Discounts have been removed for item '+d);
					}
					else	
					{
						var newAmt = pbd * (1 - (discount_all * .01));
						var d_discount = pbd - newAmt;
						// alert('For item # '+d+' the pbd is '+pbd+' and the newAmt is '+newAmt+' and the d_discount is '+d_discount);
						nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_percent', d,  Math.round(discount_all));	
						nlapiSetLineItemValue('item', 'custcol_oppty_item_discount_amount', d, d_discount);
						if (currentCurrency != USD_ID)
						{	// Non-USD
							recalc_discount_fields = false;
							nlapiSelectLineItem('item', d);
							alert('Updating Non-USD Amount. Please continue for ' + (1+lineCount - d) + ' more items.' );
							nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', newAmt, true, true);
							// added below line on 11-01-2013
							// calculateItemWeightedChange(false, newAmt, item_probability, d)
							nlapiCommitLineItem('item');
						}
						else
						{	// USD
							recalc_discount_fields = false;
							nlapiSelectLineItem('item', d);
							// Can't use nlapiSetLineItemValue on the 'amount' field due to API restriction
							//use nlapiSetCurrentLineItemValue and walk user through each line update
							// alert is used to ensure that sourcing from nlapiSelectLineItem has completed before nlapiSetCurrentLineItemValue is run
							alert('Updating USD Amount. Please continue for ' + (1+lineCount - d) + ' more items.' );
							nlapiSetCurrentLineItemValue('item', 'amount', newAmt, true, true);
							// added below line on 11-01-2013
							// calculateItemWeightedChange(true, newAmt, item_probability, d)
							nlapiCommitLineItem('item');
						}
					}	
				}
			}
			else
			{
				alert('No changes have been made');
			} 		
			// when complete set the Discount All Items field to blank
			nlapiSetFieldValue('custbody_apply_discount_allitems', '', false, true);		
		}
		else
		{
			// an item row is active
			alert('An item row is currently active.  Please commit your item row changes before applying a discount.  (click done/add)');
			nlapiSetFieldValue('custbody_apply_discount_allitems', '', false, true);
		}
	}


	// WSR - "Apply Percent Increase" field at Header sets fields at Item level
	if(name == 'custbody_apply_perc_increase')
	{	// Make sure that the active item row is the extra empty row (not a real row)
		if ( (nlapiGetCurrentLineItemValue('item','item') == '') || (nlapiGetCurrentLineItemValue('item','item') == null))
		{
			// Have User Confirm that they want to make the change
			var b= confirm('Select OK to update USD (Non-USD) Amounts of all Opportunity Items. Select Cancel to prevent changes')
			if (b == true)
			{
				var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
				var increase = Number(nlapiGetFieldValue('custbody_apply_perc_increase'));
				// turn increase into relevent decimal
				increase = 1 + (increase * .01);				
				nlapiCancelLineItem('item');
				var lineCount = nlapiGetLineItemCount('item');
				for (var e = 1; e <= lineCount; e++)
				{
					var us_amt = nlapiGetLineItemValue('item', 'amount', e);
					var f_amt = nlapiGetLineItemValue('item', 'custcol_foreign_amount', e);
					var new_us_amt = us_amt * increase;
					var new_f_amt = f_amt * increase;
					if (currentCurrency != USD_ID)
					{	// Non-USD		
						nlapiSelectLineItem('item',e);
						alert('The Non-USD and USD Amount fields will be adjusted for item '+e+'. Select OK to continue');
						nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', new_f_amt, true, true);
						// nlapiSetCurrentLineItemValue('item', 'amount', new_us_amt, true, true);
						nlapiCommitLineItem('item');						
					}
					else
					{	// USD
						nlapiSelectLineItem('item',e);
						alert('The Amount field will be adjusted for item '+e+'. Select OK to continue');
						nlapiSetCurrentLineItemValue('item', 'amount', new_us_amt, true, true);
						nlapiCommitLineItem('item');
					}
				}
			}
			else
			{
				alert('No changes have been made');
			} 		
			// when complete set Apply Percent Increase field to blank
			nlapiSetFieldValue('custbody_apply_perc_increase', '', false, true);	
		}
		else
		{	// an item row is active
			alert('An item row is currently active.  Please commit your item row changes before applying Percent Increase.  (click done/add)');
			nlapiSetFieldValue('custbody_apply_perc_increase', '', false, true);
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
			// 03-13-14 Item Close Date
			// ID = 6 is "7-Closed - Lost Item" -- also need to set Item Close Date field
			var myDate = new Date();
			var stringDate= nlapiDateToString(myDate);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_close_date', stringDate, false, true);
		}		
		else if (item_status == 7)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '1', true, true);
			// 03-13-14 Item Close Date
			// ID = 7 is "6-Closed - Won Item" -- also need to set Item Close Date field 
			var myDate = new Date();
			var stringDate= nlapiDateToString(myDate);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_close_date', stringDate, false, true);
		}
		else if (item_status == 8)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.0', true, true);
		}		
		// 2016-02-15 - added new status of 9 to the list for WINSER Upgrade
		else if (item_status == 9)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.99', true, true);
		}
		// 2016-05-09 - added new status of 10 to the list for WINSER Upgrade
		else if (item_status == 10)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.75', true, true);
		}
		// 2016-06-29 - added new status of 11 to the list for WINSER Upgrade
		else if (item_status == 11)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.95', true, true);
		}		
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
		if (currentCurrency != USD_ID)
		{	// WSR set Item Weighted Amount Non-USD
			var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
			var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
			var weighted_nonusd = fAmount * item_probability;
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_foreign', weighted_nonusd, false, true);
			// Also need to set Weighted USD
			var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
			var weighted_usd = usAmount * item_probability;
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
		}
		else
		{	// WSR set Item Weighted Amount USD
			var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
			var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
			var weighted_usd = usAmount * item_probability;
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
		}
		// Don't need to call update body calculations function -- covered in Line Validation
	}


	// WSR - If Include in Quote/Order checkbox is checked, ensure valid Business Line
	if (name == 'custcol_includein_quote_order')
	{
		if (nlapiGetCurrentLineItemValue('item', 'custcol_includein_quote_order') == 'T')
		{
			var item_id = nlapiGetCurrentLineItemValue('item', 'item');
			if (nlapiLookupField('item', item_id, 'custitem_business_line') == 4)
			{
				alert('This Item is a \'Not for Sale\' Item.  You cannot include this item in a Quote/Order');
				nlapiSetCurrentLineItemValue('item', 'custcol_includein_quote_order', 'F', false, true);
			}
		}
		else // WSR Fix // If setting "Include in Quote" item checkbox to False
		{	// then set Header Level Include in Quote to False also (if it's not)
			if (nlapiGetFieldValue('custbody_include_allitems_quoteorder') == 'T')
			{
				nlapiSetFieldValue('custbody_include_allitems_quoteorder','F', false, true);
			}
		}		
	}
	

	// WSR - Applying Package or Removing Package resets the Discount fields
	if (name == 'custcol_include_in_package')
	{	// get the discount from the Package record
		var package_id = nlapiGetCurrentLineItemValue('item', 'custcol_include_in_package');
		// get the discount percent of current line item
		var cur_discount = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent');
		if (cur_discount == null)
		{
			cur_discount = 0
		}
		// If Removing Package
		if (package_id == '' ||  package_id == null)
		{	// Confirm with user to remove the discount
			if (cur_discount != 0)
			{
				if(confirm('This item has a discount of '+cur_discount+'%. Select OK to remove this discount and adjust the Amount field.  Select Cancel to keep the discount'))
				{
					// alert('Run Code to change the Item Discount Percent and set it to zero');
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', 0, false, true);
					var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
					var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
					var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
					var pbd = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_amount_before_discount'));
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
					// set Amount field and Non-USD Amount fields
					if (currentCurrency != USD_ID)
					{
						nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, true, true);
					}
					else
					{
						nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
					}
				}				
			}
		}
		else // Adding a Package
		{	// compare the Package Discount with Current Discount
			var package_discount = nlapiLookupField('customrecord_oppty_package', package_id, 'custrecord_package_discount');
			if (package_discount != cur_discount)
			{	// Ask User to confirm Discount Chagnes
				if(confirm('The Package you\'ve chosen will apply a Package Discount of '+package_discount+'% to this item. The Amount will be adjusted. Select OK to continue or Cancel to undo these changes'))
				{	// added all the below code so as NOT to call the Discount Percent field change operation
					nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', package_discount, false, true);
					var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
					var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
					var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
					var pbd = Number(nlapiGetCurrentLineItemValue('item','custcol_oppty_amount_before_discount'));
					// If Package Discount is set to zero: Set Dollar Discount to Zero
					if (package_discount == 0)
					{	
						nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
						// set Amount field and Non-USD Amount fields
						if (currentCurrency != USD_ID)
						{
							nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', pbd, true, true);
						}
						else
						{
							nlapiSetCurrentLineItemValue('item', 'amount', pbd, true, true);
						}	
					}
					else
					{ 	// set New US Amount and set new Dollar Discount
						var newAmount = pbd * (1 - (package_discount * .01));
						var d_discount = pbd - newAmount;
						nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', d_discount, false, true);		
						if (currentCurrency != USD_ID)
						{
							recalc_discount_fields = false;
							nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', newAmount, true, true);
						}
						else
						{
							recalc_discount_fields = false;
							nlapiSetCurrentLineItemValue('item', 'amount', newAmount, true, true);
						}
					}
				}
				else
				{	// user selected cancel, so revert back
					nlapiSetCurrentLineItemValue('item', 'custcol_include_in_package', '', false, true);
				}	
			}
		}
	}


	// LSD:  if markup is changed, adjust the total
	if(name == 'custcol_lsd_markup')
	{
		if (isLsdItem())
		{
			var total;
			var cost = Number(nlapiGetCurrentLineItemValue('item','custcol_lsd_cost'));
			var mkup = Number(nlapiGetCurrentLineItemValue('item','custcol_lsd_markup'));
			
			if (!isNaN(cost) && !isNaN(mkup) && cost !=0)
			{
				total = cost * (1 + mkup / 100);
				// WSR - Set the Price Before Discount field	
				nlapiSetCurrentLineItemValue('item','custcol_oppty_amount_before_discount', total, false, true);
				// WSR - Next Line may not apply if there is a discount
				nlapiSetCurrentLineItemValue('item','amount', total, true, true);
				// WSR Add Code to Set Profit Margin
				var margin;
				margin = Math.round(((total - cost) / total) * 100);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_margin', margin, false, true);				
				//FOREIGN CURRENCY - If using foriegn curency, include exchange rate and set foreign value
				if(nlapiGetFieldValue('custbody_currency_code') != USD_ID)
				{
					total = total * Number(nlapiGetFieldValue('custbody_exchange_rate'));
					nlapiSetCurrentLineItemValue('item','custcol_foreign_amount', total, true, true);
				}
			}
		}
	}
	
	// LSD:  if cost is changed, adjust the total
	if(name == 'custcol_lsd_cost')
	{
		if (isLsdItem())
		{
			var total;
			var cost = Number(nlapiGetCurrentLineItemValue('item','custcol_lsd_cost'));
			var mkup = Number(nlapiGetCurrentLineItemValue('item','custcol_lsd_markup'));
			// if set to zero then clear out markup and Profit Margin
			if (cost == 0)
			{
				nlapiSetCurrentLineItemValue('item','custcol_lsd_markup', '', false, true);
				nlapiSetCurrentLineItemValue('item','custcol_oppty_item_margin', '', false, true);
			}
			else if (mkup == 0 && cost > 0)
			{	// calculate and load the Markup and the Profit Margin (but only if there's an Amount
				var usAmt = Number(nlapiGetCurrentLineItemValue('item','amount'));
				if (usAmt > 0)
				{
					var new_mkup = Math.round(100 * ((usAmt - cost) / cost));
					nlapiSetCurrentLineItemValue('item','custcol_lsd_markup', new_mkup, false, true);
					var profit_margin = Math.round((1 - (cost / usAmt)) * 100);
					nlapiSetCurrentLineItemValue('item','custcol_oppty_item_margin', profit_margin, false, true);
				}
			}			
			else if (!isNaN(cost) && !isNaN(mkup) && cost !=0 && mkup != 0)
			{
				total = cost * (1 + mkup / 100);
				// WSR - set the Price Before Discount field
				nlapiSetCurrentLineItemValue('item','custcol_oppty_amount_before_discount', total, false, true);
				// WSR may not need to set the amount field if there's a discount
				nlapiSetCurrentLineItemValue('item','amount', total, true, true);
				// WSR Add Code to Set Profit Margin
				var margin = Math.round(((total - cost) / total) * 100);
				nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_margin', margin, false, true);				
				//FOREIGN CURRENCY - If using foriegn curency, include exchange rate and set foreign value
				if(nlapiGetFieldValue('custbody_currency_code') != USD_ID)
				{
					total = total * Number(nlapiGetFieldValue('custbody_exchange_rate'));
					nlapiSetCurrentLineItemValue('item','custcol_foreign_amount', total, true, true);
				}
			}
		}
	}
	
	// TRIALS:  if trial box is checked by user, configure the trial fields
	if(name == 'custcol_trial_enabled')
	{
		// check for OE approval
		if(nlapiGetFieldValue('custbody_parent_oeapproved') == 'T')
		{
			// check that item can be trialed
			if(nlapiGetCurrentLineItemValue('item','custcol_can_trial') == 'T')
			{	
				// Trial checkbox is true
		 		if(trialEnabled())
				{
					// 2015-08-13  BEGIN: Only allow to be checked if no other active trials exist for this item - US39208
					var this_trial_item = nlapiGetCurrentLineItemValue('item', 'item');
					var this_trial_line = nlapiGetCurrentLineItemValue('item', 'line');					
					// loop through all Line Items and see if another Active Trial exists for this Item
					for (e = 1; e <= nlapiGetLineItemCount('item'); e++)
					{
						var line = nlapiGetLineItemValue('item', 'line', e);
						if (this_trial_line != line)
						{
							var is_trial = nlapiGetLineItemValue('item', 'custcol_trial_enabled', e);
							var trial_end = nlapiStringToDate(nlapiGetLineItemValue('item', 'custcol_trial_end', e));
							var today2 = new Date();
							today2.setHours(0,0,0,0);						
							// if item is a Trial and End Date is greater than or equal to today - then it is an Active Trial
							if (is_trial == 'T' && trial_end >= today2)
							{	// now compare the items to eachother
								var other_trial = nlapiGetLineItemValue('item', 'item', e);
								if (this_trial_item == other_trial)
								{
									var this_item_name = nlapiGetCurrentLineItemText('item', 'item');
									nlapiSetCurrentLineItemValue('item', 'custcol_trial_enabled', 'F', false, true);
									alert('Error: The Trial checkbox cannot be checked because there already is an active trial for: '+this_item_name);		
								}
							}
						}
					}
					// 2015-08-13 END: Only allow to be checked if no other active trials exist for this item

					// set trial dates (begin date to today - end date based on # trial days for item
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
					nlapiDisableLineItemField('item','custcol_trial_end',false);					
					
					// set the send email flag
					nlapiSetFieldValue('custbody_send_email','T');
					// get item name to validate later
					previousItem = nlapiGetCurrentLineItemValue('item','item');
				}
				else
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
		// FOREIGN CURRENCY - this is used to suppress the "ERROR FIELD NOT FOUND" output of the formula field in the new line-item entry row
		nlapiSetCurrentLineItemValue('item','custcol_salesorder_link', '', false, true);

		// TRIALS: grab initial values for end date, trial state (is it Trial Enabled), item, and interfaces
		//    these are used later for line item validation
		previousEndDate = nlapiGetCurrentLineItemValue('item','custcol_trial_end');
		previousTrialState = nlapiGetCurrentLineItemValue('item','custcol_trial_enabled');
		previousItem = nlapiGetCurrentLineItemValue('item','item');
		previousInterfaces = nlapiGetCurrentLineItemValue('item','custcol_trial_interface_ids');
		// FOREIGN CURRENCY 02-08-2013
		// try to disable the amount field if foreign currency
		if (nlapiGetFieldValue('custbody_currency_code') != USD_ID)
		{
			nlapiDisableLineItemField('item','amount',true);
		}


		// Disable the Item field if the row already has an ID (it has been created) AND the Oppty record has already been created
		// WSR - Added to prevent users switching the items in rows that already exist
		if ( nlapiGetCurrentLineItemValue('item', 'line') != '' && nlapiGetFieldValue('id') != '')
		{
			nlapiDisableLineItemField('item','item',true);
		}

		// WSR - if Price Before Discount and Amount and Foreign Amount is zero or null
		// disable the Discount fields
		var pbd = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var usamount = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
		if (pbd == 0 && usamount == 0  && fAmount == 0)
		{
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_percent', true);
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_amount', true);			
		}
		else // enable them
		{
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_percent', false);
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_amount', false);
		}

		// WSR if there's a Package with a Discount -- need to disable the Discount fields
		var package_id = nlapiGetCurrentLineItemValue('item', 'custcol_include_in_package');
		var cur_discount = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent');
		if (package_id != '' && package_id != null && cur_discount != '' && cur_discount != null)
		{
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_percent', true);
			nlapiDisableLineItemField('item','custcol_oppty_item_discount_amount', true);	
		}

/*
		// set weighted amounts
		var currentCurrency = nlapiGetFieldValue('custbody_currency_code');	
		if (currentCurrency != USD_ID)
		{	// WSR set Item Weighted Amount Non-USD
			var fAmount = Number(nlapiGetCurrentLineItemValue('item','custcol_foreign_amount'));
			var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
			var weighted_nonusd = fAmount * item_probability;
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_foreign', weighted_nonusd, false);
		}
		else
		{	// WSR set Item Weighted Amount USD
			var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
			var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
			var weighted_usd = usAmount * item_probability;
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false);
			// Don't need to call update body calculations function -- covered in Line Validation	
		}	
*/	
		
// Line Initialization Function - cont.			
		if(trialEnabled()) // THIS IS A TRIAL ITEM
		{
			nlapiDisableLineItemField('item','custcol_trial_enabled',true);
			// 2015-09-04 - US39208
			nlapiDisableLineItemField('item','custcol_trial_end', false);

			var endDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_trial_end'));
			var today = new Date();
			today.setHours(0,0,0,0);		

			// if endDate in future then unlock interface selector
			if( endDate > today )
			{
				nlapiDisableLineItemField('item','custcol_item_interface_selector',false);
			}
			else
			{	// endDate has passed (or is today) - lock interface selector
				nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
			}
		}
		else // This is NOT a Trial item
		{
			nlapiDisableLineItemField('item','custcol_trial_enabled',false);
			nlapiDisableLineItemField('item','custcol_item_interface_selector',true);
			nlapiDisableLineItemField('item','custcol_trial_end',true);
		}
}


// OPPTY validate line item function
function opptyValidateLine(type)
{
	// FOREIGN CURRENCY - this is used to suppress the "ERROR FIELD NOT FOUND" output of the formula field in the new line-item entry row
	nlapiSetCurrentLineItemValue('item','custcol_salesorder_link','', false, true);
	
	// Suppress "amount does not equal qty * rate" messages by setting rate = amount/qty
	var qty = Number(nlapiGetCurrentLineItemValue('item','quantity'));
	var amt = Number(nlapiGetCurrentLineItemValue('item','amount'));
	var rate = 0;
	if (!isNaN(qty) && qty !=0)
	{
		rate = amt/qty;
		nlapiSetCurrentLineItemValue('item', 'rate', rate, false, true);
	}
	// code fix 2014-07-10 -- next 4 lines fixes problem with the addition of renewal Opportunities being created with a qty of 0
	else if (qty == 0)
	{
		nlapiSetCurrentLineItemValue('item', 'quantity', 1, false, true);
		nlapiSetCurrentLineItemValue('item', 'rate', amt, false, true);
	}
	
	var okToSave = true
	
	// LSD:
	if (!(isLsdItem()))
	{
		// if item is not an LSD item clear LSD specific fields
		nlapiSetCurrentLineItemValue('item','custcol_lsd_status', '', false, true);
		nlapiSetCurrentLineItemValue('item','custcol_lsd_cost', '', false, true);
		nlapiSetCurrentLineItemValue('item','custcol_lsd_markup', '', false, true);
		nlapiSetCurrentLineItemValue('item','custcol_oppty_item_margin', '', false, true);		
	}
	else 	// it is an LSD item
	{	// WSR - If Include in Quote/Order and is LSD item then require Royalty Data
		var include = nlapiGetCurrentLineItemValue('item', 'custcol_includein_quote_order');
		var roy = nlapiGetCurrentLineItemValue('item', 'custcol_lsd_cost');
		if (include == 'T' && roy == '' )
		{
			alert('You must enter an LSD Royalty Amount in order to include this item in a Quote or Order');
			okToSave = false;
		}
	}

	// WSR Fix - Require Money if Item-Status is 3, 4 or 5
	if (nlapiGetRole() != '1007')
	{
		if (nlapiGetCurrentLineItemValue('item', 'amount') == '0.00' || nlapiGetCurrentLineItemValue('item', 'amount') < '0.00')
		{
			var i_status = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_status');
			// if status is a 3 then require money
			if (i_status == 3)
			{
				alert('Error: Items with a status of 3 must include dollar amounts');
				okToSave = false;
			}
		}		
	}

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

	// 2016-02-08 Validate that Note for Renewal isn't over 2000 characters (field type changed from Free-form text to Text Area
	var renewal_note = nlapiGetCurrentLineItemValue('item', 'custcol_note_for_renewal');
	if (renewal_note.length > 2000)
	{
		alert('Note for Renewal must be less than 2000 characters');
		okToSave = false;
	}


// validate line function

	// WSR Required fields
	if (nlapiGetCurrentLineItemValue('item', 'item') != '')
	{
		// Term Months required
		if ( nlapiGetCurrentLineItemValue('item', 'custcol_term_months') == '' || nlapiGetCurrentLineItemValue('item', 'custcol_term_months') == null )
		{
			alert('You must enter Term Months for this Item');
			okToSave = false;
		}	
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
	}

	// Users Are Able to add new Item without setting any fields which should be populated
	var currentCurrency = nlapiGetFieldValue('custbody_currency_code');
	var amt = nlapiGetCurrentLineItemValue('item', 'amount');
	var f_amt = nlapiGetCurrentLineItemValue('item', 'custcol_foreign_amount');
	var pbd = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount');
	var cur_discount = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent');
	var cur_discount_amt = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount');
	if (amt == 0)	
	{
		if (currentCurrency != USD_ID &&  f_amt == '')
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_foreign_amount', 0, false, true);
		}
		if (pbd == '')
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_amount_before_discount', 0, false, true);
		}
		if (cur_discount == '' && cur_discount_amt == '')
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_percent', 0, false, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_discount_amount', 0, false, true);
		}
	}
	   
	// WSR if there's a Package with a Discount -- need to disable the Apply Discount to All Items field
	var package_id = nlapiGetCurrentLineItemValue('item', 'custcol_include_in_package');
	if ( package_id != '' && package_id != null && cur_discount != '' && cur_discount != null)
	{	// Lock the Apply Discount to All Items field
		nlapiDisableField('custbody_apply_discount_allitems', true);
	}

// validate line function	
	// WSR if Header level "include all items in quoteorder" checkbox is checked, check Include in Quote in the item
	if(nlapiGetFieldValue('custbody_include_allitems_quoteorder') == 'T')
	{
		if(nlapiGetCurrentLineItemValue('item', 'custcol_includein_quote_order') == 'F')
		{	// alert('run code to apply Include in Quote checkbox at Item level');
			var item_id = nlapiGetCurrentLineItemValue('item', 'item');	
			// Only apply checkbox to an Item that is in OPS
			if (nlapiLookupField('item', item_id, 'custitem_business_line') != 4)
			{	// Only apply checkbox to an Item if no Royalty is required
				var roy = nlapiGetCurrentLineItemValue('item', 'custcol_lsd_cost');
				var roy_required = nlapiGetCurrentLineItemValue('item', 'custcol_roy_required_sentry');
				if (roy_required != 'T')
				{
					nlapiSetCurrentLineItemValue('item', 'custcol_includein_quote_order', 'T', false, true);	
				}
				// else if Royalty is required only apply if it has a Royalty Amount
				else if (roy > '0')
				{
					nlapiSetCurrentLineItemValue('item', 'custcol_includein_quote_order', 'T', false, true);	
				}
			}
		}
	}


	// TRIALS:  validate date data, prompt user with errors if necessary
	if(trialEnabled())
	{
		var beginDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_trial_begin'));
		var endDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_trial_end'));
		var today = new Date();
		today.setHours(0,0,0,0);

/*		
		// if Item doesn't allow Trial extension and Trial End minus Trial Begin is greater than Default Trial Days - error
		var defaultTrialDays = nlapiGetCurrentLineItemValue('item','custcol_item_trialdays');	
		if (nlapiGetCurrentLineItemValue('item', 'custcol_sourced_no_trial_extension') == 'T' && endDate > nlapiAddDays(beginDate, defaultTrialDays))
		{
			alert('Error: There is a '+defaultTrialDays+' day limit for this item to be on trial. Please change the Trial End Date to a value within the limit');
			okToSave = false;
		}
*/
		
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
function hasTrials()
{
	var hasTrials = false;
	for ( k = 1; k <= nlapiGetLineItemCount('item'); k++)
	{
		if( nlapiGetLineItemValue('item','custcol_trial_enabled',k) == 'T' )
		{
			hasTrials = true;
		}
	}
	return(hasTrials);
}


// LSD:  check to see if the current line item is an LSD
function isLsdItem()
{	// old code Commented out for WSR 11-22-2013
	/*
		//  (publisher is set AND lsd flag is set ) OR family name is lsd/third party
		var publisher = nlapiGetCurrentLineItemValue('item','custcol_lsd_publisher');
		var lsdQuote = nlapiGetCurrentLineItemValue('item','custcol_lsd_quote');
		var family = nlapiGetCurrentLineItemValue('item','custcol_item_family');

		// licensed secondary database = 13
		// third party = 5
		// licensed secondary database with Fulltext = 18 (Eric Abramo addd 12-17-2007)
		if ((publisher != null && publisher != '' && lsdQuote == 'T') || family == 13 || family == 5 || family == 18)
		{
			return(true);
		}
		else
		{
			return(false);
		}
	*/		
	// WSR new code added 11-22-2013 - - ONLY need to check new field "Royalty Required in Sentry"
	var royRequired = nlapiGetCurrentLineItemValue('item','custcol_roy_required_sentry');	
	if (royRequired == 'T')
	{
		return(true);
	}
	else
	{
		return(false);
	}
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
		{

			// if found push onto array
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


// FOREIGN CURRENCY - custom button - clears projected foreign total flag to simulate standard NS override behavor projected total (USD)
//function opptyUpdateForeignProjected()
//{
//	if(nlapiGetFieldValue('custbody_currency_code') != USD_ID)
//	{
//		nlapiSetFieldValue('custbody_foreign_sum_override','F');
//		opptySumForeign();
//		opptyUpdateBodyCalcs(true);
//	}
//	else
//	{
//		alert('This function is not available with USD currency.');
//	}
//}



// FOREIGN CURRENCY - runs after line is committed
function opptyRecalc()
{	//alert('recalc event');
	opptyUpdateBodyCalcs(false);
}

// FOREIGN CURRENCY - sum all lines for foreign currency

// WSR -  Function Needs To Be Removed
//function opptySumForeign()
//{
//	var fSum = 0;
//	for (var i = 1; i <= nlapiGetLineItemCount('item'); i++)
//	{
//		fSum += Number(nlapiGetLineItemValue('item','custcol_foreign_amount', i));
//	}
//	// Pass false for "fire field change" to prevent foreign projected event from running 
//	// and setting the override flag (only want this set when edited by the user)
//	nlapiSetFieldValue('custbody_foreign_projected',fSum, false);
//}


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
		else
		{
			return true;
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


// 2014-03-28 Add Item-level Expected Close Date (6)
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
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 6);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '0');
					// 03-13-14 Item Close Date
					// Need to insert Item Close Date
					var myDate = new Date();
					var stringDate= nlapiDateToString(myDate);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_close_date', w, stringDate);
				}
				else if (newOpptyStatus == 26)
				{
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, 7);
					nlapiSetLineItemValue('item', 'custcol_oppty_item_probability' , w, '1');
					// 03-13-14 Item Close Date
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


function calculateItemPercentChange(isUSD, item_amount, i)
{
		fPrev = Number(nlapiGetLineItemValue('item','custcol_previous_foreign',i));
		usPrev = Number(nlapiGetLineItemValue('item','custcol_previous_usd',i));
		fChange = 0;
		usChange = 0;		
		// if foreign previous has a value other than zero 
		if (!isNaN(fPrev) && fPrev !=0)
		{	// Calculate Foreign % change: take foreign amount and subtract the foreign previous -- convert
			fChange = Math.round( ((item_amount - fPrev) / fPrev )* 100 * 10) / 10;
		}	
		// if USD previous has a value other than zero 
		if (!isNaN(usPrev) && usPrev !=0)
		{	// Calculate US % Change: take USD Amount and subtract the US previous -- convert
			usChange = Math.round( ((item_amount - usPrev) / usPrev )* 100 * 10) / 10;
		}		
		// Call function to format the percent change - and set the Foreign percent change column
		fChange = opptyFormatPercentChange(fChange);
		nlapiSetLineItemValue('item','custcol_change_foreign',i, fChange);
		// Call function to format the percent change - and set the USD percent change column
		usChange = opptyFormatPercentChange(usChange);
		if (usChange != null)
		{
			nlapiSetLineItemValue('item','custcol_change_usd',i, usChange);
		}
}


function calculateItemWeightedChange(isUSD, item_amount, item_probability, i)
{
	// alert('hitting code to calculate Item Weighted Change.  isUSD= '+isUSD+'. item_amount= '+item_amount+'. item_probability= '+item_probability+'. and i= '+i);
	var weighted_amount = item_amount * item_probability;
	// if Non-USD
	if (isUSD == false)
	{
		nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_foreign', i, weighted_amount);
		// alert('Item # '+i+': Weighted Non-USD Amount has been calculated and applied');
	}
	else // USD
	{
		nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , i, weighted_amount);
		// alert('Item # '+i+': Weighted USD Amount has been calculated and applied');
	}
}
