// EP ADDRESS CODE - 02/19/2007 - Matt Jones
//
// Script:     client_customerForm5.js
//
// Created by: EBSCO Information Services
//
// Function:   	
//				
//	
//
//
// Revisions:  
//	CNeale	11/20/2015	Restructuring Addresses.               
//						Put chunks of code in Address form script.
//                      Update function getIndexMain to reflect changes to address structure
//
//	CNeale	11/21/2015	Temporary changes to resolve implementation issue with Chrome & IE.
//						EP territory check null/empty territory error now only when indexMain > 0.
//						Comment out attempt to set Main Address if not found - this was causing the error.	
//                       
//	EAbramo 04/11/2016 	Commented out code relating to MARC Record - PS Web.
//
//	CNeale 	05/06/2016	Cust Auth US51481 Changes
//                      Population of Address Customer on Address.
//                      US94755 Refactor Address Changes
//						Cust Auth US75549 Changes
//                      Do not allow SSD roles with edit authority to edit non-SSD FTE values
//  					DE14373 fix (deleted address check for address line 2 before validating detail).
//
//	CNeale	08/02/2016	Cust Auth US116612 Changes
//                      Use Custom Customer Address Control record to control main address processing.
//                      Replace id field retrieve with CustrecId.
//                      Remove EpAuFix processing.
//
//  JOliver  10/17/2016 FOLIO Tab - making LOI Stakeholder and LOI Stakeholder Email required when Signed LOI is checked
//  JOliver  11/30/2016 FOLIO Tab - Commitment Probability required when Level of Commitment is populated
//
//	eabramo	 03/07/2017 Marketo Implementation: Lead/Prospect form edits now okay so long as creation of new customer 
//					Enable the isInactive field and the SalesRep field - if role is Admin or Order Processing
//						elimination of the OP Customer Form and Mktg Customer form
//					New Address Error valdation - need Main Address
//	CNeale	05/09/2018	DE30307 Customer creation territory selection loophole fix 
//	JOliver	10/05/2020	US701852 Disallow non-Admins from selecting Group segments
//	PKelleher 12/14/2020  Continuous Ops PI20 I4/I5 (Bob Cronk request) - Allow only GCS Dept (id=2) & GCS Far East Dept (id=95) & CRM Admin (id=53) edit rights to new DDE CustSat Notes field.  All others to have view rights. 
//  ZScannell 3/1/2022	US927406	Customer Authority Changes
//	eAbramo	03/15/2022	US911182 Fix defects with OE approval and Customer is Inactive flags
//	PKelleher  5/8/2023	US1096193 Disallow and give alert if user attempts to uncheck a Clinical Decisions customer who has at least one Contact with CDP access status of Approved or Granted.
//	PKelleher  9/7/2023	US1157768 Make UP TO DATE EXPIRE DATE field mandatory when UP TO DATE SUBSCRIBER box is checked; Make LIPPENCOTT SUBSCRIBER DATE field mandatory when LIPPENCOTT SUBSCRIBER is checked;
//						make CLINICAL KEY FOR NURSES SUBSCRIBER DATE mandatory when CLINICAL KEY FOR NURSES SUBSCRIBER box is checked
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var custRecId;
var previousState;
var previousCountry;
var corpIndicator;
var comma_delim_string;
var comma_delim_string2;
var comma_delim_string3;
var has_bad_char2;
var notCustomer = false;
var multi_territory = false;
//11/20/2015 Global indicator for Address Book error - blank details (only used in this script)
var global_addressBookError = 0;
var global_addressDelError = '';
// Customer Address Control Workfields (US116612)
var cacid = '';
var init_cac_add_cnt = 0;
var init_cac_main_cnt = 0;
var init_cac_main_id = '';
var init_cac_main_ctry = '';
var init_cac_main_st = '';
var init_cac_main_zip = '';
var origmarket = '';
var origsegment = '';
var orig_oeApproved = '';	// US911182
var init_cdcustomer = 'F'; // US1096193 (confirm this should be false)

