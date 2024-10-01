/*
 *  Script:     Client2_Record_celigo_portal_accessing_sites.js
 *
 *  Created by: Zachary Scannell
 *
 *  Library Scripts Used:
 *
 *  Revisions:
 *	Name        Date        US + Description
 * -----------------------------------------------
 *  ZScannell   02/06/2023  US114198 Original Version - Created to support prevention of FOLIO Partner being set as Parent Site
 *  CNeale       09/11/2023  Renamed client2_celigo_portal_accessing_sites.js to Client2_Record_celigo_portal_accessing_sites.js
 *
 * */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],
    function(search) {
        //  Setting Global Variables
        var parentOnLoad = '';

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
            const currentRec = scriptContext.currentRecord;
            parentOnLoad = currentRec.getValue({fieldId: 'custrecord_celigo_acc_site_parent'});
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
            const currentRec = scriptContext.currentRecord;
            const fieldId = scriptContext.fieldId;
            switch (fieldId) {
                //  Field Name: 'Parent'
                //  US1144198: Do not allow a customer to be chosen if it is a FOLIO Partner
                case 'custrecord_celigo_acc_site_parent':
                    let parentId = currentRec.getValue({fieldId: 'custrecord_celigo_acc_site_parent'});
                    //  Handle non-blank change
                    if (parentId !== '' && parentId !== null) {
                        let lookup = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: parentId,
                            columns: ['custentity_folio_partner']
                        });
                        let folioPartnerStatus = lookup.custentity_folio_partner;
                        if (folioPartnerStatus === true) {
                            alert('This customer cannot be set as the "Parent" on this record due to the fact that it is a FOLIO Partner.');
                            currentRec.setValue({
                                fieldId: 'custrecord_celigo_acc_site_parent',
                                value: parentOnLoad,
                                ignoreFieldChange: true
                            });
                        }
                    }
                    break;
                default:
                    break;
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
            const currentRec = scriptContext.currentRecord;
            let parentId = currentRec.getValue({fieldId: 'custrecord_celigo_acc_site_parent'});
            //  US1144198: Do not allow record to be saved if customer chosen as "Parent" is a FOLIO Partner
            if (parentId !== '' && parentId !== null){
                let lookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: parentId,
                    columns: ['custentity_folio_partner']
                });
                let folioPartnerStatus = lookup.custentity_folio_partner;
                if (folioPartnerStatus === true){
                    alert('This record cannot be saved as the "Parent" on this record is a FOLIO Partner.');
                    return false;
                }
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
