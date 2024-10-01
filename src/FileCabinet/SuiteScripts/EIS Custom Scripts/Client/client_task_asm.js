//
// Script:     taskForm_asm.js
//
// Created by: Eric Abramo
//
// Function:   	1. Page initialisation (Function: taskFormLoad)
//		2. Save record processing (Function: taskFormSave)
//
// Revisions:
//	    Jan 20 2016 JO set Med Implementation Req Form flag to 'F' for new records
//

function taskFormLoad()
{	// Check the Is ASM Task field
	nlapiSetFieldValue('custevent_is_asm_task', true);
	// Set other Task type fields to No/False
	nlapiSetFieldValue('custevent_ddea_task', 'F'); // DDEA Task set to no
	nlapiSetFieldValue('custevent_is_todo_task', 'F');  // SEA To Do Task set to no
	nlapiSetFieldValue('custevent_is_sea_call', 'F');  // SEA Call Task set to no
	nlapiSetFieldValue('custevent_med_implement_req', 'F');  // J.O. - Med Implement Task set to no
	// set the Status to Completed
	nlapiSetFieldValue('status', 'COMPLETE');
}