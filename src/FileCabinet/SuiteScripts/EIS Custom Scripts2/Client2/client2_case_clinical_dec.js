/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/** *****************************************************************************************************************
 *
 * Script:     client2_case_clinical_dec.js
 *
 * Created by:  Kate McCormack/Eric Abramo 05/2023
 *
 * Purpose:		Client level scripting to be used by new Clinical Decisions Case Form
 *
 * Library Scripts Used:
 *  - Library2_Constants
 *
 * Revisions:
 *      Name        Date        US + Desc
 *      -----------------------------------------------------------------------------------------------------------------
 *      EAbramo     05/23/2023  Initial Version - F55920: EBSCO Connect Clinical Decisions Portal US856610: Case Scripting
 *      EAbramo     02/02/2024  DE85700 Problems Discovered with Clinical Decisions Case Form - code missing which never went to prod.
 *                              was originally captured as (TA824793) but that code never made it to production and had a defect.
 *                              Disable the following fields on PageInit: SF Case ID, Case Last Modified By, Clinical Decisions Case
 ********************************************************************************************************************/

define(['N/currentRecord', 'N/record', 'N/runtime', 'N/search',
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants',],
/**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
function(currentRecord, record, runtime, search, L2Constants,) {

    // Initialize Global Variables
    var g_recordCreation = false;

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
        const currentRecId = currentRec.id;
        const currentUser = runtime.getCurrentUser();
        const currentUserRole = runtime.getCurrentUser().role;
        const currentMode = scriptContext.mode;

        var assigneeInit = currentRec.getValue('assigned');

        // set variable indicating that the Case is being created (used later in Save event);
        if(currentMode == 'create'){
            g_recordCreation = true;
        }

        // set the Assignee to the current user
        if(assigneeInit == null || assigneeInit == ''){
            currentRec.setValue({
                fieldId: 'assigned',
                value: currentUser.id,
                ignoreFieldChange:	true
            })
        }

        //  DE85700 (some code originally TA824793) - Change SF Case ID, Case Last Modified By, and Clinical Decision Case to "Disabled" upon load
        //  Cannot make Inline Text/Disabled through UI because we store form w/ record + BOOMI needs to be able to write
        //  to those fields when syncing from SF to NS.
        currentRec.getField({fieldId: 'custevent_sf_case_id'}).isDisabled = true;
        currentRec.getField({fieldId: 'custevent_case_last_modified_by'}).isDisabled = true;
        currentRec.getField({fieldId: 'custevent_clinical_decisions_case'}).isDisabled = true;
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
    /* function fieldChanged(scriptContext) {
       const currentRec = scriptContext.currentRecord;
       switch(scriptContext.fieldId){
        }
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
        const currentRec = scriptContext.currentRecord;
        var thisCustomer = currentRec.getValue('company');
        var cdp_case = currentRec.getValue('custevent_clinical_decisions_case');
        var gcs_case = currentRec.getValue('custevent_global_customer_support_case');
        var assignee = currentRec.getValue('assigned');
        var assigneeDept = null;
        // var assigneeDept = currentRec.getValue('custevent_assignee_department'); // can't use because its sourced
        if(assignee){
            var assDeptLookup = search.lookupFields({
                type:       'EMPLOYEE',
                id:         assignee,
                columns:    ['department']
            })
            assigneeDept_obj = assDeptLookup.department;
            assigneeDept = assigneeDept_obj[0].value;
        }
        // alert('assigneeDept is '+ assigneeDept)
        // alert('cdp_case is '+cdp_case);

        // Error if Creation of new case and the Customer isn't a Clinical Decisions customer
        if(g_recordCreation == true && thisCustomer) {
            var customerLookup = search.lookupFields({
                type: 'CUSTOMER',
                id: thisCustomer,
                columns: ['custentity_clinical_decisions_cust']
            });
            if (customerLookup.custentity_clinical_decisions_cust == false) {
                alert('You created this Clinical Decisions case under a customer that isn\'t a Clinical Decisions customer.  If you are a Clinical Decisions Support team member, go to the customer record and flag it as a Clinical Decisions Customer.  Once flagged, you can save this case.');
                return false;
            }
        }

        // Assignee Department is Clinical Decisions
        if(assigneeDept == L2Constants.LC2_Departments.ClinicalDecSupport){
            // set GCS flag to false if needed
            if(gcs_case == true){
                currentRec.setValue({
                    fieldId: 'custevent_global_customer_support_case',
                    value: false,
                    ignoreFieldChange:	true
                })
            }
            // set the Clinical Decisions Case flag if needed // Note similar code in UserEvent (if diff form is used)
            if(cdp_case == false){
                currentRec.setValue({
                    fieldId:    'custevent_clinical_decisions_case',
                    value:      true,
                    ignoreFieldChange: true
                });
            }
        }

        return true;
    }

    return {
        pageInit: pageInit,
        // fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
