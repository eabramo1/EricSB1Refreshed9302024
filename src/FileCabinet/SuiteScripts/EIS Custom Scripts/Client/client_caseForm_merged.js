//
// Amendment Log:-
//  C Neale		10/28/2014		Release of Case Portal Changes to Internal Case Form
//								Strip out temp. comments put in prior to US release & adjust where required.
//                              Validation now dependent on department of user the case is assigned to.
//                              Show in case indicator now fully maintainable (& defaulted to yes on first edit via UI).
//                              AU profile/user considerations incl. default messages to "send to customer".
//                              Occupation mandatory for DDE users.
//								Adjust account selector code to cater for AU/UK SSE anonymous customers & AU/UK SSE Departments
//                              Adjust validation to assume DDE unless one of the SSE Support departments (currently UK (82) & AU (86)).
//  							Case Portal Product/type/Category now auto-populated based on DDE/SSE values
//                              Omit DDE/SSE specific validation & case portal field validation if assigned to an unassigned user.
//	E Abramo	09/10/2015		Ensure Status & Escalatee List in Alignment
//	C Neale		09/10/2015		Adjust show in Case Portal indicator to default to No for UK cases.
//	C Neale		09/15/2015		Adjust processing for new SSE UK SA profile (ID = 10)
//  L Weyrauch  11/6/2015       Added code for 'Global Customer Support Case' checkbox (US52069)
//  C Neale/	12/8/2015		Adjust processing for new SSE German profile (ID = 16) & role.
//  E Abramo 	02-08-2016 Removal of all Code related to EIS Case checkbox (custevent_eis_case_flag) - CustSat no longer uses in addition to removal of the "Linking Issues" field
//  K McCormack	02-24-2016 	US69594 - Case Profiles and Auto-Response Templates for far east support groups (Korean, Simplified Chinese, Traditional Chinese). A new sub-department of
//  				the "Customer Satisfaction: International Support (DDE)" was created called "Far East Support (DDE)".  Logic within this script was modified to recognize
//  				this new department.
//  E Abramo	03-15-2016	Added code to account for YBP Profile and YBP Anonymous Customer etc
//	J Oliver	4-27-2016		Updated script that auto-populates the case portal fields to use the new DDE taxonomy fields (Product/Interface, Area of Support).
//								Also removed script that populates DDE Request Type (not required), and removed script that requires Interface (since that field is going away)
// 	J Oliver	7-18-2016		On case load, set the DDE Request Type to 'Support Case' if empty, for DDE Reps
//	C Neale		11-10-2016		US177534 If Profile is "EIS User Services" set to default profile (EBSCO Information Services (DDE Support)).
//	C Neale		04-12-2017	US221800 Adjusted code to prevent Employee permission issue (2017.1 related change) & reinstate DDETyp.
//	C Neale		05-24-2017	US242499 Adjust send email preference for AU only & error if outgoing message & neither .
//  C Neale		06/14/2017		US214281 Ensure YBP Support multi-language profiles are set to default YBP Support profile 
//	C Neale/JO	12-04-2017		US232996 DDE Support Task mandatory if DDE Area of Support has Support Tasks & DDE assignee
//	C Neale		12-03-2018		US422422 Hide Case on CXP only editable if Case has SF ID (note: this field has field level permissions).
//	J Oliver	12/03/2018		US422401 Removed scripted alert for "Case Portal" Origin and Origin field lock for Case portal (moved both to Client_Record_Case)
//  P Kelleher  3-2-2021		US759421 - update Taxonomy fields so that they are only mandatory when status is closed, closed unresponsive or closed duplicate no action AND make two Portal fields only mandatory when case is Closed
//	C Neale		11-4-2021		US824125 Allow SF Hide Case flag to to be editable even if no SF ID.
//	P Kelleher	2/17/2022		US240546 Clean up code to remove South African Profile references 
//	PKelleher	11/10/2022		TA769368 Origin field updates - Case Portal being renamed to Case Portal - Celigo (updated comment line to reflect this).  Also, GCS Case Origin field is mandatory on close of a case when one of the taxonomy fields are mandatory as well. 
//	PKelleher	12/14/2022		TA780485 Make Occupation field on merged case form mandatory only on close of a case.  Currently it is mandatory on SAVE no matter the case status.
//	PKelleher	11/27/2023		US1191426 Add two new fields on DDE subtab & make second one mandatory when first one is checked
//
//

var company_id = null;
var company_status = null;
var eis_account = null;
var eis_acct_status = null;
// Global variable for department of Assigned to employee
var adept = null;
// get user's Department on Employee (global variable
var udept = nlapiLookupField('employee', nlapiGetUser(), 'department', null);


