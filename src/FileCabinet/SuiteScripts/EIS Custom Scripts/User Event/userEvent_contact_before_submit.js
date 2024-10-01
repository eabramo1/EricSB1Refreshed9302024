// Script:     UserEvent_contact_before_submit.js
//
// Created by: E ABRAMO  02-11-2019 --
//				created as part of US442790 'Contact Last Modified By' populates with the User who is making the change to the record (PPP)
//
// Functions:  server_contact_beforeSubmit
//
//
//
//	Library Scripts Used:
//				library_constants.js
//
//
// Revisions:  	05/27/2022	eAbramo		US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting [PART 1]
//				09/21/2022	eAbramo		Zach removed code regarding setting the custom Last Modified By field.  He put it into SS2 Version of the UserEvent Contact Before Submit
//
//	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function server_contact_beforeSubmit(type)
{
	var ctx = nlapiGetContext();
	// var userId = ctx.getUser(); // Commented out - Zach put this code into SS2 Version of the UserEvent Contact Before Submit 09/21/2022 
	var newRecord = nlapiGetNewRecord();
	
	// nlapiLogExecution('DEBUG', 'Log 1: nlapiGetRecordId()', 'value is '+nlapiGetRecordId());
	if(ctx.getExecutionContext() != 'webservices')
	{
		// Commented out below lines - Zach put this code into SS2 Version of the UserEvent Contact Before Submit 09/21/2022
		/*
		if (type != 'delete')
		{	//US442790 'Contact Last Modified By' populates with the User/Process making the change to the record (PPP)
			// -4 (LC_UnknownUser) is returned if NetSuite cannot identify a value for nlapiGetContext.getUser()
			if(userId && userId != LC_UnknownUser)
			{		
				nlapiSetFieldValue('custentity_contact_last_modified_by', userId);
				// nlapiLogExecution('DEBUG', 'Log 2: UserId', 'value is '+userId);				
			}
			else // unknown user
			{
				nlapiSetFieldValue('custentity_contact_last_modified_by', LC_Employees.SystemUser);
				// nlapiLogExecution('DEBUG', 'Log 2: could not identify user - use Library Constant LC_Employees.SystemUser', 'value is '+LC_Employees.SystemUser);					
			}
		}*/
		// US963983 and US966153 Set Create New on Contact without SF Contact ID -- if appropriate
		var sf_contact_id = newRecord.getFieldValue('custentity_sf_contact_id');
		if(sf_contact_id == '' || sf_contact_id == null){
			nlapiLogExecution('DEBUG', 'blank sf_contact_id', 'sf_contact_id value is '+sf_contact_id);
			var g_ECAccessValues = {
					EC_CaseMgmtAS: null,
					EC_DiscGroupsAS: null,
					EC_AcadAS: null,
					EC_EnetOAS: null,
					EC_FolioCustAS: null,
					EC_TransAS: null
					};
			g_ECAccessValues.EC_CaseMgmtAS = newRecord.getFieldValue('custentity_sf_case_mngmt_access_status');
			g_ECAccessValues.EC_DiscGroupsAS = newRecord.getFieldValue('custentity_sf_groups_access_status');
			g_ECAccessValues.EC_AcadAS = newRecord.getFieldValue('custentity_sf_academy_access_status');
			g_ECAccessValues.EC_EnetOAS = newRecord.getFieldValue('custentity_sf_enet_oa_access_status');
			g_ECAccessValues.EC_FolioCustAS = newRecord.getFieldValue('custentity_sf_folio_cust_access_status');
			g_ECAccessValues.EC_TransAS = newRecord.getFieldValue('custentity_sf_transition_access_status');
			
			// call Library function to determine if EBSCO Connect Access Status has been given to this Contact
			if(L_isECPortalAccessApproved(g_ECAccessValues) == true){
				nlapiLogExecution('DEBUG', 'setting SF_Contact_ID to createNew');
				newRecord.setFieldValue('custentity_sf_contact_id', LC_SF_createNew);
			}
		}
	} // context not web services
} // END server_contact_beforeSubmit