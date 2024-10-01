///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Script:		solutionForm_KnowledgeBase.js
//
// Created by:	Christine Neale, EBSCO,  May 2015  Implemented: May 12th, 2015 
//
//
// Revisions:  
//             06/15/2015	CEN	Only allow EIS Knowledge Base Administrator & Administrator roles to edit  
//								approval status of Solutions. Default Assigned to to person entering Solution.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Global Variables
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Set the record id, user id & role 
 	var recId;
 	recId = nlapiGetRecordId();	
 	var userId;
 	userId = nlapiGetUser();
 	var role;
 	role = nlapiGetRole();

// 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: solPageInit
// Called:   When the form is loaded 
// Purpose:  1. To protect Solution Code on create as this is auto-assigned. 
//           
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function solnPageInit(type)
{

	// if a new Solution is being added, protect Solution Code & Assign to user.
	if (!recId )
    {
	 	nlapiDisableField('solutioncode', true);
	 	nlapiSetFieldValue('assigned', userId);
    }	
	
	// Protect the Status field unless Administrator (3) or EIS Knowledge Base Administrator (1103)
	if (role != '3' && role != '1103')
		{
			nlapiDisableField('status', true);
		}
} // end solnPageInit

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: solFieldChanged
//Called:   When a field is changed 
//Purpose:  
//          1.  If status changes to "Approved" set last review date.
//          2.  If last review date is changed auto-populate last reviewed by.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function solFieldChanged(type, name)
{
	// If solution approved set last review date
	if (name == 'status' && (nlapiGetFieldValue('status') == 'APPROVED'))
		{
		var today = new Date();
		nlapiSetFieldValue('custevent_last_review_date', nlapiDateToString(today)); 
		}
	
	//  If last review date set then auto-populate current user to last reviewed by.
	if ((name == 'custevent_last_review_date') && (nlapiGetFieldValue('custevent_last_review_date'))) 
	{
		nlapiSetFieldValue('custevent_last_review_by', userId);
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function:	solnSaveRecord 
// Called:		When the Solution record is saved
// Purpose:  	
//				1. On record creation set the Solution Code according to Type & last sequential no. used.
//            
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function solnSaveRecord(type)
{
	if (!recId)
	// On record create set the Solution Code.	
	{
		// Retrieve record type Prefix & saved search ID
		var fields = ['custrecord_code_prefix', 'custrecord_solution_search_id'];
		var columns = nlapiLookupField('customrecord_solution_type', nlapiGetFieldValue('custevent_solution_type'), fields);
		var prefix = columns.custrecord_code_prefix;
		var searchid = columns.custrecord_solution_search_id;
		
		// Retrieve the last no. used for prefix & add 1 
		// Note: relies on solutions in descending order 
		
		var searchresult = nlapiSearchRecord('solution', searchid, null, null);

 		try
 		{
 			if (searchresult != null);
 			{
 				var maxcode = searchresult[0].getValue('solutioncode');
 				var len = maxcode.length;
 				var max = maxcode.substring(3, len);
 				var maxno = parseInt(max) + 1;
 			}
 		}
 		catch(e)
 		{
 			var maxno = 1;
 		}
		
		nlapiSetFieldValue('solutioncode', prefix + maxno);
	}
	return true;
}

