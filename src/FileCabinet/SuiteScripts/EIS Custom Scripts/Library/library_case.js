//
// Script:     library_case.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of case script functions that may be called from other scripts.
//             Case specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  					Added:	 	Name: 		    Description:
// L_ddeTyptoPortal				2/14/2018	EAbramo			Converts DDE Request Type to Case Portal Request Type
// L_ddeProdtoPortal			2/14/2018	EAbramo			Converts DDE Product/Interface to Case Portal Product
// L_ddeAreaSupporttoPortal		2/14/2018	EAbramo			Converts DDE Area of Support to Case Portal Request Category
// L_checkDDESupportTaskField	2/14/2018	EAbramo			Checks whether DDE Area of Support has Support Tasks associated
// L_getCurrentCompanyAccount	3/19/2018	CNeale			Company/EIS Account check & set if unknown
// L_emailCaseNoteValdn			3/19/2018	CNeale			Validation & send/record of Case Email or Note
// L_setShowInCasePortal		3/19/2018	CNeale			Initial set of Show in Case Portal for EIS merged case form
// L_valCaseStatus				3/19/2018	CNeale			Validation and update of NS Case Status
// L_valPriority				3/19/2018	CNeale			Validation and update of NS Case Priority
// L_InstAccContEmlTelProcess	3/19/2018	CNeale			Validation and update of Institution, EIS Account, Contact,
//															Email & Phone
// L_DDEReqTypProcess			3/19/2018	CNeale			Validation and update of DDE Request Type & Case Portal field
// L_DDEProdAreaTaskProcess		3/19/2018	CNeale			Validation and update of DDE Product or Interface, DDE Area of 
//															Support and DDE Support Task & Case Portal fields
// L_valOccupation				3/19/2018	CNeale			Validation and update of Occupation
//
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	02-09-18	Kate McCormack 		Added global object, caseParmMapObject, to be used in conjunction with the
//									dynamicSearch() method in library_dynamic_search.js
//	03-12-19	Pat Kelleher		Updated search operators for all case fields being called
//	04-04-18	Eric Abramo			Added new functions L_ddeTyptoPortal, L_ddeProdtoPortal, L_ddeAreaSupporttoPortal &
//									L_checkDDESupportTaskField
//	04-04-18	Christine Neale		Added new functions L_getCurrentCompanyAccount, L_emailCaseNoteValdn, L_setShowInCasePortal,
//									L_valCaseStatus, L_valPriority, L_InstAccContEmlTelProcess, L_DDEReqTypProcess, 
//									L_DDEProdAreaTaskProcess, L_valOccupation 
//									Added Global Variables used by Restliet_updateCaseById
//	04-04-18	Jeff Oliver			Adding join to customer record to search by cust internal ID & custId
//	04-05-18	Christine Neale		Correct case_custsat_hours search operators.
//	08-01-18	Jeff Oliver			Fixed case_date_closed nsfieldName from 'enddate' to 'closeddate'
//	09-16-19	jProctor(eAbramo)	Added new properties to the L_caseParmMapObject object to allow for RESTlet searches to be conducted on DS Cases.
// 						These are: case_ds_category, case_product_code, case_linking_issue, case_conversion_status, case_questionnaire_rec,
//						case_ds_phase, case_originating_teamsearch
//
//-------------------------------------------------------------------------------------------------------------------------

//Global Variables------------------------------------------------------//
// parameters to track validity of data -- assume valid
var L_case_validData = true;
var L_case_invalidfields = '';
// parameters to track fields to be updated 
var L_case_updatedfields = '';
// parameter to indicate Assignee is one of the Unassigned records 
var L_case_unassigned = 'F';

//-----------------------------------------------------------------------//

//The following parameter mapping object is REQUIRED to perform dynamic case search building using library_dynamic_search.js
//and the format of the JSON object MUST be:
//
//  <record type>ParmMapObject {
//		<name of JSON field passed into the Restlet>:  <corresponding NetCRM case record field name to be used in the search>
//	
//}

