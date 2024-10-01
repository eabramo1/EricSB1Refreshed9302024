// Script:     Scheduled_customer_folioUnset.js
//	   
//Created by: Christine Neale
//
//Function: 
//
//Library Scripts Used:	library_utility.js	
//					    library_constants.js
//
//Revisions:  
//
//CNeale			01/06/2022	US893691 Original version 	
//eAbramo			09/16/2022	TA754012 (of US1010164) Fix Defects for EBSCO Connect ReArch (Setting/Unsetting the Contact's FOLIO Access Status field)							
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function customerFolioUnset()
{
	nlapiLogExecution('audit', '+++ START SCRIPT Scheduled_customer_folioUnset +++');
	
	var updCount = 0;  //Counts no. of Customer updates 
 	var updMax = LC_boomiCustMax; //Controls maximum no. of updates to be sent to Boomi Integration

	// Required for Library script function call
	var that = this;
	this.recordSearcher = new L_recordSearcher();

	// Perform Search to identify Customers with FOLIO indicator set 

	var custSearch_results = that.recordSearcher.search('customer', LC_Saved_search.folio_customers, null, null);	

	nlapiLogExecution('audit', 'Ran Customer Saved Search');	

	if(custSearch_results){
		nlapiLogExecution('audit', 'Total records found by Customer saved search:',custSearch_results.length);

		for(var z=0; z < custSearch_results.length && updCount < updMax; z++)
		{
			var result=custSearch_results[z];
			var resultColumns=result.getAllColumns();

			// get the data from this search result row
			var custInternalID = result.getValue(resultColumns[0]);
			var sfAccountId = result.getValue(resultColumns[1]);	// Adding SF Account ID to results needed for EBSCO Connect purposes TA754012 (of US1010164)
					
			// Now check whether any qualifying Accessing Items	
		
			var aifilter =     [[['custrecord_ai_sites', 'anyOf', custInternalID ],
	                            'or',
	                            ['custrecord_ai_purchasing_site', 'anyOf', custInternalID]]];
			
			ai_searchResults = nlapiSearchRecord('customrecord60', LC_Saved_search.folio_access_item, aifilter, null);
			
	
			if (!ai_searchResults)
			{	
				try{
					// Submit array of two fields (FOLIO checkbox and SF Account ID). TA754012 (of US1010164) 
					// Note: SF Account ID is needed for logic within UserEvent Customer After Submit to trigger EBSCO Connect FOLIO Access field
						// on appropriate Contact records
					var submit_field_names = ['custentity_folio_cust', 'custentity_sf_account_id']
					var submit_field_values = ['F', sfAccountId]
					nlapiSubmitField('customer', custInternalID, submit_field_names, submit_field_values );
					updCount = updCount + 1;
				
					nlapiLogExecution('debug', 'Customer Updated = ', custInternalID);
				}
				catch ( e )
				{
					nlapiLogExecution('debug', 'Error unsetting FOLIO Flag Customer '+custInternalID, e.getCode() + ': ' + e.getDetails());
					nlapiSendEmail(LC_Employees.MercuryAlerts, LC_Email.CRMEscalation, 'Customer FOLIO flag unset failed (Scheduled_customer_folioUnset.js)', 'Customer internal ID of ' +custInternalID+ ' no longer has qualifying FOLIO Accessing Items - the FOLIO Customer flag unset failed, please reset manually via web services form.', null, null, null, null, null,null, null);
				}
			}
 
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100)
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding ***', custInternalID);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', custInternalID);  
			}
	
		} // End of For loop for each result
		
		if (updCount >= updMax){
			nlapiLogExecution('debug', 'Maximum no. of Customers updated at Customer '+custInternalID);
			nlapiSendEmail(LC_Employees.MercuryAlerts, LC_Email.CRMEscalation, 'Customer FOLIO flag unset Maximum reached (Scheduled_customer_folioUnset.js)', 'The maximum number of FOLIO Customer flag unsets has been reached - please consider scheduling script to run more frequently.', null, null, null, null, null,null, null);
		}

	}// End of results found

	else
	{
		nlapiLogExecution('audit', 'Total records found by saved search:','0');
	}	

	nlapiLogExecution('audit', '+++ END SCRIPT +++', 'SUCCESS');
}

