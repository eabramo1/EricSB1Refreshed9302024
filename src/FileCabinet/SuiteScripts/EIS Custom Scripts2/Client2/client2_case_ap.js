/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
 * Script:  client_case_ap.js 
 *
 * Description:  Form script for EIS Accounts Payable Case Form 
 * 		
 * 		Library Scripts Used:	library2_constants.js 
 * 
 */
// File created:	07-07-2022	ZScannell
//
//
// Amendment Log:
//		2019-05-31	eAbramo		Posted file to Production
//  	2022-07-07  ZScannell   Refactored into SS2
//
//-----------------------------------------------------------------------------------------------------------------------------------------//

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime'],
    function(LC2Constants, runtime){
        function pageInit(scriptContext){
            var currentRec = scriptContext.currentRecord;

            // Preset Profile if it isn't set
            if (currentRec.getValue({fieldId: 'profile'}) != LC2Constants.LC2_Profiles.AccPay){
                // Set Profile to the EIS Accounts Payable (28) profile
                currentRec.setValue({
                    fieldId: 'profile',
                    value: LC2Constants.LC2_Profiles.AccPay,
                    ignoreFieldChanged: true
                });
            }

            // Preset Assigned if it's empty
            var assignedTo = currentRec.getValue({fieldId: 'assigned'});
            if(assignedTo == '' || assignedTo == null){
                currentRec.setValue({
                    fieldId: 'assigned',
                    value: runtime.getCurrentUser().id,
                    ignoreFieldChanged: true
                })
            }
        }

        function saveRecord(scriptContext){
        	var currentRec = scriptContext.currentRecord;
        	// Set Profile to Accounts Payable if it's different
            if (currentRec.getValue({fieldId: 'profile'}) != LC2Constants.LC2_Profiles.AccPay){
                currentRec.setValue({
                    fieldId: 'profile',
                    value: LC2Constants.LC2_Profiles.AccPay,
                    ignoreFieldChanged: true
                });
            }
            return true;
        }
    
    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
})