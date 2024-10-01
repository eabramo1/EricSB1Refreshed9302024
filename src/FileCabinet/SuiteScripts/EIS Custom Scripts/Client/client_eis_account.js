// IMPORTANT ::::: PK - DO NOT USE.  THIS SCRIPT HAS BEEN REFACTORED TO SS2 ON MAY 15 2024.
// THIS SS1 SCRIPT IS INACTIVE IN NETSUITE

var allowSave = 'T';
function eisAccountFieldChanged(type, name)
{	// if the EP IsInactive field changes set the real CRM IsInactive field to FALSE
	if (name=='custrecord_eis_ep_inactive')
	{	
		nlapiSetFieldValue('isinactive','F');
	}
}


function eisAccountFormLoad(type)
{
	var user_role = nlapiGetRole();
	if (type == 'create') 
	{	// if creating a new record then set the EIS Product to unknown/User Services
		nlapiSetFieldValue('custrecord_eis_product', '7')
	}
	
	// If this isn't a new record - then lock down the EIS Account Number field, Prod Customer ID field and Product Field
	if (type != 'create')
	{
		nlapiDisableField('custrecord_eis_account_no', true);
		nlapiDisableField('custrecord_eis_product', true);
		nlapiDisableField('custrecord_eis_customer_id', true);
	}
	
	// OLD CODE - if role IS user services (1063) then lock the eis Product field
	// changed for NetSuite Merge with EIS: If role is NOT Support Manager (1002)  and is Not Admin (3)
		// then lock the EIS Product field
	if (user_role != '1002' && user_role != '3')
	{
		nlapiDisableField('custrecord_eis_product', true)
	}
	
	// if creating new and role is not User Services 1063 OR Administrator 3 OR Support Supervisor 1006 OR Support Manager 1002
	// changed for NetSuite Merge with EIS: add ESS Offices role '1042' and add Publisher Services Role (1080 Production) 
	// add Sales Administrator role 1007
	// 2014-06-24 add ESS SSE Support Rep 1 role (1028)  
	
	if (type == 'create' && user_role!='1063' && user_role!='3' && user_role!='1006' && user_role!='1002' && user_role!='1042' && user_role!='1080' && user_role!='1007' && user_role!='1028')
	{
		alert('Your role is not authorized to create new EIS Account records.  Please contact a Support Manager or Sales Operations.  You will not be able to save this record');
		allowSave = 'F';
	}
}

function eisAccountFormSave()
{	
	var ep_cust = nlapiGetFieldValue('custrecord_eis_account_customer');
	var ep_cust_name = nlapiGetFieldText('custrecord_eis_account_customer');
	var prod_type = nlapiGetFieldValue('custrecord_eis_product');
	var eis_cust_id = nlapiGetFieldValue('custrecord_eis_customer_id');
	var prod_customer_id = nlapiGetFieldValue('custrecord_eis_customer_id');
	var eis_account = nlapiGetFieldValue('custrecord_eis_account_no');

	if (allowSave == 'F')
	{
		alert('Your role cannot create new EIS Account records.  Please contact a Support Manager or Sales Operations');
		return false;
	}
	
	//Require the EIS Product Customer ID if the ProductType is not User Services Mainframe (7)
	if ( prod_type != '7' && (prod_customer_id == '' || prod_customer_id == null) )
	{
		alert('EIS Account records for AtoZ, EBSCONET, EJS, EBS, and Marketplace require an EIS Product Customer ID and EIS Account Number.');
		return false;	
	}
	
	if ( prod_type != '7' && (eis_account == '' || eis_account == null) )
	{
		alert('EIS Account records for AtoZ, EBSCONET, EJS, EBS, and Marketplace require an EIS Account Number');
		return false;	
	}
	
	// Only run through following code (which includes IsUpdated flag!!!!) if Product Type is not null 
	// and is not equal to Unknown/User Services Mainframe (7)
	if (prod_type != '' && prod_type != null &&  prod_type != '7')
	{
		// If Product Type is AtoZ (1) and Company field is populated and AtoZ id is populated
		// verify that only one EP Customer is mapped to all EIS Accounts having the same AtoZ ID
		if ( prod_type == '1' && ep_cust != '' && ep_cust != null && eis_cust_id != "" && eis_cust_id != null)
		{
			// search all EIS Account Records with this AtoZ ID - different EP Customer
			var a_filters = new Array();
			a_filters[0] = new nlobjSearchFilter('custrecord_eis_customer_id', null,'is', eis_cust_id);
			a_filters[1] = new nlobjSearchFilter('id', null, 'notequalto', nlapiGetRecordId());
			a_filters[2] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'noneof', ep_cust);
			a_filters[3] = new nlobjSearchFilter('custrecord_eis_product', null, 'anyof', '1');
			a_filters[4] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'noneof', '@NONE@');
			var a_columns = new Array();
			a_columns[0] = new nlobjSearchColumn('id', null, null);
			var a_searchResults = nlapiSearchRecord('customrecord_eis_account', null, a_filters, a_columns);
			// If there are results... 
			if(a_searchResults != null)
			{
				alert('Error A: This record\'s EP Customer must match the EP Customer of all other EIS Accounts with an AtoZ ID of: '+eis_cust_id+'. Search for all EIS Accounts with this AtoZ ID and use the same EP Customer.  This record will not be saved');
				return false;
			}

			// ALSO search all EIS Account Records with this EP Customer - different AtoZ ID
			var b_filters = new Array();
			b_filters[0] = new nlobjSearchFilter('custrecord_eis_account_customer', null, 'anyof', ep_cust);
			b_filters[1] = new nlobjSearchFilter('id', null, 'notequalto', nlapiGetRecordId());
			b_filters[2] = new nlobjSearchFilter('custrecord_eis_product', null, 'anyof', '1');
			b_filters[3] = new nlobjSearchFilter('custrecord_eis_customer_id', null,'isnot', eis_cust_id);
			var b_columns = new Array();
			b_columns[0] = new nlobjSearchColumn('id', null, null);
			var b_searchResults = nlapiSearchRecord('customrecord_eis_account', null, b_filters, b_columns);
			// If there are results... 
			if(b_searchResults != null)
			{
				alert('Error B: There can only be one EP Customer per AtoZ ID.  The EP Customer '+ep_cust_name+' matches an EIS Account with a different AtoZ ID.  You must map this record to different EP Customer or create a new EP Customer.  This record will not be saved');
				return false;
			}			
		}
		
		// If EIS Accounts already exist with same three Primary Key fields, don't allow save
			var c_filters = new Array();
			c_filters[0] = new nlobjSearchFilter('custrecord_eis_customer_id', null,'is', eis_cust_id);
			c_filters[1] = new nlobjSearchFilter('custrecord_eis_product', null, 'anyof', prod_type);
			c_filters[2] = new nlobjSearchFilter('custrecord_eis_account_no', null, 'is', eis_account);
			c_filters[3] = new nlobjSearchFilter('id', null, 'notequalto', nlapiGetRecordId());
			var c_columns = new Array();
			c_columns[0] = new nlobjSearchColumn('id', null, null);
			var c_searchResults = nlapiSearchRecord('customrecord_eis_account', null, c_filters, c_columns);
			// If there are results... 
			if(c_searchResults != null)
			{
				alert('You cannot create this record because it is a duplicate. Another EIS Account exists with the same Account Number, EIS Product and EIS Customer ID');
				return false;
			}	
	
		//set the isUpdated flag to True
		nlapiSetFieldValue('custrecord_eis_isupdated','T');
	}
return true;	
}