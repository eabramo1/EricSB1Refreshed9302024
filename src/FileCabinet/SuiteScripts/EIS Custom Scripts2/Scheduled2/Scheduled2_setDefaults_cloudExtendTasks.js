/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/* Script:		Scheduled2_setDefaults_cloudExtendTasks.js
 * 
 * Purpose:  	The purpose of this scheduled job is to set the Default Values on Tasks that are created through the CloudExtend (Outlook Integration)
 * 				tool.  The CloudExtend tool cannot set fields to default through any customization.  Therefore this job runs to set the default values
 * 				of these Tasks.  There are three checkboxes on the Task.  is CloudExtend Task, CloudExtend Defaults have been Set and Enduser Modified CE Task
 * 				Saved Search looks for all Tasks where
 * 					* CloudExtend Tasks = true AND
 * 					* CloudExtend Defaults Have Been Set = false AND
 * 					* Enduser Modified CE Task = false
 * 				For each result, then set the default fields.  And also set the 'CloudExtend Defaults Have Been Set' flag to true so it isn't picked up again
 * 				Note that a Client Script can also set the 'CloudExtend Defaults Have Been Set' to true as well as the 'Enduser Modified CE Task' to true 
 * 				
 * 
 * Created by: 	Eric Abramo
 *
 * Revisions:  
 *		eAbramo  	12/13/2022	US1010709 Auto-default data for Tasks created through CloudExtend
 *		eAbramo		05/10/2023	US1111177 Cloud Extend Fixes: Tasks status, CE Product Line and Call Topic changes
*/

define(['N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/email', 'N/format'],
	        
function(record, search, constants, email, format){
	      
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	log.audit('<---- Script Start: Scheduled2_setDefaults_cloudExtendTasks.js ----->');

    	var emailSent = false; // Indicates whether error email sent 
    	
    	// Run search to identify all the Tasks that need to be flagged as CloudExtend Tasks:
		var get_ceTasks = search.load({
	        id: constants.LC2_SavedSearch.findCloudExtendTasks
	    });
		log.debug('after findCloudExtendTasks Search Load');
	    var myResultSet = get_ceTasks.run().getRange(0, 999);
	    var length = myResultSet.length;
	    log.debug('No. of results = ', length);		
		    
	    var taskId = null;
	    var taskrecord = null;
	    
	    if (myResultSet.length > 0){
	    	for (var x = 0; x < myResultSet.length; x++){
	       		
	    		try{
		    		// Task Internal ID **********
		    		taskId = myResultSet[x].getValue({name: 'internalid'});
		    		// log.debug('taskId = ', taskId);   		
		    		// fetch the appropriate field values (reload record because values could have changed since search was run)
		    		taskrecord = record.load({
	            		type: record.Type.TASK,
	            		id: taskId
	            	});
		    		// Set the 'is CloudExtend Task' -- Note that the record hasn't been saved yet
	        		taskrecord.setValue({
	    				fieldId: 'custevent_is_cloudextend_task',
	    				value: true,
	    				ignoreFieldChange: true,
	    				forceSyncSourcing: false				
	    			})	
		        	var ce_defaults_set = taskrecord.getValue('custevent_ce_defaults_set');
		        	var enduser_modified_already = taskrecord.getValue('custevent_enduser_modified_ce_task');
		        	
		        	// Begin Logic - Set Default Values on the Task if Not already Set
		        	if(enduser_modified_already == false && ce_defaults_set == false){
		        		// set Task Type to Email
		        		taskrecord.setValue({
		    				fieldId: 'custevent_tasktype',
		    				value: constants.LC2_TaskType.Email,
		    				ignoreFieldChange: true,
		    				forceSyncSourcing: false				
		    			})

						// US1111177 comment out the below code to set Status to Complete
/*
		    			// set Status to Complete
		    			taskrecord.setValue({
		    				fieldId: 'status',
		    				value: 'COMPLETE',
		    				ignoreFieldChange: true,
		    				forceSyncSourcing: false				
		    			})*/

		    			// if Due Date is equal to the Start Date set Due Date to two weeks from Start Date
		    			var start_date = taskrecord.getValue({fieldId: 'startdate'})
		    	        // need to format as test to allow for compare
		    			var start_date1 = format.format({
		    					  value: start_date,
		    					  type: format.Type.DATETIME
		    				  	});	
		    			var due_date = taskrecord.getValue({fieldId:'duedate'});
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
		    	            taskrecord.setValue({                   
		    	                fieldId: 'duedate',
		    	                value: start_date2,
		    	                ignoreFieldChange: true
		    	            });
		    			}
		                // set the 'CE Defaults have been set' checkbox -- so these values don't need to be set again (by scheduled job)
		    			taskrecord.setValue({
		    				fieldId: 'custevent_ce_defaults_set',
		    				value: true,
		    				ignoreFieldChange: true,
		    				forceSyncSourcing: false				
		    			})
		    			log.debug('Task ' +taskId+ ' Updated with Default values');
		        	}// End Logic - Set Default Values on the Task if Not already Set
		        	
		        	// Continue by setting the Custom Form and Saving the record
	    			taskrecord.setValue({
	    				fieldId: 'customform',
	    				value: constants.LC2_Form.CloudExtTask,
	    				ignoreFieldChange: true,
	    				forceSyncSourcing: false				
	    			})
	            	taskrecord.save({
	            		enableSourcing: true,
	            		ignoreMandatoryFields: true
	            	});
	    			log.debug('Task ' +taskId+ ' Updated as CloudExtend Task');
	    		}
				catch(e){
	            	log.error(e.name);
		           	log.error('Error in updating CloudExtend Task ID: ', taskId);
		           	// email just once if errors in run
		           	if (emailSent == false){
		           		email.send({
		           			author: constants.LC2_Employee.MercuryAlerts,
		           			recipients: constants.LC2_Email.CRMEscalation,
		           			subject: 'Scheduled2_setDefault_cloudExtendTasks Encountered an Issue',
		           			body: 'There was a problem setting Default fields for at least one Task (Id: '+taskId+') <BR><BR> Please review the system notes for this Task and also check error logs for "Scheduled2 setDefaults cloudExtendTasks" to update any other Tasks also logged in error.  More Task updates may have failed.'
		           		});
		           		emailSent = true;
		           	}
	            }       	
	    	}// end for loop
	    }// end myResultSet > 0
    }


    return {
        execute: execute
    };
    
});
