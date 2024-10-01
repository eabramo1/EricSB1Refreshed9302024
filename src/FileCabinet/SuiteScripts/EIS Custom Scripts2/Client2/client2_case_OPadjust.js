/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
 * Script:  client2_case_OPadjust.js 
 *
 * Description:  
 * 		
 * 		Library Scripts Used:	library2_constants.js 
 * 
 */
// File created:	07-11-2022	ZScannell
//
//
// Amendment Log:
//  	2022-07-11  ZScannell   Refactored into SS2
//
//-----------------------------------------------------------------------------------------------------------------------------------------//

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/search', 'N/currentRecord'],
function(LC2Constants, runtime, search, currentRecord){

    // Global Variable for the value in the OP Request Type field - for ProForma (used in Field Changed function)
    var opReqTypeOnLoad = null;

    function pageInit(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var userObj = runtime.getCurrentUser();
        if (currentRec.getValue({fieldId: 'id'}) == '' || currentRec.getValue({fieldId: 'id'}) == null){
        	// Assign to Dawn Wile (115)
            currentRec.setValue({
                fieldId: 'assigned',
                value: '115',
                ignoreFieldChange: true
            });

            // Set Created By field to the current user
            currentRec.setValue({
                fieldId: 'custeventcustsat_prj_emp',
                value: userObj.id,
                ignoreFieldChange: true
            });

            // Populate Main Site CustID if you can grab it
            // Look @ company field - if it's populated (with a REAL company)
            if (currentRec.getValue({fieldId: 'company'}) != '' && currentRec.getValue({fieldId: 'company'}) != null){
                // Set the OP Customer field to match it
                currentRec.setValue({
                    fieldId: 'custevent_oe_customer',
                    value: currentRec.getValue({fieldId: 'company'}),
                    ignoreFieldChange: true
                });
            }
            // Now set the compay field to the current user
            currentRec.setValue({
                fieldId: 'company',
                value: userObj.id,
                ignoreFieldChange: true
            });
        }
        
        // Lock the Status field if not OP role or Admin Role
        if (userObj.role != LC2Constants.LC2_Role.Administrator &&  userObj.role != LC2Constants.LC2_Role.EPOrdProc && userObj.role != LC2Constants.LC2_Role.EISBHamActRec)
        {
            currentRec.getField({fieldId: 'status'}).isDisabled = true;
        }

        // Set the OE Case flag if it's not populated
        if (currentRec.getValue({fieldId: 'custevent_oe_case'}) == false){
            currentRec.setValue({
                fieldId: 'custevent_oe_case',
                value: true,
                ignoreFieldChange: true
            });
        }

        // Set the OE Case Type field if it's not populated (2 = Adjustments and Cancellations and Mid-Term Upgrades)
        if (currentRec.getValue({fieldId: 'custevent_oe_case_type'}) == '' || currentRec.getValue({fieldId: 'custevent_oe_case_type'}) == null){
            currentRec.setValue({
                fieldId: 'custevent_oe_case_type',
                value: LC2Constants.LC2_OE_Case_Type.AdjCancelMT,
                ignoreFieldChange: true
            });
        }

        //set Help Desk flag if it's not populated
        if (currentRec.getValue({fieldId: 'helpdesk'}) == false){
            currentRec.setValue({
                fieldId: 'helpdesk',
                value: true,
                ignoreFieldChange: true
            });
        }
    }

    var originalMessageCopied = false;
    function copyOriginalMessage(){
    	var currentRec = currentRecord.get();
        if (originalMessageCopied == false){
            currentRec.setValue({
                fieldId: 'outgoingmessage',
                value: currentRec.getValue({fieldId: 'outgoingmessage'}) + '\n\n--- Original Message ---\n' + currentRec.getValue({fieldId: 'incomingmessage'}),
                ignoreFieldChange: true
            });
            originalMessageCopied = true;
        }
    } 

    function fieldChanged(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var fieldId = scriptContext.fieldId;

        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        copyOriginalMessage: copyOriginalMessage
    }

})