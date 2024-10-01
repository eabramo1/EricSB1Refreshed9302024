//
// Script:     client_address.js
//
// Created by: EBSCO Information Services
//
// Functions:  	1. addressForm_load - Page initialisation 
//				2. addressForm_save - Save record validation
//				3. storePrevAdd - Stores address values on entry for setting Previous Address. Note: not always set (US51481)
//              4. addFieldChanged - Field changed processing (US51481)
//              5. setPrevValues - Sets previous values & requestor info. when approval required. (US51481)
//              6. legMap - Checks for legacy mapping associated with address. (US51481)
//				7. resetAdd - Resets address values on Rejection of change. (US51481)
//				8. clrAddApp - Clears previous values & address approval values. (US51481)
//     
//
// Revisions:  
//	CNeale	11/20/2015	Restructuring Addresses.               
//						Replace Attention field (used for Location Type) with BillTo, ShipTo, Main check boxes.
//						Deprecate iseBkBillto check box.
//                      Adjust address line length error messages in line with field names. 
//                      Moved chunks of validation over from Customer form script.
//                      Default "BillTo" for new addresses (not ShipTo & billto). 
//                      Store Address Label in "work field". 
// EAbramo	01/12/2016  Puerto Rico should be a Country and not a state of the US. 
// CNeale	05/06/2016  US51481 Address Approval workflow & much more. 
//                      US94755 Refactor Address Changes
//                      US94161 Code to validate mandatory city
//						DE14371 Cater for City entered as blanks in check for mandatory City
// CNeale	08/02/2016	Cust Auth US116612 changes
//						Use Customer Address Control record to control address processing.
//                      Main address can only be edited if Customer is known.
//						Remove processing to store Address Label on Address record.
//                      Replace Session Object with URL solution for retrieving unknown Customer. 
//                      Incl URL solution enhancements.
//                      Cater for new Customer but child record properly. 
//                      Cust Auth US134874 Remove Shipping Legacy Mapping Processing
// CNeale	09/06/2016	US157010 Resolve issues with Inactive Customers.
// CNeale	31/10/2016	US177673 Fix for Addresses with Override flag set.
// EAbramo 	03/07/2017	Marketo - don't allow for Address2 of 'No street address provided'
// CNeale	23/05/2017	US234238 Zip code validation US & CA for Orion team.
// JOliver	4/4/2021	US773745 Error message if country chosen is on the bad country list (on field change AND form save)
// ZScannell 3/1/2022	US927412 Customer Authority Clean-Up
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Variables for intitial values (only status, bill & ship mappings, product type & attachments 1-3 always set)
var addr2_in;
var state_in;
var mainadd_in;
// Set UserId
var userid = nlapiGetUser();
// Set New Address Indicator 
var newadd = 'F';
// Current Customer Id  US116612
var currCust = '';
var custErr = false;
// Inactive Customer indicator US157010
var inact = 'F'
// Current Address Id US116612
var recId;
// Control Record Fields  US116612
var ctrl_cmc = 0;        //Control Current Main Count
var ctrl_cmid;	         //Control Current Main Id  
var ctrl_cmctry;          //Control Current Main Country
var ctrl_cmstate;         //Control Current Main State  
var ctrl_cmid2;	         //Control Current Main Id2  
var ctrl_cmctry2;          //Control Current Main Country2
var ctrl_cmstate2;         //Control Current Main State2  
var ctrl_recId;          //Control Record Id 


