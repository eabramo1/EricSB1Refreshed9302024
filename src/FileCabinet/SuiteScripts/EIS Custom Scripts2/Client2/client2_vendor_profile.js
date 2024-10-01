/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*
*   Script Name: Client2_Vendor_Profile.js
*   Created By: Zachary Scannell
*   Creation Date: 2023-04-10
*   Description: Client script used on the Vendor Profile form.
*   Stakeholders: Tiffany Rothe
*
*   REVISION LOG
*   DATE        AUTHOR      DESC
*   2023-04-10  ZScannell   TA95218 Refactored from SS1.0 to SS2.1
* */

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', 'N/search'],

function(utility, search) {
    
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
        const record = scriptContext.currentRecord;
        if (scriptContext.mode === 'create'){
            record.getField({fieldId: 'name'}).isDisabled = false;
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
        const fieldId = scriptContext.fieldId;
        const record = scriptContext.currentRecord;
        switch (fieldId){
            //  Web Service picks up records ONLY if active, therefore we use a secondary "Is Inactive" flag so the user's can still track inactive/active status
            //  without messing with Web Service logic
            case 'custrecord_vendor_ep_inactive':
                record.setValue({
                    fieldId: 'isinactive',
                    value: false,
                    ignoreFieldChange: true
                });
                break;
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
        const record = scriptContext.currentRecord;
        const recordId = scriptContext.currentRecord.id;
        const pdaPreference = record.getValue({fieldId: 'custrecord_vendor_pda_pref'});
        const pdaPreferenceValues = {
            PDO: '2',
            PDL: '3',
            PDU: '4'
        }
        switch (pdaPreference) {
            //  PDO's require Purchase Model Default + Budget
            case pdaPreferenceValues.PDO:
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_pdo_model'}))) {
                    alert('If PDA preference is PDO or PDU, you must select a Purchase Model Default');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_budget_cap'}))) {
                    alert('If PDA preference is PDO, PDL, or PDU, you must enter a Budget Cap');
                    return false;
                }
                break;
            //  PDL's require Lease Terms Default, Max Number of Leases per title, and a Budget
            case pdaPreferenceValues.PDL:
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_pdl_term'}))) {
                    alert('If PDA preference is PDL or PDU, you must select a Lease Term Default.');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_maxleases'}))) {
                    alert('If PDA preference is PDL or PDU, you must select a Max. # of Leases per Title.');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_budget_cap'}))) {
                    alert('If PDA preference is PDO, PDL, or PDU, you must enter a Budget Cap');
                    return false;
                }
                break;
            //  PDU's require Purchase Model Default, Lease Terms Default, Max Number of Leases per title, and a Budget
            case pdaPreferenceValues.PDU:
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_pdo_model'}))) {
                    alert('If PDA preference is PDO or PDU, you must select a Purchase Model Default.');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_pdl_term'}))) {
                    alert('If PDA preference is PDL or PDU, you must select a Lease Term Default.');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_maxleases'}))) {
                    alert('If PDA preference is PDL or PDU, you must select a Max. # of Leases per Title.');
                    return false;
                }
                if (utility.LU2_isEmpty(record.getValue({fieldId: 'custrecord_vendor_budget_cap'}))) {
                    alert('If PDA preference is PDO, PDL, or PDU, you must enter a Budget Cap');
                    return false;
                }
                break;
        }
        // Validate you don't Have a Duplicate SAN Number (name field) but only if EP Inactive is False
        if (record.getValue({fieldId: 'custrecord_vendor_ep_inactive'}) === false){
            const profileName = record.getValue({fieldId: 'name'});
            const profileCust = record.getValue({fieldId: 'custrecord_vendor_customer'});
            //  If a GOBI Profile already exists with the same name (SANS Number) then don't allow the save
            let gobiSearchResults = search.create({
                type: 'customrecord_vendor_profile',
                filters: [
                    search.createFilter({
                        name: 'name',
                        operator: search.Operator.IS,
                        values: profileName
                    }),
                    search.createFilter({
                        name: 'id',
                        operator: search.Operator.NOTEQUALTO,
                        values: recordId
                    }),
                    search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: ['id']
            }).run().getRange({start: 0, end: 1000});
            if (gobiSearchResults.length !== 0){
                alert('You cannot save this record because another Gobi Profile exists with the same SANS Number');
                return false;
            }
        }
        //  Set the isUpdated flag to True
        if (record.getValue({fieldId: 'custrecord_vendor_parent_oe_approved'}) === true){
            record.setValue({
                fieldId: 'custrecord_vendor_isupdated',
                value: true,
                ignoreFieldChange: true
            });
        }
        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
