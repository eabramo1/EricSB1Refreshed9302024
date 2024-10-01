/*
 * PRODUCTION document -
 * File:  Restlet_GetCustomerRecordByIdOrCustId.js
 * 
 * Module Description:  This Restlet exposes selected customer fields to the application that
 *			is calling the Restlet.  
 * This Restlet is retrieving customer information by either the internal id or the customer id.  
 * If the input contains an internal id, it ignores the custid. However, it returns the custid in the results. 
 * If the input excludes an internal id, it will then search by the customer id (custid).  The results returns both the custid and the internalid.  
 *
 * JSON input expected:  {"customer_id":"[internalid]", "customer_custid":"[custid]"}
 * A list of fields were provided (below) that is expected to view with this RESTlet.
 *			The Assumption is that the Application will call the Restlet with Login Credential
 *			and also with the customer fields that it wants to read as follows: 

customer_id
customer_custid
customer_name
customer_cas_coverage
customer_customer_satisfaction // a/k/a customer account specialist (CAS) on the account team tab
customer_primary_dde_sales_rep // 

 * Version    Date            	Author				Remarks
 * 1.00       2/13/2018			Pat Kelleher 	
 * 2.00		  3/6/2018			Pat Kelleher		Fixed so return was populating custid when searching either by custid or internalid	
 * 2.01		  4/19/2018			Mackie				Added the 'Primary DDE Sales Rep' [salesrep] field into the dataout of this API
 */


function GetCustomerRecordByIdOrCustId(datain)
{
	nlapiLogExecution('debug', 'RESTLET GetCustomerRecordByIdOrCustId started'); 
	var restlet_status = 'ERROR';
	var restlet_status_details = '';
	var searchSuccess = false;
	
	try
	{
		// Handle if the Customer Internal ID is passed into the Restlet
		if (datain.customer_id)
		{
			nlapiLogExecution('debug', 'datain.customer_id=' + datain.customer_id);				
			var customer = nlapiLoadRecord('customer', datain.customer_id);
			var customer_id = datain.customer_id; 
			var customer_custid = customer.getFieldValue('custentity_custid');
			searchSuccess = true;
		}
		// Handle if the Customer Internal ID is NOT passed into the Restlet
		else
		{
			nlapiLogExecution('debug', 'datain.customer_custid=' + datain.customer_custid);			
		    //Define search criteria
		    var filters = new Array();
		    	// Caution you MUST use 'is' as the search operator in the below filter
		    	// is is to ensure only one result returned.
		    	// If we use 'starts with' all subcustomers get returned and results are tainted
		    filters[0] = new nlobjSearchFilter('entityid',null,'is', datain.customer_custid);
		    //Define search result
		    var columns = new Array();
		    columns[0] = new nlobjSearchColumn('internalid');
		    columns[1] = new nlobjSearchColumn('entityid');
		    //Perform the search
		    var customerResults = nlapiSearchRecord('customer', null , filters,columns);
		    if (customerResults)
		    {
			    for (var i = 0; customerResults != null && i < customerResults.length; i++ )
			    {	// get Customer Internal Id and load into variables
			    	var customer_id = customerResults[i].getValue('internalid');
			    	var customer_custid = customerResults[i].getValue('entityid');
				    }
			    // Load the Customer for all the other fields
			    var customer = nlapiLoadRecord('customer', customer_id);
			    searchSuccess = true;
		    }
		    else
		    {
		    	nlapiLogExecution('debug', 'No Customer found for customer_custid' + datain.customer_custid);	
		    	restlet_status_details = 'No Customer found for customer_custid ' + datain.customer_custid;
		    }
		}
		
		if (searchSuccess == true)
		{
			var customer_name = customer.getFieldValue('companyname');
			// Library utility scripts used below:
			var customer_cas_coverage = L_formatListFieldJSON(customer, 'custentity_cas_level');
			var customer_satisfaction = L_formatListFieldJSON(customer, 'custentity_customer_satisfaction');
			var customer_primary_dde_sales_rep = L_formatListFieldJSON(customer, 'salesrep');

			nlapiLogExecution('debug', 'Success Loading GetCustomerRecordByIdOrCustId',  'customer_id: '+customer_id);
			restlet_status = 'SUCCESS';			
		}	
	}		
	catch ( e )
	
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'GetCustomerRecordByIdOrCustId Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'GetCustomerRecordByIdOrCustId Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
		var dataout = {
				restlet_status: restlet_status
				,restlet_status_details: restlet_status_details
				,customer_id: customer_id
				,customer_custid: customer_custid
				,customer_name: customer_name
				,customer_cas_coverage: customer_cas_coverage
				,customer_satisfaction: customer_satisfaction
				,customer_primary_dde_sales_rep: customer_primary_dde_sales_rep
				}
	nlapiLogExecution('debug', 'RESTLET GetCustomerRecordByIdOrCustId ended...');	
	return(dataout);
} 


