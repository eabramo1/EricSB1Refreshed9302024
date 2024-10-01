// Script:     UserEvent_case_after_submit.js
// 			   was called server_case_afterSubmit.js from 2014(original date unknown) through July 2016
// 			   script renamed to UserEvent_case_after_submit.js in July 2016
// Created by: Eric Abramo
//
// Functions:  serverCaseAfterSubmit:  the User Event function with two main purposes
//             1) Update connected Service Issues record if the Count of Cases connected to the SI changes - Case Count field
//             2) Create or Update Case History record (custom record) to record the time that a Case is Assigned to 
//                a particular user and is Open.  As of July 2016 only runs for YBP Profile Cases.  Four functions are called to do this:
//             * create_stageOpen
//             * create_stageEsc
//             * close_stageOpen
//             * close_stageEsc		
//
// Library Scripts Used:	library_utility.js
//							library_constants.js
//							library_script.js
//
// Revisions:  
//		EABRAMO	07/27/2016	
//                        1) Modification for Case History record creation and close - handle if user edits case
//                           for first time and closes
//                        2) Add clause to bypass Case History code on deletion of Case
//	                  3) slight changes due to getting xedit user event to trigger -
//								solution to pull Profile in advance of the first case history 'If' clause
//		EABRAMO 09/01/2016
//			  4) Release of support of Inline Editing on YBP Cases
//		EABRAMO 09/30/2016
//			  5) Add OMG Profile (18) into code that ran for just YBP Profile (17)
//
//		LWeyrauch	05/301/2017	Add LTS Profile (21) into code that ran for YBP, OMG & GOBI Profile 
//      CNeale  	06/14/2017 	US214281 YBP Multi-language profile changes
//		eabramo		12/03/2018	US408294 - TA279213 CRM to SF: Cases Integration solution
//		CNeale		12/03/2018	US430190 CXP Handle CXP Case change from CXP Customer to non-CXP Customer
//		CNeale		12/03/2018	US422410 CXP Handle CXP Case deletions
//		EAbramo		01/14/2019	US463522 EBSCO Connect - When existing case is not on merged case form, hide from EBSCO Connect - Automated Solution
//		PKelleher	11/11/2019  US559988: Remove JIRA checkbox from employee record and inactivate/delete as part of clean-up process, and all other related fields/coding re: JIRA (removing all code related to JIRA here)
//		CNeale		08/10/2020	US672384 EBSCO Connect - when case moves to DS Case Form remove SF ID & update to be deleted from SalesForce.
//		CNeale		11/3/2021	US824125 EBSCO Connect - write CXP SF to NS Notification record when case is hidden.
//                                                     - do not trigger sync to SF for hidden cases.
//		CNeale		12/06/2021	US868211 EBSCO Connect - reset SF Case Delete Status when "createNew" is being set
//                                                     - set for EC delete (not hide) cases moved to non-merged case form
//                                                     - do NOT clear SFID on cases set for EC delete (Cust change/form change) & set SF Delete Status
//		eAbramo		05/24/2023	US856610 CDP add Clinical Decisions Department criteria to CreateNew logic and logic on HideCase/CaseDeletion
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Global Variable - used to store IDs for relevant Case History record
var this_case = null;
var case_profile = null;
var active_ch_stageOpen_id = null;
var active_ch_stageOpen_begin = null;
var active_ch_stageEsc_id = null;
var active_ch_stageEsc_begin = null;

