/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_segment.js
//				Written in SuiteScript 2.0
//				Purpose:  Form-level client script for the Custom Segment form (custom record)
//
//Created by:	Eric Abramo  07-2021 - as re-write of a SuiteScript 1.0 file
//

//
//Library Scripts Used: 	-NONE-
//
//
//Revisions: 
//----------------------------------------------------------------------------------------------------------------

define(['N/search'],

function(search) {

    function fieldChanged(scriptContext) {
        var record = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        
    	if (name == 'custrecord_segment_inactive')
    	{
    		setFieldValue(record, 'isinactive', false);
    	}
    }


    function saveRecord(scriptContext) {
    	var record = scriptContext.currentRecord;
    	var this_record_id = getFieldValue(record, 'id');
    	
    	// Validate that Segment Abbreviation is Unique
    	var segment_abbrev = getFieldValue(record, 'custrecord_segment_abbreviation');    	
		var abbrevSearch = search.create({
			type: search.Type.CUSTOM_RECORD + '1',		// id for the recordtype is customrecord1
		    columns: ['id'],
		    filters: [
		    	['id', 'notequalto', this_record_id],
		    	'and',
		        ['custrecord_segment_abbreviation', 'is', segment_abbrev]
		    ]
		});		
		var abbrevSearchResultSet = abbrevSearch.run().getRange(0,5);
		if (abbrevSearchResultSet.length > 0){
			alert('Please enter a different Segment Abbreviation. Another segment already uses the abbreviation entered');
			return false;
        }
 	
    	// Validate that Segment Code is Unique
    	var segment_code = getFieldValue(record, 'custrecord_segment_code');
		var codeSearch = search.create({
			type: search.Type.CUSTOM_RECORD + '1',		// id for the recordtype is customrecord1
		    columns: ['id'],
		    filters: [
		    	['id', 'notequalto', this_record_id],
		    	'and',
		        ['custrecord_segment_code', 'is', segment_code]
		    ]
		});		
		var codeSearchResultSet = codeSearch.run().getRange(0,5);
		if (codeSearchResultSet.length > 0){
			alert('Please enter a different Segment Code. Another segment already uses the Segment Code entered');
			return false;
        }

		// set the isUpdated flag
		setFieldValue(record, 'custrecord_segment_isupdated', true);
    	return true;
    }


    
    // ******************* Begin Standard Functions ***********************
    // Function to retrieve the value of a field
    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });
        return value;
    } 

    // Function to disable a field
    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }
    
    // Function to Set field value
    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });
        return record;
    }
    
    //  function to check for empty string
	function isEmpty(val){
	    return (val === undefined || val == null || val.length <= 0) ? true : false;
	}
    // ******************* End Standard Functions ***********************    
    
    
    

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
