//	File:  client_sales_assignment.js
//
//	created by:		eAbramo
//	create date:	12/2019
//
//	Purpose of Script: validate that the Sales Assignment records move over properly to OPS system via Employee Dataloader thread
//	Library Scripts used:		None
//
//	Functions:	sales_assign_fieldchange	client field change function
//				sales_assign_save:			client Save function
//				validate_onsave				function to determine if find_dupes validation function should or should not be done via client script
//											-- current threshold at 90
//				find_dupes					function to validate if another Employee shares the same Team/Segment/Territory
//				clearDupeFlags				clears out the "Validated for No Dupes" flag and the "Segment Territory Team Dupe Exists" flag
//
//	Amendment Log:
//
//
//
// **********************************************************************************************************************

var this_record_id = null;
var dupe_exists = null;
var dupe_employee = null;
var dupe_emp_name = null; 
var curr_team = null;
var curr_segments = null;
var curr_segments_length = null;
var curr_territories = null;
var curr_territories_length = null;
var curr_segment_text = null;
var curr_territory_text = null;

//*************************************************************
//If user touches the Assigned Territories field or the Assigned Segment field
//need to reset the Validated for dupes field
/*
function sales_assign_init()
{
	if (nlapiGetFieldValue('custrecord_valid_nodupes') == 'T')
	{
		nlapiSetFieldValue('custrecord_valid_nodupes', 'F', false, true);
	}	
}
*/
//*************************************************************



function sales_assign_fieldchange(type, name)
{
	 // If user touches the Assigned Segments field - clear the dupe flags
	if (name == 'custrecord_salesassign_segments')
	{
		clearDupeFlags();
	}
	// If user touches the Assigned Territories field - clear the dupe flags
	if (name == 'custrecord_salesassign_territories')
	{
		clearDupeFlags();
	}		
	// If setting the inactive checkbox to True - call the function to clear the dupe flag fields
	if (name == 'isinactive')
	{
		if (nlapiGetFieldValue('isinactive') == 'T')
		{
			clearDupeFlags();
		}
	}
	// If user touches the Employee field (note update to team) clear the dupe flags
	if (name == 'custrecord_salesassign_employee')
	{
		clearDupeFlags();
	}
}
//*************************************************************

function sales_assign_save()
{
	// Set all the global variable to null to start clean
	this_record_id = null;
	dupe_exists = null;
	dupe_employee = null;
	dupe_emp_name = null; 
	curr_team = null;
	curr_segments = null;
	curr_segments_length = null;
	curr_territories = null;
	curr_territories_length = null;
	curr_segment_text = null;
	curr_territory_text = null;

	
	// though NetSuite validation enforces application of Assigned Segments and Assigned Territories field
	// need to add here because the result is that user gets hideous 'unexpected' error due to the code below
	// so just add extra validation on the two fields
	if (nlapiGetFieldValues('custrecord_salesassign_segments') == '' || nlapiGetFieldValues('custrecord_salesassign_segments') == null)
	{
		alert('Error - you must select Assigned Segments');
		return false;
	}
	if (nlapiGetFieldValues('custrecord_salesassign_territories') == '' || nlapiGetFieldValues('custrecord_salesassign_territories') == null)
	{
		alert('Error - you must select Assigned Territories');
		return false;
	}	
	
	
	var this_employee = nlapiGetFieldValue('custrecord_salesassign_employee');	
	// Employee MUST be a Sales Rep (done via customization but what if the salesRep flag changes via Employee record)
	if (nlapiLookupField('employee', this_employee, 'issalesrep') != 'T')
	{
		alert('ERROR: Sales Assigment Employees must be flagged as a Sales Rep.  This Employee is not.');
		return false;
	}
	// The Employee MUST have an OPS Team.  cannot test due to Employee validation but added validation here just in case.
	if (!nlapiLookupField('employee', this_employee, 'custentity_employee_team'))
	{
		alert('ERROR: Sales Assigment Employees must have an OPS Team.  This Employee does not have an OPS Team.');
		return false;
	}

	
	// Don't allow Employees to be assigned to the EP Gift Segment
	var AssignedSegments = nlapiGetFieldValues('custrecord_salesassign_segments');
	var ep_gift_segment = '67';
	var segment_count = AssignedSegments.length
	for (var c=0; segment_count != null && c < segment_count && c < 100; c++)
	{
		if (AssignedSegments[c] == ep_gift_segment)
		{	
			alert('You cannot assign an Employee to the EP Gift Segment.  Please remove this Segment');
			return false;	
		}		
	}

	//	Sales Assignment records are NOT allowed to be saved if the combination of Segment and Territory and Employee Team exists under
	//  	any other active record (either the same employee or a different employee)
	//	Look at Sourced field to see if the Rule should apply.  ONLY apply if the Team on the Employee allows for dupes
	var dont_allow_dupe_assign = nlapiGetFieldValue('custrecord_donotallow_dupe_sourced');
	if (dont_allow_dupe_assign == 'T')
	{	// This Assignment needs to be validated as dupe against other sales assignment records
		this_record_id = nlapiGetRecordId();
		if (!this_record_id) // creation of new record doesn't have an id yet
		{
			this_record_id = 0;
		}
		// Call function to determine if we SHOULD or SHOULD NOT validate on Save (shouldn't for combinations of more than 90)
		if (validate_onsave(this_record_id) == true)
		{
			// call function find_dupes() to find assignment records with same Team/Segment/Territory combination
			find_dupes(this_record_id);
			if (dupe_exists == true) // A dupe was found
			{		
				var curr_team_text = nlapiGetFieldText('custrecord_assigned_team');
				alert('There already exists an employee assigned under the team '+curr_team_text+' in Segment '+curr_segment_text+' in Territory '+curr_territory_text+'. The Employee is '+dupe_emp_name+'. Please modify this record or the other Employee\'s Assignment record');
				return false;		
			}
			else
			{
				// clear the 'Dupe Exists' checkbox if checked - and check the 'Validated for no Dupes' checkbox
				if (nlapiGetFieldValue('custrecord_seg_terr_team_dupe') == 'T')
				{
					nlapiSetFieldValue('custrecord_seg_terr_team_dupe', 'F', false, true);
				}
				nlapiSetFieldValue('custrecord_valid_nodupes', 'T', false, true);
			}		
		}
	}
	//	If Save Occurs - set the isUpdated flag on the Employee record to True // THIS IS DONE VIA USER EVENT AFTER SUBMIT SCRIPT
	return true;
}


