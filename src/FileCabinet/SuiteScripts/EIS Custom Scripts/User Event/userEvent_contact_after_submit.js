// Script:     userEvent_contact_after_submit.js
//
// Created by: EBSCO Information Services  12-09-2016 (E ABRAMO)
//
// Functions:  server_contact_afterSubmit - triggers updates to Marketo fields in the event of an edit
//
// Revisions:  
//		2017-03-07 Deployed to Production
//		2017-03-28 -- prevent errors when Contact is deleted
//		
//	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function server_contact_afterSubmit(type)
{	// 2017-03-28 -- prevent errors when Delete -- add next line
	if (type != 'delete')
	{
		// Get the Contact record and id
		var contactId = nlapiGetRecordId();
		var this_contact = nlapiLoadRecord('contact', contactId);
	
		// 2016-03-27 New Code for CSV Import trigger - if 'Sync To Marketo' field is not TRUE and 'Move To Marketo' field is Yes
		// - Set 'Sync To Marketo' field to true
		var contact_synctomarketo = this_contact.getFieldValue('custentity_sync_to_marketo');
		var contact_movetomarketo = this_contact.getFieldValue('custentity_move_to_marketo');
		if(contact_synctomarketo != 'T' && contact_movetomarketo=='1')
		{
			nlapiSubmitField('contact', contactId, 'custentity_sync_to_marketo', 'T', null);
		}
		
		var this_contacts_customer = this_contact.getFieldValue('company');
		var customer_synctomarketo = nlapiLookupField('customer', this_contacts_customer, 'custentity_customer_sync_to_marketo');
		var contact_movetomarketo = this_contact.getFieldValue('custentity_move_to_marketo');
		// if Contact is set to Move to Marketo, set the Customer Sync to Marketo flag
		if (contact_movetomarketo == '1' && customer_synctomarketo == 'F')
		{	// Load the Customer record.  Set the Sync Field.  Submit the Customer record
			var customer = nlapiLoadRecord('customer', this_contacts_customer);
			customer.setFieldValue('custentity_customer_sync_to_marketo', 'T');
			//format the Contact LastModified date to set it on the Customer
	        var lastModified = this_contact.getFieldValue('lastmodifieddate');
	        lastModified = nlapiStringToDate(lastModified);
	        lastModified = nlapiDateToString(lastModified,'datetimetz');
	        // set it on Customer
			customer.setFieldValue('custentity_muv_syncfield_lastmodified', lastModified);
			nlapiSubmitRecord(customer, false, true);
		}
	}
}