function serverCaseAfterSubmit(type)
{
	var currentRecord = nlapiGetRecordId();
	var curr_assignee = null;
	var curr_assignee_dept = null;

	// BEGIN CODE TO UPDATE SERVICE ISSUE RECORD
	if (type != 'create')
	{
		//Search Service Issue Records under this Case (using the Service Issue...Case field)
		var si_filters = new Array();
		si_filters[0] = new nlobjSearchFilter('custrecord_sicase', null, 'anyof', currentRecord);
		si_filters[1] = new nlobjSearchFilter('custrecord_sistatus', null, 'noneof', '7');
		var si_columns = new Array();
		si_columns[0] = new nlobjSearchColumn('id', null, null);
		// Search SIs // Service Issue is customrecord36
		var si_searchResults = nlapiSearchRecord('customrecord36', null, si_filters, si_columns);
		if (si_searchResults)
		{	// for each result of the SI Search
			for (var x=0; si_searchResults != null && x < si_searchResults.length; x++ )
			{	
				// get the Service Issue ID
				var si_id = si_searchResults[x].getValue('id');
				// Load the Service Issue object
				var si = nlapiLoadRecord('customrecord36', si_id);		
				// get current value of the 'Number of Linked Cases' field
				var cur_linkedCases = Number(si.getFieldValue('custrecord_count_linked_cases'));
				// get the actual value of linked cases - store in "cases_count" variable
				var cases = si.getFieldValues('custrecord_sicase');
				if (cases == "" || cases == null)
					{	// convert a null to a zero
						var cases_count = 0;
					}
					else
					{	// if Cases field isn't empty get length of Array for the actual count
						var cases_count = cases.length;
					}
				// if real count is different than current value
				if (cases_count != cur_linkedCases)
				{	// populate cases_count into the "number of Linked Cases" field
					si.setFieldValue('custrecord_count_linked_cases', cases_count);
					// Submit the record to commit changes
					nlapiSubmitRecord(si, false, true);
				}
			}	
		}
	}
	// END CODE TO UPDATE SERVICE ISSUE RECORD

	// *********************************** **********************************	
	// BEGIN CODE for CASE HISTORY RECORD management
	// *********************************** **********************************
	if (type != 'delete' && type != 'cancel')
	{
		// below two lines of code is critical to establish before the below "If" statement is run
		// 	      it is needed to handle xedit type - the record has to be loaded in order to fetch the profile of the Case
		this_case = nlapiLoadRecord('supportcase', currentRecord);
		case_profile = this_case.getFieldValue('profile');
		// nlapiLogExecution('DEBUG','case_profile', 'value is '+case_profile);

		// US214281 If YBP Multi-language Profile set to Main YBP Support Profile (17) and treat as such
			//	var ctx = nlapiGetContext();
	//	var ctxt = ctx.getExecutionContext();
	//	nlapiLogExecution('AUDIT','Context', 'value is '+ctxt);
	//	nlapiLogExecution('AUDIT','Profile B4', 'value is '+case_profile);
		if (ybpSupportMultiLangProfileCheck(case_profile))
		{
			this_case.setFieldValue('profile', '17');
			nlapiSubmitRecord(this_case, true, false);
			case_profile = '17'; 
		}
		// Run Code for YBP Profiles (17 and 18 and 20 and 21) (YBP Support, OMG, GOBI, LTS) Only
		if ((case_profile == '17' || case_profile == '18' || case_profile == '20' || case_profile == '21') && type != 'delete')
		{
			// BEGIN Get Current values in Case
			// Case ID already stored in variable currentRecord
			curr_assignee = this_case.getFieldValue('assigned');
			curr_assignee_dept = this_case.getFieldValue('custevent_assignee_department');
			var curr_stage = this_case.getFieldValue('stage');
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
			var curr_escalatees = new Array();
				// Load current escalatees into the array		
				var escalateeCount = this_case.getLineItemCount('escalateto');
				if (escalateeCount > 0)
				{
					for (var a = 1; a <= escalateeCount; a++)
					{
						var this_escalatee = this_case.getLineItemValue('escalateto', 'escalatee', a);
						// next few lines of code loads a value into the Current Escalatee Department field
						if (a == 1)
						{	
							var curr_escalatee_dept = nlapiLookupField('employee',this_escalatee, 'department', false);				
						}
						curr_escalatees.push(this_escalatee);
					}
				}
				else
				{
					curr_escalatees = null;
				}	
			var curr_Time1 = null;	
			// Need to build search to see if other Case History Records Exist for this case (what Date/Time to use)
				var ch_check_filters = new Array();
				ch_check_filters[0] = new nlobjSearchFilter('custrecord_ch_case', null, 'is', currentRecord);
				var ch_check_columns = new Array();
				ch_check_columns[0] = new nlobjSearchColumn('internalid', null, null);
				// run my search
				ch_check_searchResults = nlapiSearchRecord('customrecord_case_history', null, ch_check_filters, ch_check_columns);
				// If there ARE no Case History records
				if (ch_check_searchResults == null)
				{	// Use the Created Date of the Case
					curr_Time1 = this_case.getFieldValue('createddate');
				}
				else
				{	// Otherwise Use the Last Modified Date	
					curr_Time1 = this_case.getFieldValue('lastmodifieddate');
				}
				var curr_Time = nlapiStringToDate(curr_Time1, 'datetimetz');
				curr_Time = nlapiDateToString(curr_Time, 'datetimetz');
			// END Get Current values in Case
			// *********************************** **********************************

			// *********************************** **********************************		
			// BEGIN Search all Case History records for this case  find the open record for each of the TWO types of changes tracked
			var active_ch_stageOpen_found = false;
			var active_ch_stageESC_found = false;

			// Search for existing StageOpen Case History records
				var ch_stageOpen_filters = new Array();
				ch_stageOpen_filters[0] = new nlobjSearchFilter('custrecord_ch_case', null, 'anyof', currentRecord);
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
					{	// store Case History ID in GLOBAL variable
						active_ch_stageOpen_id = ch_stageOpen_searchResults[x].getValue('id');										
						// Store Case History Assignee in variable "active_ch_stageOpen_assignee"
						var active_ch_stageOpen_assignee = ch_stageOpen_searchResults[x].getValue('custrecord_ch_assignee');
						// Store Case History BEGIN TIME in GLOBAL variable "active_ch_stageOpen_begin"
						active_ch_stageOpen_begin = ch_stageOpen_searchResults[x].getValue('custrecord_ch_begin_time');
					}
					active_ch_stageOpen_found = true;
				}

			// Search for existing StageEscalated Case History records
				var ch_stageEsc_filters = new Array();
				ch_stageEsc_filters[0] = new nlobjSearchFilter('custrecord_ch_case', null, 'anyof', currentRecord);
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
						active_ch_stageEsc_id = ch_stageEsc_searchResults[x].getValue('id');
						// Store Case History Escalatees in variable "active_ch_stageEsc_escalatees"
						var active_ch_stageEsc_escalatees = ch_stageEsc_searchResults[x].getValue('custrecord_ch_escalatees');
						// Store Case History BEGIN TIME in variable "active_ch_stageEsc_begin"			
						active_ch_stageEsc_begin = ch_stageEsc_searchResults[x].getValue('custrecord_ch_begin_time');					
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
				if (curr_stage == 'CLOSED')
				{	// Close out the Active StageOpen Case History record
					close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);				
				}
				else if (curr_stage == 'ESCALATED')
				{	// Close out the Active StageOpen Case History record
					close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);
					// Create a new stage Escalated Case History record
					create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept)
				}
				else if (curr_stage == 'OPEN')
				{
					// If Current Assignee different than Active stageOpen CH Assignee
					if (curr_assignee != active_ch_stageOpen_assignee)
					{	// Close out the Active StageOpen Case History record (with old Assignee)
						close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);
						// Create new Active StageOpen CH record (with new Assignee)
						create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
					}
					// Else - Do nothing (leave StageOpen CH record active)
				}
			}
			// 2) if active Case History StageEscalated records are found...
			else if (active_ch_stageESC_found == true && active_ch_stageOpen_found == false)
			{
				if (curr_stage == 'CLOSED')
				{	// Close out the active Escalation Case History record
					close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
				}
				else if (curr_stage == 'OPEN')
				{	// Close out the active Case History record
					close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
					// Create new active StageOpen CH record (with new Assignee)
					create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);	
				}
				else if (curr_stage == 'ESCALATED')
				{
					if (curr_escalatees != active_ch_stageEsc_escalatees)
					{	// Close out the active Escalation Case History record
						close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
						// Create a new stage Escalated Case History record
						create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept)
					}
					// Else - Do nothing (leave Stage Escalated CH record active)
				}		
			}
			// 3) If no active Stage OPEN CH record found and current stage is OPEN - Create new Open CH record
			else if (active_ch_stageOpen_found == false && curr_stage == 'OPEN')
			{	// Create stageOpen CH record
				create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
			}
			// 4) If no active Stage OPEN CH record found and current stage is Closed (user closed case on first edit) - Create new complete CH record
			else if (active_ch_stageOpen_found == false && curr_stage == 'CLOSED')
			{	// Create stageOpen CH record
				create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
				// But also close out the Case History record use Global Variables
				close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);	
			}		
			// 5) If no active Stage ESCALATED CH record found and current stage is ESCALATED - Create new ESCALATED CH record
			else if (active_ch_stageESC_found == false && curr_stage == 'ESCALATED')
			{	// Create stageESC CH record
				create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept)
			}
			// 6) If no active Stage OPEN CH record found and current stage is Closed (user closed case on first edit) - Create new complete CH record
			else if (active_ch_stageEsc_found == false && curr_stage == 'CLOSED')
			{	// Create stageEsc CH record
				create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept)
				// But also close out the Case History record use Global Variables
				close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
			}			
			// 7) Handle the ERROR of there being TWO active Case History records - one for StageOpen and one for StageEscalated 
			else if (active_ch_stageOpen_found == true && active_ch_stageESC_found == true)
			{
				if (curr_stage == 'CLOSED')
				{	// Close out Case History records
					close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);
					close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
				}
				else if (curr_stage == 'OPEN')
				{	// Close out the active StageEscalation Case History record
					close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
					// If Current Assignee different than Active stageOpen CH Assignee
					if (curr_assignee != active_ch_stageOpen_assignee)
					{	// Close out the Active StageOpen Case History record (with old Assignee)
						close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);
						// Create new Active StageOpen CH record (with new Assignee)
						create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept);
					}
					// Else - Do nothing (leave StageOpen CH record active)
				}
				else if (curr_stage == 'ESCALATED')
				{	// Close out the Active StageOpen Case History record
					close_stageOpen(active_ch_stageOpen_id, curr_Time, active_ch_stageOpen_begin);		
					if (curr_escalatees != active_ch_stageEsc_escalatees)
					{	// Close out the active Escalation Case History record
						close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin);
						// Create a new stage Escalated Case History record
						create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept);
					}
					// Else - Do nothing (leave Stage Escalated CH record active)
				}	
			}
		}	// End Qualify as Profile 17, 18 (YBP Support, OMG)
	}	// End qualify as Not Type Delete and Not Type Cancel
	// *********************************** **********************************	
	// END CODE for CASE HISTORY RECORD management
	// *********************************** **********************************	
	
	
	// BEGIN CODE FOR US408294 - TA279213 CRM to SF: Cases Integration solution
	/*	Inspect Case:
		    If the Case Customer DOES have a SalesForce Account ID and it is not createNew
		    and If the case doesn't have a SalesForce Case ID
		    and if the Case Assignee belongs to a Department that qualifies ad GCS (Global Customer Support)
		Then - populate the SalesForce Case ID with the value 'createNew'
	*/
	if (type != 'delete' && type != 'cancel')
	{
		if (!this_case)
		{
			this_case = nlapiLoadRecord('supportcase', currentRecord);
		}
		// nlapiLogExecution('DEBUG', 'log 1a', 'Begin CXP Code for Case: '+currentRecord);
		// Retrieve Case & Customer SFId's from current record
		var customer_sf_id = this_case.getFieldValue('custevent_sf_sourced_account_id');
		var sf_id = this_case.getFieldValue('custevent_sf_case_id');  // US430190
		var case_hide = this_case.getFieldValue('custevent_hide_case_cxp'); // US824125
		var case_sfdelsts = this_case.getFieldValue('custevent_sf_case_del_sts'); //US868211
		var cdp_case = this_case.getFieldValue('custevent_clinical_decisions_case'); //US856610

		// If Case in SF and Case hide has been set then write CXP notification record   US824125
		if (case_hide == 'T' && sf_id)
		{
			var old_case = nlapiGetOldRecord();
			if (old_case.getFieldValue('custevent_hide_case_cxp') == 'F'){
				/* Call Library function L_createRec_CXPNSSFNotify to create report record with parameters:-
				 * Type (1 = Case),Case SalesForce Id (sf_id), Record Id (currentRecord), Case Id (currentRecord)
				 * Current Customer Id, Previous Customer Id, Case Number, Case Subject, Action Type (6 = Hide Case) */
				L_createRec_CXPNSSFNotify('1', sf_id, currentRecord, currentRecord, this_case.getFieldValue('company'), old_case.getFieldValue('company'),this_case.getFieldValue('casenumber'),
					this_case.getFieldValue('title'), '6');
			}
		}
		
		// nlapiLogExecution('DEBUG', 'log 1b', 'customer_sf_id is: '+customer_sf_id);
		// If has Customer SF ID and it isn't createNew
		if (customer_sf_id && customer_sf_id != LC_SF_createNew)
		{		
			// US463522 EBSCO Connect - When existing case is not on merged case form, hide from EBSCO Connect - Automated Solution
			var customForm = this_case.getFieldValue('customform');
			// nlapiLogExecution('DEBUG', 'Log 01 for US463522', 'customForm is '+customForm);
			// If No Customer form - or CustomForm is CustSatMerged or Web Services Case form
			// US856610 CDP: NS-05 - Case Scripting -- add Clinical Decisions to criteria below
			if (!customForm || customForm == LC_Form.CustSatMerged || customForm == LC_Form.WebServicesCase || customForm == LC_Form.clinicalDecCase)
			{
				// If Case SF ID doesn't exist
				if (!sf_id)
				{
					// nlapiLogExecution('DEBUG', 'log 3', 'No Case SF_ID');
					// US824125 - Do not push hidden cases
					// Make sure email isn't ebsco email
					var case_email = this_case.getFieldValue('email');
					// call Library function: does email contain ebsco domain -- returns true or false
					if ((!case_email || L_isEBSCOemail(case_email)==false) && case_hide != 'T') 
					{
						// nlapiLogExecution('DEBUG', 'log 3a', 'case_email is '+case_email);
						var assignee = this_case.getFieldValue('assigned');
						// nlapiLogExecution('DEBUG', 'log 3b', 'assignee is '+assignee);
						if (assignee)
						{
							// nlapiLogExecution('DEBUG', 'log 4', 'Has Case Assignee');
							var assDept = nlapiLookupField('employee', assignee, 'department', null);					
							// US856610 CDP: NS-05 - Case Scripting -- add Clinical Decisions Department to criteria below
							if (LC_Departments.IsDeptDDEGlobalCustSat(assDept) || assDept == LC_Departments.ClinicalDecSupport)
							{
								nlapiLogExecution('DEBUG', 'Log 02 for US463522', 'Setting SF ID to createNew');
								// US868211 If Case has SF Case Delete Status = Complete then also reset to None
								var afields = new Array();
								afields[0] = 'custevent_sf_case_id';
								var avalues = new Array();
								avalues[0] = LC_SF_createNew;
								if (case_sfdelsts == LC_SfCaseDelSts.complete){
									avalues[1] = LC_SfCaseDelSts.none;
									afields[1] = 'custevent_sf_case_del_sts';
								}
								nlapiSubmitField('supportcase', currentRecord, afields, avalues);
							}					
						}					
					}		
				}				
			}
			
			// US463522 EBSCO Connect - When existing case is not on merged case form, hide from EBSCO Connect - Automated Solution	
			// US672384 When case is on DS Case Form remove SFID & log case to be deleted from SalesForce
			// US868211 EC - Now log case to be deleted when not on merged case form (or Web Services form), retain SFID & update SFDelSts 
            // US856610 CDP: NS-05 - Case Scripting -- add Clinical Decisions Case form to 'if' criteria below so that CDP cases aren't considered for deletion
			var ctx = nlapiGetContext().getExecutionContext();
			// nlapiLogExecution('DEBUG', 'Log Execution for US463522', 'ctx is '+ctx);
			// If Context is user Interface and the Custom Form is not CustSatMerged and NOT Web Services
			if (ctx == 'userinterface' && customForm != LC_Form.CustSatMerged && customForm != LC_Form.WebServicesCase && customForm != LC_Form.clinicalDecCase && case_sfdelsts != LC_SfCaseDelSts.inProg && sf_id && case_hide != 'T')
			{
					/* Call Library function L_createRec_CXPNSSFNotify to create report record with parameters:-
					 * Type (1 = Case), 
					 * Case SalesForce Id (sf_id)
					 * Record Id (currentRecord)
					 * Case Id (currentRecord)
					 * Current Customer Id 
					 * Previous Customer Id 
					 * Case Number 
					 * Case Subject  
					 * Action Type (5 = move to DS Case Form) */
					var old_case = nlapiGetOldRecord();
					L_createRec_CXPNSSFNotify('1', sf_id, currentRecord, currentRecord, this_case.getFieldValue('company'), old_case.getFieldValue('company'),this_case.getFieldValue('casenumber'),
							this_case.getFieldValue('title'), '5');
					
					// Update SF Delete Status
					nlapiSubmitField('supportcase', currentRecord, 'custevent_sf_case_del_sts', LC_SfCaseDelSts.inProg);
			}		
		}
			
		
		/* US430190 CXP Case moved to non-CXP Customer also handled here
		 * 		- No xedit considerations required as Customer cannot be changed via xedit
		 *      - If Case has SFID and Customer changed from CXP to non-CXP (or createNEw) then remove Case SFID &
		 *        add record to CXP NS to SF Notifications CR 
		 */
		// US868211 No longer clear SFID, but set SF Delete Status to In Progress  
		// Check to see if Case has a SF ID & Customer doesn't or Customer SF ID is createNew
		if (sf_id && (!customer_sf_id || customer_sf_id == LC_SF_createNew) && case_sfdelsts != LC_SfCaseDelSts.inProg && case_hide != 'T')
		{
			// This is a situation we want to report on if it's just happened....
			var old_case = nlapiGetOldRecord();
			var old_cust_sf_id = old_case.getFieldValue('custevent_sf_sourced_account_id');
			
			if (old_cust_sf_id != customer_sf_id)
			// Only want to report on this once!
			{
				
				// Now create the Report Record....
				if(!customer_sf_id)
				{   // Report (2 = move)
					var act = 2;
				}
				else 
				{   // Report (3 = createNew)
					var act = 3;
				}

				/* Call Library function L_createRec_CXPNSSFNotify to create report record with parameters:-
				 * Type (1 = Case), 
				 * Case SalesForce Id (sf_id)
				 * Record Id (currentRecord)
				 * Case Id (currentRecord)
				 * Current Customer Id 
				 * Previous Customer Id 
				 * Case Number 
				 * Case Subject  
				 * Action Type  */
				L_createRec_CXPNSSFNotify('1', sf_id, currentRecord, currentRecord, this_case.getFieldValue('company'), old_case.getFieldValue('company'),this_case.getFieldValue('casenumber'),
						this_case.getFieldValue('title'), act);
				
				// US868211 Update SF Delete Status
				nlapiSubmitField('supportcase', currentRecord, 'custevent_sf_case_del_sts', LC_SfCaseDelSts.inProg);
				
			}	
		} // End US430190 CXP Case moved to non-CXP Customer
	}
	// END CODE FOR US408294 - TA279213 CRM to SF: Cases Integration solution
	
	// US422410 CXP Case Deleted - record details of deleted SF Id case for action in SF
	if (type == 'delete')
	{
		var old_case = nlapiGetOldRecord();
		if (old_case.getFieldValue('custevent_sf_case_id') && old_case.getFieldValue('custevent_hide_case_cxp') != 'T')
		{	// Case had a SF Id
			// Call Library function to create report record (type = 1 case, Case SF Id, NS internal ID, no Case Id, no current Customer Id, 
			//                                                Prev Customer Id, Case no, Case Subj, Action = 1 Deleted Case) 
			L_createRec_CXPNSSFNotify('1', old_case.getFieldValue('custevent_sf_case_id'), currentRecord, '', '', old_case.getFieldValue('company'),old_case.getFieldValue('casenumber'),
					old_case.getFieldValue('title'), '1');
		}
	}
}



