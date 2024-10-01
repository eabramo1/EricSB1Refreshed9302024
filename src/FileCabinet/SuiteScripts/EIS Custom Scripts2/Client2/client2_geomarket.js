/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*
    Name:   client2_geomarket.js

    Description:    The purpose of this client script is to enhance the user interaction and validation processes for
    the custom record "Geomarket" (internal ID: "customrecord81") in NetSuite. This script will handle field
    validations, default value settings, and dynamic field updates based on user input.

    Author:     Garrett Strickland

    Date            Name            US + Description
    ===========================================================================================================
    2024-06-20      GStrickland     TA917541    Original Refactoring of the client_geomarket.js
 */


define(['N/search', 'N/ui/dialog', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

function(search, dialog, L2Utility) {
    
/*    /!**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     *!/
    function pageInit(scriptContext) {

    }*/

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
        const fieldId = scriptContext.fieldId;  //  Getting the internal ID of the field being changed
        switch (fieldId){
            //  Field Disabled as part of refactoring, going to leave code in here for ~historical~ purposes
            case 'custrecord_geo_eis_inactive': //  "Fake" inactive flag
                currentRec.setValue({
                    fieldId: 'isinactive',
                    value: false
                });
                break;
        }
    }
/*
    /!**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     *!/
    function postSourcing(scriptContext) {

    }

    /!**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     *!/
    function sublistChanged(scriptContext) {

    }

    /!**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     *!/
    function lineInit(scriptContext) {

    }

    /!**
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
     *!/
    function validateField(scriptContext) {
        return true;
    }

    /!**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     *!/
    function validateLine(scriptContext) {
        return true;
    }

    /!**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     *!/
    function validateInsert(scriptContext) {
        return true;
    }

    /!**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     *!/
    function validateDelete(scriptContext) {
        return true;
    }*/

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
        const currentRecord = scriptContext.currentRecord;
        const thisRecord = currentRecord.id;
        // Validate that Geo Market Name is Unique
        let recordName = currentRecord.getValue({fieldId: 'name'});
        let results = search.create({
            type: 'customrecord81', //  Internal ID of the GeoMarket custom record in NetCRM
            filters:[
                search.createFilter({
                    name: 'name',   //  Internal ID of the field we want to filter on
                    operator: search.Operator.IS,
                    values: recordName    //  Value(s) we want to filter based on
                }),
                search.createFilter({
                    name: 'id',
                    operator: search.Operator.NOTEQUALTO,
                    values: thisRecord
                })
            ],
            columns: ['id']
        }).run().getRange({start:0, end:2});
        if(results.length > 0){
            dialog.alert({
                title: 'Save Not Allowed.',
                message: 'This GeoMarket already exists.'
            }).then().catch();
            return false;
        }
        // Validate that Name is within 100 chars
        if (recordName.length > 100){
            dialog.alert({
                title: 'Name Length',
                message: 'Please limit the Geo Market name to be within 100 characters.'
            }).then().catch();
            return false;
        }
        // Validate that Geo Market Code is Unique
        let gmCode = currentRecord.getValue({fieldId: 'custrecord_geo_code'});
        let gmSearchResult = search.create({
            type: 'customrecord81',
            filters:[
                search.createFilter({
                    name: 'custrecord_geo_code',
                    operator: search.Operator.IS,
                    values: gmCode
                }),
                search.createFilter({
                    name: 'id',
                    operator: search.Operator.NOTEQUALTO,
                    values: thisRecord
                })
            ],
            columns: ['id']
        }).run().getRange({start:0, end:2});
        if(gmSearchResult.length > 0){
            dialog.alert({
                title: 'Save Not Allowed.',
                message: 'Please enter a different GeoMarket Code. Another GeoMarket already uses the code entered.'
            }).then().catch();
            return false;
        }
        // Validate that no inactive child records exist -- child record is Sales Group
        // only check when this record isn't brand new
        if(!L2Utility.LU2_isEmpty(thisRecord)){
            let setToInactive = currentRecord.getValue({fieldId: 'custrecord_geo_eis_inactive'});
            if (setToInactive === true) {
                let gmSearchResult2 = search.create({
                    type: 'customrecord_sales_group',
                    filters: [
                        search.createFilter({
                            name: 'custrecord_salesgroup_geomarket',
                            operator: search.Operator.ANYOF,
                            values: thisRecord
                        }),
                        search.createFilter({
                            name: 'isinactive',
                            operator: search.Operator.IS,
                            values: false
                        })
                    ],
                    columns: ['id']
                }).run().getRange({start: 0, end: 2});
                if (gmSearchResult2.length > 0) {
                    dialog.alert({
                        title: 'Save Not Allowed.',
                        message: 'You cannot inactivate a Geo Market until all child Sales Group records are moved to another Geo Market or are inactivated.'
                    }).then().catch();
                    return false;
                }
            }
        }
        currentRecord.setValue({fieldId: 'custrecord_geo_isupdated', value: true});
        return true;
    }

    return {
        /*pageInit: pageInit,*/
        fieldChanged: fieldChanged,
        /*postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,*/
        saveRecord: saveRecord
    };
});