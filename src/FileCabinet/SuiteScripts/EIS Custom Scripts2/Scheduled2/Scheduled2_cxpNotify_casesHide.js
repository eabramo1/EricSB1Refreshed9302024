/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
/* Script:   Scheduled2_cxpNotify_casesHide.js
 * 
 * Purpose:  This script finds all CXP Notifications for Hide Case that have been handled in Salesforce and removes the SFID from the 
 *           Case in NetSuite
 *           It also handles updating CXP Notifications for Hide Case relating to "createNew" Cases 
 *           Expanded to cater for "Delete Case" scenarios as well 
 * 
 * Created by: Christine Neale
 *
 * Revisions:  
 *	CNeale		11/3/2021	Original version
  *	CNeale		12/06/2021 	US868211 Expand to cater for deleted cases - also add in check that SFID matches. 
 *	
*/
define(['N/error', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/email'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */
function(error, record, search, LC2Constant, email) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	
    	log.audit('<---- Script Start: Scheduled2_cxpNotify_casesHide----->');
    	
    	var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
    	var LC2_createNew = LC2Constant.LC2_SF_createNew;  // Global variable holding createNew 
    	var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
    	var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
    	var LC2_delSts = LC2Constant.LC2_SfCaseDelSts; // Global variable holding Case SF Delete Statuses
    	var LC2_act = LC2Constant.LC2_CxpNsAct; // CXP NS to SF Notification Actions
    	
    	// Handled CXP Notifications //
	  
    	// Run search to identify all the handled Cases we need to look at:
		var caseSearch = search.load({
	        id: LC2_SS.cxp_hide_handled
	    });    				
        
		log.debug('after handled Case Search Load');
	    var myResultSet = caseSearch.run().getRange(0, 999);
	    var length = myResultSet.length;
	    log.audit('No. of handled results = ', length);
	    
	    if (myResultSet.length > 0){
	    	for (var x in myResultSet) {
	    		try{
	    			var caseId = myResultSet[x].getValue({
	    				name: 'custrecord_nssf_case'});
	    			var cxpsfid = myResultSet[x].getValue({
	    				name: 'custrecord_nssf_sf_id'});
	    			var cxpact = myResultSet[x].getValue({
	    				name: 'custrecord_nssf_action'});
        	  			
	    			// Load the Case 
	    			var caseRecord = record.load({
	    				type: record.Type.SUPPORT_CASE,
	    				id: caseId
	    			});
	    			// US686211 Only perform updates if SFID's match  
	    			if (caseRecord.getValue('custevent_sf_case_id') == cxpsfid){
	    				// Update the SF Case ID to blank
	    				caseRecord.setValue('custevent_sf_case_id', '');  // SF Case ID
	    				if (LC2_act.delCaseAct(cxpact) == true ){
	    					// US686211 Update the SF Case delete status to "Complete" - Only for Case delete actions 
	    					caseRecord.setValue('custevent_sf_case_del_sts', LC2_delSts.complete);
	    				}
	    				// Submit the record
	    				caseRecord.save({
	    					enableSourcing: true,
	    					ignoreMandatoryFields: true
	    				});
	    				log.debug('Case ' +caseId+ ' SF ID Cleared');
	    			}
	    		}
               	catch(e){
	            	log.error(e.name);
		           	log.error('CXP clear Case SFID error case Id ', caseId);
	            }
	    	} //End handled for
	    } // End handled if 
	    
	    // createNew CXP Notifications
        	
	    // Run search to identify all the createNew Cases we need to look at:
		var createSearch = search.load({
	        id: LC2_SS.cxp_hide_createNew
	    });    				
        
		log.debug('after createNew Case Search Load');
	    var myResults = createSearch.run().getRange(0, 999);
	    var length = myResults.length;
	    log.audit('No. of createNew results = ', length);
	    
	    if (myResults.length > 0){
	    	for (var i in myResults) {
	    		var result = myResults[i];
	            var nsSfId = result.getValue(result.columns[4]);
	            var agehrs = result.getValue(result.columns[1]);
	            var nsId = result.getValue(result.columns[2]);
	            var cxpId = result.getValue(result.columns[0]);
     
	            try{      
	            	if (nsSfId && nsSfId != LC2_createNew){
	            		// Case has been added to SF so update SFID to CXP record replacing createNew
	            		// Load the CXP Notify Record 
	            		var cxpRecord = record.load({
	            			type: 'customrecord_cxp_nssf_notify',
	            			id: cxpId
	            		});	
	            		// Update the CXP SF Case ID to match the NS SF Case ID
	            		cxpRecord.setValue('custrecord_nssf_sf_id', nsSfId);  // SF Case ID
	            		// Submit the record
	            		cxpRecord.save({
	            			enableSourcing: true,
	            			ignoreMandatoryFields: true
	            		});
	            		log.debug('CXP ' +cxpId+ ' updated to SFID '+nsSfId);
	            	}
	            	
	            	else if((nsSfId == LC2_createNew && agehrs > 6)||(!nsSfId )){
	            		// Case has not been added to SF in time limit - Clear Case SfId and mark CXP notify as handled 
	            		// OR Case does not have SFID
	            		var act = 'Expected Action: Please check whether case exists in SF. <BR>     If it does please update SFID to both CXP record & NS Case & mark the CXP record as UNHANDLED. <BR>     If it does NOT please clear the NS Case SFID if present.';
	            		
	            		email.send({
	                        author: LC2_emp.MercuryAlerts,
	                        recipients: LC2_email.CRMEscalation,
	                        subject: 'Hide/Delete Case CXP NS to SF Notification Record "createNew" Issue, CXP Record Internal ID: ' +cxpId,
	                        body: 'An issue has been detected with CXP NS to SF Notification Record with internal ID: ' +cxpId+ ' NS Case internal ID: ' +nsId+ ' please investigate and take appropriate action. <BR><BR>' +act+ ' '  
	                    });
	            		var cxpRecord = record.load({
	            			type: 'customrecord_cxp_nssf_notify',
	            			id: cxpId
	            		});	
	            		// Update the CXP record as handled (to prevent repeat reporting)
	            		cxpRecord.setValue('custrecord_nssf_notification_handled', true);  // SF Case ID
	            		// Submit the record
	            		cxpRecord.save({
	            			enableSourcing: true,
	            			ignoreMandatoryFields: true
	            		});
	            		log.debug('CXP ' +cxpId+ ' with createNew issue updated to handled');
	            	}
	            }
	            catch(e){
	            	log.error(e.name);
	            	log.error('CXP createNew Error ID ', cxpId);
	            }
	    	}
	    }
	    
    }

    return {
    	execute: execute
    };
  
});
