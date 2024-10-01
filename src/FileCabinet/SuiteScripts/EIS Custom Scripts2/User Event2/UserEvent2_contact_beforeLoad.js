/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/* Script:     UserEvent2_contact_beforeLoad.js
 *
 * Created by: Zachary Scannell
 *
 * Library Scripts Used: Library2_Utility, Library2_Constants
 *
 * Revisions:  
 *	ZScannell	2022-05-26	US961740 Original Version
 *	eAbramo		2022-05-26	US963983 and US966153 Replace IsRoleECContactInvite with isRoleModifyEC_Contact (same function but new function name)
 * 	ZScannell	2023-01-30	US943090 Create "Match with Displayed Academy Only User" button on load
 * 				2023-01-30	US1057768 Open up SRPM Display to EP Support Person I
 * 	ZScannell	2023-05-09	US1096154 Created local function isRoleAllowedToSeeSRPM and added LC2_Role.CDPGroup to existing roles able to see unconverted SRPMs
 * 	eAbramo		2023-09-01	TA846682 Lori Reed Request - ability to modify Marketo Lead ID in NetCRM
* */

define(['N/record', 'N/runtime', 'N/ui/serverWidget', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],

function(record, runtime, serverWidget, L2_utility, L2_constants, search){
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext){
        var rec = scriptContext.newRecord;
        var recordForm = scriptContext.form;

        // If opening it in View/Edit
        if (scriptContext.type != 'create'){
            // US961740 - NetCRM UI Changes to display SRPM information
                // Record Specific Information
            var inactive = rec.getValue({fieldId: 'isinactive'});
            var salesforceId = rec.getValue({fieldId: 'custentity_sf_contact_id'});
            var company = rec.getValue({fieldId: 'company'});
            var contactEmail = rec.getValue({fieldId: 'email'});
                // User Specific Information
            var userObj = runtime.getCurrentUser();
            var userRole = userObj.role;
            

            // Test Criteria for a match to be displayed to the role
            /*
            *   Active Contact
            *   No Contact SFID
            *   Role is Allowed to Invite a Contact to SalesForce OR EP Support Person I
            *   Contact's email is either:
            *       Not EBSCO Domain (L2_isEBSCOemail)
            *           OR
            *       EBSCO Domain and the Customer is a specified customer (IsCustEBSCOSFPush)
            */
         	// US963983 and US966153 Replace IsRoleECContactInvite with isRoleModifyEC_Contact
			//	US1057768 - Open up display of SRPM Record on Contact to EP Support Person 1 Role
			//	US1096154 - Added new function isRoleAllowedToSeeSRPM in order to simplify this IF statement
         	if (inactive == false && L2_utility.LU2_isEmpty(salesforceId) == true && isRoleAllowedToSeeSRPM(userRole) == true && (L2_utility.LU2_isEBSCOemail(contactEmail) == false || L2_constants.LC2_Customer.IsCustEBSCOSFPush(company)) == true){
                /*  Run search to match SRPM to customer
                *   Criteria:
                *       - Contact's email = SRPM email
                *       - SRPM Conversion Status != "Converted"
                *       - SRPM Contact Type = "Self Registered"
                */
        	   
        	   // US961740 - Array of columns we will search for SRPM matched to the customer 
        	   var searchColumnArray = ['internalid', 'custrecord_sr_first_name', 'custrecord_sr_last_name', 'custrecord_sr_institution_name', 'custrecord_sr_institution_custid',
                   'custrecord_sr_email', 'custrecord_sr_job_function', 'custrecord_academy_access_status', 'custrecord_srpm_portal_user_status',
                   'custrecord_case_mgmt_access_status', 'custrecord_groups_access_status', 'custrecord_sf_contact_id'];
                var srpmResults = search.create({
                    type: 'CUSTOMRECORD_SR_PORTAL_MEMBER',
                    filters: [
                        search.createFilter({
                            name: 'custrecord_sr_email',
                            operator: search.Operator.IS,
                            values: contactEmail
                        }),
                        search.createFilter({
                            name: 'custrecord_srpm_conversion_status',
                            operator: search.Operator.NONEOF,
                            values: L2_constants.LC2_SRPM_Conversion_Status.Converted
                        }),
                        search.createFilter({
                            name: 'custrecord_sr_contact_type',
                            operator: search.Operator.IS,
                            values: L2_constants.LC2_EC_Contact_Access_Type.SelfRegistered
                        })
                    ],
                    columns: searchColumnArray
                }).run().getRange({start: 0, end: 1000});
                
                // Only run if SRPM found
                if (srpmResults.length == 1){
                	var contactSearch = search.create({
                    	type: search.Type.CONTACT,
                    	filters: [
                    		search.createFilter({
                    			name: 'email',
                    			operator: search.Operator.IS,
                    			values: contactEmail
                    		}),
                    		search.createFilter({
                    			name: 'isinactive',
                    			operator: search.Operator.IS,
                    			values: 'F'
							}),
							search.createFilter({
								name: 'internalid',
								operator: search.Operator.NONEOF,
								values: rec.id
                    		})
                    	],
						columns : ['internalid', 'custentity_sf_contact_id']
                    }).run().getRange({start: 0, end: 1000});
                	
                	var fieldgroup = recordForm.addFieldGroup({
                        id: 'existingacademyuser',
                        label: 'Existing Academy Only User With Matching Email',
                        tab: L2_constants.LC2_Form_subtabs.contact_ebscoConnect
                    });
                	
					if (contactSearch.length > 0){
                        // Handle multiple results here
                    	var warningField = recordForm.addField({
                    		id: 'custpage_warningfieldforsrpm',
                    		type: serverWidget.FieldType.TEXT,
                    		label: 'WARNING: Other Contacts exist with this same email',
                    		container: 'existingacademyuser'
                    	});
                    	rec.setValue({
                    		fieldId: 'custpage_warningfieldforsrpm',
							value: 'Detected ' + JSON.stringify(contactSearch.length) + ' other active contact(s) with a matching email.',
                    		ignoreFieldChange: true
                    	});
                    	warningField.updateDisplayType({
                    		displayType: serverWidget.FieldDisplayType.INLINE
                    	});
                    	
                    }
                	
                	                   	
                	// Start Creating the SR Fields
                	// 1st Column: SR First Name, SR Last Name, SR Institution Name, SR Institution Name, SR Insitution CustId
                	var firstNameField = createSRField(recordForm, rec, 'SR First Name', 'custpage_sr_first_name', srpmResults[0].getValue({name: 'custrecord_sr_first_name'}));
                	var lastNameField = createSRField(recordForm, rec, 'SR Last Name', 'custpage_sr_last_name', srpmResults[0].getValue({name: 'custrecord_sr_last_name'}));
                	var institutionNameField = createSRField(recordForm, rec, 'SR Insitution Name', 'custpage_sr_institution_name', srpmResults[0].getValue({name: 'custrecord_sr_institution_name'}));
                	var insitutionCustIdField = createSRField(recordForm, rec, 'SR Insitution CustId', 'custpage_sr_institution_custid', srpmResults[0].getValue({name: 'custrecord_sr_institution_custid'}));
                	// 2nd Column: SR Email, SR Occupation, SR SalesForce ID, SR SRPM ID
                	var srEmailField = createSRField(recordForm, rec, 'SR Email', 'custpage_sr_email', srpmResults[0].getValue({name: 'custrecord_sr_email'}));
                	var srOccupationField = createSRField(recordForm, rec, 'SR Occupation', 'custpage_sr_occupation', srpmResults[0].getText({name: 'custrecord_sr_job_function'}));
                	var srSFIdField = createSRField(recordForm, rec, 'SR SF ID', 'custpage_sr_sf_id', srpmResults[0].getValue({name: 'custrecord_sf_contact_id'}));
                	var srIdField = createSRField(recordForm, rec, 'SR SRPM ID', 'custpage_sr_id', srpmResults[0].getValue({name: 'internalid'}));
					srIdField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                	// 3rd Column: SR Academy Only User Status, SR Academy Access Status, SR Case Management Access Status, SR Discussion Groups Access
                	var srAcademyOnlyField = createSRField(recordForm, rec, 'SR Self-Registration User Status', 'custpage_sr_academy_user_status', srpmResults[0].getText({name: 'custrecord_srpm_portal_user_status'}));
                	var srAcademyAccField = createSRField(recordForm, rec, 'SR Academy Access Status', 'custpage_sr_academy_acc_status', srpmResults[0].getText({name: 'custrecord_academy_access_status'}));
                	var srCaseMgmtField = createSRField(recordForm, rec, 'SR Case Management Access Status', 'custpage_sr_case_mgmt_status', srpmResults[0].getText({name: 'custrecord_case_mgmt_access_status'}));
                	var srDiscussionField = createSRField(recordForm, rec, 'SR Discussion Groups Access', 'custpage_sr_groups_access', srpmResults[0].getText({name: 'custrecord_groups_access_status'}));
                	
					//	US943090 - Starting display validation for "Match with Displayed Academy Only User" button
					var customerSFAccountId = rec.getValue({fieldId: 'custentity_sf_sourced_account_id'});
					var srpmId = srpmResults[0].getValue({name: 'internalid'});
					var sfContactFound = false;
					for (var i=0; i<contactSearch.length && sfContactFound == false; i++){
						if(L2_utility.LU2_isEmpty(contactSearch[i].getValue({name: 'custentity_sf_contact_id'})) == false){
							sfContactFound = true;
						}
					}
					//	Display button if:
					//	- SRPM Match Found
					//	- Customer SalesForce Account ID != ""
					//	- Record is open in "Edit" mode
					//	- Role can grant access to EBSCO Connect
					//	- No contact in SF found with matching email
					//	- SRPM Case Management AND Discussion Groups != 'Requested' || 'Needs Review'
					if (L2_utility.LU2_isEmpty(srpmId) == false &&
						L2_utility.LU2_isEmpty(customerSFAccountId) == false &&
						scriptContext.type == 'edit' &&
						L2_constants.LC2_Role.IsRoleSFContactCreateNew(userRole) == true &&
						sfContactFound == false &&
						srpmResults[0].getValue({name: 'custrecord_case_mgmt_access_status'}) != L2_constants.LC2_SF_EcAccessLevels_sts.Req &&
						srpmResults[0].getValue({name: 'custrecord_groups_access_status'}) != L2_constants.LC2_SF_EcAccessLevels_sts.Req
						){
						//	Display button on top of page with text "Match with Displayed Academy Only User"
						recordForm.addButton({
							id: 'custpage_matchbutton',
							label: 'Match with Displayed Academy Only User',
							functionName: 'matchWithDisplayedAcademyOnlyUserButton'
						});
						scriptContext.form.clientScriptModulePath = 'SuiteScripts/EIS Custom Scripts2/Client2/client2_contact.js'
					}
				}
				else if (srpmResults.length >1){
					alert('Multiple Self-Registered Portal Members have been found for this email address. Please send an email to "CRMescalation@ebsco.com" with the contacts name and company so that we can further research this issue. Thank you.')
                }           
           }	// End SRPM Code

			// TA846682 Lori Reed Request - ability for specific role to modify Marketo Lead ID in NetCRM
			if(userRole == L2_constants.LC2_Role.EISMktgSalesOpsDupMngmt || userRole == L2_constants.LC2_Role.Administrator){
				recordForm.getField({id: 'custentity_muv_marketoleadid'}).updateDisplayType({displayType : serverWidget.FieldDisplayType.NORMAL});
           }
			// end TA846682


		} // End Type is not Create
    }
    
    function createSRField(recordForm, rec, newFieldLabel, newFieldId, newFieldValue){
    	var addedField = recordForm.addField({
    		id: newFieldId,
    		type: serverWidget.FieldType.TEXT,
    		label: newFieldLabel,
    		container: 'existingacademyuser'
    	});
    	rec.setValue({
    		fieldId: newFieldId,
    		value: newFieldValue,
    		ignoreFieldChanges: true
    	});
    	
    	addedField.updateDisplayType({
    		displayType: serverWidget.FieldDisplayType.INLINE
    	});
    	
    	return addedField;
    }

	function isRoleAllowedToSeeSRPM(userRole){
		return (L2_constants.LC2_Role.isRoleModifyEC_Contact(userRole) || userRole == L2_constants.LC2_Role.EPSupPers || userRole == L2_constants.LC2_Role.CDSupport)
	}

    return {
        beforeLoad: beforeLoad
    };
});