/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//
// Script:		Client2_Record_opportunity.js
// 		 		Written in SuiteScript 2.1
//
// Created by:	Pat Kelleher - August 2024
//
// Purpose:		Validation for Opportunity records
//
// Revisions:
//
//
define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
/**
 * @param{format} format
 * @param{record} record
 * @param{render} render
 * @param{runtime} runtime
 * @param{search} search
 * @param{dialog} dialog
 * @param{serverWidget} serverWidget
 */
function(runtime, L2Utility) {

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

    } // end pageInit


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

    } // end fieldChanged


    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
/*
    function validateField(scriptContext) {

    } // end validateField function
*/

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
/*
    function saveRecord(scriptContext) {

    } // end saveRecord
*/

    // Function used in userevent2 oppy before load script for Nor SSO Quote Tools
    function sendQuoteToolRequest(salesOppyCustIn) {
        //alert('salesOppyCustIn is ' + salesOppyCustIn);
        var url = '';
        //alert('crmIdsIn is ' + crmIdsIn);
        if(L2Utility.LU2_isProdEnvironment(runtime.envType) === true){
            url = 'https://quotetools.epnet.com/QuoteTools/api/homeForQtools/oauth2?cust_nskey='+salesOppyCustIn;
        }
        else{
            url = 'https://qa-quotetools.epnet.com/QuoteTools/api/homeForQtools/oauth2?cust_nskey='+salesOppyCustIn;
        }
        console.log('url: ' + url);
        window.open(url, '_blank');

   } // end sendQuoteToolRequest function


    function sendQuoteToolSubjectSetRequest(salesOppyCustIn, crmIdsIn) {
        var url = '';
        //alert('crmIdsIn is ' + crmIdsIn);
        if(L2Utility.LU2_isProdEnvironment(runtime.envType) === true){
            url = 'https://quotetools.epnet.com/QuoteTools/api/homeForQtools/oauth2?crm_ids=' + crmIdsIn + '&cust_nskey=' + salesOppyCustIn;
        }
        else{
            url = 'https://qa-quotetools.epnet.com/QuoteTools/api/homeForQtools/oauth2?crm_ids=' + crmIdsIn + '&cust_nskey=' + salesOppyCustIn;
        }
        console.log('url: ' + url);
        window.open(url, '_blank');

    } // end sendQuoteToolSubjectSetRequest function







    return {
        pageInit: pageInit,
        // fieldChanged: fieldChanged,
        // validateField: validateField,
        // saveRecord: saveRecord,
        sendQuoteToolRequest: sendQuoteToolRequest,
        sendQuoteToolSubjectSetRequest: sendQuoteToolSubjectSetRequest
    };
    
});
