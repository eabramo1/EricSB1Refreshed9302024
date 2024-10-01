/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//
// Script:     client2_case_gobi_eba.js  
//
// Created by: Zachary Scannell 09/2022
//
//
//
//	Revisions:
//		C Neale		6/21/2018		F24082 Initial version.
//		ZScannell	9/08/2022		Refactored to SS2.1
//      PKelleher   11/14/2023      TA857346    Removed code related to script being inactivated (client_gobi_eba_assignees.js)
//                                              Make Assigned To field auto populate to Romie Conroy on creation of case
//                                              Fix defect on Search By Account field to give ability to search for 4 digits OR MORE
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['N/runtime', 'N/search', 'N/record', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case', 'N/currentRecord'],
function(runtime, search, record, L2Constants, L2Case, currentRecord) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    //PopulateCompanyOrYBPAccount : Populates Company based on YBP Account selection | Populates YBP Account based on Company selection

    function pageInit(scriptContext) {
        const currentRec = scriptContext.currentRecord;
        const currentUser = runtime.getCurrentUser();
        // New Cases
        if (scriptContext.currentRecord.id == '' || scriptContext.currentRecord.id == null){

            // Set Profile to YBP Customer Support
            // Set GOBI EBA Case Indicator
            // Set origin to "Internal"
            // Set Assigned To to Romie Conroy
            currentRec.setValue({
                fieldId: 'custevent_gobi_eba_case',
                value: true,
                ignoreFieldChange: true
            });
            currentRec.setValue({
                fieldId: 'profile',
                value: L2Constants.LC2_Profiles.YBPSupport,
                ignoreFieldChange: true
            });
            currentRec.setValue({
                fieldId: 'origin',
                value: L2Constants.LC2_CaseOrigin.Internal,
                ignoreFieldChange: true
            });
            // TA857346 - set Assigned To to Romie Conroy on all newly created cases
            currentRec.setValue({
                fieldId: 'assigned',
                value: L2Constants.LC2_Employee.RomieConroy,
                ignoreFieldChange: true
            });
        }
        // Existing Cases
        else{
            if (currentRec.getValue({fieldId: 'custevent_gobi_eba_case'}) != true){
                currentRec.setValue({
                    fieldId: 'custevent_gobi_eba_case',
                    value: true,
                    ignoreFieldChange: true
                });
            }
        }
        // All Cases
        //change ybp accountnumber search box color
        document.getElementById('custpage_ybp_search_by_acctnum_formattedValue').style.backgroundColor = '#EFFFEF';

        // If user is not an admin
        if (currentUser.role != L2Constants.LC2_Role.Administrator){
        	// Do not allow assignee field to be edited (unless an administrator)
            currentRec.getField({fieldId: 'assigned'}).isDisabled = true;
         // From Code Review 2022-09-08 - Disabled Profile field as we require it saved as YBP Support
            currentRec.getField({fieldId: 'profile'}).isDisabled = true;
        }
        // Set the internal only flag for the Case Note box
        currentRec.setValue({
            fieldId: 'internalonly',
            value: true,
            ignoreFieldChange: true
        });

        // Attempt to populate YBP Account if company was already populated during case capture
        L2Case.L2_PopulateCompanyOrYBPAccount();
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        const currentRec = scriptContext.currentRecord;
        switch(scriptContext.fieldId){
            case 'custevent_ybp_account':
                let ybpAccountFieldValue = currentRec.getValue({fieldId: 'custevent_ybp_account'});
                if (ybpAccountFieldValue != '' && ybpAccountFieldValue != null){
                    let ybpAccountRecord = record.load({
                        type: 'CUSTOMRECORD_YBP_ACCOUNT',
                        id: ybpAccountFieldValue
                    });
                    let ybpAccountCustomer = ybpAccountRecord.getValue({fieldId: 'custrecord_ybpa_customer'});
                    if (ybpAccountCustomer != currentRec.getValue({fieldId: 'company'})){
                        currentRec.setValue({
                            fieldId: 'company',
                            value: '',
                            ignoreFieldChange: true
                        });
                        currentRec.setValue({
                            fieldId: 'custpage_ybp_search_by_acctnum',
                            value: '',
                            ignoreFieldChange: true
                        });
                        L2Case.L2_PopulateCompanyOrYBPAccount();
                    }
                }
                break;
            // TA857346 Fix defect on Search By Account field to give ability to search for 4 digits OR MORE
            case 'custpage_ybp_search_by_acctnum':
                let ybpAccountNumber = currentRec.getValue({fieldId: 'custpage_ybp_search_by_acctnum'});
                if (ybpAccountNumber.toString().length >= 4){
                    let results = search.create({
                        type: 'CUSTOMRECORD_YBP_ACCOUNT',
                        filters: [
                            search.createFilter({
                                name: 'custrecord_ybpa_account_number_integer',
                                operator: search.Operator.EQUALTO,
                                values: ybpAccountNumber
                            }),
                            search.createFilter({
                                name: 'isinactive',
                                operator: search.Operator.IS,
                                values: 'F'
                            })
                        ],
                        columns: ['internalid']
                    }).run().getRange({start: 0, end: 1000});
                    if (results.length == 1){
                        currentRec.setValue({
                            fieldId: 'custevent_ybp_account',
                            value: results[0].getValue({name: 'internalid'}),
                            ignoreFieldChange: false
                        });
                    }
                }
                break;
            case 'company':
                L2Case.L2_PopulateCompanyOrYBPAccount();
                break;
        }
    } // end fieldChanged function

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        const currentRec = scriptContext.currentRecord;
        // Validate Escalatee populated if Status == 'Escalated'
        if (currentRec.getValue({fieldId: 'stage'}) == 'ESCALATED'){
            if (currentRec.getLineCount({sublistId: 'escalateto'}) == 0){
                alert('A case in an Escalated status needs at least one Escalatee. Change your status to something other than Escalated or visit the \'Escalation\' subtab to add an Escalatee');
                return false;
            }
        }
        // Validate Profile
        if (currentRec.getValue({fieldId: 'profile'}) != L2Constants.LC2_Profiles.YBPSupport){
            alert('Only cases with the YBP Support profile can use this form.');
            return false;
        }
        // Validate Currency present if monetary values are selected
        const gobiEbaListPrice = currentRec.getValue({fieldId: 'custevent_gobi_eba_list_price'});
        const gobiEbaListCurrency = currentRec.getValue({fieldId: 'custevent_gobi_eba_list_price_currency'});
        if ((gobiEbaListPrice != '' && gobiEbaListPrice != null) && gobiEbaListPrice != 0 && (gobiEbaListCurrency == '' || gobiEbaListCurrency == null)){
            alert('Please select a List Price Currency');
            return false;
        }

        const gobiEbaCost = currentRec.getValue({fieldId: 'custevent_gobi_eba_cost'});
        const gobiEbaCostCurrency = currentRec.getValue({fieldId: 'custevent_gobi_eba_cost_currency'});
        if ((gobiEbaCost != '' && gobiEbaCost != null) && gobiEbaCost != 0 && (gobiEbaCostCurrency == '' || gobiEbaCostCurrency == null)){
            alert('Please select a Cost Price Currency');
            return false;
        }

        const gobiEbaMargCommAmt = currentRec.getValue({fieldId: 'custevent_gobi_eba_marg_comm_amt'});
        const gobiEbaMargCommCurr = currentRec.getValue({fieldId: 'custevent_gobi_eba_marg_comm_curr'});
        if ((gobiEbaMargCommAmt != '' && gobiEbaMargCommAmt != null) && gobiEbaMargCommAmt != 0 && (gobiEbaMargCommCurr == '' || gobiEbaMargCommCurr == null)){
            alert('Please select a Margin/Commission Amount Currency');
            return false;
        }
        const gobiEbaDepAmt = currentRec.getValue({fieldId: 'custevent_gobi_eba_deposit_amt'});
        const gobiEbaDepCurr = currentRec.getValue({fieldId: 'custevent_gobi_eba_deposit_curr'});
        if ((gobiEbaDepAmt != '' && gobiEbaDepAmt != null) && gobiEbaDepAmt != 0 && (gobiEbaDepCurr == '' || gobiEbaDepCurr == null)){
            alert('Please select a Deposit Amount Currency');
            return false;
        }
        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