var L_caseParmMapObject = {	
		case_id: {
			nsfieldName:	'internalid',	
			searchBy:		'anyof,noneof'
		},
		case_number: {
			nsfieldName:	'casenumber',	
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},			
		case_subject: 	{
			nsfieldName:	'title',	
			searchBy:		'any,is,isempty,haskeywords,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},					
		case_status_comment: {
			nsfieldName:	'custevent_status_comment',
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},				
		case_email:	{
			nsfieldName:	'email',	
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},						
		case_phone: {
			nsfieldName:	'phone',	
			searchBy:		'any,equalto,lessthan,greaterthan,lessthanorequalto,greaterthanorequalto,between,notequalto,notlessthan,notgreaterthan,notlessthanorequalto,notgreaterthanorequalto,notbetween'
		},						
		case_inbound_email: {
			nsfieldName:	'inboundemail',
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},				
		case_followup_date: {
			nsfieldName:	'custevent_customer_si_followup_date',	
			searchBy:		'on,before,after,onorbefore,onorafter,within,isempty,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin,isnotempty'
		},				
		case_custsat_hours: {
			nsfieldName:	'custevent_custsat_actual_hours',
			searchBy:		'any,equalto,lessthan,greaterthan,lessthanorequalto,greaterthanorequalto,between,isempty,notequalto,notlessthan,notgreaterthan,notlessthanorequalto,notgreaterthanorequalto,notbetween,isnotempty'
		},				
		case_last_modified: {
			nsfieldName:	'lastmodifieddate',
			searchBy:		'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin'
		},				
		case_last_message_date: {
			nsfieldName:	'lastmessagedate',	
			searchBy:		'on,before,after,onorbefore,onorafter,within,isempty,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin,isnotempty'
		},			 
		case_date_created:	{
			nsfieldName:	'createddate',
			searchBy:		'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin'
		},				
		case_date_closed: {
			nsfieldName:	'closeddate',
			searchBy:		'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin'
		},					
		case_assignee: 	{
			nsfieldName:	'assigned',
			searchBy:		'anyof,noneof'
		},					
		case_priority: 	{
			nsfieldName:	'priority',
			searchBy:		'anyof,noneof'
		},					
		case_status:	{
			nsfieldName:	'status',	
			searchBy:		'anyof,noneof'
		},					
		case_origin: 	{
			nsfieldName:	'origin',
			searchBy:		'anyof,noneof'
		},					
		case_institution: {
			nsfieldName:	'company',	
			searchBy:		'any,is,isempty,haskeywords,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},					
		case_eis_account: 	{
			nsfieldName:	'custevent_eis_account',
			searchBy:		'anyof,noneof'
		},				
		case_contact: 	{
			nsfieldName:	'custevent_contact',	
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},					
		case_dde_req_type:	{
			nsfieldName:	'category',
			searchBy:		'anyof,noneof'
		},				
		case_prod_interface: {
			nsfieldName:	'custevent_dde_prod_int',
			searchBy:		'anyof,noneof'
		},				
		case_area_support: {
			nsfieldName:	'custevent_dde_area_suppt',
			searchBy:		'anyof,noneof'
		},					
		case_support_task: 	{
			nsfieldName:	'custevent_dde_suppt_task',
			searchBy:		'anyof,noneof'
		},				
		case_effort_level: 	{
			nsfieldName:	'custevent_level_of_effort',	
			searchBy:		'anyof,noneof'
		},				
		case_occupation: {
			nsfieldName:	'custevent_occupationtextfield',	
			searchBy:		'anyof,noneof'
		},						
		case_stage: {
			nsfieldName:	'stage',
			searchBy:		'anyof,noneof'
		},						
		case_ds_category: {
			nsfieldName:	'custevent_ds_category',
			searchBy:		'anyof,noneof'
		},						
		case_product_code: {
			nsfieldName:	'custevent_product_code',
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},
		case_linking_issue: {
			nsfieldName:	'custevent_linkingissue',
			searchBy:		'anyof,noneof'
		},
		case_conversion_status: {
			nsfieldName:	'custevent_ekb_conv',
			searchBy:		'anyof,noneof'
		},
		case_questionnaire_rec: {
			nsfieldName:	'custevent_questionnaire_rec',
			searchBy:		'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin'
		},
		case_ds_phase: {
			nsfieldName:	'custevent_ehis_stage',
			searchBy:		'anyof,noneof'
		},
		case_originating_team: {
			nsfieldName:	'custevent_ds_originating_team',
			searchBy:		'anyof,noneof'
		},
        customer_id: {
            nsfieldName:  'customer.internalid',       
            searchBy:            'anyof,noneof',
            joinFrom:            'customer'
        },
        customer_custid: {
            nsfieldName:  'customer.entityid',       
            searchBy:            'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
            joinFrom:            'customer'
        }
	};

//--------------------------------------------------------------------------//
//Function: L_ddeTyptoPortal
//Converts DDE Request Type to Case Portal Request Type
//Input   : DDE Type
//Returns : Case Portal Type
function L_ddeTyptoPortal(ddeTyp)
{
	if (ddeTyp)
	{
		var dt_filters = new Array();
		dt_filters[0] = new nlobjSearchFilter('custrecord_dde_case_req_type', null, 'anyof', ddeTyp);
		var dt_columns = new Array();
		dt_columns[0] = new nlobjSearchColumn('custrecord_case_portal_request_type');
		dt_searchResults = nlapiSearchRecord('customrecord_case_type_dde_portal_map', null, dt_filters, dt_columns);

		if (dt_searchResults)
		{
			if(dt_searchResults.length == 1)
			{
				var dt_searchResult = dt_searchResults[0];
				return dt_searchResult.getValue('custrecord_case_portal_request_type');
			}
		}
	}
	return '';
}
//--------------------------------------------------------------------------//
//Function: L_ddeProdtoPortal 
//Converts DDE Product/Interface to Case Portal Product
//Input   : DDE Product/Interface
//Returns : Case Portal Product

function L_ddeProdtoPortal(ddeProd)
{
	if (ddeProd)
		{
		return nlapiLookupField('customrecord_dde_prod_int', ddeProd, 'custrecord_case_portal_product_taxonomy');
		}
	else
		{
		 return '';
		}
}


//--------------------------------------------------------------------------//
//Function: L_ddeAreaSupporttoPortal
//Converts DDE Area of Support to Case Portal Request Category
//Input   : DDE Area of Support
//Returns : Case Portal Request Category
	// Note this function in Merged Case Form called ddeCattoPortal (due to use of historical field)
function L_ddeAreaSupporttoPortal(ddeAreaSupport)
{
	if (ddeAreaSupport)
		{
		return nlapiLookupField('customrecord_dde_area_spt', ddeAreaSupport, 'custrecord_port_req_cat');
		}
	else
		{
		 return '';
		}
}


//--------------------------------------------------------------------------//
//Function: L_checkDDESupportTaskField
//Checks whether DDE Area of Support has Support Tasks associated
//Input: DDE Area of Support
//Returns : True if Support Tasks associated, False if no associated Support Tasks
//
function L_checkDDESupportTaskField(dde_area) 
{
  // Does the DDE Area of Support have any associated Support Tasks 
	if (dde_area) {
  	var crfilters = new Array();
  	crfilters[0] = new nlobjSearchFilter('custrecord_dde_area_suppt', null, 'anyof', dde_area);
  	crfilters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
  	var crcolumns = new Array();
  	crcolumns[0] = new nlobjSearchColumn('custrecord_dde_area_suppt', null, null);  
  	crsearchResults = nlapiSearchRecord('customrecord_spt_task', null, crfilters, crcolumns);
  	if (crsearchResults)
  	{
  		return true;
  	}
  }
  return false;
}

//---------------------------------------------------------------------------------------//
//Function: L_getCurrentCompanyAccount
//Checks presence of Company & EIS Account and sets values/selectors dependent on results
//Replicates Merged Case Form functionality (147)
//Prerequisite: To use this function in Form mode require presence of (Form) EIS Account Selector Field (custpage_eis_account_selector)
//Input: env = C(lient) or S(erver)
//		 comp = internal Id of Company/Institution
//		 acc = internal Id of EIS Account
//       rec = case record nlobj (for env S only) 
//Values Set : custevent_eis_account
//			   company		
//			   custpage_eis_account_selector - Client only 
//			   alert statement - Client only	
//Returns : Identifier for field updated (Server mode only) or '' for no field updated (Server mode only)
//			'' Client mode
//
function L_getCurrentCompanyAccount(env,comp,acc,rec)
{
	// Error if env not Server or Client - shouldn't really happen but just in case someone uses the utility incorrectly...
	if (env != 'S' && env != 'C')
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields + ', error getting Company/Account';
		alert('Error getting Company/Account');
		return '';
	}
	// If Company Known (present and not Anonymous DDE or SSD)
	if (comp && comp != LC_Customers.AnonDDESupport && !LC_Customers.IsCustSSEAnon(comp) && !LC_Customers.IsCustYBPAnon(comp))
	{
		// If EIS Account is Unknown
		if (!acc)
		// Company Known and EIS Account is Unknown	
		{
			// EIS ACCOUNT LOOKUP CODE
			// Search EIS Accounts connected to Customers with this Case's Company
			var eis_filters = new Array();
			eis_filters[0] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'is', comp);
			eis_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			var eis_columns = new Array();
			eis_columns[0] = new nlobjSearchColumn('name', null, null);
			var eis_searchResults = nlapiSearchRecord('customrecord_eis_account', null, eis_filters, eis_columns);
			if (eis_searchResults != null)
			{
				if (eis_searchResults.length == 1)
				{
					// if just one result then populate the eis account field
					if (env == 'S')
					{ //Server Environment
						rec.setFieldValue('custevent_eis_account', eis_searchResults[0].getId());
						return 'case_eis_account';
					}
					else if (env == 'C')
					{ //Client Environment	
						nlapiSetFieldValue('custevent_eis_account', eis_searchResults[0].getId(), false, true);
						return '';
					}
				}
				else if (env == 'C')
				{ //Client Environment Only
					// if more than one result then load the EIS Account Selector field and lock the EIS Account field
					// open up the EIS Selector field (and clear it - if it has values)
					nlapiDisableField('custpage_eis_account_selector', false);
					nlapiRemoveSelectOption('custpage_eis_account_selector');
					nlapiInsertSelectOption('custpage_eis_account_selector','', '', true);
					// alert('multiple eis searchresults returned');
					for(var i = 0; eis_searchResults != null && i < eis_searchResults.length; i++)
					{
						nlapiInsertSelectOption('custpage_eis_account_selector', eis_searchResults[i].getId, eis_searchResults[i].getValue('name'), false);
					}
					// disable the EIS Account field so that you can use the EIS Account selector field instead
					nlapiDisableField('custevent_eis_account', true);
					return '';
				}
			}
		}
	}
	else if(acc)
	// Company Unknown and EIS Account is Known	
	{
		// EIS ACCOUNT LOOKUP CODE
		// this function searches for all Customers connected to this Case's EIS Account
		var acccomp = nlapiLookupField('customrecord_eis_account', acc, 'custrecord_eis_account_customer');
		if (acccomp != null)
		{
			if (env == 'S')
			{//Server Environment
				rec.setFieldValue('company', acccomp);
				return 'case_institution';
			}
			else if (env == 'C')
			{ //Client Environment
				nlapiSetFieldValue('company', acccomp, false, true);
				if (!acccomp)
				{
					alert('Your selected EIS Account does not have an associated Institution, Please select another EIS Account.');
				}
				return '';
			}
		}	
	}
	
	return '';
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_emailCaseNoteValdn()
 * Description: Performs validation for Email or Case Note, Send Email to Customer & Internal (no external email sent) &
 *              sets field values for update if valid 
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields             
 * Input      : msg = datain.case_email_or_case_note
 * 				stc = datain.case_send_to_customer
 * 				intO = datain.case_internal_no_external_email
 * 				rec = nlobjRecord Case
 * Returns    : None 
 *-----------------------------------------------------------------------------------------------------------------*/
function L_emailCaseNoteValdn(msg, stc, intO, rec)
{
	// These handle sending an email to the Customer or just adding an Internal note
	// These are related fields, so if at least one is passed in will need all 3...
	// Note: This also prevents a blank email being sent or blank note recorded.

	if (msg||stc||intO)
	{	
		if(!msg || !stc || !intO)
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', One or more fields missing for email or case note, send to Customer and Internal (no external email sent)';
		}
		// Cannot have both send to Customer & Internal only set to True
		else if (stc == 'T' && intO == 'T')
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', Cannot set both case_send_to_customer & case_internal_no_external_email to True';
		}
		// Everything is OK - go ahead and update the fields
		else
		{
			rec.setFieldValue('outgoingmessage', msg);
			rec.setFieldValue('emailform', stc);
			rec.setFieldValue('internalonly', intO);
			L_case_updatedfields = L_case_updatedfields + ', case_email_or_case_note, case_send_to_customer, case_internal_no_external_email';
		}
	}
	return;

}  // End of function L_emailCaseNoteValdn	

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_setShowInCasePortal()
 * Description: Initial set of Show in Case Portal Indicator
 * 				In Server mode assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields
 * Note:		Replicates functionality from merged Case Form
 * Assumptions:	In Server mode assumes global variable L_case_updatedfields is being used to record updated/created fields 
 * Input	  :	env = S(erver) or C(lient)
 * 				ind = datain.case_show_in_portal (Server) or '' (Client) 
 * 				dept = assignee department (or user department on create for Client)	
 * 				rec = nlobj case record (Server) or '' (Client)    
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
// If Show in Case Portal is passed in update - this takes priority over defaulting on first edit
// (NS will handle blank value)
function L_setShowInCasePortal(env, ind, dept, rec)
{	
	// Error if env not Server or Client - shouldn't really happen but just in case someone uses the utility incorrectly...
	if (env != 'S' && env != 'C')
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields + ', error setting case_show_in_portal';
		alert('Invalid Environment passed in');
		return;
	}
	// If RESTlet and Show in Case Portal is passed in update - this takes priority over defaulting on first edit
	// (NS will handle blank value)
	if (env == 'S' && ind != null)
	{   
		if (ind)
		{
			rec.setFieldValue('custevent_show_in_case_portal', ind);
			L_case_updatedfields = L_case_updatedfields + ', case_show_in_portal';
		}
		else
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', case_show_in_portal must be F or T';
			return;
		}
	}
	else
	// Handle Defaulting on First Edit (both for Server & Client modes)	
	{   
		switch(env)
		{
		case 'S':
			var firstedit = rec.getFieldValue('custevent_case_portal_1st_edit');
			var orig = rec.getFieldValue('origin');
			var sts = rec.getFieldValue('status');
			var rid = rec.getId();
			break;
		case 'C':
			var firstedit = nlapiGetFieldValue('custevent_case_portal_1st_edit');
			var orig = nlapiGetFieldValue('origin');
			var sts = nlapiGetFieldValue('status');
			var rid = nlapiGetRecordId();
			break;
		}
		if ((firstedit != 'T' && orig != LC_CaseOrigin.CasePortal && sts == LC_CaseStatus.NotStarted)||!rid)
		{
			if (dept == LC_Departments.SSESupportUKSA || dept == LC_Departments.SSESupportGermany || LC_Departments.IsDeptYBPSupport(dept))
			{
				var upd = 'F';
			}
			else
			{
				var upd = 'T';
			}	
			switch(env)
			{
			case 'S':
				rec.setFieldValue('custevent_show_in_case_portal', upd);
				L_case_updatedfields = L_case_updatedfields + ', case_show_in_portal';
				break;
			case 'C':
				nlapiSetFieldValue('custevent_show_in_case_portal', upd);
				break;
			}
		}
	}
	
	// For Server only set Case Portal 1st edit to indicate already updated - done in Client script on form save
	if (env == 'S')
	{
		rec.setFieldValue('custevent_case_portal_1st_edit', 'T');
	}

	return;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_valCaseStatus()
 * Description: Validation of Case Status (incl. Escalated/Escalatee check)
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields 
 * Replicates : Functionality from merged case form (147) & standard NS functionality 
 * Input	  :	stsIn = datain.case_status 
 * 				rec = nlobj case record 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_valCaseStatus(stsIn, rec)
{
// Case Status Field - mandatory field (NS) - NS functionality handles this
// Escalation validation - if set then need escalatees (custom)
//                       - if escalatees & case status not Escalated or one of the closed stages error(NS)
								
	// First of all sort out whether Status has been passed in - if so require validation & update
	//                                                         - if not only require validation
	if (stsIn != null)
	{
		var sts = stsIn;
		var upd = 'T';
	}
	else
	{
		sts = rec.getFieldValue('status');
		upd = 'F';
	}	
	
	//Check whether any Escalatees
	var noesc = rec.getLineItemCount('escalateto');
	// No escalatees but case status is being set to Escalated (using Library functions)
	if (noesc == 0 && LC_CaseStatus.IsCaseStatusEscalated(sts))
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', Status cannot be Escalated with no Escalatees set';
	}
	// Escalatees but case status is not being set to Escalated or Closed (using Library functions)
	else if(noesc > 0 && !LC_CaseStatus.IsCaseStatusEscalated(sts)&& !LC_CaseStatus.IsCaseStatusClosed(sts))
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', Escalatees are specified, status must be Escalated or one of Closed Statuses';
	}
	// All OK - update status if required
	else if (upd == 'T' )
	{
		rec.setFieldValue('status', sts);
		L_case_updatedfields = L_case_updatedfields + ', case_status';
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_valPriority()
 * Description: Validation of Priority
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields 
 * Input	  :	ptyIn = datain.case_priority
 * 				rec = nlobj case record 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_valPriority(ptyIn, rec)
{
//  --------------------------------------------------------			
	//Priority - mandatory (standard field but NetSuite won't validate if not being updated)
	if (ptyIn != null)
	{
		var pty = ptyIn;
		var upd = 'T';
	}
	else
	{
		pty = rec.getFieldValue('priority');
		upd = 'F';
	}	
	if (upd == 'T')
	{
		rec.setFieldValue('priority', pty);
		L_case_updatedfields = L_case_updatedfields + ', case_priority';
	}
	// yet still is required  if it wasn't passed into the Restlet 
	else if (!pty)
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', You did not specify Priority.  Priority cannot be blank';
	}		
}


