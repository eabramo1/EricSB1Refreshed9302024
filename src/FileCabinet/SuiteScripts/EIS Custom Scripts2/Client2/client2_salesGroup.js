/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/** *****************************************************************************************************************
 *
 * Script:     client2_salesGroup.js
 *
 * Created by:  Eric Abramo 12/2023
 *
 * Purpose:		Client level scripting to be used for the Sales Group (custom record) Custom Form
 *
 * Library Scripts Used:    library2_utility.js
 *
 * Revisions:
 *      Eric A  12/14/2023  Initial Version - TA875893 Refactor salesGroup.js SS1 file to SS2
 *
 ********************************************************************************************************************/

define(['N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
    /**
     * @param{currentRecord} currentRecord
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    function(search, utility) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
/*        function pageInit(scriptContext) {
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
           var currentRec = scriptContext.currentRecord;
           var name = scriptContext.fieldId;
            // If user sets/unsets EIS inactive flag, set the true inactive to false so that CRMDL can read this record
            if (name == 'custrecord_salesgroup_eis_inactive'){
               currentRec.setValue({
                   fieldId: 'isinactive',
                   value: false,
                   ignoreFieldChange: true,
                   forceSyncSourcing: false
               })
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
            var currentRec = scriptContext.currentRecord;
            var this_record_id = currentRec.getValue('id');
            if (utility.LU2_isEmpty(this_record_id)){
                this_record_id = '0';
            }
            var mode = scriptContext.mode;
            var sg_name = currentRec.getValue('name');

            // validate name is 100 chars and under
            if (sg_name.length > 100)
            {
                alert('Please limit the Sales Group name to be within 100 characters');
                return false;
            }

            // Validate that Sales Group Name is Unique

            var sg_name_search = search.create({
                type: search.Type.CUSTOM_RECORD+ '_sales_group',    // id for the recordtype is customrecord_sales_group
                columns: ['id'],
                filters: [
                    ['id', 'notequalto', this_record_id],
                    'and',
                    ['name', 'is', sg_name]
                ]
            })
            var sg_name_searchResultSet = sg_name_search.run().getRange(0,2);
            if(sg_name_searchResultSet.length > 0){
                alert('Error: this Sales Group already exists');
                return false;
            }

            // Validate that Sales Group Code is Unique
            var sg_code = currentRec.getValue('custrecord_sales_group_code');
            var sg_code_search = search.create({
                type: search.Type.CUSTOM_RECORD+ '_sales_group',    // id for the recordtype is customrecord_sales_group
                columns: ['id'],
                filters: [
                    ['id', 'notequalto', this_record_id],
                    'and',
                    ['custrecord_sales_group_code', 'is', sg_code]
                ]
            })
            var sg_code_searchResultSet = sg_code_search.run().getRange(0,2);
            if(sg_code_searchResultSet.length > 0){
                alert('Please enter a different Sales Group Code. Another Sales Group already uses the code entered');
                return false;
            }

            // Validate that if set to inactive that no active child EP Territory records exist
            // only check when this record isn't brand new
            if (mode != 'create'){
                var setto_inactive = currentRec.getValue('custrecord_salesgroup_eis_inactive');
                if(setto_inactive == true){
                    var sg_child_search = search.create({
                        type: search.Type.CUSTOM_RECORD+'83',    // id for the EP Territory record is customrecord83
                        columns: ['internalid'],
                        filters: [
                            ['custrecord_ep_territory_sales_group', 'anyof', this_record_id],
                            'and',
                            ['isinactive', 'is', false]
                        ]
                    })
                    var sg_child_searchResultSet = sg_child_search.run().getRange(0,2);
                    if(sg_child_searchResultSet.length > 0){
                        alert('You cannot inactivate a Sales Group until all child EP Territory records are moved to another Sales Group or are inactivated.');
                        return false;
                    }
                }
            }

            // Once all validation passes set the isUpdated flag so that CRMDL syncs the record to OPS
            currentRec.setValue({
                fieldId: 'custrecord_sales_group_isupdated',
                value: true,
                ignoreFieldChange: true
            });
            return true;
        }

        return {
            // pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };

    });
