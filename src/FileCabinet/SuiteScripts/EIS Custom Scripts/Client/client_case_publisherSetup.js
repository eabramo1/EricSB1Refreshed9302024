function caseFormLoad(type)
{
	// If a brand new OE General Case assign to Michelle Kelley (1383622)
	if ( nlapiGetFieldValue('id') == "" || nlapiGetFieldValue('id') == null )
	{
		nlapiSetFieldValue('assigned', '1383622');
		
		// set Created By field to the current user		
		nlapiSetFieldValue('custeventcustsat_prj_emp', nlapiGetUser());	

		// populate Main Site CustID if you can grab it
		// look at company field - if it's populated (with a REAL company)
		if (nlapiGetFieldValue('company') != "" || nlapiGetFieldValue('company') != null)
		{
			// then set the customer 
			nlapiSetFieldValue('custevent_oe_customer', nlapiGetFieldValue('company'), null, true);
		}
		// NOW set company field to the current user
		nlapiSetFieldValue('company', nlapiGetUser(), null, true);		
	}
	
	// Lock the Status field if not OE role or Admin role
	if (nlapiGetRole() != '3' &&  nlapiGetRole() != '1011' )
	{
		nlapiDisableField('status', true);
	}
	
	// set OE Case flag if it's not populated
	if ( nlapiGetFieldValue('custevent_oe_case') == 'F')
	{
		nlapiSetFieldValue('custevent_oe_case', 'T');
	}
	// set the OE Case Request Type field if it's not populated (33 = eBook Publisher Setup)
	if (nlapiGetFieldValue('custevent_oe_request_type') == '' || nlapiGetFieldValue('custevent_oe_request_type') == null)
	{
		nlapiSetFieldValue('custevent_oe_request_type', '33');
	}
	
	//set Help Desk flag if it's not populated
	if (nlapiGetFieldValue('helpdesk') == '' || nlapiGetFieldValue('helpdesk') == null)
	{
		nlapiSetFieldValue('helpdesk', 'T');
	}
	return true;
}


// copies message text from original to outgoing boxes
var originalMessageCopied = false;
function copyOriginalMessage()
{
	if (originalMessageCopied == false)
	{
		nlapiSetFieldValue('outgoingmessage',nlapiGetFieldValue('outgoingmessage') + '\n\n--- Original Message ---\n' + nlapiGetFieldValue('incomingmessage'));
		originalMessageCopied = true;
	}
}
