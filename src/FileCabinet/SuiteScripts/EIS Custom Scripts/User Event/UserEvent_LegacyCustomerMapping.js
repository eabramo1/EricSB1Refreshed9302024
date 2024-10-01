//
// Script:     serverLegacyCustomerMapping.js
//
// Created by: Christine Neale, EBSCO  06/05/2016
//
//
// Functions:   	1. lcmAfterSubmit - after submit processing 
//	
//
//
// Revisions:  
//               
//	
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: lcmAfterSubmit
// Called:  After submit of Legacy Customer Mapping record
// Purpose: 1. If a MainFrame Account is being flagged as Inactive then flag all associated mappings as inactive.

function lcmAfterSubmit(type)
{
	
	if (type == 'edit')
	{
		var currentRecord = nlapiGetNewRecord();
		var lmId = nlapiGetRecordId();
		var isinact = currentRecord.getFieldValue('isinactive');
		var lmtyp = currentRecord.getFieldValue('custrecord_legacy_system_name');
		
		if (isinact == 'T' && lmtyp == 1)
		// Inactive mainframe account	
		{
			// Find related mappings

			// filters
			var lmfilters = new Array();
			lmfilters[0] = new nlobjSearchFilter('custrecord_legacy_account', null,'anyof', lmId);
			lmfilters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

			// column
			var lmcolumns = new Array();
			lmcolumns[0] = new nlobjSearchColumn('name', null, null);
			//execute my search
			var lm_searchresults = nlapiSearchRecord('customrecord_legacy_mapping', null, lmfilters, lmcolumns);
			
			// loop through the results
			for ( var i = 0; lm_searchresults != null && i < lm_searchresults.length; i++ )
			{
				// get result values
				var lm_searchresult = lm_searchresults[ i ];
				var recId = lm_searchresult.getId();
				try
				{
					// Flag as Inactive
					nlapiSubmitField('customrecord_legacy_mapping', recId, 'isinactive', 'T');
				}
				catch(ex)
				{
					//log the error information
			 		nlapiLogExecution('ERROR', ex.getCode(), ex.getDetails());
			 		//log the mapping id if an error occurred
			 		nlapiLogExecution('ERROR', 'LegMapId', recId);
				}
			}
		}
	}
}