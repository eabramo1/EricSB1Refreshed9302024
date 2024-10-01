/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/* Script:     UserEvent2_Contact_beforeSubmit.js
 *
 * Created by: Christine Neale
 *
 * Library Scripts Used:
 *
 * Revisions:  
 *	CNeale  	04/27/2020	US631219 Original version
 *	CNeale		06/11/2020	US631176 Handle responses
 *  CNeale		06/26/2020	US637815 Various fine tuning
 *  eAbramo		12/08/2020	US728084 Add NetCRM Site Name and Main Address to SSD request
 *  JOliver		05/24/2022	TA714097 Set FOLIO Access Status = approved/revoked when Case Mgmt = approved/revoked and FOLIO customer
 *  ZScannell	05/25/2022	US943054 TA714494 ENET Approver Access Updated
 *  ZScannell	05/25/2022	US943054 TA714491 Transition Access Updated
 *  eAbramo		05/31/2022	US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
 *  ZScannell	06/06/2022	US943054 - Refactored to use Library2_contact references
 *  ZScannell	08/09/2022	US994721 - Fixing defects with Transition Center Access
 *  eAbramo		08/17/2022	US999227 Ability to Resend an EBSCO Connect Invitation
 *  ZScannell	09/19/2022	TA754301 - Fixing issue with Invitation Expired Contact not receiving ENET Order Approver Access Status update to "Approved" properly
 *  ZScannell	09/20/2022	TA754968 - Adding in logic from SS1 to capture Contact Last Modified Data
 *  eAbramo		10/19/2022	TA763840/US1028664 ECP1B1: Defect Fixes and Re-Testing resulting from 10/17 Meeting
 *  ZScannell	10/31/2022	US1031367 TA767998 Fixing ENET OA Access Status code for contacts with a Portal User Status of "Invitation Expired"
 *  ZScannell	11/15/2022	US1034021 ECCP2B3 NS Resend Invitation - SF Access Update needs handling unneeded when Resend Invitation box is checked
 *  KMcCormack	11/16/2022	US1031367 TA7769558 Refactor code to make it easier to maintain and build upon.  Introduced new library function called library2_ECAccess.
 *  KMcCormack	11/22/2022	US1035778 Changes for allowing selective setting of granular accesses
 *  			12-13-2022  - cont -  	Flag ANY change of access status via UI to be picked up by Boomi for Salesforce notification
 *  KMcCormack	01-04-2023	US1051405  Regression testing fixes:
 *  						TA783686	Javascript error thrown in PopulateCustomerObj when trying to assign transition center values from fields
 *  									that don't exist on the Customer (i.e. certain transitions never initialized or set on the Customer in SB3 & Prod)
 *  						TA783890	ENETorder EC access not being properly set to 'Approved' or 'Revoked'. Fixed 'if' condition reference to use 
 *  									the correct constant value for ENOrdApprovSts so EC ENet Status will be set properly. Also, added logic to
 *  									ensure that ENETorder EC access is set to 'Approved' when a Contact first becomes a Connect user if he 
 *  									is also an ENET Approver.
 * 	ZScannell	02/06/2023	US1017301	Updating Contact after save if Matching Academy Only User to contact
 * 	ZScannell	03/21/2023	TA805716 	Adding in logic to handle converted SRPMs being granted ENET Order Approver AS of "Approved"
 *  KMcCormack  2023-04-05  US1091667   EBSCO Connect Defect:
 *                           TA808650   Access-Update-Needs-Handling flag should NOT be set when a SRPM record is being matched,
 *                                      i.e. converted, to a EC NS Verified Contact.  When the conversion occurs, the access statuses
 *                                      from the SRPM will be copied onto the EC NS Verified Contact, but there is no access work
 *                                      that needs to be done in SF because the SF Self-registered Contact's User record already
 *                                      has the permissions on it.
 *                           TA808652   No access status changes, including property-based ones, should be sent to SF from NS
 *                                      when PUS is 'Invitation Expired'. This is because when a Contact's PUS is 'Invitation Expired'
 *    	                                the associated SF User record is inactive and cannot have its permissions added or removed.
 * 	KMcCormack  2023-04-12  US1101144   EBSCO Connect Defect:
 *                           TA810792   Fallout from previous fix TA808650 - When an existing Contact is being matched to a
 * 										Self-Registered user (SRPM), we need to set ENET Order Approver access to "Approved" at the
 * 										time its being matched if the Contact is an ENET approver, so access-update-needs-handling
 * 										needs to be set.
 *  JOliver		2023-05-10	TA818451	Clinical Decisions Access Status - setting it to Approve
 * 	ZScannell	2023-08-09	US1146654	Contacts set to Inactive AS of "Revoked" not flowing to SF - Deprecate hasActiveUserRec
 * 	eAbramo		2023-08-21	US1138811	Added new attribute FOLIO Partner to PopulateCustomerObj
 * 	eAbramo		2024-04-30	US1240633	Scripting to apply EBSCO Hosted FOLIO Access Status Part 2
* */