function epCaseLoad(type)
{
 	// if role is User Services
	if (nlapiGetRole() == '1063')
	{
		//Copy the original message to the outgoing message box
		copyOriginalMessage();
		// Default the external email checkbox to true for this role
		// First need to uncheck the internal only checkbox
		nlapiSetFieldValue('internalonly','F');
		nlapiSetFieldValue('emailform','T');
	}

	// Case Portal Project - CN 10/28/2014
	// if user department = 86 (AU/NZ SSE Support) enable the "Send to Customer" checkbox
	if (udept == '86')
	{
		// Default the external email checkbox to true for this role
		// US242499 changed requirement to uncheck BOTH the internal only & send email to Customer checkboxes
		nlapiSetFieldValue('internalonly','F');
		nlapiSetFieldValue('emailform','F');
	}

	// if this is a new case
	if ( (nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null) )
	{
		//set assigned rep to current user
		nlapiSetFieldValue('assigned', nlapiGetUser());
		// set assigned to user department
 		adept = udept;
		// enable the EIS Account field
		nlapiDisableField('custevent_eis_account', false);
		// MERGED CASE FORM CODE
		// 2014-05 eabramo: If assigned department is SSE UK (82) or SSE AU (86) or SSD Germany (94) set profile
		// 10/28/2014 CN: Now using department of assigned to and not of user
		if (adept == '82')
		{	// 2 is UK SSE Support English profile
			nlapiSetFieldValue('profile', '2', false, true); //US214281
		}
		if (adept == '86')
		{	// 9 is AU/NZ SSE Support profile
			nlapiSetFieldValue('profile', '9', false, true); //US214281
		}
		if (adept == '94')
		{
		    // 16 is German SSE Support profile
		    nlapiSetFieldValue('profile', '16', false, true); //US214281
		}
	}
	else
	{
		// Case Portal Project: CN 10/28/2014
		// Set assigned to  department
		if (nlapiGetFieldValue('assigned'))
		{
			adept = nlapiLookupField('employee', nlapiGetFieldValue('assigned'), 'department');
		}
		else
		{
			adept = udept;
		}
		
		// US177534 If Profile is EIS User Services (19) then set to EBSCO Information Services (DDE Support) (1)
		if (nlapiGetFieldValue('profile') == '19')
		{
			nlapiSetFieldValue('profile', '1', false, true);
		}
        // US214281: Call library function to check for multi-language YBP Support profile & if found default to YBP Support
        if (ybpSupportMultiLangProfileCheck(nlapiGetFieldValue('profile')) == true)
        {
        	nlapiSetFieldValue('profile', '17', false, true);
        }
	}

	// EIS ACCOUNT LOOKUPS -- call getCurrentCompanyAccount function
	// this looks up Company and EIS Fields and calls function to perform searching and load appropriately
	getCurrentCompanyAccount();


	// MERGED CASE FORM CODE
	// 2014-08-26 If User's Department is UK SSE Support - enable the Profile field
	// Case Portal Project: Now uses assigned to department
	// 02-24-16:  US69594 - New "Far East Support (DDE)" department (95) should also be allowed to choose the profile (i.e., Korean, Simplified Chinese, or Traditional Chinese)
	if (adept == '82' || adept == '95')
	{	// enable the Profile field
		nlapiDisableField('profile', false);
	}


	// Set Origin
	var currentOrigin = nlapiGetFieldText('origin');
	if (currentOrigin == null || currentOrigin == "")
	{
	      nlapiSetFieldText('Origin', 'Phone');
	}

	// CASE PORTAL CODE // 2014-05-20 eabramo - released CN 10/28/2014
	// if Origin is 'Email' then lock Origin field (US422401 J.O. removed Case Portal Origin field lock (and moved it to Client_Record_Case)
	if (nlapiGetFieldText('origin') == 'E-mail')
	{
		nlapiDisableField('origin', true);
	}


	// CASE PORTAL CODE - released 10/28/2014
	// Default the Show in Case Portal checkbox - but only if this has not been previously set & only if it is not "Case Portal - Celigo" origin
	// & it has a status of "Not Started" (1) or for new cases
	// 09/10/2015 CN: Default for UK is "F" all other users "T"
	// 03-15-2016 EA: Default for YBP (96 and 97) is F also (in the event that another User Opens and saves the case)
	if ((nlapiGetFieldValue('custevent_case_portal_1st_edit') != 'T' && nlapiGetFieldValue('origin') != '6' && nlapiGetFieldValue('status') == '1')||!nlapiGetFieldValue('id'))
	{
		if (adept == '82' || adept == '94' || adept == '96' || adept == '97')  // UK or Germany or YBP-EC or YBP-CS
		{
			nlapiSetFieldValue('custevent_show_in_case_portal', 'F');
		}
		else
		{
			nlapiSetFieldValue('custevent_show_in_case_portal', 'T');
		}
	}
	
	// SF CXP Portal Code 
	// US422422 Enable "SF Hide Case From CXP" flag if Case DOES have a SF ID (note: this field has field level permissions).
	// US824125 Enable field even if case does not have a SF ID  
		nlapiDisableField('custevent_hide_case_cxp', false);
}

function getCurrentCompanyAccount()
{
	// Get Company and EIS Account variables
	company_id = nlapiGetFieldValue('company');
	eis_account = nlapiGetFieldValue('custevent_eis_account');

	// Set Company Status -- anonymous customer is 277026
	// CEN 10/28/2014 - Add in AU & UK SSE Anonymous Customers

	if (company_id != '' && company_id != null && company_id != '277026' && company_id != '1489915' && company_id != '1503909' && company_id != '1559097')
	{
		company_status = 'Known';
	}
	else
	{
		company_status = 'Unknown';
	}
	// Set EIS Account Status
	if (eis_account == '' || eis_account == null)
	{
		eis_acct_status = 'Unknown';
	}
	else
	{
		eis_acct_status = 'Known';
	}
	//Call the Get_EIS_Accounts function to populate the EIS Account Selector list
	//or the Company Selector List
	if (company_status == 'Known' && eis_acct_status == 'Unknown')
	{
		get_EIS_Accounts();
	}

	if (company_status == 'Unknown' && eis_acct_status == 'Known')
	{
		get_Company();
	}
}


