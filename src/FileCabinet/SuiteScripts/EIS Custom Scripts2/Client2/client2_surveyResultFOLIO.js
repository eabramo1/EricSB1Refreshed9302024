/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_surveyResultFOLIO.js
//				Written in SuiteScript 2.1
//              as part of US1220724
//
//Created by:	Pat Kelleher 02-2024
//
//Purpose:		Sets a Custom field and Custom Form based on the Online form used (submitted by the customer)
//
//
//Library Scripts Used: 	library2_constants
//
//
//Revisions:
//
//
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
    /**
     * @param{record} record
     */
    function(constants) {

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
            currentRecord = scriptContext.currentRecord;
            currentRecord.setValue({
                fieldId: 'customform',
                value: constants.LC2_Form.FolSurveyRslts,
                ignoreFieldChange: true
            });
            currentRecord.setValue({
                fieldId: 'custrecord_surveytype',
                value: constants.LC2_SurveyType.FOLIO,
                ignoreFieldChange: true
            });
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
        /*        function fieldChanged(scriptContext) {

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
        /*        function saveRecord(scriptContext) {

                }*/

        return {
            pageInit: pageInit  //,
            //fieldChanged: fieldChanged,
            //saveRecord: saveRecord
        };

    });
