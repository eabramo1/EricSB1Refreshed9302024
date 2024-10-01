/* 
UserEvent2_opportunity_before_submit.js

This script is run only on BEFORESUBMIT of a Case record.
Created 12/21/2021

Change History
12/21/2021	PKelleher		US856350 new Product Target form - XEdit on Product Target Status field and code to match real status field to Product Target Status field

*/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/error'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, runtime, constants, error) {
   
    function beforeSubmit(context) {
    	log.debug('Entering beforeSubmit function:');
    	log.debug('context.type', context.type);
    	// Retrieve Old & New Details
        var oldRecord = context.oldRecord;
        log.debug('oldRecord', oldRecord);
        var newRecord = context.newRecord;
        log.debug('newRecord', newRecord);
        
        var oRec = {
        	oppyStatus: null,
        	productTargetStatus: null
        };     
        // if (context.type != context.UserEventType.CREATE){
        if (oldRecord){ 		
        	oRec.oppyStatus = oldRecord.getValue({fieldId: 'entitystatus'});
        	oRec.productTargetStatus = oldRecord.getValue({fieldId: 'custbody_pt_status'});
        }

        var nRec = {
        	oppyStatus: null,
        	productTargetStatus: null
        }
        if (newRecord){
        	nRec.oppyStatus = newRecord.getValue({fieldId: 'entitystatus'});
        	nRec.productTargetStatus = newRecord.getValue({fieldId: 'custbody_pt_status'});
        }
       	log.debug('oRec.productTargetStatus', oRec.productTargetStatus);
    	log.debug('nRec.productTargetStatus', nRec.productTargetStatus);

    	// US856350 - new Product Target form - Prevent Product Target Status field to be changed on XEDIT and code to match real status field to Product Target Status field 
        if (context.type == context.UserEventType.XEDIT){	
        	// Check Product Target Status field
        	if(nRec.productTargetStatus && oRec.productTargetStatus != nRec.productTargetStatus){
        		log.debug('inside oRec.productTargetStatus != nRec.productTargetStatus code');
				var errorobj = error.create({
            		name:  'Product Target Status change via XEdit',
            		message: 'Inline editing is not allowed on the Product Target Status field.  Please open the form to make this update.',
            		notifyOff:	true
            	})
            	throw errorobj.message;
        	}    

        	if(nRec.oppyStatus && oRec.oppyStatus != nRec.oppyStatus){
        		log.debug('inside oRec.oppyStatus != nRec.oppyStatus code');
				var errorobj = error.create({
            		name:  'Opportunity Status change via XEdit',
            		message: 'Inline editing is not allowed on the Status field.  Please open the form to make this update.',
            		notifyOff:	true
            	})
            	throw errorobj.message;
        	}    
        } 
        
    } // end beforeSubmit function


    return {
        beforeSubmit: beforeSubmit,
    };
    
});
