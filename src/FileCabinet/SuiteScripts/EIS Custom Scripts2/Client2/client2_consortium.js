/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*
*   Script Name: client2_consortium
*   Applies To:
*   Refactored by: Zachary Scannell 2023-12-28
*
*   Name        Date            US+DESCRIPTION
*   ZScannell   2023-12-28      TA878348 Refactoring to SS2
*
* */

define(['N/search', 'N/ui/dialog', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
function(search,dialog, utility) {
    
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
        var currentRec = scriptContext.currentRecord;
        var fieldId = scriptContext.fieldId;
        //  No matter what, do not allow "real" is inactive to go to TRUE
        if (fieldId == 'custrecord_consortium_ep_inactive') currentRec.setValue({fieldId: 'isinactive', value: false});
    }

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
        var currentRec = scriptContext.currentRecord;

        //  Name Length validation (must be under 50 characters)
        var name1 = currentRec.getValue({fieldId: 'name'});
        if (name1.length > 50){
            dialog.alert({
                title: 'Name Length',
                message: 'Please shorten your Consortia name to 50 characters or less.'
            }).then().catch();
            return false;
        }

        if (utility.LU2_isEmpty(currentRec.getValue({fieldId: 'custrecord_consortium_main_site'})) == true){
            dialog.alert({
                title: 'Missing Information',
                message: 'You must select a Main Site in order to save this record.'
            }).then().catch();
            return false;
        }
        //  In SS1 version there was code deprecated in 2017 that checked if the Member Sites
        //  on the Consortium were OE Approved. If not OE Approved, it would then trigger an alert that would instruct
        //  the user to remove the non-OE Approved sites from "Member Sites" in order to save the record.
        //  This was deprecated 2017-10-02 due to governance limit issues.


        //  Prevent Sites to be added if not OE Approved
        var mainSite = currentRec.getValue({fieldId: 'custrecord_consortium_main_site'});
        //  Check Main Site
        var mainSiteFieldLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: mainSite,
            columns: ['custentity_oeapproved']
        });
        if (mainSiteFieldLookup.custentity_oeapproved == false){
            dialog.alert({
                title: 'ERROR: Site not OE Approved',
                message: 'The Main Site in this Consortium record is not OE Approved. Please contact OE to approve the main site.'
            }).then().catch();
            return false;
        }
        //  Prevent entry of a consortium record with same name
        if (utility.LU2_isEmpty(currentRec.getValue({fieldId: 'id'})) == true){
            log.debug({title: 'Starting search'});
            var sameNameResults = search.create({
                type: 'customrecord67',
                filters: [
                    search.createFilter({
                        name: 'name',
                        operator: search.Operator.IS,
                        values: name1
                    })
                ],
                columns: ['internalid']
            }).run().getRange({start: 0, end: 2});
            if (sameNameResults.length >= 1){
                log.debug({title: 'Found results'});
                dialog.alert({
                    title: 'Duplicate Name Detected',
                    message: 'A Consortium record with this name already exists. You must use a different name.'
                }).then().catch();
                return false;
            }
        }

        //  Set IsUpdated to True for WebServices pickup
        currentRec.setValue({
            fieldId: 'custrecord_consortium_isupdated',
            value: true
        });
        return true;
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
