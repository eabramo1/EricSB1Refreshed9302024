//
// Script:     validateLegacyCustomerMapping.js
//
// Created by: Christine Neale, EBSCO, 05/06/2016
//
// Functions:
//				lcmPageInit 				Page initialization on Form load.
//				lcmFieldChanged				Field changed validation.
//				lcmSaveRecordValidation		Form Save validation.
// 				accNoValidation				Validates account no. format
//				dupeCheck					Checks for duplicate mappings
//
// Revisions:  
//	08-02-2016 	CNeale	Remove shipping legacy mapping processing (validation & shipping indicator).
//               
//	
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: lcmPageInit
// Called:  When the legacy customer mapping form is loaded.
//             	
function lcmPageInit(type)
{

 // if a new record is being added
	if (type == 'create') 
	{
	// Disable everything except for customer & Legacy System Name & Legacy Identifier
		nlapiDisableField('name', true);
		nlapiDisableField('custrecord_legacy_account', true);
		nlapiDisableField('custrecord_lcm_office_code', true);
    }
	
	if (type == 'copy')
	{
		nlapiSetFieldValue('name', '');
		if (nlapiGetFieldValue('custrecord_legacy_system_name') == 1) 
		// Mainframe Account
		{
			nlapiDisableField('custrecord_lcm_office_code', false);
			nlapiDisableField('custrecord_legacy_id', false);
		}	
		else
		// Mainframe Suffix	
		{
			nlapiDisableField('custrecord_legacy_account', false);
			nlapiDisableField('custrecord_legacy_id', false);
		}
	}

// end: function lcmPageInit	  
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Field Changed Validation  (Function: lcmFieldChanged)
//1. Legacy System Name Change
//2. Mapping Id, Office code or Legacy Account Id change
//


function lcmFieldChanged(type, name)
{
//--------------------------------------------------------------------------------------------------------------//
//On change of legacy system name 
//--------------------------------------------------------------------------------------------------------------//

	if (name == 'custrecord_legacy_system_name') 
	{ 
		nlapiSetFieldValue('name', '');
		if (nlapiGetFieldValue('custrecord_legacy_system_name') == 1) 
		// Mainframe Account
		{
			nlapiSetFieldValue('custrecord_legacy_account', '');
			nlapiDisableField('custrecord_legacy_account', true);
			nlapiDisableField('custrecord_lcm_office_code', false);
		}	
		else
		// Mainframe Suffix
		{
			nlapiDisableField('custrecord_legacy_account', false);
			nlapiSetFieldValue('custrecord_lcm_office_code', '');
			nlapiDisableField('custrecord_lcm_office_code', true);
		}
	}		
//--------------------------------------------------------------------------------------------------------------------//
// On change of mapping Id, Office Code or Legacy AccountlId	
//--------------------------------------------------------------------------------------------------------------------// 	
	
	if (name ==  'custrecord_legacy_id' || name == 'custrecord_lcm_office_code' || name == 'custrecord_legacy_account')
		{
			nlapiSetFieldValue('name', '');
		}
	
//End lcmFieldChanged function 
}




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: lcmSaveRecordValidation
// Called:	 When a legacy customer mapping record is saved 


function lcmSaveRecordValidation()
{
	var id = nlapiGetRecordId();

	if (!id)
	{
		var ls = nlapiGetFieldValue('custrecord_legacy_system_name');
		var map = nlapiGetFieldValue('custrecord_legacy_id');
		var legmap = '';

		// MainFrame Account Validation
		if (ls == 1)
		{
			// Office Code validation
    		if(!nlapiGetFieldValue('custrecord_lcm_office_code'))
    		{
    			alert("ERROR: Please enter an Office Code.");
    			return false;
    		}
    		// Account No validation
    		if(!map)
    		{
    			alert('ERROR: Please enter a 5 digit Account no. in the Legacy Mapping.');
    			return false;
    		}
    		accNoValid = accNoValidation(map);
    		if (accNoValid == false)
    		{
    			return false;
    		}
    		
    		// Set name field
    		legmap = nlapiGetFieldText('custrecord_lcm_office_code')+map.substring(0,5);
    		nlapiSetFieldValue('name', legmap);
    		// Set Customer Mapping Flag
    		nlapiSetFieldValue('custrecord_lcm_cust_map', 'T');
    		nlapiSetFieldValue('custrecord_lcm_bill_loc_map', 'F');
		}
     
      // MainFrame Suffix Validation
		if (ls == 3)
		{
			// Legacy Account Validation
			if(!nlapiGetFieldValue('custrecord_legacy_account'))
			{
				alert("ERROR: Please select a Legacy Mainframe Account.");
				return false;
			}
			if(!map || map.length != 2) 
			{
				alert("ERROR: Please provide a 2 digit Suffix with no trailing blanks.");
				return false;
			}
			var n0 = isNaN(map.charAt(0));
    	 	var n1 = isNaN(map.charAt(1));
    	 	if (n0 == true || n1 == true || map.charAt(0) == ' ' || map.charAt(1) == ' ')
    	 	{
    	 		alert("ERROR: Suffix should be numeric and contain no blanks.");
    	 		return false;
    	 	}
    	 	// Set name field
    		legmap = nlapiGetFieldText('custrecord_legacy_account')+'-'+map.substring(0,2);
    		nlapiSetFieldValue('name', legmap); 
      		// Set Bill Location Flag 
       		nlapiSetFieldValue('custrecord_lcm_bill_loc_map', 'T');
       		nlapiSetFieldValue('custrecord_lcm_cust_map', 'F');
		}
		
		// US140039 Removed Mainframe Subscriber Validation from here
     
		// Check for duplicates
		if (dupeCheck(legmap, ls) == true)
		{
			return false;
		}
	}
return true;   

// End function customerSaveRecordValidation
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: accNoValidation
//Purpose:	Validates account no. is in correct format
//Parameter:  accIn = Account no.
//Returns: false = Error, true = OK

function accNoValidation(accIn)
{
 
	//---------------------------------------------------------------------------------------------//
	// Account No. - Ensure matches correct format.                                                //
	//---------------------------------------------------------------------------------------------//
	
	
	// If account no. entered
	if (accIn) 
	{
		// Check length of Account no. - should be 5
		var acclen = accIn.length;
		if (acclen != 5 )
		{
			alert(' ERROR: Please provide Account No. in 99999 format with no trailing blanks.');
			return false;
		}
		
		// Check the no. component of the Account no. is numeric
		for ( var i = 0;  i <acclen; i++ )
		{
			if (isNaN(accIn.charAt(i)))
			{
				alert('ERROR: Account No. should be numeric.');
				return false;
			}
			if (accIn.charAt(i) == ' ')
			{
				alert('ERROR: Account No. should not include blanks.');
				return false;
			}
		}
	}
		
	return true;   
// End function accNoValidation
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: dupeCheck
//Purpose:	Checks for duplicate legacy mappings
//Parameters:  legmapin = legacy mapping to check for duplicates, ls = legacy mapping type
//Returns: true = error - duplicates found, false = OK - no duplicates 

function dupeCheck(legmapin, ls)
{
	// Run a search looking for duplicate legacy mappings

	// filters
	var lmfilters = new Array();
	lmfilters[0] = new nlobjSearchFilter('name', null,'contains', legmapin);
	lmfilters[1] = new nlobjSearchFilter('custrecord_legacy_system_name', null, 'anyof', ls);

	// column
	var lmcolumns = new Array();
	lmcolumns[0] = new nlobjSearchColumn('custrecord_ns_customer', null, null);
	//execute my search
	lm_searchResults = nlapiSearchRecord('customrecord_legacy_mapping', null, lmfilters, lmcolumns);
	if (lm_searchResults)
	{
		var CustId = lm_searchResults[0].getText('custrecord_ns_customer');
		alert('ERROR: The legacy mapping already exists for Customer: ' + CustId);
		return true;
	}
	return false;
}


	


