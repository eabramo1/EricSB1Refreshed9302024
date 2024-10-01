/* *************************************************************************************************************************
 * 
 *	Script:     scheduled_deleteMarketoActivities.js
 *    
 *  Created:	12-05-19
 *  
 *  Description:	Script reads in deployment parameters which indicate the following:
 *  					A) cutoffActivityDate   AND/OR   B) obsoleteActivityType
 *  				The script then performs a search to retrieve MarketoActivity records with
 *  					1) timestamps prior to the cutoffActivitydate (if specified)
 *  					2) activityType equal to obsoleteActivityType (if specified)
 *  				The script then loops through the search results and deletes each MarketoActivity record that meet the criteria.
 *  				If the governance max is being approached, the script yields and reschedules itself
 *  
 *  Functions:		find_and_delete_mkto_activity_records		
 *  
 *  Parameters:		cutoffActivityDate  AND   obsoleteActivityType  -- specified in script deployment record
 *  
 *   
 * 	Library Scripts Used:	library_utility.js 
 *  
 *  Revisions:		
 *  12-05-19		CMM - Script created
 *  12-07-19		CMM - Script updated to use new library_utility function L_recordSearcher_withMax.  Maximum number
 *  				of records to be returned by the search will be set at 225,000.  Since the actual search criteria 
 *  				could potentially return millions of records in certain cases, we need to limit how many we process
 *  				at a time in order to avoid an SS_EXCESSIVE_MEMORY_FOOTPRINT error being thrown by the scheduled script.
 *  				(Note:  Netsuite has a maximum script memory size of 50Mg so we need to stay under this max.)
 * 
 * ************************************************************************************************************************/

var MAX_RECORDS_TO_BE_RETURNED = 225000;

function find_and_delete_mkto_activities()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcherWithMax = new L_recordSearcher_withMax();	
		
	//var cutoffDateParm = nlapiDateToString(new Date('12/29/1962'));   //set default
	var cutoffDateParm = null;
	var obsoleteTypeParm = null;
	
	if(nlapiGetContext().getSetting('SCRIPT', 'custscript_cutoff_date_parm') !='' && nlapiGetContext().getSetting('SCRIPT', 'custscript_cutoff_date_parm') != null)
    {		
		//cutoffDateParm = nlapiDateToString(nlapiGetContext().getSetting('SCRIPT', 'custscript_cutoff_date_parm')); 
		cutoffDateParm = nlapiGetContext().getSetting('SCRIPT', 'custscript_cutoff_date_parm');
		nlapiLogExecution('audit', 'INPUT PARAMETER custscript_cutoff_date_parm:', cutoffDateParm );
    }
	else nlapiLogExecution('audit', 'INPUT PARAMETER custscript_cutoff_date_parm:', 'is empty' );

	if(nlapiGetContext().getSetting('SCRIPT', 'custscript_obsolete_type_parm') !='' && nlapiGetContext().getSetting('SCRIPT', 'custscript_obsolete_type_parm') != null)
    {		
		obsoleteTypeParm = nlapiGetContext().getSetting('SCRIPT', 'custscript_obsolete_type_parm');
		nlapiLogExecution('audit', 'INPUT PARAMETER custscript_obsolete_type_parm:',  obsoleteTypeParm);
    }
	else nlapiLogExecution('audit', 'INPUT PARAMETER custscript_obsolete_type_parm:',  'is empty');
	     
    var totalRecsFound = 0;				
    var totalRecsDeleted = 0;
		
	var filters = new Array();	
	if(cutoffDateParm) {
		 filters.push(new nlobjSearchFilter('custrecord_muv_activitydatetime', null, 'before', cutoffDateParm));
	}
	if(obsoleteTypeParm) {
		filters.push(new nlobjSearchFilter('custrecord_muv_activitytype', null, 'is', obsoleteTypeParm));
	}
    	    
    var activityCols = new Array();
	activityCols.push( new nlobjSearchColumn('internalid').setSort(false));
    //activityCols.push( new nlobjSearchColumn('custrecord_muv_activitydatetime'));
    //activityCols.push( new nlobjSearchColumn('custrecord_muv_activitytype'));
       
    var mktoActivitySearch_results = that.recordSearcherWithMax.search('customrecord_muv_marketoactivity', null, filters, activityCols, MAX_RECORDS_TO_BE_RETURNED);
	
    nlapiLogExecution('audit', 'Ran Max Search ');	
    
  //If we got results, process each one 
	if(mktoActivitySearch_results) {
		nlapiLogExecution('audit', 'Total Marketo Activity records found by search:',mktoActivitySearch_results.length);
		for(var z=0; z < mktoActivitySearch_results.length; z++)
		   {
				var result=mktoActivitySearch_results[z];
			    var resultColumns=result.getAllColumns();
		
			    // get the data from this search result row
			    var internalActivityID = result.getValue(resultColumns[0]);
			    //nlapiLogExecution('audit', '>> Within results loop, internalID:',  internalActivityID);			  
			   		    
				//delete the MKTO Activity record
			    nlapiDeleteRecord('customrecord_muv_marketoactivity', internalActivityID);
				totalRecsDeleted++;
				
				if (totalRecsDeleted % 5000 == 0)
					nlapiLogExecution('audit', '*** CURRENT COUNT OF RECORDS DELETED ***', totalRecsDeleted);					
		
				// This section handles checking the governance and resumes at the same spot if we are running out of governance...
				var context = nlapiGetContext();
				if(context.getRemainingUsage() < 100) 
				{
					nlapiLogExecution('audit', '!!! LOW USAGE !!! Set RecoveryPoint at internal ID = ' +internalActivityID, 'Remaining usage = '+context.getRemainingUsage());
					var recoveryState = nlapiSetRecoveryPoint();
					//nlapiLogExecution('audit', '*** RecoveryPoint.status ***', recoveryState.status);
					//nlapiLogExecution('audit', '*** RecoveryPoint.size ***', recoveryState.size);					
					
					if (recoveryState.status == 'SUCCESS') {
						//nlapiLogExecution('audit', '*** YIELD CURRENT SCRIPT ***', 'internal ID='+internalActivityID);
						var yieldState = nlapiYieldScript();						
						//nlapiLogExecution('audit', '*** Yield.status ***', yieldState.status);
						nlapiLogExecution('audit', '*** Resuming from Yield ***', 'internal ID='+internalActivityID);
					}
					else {
						nlapiLogExecution('audit', '*** RecoveryPoint.status ***', recoveryState.status);
						nlapiLogExecution('audit', '*** RecoveryPoint.reason ***', recoveryState.reason);
						nlapiLogExecution('audit', '*** RecoveryPoint.size ***', recoveryState.size);		
						nlapiLogExecution('audit', 'Script Failing... total Marketo Activity records deleted so far:',totalRecsDeleted);				
					}
				}				
		   }		
	}
	else nlapiLogExecution('audit', 'Total records found by search:','0');

	nlapiLogExecution('audit', 'Total Marketo Activity records deleted:',totalRecsDeleted);

	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');
}