function custFormLoad()
{
	var this_user = nlapiGetUser();
	var user_dept = nlapiLookupField('employee', this_user, 'department');
	var role = nlapiGetRole();
	custRecId = nlapiGetRecordId();
	origmarket = nlapiGetFieldValue('custentity_market');
	origsegment = nlapiGetFieldValue('custentity_marketsegment');
	orig_oeApproved = nlapiGetFieldValue('custentity_oeapproved'); // US911182
	init_cdcustomer = nlapiGetFieldValue('custentity_clinical_decisions_cust'); // US1096193

	// if record is new record then set variable (used in Save function if Market is Corporate) - Eric A. 
	// US116612 also used throughout to indicate a new Customer.
	if (custRecId == "" || custRecId == null)
		{
		corpIndicator = 'new';	
		}
	// if record is loaded as Corporate then set variable (used in Save if Segment is Corporate) - Eric A.
	else if (origsegment == 10)
		{
		corpIndicator = 'loadedCorpSeg';
		}
	// if record is loaded as Corp Association then set variable (used in Save if Segment is Corp Associatoin) - Eric A.
	else if (origsegment == 46)
		{
		corpIndicator = 'loadedAssocSeg';
		}		
	// if NOT new and NOT loaded as Corporate Segment or Corp Association...
	else
		{
		// then set variable (used in Save function) - Eric A.
		corpIndicator = 'loadedNonCorp';
		// clear industry and Association Type
		nlapiSetFieldValue('custentity_industry','');
		nlapiSetFieldValue('custentity_association_type','');
		}	
// custFormLoad() cont.

	// Don't allow for creation of NEW Lead or Prospect
	// Marketo: This code used to run for any edit - code modified on 02-03-2017: runs only on creation of new record
	if (corpIndicator == 'new')
	{
		// Warn user if trying to create LEAD record
		if(nlapiGetFieldValue('stage') == 'LEAD')
		{
			alert('Lead records cannot be recognized by EBSCO Publishing Systems.  Please go back and create this institution as a Customer instead of a Lead');
			notCustomer = true;
		}
		// Warn user if trying to create PROSPECT record		
		if(nlapiGetFieldValue('stage') == 'PROSPECT')
		{
			alert('Prospect records cannot be recognized by EBSCO Publishing Systems.  Please go back and create this institution as a Customer instead of a Prospect');
			notCustomer = true;
		}		
	}


	// if Not new record -- lock down Market and Segment fields
	// so long as Role is not Admin, Sales Admin (1007), OE (1011), Sales Analyst (1053)
	// and Inside Sales Director (1001) Eric A
	// 2017-02-03 qualify to ONLY lock down if stage is not Customer
	if (nlapiGetFieldValue('stage') == 'CUSTOMER')
	{
		if (custRecId != "" && custRecId != null && role != '3' && role != '1007' && role != '1011' && role != '1001' && role != '1053')
		{
			nlapiDisableField('custentity_market', true);
			nlapiDisableField('custentity_marketsegment', true);
		}		
	}

	
	// ADDRESS FORM
	
	// US116612 This code retrieves the data from the Customer Address Control Record and saves the values
	//          It replaces previous retrieval via indexMain 
	// This code saves the values for country/state
 	// They will be used later to check for changes upon save
	cacid = nlapiGetFieldValue('custpage_control_rec_id');
	var fields = ['custrecord_init_add_count', 'custrecord_init_main_id', 'custrecord_init_main_ctry', 'custrecord_init_main_state', 'custrecord_init_main_cnt' ];
	var columns = nlapiLookupField('customrecord_cust_add_control', cacid, fields);
	if (columns)
	{
		init_cac_add_cnt = parseInt(columns.custrecord_init_add_count);
		init_cac_main_cnt = parseInt(columns.custrecord_init_main_cnt);
		init_cac_main_id = columns.custrecord_init_main_id;
		init_cac_main_ctry = columns.custrecord_init_main_ctry;
		init_cac_main_st = columns.custrecord_init_main_state;
	}	
	// This includes values for Country/State used in EP Territory processing
	previousState = '';
	previousCountry = '';
	if (nlapiGetFieldValue('custentity_epterritory') != '')
	{
		previousState = init_cac_main_st;
		previousCountry = init_cac_main_ctry;
	}
	
	if (init_cac_main_cnt > 2) //US116612 this should only happen if multiple Customer merges have taken place. 
	{
		alert('Exceptional Warning: This Customer has '+init_cac_main_cnt +' Main Addresses.  Please edit addresses to remove ALL main address indicators, before setting main address indicator on required address.')
	}


	// 2016-10-21 Disable the isInactive field and the SalesRep field - if role is not Admin or Order Processing (1011)
	if (role != '3' && role != '1011')
	{
		nlapiDisableField('isinactive', true);
		// If this is not a new record also disable the salesRep field (Primary DDE Sales Rep)
		if (nlapiGetRecordId() != '' && nlapiGetRecordId() != null)
		{
			nlapiDisableField('salesrep', true);		
		}

	}

	// 2014-06 eabramo: call the has_portal_access function to flag if Customer has Case Portal Access
	has_portal_access();

	// Enable the Partner Type field for EP Support Person 1 role (Deb Breen/Greg Julien)
	// E Abramo added 9-13-07
	if (role == 1003 || role == 1010)
	{
		nlapiDisableField('custentity_partner_type',false);
	}

	// 2017-03-08 disable the Customer Sync to Marketo field 
	// needs to be enabled for Admin role so that the Contact After Submit code can run properly
	nlapiDisableField('custentity_customer_sync_to_marketo', true);
	
	// enable the CAS field for support roles only
	if (role == 1002 || role == 1003 || role == 1006)
	{
		nlapiDisableField('custentity_cas_level',false);
	}
	
	// Disable the DDE FTE fields for SSD roles: SSD Approver (1100), SSD Manager (1096) && SSD Customer Service (1099) 
	if (role == 1100||role == 1096||role == 1099 )
	{
		nlapiDisableField('custentity_fte', true);
		nlapiDisableField('custentity3', true);
	}
	// 12/14/2020 If not in GCS Dept (id=2) or GCS Far East Dept (id=95) or CRM Dept (id=53) then make DDE CustSat Notes field view only
	if (user_dept != LC_Departments.GlobalCustSupDDE && user_dept != LC_Departments.FarEastSupDDE && user_dept != LC_Departments.CRMSystems)
	{
		nlapiGetField('custentity_dde_custsat_notes').setDisplayType('disabled');
	}
}

function custFieldChanged(type, name)
{
	// function created 12/19/2005 by Matt Jones for FTE date stamp functionality
	// purpose:  trigger a datestamp update for FTE field changes

	// logic added 1/3/2006 by Matt Jones for Industry field
	// purpose:  hide or unhide the Industry field based on market segment selection
	
	
	// EP TERRITORY 
	if(name=='custpage_epterritory_selector')
	{
		nlapiDisableField('custentity_epterritory',false);
		nlapiSetFieldText('custentity_epterritory',nlapiGetFieldText('custpage_epterritory_selector'), true, true);
		nlapiDisableField('custentity_epterritory',true);
		// EP territory and address code re-work 09-2014
		alert('Territory Changed, Save this record to commit your changes');		
	}
	
	if(name=='custentity_fte')
	{
		// if the FTE field changes, store the date into the fte date stamp field 
		// UPDATE - 3/1/2006 to pass CRM formatted date string
		nlapiSetFieldValue('custentity_fte_datestamp',nlapiDateToString(new Date()));
	}
	
// custFieldChanged(type, name) cont.

	if(name=='custentity_nl_discount_percent')
	{
		// if the NL Discount Percent changes, store the date into the NL Discount Percent Date Stamp field 
		nlapiSetFieldValue('custentity_nl_discount_perc_lastupdated',nlapiDateToString(new Date()));
	}		

	if(name=='custentity_ranking_number')
	{
		// if the Corporate Ranking Number field changes, store the date into the Ranking Number date stamp field 
		nlapiSetFieldValue('custentity_ranking_date_stamp',nlapiDateToString(new Date()));
	}
	
	// logic added 05/14/2007 by Eric Abramo
	if(name=='custentity_number_of_locations')
	{
		// if the Number of Locations field changes, store the date into the Number of Locations Date Stamp field 
		nlapiSetFieldValue('custentity_num_locations_date_stamp',nlapiDateToString(new Date()));
	}

	// added 5/06/2014 E Abramo - ILS Vendor Date Stamp
		if(name=='custentity_ils_vendor_comp_products')
		{
			// if the ILS Vendor field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_ils_vendor_update',nlapiDateToString(new Date()));
		}

		if(name=='custentity_other_ils_vendor')
		{
			// if the ILS Vendor field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_ils_vendor_update',nlapiDateToString(new Date()));
		}

	// added 5/06/2014 E Abramo - Discovery Vendor Date Stamp
		if(name=='custentity_discovery_vendor_eds')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}

		if(name=='custentity_discovery_vendor_summon')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}

		if(name=='custentity_discovery_vendor_primo_centra')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}

