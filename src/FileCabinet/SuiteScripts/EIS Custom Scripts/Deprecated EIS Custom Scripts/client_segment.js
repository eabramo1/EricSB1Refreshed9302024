function segmentFieldChanged(type, name)
{
	if (name == 'custrecord_segment_inactive')
	{
		nlapiSetFieldValue('isinactive','F');
	}
}

function segmentFormSave()
{
	var this_record = nlapiGetRecordId()
	
	// Validate that Segment Abbreviation is Unique
	var segment_abbrev = nlapiGetFieldValue('custrecord_segment_abbreviation');
	var abbrevFilter = new Array();
	abbrevFilter[0] = new nlobjSearchFilter('custrecord_segment_abbreviation', null, 'is', segment_abbrev);
	abbrevFilter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var abbrevColumn = new nlobjSearchColumn('id');
	// perform the search
	var abbrevSearchResult = nlapiSearchRecord('customrecord1', null, abbrevFilter, abbrevColumn);
	if(abbrevSearchResult != null)
	{
		alert('Please enter a different Segment Abbreviation. Another segment already uses the abbreviation entered');
		return(false);
	}
	
	// Validate that Segment Code is Unique
	var segment_code = nlapiGetFieldValue('custrecord_segment_code');
	var codeFilter = new Array();
	codeFilter[0] = new nlobjSearchFilter('custrecord_segment_code', null, 'is', segment_code);
	codeFilter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var codeColumn = new nlobjSearchColumn('id');
	// perform the search
	var codeSearchResult = nlapiSearchRecord('customrecord1', null, codeFilter, codeColumn);
	if(codeSearchResult != null)
	{
		alert('Please enter a different Segment Code. Another segment already uses the Segment Code entered');
		return(false);
	}
	
	// set the isUpdated
	nlapiSetFieldValue('custrecord_segment_isupdated', 'T');
	return(true);
}
		