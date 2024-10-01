/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/* Script:     Scheduled2_case_reopen_enetauto.js
 * 
 * Purpose:  This script checks all the "Re-Opened" cases assigns to EBSCONET Automated User and:
 * 				1.	Emails out details if re-opened by user other than -System- i.e. email in re-opens closed case 
 *              2.  Closes case (and updates additional fields if necessary) 
 * 
 * Created by: Christine Neale
 *
 *
 * Revisions:  
 *	CNeale  	18/12/2020	US687561 Original version (deployed 1/18/2021)
 *	
*/

define(['N/email',
        'N/error', 
        'N/record', 
        'N/search',
        'N/render',
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants',
        'N/file'],
/**
 * @param {email} email
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */
function(email, error, record, search, render, LC2Constant, file) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	log.debug('<---- Script Start: Scheduled2_case_reopen_enetauto----->');
    	
    	var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
        var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
        var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs

    	// Run search to identify all the Cases we need to look at:-
		var callSearch = search.load({
	        id: LC2_SS.ENet_reopen
	    });
		log.debug('after Call Search Load');
	    var myResultSet = callSearch.run().getRange(0, 999);
	    var length = myResultSet.length;
	    log.audit('No. of results = ', length);

	    if (myResultSet.length > 0){
	    	// At least 1 "Re-Opened" Case assigned to "EBSCONET Automated User"	
	    	for (var x = 0; x < myResultSet.length; x++){
	    		
	        	// Retrieve required info from search results:
	    		var reopBy = myResultSet[x].getValue({name: 'formulatext', summary: 'max'})
        	    log.debug('reopBy = ', reopBy);

	            var caseId = myResultSet[x].getValue({
	                name: 'internalid',
	                summary: 'group'
	            });
	       		log.debug('caseId = ', caseId);
	       		
      			try{
    	       		// Send Email (if not auto-reopened by System)
     				if (reopBy != '-System-'){
     					sendEmail(caseId);
      				}
    	
    	    		// Update Case
    	    		updCase(caseId);
    	    		
       			}
      			catch(e) {
      			log.error(e.name);
            		log.error('Re-opened Case email/update - Error', caseId);
            		email.send({
                        author: LC2_emp.MercuryAlerts,
                        recipients: LC2_email.CRMEscalation,
                        subject: 'ReOpened EBSCONET Automated Case Update/Email Error - Case Internal Id ' +caseId,
                        body: 'Case Internal Id ' +caseId+ ' was re-opened, scheduled job to optionally send email and update case Scheduled2_case_reopen_enetauto.js has failed.<BR><BR> If this problem persists please check and manually handle.'
                    });
              	}   
	    	} // End of For loop
	    }
	    
        // Function: updCase
        // Sets the following fields: Status = Closed, Occupation = Librarian, Level of Effort = XSmall,
		// DDE Request Type = Support Case, Product/Interface = EBSCONET, Area of Support = Forward to SSE,
		// Support Task = unset
        
        function updCase(caseId_in){
        	log.debug('Entering updCase' );
 
    	
        	// Load the Case 
        	var caseRecord = record.load({
        		type: record.Type.SUPPORT_CASE,
        		id: caseId_in
        	});
    	
         	// Update the required fields
        	caseRecord.setValue('status', LC2Constant.LC2_CaseStatus.Closed);  // Status
        	caseRecord.setValue('custevent_occupationtextfield', LC2Constant.LC2_CaseOccupation.Librarian);  // Occupation
        	caseRecord.setValue('custevent_level_of_effort', LC2Constant.LC2_CaseLevelEffort.XSmall);  // Level of Effort
        	caseRecord.setValue('category', LC2Constant.LC2_CaseReqTyp.Support);  //Request Type
        	caseRecord.setValue('custevent_dde_prod_int', LC2Constant.LC2_CaseDDEProd.EbscoNet);   //Product
        	caseRecord.setValue('custevent_dde_area_suppt', LC2Constant.LC2_CaseDDEAreaSupport.ForwardToSSE);   //Area of support
        	caseRecord.setValue('custevent_dde_suppt_task', '');    //Task
 		
        	// Update to the database
        	caseRecord.save({
        		enableSourcing: true,
        		ignoreMandatoryFields: true
        	});
           	log.audit('Case ' +caseId_in+ ' Updated');	
            
        	return;
        }
        /*--------END Function updCase----------------*/
		    
		    
        // Function: sendEmail
        // Sends Email to SSD team handling cases for EBSCONET Automated User
        // Input: Case Internal ID 
        function sendEmail(caseId_in){
        	log.debug('Entering sendEmail for case = ' + caseId_in);
        	var emlTmplt = LC2Constant.LC2_Eml_Tmplt.EnetAutoCase;
        	
       		// First off need to merge template....
    		var mergeResult = render.mergeEmail({
    		    templateId: parseInt(emlTmplt),
    		    entity: {
    		        type: 'employee',
    		        id: parseInt(LC2_emp.EBSCONETAutoUser)
    		        },
    		    recipient: {
    		        type: 'employee',
    		        id: parseInt(LC2_emp.EBSCONETAutoUser)
    		        },
    		    supportCaseId: parseInt(caseId),
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
    	    log.audit('No. of results = ', length);
    	    
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
                author: LC2_emp.EBSCONETAutoUser,
                recipients: LC2_email.ENETAutoUsr,
                subject: mergeResult.subject,
                body: emailBody,
                attachments: fileobj
            });
    		log.debug('Email', 'After Send');

    		return;
        }
        /*--------END Function sendEmail----------------*/
    }

    return {
        execute: execute
    };
    
});
