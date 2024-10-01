/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_service_issue.js
//				Written in SuiteScript 2.0
//				Purpose:  Form-level client script for the EIS Service Issue form (custom record)
//
//Created by:	Eric Abramo  07-2021 - as re-write of a SuiteScript 1.0 file
//				
//
//
//Library Scripts Used: 	
//				library2_service_issue.js
//				library2_constants.js
//				library2_utility.js
//
//Revisions: 
//----------------------------------------------------------------------------------------------------------------

	define(['N/runtime', 'N/search', 'N/format', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
	function(runtime, search, format, constant, utility) {

	/*Global Variables*/
	var closed_on_load = false;  	
	
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
    	// local variables
    	var mode = scriptContext.mode;
    	// alert('mode is '+mode);
    	var record = scriptContext.currentRecord;
    	var this_record_id = utility.LU2_getFieldValue(record, 'id');
    	var role = runtime.getCurrentUser().role;
    	var si_status_onload = utility.LU2_getFieldValue(record, 'custrecord_sistatus');
    	    	
    	// if loaded as closed, set variable to tell Save function to NOT reset the Si Closed Date
    	if(mode == 'edit' && constant.LC2_SIstatus.IsClosed(si_status_onload) == true){
    		closed_on_load = true;
    	}
    	// alert('closed_on_load is '+ closed_on_load);
    	// If brand New Service Issue
    	if (mode == 'create')
    	{	// Set Issue Type -> Software Defect
    		utility.LU2_setFieldValue(record, 'custrecord_siissuetype', constant.LC2_SIissueType.SoftwareDef)
    	}
    	
		// if role is not Administrator - disable some fields
		if(role != constant.LC2_Role.Administrator){	
			record.getField({fieldId: 'custrecord_count_linked_cases'}).isDisabled = true;
			record.getField({fieldId: 'custrecord_risk_reduction_desc'}).isDisabled = true;			
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
    function fieldChanged(scriptContext) {
        var record = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
    	
        if (name == 'custrecord_risk_reduction_opportunity'){       	
        	var risk_redu_oppty = utility.LU2_getFieldValue(record, 'custrecord_risk_reduction_opportunity');       	       	
        	if(utility.LU2_isEmpty(risk_redu_oppty) == false){
        		// Enable the Risk Reduction Description field and pre-populate with User Name and Date/Time
        		utility.LU2_disableField(record, 'custrecord_risk_reduction_desc', false);
        		
        		var user_id = runtime.getCurrentUser().id
               	var user_name = search.lookupFields({
                       type: search.Type.EMPLOYEE,
                       id: user_id,
                       columns: ['entityid']
                });
        		// alert('user_name.entityid is '+user_name.entityid);			
        		var curr_date = new Date();
        		var fmt_curr_date = format.format({
        			  value: curr_date,
        			  type: format.Type.DATETIME
        		});
        		alert('Service Issues with a Risk Reduction Opportunity setting must have a Risk Reduction Description.  Your name and date will be added to the Description.  Please add comments to this description.');
        		utility.LU2_setFieldValue(record, 'custrecord_risk_reduction_desc', user_name.entityid+' '+fmt_curr_date+': ');
        	}
        	else{ //clear out the Risk Reduction description field
        		utility.LU2_setFieldValue(record, 'custrecord_risk_reduction_desc', '');
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
    	var record = scriptContext.currentRecord;
    	var this_record_id = utility.LU2_getFieldValue(record, 'id');
    	var cur_linkedCases = Number(utility.LU2_getFieldValue(record, 'custrecord_count_linked_cases'));
    	var cases = utility.LU2_getFieldValue(record, 'custrecord_sicase');
    	var risk_redu_oppty = utility.LU2_getFieldValue(record, 'custrecord_risk_reduction_opportunity');
    	var risk_redu_desc = utility.LU2_getFieldValue(record, 'custrecord_risk_reduction_desc');
    	var si_status = utility.LU2_getFieldValue(record, 'custrecord_sistatus');
    	
    	// Set Si_Close_Date if the SI Status is set to Closed or Closed Unresolved (but only if loaded as Not closed)
    	if (constant.LC2_SIstatus.IsClosed(si_status) == true && closed_on_load == false){
			var curr_date = new Date();    		
    		utility.LU2_setFieldValue(record, 'custrecord_si_close_date', curr_date);
    	}
    	
    	// Update the new Number of Linked Cases field
    	if (utility.LU2_isEmpty(cases) == true){
    		var cases_count = 0;
    	}
    	else{
    		var cases_count = cases.length;
    	}
    	if (cases_count != cur_linkedCases){   		
    		utility.LU2_setFieldValue(record, 'custrecord_count_linked_cases', cases_count);
    	}
    	
    	// if value in Risk Reduction Drop-down and no value in Description (user Cleared it) re-populate the Description with
    	// users name, current time - and tell user to add details"
    	if (utility.LU2_isEmpty(risk_redu_oppty) == false && utility.LU2_isEmpty(risk_redu_desc) == true){   			
    		alert('Service Issues with a Risk Reduction Opportunity setting must have a Risk Reduction Description.  Your name and date will be added to the Description.  Please add comments to this description and then select Save again.');
    		utility.LU2_disableField(record, 'custrecord_risk_reduction_desc', false)
    			
    		var user_id = runtime.getCurrentUser().id
           	var user_name = search.lookupFields({
                   type: search.Type.EMPLOYEE,
                   id: user_id,
                   columns: ['entityid']
            });
    		// alert('user_name.entityid is '+user_name.entityid);			
    		var curr_date = new Date();
    		var fmt_curr_date = format.format({
    			  value: curr_date,
    			  type: format.Type.DATETIME
    		});
    		utility.LU2_setFieldValue(record, 'custrecord_risk_reduction_desc', user_name.entityid+' '+fmt_curr_date+': ');
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
