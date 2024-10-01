/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_noninv_item.js
//				Written in SuiteScript 2.0
//				Purpose:  Form-level client script for the Non-Inventory Item form
//
//Created by:	Eric Abramo  10-2022 - as re-write of a SuiteScript 1.0 file
//

//
//Library Scripts Used: 	-NONE-
//
//
//Revisions: 	10/28/2022	eAbramo		File created
//				10/09/2023	eAbramo		Modified to enhance code (Modified 11-2022 in Dev - never pushed to prod)
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'], function(LC2Utility) {

	/*Global Variables*/
	var inactiveOnInit = null;

	function pageInit(scriptContext) {
		var record = scriptContext.currentRecord;
		inactiveOnInit = record.getValue({fieldId: 'isinactive'});
	}


    function saveRecord(scriptContext) {
    	var record = scriptContext.currentRecord;

		var perpetual = record.getValue({fieldId: 'custitem_perpetual_offering'})
    	if (perpetual == true){
    		record.setValue({
    			fieldId: 'custitem_default_term_months',
    			value: 'NO EXP',
    			ignoreFieldChange: true	
    			})
    	}
    	else{
    		record.setValue({		
    			fieldId: 'custitem_default_term_months',
    			value: '12',
    			ignoreFieldChange: true	
    			})
    	}   	
    	
		// The below line of code came from the SS1 script.  I don't know hot it works but it works.
		// If you can figure out a better way to fetch the Base Price then by all means show me
		// and maybe we can autoset it to 0.00 which would be really nice.  I think it's needed to be 0 for some reason.
		var basePrice = document.getElementById('price_form').price_1_1.value;

		if (LC2Utility.LU2_isEmpty(basePrice))
		{
			alert('Please enter a base price (0.00) before saving.');
			return false;
		}    	
    	
		var is_inactive = record.getValue({fieldId: 'isinactive'})
		if (inactiveOnInit != true && is_inactive == true)
		{
			if (!confirm('Inactivating an Item in CRM can cause problems with historical DDE Sales Order loads.  If this is a DDE Item it is advised NOT to inactivate the item and instead use the \"EP Inactive\" checkbox to designate your item as inactive.  select Cancel to return to the form with an unchecked inactive flag.  Select OK to continue and inactive this item and save all changes.'))
			{
	    		record.setValue({		
	    			fieldId: 'isinactive',
	    			value: false,
	    			ignoreFieldChange: true	
	    			})
				return false;		
			}
		}
		
    	return true;
    }



    return {
		pageInit: pageInit,
        saveRecord: saveRecord
    };
});