/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//
// Script:     client2_contact.js
//		This Client script covers the main EP Contact form - for all NetSuite users except PubSat role...
//				There is only one other Contact form called PubSat Contact form which has a separate client Script - and used for the PubSat role
//				PubSat contacts are Publisher Contacts not Customer contacts and this warranted a separate form/script
//
//
// Revisions:
//		CNeale	3-Jan-2013	Allow SSE Contact to be flagged as inactive if SSE of Pub Serv. role.
//		Eabramo 2015-09-15	Remove code preventing inactivation of Contact if flagged as EIS Contact (if not specific role)
//		eabramo	2016-09-22	Rename of file from contactForm3.js to client_contact.js
//		eabramo	2016-09-22	Also adding Marketo Sync Flag Code code
//		eabramo 2017-03-07	Disable the Sync To Marketo field
//		eabramo 2017-05-12	validate sync to Marketo Contacts don't have dupe emails
//		eabramo 2017-09-08	US249878 - Don't allow Flipster Renewal Contacts to be inactivated
//		eabramo	2018-04-17	US364329 - GDPR.  If creating new Contact, require Contact Origin and Legitimate Business Value Type
//		CNeale	2018-11-08	US423864 Add validation to ensure "Last Name" is populated
//		eabramo 2018-12-03	US402266 - TA277786  Update SalesForceID to 'createNew' under certain conditions
//		CNeale	2018-12-03	US423864 - Refactor SalesForceID to 'createNew' to use Library scripts & add new "active" criteria
// 		eAbramo 2018-12-17	US458777 - Refactor - Do NOT Migrate/Sync to SF if the 'Email is Duplicate' flag is checked
//		eAbramo	2018-12-28	US458450 Modify CXP Contact code - add Global Subscription Status as criterion for createNew
//		CNeale	2019-02-05	US471520/1 Add in duplicate email checks for EBSCO Connect also refine last name validation
//		eAbramo 2019-02-06	US473423 Contact Origin - Add EBSCO Connect
// 		eAbramo	2019-02-19	US474842 NetCRM user changes Email on Contact with Portal Access - warning to user
//		eAbramo	2019-03-20	US453617 Customer Portal breaks if NetCRM User updates Contact's Customer//
//		eAbramo	2019-07-22	US512945 New Fields from Marketo to NetSuite
//		CNeale	2019-08-27	US530556 No longer auto-set "createNew" for SF Id for qualifying contacts only allow via
//                                   button push.
//		PKelleher 2019-11-06 US525878 Update dupe email EBSCO Connect alert to remove CRM Escalation and add SMT@ebsco.com and cwhitehead@ebsco.com
//		CNeale	2020-01-23	US589464 EBSCO domain email to SF for certain customers change to validation
//									 Plus additional check for EC invite send
//									 Plus don't let a Contact in SF have email changed to an EBSCO domain
//		eAbramo	2020-04-23	US630957	Semi-Automated Orders for EBSCONET - Adding Operational Category of "EBSCONET Order Approver" and adding
//										new field EBSCONET Order Approval Status
//		CNeale	2020-04-28	US631219 SAO for EBSCONET - validation after set button press, warning on inactivation, change of email or Customer if
//									 EBSCONET Order Approver (or In Progress).
//		JOliver	2021-02-03	US738156 Add validation: when 'Other' selected require Job Title
//		eAbramo 2021-02-08	US760823 Modifications to the Re-Attach Contact Scheduled Script
//		eAbramo 2021-02-15	US753802 and US758140 Modify behavior when user changes email address on SAO Approved contact
//		JOliver	2021-03-24	TA573658 comment out 'New Customers must have a Contact record' alert as it is no longer needed
//		JOliver	2021-10-19	US860140 remove Opt-in requirement from Push to SF button
//		ZScann  2021-12-29	US884105	Clear out Marketo, EBSCONet Order Approver, EBSCO Connect fields when "Save As" is used to create new contact.
//		eAbramo	2022-05-26	US963983 and US966153 EC ReArch Contact Record Related Validation & Scripting
//		eAbramo	2022-07-29	US972416 EC ReArch27: NetCRM Contact Changes for Phased Approach
//		eAbramo	2022-08-15	US999227 EC ReArch27: Ability to Resend an EBSCO Connect Invitation from within NetCRM
// 		eAbramo	2022-08-16	US999470 EC ReArch27: Implement logic to handle inactivation/reactivation of Contact in NetSuite
//		ZScanne 2022-11-14	US1034021 ECP2B3 NS Resend Invitation Indicator should retain value
//      ZScanne 2022-11-28  US1040056   Refactored into SS2
//			KM	2022-12-13	 - cont -	References to renamed library function updated from 'hasECAccessUpdateForSF' to 'hasECAccessApproveOrRevokeSet'
//  			2022-12-22	 - cont - 	final changes before SB3 deploy
//			KM	2023-01-04  US1051405  Regression testing fixes:
//							TA783609	Reactivated, re-approved Contact should NOT have SF Contact ID set to createNew
//							TA783658	Reactivating of an inactive Contact should NOT be allowed when any status is 'Approved' or 'Revoked'
//							TA783886	Contact with ebsco email should NOT be allowed in EBSCO Connect except under EBSCO Customer
//							TA783941	EC Access fields should NOT be editable if Customer is not already in SF
//							TA784078	Contact inactivation should not be allowed when portal user status is "Send Invitation"
//							TA784761	EC Academy Access erroneously being set from 'Granted' to 'Approved' when Discussion Groups is 'Approved'
//		eAbramo	2023-01-05	TA784531 - Require Contact Origin and Legitimate Business Interest & TA784532 Clear Job Role of 'Needs Assignment'
//      ZScanne 2023-01-30  US943090    Added function to handle the "Match with Displayed Academy Only User" button
//                          US1057768   Open up Resend Invitation functionality to EP Support Person I
//                          US1017301   Further logic added to handle the "Match with Displayed Academy Only User" button
//          KM  2023-02-22  US1073168   Revise client code as needed to prevent "Required" access selection and to include SRPM in dupe email check
//							TA797213	Verify validation exists to prevent "Required" being selected in UI for Case or Group access status
//                          TA792714    Include SRPM records when checking for dupe emails
//          KM  2023-03-15  US1058236   Batch4 Regression testing fixes:
//                          TA803231    Approving Case Mgt Access should only trigger approval of Groups Access if Groups is blank or 'Needs Review'
//                          TA803233    If both Case Mgt and Groups Access are 'Needs Review', they can only be acted on together for 'Save' to be allowed.
//                          TA804430    Prevent use of 'Save As' if it causes the current record to be overwritten
//          KM  2023-04-05  US1091667   EBSCO Connect Defect:
//                          TA808652    No access status changes, including property-based ones, should be allowed via the NS UI
//                                      when PUS is 'Invitation Expired'. This is because when a Contact's PUS is 'Invitation Expired'
//                                      the associated SF User record is inactive and cannot have its permissions adjusted.
//          EA  2023-05-05  TA817106    Add new Inactivation checkbox on contact record
//      JO + ZS 2023-05-09  TA816832    Clinical Decisions Access Status (setting it to Approve)
//      JO + ZS 2023-05-11  TA816830    Allow Clinical Decisions Support to give CD Portal Access (unlock CD Access field)
//      JO      2023-05-22  TA816835    Allow Re-Send Invitation for Clinical Decisions Support when CD Access Status is Granted
//          KM  2023-06-02  US1113403   Clinical Decision scripting and further refactoring of code for clarity:
//                          TA816830    Allow Clinical Decisions Support to give CD Portal access
//	        KM	2023-06-15	US1099670   CDP - REL-04 Regression Tix Ticket
//							TA826284    Administrator does not have edit access to the Clinical Decision EC Access field on the
//										the Contact.  The "CheckDynamicECAccessConditions" function was updated so that the
//			    						"Administrator" role would have edit capability on the Clinical Decisions Access field
//							TA827239    Administrator should NOT be given edit access to the Clinical Decision EC Access field
//		        					    when the Customer is NOT a Clinical Decisions customer.
//          KM 2023-06-22               Production deployment fix:  Only populate customer info on pageinit IF we have a customer
//          EA  2023-08-14  US1138811   FOLIO: When a user gives EBSCO Connect case management access to a Contact belonging to a FOLIO Partner parent institution
//                                      then I should see an alert reminding me that I need to associate that Contact record with all the FOLIO Partner child Institutions.
//          EA  2023-11-20  TA870379    Add EP Support Admin role - as role who can inactivate/activate a Contact
//          EA  2024-04-24  US1259509   Scripting to apply EBSCO Hosted FOLIO Access Status Part 1

