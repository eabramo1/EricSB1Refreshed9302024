/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_service_issue_ds_qa.js
//				Written in SuiteScript 2.0
//
//Created by:	Jeff Oliver  12-2020
//
//Purpose:		
//

//
//
//Revisions:  
//
//
//
//----------------------------------------------------------------------------------------------------------------

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'], function (LC2_constant) {
	
	/**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	
	
	
	function ds_qa_formLoad(scriptContext)
	{	
		
		var si_record = scriptContext.currentRecord;
		// if new SI
		if (si_record.getValue({fieldId:'id'}) == "" || si_record.getValue({fieldId:'id'}) == null)
		{	// for DS QA SIs set Issue Type to SaaS QA (8)
			si_record.setValue({
				fieldId: 'custrecord_siissuetype',
				value: LC2_constant.LC2_SIissueType.SaasQA,
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})

		}
		// if the DS QA Case field is NOT populated
		if (si_record.getValue({fieldId:'custrecord_ds_qa_case'})=='' || si_record.getValue({fieldId:'custrecord_ds_qa_case'})==null)
		{	// and if the SI Case(s) field IS populated with one and only one value
				//(Note this field would be populated if it were created from the Case record)
			var from_case = si_record.getValue({fieldId:'custrecord_sicase'});
			if (from_case.length = 1)
			{	// then set the DS QA Case field to be equal to the SI Case Field
				si_record.setValue({
					fieldId: 'custrecord_ds_qa_case',
					value: from_case,
					ignoreFieldChange: false,
					forceSyncSourcing: true
					})
			}
		}
	}

	function ds_qa_formSave(scriptContext)
	{	
		var si_record = scriptContext.currentRecord;
		// If Status set to Resolved 
		if (si_record.getValue('custrecord_sistatus') == LC2_constant.LC2_SIstatus.Resolved)
		{	// ensure DS QA - Overall Pass/Fail value
			if (si_record.getValue('custrecord_ds_qa_overall_passfail')=='' || si_record.getValue('custrecord_ds_qa_overall_passfail')==null )
			{
				alert('Please provide a DS QA - Overall Pass/Fail');
				return false;
			}
			// ensure DS QA - Completion Time 
			if (si_record.getValue('custrecord_ds_qa_completion_time')=='' || si_record.getValue('custrecord_ds_qa_completion_time')==null )
			{
				alert('Please provide a DS QA - Completion Time');
				return false;
			}
		}
		
		// Populate the SI Case field if it isn't populated.  Populate it from value in the DS QA Case field 
		if (si_record.getValue('custrecord_sicase')=='' ||si_record.getValue('custrecord_sicase')==null)
		{	var ds_qa_case = si_record.getValue('custrecord_ds_qa_case');
		si_record.setValue({
			fieldId: 'custrecord_sicase',
			value: ds_qa_case,
			ignoreFieldChange: false,
			forceSyncSourcing: true
			})
		}	
		return true;
	}
		
	
	return {
		pageInit: ds_qa_formLoad,
		saveRecord: ds_qa_formSave
	};
});

