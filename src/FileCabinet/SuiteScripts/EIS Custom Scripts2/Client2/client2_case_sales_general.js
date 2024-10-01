/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_sales_general.js
//				Written in SuiteScript 2.0
//
//Created by:	Eric Abramo  03-2022 (TA701381 Refactor client_sales_case_general.js to SuiteScript 2.0)
//
//Purpose:		Pre-Populate and disable fields in Edit Mode upon Page Init function
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//							library2_case (linked in define statement)
//
//Revisions:  
//		04/20/2022	eAbramo		Created File as part of TA701381 Refactor client_sales_case_general.js to SuiteScript 2.0
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case'], 
function (runtime, constants, library_case) {
	
	/**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	function salesgen_case_init(scriptContext) {		
		var record = scriptContext.currentRecord;	
		var record_id = record.id;	
		var user_role = runtime.getCurrentUser().role;
		var user_id = runtime.getCurrentUser().id
		var sales_case_customer = record.getValue({
			fieldId: 'custevent_case_customer_list'
		})
		var helpdesk_case = record.getValue({
			fieldId: 'helpdesk'
		})
		
		// Newly Created Record
		if (!record_id){
			// Assignee should be set to Sale sSystem Admin
			var assignee = constants.LC2_Employee.SalesSystemAdmin;
			// call Function to initialize Sales Case in the library2_case library file
			library_case.L2_initialize_newSalesCase(record, assignee, user_id, sales_case_customer);
		}
		// All Cases (not just NEW)
		// Set Sales Admin Case type to "Sales Admin Case"
		record.setValue({
			fieldId: 'custevent31',
			value: constants.LC2_SalesCaseType.SalesAdmin,
			ignoreFieldChange: false,
			forceSyncSourcing: true	
		})
		
		if (!helpdesk_case){
			// Set Helpdesk checkbox
			record.setValue({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})
		}	

		if(constants.LC2_Role.isRoleSalesCaseAdmin(user_role) == false){
			// Call library function to disable many non-admin Sales Case fields
			library_case.L2_disableNonAdminSalesCaseFields(record);
		}

	}
	
	return {
		pageInit: salesgen_case_init
	};
});