// custFieldChanged(type, name) cont.
		if(name=='custentity_discovery_vendor_world_cat')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}
		
		if(name=='custentity_discovery_vendor_encore')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}	

		if(name=='custentitydiscovery_vendor_other')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}

		if(name=='custentity_discovery_vendor_none')
		{
			// if the Discovery Vendor checkbox field changes, store the date into the ILS Vendor date stamp field 
			nlapiSetFieldValue('custentity_disc_vendor_update', nlapiDateToString(new Date()));
		}


	// logic updated 12-28-2007 by Eric Abramo
	// JO 10-05 US701852 added validation for Group segments on Segment change
	if(name=='custentity_marketsegment')
	{
		// if the market changes and is not corporate and industry is not null
		// clear industry

		var changedsegment = nlapiGetFieldValue('custentity_marketsegment');
		var industry = document.getElementById('custentity_industry_fs');
		var role = nlapiGetRole();
		
		if (changedsegment != 10 && industry != null)
		{
			// clear value
			nlapiSetFieldValue('custentity_industry','');		
		}
		
		// US701852	Disallow non-Admins from selecting Group segments
		if (role != LC_Roles.Administrator && role != LC_Roles.EPSalesAdmin)
		{
	        if(LC_Segment.IsGroupSegment(changedsegment))
	        {
	                        okToSave = false;
	                        alert('Please contact Sales Operations (smt@ebsco.com) if you would like to assign a Group segment');
	                     // reset value
	                        nlapiSetFieldValue('custentity_market',origmarket,false, true);
	            			nlapiSetFieldValue('custentity_marketsegment',origsegment,false, true);	
	        }
		}
	}
	
	// US911182 Fix Defect where Users can unset OE Approved Flag (should not be able to do)
	if(name == 'custentity_oeapproved'){
		if(nlapiGetFieldValue('custentity_oeapproved') == 'F' && orig_oeApproved == 'T'){
			alert('You cannot unset OE Approved.  Consider using the "Customer is Inactive" checkbox instead.');
			nlapiSetFieldValue('custentity_oeapproved', 'T', false, true);
		}
	}
	
	
	
// custFieldChanged(type, name) cont.	
	if (name == 'isinactive')
	{
		if (nlapiGetFieldValue('isinactive') == 'T')
		{
			// Run a search looking for Active EIS Accounts
			var CustName = nlapiGetFieldValue('id');
			// filters
			var eis2filters = new Array();
			eis2filters[0] = new nlobjSearchFilter('custrecord_eis_account_customer', null,'anyof', CustName);
			eis2filters[1] = new nlobjSearchFilter('isinactive', null,'is', 'F');
			// column
			var eis2columns = new Array();
			eis2columns[0] = new nlobjSearchColumn('internalid', null, null);
			//execute my search
			eis2_searchResults = nlapiSearchRecord('customrecord_eis_account', null, eis2filters, eis2columns);
			if (eis2_searchResults)
			{
				nlapiSetFieldValue('isinactive', 'F');
				alert('This Customer has active EIS Accounts and therefore cannot be inactivated. It has been re-activated');
			}
			// Clear the Parent/Child Relationshipo if inactivating this one
			if (nlapiGetFieldValue('parent') != '' && nlapiGetFieldValue('parent') != null)
			{
				nlapiSetFieldValue('parent', '');
				alert('This customer\'s parent customer has been removed from this record.  Inactive Customers shouldn\'t have a parent');
			}		
		}
	}


	// custFieldChanged(type, name) cont.
	// US1096193 Disallow and give alert if user attempts to uncheck a Clinical Decisions customer who has at least one Contact with CDP access status of Approved or Granted
	if (name == 'custentity_clinical_decisions_cust') {
		// alert('clicked CD button checked or unchecked');
		if (nlapiGetFieldValue('custentity_clinical_decisions_cust') == 'F') {
			// Run a search looking for CD Contacts with CDP access of Approved or Granted
			var CDcustID = nlapiGetFieldValue('id');
			//alert('CDcustID is ' + CDcustID);
			// filters
			var CDPcust2filters = new Array();
			CDPcust2filters[0] = new nlobjSearchFilter('company', null, 'anyof', CDcustID);
			CDPcust2filters[1] = new nlobjSearchFilter('custentity_sf_clinical_dec_access_status', null, 'anyof', LC_Prop_Based_Access.Granted, LC_Prop_Based_Access.Approved);
			// alert('CDPcust2filters is ' + CDPcust2filters);
			// column
			var CDPcust2columns = new Array();
			// alert('CDPcust2columns is ' + CDPcust2columns);
			CDPcust2columns[0] = new nlobjSearchColumn('internalid', null, null);
			//execute my search
			CDPcust2_searchResults = nlapiSearchRecord('contact', null, CDPcust2filters, CDPcust2columns);
			// alert('CDPcust2_searchResults Columns equals CDPcust2_searchResults' + CDPcust2_searchResults);
			if (CDPcust2_searchResults) {
				// alert('if cd cust is f then switch to t alert');
				alert('The Clinical Decisions Customer checkbox cannot be unchecked on this Customer because there is at least one contact with a Clinical Decisions Access Status of Approved or Granted. You can revoke this persons CD access status to remove the customer as a CD customer.');
				nlapiSetFieldValue('custentity_clinical_decisions_cust', 'T', 'F');
			}
		}

	}

	}

