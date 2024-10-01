//
// Script:     task_before_load.js
//
// Created by: Christine Neale, EBSCO,  August 13, 2014.
//
// Function:	1. For the EIS Sales Call Form (ID = 115):-   
//					a. Populate date created for display purposes only.
//             		b. Hide Subs status form unless different from status.
//			   		c. Display Message as Comments for historical calls with no Call Notes. 	
//
// Notes:      This script is associated with the Task record. 
//             
//
// Revisions:
//		CNeale 10/31/2016	US165568 Only display reminder details if reminder set.
//                          Deploy for all Types (previously View only deployment).
//                          Remove Custom Form selection as not available in View mode! &
//                          introduce execution context criteria for UI.
//		CNeale	03/30/2019	US480667 Suppress display of Item field (2019.1 functionality)
//

// Populate date created

function taskBeforeLoad(type,form) 
{

	// US165568 Actions for UI context only:
	var ctx = nlapiGetContext();
	if (ctx.getExecutionContext() == 'userinterface')
	{	
	
		// US1665568 View only actions
		if (type == 'view')
		{
			// If not ToDo/DDE Call/Training Task (all saved with form) - then make sure view via EIS Sales Call form will be OK
			if (nlapiGetFieldValue('custevent_is_todo_task') != 'T' && nlapiGetFieldValue('custevent_ddea_task') != 'T' && nlapiGetFieldValue('custevent_is_trainer_task') != 'T') 
			{
				// Populate Date Created for Sales Call Form
				nlapiSetFieldValue('custevent_creation_date', nlapiGetFieldValue('createddate')); 
				// Suppress Subs Call Status unless Call Status = Not Started 
				if (nlapiGetFieldValue('status') != 'NOTSTART')
				{
					form.getField('custevent_subs_call_status').setDisplayType('hidden');
				}
			} 
			// If not SSE task (i.e. Task not entered via EIS Sales Call form) make sure any message is displayed if no call notes
			if (nlapiGetFieldValue('custevent_is_sea_call') != 'T' && !nlapiGetFieldValue('custevent_subs_call_notes_summary'))
			{
				form.getField('message').setDisplayType('normal');
			}
			
			// US165568 Only show reminder fields if Reminder set on EIS Sales Call Form calls
			if (nlapiGetFieldValue('timedevent') != 'T' && nlapiGetFieldValue('custevent_is_sea_call') == 'T')
			{
				nlapiGetField('starttime').setDisplayType('hidden');
				nlapiGetField('endtime').setDisplayType('hidden');
				nlapiGetField('remindertype').setDisplayType('hidden');
				nlapiGetField('reminderminutes').setDisplayType('hidden');
			}
		}
		
		// US165568 Processing to hide 'no store' Subs Call Topics when not in Edit/create mode
		if (type !='edit' && type != 'create' && type != 'copy')
		{
			nlapiGetField('custevent_no_store_topic').setDisplayType('hidden');
		}	
	
		// US165568 Processing for EIS Sales Call Form only (Form Id = 115)
		if (nlapiGetFieldValue('customform') == 115) 
		{
			// US165568 Sort out the values in the "no store" Call Topics if Multi-select Product Line populated 
		   	var initPlinea = nlapiGetFieldValues('custevent_ms_prod_line');
			if ((type =='edit' || type == 'copy') && initPlinea )
			{	
			   	var initTopics = new Array();
			   	initTopics = nlapiGetFieldValues('custevent_subs_call_topics');
			   	nlapiSetFieldValues('custevent_no_store_topic', initTopics, false, true);
		    }
			
			if (type =='edit' || type == 'create' || type == 'copy')
			{
				// US165568 Hide 'true' Subs Call Topics and display 'no store' version
				nlapiGetField('custevent_no_store_topic').setDisplayType('normal');
				nlapiGetField('custevent_subs_call_topics').setDisplayType('hidden');
			}	
			
		}
		// US480667 Suppress 2019.1 introduced field "relateditem" as not possible to suppress on Form definition
		nlapiGetField('relateditem').setDisplayType('hidden');
		
	} // End of Context = UI
}


	


