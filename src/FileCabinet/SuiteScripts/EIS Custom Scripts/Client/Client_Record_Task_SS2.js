/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Created by: Krizia Ilaga (NSACS Consultant)
 * 
 * Revision History:
 * K Ilaga (NSACS Consultant)		02-28-2019	Original version
 * C Neale							04-01-2019  F24174 Implementation 
 *
 */
define(['N/runtime'],

function(runtime) {

    function Client_Task_PageInit(scriptContext){
        var taskRecord = scriptContext.currentRecord;
        if(scriptContext.mode == 'copy' || scriptContext.mode == 'create'){
            var customForm = getFieldValue(taskRecord, 'customform');
            if(customForm == 14 || customForm == 115){
                taskRecord.setValue({
                    fieldId: 'customform',
                    value: 315
                });
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
    function Client_Task_SaveRecord(scriptContext) {
        var user = runtime.getCurrentUser();

        var taskRecord = scriptContext.currentRecord;
        var customForm = getFieldValue(taskRecord, 'customform');

        //Should only apply to non-admin roles && not EP Task Form (Web Services)
        if(user.role != 3 && customForm != 75){
            switch(customForm){        
                //ACS Form
                case '315': if(getFieldValue(taskRecord, 'custevent_nsacs_acsformflag') == false){
                                alert('This is not a task entered via the EIS Sales Task form. Please use the correct form to edit this record.');
                                return false;
                            }
                            break;

                case '68': if(getFieldValue(taskRecord, 'custevent_is_trainer_task') == false){
                                alert('This is not a Customer Training Request Form. Please use the correct form to edit this record.');
                                return false;
                            }
                            break;

                case '99': if(getFieldValue(taskRecord, 'custevent_is_trainer_task') == false){
                                alert('This is not a Training Report form. Please use the correct form to edit this record.');
                                return false;
                            }
                            break;

                case '114': if(getFieldValue(taskRecord, 'custevent_is_todo_task') == false){
                                alert('This is not a To Do Task Form. Please use the correct form to edit this record.');
                                return false;
                            }
                            break;

                case '158': if(getFieldValue(taskRecord, 'custevent_is_asm_task') == false){
                                alert('This is not an ASM Task Form. Please use the correct form to edit this record.');
                                return false;
                            }
                            break;
                default: break;
            }
        }
        
        

        return true;
    }

    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });

        return value;
    }

    return {
        pageInit: Client_Task_PageInit,
        saveRecord: Client_Task_SaveRecord
    };
    
});