function custFormSave()
{	
	var okToSave = true;
	var market = nlapiGetFieldValue('custentity_market');
	var segment = nlapiGetFieldValue('custentity_marketsegment');	
	var industry = nlapiGetFieldValue('custentity_industry');
	var assoc_type = nlapiGetFieldValue('custentity_association_type');
	// Define Current Country & State (US116612)
	var currentCountry = '';
	var currentState = '';


	// 2015-04-21 BSE 5.1 Validate all Addresses
	var addressCount = nlapiGetLineItemCount('addressbook');
	if (addressCount == 0)
	{
		alert('Error: you must enter an Address for this Customer');
		okToSave = false;
	}
	
	// US116612 This replaces the existing code - main address is retrieved from Customer Address Control Record
		
		// Retrieve Update Details from Control Record  
		var fields = ['custrecord_curr_main_cnt', 'custrecord_curr_main_id', 'custrecord_curr_main_ctry', 'custrecord_curr_main_state', 
		              'custrecord_curr_main_id_2', 'custrecord_curr_main_ctry_2', 'custrecord_curr_main_state_2'];
		var columns = nlapiLookupField('customrecord_cust_add_control', cacid, fields);
		if (!columns)
		{	
			alert('WARNING: You may have pressed "Save" twice.  If record does not save please cancel and re-edit.');
			return(false);
		}
		var curr_cac_main_cnt = parseInt(columns.custrecord_curr_main_cnt);
	    var curr_cac_main_id = columns.custrecord_curr_main_id;
	    var curr_cac_main_ctry = columns.custrecord_curr_main_ctry;
	    var curr_cac_main_st = columns.custrecord_curr_main_state;
	    var curr_cac_main_id_2 = columns.custrecord_curr_main_id_2;
	    var curr_cac_main_ctry_2 = columns.custrecord_curr_main_ctry_2;
	    var curr_cac_main_st_2 = columns.custrecord_curr_main_state_2;
	    // US116612 Check for exceptional situation where > 2 initial main addresses
	    if (init_cac_main_cnt >2 && (curr_cac_main_cnt != 1 || curr_cac_main_cnt == 1 && !curr_cac_main_id && !curr_cac_main_id_2))
	    {
	    	alert('Exceptional Error: For Customers loaded with > 2 Main Addresses ALL Main address indicators must be unset & the address saved BEFORE the Main indicator can be set on the correct address. ');
	    	return(false);
	    }
	    


	    // US116612 No longer check for blank address lines - these are now deleted automatically,
	    //          if only address line is blank then there will be no Main Address & EP Territory processing will detect error     
		
	
		if(curr_cac_main_cnt == 1 || corpIndicator == 'new'  && curr_cac_main_cnt == 0)
		// Single Main Address or New Customer with no Main Address so first address record to be used as Main 	
		{
			if (curr_cac_main_cnt == 1)
			{
				if(curr_cac_main_id)
				{
					currentCountry = curr_cac_main_ctry;
					currentState = curr_cac_main_st;
				}
				else if(curr_cac_main_id_2) 
				{
					currentCountry = curr_cac_main_ctry_2;
					currentState = curr_cac_main_st_2;
				}
				else
				// Something has gone seriously wrong - need to restart editing....	
				{
					alert('Please check Main Address details - unable to identify Country/State. If problem persists please Cancel changes & re-edit Customer');
					return(false);
				}
			}
			else
			{
				// Retrieve info from first address record
				var addressCount = nlapiGetLineItemCount('addressbook');
				// Find first non-blank address  
				currentCountry = '';
				for (var a = 1; a <= addressCount; a++)
				{		
					nlapiSelectLineItem('addressbook', a);
					// Exclude any addresses that have no address details entered via the address form &
					if (!nlapiGetCurrentLineItemValue('addressbook', 'addr2'))
					{
						continue;
					}
					currentCountry = nlapiGetCurrentLineItemValue('addressbook', 'country');
					currentState = nlapiGetCurrentLineItemValue('addressbook', 'state');
					break;	
				}
				if (currentCountry == '')
				{
					alert('ERROR: You must enter a non-blank address for this Customer');
					return(false);
				}
			}
			
			// DE30307 If EP Territory is not set then ensure that previousCountry and previousState are both unset
			var territory = nlapiGetFieldValue('custentity_epterritory');
			if (territory == '' || territory == null)
			{
				previousCountry = '';
				previousState = '';
			}
			
			// Change of Country/State Territory 
			if( (currentCountry != previousCountry) || (currentState != previousState) )
			{
				// EP territory and address code re-work 09-2014
				epTerritory(currentCountry, currentState); 
				if (multi_territory == true)
				{
					alert('Notice:  More than one territory found.  Please select a territory from the dropdown list.');
					return(false);
				}
				if (multi_territory == false)
				{
					alert('New territory selected: '+nlapiGetFieldText('custentity_epterritory'));
				}
			}
		}
		// 2017-02 Marketo:  Handle curr_cac_main_cnt of zero - give user indication of errror 
		else if (curr_cac_main_cnt == 0)
		{
			// okToSave = false;  This error is important enough to live on its own
			alert('In order to save this Customer you must enter a valid address and it must be flagged as the the Main Address.');
			return false;
		}		
		else
		{
			okToSave = false;
			alert('This Customer has '+curr_cac_main_cnt +' Main Addresses, please edit addresses to ensure exactly 1 Main Address exists.');
		}


		// EP territory check
		territory = nlapiGetFieldValue('custentity_epterritory');
		if ((territory == null || territory == '') && (curr_cac_main_cnt == 1 || corpIndicator == 'new'  && curr_cac_main_cnt == 0))
// DE30307 Check expanded to include "|| corpIndicator == 'new' && curr_cac_main_cnt == 0" 
		{
			okToSave = false;
			alert('Territory Error:  No territory selected.  Please select a territory.');
		}  
// US116612 End of existing code replace		

	// don't allow Corporate Hospital Segment
	if (segment == '44')
	{
		okToSave = false;
		alert('Customers can NOT be assigned to the Corporate Hospitals Segment.  Please assign a new Segment');	
	}

// custFormSave() cont.
 	// don't allow EP Gift Segment
 	if (segment == '67')
 	{
 		okToSave = false;
 		alert('Customers cannot be assigned to the EP Gift Segment.  Please assign a new Segment');	
	}

	// Also don't allow various int'l school segments 56, 53, 54	
 	if (segment == '56' || segment == '53' || segment == '54')
 	{
 		okToSave = false;
 		alert('Customers cannot be assigned to the American Int\'l School, British Int\'l School or Canadian Int\'l School segment.  Please assign to the Int\'l School Segment');	
	}

	// Discovery Solutions Tab Validation -- ensure that if "Other" is selected, the user must describe the other in text field
	if (nlapiGetFieldValue('custentity_ds_customer_ils')== '34')
	{
	    	if (nlapiGetFieldValue('custentity_ds_other_ils_vendor') == '' || nlapiGetFieldValue('custentity_ds_other_ils_vendor') == null)
	    	{
	    		alert('See Discovery Solutions tab/section.  You selected Customer ILS of \'Other\', please provide a description of the other ILS Vendor');
			okToSave = false;
		}
	}
	
// custFormSave() cont.

	if (nlapiGetFieldValue('custentity_ds_linking_software')== '16')
	{
		if (nlapiGetFieldValue('custentity_ds_other_linking_software') == '' || nlapiGetFieldValue('custentity_ds_other_linking_software') == null)
	    	{	 	
	 		alert('See Discovery Solutions tab/section.  You selected Linking Software of \'Other\', please provide a description of the other Linking Software');
			okToSave = false;
		}	
	}

	if (nlapiGetFieldValue('custentity_ds_other_customer_software')== '17')
	{
		if (nlapiGetFieldValue('custentity_ds_other_cust_software_desc') == '' || nlapiGetFieldValue('custentity_ds_other_cust_software_desc') == null)
	    	{
			alert('See Discovery Solutions tab/section.  You selected Other Customer Software of \'Other\', please provide an Other Customer Software Description');
			okToSave = false;
		}
	}

	// Check Industry field for Corporate Segment
	// Check Association Type for Association Segment  	
	// altered 04-08-2008 by Eric Abramo -- added corpIndicator variable from 'formLoad' function
	
	// If record is New and Corporate Market
	if ( (corpIndicator == 'new') && (market==3) )
		{	
		if ((segment == 10) && (industry==''))
			{
			alert("The Corporate Segment requires an Industry selection.  Please visit the \"Market Data\" tab/section and select an Industry.");
			okToSave = false;
			}
		if ((segment == 46) && (assoc_type==''))
			{
			alert("The Corporate Associations Segment requires an Association Type selection.  Please visit the \"Market Data\" tab/section and select an Association Type.");
			okToSave = false;
			}
		}

// custFormSave() cont.
	// if record was loaded as Corporate Segment	
	if ( (corpIndicator == 'loadedCorpSeg') && (market==3) )
		{
		// If still Corp Seg and industry is not selected, then tell user to visit Corporate tab -- not allowing a save
		if ((segment==10) && (industry==''))
			{
			alert("The Corporate Segment requires an Industry selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section and select an Industry.");
			okToSave = false;
			}
		// if association - allow save but tell user to set the association
		if ((segment==46) && (assoc_type=='')) 
			{
			alert("Your record will be saved, however, Corporate Associations customers require an Association Type selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section, select an Association Type and SAVE this record again.");
			}
		}
	

	// if record was loaded as Corporate Association Segment
	if ( (corpIndicator == 'loadedAssocSeg') && (market==3) )
		{
		// If still Corp Assoc and Assoc Type is not selected, then tell user to visit Corporate tab -- not allowing a save	
		if ((segment==46) && (assoc_type==''))
			{
			alert("The Corporate Association Segment requires an Association Type selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section and select an Association Type.");
			okToSave = false;			
			}
		if ((segment==10) && (industry==''))
			{
			alert("Your record will be saved, however, Corporate customers require an Industry selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section, select an industry and SAVE this record again.");
			}
		}

	// if record is NOT new and not-Corporate/not-Association Segment
	if ( (corpIndicator == 'loadedNonCorp') && (market==3) )
		{
		// If Corporate Seg and Industry is null - warn user and allow a save (because server script still hiding the Corporate Tab and fields)
		if ((segment==10) && (industry==''))
			{
			alert("Your record will be saved, however, Corporate customers require an Industry selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section, select an Industry and Save this record again.");
			}
		// If Corp Association and Association Type is null - warn user and allow a save (because server script still hiding the Corporate Tab and fields)
		if ((segment==46) && (assoc_type==''))
			{
			alert("Your record will be saved, however, Corporate Associations customers require an Association Type selection.  Please visit the \"Corporate\" or \"Market Data\" tab/section, select an Association Type and Save this record again.");
			}
		}

// custFormSave() cont.

	// Discovery Vendor - require user to enter value if "Other" is selected and Other Vendor isn't specified
	if (nlapiGetFieldValue('custentitydiscovery_vendor_other') == 'T' && (nlapiGetFieldValue('custentity_other_discovery_vendor') == '' || nlapiGetFieldValue('custentity_other_discovery_vendor') == null) )
	{
		alert('See Competitive Info section: if you specify \"Other\" under Discovery Vendor you must specify the vendor name in the Other Discovery Vendor field');
		okToSave = false;
	}

	// eBooks Main Vendor - require user to enter value if "Other" is selected and Other Vendor isn't specified
	if (nlapiGetFieldValue('custentity_ebooks_main_vendor') == '7' && (nlapiGetFieldValue('custentity_other_ebook_vendor') == '' || nlapiGetFieldValue('custentity_other_ebook_vendor') == null) )
	{
		alert('See Competitive Info section: if you specify \"Other\" under eBooks \(Main Vendor\) you must specify the vendor name in the Other Ebook Vendor field');
		okToSave = false;
	}
	
	// ILS Vendor - require user to enter value if "Other" is selected and Other Vendor isn't specified
	if (nlapiGetFieldValue('custentity_ils_vendor_comp_products') == '6' && (nlapiGetFieldValue('custentity_other_ils_vendor') == '' || nlapiGetFieldValue('custentity_other_ils_vendor') == null))
	{
		alert('See Competitive Info section: if you specify \"Other\" under ILS Vendor you must specify the vendor name in the Other ILS Vendor field');
		okToSave = false;
	}

	// LinkResolver - require user to enter value if "Other" is selected and Other Link Resolver isn't specified
	if (nlapiGetFieldValue('custentity_competitor_linkresolver') == '4' && (nlapiGetFieldValue('custentity_competor_otherlinkresolver') == '' || nlapiGetFieldValue('custentity_competor_otherlinkresolver') == null))
	{
		alert('See Competitive Info section: if you specify \"Other\" under Link Resolver you must specify the vendor name in the Other Link Resolver field');
		okToSave = false;
	}


	// EA: added 2/17/2011 - validate string field for NL Customer Authority see below
	// check San Numbers string
	comma_delim_string = nlapiGetFieldValue('custentity_san_numbers');
	check_comma_delim_string(comma_delim_string);	
	if (has_bad_char2 == true)
	{
		alert('The value entered into the SANS Number field contains an illegal character. The value should not contain a space or any of the following characters: ; . / - : _ | +.  To enter multiple values for this Customer you must use a comma between each value and eliminate all spaces.');
		okToSave = false;
	}

	// OCLC Symbol required with two checkboxes
	if (nlapiGetFieldValue('custentity_oclc_symbol')=='' || nlapiGetFieldValue('custentity_oclc_symbol')==null)
	{
		// MARC Record PS Web -- 2016-04-11 removed

		// MARC Record - OCLC Collection Manager
		if (nlapiGetFieldValue('custentity_oclc_collection_mngr') == 'T')
		{
			alert('See Vendor Details tab/section.  When the \'OCLC Collection Manager\' checkbox is checked you must enter an OCLC Symbol.  This record will not be saved.');
			okToSave = false;
		}
	}

// custFormSave() cont.

	var MarcLength = String(nlapiGetFieldValue('custentity_marc_customization')).length;
	if (MarcLength > 500)
	{
		alert("MARC Customization value cannot be more than 500 characters.  Please go to Vendor Details section and truncate the MARC Customization information");
		okToSave = false;
	}

	// 2014-06 eabramo: call the has_portal_access function to flag if Customer has Case Portal Access
	has_portal_access();

	// Prevent Save if trying to create LEAD or Prospect record
	if(notCustomer == true)
	{
		alert('Lead records and Prospect Records cannot be recognized by EBSCO Publishing Systems.  Please go back and create this institution as a \'Customer\' instead of a Lead or Prospect.  This record will not be saved.');
		okToSave = false;
	}

    // Sales > Competitive Intelligence Subtab Validation
    // Validation for 'Research Tools' and 'Institutional Repository'
    // When 'Other' is selected in other of these lists, the corresponding 'other' field must be filled in.
	if (nlapiGetFieldValue('custentity_researchtools') == '11' && nlapiGetFieldValue('custentity_otherresearchtools') == '')
	{
	    alert('See Sales > Competitive Intelligence Subtab. When you select "Other" for Research Tools, you must fill in a value in the Research Tools Other text box.');
	    okToSave = false;
	}
	if (nlapiGetFieldValue('custentity_institutionalrepository') == '5' && nlapiGetFieldValue('custentity_otherinstitutionalrepository') == '')
	{
	    alert('See Sales > Competitive Intelligence Subtab. When you select "Other" for Institutional Repository, you must fill in a value in the Institutional Repository Other text box.');
	    okToSave = false;
	}

	// US1157768 Make UP TO DATE EXPIRE DATE field mandatory when UP TO DATE SUBSCRIBER box is checked;
	// US1157768 Make LIPPENCOTT SUBSCRIBER DATE field mandatory when LIPPENCOTT SUBSCRIBER is checked;
	// US1157768 Make CLINICAL KEY FOR NURSES SUBSCRIBER DATE mandatory when CLINICALKEY FOR NURSES SUBSCRIBER box is checked

	if (nlapiGetFieldValue('custentity_clinical_key_nurse_subscriber') == 'T' && nlapiGetFieldValue('custentity_clinical_key_sub_expire_date') == '')
	{
		alert('See Sales > Competitive Intelligence Subtab. When "Clinical Key for Nurses Subscriber" is checked, you must populate the "Clinical Key for Nurses Subscriber Expire Date" field.');
		okToSave = false;
	}

	if (nlapiGetFieldValue('custentity_lippencott_subscriber') == 'T' && nlapiGetFieldValue('custentity_lippen_sub_expire_date') == '')
	{
		alert('See Sales > Competitive Intelligence Subtab. When "Lippencott Subscriber" is checked, you must populate the "Lippencott Subscriber Expire Date" field.');
		okToSave = false;
	}

	if (nlapiGetFieldValue('custentity_up_to_date_subscriber') == 'T' && nlapiGetFieldValue('custentity_up_to_date_subscriber_date') == '')
	{
		alert('See Sales > Competitive Intelligence Subtab. When "Up To Date Subscriber" is checked, you must populate the "Up To Date Subscriber Expire Date" field.');
		okToSave = false;
	}

    //JOliver  10/17/2016 FOLIO Tab - making LOI Stakeholder and LOI Stakeholder Email required when Signed LOI is checked
    if (nlapiGetFieldValue('custentity_folio_loi') == 'T' && (nlapiGetFieldValue('custentity_loi_stakeholder') == "" || nlapiGetFieldValue('custentity_loi_stakeholder') == null || nlapiGetFieldValue('custentity_loi_email') == "" || nlapiGetFieldValue('custentity_loi_email') == null))
    {
                alert("You have indicated that you have a Signed Letter of Intent.  Please fill in both LOI Stakeholder and LOI Stakeholder Email");
               okToSave = false;
    }
    
    //JOliver  11/30/2016 FOLIO Tab - make commitment probability required when Level of Commitment is chosen
    if (nlapiGetFieldValue('custentity_level_of_commitment') != "" && (nlapiGetFieldValue('custentity_level_of_commitment') != null) && (nlapiGetFieldValue('custentity_commit_prob') == "" || nlapiGetFieldValue('custentity_commit_prob') == null))
    {
                alert("Commitment Probability is a required field when a Level of Commitment is selected.  Please fill in the Commitment Probability");
               okToSave = false;
    }

	// US1096193 Return false and give alert if user attempts to uncheck a Clinical Decisions customer who has at least one Contact with CDP access status of Approved or Granted
	if (init_cdcustomer == 'T' && nlapiGetFieldValue('custentity_clinical_decisions_cust') == 'F') {
		//alert('value of init_cdcustomer is' + init_cdcustomer + 'and value of global_cdcustomer is' + global_cdcustomer);
		var CDcustID = nlapiGetFieldValue('id');
		//alert('CDcustID is ' + CDcustID);
		// filters
		var CDPcust2filters = new Array();
		CDPcust2filters[0] = new nlobjSearchFilter('company', null, 'anyof', CDcustID);
		CDPcust2filters[1] = new nlobjSearchFilter('custentity_sf_clinical_dec_access_status', null, 'anyof', LC_Prop_Based_Access.Granted, LC_Prop_Based_Access.Approved);
		// column
		var CDPcust2columns = new Array();
		CDPcust2columns[0] = new nlobjSearchColumn('internalid', null, null);
		//execute my search
		CDPcust2_searchResults = nlapiSearchRecord('contact', null, CDPcust2filters, CDPcust2columns);
		// alert('CDPcust2_searchResults Columns equals CDPcust2_searchResults' + CDPcust2_searchResults);
		if (CDPcust2_searchResults) {
			// alert('if cd cust is f then switch to t alert');
			alert('This cannot be saved because the Clinical Decisions Customer checkbox cannot be unchecked on this Customer because there is at least one contact with a Clinical Decisions Access Status of Approved or Granted. You can revoke this persons CD access status to remove the customer as a CD customer.');
			nlapiSetFieldValue('custentity_clinical_decisions_cust', 'T', 'F');
			okToSave = false;
		}
	}

	if(okToSave)
	{
		// Added 3/6/2006 for web services synchronization
		nlapiSetFieldValue('custentity_isupdated','T');
		// clears territory selector
		nlapiRemoveSelectOption('custpage_epterritory_selector');

		return(true);
	}
	else
	{
		return(false);
	}
}


