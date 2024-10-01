function FormSave()
{
	function FormIsValid()
	{
	    var formIsValid = true;

        //duplicate name check on new records (EA)
	    if ((nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null)) {

	        var AccountName = nlapiGetFieldValue('name').toUpperCase();
	        var nameFilter = new nlobjSearchFilter('name'.toUpperCase(), null, 'is', AccountName);
	        var nameColumn = new nlobjSearchColumn('internalid');

	        var sameNameSearchResult = nlapiSearchRecord('customrecord_ybp_account', null, nameFilter, nameColumn);

	        if (sameNameSearchResult != null) {
	            alert('A YBP Account with this name already exists in NetCRM. Please edit the name to distinguish this account from the existing.  If you need to find the existing Account please use the Global Search.  Include the \'plus sign\' (+) after your search term to include results for INACTIVE YBP Accounts');
	            formIsValid = false;
	        }
	    }

        //duplicate ybp account number integer check on new/existing records (LW)
	    var accountNumberInteger = nlapiGetFieldValue('custrecord_ybpa_account_number_integer');
	    var accountNumberIntegerErrorMessage = 'You have entered a YBP Account Number that is already in use on another YBP Account record. This record has not been saved. Please enter a unique YBP Account number.';

		if(accountNumberInteger != '')
		{
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_ybpa_account_number_integer', null, 'equalTo', accountNumberInteger);

			var columns = new Array();
			//columns[0] = new nlobjSearchColumn('custrecord_ybpa_account_number_integer', null, null);

			var results = nlapiSearchRecord('customrecord_ybp_account', null, filters, columns);

			if(results != null)
			{
				if(results.length > 1)
				{
				    alert(accountNumberIntegerErrorMessage);
				    formIsValid = false;
				}
				else if(results.length == 1)
				{
					if(results[0].id != nlapiGetRecordId())
					{
					    alert(accountNumberIntegerErrorMessage);
						formIsValid = false;
					}
				}
			}				
		}

		return formIsValid;
	}

	return FormIsValid();
}