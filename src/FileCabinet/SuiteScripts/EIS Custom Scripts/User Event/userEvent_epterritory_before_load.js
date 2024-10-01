function serverEPTerritoryBeforeLoad()
{	// Don't run code if Web Service role or User
	if ( nlapiGetContext().getRole() != 1025 && nlapiGetContext().getUser() != 452592 )
	{	// only run code if this is pre-existing record -- not for creation of new record
		if (nlapiGetRecordId() != "" && nlapiGetRecordId() != null)
		{	
			// retreive the value of the sourced GeoMarket field in this EP Territory record
			var thisGeoMarket = nlapiGetFieldValue('custrecord_territory_geomarket_sourced');
			// Do a lookup of Global Region within the GeoMarket record 'customrecord81'
			var currentGlobalRegion = nlapiLookupField('customrecord81', thisGeoMarket, 'custrecord_geomarket_global_region', null)
			nlapiSetFieldValue('custrecord_terr_global_region_prefill', currentGlobalRegion);
		}
	}
}
