function packageNameLoad()
{	// Load the Opportunity ID into a Custom field
	// It must be loaded here because the custom field is used for Filtering the Package Name list in Item section
	// Filter won't work off of the Opportunity field for some stupid reason
	if (nlapiGetFieldValue('custrecord_package_opportunity') != '' && nlapiGetFieldValue('custrecord_package_opportunity') != null )
	{
		if (nlapiGetFieldValue('custrecord_oppty_id_sourced') == '' || nlapiGetFieldValue('custrecord_oppty_id_sourced') == null)
			{
				var oppty = nlapiGetFieldValue('custrecord_package_opportunity');
				nlapiSetFieldValue('custrecord_oppty_id_sourced', oppty);
			}
	}
	if (nlapiGetRecordId() != '' && nlapiGetRecordId() != null)
	{	// if not created new
		// Search if Any Opportunity Items are using this Package
		// If yes, then lock down the Discount field - because changing Package Discount here can't affect Oppty Items
		// Create Search 
		var cur_record = nlapiGetRecordId();
		var pack_filters = new Array();
		pack_filters[0] = new nlobjSearchFilter('mainline', null, 'is', 'F');
		pack_filters[1] = new nlobjSearchFilter('custcol_include_in_package', null, 'anyof', cur_record);	
		var pack_columns = new Array();
		pack_columns[0] = new nlobjSearchColumn('internalid', null, null);
		// execute my search
		pack_searchResults = nlapiSearchRecord('transaction', null, pack_filters, pack_columns);
		if (pack_searchResults)
		{	// alert('found results');
			nlapiDisableField('custrecord_package_discount', true);
		}
	}
}

function packageNameSave()
{
	// Validate you don't Have a Duplicate Name under same Oppty
	var pname = nlapiGetFieldValue('name');
	var oppty = nlapiGetFieldValue('custrecord_package_opportunity');
		if (oppty != '' && oppty != null) 
		{
			var package_filters = new Array();
			package_filters[0] = new nlobjSearchFilter('name', null,'is', pname);
			package_filters[1] = new nlobjSearchFilter('custrecord_package_opportunity', null,'is', oppty);
			package_filters[2] = new nlobjSearchFilter('id', null, 'notequalto', nlapiGetRecordId());
			var package_columns = new Array();
			package_columns[0] = new nlobjSearchColumn('id', null, null);
			var package_searchResults = nlapiSearchRecord('customrecord_oppty_package', null, package_filters, package_columns);
			// If there are results... 
			if(package_searchResults != null)
			{
				alert('This Package name already exists under this Opportunity.  You must use a different name');
				return false;
			}
		}
	// Limit the package name to 25 characters
	if (pname.length > 25)
	{
		alert('You must limit your Package Name to 25 characters or less');
		return false;	
	}

	// Load the Opportunity ID into Custom field	
	if (nlapiGetFieldValue('custrecord_oppty_id_sourced') == '' || nlapiGetFieldValue('custrecord_oppty_id_sourced') == null)
	{
	 	var oppty = nlapiGetFieldValue('custrecord_package_opportunity');
	 	nlapiSetFieldValue('custrecord_oppty_id_sourced', oppty);
	}	
	return true;		
}