// client_opportunity_ebookquote.js
// Created by eabramo 2015-03-12 - renamed in Summer 2016
//
//	Amendment Log
//		2016-11-03	eabramo		Added line of code to only disable custom form field if
//									the record is not new
//
//
/////////////////////////////////////////////////////////////////////////////////

// OPPTY LOAD FUNCTION
function opptyFormLoad()
{	// Lock fields if user is not the Web Services User and not Administrator
	if (nlapiGetUser() != '452592' && nlapiGetUser() != '808840')
	{
		// and if Not Administrator role
		if (nlapiGetRole() != '3')
		{	
			// 2016-11-03 eabramo
			if (nlapiGetRecordId()!='' && nlapiGetRecordId()!=null)
			{
				nlapiDisableField('customform', true);
			}
			nlapiDisableField('custbody_oppty_form_type', true);
		}
	}
}

function oppty_eBookSave()
{
	// set the Opportunity Form Type field
	var form_type = nlapiGetFieldValue('custbody_oppty_form_type');
	if (form_type == null || form_type == '' || form_type != '6')
	{
		nlapiSetFieldValue('custbody_oppty_form_type', '6');
	}	
     	return true;
}