// BEGIN FUNCTIONS TO CREATE OR CLOSE OUT CASE HISTORY RECORDS
function create_stageOpen(currentRecord, curr_Time, curr_stage2, curr_assignee, curr_assignee_dept)
{
	recordCreated = nlapiCreateRecord('customrecord_case_history');
	// Set fields in the Case History record
		// Set Case				
		recordCreated.setFieldValue('custrecord_ch_case', currentRecord);
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
	nlapiSubmitRecord(recordCreated);
		
	// set the Active CH Stage values (global variables) 
	// Needed if the current case is set to "Closed" - as the Case History record needs to be closed out as well
	active_ch_stageOpen_id = recordCreated.getId();
	active_ch_stageOpen_assignee = curr_assignee;
	active_ch_stageOpen_begin = curr_Time;	
}


function create_stageEsc(currentRecord, curr_Time, curr_stage2, curr_escalatees, curr_escalatee_dept, curr_assignee, curr_assignee_dept)
{
	recordCreated = nlapiCreateRecord('customrecord_case_history');
		// Set Case
		recordCreated.setFieldValue('custrecord_ch_case', currentRecord);
		// set Log Type = ESCALATEES (3)
		recordCreated.setFieldValue('custrecord_ch_logtype', '3');
		// set Begin Time -- NEXT LINE BREAKS THE CODE IN CASE CAPTURE
		recordCreated.setFieldValue('custrecord_ch_begin_time', curr_Time);
		// set isOpen to True
		recordCreated.setFieldValue('custrecord_ch_is_open', 'T');
		// Set STAGE field
		recordCreated.setFieldValue('custrecord_ch_stage', curr_stage2);				
		// Set Escalatees
		recordCreated.setFieldValues('custrecord_ch_escalatees', curr_escalatees);
		// Set Escalatee Department
		recordCreated.setFieldValue('custrecord_ch_escal_dept', curr_escalatee_dept);
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
	ch_stageOpen.setFieldValue('custrecord_ch_end_time', curr_Time)
	// set isOpen false
	ch_stageOpen.setFieldValue('custrecord_ch_is_open', 'F');
	// set Case History Hours - converting Date Time field from String to Date puts it into Milliseconds
	// Conversion to Hours -  go from milliseconds to hours = 3600000 				
	var ch_hours = (nlapiStringToDate(curr_Time, 'datetimetz') - nlapiStringToDate(active_ch_stageOpen_begin, 'datetimetz'))/3600000;
	// convert to days
	var ch_days = ch_hours/24;	
	// round to two-decimal places
	ch_hours = Math.round(ch_hours * 100)/100;
	ch_days = Math.round(ch_days * 1000)/1000;	
	ch_stageOpen.setFieldValue('custrecord_ch_hours', ch_hours);
	ch_stageOpen.setFieldValue('custrecord_ch_days', ch_days);
	nlapiSubmitRecord(ch_stageOpen);
}


function close_stageEsc(active_ch_stageEsc_id, curr_Time, active_ch_stageEsc_begin)
{
	var ch_stageEscalated = nlapiLoadRecord('customrecord_case_history', active_ch_stageEsc_id);
	// set End Time
	ch_stageEscalated.setFieldValue('custrecord_ch_end_time', curr_Time)
	// set isOpen false
	ch_stageEscalated.setFieldValue('custrecord_ch_is_open', 'F');
	// set Case History Hours - converting Date Time field from String to Date puts it into Milliseconds
	// Conversion to go from milliseconds to hours = 3600000 				
	var ch_hours = ( nlapiStringToDate(curr_Time, 'datetimetz') - nlapiStringToDate(active_ch_stageEsc_begin, 'datetimetz') )/3600000;
	// convert to days
	var ch_days = ch_hours/24;
	// round to two-decimal places
	ch_hours = Math.round(ch_hours * 100)/100;
	ch_days = Math.round(ch_days * 1000)/1000;
	ch_stageEscalated.setFieldValue('custrecord_ch_hours', ch_hours);
	ch_stageEscalated.setFieldValue('custrecord_ch_days', ch_days);
	nlapiSubmitRecord(ch_stageEscalated);	
}