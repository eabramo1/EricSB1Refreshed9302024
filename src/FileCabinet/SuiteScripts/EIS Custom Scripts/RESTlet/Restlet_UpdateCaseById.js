/*
 * File:  Restlet_UpdateCaseById.js 
 *
 * Module Description:  When this Restlet is called it will Update the case with the 
 * 		appropriate fields.
 
 * 		Library Scripts Used:
 			library_case.js  -- Library Script functions will be called for field validation
 					for all relevant fields.
 			library_constants.js -- Library Script used to reference constant values		
 
 * JSON input expected: 
 			Required:
  				{"case_id":"[caseid]" 					-- internal ID of the Case
  				"form_id": "[custom form id]"}		    -- customform id (for now only accepts value of '147' for 'EBSCO CustSat Merged Case Form')
  			
  			  	Optional:
  				PART 1: (Easier fields)
						case_subject
						case_priority
						case_status
						case_status_comment
						case_dde_req_type
						case_prod_interface (Product/Interface)
						case_area_support
						case_support_task
						case_occupation
						case_effort_level
						case_custsat_hours (CustSat Actual Hours)
						case_show_in_portal
				PART 2: (More Difficult fields)
						case_assignee (assigned to)						
						case_institution
						case_eis_account
						case_contact
						case_email (Customer's E-mail)
						case_email_or_case_note
						case_send_to_customer
						case_internal_no_external_email
						case_phone
																					
 *  JSON output expected: 
 *  			Success or Failure
 *  			TBD
 * 
 *  Link to Documentation: https://ebscoind.sharepoint.com/:w:/r/sites/EISOPFMercury/_layouts/15/WopiFrame.aspx?sourcedoc=%7B674AE737-1754-4B46-8D00-F5B579DB40DA%7D&file=RESTlet%20UpdateCaseById%20documentation.docx&action=default&IsList=1&ListId=%7BE66063A7-936C-4CE6-88A8-4765289E890E%7D&ListItemId=744
 *  
 * Version    Date            	Author				Remarks
 * 1.00       04/05/2018		Christine Neale/	US326315 Part 1 of UpdateCaseById 
 * 								Eric Abramo         
 * 			  					Christine Neale		US326312 Part 2 of UpdateCaseById		
 * 
 */
//- Global Variables ---------------------------------------------------------------//

	// Restlet Status Global Variables
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
//----------------------------------------------------------------------------------//	
	