function addressForm_load()
{
	// Check execution status - so only apply if via UI (otherwise some code runs on Customer load)

	if (nlapiGetContext().getExecutionContext()== 'userinterface')
	{	

		// Before store initial Address Approval values check that this is not a new customer/new address/parent situation
		// If it is we will need to clear out any legacy mappings, set "Is Bill To" and clear down previous address fields
		var parent =  getURLParameterValue('parent');
		if (parent && parent != 'URL error' && nlapiGetFieldValue('custrecord_address_customer'))
		{
			if (!getURLParameterValue('id'))
			{
				nlapiSetFieldValue('custrecord_address_customer', '', false, true);
				
			}
		}
		
		// US773745 Prevent reps from selecting countries we are not currently doing business with
		var countryIn = nlapiGetFieldValue('country')
		var countryName = nlapiGetFieldText('country')
		if (LC_Country.isSalesRestricted(countryIn))
		{
			alert('You have selected a country of '+ countryName +'.  EBSCO is not currently doing business with this country.  Please select a different country');
		}
		
		// Bits of StorePrevAdd() that we need to keep
		
		mainadd_in = nlapiGetFieldValue('custrecord_main_add');
		addr2_in = nlapiGetFieldValue('addr2');
		state_in = nlapiGetFieldValue('state');
		
		// Store Initial Address Approval Values for approval process
		// Note: Not all values are always stored 
		
	
		// if this is a brand new Address Record then default Address Location Type to Billing 
		recId = nlapiGetRecordId();

		if (!recId)
		{
			newadd = 'T';
		}
	
		if(newadd == 'T'  && !addr2_in)
		{
			nlapiSetFieldValue('custrecord_is_billto', 'T', false, true);
		}	
 	
		// Only Administrator can edit the "Address Label" & "Address Customer" & "Has Legacy Mapping" fields if displayed
		//US116612 Address label no longer required 
 	
		if (nlapiGetRole() != 3)
		{
			nlapiDisableField('custrecord_address_customer', true);
		}

		// US177673 set the override indicator to 'F'
		if (nlapiGetFieldValue('override') == 'T')
		{
			nlapiSetFieldValue('override', 'F', false, true);
		}
		
		// Hide the Override Address field
		nlapiGetField('override').setDisplayType('hidden');
		

		// Set Customer Id for control record processing (currCust)  US116612
		if (!nlapiGetFieldValue('custrecord_address_customer'))
		{
			// US116612 Retrieve CustId from URL (but only if we need to set the address customer)
			currCust = populate_customer();
		}
		else
		{
			currCust = nlapiGetFieldValue('custrecord_address_customer');
		}
// alert('currCust = ' +currCust); 		
		
		// US116612 Do not allow main addresses to be edited if Customer not known
		if (custErr == true && mainadd_in == 'T')
		{
			alert('To edit this address please cancel from this address, save any changes you have made to the customer and then re-edit this address for the customer.');
		}
		
		// Retrieve Customer Address Control Record Values US116612
		if (custErr != true)
		{
			rtvCacRec();
		}
 	} // End UI context
 	
} // End addressForm_load	