/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_InstAccContEmlTelProcess
 * Description: Institution, EIS Account, Contact, Email & Phone processing
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields 
 * Replicates : Nearly replicates functionality from merged case form (147) & standard NS functionality 
 * Input	  :	inst = datain.case_institution
 * 				acc = datain.case_eis_account
 * 				cont = datain.case_contact
 * 				eml = datain.case_email
 * 				tel = datain.case_phone
 * 				rec = nlobjRecord case 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_InstAccContEmlTelProcess(inst, acc, cont, eml, tel, rec)
{
	// Save original values of email & phone to prevent overwriting
	if (inst != null || acc != null || cont != null)
	{
		var orig_email = rec.getFieldValue('email');
		var orig_phone = rec.getFieldValue('phone');
	}
	
	//-------------------------------------------------------------
	// Institution - Mandatory (NS) & Custom Validation & EIS Account stuff.....
	if (inst != null)
	{	
		if (inst)
		{
			// First of all check to see if it is one of the SSE Or YBP Anonymous Customers, if it is Error
			// Note: we are not handling this situation now, but will at a later date
			if (LC_Customers.IsCustSSEAnon(inst) || LC_Customers.IsCustYBPAnon(inst))
			{
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields +', calls to UpdateCaseByID with Form Id = 147 and DDE Assignee cannot update a Case with a SSD or YBP Anonymous Customer';				
			}
			else
			{
				if (inst != rec.getFieldValue('company'))
				{
					rec.setFieldValue('company', inst);
					// Now need to clear our EIS Account
					rec.setFieldValue('custevent_eis_account', '');
					// Now need to reset email & phone that will auto-set
					rec.setFieldValue('email', orig_email);
					rec.setFieldValue('phone', orig_phone);
					// Now record updated fields - include Contact (as this auto-resets to blank) if it won't be included later
					L_case_updatedfields = L_case_updatedfields + ', case_institution';
					if (cont == null)
					{	
						L_case_updatedfields = L_case_updatedfields + ', contact';
					}
				}
				else
				{
					// Now record Institute as updated field - even though the same as passed in 
					L_case_updatedfields = L_case_updatedfields + ', case_institution';
				}	
			}
		}
		else
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields +', Institution cannot be set to blank';				
		}	
	}
	
	//-------------------------------------------------------------
	// EIS Account - Optional, custom functionality associated with 
	// Only allow EIS Account update if it the Institution - so differs from UI functionality here
	if (acc != null)
	{	
		if (acc)
		// If a value is passed in ensure matches Institution 	
		{
			if (rec.getFieldValue('company') == nlapiLookupField('customrecord_eis_account', acc, 'custrecord_eis_account_customer'))
			{
				rec.setFieldValue('custevent_eis_account', acc);
				L_case_updatedfields = L_case_updatedfields + ', case_eis_account';
			}
			else
			{
					L_case_validData = false;
					L_case_invalidfields = L_case_invalidfields +', EIS Account does NOT match Institution';	
			}
		}
		else
		{
			rec.setFieldValue('custevent_eis_account', acc);
			L_case_updatedfields = L_case_updatedfields + ', case_eis_account';
		}	
	}
	
	// Finally check if there is a single EIS Account if not populated
	if (!rec.getFieldValue('custevent_eis_account'))
	{
		L_getCurrentCompanyAccount('S',rec.getFieldValue('company'),'',rec);
	}
		
	//-------------------------------------------------------------
	// Contact - Optional, NS inbuilt functionality associated with (which still works for RESTlet update)
	if (cont != null)
	{	
		rec.setFieldValue('contact', cont);
		// Now need to reset email & phone that will auto-set
		rec.setFieldValue('email', orig_email);
		rec.setFieldValue('phone', orig_phone);
		L_case_updatedfields = L_case_updatedfields + ', case_contact';
	}
	
	//-------------------------------------------------------------
	// Email - Optional, NS inbuilt functionality associated with (which still works for RESTlet update)
	if (eml != null)
	{	
		rec.setFieldValue('email', eml);
		L_case_updatedfields = L_case_updatedfields + ', case_email';
	}
	
	//-------------------------------------------------------------
	// Phone - Optional, NS inbuilt functionality associated with (which still works for RESTlet update)
	if (tel != null)
	{	
		rec.setFieldValue('phone', tel);
		L_case_updatedfields = L_case_updatedfields + ', case_phone';
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_DDEReqTypProcess
 * Description: Validation of DDE Request Type
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields 
 * Input	  :	req = datain.case_dde_req_typ
 * 				rec = nlobjRecord case 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_DDEReqTypProcess(req, rec)
{
	//  --------------------------------------------------------
	//DDE Request Type - mandatory (custom) & population of Case Portal Request Type dependent on value
	if(req != null)
	{ 
		// Require DDE Request Type value
		if (req == '')
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', DDE Request Type cannot be blank';
		}
		else
		{	// Call Library Script function to load the Case Portal Request Type
			rec.setFieldValue('custevent_portal_request_type', L_ddeTyptoPortal(req));
			// Now set the actual field 
			rec.setFieldValue('category', req);
			L_case_updatedfields = L_case_updatedfields + ', case_dde_req_type';					
		}
	}
	// yet still is required if it wasn't passed into the Restlet (& if the assignee isn't an unassigned employee)
	else if ((rec.getFieldValue('category')== null || rec.getFieldValue('category')== '') && L_case_unassigned == 'F')
	{ 
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', You did not specify Request Type.  Request Type cannot be blank';				
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_DDEProdAreaTaskProcess()
 * Description: Performs validation for DDE Product Interface,DDE Area of Support & DDE Support Task changes &
 *              sets field values for update if valid 
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields 
 * Input	  :	prod = datain.case_prod_interface
 *  			area = datain.case_area_support
 *  			task = datain.case_support_task
 * 				rec = nlobjRecord case 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_DDEProdAreaTaskProcess(prod,area,task,rec)
{
	if (prod != null || area != null || task != null)
	{
		// Need to enforce that levels beneath the top level passed in are present....
		// So if Product/Interface is present we must have Area of Support & Support Task (even if Support Task is empty)
		// If Area of Support is present we must have Support Task (even if Support Task is empty)
		// Only Support task can be passed in on it's own
		// Use functions prodInOk & areaInOK to check this - so if they return false (same as !prodInOK()) then it's an error
		if (!prodInOk() || !areaInOk())
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', One or more fields missing for Product Interface, Area of Support & Support Task';	
			return;
		}	
	
		// DDE Product Interface
		if (prod != null)
		{
			// Require DDE Request Type value
			if (prod == '')
			{
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields+', Product/Interface cannot be blank';
			}
			else
			{	// Call Library Script function to load the Case Portal Product
				rec.setFieldValue('custevent_portal_product', L_ddeProdtoPortal(prod));
				// Now set the actual field 
				rec.setFieldValue('custevent_dde_prod_int', prod);
				L_case_updatedfields = L_case_updatedfields + ', case_prod_interface';					
			}
		}
		//DDE Area of Support
		if (area != null)
		{
			// Require DDE Area of Support value
				if (area == '')
				{
					L_case_validData = false;
					L_case_invalidfields = L_case_invalidfields+', Area of Support cannot be blank';
				}
				else
				{	// Call Library Script function to load the Case Portal Request Category
				rec.setFieldValue('custevent_portal_request_category', L_ddeAreaSupporttoPortal(area));
				// Now set the actual field 
				rec.setFieldValue('custevent_dde_area_suppt', area);
				L_case_updatedfields = L_case_updatedfields + ', case_area_support';					
				}
		}
		
		// DDE Support Task - will always be present if we've got to here!
		// Call the library script to check whether a Support Task is required & if it is and there is only an empty support task it's an error!
		if (L_checkDDESupportTaskField(rec.getFieldValue('custevent_dde_area_suppt')) && task == '')
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', Support Task cannot be blank when Area of Support: '+area;	
			return;
		}
		rec.setFieldValue('custevent_dde_suppt_task', task);
		L_case_updatedfields = L_case_updatedfields + ', case_support_task';
	}
	else
	{
		var existing_case_prod_interface = rec.getFieldValue('custevent_dde_prod_int');
		var existing_case_area_support = rec.getFieldValue('custevent_dde_area_suppt');
		// Product/Interface and Area of Support are always required
		if ((!existing_case_prod_interface || !existing_case_area_support) && L_case_unassigned == 'F')
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', You did not specify Product/Interface and/or Area of Support.  These fields cannot be blank'; 						
		}
	}

	/*----------------------------------------------------------------------------------------------------------------
	 * Function   : prodInOk()
	 * Description: Checks that if Product/Interface is passed in the Area of Support & Support Task have also been passed in
	 * Input      : None
	 * Returns    : false = one or more missing fields
	 * 				true = all expected fields present 
	 *            
	 *-----------------------------------------------------------------------------------------------------------------*/
	function prodInOk()
	{
		if (prod && (task == null || area == null))
		{
			return false;
		}
		return true;
	}
	/*----------------------------------------------------------------------------------------------------------------
	 * Function   : areaInOk()
	 * Description: Checks that if Area of Support is passed in then Support Task has also been passed in
	 * Input      : None
	 * Returns    : false = missing field
	 * 				true = all expected fields present 
	 *            
	 *-----------------------------------------------------------------------------------------------------------------*/	
	function areaInOk()
	// Checks that if Area of Support is passed in then Support Task has also been passed in
	{
		if (area && task == null)
		{
			return false;
		}
		return true;

	}
	//--------------------------------------------------------------------------------------------------------------------
	
	return;

} // End of function ProdAreaTaskValdn

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_valOccupation()
 * Description: Validation of Occupation
 * Replicates : Functionality from merged case form (147) 
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields & L_case_unassigned 
 * Input	  :	occIn = datain.case_occupation
 * 				rec = nlobj case record 
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_valOccupation(occIn, rec)
{
//  --------------------------------------------------------			
	//Priority - mandatory (standard field but NetSuite won't validate if not being updated)
	if (occIn != null)
	{
		var occ = occIn;
		var upd = 'T';
	}
	else
	{
		occ = rec.getFieldValue('custevent_occupationtextfield');
		upd = 'F';
	}	
	if (upd == 'T')
	{
		// Require Occupation
		if (occ == '')
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields+', Occupation cannot be blank';
		}
		else	
		{
			rec.setFieldValue('custevent_occupationtextfield', occ);
			L_case_updatedfields = L_case_updatedfields + ', case_occupation';
		}
	}
	// yet still is required  if it wasn't passed into the Restlet & not the unassigned employee
	else if (!occ && L_case_unassigned == 'F')
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', You did not specify Occupation.  Occupation cannot be blank';
	}		
}

