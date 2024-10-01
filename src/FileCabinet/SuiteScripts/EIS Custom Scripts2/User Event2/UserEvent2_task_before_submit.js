/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/* Script:     UserEvent2_task_before_submit.js
 *
 * Created by: Eric Abramo 09-28-2022
 *
 * Library Scripts Used: 
 *
 * Revisions/Purpose of code added:
 * 		09-28-2022	eAbramo		Code Added to prevent Closing a Task via XEDIT if the Assignee doesn't match the owner
 * 								(Allyson Zellner reported problem of Task owners completing Customer Training request tasks - when the Assignee should be closing them instead)
 *   	12-07-2022	eAbramo		Originally added code for US1010709 CloudExtend Task: Auto-default data for Tasks created through CloudExtend
 *   							But have since 12-15-2022 removed that code.  However additional logic has been added to only run code when not Web Service Role
 *   
*/
		
define(['N/error', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],

function(error, runtime, constants) {  


    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	log.debug('Entering beforeSubmit function:');
    	log.debug('scriptContext.type', scriptContext.type);
    	
    	// Retrieve Old & New Details
        // var oldRecord = scriptContext.oldRecord;
        // log.debug('oldRecord', oldRecord);
        var newRecord = scriptContext.newRecord;
        // log.debug('newRecord', newRecord);
        if (runtime.getCurrentUser().role != constants.LC2_Role.WebServ){
            if (scriptContext.type == scriptContext.UserEventType.MARKCOMPLETE){
                // log.debug('markcomplete', 'start')
                var isTrainingTask = newRecord.getValue({fieldId: 'custevent_is_trainer_task'});
                if(isTrainingTask == true){
                	// log.debug('This is a Training Task', '1');
                	var assignee = newRecord.getValue({fieldId: 'assigned'});
                	var user = runtime.getCurrentUser().id;
                	log.debug('assignee is '+assignee, 'user is '+user);
                	if(assignee != user){
                		// log.debug('This should NOT be allowed');
            			var errorobj = error.create({
                        	name:  'Non-Assignee Attempted to Mark Complete a Training Task',
                        	message: 'Error:  Only the Task Assignee is able to mark a Training Task Complete.  Task has not been updated (you may need to refresh the page).',
                        	notifyOff:	true
                        });
                        throw errorobj.message;
                	}
                }	// END 'Is Training Task' is True
            } // END MARKCOMPLETE        	
        }	// END Role is not WebService
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
