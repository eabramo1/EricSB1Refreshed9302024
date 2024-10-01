/**
 * library2_case.js
 * @NApiVersion 2.0
 */
//
// Script:     library2_case.js  
//
// Created by: Eric Abramo
//
// Purpose:    This is a script file of library functions related to the NetSuite Case record
//             It is called from other scripts using 2.0 version.
//             Global Case Library functions should be added here.
//
// Standards:	All Functions should be prefaced with "L2_"
//
// Functions:	L2_initialize_newSalesCase
//				L2_disableNonAdminSalesCaseFields
//				L2_disallowOriginAnywhere365
//				L2_copyMessageButton
//				L2_PopulateCompanyOrYBPAccount
//
//
//
//	Revisions:
//		04-11-2022	eAbramo		Created file to go along with client2_case_sales_general.js
//								As part of TA701381 Refactor client_sales_case_general.js to SuiteScript 2.0
//
//		05-16-2022	ZScannell	US931151 Created a function to restrict users from selecting AnyWhere365 Chat Bot values for the "Origin" field
//		08-16-2022	ZScannell	Refactoring: Created L2_copyMessageButton to use on all case forms
//		09-12-2022	ZScannell	Created L2_PopulateCompanyOfYBPAccount as part of refactoring client_case_gobi_eba.js
//		09-26-2023	JOliver		TA854124 Updated L2_initialize_newSalesCase to remove the 'return record_in'
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/currentRecord', 'N/search'],
		function(L2Constants, currentRecord, search){
	
	//--------------------------------------------------------------------------//
	// Function	:	L2_initialize_newSalesCase
	// Purpose	:	Function sets many of the Sales Case fields in the event that the case is being created as new
	// Input	:	record_in:		the case record
	//				user_in:		Internal ID of the NetSuite User
	//				scase_customer_in:	Internal ID of the NetSuite Customer (if the Customer is known) or Empty if not known
	// Returns	:	N/A		
	function L2_initialize_newSalesCase(record_in, assignee_in, user_in, scase_customer_in){
		// set Assigned To
		record_in.setValue({
			fieldId: 'assigned',
			value: assignee_in,
			ignoreFieldChange: false,
			forceSyncSourcing: true					
		});
		// set Created By
		record_in.setValue({
			fieldId: 'custeventcustsat_prj_emp',
			value: user_in,
			ignoreFieldChange: false,
			forceSyncSourcing: true					
		});
		// set Email false
		record_in.setValue({
			fieldId: 'emailform',
			value: false,
			ignoreFieldChange: false,
			forceSyncSourcing: true					
		});
		// set Internal Only true
		record_in.setValue({
			fieldId: 'internalonly',
			value: true,
			ignoreFieldChange: false,
			forceSyncSourcing: true					
		});
		// if Customer is populated on creation (from Customer record) set the sales_case_customer custom field
		// also populate the customer field with the value of the User who created the record
		if(!scase_customer_in){
			// get real company
			var company = record_in.getValue({
				fieldId: 'company'
			});
		}
		// if real company
		if(company){
			// then set the sales case customer to the value in the real company
			record_in.setValue({
				fieldId: 'custevent_case_customer_list',
				value: company,
				ignoreFieldChange: false,
				forceSyncSourcing: true					
			});
		}
		// NOW set company field to the current user
		record_in.setValue({
			fieldId: 'company',
			value: user_in,
			ignoreFieldChange: false,
			forceSyncSourcing: true	
		});
	}


	//--------------------------------------------------------------------------//
	//Function	:	L2_disableNonAdminSalesCaseFields
	//Purpose	:	Function sets 5 SalesCase Fields to disabled -- called ONLY when User is not a Sales Case Admin
	//Input	:		record_in:		the case record
	//Returns	:	N/A
	function L2_disableNonAdminSalesCaseFields(record_in){
		var assigned_field = record_in.getField({
			fieldId: 'assigned'
		})
		var status_field = record_in.getField({
			fieldId: 'status'
		})
		var priority_field = record_in.getField({
			fieldId: 'priority'
		})
		var company_field = record_in.getField({
			fieldId: 'company'
		})
		var out_message_field = record_in.getField({
			fieldId: 'outgoingmessage'
		})			
		assigned_field.isDisabled = true;
		status_field.isDisabled = true;
		priority_field.isDisabled = true;
		company_field.isDisabled = true;
		out_message_field.isDisabled = true;
		
		return record_in;
	}
	
	//----------------------------------------------------------------------------------------//
	// Function: L2_disallowOriginAnywhere365
	// Purpose: Function is called when 'origin' is changed on a case to ensure that a user is not setting it to 'Chat - FAQ' (9) or 'Chat - Live' (10) via UI
	// Input:
	//		recordIn: The case record.
	//		userIn: The user object.
	// Returns: N/A
	function L2_disallowOriginAnywhere365(recordIn, userIn){
		var userRole = userIn.role;
		// If not the Web Service User (1025) or Admin (3)
		if (userRole != '1025' && userRole != '3'){
			var originVal = recordIn.getValue({fieldId: 'origin'});
			switch (originVal){
				// If setting to one of the Anywhere365 Chat bot values, show alert + set the value to blank
				// "Chat - FAQ"
				case '9':
					alert('A user cannot set the Origin field to "Chat - FAQ" via UI. This status is reserved for cases set by the EBSCO Connect AnyWhere365 chat bot. Setting Origin to blank.')
					recordIn.setValue({
						fieldId: 'origin',
						value: '',
						ignoreFieldChange: true
					});
					break;
				// "Chat - Live"
				case '10':
					alert('A user cannot set the Origin field to "Chat - Live" via UI. This status is reserved for cases set by the EBSCO Connect AnyWhere365 chat bot. Setting Origin to blank.')
					recordIn.setValue({
						fieldId: 'origin',
						value: '',
						ignoreFieldChange: true
					});
					break;
			}
		}
	}
	
	//----------------------------------------------------------------------------------------//
	// Function: L2_copyMessageButton
	// Purpose: Function is called when a user clicks on the "Copy Message" button
	// Input:
	//		recordIn: The case record.
	// Returns: N/A
	var originalMessageCopied = false;
	function L2_copyMessageButton() {
		var currentRec = currentRecord.get();
		if (originalMessageCopied == false)
		{
			currentRec.setValue ({
				fieldId: 'outgoingmessage',
				value: currentRec.getValue('outgoingmessage') + '\n\n--- Original Message ---\n' + currentRec.getValue('incomingmessage'),
				ignoreFieldChange: true
			});
			originalMessageCopied = true;
		}
	}
	
	//--------------------------------------------------------------------------//
	// Function	:	L2_PopulateCompanyOrYBPAccount
	// Purpose	:	Populates Company based on YBP Account selection | Populates YBP Account based on Company selection
	// Input	:	N/A
	// Returns	:	N/A		
	
	function L2_PopulateCompanyOrYBPAccount(){
        // Determine whether Company and Account are known
        var currentRec = currentRecord.get();
        var companyId = currentRec.getValue({fieldId: 'company'});
        var ybpAccountId = currentRec.getValue({fieldId: 'custevent_ybp_account'});
        var companyStatusKnown = false;
        var ybpAccountStatusKnown = false;
        if (companyId != '' && companyId != null && companyId != L2Constants.LC2_Customer.AnonDDESupport && L2Constants.LC2_Customer.IsCustSSEAnon(companyId) == false && L2Constants.LC2_Customer.IsCustYBPAnon(companyId) == false){
            companyStatusKnown = true;
        }
        if (ybpAccountId != '' && ybpAccountId != null){
            ybpAccountStatusKnown = true;
        }
        // Company Known & YBP Account unknown
        if (companyStatusKnown == true && ybpAccountStatusKnown == false){
        	GetYBPAccounts();
        }

        // Company Unknown & YBP Account known
        if (companyStatusKnown == false && ybpAccountStatusKnown == true){
        	GetCompany();
        }

        //Populate company from YBP Account selection
        function GetCompany(){
            var results = search.create({
                type: 'CUSTOMRECORD_YBP_ACCOUNT',
                filters: [
                    search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.IS,
                        values: [ybpAccountId]
                    }),
                    search.createFilter({
                        name: 'custrecord_ybpa_customer',
                        operator: search.Operator.NONEOF,
                        values: ['@NONE@']
                    })
                ],
                columns: ['custrecord_ybpa_customer']
            }).run().getRange({start: 0, end: 1000});
            if (results.length > 0){
                // If only one result
                if (results.length == 1){
                    var company = results[0].getValue({name: 'custrecord_ybpa_customer'});
                    if (company != companyId){
                        currentRec.setValue({
                            fieldId: 'company',
                            value: '',
                            ignoreFieldChange: true
                        });
                        currentRec.setValue({
                            fieldId: 'company',
                            value: company,
                            ignoreFieldChange: true
                        });
                    }
                }
                // If more than 1 result
                else{
                    alert('There are multiple Customer for this YBP Account. Please contact the CRM Systems Team.');
                }
            }
        }

        // Populate YBP Account from Company Selection (If 1:1)
        function GetYBPAccounts(){
            var results = search.create({
                type: 'CUSTOMRECORD_YBP_ACCOUNT',
                filters: [
                    search.createFilter({
                        name: 'custrecord_ybpa_customer',
                        operator: search.Operator.IS,
                        values: companyId
                    }),
                    search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: ['internalid']
            }).run().getRange({start:0, end: 1000});
            if (results.length == 1){
                currentRec.setValue({
                    fieldId: 'custevent_ybp_account',
                    value: results[0].getValue({name: 'internalid'}),
                    ignoreFieldChange: true
                });
            }
        }
    }
	
	return {
		L2_initialize_newSalesCase: L2_initialize_newSalesCase,
		L2_disableNonAdminSalesCaseFields: L2_disableNonAdminSalesCaseFields,
		L2_disallowOriginAnywhere365: L2_disallowOriginAnywhere365,
		L2_copyMessageButton: L2_copyMessageButton,
		L2_PopulateCompanyOrYBPAccount: L2_PopulateCompanyOrYBPAccount
	}
});