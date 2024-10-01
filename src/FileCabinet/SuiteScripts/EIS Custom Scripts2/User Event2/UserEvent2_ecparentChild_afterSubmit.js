/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
/*
UserEvent2_ecparentchild_afterSubmit.js

This script is run only on AFTERSUBMIT of the Custom record: EBSCO Connect Parent-Child Relationship.
When a NetSuite modification is made to an EBSCO Connect Parent-Child Relationship record, Email CRM Escalation.
This alerts Mercury that action MUST take place to modify/delete etc. the matching relationship
record in Salesforce.
    As of August 2023, our understanding is that FOLIO Parent/Child Relationship records do not happen on a daily basis
    Therefore a NS to SF Boomi Sync process isn't needed.  Instead Mercury will keep the data Sync'ed between NS and SF manually.

Change History
08/07/2023 - E Abramo - Initial creation of script to handle
09/05/2023 - US1157359 - W Clark - Stopped reporting record deletions, modified the text associated with a change to an existing record
09/13/2023 - K McCormack    US1136968 - Regression Testing fixes:
                            TA850780 - Re-instate inactivation email message to CRM Escalation
*/


define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/email'],
    function (constants, runtime, email) {
            /**
             * Defines the function definition that is executed before record is submitted.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {Record} scriptContext.oldRecord - Old record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @since 2015.2
             */
            function afterSubmit(context) {
                    log.debug('Entering beforeSubmit function:');
                    var context_type = context.type;
                    log.debug('context_type', context_type);
                    // Retrieve Old & New Details
                    var oldRecord = context.oldRecord;
                    log.debug('oldRecord', oldRecord);
                    var newRecord = context.newRecord;
                    log.debug('newRecord', newRecord);

                    // Get the NetSuite Account ID - used in building URL in email body
                    var acctid = runtime.accountId;
                    // Replace Underscore with hyphen
                    var acctid_hyphen = acctid.replace('_', '-');
                    // Variables used to determine Email and Email Content
                    var changeDetected = false;
                    var record_id = null;
                    var emailSubject = null;
                    var emailString = null;

                    var oRec = {
                            id: null,
                            parent: null,
                            child: null,
                            relType: null,
                            inactive: null
                    };
                    if (oldRecord) {
                            oRec.id = oldRecord.getValue({fieldId: 'id'});
                            oRec.parent = oldRecord.getValue({fieldId: 'custrecord_ec_parent_customer'});
                            oRec.child = oldRecord.getValue({fieldId: 'custrecord_ec_child_customer'});
                            oRec.relType = oldRecord.getValue({fieldId: 'custrecord_ec_relationship_type'});
                            oRec.inactive = oldRecord.getValue({fieldId: 'isinactive'});
                    }
                    var nRec = {
                            id: null,
                            parent: null,
                            child: null,
                            relType: null,
                            inactive: null
                    }
                    if (newRecord) {
                            nRec.id = newRecord.getValue({fieldId: 'id'});
                            nRec.parent = newRecord.getValue({fieldId: 'custrecord_ec_parent_customer'});
                            nRec.child = newRecord.getValue({fieldId: 'custrecord_ec_child_customer'});
                            nRec.relType = newRecord.getValue({fieldId: 'custrecord_ec_relationship_type'});
                            nRec.inactive = newRecord.getValue({fieldId: 'isinactive'});
                    }
                    //log.debug('oRec.id is ' + oRec.id, 'nRec.id is ' + nRec.id);
                    //log.debug('oRec.parent is '+oRec.parent, 'nRec.parent is '+nRec.parent);
                    //log.debug('oRec.child is '+oRec.child, 'nRec.child is '+nRec.child);
                    //log.debug('oRec.relType is '+oRec.relType, 'nRec.relType is '+nRec.relType);
                    //log.debug('oRec.inactive is ' + oRec.inactive, 'nRec.inactive is ' + nRec.inactive);

                    // HANDLE CREATION OF NEW RECORD
                    if(context_type == 'create'){
                            changeDetected = true;
                            // Build Email Subject and Email Body
                            record_id = nRec.id;
                            emailSubject = 'EC Parent-Child Relationship record CREATED, ID: '+record_id;
                            emailString = 'EBSCO Connect Parent-Child Relationship record <b>created</b>.  Record ID: '+record_id+'.'+
                                '<BR><BR>You must go to Salesforce and create the matching EBSCO Connect Parent-Child Relationship record there.' +
                                '<BR><BR><a href = https://'+acctid_hyphen+'.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1026&id='+record_id+'>Link to NetSuite Record</a>';
                    }
                    // HANDLE EDIT OF EXISTING RECORD-- NOTE THIS RELIES ON THE FACT THAT INLINE EDITING IS NOT ALLOWED ON THIS RECORD TYPEu  ]
                    else if(context_type == 'edit'){
                            // create variables for use to collect information
                            var changeString = '';
                            var inactivated = false;

                            if(oRec.parent != nRec.parent){
                                    changeDetected = true;
                                    changeString = changeString+' Parent Customer modified.';
                            }
                            if(oRec.child != nRec.child){
                                    changeDetected = true;
                                    changeString = changeString+' Child Customer modified.';
                            }
                            if(oRec.relType != nRec.relType){
                                    changeDetected = true;
                                    changeString = changeString+' Relationship Type modified.';
                            }
                            if (oRec.inactive != nRec.inactive) {
                                    changeDetected = true;
                                    changeString = changeString+ ' Inactive Flag modified.';
                                    if(nRec.inactive == true){
                                            inactivated = true;
                                    }
                            }
                            // Build Email Subject and Email Body
                            if (changeDetected == true) {
                                    record_id = oRec.id;

                                    // US1157359 WC 9/5
                                    // removed the special message when inactivated
                                    // 09-13-23 KM US1136968: TA850780 - Re-instate inactivation email message to CRM Escalation
                                    if (inactivated == true) {
                                            emailSubject = 'EC Parent-Child Relationship record INACTIVATED, ID: ' + record_id;
                                            var emailString = 'EBSCO Connect Parent-Child Relationship record <b>inactivated</b>.  Record ID: ' + record_id + '.' +
                                                '<BR><BR>' + changeString + ' You must go to Salesforce and DELETE the matching EBSCO Connect Parent-Child Relationship record there.  Then go to NetCRM and delete the NetCRM record' +
                                                '<BR><BR><b>It is important that you delete the Salesforce record FIRST!</b>' +
                                                '<BR><BR><a href = https://' + acctid_hyphen + '.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1026&id=' + record_id + '>Link to NetSuite Record</a>';
                                    }
                                    else {
                                            // 09-13-23 KM US1136968: TA850780 - Send out generic email message when other than an inactivation
                                            // US1157359 WC 9/5 Modified to one generic message
                                            emailSubject = 'EC Parent-Child Relationship record MODIFIED, ID: '+record_id;
                                            emailString = 'EBSCO Connect Parent-Child Relationship record <b>modified</b>.  Record ID: '+record_id+'.'+
                                                '<BR><BR>'+changeString+' You must go to Salesforce and delete the EBSCO Connect Parent-child relationship record and then add a new Salesforce record to reflect the amendment made in NetCRM.'+
                                                '<BR><BR><a href = https://'+acctid_hyphen+'.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1026&id='+record_id+'>Link to NetSuite Record</a>';
                                    }
                            }
                    }


                    // US1157359 WC 9/5: We do not need (or want) an alert to CRM Escalation when a record is deleted as the deletion will never be performed by a user only by Mercury, so I commented it out
                    // Removed code described as "HANDLE RECORD DELETION"


                    // Only send email if there's an actual change to the record
                    if(changeDetected == true){
                            log.debug('changeDetected is '+changeDetected, 'emailSubject is '+emailSubject);
                            email.send({
                                    author: constants.LC2_Employee.MercuryAlerts,
                                    recipients: constants.LC2_Email.CRMEscalation,
                                    subject: emailSubject,
                                    body: emailString
                            });
                    }

            }
            return {
                    afterSubmit: afterSubmit
            }

    });
