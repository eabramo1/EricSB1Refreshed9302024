/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
 * Script:  client2_case_OPgeneral.js 
 *
 * Description:  Form script for EIS Accounts Payable Case Form 
 * 		
 * 		Library Scripts Used:	library2_constants.js 
 * 
 */
// File created:	07-11-2022	ZScannell
//
//
// Amendment Log:
//		2021-03-25	pKelleher	US759688 - Add Assignees to OP Case Request Type values on OP General Case form
//  	2022-07-07  ZScannell   Refactored into SS2
//
//-----------------------------------------------------------------------------------------------------------------------------------------//

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/search', 'N/currentRecord'],
function(LC2Constants, runtime, search, currentRecord){

    // Global Variable for the value in the OP Request Type field - for ProForma (used in Field Changed function)
    var opReqTypeOnLoad = null;

    function pageInit(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var userObj = runtime.getCurrentUser();
        // If a brand new OE General Case
        if (currentRec.getValue({fieldId: 'id'}) == '' || currentRec.getValue({fieldId: 'id'}) == null){
            // set Created By field to the current user\
            currentRec.setValue({
                fieldId: 'custeventcustsat_prj_emp',
                value: userObj.id,
                ignoreFieldChange: true
            });
            // populate Main Site CustID if you can grab it
		    // look at company field - if it's populated (with a REAL company)
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

        // Set the OP Case flag if it's not populated
        if (currentRec.getValue({fieldId: 'custevent_oe_case'}) == false){
            currentRec.setValue({
                fieldId: 'custevent_oe_case',
                value: true,
                ignoreFieldChange: true
            });
        }

        // Set the OP Case Type field if it's not populated (1 = General OE Case)
        if (currentRec.getValue({fieldId: 'custevent_oe_case_type'}) == '' || currentRec.getValue({fieldId: 'custevent_oe_case_type'}) == null){
            currentRec.setValue({
                fieldId: 'custevent_oe_case_type',
                value: LC2Constants.LC2_OE_Case_Type.General,
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

        // Set opReqTypeOnLoad
        opReqTypeOnLoad = currentRec.getValue({fieldId: 'custevent_oe_request_type'});
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

        if (fieldId == 'custevent_oe_request_type'){
            // Get value of OP Case Request Type field
            var opCaseReqType = currentRec.getValue({fieldId: 'custevent_oe_request_type'});
            var assigneeLookup = search.lookupFields({
                type: 'customrecord_oe_case_request_type',
                id: opCaseReqType,
                columns: ['custrecord_op_default_assigned_to']
            });
            currentRec.setValue({
                fieldId: 'assigned',
                value: assigneeLookup.custrecord_op_default_assigned_to[0].value,
                ignoreFieldChange: true
            });
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        copyOriginalMessage: copyOriginalMessage
    }

})