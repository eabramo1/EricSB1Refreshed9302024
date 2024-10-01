/**
* @NApiVersion 2.1
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_stacks_pricing.js
//				Written in SuiteScript 2.1
//
//Created by:	Pat Kelleher January 2024
//
//Purpose:		Create specific functionality for new Stacks Pricing Case Form (replaced a web form that Sales maintained).
//
//Library Scripts Used: 	library2_constants.js
//							library2_case.js
//
//Revisions:
//
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case'], function (runtime, constant, L2case) {

	/**
	 * Function to be executed after page is initialized.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
	 *
	 * @since 2015.2
	 */


	function pageInit (scriptContext) {
		var record = scriptContext.currentRecord;
		var record_id = record.id;
		var role = runtime.getCurrentUser().role;
		var user_id = runtime.getCurrentUser().id
		var sales_case_customer = record.getValue({fieldId: 'custevent_case_customer_list'}); // 'customer site' field
		var helpdesk_case = record.getValue({fieldId: 'helpdesk'});

		// Newly Created Record
		if (!record_id) {
			// Set Assignee to Stacks Pricing Coordinator
			var assignee = constant.LC2_Employee.StacksPricingCoord;
            // Pre-populate Title field
			record.setValue({fieldId: 'title', value: 'EIS Sales Stacks Pricing Case Form'});

            // call Function to initialize Sales Case in the library2_case library file
            L2case.L2_initialize_newSalesCase(record, assignee, user_id, sales_case_customer);

            // Now populate email of Requestor
            var user_email = runtime.getCurrentUser().email;
            record.setValue({fieldId: 'custevent_oa2_requestor_email', value: user_email});

        } // end the code for NEW Case

        // Set Sales Admin Case type to "Stacks"
        record.setValue({fieldId: 'custevent31', value: constant.LC2_SalesCaseType.Stacks});

        if (!helpdesk_case){
        	record.setValue({fieldId: 'helpdesk', value: true});
        }

        // if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
        // then lock down certain fields
        if(role != constant.LC2_Role.EPSalesAdmin && role != constant.LC2_Role.Administrator && role != constant.LC2_Role.SalesOpsMngr && role != constant.LC2_Role.SalesOpsDir){
        	// Call library function to disable several non-admin Sales Case fields (assigned, status, priority (hidden), company, outgoingmessage)
			record = L2case.L2_disableNonAdminSalesCaseFields(record);
        }
	} // end page init


	return {
		pageInit: pageInit
	}

})
