/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
        log.debug(scriptContext.type);
        if(scriptContext.type == 'create'){
            var caseRecord = scriptContext.newRecord;
            var caseProfile = getFieldValue(caseRecord, 'profile')
            log.debug('caseProfile', caseProfile)
            if(caseProfile == '28'){
              //  setFieldValue(caseRecord, 'assigned', '4215979');		// SB3
              setFieldValue(caseRecord, 'assigned', '27113764');       // Prod         
            }
        }
    }

    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });

        return record;
    }

    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });

        return value;
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
