/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_sales_rwa.js
//				Written in SuiteScript 2.0
//
//Created by:	Eric Abramo  01-2020
//
//Purpose:		Pre-Populate and disable fields in Edit Mode upon Page Init function
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//
//
//Revisions:  
//
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'], function (runtime, constant) {
	
	/**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	function rwa_case_Init(scriptContext) {		
		var record = scriptContext.currentRecord;	
		var record_id = record.id;	
		// Load Library Constant objects
		var emp_c = constant.LC2_Employee;
		var caseType_c = constant.LC2_SalesCaseType;
		var role_c = constant.LC2_Role;
		
		// Newly Created Record
		if (!record_id){
			// alert('this is a new Case');
			record.setValue({
				fieldId: 'assigned',
				value: emp_c.Sales_RWA,
				ignoreFieldChange: false,
				forceSyncSourcing: true					
			})
			// Pre-populate Title field
			record.setValue({
				fieldId: 'title',
				value: 'EIS Sales Research Workflow and Archives Case',
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})
			// sales_case_customer field
			var sales_case_customer = record.getValue({
				fieldId: 'custevent_case_customer_list'
			})
			// if sales_case_customer empty
			if(!sales_case_customer){
				// get real company
				var company = record.getValue({
					fieldId: 'company'
				})
			}
			// if real company
			if(company){
				// then set the sales case customer to the value in the real company
				record.setValue({
					fieldId: 'custevent_case_customer_list',
					value: company,
					ignoreFieldChange: false,
					forceSyncSourcing: true					
				})	
			}
			// NOW set company field to the current user
			var user_id = runtime.getCurrentUser().id
			// alert('user_id is '+user_id);
			record.setValue({
				fieldId: 'company',
				value: user_id,
				ignoreFieldChange: false,
				forceSyncSourcing: true	
			})	
		} // end code for NEW Case 

		// Set Sales Admin Case type to "Research Workflow and Archives (RWA)"
		record.setValue({
			fieldId: 'custevent31',
			value: caseType_c.RWA,
			ignoreFieldChange: false,
			forceSyncSourcing: true	
		})

		var helpdesk_case = record.getValue({
			fieldId: 'helpdesk'
		})
		if (!helpdesk_case){
			record.setValue({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})
		}	

		var role = runtime.getCurrentUser().role;	
		// if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
		// 	then lock down certain fields
		if(role != role_c.EPSalesAdmin && role != role_c.Administrator && role != role_c.SalesOpsMngr && role != role_c.SalesOpsDir){	
			// alert('Your role means that we need to disable a bunch of fields');
			var assigned_field = record.getField({
				fieldId: 'assigned'
			})
			var status_field = record.getField({
				fieldId: 'status'
			})
			var company_field = record.getField({
				fieldId: 'company'
			})
			var out_message_field = record.getField({
				fieldId: 'outgoingmessage'
			})			
			assigned_field.isDisabled = true;
			status_field.isDisabled = true;
			company_field.isDisabled = true;
			out_message_field.isDisabled = true;	
		}

	}	
	
	
	
	
	return {
		pageInit: rwa_case_Init
	};
});