// JO 7-18-16	If case is DDE and DDE Request Type is empty, set = 'Support Case'
if (adept != '86' && adept != '82' && adept !='94' && adept !='96' && adept !='97')
{
	if (nlapiGetFieldValue('category') == '' || nlapiGetFieldValue('category') == null)
	{
			nlapiSetFieldValue('category', '8', true, true);
	}

}

function caseFormSave()
{
	// Case Portal Code - Assigned To now mandatory - CN 10/28/2014
	var a_to = nlapiGetFieldValue('assigned');
	if (!a_to)
	{
		alert('Assigned To is required. Please update before saving the case.');
		return false;
	}

	// Determine if "Assigned to" is any of the main/key unassigned users:-
	//  Unassigned DDE Tech User = 901608
	//  Unassigned SSE Support User AU = 1503907 / 1503908 (Backoffice)
	//  Unassigned SSE Support User UK = 1490556 / 1491212 (Backoffice)
	//  Unassigned SSE Support USer Germany = 1559122
	    var unassigned = 'F';
	if (a_to == '901608' || a_to == '1503907' || a_to == '1503908' || a_to == '1490556' || a_to == '1491212' || a_to == '1559122')
	{
		var unassigned = 'T';
	}

	// MERGED CASE FORM CODE
		/* // Departments used for DDE Cust Sat Employees
		1 	Customer Satisfaction
		85 	Customer Success
		5 	Customer Success (Training)
		78 	Discovery Solutions Coordinator
		84 	Disc. Sol. Specialist & Catalog
		4 	Expert Services
		2 	Global Customer Support (DDE)
		71 	Global Software Services
		69 	International Support (DDE)
		87  Account Service Manager
		// CN - added Novelist 10/6/14
		26  NoveList
		*/
	    // Now checks NOT SSE department (currently UK (82) & AU (86)) - Case Portal Code: CN 10/28/2014
	    // And that case is not assigned to an "unassigned" employee
	    // 2016-03-15 Add YBP Departments to exclude from DDE Required fields

	if (adept != LC_Departments.SSESupportAUNZ && adept != LC_Departments.SSESupportUKSA && adept != LC_Departments.SSESupportGermany && adept != LC_Departments.YBPEContent && adept != LC_Departments.YBPCustomerService && unassigned == 'F')
	{
		// 3-2-2021 -- US759421 - update the 3 Taxonomy fields so that they are only mandatory when status is closed, closed unresponsive or closed duplicate no action (separated these from the taxomony fields below) 
		// 2014-05-20 -- REQUIRED fields if DDE Support
		//JO 4-27-16 - Changed the DDE Product code to use the new Taxonomy fields

		// DDE Request Type
		if (nlapiGetFieldValue('category') == '' || nlapiGetFieldValue('category') == null)
		{
			alert('DDE Request Type is required for cases assigned to a DDE user. This can be found in the DDE Support section.');
			return false;
		}

		// 3-2-2021 -- US759421 - update these 3 Taxonomy fields so that they are only mandatory when status is closed - 5, or or closed duplicate no action - 7, or closed unresponsive - 11 
		// using library_constants.js for the status fields below
	
		// DDE Product/Interface
			
		if(LC_CaseStatus.IsCaseStatusClosed(nlapiGetFieldValue('status')) == true)  // if case status is completed
		{
			if(nlapiGetFieldValue('custevent_dde_prod_int') == '' || nlapiGetFieldValue('custevent_dde_prod_int') == null)
			{
				alert('DDE Product/Interface is required for closed cases assigned to a DDE user.  This can be found in the DDE Support section.');
				return false;
			}
			// DDE Area of Support
			if (nlapiGetFieldValue('custevent_dde_area_suppt') == '' || nlapiGetFieldValue('custevent_dde_area_suppt') == null)
			{
				alert('DDE Area of Support is required for closed cases assigned to a DDE user. This can be found in the DDE Support section');
				return false;
			}
			//US232996 DDE Support Task - this is mandatory if DDE Area of Support has one or more Support Tasks 
			if (!nlapiGetFieldValue('custevent_dde_suppt_task'))
			{
				if (checkDDESupportTaskField())
				{
					alert('DDE Support Task is required for the DDE Area of Support selected for all closed cases assigned to a DDE user.  This can be found in the DDE Support section.');
					return false;
				}
			}
	
			//TA769368 DDE GCS Case Origin field - this is mandatory when a case is closed and user is in GCS Dept. (similar to taxonomy field requirements) 
			if (nlapiGetFieldValue('custevent_dde_gcs_case_origin') == '' || nlapiGetFieldValue('custevent_dde_gcs_case_origin') == null)
			{
				alert('GCS Case Origin is required for all closed cases assigned to a GCS user.  This field can be found in the DDE Support section.');
				return false;
			}

			// TA780485 Require Occupation to be filled out only when case is closed:  12/14/22
			// Require Occupation - Case Portal Code CN: 10/28/2014 (moved to here b/c now required only when case is closed)
			if (!nlapiGetFieldValue('custevent_occupationtextfield'))
			{
				alert('Occupation is required for cases assigned to a DDE user. This can be found in the DDE Support section');
				return false;
			}
		}
	}

	//US1191426 DDE Support subtab - Make GCS At Risk Comments field mandatory when GCS At Risk Interaction checkbox is checked
	if (nlapiGetFieldValue('custevent_dde_gcs_risk_interaction') == 'T'){
		var riskComment = nlapiGetFieldValue('custevent_dde_gcs_risk_comment');
		if (L_isEmpty(riskComment) == true)
		{
			alert('GCS At Risk Comments are required when GCS At Risk Interaction is checked. Please see the DDE Support section.');
			return false;
		}
	}

	// MERGED CASE FORM CODE	// 2014-05-20 -- REQUIRED fields if SSE Support (10/28/2014 - Uses assigned to department & checks assigned to is not unassigned)
		// Departments used for SSE Employees
		//	82	EIS SSE Support - UK
		//	86	EIS SSE Support - AU/NZ
	if ((adept == '82' || adept == '86' || adept == '94') && unassigned == 'F')
	{	// SSE Product
		if (nlapiGetFieldValue('custevent_sse_product') == '' || nlapiGetFieldValue('custevent_sse_product') == null)
		{
			alert('SSE Product is required for cases assigned to an SSE user. This can be found in the SSE Support section');
			return false;
		}
		// SSE Request Category
		if (nlapiGetFieldValue('custevent_sse_request_category') == '' || nlapiGetFieldValue('custevent_sse_request_category') == null)
		{
			alert('SSE Request Category is required for cases assigned to an SSE user.  This can be found in the SSE Support section');
			return false;
		}
	}


	// set Case Portal 1st edit to indicate already updated
	nlapiSetFieldValue('custevent_case_portal_1st_edit', 'T');


	// EIS ACCOUNT LOOKUP CODE
	// Validate that EIS Account matches to Company
	// Verify that company is populated
	company_id = nlapiGetFieldValue('company');
	eis_account = nlapiGetFieldValue('custevent_eis_account');
	if (company_id == '' || company_id == null)
	{
		alert('Company is required');
		return false;
	}

	if (eis_account != '' || eis_account != null)
	{

		// set a verification variable to false
		var eischeck = false;
		// build my search
		var eischeck_filters = new Array();
		eischeck_filters[0] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'is', company_id);
		var eischeck_columns = new Array();
		eischeck_columns[0] = new nlobjSearchColumn('internalid', null, null);
		// run my search
		eischeck_searchResults = nlapiSearchRecord('customrecord_eis_account', null, eischeck_filters, eischeck_columns);
		// loop through results setting verification variable to true if search results match to the EIS Account
		for(var i = 0; eischeck_searchResults != null && i < eischeck_searchResults.length; i++)
		{
			var temp = eischeck_searchResults[i].getId();
			if (temp = eis_account)
			{
				eischeck = true;
			}
		}
		if (eischeck == 'false')
		{
			alert('Your selected EIS Account does not match your selected Company.  Please re-select either the Company or EIS Account so that they match');
			return false;
		}
	}
	// END EIS ACCOUNT LOOKUP CODE

	// 09-10-2015 Case History -- Ensure Status and Escalatee list in alignment
	if (nlapiGetFieldValue('stage') == 'ESCALATED')
	{
		if (nlapiGetLineItemCount('escalateto') == 0)
		{
			alert('A case in an Escalated status needs at least one Escalatee. Change your status to something other than Escalated or visit the \'Escalate\' subtab to add an Escalatee');
			return false;
		}
	}

	// CASE PORTAL CODE
	// 2014-05-20 eabramo:  If "Show in Case Portal" Checkbox is True
	// US759421 (PKelleher) (part of Taxonomy status update work) Require the three (now two) Case Portal fields to be populated when the case is set to one of the three closed statuses
	/* Commented Out until Case Portal Code is released - CEN - reinstate commented out code */
	// Case Portal Code CN: 10/28/2014 These should be automatically populated, but in case something has gone wrong allow to manually set.
	// Position last as enables Case Portal Product/Request Category. Also only check if assigned to is not "unassigned" employee.
	if ( nlapiGetFieldValue('custevent_show_in_case_portal') == 'T' && unassigned == 'F' && LC_CaseStatus.IsCaseStatusClosed(nlapiGetFieldValue('status')) == true)
	{
		if (nlapiGetFieldValue('custevent_portal_product') == '' || nlapiGetFieldValue('custevent_portal_product') == null)
		{
			alert('Case Portal Product is required when \'Show in Case Portal\' is checked and your case is Closed');
			nlapiDisableField('custevent_portal_product', false);
			return false;
		}
		//At one time the Case Portal Request Type field was required on Case Portal
		//if (nlapiGetFieldValue('custevent_portal_request_type') == '' || nlapiGetFieldValue('custevent_portal_request_type') == null)
		//{
		//	alert('Case Portal Request Type is required when \'Show in Case Portal\' is checked');
		//	return false;
		//}
		if (nlapiGetFieldValue('custevent_portal_request_category') == '' || nlapiGetFieldValue('custevent_portal_request_category') == null)
		{
			alert('Case Portal Request Category is required when \'Show in Case Portal\' is checked and your case is Closed');
			nlapiDisableField('custevent_portal_request_category', false);
			return false;
		}
	}

	//US242499 Force AU users to select either Internal only or send email to Customer when Outgoing message exists
	if (udept == '86' && nlapiGetFieldValue('outgoingmessage') && nlapiGetFieldValue('internalonly') != 'T' && nlapiGetFieldValue('emailform') != 'T')
	{
		alert('Please set either "Send Email to Customer" or "Internal (No External Email Sent)" checkbox for the "Email or Case Note" you have entered.')
		return false;
	}

    // 10-06-2015
    // Handle Global Customer Support Case Checkbox on EBSCO CustSat Merged Case Form
    /* If Assignee belongs to one of the following departments
           (2) Global Customer Support DDE
           (69) INTL Support DDE
           then check this new field to checked (if it unchecked)
       If Assignee does NOT belong to one of the following departments
           (2) Global Customer Support DDE
           (69) INTL Support DDE
           then uncheck this field (if it is checked)
    */
	// 02-24-16: US69594 - New profiles and auto-templates for Far East support groups.  New sub-department of "International Support (DDE)" needs to be recognized as Global as well.
	//		(95) Far East Support (DDE)
	// US221800: Fix employee permission issue for 2017.1 by not loading employee record to retrieve Department 
	if (nlapiGetFieldValue('customform') == '147')
	{
	    var department = nlapiLookupField('employee', nlapiGetFieldValue('assigned'), 'department');
	    console.log(department);
	    if (department == '2' || department == '69' || department == '95')
	    {
	        nlapiSetFieldValue('custevent_global_customer_support_case', 'T');
	        console.log(true);
	    }
	    else
	    {
	        nlapiSetFieldValue('custevent_global_customer_support_case', 'F');
	        console.log(false);
	    }
	}
	
	// US214281: Call library function to check for multi-language YBP Support profile & if found default to YBP Support
	if (ybpSupportMultiLangProfileCheck(nlapiGetFieldValue('profile')) == true)
	{
		nlapiSetFieldValue('profile', '17', false, true);
		alert('Alert: Profile has been set to main YBP Support profile');
	}
	
	return true;
}

