/*
* Script:     test_only_system_notes_search.js
* 
* Created by: Eric Abramo
* 
* Functions:  	system_notes_search_test
*		create scripted search on System Notes
*		Find SI System Notes on the Rally # field is not empty
* 
* 
*/

/*
function system_notes_search_test()
{
	nlapiLogExecution('DEBUG', 'function system_notes_search_test', 'Begin');
	// Create Search
	var sn_filters = new Array();
	sn_filters[0] =	new nlobjSearchFilter('RECORDTYPE', null, 'is', 'Service Issue');	
	// sn_filters[1] =	new nlobjSearchFilter('RECORD_ID', null, 'is', '140735');	
	sn_filters[1] = new nlobjSearchFilter('FIELD', null, 'is', 'Rally #');
	sn_filters[2] =	new nlobjSearchFilter('NEWVALUE', null, 'is', '52618681594');
	var sn_columns = new Array();
	// sn_columns[0] = new nlobjSearchColumn('recordid', null, null);
	sn_columns[0] = new nlobjSearchColumn('DATE', null, null);
	sn_columns[1] = new nlobjSearchColumn('RECORD', null, null);
	sn_columns[2] = new nlobjSearchColumn('OLDVALUE', null, null);
	sn_columns[3] = new nlobjSearchColumn('NEWVALUE', null, null);
	//execute my search
	systemNotes_searchResults = nlapiSearchRecord('SystemNote', null, sn_filters, sn_columns);
	if (systemNotes_searchResults)
	{
		nlapiLogExecution('DEBUG', 'Number of Records Returned:', systemNotes_searchResults.length);
		for (var x=0; systemNotes_searchResults != null && x < systemNotes_searchResults.length; x++ )
		{
			// var si_id = systemNotes_searchResults[x].getValue('RECORD_ID');
			var rallynumber_date = systemNotes_searchResults[x].getValue('DATE');
			// var rallynumber_record = systemNotes_searchResults[x].getValue('RECORD');
			var rallynumber_oldvalue = systemNotes_searchResults[x].getValue('OLDVALUE');
			nlapiLogExecution('DEBUG', 'test. rallynumber_date is: '+ rallynumber_date, 'The rallynumber_oldvalue is: '+rallynumber_oldvalue);
		}
	}
}
*/

function system_notes_search_test()
{
	// Create Search
	var sn_filters = new Array();
	sn_filters[0] =	new nlobjSearchFilter('RECORDTYPE', null, 'anyof', 36); //36 is the Service Issue custom record internal ID.	
	sn_filters[1] =	new nlobjSearchFilter('RECORDID', null, 'equalto', 140735);
	sn_filters[2] = new nlobjSearchFilter('FIELD', null, 'anyof', 'CUSTRECORD_RALLY_NO'); //ID of the Rally # custom field.
	sn_filters[3] =	new nlobjSearchFilter('NEWVALUE', null, 'isnotempty');
	//sn_filters[4] =	new nlobjSearchFilter('DATE', null, 'on', '5/3/2016');
	var sn_columns = new Array();
	sn_columns[0] = new nlobjSearchColumn('RECORDID', null, null);
	sn_columns[1] = new nlobjSearchColumn('DATE', null, null);
	//execute my search
	var systemNotes_searchResults = nlapiSearchRecord('SystemNote', null, sn_filters, sn_columns);
	if (systemNotes_searchResults)
	{
		nlapiLogExecution('DEBUG', 'Number of Records Returned:', systemNotes_searchResults.length);
		for (var x=0; systemNotes_searchResults != null && x < systemNotes_searchResults.length; x++ )
		{
			var si_id = systemNotes_searchResults[x].getValue('RECORDID'); // What is the correct way to retrieve the ID?
			var rallynumber_date = systemNotes_searchResults[x].getValue('DATE');
			nlapiLogExecution('DEBUG', 'the Service Issue ID is: '+si_id, 'The rallynumber_date is: '+rallynumber_date);
		}
	}
}