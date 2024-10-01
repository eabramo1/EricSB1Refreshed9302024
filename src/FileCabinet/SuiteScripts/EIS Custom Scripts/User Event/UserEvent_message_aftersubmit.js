// Script:     UserEvent_message_aftersubmit.js
// Created by: Eric Abramo
//
// Functions:  message_after_submit:  the User Event function with one main purpose
//             1) Detects that a message comes into NetSuite and sets a Case Status to Re-opened.
// 				  When this happens need to create or Update Case History record (custom record) to record the time that a Case is Assigned to 
//                a particular user and is Open.  As of July 2016 only runs for YBP Profile Cases		
//
//	Library Scripts Used:
// 	library_constants.js -- Library Script used to reference constant values
// 	library_script.js -- multilanguage profile check
//
// Revisions:
//		EABRAMO 09/30/2016		Add OMG Profile (18) into code that originally only ran for YBP Profile (17)
//      LWeyrauch 05/??/2017	Add LTS Profile (21) into code for YBP, OMG & GOBI profile
//		CNeale	06/14/2017		US214281 Treat YBP Multi-language profiles as main YBP profile (17)
//		CNeale	06/21/2018		F24082 Don't do the YBP/OMG status updates for GOBI/EBA cases.
//		CNeale	02/14/2019		US442796 Populate Case Last Modified By when a message added to a Case (not via WebServices).
//	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var YBPCaseStatus = {
    Closed: 8,
    ReOpened: 9,
    SentToOMG: 11
};

var OMGCaseStatus = {
    Closed: 3,
    ReOpened:8
}

