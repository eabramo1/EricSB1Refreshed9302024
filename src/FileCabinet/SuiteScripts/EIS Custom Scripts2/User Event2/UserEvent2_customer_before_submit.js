/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/* Script:     UserEvent2_customer_before_submit.js
 *
 * Created by: Christine Neale
 *
 *
 * Revisions:  
 *	CNeale  	03/25/2021	US734954 Original version
 *	CNeale		03/15/2022	US905097 Transition Center changes - remove default date and cohort from Xedit as no longer used
 *	eAbramo		03/16/2022	US911182 Fix defects with OE approval and Customer is Inactive flags	
 *
*/

define(['N/error', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],

function(error, runtime, LC2Constant) {
   
    /**
     * Function definition to be triggered before record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	//Retrieve User Role
    	var userRole = runtime.getCurrentUser().role;
    	log.debug('userRole', userRole);
    	
    	// Retrieve Old & New Details
        var oldRecord = scriptContext.oldRecord;
        var newRecord = scriptContext.newRecord;
   
        // Do NOT allow any of the Transition Fields (EDS/eHost/Explora/Ref Center) to be set via XEDIT (unless by Admin or web service roles)
        log.debug('context', scriptContext.type);
        if (scriptContext.type == scriptContext.UserEventType.XEDIT && userRole != LC2Constant.LC2_Role.Administrator && userRole != LC2Constant.LC2_Role.WebServ){
        	
        	log.debug('XEDIT', 'start');
      		var custText = oldRecord.getText({fieldId: 'entityid'});
    		var n = custText.indexOf(" ");
    		var custId = custText.substring(0, n);
        	
        	var newEDSstatus = newRecord.getValue({fieldId: 'custentity_eds_transition_status'});
        	var newEDSdate = newRecord.getValue({fieldId: 'custentity_eds_transition_date'});
        	var newEDSsetBy = newRecord.getValue({fieldId: 'custentity_eds_transition_dte_setby'});
        	if(newEDSstatus || newEDSdate || newEDSsetBy){ 
        		log.debug('EDS Transition Fields', 'Set via XEDIT');
				var errorobj = error.create({
            		name:  'EDS Transition Fields XEDIT',
            		message: 'EDS Transition Fields cannot be set in this way. Customer ' + custId + ' has not been updated (you may need to refresh list to see).',
            		notifyOff:	true
            	})
            	throw errorobj.message;
         	}
        	
        	var newEhostStatus = newRecord.getValue({fieldId: 'custentity_ehost_transition_status'});
        	var newEhostdate = newRecord.getValue({fieldId: 'custentity_ehost_transition_date'});
        	var newEhostsetBy = newRecord.getValue({fieldId: 'custentity_ehost_transition_dte_setby'});
           	if(newEhostStatus || newEhostdate || newEhostsetBy){
        		log.debug('EDS Transition Fields', 'Set via XEDIT');
				var errorobj = error.create({
            		name:  'eHost Transition Fields XEDIT',
            		message: 'eHost Transition Fields cannot be set in this way. Customer ' + custId + ' has not been updated (you may need to refresh list to see).',
            		notifyOff:	true
            	})
            	throw errorobj.message;
         	}
        	
        	var newExploraStatus = newRecord.getValue({fieldId: 'custentity_explora_transition_status'});
        	var newExploradate = newRecord.getValue({fieldId: 'custentity_explora_transition_date'});
        	var newExplorasetBy = newRecord.getValue({fieldId: 'custentity_explora_transition_dte_setby'});
        	if(newExploraStatus || newExploradate || newExplorasetBy){
        		log.debug('EDS Transition Fields', 'Set via XEDIT');
				var errorobj = error.create({
            		name:  'Explora Transition Fields XEDIT',
            		message: 'Explora Transition Fields cannot be set in this way. Customer ' + custId + ' has not been updated (you may need to refresh list to see).',
            		notifyOff:	true
            	})
            	throw errorobj.message;
         	}
        	
        	var newRefCtrStatus = newRecord.getValue({fieldId: 'custentity_refctr_transition_status'});
        	var newRefCtrdate = newRecord.getValue({fieldId: 'custentity_refctr_transition_date'});
        	var newRefCtrsetBy = newRecord.getValue({fieldId: 'custentity_refctr_transition_dte_setby'});
        	if(newRefCtrStatus || newRefCtrdate || newRefCtrsetBy){
        		log.debug('EDS Transition Fields', 'Set via XEDIT');
				var errorobj = error.create({
            		name:  'Ref Center Transition Fields XEDIT',
            		message: 'Ref Center Transition Fields cannot be set in this way. Customer ' + custId + ' has not been updated (you may need to refresh list to see).',
            		notifyOff:	true
            	})
            	throw errorobj.message;
         	}
        	
        	// US911182 Fix defects with OE approval and Customer is Inactive flags
        	var oldIsInactive = oldRecord.getValue({fieldId: 'isinactive'});
        	var newIsInactive = newRecord.getValue({fieldId: 'isinactive'});
        	log.debug('oldIsInactive is '+oldIsInactive , 'newIsInactive is '+newIsInactive);
        	if(newIsInactive && (newIsInactive == true && oldIsInactive == false)){
            	log.debug('is Inactive Field', 'Set via XEDIT');
    			var errorobj = error.create({
               		name:  'Inactive Field XEDIT',
               		message: 'The "Inactive" field cannot be set in this way. Customer ' + custId + ' has not been updated (you may need to refresh this list to see).',
               		notifyOff:	true
               	})
            	throw errorobj.message;
         	}     	
        } // End of XEDIT
    }

    return {
        beforeSubmit: beforeSubmit
    }
    
    
});
