 // Script:		scheduled_forceupdate_marketo_accessitems.js
// Created by:	eabramo
// 
// Summary:	Main function: scheduled_forceupdate_marketo_accessitems()
//			1) Run saved search1 to determine if any Items were changed today - and have had their 'Send Accessing Item to Marketo' flagged to true
//			2) For each result found - run subsequent saved search2 (function forceModify_accItem) for this Item fetch all Accessing Items with
//				End Date in future - and where ForceModify is false (so search doesn't pick up acc. items that may have already been picked up)
//			3) For each result found in search2:  update the Accessing Item record by setting the ForceUpdate flag to true.  This last action changes 
//				the record's Last Modified Date - which allows it to be picked up in the weekly Accessing Items search which sends data into the 
//				vertify repository and subsequently to Marketo.
//						
// Post To Production:		02/05/2019
// Revisions:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function scheduled_forceupdate_marketo_accessitem()
{
	nlapiLogExecution('DEBUG', 'function scheduled_sync_marketo_merged_entities begins');
	// search created in UI. this search is called "System search: Send Accessing Item to Marketo modified today [do not alter]"
	// var sendToMarketo_items = nlapiLoadSearch('noninventoryitem', 51657);  // SB1-refresh-2024-09-30
	// var sendToMarketo_items = nlapiLoadSearch('noninventoryitem', 48987);  // SB3
	var sendToMarketo_items = nlapiLoadSearch('noninventoryitem', 51888);   // prod
	var sendToMarketo_itemsResultSet = sendToMarketo_items.runSearch();
	// Iterate thru results using method .forEachResult - call 'forceModify_accItem' function
	sendToMarketo_itemsResultSet.forEachResult(forceModify_accItem);
}

// function sets the ForceModify field on the Accessing Item
function forceModify_accItem(eachResult)
{	
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();	
		
	var this_item = eachResult.getValue('internalid');	
	nlapiLogExecution('DEBUG', 'sub-routine begins- evaluate Item', 'this_item is: '+this_item);
	// Create Search for Finding all relevant Accessing Items for this_item
	var accItem_filters = new Array();
	accItem_filters[0] = new nlobjSearchFilter('custrecord_ai_item', null, 'anyof', this_item);
	accItem_filters[1] = new nlobjSearchFilter('custrecord_ai_end', null, 'onorafter', 'today');
	accItem_filters[2] = new nlobjSearchFilter('custrecord_force_modify', null, 'is', 'F');
	var accItem_columns = new Array();
	accItem_columns[0] = new nlobjSearchColumn('internalid', null, null);
	//execute search
	var accItem_results = that.recordSearcher.search('customrecord60', null, accItem_filters, accItem_columns);
		// However this scheduled search is designed to just pick up the rest of the results the next time it runs
		// so we shouldn't need to handle it within one run of the scheduled script
	if (accItem_results && accItem_results.length > 0)
	{
		nlapiLogExecution('DEBUG', 'accItem_results found', 'this_item is: '+this_item);
		for (var x=0; accItem_results != null && x < accItem_results.length; x++ )
		{
			var this_accItem = accItem_results[x].getValue('internalid');
			// nlapiLogExecution('DEBUG', 'set Force Modify field', 'this_accItem is: '+this_accItem);
			nlapiSubmitField('customrecord60', this_accItem, 'custrecord_force_modify', 'T');
		}
		nlapiLogExecution('DEBUG', 'sub-routine is complete', 'Force Modify updated for '+x+' Accessing Items for item '+this_item);

		// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
		nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
		if(nlapiGetContext().getRemainingUsage() < 100) 
		{
			nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			nlapiLogExecution('DEBUG', '*** Yielding ***', this_accItem);
			nlapiSetRecoveryPoint();
			nlapiYieldScript();
			nlapiLogExecution('DEBUG ', '*** Resuming from Yield ***', this_accItem);
		}
	}
	else
	{
		nlapiLogExecution('DEBUG', 'sub-routine is complete', 'No Accessing Items have been modified for item '+this_item);
	}	
	return true;
}