function message_after_submit(type)
{
	if (type != 'delete') // US442796 Check message is not being deleted
	{	
		var message = nlapiGetNewRecord();
		var activity = message.getFieldValue('activity');	
		if (activity)
		{	
			var caseRecord = nlapiLoadRecord('supportcase', activity);
			var caseId = caseRecord.getId();	
			var case_status = caseRecord.getFieldValue('status');
			var case_profile = caseRecord.getFieldValue('profile');
			var case_form = caseRecord.getFieldValue('customform');  //F24082
			//US214281 Cater for YBP multi-language profiles
			if (ybpSupportMultiLangProfileCheck(case_profile))
			{
				case_profile = '17'; 
			}
				// nlapiLogExecution('DEBUG','caseId', 'value is '+caseId);
			// case status of Re-Opened (4) and Case Profile (17 or 18 or 20 or 21) kicks this off
			if (case_status == '4' && (case_profile == '17' || case_profile == '18' || case_profile == '20' || case_profile == '21'))
			{
					//nlapiLogExecution('DEBUG','location', 'location 2');
				// *********************************** **********************************
				// BEGIN Get Current values in Case
				// Current Assignee
				var curr_assignee = caseRecord.getFieldValue('assigned');
				// Current Assignee Department
				var curr_assignee_dept = caseRecord.getFieldValue('custevent_assignee_department');		
				// Current Stage
				var curr_stage = caseRecord.getFieldValue('stage');
				var curr_stage2 = null;
					// convert NS Stage to the custom list values for stage (for comparison later)
					if (curr_stage == 'OPEN')
					{
						curr_stage2 = '1';
					}
					if (curr_stage == 'ESCALATED')
					{
						curr_stage2 = '2';
					}
					if (curr_stage == 'CLOSED')
					{
						curr_stage2 = '3';
					}	
				// Current Begin Time for Case History record	
				var curr_Time = caseRecord.getFieldValue('lastmodifieddate');
				curr_Time = nlapiStringToDate(curr_Time, 'datetimetz');
				curr_Time = nlapiDateToString(curr_Time, 'datetimetz');	
				// END Get Current values in Case
				// *********************************** **********************************	
		
		
				// *********************************** **********************************		
				// BEGIN Search all Case History records for this case  find the open record for each of the TWO types of changes tracked
				var active_ch_stageOpen_found = false;
				var active_ch_stageESC_found = false;
	
				// Search for existing StageOpen Case History records
					var ch_stageOpen_filters = new Array();
					ch_stageOpen_filters[0] = new nlobjSearchFilter('custrecord_ch_case', null, 'anyof', caseId);
					ch_stageOpen_filters[1] = new nlobjSearchFilter('custrecord_ch_is_open', null, 'is', 'T');
						// Case History Log Type of 2 = Stage Open
					ch_stageOpen_filters[2] = new nlobjSearchFilter('custrecord_ch_logtype', null, 'anyof', '2');
					var ch_stageOpen_columns = new Array();
					ch_stageOpen_columns[0] = new nlobjSearchColumn('id', null, null);
					ch_stageOpen_columns[1] = new nlobjSearchColumn('custrecord_ch_stage', null, null);			
					ch_stageOpen_columns[2] = new nlobjSearchColumn('custrecord_ch_assignee', null, null);		
					ch_stageOpen_columns[3] = new nlobjSearchColumn('custrecord_ch_begin_time', null, null);
					// Search Case History
					var ch_stageOpen_searchResults = nlapiSearchRecord('customrecord_case_history', null, ch_stageOpen_filters, ch_stageOpen_columns);
					if (ch_stageOpen_searchResults)
					{
						for (var x=0; ch_stageOpen_searchResults != null && x < ch_stageOpen_searchResults.length; x++ )
						{	// store Case History ID
							var active_ch_stageOpen_id = ch_stageOpen_searchResults[x].getValue('id');										
							// Store Case History Assignee in variable "active_ch_stageOpen_assignee"
							var active_ch_stageOpen_assignee = ch_stageOpen_searchResults[x].getValue('custrecord_ch_assignee');
							// Store Case History BEGIN TIME in variable "active_ch_stageOpen_begin"
							var active_ch_stageOpen_begin = ch_stageOpen_searchResults[x].getValue('custrecord_ch_begin_time');
						}
						active_ch_stageOpen_found = true;
					}
	
				// Search for existing StageEscalated Case History records
					var ch_stageEsc_filters = new Array();
					ch_stageEsc_filters[0] = new nlobjSearchFilter('custrecord_ch_case', null, 'anyof', caseId);
					ch_stageEsc_filters[1] = new nlobjSearchFilter('custrecord_ch_is_open', null, 'is', 'T');
						// Case History Log Type of 3 = Stage Escalated
					ch_stageEsc_filters[2] = new nlobjSearchFilter('custrecord_ch_logtype', null, 'anyof', '3');
					var ch_stageEsc_columns = new Array();
					ch_stageEsc_columns[0] = new nlobjSearchColumn('id', null, null);
					ch_stageEsc_columns[1] = new nlobjSearchColumn('custrecord_ch_escalatees', null, null);
					ch_stageEsc_columns[2] = new nlobjSearchColumn('custrecord_ch_stage', null, null);			
					ch_stageEsc_columns[3] = new nlobjSearchColumn('custrecord_ch_begin_time', null, null);
					// Search Case History
					var ch_stageEsc_searchResults = nlapiSearchRecord('customrecord_case_history', null, ch_stageEsc_filters, ch_stageEsc_columns);
					if (ch_stageEsc_searchResults)
					{
						for (var x=0; ch_stageEsc_searchResults != null && x < ch_stageEsc_searchResults.length; x++ )
						{	// store Case History ID
							var active_ch_stageEsc_id = ch_stageEsc_searchResults[x].getValue('id');
							// Store Case History Escalatees in variable "active_ch_stageEsc_escalatees"
							var active_ch_stageEsc_escalatees = ch_stageEsc_searchResults[x].getValue('custrecord_ch_escalatees');
							// Store Case History BEGIN TIME in variable "active_ch_stageEsc_begin"			
							var active_ch_stageEsc_begin = ch_stageEsc_searchResults[x].getValue('custrecord_ch_begin_time');					
						}
						active_ch_stageESC_found = true;
					}		
				// END Search all Case History records for this case  find the open record for each of the TWO types of changes tracked
				// *********************************** ***********************************************
	
				// *********************************** ***********************************************
				// START THE LOGIC TO CLOSE AND/OR CREATE CASE HISTORY RECORDS ACCORDING TO EACH SITUATION	
	
				// 1) if Active Case History stageOpen records are found...
				if (active_ch_stageOpen_found == true && active_ch_stageESC_found == false)
				{	
					if (curr_stage == 'OPEN')
					{
						// If Current Assignee different than Active stageOpen CH Assignee
						if (curr_assignee != active_ch_stageOpen_assignee)
						{	// Close out the Active StageOpen Case History record (with old Assignee)
							close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);
							// Create new Active StageOpen CH record (with new Assignee)
							create_stageOpen(caseId, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
						}
						// Else - Do nothing (leave StageOpen CH record active)
					}
				}
				// 2) if active Case History StageEscalated records are found...
				else if (active_ch_stageESC_found == true && active_ch_stageOpen_found == false)
				{
					if (curr_stage == 'OPEN')
					{	// Close out the active Case History record
						close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
						// Create new active StageOpen CH record (with new Assignee)
						create_stageOpen(caseId, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
					}
				}
				// 3) If no active Stage OPEN CH record found and current stage is OPEN - Create new Open CH record
				else if (active_ch_stageOpen_found == false && curr_stage == 'OPEN')
				{	// Create stageOpen CH record
						//nlapiLogExecution('DEBUG','location', 'location 3');
					// THIS NEXT LINE IS IMPORTANT !!!!!!
					create_stageOpen(caseId, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
				}
	
				// F24082 Don't do this bit for GOBI EBA cases (unless they already have a YBP/OMG status set)
				if (case_form != LC_Form.GobiEBA || caseRecord.getFieldValue('custevent_ybp_waiting_on')||
						caseRecord.getFieldValue('custevent_ybp_omg_case_status'))
				{	
		            //re-open both 'ybp case status' (CS/EC/GOBI) AND 'OMG case status' when a new message re-opens a case
					var caseToEdit = nlapiLoadRecord('supportcase', caseId);
					caseToEdit.setFieldValue('custevent_ybp_waiting_on', YBPCaseStatus.ReOpened);
					caseToEdit.setFieldValue('custevent_ybp_omg_case_status', OMGCaseStatus.ReOpened);
					nlapiSubmitRecord(caseToEdit, false, true);
				}	
			}
			// US442796 Populated Case Last Modified By 
			var ctx = nlapiGetContext();
			if (ctx.getExecutionContext() != 'webservices')
			{
				// Retrieve User Id and if "unknown" i.e. -4 then set to dummy System User
				var userId = ctx.getUser();
				if (userId == LC_UnknownUser)
				{
					userId = LC_Employees.SystemUser;
				}	
				nlapiLogExecution('DEBUG', 'Before Update Case Last Modified By as User = ', userId);
				nlapiSubmitField('supportcase', caseId, 'custevent_case_last_modified_by', userId, true);
			}
		} // End Activity check
	} // End Delete
}


// BEGIN FUNCTIONS TO CREATE OR CLOSE OUT CASE HISTORY RECORDS
function create_stageOpen(caseId, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept)
{
	recordCreated = nlapiCreateRecord('customrecord_case_history');
	// Set fields in the Case History record
		// Set Case				
		recordCreated.setFieldValue('custrecord_ch_case', caseId);
		// set Log Type = Stage Open (2)
		recordCreated.setFieldValue('custrecord_ch_logtype', '2');
		// set Begin Time -- NEXT LINE BREAKS THE CODE IN CASE CAPTURE
		recordCreated.setFieldValue('custrecord_ch_begin_time', curr_Time);
		// set isOpen to True
		recordCreated.setFieldValue('custrecord_ch_is_open', 'T');
		// Set STAGE field
		recordCreated.setFieldValue('custrecord_ch_stage', curr_stage2);
		// Set Assignee
		recordCreated.setFieldValue('custrecord_ch_assignee', curr_assignee);
		// Set Assignee Dept Field
		recordCreated.setFieldValue('custrecord_ch_assign_dept', curr_assignee_dept);
	// Save record
	nlapiSubmitRecord(recordCreated);
}

function close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin)
{
	var ch_stageOpen = nlapiLoadRecord('customrecord_case_history', active_ch_stageOpen_id);
	// set End Time
	ch_stageOpen.setFieldValue('custrecord_ch_end_time', curr_Time);
	// set isOpen false
	ch_stageOpen.setFieldValue('custrecord_ch_is_open', 'F');
	// set Case History Hours - converting Date Time field from String to Date puts it into Milliseconds
	// Conversion to go from milliseconds to hours = 3600000
	var ch_hours = (nlapiStringToDate(curr_Time, 'datetimetz') - nlapiStringToDate(active_ch_stageOpen_begin, 'datetimetz'))/3600000;	
	// round to two-decimal places
	ch_hours = Math.round(ch_hours * 100)/100;
	ch_stageOpen.setFieldValue('custrecord_ch_hours', ch_hours);
	nlapiSubmitRecord(ch_stageOpen);
}


function close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin)
{
	var ch_stageEscalated = nlapiLoadRecord('customrecord_case_history', active_ch_stageEsc_id);
	// set End Time
	ch_stageEscalated.setFieldValue('custrecord_ch_end_time', curr_Time);
	// set isOpen false
	ch_stageEscalated.setFieldValue('custrecord_ch_is_open', 'F');
	// set Case History Hours - converting Date Time field from String to Date puts it into Milliseconds
	// Conversion to go from milliseconds to hours = 3600000 				
	var ch_hours = ( nlapiStringToDate(curr_Time, 'datetimetz') - nlapiStringToDate(active_ch_stageEsc_begin, 'datetimetz') )/3600000;	
	// round to two-decimal places
	ch_hours = Math.round(ch_hours * 100)/100;
	ch_stageEscalated.setFieldValue('custrecord_ch_hours', ch_hours);
	nlapiSubmitRecord(ch_stageEscalated);
}

