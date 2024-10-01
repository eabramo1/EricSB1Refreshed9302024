function caseFormLoad(type)
{
	// If a New Sales EDS Analysis Case
	if ( nlapiGetFieldValue('id') == "" || nlapiGetFieldValue('id') == null )
	{
		// assign to Jane Tarr (955376)
		nlapiSetFieldValue('assigned', '955376');
		
		// set Employee field to the current user		
		nlapiSetFieldValue('custeventcustsat_prj_emp', nlapiGetUser());
		
		//set Help Desk flag
		nlapiSetFieldValue('helpdesk', 'T');
		
		//set Send Email checkbox and Internal Comment Checkbox
		nlapiSetFieldValue('emailform','F');
		nlapiSetFieldValue('internalonly','T');	
		
		if (nlapiGetFieldValue('custevent_case_customer_list') == '' || nlapiGetFieldValue('custevent_case_customer_list') == null)
		{
			// look at company field - if it's populated (with a REAL company)
			if (nlapiGetFieldValue('company') != "" || nlapiGetFieldValue('company') != null)
			{
				// then set the customer 
				nlapiSetFieldValue('custevent_case_customer_list', nlapiGetFieldValue('company'), null, true);
			}
		}
		// NOW set company field to the current user
		nlapiSetFieldValue('company', nlapiGetUser(), null, true);
	}
	
	// Set Sales Admin Case type to "Sales EDS Analysis Case" (7)
	nlapiSetFieldValue('custevent31', '7');	

	//set Help Desk flag if it's not populated
	if (nlapiGetFieldValue('helpdesk') == '' || nlapiGetFieldValue('helpdesk') == null)
	{
		nlapiSetFieldValue('helpdesk', 'T');
	}
	
	var role = nlapiGetRole();	
	// if current user's role role is not Sales Administrator (1007) or Administrator (3) or Sales Manager (1001) 
	// or Sales Operations Mngr (1057) or Order Entry (1011) or Sales Analyst (1053) or Sales Operations Director (1065)
	// or Cust Sat Roles (1006, 1002, 1003) then lock down and hide certain fields
	if(role !='1007' && role != '3' && role!= '1001' && role!='1057' && role!= '1011' && role!='1053' && role != '1006' && role != '1002' && role != '1003' && role != '1056' && role != '1065')
	{
		nlapiDisableField('status',true);
		nlapiDisableField('priority',true);
		nlapiDisableField('company',true);
		nlapiDisableField('outgoingmessage',true);
		// If the role is not Competitive Analysis then disable assigned to field
		if (role != '1056')
		{
			nlapiDisableField('assigned',true);
		}
	}	
	return true;
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
