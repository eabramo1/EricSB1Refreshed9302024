/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/* Script:     Scheduled2_mssg_added_email.js
 * 
 * Purpose:  This script finds all Messages added to Cases that originated in EBSCO Connect and emails the case Assignee
 * 				the Email includes details of the Message and of the case.  It also includes the Message attachments if there are any
 * 
 * Created by: Eric Abramo
 *
 * Revisions:  
 *	eAbramo  	03/15/221	US515868 Original version in SB2
 *	
*/

define(['N/email',
			'N/record',
	        'N/error', 
	        'N/search',
	        'N/render',
	        'N/format',
	        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants',
	        'N/file'],
	        
function(email, record, error, search, render, format, LC2Constant, file){
	      
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	log.audit('<---- Script Start: Scheduled2_mssg_added_email----->');
    	
    	var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
    	var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
    	var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
    	var LC2_RunTime = LC2Constant.LC2_schedScriptRunTime;	// Global variable holding Scheduled Script runtime Ids
    	

     	// A. Get date/time last run for the Start Time ****************
    	// Use the Scheduled Script Run Time record
			var timRec = record.load({
	      		type: 'customrecord_scheduled_script_runtime',
	    		id: LC2_RunTime.eCmssgAddedtoCase
	    		});
			var lastRunTime = timRec.getValue('custrecord_generic_script_last_run');
			// log.debug('lastRunTime is '+lastRunTime);	
			//Use the N/format module to mimic .getDateTimeValue(SS1) functionality in SuiteScript 2.0
			var fmt2_lastRunTime = format.format({
				  value: lastRunTime,
				  type: format.Type.DATETIME
			  	});		
			// log.debug('fmt2_lastRunTime is '+fmt2_lastRunTime);		
			// Modify the Date String: Remove the seconds off but keep the AM/PM
			var start = fmt2_lastRunTime.substring(0, fmt2_lastRunTime.lastIndexOf(":")) + ' ' + fmt2_lastRunTime.substring(fmt2_lastRunTime.length-2); 
			log.audit('start is '+start);				
	
		// B. Get Current Date for the End Time ***********************
			var curr_date = new Date();
			// log.debug('curr_date is '+curr_date);
			var fmt2_curr_date = format.format({
				  value: curr_date,
				  type: format.Type.DATETIME
			  	});		
			// log.debug('fmt2_curr_date is '+fmt2_curr_date);		
			// Modify the Date String: Remove the seconds off but keep the AM/PM
			var end = fmt2_curr_date.substring(0, fmt2_curr_date.lastIndexOf(":")) + ' ' + fmt2_curr_date.substring(fmt2_curr_date.length-2);
			log.audit('end is '+end);
	  
    	// Run search to identify all the Cases we need to look at:
		var callSearch = search.load({
	        id: LC2_SS.eC_mssg_added
	    });    				
		// Add filters for Date of Message so emails don't get sent multiple times for single message
		var searchFilters = callSearch.filters;
        var filter1 = search.createFilter({
            name: 'messagedate',
            join: 'messages',
            operator: search.Operator.ONORAFTER,
            values: [start]
        });     
        searchFilters.push(filter1);
        
		var searchFilters = callSearch.filters;
        var filter2 = search.createFilter({
            name: 'messagedate',
            join: 'messages',
            operator: search.Operator.BEFORE,
            values: [end]
        });  
        searchFilters.push(filter2);
        
        
		log.debug('after Call Search Load');
	    var myResultSet = callSearch.run().getRange(0, 999);
	    var length = myResultSet.length;
	    log.debug('No. of results = ', length);

	    if (myResultSet.length > 0){	    	
	    	// at least one case with a message within the time span
	    	for (var x = 0; x < myResultSet.length; x++){       		
	       		// case Internal ID **********
	    		var caseId = myResultSet[x].getValue({
	                name: 'internalid'
	            });
	       		// log.debug('caseId = ', caseId);      		
	       		// Assignee    **********
	    		var assigneeId = myResultSet[x].getValue({
	                 name: 'assigned'
	       		});		    		
	    		// Case Stage  **********
	    		var stage = myResultSet[x].getValue({
	                 name: 'stage'
	       		});	
	    		log.debug('stage = ', stage);
	    		
	    		// if Case Stage is closed,  Need to update the case to re-opened 
	    		if(stage == 'CLOSED'){    			
	            	// Load the Case 
	            	var caseRecord = record.load({
	            		type: record.Type.SUPPORT_CASE,
	            		id: caseId
	            	});	        	
	             	// Update the required fields
	            	caseRecord.setValue('status', LC2Constant.LC2_CaseStatus.ReOpened);  // Status	
	            	// Submit the record
	            	caseRecord.save({
	            		enableSourcing: true,
	            		ignoreMandatoryFields: true
	            	});
	               	log.debug('Case ' +caseId+ ' Updated to Re-opened');		
	    		}
	    		log.debug('Case ' +caseId+ ' to be inspected for messages');
	    		// If there's more than one message then send the email.  Otherwise don't send email
	    		// Create Search to count_messages on this Case
	    		var m_length = 0;	    		
	    		var mssgCountSearch = search.load({
	    	        id: LC2_SS.eC_mssg_count
	    	    });
	    		// log.debug('after Message Count Search Load');
	    		// Now add a filter on Case Internal ID 
	    		var mssgCountFilters = mssgCountSearch.filters;
	            var filter4 = search.createFilter({
	                name: 'internalid',
	                join: 'case',
	                operator: search.Operator.ANYOF,
	                values: parseInt(caseId)
	            });
	            mssgCountFilters.push(filter4);		    	    
	    	    var mssgCountResultSet = mssgCountSearch.run().getRange(0, 999);
	    	    m_length = mssgCountResultSet.length;
	    	    log.audit('Case Internal ID '+caseId, 'count of Messages is '+m_length);           
	    		// Exclude Cases that are brand new (meaning those with only one message)
	    		if (m_length > 1){
		    		try{
		    			sendEmail(caseId,  assigneeId);
		       		}
		      		catch(e){
			      		log.error(e.name);
			           	log.error('Message Added to Case, Email To Assignee Error', caseId);
			            email.send({
				            author: LC2_emp.MercuryAlerts,
				            recipients: LC2_email.CRMEscalation,
				            subject: 'Message Added to Case, Email To Assignee Error ' +caseId,
				            body: 'Case Internal Id ' +caseId+ '.   The scheduled job to \'Send email to case assignee upon the addition of an EBSCO Connect Message\' has failed.<BR><BR> If this problem persists please check and manually handle.'		            
			            });
		            }	// end catch 		    			
	    		}	// end m_length > 1	
	    	}	// end for loop
	    }	// end myResultSet > 0

	    
	    // Reset the Scheduled Script Runtime date to curr_date to prepare for the next script run	    
		var timRec2 = record.load({
      		type: 'customrecord_scheduled_script_runtime',
    		id: LC2_RunTime.eCmssgAddedtoCase
    		});			
		timRec2.setValue({
				fieldId: 'custrecord_generic_script_last_run',
   				value: curr_date,
   				ignoreFieldChange: true});			
		timRec2.save({
    		enableSourcing: false,
    		ignoreMandatoryFields: true});
		// End Reset the Scheduled Script Runtime date to curr_date to prepare for the next script run
	
	    
	    // Function: sendEmail Function   ----------------------------------*/   
	    // Sends Email to Assignee of the Case
	    // Input: Case Internal ID, Assignee ID    
	    function sendEmail(caseId_in, assigneeId_in){
	    	log.debug('Case Internal ID '+caseId_in, 'Entering sendEmail for Message');
	    	//log.debug('mssgId_in is '+mssgId_in);
	    	//log.debug('caseId_in is '+caseId_in);
	    	//log.debug('assigneeId_in is '+assigneeId_in);
	  	
	    	var emlTmplt = LC2Constant.LC2_Eml_Tmplt.eC_mssg_added_tmplt;
	    	log.debug('emlTmplt is '+emlTmplt);
    	
	    	// First off need to merge template....
			var mergeResult = render.mergeEmail({
			    templateId: parseInt(emlTmplt),
			    entity: {
			        type: 'employee',
			        id: parseInt(LC2_emp.SystemUser) // used system user 
			        },
			    recipient: {
			        type: 'employee',
			        id: parseInt(LC2_emp.SystemUser) // used system user 
			        },
			    supportCaseId: parseInt(caseId_in),
			    transactionId: null,
			    custmRecord: null
			    });
			
			log.debug('Body', mergeResult.body);
			log.debug('Subject', mergeResult.subject);
			var emailBody = mergeResult.body;
			
			// Get the latest message & see if it's got any attachments
			var hasattach = null;
	 		var fileobj = [];
			
			// Search for latest message
			var msgSearch = search.load({
		        id: LC2_SS.Last_msg
		    });
			log.debug('after Message Search Load');
			// Now add a filter on Case Internal ID 
			var searchFilters = msgSearch.filters;
	        var filterOne = search.createFilter({
	            name: 'internalid',
	            join: 'case',
	            operator: search.Operator.ANYOF,
	            values: parseInt(caseId_in)
	        });
	        searchFilters.push(filterOne);

		    var myResultSet = msgSearch.run().getRange(0, 2);
		    
		    // Check that we only get one result (this should only ever happen!)
		    var length = myResultSet.length;
		    log.debug('No. of message search results = ', length);
		    
		    if (length == 1){
		    	// Only do attachments bit if only one message returned
	    	    var msgid = myResultSet[0].getValue({name: 'formulanumeric', summary: 'max'})
	    	    log.debug('msg id = ', msgid);
	    	    hasattach = myResultSet[0].getValue({name: 'formulatext', summary: 'max'})
	    	    log.debug('has attach = ', hasattach);
	    	    
	    	    if (hasattach == 'T'){
	    	    	// Retrieve attachment(s) from message
	    	    	// Check size <10MB & <20MB total
	    	    	// Build File Object 
	    	    	
	    	    	var messageSearchObj = search.create({
	                    type: "message",
	                    filters: [
	                        ["internalid", "anyof", msgid]
	                    ],
	                    columns: [
	                        search.createColumn({
	                            name: "internalid",
	                            join: "attachments"
	                        })
	                    ]
	                }); 
	                var resultsSet = messageSearchObj.run();
	                var results = resultsSet.getRange(0, 999);
	                var total_size = 0;
	                var tot_size_ind = 'F';
	                var max_total = LC2Constant.LC2_MaxFileSize.Total_20MB;
	                var max_individ = LC2Constant.LC2_MaxFileSize.Individ_10MB;

	                for (var i in results) {
	                    var result = results[i];
	                    var attachId = result.getValue(result.columns[0]);
	                    var attach = file.load({id: attachId});
	                    var file_size = attach.size; 
	                    log.debug("File Size: "+ attach.size);
	                    if ((file_size > max_individ || total_size + file_size > max_total)) {
	                    	if ( tot_size_ind == 'F'){
	                    		var emailBody = "<b> ****Missing Attachment(s) - please Refer to original NetCRM Case****<b><BR><BR>" + emailBody;
	                    		tot_size_ind = 'T';
	                    	}
	                    }
	                    else{
	                    	fileobj.push(attach); 
	                    	total_size = total_size + file_size;
	                    	log.debug("Total Size: "+ total_size);
	                    }
	                 }
	    	    }
		    }
			
			// Now send the email.....
			log.debug('Email', 'Before Send');
			email.send({
	            author: LC2_emp.SystemUser,
	            recipients: assigneeId_in,
	            subject: mergeResult.subject,
	            body: emailBody,
	            attachments: fileobj
	        });
			log.audit('Email', 'After Send');	
			
	    	return;
	    } /*--------END Function sendEmail ---------------------------------*/    
    
    }

    
   
    
    return {
        execute: execute
    };
    
});
