/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*
    Script: UserEvent2_case_after_submit.js

    Created by: Eric Abramo
    
	Library Scripts Used:	library2_constants

    Revisions:
    eAbramo			09/01/2020		Script Creation for US684171 Handle Case Profile auto-switch when Cases Created in 2 new Profiles
    CNeale			01/18/2021		US687561 EBSCONET Automated User workflow - email production
    JOliver			06/09/2022		US943094 Update SRPM Record with "Denied" Status (TA721561, TA728348)
    JOliver			02/17/2023		TA797185 Update SRPM last modified by when setting Denied status

*/

define(['N/record', 
	'/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 
	'N/email',
	'N/render',
	'N/search',
	'N/file',
	'N/runtime'],
/**
 * @param {record} record
 */

function(record, LC2Constant, email, render, search, file, runtime){
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */	
	
	function caseAfterSubmit(scriptContext){		
		// Get Profile - if 'DDE Latin America' or 'DDE Brazil' then reset the Profile to standard 'DDE Support' profile
		var case_rec = scriptContext.newRecord;
 		var case_id =case_rec.getValue({fieldId: 'id'});
 		log.debug('ss2 case after submit - case_id value is ', case_id);
		var case_profile = case_rec.getValue({fieldId: 'profile'});
		// log.debug('case_profile value is ', case_profile);
		var LC2_email = LC2Constant.LC2_Email; // Global variable holding email recipient (crm escalation)
		var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee ID of sender of email
		var ec_casetype = case_rec.getValue({fieldId: 'custevent_sf_ec_case_type'});
		var case_stage = case_rec.getValue({fieldId: 'stage'});
		var ec_access_dec = case_rec.getValue({fieldId: 'custevent_ec_access_decision'});
		var ec_contact_type = case_rec.getValue({fieldId: 'custevent_sf_ec_contact_type'});
		var srpm_id = case_rec.getValue({fieldId: 'custevent_sf_srpm_id'});
		//var case_contact = case_rec.getValue({fieldId: 'contact'});
		var access_type_requested = case_rec.getValue({fieldId: 'custevent_sf_access_type_requested'});
		
		// Load Library Constant object
		var IsProfileDDELatAmBrazilSupport_c = LC2Constant.LC2_Profiles.IsProfileDDELatAmBrazilSupport(case_profile);
		// log.debug('IsProfileDDELatAmBrazilSupport_c value is ', IsProfileDDELatAmBrazilSupport_c);
		
		// US684171 Handle Case Profile auto-switch when Cases Created in 2 new Profiles
		if (IsProfileDDELatAmBrazilSupport_c == true){
			log.debug('Inside the IsProfileDDELatAmBrazilSupport_c inner clause', 'hooray');
			try {
				// case_rec.setValue('profile', LC2Constant.LC2_Profiles.DDESupportDefault);  // doesn't work		
				record.submitFields({
		        	    type: record.Type.SUPPORT_CASE,
		        	    id: case_id,
		        	    values: {'profile': LC2Constant.LC2_Profiles.DDESupportDefault}
				});				
			}
			catch(e){
				log.error(e.name);
        		log.error('DDE Latin American or DDE Brazilian Profile for Case ' +case_id+ ' not updated');
        		email.send({
                    author: LC2_emp.MercuryAlerts,
                    recipients: LC2_email.CRMEscalation,
                    subject: 'Case ' +case_id+ ' profile modification failed',
                    body: 'Case Internal Id ' +case_id+ ' profile modification failed.<BR><BR>The DDE Latin American or DDE Brazilian Profile was not updated.<BR><BR>Save this case to ensure the profile is switched to the DDESupportDefault Profile'
                });
			};
		};
		
		
		// US687561 If Assignee changed to EBSCONET Automated User then send email
		if (scriptContext.type != scriptContext.UserEventType.DELETE){
			var newRec = scriptContext.newRecord;
			if (scriptContext.type == scriptContext.UserEventType.CREATE){
				var oldAssignee = '';
			}
			else{
				var oldRec = scriptContext.oldRecord;
				var oldAssignee = oldRec.getValue({fieldId: 'assigned'});
			}
        	var newAssignee = newRec.getValue({fieldId: 'assigned'});
        	var caseId = newRec.id;
        	log.debug('caseId ', caseId);
        	log.debug('Old Assign', oldAssignee);
        	log.debug('New Assign', newAssignee);
        	
        	// Change of assignee to EBSCONET Automated User
        	if (newAssignee == LC2_emp.EBSCONETAutoUser && newAssignee != oldAssignee){
        		log.debug('Assignee Change to ', newAssignee);
        		log.audit('ENet Auto User Change for caseId ', caseId);
        		
         		try{
    	       		// Send Email 
        		    sendEmail(caseId);
      			}
      			catch(e){
     				log.error(e.name);
            		log.error('Case Assigned to EBSCONET Automated User - Error', caseId);
            		email.send({
                        author: LC2_emp.MercuryAlerts,
                        recipients: LC2_email.CRMEscalation,
                        subject: 'EBSCONET Automated User Case Notification Email Error - Case Internal Id ' +caseId,
                        body: 'Case Internal Id ' +caseId+ ' was assigned to EBSCONET Automated User, UserEvent script to send email UserEvent2_case_after_submit.js has failed.<BR><BR> Please check and manually handle.'
                    });
              	}  
         	}
		}
		
		//US943094 (TA721561) + TA797185
		//Case Type is EC User Access Request, Stage = Closed, EC Access Decision is Denied
		if(ec_casetype ==  LC2Constant.LC2_EC_Case_Type.EC_UA_Request && case_stage == 'CLOSED' && ec_access_dec == LC2Constant.LC2_Access_Decision.Denied)			
		{
			log.debug('EC Access Decision', ec_access_dec);
        	
        	//TA721561 Self-registered contact, SRPM not converted, 
			if (ec_contact_type == LC2Constant.LC2_EC_Contact_Access_Type.SelfRegistered)
			{	
	        	var srpmRec = record.load({
	        	    type: 'customrecord_sr_portal_member',
	        	    id: srpm_id
	        	});
	        	
	        	var srpm_conv_status = srpmRec.getValue({fieldId: 'custrecord_srpm_conversion_status'});
	        	log.debug('SRPM Conversion Status', srpm_conv_status);
	        	var update_srpm_last_modified_by = false
	        	var currentUser = runtime.getCurrentUser();
	        	
	        	
	        	//If Status is blank (undefined) OR something other than Converted (future-proofing it)
				if (srpm_conv_status == '' || (srpm_conv_status && srpm_conv_status != LC2Constant.LC2_SRPM_Conversion_Status.Converted))
				{
					// access_type_requested = Access Type Requested (custevent_sf_access_type_requested)
					// This is a multi-select field so in case there is one or multiple values we will test the length and iterate through it as if it's an array
					for (var a = 0; a < access_type_requested.length; a++)
					{
						// For every type of Access Type that a user can request (stored in LC2_Constants.LC2_Access_Type_Req)
					    for (x in LC2Constant.LC2_Access_Type_Req){
					    	// Match the Access Type Requested to the proper value in LC2_Access_Type_Req + Check it is NOT Academy
					        if (LC2Constant.LC2_Access_Type_Req[x].id == access_type_requested[a] && access_type_requested[a] != LC2Constant.LC2_Access_Type_Req.Academy.id){
					        	// Check if that Access Type's field on the SRPM is Denied
					            if (srpmRec.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].srpmFieldId}) != LC2Constant.LC2_SF_EcAccessLevels_sts.Denied){
					                
					            	// If not denied, set to "Denied"
					            	try {
						            	srpmRec.setValue({
						                    fieldId: LC2Constant.LC2_Access_Type_Req[x].srpmFieldId,
						                    value: LC2Constant.LC2_SF_EcAccessLevels_sts.Denied,
						                    ignoreFieldChange: true
						            	});
					            	
						    	       update_srpm_last_modified_by = true;

					            	}
					            	
									catch(e){
										log.error(e.name);
						        		log.error('SRPM Record ' +srpm_id+ ' not updated');
						        		email.send({
						                    author: LC2_emp.MercuryAlerts,
						                    recipients: LC2_email.CRMEscalation,
						                    subject: 'Self-Registered Portal Member Record ' +srpm_id+ ' not updated',
						                    body: 'Self-Registered Portal Member Record ' +srpm_id+ ' failed to update the applicable Access Status(es) to Denied.<BR><BR>Please update the fields manually on the SRPM record using the Web Services Form.'
						                });
									};
					            }
					        }
					    }
					}
					
					//TA797185 If SRPM Access status set to denied, also update last modified by
	    	        if (update_srpm_last_modified_by == true)
			        {
		            	srpmRec.setValue({
		                    fieldId: 'custrecord_srpm_last_modified_by',
		                    value: currentUser.id,
		                    ignoreFieldChange: true
		            	});

			        }

					// Submit the SRPM back to save the changes
					var srpmSavedId = srpmRec.save({
						enableSourcing: false,
						ignoreMandatoryFields: true
					});

				}
					
			}
			
		}

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
    	        id: LC2Constant.LC2_SavedSearch.Last_msg
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
    	    log.debug('No. of results = ', length);
    	    
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
        };	// End of function: sendEmail
         
	};
	
    return {   	
        afterSubmit: caseAfterSubmit        
    };
    
});