//*************************************************************
//  function to determine if validation can or cannot be done via client script -- current threshold at 90
function validate_onsave(this_record_id)
{
	curr_team = nlapiGetFieldValue('custrecord_assigned_team');	
	curr_segments = nlapiGetFieldValues('custrecord_salesassign_segments');
	curr_segments_length = curr_segments.length;
	curr_territories = nlapiGetFieldValues('custrecord_salesassign_territories');
	curr_territories_length = curr_territories.length;	
	// alert('There are '+curr_segments_length+' segments and '+curr_territories_length+' Territories to combine for searches');
	var combinations = curr_segments_length * curr_territories_length;
	if (combinations > 90)
	{
		alert('This employee has '+combinations+' Territory and Segment combinations.  Due to the high number, validation that this assignment does not overlap with other employees will happen after your record is saved.  You will receive an email alert if the assignment does not pass validation.');
		return false;
	}
	else
	{	// 90 or less segment-territory combinations
		return true;
	}
}
//*************************************************************

// function to validate if another Employee shares the same Team/Segment/Territory
function find_dupes(this_record_id)
{
	// alert('begin the find_dupes function');
	// Build Searches for Segment Check
	for(s = 0; s < curr_segments_length; s++)
	{
		// clear out variables in case they still exist in last run of this code
		dupe_emp_name = null;
		curr_segment_text = null;
		curr_territory_text = null;
		// alert('create search filters for segment '+curr_segments[s]);
		var dupecheck_filters = new Array();
		dupecheck_filters[0] = new nlobjSearchFilter('internalid', null, 'noneof', this_record_id);
		dupecheck_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		dupecheck_filters[2] = new nlobjSearchFilter('custrecord_assigned_team', null, 'anyof', curr_team);
		dupecheck_filters[3] = new nlobjSearchFilter('custrecord_salesassign_segments', null, 'anyof', curr_segments[s]);
		for (t = 0; t < curr_territories_length; t++)
		{
			// alert('create search filter for territory '+curr_territories[t]);
			dupecheck_filters[4] = new nlobjSearchFilter('custrecord_salesassign_territories', null, 'anyof', curr_territories[t]);
			var dupecheck_columns = new Array();
			dupecheck_columns[0] = new nlobjSearchColumn('internalid', null, null);
			dupecheck_columns[1] = new nlobjSearchColumn('custrecord_salesassign_employee', null, null);
			// Run Search			
			dupecheck_results = nlapiSearchRecord('customrecord_sales_assignment', null, dupecheck_filters, dupecheck_columns);
			if (dupecheck_results)
			{
				// alert('dupecheck_results are returned');
				dupe_exists = true;
				for (var x=0; dupecheck_results != null && x < dupecheck_results.length; x++ )
				{
					dupe_employee = dupecheck_results[x].getValue('custrecord_salesassign_employee');
					dupe_emp_name = nlapiLookupField('employee', dupe_employee, 'entityid');
					curr_segment_text = nlapiLookupField('customrecord1', curr_segments[s], 'name');
					curr_territory_text = nlapiLookupField('customrecord83', curr_territories[t], 'name');
					return;
				}
			}
		}
	}
	// alert('Exit the find_dupes function - no dupes found');
	dupe_exists = false;
	return;
}
//*************************************************************


// the following function clears out the "Validated for No Dupes" flag
//		as well as the "Segment Territory Team Dupe Exists" flag
function clearDupeFlags()
{
	if (nlapiGetFieldValue('custrecord_valid_nodupes') == 'T')
	{
		// alert('in the clearDupeFlags function - custrecord_valid_nodupes is T');
		nlapiSetFieldValue('custrecord_valid_nodupes', 'F', false, true);
	}	
	if (nlapiGetFieldValue('custrecord_seg_terr_team_dupe') == 'T')
	{
		// alert('in the clearDupeFlags function - custrecord_seg_terr_team_dupe is T');
		nlapiSetFieldValue('custrecord_seg_terr_team_dupe', 'F', false, true);
	}
	return true;
}
//*************************************************************