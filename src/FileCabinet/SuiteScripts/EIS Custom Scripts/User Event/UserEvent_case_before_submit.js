// Script:     userEvent_case_before_submit.js
//
// Created by: EBSCO Information Services  08-03-2016 (E ABRAMO)
//
// Functions:  server_case_beforeSubmit - triggers updates to specific "related" fields for inline editing
//		if YBP Case Status changes - change the real NetCRM Status		
//	        if NetCRM Case Status changes - change the YBP Case Status
//              if Assignee changes - check assignee department and if certain conditions exist change the YBP Case Status
//
//	Library Scripts Used:
// 	library_constants.js -- Library Script used to reference constant values
//  library_script.js -- multilanguage profile check
//
// Revisions:  
//		2016-09-01 Deployed to Production
//		2016-11-10 US177534 Add code to accommodate EIS User Services (cneale) 
//	CN	2017-06-14	US214281 Include consideration of YBP multi-language profiles//	
//	CN	2018-06-21	F24082 Handle unsetting GOBI EBA Case indicator for UI edits & add new deployment 
//	EA	2018-12-03	US408294 - TA284427 automate trigger to Send to SF on Direct List Editing
//	JO	2019-02-04 	US442795 - Set 'Case Last Modified By' to User making change
//	EA	2023-05-24	US856610 CDP: NS-05 - Case Scripting -- Clinical Decisions Portal logic - for createNew code
//	KM	2023-06-21	US1099670 Regression Test Fixes
//						TA826282 - CDP case reassigned to GCS Support via direct list editing should uncheck CD Case box and vice versa
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function server_case_beforeSubmit(type)
{
	var ctx = nlapiGetContext();
	var userId = ctx.getUser();

	nlapiLogExecution('DEBUG', 'UserIdIs', 'value is '+userId);
	nlapiLogExecution('DEBUG', 'type', type);
	if(ctx.getExecutionContext() != 'webservices')
	{	
		var oldRecord = nlapiGetOldRecord();
		var newRecord = nlapiGetNewRecord();
		if (type == 'xedit')
		{	
			var currentRecord = nlapiGetRecordId();
			// below two lines of code is critical to establish before the below "If" statement is run
			// 	      it is needed to handle xedit type - the record has to be loaded in order to fetch the profile of the Case
			this_case = nlapiLoadRecord('supportcase', currentRecord);
			case_profile = this_case.getFieldValue('profile');
			// only run for YBP Profile Cases 
			// US214281: Include multi-language profiles
			if (type == 'xedit' && (case_profile == '17' || ybpSupportMultiLangProfileCheck(case_profile)))
			{
				var oldYBPStatus = oldRecord.getFieldValue('custevent_ybp_waiting_on');
				var newYBPStatus = newRecord.getFieldValue('custevent_ybp_waiting_on');
				
				var oldStatus = oldRecord.getFieldValue('status');
				var newStatus = newRecord.getFieldValue('status');
				
				var oldAssignTo = oldRecord.getFieldValue('assigned');
				var newAssignTo = newRecord.getFieldValue('assigned');
				
				var newProfile = newRecord.getFieldValue('profile'); //(US214281)
				/*
					// Status values
					1	Not Started 
					2	In Progress 
					9	To Review 
					3	Escalated 
					6	Awaiting Reply 
					8	On Hold 
					4	Re-Opened 
					5	Closed 
					7	Closed - Duplicate / No Action
		
					// YBP Case STatus values
					1	Waiting on Internal Info
					2	Waiting on Customer
					3	Waiting on Vendor
					4	Sent to eContent
					5	Returned to Customer Service
					6	eContent In Progress
					7	Customer Service In Progress
					8	Closed
					9	Re-Opened
					v	Closed - Duplicate / No Action
				*/
				// nlapiLogExecution('DEBUG','oldYBPStatus', 'value is '+oldYBPStatus);
				// nlapiLogExecution('DEBUG','newYBPStatus', 'value is '+newYBPStatus);
				// nlapiLogExecution('DEBUG','oldStatus', 'value is '+oldStatus);
				// nlapiLogExecution('DEBUG','newStatus', 'value is '+newStatus);
				// nlapiLogExecution('DEBUG','oldAssignTo', 'value is '+oldAssignTo);
				// nlapiLogExecution('DEBUG','newAssignTo', 'value is '+newAssignTo);
				
				// YBP CASE STATUS change **************************************
				if (oldYBPStatus != newYBPStatus && newYBPStatus != null)
				{
					// ybp case status field - changed to "Closed"
					if (oldYBPStatus != '8' && newYBPStatus == '8')
					{
						// nlapiLogExecution('DEBUG','Location', 'oldYBPStatus != 8 and newYBPStatus == 8');
						newRecord.setFieldValue('status', '5');
					}
					// ybp case status field - changed to "Closed - Duplicate / No Action"
					if (oldYBPStatus != '10' && newYBPStatus == '10')
					{
						// nlapiLogExecution('DEBUG','Location', 'oldYBPStatus != 10 and newYBPStatus == 10');
						newRecord.setFieldValue('status', '7');
					}
					// ybp case status changed from Closed to Open
					if ((oldYBPStatus == '8' || oldYBPStatus  == '10' || oldYBPStatus == null || oldYBPStatus == '') && newYBPStatus != '8' && newYBPStatus != '10')
					{
						// new Status set to 'Re-opened' (9)
						if (newYBPStatus == '9')
						{ 
							newRecord.setFieldValue('status', '4');
						}
						else
						{
							newRecord.setFieldValue('status', '2');
						}
					}
				}
				// NetCRM 'real' STATUS change **************************************
				if (oldStatus != newStatus && newStatus != null)
				{
					// if real status changed to "Closed"
					if (oldStatus != '5' && newStatus == '5')
					{
						newRecord.setFieldValue('custevent_ybp_waiting_on', '8');
					}
					// if real status changed to "Closed - Duplicate no Action"
					if (oldStatus != '7' && newStatus == '7')
					{
						newRecord.setFieldValue('custevent_ybp_waiting_on', '10');
					}
					// if real status changed to "Re-Opened"
					if (oldStatus != '4' && newStatus == '4')
					{
						newRecord.setFieldValue('custevent_ybp_waiting_on', '9');
					}			
					// if real status changed from Closed to Open
					if ((oldStatus == '5' || oldStatus  == '7') && newStatus != '5' && newStatus != '7')
					{	// Just set it to Returned to Customer Service as a default
						newRecord.setFieldValue('custevent_ybp_waiting_on', '5');
					}
				}
				// Assignee Change *****************************************************
				if (oldAssignTo != newAssignTo && newAssignTo != null && oldAssignTo != null)
				{
					// YBP Departments that matter
						// Customer Service - YBP = 97
						// eContent - YBP = 96
					var old_assignee_department = nlapiLookupField('employee', oldAssignTo, 'department');
					var new_assignee_department = nlapiLookupField('employee', newAssignTo, 'department');
					// nlapiLogExecution('DEBUG', 'old_assignee_department', 'old_assignee_department is '+old_assignee_department);
					// nlapiLogExecution('DEBUG', 'new_assignee_department', 'new_assignee_department is '+new_assignee_department);
					// If Assignee Department goes from CS to EC
					if (old_assignee_department == '97' && new_assignee_department == '96')
					{	// set YBP Case Status to 'Sent To eContent' (4) if currently isn't set to 'Sent To eContent' (4) or 'eContent in Process' (6)
						var this_case_YBPStatus = this_case.getFieldValue('custevent_ybp_waiting_on');							
						// nlapiLogExecution('DEBUG', 'this_case_YBPStatus', 'this_case_YBPStatus is '+this_case_YBPStatus);
						if (this_case_YBPStatus != '4' && this_case_YBPStatus != '6')
						{			
							newRecord.setFieldValue('custevent_ybp_waiting_on', '4');					
						}
						// set CS User field to the old Assignee - if it isn't yet populated
						var this_case_cs_user = this_case.getFieldValue('custevent_ybp_cs_user');
						// nlapiLogExecution('DEBUG', 'this_case_cs_user', 'this_case_cs_user is '+this_case_cs_user);
						if (this_case_cs_user == '' || this_case_cs_user == null)
				        {
				        	newRecord.setFieldValue('custevent_ybp_cs_user', oldAssignTo);
						}
				        // set YBP Case Classification field - if it isn't populated
						var this_case_classification = this_case.getFieldValue('custevent_ybp_case_classification')
						// nlapiLogExecution('DEBUG', 'this_case_classification', 'this_case_classification is '+this_case_classification);
						if (this_case_classification == '' || this_case_classification == null || this_case_classification == '1')
				        {
				        	newRecord.setFieldValue('custevent_ybp_case_classification', '2');
				        }
						// if the real NS status is 'Not Started' (1) move it to 'In Progress' (2)
						var this_case_ns_status = this_case.getFieldValue('status');
						if (this_case_ns_status == '1')
						{
							newRecord.setFieldValue('status', '2');
						}			
					}
					// If Assignee Department goes from CS to EC 			
					if (old_assignee_department == '96' && new_assignee_department == '97')
					{	// set YBP Case Status to 'Returned to Customer Service' (5) if currently isn't set to 'Returned to Customer Service' (5) or 'Customer Service In Progress' (7)
						var this_case_YBPStatus = this_case.getFieldValue('custevent_ybp_waiting_on');
						if (this_case_YBPStatus != '5' && this_case_YBPStatus != '7')
						{
							newRecord.setFieldValue('custevent_ybp_waiting_on', '5');
						}
						// if the real NS status is 'Not Started' (1) move it to 'In Progress' (2)
						var this_case_ns_status = this_case.getFieldValue('status');
						if (this_case_ns_status == '1')
						{
							newRecord.setFieldValue('status', '2');
						}				
					}
				} // **************End Assignee Change ***************************	
				// US214281 If Multi-language Profile then set to standard "YBP Support" Profile (ID = 17)
				if (ybpSupportMultiLangProfileCheck(newProfile))
				{
					newRecord.setFieldValue('profile', '17');
				}
				
			}  // **************End Type Xedit and Profile = 17 ***************************	
		
			//  US177534: XEdit and EIS User Services Case Profile (= 19)
			if (type == 'xedit' && (case_profile == '19'))
			{
				// Set Profile to 'EBSCO Information Services (DDE Support)' (= 1)
				var newRec = nlapiGetNewRecord();
				newRec.setFieldValue('profile', '1');
			}
		
			// BEGIN US408294 - TA279213 CRM to SF: Cases Integration solution
			// A Case is edited via Direct List Editing/Inline Editing - and changes the Assignee -- trigger update to send to SalesForce
				nlapiLogExecution('DEBUG', 'log 1', 'Begin CXP Code for Case: '+currentRecord);
				var sf_id = oldRecord.getFieldValue('custevent_sf_case_id');
				if (!sf_id)
				{
					//nlapiLogExecution('DEBUG', 'log 2', 'No sf_id.  sf_id is '+sf_id);
					// ***********************************************
					// User triggers event by updating AssignTo field
					var assignee1 = newRecord.getFieldValue('assigned');
					if (assignee1)
					{
						//nlapiLogExecution('DEBUG', 'log 3', 'Triggered Assignee and has Assignee.  assignee1 is '+assignee1);
						// Go to oldRecord to get the email - ensure it doesn't contain EBSCO calling library utility function -- cannot get it via newRecord
						var case_email1 = oldRecord.getFieldValue('email');
							// nlapiLogExecution('DEBUG', 'log 4a', 'case_email1 is '+case_email1);
						if (!case_email1 || L_isEBSCOemail(case_email1)==false)
						{
							// nlapiLogExecution('DEBUG', 'log 4b', 'Case Email is empty or doesnt contain ebsco.  case_email1 is '+case_email1);
							// go to oldRecord to get the customer and then lookup if it has a SF ID -- cannot get it via newRecord
							var existing_customer = oldRecord.getFieldValue('company');
							var customer_sf_id = nlapiLookupField('customer', existing_customer, 'custentity_sf_account_id');
							if (customer_sf_id && customer_sf_id != LC_SF_createNew)
							{
								//nlapiLogExecution('DEBUG', 'log 5', 'Customer SF ID is valid');
								// Need to lookup Assignee Department
								var assDept = nlapiLookupField('employee', assignee1, 'department', null);					
								// US856610 CDP: NS-05 - Case Scripting -- added EBSCO Health Department (clinical Decisions) to below logic
								if (LC_Departments.IsDeptDDEGlobalCustSat(assDept) || assDept == LC_Departments.ClinicalDecSupport)
								{
									//nlapiLogExecution('DEBUG', 'log 6', 'Case Assignee Dept is GCS');
									newRecord.setFieldValue('custevent_sf_case_id', LC_SF_createNew)
								}	
							}						
						}
					}
					// ***********************************************
					// User triggers event by updating Email field
					var case_email2 = newRecord.getFieldValue('email');
					// Note: case_email2 returns Null if Xedit was not due to the email field
					// But Xedit code must still account for setting email something or setting it to blank
					if (case_email2 || case_email2 == '')
					{
					 	//nlapiLogExecution('DEBUG', 'log 7', 'Triggered Email - and has Email.  email is '+case_email2);
					 	if (L_isEBSCOemail(case_email2)==false)
					 	{
						 	//nlapiLogExecution('DEBUG', 'log 8', 'Case Email doesnt contain ebsco');			 	
							// go to oldRecord to get the customer and then lookup if it has a SF ID -- cannot get it via newRecord
							var existing_customer = oldRecord.getFieldValue('company');
							var customer_sf_id = nlapiLookupField('customer', existing_customer, 'custentity_sf_account_id');
							if (customer_sf_id && customer_sf_id != LC_SF_createNew)
							{
								//nlapiLogExecution('DEBUG', 'log 9', 'Customer SF ID is valid');						 	
							 	var assignee2 =  oldRecord.getFieldValue('assigned');
							 	if (assignee2)
							 	{
									//nlapiLogExecution('DEBUG', 'log 10', 'Has Assignee and assignee2 is '+assignee2);	
									var assDept = nlapiLookupField('employee', assignee2, 'department', null);					
									// US856610 CDP: NS-05 - Case Scripting -- added EBSCO Health Department (clinical Decisions) to below logic
									if (LC_Departments.IsDeptDDEGlobalCustSat(assDept) || assDept == LC_Departments.ClinicalDecSupport)
									{
										//nlapiLogExecution('DEBUG', 'log 11', 'Case Assignee Dept is GCS');
										newRecord.setFieldValue('custevent_sf_case_id', LC_SF_createNew)
									}								
								}							
							}		 	
					 	}
					}
				} // END US408294 - TA279213 CRM to SF: Cases Integration solution

			//US1099670 - TA826282 - CDP case reassigned to GCS Support via direct list editing should uncheck CD Case box and vice versa
			var old_cdp_case = oldRecord.getFieldValue('custevent_clinical_decisions_case');
			var old_assignee = oldRecord.getFieldValue('assigned');
			var new_assignee = newRecord.getFieldValue('assigned');
			var new_assignee_dept = null;
			nlapiLogExecution('DEBUG', 'new_assignee', new_assignee);
			nlapiLogExecution('DEBUG', 'old_assignee', old_assignee);
			if (old_assignee != new_assignee && new_assignee != null)
			{
				//Assignee has been changed via direct list editing, so look up new assignees department
				new_assignee_dept = nlapiLookupField('employee', new_assignee, 'department');
				nlapiLogExecution('DEBUG', 'new assignees dept', new_assignee_dept);

				//Make sure that Clinical Decision Case indicator correctly reflects the dept of the new assignee
				if(old_cdp_case == 'T' && new_assignee_dept != LC_Departments.ClinicalDecSupport){
					nlapiLogExecution('DEBUG', 'setting cd case', 'false');
					newRecord.setFieldValue('custevent_clinical_decisions_case', 'F');
				}
				if(old_cdp_case == 'F' && new_assignee_dept == LC_Departments.ClinicalDecSupport){
					nlapiLogExecution('DEBUG', 'setting cd case', 'true');
					newRecord.setFieldValue('custevent_clinical_decisions_case', 'T');
				}
			}
		}  //xedit end
		else if (type == 'edit' || type == 'create')
		{	
		
			// F24082 Ensure GOBI EBA Case indicator is only set for Cases associated with correct Form for edits via UI
			if (nlapiGetContext().getExecutionContext()== 'userinterface' && nlapiGetFieldValue('customform') != LC_Form.GobiEBA)
			{
				if (nlapiGetFieldValue('custevent_gobi_eba_case') == 'T')
		    	{
		    		nlapiSetFieldValue('custevent_gobi_eba_case', 'F');
		    	}
			}
		}	

		// Begin US856610 CDP: NS-05 - Case Scripting
		if(type == 'create'){
			// var curr_assignee = newRecord.getFieldValue('assigned');
			var assignee = newRecord.getFieldValue('assigned');
			var curr_assignee_dept = null;
			if(assignee){
				curr_assignee_dept = nlapiLookupField('employee', assignee, 'department');
				nlapiLogExecution('DEBUG', 'curr_assignee_dept', curr_assignee_dept)
				if(curr_assignee_dept == LC_Departments.ClinicalDecSupport){
					newRecord.setFieldValue('custevent_clinical_decisions_case', 'T');
				}
        	}
		}
		if (type == 'edit'){
			var cdp_case = newRecord.getFieldValue('custevent_clinical_decisions_case');
			var assignee = newRecord.getFieldValue('assigned');
			var curr_assignee_dept = null;
			if(assignee){
				curr_assignee_dept = nlapiLookupField('employee', assignee, 'department');
			}
			nlapiLogExecution('DEBUG', 'cdp_case is '+cdp_case,'curr_assignee_dept is '+curr_assignee_dept)
			// Unset the Clinical Decisions Case flag if Assignee changes to Non-Clinical Decisions Department
			// similar code exists in form level client script - but need USerEvent due to complexity around use of various forms
			if(cdp_case == 'T' && curr_assignee_dept != LC_Departments.ClinicalDecSupport){
				if (oldRecord.getFieldValue('custevent_assignee_department') == LC_Departments.ClinicalDecSupport){
					nlapiLogExecution('DEBUG', 'setting Clinical Decisions Case checkbox to', 'false');
					newRecord.setFieldValue('custevent_clinical_decisions_case', 'F');
				}
			}
			// Reverse of above, set the Clinical Decisions Case flag if Assignee changes to Clinical Decisions Department
			// similar code exists in form level client script - but need USerEvent due to complexity around use of various forms
			if(cdp_case == 'F' && curr_assignee_dept == LC_Departments.ClinicalDecSupport){
				if (oldRecord.getFieldValue('custevent_assignee_department') != LC_Departments.ClinicalDecSupport){
					nlapiLogExecution('DEBUG', 'setting Clinical Decisions Case checkbox to', 'true');
					newRecord.setFieldValue('custevent_clinical_decisions_case', 'T');
				}
			}
		}
		// END US856610 CDP: NS-05 - Case Scripting

		// US442795 - Set 'Case Last Modified By' to User making change
		if (type != 'delete')
		{
			if (userId == LC_UnknownUser)
			{
				userId = LC_Employees.SystemUser;
			}
			nlapiSetFieldValue('custevent_case_last_modified_by', userId);				
		}
	} // END ctx.getExecutionContext() != 'webservices'
}

