/******************************************************************************************************************************************************
 *  Script:		Scheduled_mapAnonymousMKTOActivity.js
 * 
 * Created by:	Kate McCormack
 * 
 * Function:	This script will look for Marketo Activity records that have been created by Vertify which have not yet been tied to a 
 * 				Customer or Contact record by the Vertify processing.  If an error occurs during the Vertify move process, it's possible
 * 				that the Customer or Contact value which the move tries to look up on the Lead record associated with this activity within
 * 				the Vertify repository is null.  So, this script will run a search to find those "Anonymous" Marketo Activity records and
 * 				then it will try to assign the Customer and Contact. Since many activity records can have the same MKTO Lead ID, this script
 * 				will keep track of which Lead IDs it has already searched for so that it doesn't perform unnecessary searches.
 * 
 * Library Scripts Used:	library_utility.js
 * 
 * Revisions:
 * 
 * 	K McCormack		03-08-2019	Created for US 483274 - Allow Anonymous Activity to flow from Marketo into NS.  Then run this scheduled script
 * 								periodically to try and find the Contact and/or Customer that should be tied to this activity.
 * 
 *  K McCormack		04-05-2019	Fix Bug of script not rescheduling itself when usage low.
 * 
 ******************************************************************************************************************************************************/


function mapAnonymousMKTOActivityRecs()
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	

	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();
		

	// search returns any Marketo Activity Records which haven't been assigned a Contact    
    var filters = new Array();	
    filters.push( new nlobjSearchFilter('custrecord_muv_activitydatetime', null, 'onorafter', 'monthsAgo2'));
    filters.push( new nlobjSearchFilter('custrecord_muv_contact',      null, 'anyof', '@NONE@'));
	filters.push( new nlobjSearchFilter('custrecord_muv_marketoleadid',null, 'isnotempty'));
	    
    var activityCols = new Array();
	activityCols.push( new nlobjSearchColumn('internalid').setSort(false));
    activityCols.push( new nlobjSearchColumn('custrecord_muv_marketoleadid'));
    activityCols.push( new nlobjSearchColumn('custrecord_muv_contact'));
    activityCols.push( new nlobjSearchColumn('custrecord_muv_customer'));
   
    var anonymousActivitySearch_results = that.recordSearcher.search('customrecord_muv_marketoactivity', null, filters, activityCols);
	
	nlapiLogExecution('audit', 'Ran Search ');	
	var leadsSearched = [];
	var numLeadsSearched = 0;
	var numCustAssigned = 0;
	var numContactAssigned = 0;
	
	//If we got results, process each one 
	if(anonymousActivitySearch_results) {
		nlapiLogExecution('audit', 'Total Anonymous Activity records found by search:',anonymousActivitySearch_results.length);
		for(var z=0; z < anonymousActivitySearch_results.length; z++)
		   {
		    var result=anonymousActivitySearch_results[z];
		    var resultColumns=result.getAllColumns();
	
		    // get the data from this search result row
		    var internalActivityID = result.getValue(resultColumns[0]);
			var muv_MKTO_leadid = result.getValue(resultColumns[1]);
			var muv_contact = result.getValue(resultColumns[2]);
			var muv_customer = result.getValue(resultColumns[3]);
			
			nlapiLogExecution('debug', '+ Next Activity muv_MKTO_leadid='+muv_MKTO_leadid+'  matches found so far='+numLeadsSearched);			 
			//nlapiLogExecution('debug', 'result('+(z+1)+').MKTO LeadID:', muv_MKTO_leadid);							
			//nlapiLogExecution('debug', 'result('+(z+1)+').muv_contact:', muv_contact);
			//nlapiLogExecution('debug', 'result('+(z+1)+').muv_customer:', muv_customer);	
			
			//reset local variables
			var mappingFound = false;
			var customerMatched = '';
			var contactMatched = '';
			
			//First see if we have already looked up this LeadID for another Activity Record.  If so, don't need to search again for it.
			 for(var i=0; i<numLeadsSearched && !mappingFound; i++) {
				 //nlapiLogExecution('debug', '**leadsSearched['+i+'].leadID='+leadsSearched[i].leadID);
				 if(leadsSearched[i].leadID == muv_MKTO_leadid) {
					 mappingFound = true;
					 contactMatched = leadsSearched[i].contactID;
					 customerMatched = leadsSearched[i].customerID;
					 nlapiLogExecution('debug', 'Lead '+muv_MKTO_leadid+' has already been searched...CustID matched='+customerMatched+'  ContactID matched='+contactMatched);
				 } 				           	
	          }	
			 
			 if(!mappingFound) {
				 //See if we have a Customer value set on this activity record.  If not, search for a Customer with this LeadID.
				if(muv_customer==null || muv_customer=='')
				{
					nlapiLogExecution('DEBUG','Searching for Customer with Lead='+muv_MKTO_leadid);
					var filters = new Array();
					filters.push(new nlobjSearchFilter('custentity_muv_marketoleadid',null,'is',muv_MKTO_leadid));
					filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
					var columns = new Array();
					columns.push(new nlobjSearchColumn('isinactive'));
					var results = nlapiSearchRecord('customer',null,filters,columns);
					
					if(results && results.length==1)
					{						
						mappingFound = true;
						nlapiLogExecution('DEBUG','Found customer: ' + results[0].getId());
						customerMatched = results[0].getId();
					}
					else nlapiLogExecution('DEBUG','Cust Search NO SINGLE MATCH FOUND');
				} 
				else customerMatched = muv_customer;				 
				
				 //See if we have a Contact value set on this activity record.  If not, search for a Contact with this LeadID.
				if(muv_contact==null || muv_contact=='')
				{
					nlapiLogExecution('DEBUG','Searching for Contact with Lead='+muv_MKTO_leadid);
					var filters = new Array();
					filters.push(new nlobjSearchFilter('custentity_muv_marketoleadid',null,'is',muv_MKTO_leadid));
					filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
					var columns = new Array();
					columns.push(new nlobjSearchColumn('company'));
					var results = nlapiSearchRecord('contact',null,filters,columns);					
					
					if(results && results.length==1)
					{						
						mappingFound = true;
						nlapiLogExecution('DEBUG','found contact: ' + results[0].getId());
						contactMatched = results[0].getId();
						if(muv_customer==null || muv_customer=='') customerMatched = results[0].getValue('company');
					}
					else nlapiLogExecution('DEBUG','Contact Search NO SINGLE MATCH FOUND');
				}
				else contactMatched = muv_contact;
				
				//Save whatever info we found in the leadsSearched array so we don't have to look up that LeadID again for subsequent Lead Activity
				 leadsSearched.push({leadID: muv_MKTO_leadid, contactID: contactMatched, customerID: customerMatched});
				 numLeadsSearched++;					
			 }
			
			if(mappingFound) {				
				try
				{
					if( (muv_contact==null || muv_contact=='') && !(contactMatched==null || contactMatched=='') )	{
						nlapiLogExecution('audit','**** Activity LeadID '+muv_MKTO_leadid+':  contactMatched = '+contactMatched+' so set it on activity record '+internalActivityID);
						nlapiSubmitField('customrecord_muv_marketoactivity',internalActivityID,'custrecord_muv_contact',contactMatched);
						numContactAssigned++;
					}				
					
					if( (muv_customer==null || muv_customer=='') && !(customerMatched==null || customerMatched=='') ) {
						nlapiLogExecution('audit','**** Activity LeadID '+muv_MKTO_leadid+':  customerMatched = '+customerMatched+' so set it on activity record '+internalActivityID);
						nlapiSubmitField('customrecord_muv_marketoactivity',internalActivityID,'custrecord_muv_customer',customerMatched);
						numCustAssigned++;
					}				
					
				}
				catch(e)
				{
					nlapiLogExecution('DEBUG','after finding LeadID','error setting contactid: ' + contactMatched + ', customerid: ' + customerMatched + ' for internal activityID: ' + internalActivityID + ':' + e);
				}					
			}	
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', internalActivityID);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', internalActivityID);
			}
		}
	}
	else nlapiLogExecution('audit', 'Total records found by saved search:','0');

	nlapiLogExecution('audit', 'Total Anonymous Activity records Customers assigned:',numCustAssigned);
	nlapiLogExecution('audit', 'Total Anonymous Activity records Contacts assigned:',numContactAssigned);
	
	//nlapiLogExecution('audit', 'Total Records force modified: ', totalRecsForced);	
	//if(totalRecsForced > 0) nlapiLogExecution('audit', 'custentity_push_marketo_date value set for (' + totalRecsForced + ') recs: ', current_EST_dateTime);
	//Update the Custom record which stores the Last Run Time -- Used for next time this script runs	
	//nlapiSubmitField('customrecord_scheduled_script_runtime', '1', 'custrecord_push_sales_rep_last_runtime', current_PST_dateTime);  	
		
	nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');	
}	

