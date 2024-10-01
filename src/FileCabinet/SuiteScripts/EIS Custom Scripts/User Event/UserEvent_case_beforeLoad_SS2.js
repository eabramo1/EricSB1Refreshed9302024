// Script:		UserEvent_case_beforeLoad_SS2.js
// 		 		Written in SuiteScript 2.0
//
// Created by:	Krizia Ilaga (of NetSuite ACS)  05-2019
//
// Purpose:		For EIS Accounts Payable Case Management Onboarding to NetCRM
//				The script renders the Delete Attachment button on the AP Case Profile only
//				The script calls the script Client_Record_case_ss2.js (which in turn calls a suitelet to build the Delete Attachments form)
//				Note there is a hard-coded script ID and hard-coded profile ID in the below code
//			
//
//Library Scripts Used: 	None
//
//
// Revisions:  
//
//
//
//----------------------------------------------------------------------------------------------------------------


/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        var rec = scriptContext.newRecord;
        var caseProfile = rec.getValue({
            fieldId: 'profile'
        });
        // EIS Accounts Payable Profile = 28
        if(caseProfile == '28'){
        	// 76410683 is a hard-coded file ID of the javascript being called
            scriptContext.form.clientScriptFileId = 76410683;
            scriptContext.form.addButton({
                id : 'custpage_deletebutton',
                label : 'Delete Attachments',
                functionName: "redirectToSuitelet('" + rec.id + "')"
            });
        }
        
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