function UpdateCaseById(dataIn)
{
	nlapiLogExecution('debug', 'RESTLET UpdateCaseById started'); 
	
	// Set Global Variables (now defined in library_case.js)
	// parameters to track validity of data -- assume valid
	L_case_validData = true;
	L_case_invalidfields = '';
	// parameters to track fields to be updated 
	L_case_updatedfields = '';
	// parameter to indicate Assignee is one of the Unassigned records 
	L_case_unassigned = 'F';  
	
	// Set other variables
	// parameters to clean invalid/updated field details
	var invalidFields_cleaned = '';
	// parameters to track fields to be updated 
	var updatedFields_cleaned = '';
	
	try
	{	
		// Load the Case
		nlapiLogExecution('debug', 'dataIn.case_id=' + dataIn.case_id);	
		var supportCase = nlapiLoadRecord('supportCase', dataIn.case_id);	
		// Fetch dataIn values
		var case_id = dataIn.case_id;
		
		// There will be different processing paths for each Form Type 
		// Initially there are going to be some restrictions / situations that we don't cater for including:-
		//        Changing the Form of a Case
		//        Any situation other than EBSCO Merged CustSat Case Form & DDE Assignee 
		// these are included in seriousError() and may be added to or removed in time.
		
		if (!seriousError(dataIn, supportCase))
		{		
			// Direct the Update to the correct logic dependent on input Form Type
			switch (dataIn.form_id) 
			{
			//---------------------------------------------------------------------------------------------------------------//
			// EBSCO CustSat Merged Case Form (147)--------------------------------------------------------------------------//
			//---------------------------------------------------------------------------------------------------------------//
			case LC_Form.CustSatMerged:

				// Assignee Processing - Assignee department determines subsequent workflows
		 		var assDept = processAssignee147(dataIn.case_assignee, supportCase);
				
				nlapiLogExecution('debug', 'assdept=' + assDept);
	
				//--------------------------------------------------------------------------------//
				//-------- COMMON Processing independent of Department----------------------------//
				//--------------------------------------------------------------------------------//
				
				// Show in case portal needs to be considered initially----------------------------
				L_setShowInCasePortal('S', dataIn.case_show_in_portal, assDept, supportCase);
				
				// Subject Field - mandatory (NS)-------------------------------------------------- 
				updSubject(dataIn.case_subject, supportCase);
				
				// Case Status includes update and Escalatee check (both for updates & existing)---
				L_valCaseStatus(dataIn.case_status, supportCase);
				
				// Case Status Comment--------------------------------------------------------------
				updStatusCom(dataIn.case_status_comment, supportCase); 
				
				// Priority - mandatory need to check there even if not passed in-------------------
				L_valPriority(dataIn.case_priority, supportCase);
				
				// Email or Case Note, Send Email to Customer & Internal (no external email sent) -----
				// These handle sending an email to the Customer or just adding an Internal note
				L_emailCaseNoteValdn(dataIn.case_email_or_case_note, dataIn.case_send_to_customer, dataIn.case_internal_no_external_email,supportCase);
				
				// Institution, EIS Account, Contact, Email & Phone -------------------------------------
				// These are all intertwined and so are handled together
				L_InstAccContEmlTelProcess(dataIn.case_institution, dataIn.case_eis_account, dataIn.case_contact, dataIn.case_email, dataIn.case_phone, supportCase);
	

				//--------------------------------------------------------------------------------------------------------//
				// Set Additional fields common to DDE & SSD--------------------------------------------------------------//
				//--------------------------------------------------------------------------------------------------------//

				// Set the 'Global Customer Support Case' checkbox 
				// Specifically set for dept = 2 or 95 only 
				if (LC_Departments.IsDeptDDEGlobalCustSat(assDept))
				{
					supportCase.setFieldValue('custevent_global_customer_support_case', 'T');
				}
				else
				// Unset for all other departments	
				{
					supportCase.setFieldValue('custevent_global_customer_support_case', 'F');
				}
				
				//--------------------------------------------------------------------------------//
				//-------- SSD Processing dependent on Department---------------------------------//
				//--------------------------------------------------------------------------------//
				if (LC_Departments.IsDeptSSDSupport(assDept))
				{
					restlet_status = 'ERROR';
					restlet_status_details = 'Assignee Department of SSD. Case updates not currently supported for non-DDE assignees.';			
				}
				//--------------------------------------------------------------------------------//
				// YBP Processing not allowed-----------------------------------------------------//
				//--------------------------------------------------------------------------------//
				else if (LC_Departments.IsDeptYBPSupport(assDept))
				{
					restlet_status = 'ERROR';
					restlet_status_details = 'Assignee Department of YBP. Updates to Form Id 147 not supported for YBP.';			
				}
				//--------------------------------------------------------------------------------//
				//-------- DDE Processing dependent on Department---------------------------------//
				//--------------------------------------------------------------------------------//
				else
				{
					// Check that Profile is one of the DDE Support Profiles
					valProfile147DDE(supportCase.getFieldValue('profile'));

					//  --------------------------------------------------------
					//DDE Request Type - mandatory (custom) & population of Case Portal Request Type dependent on value
					L_DDEReqTypProcess(dataIn.case_dde_req_type, supportCase);
					
				    //  ---------------------------------------------------------------
					// DDE Product Interface & DDE Area of Support & DDE Support Task - Interdependent fields
					L_DDEProdAreaTaskProcess(dataIn.case_prod_interface, dataIn.case_area_support, dataIn.case_support_task, supportCase);
		  			
					//  --------------------------------------------------------			
					//Occupation - mandatory (custom)
					L_valOccupation(dataIn.case_occupation, supportCase);

					//  --------------------------------------------------------
					// Level of Effort - no custom validation required
					updLvlEffort(dataIn.case_effort_level, supportCase);
					
					//------------------------------------------------------------
					// Cust Sat Actual Hours - no custom validation required
					updActHrs(dataIn.case_custsat_hours, supportCase);
				}	
				break;
			//---------------------------------------------------------------------------------------------------------------//
			// END of EBSCO CustSat Merged Case Form (147)-------------------------------------------------------------------//
			//---------------------------------------------------------------------------------------------------------------//				
								
			default: 
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields + ', Calls to UpdateCaseByID with Form Type = ' +dataIn.form_id + ' are NOT currently supported';		
				break;

			} // end Switch
			
			//------------------------------------------------------------------------------------------------------------------//
			// This is end of Form Dependent Processing 
			//------------------------------------------------------------------------------------------------------------------//
			
			// Log what we have to update
			nlapiLogExecution('debug', 'updatedfields=' + L_case_updatedfields);	
			
			if (L_case_validData == true)
			{	// If at least one field was updated
				if (L_case_updatedfields)
				{	
					updatedFields_cleaned = L_case_updatedfields.substring(2);
					// submit the updated record
					nlapiSubmitRecord(supportCase);
					restlet_status = 'SUCCESS';
					restlet_status_details = 'Fields updated: ' + updatedFields_cleaned;
				}
				else // no valid fields passed in to update
				{
					nlapiLogExecution('debug', 'No valid fields to update');
					restlet_status_details = 'No valid fields to update.  Check input parameters';
				}
			}	
			else 
			{
				if (L_case_invalidfields)
				{
					invalidFields_cleaned = L_case_invalidfields.substring(2);
				}	
				nlapiLogExecution('debug', 'validData NOT true',  'invalidfields: '+invalidFields_cleaned);
				//Required fields missing
				restlet_status = 'ERROR';
				restlet_status_details = 'Field validation failures: ' + invalidFields_cleaned;	
			}		
		}
		else // Handle when Serious Error
		{
			nlapiLogExecution('debug', 'Serious Error Condition met');
		}
	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'UpdateCaseById Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'UpdateCaseById Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
	var dataOut = {restlet_status: restlet_status, case_id: case_id, restlet_status_details: restlet_status_details};
	nlapiLogExecution('debug', 'RESTLET UpdateCaseById ended...');	
	return(dataOut);
	
} // End of function UpdateCaseById

/*----------------------------------------------------------------------------------------------------------------
 * Function   : seriousError()
 * Description: Checks for serious Errors that we want to terminate the RESTlet
 * Input	  :	din = dataIn JSON
 * 				rec = nlobjRecord Case	    
 * Returns    : false = no serious errors
 * 				true = serious error 
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function seriousError(din, rec)
{
	// Check that Form Id passed in matches Form Id of Case to be updated, as we don't currently support form changes
	if (din.form_id != rec.getFieldValue('customform'))
	{
		restlet_status = 'ERROR';
		restlet_status_details = 'Case not compatible with form_id.  Case form changes not currently supported.';
		return true;
	}
	
	// Check that Profile is one of the DDE Support Profiles, as we don't currently support any other profiles
	if (!LC_Profiles.IsProfileDDESupport(rec.getFieldValue('profile')))
	{
		restlet_status = 'ERROR';
		restlet_status_details = 'Case for non-DDE Profile.  Case updates not currently supported for non-DDE profiles.';
		return true;
	}
	
	//  Check that Assignee of the Case is not populated or is considered DDE according to the EBSCO Merged Customer Support 
	//  Case Form i.e. Is not SSD or YBP - we don't currently support other assignees
	var origassign = rec.getFieldValue('assigned');
	if (origassign)
	{
		var assigndeptInternalID = nlapiLookupField('employee', origassign, 'department');
		if (LC_Departments.IsDeptSSDSupport(assigndeptInternalID) || LC_Departments.IsDeptYBPSupport(assigndeptInternalID))
		{
			restlet_status = 'ERROR';
			restlet_status_details = 'Case with existing SSD or YBP Assignee. Case updates not currently supported for non-DDE assignees.';			
			return true;
		}
	}
	
	//  Check that any Assignee passed in is considered DDE according to the EBSCO Merged Customer Support 
	//  Case Form i.e. Is not SSD or YBP - we don't currently support other assignees
	if (din.case_assignee)
	{
		assigndeptInternalID = nlapiLookupField('employee', din.case_assignee, 'department');
		if (LC_Departments.IsDeptSSDSupport(assigndeptInternalID) || LC_Departments.IsDeptYBPSupport(assigndeptInternalID))
		{
			restlet_status = 'ERROR';
			restlet_status_details = 'New Assignee is SSD or YBP. Case updates not currently supported for non-DDE assignees.';
			return true;
		}
	}
	return false;
}


/*----------------------------------------------------------------------------------------------------------------
 * Function   : processAssignee147
 * Description: Determine if Assignee is valid for Case Form 147, populated and Process 
 * Assumptions:	Assumes use of global variables: L_case_validData, L_case_invalidfields, L_case_updatedfields & L_case_unassigned
 * Input	  :	assign = dataIn.case_assignee
 * 				rec = nlobj case record    
 * Returns    : Department of Assignee
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function processAssignee147(assign,rec)
{
//-------------------------------------------------------------
// Assigned To - Mandatory (NS) & Custom Validation
// Other processing is dependent on value set for L_case_unassigned
// Note: in future this will need to be expanded when assignee dept restriction lifted
	
	// Retrieve original assignee dept & store
	var assignOrig = rec.getFieldValue('assigned');
	if (assignOrig)
	{
		var assignOrigDept = nlapiLookupField('employee', assignOrig, 'department');
		// Check that the case does not have a YBP Support department
		if (LC_Departments.IsDeptYBPSupport(assignOrigDept))
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields +', calls to UpdateCaseByID with Custom Form = 147 cannot update a Case with an existing YBP Support Assignee';				
		}
	}
	else
	{
		assignOrigDept = '';
	}
	
	if (assign != null)
	{		
		if (assign)
		{	
			var assignInDept = nlapiLookupField('employee', assign, 'department');
			// Check the assignee is not for one of the YBP Support departments
			if (LC_Departments.IsDeptYBPSupport(assignInDept))
			{
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields +', calls to UpdateCaseByID with Custom Form = 147 cannot update a Case with a YBP Support Assignee';				
			}
			// Check that the assignee is not a change from SSD to DDE
			else if(assignOrig && (LC_Departments.IsDeptSSDSupport(assignOrigDept) != LC_Departments.IsDeptSSDSupport(assignInDept)))
			{
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields +', calls to UpdateCaseByID with Custom Form = 147 does not currently cater for a change of Assignee between SSD & DDE';				
			}
			// SSD or DDE and not change of Assignee department
			else 
			{
				rec.setFieldValue('assigned', assign);
				L_case_updatedfields = L_case_updatedfields + ', case_assignee';
			}	
		}
		else
		// If blank assignee invalid situation	
		{ 	
				L_case_validData = false;
				L_case_invalidfields = L_case_invalidfields +', Case Assignee cannot be set to blank';				
		}	
	}
// Now check that assignee is populated if we are not updating it
	else if (!assignOrig)
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields+', You did not specify Assignee.  Assignee cannot be blank';
		return '';
	}  
	
	// Workout if the Assignee we end up with is one of the SSD or DDE Unassigned Employees
	if (LC_Employees.IsEmpSSDUnassign(rec.getFieldValue('assigned'))||rec.getFieldValue('assigned') == LC_Employees.UnassignedDDETech)
	{
		L_case_unassigned = 'T'; 
	}
	
	// Return department of final assignee 
	return nlapiLookupField('employee', rec.getFieldValue('assigned'), 'department');
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : valProfile147DDE(prof)
 * Description: Validates Case Profile for Form 147 and DDE Assignee 
 * Input	  :	prof = internal ID of Case Profile    
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function valProfile147DDE(prof)
{
	if (!LC_Profiles.IsProfileDDESupport(prof))
	{
		L_case_validData = false;
		L_case_invalidfields = L_case_invalidfields +', Case has invalid profile for DDE Case using CustSat Merged Case Form';
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : updSubject(subj, rec)
 * Description: Handles update to Subject field 
 * Input	  :	subj = dataIn.case_subject
 * 				rec = nlobjRecord Case    
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function updSubject(subj, rec)
{
	// Subject Field - mandatory field (NS) - NS functionality handles this
	if (subj != null)
	{
		rec.setFieldValue('title', subj);
		L_case_updatedfields = L_case_updatedfields + ', case_subject';
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : updStatusCom()
 * Description: Handles update of Status Comment field 
 * Input	  :	com = dataIn.case_status_comment
 * 				rec = nlobjRecord Case   
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
//--------------------------------------------------------
function updStatusCom(com, rec)
{
	// Case Status Comment - no custom validation required  
	if (com != null)
	{
		rec.setFieldValue('custevent_status_comment', com);
		L_case_updatedfields = L_case_updatedfields + ', case_status_comment';
	}
}


/*----------------------------------------------------------------------------------------------------------------
 * Function   : updLvlEffort()
 * Description: Handles update of Case Level of Effort Field
 * Input	  :	elvl = dataIn.case_effort_level
 * 				rec = nlobjrecord case    
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/

function updLvlEffort(elvl, rec)
{
	// Case Level of Effort - no custom validation required  
	if (elvl != null)
	{
		rec.setFieldValue('custevent_level_of_effort', elvl);
		L_case_updatedfields = L_case_updatedfields + ', case_effort_level';
	}
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : updActHrs()
 * Description: Handles update of Cust Sat Actual Hours
 * Input	  :	hrs = dataIn.case_custsat_hours
 * 				rec = nlobjrecord Case    
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/

function updActHrs(hrs, rec)
{
	// Case Status Comment - no custom validation required  
	if (hrs != null)
	{
		rec.setFieldValue('custevent_custsat_actual_hours', hrs);
		L_case_updatedfields = L_case_updatedfields + ', case_custsat_hours';
	}
}

