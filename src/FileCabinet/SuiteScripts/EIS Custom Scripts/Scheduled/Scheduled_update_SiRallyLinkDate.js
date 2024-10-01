// Script:     Scheduled_populate_SiRallyLinkDate.js
// Created by: Jeff Oliver
//
// Function:  	Populate the Rally Linked Date field on Service Issues when Rally ID is populated
//
// Revision Log:
//		eabramo	2017-11-30	created final version of script
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////

function RallyLinkDate( )
{
	nlapiLogExecution('DEBUG', 'RallyLinkDate function', 'Begin function');
	// PART 1:  Populate Rally Link Date if it has Rally #
	// Create Search
	var RallyLinkDate_filters = new Array();
	RallyLinkDate_filters[0] = new nlobjSearchFilter('custrecord_rally_no', null, 'isnotempty'); // has a Rally ID
	RallyLinkDate_filters[1] = new nlobjSearchFilter('custrecord_rally_link_date', null, 'isempty'); // doesn't have a Rally Date
	var RallyLinkDate_columns = new Array();
	RallyLinkDate_columns[0] = new nlobjSearchColumn('internalid', null, null);
	// Execute search
	RallyLinkDate_searchResults = nlapiSearchRecord('customrecord36', null, RallyLinkDate_filters, RallyLinkDate_columns);
	if (RallyLinkDate_searchResults)
	{
		nlapiLogExecution('DEBUG', 'Part 1: Number of SI to set Rally Link Date:', RallyLinkDate_searchResults.length);
		for (var x=0; RallyLinkDate_searchResults != null && x < RallyLinkDate_searchResults.length; x++ )
		{
			var SI_internalid = RallyLinkDate_searchResults[x].getValue('internalid');
			nlapiLogExecution('DEBUG', 'Update RallyLinkeDate', 'ServiceIssue ID: '+SI_internalid);
			// Write date into the Rally Linked Date field
			var MyDate = new Date(); // returns in pacific time
			MyDate.setHours(MyDate.getHours() + 3); // convert to Eastern Time
			MyDate = nlapiDateToString(MyDate,'date');
			nlapiSubmitField('customrecord36', SI_internalid, 'custrecord_rally_link_date', MyDate);
		}
		nlapiLogExecution('DEBUG', 'Part 1 complete', 'No more SIs to Set RallyLinkDate');
	}
	// PART 2:  Clear Rally Link Date if it does NOT have a Rally #
	// Create Search
	var undoRallyLinkDate_filters = new Array();
	undoRallyLinkDate_filters[0] = new nlobjSearchFilter('custrecord_rally_no', null, 'isempty');
	undoRallyLinkDate_filters[1] = new nlobjSearchFilter('custrecord_rally_link_date', null, 'isnotempty');
	var undoRallyLinkDate_columns = new Array();
	undoRallyLinkDate_columns[0] = new nlobjSearchColumn('internalid', null, null);
	// Execute search
	undoRallyLinkDate_Results = nlapiSearchRecord('customrecord36', null, undoRallyLinkDate_filters, undoRallyLinkDate_columns);
	if (undoRallyLinkDate_Results)
	{
		nlapiLogExecution('DEBUG', 'Part 2: Number of SI to unset RallyLinkDate:', undoRallyLinkDate_Results.length);
		for (var x=0; undoRallyLinkDate_Results != null && x < undoRallyLinkDate_Results.length; x++ )
		{
			var SI_internalid = undoRallyLinkDate_Results[x].getValue('internalid');
			nlapiLogExecution('DEBUG', 'Undo Rally Linked Date', 'ServiceIssue ID: '+SI_internalid);
			// Clear the Rally Linked Date field
			nlapiSubmitField('customrecord36', SI_internalid, 'custrecord_rally_link_date', '');		
		}
		nlapiLogExecution('DEBUG', 'Part 2 complete', 'No more SIs to UnSet RallyLinkDate');		
	}
}
