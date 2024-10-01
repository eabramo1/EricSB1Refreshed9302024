/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/* Script:     UserEvent2_customer_after_submit.js
 *
 * Created by: Jeff Oliver
 *
 * Library Scripts Used:	library2_constants
 *
 * Revisions:  
 *	JOliver  	05/18/2022	TA714097 Original version (Trigger contact updates for FOLIO customers)
 *	ZScannell	05/27/2022	TA714491 Transition Status Updated (Trigger contact updates for EBSCO Connect Customers)
 *	eAbramo		09/16/2022	TA754012 (of US1010164) Fix Defects for EBSCO Connect ReArch (Need to set 'Access Update Needs Handling' flag)
 *	ZScannell	10/17/2022	TA763249 (of US1028664) Fix Defects for EBSCO Connect ReArch (Need to set 'Contact Last Modified' flag)
 *	ZScannell	11/01/2022	US1031367 TA768000 Transition Center Access Defect Fix: PUS = "Invitation Expired" Contacts receiving access statuses
 * 	ZScannell	11/08/2022	DE73375	Transition Center Access Status Issue
 * 	ZScannell	03/12/2023	US1081830 Fixing error with setting Last Modified By to "System User"
 *	eAbramo		04/29/2024	US1240633 Scripting to apply EBSCO Hosted FOLIO Access Status Part 2
 * 	ZScannell	05/31/2024	US1240757	Fixing error with EBSCO Hosted FOLIO Scheduled Script triggering FOLIO Customer logic
 *
*/
		
	define(['N/record', 
		'/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 
		'N/email',
		'N/search',
		'N/error',
		'/SuiteScripts/EIS Custom Scripts2/Library2/library2_customer',
		'N/runtime',
		'/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
	/**
	 * @param {record} record
	 */		

function(record, LC2Constant, email, search, error, L2Customer, runtime, utility) {

		/**
		 * Function definition to be triggered before record is submitted.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @param {string} scriptContext.type - Trigger type
		 * @Since 2015.2
		 */


		function afterSubmit(scriptContext) {

			//loading constant variables, I believe this is to just save typing?

			var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
			var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
			var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
			var LC2_prop_access = LC2Constant.LC2_Property_based_Access;  // Global variable holding Property-based Access Status list values
			var LC2_SF_EcAccessLevels_sts = LC2Constant.LC2_SF_EcAccessLevels_sts;	// Global variable holding SF EC Access Levels list values
			var LC2_Transition_sts = LC2Constant.LC2_Transition_sts;	// Global variable holding the Transition Status list values
			var emailSent = false; // Indicates whether error email sent
			var currentUser = runtime.getCurrentUser();	// TA763249 (of US1028664) - Fix defects for EBSCO Connect ReArch (Need to set 'Contact Last Modified By' flag)
			var lastEditEmployee = "";
			// Global Constant: propParameter: Used to store constant values for updating Property Bases Access Statuses in Contact Records
			//	US1240633
			var propParameter = {
				description:	null,			// to store a description of the action that we're taking for log purposes
				UI_searchid:	null,			// to store search ID of the search to find contacts under the customer
				accStatusFieldToUpdate: null,	// to store the Property Based Access Status field that we want to update
				propBasedValue: null,			// to store the value of the Access Status
				propBasedValueText:	null,		// to store the text value of the Access Status
				errorText:		null			// to store part of an error email - when emailing team Mercury upon error
			};

			log.debug({
				title: 'currentUser init',
				details: currentUser.id
			});

			// UserEvent is NOT create
			if (scriptContext.type != scriptContext.UserEventType.CREATE) {
				// Retrieve Old & New Details

				var oldRecord = scriptContext.oldRecord;
				var newRecord = scriptContext.newRecord;

				var oldFolioCust = oldRecord.getValue({fieldId: 'custentity_folio_cust'});
				var newFolioCust = newRecord.getValue({fieldId: 'custentity_folio_cust'});
				//	US1240757 - Handling situation where one of these fields we're submitted as part of the Scheduled Script
				//	If field not submitted, revert to original value
				if(typeof(newFolioCust) == 'undefined' || newFolioCust === '' || newFolioCust === null){
					log.debug('newFolioCust came in as undefined');
					newFolioCust = oldFolioCust;
				}
				var newSFID = newRecord.getValue({fieldId: 'custentity_sf_account_id'});
				var oldFolioHostedByEBSCO = oldRecord.getValue({fieldId: 'custentity_folio_hosted_by_ebsco'}); // US1240633
				var newFolioHostedByEBSCO = newRecord.getValue({fieldId: 'custentity_folio_hosted_by_ebsco'}); // US1240633
				//	US1240757 - Handling situation where one of these fields we're submitted as part of the Scheduled Script
				//	If field not submitted, revert to original value
				if(typeof(newFolioHostedByEBSCO) == 'undefined' || newFolioHostedByEBSCO === '' || newFolioHostedByEBSCO === null){
					log.debug('newFolioHostedByEBSCO came in as undefined');
					newFolioHostedByEBSCO = oldFolioHostedByEBSCO
				}

				var CustInternalID = newRecord.getValue({fieldId: 'id'});
				log.debug('CustInternalID', CustInternalID);
				log.debug('newSFID', newSFID);
				log.debug('oldFolioCust', oldFolioCust);
				log.debug('typeof oldFolioCust', typeof(oldFolioCust));
				log.debug('newFolioCust', newFolioCust);
				log.debug('typeof newFolioCust', typeof(newFolioCust));
				log.debug('oldFolioHostedByEBSCO', oldFolioHostedByEBSCO);
				log.debug('typeof oldFolioHostedByEBSCO', typeof(oldFolioHostedByEBSCO));
				log.debug('newFolioHostedByEBSCO', newFolioHostedByEBSCO);
				log.debug('typeof newFolioHostedByEBSCO', typeof(newFolioHostedByEBSCO));
				//	US1081830
				// 	Needed as FOLIO Unset is scheduled and the "Current User" is the Unknown User (-4) that will error out the submitFields
				if (currentUser.id == LC2Constant.LC2_UnknownUser) {
					lastEditEmployee = LC2Constant.LC2_Employee.SystemUser;
				} else {
					lastEditEmployee = currentUser.id;
				}

				//Run when FOLIO Customer changes from False to True AND SF ID is present
				if (oldFolioCust == false && newFolioCust == true && (newSFID != '' && newSFID != null)) {
					// All code inside this statement altered for US1240633 call function to load values into propParameter
					populate_PropBasedAccessParameters('FolioCustomerSet');
					// call function to update the Property-Based Access Status values for relevant Contacts under this customer
					updatePropertyBasedForEligibleContacts(propParameter, CustInternalID, lastEditEmployee);
				}
				//Run when FOLIO Customer changes from True to False AND SF ID is present
				else if (oldFolioCust == true && newFolioCust == false && (newSFID != '' && newSFID != null)) {
					// All code inside this statement altered for US1240633 call function to load values into propParameter
					populate_PropBasedAccessParameters('FolioCustomerUnset');
					// call function to update the Property-Based Access Status values for relevant Contacts under this customer
					updatePropertyBasedForEligibleContacts(propParameter, CustInternalID, lastEditEmployee);
				}

				// US1240633 Scripting to apply EBSCO Hosted FOLIO Access Status Part 2
				// FOLIO-Hosted-By-EBSCO going from False to True
				if (oldFolioHostedByEBSCO == false && newFolioHostedByEBSCO == true && (newSFID != '' && newSFID != null)) {
					// call function to load values into propParameter
					populate_PropBasedAccessParameters('FolioHostedByEBSCOSet');
					// call function to update the Property-Based Access Status values for relevant Contacts under this customer
					updatePropertyBasedForEligibleContacts(propParameter, CustInternalID, lastEditEmployee);
				}
				// US1240633 Scripting to apply EBSCO Hosted FOLIO Access Status Part 2
				// FOLIO-Hosted-By-EBSCO going from True to False
				else if (oldFolioHostedByEBSCO == true && newFolioHostedByEBSCO == false && (newSFID != '' && newSFID != null)) {
					// call function to load values into propParameter
					populate_PropBasedAccessParameters('FolioHostedByEBSCOUnset');
					// call function to update the Property-Based Access Status values for relevant Contacts under this customer
					updatePropertyBasedForEligibleContacts(propParameter, CustInternalID, lastEditEmployee);
				}


				//	US1081830 EDS Transition Status is not empty
				if (utility.LU2_isEmpty(newRecord.getValue({fieldId: 'custentity_eds_transition_status'})) == false) {
					log.debug({title: 'Entering Transition Center changes section'});
					// TA714491 - Transition Access Updated
					var customerSFID = newRecord.getValue({fieldId: 'custentity_sf_account_id'});	// Used to see whether customer is in EBSCO Connect
					var customer = newRecord.getValue({fieldId: 'id'});
					var oldEDSTransition = oldRecord.getValue({fieldId: 'custentity_eds_transition_status'});
					var newEDSTransition = newRecord.getValue({fieldId: 'custentity_eds_transition_status'});
					var oldRefCenterTransition = oldRecord.getValue({fieldId: 'custentity_refctr_transition_status'});
					var newRefCenterTransition = newRecord.getValue({fieldId: 'custentity_refctr_transition_status'});
					var oldExploraTransition = oldRecord.getValue({fieldId: 'custentity_explora_transition_status'});
					var newExploraTransition = newRecord.getValue({fieldId: 'custentity_explora_transition_status'});
					var oldEHostTransition = oldRecord.getValue({fieldId: 'custentity_ehost_transition_status'});
					var newEHostTransition = newRecord.getValue({fieldId: 'custentity_ehost_transition_status'});
					// Create objects of Transition Statuses for L2Customer.transitionStatusChangedTo
					// New Record
					var newTransitionStatuses = new Object();
					newTransitionStatuses.EDS = newEDSTransition;
					newTransitionStatuses.RefCenter = newRefCenterTransition;
					newTransitionStatuses.Explora = newExploraTransition;
					newTransitionStatuses.EHost = newEHostTransition;
					// Old Record
					var oldTransitionStatuses = new Object();
					oldTransitionStatuses.EDS = oldEDSTransition;
					oldTransitionStatuses.RefCenter = oldRefCenterTransition;
					oldTransitionStatuses.Explora = oldExploraTransition;
					oldTransitionStatuses.EHost = oldEHostTransition;

					// If an EBSCO Connect Customer and ANY of the 4 Transition Fields get Set to "Reviewing New UI" or "Complete"
					// DE73375 - Changed to Testing if fields changed and testing if customer is transition into two separate functions
					if (L2Customer.isECCustomer(customerSFID) == true && (L2Customer.isTransitionCustomer(oldTransitionStatuses) != L2Customer.isTransitionCustomer(newTransitionStatuses) && L2Customer.isTransitionCustomer(newTransitionStatuses) == true)) {
						// Then set Transition Access to "Approved" on all associated contacts in EBSCO Connect that have Case Management Access Levels of "Approved" or "Granted"
						var contactSearch = search.create({
							type: search.Type.CONTACT,
							filters: [
								search.createFilter({
									name: 'company',
									operator: search.Operator.ANYOF,
									values: CustInternalID
								}),
								search.createFilter({
									name: 'custentity_sf_case_mngmt_access_status',
									operator: search.Operator.ANYOF,
									values: [LC2_SF_EcAccessLevels_sts.Approved, LC2_SF_EcAccessLevels_sts.Granted]
								}),
								//US1031367 TA768000 Transition Center Access Defect Fix: PUS = "Invitation Expired" Contacts receiving access statuses
								search.createFilter({
									name: 'custentity_portal_user_status',
									operator: search.Operator.ANYOF,
									values: [LC2Constant.LC2_SF_PortalUser_sts.SendInv, LC2Constant.LC2_SF_PortalUser_sts.InvInProg, LC2Constant.LC2_SF_PortalUser_sts.UserAct]
								}),
								//DE73375 - adding filter to only grab NON-Granted/Approved contacts for transition status access
								search.createFilter({
									name: 'custentity_sf_transition_access_status',
									operator: search.Operator.NONEOF,
									values: [LC2_prop_access.Approved, LC2_prop_access.Granted]
								})
							],
							columns: ['internalid']
						});
						var contactSearchResults = contactSearch.run().getRange({start: 0, end: 1000});


						if (contactSearchResults.length > 0) {
							for (var i = 0; i < contactSearchResults.length; i++) {
								var result = contactSearchResults[i];
								var contactId = result.getValue({name: 'internalid'});
								var contactRec = record.submitFields({
									type: record.Type.CONTACT,
									id: contactId,
									values: {
										'custentity_sf_transition_access_status': LC2_prop_access.Approved,
										'custentity_sf_access_update_handling': true,	// TA754012 (of US1010164)
										'custentity_contact_last_modified_by': lastEditEmployee		// TA763249 (of US1028664) - Fix defects for EBSCO Connect ReArch (Need to set 'Contact Last Modified By' flag)
									}
								});

							}
						}
					}
					// If SF ID is populated and all Transition Statuses are Blank or Not Started, and at least ONE transition status has changed from "Reviewing UI" or "Complete" to "Not Started" or "Blank"
					// DE73375 - Changed to Testing if fields changed and testing if customer is transition into two separate functions
					if ((L2Customer.isECCustomer(customerSFID) == true) && (L2Customer.isTransitionCustomer(oldTransitionStatuses) != L2Customer.isTransitionCustomer(newTransitionStatuses) && L2Customer.isTransitionCustomer(newTransitionStatuses) == false)) {
						var contactSearch = search.create({
							type: search.Type.CONTACT,
							filters: [
								search.createFilter({
									name: 'company',
									operator: search.Operator.ANYOF,
									values: CustInternalID
								}),
								search.createFilter({
									name: 'custentity_sf_case_mngmt_access_status',
									operator: search.Operator.ANYOF,
									values: [LC2_SF_EcAccessLevels_sts.Approved, LC2_SF_EcAccessLevels_sts.Granted]
								}),
								// DE73375 - Added filter to exclude contacts w/ Transition Statuses of Revoked
								search.createFilter({
									name: 'custentity_sf_transition_access_status',
									operator: search.Operator.NONEOF,
									values: [LC2_prop_access.Revoked, LC2_prop_access.Removed]
								})
							],
							columns: ['internalid']
						});
						var contactSearchResults = contactSearch.run().getRange({start: 0, end: 1000});
						if (contactSearchResults.length > 0) {
							for (var i = 0; i < contactSearchResults.length; i++) {
								var result = contactSearchResults[i];
								var contactId = result.getValue({name: 'internalid'});
								var contactRec = record.submitFields({
									type: record.Type.CONTACT,
									id: contactId,
									values: {
										'custentity_sf_transition_access_status': LC2_prop_access.Revoked,
										'custentity_sf_access_update_handling': true,	// TA754012 (of US1010164)
										'custentity_contact_last_modified_by': lastEditEmployee		// TA763249 (of US1028664) - Fix defects for EBSCO Connect ReArch (Need to set 'Contact Last Modified By' flag)
									}
								});
							}
						}
					}
				}	// END EDS Transition Status not empty

			} // END UserEvent is NOT create


			/* ******************************************************************************************************************************
            // Function	: 		function populate_PropBasedAccessParameters(){
            /* ********************************************************************************************************************************
                 * Description	: The function populates the parameters that will be used in function updatePropertyBasedForEligibleContacts()
                 * Input		: Input Parameters
                 * 					PropBasedAction:  A description of the Property-Based Access Status field being handled and what
                 *										we're trying to do with it (Set it or Unset it)
                 *				The parameters are:
									description:			Description of action for logging purposes
									UI_searchid:			SearchID that finds qualified Contacts under the customer which need to be updated
									accStatusFieldToUpdate:	The Contact Access Status field which needs to be updated
									propBasedValue:			The value of the Access Status field - the value for Approved or Revoked
									propBasedValueText:		The Text value of the Access Status field (for use in Error handling messages)
									errorText:				Text for use in Error Handling emails to Mercury
			 	 *
                 *	Created as part of: US1240633
                 *********************************************************************************************************************/
			function populate_PropBasedAccessParameters(PropBasedAction_in) {
				log.debug('entering populate_PropBasedAccessParameters function');
				switch (PropBasedAction_in) {
					case 'FolioCustomerSet':
						log.debug('switch statement - case FolioCustomerSet');
						propParameter.description = 'Set FOLIO Customer Access Status to Approved';
						propParameter.UI_searchid = LC2_SS.ApproveFolioCustAccess;
						propParameter.accStatusFieldToUpdate = 'custentity_sf_folio_cust_access_status';
						propParameter.propBasedValue = LC2_prop_access.Approved;
						propParameter.propBasedValueText = 'Approved';
						propParameter.errorText = 'All EBSCO Connect Contacts under this Customer should have a FOLIO Customer Access Status of Approved or Granted';
						break;
					case 'FolioCustomerUnset':
						log.debug('switch statement - case FolioCustomerUnset');
						propParameter.description = 'Set FOLIO Customer Access Status to Revoked';
						propParameter.UI_searchid = LC2_SS.RevokeFolioCustAccess;
						propParameter.accStatusFieldToUpdate = 'custentity_sf_folio_cust_access_status';
						propParameter.propBasedValue = LC2_prop_access.Revoked;
						propParameter.propBasedValueText = 'Revoked';
						propParameter.errorText = 'All EBSCO Connect Contacts under this Customer should have a FOLIO Customer Access Status of Revoked or Removed';
						break;
					case 'FolioHostedByEBSCOSet':
						log.debug('switch statement - case FolioHostedByEBSCOSet');
						propParameter.description = 'Set FOLIO Hosted By EBSCO Access Status to Approved';
						propParameter.UI_searchid = LC2_SS.ApproveFolioHostedByEBSCO;
						propParameter.accStatusFieldToUpdate = 'custentity_hosted_folio_access_status';
						propParameter.propBasedValue = LC2_prop_access.Approved;
						propParameter.propBasedValueText = 'Approved';
						propParameter.errorText = 'All EBSCO Connect Contacts under this Customer should have a EBSCO Hosted FOLIO Access Status of Approved or Granted';
						break;
					case 'FolioHostedByEBSCOUnset':
						log.debug('switch statement - case FolioHostedByEBSCOUnset');
						propParameter.description = 'Set FOLIO Hosted By EBSCO Access Status to Revoked';
						propParameter.UI_searchid = LC2_SS.RevokeFolioHostedByEBSCO;
						propParameter.accStatusFieldToUpdate = 'custentity_hosted_folio_access_status';
						propParameter.propBasedValue = LC2_prop_access.Revoked;
						propParameter.propBasedValueText = 'Revoked';
						propParameter.errorText = 'All EBSCO Connect Contacts under this Customer should have a EBSCO Hosted FOLIO Access Status of Revoked or Removed';
						break;
				}
			} // end populate_PropBasedAccessParameters


			/* ******************************************************************************************************************************
			/* Function	: updatePropertyBasedForEligibleContacts
            /* ********************************************************************************************************************************
                 * Description	: The function runs a search to find Contacts under this Customer eligible for processing Property Based Access Status
                 * 					of Approve or Revoked as Customer Data is updated.
                 * 					The function also updates the Property-Based value for the appropriate Access Status field passed into it.
                 * 					As well as the 'Access Status Needs Handling' field and the 'Contact Last Modified By' field - to trigger Boomi processing
				 *
                 * Input		: Input Parameters
                 * 					1) propParameter:  			    Constant values as per the action taken. This includes:
                 *											 		Description of the Action,
                 *												 	The Search used to find the relevant contacts,
                 *												 	The Access Status field being updated and
                 *												 	the new Value for the field
                 * 					2) custInternalID_in:  			Customer Internal ID passed into the search criteria as an additional filter
                 * 					3) lastEditEmployee_in:			ID of the Employee who last edited this record - for use in setting the 'Last Updated By' value
                 * Returns		:	N/A
                 *					Created as part of: US1240633
                 ********************************************************************************************************************/
			function updatePropertyBasedForEligibleContacts(propParameter_in, custInternalID_in, lastEditEmployee_in) {
				// Search for contacts using the search ID passed in propParameter
				var contactSearch = search.load({
					id: propParameter_in.UI_searchid
				});
				// Add a filter on Customer Internal ID
				var searchFilters = contactSearch.filters;
				var filterOne = search.createFilter({
					name: 'company',
					operator: search.Operator.ANYOF,
					values: custInternalID_in
				});
				searchFilters.push(filterOne);

				log.debug('updatePropertyBasedForEligibleContacts function - after push filter to Contact Search Load');
				var myResultSet = contactSearch.run().getRange(0, 999);
				var length = myResultSet.length;
				log.debug('updatePropertyBasedForEligibleContacts function - No. of results = ', length);

				if (myResultSet.length > 0) {
					// at least one contact returned
					for (var x = 0; x < myResultSet.length; x++) {
						// contact Internal ID **********
						var contactId = myResultSet[x].getValue({
							name: 'internalid'
						});
						var company = myResultSet[x].getValue({
							name: 'company'
						});
						log.debug(propParameter_in.description + ' for contactID', contactId);
						try {
							// build JSON object for the fields which need to be submitted
							var submitContactFields = {
								'custentity_sf_access_update_handling': true,
								'custentity_contact_last_modified_by': lastEditEmployee_in
							}
							submitContactFields[propParameter_in.accStatusFieldToUpdate] = propParameter_in.propBasedValue;
							var submitContactRec = record.submitFields({
								type: record.Type.CONTACT,
								id: contactId,
								values: submitContactFields
							});
							submitContactFields = null;
							log.audit('Contact ' + contactId + ' Updated');
						} catch (e) {
							log.error(e.name);
							log.error(propParameter_in.description + ' error under customer ', company);
							// email just once if errors in run
							if (emailSent == false) {
								email.send({
									author: LC2_emp.MercuryAlerts,
									recipients: LC2_email.CRMEscalation,
									subject: 'UserEvent2 Customer After Submit error setting the '+propParameter_in.accStatusFieldToUpdate+' field to '+propParameter_in.propBasedValueText,
									body: 'There was a problem setting the '+propParameter_in.accStatusFieldToUpdate+' field to '+propParameter_in.propBasedValueText+' for at least one contact under customer '+company+'. <BR><BR> '+propParameter_in.errorText+'.<BR><BR> Check Contact ID: '+contactId+' but more than one contact may need to be fixed'
								});
								emailSent = true;
							}
						}
					}//end for loop
				}//end myResultSet.length > 0
			} // End updatePropertyBasedForEligibleContacts function

		} // end AfterSubmit

    return {
        afterSubmit: afterSubmit
    }

});