function epTerritoryButton()
{
	// Define Current Country & State (US116612)
	var epterrCountry = '';
	var epterrState;
	
	// US116612 Main Address Retrieval via indexMain with Customer Address Control record
	
	// Retrieve Update Details from Control Record  

	var fields = ['custrecord_curr_main_cnt', 'custrecord_curr_main_id', 'custrecord_curr_main_ctry', 'custrecord_curr_main_state', 
	              'custrecord_curr_main_id_2', 'custrecord_curr_main_ctry_2', 'custrecord_curr_main_state_2'];
	var columns = nlapiLookupField('customrecord_cust_add_control', cacid, fields);

	if (columns)
	{
		var curr_cac_main_cnt = parseInt(columns.custrecord_curr_main_cnt);
	    var curr_cac_main_id = columns.custrecord_curr_main_id;
	    var curr_cac_main_ctry = columns.custrecord_curr_main_ctry;
	    var curr_cac_main_st = columns.custrecord_curr_main_state;
	    var curr_cac_main_id_2 = columns.custrecord_curr_main_id_2;
	    var curr_cac_main_ctry_2 = columns.custrecord_curr_main_ctry_2;
	    var curr_cac_main_st_2 = columns.custrecord_curr_main_state_2;
	    // One and only one main address identified - or new Customer with no main address set - use first non-blank
		if(curr_cac_main_cnt == 1 || corpIndicator == 'new' && curr_cac_main_cnt == 0)
		{
			if(curr_cac_main_cnt == 1)
			// Only 1 main address found	
			{
				if(curr_cac_main_id)
				{
					epterrCountry = curr_cac_main_ctry;
					epterrState = curr_cac_main_st;
					epTerritory(epterrCountry, epterrState);
				}
				else if(curr_cac_main_id_2) 
				{
					epterrCountry = curr_cac_main_ctry_2;
					epterrState = curr_cac_main_st_2;
					epTerritory(currentCountry, currentState);
				}
				else
				// Something has gone seriously wrong - need to restart editing....	
				{
					alert('Please check Main Address details - unable to identify Country/State. If problem persists please Cancel changes & re-edit Customer');
				}
			}
			else
			// New Customer with no main address specified	
			{	
				// Retrieve info from first address record
				var addressCount = nlapiGetLineItemCount('addressbook');

				// Find first non-blank address  
				for (var a = 1; a <= addressCount; a++)
				{		
					nlapiSelectLineItem('addressbook', a);
					// Exclude any addresses that have no address details entered via the address form &
					if (!nlapiGetCurrentLineItemValue('addressbook', 'addr2'))
					{
						continue;
					}
					epterrCountry = nlapiGetCurrentLineItemValue('addressbook', 'country');
					epterrState = nlapiGetCurrentLineItemValue('addressbook', 'state');
//	alert('currentCountry = '+ epterrCountry + ' currentState = '+epterrState);
					break;	
				}
				if (epterrCountry == '')
				{
					alert('ERROR: You must enter a non-blank address for this Customer');
				}
				else
				{
					epTerritory(epterrCountry, epterrState);
				}
			}
		}
		else
		{
			alert('This Customer has '+curr_cac_main_cnt +' Main Addresses, please edit addresses to ensure exactly 1 Main Address exists.');
		}
	}
	else // Customer Address Control Record not available
	{
		alert('ERROR: Customer has been edited simultaneously. Please cancel changes & re-edit Customer');
	}
}


