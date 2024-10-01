/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//  Script:		Client2_ybp_account.js
//  Created by:	Zachary Scannell
//  Purpose:	GOBI Account - Custom GOBI Form
//
//  Library Scripts Used:
//      L2_Constants
//      L2_Utility
//
//  Revisions:
//  Date            Name            Description
//  2023-12-19      ZScannell       Original Creation of the Script for Refactoring (no revision history on original SS1 version)
//
//----------------------------------------------------------------------------------------------------------------
define(['N/search', 'N/ui/dialog', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
function(search, dialog, constants, utility) {

    var originalName = '';
    
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
        originalName = scriptContext.currentRecord.getValue({fieldId: 'name'});
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
    }

    /**
     * Function to be executed when field is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
        if (scriptContext.fieldId == 'name'){
            if (dupeNameCheck(scriptContext.currentRecord.getValue({fieldId: 'name'}).toUpperCase(), scriptContext.currentRecord.getValue({fieldId: 'id'}))){
                dialog.alert({
                    title: 'Edit not allowed',
                    message: 'A YBP Account with this name already exists in NetCRM. Please edit the name to distinguish this account from the existing.  If you need to find the existing Account please use the Global Search.  Include the \'plus sign\' (+) after your search term to include results for INACTIVE YBP Accounts'
                }).then(function (){
                    scriptContext.currentRecord.setValue({fieldId: 'name', value: originalName, ignoreFieldChange: true});
                    return false
                }).catch();
            }
        }
        return true;
    }

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
    function validateLine(scriptContext) {
        return true;
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {
        return true;
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {
        return true;
    }

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
        var currentRecord = scriptContext.currentRecord;
        var accountName = currentRecord.getValue({fieldId: 'name'}).toUpperCase();
        var recordId = currentRecord.getValue({fieldId: 'id'})
        //  Building the base of the Dupe Name search
        if (dupeNameCheck(accountName, recordId)){
            dialog.alert({
                title: 'Save not allowed',
                message: 'A YBP Account with this name already exists in NetCRM. Please edit the name to distinguish this account from the existing.  If you need to find the existing Account please use the Global Search.  Include the \'plus sign\' (+) after your search term to include results for INACTIVE YBP Accounts'
            }).then().catch();
            return false;
        }
        //  Duplicate YBP Account Number Integer check on new/existing records
        var accountNumberInteger = currentRecord.getValue({fieldId: 'custrecord_ybpa_account_number_integer'});
        if (utility.LU2_isEmpty(accountNumberInteger) === false){
            var accountNumberSearch = search.create({
                type: 'customrecord_ybp_account',
                filters: [
                    search.createFilter({
                        name: 'custrecord_ybpa_account_number_integer',
                        operator: search.Operator.EQUALTO,
                        values: accountNumberInteger
                    })
                ],
                columns: ['internalid']
            }).run().getRange({start: 0, end: 2});
            //  Handle scenario where a duplicate Account Number is used in both Create and/or Edit scenarios
            if (accountNumberSearch.length > 1 || (accountNumberSearch.length === 1 && accountNumberSearch[0].getValue({name: 'internalid'}) !== recordId)){
                dialog.alert({
                    title: 'Save not allowed',
                    message: 'You have entered a YBP Account Number that is already in use on another YBP Account record. This record has not been saved. Please enter a unique YBP Account number.'
                }).then().catch();
                return false;
            }
        }
        return true;
    }

    function dupeNameCheck(name, recordId){
        var dupeNameSearch = search.create({
            type: 'customrecord_ybp_account',
            filters: [
                search.createFilter({
                    name: 'name',
                    operator: search.Operator.IS,
                    values: name
                })
            ],
            columns: ['internalid']
        });
        //  If  validating for EDIT (i.e. there is already an ID on the record), add in filter to exclude this record from the dupeNameSearch
        if (utility.LU2_isEmpty(recordId) == false){
            dupeNameSearch.filters.push(
                search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.NONEOF,
                    values: [recordId]
                })
            )
        }
        //  Run and interpret the results
        var results = dupeNameSearch.run().getRange({start: 0, end: 2});
        return (results.length > 0)
    }



    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
