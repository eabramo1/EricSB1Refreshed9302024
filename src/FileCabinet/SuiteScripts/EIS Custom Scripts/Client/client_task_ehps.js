//
// Script:     client_task_ehps.js
//
// Created by: Jeff Oliver on 2/13/20
//
// Function:   	1. Page initialization (Function: taskFormLoad)
//				2. Save record processing (Function: taskFormSave)
//
// Revisions:

//

function taskFormLoad()
{
	if ( (nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null) )
	{	// Set Created By to the User
		nlapiSetFieldValue('custevent_training_task_createdby', nlapiGetUser());

		// Set the Is Task for Medical Implementation Managers field to true
		nlapiSetFieldValue('custevent_med_implement_req', 'T');
		
		
		// Set other Task type fields to No/False
		nlapiSetFieldValue('custevent_ddea_task', 'F'); // DDEA Task set to no
		nlapiSetFieldValue('custevent_is_todo_task', 'F');  // SEA To Do Task set to no
		nlapiSetFieldValue('custevent_is_sea_call', 'F');  // SEA Call Task set to no
		nlapiSetFieldValue('custevent_is_trainer_task', 'F');  // J.O. - Is Task for Trainers set to no
		

	}


}

function taskFormSave()
{
	// set AssignedTo (the real field) to be equal to the value in the 'Assign to Medical Implementation Manager' (custom) field
	// used the custom field so that I could make it a subset of the full employee list
	nlapiSetFieldValue('assigned', nlapiGetFieldValue('custevent_eh_assign_mim'))


	
	// If paid services is set then Expected revenue & currency are mandatory
	if (nlapiGetFieldValue('custevent_paid_training') == 'T' && (!nlapiGetFieldValue('custevent_ex_tr_rev_amt')||!nlapiGetFieldValue('custevent_ex_tr_rev_cur')))
	{
		alert('Please enter both an Expected Revenue and a Currency when Paid Services is indicated.');
		return(false);
	}	

	return(true);
}
