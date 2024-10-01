/* 
UserEvent2_case_before_submit.js

This script is run only on BEFORESUBMIT of a Case record.
When a case record is saved that is part of a valid YBP profile, before submit of the case record, it checks if the "reply" section 
of the case record contains a message. If so, then the contents are stripped of all HTML tags 
and the "Last Message Text" field is updated. Otherwise, check if there were any changes in the 
"Last Message Text" custom field, which can occur through the script "UserEvent2_Get Latest Msg_After Submit". 
This is required to ensure that any new messages set in the "Last Message Text" saved by a user event script 
on the message record is not overritten by the user editing in the UI.

Original Script implemented for ACS Hover-Over work for GOBI Cases: When a case record is saved that is part of a valid YBP profile, 
	before submit of the case record, 	it checks if the "reply" section of the case record contains a message. If so, then the contents 
	are stripped of all HTML tags and the "Last Message Text" field is updated. Otherwise, check if there were any changes in the 
	"Last Message Text" custom field, which can occur through the script "UserEvent2_Get Latest Msg_After Submit". 
	This is required to ensure that any new messages set in the "Last Message Text" saved by a user event script 
	on the message record is not overwritten by the user editing in the UI.

Change History
04/24/2020 - Cynthia Wang - Initial creation of script to handle the above functionality
05/26/2020 - Cynthia Wang - Updated to shift cleaning code and YBP profile check to library2_constants and updated to get date through script
06/10/2020 - Cynthia Wang - Updated to fix issue with emailing inbound email address that creates a new case
1/18/2021	CNeale			US687561 EBSCONET Automated User workflow changes  
05/07/2021	JOliver			US788612 script on xedit to disallow reassigning cases to non-US reps for custs that require US Support
09/13/2021	PKelleher		US820970 new Accessibility form - user switching Assignee on case form to/from Accessibility/CustSat using Assigned Dept
06/10/2022	ZScannell		US943094 TA721560 Do NOT allow an EC Case Type of "EC User Access Request" to be closed via XEdit
12/11/2023	ZScannell		US1166718 On Case Capture for YBP CS/EC/GOBI/LTS Case Form, set YBP Case Status to "Not Started"
*/

/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/error', 'N/search', 'N/email'
], 

