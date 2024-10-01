function epCaseLoad()
{	// if this is a new case
	if ( (nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null) )
	{
		//set assigned rep to current user
		nlapiSetFieldValue('assigned', nlapiGetUser());	
	}
	
	// Set Product to EBSCO Discovery Service - 2192
	if (nlapiGetFieldValue('custevent_itemproduct') == '' || nlapiGetFieldValue('custevent_itemproduct') == null)
	{
		nlapiSetFieldValue('custevent_itemproduct', '2192');	
	}

	
	// Set Interface to EBSCO Discovery Service - 156
	if (nlapiGetFieldValue('custevent_interface') == '' || nlapiGetFieldValue('custevent_interface') == null)
	{
		nlapiSetFieldValue('custevent_interface', '156');	
	}	
	
	// Set Origin
	var currentOrigin = nlapiGetFieldText('origin');
	if (currentOrigin == null || currentOrigin == "")
	{
	      nlapiSetFieldText('Origin', 'Phone');
	}
}


// 04-14-2006
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

