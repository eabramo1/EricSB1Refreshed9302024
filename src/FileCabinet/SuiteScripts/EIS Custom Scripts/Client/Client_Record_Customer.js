// Script:     Client_Record_Customer.js
//
// Created by: Christine Neale
//
// Functions:   	
//			CR_Customer_SF_createNew_button() - script for use with Sales Force "CreateNew" sync button - Edit mode	
//			CR_Customer_SF_createNew_button_view() - script for use with Sales Force "CreateNew" sync button - View mode	
//
//Library Scripts Used:
// 			library_constants.js -- Library Script used to reference constant value
//
//
// Revisions:  
//	CNeale	12/03/2018	US402266 Original version (function: CR_Customer_SF_createNew_button())
//			12/03/2018	Adding View mode (function: CR_Customer_SF_createNew_button_view())
//	KMcCormack  12-03-2018	US402324 - Team Mercury has decided that "Send to SalesForce" button should not be available
//							in view mode, so the call to CR_Customer_SF_createNew_button_view() has been removed from 
//							serverCustomerBeforeLoad() logic.  However, the function remains here inactive in case we 
//							need to resurrect it in the future. 
//							Also, a prompt was added to the CR_Customer_SF_createNew_button function to remind the user
//							that the customer still needs to be saved after clicking it.
//
/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Customer_SF_createNew_button()
 * Description: Script associated with "Add to SalesForce" button defined in UserEvent_customer_before_load.js - Edit mode
 * Input	  :	None
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Customer_SF_createNew_button()
{
	// Populate "createNew" text to SF ID on Customer
	nlapiSetFieldValue('custentity_sf_account_id', LC_SF_createNew);
/*	// Set SF Date Modified to current date/time - Not needed at the moment as Before Submit script is also setting
	var date_time_value = nlapiDateToString(new Date(), 'datetimetz');
	nlapiSetFieldValue('custentity_sf_modified_date',date_time_value, false);  */
	// Send Alert to notify that Contact record must be saved
 	alert('Remember to Save Customer to Complete "Send to SalesForce" Request');
	return true;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_Customer_SF_createNew_button_view()
 * Description: Script associated with "Add to SalesForce" button defined in UserEvent_customer_before_load.js - View mode
 * Input	  :	None
 * Returns    : None
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
/*function CR_Customer_SF_createNew_button_view()
{
	// Customer Record is in View mode in calling environment, therefore have to load record and update field
	var cust = nlapiLoadRecord('customer', nlapiGetRecordId());
	
	// Check that nothing has changed on the Customer that means it is no longer eligible to send to SalesForce 
	// i.e. Check Active, does not already have a SF ID & is OE Approved
	// No need to check Role or View mode 
	if (cust.getFieldValue('isinactive') != 'T' && cust.getFieldValue('custentity_oeapproved') == 'T' &&
			!cust.getFieldValue('custentity_sf_account_id'))
	{

		// Update the SF ID - the SF modified date is updated in Before Submit script
		nlapiSubmitField('customer', nlapiGetRecordId(), 'custentity_sf_account_id', LC_SF_createNew, true); 
		alert('This Customer has been updated to Send to SalesForce');
	}
	else
	{
		alert('This Customer is no longer eligible to Send to SalesForce');
	}
	
	return true;
}*/

