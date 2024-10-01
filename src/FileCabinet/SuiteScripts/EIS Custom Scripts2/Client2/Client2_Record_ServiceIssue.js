/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/**
 *  Script:     Client2_Record_ServiceIssue.js
 *  Created by: Eric Abramo - as refactoring of Client_Record_Service_Issue.js (Suitescript 1.0 file)
 *
 *  Revisions Log:
 *  Date:           By Whom:    Comment:
 *  03/22/2024      eAbramo     First Attempt at Refactoring Client_Record_Service_Issue.js (Suitescript 1.0 file)
 *                              as part of TA893441 Refactor client_Record_Service_Issue.js
 *
 *
*/

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
function(utility) {

    /*Global Fields Object*/
    var Fields = {
        fldPriority: 'custrecord_sipriority',		// Priority field
        fldSeverity: 'custrecord993',				// Severity field
        fldTimeSensitivity: 'custrecord_si_time_sensitivity',	// Time Sensitivity field
        fldSIBusinessValue: 'custrecord_si_business_value',		// Busines Value field
        fldPriorityBusVal: 'custrecord_sourced_priority_bus_value',	 // Sourced Priority Business Value field
        fldSeverityBusVal: 'custrecord_sourced_severity_bus_value',	// Sourced Severity Business Value field
        fldTimeSensitivityBusVal: 'custrecord_sourced_time_sens_bus_value'	// Sourced Time Severity Business Value field
   }


    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
/*    function pageInit(scriptContext) {

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
/*    function fieldChanged(scriptContext) {

    }*/

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
        var siRecord = scriptContext.currentRecord;
        var field = scriptContext.fieldId;

        // When User updates any of the following fields, run the update_si_business_value() function
        //      Priority, Severity, Time Sensitivity
        if(field === Fields.fldPriority || field === Fields.fldSeverity || field === Fields.fldTimeSensitivity)
        {
            update_si_business_value(siRecord);
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
/*    function saveRecord(scriptContext) {

    }*/

    function update_si_business_value(siRecord)
    {
        // alert('Begin the update_si_business_value function');
        // ea: If any of the following fields are empty, set the Business value to blank - also fire field change
        // 'Sourced Priority Business Value' or 'Sourced Severity Business Value' or 'Sourced Time Severity Business Value'
        var PriorityBusValue = siRecord.getValue({fieldId: Fields.fldPriorityBusVal});
        var SeverityBusValue = siRecord.getValue({fieldId: Fields.fldSeverityBusVal});
        var TimeSensitivityBusValue = siRecord.getValue({fieldId: Fields.fldTimeSensitivityBusVal});

        if(utility.LU2_isEmpty(PriorityBusValue) === true || utility.LU2_isEmpty(SeverityBusValue) === true || utility.LU2_isEmpty(TimeSensitivityBusValue) === true)
        {
            // alert('Resetting business value to empty because one of the three related sourced values is empty');
            siRecord.setValue({fieldId: Fields.fldSIBusinessValue, value: '', ignoreFieldChange: false});
        }
        else {
            var busValSI = 0;
            var bvPriority = parseInt(siRecord.getValue({fieldId: Fields.fldPriorityBusVal}));
            var bvSeverity = parseInt(siRecord.getValue({fieldId: Fields.fldSeverityBusVal}));
            var bvTimeSense = parseInt(siRecord.getValue({fieldId: Fields.fldTimeSensitivityBusVal}));
            // alert('bvPriority = ' + bvPriority + '  |  bvSeverity = ' + bvSeverity + '  |  ' + 'bvTimeSense = ' + bvTimeSense);
            busValSI = (bvPriority + bvSeverity) / bvTimeSense;
            // alert('busValSI is ' + busValSI);
            siRecord.setValue({fieldId: Fields.fldSIBusinessValue, value: busValSI, ignoreFieldChange: true});
        }
    }

    return {
        // pageInit: pageInit,
        // fieldChanged: fieldChanged,
        postSourcing: postSourcing
        // saveRecord: saveRecord
    };
    
});

