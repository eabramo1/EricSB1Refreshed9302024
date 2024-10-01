/**
* @NApiVersion 2.1
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_openrs_pricing.js
//
//Created by:	Pat Kelleher May 2024
//
//Purpose:		Create specific functionality for new OpenRS Pricing Case Form
//
//Library Scripts Used: 	library2_constants.js
//							library2_case.js
//							library2_utility.js
//
//Revisions:
//
//
//----------------------------------------------------------------------------------------------------------------
define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', 'N/ui/dialog'],function (runtime, constant, L2case, L2Utility, dialog) {

	//Global Case Classification Object
	var NumberLibraries = {MoreThan60: 6};
	var HowLibrariesAffil = {Other: 5};
	var NumberBibRecords = {MoreThan20M: 5};
	var NumberTransNetwrk = {MoreThan2M: 5};
	var RecordsCntrlIndex = {MoreThan400K: 5};
	var IlsLspSystemsUsing = {Other: 27};
	var IllDcbSystemsUsing = {Other: 8};
	var IsThereBudget = {Yes: 1};

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
			// Set Assignee to OpenRS Pricing Coordinator
			var assignee = constant.LC2_Employee.OpenRSPricingCoord;
            // Pre-populate Title field
			record.setValue({fieldId: 'title', value: 'EIS Sales OpenRS Pricing Case Form'});

            // call Function to initialize Sales Case in the library2_case library file
            L2case.L2_initialize_newSalesCase(record, assignee, user_id, sales_case_customer);

            // Now populate email of Requestor
            var user_email = runtime.getCurrentUser().email;
            record.setValue({fieldId: 'custevent_oa2_requestor_email', value: user_email});

        } // end the code for NEW Case

         // Set Sales Admin Case type to OpenRS
         record.setValue({fieldId: 'custevent31', value: constant.LC2_SalesCaseType.OpenRS});

// TODO CONSIDER PUTTING INTO THE INITIALIZE CASE FORM FUNCTION FOR THE FUTURE
         if (!helpdesk_case){
         	record.setValue({fieldId: 'helpdesk', value: true});
         }

         // lock down certain fields if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
// TODO CONSIDER THIS TOO FOR ADDING ROLE FUNCTION TO LIBRARY 2 CONSTANTS
		 if(![constant.LC2_Role.EPSalesAdmin, constant.LC2_Role.Administrator, constant.LC2_Role.SalesOpsMngr, constant.LC2_Role.SalesOpsDir].includes(role)){
             // Call library function to disable several non-admin Sales Case fields (assigned, status, priority (hidden), company, outgoingmessage)
			 record = L2case.L2_disableNonAdminSalesCaseFields(record);
         }
	} // end page init function

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
		var record = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;

		// make below fields mandatory with the asterisk only if field is empty
		switch(fieldId){
			case 'custevent_openrs_number_libraries_in_gr':
				if (record.getValue({fieldId: 'custevent_openrs_number_libraries_in_gr'}) == NumberLibraries.MoreThan60){
					record.getField({fieldId: 'custevent_openrs_if_more_than_60_lib'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_if_more_than_60_lib'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_if_more_than_60_lib', value: ''})}
				break;

			case 'custevent_openrs_how_are_lib_affiliated':
				if (record.getValue({fieldId: 'custevent_openrs_how_are_lib_affiliated'}) == HowLibrariesAffil.Other){
					record.getField({fieldId: 'custevent_openrs_if_other_supply_nature'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_if_other_supply_nature'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_if_other_supply_nature', value: ''})}
				break;

			case 'custevent_openrs_number_bib_records_ins':
				if (record.getValue({fieldId: 'custevent_openrs_number_bib_records_ins'}) == NumberBibRecords.MoreThan20M){
					record.getField({fieldId: 'custevent_openrs_if_more_20m_how_many'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_if_more_20m_how_many'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_if_more_20m_how_many', value: ''})}
				break;

			case 'custevent_openrs_nu_trans_across_networ':
				if (record.getValue({fieldId: 'custevent_openrs_nu_trans_across_networ'}) == NumberTransNetwrk.MoreThan2M){
					record.getField({fieldId: 'custevent_openrs_if_over_2m_transaction'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_if_over_2m_transaction'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_if_over_2m_transaction', value: ''})}
				break;

			case 'custevent_openrs_nu_records_to_central':
				if (record.getValue({fieldId: 'custevent_openrs_nu_records_to_central'}) == RecordsCntrlIndex.MoreThan400K){
					record.getField({fieldId: 'custevent_openrs_if_more_records_added'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_if_more_records_added'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_if_more_records_added', value: ''})}
				break;

			case 'custevent_openrs_what_ilslsp_system_use':
				if (record.getValue({fieldId: 'custevent_openrs_what_ilslsp_system_use'}) == IlsLspSystemsUsing.Other){
					record.getField({fieldId: 'custevent_openrs_name_system_vendor_ils'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_name_system_vendor_ils'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_name_system_vendor_ils', value: ''})}
				break;

			case 'custevent_openrs_what_illdcb_system_use':
				if (record.getValue({fieldId: 'custevent_openrs_what_illdcb_system_use'}) == IllDcbSystemsUsing.Other){
					record.getField({fieldId: 'custevent_openrs_which_ill_dcb_system'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_which_ill_dcb_system'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_which_ill_dcb_system', value: ''})}
				break;

			case 'custevent_openrs_is_there_a_budget':
				if (record.getValue({fieldId: 'custevent_openrs_is_there_a_budget'}) == IsThereBudget.Yes){
					record.getField({fieldId: 'custevent_openrs_what_is_the_budget'}).isMandatory = true;}
				else {record.getField({fieldId: 'custevent_openrs_what_is_the_budget'}).isMandatory = false;
					record.setValue({fieldId: 'custevent_openrs_what_is_the_budget', value: ''})}
				break;

		} // end switch stmt

	} // end fieldChanged

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
		var record = scriptContext.currentRecord;
		var NumLib = record.getValue('custevent_openrs_number_libraries_in_gr');
		var HowLibAffil = record.getValue('custevent_openrs_how_are_lib_affiliated');
		var NumBibRcrds = record.getValue('custevent_openrs_number_bib_records_ins');
		var NumTransNetwrk = record.getValue('custevent_openrs_nu_trans_across_networ');
		var RecCntrlIndex = record.getValue('custevent_openrs_nu_records_to_central');
		var IlsLspSystems = record.getValue('custevent_openrs_what_ilslsp_system_use');
		var IllDcbSystems = record.getValue('custevent_openrs_what_illdcb_system_use');
		var IsBudget = record.getValue('custevent_openrs_is_there_a_budget');

		if(NumLib == NumberLibraries.MoreThan60 && (L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_if_more_than_60_lib'})) || record.getValue('custevent_openrs_if_more_than_60_lib') < 60) == true) {
			dialog.alert({
				title: 'Missing value',
				message: 'Since there are more than 60 libraries in the group, please indicate how many (must be more than 60 AND a number value).'
			}).then().catch();
			return false;}

		if(HowLibAffil == HowLibrariesAffil.Other && L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_if_other_supply_nature'})) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Since Other is chosen for How are Libraries Affiliated, please supply the nature of the library group.'
			}).then().catch();
			return false;}

		if(NumBibRcrds == NumberBibRecords.MoreThan20M && (L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_if_more_20m_how_many'})) || record.getValue('custevent_openrs_if_more_20m_how_many') < 20000000) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Since there are more than 20M bib records/instances, please indicate how many (must be more than 20M AND a number value).'
			}).then().catch();
			return false;
		}

		if(NumTransNetwrk == NumberTransNetwrk.MoreThan2M && (L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_if_over_2m_transaction'})) || record.getValue('custevent_openrs_if_over_2m_transaction') < 2000000) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Since there are more than 2M transactions across the network per year, please indicate how many (must be more than 2M AND a number value).'
			}).then().catch();
			return false;}

		if(RecCntrlIndex == RecordsCntrlIndex.MoreThan400K && (L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_if_more_records_added'})) || record.getValue('custevent_openrs_if_more_records_added') < 400000) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Since there are more than 400K records added to the Central Index, please indicate how many (must be more than 400K AND a number value).'
			}).then().catch();
			return false;}

		if(IlsLspSystems == IlsLspSystemsUsing.Other && L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_name_system_vendor_ils'})) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Please name the ILS/LSP system and vendor.'
			}).then().catch();
			return false;}

		if(IllDcbSystems == IllDcbSystemsUsing.Other && L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_which_ill_dcb_system'})) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Please name the ILL/DCB system.'
			}).then().catch();
			return false;}

		if(IsBudget == IsThereBudget.Yes && L2Utility.LU2_isEmpty(record.getValue({fieldId: 'custevent_openrs_what_is_the_budget'})) == true){
			dialog.alert({
				title: 'Missing value',
				message: 'Please indicate the budget dollar amount.'
			}).then().catch();
			return false;}

		return true;

	} // end saveRecord function

	return {
		pageInit: pageInit,
		fieldChanged: fieldChanged,
		saveRecord: saveRecord

	};

});
