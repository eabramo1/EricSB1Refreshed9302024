function salesGroupFieldChanged(type, name)
{
	if (name == 'custrecord_salesgroup_eis_inactive')
	{
		nlapiSetFieldValue('isinactive','F');
	}	
}

function salesGroupFormSave()
{
	var this_record = nlapiGetRecordId()

	// Validate that Sales Group Name is Unique
	var code = nlapiGetFieldValue('name');
	var Filter = new Array();
	Filter[0] = new nlobjSearchFilter('name', null, 'is', code);
	Filter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var Column = new nlobjSearchColumn('id');
	// perform the search
	var SearchResult = nlapiSearchRecord('customrecord_sales_group', null, Filter, Column);
	if(SearchResult != null)
	{
		alert('Error: this Sales Group already exists');
		return(false);
	}
	
	// validate under 100 chars
	if (nlapiGetFieldValue('name').length > 100)
	{
		alert('Please limit the Sales Group name to be within 100 characters');
		return false;
	}	

	// Validate that Sales Group Code is Unique
	var sg_code = nlapiGetFieldValue('custrecord_sales_group_code');
	var sgFilter = new Array();
	sgFilter[0] = new nlobjSearchFilter('custrecord_sales_group_code', null, 'is', sg_code);
	sgFilter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var sgColumn = new nlobjSearchColumn('id');
	// perform the search
	var sgSearchResult = nlapiSearchRecord('customrecord_sales_group', null, sgFilter, sgColumn);
	if(sgSearchResult != null)
	{
		alert('Please enter a different Sales Group Code. Another Sales Group already uses the code entered');
		return(false);
	}
	
	// Validate that no inactive child records exist -- child record is Sales Group	
	// only check when this record isn't brand new
	if (this_record != "" && this_record != null)
	{
		var setto_inactive = nlapiGetFieldValue('custrecord_salesgroup_eis_inactive');
		if (setto_inactive == 'T')
		{
			var sgFilter2 = new Array();
			sgFilter2[0] = new nlobjSearchFilter('custrecord_ep_territory_sales_group', null, 'anyof', this_record);
			sgFilter2[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			var sgColumn2 = new nlobjSearchColumn('id');
			// perform the search
			var sgSearchResult2 = nlapiSearchRecord('customrecord83', null, sgFilter2 , sgColumn2);
			if(sgSearchResult2)
			{
				alert('You cannot inactivate a Sales Group until all child EP Territory records are moved to another Geo Market or are inactivated.');
				return(false);
			}
		}
	}
	
	nlapiSetFieldValue('custrecord_sales_group_isupdated', 'T');
	return(true);
}