// Script:     UserEvent_Contact_Before_Load.js
//
// Created by: Christine Neale (script was not needed and deleted, and later recreated by Jeff Oliver)
//
// Function:   userEventContactBeforeLoad	
//				
//Library Scripts Used:
// 			library_constants.js -- Library Script used to reference constant values
//			library_contact.js
//			library_utility.js
//
//
// Revisions:  
//	CNeale	09/??/2018	US402266 & US424528 - Originally a function for "Send to SalesForce" button.  Button is/was no longer needed, so function was removed from below.
//	JOliver	01/23/2018	US423866 EBSCO Connect: Portal User Status field - new Button "Send Invitation"
//	CNeale	02/05/19	US471521 Function to set the Contact SF ID to "createNew" when "Push to SalesForce" button is clicked.
//	CNeale	05/08/19	US507840 Add additional check for AU Celigo Portal Customer for "Send Invitation" button 
//	CNeale	09/02/19	US530556 Adjust processing to set the Contact SF ID to "createNew" to accommodate 2 buttons with differing
//						availability & criteria. 
//  CNeale	09/25/19	F35086 Temporarily comment out Send EC Invite button & reinstate.
//	CNeale	09/30/19	US547039 Add restrictions around the "regular" button for setting the Contact SF ID to "createNew"
//	CNeale	11/05/19	US511731 EBSCO Connect Invite - now using global object/function to determine allowable roles  
//	CNeale	01/23/2020	US589464 Open up Push to SF (& Invite to EC)to EBSCO domains for certain Customers & Roles
//	CNeale	04/29/2020	US631219 ENET Order Approver - add buttons to initiate Set & Revoke
//	eAbramo	07/13/2020	US631389 Partial Deployment of SAO Code - hide ENET Order Approver buttons until SSD Endpoint is fully released
//	JOliver	10/19/2021	US860140 Removing 'globalsubscriptionstatus' validation from Push to Salesforce button
//	PKelleher  5/3/2022	US943086 ReArchitect EBSCO Connect invite process.  removing references to Send EBSCO Connect Invite button
//	eAbramo	5/31/2022	US963983 and US966153 EC ReArch Contact Record Related Validation & Scripting - removing code which renders
//									the 'Push to SalesForce' button and the 'Push to SalesForce (Email dupe)' button.
//
//	KMcCormack 01/05/23  US1051405  Regression testing fixes for Batch 3 of individual permissions re-architecture:
//							TA784122	ENET Order Approve or Revoke Button should not be allowed when ANY EBSCO Connect access is being processed. 
//										Instead, the user must wait until the pending EBSCO Connect Access status changes have been processed by
//										Salesforce and the access statuses have transitioned to either 'Granted' or 'Removed' access status.
//										Then the respective buttons are valid.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function userEventContactBeforeLoad(type, form)
{
	//nlapiLogExecution('DEBUG', '>>> Entering userEventContactBeforeLoad-SS1 logic');   	
	
	// Retrieve Context info. 
	var ctx = nlapiGetContext();
	var execCtx = ctx.getExecutionContext();  // Execution Context
	var role = ctx.getRole();  // Role
	
	
	if (execCtx == 'userinterface')
	// UI Context Only...
	{
		var contact_email = nlapiGetFieldValue('email');
		var contact_isinact = nlapiGetFieldValue('isinactive'); //US471521
		//var global_subscription_status = nlapiGetFieldValue('globalsubscriptionstatus');//US471521 (removed for US860140)
		var contact_id = nlapiGetRecordId();//US471521
		var cust_id = nlapiGetFieldValue('company'); //US507840

		//01-05-23:  US1051405 TA784122 - ENET Order Approve or Revoke Button should not be allowed when ANY EBSCO Connect Access status is being 
		//processed by Salesforce. So, retrieve all the EC Access status values and verify that none of them are in the 'Approved' or 'Revoked' state.
        var ec_AcademyAccessStatus 		= nlapiGetFieldValue('custentity_sf_academy_access_status'); 
        var ec_CaseMgtAccessStatus 		= nlapiGetFieldValue('custentity_sf_case_mngmt_access_status');
        var ec_DiscGroupsAccessStatus 	= nlapiGetFieldValue('custentity_sf_groups_access_status');
        var ec_FolioAccessStatus 		= nlapiGetFieldValue('custentity_sf_folio_cust_access_status');
        var ec_TransitionAccessStatus 	= nlapiGetFieldValue('custentity_sf_transition_access_status');
        var ec_EnetOrderApproverStatus 	= nlapiGetFieldValue('custentity_sf_enet_oa_access_status');
        
        var hasECAccessApproveOrRevokeSet = false;
        
        if (ec_AcademyAccessStatus 		== LC_Prop_Based_Access.Approved || ec_AcademyAccessStatus 		== LC_Prop_Based_Access.Revoked	||
        	ec_CaseMgtAccessStatus		== LC_SfAccessLevel.Approved 	 || ec_CaseMgtAccessStatus 		== LC_SfAccessLevel.Revoked		||
        	ec_DiscGroupsAccessStatus	== LC_SfAccessLevel.Approved	 || ec_DiscGroupsAccessStatus 	== LC_SfAccessLevel.Revoked		||
        	ec_FolioAccessStatus 		== LC_Prop_Based_Access.Approved || ec_FolioAccessStatus 		== LC_Prop_Based_Access.Revoked	||
        	ec_TransitionAccessStatus 	== LC_Prop_Based_Access.Approved || ec_TransitionAccessStatus 	== LC_Prop_Based_Access.Revoked	||
        	ec_EnetOrderApproverStatus 	== LC_Prop_Based_Access.Approved || ec_EnetOrderApproverStatus 	== LC_Prop_Based_Access.Revoked)  {
        	
        		hasECAccessApproveOrRevokeSet = true;
        }
        
        //nlapiLogExecution('DEBUG', 'ec_enetOrderApproverStatus is: '+ec_enetOrderApproverStatus);  

		// US943086 ReArchitect EBSCO Connect invite process.  removing code which renders the 'Send EBSCO Connect Invite' button
	

		// US963983 and US966153 EC ReArch Contact Record Related Validation & Scripting -- Removed entire section of code 
			// which renders the 'Push to SalesForce' button and the 'Push to SalesForce (Email dupe)' button 
		
		
		// US631219 Add 'Set EBSCONET Order Approver' button  (edit mode only)
		// Role must be Administrator, Account Exec or Sales Ops roles
		// Contact must be active, have an email & have a Customer
		// EBSCONET Order Approval Status must NOT be "Approved", "In Progress" or "Revoke In Progress"
		// There must not be another Contact for the same Customer and email that is an OA Approver 
		if (type == 'edit' && LC_Roles.IsRoleENOrdApprovSet(role) && LC_ContactENOrdApprovSts.IsSetAllowed(nlapiGetFieldValue('custentity_enet_ordapprove_status')))   // Allowed role & status
		{
			if (contact_isinact != 'T' && contact_email && cust_id) // Active Contact with email & Customer
			{	
				if (L_eNetOA_dupeEmail(cust_id, contact_email, contact_id) == false) // No other Contact with same email & Customer that's an EBSCONET Order Approver
				{
					//01-05-23:  US1051405 TA784122 - ENET Order Approve Button should not appear if ANY EC Access change is being processed by Salesforce
					if (hasECAccessApproveOrRevokeSet == false) {
						form.setScript('customscript_client_record_contact');
						form.addButton('custpage_ENOrdApprovSet', 'Set EBSCONET Order Approver', 'CR_Contact_SAO_set_approver_button();' );
					}					
				}
			}
		}
		
		// US631219 Add 'Revoke EBSCONET Order Approver' button  (edit mode only)
		// Role must be Administrator, Account Exec or Sales Ops roles
		// Contact must be active, have an email & have a Customer
		// EBSCONET Order Approval Status must be "Approved"  
		if (type == 'edit' && LC_Roles.IsRoleENOrdApprovRevoke(role) && LC_ContactENOrdApprovSts.IsRevokeAllowed(nlapiGetFieldValue('custentity_enet_ordapprove_status')))   // Allowed role & status
		{
			if (contact_isinact != 'T' && contact_email && cust_id) // Active Contact with email & Customer
			{	
				//01-05-23:  US1051405 TA784122 - ENET Order Revoke Button should not appear if ANY EC Access change is being processed by Salesforce
				if (hasECAccessApproveOrRevokeSet == false) {
					form.setScript('customscript_client_record_contact');
					form.addButton('custpage_ENOrdApprovRevoke', 'Revoke EBSCONET Order Approver', 'CR_Contact_SAO_revoke_approver_button();' );
				}
				
			}
		}		
	} // End UI Context only
}
