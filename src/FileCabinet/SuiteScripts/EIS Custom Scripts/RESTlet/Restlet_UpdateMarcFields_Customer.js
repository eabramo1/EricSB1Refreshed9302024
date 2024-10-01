/*
 * File:  Restlet_UpdateMarcFields_Customer.js 
 *
 * Module Description:  When this Restlet is called it will allow for the updating of the MARC fields on the Vendor Details tab of a customer record.
 *  
 
 * 		Library Scripts Used:  NONE
	
 
 * JSON input expected: 
 			Required:
  				{"customer_custid":"[ebsco custID]"}

  			
  			Optional:

				customer_ebsco_ebook_marc_delivery
				customer_ebsco_ebook_marc_output_format
				customer_ebsco_ebook_marc_encoding_format
				customer_ebsco_ebook_marc_notification_email

																					
 *  JSON output expected: 
 *  			Success or Failure
 *  			TBD
 * 
 *  Link to Documentation: https://ebscoind.sharepoint.com/:w:/r/sites/EISOPFMercury/_layouts/15/Doc.aspx?sourcedoc={6526c2b3-8f02-4c44-a543-3db5b89c1bf3}&action=edit&wdPreviousSession=04f8412a-9bec-450d-aa13-34300df4069e
 *  
 * Version    Date            	Author				Remarks
 * 1.00       07/25/2018		Jeff Oliver		US401229 EBook MARC - Create RESTLET to Update MARC fields (Vendor Detail)
 * 								        	
 * 
 */

	
function UpdateMarcFields(dataIn)
{
	nlapiLogExecution('debug', 'RESTLET UpdateMarcFields started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';

	// parameters to track fields to be updated 
	var customer_updatedfields = '';
	var updatedFields_cleaned = ''; //trims off the lead comma
	var customer_id = ''; //to be set by the search below
	
	try
	{	

		nlapiLogExecution('debug', 'dataIn.customer_custid=' + dataIn.customer_custid);
		
	    //Define search criteria
	    var filters = new Array();
	    	// Caution you MUST use 'is' as the search operator in the below filter
	    	// is is to ensure only one result returned.
	    	// If we use 'starts with' all subcustomers get returned and results are tainted
	    filters[0] = new nlobjSearchFilter('entityid',null,'is', dataIn.customer_custid);
	    //Define search result
	    var columns = new Array();
	    columns[0] = new nlobjSearchColumn('internalid');
	    //Perform the search
	    var customerResults = nlapiSearchRecord('customer', null , filters,columns);
	    if (customerResults)
	    {
	    	customer_id = customerResults[0].getValue('internalid');
			
		    // Load the Customer for all the other fields
		    var customer = nlapiLoadRecord('customer', customer_id);
		    
			// EBSCO EBOOK MARC Delivery - no custom validation required 
			if (dataIn.customer_ebsco_ebook_marc_delivery != null)
			{
				customer.setFieldValue('custentity_ebsco_ebook_marc_delivery', dataIn.customer_ebsco_ebook_marc_delivery);
				customer_updatedfields = customer_updatedfields + ', customer_ebsco_ebook_marc_delivery';
			}
			
			// Output Format - no custom validation required  
			if (dataIn.customer_ebsco_ebook_marc_output_format != null)
			{
				customer.setFieldValue('custentity_ebsco_ebook_marc_outpt_format', dataIn.customer_ebsco_ebook_marc_output_format);
				customer_updatedfields = customer_updatedfields + ', customer_ebsco_ebook_marc_output_format';
			}
			
			// Encoding Format - no custom validation required  
			if (dataIn.customer_ebsco_ebook_marc_encoding_format != null)
			{
				customer.setFieldValue('custentity_ebsco_ebook_marc_encod_format', dataIn.customer_ebsco_ebook_marc_encoding_format);
				customer_updatedfields = customer_updatedfields + ', customer_ebsco_ebook_marc_encoding_format';
			}
			
			// MARC Notification Email - no custom validation required  
			if (dataIn.customer_ebsco_ebook_marc_notification_email != null)
			{
				customer.setFieldValue('custentity_ebsco_ebook_marc_email', dataIn.customer_ebsco_ebook_marc_notification_email);
				customer_updatedfields = customer_updatedfields + ', customer_ebsco_ebook_marc_notification_email';
			}
				
			
			
			// Log what we have to update
			nlapiLogExecution('debug', 'updatedfields=' + customer_updatedfields);	
			
				// If at least one field was updated
				if (customer_updatedfields)
				{	
					updatedFields_cleaned = customer_updatedfields.substring(2);
					// submit the updated record
					nlapiSubmitRecord(customer);
					restlet_status = 'SUCCESS';
					restlet_status_details = 'Fields updated: ' + updatedFields_cleaned;
				}
				else // no valid fields passed in to update
				{
					nlapiLogExecution('debug', 'No valid fields to update');
					restlet_status_details = 'No valid fields to update.  Check input parameters';
				}

	    }
	    else
	    {
	    	nlapiLogExecution('debug', 'No Customer found for customer_custid' + dataIn.customer_custid);	
	    	restlet_status_details = 'No Customer found for customer_custid ' + dataIn.customer_custid;
	    }

	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'UpdateMarcFields Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'UpdateMarcFields Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
	var dataOut = {restlet_status: restlet_status, customer_id: customer_id, customer_custid: dataIn.customer_custid, restlet_status_details: restlet_status_details};
	nlapiLogExecution('debug', 'RESTLET UpdateMarcFields ended...');	
	return(dataOut);
	
} // End of function UpdateMarcFields


