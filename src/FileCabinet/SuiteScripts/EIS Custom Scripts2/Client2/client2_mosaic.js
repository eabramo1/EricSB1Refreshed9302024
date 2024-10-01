/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
*   Script:     client2_mosaic.js
*   Creator:    ZScannell (US1122972)
*   Revisions:
*   DATE        NAME        US + DESC
*   ------------------------------------------------------------------------
*   2023-10-26  ZScannell   US1123000   Alert on Field Change for GOBI Acct # + GOBI Names
*   2023-11-21  ZScannell   TA870705    Handling situation where no GOBI Accounts exist for the customer
*   2024-08-22  ZScannell   TA929227    Handling situation where inactive GOBI Accounts exist + 'Associated GOBI Accounts' is being set to mandatory
* */
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility','/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
function(utility, constants, search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    //  Global Variables
    var earlyAdopterOnLoad;
    function pageInit(scriptContext) {
        const currentRec = scriptContext.currentRecord;
        //  Early Adopter -> Date Started field enablement
        earlyAdopterOnLoad = currentRec.getValue({fieldId: 'custrecord_mosaic_early_adopter'});
        //  Set the "isDisabled" to the opposite of the Early Adopter checkbox (if a earlyAdopter, set to false. Else, set to True)
        currentRec.getField({fieldId: 'custrecord_mosaic_date_started'}).isDisabled = !earlyAdopterOnLoad;
        //  Set the "isMandatory" to the Early Adopter checkbox (if a earlyAdopter, set mandatory to true. Else, set to False)
        currentRec.getField({fieldId: 'custrecord_mosaic_date_started'}).isMandatory = earlyAdopterOnLoad;
        //  MOSAIC Objections (Other) field enablement
        currentRec.getField({fieldId: 'custrecord_mosaic_objections_other'}).isMandatory = (currentRec.getValue({fieldId: 'custrecord_mosaic_objections'}) === constants.LC2_MosaicObjections.Other);
        if (utility.LU2_isEmpty(currentRec.getValue({fieldId: 'custrecord_mosaic_customer'})) === false){
            //  TA929227 - Added in filter for Active GOBI Accounts Only
            let results = search.create({
                type: 'customrecord_ybp_account',
                filters: [
                    search.createFilter({
                        name: 'custrecord_ybpa_customer',
                        operator: search.Operator.ANYOF,
                        values: [currentRec.getValue({fieldId: 'custrecord_mosaic_customer'})]
                    }),
                    search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: ['custrecord_ybpa_customer']
            }).run().getRange({start: 0, end: 1000});
            if (results.length < 1){
                currentRec.getField({fieldId: 'custrecord_associated_gobi_acct'}).isMandatory = false;
            }else {
                currentRec.getField({fieldId: 'custrecord_associated_gobi_acct'}).isMandatory = true;
            }
        }
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
        const fieldId = scriptContext.fieldId;
        switch (fieldId){
            case 'custrecord_mosaic_early_adopter':{
                let isEarlyAdopter = currentRec.getValue({fieldId:'custrecord_mosaic_early_adopter'});
                if (isEarlyAdopter === false) currentRec.setValue({fieldId: 'custrecord_mosaic_date_started', value: '', ignoreFieldChange: true});
                //  Set the "isDisabled" to the opposite of the Early Adopter checkbox (if a earlyAdopter, set to false. Else, set to True)
                currentRec.getField({fieldId: 'custrecord_mosaic_date_started'}).isDisabled = !isEarlyAdopter;
                //  Set the "isMandatory" to the Early Adopter checkbox (if a earlyAdopter, set mandatory to true. Else, set to False)
                currentRec.getField({fieldId: 'custrecord_mosaic_date_started'}).isMandatory = isEarlyAdopter;
                break;
            }
            case 'custrecord_mosaic_objections':{
                //  Make MOSAIC Objections (Other) mandatory if "Other" is selected as MOSAIC Objection
                currentRec.getField({fieldId: 'custrecord_mosaic_objections_other'}).isMandatory = (currentRec.getValue({fieldId: 'custrecord_mosaic_objections'}) === constants.LC2_MosaicObjections.Other);
                break;
            }
            case 'custrecord_associated_gobi_acct': {
                //  US1123000
                //  Load the array of values
                let accounts = currentRec.getValue({fieldId:'custrecord_associated_gobi_acct'}).toString().split(',');
                let alertString = 'Selected GOBI Accounts: ';
                //  Iterates through, load values for Acct Name + Number
                let i = 0
                if (accounts.length > 0 && accounts[0] !== '') {
                    while (i < accounts.length) {
                        let results = search.lookupFields({
                            type: 'customrecord_ybp_account',
                            id: accounts[i],
                            columns: ['name', 'custrecord_ybpa_account_number_integer']
                        });
                        //  Add the Account Name and Account Number to an alert
                        //  Need to use native alert as it's not possible to add new lines to N/ui/dialog dialog.alert
                        alertString += `\n - ${results.name} : ${results.custrecord_ybpa_account_number_integer}`;
                        i++;
                    }
                    alert(alertString);
                }
                break;
            }
            //  TA870705
            case 'custrecord_mosaic_customer': {
                if (utility.LU2_isEmpty(currentRec.getValue({fieldId: 'custrecord_mosaic_customer'}) === false)){
                    //  TA929227 - Added in filter for Active GOBI Accounts Only
                    let results = search.create({
                        type: 'customrecord_ybp_account',
                        filters: [
                            search.createFilter({
                                name: 'custrecord_ybpa_customer',
                                operator: search.Operator.ANYOF,
                                values: [currentRec.getValue({fieldId: 'custrecord_mosaic_customer'})]
                            }),
                            search.createFilter({
                                name: 'isinactive',
                                operator: search.Operator.IS,
                                values: false
                            })
                        ],
                        columns: ['custrecord_ybpa_customer']
                    }).run().getRange({start: 0, end: 1000});
                    if (results.length < 1){
                        currentRec.getField({fieldId: 'custrecord_associated_gobi_acct'}).isMandatory = false;
                    }else {
                        currentRec.getField({fieldId: 'custrecord_associated_gobi_acct'}).isMandatory = true;
                    }
                }
            }

        }
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
        const currentRec = scriptContext.currentRecord;
        //  Check if Date Started is filled out if Early Adopter
        let earlyAdopter = currentRec.getValue({fieldId: 'custrecord_mosaic_early_adopter'});
        //  Make user confirm the change if switching from an Early Adopter to a non-Early Adopter
        if (earlyAdopterOnLoad === true && earlyAdopter === false){
            let c = confirm('This record was loaded as an Early Adopter and is no longer marked as one. Do you want to Continue with the save? This will set the "Date Started" field to blank.');
            if (c === false){
                return false;
            }
            else{
                currentRec.setValue({
                    fieldId: 'custrecord_mosaic_date_started',
                    value: null
                });
            }
        }
        if (earlyAdopter === true && utility.LU2_isEmpty(currentRec.getValue({fieldId: 'custrecord_mosaic_date_started'})) === true){
            alert('You must enter a "Date Started" for an Early Adopter.');
            return false;
        }


        if (earlyAdopter === true && utility.LU2_isEmpty(currentRec.getValue({fieldId: 'custrecord_mosaic_date_started'}))){
            alert('You have indicated that this MOSAIC is an early adopter, yet there is no date started listed. Please enter a date in order to save this record.');
            return false;
        }
        //  Check that if MOSAIC Objections contains "Other" that MOSAIC Objections (Other) contains information
        var objectionsOther = currentRec.getValue({fieldId: 'custrecord_mosaic_objections_other'});
        var objections = currentRec.getValue({fieldId: 'custrecord_mosaic_objections'});
        if (objections == constants.LC2_MosaicObjections.Other && utility.LU2_isEmpty(objectionsOther) === true){
            alert('You have indicated a MOSAIC Objection of type "Other" and the MOSAIC Objections (Other) field has been left blank. Please fill out this field in order to save this record.');
            return false;
        }

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
