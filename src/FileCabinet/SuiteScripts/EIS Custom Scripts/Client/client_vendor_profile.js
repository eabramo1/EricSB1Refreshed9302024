function profileFormLoad(type)
{
	if (type == 'create')
	{
		nlapiDisableField('name', false);
	}
}

 
function profileFieldChange(type, name)
{
	if (name == 'custrecord_vendor_ep_inactive')
	{	
		nlapiSetFieldValue('isinactive','F');
	}
}


function profileFormSave()
{		
	// If PDA preference is PDO or PDU then require Purchase Model Default
		
	if (nlapiGetFieldValue('custrecord_vendor_pda_pref') == '2' || nlapiGetFieldValue('custrecord_vendor_pda_pref') == '4')
	{
		if ( nlapiGetFieldValue('custrecord_vendor_pdo_model') == '' || nlapiGetFieldValue('custrecord_vendor_pdo_model') == null )
		{
			alert('If PDA preference is PDO or PDU, you must select a Purchase Model Default');
			return false;
		}
	}
	
	// If PDA preference is PDL or PDU then require Lease Terms Default and Max # of Leases per Title
	if (nlapiGetFieldValue('custrecord_vendor_pda_pref') == '3' || nlapiGetFieldValue('custrecord_vendor_pda_pref') == '4')
	
	{
		if ( nlapiGetFieldValue('custrecord_vendor_pdl_term') == '' || nlapiGetFieldValue('custrecord_vendor_pdl_term') == null )
		{
			alert('If PDA preference is PDL or PDU, you must select a Lease Term Default');
			return false;
		}
		if ( nlapiGetFieldValue('custrecord_vendor_maxleases') == '' || nlapiGetFieldValue('custrecord_vendor_maxleases') == null )
		{
			alert('If PDA preference is PDL or PDU, you must select a Max. # of Leases per Title');
			return false;
		}				
	}
	

	// If PDA Preference is PDL, PDO or PDU then require Budget Field	
	if (nlapiGetFieldValue('custrecord_vendor_pda_pref') == '2' || nlapiGetFieldValue('custrecord_vendor_pda_pref') == '3'  || nlapiGetFieldValue('custrecord_vendor_pda_pref') == '4')	
	{
		if ( nlapiGetFieldValue('custrecord_vendor_budget_cap') == '' || nlapiGetFieldValue('custrecord_vendor_budget_cap') == null )
		{
			alert('If PDA preference is PDO, PDL, or PDU, you must enter a Budget Cap');
			return false;
		}		
	}

	// Validate you don't Have a Duplicate SAN Number (name field)
	// but only if EP_Inactive is False
	if ( nlapiGetFieldValue('custrecord_vendor_ep_inactive') == 'F')
	{	
		var profile_name = nlapiGetFieldValue('name');
		var profile_cust = nlapiGetFieldValue('custrecord_vendor_customer');	
		// If a Gobi Profile already exists with same Name (SANS NUMBER) then don't allow save
			var gobi_filters = new Array();
			gobi_filters[0] = new nlobjSearchFilter('name', null,'is', profile_name);
			//gobi_filters[1] = new nlobjSearchFilter('custrecord_vendor_customer', null,'is', profile_cust);
			gobi_filters[1] = new nlobjSearchFilter('id', null, 'notequalto', nlapiGetRecordId());
			gobi_filters[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			var gobi_columns = new Array();
			gobi_columns[0] = new nlobjSearchColumn('id', null, null);
			var gobi_searchResults = nlapiSearchRecord('customrecord_vendor_profile', null, gobi_filters, gobi_columns);
			// If there are results... 
			if(gobi_searchResults != null)
			{
				alert('You cannot save this record because another Gobi Profile exists with the same SANS Number');
				return false;
			}
	}	
	

	//set the isUpdated flag to True
	if (nlapiGetFieldValue('custrecord_vendor_parent_oe_approved') == 'T' )
	{
		nlapiSetFieldValue('custrecord_vendor_isupdated', 'T');	
	}
	
	return true;	
}