/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*
 *  Script:     UserEvent2_contact_after_submit.js
 *
 *  Created by: Zachary Scannell
 *
 *  Library Scripts Used: Library2_Constants
 *
 *  Revisions:
 *	Name        Date        US + Description
 * -----------------------------------------------
 *  ZScannell   02/06/2023  US1017301 Original Version
 *
 * */
define(['N/record', 'N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
    (record, runtime, search, L2Constants) => {
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            log.debug({
                title: 'Starting afterSubmit'
            });
            const oldRec = scriptContext.oldRecord;
            const newRec = scriptContext.newRecord;
            const matchRequested = newRec.getValue({fieldId: 'custentity_academy_user_match_requested'});
            const currentUser = runtime.getCurrentUser();
            //  US1017301 - If user clicks on "Match with Displayed Academy Only User" button, process the request.
            log.debug({
                title: 'Entering matchRequested === true'
            });
            if (matchRequested === true) {
                log.debug({
                    title: 'Entered matchRequested === true'
                });
                const srpmId = newRec.getValue({fieldId: 'custpage_sr_id'});
                //  Update on SRPM record:
                record.submitFields({
                    type: 'CUSTOMRECORD_SR_PORTAL_MEMBER',
                    id: srpmId,
                    values: {
                        'custrecord_sr_contact_type': L2Constants.LC2_EC_Contact_Access_Type.ECNSVerified,      //  SR Contact Type = “EC NS Verified”
                        'custrecord_srpm_conversion_status': L2Constants.LC2_SRPM_Conversion_Status.Converted,  //  SRPM Conversion Status = “Converted”
                        'custrecord_matched_contact': oldRec.id,                                                //  Contact Matched = NS Contact
                        'custrecord_matched_customer': oldRec.getValue({fieldId: 'company'}),                   //  Customer Matched = NS Customer
                        'custrecord_srpm_last_modified_by': currentUser.id                                      //  SRPM Last Modified By = User pressing the Match button
                    }
                });
            }
        }
        return {afterSubmit}
    });
