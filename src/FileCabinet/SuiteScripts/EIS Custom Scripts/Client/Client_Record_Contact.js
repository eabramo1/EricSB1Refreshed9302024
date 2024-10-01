// Script:     Client_Record_Contact.js
//
// Created by: Christine Neale (script was not needed and deleted, and later recreated by Jeff Oliver)
//
// Functions:   	
//			CR_Contact_SF_sendInvitation_button() - script to set EBSCO Connect User Status to 'Send Invitation'
//
//Library Scripts Used:
// 			library_constants.js -- Library Script used to reference constant value
//
//
// Revisions:  
//	CNeale	09/??/2018	US402266 & US424528 - Originally a function for "Send to SalesForce" button.  Button is/was no longer needed, so function was removed from below.
//	JOliver	01/23/19	US423866 Function to set the EBSCO Connect User Status to 'Send Invitation' when the 'Send Invitation' button is
//						clicked on the contact record (contact must be in Edit mode and meet specific criteria).  See UserEvent_Contact_Before_Load script
//	CNeale	02/05/19	US471521 Function to set the Contact SF ID to indicate "createNew" required when "Push to SF" button is clicked.
//  CNeale	09/02/19	US530556 Add new "Send to SalesForce" button function available to all users (existing is available to restricted roles only).
//	CNeale	01/23/20	US589464 Add indicator when "Send EBSCO Connect Invite" button pushed
//	CNeale	04/24/20	US631219 Add new "Set EBSCONET Order Approver" Button
//	PKelleher  05/03/22	US943086 EC ReArch: NetCRM Contact Record new Fields Creation, Display, and Scripting 
						// remove SEND INVITATION TO EBSCO CONNECT button code 
//	eAbramo	05/27/22	US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//						// remove CR_Contact_SF_push_button()  and  CR_Contact_SF_push_button_all()


// US943086 remove SEND TO EBSCO CONNECT button code due to new EC architecture
// function CR_Contact_SF_sendInvitation_button()


// US963983 and US966153  removing SF Push button code
// function CR_Contact_SF_push_button()


// US963983 and US966153 removing SF Push button All code
// function CR_Contact_SF_push_button_all()


/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Contact_SAO_set_approver_button()
 * Description: Script associated with "Set EBSCONET Order Approver" button defined in UserEvent_contact_before_load.js - Edit mode
 * Input	  :	None
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Contact_SAO_set_approver_button()
{
	// Set EBSCONET Order Approval Status to "Requested" (Id: 5)
	nlapiSetFieldValue('custentity_enet_ordapprove_status', LC_ContactENOrdApprovSts.Requested);
	
	// Send Alert if you need one
 	alert('Remember to Save Contact Record to Initiate "Set EBSCONET Order Approver" Request');
	return true;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Contact_SAO_revoke_approver_button()
 * Description: Script associated with "Revoke EBSCONET Order Approver" button defined in UserEvent_contact_before_load.js - Edit mode
 * Input	  :	None
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Contact_SAO_revoke_approver_button()
{
	// Set EBSCONET Order Approval Status to "Requested" (Id: 5)
	nlapiSetFieldValue('custentity_enet_ordapprove_status', LC_ContactENOrdApprovSts.RevokeReq);
	
	// Send Alert if you need one
 	alert('Remember to Save Contact Record to Initiate "Revoke EBSCONET Order Approver" Request');
	return true;
}