// 04-14-2006
// copies message text from original to outgoing boxes
var originalMessageCopied = false;
function copyOriginalMessage()
{
	if (originalMessageCopied == false)
	{
		nlapiSetFieldValue('outgoingmessage',nlapiGetFieldValue('outgoingmessage') + '\n\n--- Original Message ---\n' + nlapiGetFieldValue('incomingmessage'));
		originalMessageCopied = true;
	}
}


function caseFieldChange(type, name)
{
	if (name == 'assigned')
	{
		var new_assigned = nlapiGetFieldValue('assigned');
		if (new_assigned)
		{
			var old_adept = adept;
			adept = nlapiLookupField('employee', new_assigned, 'department');


		var c_profile = nlapiGetFieldValue('profile');
		// if Assigned is DDE user and Profile is one of the UK SSE Support (ID's for these are 2, 4, 5, 6, 7, 8) or AU SSE Support (ID is 9) or German SSE Support (ID is 16)
		if ((adept != '82' && adept != '86' && adept != '94') && (c_profile=='2' || c_profile=='4' || c_profile=='5' || c_profile=='6' || c_profile=='7' || c_profile=='8'|| c_profile=='9' || c_profile == '16'))
		{	// set profile to default DDE Support
				nlapiSetFieldValue('profile', '1', false, true); //US214281
		}

		// if Assigned is Unassigned SSE UK Support User or Unassigned SSE UK Back Office and Profile is DDE Support (default) (1) or AU SSE Support (9) or German SSE Support (16)
		if ((adept == '82') && (c_profile == '1' || c_profile == '9' || c_profile == '16'))
			{	// set Profile to SSE Support Profile (english) also enable Profile field
				nlapiSetFieldValue('profile', '2', false, true); //US214281
			}

		// if Assigned is SSE AU Support User and Profile is DDE Support (default) (1) or UK SSE Support (2, 4, 5, 6, 7, 8) or German SSE Support (16)
		if ((adept == '86') && (c_profile == '1' || c_profile == '2'|| c_profile=='4' || c_profile=='5' || c_profile=='6' || c_profile=='7' || c_profile=='8' || c_profile == '16'))
		{	// set Profile to SSE AU Support Profile
			nlapiSetFieldValue('profile', '9', false, true); //US214281
		}

	    	//German SSE Support
		if ((adept == '94') && (c_profile == '1' || c_profile == '2' || c_profile == '4' || c_profile == '5' || c_profile == '6' || c_profile == '7' || c_profile == '8' || c_profile == '9'))
		{	// set Profile to SSE German Support
			nlapiSetFieldValue('profile', '16', false, true); //US214281
		}

		// EA: 2016-03-15 if Assigned is YBP eContent (96) or YBP Customer Service (97) and profile is not YBP Support (17)
		if ((adept == '96' || adept == '97') && c_profile != '17')
		{	// set Profile to YBP Support
			nlapiSetFieldValue('profile', '17', false, true); //US214281
			// also set the Show in Case Portal checkbox to False
			nlapiSetFieldValue('custevent_show_in_case_portal', 'F');
		}


		// Case Portal Code: CN 10/28/2014
		// Check for change between SSE & DDE & adjust portal fields accordingly
			if ((old_adept == '82' || old_adept == '86' || old_adept == '94') && (adept != '82' && adept != '86' && adept != '94'))
			{
				var ddeprod = nlapiGetFieldValue('custevent_dde_prod_int');
				var ddecat = nlapiGetFieldValue('custevent_dde_area_suppt');
				var ddetyp = nlapiGetFieldValue('category'); // JO Removed as part of Taxonomy project  
				                                             // US221800 CN reinstated as still required
				if (ddeprod)
				{
					nlapiSetFieldValue('custevent_portal_product', ddeProdtoPortal(ddeprod));
				}
				if (ddecat)
				{
					nlapiSetFieldValue('custevent_portal_request_category', ddeCattoPortal(ddecat));
				}
				if (ddetyp)
				{
					nlapiSetFieldValue('custevent_portal_request_type', ddeTyptoPortal(ddetyp));
				}
			}

			if ((old_adept != '82' && old_adept != '86' && old_adept != '94') && (adept =='82' || adept == '86' || adept == '94'))
			{
				var sseprod = nlapiGetFieldValue('custevent_sse_product');
				var ssecat = nlapiGetFieldValue('custevent_sse_request_category');
				if (sseprod)
				{
					nlapiSetFieldValue('custevent_portal_product', sseprod);
				}
				if (ssecat)
				{
					nlapiSetFieldValue('custevent_portal_request_category', sseCattoPortal(ssecat));
				}
				nlapiSetFieldValue('custevent_portal_request_type', sseTyptoPortal(nlapiGetFieldValue('custevent_sse_request_type')));
			}


		// Also handle enabling/disabling profile field - only UK allowed to amend.
		// 02-24-16:  US69594 - New "Far East Support (DDE)" department (95) should also be allowed to choose the profile (i.e., Korean, Simplified Chinese, or Traditional Chinese)
			if ((old_adept == '82' && adept != '82') || (old_adept == '95' && adept != '95'))
			{
				nlapiDisableField('profile', true);
			}
			if ((old_adept != '82' && adept == '82') || (old_adept != '95' && adept == '95'))
			{
				nlapiDisableField('profile', false);
			}
		}

	}

	if (name == 'company')
	{	// EIS ACCOUNT LOOKUP CODE
			// If this is an EIS Case and the Company changes then go through the lookup process
			// Clear the EIS Account Field
			nlapiSetFieldValue('custevent_eis_account', '', false, true);

			//call the getCurrentCompanyAccount function to check what needs to be searched
			getCurrentCompanyAccount();

			var c_profile = nlapiGetFieldValue('profile');
			var comp = nlapiGetFieldValue('company');

			// 2014-06-03 eabramo:  If setting Company to Anonymous	DDE (277026) and Profile is UK SSE (ID's for these are 2, 4, 5, 6, 7, 8) or AU SSE (9) or German SSE (16)
			if (comp == '277026' && (c_profile=='2' || c_profile=='4' || c_profile=='5' || c_profile=='6' || c_profile=='7' || c_profile=='8' || c_profile=='9' || c_profile == '16' ))
			{	// set Profile to DDE
				nlapiSetFieldValue('profile', '1', false, true); //US214281
			}
			// If setting Company to Anonymous SSE UK (Prod = 1489915)  and Profile is DDE or AU SSE (9) or German SSE (16)
			if (comp == '1489915' && (c_profile == '1' || c_profile == '9' || c_profile == '16'))
			{	// set Profile to SSE
				nlapiSetFieldValue('profile', '2', false, true); //US214281
			}
			// If setting Company to Anonymous SSE AU (1503909) and Profile is DDE or UK SSE (2, 4, 5, 6, 7, 8) or German SSE (16)
			if (comp == '1503909' && (c_profile == '1' || c_profile=='2' || c_profile=='4' || c_profile=='5' || c_profile=='6' || c_profile=='7' || c_profile=='8' || c_profile == '16'))
			{	// set Profile to SSE
				nlapiSetFieldValue('profile', '9', false, true); //US214281
			}
	        	//If setting company to Anonymous German SSE and profile is one of the other DDE or SSE
			if (comp == '1559097' && (c_profile == '1' || c_profile == '2' || c_profile == '4' || c_profile == '5' || c_profile == '6' || c_profile == '7' || c_profile == '8' || c_profile == '9'))
			{
			    nlapiSetFieldValue('profile', '16', false, true); //US214281
			}

			// Production ID for Anonymous YBP Customer = 1582962
			// 2016-03-15 EA: If setting company to Anonymous YBP Customer and profile is not YBP profile
			if (comp == '1582962' && c_profile != '17')
			{
			    nlapiSetFieldValue('profile', '17', false, true); //US214281
			    // also set the Show in Case Portal checkbox to False
			    nlapiSetFieldValue('custevent_show_in_case_portal', 'F');
			}
	}


	// Case Portal Code - CN: 10/28/2014
	// Populate Case Portal Fields according to relevant SSE or DDE fields (dependent on department)
	// DDE Product/Interface
	if (name == 'custevent_dde_prod_int')
	{
		if (adept != '82' && adept != '86' && adept != '94' && nlapiGetFieldValue('custevent_dde_prod_int'))
		{
			nlapiSetFieldValue('custevent_portal_product', ddeProdtoPortal(nlapiGetFieldValue('custevent_dde_prod_int')));
		}
	}
	// DDE Area of Support
	if (name == 'custevent_dde_area_suppt')
	{
		if (adept != '82' && adept != '86' && adept != '94' && nlapiGetFieldValue('custevent_dde_area_suppt'))
		{
			nlapiSetFieldValue('custevent_portal_request_category', ddeCattoPortal(nlapiGetFieldValue('custevent_dde_area_suppt')));
		}
	}
	// DDE Request Type
	if (name == 'category')
	{
		if (adept != '82' && adept != '86' && adept != '94' && nlapiGetFieldValue('category'))
		{
			nlapiSetFieldValue('custevent_portal_request_type', ddeTyptoPortal(nlapiGetFieldValue('category')));
		}
	}

	// SSE Product
	if (name == 'custevent_sse_product')
	{
		if ((adept == '82' || adept == '86' || adept == '94') && nlapiGetFieldValue('custevent_sse_product'))
		{
			nlapiSetFieldValue('custevent_portal_product', nlapiGetFieldValue('custevent_sse_product'));
		}
	}
	// SSE Request Category
	if (name == 'custevent_sse_request_category')
	{
		if ((adept == '82' || adept == '86' || adept == '94') && nlapiGetFieldValue('custevent_sse_request_category'))
		{
			nlapiSetFieldValue('custevent_portal_request_category', sseCattoPortal(nlapiGetFieldValue('custevent_sse_request_category')));
		}
	}
	// SSE Request Type
	if (name == 'custevent_sse_request_type')
	{
		if (adept == '82' || adept == '86' || adept == '94')
		{
			nlapiSetFieldValue('custevent_portal_request_type', sseTyptoPortal(nlapiGetFieldValue('custevent_sse_request_type')));
		}
	}
	// Ensure Case Portal Product & Category are disabled
	if (name == 'custevent_portal_product')
	{
		nlapiDisableField('custevent_portal_product', true);
	}
	if (name == 'custevent_portal_request_category')
	{
		nlapiDisableField('custevent_portal_request_category', true);
	}

	// Show in Case Portal Flag
	// If set on then populate case portal product/request type & category if not already populated
	if (name == 'custevent_show_in_case_portal')
	{
		if (nlapiGetFieldValue('custevent_show_in_case_portal') == 'T')

		{
			// For SSE Departments use SSE fields
			if (adept == '82' || adept == '86' || adept == '94')
			{
				if (!nlapiGetFieldValue('custevent_portal_product'))
				{
					nlapiSetFieldValue('custevent_portal_product', nlapiGetFieldValue('custevent_sse_product'));
				}
				if (!nlapiGetFieldValue('custevent_portal_request_category'))
				{
					nlapiSetFieldValue('custevent_portal_request_category', sseCattoPortal(nlapiGetFieldValue('custevent_sse_request_category')));
				}
				if (!nlapiGetFieldValue('custevent_portal_request_type'))
				{
					nlapiSetFieldValue('custevent_portal_request_type', sseTyptoPortal(nlapiGetFieldValue('custevent_sse_request_type')));
				}
			}
			// For DDE Departments use DDE fields
			else
			{
				if (!nlapiGetFieldValue('custevent_portal_product'))
				{
					nlapiSetFieldValue('custevent_portal_product', ddeProdtoPortal(nlapiGetFieldValue('custevent_dde_prod_int')));
				}
				if (!nlapiGetFieldValue('custevent_portal_request_category'))
				{
					nlapiSetFieldValue('custevent_portal_request_category', ddeCattoPortal(nlapiGetFieldValue('custevent_dde_area_suppt')));
				}
				if (!nlapiGetFieldValue('custevent_portal_request_type'))
				{
					nlapiSetFieldValue('custevent_portal_request_type', ddeTyptoPortal(nlapiGetFieldValue('category')));
				}
			}
		}
	}
	// End of Case Portal code


	if (name == 'custevent_eis_account')
	{	// EIS ACCOUNT LOOKUP CODE
		// If this is an EIS Case and the EIS Account changes then go through the lookup process
			// Clear the Company Field
			nlapiSetFieldValue('company', '', false, true);
			//call the getCurrentCompanyAccount function to check what needs to be searched
			getCurrentCompanyAccount();
	}

	// set the EIS Account based on the EIS Account Selector selection -- NOTE THAT FIELD CHANGE FIRE IS FALSE
	if (name=='custpage_eis_account_selector')
	{	// EIS ACCOUNT LOOKUP CODE
		nlapiDisableField('custevent_eis_account', false);
		nlapiSetFieldText('custevent_eis_account', nlapiGetFieldText('custpage_eis_account_selector'), false, true);
		nlapiRemoveSelectOption('custpage_eis_account_selector');
	}



	if (name=='custpage_customer_selector')
	{	// EIS ACCOUNT LOOKUP CODE
		//set the Company based on the Company Selector selection. NOTE THAT FIELD CHANGE FIRE IS FALSE
		nlapiDisableField('company', false);
		nlapiSetFieldText('company', nlapiGetFieldText('custpage_customer_selector'), false, true);
		// don't disable the company field
		//nlapiDisableField('company', true);
		nlapiRemoveSelectOption('custpage_customer_selector');
	}
	

//  US422401 Removed scripted alert for "Case Portal - Celigo" Origin (moved to Client_Record_Case)
 

// US824125 Removed code to enable/disable hide case flag based on change of Case SFID - Case SFID never changes through form in UI	

}