function addressForm_save()
{
	// US116612 Error message if changes made to main address and customer not known/customer address control record not retrieved
	if (custErr == true && mainadd_in == 'T')
	{
		alert('Changes to this address cannot be saved, please cancel from this address, save any changes you have made to the customer and then re-edit this address for the customer.');
		return false;
	}
	
	// US773745 Error message if country chosen is on the bad country list
	var countryIn = nlapiGetFieldValue('country')
	var countryName = nlapiGetFieldText('country')
	
	if (LC_Country.isSalesRestricted(countryIn))
	{
		alert('You have selected a country of '+ countryName +'.  EBSCO is not currently doing business with this country.  Please select a different country');		
		return false;
	}
		
	// US116612 initialise values for Control record update
	var cacfields = new Array();
	var cacvalues = new Array();
	var caccnt = 0;
	var caccmc = ctrl_cmc;
	var caccmstate = ctrl_cmstate;
	var caccmstate2 = ctrl_cmstate2;
	var caccmctry = ctrl_cmctry;
	var caccmctry2 = ctrl_cmctry2;
	var caccmid = ctrl_cmid;
	var caccmid2 = ctrl_cmid2;
	
	var mainadd = nlapiGetFieldValue('custrecord_main_add');
	
	if (ctrl_imc > 2 && caccmc != 0 && mainadd == 'T')
	{
		alert('Exceptional Error: Please remove Main Address Indicator from this Address. For Customers loaded with > 2 Main Addresses ALL Main address indicators must be unset & the address saved BEFORE the Main indicator can be set on the correct address.')
		return false;
	}
	
	// Retrieve address fields required for validation
	var addressee = nlapiGetFieldValue('addressee');
	var addr1 = nlapiGetFieldValue('addr1');
	var addr2 = nlapiGetFieldValue('addr2');
	var addr3 = nlapiGetFieldValue('addr3');
	var zip   = nlapiGetFieldValue('zip');
	var country = nlapiGetFieldValue('country');
	var state = nlapiGetFieldValue('state');
	var city = nlapiGetFieldValue('city');
	var isbill = nlapiGetFieldValue('custrecord_is_billto');
	var isship = nlapiGetFieldValue('custrecord_is_shipto');

	// 2015-09-28 field length parameters for OPS.  80 char limit for all fields below except postal code is 15

	if (addressee.length > 83)
	{
		alert('Addressee cannot be more than 83 characters');
		return false;			
	}
	if (addr1.length > 80) // ops requirement
	{
		alert('Department/Address 1 cannot be more than 80 characters');
		return false;		
	}
	if (addr2.length > 80) // ops requirement
	{
		alert('Street Address/Address 2 cannot be more than 80 characters');
		return false;		
	}
	// 2017-03-07 Marketo Integration - don't allow string "[no street address provided]"
	if (addr2 == '[no street address provided]')
	{
		alert('Please set your Street Address/Address 2 to something other than [no street address provided]');
		return false;			
	}
	if (addr3.length > 80) // ops requirement
	{
		alert('Address 3 cannot be more than 80 characters');
		return false;		
	}
	// city field in CRM is only 50 characters (OPS can take 80 characters)
	if (zip.length > 15) // ops requirement
	{
		alert('Zip/Postal Code cannot be more than 15 characters');
		return false;		
	}

	// 2015-11-20 Country based Address validation moved from customerForm5.js
	
	switch (country)
	{
	//USA - warn on zip, require state
	case 'US':
		// Warning about Zip Code
		// US234238 Zip code now mandatory for all US addresses
		if (!zip)
		{
			alert('US Addresses require a Zip Code.');	
			return false;
		 }               
		// 2016-01-11 Don't Allow State chosen to be Puerto Rico.  Users should instead choose Country of Puerto Rico
		if (state == 'PR')
		{
			alert('Error: EBSCO synchronization cannot handle State/Province: Puerto Rico. Instead, please change the Country from United States to Puerto Rico and clear out the State/Province');
			return false;         
		}
		// Require State
		if (!state)
		{
			alert('US Addresses require a State.');
			return false;
		}
		break;
		// Canada - require State
	case 'CA':	
		if (!state)
		{
			alert('Canada Addresses require a Province.');
			return false;
		}
		// US234238 Zip code now mandatory for all CA addresses
		if (!zip)
		{
			alert('Canada Addresses require a Zip Code.');	
			return false;
		 }           
		break;
		// AU - require State
	case 'AU':	
		if (!state)
		{
			alert('Australia Addresses require an Australian Territory in State/Province.');
			return false;
		}	
		break;
		// Germany require State
	case 'DE':	
		if (!state)
		{
			alert('German/Deutsche Addresses require a State/Province.');
			return false;
		}
		break;
	}


	// 2015-11-20 Main Address validation moved from Customer Form
	
	// City is required for Main Address 06/05/2016 Now required for all addresses
	var citytrim = trim(city);
	if (!citytrim)
	{
		alert('City is required.  If your address does not have a City then please enter Town or other Address Element instead.');
		return false;		
	}

 	
 	
 // Check for change in Main Address Indicator and adjust Control Total & stored values accordingly
 	if (mainadd != mainadd_in)
 	{
 		if (mainadd == 'T')
 		{
 			caccmc = caccmc + 1;
 			if (caccmc <= 2)
 			{
 				if (!caccmid)
 				{
 					if (newadd == 'T') {caccmid = 'new'} else {caccmid = recId}
 					caccmstate = state;
 					caccmctry = country;
 				}
 				else if(!caccmid2)
 				{
 					if (newadd == 'T') {caccmid2 = 'new'} else {caccmid2 = recId}
 					caccmstate2 = state;
 					caccmctry2 = country;
 				}
 				else
 				{
 					alert('Error: There has been an error processing the changes to this address.  Please select "Cancel" and re-edit address.')// something has gone terribly wrong & cannot continue
 					return false;
 				}
 			}
 			else // caccmc > 2
 			{
 				alert('Error: Too many Main addresses specified. Please remove "Main" address designation before saving address.');
 				return false;
 			}
 		}
 		else
 		{
 			caccmc = caccmc - 1;
 			if ((newadd == 'F' && caccmid == recId)||(newadd == 'T' && caccmid == 'new'))
 			{
 				caccmid = '';
 				caccmstate = '';
 				caccmctry = '';
 			}
 			else if ((newadd == 'F' && caccmid2 == recId)||(newadd == 'T' && caccmid2 == 'new'))
 			{
 				caccmid2 = '';
 				caccmstate2 = '';
 				caccmctry2 = '';
 			}
 		}
 	
		cacfields[0] = 'custrecord_curr_main_cnt';
		cacvalues[0] = caccmc;
		cacfields[1] = 'custrecord_curr_main_id';
		cacvalues[1] = caccmid;
		cacfields[2] = 'custrecord_curr_main_ctry';
		cacvalues[2] = caccmctry;
		cacfields[3] ='custrecord_curr_main_state';
		cacvalues[3] = caccmstate;
		cacfields[4] = 'custrecord_curr_main_id_2';
		cacvalues[4] = caccmid2;
		cacfields[5] = 'custrecord_curr_main_ctry_2';
		cacvalues[5] = caccmctry2;
		cacfields[6] ='custrecord_curr_main_state_2';
		cacvalues[6] = caccmstate2;
 		caccnt = 7;
 		if (caccmc > 1 && ctrl_imc <= 2)
 		{
 			alert('Warning: This Customer currently has ' + caccmc +' Main Addresses specified - please adjust Main addresses before saving this Customer there should only be one.');
 		}
 		else if(caccmc <= 0)
 		{
 			alert('Warning: This Customer currently has no Main Addresses specified - please set a Main addresses before saving this Customer.');
 		}
	
 	}
 	else if (mainadd_in == 'T') 
 	// US116612 Check Country & State are correct for Main Address - doing it this way as cannot detect Country changes & this handles changes to state due to address rejection.
 	{
 		
 		if ((newadd == 'F' && caccmid == recId)||(newadd == 'T' && caccmid == 'new'))
 		{
 			if (caccmstate != state || caccmctry != country)
 			{
 				caccmstate = state;
 				caccmctry = country;
 				cacfields[0] = 'custrecord_curr_main_ctry';
 				cacvalues[0] = caccmctry;
 				cacfields[1] ='custrecord_curr_main_state';
 				cacvalues[1] = caccmstate;
 				caccnt = 2;
 			}
 		}
 		else if ((newadd == 'F' && caccmid2 == recId)||(newadd == 'T' && caccmid2 == 'new'))
 		{
 			if (caccmstate != state || caccmctry != country)
 			{
 				caccmstate2 = state;
 				caccmctry2 = country;
 				cacfields[0] = 'custrecord_curr_main_ctry_2';
 				cacvalues[0] = caccmctry2;
 				cacfields[1] ='custrecord_curr_main_state_2';
 				cacvalues[1] = caccmstate2;
 				caccnt = 2;
 			}
 		}
 		else
 		{
 			alert('Error: There has been an error processing the changes to this address.  Please select "Cancel" and re-edit address.')// something has gone terribly wrong & cannot continue
 			return false;
 		}
 	}

 	if (caccnt > 0)
 	{
 		nlapiSubmitField('customrecord_cust_add_control', ctrl_recId, cacfields, cacvalues, true);	
 	}
	return true;
}

