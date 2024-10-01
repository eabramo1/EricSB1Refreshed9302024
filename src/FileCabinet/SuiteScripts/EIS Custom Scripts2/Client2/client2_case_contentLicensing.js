/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_contentLicensing.js
//				Written in SuiteScript 2.1
//
//Created by:	Eric Abramo 10-2023
//
//Purpose:		Refactor form-level Client Script created for Content Licensing Case form - TA855460
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//
//
//Revisions:
        //	Orig: SS1 Comment     CNeale	11/07/2017	US253375 Renamed & adjusted for Content Licensing use of form.
//
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/record', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
/**
 * @param{record} record
 * @param{runtime} runtime
 */
function(record, runtime, constants, search, utility) {

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

        if (mode == 'create'){
            var userId = runtime.getCurrentUser().id;
            //set assigned rep to current user
            record.setValue({
                fieldId: 'assigned',
                value: userId,
                ignoreFieldChange: true,
                forceSyncSourcing: false
            })
            //set profile to Content Licensing
            record.setValue({
                fieldId: 'profile',
                value: constants.LC2_Profiles.EISContentLic,
                ignoreFieldChange: true,
                forceSyncSourcing: false
            })
            //set Content Licensing flag
            record.setValue({
                fieldId: 'custevent_contentlicensing_case',
                value: true,
                ignoreFieldChange: true,
                forceSyncSourcing: false
            })
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
        var record = scriptContext.currentRecord;
        var fieldName = scriptContext.fieldId;
        var partnerFieldValue = '';


        //Publisher Selector field changed
        if (fieldName == 'custpage_publisher_select'){
            partnerFieldValue = record.getValue({fieldId: 'custpage_publisher_select'})
            if (utility.LU2_isEmpty(partnerFieldValue) == false)
            {
                record.setValue({
                    fieldId: 'company',
                    value: partnerFieldValue,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                })
                record.setValue({
                    fieldId: 'custpage_publisher_select',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                })
            }
        }
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
        var record = scriptContext.currentRecord;
        // Need to recheck setting CL flag and Profile to catch those cases with blank assignee &/or assignee changes
        var contentLicensingCase = record.getValue('custevent_contentlicensing_case');
        var assigned = '';
        var assignedDepartment = '';

        if(contentLicensingCase == false){
            // If Assignee belongs to the Content Licensing Department - then set the contentLicensing Case field to true
            assigned = record.getValue('assigned');
            if (utility.LU2_isEmpty(assigned) == false) {
                var assignedLookup = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: assigned,
                    columns: ['department']
                });
                assignedDepartment = assignedLookup.department[0].value;
                // alert('assignedDepartment value is '+assignedDepartment)
                if(assignedDepartment == constants.LC2_Departments.ContLicStratP){
                    //set Content Licensing Case flag
                    record.setValue({
                        fieldId: 'custevent_contentlicensing_case',
                        value: true,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    })

                    //set profile to Content Licensing
                    record.setValue({
                        fieldId: 'profile',
                        value: constants.LC2_Profiles.EISContentLic,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    })
                }
            }
        } // END contentLicensingCase == false

        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };

});
