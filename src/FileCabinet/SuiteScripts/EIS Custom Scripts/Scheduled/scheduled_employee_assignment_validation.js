// Script:			scheduled_employee_assignment_validation.js
// Created by:		eabramo
// Associated with:  	Employee Record
// 
// Summary:		This script validates that the Team/Segment/Territory combinations on active Sales Assignment records 
//					aren't duplicates of other active Sales Assignment records
//				It uses the 'Validated for No Dupes' (custrecord_valid_nodupes) checkbox.  If unchecked it needs a validation.
//				This script checks 'Validated for No Dupes' when an Assignment record is validated
//					- or populates a 'Needs Attention' field when it is not validated.
//				Note that some Assignment records with lower numbers of Team/Segment/Territory combinations get validated (and checked) via client script
//				Note that there's also a User Event After Submit Employee script that runs and sets the 'Validated for No Dupes' checkbox to unchecked
//					in the instance when a user changes an Employee Team.
//
// Functions:   	find_sales_assign_needing_validation()
//					
// Library Scripts used:	library_utility
//			
//
// Date Created:  12/2019 
//
// Revisions:		
//
//
//
//
//
//
//
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


function find_sales_assign_needing_validation()
{
	nlapiLogExecution('DEBUG', 'Begin Function find_sales_assign_needing_validation');

	var that1 = this;
	this.recordSearcher = new L_recordSearcher();	
	
	// run the search 
	// var sass_search = nlapiLoadSearch('customrecord_sales_assignment', 'customsearch_sassign_needs_validation');
	var sass_search_results  = that1.recordSearcher.search('customrecord_sales_assignment', 'customsearch_sassign_needs_validation');
	// var sass_search_results = sass_search.runSearch();
	// call separate function to search the dupes
	if (sass_search_results)
	{
		for(var z=0; z < sass_search_results.length; z++)
		{
			// Required for Library script function call
			var that2 = this;
			this.recordSearcher = new L_recordSearcher();	
			
			// populate variables
			var this_sass = sass_search_results[z].getValue('internalid');
			var curr_team = sass_search_results[z].getValue('custrecord_assigned_team');
			var curr_segments_value = sass_search_results[z].getValue('custrecord_salesassign_segments');
			var curr_segments = curr_segments_value.split(",");
			var curr_segments_length = curr_segments.length;
			var curr_territories_value = sass_search_results[z].getValue('custrecord_salesassign_territories');
			var curr_territories = curr_territories_value.split(",");
			var curr_territories_length = curr_territories.length;
			var dupe_found = null;
			nlapiLogExecution('DEBUG', 'Evaluate Sass', 'this_sass is: '+this_sass);

			// nlapiLogExecution('DEBUG', 'value of curr_segments is: '+curr_segments, 'the value of curr_territories is: '+curr_territories);
			// nlapiLogExecution('DEBUG', 'curr_segments_length is '+ curr_segments_length, 'curr_territories_length is '+curr_territories_length);
			// create search filters for each segment/territory/team combo
			for(s = 0; s < curr_segments_length; s++)
			{
				// nlapiLogExecution('DEBUG', 'in Segment for loop. curr_segments[s] is ', curr_segments[s]);
				var dupecheck_filters = new Array();
				dupecheck_filters[0] = new nlobjSearchFilter('internalid', null, 'noneof', this_sass);
				dupecheck_filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
				dupecheck_filters[2] = new nlobjSearchFilter('custrecord_assigned_team', null, 'anyof', curr_team);
				dupecheck_filters[3] = new nlobjSearchFilter('custrecord_salesassign_segments', null, 'anyof', curr_segments[s]);		
				for (t = 0; t < curr_territories_length; t++)
				{			
					dupecheck_filters[4] = new nlobjSearchFilter('custrecord_salesassign_territories', null, 'anyof', curr_territories[t]);
					var dupecheck_columns = new Array();
					dupecheck_columns[0] = new nlobjSearchColumn('internalid', null, null);
					dupecheck_columns[1] = new nlobjSearchColumn('custrecord_salesassign_employee', null, null);
					// Run Search
					var dupecheck_results = that2.recordSearcher.search('customrecord_sales_assignment', null, dupecheck_filters, dupecheck_columns);
					// var dupecheck_results = nlapiSearchRecord('customrecord_sales_assignment', null, dupecheck_filters, dupecheck_columns); // old way without record searcher
					if (dupecheck_results)
					{			
						for (var x=0; dupecheck_results != null && x < dupecheck_results.length; x++ )
						{
							var dupe_sass = dupecheck_results[x].getValue('internalid');
							nlapiLogExecution('DEBUG', 'dupes found this_sass is: '+this_sass, 'the dupe_sass is '+dupe_sass);
							nlapiLogExecution('DEBUG', 'curr_segments[s] is '+curr_segments[s], 'curr_territories[t] is '+curr_territories[t]);
							dupe_found = true;
							// break; // break out of territory loop - commented out because there could be many dupes for one SASS
							// set flags on the dupe_sass record - the record found as a dupe
							nlapiSubmitField('customrecord_sales_assignment', dupe_sass, 'custrecord_valid_nodupes', 'F');  // set 'valid no dupe' to false
							nlapiSubmitField('customrecord_sales_assignment', dupe_sass, 'custrecord_seg_terr_team_dupe', 'T'); // set 'dupe exists' to true
						}	
					}
				
					// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
					// nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
					if(nlapiGetContext().getRemainingUsage() < 110) 
					{
						nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
						nlapiLogExecution('DEBUG', '*** Yielding ***', 'this_sass '+this_sass+'. curr_segments[s] '+curr_segments[s]+'. curr_territories[t] is '+curr_territories[t]);
						nlapiSetRecoveryPoint();
						nlapiYieldScript();
						nlapiLogExecution('DEBUG', '*** Resuming from Yield ***', 'this_sass '+this_sass);
					}
				} // end the Territory 'for loop'
				
				//if (dupe_found == true)
				//{
				//	break;  // break out of segment loop - commented out because there could be many dupes for one SASS
				//}
				
			} // end the Segment 'for loop'
			
			// BEGIN SET FLAGS ON EXAMINED SALES ASSIGNMENT RECORDS *************************************************************
			if (dupe_found == true)
			{
				nlapiLogExecution('DEBUG', 'Dupes found for record: '+this_sass);
				// set flags on the sass record being examined
				nlapiSubmitField('customrecord_sales_assignment', this_sass, 'custrecord_valid_nodupes', 'F');	
				nlapiSubmitField('customrecord_sales_assignment', this_sass, 'custrecord_seg_terr_team_dupe', 'T');					
			}
			else
			{
				nlapiLogExecution('DEBUG', 'No dupes found for record: '+this_sass);
				nlapiSubmitField('customrecord_sales_assignment', this_sass, 'custrecord_valid_nodupes', 'T');				
			}
			//  END SET FLAGS ON EXAMINED SALES ASSIGNMENT RECORDS *************************************************************							
		}	
	}
	nlapiLogExecution('DEBUG', 'End Function find_sales_assign_needing_validation');
}