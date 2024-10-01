/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_openAthens_pricing.js
//				Written in SuiteScript 2.0
//
//Created by:	Pat Kelleher March 2023
//
//Purpose:		Create specific functionality for Open Athens Pricing Case Form, created March 2023 (created from a web form that Sales maintained).
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


	function openAthens_case_Init(scriptContext) {
		var record = scriptContext.currentRecord;
		var record_id = record.id;
		var role = runtime.getCurrentUser().role;
		var user_id = runtime.getCurrentUser().id
		var sales_case_customer = record.getValue({
			fieldId: 'custevent_case_customer_list'
		})
		var helpdesk_case = record.getValue({
			fieldId: 'helpdesk'
		})

		// Newly Created Record
		if (!record_id){
			// Set Assignee to Open Athens Pricing Coordinator
			var assignee = constant.LC2_Employee.OpenAthens_Pricing;
			// Pre-populate Title field
			record.setValue({
				fieldId: 'title',
				value: 'EIS Sales OpenAthens Pricing Case Form',
				ignoreFieldChange: true,
				forceSyncSourcing: false
			})

			// call Function to initialize Sales Case in the library2_case library file
			L2case.L2_initialize_newSalesCase(record, assignee, user_id, sales_case_customer);


			// Now populate email of Requestor
			var user_email = runtime.getCurrentUser().email;
			record.setValue({
				fieldId: 'custevent_oa2_requestor_email',
				value: user_email,
				ignoreFieldChange: true
			})

		} // end the code for NEW Case

		// Set Sales Admin Case type to "OpenAthens"
		record.setValue({
			fieldId: 'custevent31',
			value: constant.LC2_SalesCaseType.OpenAthens,
			ignoreFieldChange: true
		})

		if (!helpdesk_case){
			record.setValue({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: true
			})
		}

		// if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
		// 	then lock down certain fields
		if(role != constant.LC2_Role.EPSalesAdmin && role != constant.LC2_Role.Administrator && role != constant.LC2_Role.SalesOpsMngr && role != constant.LC2_Role.SalesOpsDir){
			// Call library function to disable several non-admin Sales Case fields (assigned, status, priority (hidden), company, outgoingmessage)
			record = L2case.L2_disableNonAdminSalesCaseFields(record);
		}

	} // end page init


	return {
		pageInit: openAthens_case_Init
	}

})