function addFieldChanged(type, name)
//addFieldChanged - Field changed processing (US51481)
{

	// Main Address processing & Address Approval trigger field
	if (name == 'custrecord_main_add')
	{
		// if this is being set and Customer is not available then error message & reinstate previous value
		if (custErr == true)
		{
			alert('Warning: To set/unset this as Main address please save Customer & re-edit. If this is a new Customer then first Address will be set as Main.');
			if (nlapiGetFieldValue('custrecord_main_add') == 'T')
			{
				nlapiSetFieldValue('custrecord_main_add', 'F', false, true);
			}
			else
			{
				nlapiSetFieldValue('custrecord_main_add', 'T', false, true);
			}
		}		
	}
	
	// Main Address processing & Address Approval trigger field
	if (name == 'state' && nlapiGetFieldValue('state') != state_in)
	{
		// if this is being set and Customer is not available then error message & reinstate previous value
		if (custErr == true && nlapiGetFieldValue('custrecord_main_add') == 'T')
		{
			alert('Warning: To adjust the State on this address please save Customer & re-edit.');
		}
		
	}
}


function rtvCacRec()
{

	var userId = nlapiGetUser();
	// Locate Custom Record 
	var crfilters = new Array();
	
	if (currCust == '')
	{
		crfilters[0] = new nlobjSearchFilter('custrecord_cac_new', null, 'is', 'T');
	}
	else
	{
		// US157010 Check for inactive & adjust filters accordingly
		inact = nlapiLookupField('customer', currCust, 'isinactive');
		if (inact != 'T')
		{
			crfilters[0] = new nlobjSearchFilter('custrecord_cac_customer', null, 'anyof', currCust);
		}
		else
		{
			crfilters[0] = new nlobjSearchFilter('custrecord_cac_cust_inact', null, 'is', 'T');
			crfilters[2] = new nlobjSearchFilter('custrecord_cac_cust_inact_id', null, 'is', currCust); 
		}
	}
	crfilters[1] = new nlobjSearchFilter('custrecord_cac_user', null, 'anyof', userId);
	
	   	var crcolumns = new Array();
	   	var crlen = 0;
	   	crcolumns[0] = new nlobjSearchColumn('custrecord_curr_main_cnt', null, null);
	   	crcolumns[1] = new nlobjSearchColumn('custrecord_curr_main_id', null, null);
	   	crcolumns[2] = new nlobjSearchColumn('custrecord_curr_main_ctry', null, null);
	   	crcolumns[3] = new nlobjSearchColumn('custrecord_curr_main_state', null, null);
	   	crcolumns[4] = new nlobjSearchColumn('custrecord_curr_main_id_2', null, null);
	   	crcolumns[5] = new nlobjSearchColumn('custrecord_curr_main_ctry_2', null, null);
	   	crcolumns[6] = new nlobjSearchColumn('custrecord_curr_main_state_2', null, null);
	   	crcolumns[7] = new nlobjSearchColumn('custrecord_init_main_cnt', null, null);
	   	crsearchResults = nlapiSearchRecord('customrecord_cust_add_control', null, crfilters, crcolumns);
	   	if (crsearchResults)
	   	{
	   		crlen = crsearchResults.length;
	   	}	
	   	if (crlen == 1) 
	   	{
	   		var crsearchResult = crsearchResults[ 0 ];
	   		ctrl_recId = crsearchResult.getId();
		   	ctrl_cmc = parseInt(crsearchResult.getValue('custrecord_curr_main_cnt'));
		   	ctrl_cmid = crsearchResult.getValue('custrecord_curr_main_id');
		   	ctrl_cmctry = crsearchResult.getValue('custrecord_curr_main_ctry');
		   	ctrl_cmstate = crsearchResult.getValue('custrecord_curr_main_state');
		   	ctrl_cmid2 = crsearchResult.getValue('custrecord_curr_main_id_2');
		   	ctrl_cmctry2 = crsearchResult.getValue('custrecord_curr_main_ctry_2');
		   	ctrl_cmstate2 = crsearchResult.getValue('custrecord_curr_main_state_2');
		   	ctrl_imc = parseInt(crsearchResult.getValue('custrecord_init_main_cnt'));
	   	}
	   	else
   		{
	   		custErr = true;	
   		}
}

function getURLParameterValue(name)
{
	
	try
	{
	var value = decodeURIComponent((new RegExp('[?|&]' + name + '='
            + '([^&;]+?)(&|#|;|$)').exec(parent.location.search) || [ , "" ])[1]
    .replace(/\+/g, '%20'))||null;
     return value;
	}
	catch(ex)
	{
		return 'URL error';
	}
	return null;
}

function populate_customer()
{

//	var url = window.parent.location.search.substring(1);
//alert('pop Cust url = ' +url);
	var entity = getURLParameterValue('id');
//alert('entity = ' +entity);
	
	if (entity && entity != 'URL error')
	// Entity retrieved from URL without error	
	{
		try
		{
			nlapiSetFieldValue('custrecord_address_customer', entity, false, true);
			return entity;
		}
		catch(err)
		{
			return entity;
		}
	}
	else if(!entity) 
	// New Customer	
	{
		return '';
	}	

	// Everything else is an Error with no Customer	
	custErr = true;
	return '';
		
}


