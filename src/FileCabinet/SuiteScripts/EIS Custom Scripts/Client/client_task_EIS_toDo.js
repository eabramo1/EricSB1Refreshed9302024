//
// Script:     taskForm_ToDo.js
//
// Created by: Christine Neale, EBSCO, 13 August 2013
//
//
//
// Function:   	1. Page initialisation for Task ToDo Form editing
//					a. To default the AccessLevel field to 'Public'
//					b. To ensure NS standard sendemail flag is set to 'F' as this functionality has been replaced.
//                  c. To ensure the custom EBSCO sendemail flag is set to 'T'.
//                  d. Set the SEA To Do check box to 'T' for new & enable for Administrator.
//				2. Save record processing
//					a. Populate the real Transaction field with the value in the Open Opportunities field.
//                  b. Ensure correct form being used to save record.
//                  c. Warn if EIS Account no. not populated and To Do assignee does not have access.
//
// Revisions:
//		3Jan2013	CNeale	Ensure Correct form being used to save record.
//					Warm if EIS Acc no. not populated and ToDo assignee does not have access.
//		20Jan2016	JOliver	set Med Implementation Req Form flag to 'F' for new records
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: todoPageInit
// Called:  When the ToDo form is loaded
// Purpose: 1. To default the AccessLevel to 'F' i.e. Public.
//          2. Ensure NS standard sendemail flag is set to 'F' as this functionality has been replaced.
//			3. Ensure custom custevent_ebsco_email flag is set to 'T'.
//          4. Set the SEA To Do check box to 'T' and enable for Administrator.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function todoPageInit(type)
{

	// Get the record id
	var taskRecId;
	taskRecId = nlapiGetRecordId();

	// if a new ToDo is being added
	if (!taskRecId || taskRecId == -1)
	{
		nlapiSetFieldValue('accesslevel', 'F');  // Set access level to Public
	 	nlapiSetFieldValue('custevent_ebsco_email', 'T');  // Custom send EBSCO e-mail default to Yes
	 	nlapiSetFieldValue('custevent_is_todo_task', 'T'); // SEA To Do set to Yes
	 	nlapiSetFieldValue('custevent_ddea_task', 'F'); // DDEA Task set to no
		nlapiSetFieldValue('custevent_is_sea_call', 'F');  // SEA Call Task set to no
		nlapiSetFieldValue('custevent_is_trainer_task', 'F'); // Is training task to no
		nlapiSetFieldValue('custevent_med_implement_req', 'F');  // J.O. - Med Implement Task set to no
	 }

	// For all ToDos
	nlapiSetFieldValue('sendemail', 'F');   //NS Standard send e-mail default to No

	// For Administrator role (3) enable SEA To Do flag
	if (nlapiGetRole() == '3')
	{
		nlapiDisableField('custevent_is_todo_task', false);
	}

}
// End function todoPageInit

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: todoFormSave
//Called:  When the ToDo record is saved
//Purpose: 1. Populate the real Transaction field with the value in the Open Opportunities field.
//         2. Ensure correct form being used.
//         3. Warn if EIS Account no. not populated and To Do not assigned to owner/user.
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function todoFormSave()
{
	// Populate Transaction field with the value in the Open Opps field
	var openopp = nlapiGetFieldValue('custevent_task_openopportunity');
	if (openopp)
	{
		nlapiSetFieldValue('transaction', openopp);
	}

	// Ensure correct form being used
	if (nlapiGetFieldValue('custevent_is_todo_task') != 'T' && nlapiGetRole() != 3)
	{
		alert("ERROR: This is NOT an SSE To Do. Please use the correct form to edit this record.");
			return false;
	}

	// Warn if EIS Account no. not populated if assignee does not have access
	if (!nlapiGetFieldValue('custevent_todo_eis_acno') && nlapiLookupField('employee', nlapiGetFieldValue('assigned'), 'giveaccess') != 'T')
		{
		if (!confirm("Warning: No EIS Account selected for this To Do. \n\n Continue? \n\n (OK = Yes, Cancel = No)"))
			{
			return false;
			}
		}

	return true;
}
// End function todoFormSave



