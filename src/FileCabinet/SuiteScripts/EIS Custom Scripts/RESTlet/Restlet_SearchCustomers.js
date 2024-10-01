/*
 * PRODUCTION document -
 * File:  Restlet_SearchCustomers.js
 * 
 * Module Description:  This Restlet searches for customer internal IDs when the custId or the customer name is supplied.
 *   
 * This Restlet is searching for customer information by either the customer id (assumes that custid is not in proper lowercase syntax) or the customer name.  
 * The application calling this Restlet passes the customer id or the customer name to the Restlet.  
 * The Restlet returns an array which includes the NetCRM customer internal id, the customer name, and the customer internal id.
 *
 * THIS RESTLET IS USING THE LIBRARY_DYNAMIC_SEARCH SCRIPT IN CONJUNCTION WITH THE LIBRARY_CUSTOMER SCRIPT 
 * 
 * JSON input expected:  {"customer_name":"[name]", "customer_custid":"[custid]"}
 * A list of fields were provided (below) that is expected to view with this RESTlet.
 *
 *	The Assumption is that the Application will call the Restlet with Login Credential
 *	and also with the customer fields that it wants to read as follows: 
 *
 *  Return JSON Object Parameters:
 * 		restlet_status
 * 		restlet_status_details
 * 		contact_array object with
			customer_id (field id is internalid) 
			customer_custid (field id is entityid)
			customer_name (field id is companyname)

 * Version    Date            	Author				Remarks
 * 1.00       3/12/2018			Pat Kelleher 	
 */


function SearchCustomers(datain)
{
	nlapiLogExecution('debug', 'RESTLET SearchCustomers started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	var dataout = {};
	var customerResults = [];
	var columnsout = ['customer_id', 'customer_custid', 'customer_name'];
	
	// greened out the below when dynamic search was added in.  This worked as a regular search (when adding in custid) with no library scripts. 
/*	try
	{	
		// Find customer internal id by custid or customer name
			
		var customer_custid = datain.customer_custid;
		// var customer_name = datain.customer_name;
		nlapiLogExecution('debug', 'datain.customer_custid=' + datain.customer_custid);	// this is only to get log results in NS for what was executed
		// nlapiLogExecution('debug', 'datain.customer_name=' + datain.customer_name);	// this is only to get log results in NS for what was executed
		
	    //Define search criteria
	    var filters = new Array();
	    // Assuming NO internal id IS PASSED INTO THIS RESTLET it will SEARCH by custid
	    if (datain.customer_custid == null || datain.customer_custid == '')
	    {
	    	filters[0] = new nlobjSearchFilter('entityid',null,'is'); // try changing anyof to is and see if works
	    }
	    else // ELSE SEARCH BY Customer Name
	    {
	    	filters[0] = new nlobjSearchFilter('entityid',null,'is', customer_custid);

	    }
	    	
	    //Define result columns to be returned
	    var columns = new Array();
	    columns[0] = new nlobjSearchColumn('internalid');
	    columns[1] = new nlobjSearchColumn('entityid');
	    columns[2] = new nlobjSearchColumn('companyname');
	    
	    // nlapiLogExecution('DEBUG', 'Before contact search, filters[0] companyname =' + customer);
	    
	    //Perform the search
	    var customerResults = nlapiSearchRecord('customer',null,filters,columns);
	    var customer_array = [];
	    var customerObj= {};
	    
	    if(customerResults) 
	    {
	    
		    // loop through the results
		    for ( var i = 0; customerResults != null && i < customerResults.length; i++ )
		    {
		    	customerObj= {};
			    // setting the values in the object    
		    	customerObj.customer_id = customerResults[i].getValue('internalid');
		    	customerObj.customer_custid = customerResults[i].getValue('entityid');
		    	customerObj.customer_name = customerResults[i].getValue('companyname');
	
		    	//pushing the object into an array
		    	customer_array.push(customerObj);
		    }   
		    //log # of contacts
		    if(customerResults != null)  nlapiLogExecution('DEBUG', 'After customer search, customerResults results length =' + customerResults.length);
			nlapiLogExecution('debug', 'Success Loading SearchCustomers',  'customer_custid: '+datain.customer_custid);
			restlet_status = 'SUCCESS';
	    }
	    else
	    {
	    	nlapiLogExecution('DEBUG', 'No results found for customer_custid ' + customer_custid);
	    	restlet_status_details = 'No results found for customer_custid ' + customer_custid;
	    }
	
	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'SearchCustomers Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'SearchCustomers Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	// Return Contact Data
	var dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, customer_array: customer_array};
	nlapiLogExecution('debug', 'RESTLET SearchCustomers ended...');	
	return(dataout);
} 

*/

	// Dynamic library search starting (used Jeff's SearchCases as an example)
	try 	
	{			
		if (L_JSONisEmpty(datain)) {						
			restlet_status_details = 'SearchCustomers Restlet Datain Error:  Input JSON object is empty';
			restlet_status = 'ERROR';			
		}
		else {
			customerResults = L_dynamicSearch(datain, 'customer', columnsout);		
			
			if(L_dynamicSearchDone) {
				restlet_status_details = 'SearchCustomers Restlet found ' + customerResults.length + ' customer.';
				restlet_status = 'SUCCESS';
			}			
			else {
				restlet_status_details = 'SearchCustomers Restlet ERROR:  SEARCH FAILED...' + L_dynamicSearchMsg;
				restlet_status = 'ERROR';
			}
		}
	}  

		catch ( e )
		{
			if ( e instanceof nlobjError )
			{
				restlet_status_details = 'SearchCustomers Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
				restlet_status = 'ERROR';						
			}		
			else
			{		
				restlet_status_details = 'SearchCustomers Restlet UNEXPECTED ERROR:  ' +  e.toString();
				restlet_status = 'ERROR';
			}		
		}
		
		nlapiLogExecution( 'DEBUG', 'restlet_status', restlet_status);
		nlapiLogExecution( 'DEBUG', 'restlet_status_details', restlet_status_details);
		
		// Return Customer Data	
		dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, customer_array: customerResults};
		
		nlapiLogExecution('debug', 'RESTLET SearchCustomers ended...');
		
		return(dataout);

}		
	