function epTerritory(myCountry, myState)
{	// EP territory and address code re-work 09-2014
	var useState = false;
	// insert query for useState
	if (myCountry == 'US' || myCountry == 'CA' || myCountry == 'AU')
	{
		useState = true;
	}

	// Create filter objects
	myFilters = new Array();
	myFilters[0] = new nlobjSearchFilter('custrecord_epterritory_countrycode',null,'is',myCountry);
	myFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	if(useState)
	{
		myFilters[2] = new nlobjSearchFilter('custrecord_epterritory_postaltext',null,'is',myState);
		// v.2007 filter to join on state record.  Allows for auto selection of a territory which has multiple states
		// myFilters[2] = new nlobjSearchFilter('custrecord_epstate_shortname','custrecord_epterritory_state','is',myState);
	}
	// Create column objects
	myColumns = new Array();
	myColumns[0] = new nlobjSearchColumn('internalid');
	myColumns[1] = new nlobjSearchColumn('name');
	// Perform Search
	mySearchResults = nlapiSearchRecord('customrecord83',null,myFilters,myColumns);

// epTerritory(myCountry, myState) cont.	
	// clear selector
	nlapiRemoveSelectOption('custpage_epterritory_selector');
	
	// check result null and length
	if(mySearchResults == null)
	{
		alert('Territory Error:  Territory unknown.  Please make sure the address entered contains a country (and a state if within the US, Canada, Australia or Germany)');
		// if usestate, try searching by country only
		// else clear territory selection
	}

	else 
	{
		// US116612 Retrieve Previous State & Country from parameters passed in to function (replaces retrieve via indexMain)
		previousCountry = myCountry;
		previousState = myState;
		
		if (mySearchResults.length == 1)
		{		
			nlapiDisableField('custentity_epterritory',false);
			nlapiSetFieldText('custentity_epterritory',mySearchResults[0].getValue('name'),true,true);
			nlapiDisableField('custentity_epterritory',true);
//alert('Debug:  Territory selected: ' + mySearchResults[0].getValue('name'));
			multi_territory = false;
			nlapiSetFieldValue('custentity_disp_epterr_ctry', myCountry, true, true);
			nlapiSetFieldValue('custentity_disp_epterr_state', myState,true,true);
		}
		else
		{

			nlapiInsertSelectOption('custpage_epterritory_selector','', '', true);
			for( var i = 0; mySearchResults != null && i < mySearchResults.length; i++)
			{
				//myTd.addOption(mySearchResults[i].getValue('name'),mySearchResults[i].getId);
				nlapiInsertSelectOption('custpage_epterritory_selector', mySearchResults[i].getId, mySearchResults[i].getValue('name'), false);
			}
			nlapiSetFieldText('custentity_epterritory','', true, true);
			nlapiDisableField('custpage_epterritory_selector',false);
			multi_territory = true;
			nlapiSetFieldValue('custentity_disp_epterr_ctry', myCountry, true, true);
			nlapiSetFieldValue('custentity_disp_epterr_state', myState,true,true);
		}
	}
}

