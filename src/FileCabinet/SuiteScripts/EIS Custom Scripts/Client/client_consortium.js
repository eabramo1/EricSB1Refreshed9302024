function consortiumFieldChanged(type, name)
	{
	// if the Custom IsInactive field changes set the Real CRM IsInactive field to FALSE
	if (name == 'custrecord_consortium_ep_inactive')
		{	
		nlapiSetFieldValue('isinactive', false);
		}
	}


function consortiumFormSave()
	{
		if (nlapiGetFieldValue('custrecord_consortium_main_site') == '' || nlapiGetFieldValue('custrecord_consortium_main_site') == null )
		{
			alert('You need to select a Main Site');
			return false;
		}
	
		// PREVENT SITES TO BE ADDED IF NOT OE APPROVED
		var main_site = nlapiGetFieldValue('custrecord_consortium_main_site');
		// CHECK MAIN SITE
		// create filter object and column result object
		var oe_approval_filter = new Array();
		oe_approval_filter [0] = new nlobjSearchFilter('internalid', null, 'is', main_site);	
		oe_approval_filter [1] = new nlobjSearchFilter('custentity_oeapproved', null, 'is', 'F');		
		var oe_approval_column = new nlobjSearchColumn('internalid');		
		// perform search
		var oe_approval_SearchResult = nlapiSearchRecord('customer', null, oe_approval_filter, oe_approval_column);
		if(oe_approval_SearchResult != null)
		{
			alert('The Main Site in this Consortium record is not OE Approved.  Please contact OE to approve the Main Site.');
			return false;
		}

		
		// CHECK MEMBER SITES // get array of the member sites
/*
		// 2017-10-02 Production problem: hits Governance Limit -- Commenting out this Code
		if (nlapiGetFieldValues('custrecord_consortium_member_sites') != "")
		{
			var member_sites = new Array();
			member_sites = nlapiGetFieldValues('custrecord_consortium_member_sites');
			// create variables for flagging as a bad site - and incorporating names into an alert
			var not_approved_site = false;
			var one_bad_site = null;
			var bad_sites = '';

			// create filter object
			var member_oe_filter = new Array();
			member_oe_filter [0] = new nlobjSearchFilter('custentity_oeapproved', null, 'is', 'F');	
			// create and execute rest of search within a loop - for as many times as customer in the array
			for (var i = 1; i <= member_sites.length; i++)
			{	

				member_oe_filter [1] = new nlobjSearchFilter('internalid', null, 'is', member_sites[i-1]);
				var member_oe_column = new nlobjSearchColumn('internalid');		
				// perform search
				var member_oe_SearchResult = nlapiSearchRecord('customer', null, member_oe_filter, member_oe_column);		
				if(member_oe_SearchResult != null)
				{
					//alert('one of the sites is bad');
					not_approved_site = true;
					one_bad_site = nlapiLookupField('customer', member_sites[i-1], 'entityid', null);
					bad_sites = bad_sites + ', '+one_bad_site;
				}
			}
			if (not_approved_site == true)
			{
				alert('The following Member Site(s) is(are) not OE Approved'+bad_sites+'. Please remove the site(s) from the member list.  You may add the Site(s) to the Consortium after it is OE Approved.');
				return false;
			}	
		}
*/

		// prevent entry of a consortium record with same name		
		var Name1 = nlapiGetFieldValue('name').toUpperCase();
		if ((nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null))
		{
			// create filter object and column result object
			var nameFilter = new Array();
				nameFilter[0] = new nlobjSearchFilter('name'.toUpperCase(), null, 'is', Name1);		
			var nameColumn = new nlobjSearchColumn('internalid');		
			// perform the search
			var sameNameSearchResult = nlapiSearchRecord('customrecord67', null, nameFilter, nameColumn);
			// warn user
			if(sameNameSearchResult != null)
				{
				alert('A Consortium record with this name already exists.  You must use a different name');
				return(false);
				}
		}
		
		// check that the length doesn't go over 50
		if (Name1.length > 50)
		{
			alert('Please shorten your Consortia name to 50 characters or less.');
			return(false);
		}
	
	// Set IsUpdated to True for WebServices pickup
	nlapiSetFieldValue('custrecord_consortium_isupdated', 'T');
	return(true);
	}
