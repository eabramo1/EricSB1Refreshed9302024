// Script:     Scheduled_update_SI_noOfCases.js
// 			   
// Created by: Christine Neale
//
// Function:  This script reads through all open (not Resolved or Closed - unresolved) SIs and checks the no. of Cases 
//				attached via the "Cases" field and compares it to the no. of linked cases, if there is a discrepancy then
//           	it updates the no. of linked cases. 
//				The hope is this will identify case additions/removals from the SI performed outside of any record editing
// 				and the update will force the sync to EBSCO Connect that might otherwise have been missed. 
//				The risk might be that the no. of additions/removals in this way might be identical!!
//
//
// Library Scripts Used:	library_utility.js
//							library_constants.js
//
// Revisions:  
//		
//		CNeale		12/18/2018	US423877 Original version
//
//
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function update_num_linked_cases()
{
	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
	
	//Set search criteria to only retrieve Open SI's (i.e. not "Resolved" or "Closed - unresolved"
	var si_filters = new Array();
	si_filters[0] = new nlobjSearchFilter('custrecord_sistatus', null, 'noneof', [LC_SvcIssueSts.Resolved, LC_SvcIssueSts.Unresolved]);  
	// This filter used for testing... 
	//si_filters[1] = new nlobjSearchFilter('custrecord_sistatus', null, 'anyof', LC_SvcIssueSts.PMReview); // 14 = PM Review

	var si_columns = new Array();
 	si_columns[0] = new nlobjSearchColumn('custrecord_count_linked_cases');
 	si_columns[1] = new nlobjSearchColumn('custrecord_sicase'); 	
  	
	// Search SIs // Service Issue is customrecord36
 	// Use Celigo library function to return > 1000 rows
	var si_searchResults = that.recordSearcher.search('customrecord36', null, si_filters, si_columns);
	
    if (si_searchResults)
	{	// for each result of the SI Search
		for (var x=0; si_searchResults != null && x < si_searchResults.length; x++ )
		{	
			// get the Service Issue ID
			var si_id = si_searchResults[x].getId();
			nlapiLogExecution('debug', 'Internal ID', si_id);

			// get current value of the 'Number of Linked Cases' field
	 		var cur_linkedCases = Number(si_searchResults[x].getValue('custrecord_count_linked_cases'));
	 		
			// get the actual value of linked cases - store in "cases_count" variable
	 		var cases = si_searchResults[x].getValue('custrecord_sicase');
	 		var cases_count;
 			if (cases == "" || cases == null)
 			{	// convert a null to a zero
 				cases_count = 0;
 			}
 			else
 			{	// If cases field isn't empty need to push to Array and then get the length
 				var caseArray;
 				caseArray = cases.split(",");
				cases_count = caseArray.length;
 			}
			nlapiLogExecution('debug', 'cases', cases);
			nlapiLogExecution('debug', 'cases_count', cases_count);
			nlapiLogExecution('debug', 'cur_linkedCases', cur_linkedCases);
			// if real count is different than current value
			if (cases_count != cur_linkedCases)
			{	// populate cases_count into the "number of Linked Cases" field
				nlapiLogExecution('audit', 'Updating SI', si_id);
				nlapiSubmitField('customrecord36', si_id, 'custrecord_count_linked_cases', cases_count);
			}
			
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', si_id);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', si_id);
			}
		}	
	}
}