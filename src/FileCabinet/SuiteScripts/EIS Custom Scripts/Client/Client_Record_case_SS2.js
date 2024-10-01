// Script:		Client_Record_case_SS2.js
// 		 		Written in SuiteScript 2.0
//
// Created by:	Krizia Ilaga (of NetSuite ACS)  05-2019
//
// Purpose:		For EIS Accounts Payable Case Management Onboarding to NetCRM
//				The script redirects the user to the Delete Attachments Suitelet after clicking the Delete Attachment button
//				Also note the Delete Attachment button is rendered in the User Event Before Load SS2 (case) script
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
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url'],
/**
 * @param {record} record
 * @param {search} search
 */
function(url) {
    function pageInit(scriptContext){

    }

    function redirectToSuitelet(caseId) {
        var suitelet = url.resolveScript({
            scriptId: 'customscript_nsacs_delete_attachment',
            deploymentId: 'customdeploy_nsacs_delete_attachment',
            params: {
                'custparam_caseId': caseId
            }
        });
        window.location = suitelet;

    }

    return {
        pageInit: pageInit,
        redirectToSuitelet: redirectToSuitelet
    };
    
});
