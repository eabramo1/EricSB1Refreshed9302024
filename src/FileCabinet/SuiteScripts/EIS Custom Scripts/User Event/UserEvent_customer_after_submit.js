// Script:     UserEvent_customer_after_submit.js
//
// Created by: EBSCO Information Services
//
// Function:   serverCustomerAfterSubmit	
//				
//
// Revisions:  
//		05/06/2015	CNeale	Customer Authority US94755 Added reset of session object.	
//		08/02/2016	CNeale	Customer Authority US116612 Added update of Customer to Address for new Customers.
//                                                      Added cleardown of Customer Address Control Record. 
//                                                      Remove Session Object reset.
//		09/06/2016	CNeale	US157010 Resolve issue with Inactive Customers 
//									 Do not run Customer Address Control part of script for EP Web Service role/user
//		10-11-2016	eabramo Added clause to ONLY create the Contact if the stage is Customer
//		10-13-2017	eabramo	US201502 populate email address field under certain conditions
//		05-10-2018	eabramo as part of GDPR Contact form updates -- update a new custom field when default contact is created
//		3/15/2021	joliver	US766985 remove Default Contact creation, replace with link to Create Contact screen
//		11/27/2023	eabramo	US1162936 Remove Customer Email field scripting (removal of code from 10-13-2017 US201502 above)
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function serverCustomerAfterSubmit(type)
{
	// Get the customer record and id
	var currentRecord;
	var customerId;
	currentRecord = nlapiGetNewRecord();
	customerId = currentRecord.getId();
	// US116612 Get user & context
	var userId = nlapiGetUser();
	var ctx = nlapiGetContext();
	
	// US157010 - Exclude EP Web Service role (1025) & EP Web Service user (452592) from executing script (inline with before load script). 
	if (ctx.getExecutionContext() == 'userinterface' && ctx.getRole() != 1025 && ctx.getUser() != 452592)
	{	
		// US116612 Delete Customer Address Control Record
		var crfilters = new Array();
		if (type == 'create')
		{
			crfilters[0] = nlobjSearchFilter('custrecord_cac_new', null, 'is', 'T');
		}
		else
		{
			// US157010 Cater for Inactive Customers
			var oldRecord = nlapiGetOldRecord();
			var oldInact = oldRecord.getFieldValue('isinactive');
			if (oldInact != 'T')
			{
				crfilters[0] = nlobjSearchFilter('custrecord_cac_customer', null, 'anyof', customerId);
			}
			else
			{
				crfilters[0] = new nlobjSearchFilter('custrecord_cac_cust_inact', null, 'is', 'T');
				crfilters[2] = new nlobjSearchFilter('custrecord_cac_cust_inact_id', null, 'is', customerId); 
			}
		}
		crfilters[1] = nlobjSearchFilter('custrecord_cac_user', null, 'anyof', userId);

		var crcolumns = new Array();
		var crlen;
		crcolumns[0] = new nlobjSearchColumn('id', null, null);  
		crsearchResults = nlapiSearchRecord('customrecord_cust_add_control', null, crfilters, crcolumns);
		if (crsearchResults)
		{
			crlen = crsearchResults.length;
			for (var i = 0; i < crlen; i++) 
			{
				nlapiDeleteRecord('customrecord_cust_add_control', crsearchResults[i].getId());
			}
		}
		
		//US116612 Update Customer Id to Address(es) for new Customers
		if (type == 'create')
		{
			var custRec = nlapiLoadRecord('customer', customerId);
			var addressCount = custRec.getLineItemCount('addressbook');

			if (addressCount > 0) 
			{	
				// run through all addresses  
				for (var a = 1; a <= addressCount; a++)
				{		
					custRec.selectLineItem('addressbook', a);
					
					// Exclude any addresses that have no address details entered via the address form 
					if (!custRec.getCurrentLineItemValue('addressbook', 'addr2'))
					{
						continue;
					}
					var subrecordedit = custRec.editCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
					subrecordedit.setFieldValue('custrecord_address_customer', customerId);
					
					subrecordedit.commit();
					custRec.commitLineItem('addressbook');
				}
			}
			nlapiSubmitRecord(custRec, true, false);
		} 
	
		// create a contact only when a new customer is created	
		var recordCreated;
		var contactId;
		if ( type == 'create' && nlapiGetFieldValue('stage')=='CUSTOMER')
		{	
			
			// Find out if Contact was created already -- If not, send user to Create Contact screen
			// create filter object and column result object
			var hasContactFilter = new nlobjSearchFilter('company', null, 'is', customerId);
			var myColumn = new nlobjSearchColumn('internalid');
			var is_person = nlapiGetFieldValue('isperson');
			
			// perform search
			var searchForContact = nlapiSearchRecord('contact', null, hasContactFilter, myColumn);
			

			if(searchForContact == null && is_person == 'F')
			{	
				var customerId = nlapiGetRecordId();
				var params = new Array();
				params['parent'] = customerId;
				nlapiSetRedirectURL('RECORD','contact', null, true, params);

			}	
				
			
		} // end type create and stage is Customer
		
		// US1162936 Remove Customer Email field scripting - Removal of 86 lines of code.
		// Code was added in 2017 as part of US201502.  As per Leslie Sierra and Lori Reed 2023 - Marketing would like
		// to control the values in the email field without automated scripting

	} // end User Interface
}
