//
// Script:     Scheduled_customeraddresscontrol.js
//
// Created by: Christine Neale 
//
// Functions:  	1. Clears down old Customer Address Control records 
//     
//
// Revisions:  
//	

function deleteOldRecords( type )
{
 //only execute when run from the scheduler 
	if ( type != 'scheduled' && type != 'skipped' )
	{
		return; 
	}
	  
// Locate Records 2 or more days old (note: cannot use 'yesterday' as might be as recent as 1 minute ago).  
	var crfilters = new Array();
	crfilters[0] = nlobjSearchFilter('lastmodified', null, 'onOrBefore', 'twoDaysAgo');
	var crcolumns = new Array();
	var crlen;
	crcolumns[0] = new nlobjSearchColumn('id', null, null);  
	crsearchResults = nlapiSearchRecord('customrecord_cust_add_control', null, crfilters, crcolumns);
	if (crsearchResults)
	{
		crlen = crsearchResults.length;
		for (var i = 0; i < crlen; i++) 
		{
			nlapiDeleteRecord('customrecord_cust_add_control', crsearchResults[i].getId());
		}
	}
}
	