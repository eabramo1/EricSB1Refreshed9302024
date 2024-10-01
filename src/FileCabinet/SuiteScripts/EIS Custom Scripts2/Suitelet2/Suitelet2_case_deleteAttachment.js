/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

// Script:    Suitelet2_case_deleteAttachment.js (renamed from Suitelet_APCaseDeleteAttachment_SS2.js)
//        Written in SuiteScript 2.0
//
// Created by:  Krizia Ilaga (of NetSuite ACS)  05-2019
//
// Purpose:   For EIS Accounts Payable Case Management Onboarding to NetCRM
//        The script builds the Delete Attachment page whereby users can select attachments (connected to an AP Case) to delete
//        The script is called from the script Client_Record_case_ss2.js (called via button rendered via another script: Case Before Load Event)
//      
//
//Library Scripts Used:   None
//
//
// Revisions:  
//	CNeale		03/15/2021	US725157  Fix bug with sublist build where attachment has already been deleted.
//									  Remove (unused) Message field from sublist (& related searches) & remove (unused) stripHTML function.	
//									  Rename & move in line with current SS2.0 standards 	
//
//
//
//----------------------------------------------------------------------------------------------------------------

define(['N/search', 'N/ui/serverWidget', 'N/file', 'N/redirect', 'N/record'],
/**
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(search, serverWidget, file, redirect, record) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        if (request.method == 'GET') {
            var caseId = request.parameters.custparam_caseId;
            log.debug('caseId',caseId);

            var form = serverWidget.createForm({
                title : 'Case Attachments'
            });

            var caseField = form.addField({
                id: "custpage_caseid",
                label: "Case ID",
                type: serverWidget.FieldType.TEXT
            });

            caseField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            caseField.defaultValue = caseId;

            var sublist = form.addSublist({
                id: "custpage_message_list",
                label: "Case Messages",
                type: serverWidget.SublistType.LIST
            });

            sublist.addMarkAllButtons();

            sublist.addField({
                id: "custpage_delete",
                label: "Delete",
                type: serverWidget.FieldType.CHECKBOX
            });

            var msgid = sublist.addField({
                id: "custpage_msgid",
                label: 'Message ID',
                type: serverWidget.FieldType.TEXT
            });

            msgid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            var msgid = sublist.addField({
                id: "custpage_date",
                label: 'Date',
                type: serverWidget.FieldType.TEXT
            });

            msgid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            var author = sublist.addField({
                id: "custpage_author",
                label: 'Author',
                type: serverWidget.FieldType.TEXT
            });
			
            author.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            var subject = sublist.addField({
                id: "custpage_subject",
                label: 'Subject',
                type: serverWidget.FieldType.TEXT
            });

            subject.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
			log.debug("Message Complete", "1")

            var attachments = sublist.addField({
                id: "custpage_attachments",
                label: 'Attachments',
                type: serverWidget.FieldType.TEXT
            });

            attachments.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            var fileIdField = sublist.addField({
                id: "custpage_fileid",
                label: 'File ID',
                type: serverWidget.FieldType.TEXT
            });

            fileIdField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var searchResults = getMessagesWithAttachments(caseId);
            var messageIdArray = ["internalid","anyof"];

            for(var j = 0; j < searchResults.length; j++){
                var myValue = searchResults[j].getValue({name: 'internalid', join: 'messages'});
                messageIdArray.push(myValue);
            }

            if(messageIdArray.length <= 2){
                redirect.toRecord({
                  type : record.Type.SUPPORT_CASE, 
                  id : caseId
                });
                return ;
            }

            var fileIds = getAttachments(messageIdArray);
            var totalMessage = 0;
			
			var count = 0
            for(var a = 0; a < fileIds.length; a++){
                if(fileIds[a].fileId){
                    totalMessage++;
                    log.debug("file number: " +a,fileIds[a]);
                    sublist.setSublistValue({
                        id: "custpage_msgid",
                        line: count,
                        value: fileIds[a].messageId
                    });

                    sublist.setSublistValue({
                        id: "custpage_date",
                        line: count,
                        value: fileIds[a].date
                    }); 

                    sublist.setSublistValue({
                        id: "custpage_author",
                        line: count,
                        value: fileIds[a].author
                    }); 

                    sublist.setSublistValue({
                        id: "custpage_subject",
                        line: count,
                        value: fileIds[a].subject
                    }); 

                    var fileObj = file.load({
                        id: fileIds[a].fileId
                    });
                    log.debug(fileIds[a].fileId,fileObj)
                    if(fileObj){
                       sublist.setSublistValue({
                            id: "custpage_attachments",
                            line: a,
                            value: fileObj.name
                        });

                       sublist.setSublistValue({
                            id: "custpage_fileid",
                            line: a,
                            value: fileObj.id
                        });
                    }
					count++
                }
            }

            if(totalMessage == 0){
              redirect.toRecord({
                  type : record.Type.SUPPORT_CASE, 
                  id : caseId
                });
                return ;
            }

            form.addSubmitButton({
                label: "Delete Selected Attachments"
            });

            response.writePage(form);
        }
        else{
          var caseId = request.parameters.custpage_caseid
          log.debug('caseId',caseId);
          var lineCount = request.getLineCount({
              group: "custpage_message_list"
          });
          for(var i = 0; i < lineCount; i++){
            var markedAsDelete = request.getSublistValue({
                group: "custpage_message_list",
                name: "custpage_delete",
                line: i
            });

            if(markedAsDelete == "T"){
              var fileId = request.getSublistValue({
                  group: "custpage_message_list",
                  name: "custpage_fileid",
                  line: i
              });
              log.debug('fileId',fileId);

              file.delete({
                  id: fileId
              });
            }
          }

          redirect.toRecord({
              type : record.Type.SUPPORT_CASE, 
              id : caseId
          });
        }

    }

    function getMessagesWithAttachments(caseId){
        var supportcaseSearchObj = search.create({
           type: "supportcase",
           filters:
           [
              ["internalid","anyof",caseId], 
              "AND", 
              ["messages.hasattachment","is","T"]
           ],
           columns:
           [
              search.createColumn({
                 name: "internalid",
                 join: "messages",
                 label: "Message Internal ID",
                 sort: search.Sort.DESC
              })
           ]
        });
        var searchResult = supportcaseSearchObj.run().getRange(0,1000);
        return searchResult;
    }

    function getAttachments(messageIdArray){
        var messageSearchObj = search.create({
           type: "message",
           filters:
           [
              messageIdArray
           ],
           columns:
           [
              search.createColumn({
                 name: "messagedate",
                 label: "Date",
                 sort: search.Sort.DESC
              }),
              search.createColumn({
                 name: "author",
                 label: "Author"
              }),
              search.createColumn({
                 name: "subject",
                 label: "Subject"
              }),
              search.createColumn({
                 name: "internalid",
                 join: "attachments",
                 label: "Attachment Internal ID"
              })
           ]
        });
        var searchResult = messageSearchObj.run().getRange(0,1000);
        var fileIds = new Array();
        for(var i = 0; i < searchResult.length; i++){
            var fileId = searchResult[i].getValue({
                name: 'internalid',
                join: 'attachments'
            });
            log.debug('fileId ' +i,fileId);
            //US725157 Only populate array if there is actually an attachment (don't rely on "has attachments")
            if (fileId){ 
            	var msgDate = searchResult[i].getValue({
            		name: 'messagedate'
            	});
            	var author = searchResult[i].getText({
            		name: 'author'
            	});
            	var subject = searchResult[i].getValue({
            		name: 'subject'
            	});
            	log.debug('subject', subject);

            	var temp = {
            			'messageId': searchResult[i].id,
            			'date': msgDate,
            			'author': author,
            			'subject': subject,
            			'fileId': fileId
            	}
            	fileIds.push(temp);
            }
            
        }   
        return fileIds;
    }

    return {
        onRequest: onRequest
    };
    
});
