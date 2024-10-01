/* PRODUCTION doc
 * 
 * File:  Restlet_GetContactRecordById.js
 * 
 * SB1-refresh-2024-09-30 version was RENAMED from Restlet_GetContactById.js to Restlet_GetContactRecordById.js on 1/31/18.  This was not created at that point.
 *
 * Module Description:  This Restlet exposes selected contact fields to the application that
 *			is calling the Restlet.  
 *
 * JSON input expected:  {"contact_id":"[contactid]"}
 * List of fields below are expected to view with this RESTlet.
 *			The Assumption is that the Application will call the Restlet with Login Credential
 *			and also with the contact fields that it wants to read as follows: 

contact_id
contact_firstname
contact_lastname
contact_firstlastname (first, middle and last name)
contact_email
contact_customer (customer internal id of primary customer)
 * 
 * Version    Date            	Author				Remarks
 * 1.00       1/31/2018			Pat Kelleher
 * 			  3/27/2018			Pat Kelleher	    moved to Production 	
 */

function GetContactRecordById(datain)
{
	nlapiLogExecution('debug', 'RESTLET GetContactRecordById started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	try
	{
		// Lookup contacts and load 
		nlapiLogExecution('debug', 'datain.contact_id=' + datain.contact_id);	
		
		var contact_id = datain.contact_id
		var contact = nlapiLoadRecord('contact', datain.contact_id);
		var contact_firstname = contact.getFieldValue('firstname');
		var contact_lastname = contact.getFieldValue('lastname');
		var contact_firstlastname = contact.getFieldValue('entityid');
		var contact_email = contact.getFieldValue('email');

		// library_utility script function called to format company name & id
		var contact_customer = L_formatListFieldJSON(contact, 'company');
	
		nlapiLogExecution('debug', 'Success Loading GetContactRecordById',  'contact_id: '+datain.contact_id);
		restlet_status = 'SUCCESS';
	}		
	catch ( e )
	
	{
		if ( e instanceof nlobjError ) 
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'GetContactRecordById Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'GetContactRecordById Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
		var dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, contact_id: contact_id, contact_firstname: contact_firstname, contact_lastname: contact_lastname, contact_firstlastname: contact_firstlastname, contact_email: contact_email, contact_customer: contact_customer};

	nlapiLogExecution('debug', 'RESTLET GetContactRecordById ended...');	
	return(dataout);
} 