function (record, runtime, constants, error, search, email) {

    function beforeSubmit(context) {
    	log.debug('Entering beforeSubmit function:');
    	log.debug('context.type', context.type);
    	// Retrieve Old & New Details
        var oldRecord = context.oldRecord;
        log.debug('oldRecord', oldRecord);
        var newRecord = context.newRecord;
        log.debug('newRecord', newRecord);
        
        var oRec = {
        	Case: null,
        	assignee: null,
        	caseForm: null,
        	profile: null,
        	status: null,
        	customer: null,
        	folioImpact: null,
        	stage: null,
        	ecCaseType: null
        };     
        // if (context.type != context.UserEventType.CREATE){
        if (oldRecord){ 		
        	oRec.Case = oldRecord.getValue({fieldId: 'casenumber'});	
        	oRec.assignee = oldRecord.getValue({fieldId: 'assigned'});
        	oRec.caseForm = oldRecord.getValue({fieldId: 'customform'});
        	oRec.profile = oldRecord.getValue({fieldId: 'profile'});
        	oRec.status = oldRecord.getValue({fieldId: 'status'});
        	oRec.customer = oldRecord.getValue({fieldId: 'company'});
        	oRec.folioImpact = oldRecord.getValue({fieldId:  'custevent_ec_folio_impact'});
        	oRec.stage = oldRecord.getValue({fieldId: 'stage'});
        	oRec.ecCaseType = oldRecord.getValue({fieldId: 'custevent_sf_ec_case_type'});
        }

        var nRec = {
        	assignee: null,
        	status: null,
        	profile: null,
        	stage: null,
        	ecCaseType: null
        }
        if (newRecord){
        	nRec.assignee = newRecord.getValue({fieldId: 'assigned'});
        	nRec.status = newRecord.getValue({fieldId: 'status'});
            nRec.profile = newRecord.getValue({fieldId: 'profile'});
            nRec.stage = newRecord.getValue({fieldId: 'stage'});
            nRec.ecCaseType = newRecord.getValue({fieldId: 'custevent_sf_ec_case_type'});
        }

    	log.debug('oRec.assignee', oRec.assignee);
    	log.debug('nRec.assignee', nRec.assignee);
    	// log.debug('oRec.caseForm', oRec.caseForm);
    	// log.debug('oRec.customer', oRec.customer);
    	// log.debug('oRec.folioImpact', oRec.folioImpact);
    	
        // US687561 EBSCONET Automated User workflow changes for Direct List Editing
        log.debug('context', context.type);
        if (context.type == context.UserEventType.XEDIT){     	
        	log.debug('XEDIT', 'start');  	
        	if (nRec.assignee && oRec.customer && oRec.folioImpact != true)
        	{ 
	        	var customerLookup = search.lookupFields({
	                type: search.Type.CUSTOMER,
	                id:oRec.customer,
	                columns: ['custentity_us_tech_supp']
	            });	        	
	        	var employeeLookup = search.lookupFields({
	                type: search.Type.EMPLOYEE,
	                id: nRec.assignee,
	                columns: ['custentity_is_us_based_support']
	            });
	        	
            	if(employeeLookup.custentity_is_us_based_support == false && customerLookup.custentity_us_tech_supp == true)
            	{
        				
        				var errorobj = error.create({
                    		name:  'U.S. Based Support',
                    		message: 'The Institution on this case requires U.S. based support.  Please select a U.S. based Support Rep as the Assigned To.  Case #' + oRec.Case + ' has not been updated (refresh list to see).',
                    		notifyOff:	true
                    	})
                    	throw errorobj.message;
    			}
            }
	        	
        	// Xedit continued... Change of assignee to EBSCONET Automated User
        	if (nRec.assignee && nRec.assignee == constants.LC2_Employee.EBSCONETAutoUser){
        		// Check merged case form 
        		if (oRec.caseForm == constants.LC2_Form.CustSatMerged && constants.LC2_Profiles.IsProfileDDESupport(oRec.profile) == true){
        			// Default the following fields: Status = Closed, Occupation = Librarian, Level of Effort = XSmall,
            		// DDE Request Type = Support Case, Product/Interface = EBSCONET, Area of Support = Forward to SSE,
            		// Support Task = unset
        			log.debug('Setting fields', 'Start');
	    			// Status
	    			newRecord.setValue({
	    				fieldId: 'status', 
	    				value: constants.LC2_CaseStatus.Closed,
	    				ignoreFieldChange:	true
	    			})
 	    			// Occupation
	    			newRecord.setValue({
	    				fieldId: 'custevent_occupationtextfield', 
	    				value: constants.LC2_CaseOccupation.Librarian,
	    				ignoreFieldChange:	true
	    			})
	    			// Level of Effort
	    			newRecord.setValue({
	    				fieldId: 'custevent_level_of_effort', 
	    				value: constants.LC2_CaseLevelEffort.XSmall,
	    				ignoreFieldChange:	true
	    			}) 
	    			//DDE Request Type
	    			newRecord.setValue({
	    				fieldId: 'category', 
	    				value: constants.LC2_CaseReqTyp.Support,
	    				ignoreFieldChange:	true
	    			})
	    			// Product/Interface  
	    			newRecord.setValue({
	    				fieldId: 'custevent_dde_prod_int', 
	    				value: constants.LC2_CaseDDEProd.EbscoNet,
	    				ignoreFieldChange:	false
	    			})
	    			// Area of Support
	    			newRecord.setValue({
	    				fieldId: 'custevent_dde_area_suppt', 
	    				value: constants.LC2_CaseDDEAreaSupport.ForwardToSSE,
	    				ignoreFieldChange:	false
	    			})
	    			newRecord.setValue({
	    				fieldId: 'custevent_dde_suppt_task', 
	    				value: '',
	    				ignoreFieldChange:	true
	    			})
	    			log.debug('Setting fields', 'End');
    			}
    			else 
    			{
    				log.debug('Assignee unset', 'Not merged Form/DDE Profile');
    				var errorobj = error.create({
                		name:  'Not merged Form/DDE Profile',
                		message: 'You cannot set the assignee to EBSCONET Automated User for this Case #' + oRec.Case + ' Case has not been updated (refresh list to see).',
                		notifyOff:	true
                	})
                	throw errorobj.message;
    			}
        	}
        	
        	// Xedit continued... Also prevent Assignee change from EBSCONET Automated User if status is Re-opened
        	if (nRec.assignee && oRec.assignee == constants.LC2_Employee.EBSCONETAutoUser && oRec.status == constants.LC2_CaseStatus.ReOpened){
        			log.debug('Assignee reset', 'Re-opened Status');
        			var errorobj = error.create({
                		name:  'Re-opened case - Assignee change',
                		message: 'You cannot change the assignee for this Case #' + oRec.Case + ' Case has not been updated (refresh list to see).',
                		notifyOff:	true
                	})
                	throw errorobj.message;
        	}
       	
        	// Xedit continued... Prevent change of Status from Re-opened if Assignee EBSCONET Automated USer
        	if (nRec.status && oRec.assignee == constants.LC2_Employee.EBSCONETAutoUser && oRec.status == constants.LC2_CaseStatus.ReOpened){
    			log.debug('Status reset', 'Re-opened Status/EBSCONETAutoUser');
    			var errorobj = error.create({
            		name:  'Re-opened case - Status change',
            		message: 'You cannot change the status for this Case #' + oRec.Case + ' Case has not been updated (refresh list to see).',
            		notifyOff:	true
            	})
            	throw errorobj.message;
        	}
        	
        	// US943094 TA721560 Do NOT allow an EC Case Type of "EC User Access Request" to be closed via XEDIT
        	//If EC Case Type = EC User Access Request & Stage is changed to closed, trigger alert and disallow change.
        	if (nRec.status && oRec.ecCaseType == constants.LC2_EC_Case_Type.EC_UA_Request && (nRec.status != oRec.status && constants.LC2_CaseStatus.isClosedStage(nRec.status) == true )){
        		var errorObj = error.create({
        			name: 'Re-Open case - Status change',
        			message: 'You cannot close a case of EC Case Type "EC User Access Request" via Inline Editing. The Case has not been updated.',
        			notifyOff: true
        		});
        		throw errorObj.message;
        	}
        }  // End of XEDIT

        // US820970 Re: Accessibility form - Update form & profile & Accessibility checkbox 
        //	if Assignee dept changes on case to/from Accessibility/CustSat and vice versa - runs on Xedit and Edit
        if (context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.EDIT){
            if (oRec.assignee != nRec.assignee){
            	log.debug('Inside oRec.assignee != nRec.assignee code');
            	var oldAssignedDept = '0';
            	var newAssignedDept = '0';
            	log.debug('oRec.assignee is ' +oRec.assignee);
            	if (oRec.assignee){
            		var lookupOldAssignedDept = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: oRec.assignee,
                        columns: ['department']});

            		// to determine if search.lookup field results from above is empty.  For example, Old Assignee is a group, so Old Assignee dept would be 0 on debug
		            if (Object.keys(lookupOldAssignedDept).length !== 0){
		            	oldAssignedDept = lookupOldAssignedDept.department[0].value;
		          		log.debug('oldAssignedDept is '  +oldAssignedDept);
		            }		
            	}
            	log.debug('nRec.assignee is ' +nRec.assignee);
            	if (nRec.assignee){
            		var lookupNewAssignedDept = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: nRec.assignee,
                        columns: ['department']});

            		// to determine if search.lookup field results from above is empty.  For example, New Assignee is a group, so New Assignee dept would be 0 on debug
		            if (Object.keys(lookupNewAssignedDept).length !== 0){
		            	newAssignedDept = lookupNewAssignedDept.department[0].value;
		          		log.debug('newAssignedDept is '  +newAssignedDept);
		            }		
            	}
    	    	try {
    	    		log.debug('oldAssignedDept is ' +oldAssignedDept, 'newAssignedDept is ' +newAssignedDept);
    	    		// if new assignee is in Access and the old assignee is not in Access, then check the box & update the profile to Access & update form to Accessibility
    	    		if(newAssignedDept == constants.LC2_Departments.Access && oldAssignedDept != constants.LC2_Departments.Access){
    	    			// Set Profile to Accessibility if Assigned Dept is now Accessibility
    		    		newRecord.setValue({
    		    			fieldId: 'profile', 
    		    			value: constants.LC2_Profiles.EISAccess,
    		    			ignoreFieldChange:	false
    		    		})	
    		    		// Set Accessibility Case checkbox to TRUE if new Assigned Dept is Accessibility
    		    		newRecord.setValue({
    		    			fieldId: 'custevent_access_case', 
    		    			value: true,
    		    			ignoreFieldChange:	false
    		    		})	
    	    			// Set case Form to Accessibility
    		    		newRecord.setValue({
    		    			fieldId: 'customform', 
    		    			value: constants.LC2_Form.Access,
    		    			ignoreFieldChange:	false
    		    		})
    	    		} // end new Assigned Dept is now Accessibility	
    	
    	    		// if new assignee is NOT in Access and the old assignee was in Access, then uncheck the Accessibility case box & update the profile to DDE Support & case form to Merged form.
    	        	if(oldAssignedDept == constants.LC2_Departments.Access && newAssignedDept != constants.LC2_Departments.Access){	
    	        		// Set Profile to DDE Cust Sat if new Assigned Dept is NOT Accessibility
    	    			newRecord.setValue({
    		    				fieldId: 'profile', 
    		    				value: constants.LC2_Profiles.DDESupportDefault,
    		    				ignoreFieldChange:	false
    		    			})	        		
    	        		// Uncheck Accessibility Case checkbox if new Assigned Dept is not Accessibility
    		    		newRecord.setValue({
    		    				fieldId: 'custevent_access_case', 
    		    				value: false,
    		    				ignoreFieldChange:	false
    		    			})	
    	   	     		// Set case Form to CustSat Merged Case form
    	   	 	    	newRecord.setValue({
    	   	 	    			fieldId: 'customform', 
    	   	 	    			value: constants.LC2_Form.CustSatMerged,
    	   	 	    			ignoreFieldChange:	false
    	   	 	    		})
    	        	} // end new Assigned Dept is NOT Accessibility	
    	    	}	
    	    	catch (e) {
    				log.error(e.name);
    	            log.error('Accessibility updating failed - Before Submit Error', e);
    	    		email.send({
    	                author: constants.LC2_Employee.MercuryAlerts,
    	                recipients: constants.LC2_Email.CRMEscalation,
    	                subject: 'Case Number ' +oRec.Case+ ' Accessibility updates failed',
    	                body: 'Case Number ' +oRec.Case+ ' Accessibility updates failed.<BR><BR>Accessibility updates should have been made TO the Accessibility Custom Form.<BR><BR>Save this case to ensure the Accessibility updates are made to the Accessibility Custom Form.'});
    	        	}	
            } // end shared IF stmt re old assignee and new assignee        	
        }

        // YBP Case Message Hover Over Functionality 
        try {
            // Check if the current case has a profile that is one of the valid YBP profiles 
            var ybpProfiles = Object.keys(constants.LC2_YbpProfiles).map(function (key) {
                return constants.LC2_YbpProfiles[key]
            });

            log.debug('nRec.profile is ' +nRec.profile, 'ybpProfiles string is ' +ybpProfiles);

            if (ybpProfiles.indexOf(nRec.profile) != -1) {
                log.debug('Inside the Hover Over Message Code');
                // Get the message in the reply section of the case record 
                var outgoingMessage = newRecord.getValue({
                    fieldId: 'outgoingmessage'
                });
                log.debug('outgoingMessage', outgoingMessage);

                // If there is an outgoing message in the reply section, that will be set as the latest message 
                if (outgoingMessage != '' && outgoingMessage != null && outgoingMessage != undefined) {

                    // Now Clean the message to ensure there are proper line breaks and new lines  
                    var cleanMessage = (' ' + outgoingMessage).slice(1);
                    cleanMessage = constants.LC2_cleanMessage(cleanMessage, 'case');

                    // Get the Author and date and set the message into the custom field 
                    var author = runtime.getCurrentUser().name;

                    cleanMessage = "DATE: " + formatCurrentDate() + " | SENDER: " + author + "\n\nMESSAGE: \n" + cleanMessage;
                    log.debug('cleanMessage after replace', cleanMessage);

                    newRecord.setValue({
                        fieldId: 'custevent_acs_last_message_text',
                        value: cleanMessage
                    });

                } else { // Otherwise, check if there were any other new message records created outside of the reply box in the case record
                    // Check if oldrecord exists; if null, then this is a brand new case
                    if (oldRecord != null) {
                        // Old record will store any messages submitted by the user event script "UserEvent2_message_get_latest_message_after_submit"
                        var oldLastMess = oldRecord.getValue({
                            fieldId: 'custevent_acs_last_message_text'
                        });
                        // New record will store any messages submitted by the user in the UI
                        var newLastMess = newRecord.getValue({
                            fieldId: 'custevent_acs_last_message_text'
                        });
                        log.debug('old and new', oldLastMess + " " + newLastMess);
                        // In the case they're not the same, we need the message set by the user event script
                        if (oldLastMess != newLastMess) {
                            newRecord.setValue({
                                fieldId: 'custevent_acs_last_message_text',
                                value: oldLastMess
                            });
                        }
                    } else {
                        // when there's a new case created, including through inbound email case capture, the message record UE is not triggered
                        // Hence we pick up the latest message through the case record fields and update acs_last_message_text field here
                        // Under a new case record with no messages (ie created through UI), no message needs to be updated
                        var incomingMessage = newRecord.getValue({
                            fieldId: 'incomingmessage'
                        });
                        // Only remove new lines if there is html - when the income message is typed into the UI, there shouldn't be any HTML tags
                        if (incomingMessage.match(/<[^>]+>/ig, '') != null) {
                            incomingMessage = incomingMessage.replace(/(\r\n|\n|\r|\t)/gm, "");
                        }
                        log.debug('incomingMessage', incomingMessage);

                        if (incomingMessage != undefined && incomingMessage != '' && incomingMessage != null) {
                            // message (not case) as parameter because the message being cleaned can be coming from a email client (if using inbound email case capture)
                            var cleanMessage = incomingMessage;
                            cleanMessage = constants.LC2_cleanMessage(cleanMessage, 'message');

                            var author = newRecord.getValue({
                                fieldId: 'email'
                            });

                            cleanMessage = "DATE: " + formatCurrentDate() + " | SENDER: " + author + "\n\nMESSAGE: \n" + cleanMessage;
                            log.debug('cleanMessage after replace', cleanMessage);

                            newRecord.setValue({
                                fieldId: 'custevent_acs_last_message_text',
                                value: cleanMessage
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Check Latest Message in Case - Before Submit Error', e);
        }

		//	US1166718 - On Case Capture for YBP CS/EC/GOBI/LTS Case Form, set YBP Case Status to "Not Started"
		if (context.type == context.UserEventType.CREATE){
			var caseProfile = newRecord.getValue({fieldId: 'profile'});
			log.debug({title: 'caseProfile', details: caseProfile});
			if (constants.LC2_YbpProfiles.isYBPProfile(caseProfile) === true){
				if (newRecord.getValue({fieldId: 'status'}) == constants.LC2_CaseStatus.NotStarted){
					newRecord.setValue({
						fieldId: 'custevent_ybp_waiting_on',
						value: constants.LC2_YBPCaseStatuses.NotStarted,
						ignoreFieldChange: true
					});
				}
			}
		}
	}

    function formatCurrentDate() {
        // For the date, new Date() returns PDT/PST based on netsuite servers- convert to EST/EDT by + 3
        var currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 3);
        log.debug('current date', currentDate);
        log.debug('current date', currentDate.toLocaleString());
        var dd = currentDate.getDate();
        var mm = currentDate.getMonth() + 1;
        var yyyy = currentDate.getFullYear();
        var today = mm + '/' + dd + '/' + yyyy;

        return today;
    }
    

    return {
        beforeSubmit: beforeSubmit
    }
});