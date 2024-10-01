/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//
// Script:     client2_task_cloudextend.js
//
// Created by: Eric Abramo on 12/12/2022 as part of US1010709 CloudExtend Task: Auto-default data for Tasks created through CloudExtend - 
//
//
//
// Revisions:
//
//

define(['N/format', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime'],

function(format, constants, runtime) {
    
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
    	
    	var ce_task = record.getValue({fieldId:'custevent_is_cloudextend_task'});
    	var ce_defaults_set = record.getValue({fieldId: 'custevent_ce_defaults_set'});
    	var enduser_modified_already = record.getValue({fieldId:'custevent_enduser_modified_ce_task'});
    	
    	// only run code when Role is NOT Web Services
    	if (runtime.getCurrentUser().role != constants.LC2_Role.WebServ){
        	// US1010709 If EndUser has not modified it in the UI, and the Defaults have not be set - then set the default fields
        	if(enduser_modified_already == false && ce_defaults_set == false){
        		// set Task Type to Email
    			record.setValue({
    				fieldId: 'custevent_tasktype',
    				value: constants.LC2_TaskType.Email,
    				ignoreFieldChange: true,
    				forceSyncSourcing: false				
    			})
    			// set Status to Complete
    			record.setValue({
    				fieldId: 'status',
    				value: 'COMPLETE',
    				ignoreFieldChange: true,
    				forceSyncSourcing: false				
    			})
    			// if Due Date is equal to the Start Date set Due Date to two weeks from Start Date
    			var start_date = record.getValue({fieldId: 'startdate'})
    	        // need to format as test to allow for compare
    			var start_date1 = format.format({
    					  value: start_date,
    					  type: format.Type.DATETIME
    				  	});	
    			var due_date = record.getValue({fieldId:'duedate'});
    			// need to format as test to allow for compare
	            var due_date1 = format.format({
					  value: due_date,
					  type: format.Type.DATETIME
				  	});   			
    			if(due_date1 == start_date1){
    				// Use Format.parse to convert the date value into a raw date object
        			var start_date2 = format.parse({
    					  value: start_date,
    					  type: format.Type.DATETIME
    				  	});
		            var due_date2 = format.parse({
						  value: due_date,
						  type: format.Type.DATETIME
					  	});			
    				// Add 14 days to the raw date object
    	            start_date2.setDate(start_date2.getDate() + 14);
    	            // alert('start_date2 is ' +start_date2);
    	            record.setValue({                   
    	                fieldId: 'duedate',
    	                value: start_date2,
    	                ignoreFieldChange: true
    	            });				
    			}       
                // set the 'CE Defaults have been set' checkbox -- so these values don't need to be set again (by scheduled job)
    			record.setValue({
    				fieldId: 'custevent_ce_defaults_set',
    				value: true,
    				ignoreFieldChange: true,
    				forceSyncSourcing: false				
    			})
    			// set the 'is CloudExtend' checkbox if it isn't already set
    			if(ce_task == false){
        			record.setValue({
        				fieldId: 'custevent_is_cloudextend_task',
        				value: true,
        				ignoreFieldChange: true,
        				forceSyncSourcing: false				
        			})   				
    			}

        	}// END CE Task checkbox logic
    	}// END Not Web Services Role   
    	
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
    	var record_id = record.id;
    	
    	// only run code when Role is NOT Web Services
    	if (runtime.getCurrentUser().role != constants.LC2_Role.WebServ){
        	var enduser_modified_already = record.getValue({fieldId:'custevent_enduser_modified_ce_task'});
            // set the 'Enduser Modified Task' checkbox
    		if(enduser_modified_already == false){
    	    	record.setValue({
    				fieldId: 'custevent_enduser_modified_ce_task',
    				value: true,
    				ignoreFieldChange: true,
    				forceSyncSourcing: false				
    			})			
    		}   		
    	}// END Not Web Services Role
  	
    	return true;
    }	// end SaveRecord

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };   
});
