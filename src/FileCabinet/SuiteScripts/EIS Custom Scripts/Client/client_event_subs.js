///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Script:		eventForm_Subs.js
//
// Created by:	Christine Neale, EBSCO,  October 2013 (1st Implementation 17Oct2013)
//
// Function:	1. Page initialisation for Event Form editing 
// 			  		a. Only allow Administrator to Create Event or Edit Event main body fields.
// 
//				2. Save record processing
//					a. Do NOT allow Event creation if not Administrator
//						
//				3. Validate field processing
//					a. Error if Message edited (unless by Admin).
//
// Revisions:  
//							 
//	
// 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: eventPageInit
// Called:   When the Event form is loaded 
// Purpose:  1. Only allow Administrator to Create Event or Edit Event main body fields.
//			 2. Warn non-Administrators that Event creation disallowed & changes should be made via Subs Call. 
//                     
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function eventPageInit(type)
{

	// Get the record id 
	var eventRecId;
	eventRecId = nlapiGetRecordId();	

	// Get the user role
	var userRole = nlapiGetRole();

	// if a new Call is being added (i.e. Type is Create or Copy), set defaults
	if ((!eventRecId || eventRecId == -1) && userRole != '3')
    {
		alert("WARNING: Calendar Event creation is NOT allowed.");
    }
	
	if (userRole != '3') // Not Administrator
	{
		alert("Warning: Calendar Event changes should be made via the associated Subscriptions Call.");
		// Prevent attendees being added/amended
		nlapiDisableLineItemField('attendee', 'attendee', true);
	}
	else // Administrator
	{
		nlapiDisableField('title', false);
		nlapiDisableField('startdate', false);
		nlapiDisableField('customform', false);
		nlapiDisableField('timedevent', false);
		nlapiDisableField('starttime', false);
		nlapiDisableField('endtime', false);
		nlapiDisableField('status', false);  
		nlapiDisableField('organizer', false);
		nlapiDisableField('custevent_subs_assoc_call', false);
		nlapiDisableField('title', false);
		nlapiSetFieldText('accesslevel', "Public");
	}	

} // end eventPageInit

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function:	eventSaveRecord 
// Called:		When the Call record is saved
// Purpose:  	1. Do NOT allow Event creation if not Administrator
//					
//            
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function eventSaveRecord(type)
{
	// Get the record id 
	var eventRecId;
	eventRecId = nlapiGetRecordId();	
	
	// Get the user role
	var userRole = nlapiGetRole();
	
	
	// if a new Call is being added (i.e. Type is Create or Copy), set defaults
	if ((!eventRecId || eventRecId == -1) && userRole != '3')
    {
		alert("ERROR: Calendar Event creation is NOT allowed.");
		return false;
    }
	return true;

} // end eventSaveRecord

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Validate Field Function  (Function: eventValidateField)
//1. Error if message changes 
//

function eventValidateField(type, name)
{

//--------------------------------------------------------------------------------------------------------------//
//On change of Message - Error (unless Administrator)
//--------------------------------------------------------------------------------------------------------------//

	if (name == 'message' && nlapiGetRole() != '3') 
	{ 
		alert("ERROR: Calendar Event Message may not be amended.");
		return false;
	}	
	
//End eventValidateField function 
return true;	
}

