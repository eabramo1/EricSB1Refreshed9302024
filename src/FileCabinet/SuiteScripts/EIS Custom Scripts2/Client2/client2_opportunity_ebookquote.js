/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_opportunity_ebookquote.js
//				Written in SuiteScript 2.1
//
//Created by:	Jeff Oliver 12-2023
//
//Purpose:		Refactoring code from SuiteScript 1 client script that is used for the x form
//
//Library Scripts Used: library2_constants, Library2_utility (both linked in define statement)
//
//
//Revisions:
//          2024-08-06  eAbramo     US1277421 SuiteSign-On Replacement for eBook Quote Tool application
//
//----------------------------------------------------------------------------------------------------------------

define(['N/record', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

    function(record, runtime, constant, utility) {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInit(scriptContext) {
        var record = scriptContext.currentRecord;
        var mode = scriptContext.mode;


        if (runtime.getCurrentUser().role != constant.LC2_Role.Administrator && runtime.getCurrentUser().role != constant.LC2_Role.WebServ) {
            if (mode != 'create') {
                record.getField({fieldId: 'customform'}).isDisabled = true;
            }
            record.getField({fieldId: 'custbody_oppty_form_type'}).isDisabled = true;
        }
    }	// end pageInit



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
        var record = scriptContext.currentRecord;
        var form_type = record.getValue({fieldId: 'custbody_oppty_form_type'});
        var oppty_cust = record.getValue({fieldId: 'entity'}); //US1277421

        // US1277421
        if (utility.LU2_isEmpty(oppty_cust) == true){
            alert('This eBook Quote Tool Opportunity needs a Customer');
            return false;
        }

        // set the Opportunity Form Type field
        if (utility.LU2_isEmpty(form_type) || form_type !== constant.LC2_OppyFormType.ebookQuote)
        {
            record.setValue({
                fieldId: 'custbody_oppty_form_type',
                value: constant.LC2_OppyFormType.ebookQuote,
                ignoreFieldChange: true
            });
        }
        return true;
    }  // end saveRecord



    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});