define(['N/error', 
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_SAO', 
        'N/runtime', 
        'N/search', 
        'N/record',
        'N/email',
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_ECAccess',
		'/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

function(error, LC2Constant, L2SAO, runtime, search, record, email, L2ECAccess, utility) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	log.debug('>>> Entering:', 'Contact beforeSubmit logic');
    	log.debug('Current Script Context is: ', scriptContext.type);
    	
    	// On Edit
        if(scriptContext.type == 'edit'){
        	//Get the old (initially loaded) and the new (updated) versions of the Contact being submitted
            var newRec = scriptContext.newRecord;
            var oldRec = scriptContext.oldRecord;
            var company = newRec.getValue('company');
            
            //Create objects to hold the access related field values that we care about from the old and new Contact record and from the Customer record
            var oldContECInfo = new L2ECAccess.L2_ContactECObj();
            var newContECInfo = new L2ECAccess.L2_ContactECObj();            
            var custECInfo = L2ECAccess.L2_CustomerECObj; 	  
                        
            //Variables used in EBSCO Connect Access functionality
            var LC2_prop_access = LC2Constant.LC2_Property_based_Access;  // Global variable holding Property-based Access Status list values
            var LC2_access_lvl  = LC2Constant.LC2_SF_EcAccessLevels_sts;  // Global variable for holding Access Status list values
            var LC2_ENET_OrderApprove_sts = LC2Constant.LC2_ENET_OrderApprove_sts; // Global Variable for holding EBSCONET Order Approver Statuses list values
            var enoaSts = newRec.getValue('custentity_enet_ordapprove_status');
            var setECAccessNeedsHandlingFlag = false;	//Initialize to false
            var resendInv = newRec.getValue('custentity_resend_ec_invitation');
            
            //Variables used in SAO processing
            var L2_SAO_Obj = L2SAO.L2_SAO_Object;    // Global variable holding info for SAO call & responses
            var LC2_ENOASts = LC2Constant.LC2_ContactENOrdApprovSts;  // Global variable holding EBSCONET order approver status values
            var LC2_OpCat = LC2Constant.LC2_ContactOpCat;  // Global variable holding Contact Operational Category
            var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
            var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
 
			//	TA805716 - Moved to beginning of script to account for the influence Academy AS of "Granted" being added onto the contact from the SRPM Conversion has on the ENET OA/Transition/FOLIO Access Status checks.
			//	Note: Cannot be moved after PopulateContactObj as new Academy AS needs to be put onto newContECInfo variable.
			//	US1017301
			//	Start of Match with Displayed Academy Only User Code
			if (newRec.getValue({fieldId: 'custentity_academy_user_match_requested'}) == true){
				log.debug('Match with Displayed Academy Only is true');
				//	Load information from the SRPM
				var srpmId = newRec.getValue({fieldId: 'custpage_sr_id'});
				var srpmObject = PopulateSRPMObject(srpmId);
				//	Update the Contact
				newRec.setValue({
					fieldId: 'custentity_sf_contact_id',
					value: srpmObject.SFContactId,
					ignoreFieldChange: true
				});
				newRec.setValue({
					fieldId: 'custentity_sf_academy_access_status',
					value: srpmObject.AcademyAccessStatus,
					ignoreFieldChange: true
				});
				newRec.setValue({
					fieldId: 'custentity_sf_case_mngmt_access_status',
					value: srpmObject.CaseManagementAccessStatus,
					ignoreFieldChange: true
				});
				newRec.setValue({
					fieldId: 'custentity_sf_groups_access_status',
					value: srpmObject.DiscussionGroupsAccessStatus,
					ignoreFieldChange: true
				});
				newRec.setValue({
					fieldId: 'custentity_sf_self_reg_portal_member_id',
					value: srpmObject.InternalId,
					ignoreFieldChange: true
				});
				newRec.setValue({
					fieldId: 'custentity_portal_user_status',
					value: srpmObject.PortalUserStatus,
					ignoreFieldChange: true
				});
			}	//	End Match Requested == True

            /* *********************************************************
             * EBSCONET APPROVER STATUS LOGIC
             * *********************************************************/
            // If "Set EBSCONET Order Approver" button OR "Revoke EBSCONET Order Approver" button clicked then call to API.
            // *** NOTE: The API calls made in the ProcessEBSCONetApproverAction may result in newRec being updated with new EBSCONet Approver related values ***
            if(enoaSts == LC2_ENOASts.Requested || enoaSts == LC2_ENOASts.RevokeReq) {
            	ProcessEBSCONetApproverAction();
            }       
            
            /* *********************************************************
             * EBSCO CONNECT ACCESS STATUS LOGIC
             * *********************************************************/
            //Put Old Contact field values related to EBSCO Connect into our old Contact object
            PopulateContactObj(oldRec, oldContECInfo);
            log.debug('oldContECInfo:', JSON.stringify(oldContECInfo));
            
            //Put New Contact field values related to EBSCO Connect into our new Contact object
            // *** Per the NOTE above, populating values from newRec needs to be done AFTER the ProcessEBSCONetApproverAction logic above ***
            PopulateContactObj(newRec, newContECInfo);
            log.debug('newContECInfo:', JSON.stringify(newContECInfo));
     
            log.debug('checking isECPortalMember is:', newContECInfo.isECPortalMember());
			//	log.debug('checking hasActiveUserRec is:', newContECInfo.hasActiveUserRec());

            if (newContECInfo.isECPortalMember()) {    
				//04-04-23 US1091667-TA808652: No EC access status fields should be set to Approved or Revoked if the User record is not
				//active in SF (e.g. "Invitation Expired").An inactivated SF User record cannot have permissions added or removed from it
				//so the following check was added to ensure an activeUserRec before setting approved or revoked statuses.
				//	US1146654 Deprecate hasActiveUserRec() to allow inactivated users Revoke to flow to Removed
				//if (newContECInfo.hasActiveUserRec()) {

				//Retrieve some Customer info for property access setting checks
				// US1240633 The below two lines used to be below the 'If Case Mgt Access has been changed to 'Approved' or 'Revoked'
				//		section.  I moved it ABOVE so that the custECInfo object could be used in more places
				PopulateCustomerObj(company, custECInfo);
				log.debug('custECInfo object', JSON.stringify(custECInfo));

				/* *********************************************************
	             * CASE MANAGEMENT ACCESS STATUS CHANGE LOGIC
	             * *********************************************************/
	            //If Case Mgt Access has been changed to 'Approved' or 'Revoked'            	
	            if ((newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Approved && oldContECInfo.EC_CaseMgtAS != LC2_access_lvl.Approved) ||
	                (newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Revoked  && oldContECInfo.EC_CaseMgtAS != LC2_access_lvl.Revoked)) {

	            	// Handle when Case Mgt Access has been changed to 'Approved'
	                if(newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Approved && oldContECInfo.EC_CaseMgtAS != LC2_access_lvl.Approved) {
	                	
	                	//If Academy is not already Approved or Granted, then set it to Approved.  Academy access should always exist if Case Mgt access exists. (US963983 and US966153)
	                	if(newContECInfo.EC_AcademyAS != LC2_prop_access.Approved && newContECInfo.EC_AcademyAS != LC2_prop_access.Granted) {
	                		newRec.setValue('custentity_sf_academy_access_status', LC2_prop_access.Approved);
	                	}
	            			                	
	                	//US1035778:  Client side code will default Group Disc to 'Approved' when Case Mgt is set to 'Approved', HOWEVER, we now
	                	//want to give the user the option of overriding that default and removing Group Disc access if they want to, so no longer want 
	                	//to automatically force it to 'Approved' here.  (This is a change from the initial RefArch Phase 1 - all or nothing access assignments)
	                	//if(newContECInfo.EC_DiscGroupsAS != LC2_prop_access.Approved && newContECInfo.EC_DiscGroupsAS != LC2_prop_access.Granted) {
	                	//	newRec.setValue('custentity_sf_groups_access_status', LC2_prop_access.Approved);
	                	//}
	      
	                	log.debug('checking isFolioCustomer is:', custECInfo.isFolioCustomer());
	                	//TA714097 If customer is a FOLIO customer, then set FOLIO Access Status to Approved
	                	if(custECInfo.isFolioCustomer()) {
	                		newRec.setValue('custentity_sf_folio_cust_access_status', LC2_prop_access.Approved);
	                	}
	                	log.debug('checking isTransitionCustomer is:', custECInfo.isTransitionCustomer());
	                	//TA714491 If customer is a Transition customer, then set Transition Access Status to Approved
	                	if(custECInfo.isTransitionCustomer()) {
	                		newRec.setValue('custentity_sf_transition_access_status', LC2_prop_access.Approved);
	                	}
						// US1240633 Add check for isFolioHostedByEBSCO and set Access Status if needed
						log.debug('checking isFolioHostedByEBSCO is:', custECInfo.isFolioHostedByEBSCO());
						if (custECInfo.isFolioHostedByEBSCO()){
							newRec.setValue('custentity_hosted_folio_access_status', LC2_prop_access.Approved);
						}
	                } 
	                //Handle when Case Mgt Access has been changed to 'Revoked'
	                else if(newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Revoked && oldContECInfo.EC_CaseMgtAS != LC2_access_lvl.Revoked) {
	    
	                	//If the Contact has FOLIO Access Status of Approved or Granted, then revoke that access too because a Contact
	                	//cannot have FOLIO EC Access unless he also has Case Mgt access
	                	if(newContECInfo.EC_FolioCustAS == LC2_prop_access.Approved || newContECInfo.EC_FolioCustAS == LC2_prop_access.Granted) {
	                		newRec.setValue('custentity_sf_folio_cust_access_status', LC2_prop_access.Revoked);
	                	}
	                	
	                	//If the Contact has Transition Access Status of Approved or Granted, then revoke that access too because a Contact
	                	//cannot have Transition EC Access unless he also has Case Mgt access
	                	if(newContECInfo.EC_TransCustAS == LC2_prop_access.Approved || newContECInfo.EC_TransCustAS == LC2_prop_access.Granted) {
	                		newRec.setValue('custentity_sf_transition_access_status', LC2_prop_access.Revoked);
	                	}
						// US1240633 If contact has isFolioHostedByEBSCO of Approved or Granted, then revoke Access Status if needed
						// NOTE that Disc Groups could still be Approved or Granted - only unset if it's Empty, Revoked or Removed
						if( (newContECInfo.EC_FoHostedByEbscoAS == LC2_prop_access.Approved || newContECInfo.EC_FoHostedByEbscoAS == LC2_prop_access.Granted) &&
							(utility.LU2_isEmpty(newContECInfo.EC_DiscGroupsAS) == true || newContECInfo.EC_DiscGroupsAS == LC2_access_lvl.Revoked || newContECInfo.EC_DiscGroupsAS == LC2_access_lvl.Removed) ){
							newRec.setValue('custentity_hosted_folio_access_status', LC2_prop_access.Revoked);
						}
						//**** SET CLINICAL DEC TO REVOKED SAFETY CATCH????
	                }
	            }
	 
	            /* *********************************************************
	             * GROUP DISCUSSION ACCESS STATUS CHANGE LOGIC
	             * *********************************************************/
	            //If Discussion Group Access has been changed to 'Approved'
	            if (newContECInfo.EC_DiscGroupsAS == LC2_access_lvl.Approved && oldContECInfo.EC_DiscGroupsAS != LC2_access_lvl.Approved) {

	               	//If Academy is not already Approved or Granted, then set it to Approved.  Academy access should always exist if Groups access exists. (US963983 and US966153)
	            	if(newContECInfo.EC_AcademyAS != LC2_prop_access.Approved && newContECInfo.EC_AcademyAS != LC2_prop_access.Granted){
	            		newRec.setValue('custentity_sf_academy_access_status', LC2_prop_access.Approved);    
	            	};
					// US1240633 Add check for isFolioHostedByEBSCO and set Access Status if needed
					log.debug('checking isFolioHostedByEBSCO is:', custECInfo.isFolioHostedByEBSCO());
					if (custECInfo.isFolioHostedByEBSCO()){
						newRec.setValue('custentity_hosted_folio_access_status', LC2_prop_access.Approved);
					}
	            }
				// US1240633 If Discussion Group Access has been changed to 'Revoked' (and Case Management empty, revoked or Removed)
				// Add check for isFolioHostedByEBSCO and set Access Status if needed
				else if(newContECInfo.EC_DiscGroupsAS == LC2_access_lvl.Revoked && oldContECInfo.EC_DiscGroupsAS != LC2_access_lvl.Revoked &&
					(utility.LU2_isEmpty(newContECInfo.EC_CaseMgtAS) == true || newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Revoked || newContECInfo.EC_CaseMgtAS == LC2_access_lvl.Removed)){
					if (custECInfo.isFolioHostedByEBSCO()){
						newRec.setValue('custentity_hosted_folio_access_status', LC2_prop_access.Revoked);
					}
				}



					/* *********************************************************
                     * CLINICAL DECISIONS ACCESS STATUS CHANGE LOGIC
                     * *********************************************************/
				//If Clinical Decisions Access has been changed to 'Approved'
				if (newContECInfo.EC_ClinicalDecAS == LC2_prop_access.Approved && oldContECInfo.EC_ClinicalDecAS != LC2_prop_access.Approved) {

					//If Academy is not already Approved or Granted, then set it to Approved.  Academy access should always exist if CD access exists. (TA818451)
					if(newContECInfo.EC_AcademyAS != LC2_prop_access.Approved && newContECInfo.EC_AcademyAS != LC2_prop_access.Granted){
						newRec.setValue('custentity_sf_academy_access_status', LC2_prop_access.Approved);
					};
					//If Case Management is not already Approved or Granted, then set it to Approved.  Case access should always exist if CD access exists. (TA818451)
					if(newContECInfo.EC_CaseMgtAS != LC2_access_lvl.Approved && newContECInfo.EC_CaseMgtAS != LC2_access_lvl.Granted){
						newRec.setValue('custentity_sf_case_mngmt_access_status', LC2_access_lvl.Approved);
					};
					//If Discussion Groups is not already Approved or Granted, then set it to Approved.  Discussion Groups access should always exist if CD access exists. (TA818451)
					if(newContECInfo.EC_DiscGroupsAS != LC2_access_lvl.Approved && newContECInfo.EC_DiscGroupsAS != LC2_access_lvl.Granted){
						newRec.setValue('custentity_sf_groups_access_status', LC2_access_lvl.Approved);
					};
					// EA: Adding check for three property based fields (I believe this code should already have been here) // US1240633
					log.debug('checking isFolioCustomer is:', custECInfo.isFolioCustomer());
					//TA714097 If customer is a FOLIO customer, then set FOLIO Access Status to Approved
					if(custECInfo.isFolioCustomer()) {
						newRec.setValue('custentity_sf_folio_cust_access_status', LC2_prop_access.Approved);
					}
					log.debug('checking isTransitionCustomer is:', custECInfo.isTransitionCustomer());
					//TA714491 If customer is a Transition customer, then set Transition Access Status to Approved
					if(custECInfo.isTransitionCustomer()) {
						newRec.setValue('custentity_sf_transition_access_status', LC2_prop_access.Approved);
					}
					// US1240633 Add check for isFolioHostedByEBSCO and set Access Status if needed
					log.debug('checking isFolioHostedByEBSCO is:', custECInfo.isFolioHostedByEBSCO());
					if (custECInfo.isFolioHostedByEBSCO()){
						newRec.setValue('custentity_hosted_folio_access_status', LC2_prop_access.Approved);
					}

				};

	            /* *********************************************************
	             * EBSCO NET APPROVER STATUS LOGIC
	             * *********************************************************/
	            
	            log.debug('newContECInfo.EBSCONetApproverStatus:', newContECInfo.EBSCONetApproverStatus);
	            log.debug('oldContECInfo.EBSCONetApproverStatus:', oldContECInfo.EBSCONetApproverStatus);
	            log.debug('LC2_ContactENOrdApprovSts.Approved:', LC2_ContactENOrdApprovSts.Approved);
	            
	            //If EBSCONet Order approval status has changed to 'Approved'  
	            //12-30-22 US1051405-TA783890: Fixed reference to the correct constant value for ENOrdApprovSts so EC ENet Status will be set properly
	            if (newContECInfo.EBSCONetApproverStatus == LC2_ContactENOrdApprovSts.Approved && 
	            	oldContECInfo.EBSCONetApproverStatus != LC2_ContactENOrdApprovSts.Approved) {                
		            	//	log.debug('checking hasActiveUserRec is:', newContECInfo.hasActiveUserRec());
							if (newContECInfo.EC_EnetOrderAS != LC2_prop_access.Approved && newContECInfo.EC_EnetOrderAS != LC2_prop_access.Granted) {
				           	//If not, assign the Contact EBSCO Connect ENetOrderAccessStatus   
				           		newRec.setValue('custentity_sf_enet_oa_access_status', LC2_prop_access.Approved); 
		            	 	}
	            }
	            //If EBSCONet Order approval status has changed to 'Revoked'
	            //12-30-22 US1051405-TA783890: Fixed reference to the correct constant value for ENOrdApprovSts so EC ENet Status will be set properly
	            else if (newContECInfo.EBSCONetApproverStatus == LC2_ContactENOrdApprovSts.Revoked && 
	            		 oldContECInfo.EBSCONetApproverStatus != LC2_ContactENOrdApprovSts.Revoked) {
		            		//Make sure he doesn't have EBSCO Connect EnetOrderAS access
		            	 	if (newContECInfo.EC_EnetOrderAS == LC2_prop_access.Approved || newContECInfo.EC_EnetOrderAS == LC2_prop_access.Granted) { 
				            	//If he does, revoke the Contact EBSCO Connect ENetOrderAccessStatus   
				            	newRec.setValue('custentity_sf_enet_oa_access_status', LC2_prop_access.Revoked); 
		            	 	}            	
	            	}
		            //If EBSCONet Order Approver field itself hasn't changed, but it already 'Approver'
		            //01-04-23 US1051405-TA783890: If this Contact is being invited to EBSCO Connect for the first time (i.e. Academy Access
	            	//is 'Approved') and it's also an EBSCONET Order Approver, it should also have ENET Order Approver Access status set to 'Approved'
				//	TA805716 - Adding in logic to handle converted SRPMs being granted ENET Order Approver AS = "Approved"
		            else if (newContECInfo.EBSCONetApproverStatus == LC2_ENOASts.Approved &&
						 (newContECInfo.EC_AcademyAS == LC2_prop_access.Approved || newContECInfo.EC_AcademyAS == LC2_prop_access.Granted)&&
						 (newContECInfo.EC_EnetOrderAS != LC2_prop_access.Approved && newContECInfo.EC_EnetOrderAS != LC2_prop_access.Granted) ) {
		            				newRec.setValue('custentity_sf_enet_oa_access_status', LC2_prop_access.Approved); 
		            	}
	                   
	            //Re-populate all the new EC Access related info from newRec, because logic above could have changed something
	            PopulateContactObj(newRec, newContECInfo);
	            	            
	            /* *********************************************************************************************************************
	             * Determine if Access_Update_Needs_Handling flag should be set so Boomi will pick up & notify Salesforce of the change
	             * *********************************************************************************************************************/  
	            log.debug('checking hasAnyECAccessChanged is:', newContECInfo.hasAnyECAccessChanged(oldContECInfo));
						//2023-04-04 US1091667-TA808650: Access-Update-Needs-Handling flag should NOT be set when a SRPM record is being matched. If not
						//being matched, then compare new access status values to the old access status values to determine if any have been changed.
						//2023-04-12 US1101144-TA810792:  Access-Update-Needs-Handling flag SHOULD be set in the situation that an
						//existing ENET Order approver is being matched to a self-registered SRPM user. So a better check before setting
						//Access-Update-Needs-Handling flag to true is if we've tagged an access as "Approved" or "Revoked" or "Denied".
					    //REMOVE THIS: if (newRec.getValue({fieldId: 'custentity_academy_user_match_requested'}) != true &&
	     				if ( newContECInfo.hasAnyECAccessChanged(oldContECInfo) &&
							(newContECInfo.hasECAccessApproveOrRevokeSet() == true ||
							 newContECInfo.hasECAccessDeniedSet() == true) ) {
	            				newRec.setValue('custentity_sf_access_update_handling', true);
								log.debug('SETTING ACCESS-UPDATE-NEEDS-HANDLING TO true');
	            		}
				//	}  //End hasActiveUserRec
            }  //End isPortalMember
        }	// End ScriptContext Type is Edit
        
        
        // TA754968 - Adding in logic from SS1 to capture Contact Last Modified Data
        var currentUser = runtime.getCurrentUser();
        if (runtime.executionContext != runtime.ContextType.REST_WEBSERVICE){
        	if (scriptContext.type != 'delete'){
        		var newRec = scriptContext.newRecord;
                var oldRec = scriptContext.oldRecord;
                log.debug({
                	title: 'oldRec',
                	details: JSON.stringify(oldRec)
                })
                log.debug({
            	title: 'newRec',
            	details: JSON.stringify(newRec)
            })
        		if ((currentUser.id != '' && currentUser.id != null) && currentUser.id != LC2Constant.LC2_UnknownUser){
        			newRec.setValue({
        				fieldId: 'custentity_contact_last_modified_by',
        				value: currentUser.id,
        				ignoreFieldChange: true
        			});
        		}
        		else{	// Unknown User
        			newRec.setValue({
        				fieldId: 'custentity_contact_last_modified_by',
        				value: LC2Constant.LC2_Employee.SystemUser,
        				ignoreFieldChange: true 
        			});
        		}
        	}
        }

     // Function: Populate Contact Object Fields from Contact Record
     // Input: ContactRec - Contact Record (source) , ContactObj - Contact Object (target)
     function PopulateContactObj(ContactRec, ContactObj){        	
	   	  ContactObj.EC_CaseMgtAS 			= ContactRec.getValue('custentity_sf_case_mngmt_access_status');
	   	  ContactObj.EC_DiscGroupsAS 		= ContactRec.getValue('custentity_sf_groups_access_status');
	  	  ContactObj.EC_AcademyAS 			= ContactRec.getValue('custentity_sf_academy_access_status');
		  ContactObj.EC_ClinicalDecAS 		= ContactRec.getValue('custentity_sf_clinical_dec_access_status');
	  	  ContactObj.EC_EnetOrderAS 		= ContactRec.getValue('custentity_sf_enet_oa_access_status');
	  	  ContactObj.EC_FolioCustAS 		= ContactRec.getValue('custentity_sf_folio_cust_access_status');
	  	  ContactObj.EC_TransCustAS 		= ContactRec.getValue('custentity_sf_transition_access_status');
	  	  ContactObj.EC_PUS 				= ContactRec.getValue('custentity_portal_user_status');
	  	  ContactObj.EBSCONetApproverStatus = ContactRec.getValue('custentity_enet_ordapprove_status');
	  	  ContactObj.SFContactID			= ContactRec.getValue('custentity_sf_contact_id');
  	   };


	// --------------------------------------------------------------------------------------------------------
	//  Function Name: populateCustomerObj
	//  Purpose:    This function is used to determine whether the contact's parent company is an existing transition
	//              customer or not.
	//  Input Parameters:
	//      parentCompany - Contact's Parent Company Internal ID
	//  Returns:    True/False
	// ---------------------------------------------------------------------------------------------------------
	function PopulateCustomerObj(customerId, CustomerObj){
		log.debug('>>> Entering:', 'PopulateCustomerObj');
    	log.debug('customerId is: ', customerId);
        	
	    var custLookup = search.lookupFields({
	        type: search.Type.CUSTOMER,
	        id: customerId,
	        columns: ['custentity_sf_account_id',
				'custentity_folio_cust',
				'custentity_refctr_transition_status',
				'custentity_explora_transition_status',
				'custentity_ehost_transition_status',
				'custentity_eds_transition_status',
				'custentity_folio_partner', // US1138811
				'custentity_folio_hosted_by_ebsco'] // US1240633
	    });
	    
	    
	    log.debug('custLookup contains:', JSON.stringify(custLookup));
	   
	    //12-28-22 US1051405-TA783686:	Javascript error thrown below when trying to assign transition center values from fields that don't exist on
	    //the Customer (i.e. certain transitions never initialized or set on the Customer in SB3 & Prod).  So need to check for presence of a value
	    //first, indicated by a length > 0, before trying to assign.
	
	    for (var key in custLookup){
	        if (custLookup.hasOwnProperty(key)){
	        	switch(key) {
	        	case 'custentity_folio_cust':
	        		CustomerObj.FolioFlag = custLookup.custentity_folio_cust;	
	        		break;        	
	        	case 'custentity_refctr_transition_status':
	        		//12-28-22 US1051405-TA783686
	        		if(custLookup.custentity_refctr_transition_status.length > 0)
	        			CustomerObj.RefCtrTrans = custLookup.custentity_refctr_transition_status[0].value;	        		
	        		break;        	
	        	case 'custentity_explora_transition_status':
	        		//12-28-22 US1051405-TA783686
	        		if(custLookup.custentity_explora_transition_status.length > 0)
	        			CustomerObj.ExploraTrans = custLookup.custentity_explora_transition_status[0].value;
	        		break;        	
	        	case 'custentity_ehost_transition_status':
	        		//12-28-22 US1051405-TA783686
	        		if(custLookup.custentity_ehost_transition_status.length > 0)
	        			CustomerObj.EhostTrans = custLookup.custentity_ehost_transition_status[0].value;
	        		break;        	
	        	case 'custentity_eds_transition_status':
	        		//12-28-22 US1051405-TA783686
	        		if(custLookup.custentity_eds_transition_status.length > 0)
	        			CustomerObj.EDSTrans = custLookup.custentity_eds_transition_status[0].value;
	        		break;
				case 'custentity_folio_partner':
					// US1138811
					CustomerObj.FolioPartner = custLookup.custentity_folio_partner;
					break;
				case 'custentity_folio_hosted_by_ebsco':
					// US1240633
					CustomerObj.FoHostedByEBSCO = custLookup.custentity_folio_hosted_by_ebsco;
					break;
	            }
	        }
	    } 
	    CustomerObj.SFAcctID = custLookup.custentity_sf_account_id;
	}

	/**
	 * @param srpmId {string} - SRPM Internal ID
	 * @returns SRPMObject {object}
	 * */
	function PopulateSRPMObject(srpmId){
		var srpmInfo = search.lookupFields({
			type: 'CUSTOMRECORD_SR_PORTAL_MEMBER',
			id: srpmId,
			columns: ['custrecord_sf_contact_id', 'custrecord_academy_access_status', 'custrecord_case_mgmt_access_status', 'custrecord_groups_access_status', 'internalid', 'custrecord_srpm_portal_user_status', 'custrecord_srpm_conversion_status']
		});

		var srpmObject = {
			SFContactId: '',
			AcademyAccessStatus: '',
			CaseManagementAccessStatus: '',
			DiscussionGroupsAccessStatus: '',
			InternalId: '',
			PortalUserStatus: '',
			ConversionStatus: ''
		}

		log.debug({
			title: 'srpmInfo',
			details: JSON.stringify(srpmInfo)
		});

		for (var key in srpmInfo){
			if (srpmInfo.hasOwnProperty(key)){
				//	Filter out SF Contact ID as it's not returned as an array
				if (key == 'custrecord_sf_contact_id'){
					srpmObject.SFContactId = srpmInfo[key];
				}
				//	Handle all array-returned fields w/ switch logic
				else{
					if(srpmInfo[key].length > 0){
						switch (key){
							case 'custrecord_academy_access_status':
								srpmObject.AcademyAccessStatus = srpmInfo[key][0].value;
								break;
							case 'custrecord_case_mgmt_access_status':
								srpmObject.CaseManagementAccessStatus = srpmInfo[key][0].value;
								break;
							case 'custrecord_groups_access_status':
								srpmObject.DiscussionGroupsAccessStatus = srpmInfo[key][0].value;
								break;
							case 'internalid':
								srpmObject.InternalId = srpmInfo[key][0].value;
								break;
							case 'custrecord_srpm_portal_user_status':
								srpmObject.PortalUserStatus = srpmInfo[key][0].value;
								break;
							case 'custrecord_srpm_conversion_status':
								srpmObject.ConversionStatus = srpmInfo[key][0].value;
								break;
						}
					}
				}
			}
		}
		return srpmObject
	}

	function ProcessEBSCONetApproverAction() {
			log.debug('++++ Entering ProcessEBSCONetApproverAction');
            // If "Set EBSCONET Order Approver" button clicked then call to API
            if(enoaSts == LC2_ENOASts.Requested){
              //  Call to API here
            		log.debug('Set API Call starts here');
            		// Set the data for the call in a(dd) mode
            		  SAOCallParam('a');
            			
            		//Next, call library script to handle call which will handle call to external API
                	var SAOCallResult = L2SAO.handleSAOaction();
                	log.debug('SAOAPICall Add ', SAOCallResult);
                	
                  	// For DEMO Only -- FOR TESTING Setting to 'Approved' WHEN NO ACTUAL RESPONSE IS RETURNED
                	if (SAOCallResult == LC2_ENOASts.InProgress){SAOCallResult = LC2_ENOASts.Approved }
                	// log.debug('Demo Reset ', SAOCallResult);
                	// End of FOR DEMO Only
                
                	log.debug('** After DEMO Check, SAOCallResult is:', SAOCallResult);
                	
            		//Handle response from the library script call
                	// This will return either "Approved", "In Progress" or "Call Failure" and can be directly updated 
                	newRec.setValue('custentity_enet_ordapprove_status', SAOCallResult);
                	
                 	if(SAOCallResult == LC2_ENOASts.Approved){    
	                	
	                	// Update the Operational Category 
	                    var op_category = newRec.getValue('custentity_contact_category');
	                    log.debug('Op_category', op_category);
 	            		var enetoa_in_opCat = false;
	            		var category_count = op_category.length;
	            		for ( var c=0; category_count != null && c < category_count; c++ )
	            		{
	            	 		if (op_category[c] == LC2_OpCat.EnetApprover)
	            			{	// Is set to EBSCONET Order Approver
	            				enetoa_in_opCat = true;
	            			} 
	            		}
	             		if (enetoa_in_opCat == false)
	             		{
	                    	op_category.push(LC2_OpCat.EnetApprover);
	            			newRec.setValue('custentity_contact_category', op_category);
	            			log.debug('Op Cat updated to ', op_category);
	            		}
	            		
	                	// Check whether the Customer flag is set and if not set it
	                	var cust = newRec.getValue('company');
	                	var custLookup = search.lookupFields({
	                        type: search.Type.CUSTOMER,
	                        id: cust,
	                        columns: ['custentity_enet_order_eligible']
	                    });
	                    if(custLookup.custentity_enet_order_eligible == false){
	                    	try {
		                    	record.submitFields({
		                    	    type: record.Type.CUSTOMER,
		                    	    id: cust,
		                    	    values: {
		                    	    	'custentity_enet_order_eligible': true,
		                    	        'custentity_isupdated': true}
		                     	});
		                    	log.debug('Customer Updated');	
	                    	}
	                    	catch(e){
	             				log.error(e.name);
	                    		log.error('Customer Not Updated - Error', cust);
	                    		email.send({
	                                author: LC2_emp.MercuryAlerts,
	                                recipients: LC2_email.CRMEscalation,
	                                subject: 'EBSCONET Order Approver UI Update - Customer ' +cust+ ' not updated',
	                                body: 'Contact ' +newRec.id+ ' was being updated to EBSCONET Order Approver by UserEvent2_contact_beforeSubmit.js <BR><BR> The Customer "Active EBSCONET Order Approvers" flag did not update for Customer ' +cust+ '<BR>Please investigate & correct Customer flag if required.'
	                            });
	                    	}
	                    }
                 	}      
             }
            
            // If "Revoke EBSCONET Order Approver" button clicked then call to API

            if (enoaSts == LC2_ENOASts.RevokeReq){
             	// Call to API here
             		log.debug('Revoke API Call starts here');
               		// Set the data for the call in r(emove) mode
            		SAOCallParam('r');
            		//Next, call library script to handle call which will handle call to external API
                	var SAOCallResult = L2SAO.handleSAOaction();
                	log.debug('SAOAPICall Revoke ', SAOCallResult);
                	
            		//Finally, handle response from the library script call
                	// This will pass back either "Revoked" or "Call Failure" (we are not supporting "Revoke In Progress")  
                 	if (SAOCallResult == LC2_ENOASts.Revoked){
                 		
                		newRec.setValue('custentity_enet_ordapprove_status', SAOCallResult);
                 		
                		// Update the Operational Category 
	                    var op_category = newRec.getValue('custentity_contact_category');
	                    log.debug('Op_category', op_category);
	                    var enet_op_category_removed = new Array();	
 	            		var enetoa_in_opCat = false;
	            		var category_count = op_category.length;
	            		for ( var c=0; category_count != null && c < category_count; c++ )
	            		{
	            	 		if (op_category[c] == LC2_OpCat.EnetApprover)
	            			{	// Is set to EBSCONET Order Approver
	            				enetoa_in_opCat = true;
	            			}
	            	 		else // Is NOT set to EBSCONET Order Approver 
	            			{	
	            				//populate new array with EBSCONET Order Approver removed from it
	            				enet_op_category_removed.push(op_category[c]);
	            			}
	            		}
	             		if (enetoa_in_opCat == true)
	             		{  // Remove the Operational Category
	            			newRec.setValue('custentity_contact_category', enet_op_category_removed);
	            			log.debug('Op Cat updated to ', enet_op_category_removed);
	            		}
	            		
	                	// Check the Customer flag & if appropriate unset it
	                	var cust = newRec.getValue('company');
	                	var custLookup = search.lookupFields({
	                        type: search.Type.CUSTOMER,
	                        id: cust,
	                        columns: ['custentity_enet_order_eligible']
	                    });
	                	var custReq = L2SAO.L2_checkSAOCustFlag(cust, newRec.id);
	                	log.debug('custReq ', custReq);
	                    if(custReq == false && custLookup.custentity_enet_order_eligible == true){
	                    	try{
	                    		record.submitFields({
	                    			type: record.Type.CUSTOMER,
	                    			id: cust,
	                    			values: {
	                    				'custentity_enet_order_eligible': false,
	                    				'custentity_isupdated': true}
	                    		});
	                    		log.debug('Customer Updated');	
	                    	}
	                    	catch(e){
	                    		log.debug('here');
	                    		log.error('Customer Not Updated - Error', cust);
	             				log.error(e.name);
	                    		email.send({
	                                author: LC2_emp.MercuryAlerts,
	                                recipients: LC2_email.CRMEscalation,
	                                subject: 'EBSCONET Order Approver UI Revoke - Customer ' +cust+ ' not updated',
	                                body: 'Contact ' +newRec.id+ ' was being updated to revoke EBSCONET Order Approver by UserEvent2_contact_beforeSubmit.js <BR><BR> The Customer "Active EBSCONET Order Approvers" flag did not update for Customer ' +cust+ '<BR>Please investigate & correct Customer flag if required.'
	                            });
	                    		log.debug('after email send');
	                    	}
	                    }	
                	}
                	else{
                		// Set back to Approved so Revoke can be requested again 
                		newRec.setValue('custentity_enet_ordapprove_status', LC2_ENOASts.Approved);	
                 	}
            }
            log.debug('---- Leaving ProcessEBSCONetApproverAction: newRec EO is ', newRec.getValue('custentity_enet_ordapprove_status'));
		}

        // Function: SAOCallParam
        // Sets parameters to pass to API Call RESTlet
        // Input: Action Rquired (a = add, r = remove, v = validate)
        // 		as of Dec. 2020 this function only uses 'add' and 'remove' (never 'validate')
        function SAOCallParam(actReq){
        	log.debug('Entering SAOCallParam with action = ' + actReq);
       		var custText = newRec.getText({
    		    fieldId: 'company'
    		});
    		var n = custText.indexOf(" ");
    		var custId = custText.substring(0, n);
    		
    		// BEGIN US728084 Add NetCRM Site Name and Main Address to SSD request 
    		//		Note: do this of 'add' and 'remove' only - do not for 'validate'
        	var cust = newRec.getValue('company');
        	log.debug('cust = ' + cust);
        	// Note that 'defaultaddress' cannot be fetched using a lookup API.  Need to Load then entire Customer object to get the value
        	var custRecord = record.load({
        			type: record.Type.CUSTOMER, 
        			id: cust,
        			isDynamic: false,
        		});
        	var custSiteName = custRecord.getValue('companyname')
        	// log.debug('custSiteName = ' + custSiteName);
        	var custAddress = custRecord.getValue('defaultaddress')
        	// log.debug('custAddress = ' + custAddress);	   	
    		// END US728084 Add NetCRM Site Name and Main Address to SSD request  
    		
    		L2_SAO_Obj.custID			= custId;
    		L2_SAO_Obj.sitename			= custSiteName;		// US728084
    		L2_SAO_Obj.address			= custAddress;		// US728084
    		L2_SAO_Obj.contactID 		= newRec.id;
    		L2_SAO_Obj.contactName	= newRec.getValue('firstname') + ' ' + newRec.getValue('lastname');
    		L2_SAO_Obj.contactEmail	= newRec.getValue('email');	
    		var userObj = runtime.getCurrentUser();
     		L2_SAO_Obj.requesterName 	= userObj.name;
    		L2_SAO_Obj.requesterEmail	= userObj.email;
    		
    		switch (actReq) {
    		   case 'a': 
    			   L2_SAO_Obj.actionRequested = 'add';
    			   L2_SAO_Obj.custActReq = 'add';
    			break;
    							
    		   case 'r': 
    			   L2_SAO_Obj.actionRequested = 'remove';
    			   L2_SAO_Obj.custActReq = 'validate';
    			break;
    							
    		   default: 
    			   L2_SAO_Obj.actionRequested = 'validate';
    		   	   L2_SAO_Obj.custActReq = 'validate';	
    			break;
    		}
    		
    		log.debug('Leaving SAOCallParam with L2_SAO_Obj = ', JSON.stringify(L2_SAO_Obj));    		
        }
    	log.debug('Leaving >>>:', 'Contact beforeSubmit logic');
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});