// Script:     Client_Record_Case.js
//
// Created by: Christine Neale
//
// Functions:  	CR_Case_init - Initialization
//				CR_Case_formSave - Form Save
//			
//
//Library Scripts Used: library_constants.js 
//
//
// Revisions:  
//	CNeale		12/03/2018	US422407 Original version (Prevent Case with a SF ID being changed to a Customer that doesn't have one)
//	CNeale		12/03/2018	US430190 Change so Warning Message when a Case with a SF ID is changed to a Customer that doesn't have one.	
//	JOliver		12/03/2018	US422401 EBSCO Connect: Lock Case Origin for EBSCO Connect and Case Portal + script error alert when users try to select EBSCO Connect and Case Portal
//	KIlaga(ACS) 03/12/2019 	US486011 Block the ability to flip case forms for certain custom forms
//	JOliver		05/07/2019	US223210 Updated Krishna's code from 3/12/19 (above) to include isSalesCase function
//	JOliver		05/28/2019	US515022 Allow for Order Processing role to flip custom form for Sales cases
//	JOliver		11/12/2019	US473352 Marketo - Don't allow Case save if Company selected is Prospect or Lead
//	JOliver		11/12/2019	US559532 Remove warning message when Case moved from SF to non-SF Customer
//  PKelleher	3/4/2020	US584153 DS Coordinator form being inactivated.  This code will direct user to Merged case form.
// JOliver		03/20/2020	TA463177 Disallow users from selecting or changing EC AdminBOT as a case Origin
//	ZScannell	06/09/2023	Hot Fix: Require Company on save
/*----------------------------------------------------------------------------------------------------------------
 * 
 */
/*
 *  Global Variables
 */
var Comp_In = '';
/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Case_init
 * Description: Form Initialisation Scripting
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Case_init(type)
{
	// Save original value of 'company'
	Comp_In = nlapiGetFieldValue('company');
	
	// US422401 Lock Origin field if it is either Case Portal or EBSCO Connect
	// TA463177 Also Lock Origin if it is EC AdminBOT
	
	if (nlapiGetRole() != LC_Roles.Administrator && nlapiGetRole() != LC_Roles.WebServ)  
	{
		if (nlapiGetFieldValue('origin') == LC_CaseOrigin.CasePortal || nlapiGetFieldValue('origin') == LC_CaseOrigin.EBSCOconnect || nlapiGetFieldValue('origin') == LC_CaseOrigin.ECadminBOT)
		{
			nlapiDisableField('origin', true);
		}
	}
	
	// US486011 & US515022 Block the ability to flip case forms for certain custom forms
	if(nlapiGetRole() != LC_Roles.Administrator && nlapiGetRole() != LC_Roles.WebServ && nlapiGetRole() != LC_Roles.EPSalesAdmin && nlapiGetRole() != LC_Roles.EPOrdProc)
	{
		if(type != 'create')
		{
			var customForm = nlapiGetFieldValue('customform');
			console.log(customForm);
			if(LC_Form.IsSalesCase(customForm))
			{
				nlapiDisableField('customform', true);
			}	
		}
	}

	// US584153 DS Coordinator form being inactivated
	var customForm = nlapiGetFieldValue('customform');
	if (customForm == LC_Form.DSC_Case)
	{
		nlapiSetFieldValue('customform', LC_Form.CustSatMerged);
	}
	
	return true;
}
/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Case_formSave
 * Description: Form Save Validation
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Case_formSave()
{
	//	2023.06.09 Fix	-	Adding in logic to require company on save.
	var company = nlapiGetFieldValue('company');
	if (company == null || company == ''){
		alert('Please enter values for the field(s) "Company"/"Requested By"/"Institution" before saving.');
		return false;
	}
	var this_role = nlapiGetRole();
	// call function to determine whether role passed in has Customer permissions
	if(LC_Roles.RoleWithCustPermissions(this_role))
	{
		
		var comp_out = nlapiGetFieldValue('company');
		var cust_stage = nlapiLookupField('customer', comp_out, 'stage');
		
		// US473352 Marketo -  Don't allow Case save if Company selected is Prospect or Lead 
		if(cust_stage == 'PROSPECT'|| cust_stage == 'LEAD')
		{
			alert('The Institution selected is either a Prospect or a Lead. Please select a different Institution.');
			return false;
			
		}	
	}
	
	return true;
}

/*----------------------------------------------------------------------------------------------------------------
* Function   : CR_caseFieldChange(type, name)
* Description: Client Record Field Changed Scripting
*            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_caseFieldChange(type, name)
{
       // US422401 Script alert that prevents all users (except Admin & Web Srvs) from selecting Case Portal or EBSCO Connect as Origins.  **J.O. Added EC AdminBOT (TA463177)
		
       if (name=='origin')
       {      
              if (nlapiGetRole() != LC_Roles.Administrator && nlapiGetRole() != LC_Roles.WebServ)    
              {      
                     // Don't allow Origin to be set to "Case Portal"
                     if (nlapiGetFieldValue('origin') == LC_CaseOrigin.CasePortal)
                     {
                           alert('The Origin of \'Case Portal\' is reserved for Case Portal use only.  Please choose a different Origin value');
                           nlapiSetFieldValue('origin', '');
                     }
                     // Don't allow Origin to be set to "EBSCO Connect"
                     if (nlapiGetFieldValue('origin') == LC_CaseOrigin.EBSCOconnect)
                     {
                           alert('The Origin of \'EBSCO Connect\' is reserved for EBSCO Connect use only.  Please choose a different Origin value');
                           nlapiSetFieldValue('origin', '');
                     }
                     // TA463177 Don't allow Origin to be set to "EC AdminBOT"
                     if (nlapiGetFieldValue('origin') == LC_CaseOrigin.ECadminBOT)
                     {
                           alert('The Origin of \'EC AdminBOT\' is reserved for EC AdminBOT use only.  Please choose a different Origin value');
                           nlapiSetFieldValue('origin', '');
                     }
              }
       }
}
