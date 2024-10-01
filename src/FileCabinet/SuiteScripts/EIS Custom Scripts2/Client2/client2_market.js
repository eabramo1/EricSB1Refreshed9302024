/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_market.js
//				Written in SuiteScript 2.0
//				Purpose:  Form-level client script for the Custom Market form (custom record)
//
//Created by:	Eric Abramo  10-2022 - as re-write of a SuiteScript 1.0 file
//

//
//Library Scripts Used: 	-NONE-
//
//
//Revisions: 	10/2022		File Created
//
//----------------------------------------------------------------------------------------------------------------
define([''], function() {

    function fieldChanged(scriptContext) {
        var record = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        
    	if (name == 'custrecord_market_inactive'){
			record.setValue({
				fieldId: 'isinactive',
				value: false,
				ignoreFieldChange: true, 
				forceSyncSourcing: false	
				})	
    	}
    }


    function saveRecord(scriptContext) {
    	var record = scriptContext.currentRecord;
    	
		// set the isUpdated flag
		record.setValue({
			fieldId: 'custrecord_market_isupdated',
			value: true,
			ignoreFieldChange: true, 
			forceSyncSourcing: false	
			})	
		
    	return true;
    }



    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});