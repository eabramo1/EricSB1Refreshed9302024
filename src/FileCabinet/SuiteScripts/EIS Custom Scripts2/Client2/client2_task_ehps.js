/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//
// Script:     client2_task_ehps.js
//
// Created by: Eric Abramo on 1/24/22 (yet refactoring the SuiteScript 1.0 version of the file created by Jeff Oliver)
//
//
// Revisions:
//  2/10/2022	CNeale		TA683173 Correct field Id: custevent_med_implement_req
//	03/11/24	PKelleher	US1233160 Make EBSCO Health Implementation Start Date field mandatory
//

define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],

function(runtime, utility, constant) {
    
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
    	var record = scriptContext.currentRecord;
    	var record_id = record.id;
		var userObj = runtime.getCurrentUser();

    	// if creation of a new record
		if (record_id == ''){
    		// Set Created By to this User
    		record.setValue({
    			fieldId: 'custevent_training_task_createdby',
    			value: runtime.getCurrentUser().id,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		}) 
    		// set Assigned To this user
    		record.setValue({
    			fieldId: 'assigned',
    			value: runtime.getCurrentUser().id,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})     		 		
    		// Set the Is Task for Medical Implementation Managers field to true (field either hidden or disabled)
     		// TA683173
    		record.setValue({
    			fieldId: 'custevent_med_implement_req',
    			value: true,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})

    		// DDEA Task set to 'no' - field not on this form but code s/b on all task forms to unset the checkbox if someone saves from another form to the one attached to this script
    		record.setValue({
    			fieldId: 'custevent_ddea_task',
    			value: false,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})
    		// SEA To Do Task set to 'no' - field not on this form but code s/b on all task forms to unset the checkbox if someone saves from another form to the one attached to this script
    		record.setValue({
    			fieldId: 'custevent_is_todo_task',
    			value: false,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})
    		// SEA Call Task set to 'no' - field not on this form but code s/b on all task forms to unset the checkbox if someone saves from another form to the one attached to this script
    		record.setValue({
    			fieldId: 'custevent_is_sea_call',
    			value: false,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})
    		// J.O. - Is Task for Trainers set to 'no' - field not on this form but code s/b on all task forms to unset the checkbox if someone saves from another form to the one attached to this script
    		record.setValue({
    			fieldId: 'custevent_is_trainer_task',
    			value: false,
				ignoreFieldChange: true,
				forceSyncSourcing: false
    		})		    
    	} // end Create new record

		// US1233160 Make HI Start Date mandatory for all users except Web Services and Admins
		// Mandatory via script so it does not impact ChurnZero integration
		if (userObj.role != constant.LC2_Role.Administrator && userObj.role != constant.LC2_Role.WebServ){
			record.getField({fieldId: 'custevent_eh_requested_start_date'}).isMandatory = true;
		}

	} // end Page Init


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
		var userObj = runtime.getCurrentUser();
    	var record_id = record.id;
    	
    	// set AssignedTo (the real field) to be equal to the value in the 'Assign to Medical Implementation Manager' (custom) field
    	// used the custom field so that it is a subset of the full employee list
		var assigned_MedImpMgr = record.getValue('custevent_eh_assign_mim');
    	if (assigned_MedImpMgr){
    		record.setValue({
    			fieldId: 'assigned',
    			value: assigned_MedImpMgr,
    			ignoreFieldChange: true,
    			forceSyncSourcing: false
    		})     		
    	}
	
    	// If paid services is set then Expected revenue & currency are mandatory
    	var paidServices = record.getValue('custevent_paid_training');
    	var expectedRevenue = record.getValue('custevent_ex_tr_rev_amt');
    	var exRevCurrency = record.getValue('custevent_ex_tr_rev_cur');
		var reqStartDate = record.getValue ('custevent_eh_requested_start_date');

		//	PK updated 3.15.24 to use utility function
		if (paidServices == true && (utility.LU2_isEmpty(expectedRevenue) == true || utility.LU2_isEmpty(exRevCurrency) == true))
		{
			alert('Please enter both an Expected Revenue and a Currency when Paid Services is indicated.');
			return false;
		}

		// US1233160 Make EBSCO Health Implementation Start Date field mandatory for all but Web Svs and Admins
		if (userObj.role != constant.LC2_Role.Administrator && userObj.role != constant.LC2_Role.WebServ) {
			if (utility.LU2_isEmpty(reqStartDate) == true) {
				alert('Please enter a Requested Implementation Start Date.');
				return false;
			}
		}
		return true;

    }	// end SaveRecord

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };   
});
