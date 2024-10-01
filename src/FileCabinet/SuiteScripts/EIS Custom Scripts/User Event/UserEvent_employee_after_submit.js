//	File:  UserEvent_employee_after_submit.js
//
//	created by:		eAbramo
//	create date:	12/06/2019
//
//	Purpose of Script: After committing the Employee record to the DB check to see if the user updated the OPS Team field.  
//						If so then set the 'validated for no dupes' checkbox to unchecked on all child Sales Assignment records (child to this Employee). 
//						This should launch Sales Assignment validation via scheduled script.
//
//	Library Scripts used:		None
//
//	Functions:	userEvent_employee_after_submit
//				
//
//	Amendment Log:
//
//
//
// **********************************************************************************************************************

function userEvent_employee_after_submit()
{
	// nlapiLogExecution('DEBUG', 'My function launched');
	if (type != 'create' && type != 'view' && type != 'delete')
	{
		var oldRecord = nlapiGetOldRecord();
		var newRecord = nlapiGetNewRecord();
		var oldTeam = oldRecord.getFieldValue('custentity_employee_team');
		var newTeam = newRecord.getFieldValue('custentity_employee_team');
		if (oldTeam != newTeam)
		{
			nlapiLogExecution('DEBUG', 'The user changed the team');
			// Get child Sales Assignment records
			var currentRecord = nlapiGetRecordId();
			var sassign_filters = new Array();
			sassign_filters[0] = new nlobjSearchFilter('custrecord_salesassign_employee', null, 'anyof', currentRecord);
			sassign_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			var sassign_columns = new Array();
			sassign_columns[0] = new nlobjSearchColumn('internalid', null, null);
			// Search Sales Assignment records
			var sassign_searchResults = nlapiSearchRecord('customrecord_sales_assignment', null, sassign_filters, sassign_columns);
			if (sassign_searchResults)
			{	// for each result of the SI Search
				nlapiLogExecution('DEBUG', 'The Employee has '+sassign_searchResults.length+' active Sales Assignment records');
				for (var x=0; sassign_searchResults != null && x < sassign_searchResults.length; x++ )
				{
					var sassign_id = sassign_searchResults[x].getValue('internalid');
					nlapiSubmitField('customrecord_sales_assignment', sassign_id, 'custrecord_valid_nodupes', 'F');
					nlapiSubmitField('customrecord_sales_assignment', sassign_id, 'custrecord_seg_terr_team_dupe', 'F');
				}
			}
		}
	}
}