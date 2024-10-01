/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
// Script:     UserEvent2_Message_Before_Submit.js
//
// Created by: Zachary Scannell
//
// Purpose:    This was created to support the solution to an error of emojis popping up in case messages and causing the
//              NS to SF On-Going Case Sync to fail.
// Revisions:
//  Date            Author          Desc.
//  --------------------------------------------------------------------------------------------------------------------
//	2023.05.16	    ZScannell       Initial Copy

define(['N/record', 'N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
    (record, runtime, search, constants) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            const oldRec = scriptContext.oldRecord;
            const newRec = scriptContext.newRecord;
            let messageBody = newRec.getValue({fieldId: 'message'});
            log.debug({title: 'messagebody', details: messageBody});
           /* let cleanMessage = constants.LC2_RemoveEmoji(messageBody);
            log.debug({title: 'cleanMessage', details: cleanMessage});
            newRec.setValue({
                fieldId: 'message',
                value: cleanMessage,
                ignoreFieldChange: true
            });*/
        }

        return {beforeSubmit}

    });
