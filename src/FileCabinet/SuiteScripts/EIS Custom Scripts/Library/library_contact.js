//
// Script:     library_contact.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of Contact script functions that may be called from other scripts.
//             Contact specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
// L_contactParmMapObject	3/21/18		JOliver			Added 5 contact fields to be used in combination with library_dynamic_script
// L_contactParmMapObject   11/1/18     PKelleher       Added new contact field to be used for RESTlet - Contact is Inactive
// L_ec_dupeEmail			02/05/19	CNeale			US471520 Added Function to determine if Contact Email is considered dupe for 
//														EBSCO Connect 
// L_ContactECDupeChkTyp	02/05/19	CNeale			US471520 Added Global Contact Dupe Check Type Object L_ContactECDupeChkTyp
// L_ContactECDupeChkOut	02/05/19	CNeale			US471520 Added Global Contact Dupe Check Result Object L_ContactECDupeChkOut
// L_ContactButtonSFPushOvr	02/05/19	CNeale			US471520 Added Global Variable for Contact "Push to SalesForce" processing
// L_DupeNameUnderSameCustExists	
//							08/22/19	eAbramo			US487261 Adding function to determine if Contact Name is Dupe of another Contact under same Customer
// L_ContactButtonSFPushAll	08/27/19	CNeale			US530556 Added Global Variable for revised Contact "Push to EBSCO Connect" processing
// L_ContactButtonECInvite	01/23/20	CNeale			US589464 Added Global Variable for Contact "Send EC Invite" processing
// L_eNetOA_dupeEmail		05/04/20	CNeale			US633543 Added function to determine if Contact Email & Company are dupe for EBSCONET 
//														Order Approval process checks.
//	See below				05/27/22	eAbramo			US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
// 	New Functions (indented) added as part of US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//				L_hasECPortalAccess
//				L_isECPortalAccessApproved
// 				L_ECAccess_DoNotAllowBlank
// 				L_ECAccess_isNewValueAllowed
// 				L_ECPropertyAccess_isNewValueAllowed
//				L_getECAccessFieldValues
//				L_ContactECDupeChkOut2()
//				L_ec_dupeEmailSF()
//				L_handleECemailDupes()
//				L_dupeEmailAllActive
//				L_handle_EmailDupesAll
//	L_isECPortalAccessRevoked - Added as part of US999470
//	L_handleRevokeCheckboxEnablement - Added as part of US972416
//							10/21/2022	eAbramo			BATCH 2: US1029463 ECP1B1.5 NS Ensure Revoke/Resend/Inactivate are not allowed when access changing
//	L_handleResendInvCheckboxEnablement - Added as part of US999227
//							10/21/2022	eAbramo			BATCH 2: US1029463 ECP1B1.5 NS Ensure Revoke/Resend/Inactivate are not allowed when access changing
//	L_getECAccessFieldValues	08/31/23	JOliver		update to use contactObj.getFieldValue instead of L_getECAccessFieldValues (TA834368)
//
//-------------------------------------------------------------------------------------------------------------------------