// US116612 08/02/2016 getIndexMain function removed 
//                   epAddressError function removed 
//                   epAuFix function removed

function check_comma_delim_string(comma_delim_string)
{
	// EA: Added 02/2011 - validate no spaces or weird chars in comma_delim_string 
	has_bad_char2 = false;
	if (comma_delim_string.indexOf(' ', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf(';', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf(':', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('.', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('/', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('|', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('-', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('_', 0) > '-1') 
	{
		has_bad_char2 = true;
	}
	else if (comma_delim_string.indexOf('+', 0) > '-1') 	
	{
		has_bad_char2 = true;
	}
	else
	{
		has_bad_char2 = false;
	}
}


function has_portal_access()
{
	// If there are Customer Portal Contacts with Access, flag the 'has Case Portal' field
	var hasLoginAccess = false;
	var lineCount = nlapiGetLineItemCount('contactroles');
	for (var i = 1; i <= lineCount; i++)
	{
		if (nlapiGetLineItemValue('contactroles', 'giveaccess', i) == 'T')
		{
			hasLoginAccess = true;
			break;
		}
	}
	if (hasLoginAccess == true)
	{
		nlapiSetFieldValue('custentity_case_portal_access', 'T');
	}
	// If flagged as having access and now DOES NOT have Access, remove flag
	else if (nlapiGetFieldValue('custentity_case_portal_access') == 'T')
	{
		nlapiSetFieldValue('custentity_case_portal_access', 'F');
	}
}


function validateDelete(type,name)

{
	// 2017-03-16 Fix Error when deleting Address that isn't yet in existence - blank address
	var subrecdel = nlapiViewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
	if (type == 'addressbook' && subrecdel != null)
	// Addresses with Main indicator set cannot be deleted.	
	// All other addresses can be deleted.	
	{
		var currentMain = subrecdel.getFieldValue('custrecord_main_add'); 
		if (currentMain == 'T')
		{
			alert('This address is set as the "Main Address" - please set another "Main Address" and remove from this address before deleting.');
			return false;
		}
	
	}
	
	return true;
}