define([
    'N/search',
    'N/runtime',
    'N/currentRecord',
    '/SuiteScripts/EIS Custom Scripts2/Library2/library2_ECAccess',
    '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants',
    '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', 
    'N/format'],
    function(search, runtime, currentRec, L2ECAccess, L2Constants, L2Utility, format) {

        // Declaration of Global Variables 
        var contactOriginOnLoad = null;                 //  US473423 Contact Origin - Add EBSCO Connect
        var operationalCategoryOnLoad = null;           //  US630957 - don't allow users to Set/Unset Operational Category of EBSCONET Order Approver
        var enetOrderApproverInOpCatOnLoad = false;      //  US630957 - variable indicating that Operational Category on load Contains EBSCONET Order Approval
        var userRole = runtime.getCurrentUser().role;
        var customerOnLoad = null;                      //  US453617 Customer Portal breaks if NetCRM User updates Contact's Customer      
        var emailOnLoad = null;                         //  US471520 Add in duplicate email checks for EBSCO Connect also refine last name validation
        var resendInvitationOnLoad = null;              //  US1034021 ECP2B3 NS Resend Invitation Indicator should retain value
        var moveToMarketoOnLoad = null;
        var contactECInfoOnLoad = new L2ECAccess.L2_ContactECObj();     //  aka, Old record values: US1035778 Needed for Initial value comparison
        var contactECInfo= new L2ECAccess.L2_ContactECObj(); 			// aka, New record values
        var customerECInfo = L2ECAccess.L2_CustomerECObj;               // container to hold Customer info pertinent to EC
        var globalSubscriptionStatusOnLoad = null;      //  US512945
        var enetOrderApproverStatusOnLoad = null;       //  US631219
        var emailCheckPerformed = false;                //  US1040056 - Allows us to skip the Email change if needed when changing EBSCO Connect Access Statuses
        var contactInactiveStatusOnLoad = false;        //  Marketo Project
        var modeOnLoad = null;							//  Used to hold current script mode
        var sfContactIdOnLoad = null;					//  Contacts SF ID when record is loaded
        var sfCustomerIdOnLoad = null;					//  Customer SF ID (sourced) when record is loaded
        var srpmIdOnLoad = null;				    	//  Matching unconverted SRPM record ID (if one exists) when record is loaded
        var disableGrantCore = true;
        var disableRevokeAll = true;
        var disableIndAction = true;
        var disableResend = true;
        var onLoadECAccessEditsPossible = false;        // Initialize high level edits possible to false.  It needs to pass criteria in pageInit to become true
        var currentRecord = null;       
        var contactIdOnLoad = null;   
        var firstNameOnLoad = null;
        var middleNameOnLoad = null;
        var lastNameOnLoad = null;
        var portalUserStatusOnLoad = null;              // US1091667-TA808652 Need to check PUS before allowing access status changes
        var clinicalDecCust = false;                    //TA816830 Allow Clinical Decisions Support to give CD Portal Access

        //  Global Variable holding onLoad (initial) EC Status Action field States
        var initStatusActionStates = {
            GrantCoreDisabled:  true,   //Grant Core Access Checkbox
            RevokeAllDisabled:  true,	//Revoke All Checkbox
            IndividualDisabled: true,	//Individual Setting Allowed
            ResendInvDisabled:  true  	//Resend Invitation Checkbox
            };

        /*Trace*/ var debugLvl = (runtime.getCurrentUser().id == '1469959') ? 1 : 0;
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        function pageInit(scriptContext) {                          	
            /*Trace*/ debugLvl>5 && alert('***** pageInit *****');
        	        	
            currentRecord = scriptContext.currentRecord;           
            contactIdOnLoad = currentRecord.id;
            modeOnLoad = scriptContext.mode;
                     
            //Store pertinent EC related info from the record into the ECContactObject onLoad variable so we have it for future reference
            PopulateContactObj(contactECInfoOnLoad);
            
            //Store other data values onLoad for future reference
            sfCustomerIdOnLoad = currentRecord.getValue({fieldId: 'custentity_sf_sourced_account_id'});      
            sfContactIdOnLoad = currentRecord.getValue({fieldId: 'custentity_sf_contact_id'});
            contactOriginOnLoad = currentRecord.getValue({fieldId: 'custentity_contact_origin'});           // US473423
            operationalCategoryOnLoad = currentRecord.getValue({fieldId: 'custentity_contact_category'});   // US630957
            customerOnLoad = currentRecord.getValue({fieldId: 'company'});                                  // US453617           
            emailOnLoad = currentRecord.getValue({fieldId: 'email'});
            resendInvitationOnLoad = currentRecord.getValue({fieldId: 'custentity_resend_ec_invitation'});  // US1034021
            moveToMarketoOnLoad = currentRecord.getValue({fieldId: 'custentity_move_to_marketo'});
            globalSubscriptionStatusOnLoad = currentRecord.getValue({fieldId: 'globalsubscriptionstatus'});           
            enetOrderApproverStatusOnLoad = currentRecord.getValue({fieldId: 'custentity_enet_ordapprove_status'}); //  US631219
            contactInactiveStatusOnLoad = currentRecord.getValue({fieldId: 'isinactive'});
            portalUserStatusOnLoad = currentRecord.getValue({fieldId: 'custentity_portal_user_status'});  // US1091667-TA808652

            firstNameOnLoad = currentRecord.getValue({fieldId: 'firstname'});
            middleNameOnLoad = currentRecord.getValue({fieldId: 'middlename'});
            lastNameOnLoad = currentRecord.getValue({fieldId: 'lastname'});

            // 05-24-23:  US1113403 - Retrieve Customer info relevant to EBSCO Connect access setting
            if (customerOnLoad) {
            PopulateCustomerObj(customerOnLoad, customerECInfo);
            }
            /*Trace*/ debugLvl>99 && alert('customerECInfo object: ' + JSON.stringify(customerECInfo));

            // 02-21-23:  US1073168 - If a possible matching, unconverted SRPM is being shown with the Contact in the UI, grab the SRPM ID value
            if (currentRecord.getField({fieldId: 'custpage_sr_id'})) {
                srpmIdOnLoad = currentRecord.getValue({fieldId: 'custpage_sr_id'});
            }

            // Set the Contact Origin and Legitimate Interest Type fields to display as Mandatory (even though they're not truly Mandatory)
            currentRecord.getField({fieldId: 'custentity_contact_origin'}).isMandatory = true;
            currentRecord.getField({fieldId: 'custentity_legit_business_interest_type'}).isMandatory = true;

            // 2011-04-07 Set or Unset the Primary Contact field
            // Read contact Role. Note that 'custentity_isprimary' is read by OPS dataLoader - move to OPS
            if (currentRecord.getValue({fieldId: 'contactrole'}) == '-10'){
                currentRecord.setValue({
                    fieldId: 'custentity_isprimary',
                    value: true
                });
            }
            else {
                currentRecord.setValue({
                    fieldId: 'custentity_isprimary',
                    value: false
                });
            }
            //  US473423 - If Contact Origin is 'EBSCO Connect' disable the Contact Origin field so it cannot be changed
            if (contactOriginOnLoad == L2Constants.LC2_ContactOrigin.EBSCOConnect){
                currentRecord.getField({fieldId: 'custentity_contact_origin'}).isDisabled = true;
            }

            currentRecord.getField({fieldId: 'custentity_sync_to_marketo'}).isDisabled = true;
            
            // US630957 -- Need to determine if the Operational Category has 'EBSCONET Order Approver' selected
            if (operationalCategoryOnLoad != '' && operationalCategoryOnLoad != null){
                enetOrderApproverInOpCatOnLoad = operationalCategoryOnLoad.includes(L2Constants.LC2_ContactOpCat.EnetApprover);
            }
            
            // TA784532 Fix - clear out Job Area if it's 'Needs Assignment'
            var contactJobRole = currentRecord.getValue({fieldId: 'custentity_jobarea'});
            if (contactJobRole == L2Constants.LC2_JobRole.NeedsAssign){
                currentRecord.setValue({
                    fieldId: 'custentity_jobarea',
                    value: ''
                });
            }
            
            // TA817106 Add new Inactivation checkbox on contact record
            // TA870379 Add EP Support Admin role - as role who can inactivate/activate a Contact
            if(userRole == L2Constants.LC2_Role.Administrator || userRole == L2Constants.LC2_Role.EPSalesAdmin || userRole == L2Constants.LC2_Role.EPSupAdmin){
                currentRecord.getField({fieldId: 'isinactive'}).isDisabled = false;
            }

            //Check to see if certain conditions are met onLoad that make it eligible to have EBSCO Connect edits enabled on the page.
            //If any of these conditions are not met, keep onLoadECAccessEditsPossible as false and EBSCO Connect tab fields disabled.
            /* *************************************************************************************************************************************
             * NOTE: EBSCO Connect Access related fields are disabled by default, so we need first check basic requirements that may allow editing:
             * 		- this is 'edit' mode AND
             * 		- Contact ID is not empty AND
             * 		- Contact has a Customer AND
             *      - SF Customer ID is NOT empty AND NOT 'createNew' AND
             * 		- Contact is NOT inactive AND
             * 		- Contact is NOT in the process of being resent an EC invitation AND
             *      - Contact is NOT in the process of having access approved or revoked AND
             *      - Contact is NOT a possible match to an existing, unconverted SRPM record AND
             * 		- SF Contact ID present (this is an EC Contact) AND (the role is allowed to manage it OR the role is allowed to resend an EC invitation)  OR
             * 		- SF Contact ID empty (this is not yet an EC Contact) AND the email is NOT an EBSCO domain email and the role is allowed to push 
             * 		  the Contact to SF ('createNew') OR
             * 		- SF Contact ID empty (this is not yet an EC Contact) AND the email iS an EBSCO domain email and the role is allowed to push OR
             * 		- TA816830 SF Contact ID present (this is an EC Contact) AND the role is CD Support AND Customer is CD Customer  OR
             * 		- TA816830 SF Contact ID empty (this is not yet an EC Contact) AND the email is NOT an EBSCO domain email and the role is CD Support AND Customer is CD Customer OR
             * 		- TA816830 SF Contact ID empty (this is not yet an EC Contact) AND the email iS an EBSCO domain email AND this is one of the EBSCO Customers that we allow to be in EC
             *        AND the role is CD Support AND Customer is CD Customer
             * 
             * ************************************************************************************************************************************* */
            //12-29-22:  US1051405 TA783941 - EC Access fields should NOT be editable if Customer is not already in SF, so added sfCustomerIdOnLoad check
            //US1057768 Added isRoleResendInvitationECContact to logic so that EP Support Person 1 can resend invitation
            //02-21-23:  US1073168 Added condition that srpmIdOnLoad is null because don't want to enable access fields if SRPM needs converting

            // First make sure that this is 'edit' mode and the Contact has an id and a Customer id, and it's not inactive
            if ( (modeOnLoad == 'edit') &&
            	 (contactIdOnLoad != '' && contactIdOnLoad != null)	&& 
            	 (customerOnLoad != '' && customerOnLoad != null)   && 
                (contactInactiveStatusOnLoad != true))  {

                // Next make sure the Contact's belongs to a SF Customer and is not in the process of approval, revoke, or resend
                // Also verify that it doesn't match to an existing SRPM
                if ((sfCustomerIdOnLoad != '' && sfCustomerIdOnLoad != null && sfCustomerIdOnLoad != L2Constants.LC2_SF_createNew) &&
                    (contactECInfoOnLoad.hasECAccessApproveOrRevokeSet() != true) &&
            	 (resendInvitationOnLoad != true)					&&
                    (srpmIdOnLoad == null))   {
            	
                    // If this is an existing EBSCO Connect SF Contact...
                    if (sfContactIdOnLoad != null && sfContactIdOnLoad != '')  {
                        // See if the Role is allowed to edit any parts of the EBSCO Connect tab
                        if ((L2Constants.LC2_Role.isRoleModifyEC_Contact(userRole) == true) ||
                            (L2Constants.LC2_Role.isRoleResendInvitationECContact(userRole) == true) ||
                            (L2Constants.LC2_Role.isRoleClinicalDecSupport(userRole) && customerECInfo.isClinicalDecCustomer() == true) ) {
                            onLoadECAccessEditsPossible = true;  //High level indicator based on values at load time. This indicator value WILL NEVER change after page is first loaded
                        }
                    }
                    // If this is NOT an existing EBSCO Connect SF Contact ...
                    else {
                        // See if the Role is allowed to send this Contact to SF AND the email qualifies to be pushed to SF
                        if (((L2Constants.LC2_Role.IsRoleSFContactCreateNew(userRole) == true) ||
                             (L2Constants.LC2_Role.isRoleClinicalDecSupport(userRole) && customerECInfo.isClinicalDecCustomer() == true))  &&
                            ((L2Utility.LU2_isEBSCOemail(emailOnLoad) == false ) ||
                             (L2Utility.LU2_isEBSCOemail(emailOnLoad) == true && L2Constants.LC2_Customer.IsCustEBSCOSFPush(customerOnLoad) == true)) ) {
                             onLoadECAccessEditsPossible = true;
                        }
                    }
                }
            }

            // If above static conditions were met...
            if (onLoadECAccessEditsPossible == true) {

                // First save the initial state of the access checkboxes and field editibility in case we need to revert to these
                // because of certain UI errors
                InitializeStatusActionStates();
                /*Trace*/ debugLvl>5 && alert('initStatusActionStates object: ' + JSON.stringify(initStatusActionStates));

                // Next, check the initial state of dynamic conditions (i.e. fields that could change during this UI edit session)
                CheckDynamicECAccessConditions(contactECInfoOnLoad);	//Will set appropriate EC Access fields to 'enabled'
            }
        }   // End of pageInit code

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {     
            /*Trace*/ debugLvl>5 && alert('***** fieldChanged *****' + '\n' + 'field = ' +  scriptContext.fieldId);
        
            currentRecord = scriptContext.currentRecord;
            contactId = currentRecord.id;
            var fieldId = scriptContext.fieldId;           
                            
            switch (fieldId){
             	/* **********************************************************************************************************************
             	 * 										Field Name: "COMPANY"
             	 * ********************************************************************************************************************** */
                 case 'company':  
                	/* EBSCO Connect Access related logic */                    
                    PopulateContactObj(contactECInfo);	 //Get the current UI record information pertaining to EBSCO Connect
                    
                    if (currentRecord.getValue({fieldId: 'company'}) != '' && currentRecord.getValue({fieldId: 'company'}) != null){
                        //  US963983 and US966153 Replacing code that looked at portal_user_status
                        //  If contact has at least one Access Status of "Approved" or "Granted" + Non-Empty company on load, Do not allow change
                        if (contactECInfo.hasCoreECAccess() == true){
                            if (customerOnLoad != '' && customerOnLoad != null){
                                var previousCustomerSearch = search.lookupFields({
                                    type: search.Type.CUSTOMER,
                                    id: customerOnLoad,
                                    columns: ['entityid', 'companyname']
                                });
                                var newCustomerSearch = search.lookupFields({
                                    type: search.Type.CUSTOMER,
                                    id: currentRecord.getValue({fieldId: 'company'}),
                                    columns: ['entityid', 'companyname']
                                });
                                var previousCustomer = previousCustomerSearch.entityid + ' ' + previousCustomerSearch.companyname;
                                var newCustomer = newCustomerSearch.entityid + ' ' + newCustomerSearch.companyname;
                                alert('You cannot change this contact\'s customer because the contact accesses the EBSCO Connect Portal under '+previousCustomer+'.  Please work with Global Customer Support at support@ebsco.com to discuss appropriate options.  Consider creating a new contact under '+newCustomer+'.');
                                currentRecord.setValue({
                                    fieldId: 'company',
                                    value: customerOnLoad,
                                    ignoreFieldChange: true
                                });
                            }
                            else{
                                // Error Catch: Customer was removed (via Contact sublist on Customer) and that the scheduled script to inactivate the Contact has not yet run to fix it. Just give hideous error if fix is needed.
                                alert('EBSCO Connect Alert://alerts contact is a current EBSCO Connect user yet somebody recently removed the contact\'s customer.  Due to this action the contact will be inactivated through a scheduled process and EBSCO Connect access will be removed.  If this contact needs to be reactivated and applied to a specific customer please contact the following:  cwhitehead@ebsco.com for CustSat contacts, or smt@ebsco.com for Sales contacts. Contact ID: '+currentRecord.getValue({fieldId: 'internalid'})+'.');
                            }
                        }
                    }   
                    
                    /* EBSCONet Order Approver related logic */
                    var enetOrderApproverStatus = currentRecord.getValue({fieldId: 'custentity_enet_ordapprove_status'});
                    //  US631219 - SAO: Warning if Customer is changed and EBSCONET Order Approver (or set up in progress)
                    if (L2Constants.LC2_ContactENOrdApprovSts.IsEmailCustChgAllowed(enetOrderApproverStatus) == false && customerOnLoad != currentRecord.getValue({fieldId: 'company'})){
                        currentRecord.setValue({
                            fieldId: 'company',
                            value: customerOnLoad,
                            ignoreFieldChange: true
                        });
                        if (customerOnLoad != '' && customerOnLoad != null){
                            //  Warning where Revoke In Progress/Just Requested
                            if (enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.RevokeInProg || enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.RevokeReq){
                                alert('You are changing the Customer on a Contact that is an EBSCONET Order Approver, you must wait for the revoke of the EBSCONET Order Approver status to complete before you can change the Customer on this Contact.');
                            }
                            //  Warning where user can revoke a Customer
                            else if (L2Constants.LC2_Role.IsRoleENOrdApprovRevoke(userRole) == true){
                                alert('You are changing the Customer on a Contact that is an EBSCONET Order Approver (or where set up is in progress). In order to do this you must first revoke the Order Approver status (for In Progress you will need to wait for the Approve to complete before the Revoke can be requested).');
                            }
                            //  Warning where user cannot revoke a customer
                            else{
                                alert('You are changing the Customer on a Contact that is an EBSCONET Order Approver (or where set up is in progress). Manual intervention is required to do this, please contact Sales Operations to request this change.');
                            }
                        }
                        //  Error catch: Customer removed from contact
                        else{
                            alert('This contact is an EBSCONET Order Approver (or set up is in progress) yet somebody recently removed the customer.  The original Customer will be reinstated through a nightly scheduled process and you will not be able to amend the Contact until that process has run.');
                        }
                    }
                break;
                    
               /* **********************************************************************************************************************
                * 										Field Name: "MOVE TO MARKETO"
                * ********************************************************************************************************************** */
                case 'custentity_move_to_marketo':
                    //  Do not allow user to set to null if "Move to Marketo" was previously set
                    if (moveToMarketoOnLoad != '' && moveToMarketoOnLoad != null){
                        if (currentRecord.getValue({fieldId:'custentity_move_to_marketo'}) == '' || currentRecord.getValue({fieldId:'custentity_move_to_marketo'}) == null){
                            currentRecord.setValue({
                                fieldId: 'custentity_move_to_marketo',
                                value: moveToMarketoOnLoad,
                                ignoreFieldChange: true
                            });
                            alert('You cannot unset Move to Marketo. The previous value has been restored but you can still choose either Yes or No');
                        }
                    }
                break;
                    
                /* **********************************************************************************************************************
             	 * 										Field Name: "CONTACT ORIGIN"
             	 * ********************************************************************************************************************** */
                case 'custentity_contact_origin':
                    //  US473423: Users are not allowed to set to "EBSCO Connect", reset to previous value.
                    if (currentRecord.getValue({fieldId: 'custentity_contact_origin'}) == L2Constants.LC2_ContactOrigin.EBSCOConnect){
                        alert('Please choose another Contact Origin. \'EBSCO Connect\' is reserved for Contacts created through the EBSCO Connect Portal only.');
                        currentRecord.setValue({
                            fieldId: 'custentity_contact_origin',
                            value: contactOriginOnLoad,
                            ignoreFieldChange: true
                        });
                    }
                break;
                    
                /* **********************************************************************************************************************
             	 * 										Field Name: "EMAIL"
             	 * ********************************************************************************************************************** */
                case 'email':
                	var newEmail = currentRecord.getValue({fieldId:'email'});
                	
                	/* EBSCO Connect Access related logic */                    
                    PopulateContactObj(contactECInfo); 	//Get the current UI record information pertaining to EBSCO Connect

                    //  US963983 + US966153 - If changing email on contact with ANY Access Status of "Approved" or "Granted"
                    if(contactECInfoOnLoad.hasCoreECAccess() == true ||
                       contactECInfo.hasCoreECAccess()		 == true) {
                        //  Reject change in following scenarios:
                        //  #1 - Contact has: SF ID, EBSCO Email, Customer is NOT "ns288673 EBSCO - EIS"                        
                    	//12-29-22:  US1051405 TA783886 - Contact with ebsco email NOT allowed in Connect unles it's under the EBSCO Customer
                    	if (contactECInfo.EC_SFContactID != '' && contactECInfo.EC_SFContactID != null &&
                        	L2Utility.LU2_isEBSCOemail(newEmail)   	== true && 
                        	L2Utility.LU2_isEBSCOemail(emailOnLoad)	== false && 
                        	L2Constants.LC2_Customer.IsCustEBSCOSFPush(currentRecord.getValue({fieldId:'company'})) == false) {
                        	
                            currentRecord.setValue({
                                fieldId: 'email',
                                value: emailOnLoad,
                                ignoreFieldChange: true
                            });
                            alert('An EBSCO Connect contact cannot have an EBSCO email (incl. epnet & ybp). Original email has been reset');
                        }
                        //  #2 - Email is change to null/empty
                        else if (newEmail == '' || newEmail == null){
                            currentRecord.setValue({
                                fieldId: 'email',
                                value: emailOnLoad,
                                ignoreFieldChange: true
                            });
                            alert('An EBSCO Connect contact must have an email. Original email has been reset');
                        }
                        else if (contactECInfo.emailAlreadyInUseInEC() == true) {
                            alert('ERROR: There is already an EBSCO Connect user who uses this email. If you wish to pursue changing this email, please contact the following:  cwhitehead@ebsco.com for CustSat contacts, or smt@ebsco.com for Sales contacts. Original email will be reset.');
                            currentRecord.setValue({
                                fieldId: 'email',
                                value: emailOnLoad,
                                ignoreFieldChange: true
                            });
                        }
                        //  Allowed Scenario: Double-check with user that they want to change the email
                        else {
                            //  Change to using "confirm" syntax native to JS
                            var c = confirm('This contact uses (or will use) this email to access the EBSCO Connect customer portal.  Select \'Cancel\' to undo your change.  Select \'OK\' if you still want to update this contact\'s email.  You should notify the Contact that the email address change will apply to their EBSCO Connect login.');
                            if (c == false)
                            {
                                currentRecord.setValue({
                                    fieldId: 'email',
                                    value: emailOnLoad,
                                    ignoreFieldChange: true
                                });
                            }
                            //  US1040056 - Dupe Email Check indicator needs to be reset
                            else{
                                emailCheckPerformed = false;
                               // break;      //Why would we want to break here?  We need to complete EBSCONET approver logic below
                            }

                        }
                    }
                   /* else {
                    	//If chged from ebsco email to non-ebsco email, may want to enable access fields?????
                    	if (L2Utility.LU2_isEBSCOemail(emailOnLoad) == true && L2Utility.LU2_isEBSCOemail(newEmail) == false) {                    	    
                    		//For Batch 3 email change of this sort must be handled in two step process:  change the email and save the 
                    		//Contact, then re-open the Contact to edit the EC access statuses
                    	}
                    } */
                    
                    /* EBSCONet Order Approver Access related logic */    
                    //  US631219 - Prevent email change if EBSCONET Order Approver or setup is "In Progress"
                    enetOrderApproverStatus = currentRecord.getValue({fieldId: 'custentity_enet_ordapprove_status'});
                    if (L2Constants.LC2_ContactENOrdApprovSts.IsEmailCustChgAllowed(enetOrderApproverStatus) == false && emailOnLoad != newEmail){
                        //  US758140 - SalesOps allowed to change email on SAO Contacts
                        if (userRole == L2Constants.LC2_Role.EPSalesAdmin || userRole == L2Constants.LC2_Role.Administrator){
                            //  Change to using "Confirm"
                            var c = confirm("Sales Administrator warning: You are changing the email on a Contact that is an EBSCONET Order Approver (or where set up is in progress). Please ensure that the NetCRM email address matches the EBSCONET email address.  Contact the EBSCONET team as necessary.  Select \'Cancel\' to undo your change.  Select \'OK\' if you still want to update this contact\'s email.'")
                            if (c == false){
                                currentRecord.setValue({
                                    fieldId: 'email',
                                    value: emailOnLoad,
                                    ignoreFieldChange: true
                                });
                            }
                            //  US1040056 - Dupe Email Check indicator needs to be reset
                            else{
                                emailCheckPerformed = false;
                                break;
                            }
                        }
                        else{
                            // Reset field
                            currentRecord.setValue({
                                fieldId: 'email',
                                value: emailOnLoad,
                                ignoreFieldChange: true
                            });
                            //  Error Message: When a ENET Order Approver Revoke is Requested/In Progress
                            if (enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.RevokeInProg || enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.RevokeReq){
                                alert('You are changing the email on a Contact that is an EBSCONET Order Approver, you must wait for the revoke of the EBSCONET Order Approver status to complete before you can change the email on this Contact.');
                            }
                            //  Error Message: User cannot revoke contact
                            else{
                                alert('You are changing the email on a Contact that is an EBSCONET Order Approver (or where set up is in progress). Manual intervention is required to do this, please contact Sales Operations to request this change.');
                            }
                        }
                    }
                    
                    //  Ensure that for any email change the Dupe email check indicator is reset so that Save logic will check for dups
                    if (currentRecord.getValue({fieldId: 'email'}) != emailOnLoad){
                        emailCheckPerformed = false;
                        /* 02-21-23: US1073168 - Update EBSCO Connect Access related data and check if access field editability needs to change */
                        PopulateContactObj(contactECInfo); 	//Get the current UI record information pertaining to EBSCO Connect
                        CheckDynamicECAccessConditions(contactECInfo);
                    }
                break;
                    
                /* **********************************************************************************************************************
             	 * 										Field Name: "OPERATIONAL CATEGORY"
             	 * ********************************************************************************************************************** */
                case 'custentity_contact_category':
                    var newOperationalCategory = currentRecord.getValue({fieldId:'custentity_contact_category'});
                    var enetOrderApproverInOpCat = false;
                    var enetOpCategoryRemoved = [];
                    var categoryCount = newOperationalCategory.length;
                    for (var c=0; categoryCount != null && c < categoryCount; c++){
                        if (newOperationalCategory[c] == L2Constants.LC2_ContactOpCat.EnetApprover){
                            enetOrderApproverInOpCat = true;
                        }
                        else{
                            //  Populate new array with EBSCONET Order Approver removed from it
                            enetOpCategoryRemoved.push(newOperationalCategory[c]);
                        }
                    }
                    //  If there is a ENET Order Approver in the new Operational Category AND there was not one on Load
                    if (enetOrderApproverInOpCat == true && enetOrderApproverInOpCatOnLoad == false){
                        //  User added EBSCONET Order Approver to the Operational Category - reset it to exclude this value
                        currentRecord.setValue({
                            fieldId: 'custentity_contact_category',
                            value: enetOpCategoryRemoved,
                            ignoreFieldChange: true
                        });
                        if (L2Constants.LC2_Role.IsRoleENOrdApprovSet(userRole) == true){
                            alert('Please use the \'Set EBSCONET Order Approver\' button on the top of this page to set this Contact up as an EBSCONET Order Approver.  If this contact is already setup in EBSCONET the Operational Category will be updated automatically.  If it is not setup, a process will be launched to start the setup and the Operational Category will populate at a later time.');                        }
                        else{
                            alert('Your role does not allow you to set the EBSCONET Order Approver value.  If you have questions about this feature please contact Sales Operations');
                        }
                    }
                    //  If there is no ENET Order Approver in the new Operational Category AND there was one on Load
                    else if (enetOrderApproverInOpCat == false && enetOrderApproverInOpCatOnLoad == true){
                        //  Restore ENET Order Approver to Operational Category since user removed it
                        var enetOperationalCategoryAdded = newOperationalCategory;
                        enetOperationalCategoryAdded.push(L2Constants.LC2_ContactOpCat.EnetApprover);
                        currentRecord.setValue({
                            fieldId: 'custentity_contact_category',
                            value: enetOperationalCategoryAdded,
                            ignoreFieldChange: true
                        });
                        if (L2Constants.LC2_Role.IsRoleENOrdApprovRevoke(userRole) == true){
                            alert('Please use the \'Revoke EBSCONET Order Approver\' button on the top of this page to initiate a process which will remove the Contact from being an EBSCONET Order Approver.  Once the Contact is no longer an approver in EBSCONET the Operational Category will be updated automatically.');
                        }
                        else{
                            alert('Your role does not allow you to unset the EBSCONET Order Approver value.  Please contact Sales Operations if you still wish to remove this Contact from being an EBSCONET Order Approver.  EBSCONET Order Approver has been added back to the Operational Category.');
                        }
                    }
                break;
                    
           
                /* **********************************************************************************************************************
             	 * 										Field Name: "INACTIVE"
             	 * ********************************************************************************************************************** */    
                case 'isinactive':
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);
                    
                    //  Validation for setting to True - NOTE: If Contact was inactive at the time of load, then all EC related fields
                    //  will be disabled.  If Cust Sat wishes to reactivate and give this Contact EC access, then it MUST be done in
                    //  a two step process:  1. Reactivate the Contact and Save  2. Edit the reactivated Contact for EC Access
                    if (contactInactiveStatusOnLoad == false && currentRecord.getValue({fieldId: 'isinactive'}) == true){
                        var inactivationAllowed = true;                    
                        //  US999470 TA743938 - Prevent inactivation if any Access Status is 'Approved' and/or 'Revoked' as it is syncing between NetCRM + SalesForce
                        if (contactECInfo.hasECAccessApproveOrRevokeSet() == true){
                            alert('You have chosen to inactivate a Contact that is currently in the process of being set up as an EBSCO Connect User, or in the process of being removed from EBSCO Connect.  You cannot inactivate the contact until backend processing completes.  Visit the EBSCO Connect subtab and wait several minutes until the Access Status fields indicate either "Granted" or "Removed", afterwards you will be able to inactivate this Contact.');
                            currentRecord.setValue({
                                fieldId: 'isinactive',
                                value: false,
                                ignoreFieldChange: true
                            });
                            inactivationAllowed = false;
                        }
                        //  Other Option is EC Status could be "Granted"
                        //  Can use hasCoreECAccess because the initial if with hasECAccessApproveOrRevokeSet will "catch" all the "Approved", letting only "Granted" make it to the Else If
                        else if (contactECInfo.hasCoreECAccess() == true){
                            var c = confirm('WARNING, you have chosen to inactivate a Contact who has been granted access to EBSCO Connect.  Select \'Cancel\' to undo your change.  Select \'OK\' if you still want to update this contact to Inactive');
                            if (c == false){
                                currentRecord.setValue({
                                    fieldId: 'isinactive',
                                    value: false,
                                    ignoreFieldChange: true
                                });
                                inactivationAllowed = false;
                            }
                        }

                        //  EBSCONet Order Approver Processing
                        var enetOrderApproverStatus = currentRecord.getValue({fieldId: 'custentity_enet_ordapprove_status'});
                        if (inactivationAllowed == true && L2Constants.LC2_ContactENOrdApprovSts.IsInactivateAllowed(enetOrderApproverStatus) == false){
                            //  Reset Field
                            currentRecord.setValue({
                                fieldId: 'isinactive',
                                value: false,
                                ignoreFieldChange: true
                            });
                            //  Alert user: ENET Order Approver Status is Revoke Requested
                            if (enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.RevokeReq){
                                alert('You are inactivating a Contact that is an EBSCONET Order Approver, you must wait for the revoke of the EBSCONET Order Approver status to complete before you can inactivate this Contact.');
                            }
                            //  Alert user: User okay to revoke role-wise, unable because of ENET Order Approver status
                            else if (L2Constants.LC2_Role.IsRoleENOrdApprovRevoke(userRole) == true){
                                alert('You are inactivating a Contact that is an EBSCONET Order Approver (or where set up is in progress). In order to do this you must first revoke the Order Approver status (for In progress you will need to wait for the Approve to complete before you can Revoke).');
                            }
                            //  Alert user: User cannot revoke due to role permissions
                            else{
                                alert('You are inactivating a Contact that is an EBSCONET Order Approver (or where set up is in progress). Manual intervention is required to do this, please contact Sales Operations to request this change.');
                            }
                        }
                        
                        //  Refactor Note: Moved this to after ENET Order Approver logic, due to edge case that ENET OA logic disallows inactivate
                        if (inactivationAllowed == true){
                        	//set disable all AND disable indiv AND resend
                        	//call CheckDynamic to disable the actual fields
                            disableGrantCore = true;    //  US999470 - Disable EBSCO Connect Access checkboxes
                            disableRevokeAll = true;
                        	disableIndAction = true; 	//  Refactor Note: Disable Granular Access fields due to us opening them up for individual editing (11/29/2022)
                        	disableResend = true; 		//  Disable resend invitation if inactivating
                        	CheckDynamicECAccessConditions(contactECInfo);

                            var inactivateComments = currentRecord.getValue({fieldId: 'custentity_inactivation_comments'});
                            if (inactivateComments == '' || inactivateComments == null){
                                alert('Please enter Inactivation Comments to save this record.');
                            }
                        }
                    }                    
                    else {
                    	 if (contactInactiveStatusOnLoad == true && currentRecord.getValue({fieldId: 'isinactive'}) == false){                                         
                             //12-28-22:  US1051405 TA783658 - Prevent re-activation if any Access Status is 'Approved' and/or 'Revoked' as it is syncing between NetCRM + SalesForce
                             if (contactECInfo.hasECAccessApproveOrRevokeSet() == true){
                                 alert('You have chosen to re-activate a Contact that is currently in the process of being set up as an EBSCO Connect User, or in the process of being removed from EBSCO Connect.  You cannot re-activate the contact until backend processing completes.  Visit the EBSCO Connect subtab and wait several minutes until the Access Status fields indicate either "Granted" or "Removed", afterwards you will be able to re-activate this Contact.');
                                 currentRecord.setValue({
                                     fieldId: 'isinactive',
                                     value: true,
                                     ignoreFieldChange: true
                                 });                                
                             }
                    	 }
                    	 else {
                    		//  Handling checking then unchecking the box in the same editing session.  Call to CheckDynamicECAccess 
                            //  will re-enable the EC fields IF appropriate for this Contact. 
                             disableGrantCore   = initStatusActionStates.GrantCoreDisabled;
                             disableRevokeAll   = initStatusActionStates.RevokeAllDisabled;
                             disableIndAction   = initStatusActionStates.IndividualDisabled;
                             disableResend      = initStatusActionStates.ResendInvDisabled;

                            CheckDynamicECAccessConditions(contactECInfo);
                    	 }
                    }
                break;

                /*
                ************************************************************
                *   Beginning of EBSCO Connect Access Status Field Changes *
                ************************************************************
                */

	            /* **********************************************************************************************************************
	         	 * 										Field Name: "CASE MANAGEMENT ACCESS STATUS"
	         	 * ********************************************************************************************************************** */
                case 'custentity_sf_case_mngmt_access_status':                	
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);
                	             
                    /*Trace*/ debugLvl>99 && alert( 'EC_CaseMgtAS = ' +  contactECInfo.EC_CaseMgtAS + '\n' +
                					'EC_AcademyAS = ' +  contactECInfo.EC_AcademyAS + '\n' +
                					            'EC_DiscGroupsAS = ' +  contactECInfo.EC_DiscGroupsAS);
                                       
                    var allowedViaUI = isNewAccessStatusAllowed(contactECInfo.EC_CaseMgtAS, contactECInfoOnLoad.EC_CaseMgtAS, 'Case Management Access Status');
                	if (allowedViaUI != true) {                		
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: contactECInfoOnLoad.EC_CaseMgtAS,
                            ignoreFieldChange: true
                        });
                    }
                	else {
                        disableGrantCore = true;
                        disableRevokeAll = true;
                    	//disableResend = true;                	                	
	                    
	                    //  US1035778 - Development for selecting Granular Access
	                    //  If set to Approved, ensure that Academy + Discussion Groups are set to Approved as well if appropriate
	                    if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved){
	                    	
	                    	// If giving access for first time - Dupe Check all active contacts and warn user if so.		                   
	                        if (contactECInfoOnLoad.hasCoreECAccess() == false && emailCheckPerformed == false){
	                            var contactEmail = currentRecord.getValue({fieldId: 'email'});
	                            dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'EBSCO Connect');
	                        }
		                    
	                        //  Set Academy Access Status to Approved
	                        if (contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved && contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted){
	                            currentRecord.setValue({
	                                fieldId: 'custentity_sf_academy_access_status',
	                                value: L2Constants.LC2_Property_based_Access.Approved,
	                                ignoreFieldChange: true
	                            });
	                        }
	                        //  Set Discussion Groups Access Status to Approved
                            //  US1058236: TA803231 Only auto-approve Groups if its status is blank or 'Needs Review'.
	                        if (contactECInfo.EC_DiscGroupsAS == '' || contactECInfo.EC_DiscGroupsAS == null || contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev){
	                            currentRecord.setValue({
	                                fieldId: 'custentity_sf_groups_access_status',
	                                value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
	                                ignoreFieldChange: true
	                            });
	                        }
	                        //  US1040056 - Disable "Grant ALL EBSCO Connect Access" checkbox when A.S. moves to "Approved"
	                        //currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = true;
	                    }
	                    else {
	                    	//  US1040056 - Add in logic that when AS is changed to Revoked, lock down the following fields
		                    if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Revoked){
                                //05-26-23:  US1113403 - TA816834: Don't allow Case Mgt to be revoked if Clinical Decisions is approved/granted
                                if (contactECInfo.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Approved ||
                                    contactECInfo.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Granted) {

                                    //Put back the old Case Mgt status value
                                    currentRecord.setValue({
                                        fieldId: 'custentity_sf_case_mngmt_access_status',
                                        value: contactECInfoOnLoad.EC_CaseMgtAS,
                                        ignoreFieldChange: true
                                    });
                                    alert('Case Management cannot be revoked if the Contact has Clinical Decision access.' +
                                        'The "Case Management Access Status" has been reset to its previous value');
		                    }                  
                                //else disableResend = true;
	                    }
	                    }

                        //Get the current UI record information pertaining to EBSCO Connect
                        PopulateContactObj(contactECInfo);

	                    CheckDynamicECAccessConditions(contactECInfo);
                	}
                break;
                
	            /* **********************************************************************************************************************
	         	 * 										Field Name: "DISCUSSION GROUPS ACCESS STATUS"
	         	 * ********************************************************************************************************************** */
                case 'custentity_sf_groups_access_status':                
                    //Get the current UI record information pertaining to EBSCO Connect
                	PopulateContactObj(contactECInfo);
   	             
                    /*Trace*/ debugLvl>99 && alert( 'EC_CaseMgtAS = ' +  contactECInfo.EC_CaseMgtAS + '\n' +
                					'EC_AcademyAS = ' +  contactECInfo.EC_AcademyAS + '\n' +
                					        'EC_DiscGroupsAS = ' +  contactECInfo.EC_DiscGroupsAS);
                    
                 	var allowedViaUI = isNewAccessStatusAllowed(contactECInfo.EC_DiscGroupsAS, contactECInfoOnLoad.EC_DiscGroupsAS, 'Discussion Groups Access Status');
                	if (allowedViaUI != true) {                	
                        currentRecord.setValue({                        	
                            fieldId: 'custentity_sf_groups_access_status',
                            value: contactECInfoOnLoad.EC_DiscGroupsAS,
                            ignoreFieldChange: true
                        });
                    }
                	else {
                        disableGrantCore = true;
                        disableRevokeAll = true;
                    	//disableResend = true;                	
  
	                    //  If set to Approved, ensure that Academy Access Status is set to Approved as well
	                    if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved){ 
	                    	
	                    	// If giving access for first time - Dupe Check all active contacts and warn user if so.		                   
	                        if (contactECInfoOnLoad.hasCoreECAccess() == false && emailCheckPerformed == false){
	                            var contactEmail = currentRecord.getValue({fieldId: 'email'});
	                            dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'EBSCO Connect');
	                        }
	                        
	                        //01-04-23:  US1051405 TA784761	Academy Access was erroneously being set from 'Granted' to 'Approved' because '||' used when '&&' was needed in next line
	                        if (contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved && contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted){
	                            currentRecord.setValue({
	                                fieldId: 'custentity_sf_academy_access_status',
	                                value: L2Constants.LC2_Property_based_Access.Approved,
	                                ignoreFieldChange: true
	                            });
	                        }
	                        //  US1040056 - Disable "Grant ALL EBSCO Connect Access" checkbox when A.S. moves to "Approved"
	                        currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = true;
	                    }
	                    else {
	                        //  US1040056 - Add in logic that when AS is changed to Revoked, lock down the following fields
	                        if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Revoked){
	                        	disableResend = true;
	                        }	                     
	                    }
	                    
	                    CheckDynamicECAccessConditions(contactECInfo);
                	}
               	break;

                
	            /* **********************************************************************************************************************
	         	 * 										Field Name: "ACADEMY ACCESS STATUS"
	         	 * ********************************************************************************************************************** */
                case 'custentity_sf_academy_access_status':
                	//Get the current UI record information pertaining to EBSCO Connect
                	PopulateContactObj(contactECInfo);
      	             
                    /*Trace*/ debugLvl>99 && alert('EC_CaseMgtAS = ' +  contactECInfo.EC_CaseMgtAS + '\n' +
                					'EC_AcademyAS = ' +  contactECInfo.EC_AcademyAS + '\n' +
                				    	'EC_DiscGroupsAS = ' +  contactECInfo.EC_DiscGroupsAS);
 
                	var allowedViaUI = isNewAccessStatusAllowed(contactECInfo.EC_AcademyAS, contactECInfoOnLoad.EC_AcademyAS, 'Academy Access Status');
                	if (allowedViaUI != true) { 
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: contactECInfoOnLoad.EC_AcademyAS,
                            ignoreFieldChange: true
                        });                      
                    }
                	else {
                		 if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Approved) {
                			 
 	                    	// If giving access for first time - Dupe Check all active contacts and warn user if so.		                   
 	                        if (contactECInfoOnLoad.hasCoreECAccess() == false && emailCheckPerformed == false){
 	                            var contactEmail = currentRecord.getValue({fieldId: 'email'});
 	                            dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'EBSCO Connect');
 	                        } 
 	                        
                            disableGrantCore = true;
                            disableRevokeAll = true;
 	                        //  US1040056 - Disable "Grant ALL EBSCO Connect Access" checkbox when A.S. moves to "Approved"
	                       // currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = true;
                		 }
                		 else {
                			 //	US1035778 Development for Selecting Granular Access
     	                    //	Can be set to Approved by itself, however if set to Revoke do not allow (reset to init status) + Instruct to use checkbox to remove everything
     	                    if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Revoked){
     	                    	
     	                    	if(contactECInfo.hasNonAcademyECAccess() == true) {
     	                    		currentRecord.setValue({
         	                            fieldId: "custentity_sf_academy_access_status",
         	                            value: contactECInfoOnLoad.EC_AcademyAS,
         	                            ignoreFieldChange: true
         	                        });
         	                        alert('Academy Access cannot be revoked by itself. If you wish to revoke Academy Access, please use the "Revoke EBSCO Connect Access" checkbox to remove ALL EBSCO Connect access for this contact.' +
         	                            'The "Academy Access Status" has been reset to its previous value');	
     	                    	}     	                        
     	                    } 
                		 }
                		 
                		 CheckDynamicECAccessConditions(contactECInfo);
                	}
                    break;

                /* **********************************************************************************************************************
                 * 										Field Name: "CLINICAL DECISIONS ACCESS STATUS"
                 * ********************************************************************************************************************** */
                case 'custentity_sf_clinical_dec_access_status':
                    //06-02-23:  US1113403 - Clinical Decisions Access Status added to EBSCO Connect tab
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);

                    /*Trace*/ debugLvl>99 && alert('EC_CaseMgtAS = ' +  contactECInfo.EC_CaseMgtAS + '\n' +
                    'EC_AcademyAS = ' +  contactECInfo.EC_AcademyAS + '\n' +
                    'EC_DiscGroupsAS = ' +  contactECInfo.EC_DiscGroupsAS);

                    var allowedViaUI = isNewAccessStatusAllowed(contactECInfo.EC_ClinicalDecAS, contactECInfoOnLoad.EC_ClinicalDecAS, 'Clinical Decisions Access Status');
                    if (allowedViaUI != true) {
                        //Status Change is not allowed, so putting Contact back to its onLoad state
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_clinical_dec_access_status',
                            value: contactECInfoOnLoad.EC_ClinicalDecAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: contactECInfoOnLoad.EC_CaseMgtAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: contactECInfoOnLoad.EC_AcademyAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_groups_access_status',
                            value: contactECInfoOnLoad.EC_DiscGroupsAS,
                            ignoreFieldChange: true
                        });
                    }
                    else {
                        if (contactECInfo.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Approved) {

                            // If giving access for first time - Dupe Check all active contacts and warn user if so.
                            if (contactECInfoOnLoad.hasCoreECAccess() == false && emailCheckPerformed == false){
                                var contactEmail = currentRecord.getValue({fieldId: 'email'});
                                dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'EBSCO Connect');
                            }

                            //  TA816832 Set Case Management Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                            if (contactECInfo.EC_CaseMgtAS != L2Constants.LC2_SF_EcAccessLevels_sts.Approved && contactECInfo.EC_CaseMgtAS != L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                                currentRecord.setValue({
                                    fieldId: 'custentity_sf_case_mngmt_access_status',
                                    value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                                    ignoreFieldChange: true
                                });
                            }

                            //  TA816832 Set Academy Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                            if (contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved && contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted){
                                currentRecord.setValue({
                                    fieldId: 'custentity_sf_academy_access_status',
                                    value: L2Constants.LC2_Property_based_Access.Approved,
                                    ignoreFieldChange: true
                                });
                            }
                            //  TA816832 Set Discussion Groups Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                            if (contactECInfo.EC_DiscGroupsAS != L2Constants.LC2_SF_EcAccessLevels_sts.Approved && contactECInfo.EC_DiscGroupsAS != L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                                currentRecord.setValue({
                                    fieldId: 'custentity_sf_groups_access_status',
                                    value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                                    ignoreFieldChange: true
                                });
                            }

                            disableGrantCore = true;
                            disableRevokeAll = true;
                            //  - Disable "Grant ALL EBSCO Connect Access" checkbox when A.S. moves to "Approved"
                            // currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = true;
                        }
                        else {
                            //   - Add in logic that when AS is changed to Revoked, lock down the following fields
                            if (contactECInfo.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Revoked){
                                disableResend = true;
                            }
                            else {
                                //Get the current UI record information pertaining to EBSCO Connect because we may have approved other fields
                                PopulateContactObj(contactECInfo);

                                //  TA816832 Set Case Management Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                                if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved){
                                    currentRecord.setValue({
                                        fieldId: 'custentity_sf_case_mngmt_access_status',
                                        value: contactECInfoOnLoad.EC_CaseMgtAS,
                                        ignoreFieldChange: true
                                    });
                                }

                                //  TA816832 Set Academy Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                                if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Approved){
                                    currentRecord.setValue({
                                        fieldId: 'custentity_sf_academy_access_status',
                                        value: contactECInfoOnLoad.EC_AcademyAS,
                                        ignoreFieldChange: true
                                    });
                                }
                                //  TA816832 Set Discussion Groups Access Status to Approved (we're allowing CD team to overwrite previous denials from CustSat)
                                if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved){
                                    currentRecord.setValue({
                                        fieldId: 'custentity_sf_groups_access_status',
                                        value: contactECInfoOnLoad.EC_DiscGroupsAS,
                                        ignoreFieldChange: true
                                    });
                                }

                                //Get the current UI record information pertaining to EBSCO Connect because we may have reset other fields
                                PopulateContactObj(contactECInfo);
                            }
                        }

                		 CheckDynamicECAccessConditions(contactECInfo);
                	}
                    break;

	            /* **********************************************************************************************************************
	         	 * 										Field Name: "GRANT ALL EBSCO CONNECT ACCESS"
	         	 * ********************************************************************************************************************** */
                case 'custentity_grant_ec_accstatus_all':                	 
                    /*Trace*/ debugLvl>99 && alert('Email = ' + contactECInfo.Email);
                	disableIndAction = true;
                	disableResend = true;
                	
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);
                    
                    var grantAllECAccess = currentRecord.getValue({fieldId: 'custentity_grant_ec_accstatus_all'});
                    //  If giving access for first time - Dupe Check all active contacts and warn user if so.
                    if (grantAllECAccess == true){
                        var contactEmail = currentRecord.getValue({fieldId: 'email'});
                        if (emailCheckPerformed == false) {
                            dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'EBSCO Connect');
                        }
                        //  1035778 Development for Selecting Granular Access
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: L2Constants.LC2_Property_based_Access.Approved,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_groups_access_status',
                            value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                            ignoreFieldChange: true
                        });
                    }
                    //  Handle when user checks then unchecks the box prior to saving
                    else if (grantAllECAccess == false){                    	
                    	disableIndAction = false;
                    	//disableResend = false;
                        //  Reset the Access Status fields to their initial values
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: contactECInfoOnLoad.EC_CaseMgtAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_groups_access_status',
                            value: contactECInfoOnLoad.EC_DiscGroupsAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: contactECInfoOnLoad.EC_AcademyAS,
                            ignoreFieldChange: true
                        });
                    }
                    PopulateContactObj(contactECInfo);
                    CheckDynamicECAccessConditions(contactECInfo);
                    break;
                    
                /* **********************************************************************************************************************
	         	 * 										Field Name: "REVOKE ALL EBSCO CONNECT ACCESS"
	         	 * ********************************************************************************************************************** */   
                case 'custentity_revoke_ec_accstatus_all':
                	disableIndAction = true;
                	disableResend = true;
                	
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);
                    
                    var revokeAllECAccess = currentRecord.getValue({fieldId: 'custentity_revoke_ec_accstatus_all'});
                    if (revokeAllECAccess == true){
                    	//  12-13-22 KM - If Granted change to Revoked. If Needs Review change to Denied. **
                    	if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_case_mngmt_access_status',
                                value: L2Constants.LC2_SF_EcAccessLevels_sts.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        else if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_case_mngmt_access_status',
                                value: L2Constants.LC2_SF_EcAccessLevels_sts.Denied,
                                ignoreFieldChange: true
                            });
                        }

                        if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_groups_access_status',
                                value: L2Constants.LC2_SF_EcAccessLevels_sts.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        else if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_groups_access_status',
                                value: L2Constants.LC2_SF_EcAccessLevels_sts.Denied,
                                ignoreFieldChange: true
                            });
                        }
                            //  Property Based Access Fields
                        if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_academy_access_status',
                                value: L2Constants.LC2_Property_based_Access.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        //  If needed, revoke the other Access Status fields as well
                        if (contactECInfo.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Approved || contactECInfo.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_enet_oa_access_status',
                                value: L2Constants.LC2_Property_based_Access.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        if (contactECInfo.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Approved || contactECInfo.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_folio_cust_access_status',
                                value: L2Constants.LC2_Property_based_Access.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        if (contactECInfo.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Approved || contactECInfo.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_sf_transition_access_status',
                                value: L2Constants.LC2_Property_based_Access.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                        // US1259509 Add 'EBSCO Hosted FOLIO Access Status'
                        if (contactECInfo.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Approved || contactECInfo.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Granted){
                            currentRecord.setValue({
                                fieldId: 'custentity_hosted_folio_access_status',
                                value: L2Constants.LC2_Property_based_Access.Revoked,
                                ignoreFieldChange: true
                            });
                        }
                    }
                    //  Handle when user checks then unchecks the box prior to saving
                    else if (revokeAllECAccess == false){
                    	disableIndAction = false;
                    	disableResend = false;
                        //  Reset the Access Statuses
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: contactECInfoOnLoad.EC_CaseMgtAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_groups_access_status',
                            value: contactECInfoOnLoad.EC_DiscGroupsAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: contactECInfoOnLoad.EC_AcademyAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_enet_oa_access_status',
                            value: contactECInfoOnLoad.EC_EnetOrderAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_folio_cust_access_status',
                            value: contactECInfoOnLoad.EC_FolioCustAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_transition_access_status',
                            value: contactECInfoOnLoad.EC_TransCustAS,
                            ignoreFieldChange: true
                        });
                        // US1259509 Add 'EBSCO Hosted FOLIO Access Status'
                        currentRecord.setValue({
                            fieldId: 'custentity_hosted_folio_access_status',
                            value: contactECInfoOnLoad.EC_FoHostedByEbscoAS,
                            ignoreFieldChange: true
                        });
                    }
                    CheckDynamicECAccessConditions(contactECInfo);
                    break;
                    
                /* **********************************************************************************************************************
	         	 * 										Field Name: "RESEND INVITATION"
	         	 * ********************************************************************************************************************** */     
                case 'custentity_resend_ec_invitation':
                    /*Trace*/ debugLvl>5 && alert('initStatusActionStates object: ' + JSON.stringify(initStatusActionStates));

                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);
                    
                    var resendInvitation = currentRecord.getValue({fieldId: 'custentity_resend_ec_invitation'});
                    if (resendInvitation == true){
                        var c = confirm('This action will send a new EBSCO Connect invitation to the Contact through email.   Select \'OK\' if you want to proceed.  Select \'Cancel\' if you do not want to proceed.');
                        if (c == false){
                            currentRecord.setValue({
                                fieldId: 'custentity_resend_ec_invitation',
                                value: false,
                                ignoreFieldChange: true
                            });
                        }
                        else{
                            currentRecord.setValue({
                                fieldId: 'custentity_portal_user_status',
                                value: L2Constants.LC2_SF_PortalUser_sts.SendInv,
                                ignoreFieldChange: true
                            });
                            currentRecord.getField({fieldId: 'custentity_revoke_ec_accstatus_all'}).isDisabled = true;
                            currentRecord.getField({fieldId: 'isinactive'}).isDisabled = true;
                            disableRevokeAll = true;
                            disableIndAction = true;
                        }
                    }
                    //  Handle the user checking then unchecking the box before save
                    else if (resendInvitation == false){
                        //  Reset the "CXP Portal User Status"
                        currentRecord.setValue({
                            fieldId: 'custentity_portal_user_status',
                            value: contactECInfoOnLoad.EC_PUS,
                            ignoreFieldChange: true
                        });
                        disableRevokeAll = initStatusActionStates.RevokeAllDisabled;
                        disableIndAction = initStatusActionStates.IndividualDisabled;
                        currentRecord.getField({fieldId: 'isinactive'}).isDisabled = false;
                    }
                    //Get the current UI record information pertaining to EBSCO Connect
                    PopulateContactObj(contactECInfo);

                    CheckDynamicECAccessConditions(contactECInfo);
                    break;
            }
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            /*Trace*/ debugLvl>5 && alert('***** saveRecord *****');
            var currentRecord = scriptContext.currentRecord;           
            var contactId = currentRecord.id;
            //After converting this script from SS1 to SS2, there seemed to be no way to differentiate between the user clicking 'Save' vs 'Save As'.
            //Investigation into this found that there is a hidden field used by NetSuite to make this differentiation and it is the state of
            //the multi-button (i.e. save drop down list).  So, we need to grab it here so we can process 'Save As' differently.
            var multibtn = currentRecord.getValue({fieldId: '_multibtnstate_'}); 
          
            PopulateContactObj(contactECInfo);
           
            var contactEmail = currentRecord.getValue({fieldId: 'email'});
            var contactFax = currentRecord.getValue({fieldId: 'fax'});
            var contactPhone = currentRecord.getValue({fieldId: 'phone'});
            var firstName = currentRecord.getValue({fieldId: 'firstname'});
            var lastName = currentRecord.getValue({fieldId: 'lastname'});
            var middleName = currentRecord.getValue({fieldId: 'middlename'});
            var contactJobRole = currentRecord.getValue({fieldId: 'custentity_jobarea'});                                         //  US738156
            var contactJobTitle = currentRecord.getValue({fieldId: 'title'});                                                     //  US738156
            var contactOrigin = currentRecord.getValue({fieldId: 'custentity_contact_origin'});                                   //  US364329
            var contactBusinessInterestType = currentRecord.getValue({fieldId: 'custentity_legit_business_interest_type'});       //  US364329
            var contactOriginOther = currentRecord.getValue({fieldId: 'custentity_other_contact_origin'});                        //  US364329
            var contactBusinessInterestTypeOther = currentRecord.getValue({fieldId: 'custentity_other_legit_business_interest'}); //  US364329
            var npsContact = currentRecord.getValue({fieldId: 'custentity_nps_contact'});
            var npsRole = currentRecord.getValue({fieldId: 'custentity_nps_role'});
            var npsEbscoType = currentRecord.getValue({fieldId: 'custentity_nps_ebsco_type'});
            var contactIsInactive = currentRecord.getValue({fieldId: 'isinactive'});                                              //  US423864
            var contactRole = currentRecord.getValue({fieldId: 'contactrole'});                                                   //  US423864
            var inactivationComments = currentRecord.getValue({fieldId: 'custentity_inactivation_comments'});                     //  Marketo Project
            var moveToMarketo = currentRecord.getValue({fieldId: 'custentity_move_to_marketo'});                                  //  Marketo Project
            var syncToMarketo = currentRecord.getValue({fieldId: 'custentity_sync_to_marketo'});                                  //  Marketo Project
            var globalSubscriptionStatus = currentRecord.getValue({fieldId: 'globalsubscriptionstatus'});                         //  US458450
            var contactCategory = currentRecord.getValue({fieldId: 'custentity_contact_category'});                               //  US249878
            var categoryCount = contactCategory.length;                                                                           //  US249878
            var contactSFID = currentRecord.getValue({fieldId: 'custentity_sf_contact_id'});                                      //  US471520
            var customerSFID = currentRecord.getValue({fieldId: 'custentity_sf_sourced_account_id'});                               //  US963983 + US966153
            var contactCustomer = currentRecord.getValue({fieldId: 'company'});                                                     //  US589464
            var grantAllECAccess = currentRecord.getValue({fieldId: 'custentity_grant_ec_accstatus_all'});                          //  US999227
            var revokeAllECAccess = currentRecord.getValue({fieldId: 'custentity_revoke_ec_accstatus_all'});                        //  US999227
            var enetOrderApproverStatus = currentRecord.getValue({fieldId: 'custentity_enet_ordapprove_status'});                   //  US631219
            var parentOEApproved = currentRecord.getValue({fieldId: 'custentity_parent_oeapproved'});
            
            /*Trace*/ debugLvl>99 && alert('contactId = ' + contactId + '\n' +
                'firstNameOnLoad = ' + firstNameOnLoad + '\n' +
                'middleNameOnLoad = ' + middleNameOnLoad + '\n' +
                'lastNameOnLoad = ' + lastNameOnLoad + '\n' +
                'firstName = ' + firstName + '\n' +
                'middleName = ' + middleName + '\n' +
                'lastName = ' + lastName + '\n' +
                'multibtn = ' + multibtn);

            /*Trace*/ debugLvl>5 && alert('IN SAVE RECORD START: ' + '\n' +
                'CaseMgt = ' + currentRecord.getValue('custentity_sf_case_mngmt_access_status') + '\n' +
                'DiscGrp = ' + currentRecord.getValue('custentity_sf_groups_access_status') + '\n' +
                'Academy = ' + currentRecord.getValue('custentity_sf_academy_access_status') + '\n' +
                'ClinDec = ' + currentRecord.getValue('custentity_sf_clinical_dec_access_status'));

            // US1058236: TA804430 - If current record will be overwritten by the 'Save As' because the Contact name has not
            // changed, then force the user to use 'Save' instead.  Otherwise, the upcoming logic to clear out important fields
            // on the new 'Save As' record will actually be wiping out this information on the original, overwritten Contact
            // which we don't want to happen. So, in this case, the 'Save As' will be prevented.
            if (multibtn != '' && multibtn.includes('submitas') &&
                firstNameOnLoad == firstName &&
                middleNameOnLoad == middleName &&
                lastNameOnLoad == lastName) {
                alert("If you want this Contact to be overwritten, you must use 'Save' rather than 'Save As'.");
                return false;
            }

            /* **************************
             *	Beginning of Validation *
             * **************************/
            //  Ensure that one of the following fields is populated: "Email", "Phone", "Fax" (EAbramo 05/22/07)
            if ((contactEmail == '' || contactEmail == null) && (contactFax == '' || contactFax == null) && (contactPhone == '' || contactPhone == null)){
                alert("Please enter an Email, Direct Phone or Fax for this contact.  You must enter an Email, Direct Phone or Fax to save this record");
                return false;
            }
            //  Contact with name "Default Contact"
            if (currentRecord.getValue({fieldId: 'entityid'}) == 'Default Contact'){
                alert('"Default Contact" is not a valid name for this contact.');
                return false;
            }
            //  Validate the following: (11/04/09)
            if (firstName.length > 30){
                alert('First Name must be 30 characters or less')
                return false;
            }
            if (lastName.length > 30){
                alert('Last Name must be 30 characters or less')
                return false;
            }
            if (middleName.length > 15){
                alert('Middle Name must be 15 characters or less')
                return false;
            }
            //  US423864 - Make last name mandatory //  US471520 - Improve last name validation
            if ((lastName == '' || lastName == null) || lastName.trim().length == 0){
                alert('Please add a Last Name for this Contact.');
                return false;
            }
            //  US738156 - Require a Job Title when Job Role is set to "Other"
            if (contactJobRole == L2Constants.LC2_JobRole.Other && (contactJobTitle == '' || contactJobTitle == null)){
                alert('This contact has a Job Role of "Other" and no Job Title.  Please enter a Job Title or change the Job Role');
                return false;
            }
            
            //  US364329 - GDPR Require 'Contact Origin' and 'Contact Legitimate Business Interest Type'
            // 			for all Contacts created since date of launch of GDP Project (May 9, 2018)
            // 			Fixed with TA784531
            var RequiresGDPRFields = false;
            if (!contactId){
            	RequiresGDPRFields = true;
            }
            else{
                // Get GDPR Launch Date
                var gdprLaunchDateRaw = new Date(2018, 4, 9, 0, 0, 0, 0);
                // Format and Parse Date
    	            var gdprLaunchDate_fmt = format.format({
    					  value: gdprLaunchDateRaw,
    					  type: format.Type.DATETIME
    				});
    	            var gdprLaunchDate_parsed = format.parse({
    					  value: gdprLaunchDate_fmt,
    					  type: format.Type.DATETIME
    				  	});
    	        // Get Date Created    
    	        var dateCreatedObj = search.lookupFields({
            	   type: 'contact',
            	   id: contactId,
            	   columns: ['datecreated']        	   
    	        });	        
    	        var dateCreatedRaw = dateCreatedObj.datecreated;
    	        // Format and Parse Date
               		var dateCreated_fmt = format.format({
               			value: dateCreatedRaw,
               			type: format.Type.DATETIME
               		});
               		var dateCreated_parsed = format.parse({
               			value: dateCreated_fmt,
               			type: format.Type.DATETIME
               		});
        	    
               	// alert('The value of dateCreated_parsed is '+dateCreated_parsed);	
               	// alert('The value of gdprLaunchDate_parsed is '+gdprLaunchDate_parsed);
               	// Compare Dates Mathematically	
                var compare_parsed_date = dateCreated_parsed - gdprLaunchDate_parsed;
                // alert('The value of compare_parsed_date is '+compare_parsed_date);            	
            	if(compare_parsed_date > 1){
            		RequiresGDPRFields = true;
            	}
            }  
            if (RequiresGDPRFields == true){
                if (contactOrigin == '' || contactOrigin == null){
                    alert('Contact records need a Contact Origin');
                    return false;
                }
                if (contactBusinessInterestType == '' || contactBusinessInterestType == null){
                    alert('Contact records need a Legitimate Business Interest');
                    return false;
                }
            }
           
            //  US364329 GDPR: Require "Other" field to be populated if "Contact Origin" is "Other"
            if (contactOrigin == L2Constants.LC2_ContactOrigin.Other && (contactOriginOther == '' || contactOriginOther == null)){
                alert('Other Contact Origin is required when Contact Origin of \'Other\' is selected');
                return false;
            }
            //  US423864 - Validate "Contact is Inactive" flag
            if (contactIsInactive == true){
        		//	US1040056 - Add in check for Approved/Revoked Access Statuses
                if (contactECInfo.hasECAccessApproveOrRevokeSet() == true){
                	alert('You cannot inactivate a contact who has an Access Status of "Approved" or "Revoked" as it is in the process of syncing with SalesForce. Please wait for the Access Status(es) to move to "Granted" and/or "Removed" and try again.');
                	return false;
                }
                //12-30-22:  US1051405 TA784078	Contact inactivation should not be allowed when portal user status is "Send Invitation"
                if (contactECInfo.EC_PUS == L2Constants.LC2_SF_PortalUser_sts.SendInv){
                	alert('You cannot inactivate a contact who has a Connect User Status of "Send Invitation" as it is in the process of sending out an email to the user. Please wait for the Connect User Status to move to "Invitation in Progress" and try again.');
                	return false;
                }
                //  Don't allow inactivation if Role is Primary (eAbramo 06/18/12)
                if (contactRole == '-10'){
                    alert("This contact cannot be inactivated because it is currently set as the Primary Contact.  You must first update the Contact Role by using the \'Update Primary\' button found within Contact section of the Customer record");
                    return false;
                }
                //  US1040056 - Refactored: Don't allow Flipster Renewal Contacts to be inactivated (US249878 09/08/17)
                if (contactCategory.includes('11') == true){
                    alert("This contact cannot be inactivated because it has an Operational Category of Flipster Renewal Contact.  Please consider updating another Contact to be the Flipster Renewal Contact. Once you remove the designation of this contact as Flipster Renewal Contact you can inactivate it");
                    return false;
                }
                //  US963983 and US966153 EC ReArch Contact Record Related Validation & Scripting
                //  Change "Granted" --> "Revoked"
                //  Change "Needs Review" --> "Denied" (Only needed for Case Management and Discussion Groups Access Status)
                    //  SF EC Access Level Fields
                if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_case_mngmt_access_status',
                        value: L2Constants.LC2_SF_EcAccessLevels_sts.Revoked,
                        ignoreFieldChange: true
                    });
                }
                else if (contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_case_mngmt_access_status',
                        value: L2Constants.LC2_SF_EcAccessLevels_sts.Denied,
                        ignoreFieldChange: true
                    });
                }
                if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_groups_access_status',
                        value: L2Constants.LC2_SF_EcAccessLevels_sts.Revoked,
                        ignoreFieldChange: true
                    });
                }
                else if (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_groups_access_status',
                        value: L2Constants.LC2_SF_EcAccessLevels_sts.Denied,
                        ignoreFieldChange: true
                    });
                }
                    //  Property Based Access Fields
                if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_academy_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                if (contactECInfo.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_enet_oa_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                if (contactECInfo.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_transition_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                if (contactECInfo.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_folio_cust_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                // US1259509 EBSCO Hosted FOLIO Access Status
                if(contactECInfo.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_hosted_folio_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                // 05-26-23:  US1113403 -  TA816837:  If Contact is inactivated, Clinical Decision Access should be revoked if granted
                if (contactECInfo.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Granted){
                    currentRecord.setValue({
                        fieldId: 'custentity_sf_clinical_dec_access_status',
                        value: L2Constants.LC2_Property_based_Access.Revoked,
                        ignoreFieldChange: true
                    });
                }
                //  Require user to leave Inactive Comments when inactivating a customer that was loaded as active
                //  Marketo Project (10/27/16)
                if (contactInactiveStatusOnLoad == false){
                    if (inactivationComments == '' || inactivationComments == null || inactivationComments.trim().length == 0){
                        alert('Please enter Inactivation Comments to save this record');
                        return false;
                    }
                }
                
            }   //  End of Contact Inactivation checks
            //  Move to Marketo Code (05/12/17)
            if (moveToMarketo == '1'){  //  '1' = "Yes"
                //  Handle the possiblity that this contact is being create and doesn't have an Internal ID yet
                var thisRecord = '';
                if (contactId == '' || contactId == null){
                    thisRecord = '1';
                }else{
                    thisRecord = contactId;
                }
                //  Create search to look for contacts with this email that are synced to Marketo
                var contactSearchResults = search.create({
                    type: search.Type.CONTACT,
                    filters: [
                        search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values : [thisRecord]
                        }),
                        search.createFilter({
                            name: 'email',
                            operator: search.Operator.IS,
                            values: contactEmail
                        }),
                        search.createFilter({
                            name: 'custentity_sync_to_marketo',
                            operator: search.Operator.IS,
                            values: true
                        })
                    ],
                    columns: ['internalid']
                }).run().getRange({start: 0, end: 1000});
                if (contactSearchResults.length > 0){
                    alert('At least one other contact exists in NetCRM with this email which is synced to Marketo. You must either choose to NOT move this contact to Marketo, or change the contact\'s email address');
                    return false;
                }
                //  If "Sync to Marketo" field is not set to True, set it.
                if (syncToMarketo != true){
                    currentRecord.setValue({
                        fieldId: 'custentity_sync_to_marketo',
                        value: true,
                        ignoreFieldChange: true
                    });
                }
            }
            
            //  Contact Category validation
            //  Certain Categories require email addresses on the Customer
            //  Contacts with a category of "ECM Contact" (ID = 1)
            if (contactCategory.includes(L2Constants.LC2_ContactOpCat.ECM) == true && (contactEmail == '' || contactEmail == null || contactEmail.trim().length == 0)){
                alert('Contacts with a Contact Category of ECM Contact must have an email address.  Please add an email address or change the Contact Category');
                return false;
            }
            //  Contacts with category of "Flipster Renewal Contact" (ID = 11)
            if (contactCategory.includes(L2Constants.LC2_ContactOpCat.FlipRenew) == true){
                if ((contactEmail == ''|| contactEmail == null)){
                    alert('Contacts with a Contact Category of Flipster Renewal Contact must have an email address.  Please add an email address or change the Contact Category');
                    return false;
                }
                //  Only one Contact under a specific customer can be specified as a "Flipster Renewal Contact" (10/13/2014)
                //  Build + Run a search to find other contacts under the customer with C.C. of "Flipster Renewal Contact"
                var thisCompany = currentRecord.getValue({fieldId: "company"});
                var thisRecord = contactId;
                //  Catching if the record has no ID (On Create)
                if (thisRecord == '' || thisRecord == null){
                    thisRecord = '1';
                }
                var searchResults = search.create({
                    type: search.Type.CONTACT,
                    filters: [
                        search.createFilter({
                            name: 'company',
                            operator: search.Operator.ANYOF,
                            values: [thisCompany]
                        }),
                        search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: [thisRecord]
                        }),
                        search.createFilter({
                            name: 'custentity_contact_category',
                            operator: search.Operator.ANYOF,
                            values: [L2Constants.LC2_ContactOpCat.FlipRenew]
                        })
                    ],
                    columns: ['internalid', 'entityid']
                }).run().getRange({start: 0, end: 1000});
                if (searchResults.length > 0){
                    for (var c = 0; c < searchResults.length; c++){
                        var flipContactName = searchResults[c].getValue({name: 'entityid'});
                        alert('There is already a Flipster Renewals Contact specified for this Customer. Either this Contact or '+flipContactName+' can be specified as the Flipster Renewal Contact, but not both.');
                    }
                    return false;
                }
            }
            //  US471520 - Validation for Email changes to a Contact with a SFID
            if (emailOnLoad != contactEmail.toLowerCase().trim() && (contactSFID != '' && contactSFID != null)){
                if (contactECInfo.emailAlreadyInUseInEC() == true) {
                	alert('ERROR***: There is already an EBSCO Connect user who uses this email. If you wish to pursue changing this email, please contact the following:  cwhitehead@ebsco.com for CustSat contacts, or smt@ebsco.com for Sales contacts. Original email will be reset.');
                    currentRecord.setValue({
                        fieldId: 'email',
                        value: emailOnLoad,
                        ignoreFieldChange: true
                    });
                    return false;
                }
            }
            //  US963983 + US966153 - Validates Customer and Email when EBSCO Connect access is given
            //  No SF Contact ID and has EC Portal Access
            if ((contactECInfo.EC_SFContactID == '' || contactECInfo.EC_SFContactID == null) && contactECInfo.hasCoreECAccess() == true){
                var EBSCOConnectValid = false;
                //  Active Contact w/ no SF ID and Customer's SF ID is not "CreateNew"
                if (contactIsInactive == false && (contactEmail != '' && contactEmail != null) && (customerSFID != '' && customerSFID != null && customerSFID != L2Constants.LC2_SF_createNew)){
                    var isEBSCOEmail = L2Utility.LU2_isEBSCOemail(contactEmail);
                    //  US589464 - Email is either NOT an EBSCO Domain OR it IS an EBSCO Domain & allowed Customer combination
                    if (isEBSCOEmail == false || (isEBSCOEmail == true && L2Constants.LC2_Customer.IsCustEBSCOSFPush(contactCustomer) == true)){
                        //  Check whether the email is a duplicate
                        if (contactECInfo.emailAlreadyInUseInEC() == false){
                            EBSCOConnectValid = true;
                        }
                    }
                }
                //  Check for validation fail + output error message if needed
                if (EBSCOConnectValid == false){
                    if (contactECInfo.hasCoreECAccess() == true){
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_case_mngmt_access_status',
                            value: contactECInfoOnLoad.EC_CaseMgtAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_groups_access_status',
                            value: contactECInfoOnLoad.EC_DiscGroupsAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_academy_access_status',
                            value: contactECInfoOnLoad.EC_AcademyAS,
                            ignoreFieldChange: true
                        });
                    }
                    if (contactECInfo.hasAdditionalECAccess() == true){
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_enet_oa_access_status',
                            value: contactECInfoOnLoad.EC_EnetOrderAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_folio_cust_access_status',
                            value: contactECInfoOnLoad.EC_FolioCustAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_transition_access_status',
                            value: contactECInfoOnLoad.EC_TransCustAS,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custentity_sf_clinical_dec_access_status',
                            value: contactECInfoOnLoad.EC_ClinicalDecAS,
                            ignoreFieldChange: true
                        });
                    }
                    alert ('The Contact is no longer eligible to be sent to EBSCO Connect. All Access Status fields have been reset to their original values');
                }
            }
            //  US631219 - If "Set EBSCONET Order Approver" button pressed ensure Contact still meets criteria to allow
            if (enetOrderApproverStatus == L2Constants.LC2_ContactENOrdApprovSts.Requested){
                if ((contactEmail == '' || contactEmail == null) || contactIsInactive == true || dupeEmailCheckENetOrderApprover(contactCustomer, contactId, contactEmail) == true){
                    currentRecord.setValue({
                        fieldId: 'custentity_enet_ordapprove_status',
                        value: enetOrderApproverStatusOnLoad,
                        ignoreFieldChange: true
                    });
                    alert ('This contact is no longer eligible to be an EBSCONET Order Approver.');
                }
            }
            //  US1034021 - Not allowing save while Resend Invitation checkbox has NOT yet been unchecked by BOOMI
            // 	If saving w/ resendInvitationOnLoad == true, we want:
            // 	- One access status (caseMan, discGroup, acad) == true
            // 	- Flag hasn't flipped (safety check)
            if (resendInvitationOnLoad == true && currentRecord.getValue({fieldId: 'custentity_resend_ec_invitation'}) == false){
                alert('This contact is in the process of syncing the "Resend Invitation" status to SalesForce. During this process you cannot change the "Resend Invitation" flag.');
                return false;
            }

            // US1058236:  TA803233 - If both Case Mgt and Groups Access were 'Needs Review', they can only be acted on together for 'Save' to be allowed.
            if(contactECInfoOnLoad.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev &&
               contactECInfoOnLoad.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev) {
                if ((contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved || contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Denied) &&
                     contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev) {
                        alert('Groups Access Access cannot be left as "Needs Review" if Case Management is "Approved" or "Denied".');
                        return false;
                } else if ((contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved || contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Denied) &&
                            contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev)  {
                                alert('Case Management Access cannot be left as "Needs Review" if Groups Access is "Approved" or "Denied".');
                                return false;
                }
            }

            //  US1035778 Development for Selecting Granular Access
            //  Possible Combinations of "Approved Access:
            //	    Academy
            //	    Academy + Groups
            //      Academy + Case Management
            // 	    Academy + Groups + Case Management
            //  Ensure that if Discussion Groups Access Status is set that Academy is as well
            if ((contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved && contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted) &&
                (contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved || contactECInfo.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted)){
                alert('A contact cannot have Discussion Groups Access Status of "Approved" without having an Academy Access Status of "Approved" or "Granted". The Academy Access Status has been set automatically to "Approved".');
                currentRecord.setValue({
                    fieldId: 'custentity_sf_academy_access_status',
                    value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                    ignoreFieldChange: true
                });
            }
            //  Ensure that if Case Management is set then Academy is set as well
            if ((contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved || contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted) &&
                (contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved && contactECInfo.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted)){
                alert('A contact cannot have Case Management Access Status of "Approved" without having an Academy Access Status of "Approved" or "Granted". The Academy Access Status has been set automatically to "Approved".');
                currentRecord.setValue({
                    fieldId: 'custentity_sf_academy_access_status',
                    value: L2Constants.LC2_SF_EcAccessLevels_sts.Approved,
                    ignoreFieldChange: true
                });
            }

            // US1138811 Alert user when giving Case Management Access where Contact is under FOLIO Partner Customer
            if(customerECInfo.isFolioPartner() && contactECInfoOnLoad.EC_CaseMgtAS != L2Constants.LC2_SF_EcAccessLevels_sts.Approved &&
                contactECInfoOnLoad.EC_CaseMgtAS != L2Constants.LC2_SF_EcAccessLevels_sts.Granted &&
                contactECInfo.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved){
                // lookup Parent-Child Relationships
                var childSearch = search.create({
                    type: 'customrecord_ec_parent_child_rel',
                    filters: [
                        search.createFilter({
                            name: 'custrecord_ec_parent_customer',
                            operator: search.Operator.ANYOF,
                            values: contactCustomer
                        })
                    ],
                    columns: ['custrecord_ec_child_customer']
                }).run().getRange({start: 0, end: 1000});
                var EntityName_concat_string = '';
                var singleEntityName = '';
                if (childSearch.length > 0) {
                    // iterate through array of results to get each Child Customer Internal ID. Lookup each by entity name
                    for (var i = 0; i < childSearch.length; i++){
                        var childId = childSearch[i].getValue({name: 'custrecord_ec_child_customer'});

                        var EntityNameLookup = search.lookupFields({
                                type: search.Type.CUSTOMER,
                                id: childId,
                                columns: ['entityid', 'companyname']
                            })
                        singleEntityName = '-- ' +EntityNameLookup.entityid + ' ' + EntityNameLookup.companyname;
                        // alert('singleEntityName is: '+singleEntityName);
                        if(i == 0){
                            EntityName_concat_string = singleEntityName;
                        }
                        else{
                            EntityName_concat_string = EntityName_concat_string + ',\n'+singleEntityName;
                        }
                    }
                }
                if(EntityName_concat_string == ''){
                    EntityName_concat_string = '[EBSCO Connect Parent-Child Relationships have NOT been defined]';
                }
                alert('EBSCO Connect Alert:  This contact\'s main customer is a FOLIO Partner.  Please ensure that the contact is affiliated with all appropriate FOLIO Partner child customers \n\n' +
                'The Child Relationships that have been defined are: \n'+
                EntityName_concat_string);
            }


            //  US1040056 - Check to see if "CXP Portal User Status" needs to be set to "Send Invitation"
            if ((contactECInfoOnLoad.hasCoreECAccess() == false && contactECInfo.hasCoreECAccess() == true) &&
                (contactECInfo.EC_PUS != L2Constants.LC2_SF_PortalUser_sts.UserAct && contactECInfo.EC_PUS != L2Constants.LC2_SF_PortalUser_sts.InvInProg && contactECInfo.EC_PUS != L2Constants.LC2_SF_PortalUser_sts.SendInv)){
                currentRecord.setValue({
                    fieldId: 'custentity_portal_user_status',
                    value: L2Constants.LC2_SF_PortalUser_sts.SendInv,
                    ignoreFieldChange: true
                });
            }
            
            //If Contact is just getting Approved for Academy (i.e. EC Access) then set the SF Contact ID to 'createNew' to signal Boomi to add it to SF
            //12-28-22:  US1051405-TA83609 Defect Fix - If the contact is being reactivated and re-approved for access, there is no need to createNew 
            //since it already exists in Salesforce, so check to make sure its not already a portal member (even an inactivated one) 
            if (contactECInfo.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Approved &&  
                contactECInfoOnLoad.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Approved &&
                contactECInfo.isECPortalMember() != true)  {
            		currentRecord.setValue({
                    fieldId: 'custentity_sf_contact_id',
                    value: L2Constants.LC2_SF_createNew,
                    ignoreFieldChange: true
                });            	
            }

            //  NEEDS TO BE LAST IN VALIDATION SECTION  <- Christine "not so wild about it".
            //  US1017301 - Logic to handle request to Match Displayed Academy Only User with Button
            //  If Match is Requested
            if (currentRecord.getValue({fieldId: 'custentity_academy_user_match_requested'}) == true){
                //  Get SRPM Record information
                var srpmId = currentRecord.getValue({fieldId: 'custpage_sr_id'});
                var srpmInfo = search.lookupFields({
                    type: 'CUSTOMRECORD_SR_PORTAL_MEMBER',
                    id: srpmId,
                    columns: ['custrecord_srpm_conversion_status']
                });
                var srpmConversionStatus = '';
                //  If there is a value returned
                if (L2Utility.LU2_isJSONEmpty(srpmInfo) == false){
                    srpmConversionStatus = srpmInfo['custrecord_srpm_conversion_status'][0].value;
                }
                //  Check to see if:
                //  Email was changed
                //  Company was changed
                //  SRPM's Conversion Status has changed
                if (
                    (customerOnLoad != currentRecord.getValue({fieldId: 'company'})) ||
                    (emailOnLoad != currentRecord.getValue({fieldId: 'email'})) ||
                    (srpmConversionStatus == L2Constants.LC2_SRPM_Conversion_Status.Converted)
                ){
                    alert("You cannot match this contact to the displayed Academy Only user. This may be due to: \n\n" +
                        "-- An Email Address change on the contact.\n" +
                        "-- A Customer change on the contact.\n" +
                        "-- The Academy Only User has been matched to another contact.\n\n" +
                        "For further issues, please contact CRMEscalation@EBSCO.com and include the contact's name and company. Thank you.");
                    currentRecord.setValue({
                        fieldId: 'custentity_academy_user_match_requested',
                        value: false,
                        ignoreFieldChange: true
                    });
                    currentRecord.getField({fieldId: 'email'}).isDisabled = false;
                    currentRecord.getField({fieldId: 'company'}).isDisabled = false;
                    return false;
                }
            }
            
            /* ********************
             *	End of Validation *
             * ********************/
            
            /* ******************************
             *	Fields auto-set during save *
             * ******************************/
            //  If contact is updated set Full Name to the First, Middle, and Last name (EAbramo 09/14/07)
            if (middleName == '' || middleName == null){
                currentRecord.setValue({
                    fieldId: 'entityid',
                    value: firstName + ' ' + lastName,
                    ignoreFieldChange: true
                });
            }
            else{
                currentRecord.setValue({
                    fieldId: 'entityid',
                    value: firstName + ' ' + middleName + ' ' + lastName,
                    ignoreFieldChange: true
                });
            }
            if (parentOEApproved == true){
                currentRecord.setValue({
                    fieldId: 'custentity_isupdated',
                    value: true,
                    ignoreFieldChange: true
                });
            }
            //  US999227 - ECReArch27: Ability to Resend an EBSCO Connect Invitation from within NetCRM
            if (grantAllECAccess == true){
                currentRecord.setValue({
                    fieldId: 'custentity_grant_ec_accstatus_all',
                    value: false,
                    ignoreFieldChange: true
                });
            }
            if (revokeAllECAccess == true){
                currentRecord.setValue({
                    fieldId: 'custentity_revoke_ec_accstatus_all',
                    value: false,
                    ignoreFieldChange: true
                });
            }
            //  US512945 New fields from Marketo to NetSuite
            //  Set "Hidden" flag indicating that a user changed the Global Subscription Service so Marketo doesn't update it in the future
            if (globalSubscriptionStatus == L2Constants.LC2_globalSubscriptionStatus.SoftOptIn && globalSubscriptionStatus != globalSubscriptionStatusOnLoad){
                currentRecord.setValue({
                    fieldId: 'custentity_user_set_gss_optin',
                    value: true,
                    ignoreFieldChange: true
                });
            }
            
            //  CXP
            //  Ensure SF ID and other data doesn't copy over in "Save As" scenarios.  Use the hidden NetSuite multi-button state field to 
            //  identify a 'Save As' vs a 'Save'
            
            if (multibtn != '' && multibtn.includes('submitas')) {
                /*Trace*/ debugLvl>99 && alert('---  ENTERING SAVE AS LOGIC ---');
                //  Reset the appropriate fields to either "" or False
                //02-21-23:  US1073168 - Added blanking out of Self-registered portal member id
                //05-23-23:  US1113403 - Added blanking out of Clinical Decisions Access Status
                var fieldsToSetToBlank = [
                    'custentity_enet_ordapprove_status',                                                                                                                    //  Primary Information
                    'custentity_contact_category',                                                                                                                          //  General Subtab
                    'custentity_muv_marketoleadid', 'custentity_move_to_marketo', 'custentity_muv_leadscore', 'custentity_muv_lastinterestingmomentdate',                   //  Marketo Subtab
                    'custentity_muv_interestingmoment', 'custentity_muv_syncfield_lastmodified', 'custentity_push_marketo_date', 'custentity_mkto_email_invalid_cause',     //  Marketo Subtab
                    'custentity_mkto_mktg_suspended_reason',                                                                                                                //  Marketo Subtab
                    'custentity_portal_user_status', 'custentity_sf_contact_id','custentity_sf_academy_access_status', 'custentity_sf_case_mngmt_access_status',            //  EBSCO Connect Subtab
                    'custentity_sf_groups_access_status', 'custentity_sf_enet_oa_access_status', 'custentity_sf_folio_cust_access_status',                                  //  EBSCO Connect Subtab
                    'custentity_sf_transition_access_status', 'custentity_sf_clinical_dec_access_status', 'custentity_sf_self_reg_portal_member_id'                                                                                                                //  EBSCO Connect Subtab
                ];
                
                var fieldsToSetToFalse = [
                    'custentity_sync_to_marketo', 'custentity_mkto_email_invalid', 'custentity_mkto_marketing_suspended', 'custentity_mkto_unsubscribed',    //  Marketo Subtab
                    'custentity_resend_ec_invitation', 'custentity_grant_ec_accstatus_all', 'custentity_revoke_ec_accstatus_all',                            //  EBSCO Connect Subtab
                    'custentity_sf_access_update_handling'                                                                                                   //  EBSCO Connect Processing
                ];
               
                for (var f=0; f<fieldsToSetToBlank.length; f++){
                    currentRecord.setValue({
                        fieldId: fieldsToSetToBlank[f],
                        value: '',
                        ignoreFieldChange: true
                    });
                }
               
                for (var x=0; x<fieldsToSetToFalse.length; x++){
                    currentRecord.setValue({
                        fieldId: fieldsToSetToFalse[x],
                        value: false,
                        ignoreFieldChange: true
                    });
                }
                
            }            
            /*Trace*/ debugLvl>5 && alert('AT END OF SAVE RECORD: ' + '\n' +
                'CaseMgt = ' + currentRecord.getValue('custentity_sf_case_mngmt_access_status') + '\n' +
                'DiscGrp = ' + currentRecord.getValue('custentity_sf_groups_access_status') + '\n' +
                'Academy = ' + currentRecord.getValue('custentity_sf_academy_access_status') + '\n' +
                'ClinDec = ' + currentRecord.getValue('custentity_sf_clinical_dec_access_status'));


            /* *************************************
             *	End of Fields auto-set during save *
             * *************************************/
            return true;
        }

        /**
         * Function to load the EBSCO Connect Information into the L2_ContactECObj object from Library2_ECAccess
         *
         * @param {object} contactRec - the contact Record
         * @param {object} contactObj - the L2_ContactECObj from Library2_ECAccess
         * @returns {object} contactObj updated with values
         * @since 2022.11
         * */
        function PopulateContactObj(contactObj) {
            /*Trace*/ debugLvl>5 && alert('***** PopulateContactObj *****');
            //06-02-23: US1113403 - Added assignment of Clinical Decisions Access Status
            contactObj.EC_CaseMgtAS 		    = currentRecord.getValue('custentity_sf_case_mngmt_access_status');
            contactObj.EC_DiscGroupsAS 		    = currentRecord.getValue('custentity_sf_groups_access_status');
            contactObj.EC_AcademyAS 		    = currentRecord.getValue('custentity_sf_academy_access_status');
            contactObj.EC_ClinicalDecAS 		= currentRecord.getValue('custentity_sf_clinical_dec_access_status');
            contactObj.EC_EnetOrderAS 		    = currentRecord.getValue('custentity_sf_enet_oa_access_status');
            contactObj.EC_FolioCustAS 		    = currentRecord.getValue('custentity_sf_folio_cust_access_status');
            contactObj.EC_TransCustAS 		    = currentRecord.getValue('custentity_sf_transition_access_status');
            contactObj.EC_FoHostedByEbscoAS     = currentRecord.getValue('custentity_hosted_folio_access_status'); // US1259509
            contactObj.EC_PUS 				    = currentRecord.getValue('custentity_portal_user_status');
            contactObj.EBSCONetApproverStatus   = currentRecord.getValue('custentity_enet_ordapprove_status');
            contactObj.EC_SFContactID			= currentRecord.getValue('custentity_sf_contact_id');
            contactObj.Email					= currentRecord.getValue('email');
            contactObj.InternalId				= currentRecord.id;
        }

        /**
         * Function to load the EBSCO Connect related Customer Information into the L2_CustomerECObj from Library2_ECAccess
         *
         * @param {object} contactRec - the contact Record
         * @param {object} contactObj - Contact's Parent Company Internal ID
         * @returns {object} customerObj updated with values
         * @since 2022.11
         * */
         function PopulateCustomerObj(customerId, CustomerObj){
            /*Trace*/ debugLvl>5 && alert('***** PopulateCustomerObj *****' + '\n' + 'customerId is: ' + customerId);
            //06-02-23: US1113403 - Added retrieval of Clinical Decisions Customer indicator and refactored this search code
            // US1259509 5-8-2024 - Added FOLIO Hosted By EBSCO into the CustomerObj and populate its value
            var custLookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['custentity_sf_account_id',
                    'custentity_folio_cust',
                    'custentity_clinical_decisions_cust',
                    'custentity_refctr_transition_status',
                    'custentity_explora_transition_status',
                    'custentity_ehost_transition_status',
                    'custentity_eds_transition_status',
                    'custentity_folio_partner', // US1138811
                    'custentity_folio_hosted_by_ebsco'] // US1259509
            });

            //Javascript error will be thrown below when trying to assign transition center values from fields that don't exist on
            //the Customer (i.e. certain transitions never initialized or set on the Customer in SB3 & Prod).  So need to check for presence of a value
            //first, indicated by a length > 0, before trying to assign.

            for (var key in custLookup){
                if (custLookup.hasOwnProperty(key)){
                    switch(key) {
                        case 'custentity_folio_cust':
                            CustomerObj.FolioFlag = custLookup.custentity_folio_cust;
                            break;
                        case 'custentity_clinical_decisions_cust':
                            CustomerObj.ClinicalDecFlag = custLookup.custentity_clinical_decisions_cust;
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
                        // US1259509 added below
                        case 'custentity_folio_hosted_by_ebsco':
                            CustomerObj.FoHostedByEBSCO = custLookup.custentity_folio_hosted_by_ebsco;
                            break;
                    }
                }
            }
            CustomerObj.SFAcctID = custLookup.custentity_sf_account_id;
        }

        /**
         * Function to compare EBSCO Connect Access Status changes
         * @param {string} newStatus - The New Access Status
         * @param {string} oldStatus - The Old Access Status
         * @param {string} fieldName - The Name of the Field
         * @return {boolean}
        * */
        function isNewAccessStatusAllowed (newStatus, oldStatus, fieldName){
            /*Trace*/ debugLvl>99 && alert('***** isNewAccessStatusAllowed *****' + '\n' +
        			' newStatus = ' + newStatus + '\n' +
        			' oldStatus = ' + oldStatus + '\n' +
            		' fieldName = ' + fieldName);
            var allowedViaUI = false;
            const LC2_SF_EcAccessNames_sts = [
        		"Requested",		
        		"Needs Review",	
        		"Approved",		
        		"Inactivated",	
        		"Granted",		
        		"Denied",		
        		"Revoked",		
        		"Removed"		
        		];
            
            const LC2_Property_based_names = [ 
            		"Approved",
            		"Granted",
            		"Revoked",
            		"Inactive",
            		"Removed"
            		];
            
            var oldStatusName = null;
            var newStatusName = null;
                                   
            //06-02-23: US1113403 - Added check of Clinical Decisions Access Status which uses property based status list
            if (fieldName == 'Academy Access Status' || fieldName == 'Clinical Decisions Access Status') {
            	 if (L2Constants.LC2_Property_based_Access.IsValidUISelection(newStatus) == true) {
            		//Get status text name for values
            		 oldStatusName = (oldStatus > 0) ? LC2_Property_based_names[oldStatus - 1] : "blank";
                	 newStatusName = (newStatus > 0) ? LC2_Property_based_names[newStatus - 1] : "blank";
                     /*Trace*/ debugLvl>99 && alert('newStatusName = ' + newStatusName + '\n' +
                 			                        'oldStatusName = ' + oldStatusName);
                	 switch (oldStatus){            	 	
                	 	case '':
                	 	case null:                 	 		
    	             		if (newStatus == L2Constants.LC2_Property_based_Access.Approved ||
    	             			newStatus == 0) 
    	             				allowedViaUI = true;
    	             		break;
    	             		
                	 	case L2Constants.LC2_Property_based_Access.Removed:
    	             		if (newStatus == L2Constants.LC2_Property_based_Access.Approved) allowedViaUI = true;
    	             		break;
                 		
                	 	case L2Constants.LC2_Property_based_Access.Granted:
                	 		if (newStatus == L2Constants.LC2_Property_based_Access.Revoked) allowedViaUI = true;
                	 		break;
                 	            	
                	 	default:                	 	
                	 		break;
                	 } 
                	 if (allowedViaUI == false) {  
                      	alert('An access status change to ' + newStatusName + ' is not allowed. The original status at the time the Contact was loaded for editing will be reinstated.');
                      } 
            	 }
            	 else alert('Invalid access status selected');
            }
            else {
                 //02-14-23:  US1073168 TA797213	Verified that IsValidUISelection method does not allow "Required" as UI selection
            	 if (L2Constants.LC2_SF_EcAccessLevels_sts.IsValidUISelection(newStatus) == true) {
            		 //Get status text name for values
                	 oldStatusName = (oldStatus > 0) ? LC2_SF_EcAccessNames_sts[oldStatus - 1] : "blank";
                	 newStatusName = (newStatus > 0) ? LC2_SF_EcAccessNames_sts[newStatus - 1] : "blank";	
                     /*Trace*/ debugLvl>99 && alert(' newStatusName = ' + newStatusName + '\n' +
                  			                        ' oldStatusName = ' + oldStatusName);
                	 switch (oldStatus){	             
    	             	case '':
    	             	case null:
    	             		if (newStatus == L2Constants.LC2_SF_EcAccessLevels_sts.Approved ||
    	             			newStatus == 0) 
    	             				allowedViaUI = true;
    	             		break;
    	             		
    	             	case L2Constants.LC2_SF_EcAccessLevels_sts.Denied:
    	             	case L2Constants.LC2_SF_EcAccessLevels_sts.Removed:  
    	             		if (newStatus == L2Constants.LC2_SF_EcAccessLevels_sts.Approved) allowedViaUI = true;
    	             		break;
    	             		
    	             	case L2Constants.LC2_SF_EcAccessLevels_sts.Granted:
    	             		if (newStatus == L2Constants.LC2_SF_EcAccessLevels_sts.Revoked) allowedViaUI = true;
    	             		break;
    	             	            	
    	             	case L2Constants.LC2_SF_EcAccessLevels_sts.NeedsRev:
    	             		if (newStatus == L2Constants.LC2_SF_EcAccessLevels_sts.Approved || 
    	             			newStatus == L2Constants.LC2_SF_EcAccessLevels_sts.Denied) allowedViaUI = true;
    	             		break;
    	             		
    	             	default:
    	             		break;
    	             } 
                	 if (allowedViaUI == false) {  
                     	alert('An access status change to ' + newStatusName + ' is not allowed. The original status at the time the Contact was loaded for editing will be reinstated.');
                     } 
            	 }
            	 else alert('Invalid access status selected');
            }
           
            
            
            return(allowedViaUI);
        }

        /**
         * Function to determine whether Contact email is duplicate of another Active Contact
         * @param {string} contactIdIn - The contact's internal ID
         * @param {string} emailIn - The contact's email
         * @param {string} contextIn - "EBSCO Connect", "EBSCONet", "Match with Academy Only User", etc. - The reason for doing the check
         * */
        function dupeEmailCheckAllActiveContacts(contactIdIn, emailIn, contextIn){
            /*Trace*/ debugLvl>99 && alert('***** dupeEmailCheckAllActiveContacts *****');
            var email = emailIn.trim().toLowerCase();
            var contactsOutput = new Array();
            var contactId = contactIdIn;
            var mainString = '';
            var returnString = '';
            // If no internal ID passed in, set to default value of "1" so that we can still run the search
            if (contactId == '' || contactId == null){
                contactId = '1';
            }
            if (email.length != 0){
                var contactSearchResults = search.create({
                    type: search.Type.CONTACT,
                    filters: [
                        search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: [contactId]
                        }),
                        search.createFilter({
                            name: 'formulatext',
                            formula: 'LOWER({email})',
                            operator: search.Operator.IS,
                            values: [email]
                        }),
                        search.createFilter({
                            name: 'isinactive',
                            operator: search.Operator.IS,
                            values: false
                        })
                    ],
                    columns: ['internalid', 'entityid', 'company']
                }).run().getRange({start: 0, end: 1000});
                if (contactSearchResults.length > 0){
                    for (var x = 0; x<contactSearchResults.length; x++){
                        var contactCompany = contactSearchResults[x].getValue({name: 'company'});
                        var contactCustomerName = '';
                        var contactCustomerId = '';
                        var tempString = '';
                        if (contactCompany != '' && contactCompany != null){
                            var customerInfo = search.lookupFields({
                                type: search.Type.CUSTOMER,
                                id: contactCompany,
                                columns: ['entityid', 'companyname']
                            });
                            contactCustomerId = customerInfo.entityid;
                            contactCustomerName = customerInfo.companyname;
                        }
                        else{
                            contactCustomerId = '[Unknown: ';
                            contactCustomerName = 'The Customer was removed from this Contact]';
                        }
                        tempString = 'Contact ' + (x+1) + ' found is: ' + contactSearchResults[x].getValue({name: 'entityid'}) + ' under customer ' + contactCustomerId + ': '+ contactCustomerName+'\n';
                        mainString = mainString + tempString;
                    }
                    if (contactSearchResults.length == 1){
                        //  US943090    Added in logic for Match with Displayed Academy Only User button
                        if (contextIn == 'Matching with Academy Only User'){
                            returnString = 'Please be aware that 1 other active contact exists in NetCRM which shares this same email address.  Before saving, please ensure you are matching the Academy Only User to the correct Contact.\n\n' + mainString;
                        }
                        else{
                        alert('Please be aware that 1 other active contact exists in NetCRM which shares this same email address.  Before saving, please ensure you are giving '+contextIn+' access to the correct Contact');
                        }

                    }else{
                        //  US943090    Added in logic for Match with Displayed Academy Only User button
                        if (contextIn == 'Matching with Academy Only User'){
                            returnString += 'Please be aware that '+contactSearchResults.length+' other active contacts exist in NetCRM which share this same email address.  Before saving, please ensure you are matching the Academy Only User to the correct Contact.\n\n' + mainString;
                        }
                        else{
                        alert('Please be aware that '+contactSearchResults.length+' other active contacts exist in NetCRM which share this same email address.  Before saving, please ensure you are giving '+contextIn+' access to the correct Contact');
                    }
                    }
                    // Alert the user with the information about the Dupe Contacts
                    if (contextIn != 'Matching with Academy Only User'){
                    alert(mainString);
                }
                }
                //  US1040056 - Set emailCheckPerformed to true
                emailCheckPerformed = true;
                if (contextIn == 'Matching with Academy Only User'){
                    return returnString;
                }
            }
        }

        /**
         * Function to determine whether Contact email is duplicate of another Active Contact already in SF
         * @param {string} customerIdIn - The customer's internal ID
         * @param {string} contactIdIn - The customer's internal ID
         * @param {string} emailIn - The contact's email
         * @returns {boolean} - True if dupe is found, False if no dupes found
         * */
        function dupeEmailCheckENetOrderApprover(customerIdIn, contactIdIn, emailIn){
            /*Trace*/ debugLvl>99 && alert('***** dupeEmailCheckENetOrderApprover *****');
            var email = emailIn.trim().toLowerCase();
            //  Want to look for Contacts w/ the same Email under the customer w/ an EBSCONET Order Approver Status
            //  indicating that they are (or are in the process of becoming) an EBSCONET Order Approver
            var searchResults = search.create({
                type: search.Type.CONTACT,
                filters: [
                    search.createFilter({
                        name: 'company',
                        operator: search.Operator.IS,
                        values: customerIdIn
                    }),
                    search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.NONEOF,
                        values: [contactIdIn]
                    }),
                    search.createFilter({
                        name: 'formulatext',
                        formula: 'LOWER({email})',
                        operator: search.Operator.IS,
                        values: email
                    }),
                    search.createFilter({
                        name: 'custentity_enet_ordapprove_status',
                        operator: search.Operator.NONEOF,
                        values: ['@NONE@', L2Constants.LC2_ContactENOrdApprovSts.Revoked, L2Constants.LC2_ContactENOrdApprovSts.CallFail]
                    })
                ],
                columns: ['internalid']
            }).run().getRange({start: 0, end: 1000});
            if (searchResults.length > 0){
                return true;
            }
            return false;
        }

        /**
         * Function to initially set the enablement of individual access fields and checkbox actions onLoad of Contact record
         * */
        function InitializeStatusActionStates() {
            /*Trace*/ debugLvl>5 && alert('***** InitializeStatusActionStates *****');

            if (L2Constants.LC2_Role.isRoleModifyEC_Contact(userRole) == true) {
                disableIndAction = false;       //Allow individual status field setting

                //See if it's the inital EC grant AND the contact statuses make it elibible to be granted all core access
                if ((contactECInfoOnLoad.EC_SFContactID == '' || contactECInfoOnLoad.EC_SFContactID == null) &&
                    contactECInfoOnLoad.eligibleForGrantAllCheckbox() == true) {
                    disableGrantCore = false;   //Allow grant core access checkbox setting
                }
                else disableGrantCore = true;   //Do not allow grant core access checkbox setting
            }
            else if (L2Constants.LC2_Role.isRoleClinicalDecSupport(userRole) == true &&
                     customerECInfo.isClinicalDecCustomer() == true) {
                     disableIndAction = false;   //Allow individual Clinical Decision status field(s) setting
            }
            else disableIndAction = true;       //Do not allow any individual status field setting

            //If the user has modify EC power & the contact statuses make it elibible to for revoke all be granted all core access
            if (L2Constants.LC2_Role.isRoleModifyEC_Contact(userRole) == true &&
                contactECInfoOnLoad.eligibleForRevokeCheckbox() == true) {
                disableRevokeAll = false;
            }
            else disableRevokeAll = true;

            if ((L2Constants.LC2_Role.isRoleModifyEC_Contact(userRole) == true ||
                    L2Constants.LC2_Role.isRoleResendInvitationECContact(userRole) == true ||
                    (L2Constants.LC2_Role.isRoleClinicalDecSupport(userRole) == true &&
                        contactECInfoOnLoad.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Granted)) &&
                contactECInfoOnLoad.eligibleForResendCheckbox() == true) {
                disableResend = false;
            }
            else disableResend = true;

            //US1091667: TA808652 - No EC access status fields may be changed if PUS is 'Invitation Expired'. Only thing that is
            //allowed is Resend invitation.
            if (portalUserStatusOnLoad == L2Constants.LC2_SF_PortalUser_sts.InvExpir) {
                disableIndAction = true;
                disableGrantCore = true;
                disableRevokeAll = true;
            }

            initStatusActionStates.GrantCoreDisabled  = disableGrantCore;
            initStatusActionStates.RevokeAllDisabled  = disableRevokeAll;
            initStatusActionStates.ResendInvDisabled  = disableResend;
            initStatusActionStates.IndividualDisabled = disableIndAction;

            /*Trace*/ debugLvl>5 && alert('disableIndAction = ' + disableIndAction + '\n' +
                'disableGrantCore = ' + disableGrantCore + '\n' +
                'disableRevokeAll = ' + disableRevokeAll + '\n' +
                'disableResend = ' + disableResend 			);
         }

        /**
         * Function to determine whether the Access Status fields should be editable or not
         *
         * */
        function CheckDynamicECAccessConditions(contactECData) {
            /*Trace*/ debugLvl>5 && alert('***** CheckDynamicECAccessConditions *****' + '\n' +
        			'onLoadECAccessEditsPossible = ' + onLoadECAccessEditsPossible + '\n' +
                    'contactECData.Email = ' + contactECData.Email + '\n' +
        			'disableIndAction = ' + disableIndAction + '\n' +
                    'disableGrantCore = ' + disableGrantCore + '\n' +
                    'disableRevokeAll = ' + disableRevokeAll + '\n' +
        			'disableResend = ' + disableResend 			);
        	
            //Start by assuming all EC fields are disabled until proven otherwise
                        currentRecord.getField({fieldId: 'custentity_sf_academy_access_status'}).isDisabled = true;		//  Academy Access Status
                        currentRecord.getField({fieldId: 'custentity_sf_case_mngmt_access_status'}).isDisabled = true;		//  Case Management Access Status
                        currentRecord.getField({fieldId: 'custentity_sf_groups_access_status'}).isDisabled = true;  		//  Discussion Groups Access Status
            currentRecord.getField({fieldId: 'custentity_sf_clinical_dec_access_status'}).isDisabled = true;  	//  Clinical Decisions Access Status
            currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = true;           //  Grant ALL EBSCO Connect Access
            currentRecord.getField({fieldId: 'custentity_revoke_ec_accstatus_all'}).isDisabled = true;          //  Revoke ALL EBSCO Connect Access
            currentRecord.getField({fieldId: 'custentity_resend_ec_invitation'}).isDisabled = true;             //  Resend Invitation
       			 	
            //First, double-check that static onLoad conditions were met to make EC Access editing possible at all. If not, leave everthing disabled
            if (onLoadECAccessEditsPossible == true) {
                //Next, since email may have been changed, check to see if the current email is already in use in EC as an EC NS Verified
                //User OR an Self-registered SRPM. We can only enable fields if the email is NOT already in use
                if (contactECData.emailAlreadyInUseInEC() != true) {
                    // Check settings for individual access, GrantCore, RevokeAll and resend.  As each setting is reviewed, the associated
                    // fields will be enabled if appropriate.  Otherwise, leave the associated fields as disabled.
                    if (disableIndAction != true) {
                        // GCS Support Mgr-Admin will have all individual accesses enabled, EXCEPT for Clinical Decisions Access
                        if (L2Constants.LC2_Role.isRoleModifyEC_Contact(userRole) == true) {
                            currentRecord.getField({fieldId: 'custentity_sf_academy_access_status'}).isDisabled = false;		//  Academy Access Status
                            currentRecord.getField({fieldId: 'custentity_sf_case_mngmt_access_status'}).isDisabled = false;	//  Case Management Access Status
                            currentRecord.getField({fieldId: 'custentity_sf_groups_access_status'}).isDisabled = false;  		//  Discussion Groups Access Status
	            	}
                        // Clinical Decisions Support Team will only have individual Clinical Dec access enabled
                        // US1099670 - TA826284	 Allow "Administrator" role to be recognized as also having Clinical Dec Access field
                        // edit access. "Administrator" has been added as 'true' for the isRoleClinicalDecSupport.
                        // US1099670 -  TA827239 Do NOT allow any role (including "Administrator") to edit Clinical Dec Access
                        // field if the Customer is NOT a Clinical Dec customer.
                        if (L2Constants.LC2_Role.isRoleClinicalDecSupport(userRole) == true &&
                            customerECInfo.isClinicalDecCustomer() == true)  {
                            currentRecord.getField({fieldId: 'custentity_sf_clinical_dec_access_status'}).isDisabled = false;
                        }
            		}

                    if(disableGrantCore != true) {
                        /*Trace*/debugLvl > 5 && alert('--- enabling Grant all core access checkbox');
                                currentRecord.getField({fieldId: 'custentity_grant_ec_accstatus_all'}).isDisabled = false;
                        }
                          
                    if(disableRevokeAll != true) {
                        /*Trace*/debugLvl > 5 && alert('--- enabling RevokeAll checkbox');
                                currentRecord.getField({fieldId: 'custentity_revoke_ec_accstatus_all'}).isDisabled = false;
    	                }

                        if (disableResend != true){
                        /*Trace*/debugLvl > 5 && alert('--- enabling Resend invite checkbox');
                                    currentRecord.getField({fieldId: 'custentity_resend_ec_invitation'}).isDisabled = false;
                                }
                            }
                        }
                    }

        //  US943090 - Function to handle "Match with Displayed Academy Only User" button
        function matchWithDisplayedAcademyOnlyUserButton(){
            /*Trace*/ debugLvl>99 && alert('***** matchWithDisplayedAcademyOnlyUserButton *****');
            //  Check for contacts with matching emails
            var contactRecord = currentRec.get();
            var contactId = contactRecord.id;
            var contactEmail = contactRecord.getValue({fieldId: 'email'});
            var returnString = dupeEmailCheckAllActiveContacts(contactId, contactEmail, 'Matching with Academy Only User');
            var c = confirm(returnString + '\n\nAre you matching the Academy Only user to the correct contact? If so, please click "Ok". If not, please click "Cancel". \n\n WARNING: The existing Academy Only User in EBSCO Connect will be updated with the name and institution of this Contact.');
            if (c == false){
                return false
            }
            contactRecord.setValue({
                fieldId: 'custentity_academy_user_match_requested',
                value: true,
                ignoreFieldChange: true
            });
            contactRecord.getField({fieldId: 'email'}).isDisabled = true;           //TODO: Why are we disabling?
            contactRecord.getField({fieldId: 'company'}).isDisabled = true;         //TODO: Why are we disabling?
            alert('Please remember to save this record to process this request.');
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            matchWithDisplayedAcademyOnlyUserButton: matchWithDisplayedAcademyOnlyUserButton
        };
});