var L_contactParmMapObject = {	
		contact_id: {
			nsfieldName:	'internalid',	
			searchBy:		'anyof,noneof'
		},
		
		contact_firstlastname: 	{
			nsfieldName:	'entityid',	
			searchBy:		'any,is,haskeywords,startswith,contains,isnot,doesnotstartwith,doesnotcontain'
		},
		
		contact_email: 	{
			nsfieldName:	'email',	
			searchBy:		'any,is,isempty,haskeywords,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},
		
		contact_altemail: 	{
			nsfieldName:	'altemail',	
			searchBy:		'any,is,isempty,haskeywords,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},
		
		contact_customer: 	{
			nsfieldName:	'company',	
			searchBy:		'anyof,noneof'
		},

		contact_inactive:{
			nsfieldName:	'isinactive',	
			searchBy:		'is'
		},
	};
		


//--------------------------------------------------------------------------//
//Function: L_DupeNameUnderSameCustExists
// 			Determines if the Contact Name is a duplicate of another Contact Name within the same customer
//			If the Contact has no Customer - it does the lookup on the Orphaned Contact Univ customer
//Input   	: intIdIn = Contact Internal Id
//			: nameIn = Contact Name (Entity ID)
//			: companyIn = Company of this Contact (if it exists)
//Returns	True if at least one duplicate name is found under the customer, false if not
// 
function L_DupeNameUnderSameCustExists(intIdIn, nameIn, companyIn)
{
	// build search		    
	var entity_filter = new Array();
		if (!companyIn) // must handle search if the contact has no company value
		{
			entity_filter[0] = new nlobjSearchFilter('company', null, 'anyof', LC_orphaned_cust);	
		}
		else
		{
			entity_filter[0] = new nlobjSearchFilter('company', null, 'anyof', companyIn);
		}		
		entity_filter[1] = new nlobjSearchFilter('internalid', null, 'noneof', intIdIn);
		entity_filter[2] = new nlobjSearchFilter('entityid', null, 'is', nameIn);
	var entity_column = new Array();
		entity_column[0] = new nlobjSearchColumn('internalid', null, null);
		entity_column[1] = new nlobjSearchColumn('entityid', null, null);
	// Run the search	
	var entity_searchResults = nlapiSearchRecord('contact', null, entity_filter, entity_column);
	if (entity_searchResults)
	{
		for(var x=0; x < entity_searchResults.length; x++)
		{
			var searchResultName = entity_searchResults[x].getValue('entityid');
			// Need to include case sensitivity on comparison of Names.  Use the following:
			// In above search JOE BLOGGS = Joe Bloggs
			// Yet in below comparison JOE BLOGGS != Joe Bloggs
			if (nameIn == searchResultName)
			{  
			    // nlapiLogExecution('DEBUG', 'Compare Names', 'nameIn is: '+nameIn);
			    // nlapiLogExecution('DEBUG', 'Compare Names', 'searchResultName is: '+searchResultName);				
				return true;
			}
		}
		return false;
	}
	else
	{
		return false;
	}
}

//--------------------------------------------------------------------------//
//Function: L_eNetOA_dupeEmail
//Determines whether Contact email is duplicate for EBSCONET Order Approver Set button purposes
//i.e. Only considers Contacts for a specific Customer and specific OA Statuses
//Input   	: custIdIn = Customer Internal Id
//			: emailIn = Contact Email
//			: contIdIn = Contact Internal Id
//Returns 	: false = No duplicates 
//            true = duplicates
//Note: Requires calling script to have library_constants.js 
//
function L_eNetOA_dupeEmail(custIdIn, emailIn, contIdIn)
{
	// Convert email to lower case and trim any blanks
	var email = emailIn.trim().toLowerCase();
	// Set default result of duplicates
	var result = true;
	// Build our search criteria 
	// Want to look for Contacts with the same email and same Customer that have an EBSCONET Order Approver Status that 
	// indicates that they are (or are in the process of becoming) an EBSCONET Order Approver 
	var en_filterexp = [
	                    ['company', 'anyof', custIdIn],
	                    'and',
	                    ['internalid', 'noneof', contIdIn],
	                    'and',
	                    ['formulatext:LOWER({email})','is',email],
	                    'and',
	                    ['custentity_enet_ordapprove_status', 'noneof', ['@NONE@', LC_ContactENOrdApprovSts.Revoked, LC_ContactENOrdApprovSts.CallFail]],
	                    ];
	var en_columns = new Array();
	en_columns[0] = new nlobjSearchColumn('internalid');
	en_searchResults = nlapiSearchRecord('contact', null, en_filterexp, en_columns);
	if (!en_searchResults)
	{
		result = false;
	}

	return result;
}



/*
 * Function		:	L_hasECPortalAccess()
 * 					US963983 and US966153
 * Description	:	Runs through all EBSCO Connect Access Level field values and returns true if one of these fields indicates that the 
 * 					Contact has EBSCO Connect Portal Access (a value of 'Approved' or 'Granted')
 * 					[note difference from function called L_isECPortalAccessApproved()]
 * Input		:	g_ECAccessValues_in - an Array containing all the EBSCO Connect Access Values (there are a total of six as of June 22)
 * Returns		:	True (if Contact has EC Portal Access) false if not 
*/
function L_hasECPortalAccess(g_ECAccessValues_in){
	// alert('Begin run of hasECPortalAccess function');		
	if(LC_SfAccessLevel.validPortalUser(g_ECAccessValues_in.EC_CaseMgmtAS) == true || LC_SfAccessLevel.validPortalUser(g_ECAccessValues_in.EC_DiscGroupsAS) == true || 
				LC_Prop_Based_Access.validPortalUser(g_ECAccessValues_in.EC_AcadAS) == true || LC_Prop_Based_Access.validPortalUser(g_ECAccessValues_in.EC_EnetOAS) == true || 
				LC_Prop_Based_Access.validPortalUser(g_ECAccessValues_in.EC_FolioCustAS) == true || LC_Prop_Based_Access.validPortalUser(g_ECAccessValues_in.EC_TransAS) == true){
		// alert('hasECPortalAccess function will return true');
		return true;
	}
	else{
		// alert('hasECPortalAccess function will return false');
		return false;
	}
}

/*
 * Function		:	L_isECPortalAccessApproved()
 * 					US963983 and US966153
 * Description	:	Runs through all EBSCO Connect Access Level field values and returns true if one of these fields indicates that the 
 * 					Contact has an EBSCO Connect Portal Access value of 'Approved'
 * 					[note difference from function called L_hasECPortalAccess()]
 * Input		:	g_ECAccessValues_in - an Array containing all the EBSCO Connect Access Values (there are a total of six as of June 22)
 * Returns		:	True (if Contact has EC Portal Access of Approved) false if not  
*/
function L_isECPortalAccessApproved(g_ECAccessValues_in){		
	// alert('Begin run of L_isECPortalAccessApproved function');
	if (g_ECAccessValues_in.EC_CaseMgmtAS == LC_SfAccessLevel.Approved || g_ECAccessValues_in.EC_DiscGroupsAS == LC_SfAccessLevel.Approved ||
			g_ECAccessValues_in.EC_AcadAS == LC_Prop_Based_Access.Approved || g_ECAccessValues_in.EC_EnetOAS == LC_Prop_Based_Access.Approved ||
			g_ECAccessValues_in.EC_FolioCustAS == LC_Prop_Based_Access.Approved || g_ECAccessValues_in.EC_TransAS == LC_Prop_Based_Access.Approved){
		return true;
	}
	else{
		// alert('L_isECPortalAccessApproved function will return false');
		return false;
	}
}


/*
 * Function		:	L_isECPortalAccessRevoked() - Added as part of US999470
 * Description	:	Runs through all EBSCO Connect Access Level field values and returns true if one of these fields indicates that the 
 * 					Contact has an EBSCO Connect Portal Access value of 'Revoked'
 * Input		:	g_ECAccessValues_in - an Array containing all the EBSCO Connect Access Values (there are a total of six as of June 22)
 * Returns		:	True (if Contact has EC Portal Access of Revoked) false if not  
*/
function L_isECPortalAccessRevoked(g_ECAccessValues_in){		
	// alert('Begin run of L_isECPortalAccessRevoked function');
	if (g_ECAccessValues_in.EC_CaseMgmtAS == LC_SfAccessLevel.Revoked || g_ECAccessValues_in.EC_DiscGroupsAS == LC_SfAccessLevel.Revoked ||
			g_ECAccessValues_in.EC_AcadAS == LC_Prop_Based_Access.Revoked || g_ECAccessValues_in.EC_EnetOAS == LC_Prop_Based_Access.Revoked ||
			g_ECAccessValues_in.EC_FolioCustAS == LC_Prop_Based_Access.Revoked || g_ECAccessValues_in.EC_TransAS == LC_Prop_Based_Access.Revoked){
		return true;
	}
	else{
		// alert('L_isECPortalAccessRevoked function will return false');
		return false;
	}
}



/*
 * Function		:	L_ECAccess_DoNotAllowBlank()
 * 					US963983 and US966153
 * Description	:	Used in FieldChange Function.  Gives end user an alert that s/he cannot change the field to blank
 * 					also resets the field to the value of the field on PageInit
 * Input		:	fieldIdin:  	The field ID of the Field being updated
 * 					fieldNameIn:	The name of the field (used in Alert)
 * 					newValueIn:		The value that the field is being set to by the end-user
 * 					initValueIn:	The value of the field on PageInit
 * Returns		:	N/A
*/ 
function L_ECAccess_DoNotAllowBlank(fieldIdin, fieldNameIn, newValueIn, initValueIn){
	if(newValueIn == '' && initValueIn != ''){
		nlapiSetFieldValue(fieldIdin, initValueIn, false, true);			
		alert('Contacts with a '+fieldNameIn+' cannot be unset.  The '+fieldNameIn+' has been reset back to its original value');    				
	}    	
}

/*
 * Function		:	L_ECAccess_isNewValueAllowed()
 * 					US963983 and US966153
 * Description	:	Used in FieldChange Function on AccessLevel fields that use the full Access Level list (not the Property-Based List).
 * 					Gives end user an alert that s/he cannot change the field to its new value and resets the field to the value of the field on PageInit.  
 * Input		:	fieldIdin:  	The field ID of the Field being updated
 * 					fieldNameIn:	The name of the field (used in Alert)
 * 					newValueIn:		The value that the field is being set to by the end-user
 * 					initValueIn:	The value of the field on PageInit
 * Returns		:	N/A
*/ 
function L_ECAccess_isNewValueAllowed(fieldIdin, fieldNameIn, newValueIn, initValueIn){
	
	// If set to 'Approved' and originally was 'Granted' or 'Requested' or 'Revoked' Give User Error - don't allow Save
	if(newValueIn == LC_SfAccessLevel.Approved){
		if(initValueIn == LC_SfAccessLevel.Granted || initValueIn == LC_SfAccessLevel.Req || initValueIn == LC_SfAccessLevel.Revoked){
			nlapiSetFieldValue(fieldIdin, initValueIn, false, true); 			
    		alert('Contacts with a '+fieldNameIn +' of Granted, Requested or Revoked cannot be set to Approved.  The '+fieldNameIn +' has been reset back to its original value');
		}
	}// end Approved	
	// if Revoked. Only can go from Granted to Revoked - no other options are okay 
	if(newValueIn == LC_SfAccessLevel.Revoked){
		if(initValueIn != LC_SfAccessLevel.Granted){
			nlapiSetFieldValue(fieldIdin, initValueIn, false, true); 			
    		alert('Only Contacts with a '+fieldNameIn +' of Granted can be set to Revoked.  The '+fieldNameIn +' has been reset back to its original value');
		}    				
	} // end Revoked
	// If Denied. Only can go from Needs Review to Denied - no other options are okay
	if(newValueIn == LC_SfAccessLevel.Denied){
		if(initValueIn != LC_SfAccessLevel.NeedsRev){
			nlapiSetFieldValue(fieldIdin, initValueIn, false, true);		
    		alert('Only Contacts with a '+fieldNameIn +' of Needs Review can be set to Denied.  The '+fieldNameIn +' has been reset back to its original value');
		}    				
	} // end Denied
	// Values of Granted, Inactivated, Needs Review, Requested and Removed are not allowed in UI -- uses Library function
	if(LC_SfAccessLevel.notAllowed_viaUI(newValueIn) == true){
		nlapiSetFieldValue(fieldIdin, initValueIn, false, true); 	    				
		alert('This Access Status cannot be set through the User Interface.  It has been reset back to its original value');    	    		
	}
}


/*
 * Function		:	L_ECPropertyAccess_isNewValueAllowed()
 * 					US963983 and US966153
 * Description	:	Used in FieldChange Function on AccessLevel fields that use the Property-based Access Level list (not the full List).
 * 					Gives end user an alert that s/he cannot change the field to its new value and resets the field to the value of the field on PageInit.  
 * Input		:	fieldIdin:  	The field ID of the Field being updated
 * 					fieldNameIn:	The name of the field (used in Alert)
 * 					newValueIn:		The value that the field is being set to by the end-user
 * 					initValueIn:	The value of the field on PageInit
 * Returns		:	N/A
*/ 
function L_ECPropertyAccess_isNewValueAllowed(fieldIdin, fieldNameIn, newValueIn, initValueIn){
	// If set to 'Approved' and originally was 'Granted' Give User Error - don't allow Save
	if(newValueIn == LC_Prop_Based_Access.Approved){    				
		if(initValueIn == LC_Prop_Based_Access.Granted){
			nlapiSetFieldValue(fieldIdin, initValueIn, false, true); 						 			
			alert('Contacts with a '+fieldNameIn+' of Granted cannot be set to Approved.  The '+fieldNameIn+' has been reset back to its original value');
		}
	}// end Approved    			
	// If set to 'Granted', 'Revoked', 'Inactivated' or 'Removed' through the UI - give user Error
	if(newValueIn == LC_Prop_Based_Access.Granted || newValueIn == LC_Prop_Based_Access.Revoked || newValueIn == LC_Prop_Based_Access.Inactive || newValueIn == LC_Prop_Based_Access.Removed){
		nlapiSetFieldValue(fieldIdin, initValueIn, false, true); 						 						
		alert('This Access Status cannot be set through the User Interface. The '+fieldNameIn+' has been reset back to its original value');
	} // end 'Granted', 'Revoked', 'Inactivated', 'Removed'	
}


/*
 * Function		:	L_getECAccessFieldValues()
 * 					US963983 and US966153, later updated in TA834368
 * Description	:	Fetches the current value of the six EBSCO Connect Access Status Fields 
 * Input		:	g_ECAccessValues_in		:	Empty Global Variable to store the values 	
 * Returns		:	g_ECAccessValues_in	:	Global Variable with each of the six EBSCO Connect Access Status Fields
*/

function L_getECAccessFieldValues(g_ECAccessValues_in, contactObj){
	g_ECAccessValues_in.EC_CaseMgmtAS = contactObj.getFieldValue('custentity_sf_case_mngmt_access_status');
	// alert('g_ECAccessValues.EC_CaseMgmtAS is '+g_ECAccessValues.EC_CaseMgmtAS)
	g_ECAccessValues_in.EC_DiscGroupsAS = contactObj.getFieldValue('custentity_sf_groups_access_status');
	g_ECAccessValues_in.EC_AcadAS = contactObj.getFieldValue('custentity_sf_academy_access_status');
	g_ECAccessValues_in.EC_EnetOAS = contactObj.getFieldValue('custentity_sf_enet_oa_access_status');
	g_ECAccessValues_in.EC_FolioCustAS = contactObj.getFieldValue('custentity_sf_folio_cust_access_status');
	g_ECAccessValues_in.EC_TransAS = contactObj.getFieldValue('custentity_sf_transition_access_status');
	
	return g_ECAccessValues_in;
}


/*--------------------------------------------------------------------------------------------------------------------------
* Global Contact Dupe Check Result Object - for use with L_ec_dupeEmailSF
**---------------------------------------------------------------------------------------------------------------------------*/
// US943087  NO NEED for return of the DupesAll or DupesSFId -- commented out DupesAll and DupesSFId and added two new output parameters
var L_ContactECDupeChkOut2 = {
	NoDupes				: '0',	// No duplicates detected
	SFContactDupesOnly	: '3', 	// Duplicates found within NetCRM Contacts who have SF Contact IDs
	SRPMDupesOnly		: '4',	// Duplicates found within NetCRM SRPM records which are not converted
	ContactAndSRPMDupes	: '5'	// Duplicates found within NetCRM Contacts and SRPM records which are not converted
};


//--------------------------------------------------------------------------//
//Function: L_ec_dupeEmailSF
//Determines whether Contact email is duplicate for EBSCO Connect purposes.  This checks a) CRM Contacts with a SF Contact ID b) CRM SRPM records
//Input   	: intIdIn = Contact Internal Id
//		: emailIn = Contact Email
//Returns 	: 
//			L_ContactECDupeChkOut2.NoDupes				: '0',	// No duplicates detected
//			L_ContactECDupeChkOut2.SFContactDupesOnly	: '3', 	// Duplicates found within NetCRM Contacts who have SF Contact IDs
//			L_ContactECDupeChkOut2.SRPMDupesOnly		: '4',	// Duplicates found within NetCRM SRPM records which are not converted
//			L_ContactECDupeChkOut2.ContactAndSRPMDupes	: '5'	// Duplicates found within NetCRM Contacts and SRPM records which are not converted
function L_ec_dupeEmailSF(intIdIn, emailIn)
{
	// alert('starting function L_ec_dupeEmailSF');
	// Convert email to lower case and trim any blanks
	var email = emailIn.trim().toLowerCase();
	// Set a dummy contact id of '1' if new Contact (IntIdIn will be '') or if Contact ID not passed in
	var intId = intIdIn;
	if (!intId)
	{
		intId = 1;
	}
	// Declare return array & set to default of "No dupes" // US943087 used to be called 'results' rename to 'contact_results'
	// US943087 Adding new variables to capture results
	var results = L_ContactECDupeChkOut2.NoDupes;
	// US943087 need variables to store results of each search
	var contact_results = false;
	var srpm_results = false;
	

	if (email.length != 0)
	{
		// US943087 removed qualifying code of 'NOT EBSCO email domain'
			// build Contact search criteria
			// Different Contact, email match & SF Contact Id 
			var ec_cont_filterexp = [
			                    	['internalid', 'noneof', intId],
			                    	'and', 
			                    	['formulatext:LOWER({email})','is',email],
			                    	'and',
			                    	['custentity_sf_contact_id', 'isnot', ''],
			                    	];
			// Contact Search
			var ec_cont_columns = new Array();
			ec_cont_columns[0] = new nlobjSearchColumn('custentity_sf_contact_id');
			ec_cont_searchResults = nlapiSearchRecord('contact', null, ec_cont_filterexp, ec_cont_columns);						
			if (ec_cont_searchResults){		
				contact_results = true;
				// alert('found another contact record in NetCRM with same email');
			}			
			// Build SRPM Search criteria
			// email match, Conversion Status not 'Converted', and active
			var ec_srpm_filterexp = [
             					['formulatext:LOWER({custrecord_sr_email})','is',email],
             					'and',
             					['custrecord_srpm_conversion_status', 'noneof', LC_SrpmConversionStatus.converted],
             					'and',
             					['isinactive', 'is', 'F'],
             					];
			// SRPM Search
			var ec_srpm_columns = new Array()
			ec_srpm_columns[0] = new nlobjSearchColumn('internalid');
			ec_srpm_searchResults = nlapiSearchRecord('customrecord_sr_portal_member', null, ec_srpm_filterexp, ec_srpm_columns);			
			if (ec_srpm_searchResults){
				srpm_results = 	true;
				// alert('found another SRPM record in NetCRM with same email');
			}
			
			// Populate results variable
			// default value for results = L_ContactECDupeChkOut2.NoDupes;
			if(contact_results == true && srpm_results == true){
				results = L_ContactECDupeChkOut2.ContactAndSRPMDupes;
			}
			else if(contact_results == false && srpm_results == true){
				results = L_ContactECDupeChkOut2.SRPMDupesOnly;
			}
			else if(contact_results == true && srpm_results == false){
				results = L_ContactECDupeChkOut2.SFContactDupesOnly;
			}
			// alert('results = '+results);
			return results;
	} // end email.length != 0
}


//--------------------------------------------------------------------------//
//Function: L_handleECemailDupes
// Handles telling End User what the problem is with the Duplicate Email situation for this Contact
//Input   	DupeSituationIn (the L_ContactECDupeChkOut2 result value)
		//			L_ContactECDupeChkOut2.NoDupes				: '0',	// No duplicates detected
		//			L_ContactECDupeChkOut2.SFContactDupesOnly	: '3', 	// Duplicates found within NetCRM Contacts who have SF Contact IDs
		//			L_ContactECDupeChkOut2.SRPMDupesOnly		: '4',	// Duplicates found within NetCRM SRPM records which are not converted
		//			L_ContactECDupeChkOut2.ContactAndSRPMDupes	: '5'	// Duplicates found within NetCRM Contacts and SRPM records which are not converted
		//	emailOnLoad_in	: The value of the Contact email on Page Init (the Contact email will be reset to this value)
//Returns 	:  N/A
function L_handleECemailDupes(DupeSituationIn, emailOnLoad_in){
	// alert('DupeSituationIn is '+DupeSituationIn)
	if(DupeSituationIn == L_ContactECDupeChkOut2.SRPMDupesOnly){
		alert('ERROR: There is already an EBSCO Academy user (Self Registered Portal Member) who uses this email on EBSCO Connect.  If you wish to pursue changing this email, please contact the following:  cwhitehead@ebsco.com for CustSat contacts, or smt@ebsco.com for Sales contacts. Original email will be reset.');
		nlapiSetFieldValue('email', emailOnLoad_in, false, true);
		return false;
	}
	else{
		alert('ERROR: There is already an EBSCO Connect user who uses this email. If you wish to pursue changing this email, please contact the following:  cwhitehead@ebsco.com for CustSat contacts, or smt@ebsco.com for Sales contacts. Original email will be reset.');
		nlapiSetFieldValue('email', emailOnLoad_in, false, true);
		return false;
	}
}


//--------------------------------------------------------------------------//
//Function: L_dupeEmailAllActive
//Determines whether Contact email is duplicate of another Active Contact.  This checks all CRM Contacts that are Active (ignoring whether or not the Contact has a SF Contact ID)
//					This function does NOT check SRPM records
//Input   	: intIdIn = Contact Internal Id
//			: emailIn = Contact Email
//Returns 	: dupeContactsOut (an array of Contact ID's which are active and have a dupe email address to the Address being passed in)
//	
function L_dupeEmailAllActive(intIdIn, emailIn){
	// alert('starting function L_dupeEmailAllActive');
	// Convert email to lower case and trim any blanks
	var email = emailIn.trim().toLowerCase();
	// Set a dummy contact id of '1' if new Contact (IntIdIn will be '') or if Contact ID not passed in
	var dupeContactsOut = new Array();
	
	var intId = intIdIn;
	if (!intId)
	{
		intId = 1;
	}
	if (email.length != 0)
	{
		var contact_filterexp = [
        	['internalid', 'noneof', intId],
        	'and', 
        	['formulatext:LOWER({email})','is',email],
        	'and',
        	['isinactive', 'is', 'F'],
        	];
			// Contact Search
			var contact_columns = new Array();
			contact_columns[0] = new nlobjSearchColumn('internalid');
			contact_searchResults = nlapiSearchRecord('contact', null, contact_filterexp, contact_columns);						
			if (contact_searchResults){
				//var dupeContactsOut = new Array();		
				for (var x=0; contact_searchResults != null && x < contact_searchResults.length; x++ ){
					dupeContactsOut[x] = contact_searchResults[x].getValue('internalid');
					// alert('dupeContactsOut[x] is: '+dupeContactsOut[x]);
				}
			}
	}
	// alert('Finish function L_dupeEmailAllActive. dupeContactsOut is: '+dupeContactsOut);
	return dupeContactsOut;
}


//--------------------------------------------------------------------------//
//Function: L_handle_EmailDupesAll
//Handles telling End User what the problem is with the Duplicate Email situation for this Contact
//Input   	:	dupeContacts_in = an array of Contact ID's which are active and have a dupe email address to the Address being passed in 
//								This array is generally the output from the L_dupeEmailAllActive() function
//				reasonForCheck_in = The reason why the dupe Check needs to be performed (eg. EBSCO Connect, EBSCONET) 
//							This value gets put into the User Interface alert. For example:  'please ensure you are giving "EBSCO Connect" access to the correct Contact'
//Returns 	:  N/A
function L_handle_EmailDupesAll(dupeContacts_in, reasonForCheck_in){
	// alert('starting L_handle_EmailDupesAll');
	if(dupeContacts_in){			
		// alert('dupeContacts_in.length is '+ dupeContacts_in.length);
		if(dupeContacts_in.length > 0){
			var lookupContactFields = ['entityid', 'company'];
			var lookupCustFields = ['entityid', 'companyname'];
			var contactInfo = null;
			var contactName = null;
			var contactCustIntId = null;
			var counter = null;
			var custInfo = null;
			var contactCustId = null;
			var contactCustName = null;
			var thisfoundContactString = '';
			var allfoundContactsString = '';
			for (var x=0; dupeContacts_in != null && x < dupeContacts_in.length; x++ ){
				// lookup contact
				contactInfo = nlapiLookupField('contact', dupeContacts_in[x], lookupContactFields);
				contactName = contactInfo.entityid;
				contactCustIntId = contactInfo.company;			
				counter = x+1;
				// lookup customer
				if(contactCustIntId){
					custInfo = nlapiLookupField('customer', contactCustIntId, lookupCustFields);
					contactCustId = custInfo.entityid;
					contactCustName = custInfo.companyname;
				}
				else{
					contactCustId = '[Unknown: ';
					contactCustName = 'The Customer was removed from this Contact]';
				}
				thisfoundContactString = 'Contact '+counter+' found is: '+contactName+' under customer '+contactCustId+': '+contactCustName+'\n';
				allfoundContactsString = allfoundContactsString+thisfoundContactString;								
				}
			if(dupeContacts_in.length == 1){
				alert('Please be aware that '+dupeContacts_in.length+' other active contact exists in NetCRM which shares this same email address.  Before saving, please ensure you are giving '+reasonForCheck_in+' access to the correct Contact');
			}
			else{
				alert('Please be aware that '+dupeContacts_in.length+' other active contacts exist in NetCRM which share this same email address.  Before saving, please ensure you are giving '+reasonForCheck_in+' access to the correct Contact');
			}
			// give the user all the found contacts with this email address
			alert(allfoundContactsString);
		}
	}
}


//--------------------------------------------------------------------------//
//Function: L_handleRevokeCheckboxEnablement - Added as part of US972416
// Purpose:	Determines if the Contact's 'Revoke EBSCO Connect Access' checkbox should be enabled or disabled.  Runs on Contact page Init.  
//			Also runs in FieldChange when unchecking other checkboxes which when checked disable the 'Revoke EC Access' checkbox
//			
//Input:	thisRole_in = the role of the user 
//Returns:  N/A
function L_handleRevokeCheckboxEnablement(thisRole_in){
	//  Only if user has ability to edit EC Access Status and current Access Status is Granted (for now only look at Academy - but possibly in future may need to look at all statuses)
	if(LC_Roles.isRoleModifyEC_Contact(thisRole_in) == true && g_ECAccessValues_init.EC_AcadAS == LC_Prop_Based_Access.Granted){
		// US1029463 ECP1B1.5 NS Ensure Revoke/Resend/Inactivate are not allowed when access changing (still awaiting processing)	
		if(L_isECPortalAccessApproved(g_ECAccessValues_init) == false && L_isECPortalAccessRevoked(g_ECAccessValues_init) == false){
			nlapiDisableField('custentity_revoke_ec_accstatus_all', false);
		}
	}
}


//--------------------------------------------------------------------------//
//Function: L_handleResendInvCheckboxEnablement - Added as part of US999227
//Purpose:	Determines if the Contact's 'Revoke EBSCO Connect Access' checkbox should be enabled or disabled.  Runs on Contact page Init.  
//			Also runs in FieldChange when unchecking other checkboxes which when checked disable the 'Revoke EC Access' checkbox
//			
//Input:	thisRole_in = the role of the user 
//Returns:  N/A
function L_handleResendInvCheckboxEnablement(thisRole_in){
	// Enable 'Resend Invitation' checkbox field - Only if user has ability to edit EC Access Status and Access Status is Granted or Approved
	if(LC_Roles.isRoleModifyEC_Contact(thisRole_in) == true && L_hasECPortalAccess(g_ECAccessValues_init) == true ){
		// and only if current Portal User Status is 'Invitation in Progress' or 'Invitation Expired'
		if(sfPortalUserStatus_init == LC_PortalUserStatus.InvitationInProgress || sfPortalUserStatus_init == LC_PortalUserStatus.InvitationExpired){
			// US1029463 ECP1B1.5 NS Ensure Revoke/Resend/Inactivate are not allowed when access changing (still awaiting processing)
			if(L_isECPortalAccessApproved(g_ECAccessValues_init) == false && L_isECPortalAccessRevoked(g_ECAccessValues_init) == false){
				nlapiDisableField('custentity_resend_ec_invitation', false);
			}
		}	
	}
}






