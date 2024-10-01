/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_Record_Contact.js
//Written in SuiteScript 2.0
//
//Created by:	Christine Neale 11-2019
//
//Purpose:		Validation for the Contact Record
//
//
//Library Scripts Used: 	None
//
//
//Revisions:  
//
//
//
//----------------------------------------------------------------------------------------------------------------

define([], 
function() {
	
	// Global Variable
	var emailOnLoad2 = null;
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	contRec = scriptContext.currentRecord

    	// Retrieve email on record load
    	emailOnLoad2 = getFieldValue(contRec, 'email');
    }
    
 
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var contRec = scriptContext.currentRecord;
     	
    	// Validate that a record synced to SF has an email address
    	var contEmail = getFieldValue(contRec, 'email');
    	var contSFId = getFieldValue(contRec, 'custentity_sf_contact_id');
 
    	if (!contEmail && contSFId)
    	{
    		if (!emailOnLoad2){    		
    			alert('This Contact is synced to SalesForce, the email cannot be blank.');
    		}
    		else{
     			contRec.setValue({
    				fieldId: 'email',
    				value: emailOnLoad2,
    				ignoreFieldChange: true
    			})
    			alert('This Contact is synced to SalesForce, the email cannot be blank, original value will be reset.');
    		}
			return false;
    	}
    	return true;
    }
    
    
    // Function to retrieve the value of a field
    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });

        return value;
    }
    

    return {
        pageInit: pageInit,        
    	saveRecord: saveRecord
    };
    
});
