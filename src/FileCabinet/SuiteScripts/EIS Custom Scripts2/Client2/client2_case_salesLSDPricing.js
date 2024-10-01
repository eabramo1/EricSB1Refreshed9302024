/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_salesLSDPricing.js
//				Written in SuiteScript 2.1
//
//Created by:	Zachary Scannell 09/2022
//Revisions:  
//
//
//
//----------------------------------------------------------------------------------------------------------------
 define(['N/runtime', 'N/search', 'N/record', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case', 'N/currentRecord'],
 function(runtime, search, record, L2Constants, L2Case, currentRecord) {
     
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
        const currentRec = scriptContext.currentRecord;
        const currentUser = runtime.getCurrentUser();
        
        // If a new Sales Case Pricing
        if (currentRec.getValue({fieldId: 'id'}) == '' || currentRec.getValue({fieldId: 'id'}) == null){
        	
        	// Set the following: Assigned, Created By, Email = False, Internal Only = True, Customer, Sales Case Customer
        	L2Case.L2_initialize_newSalesCase(record_in = currentRec, assignee_in = L2Constants.LC2_Employee.LicensedDBCoordinator, user_in = currentUser.id, scase_customer_in = currentRec.getValue({fieldId: 'custevent_case_customer_list'}));
        	
           // Set Help Desk flag
            currentRec.setValue({
                fieldId: 'helpdesk',
                value: true,
                ignoreFieldChange: true
            });
            
            // TA722180 ContinuousOps - Set "Is This an Extended Trial Request?" field so that it defaults to No
            currentRec.setValue({
                fieldId: 'custevent_lsd_ext_trial_request',
                value: L2Constants.LC2_yes_no_only.No,
                ignoreFieldChange: true
            });
        }
        // Set Sales Admin Case type to "LSD Pricing"
        currentRec.setValue({
            fieldId: 'custevent31',
            value: L2Constants.LC2_SalesCaseType.LSD,
            ignoreFieldChange: true
        });

        // Set the help desk flag if not populated
        if (currentRec.getValue('helpdesk') == '' || currentRec.getValue('helpdesk') == null){
            currentRec.setValue({
                fieldId: 'helpdesk',
                value: true,
                ignoreFieldChange: true
            });
        }
        // if role is not Sales Administrator (EPSalesAdmin - 1007) or Administrator (Administrator - 3) or Sales Manager (SalesInsideDir - 1001), or Sales Ops Mngr (SalesOpsMngr - 1057)
	    // OR Order Entry (EPOrdProc - 1011) or Sales Analyst (SalesAnalyst - 1053) or Cust Sat Roles (EPSupAdmin - 1006, EPSupMngr - 1002, EPSupPers - 1003) then lock down certain fields 
        if (L2Constants.LC2_Role.isRoleSalesCaseAdmin(currentUser.role) == false){
            currentRec.getField({fieldId: 'assigned'}).isDisabled = true;
            currentRec.getField({fieldId: 'status'}).isDisabled = true;
            currentRec.getField({fieldId: 'custeventcustsat_prj_days'}).isDisabled = true;
            currentRec.getField({fieldId: 'company'}).isDisabled = true;
            currentRec.getField({fieldId: 'outgoingmessage'}).isDisabled = true;
        }

        // US167245 Set Contact Role & Job Role if Job Role not populated - this will populate historic data
        // If Job Role is not populated this means Case pre-dates introduction of the field
        if ((currentRec.getValue({fieldId: 'custevent_pr_job_role'}) == '' || currentRec.getValue({fieldId: 'custevent_pr_job_role'}) == null) && (currentRec.getValue({fieldId: 'custevent26'}) != '' && currentRec.getValue({fieldId: 'custevent26'}) != null)){
            const columns = search.lookupFields({
                type: search.Type.CONTACT,
                id: currentRec.getValue({fieldId: 'custevent26'}),
                columns: ['contactrole', 'custentity_jobarea']
            });
            // Set custevent_pr_job_role
            if (columns.custentity_jobarea[0] != '' && columns.custentity_jobarea[0] != null){	// Set custevent_pr_job_role if Contact has a role
            	currentRec.setValue({
                	fieldId: 'custevent_pr_job_role',
                	value: columns.custentity_jobarea[0].value,
                	ignoreFieldChange: true
                });
            }
            else{	// Blank handling for Contact Role
            	currentRec.setValue({
                	fieldId: 'custevent_pr_job_role',
                	value: '',
                	ignoreFieldChange: true
                });
            }
            // Set custevent_pr_contact_role
            if (columns.contactrole[0] != '' && columns.contactrole[0] != null){	// Set custevent_pr_contact_role if Contact has a role
            	currentRec.setValue({
                	fieldId: 'custevent_pr_contact_role',
                	value: columns.contactrole[0].value,
                	ignoreFieldChange: true
                });
            }
            else{	// Blank handling for Contact Role
            	currentRec.setValue({
                	fieldId: 'custevent_pr_contact_role',
                	value: '',
                	ignoreFieldChange: true
                });
            }
        }
        // US935721 - If an Extended Trial user should not be allowed to choose a non-Extended Trial item (and vice versa)
        const extTrial = currentRec.getValue({fieldId: 'custevent_lsd_ext_trial_request'});
        if (extTrial == L2Constants.LC2_yes_no_only.Yes){
            currentRec.getField({fieldId: 'custevent16'}).isDisabled = true; // Disable the Non-Extended Trial field
        } 
        else if (extTrial == L2Constants.LC2_yes_no_only.No){
            currentRec.getField({fieldId: 'custevent_lsd_ext_trial_db_requests'}).isDisabled = true; // Disable the Extended Trial field
        }
     }
 
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
     // Added as part of US167245
     function fieldChanged(scriptContext) {
         const currentRec = scriptContext.currentRecord;
         switch(scriptContext.fieldId){
            // US167245 On Contact change sort out Contact Role
            case 'custevent26':
                const contact = currentRec.getValue({fieldId: 'custevent26'});
                if (contact != '' && contact != null){
	                const contactRoleLookup = search.lookupFields({
	                    type: search.Type.CONTACT,
	                    id: currentRec.getValue({fieldId: 'custevent26'}),
	                    columns: ['contactrole']
	                });
	                if (contactRoleLookup.contactrole[0] != '' && contactRoleLookup.contactrole[0] != null){	// Set custevent_pr_contact_role if Contact has a role
	                	currentRec.setValue({
	                    	fieldId: 'custevent_pr_contact_role',
	                    	value: contactRoleLookup.contactrole[0].value,
	                    	ignoreFieldChange: true
	                    });
	                }
	                else{	// Blank handling for Contact Role
	                	currentRec.setValue({
	                    	fieldId: 'custevent_pr_contact_role',
	                    	value: '',
	                    	ignoreFieldChange: true
	                    });
	                }
                }
                else{
                    currentRec.setValue({
                        fieldId: 'custevent_pr_contact_role',
                        value: '',
                        ignoreFieldChange: true
                    });
                }
                break;
            //	J Oliver	9/1/20		US682770 Default contact to Primary Contact
            case 'custevent_case_customer_list':
                const lsdCompany = currentRec.getValue({fieldId: 'custevent_case_customer_list'});
                if (lsdCompany != '' && lsdCompany != null){
                    // Create Contact Search
                    const results = search.create({
                        type: search.Type.CONTACT,
                        filters:[
                            search.createFilter({
                                name: 'company',
                                operator: search.Operator.ANYOF,
                                values: lsdCompany
                            }),
                            search.createFilter({
                                name: 'contactrole',
                                operator: search.Operator.ANYOF,
                                values: '-10'   // ????
                            })
                        ],
                        columns: [
                            search.createColumn({name: 'internalid', label: 'Internal ID'})
                        ]
                    }).run().getRange({start: 0, end: 1000});
                    if (results.length > 0){
                        currentRec.setValue({
                            fieldId: 'custevent26',
                            value: results[0].getValue({name: 'internalid'}),
                            ignoreFieldChange: false
                        });
                    }
                    else{
                        currentRec.setValue({
                            fieldId: 'custevent26',
                            value: '',
                            ignoreFieldChange: false
                        });
                    }
                }
                else{
                    currentRec.setValue({
                        fieldId: 'custevent26',
                        value: '',
                        ignoreFieldChange: false
                    });
                }
                break;
            //US935721 - If Extended APA Trial Request is YES, then disable the Databases To Be Quoted field and auto populate New/Renewal field and Assigned To field. If NO, disable Extended Trial field and reset Assigned To and New/Renewal fields.
            case 'custevent_lsd_ext_trial_request':
                const extTrial = currentRec.getValue({fieldId: 'custevent_lsd_ext_trial_request'});
                const curAssign = currentRec.getValue({fieldId: 'assigned'});
                const curNewRenew = currentRec.getValue({fieldId: 'custevent_newrenewal'});
                const extPrefDate = currentRec.getValue({fieldId: 'custevent_lsd_ext_pref_end_date'});
                const curApaSub = currentRec.getValue({fieldId: 'custevent_lsd_current_apa_subscriber'});

                // If an Extended Trial, then disavle the Databases to be Quoted field (custevent16) and set Assigned To and New/Renewal field
                if (extTrial == L2Constants.LC2_yes_no_only.Yes){
                    // Clear the value in custevent16
                    currentRec.setValue({
                        fieldId: 'custevent16',
                        value: '',
                        ignoreFieldChange: true
                    });
                    currentRec.getField({fieldId: 'custevent16'}).isDisabled = true;   // Disable "Databases to be Quoted"
                    currentRec.getField({fieldId: 'custevent_lsd_ext_trial_db_requests'}).isDisabled = false;  // Enable "Extended Trial DB"
                    currentRec.getField({fieldId: 'custevent_lsd_current_apa_subscriber'}).isDisabled = false;  // Enable "APA Subscriber"
                    currentRec.getField({fieldId: 'custevent_lsd_ext_pref_end_date'}).isDisabled = false;  // Enable "Extended Trial Pref End Date"
                    // Set "Assigned To" to Chris Duarte when Extended APA Trial Request is Yes
                    currentRec.setValue({
                        fieldId: 'assigned',
                        value: '375045',
                        ignoreFieldChange: true
                    });
                    // Set "New or Renewal" to value of "New" when "Extended APA Trial Request" is Yes
                    currentRec.setValue({
                        fieldId: 'custevent_newrenewal',
                        value: '1',
                        ignoreFieldChange: true
                    });
                }
                else if (extTrial == L2Constants.LC2_yes_no_only.No){
                    // Clear and disable the Extended Trial DB field & the Current APA Subscriber field & the Extended Pref End Date field
                    currentRec.setValue({
                        fieldId: 'custevent_lsd_ext_trial_db_requests',
                        value: '',
                        ignoreFieldChange: true
                    });
                    currentRec.getField({fieldId: 'custevent_lsd_ext_trial_db_requests'}).isDisabled = true;   // Disable the "Extended Trial DB" field
                    currentRec.getField({fieldId: 'custevent16'}).isDisabled = false;  // Enable the "Databases to be Quoted" field
                    currentRec.setValue({
                        fieldId: 'custevent_lsd_current_apa_subscriber',
                        value: '',
                        ignoreFieldChange: true
                    });
                    currentRec.getField({fieldId: 'custevent_lsd_current_apa_subscriber'}).isDisabled = true; // Disable the "Current APA Subscriber" field
                    currentRec.setValue({
                        fieldId: 'custevent_lsd_ext_pref_end_date',
                        value: '',
                        ignoreFieldChange: true
                    });
                    currentRec.getField({fieldId: 'custevent_lsd_ext_pref_end_date'}).isDisabled = true;   // Disable the "APA Extended Trial Preferred End Date" field

                    // Set "New or Renewal" field to blank and set "Assigned To" field to Licensed Database Coordinator (1385665) when "APA Extended Trial Request" is No and if it have values related to Yes
                    let reset = false;
                    if (curAssign == '375045'){ // Chris Duarte
                        currentRec.setValue({
                            fieldId: 'assigned',
                            value: '1385665',
                            ignoreFieldChange: true
                        });
                    }  
                    if (curNewRenew == L2Constants.LC2_yes_no_only.Yes){
                        currentRec.setValue({
                            fieldId: 'custevent_newrenewal',
                            value: '',
                            ignoreFieldChange: true
                        });
                        reset = true;
                    }
                    if (reset == true){
                        // If "Assigned To" is not LTC, then alert to user that this and the New/Renewal fields have been updated.
                        alert('Because the \'IS THIS AN EXTENDED APA TRIAL REQUEST?\' field value got changed, the \'Assigned To\' and \'New or Renewal\' fields have been set back to their default values. Please update if needed.');
                    }

                }
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
        const currentRec = scriptContext.currentRecord;
        // US682766 - Updated field '# OF ACCESSING LOCATIONS' to 'Single or Multiple Site' and when 'Multi=branch Site' (ID of 2) dropdown is chosen, to show alert.
	    // When 'Single or Multiple Site' field value of 'Multi=branch Site' (ID of 2) is chosen and this is a new record then remind emp to submit Excel doc
        if ((currentRec.getValue({fieldId: 'custevent48'}) == '2') && (currentRec.getValue({fieldId: 'id'}) == '' || currentRec.getValue({fieldId: 'id'}) == null)){
            alert('Reminder: Because this is a multiple site pricing request, you will also need to attach an Excel document with Accessing Site information');
        }
        //US935721 - If an Extended APA Trial Request is Yes and no Extended Trial DB Item is chosen, alert + do not allow save (vice versa if E.A.T.R. is No)
        const extTrial = currentRec.getValue({fieldId: 'custevent_lsd_ext_trial_request'});
        const nonExtTrialDb = currentRec.getValue({fieldId: 'custevent16'});
        const extTrialDb = currentRec.getValue({fieldId: 'custevent_lsd_ext_trial_db_requests'});
        const extEndDate = currentRec.getValue({fieldId: 'custevent_lsd_ext_pref_end_date'});
        const curApaSub = currentRec.getValue({fieldId: 'custevent_lsd_current_apa_subscriber'});
        // If an Extended APA Trial Request is Yes, then have user choose an extended trial DB item and a Preferred End Date and a value for Current APA Subscriber if not already done so
        if (extTrial == L2Constants.LC2_yes_no_only.Yes && extTrialDb == ''){
            alert("At least one APA Extended Trial Database Request item must be chosen.");
		    return false;
        }
        if (extTrial == L2Constants.LC2_yes_no_only.Yes && extEndDate == ''){
            alert("An APA Extended Trial Preferred End Date must be chosen.");
		    return false;
        }
        if (extTrial == L2Constants.LC2_yes_no_only.Yes && curApaSub == ''){
            alert("A value must be chosen for the 'Current APA Subscriber?' field.")
            return false;
        }
        if (extTrial == L2Constants.LC2_yes_no_only.No && nonExtTrialDb == ''){
            alert("At least one Databases To Be Quoted item must be chosen.");
		    return false;
        }
        return true;
     }
 
     return {
         pageInit: pageInit,
         fieldChanged: fieldChanged,
         saveRecord: saveRecord
     };
     
 });