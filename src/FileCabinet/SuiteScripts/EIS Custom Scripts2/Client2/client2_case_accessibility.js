/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_accessibility.js
//				Written in SuiteScript 2.0
//
//Created by:	Pat Kelleher 09-2021
//
//Purpose:		New form created for Accessibility dept.
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
define(['N/runtime', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'], 

function(runtime, record, search, constant) {
    
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
		var mode = scriptContext.mode;
    	var userID = runtime.getCurrentUser().id;
		var assigned_to = record.getValue({
			fieldId: 'assigned'
		});		
		var accscase = record.getValue({
			fieldId: 'custevent_access_case'
		});		
		
		var case_cust = record.getValue({
			fieldId: 'company'
		});
		var profile = record.getValue({
			fieldId: 'profile'
		});
		
//	   	alert('accscase  is ' + accscase );
	   	
		if (mode == 'create'){
  			
  			// get user to figure out correct profile
  			// alert ('userID is ' + userID);
	       	var userDept = search.lookupFields({
	       		type: search.Type.EMPLOYEE,
	       		id: userID,
	       		columns: ['department']});

	        //	alert('userDept.department[0].value is ' + userDept.department[0].value);
	        	
	        if (userDept.department[0].value == constant.LC2_Departments.Access){

	    		// Set Origin -> EMAIL on create new only
	  			record.setValue({
	   				fieldId: 'origin',
	   				value: constant.LC2_CaseOrigin.Email,
	   				ignoreFieldChange: true});
	        	
	        	// Set profile to Accessibility
	      		record.setValue({
	      			fieldId: 'profile',
	       			value: constant.LC2_Profiles.EISAccess,
	       			ignoreFieldChange: true});

	      		// Set Assignee to Current User
	      		record.setValue({
	       			fieldId: 'assigned',
	       			value: userID,
	       			ignoreFieldChange: true});
	        	}

	       	// Populating field when open in form.  Field is disabled on form.
	    	if (accscase == false){
	  			record.setValue({
	   				fieldId: 'custevent_access_case',
	   				value: true,
	   				ignoreFieldChange: true});
	    	}
		} // End Mode = create

		
		if (mode != 'create'){
			// disable Origin field
			record.getField('origin').isDisabled = true;

			// if not create (i.e. edit) check Assignee dept and change profile to Accessibility if necessary
  			// get Assignee to verify profile is correct
			if (profile != constant.LC2_Profiles.EISAccess){
				if (assigned_to){
					var assignedDept = search.lookupFields({
		                type: search.Type.EMPLOYEE,
		                id: assigned_to,
		                columns: ['department']});

		        	if (assignedDept.department[0].value == constant.LC2_Departments.Access){
		        		// Set Profile to Accessibility
		      			record.setValue({
		       				fieldId: 'profile',
		       				value: constant.LC2_Profiles.EISAccess,
		       				ignoreFieldChange: true});
		        	}
				}
			}
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
/*    function fieldChanged(scriptContext) {

    }
*/
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
		var record_id = record.id;
		var accscase = record.getValue({
			fieldId: 'custevent_access_case'
		});		
		var assigned_to = record.getValue({
			fieldId: 'assigned'
		});		
		var profile = record.getValue({
			fieldId: 'profile'
		});
 	
	   	// Populate Accessibility case checkbox when saving form if dept is Accessibility and it's not already checked.  Note: field is disabled via form.
		if (accscase == false){
	    	var assignedDept = search.lookupFields({
	            type: search.Type.EMPLOYEE,
	            id: assigned_to,
	            columns: ['department']});
			
			if (assignedDept.department[0].value == constant.LC2_Departments.Access){
	  			record.setValue({
	   				fieldId: 'custevent_access_case',
	   				value: true,
	   				ignoreFieldChange: true});
	    	}
		}

		// Change profile to Accessibility if Assignee is in Accessibility Dept
		if (profile != constant.LC2_Profiles.EISAccess){
	    	var assignedDept = search.lookupFields({
	            type: search.Type.EMPLOYEE,
	            id: assigned_to,
	            columns: ['department']});
			
			if (assignedDept.department[0].value == constant.LC2_Departments.Access){
	  			record.setValue({
	   				fieldId: 'profile',
	   				value: constant.LC2_Profiles.EISAccess,
	   				ignoreFieldChange: true});
	    	}
		}
		
    	return true;
    }
		
    return {
        pageInit: pageInit,
//        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
