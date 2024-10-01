/* 
    Script: UserEvent2_message_after_submit.js

    Created by: NS ACS
    
    Library Scripts Used: library2_constants
    
    Original Purpose of Script (as written by Cynthia Wang of ACS: When a new Message is created, the script will check whether the message has 
    		just been created and is related to a Case Record with a valid YBP profile. If so, retrieve the message and clear off all HTML tags. 
			Resulting message is in plain text and is updated into the custom field "Last Message Text" of the corresponding case record.
    

Change History
	04/24/2020 - Cynthia Wang - Initial creation of script to handle the above functionality
	05/26/2020 - Cynthia Wang - Updated to shift cleaning code and YBP profile check to library2_constants and updated to get date through script
	02/23/2023 - Eric Abramo  - Renamed this file from 'UserEvent2_message_Get_Latest_Message_after_submit.js' to 'UserEvent2_message_after_submit.js'
*/

/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'], function (record, search, constants) {

    function afterSubmit(context) {
        try {

            var newRecord = context.newRecord;
            var activityId = newRecord.getValue({
                fieldId: 'activity'
            });

            // Check if creation of new message record 
            if (context.type == context.UserEventType.CREATE && activityId != null && activityId != '') {

                // Run a search to see if this new message is attached to a case
                // need to use a search because activitytype field returns undefined on the newRecord
                var checkCaseSearch = search.create({
                    type: record.Type.SUPPORT_CASE,
                    filters: ["internalid", "anyof", activityId],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "internalid"
                        }),
                        search.createColumn({
                            name: "profile",
                            label: "profile"
                        })
                    ]
                });
                var results = checkCaseSearch.run().getRange(0, 1);
                log.debug('results', results);

                // Continue only if this new message record is attached to a case
                if (results.length == 1) {

                    // Check if the current case has a profile that is one of the valid YBP profiles 
                    var ybpProfiles = Object.keys(constants.LC2_YbpProfiles).map(function (key) {
                        return constants.LC2_YbpProfiles[key]
                    });
                    var profile = results[0].getValue({
                        name: 'profile'
                    });
                    log.debug('profile', profile + " " + ybpProfiles);

                    if (ybpProfiles.indexOf(profile) != -1) {

                        // First store the original message from the message record and strip off any new lines for easier regexp matching
                        var origMessage = newRecord.getValue({
                            fieldId: 'message'
                        }).replace(/(\r\n|\n|\r|\t)/gm, "");
                        log.debug('orig message', origMessage);

                        if (origMessage != '' && origMessage != null) {

                            // For OUTLOOK: 
                            // Check if there's multiple <div> - if so, take only text between the start of first div and second div
                            // Occurs if theres multiple emails
                            var origMessageBody = origMessage.match(new RegExp('</head>' + "(.|\n|\r)*?" + '<div class="WordSection1">' + "(.|\n|\r)*?" + '<div>'));
                            if (origMessageBody == null) {

                                // Check if theres only one <div> - if so then take the information within that one div 
                                origMessageBody = origMessage.match(new RegExp('</head>' + "(.|\n|\r)*?" + '<div class="WordSection1">' + "(.|\n|\r)*?" + '</div>'));

                            }
                            // If none of the above matches work, use the original message 
                            origMessageBody = origMessageBody != null ? origMessageBody[0] : origMessage;
                            log.debug('orig message, only body', origMessageBody);


                            // Now Clean the message to ensure there are proper line breaks and new lines  
                            var cleanMessage = origMessageBody;
                            cleanMessage = constants.LC2_cleanMessage(cleanMessage, 'message');

                            // Set up the author and date - need to use lookup fields because if the email is sent from NetSuite, newRecord.getText/Value returns error or emtpy
                            var caseAuthorDate = search.lookupFields({
                                type: search.Type.MESSAGE,
                                id: newRecord.id,
                                columns: ['author', 'messagedate']
                            });
                            log.debug('caseauthordate', caseAuthorDate);

                            cleanMessage = "DATE: " + caseAuthorDate.messagedate.split(' ')[0] + " | SENDER: " + caseAuthorDate.author[0].text + "\n\nMESSAGE: \n" + cleanMessage;
                            log.debug('cleanMessage after replace', cleanMessage);


                            // Afterwards, update the case record with the newest message in the custom field   
                            record.submitFields({
                                type: record.Type.SUPPORT_CASE,
                                id: newRecord.getValue({
                                    fieldId: 'activity'
                                }),
                                values: {
                                    custevent_acs_last_message_text: cleanMessage
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Get Latest Message from Message - After Submit Error', e);
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});