function get_EIS_Accounts()
{	// EIS ACCOUNT LOOKUP CODE
	// this function is called if company_status is Known && eis_acct_status is Unknown
	// Search EIS Accounts connected to Customers with this Case's Company
	var eis_filters = new Array();
	eis_filters[0] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'is', company_id);
	eis_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
	var eis_columns = new Array();
	eis_columns[0] = new nlobjSearchColumn('name', null, null);
	eis_searchResults = nlapiSearchRecord('customrecord_eis_account', null, eis_filters, eis_columns);
	if (eis_searchResults != null)
	{
		if (eis_searchResults.length == 1)
		{
			// if just one result then populate the eis account field
			nlapiSetFieldText('custevent_eis_account', eis_searchResults[0].getValue('name'), false, true);
		}
		else
		{
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
		}
	}
}

function get_Company()
{	// EIS ACCOUNT LOOKUP CODE
	// this function searches for all Customers connected to this Case's EIS Account
	var co_filters = new Array();
	co_filters[0] = new nlobjSearchFilter('internalid', null, 'is', eis_account);
	co_filters[1] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'noneof','@NONE@');
	var co_columns = new Array();
	co_columns[0] = new nlobjSearchColumn('custrecord_eis_account_customer', null, null);
	co_searchResults = nlapiSearchRecord('customrecord_eis_account', null, co_filters, co_columns);

	if (co_searchResults)
	{
		if(co_searchResults.length == 1)
		{
			// next line commented out 2-7-12
			// var company = nlapiLookupField('entity', co_searchResults[0].getValue('custrecord_eis_account_customer', null, null), 'entityid', null);
			// next line added on 2-7-12
			var company = co_searchResults[0].getValue('custrecord_eis_account_customer', null, null);
			// next line commented out 2-7-12
			// nlapiSetFieldText('company', company, false, true);
			// next line added on 2-7-12
			nlapiSetFieldValue('company', company, false, true);
		}
		else
		{
			alert('there are multiple Customers for this EIS Account - Contact CRM Operations');
		}
	}
}

