function geoMarketFieldChanged(type, name)
{
	if (name == 'custrecord_geo_eis_inactive')
	{
		nlapiSetFieldValue('isinactive','F');
	}
}

function geoMarketFormSave()
{
	var this_record = nlapiGetRecordId()
	
	// Validate that Geo Market Name is Unique
	var code = nlapiGetFieldValue('name');
	var Filter = new Array();
	Filter[0] = new nlobjSearchFilter('name', null, 'is', code);
	Filter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var Column = new nlobjSearchColumn('id');
	// perform the search
	var SearchResult = nlapiSearchRecord('customrecord81', null, Filter, Column);
	if(SearchResult != null)
	{
		alert('Error: this GeoMarket already exists');
		return(false);
	}	

	// validate that Name is within 100 chars
	if (nlapiGetFieldValue('name').length > 100)
	{
		alert('Please limit the Geo Market name to be within 100 characters');
		return false;
	}
	
	// Validate that Geo Market Code is Unique
	var gm_code = nlapiGetFieldValue('custrecord_geo_code');
	var gmFilter = new Array();
	gmFilter[0] = new nlobjSearchFilter('custrecord_geo_code', null, 'is', gm_code);
	gmFilter[1] = new nlobjSearchFilter('id', null, 'notequalto', this_record);
	var gmColumn = new nlobjSearchColumn('id');
	// perform the search
	var gmSearchResult = nlapiSearchRecord('customrecord81', null, gmFilter, gmColumn);
	if(gmSearchResult != null)
	{
		alert('Please enter a different GeoMarket Code. Another GeoMarket already uses the code entered');
		return(false);
	}
	
	// Validate that no inactive child records exist -- child record is Sales Group	
	// only check when this record isn't brand new
	if (this_record != "" && this_record != null)	
	{
		var setto_inactive = nlapiGetFieldValue('custrecord_geo_eis_inactive');
		if (setto_inactive == 'T')
		{
			var gmFilter2 = new Array();
			gmFilter2[0] = new nlobjSearchFilter('custrecord_salesgroup_geomarket', null, 'anyof', this_record);
			gmFilter2[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');			
			var gmColumn2 = new nlobjSearchColumn('id');
			// perform the search
			var gmSearchResult2 = nlapiSearchRecord('customrecord_sales_group', null, gmFilter2 , gmColumn2);
			if(gmSearchResult2)
			{
				alert('You cannot inactivate a Geo Market until all child Sales Group records are moved to another Geo Market or are inactivated.');
				return(false);
			}
		}
	}

	nlapiSetFieldValue('custrecord_geo_isupdated', 'T');
	return(true);
}