//--------------------------------------------------------------------------//
//Function: sseTyptoPortal
// Converts SSE Request Type to Case Portal Request Type
//Input   : SSE Type
//Returns : Case Portal Type
//
function sseTyptoPortal(sseTyp)
{
	if (sseTyp)
		{
		return nlapiLookupField('customrecord_sse_request_type', sseTyp, 'custrecord_srt_cp_req_typ_map');
		}
	else
		{
		 return '';
		}
}

//--------------------------------------------------------------------------//
//Function: sseCattoPortal
//Converts SSE Request Category to Case Portal Request Category
//Input   : SSE Request Category
//Returns : Case Portal Request Category
//
function sseCattoPortal(sseCat)
{
	if (sseCat)
		{
		return nlapiLookupField('customrecord_sse_request_category', sseCat, 'custrecord_src_cp_req_cat_map');
		}
	else
		{
		 return '';
		}
}



//--------------------------------------------------------------------------//

//Function: ddeProdtoPortal    (JO UPDATED 4/27 to use new Taxonomy custom records)
//Converts DDE Product/Interface to Case Portal Product
//Input   : DDE Product/Interface
//Returns : Case Portal Product
//
function ddeProdtoPortal(ddeProd)
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
//Function: ddeCattoPortal  (JO UPDATED 4/27 to use new Taxonomy custom records)
//Converts DDE Area of Support to Case Portal Request Category
//Input   : DDE Area of Support
//Returns : Case Portal Request Category
//

function ddeCattoPortal(ddeCat)
{
	if (ddeCat)
		{
		return nlapiLookupField('customrecord_dde_area_spt', ddeCat, 'custrecord_port_req_cat');
		}
	else
		{
		 return '';
		}
}


//--------------------------------------------------------------------------//
//Function: ddeTyptoPortal
//Converts DDE Request Type to Case Portal Request Type
//Input   : DDE Type
//Returns : Case Portal Type
//
function ddeTyptoPortal(ddeTyp)
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

//US232996 checkDDESupportTaskField : Check to see if DDE Area of Support has one or more Support Tasks 
//--------------------------------------------------------------------------//
//Function: checkDDESupportTaskField
//Checks whether DDE Area of Support has Support Tasks associated
//Returns : True if Support Tasks associated, False if no associated Support Tasks
//
function checkDDESupportTaskField() 
{
    // Does the DDE Area of Support have any associated Support Tasks 
    var dde_area = nlapiGetFieldValue('custevent_dde_area_suppt')
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