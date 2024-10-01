/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_pm_conversation_uiform.js
//Written in SuiteScript 2.0
//
//Created by:	Christine Neale April 2020
//
//Purpose:		Validation for the PM Customer Conversation form
//
//
//Library Scripts Used: 	None
//
//
//Revisions:  
//	5/12/2020	Christine Neale		Original Version
//  06/30/2020	Christine Neale 	US662522 Product list changes
//
//
//
//----------------------------------------------------------------------------------------------------------------
define([],

function() {
    
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
    	var pmRec = scriptContext.currentRecord;
    	
    	hideField(pmRec, 'isinactive', false);
    	hideField(pmRec, 'customform', false);
    	
    	if(scriptContext.mode == 'create'){
	    	// Hide all the fields that should not display in first instance
	    	hideField(pmRec, 'custrecord_pm_contactnotfound', false); // Contact text field
	    	hideField(pmRec, 'custrecord_pm_contact_phone', false); // Contact text phone
	    	hideField(pmRec, 'custrecord_pm_contact_title', false); // Contact text title
	    	hideField(pmRec, 'custrecord_pm_conducted_by', false) // Conducted By (text)
	    	
	    	// Set Initial Mandatory Fields
	    	mandatoryField(pmRec, 'custrecord_pm_contact', true); // Contact
	    	mandatoryField(pmRec, 'custrecord_pm_conducted_by_list', true); // Conducted By (list)
    	}
    	else{
    	// Sort out which fields should display/be mandatory etc. on Edit
 
    		// Conducted By
    		if (pmRec.getValue('custrecord_pm_emp_not_found') != true){
    			mandatoryField(pmRec, 'custrecord_pm_conducted_by_list', true);
    	    	hideField(pmRec, 'custrecord_pm_conducted_by', false) // Conducted By (text)
    		}
    		else{
    			mandatoryField(pmRec, 'custrecord_pm_conducted_by', true);
    			disableField(pmRec, 'custrecord_pm_conducted_by_list', true);
    		}
    			
    		// Contact Text Fields
    		if (pmRec.getValue('custrecord_pm_contact_not_found') != true){
    			mandatoryField(pmRec, 'custrecord_pm_contact', true);
    	    	hideField(pmRec, 'custrecord_pm_contactnotfound', false); // Contact text field
    	    	hideField(pmRec, 'custrecord_pm_contact_phone', false); // Contact text phone
    	    	hideField(pmRec, 'custrecord_pm_contact_title', false); // Contact text title
    		}
    		else {
    			if (pmRec.getValue('custrecord_pm_contact')){
    				mandatoryField(pmRec, 'custrecord_pm_contact', true);
    			}
    			else{
    				mandatoryField(pmRec, 'custrecord_pm_contactnotfound', true);
    				mandatoryField(pmRec, 'custrecord_pm_contact_phone', true);
    				mandatoryField(pmRec, 'custrecord_pm_contact_title', true);
    			}
    		}
    	}
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	var pmRec = scriptContext.currentRecord;
        var name = scriptContext.fieldId;

     // Conducted By not Found
        if(name == 'custrecord_pm_emp_not_found') {
        	var pmEmp_notF = pmRec.getValue('custrecord_pm_emp_not_found');
            if(pmEmp_notF == true){
            	// Display the Conducted by text field & make mandatory 
            	hideField(pmRec, 'custrecord_pm_conducted_by', true); // Conducted By text field
            	mandatoryField(pmRec, 'custrecord_pm_conducted_by', true);
             	// Conducted By List Field clear, protect & no longer Mandatory
            	setFieldValue(pmRec, 'custrecord_pm_conducted_by_list', '');
            	disableField(pmRec, 'custrecord_pm_conducted_by_list', true);
            	mandatoryField(pmRec, 'custrecord_pm_conducted_by_list', false);
            }
            else {
            	// Clear the Conducted By text field, remove mandatory designation & hide
            	hideField(pmRec, 'custrecord_pm_conducted_by', false); 
            	mandatoryField(pmRec, 'custrecord_pm_conducted_by', false);
            	setFieldValue(pmRec, 'custrecord_pm_conducted_by', '');
            	// Make the Conducted By List field mandatory & unprotect
            	disableField(pmRec, 'custrecord_pm_conducted_by_list', false);
            	mandatoryField(pmRec, 'custrecord_pm_conducted_by_list', true);
            }
        }  
        
        // Contact not Found
        if(name == 'custrecord_pm_contact_not_found') {
        	var pmCont_notF = pmRec.getValue('custrecord_pm_contact_not_found');
            if(pmCont_notF == true){
            	// Display the Contact text fields & make mandatory 
            	hideField(pmRec, 'custrecord_pm_contactnotfound', true); // Contact text field
            	mandatoryField(pmRec, 'custrecord_pm_contactnotfound', true);
            	hideField(pmRec, 'custrecord_pm_contact_phone', true); // Contact text phone
            	mandatoryField(pmRec, 'custrecord_pm_contact_phone', true);
            	hideField(pmRec, 'custrecord_pm_contact_title', true); // Contact text title
            	mandatoryField(pmRec, 'custrecord_pm_contact_title', true);
            	// Contact select field no longer mandatory
            	mandatoryField(pmRec, 'custrecord_pm_contact', false);
            }
            else {
            	// Clear the Contact text fields remove mandatory designation & hide
            	hideField(pmRec, 'custrecord_pm_contactnotfound', false); // Contact text field
            	mandatoryField(pmRec, 'custrecord_pm_contactnotfound', false);
            	setFieldValue(pmRec, 'custrecord_pm_contactnotfound', '');
            	hideField(pmRec, 'custrecord_pm_contact_phone', false); // Contact text phone
            	mandatoryField(pmRec, 'custrecord_pm_contact_phone', false);
            	setFieldValue(pmRec, 'custrecord_pm_contact_phone', '');
            	hideField(pmRec, 'custrecord_pm_contact_title', false); // Contact text title
            	mandatoryField(pmRec, 'custrecord_pm_contact_title', false);
            	setFieldValue(pmRec, 'custrecord_pm_contact_title', '');
            	// Contact Select field now mandatory
            	mandatoryField(pmRec, 'custrecord_pm_contact', true);
            }
        	
        }

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
    	
    	var pmRec = scriptContext.currentRecord;
		
		// Validate Date of Conversation is not in the future   
		var today = new Date();
		// get difference in seconds
		var diff_seconds = today - pmRec.getValue('custrecord_pm_conversation_date');
		// convert seconds into days
		var SecToDays = 1000 * 60 * 60 * 24;
		var diff = diff_seconds / SecToDays;
		// alert('diff is '+diff);		
		if (diff < 0)
		{
			alert('The Date of Conversation cannot be in the future');
			return false;
		}
		
		// Validate Conducted By/Not in the list
		var condBy = pmRec.getValue('custrecord_pm_conducted_by_list');
		var condBy_nf = pmRec.getValue('custrecord_pm_emp_not_found');
		var condBy_txt = pmRec.getValue('custrecord_pm_conducted_by');
		
		if (!condBy && condBy_nf != true)
		{
			alert('You must select a value for "Conducted By" or check "Conducted By Not In The List" to enter details manually.');
			return false;
		}
		
		if (condBy_nf == true && !condBy_txt){
			alert('You must enter Conducted By name in text box provided where "Conducted By Not In The List" is selected');
			return false;
		}
		
		// Validate Customer - this is done 
		if (!pmRec.getValue('custrecord_pm_customer')){
			alert('Please select a Customer');
			return false;
		}
		
		// Validate Contact/Contact not in list/Contact Name
		var cont = pmRec.getValue('custrecord_pm_contact');
		var contact_notfound = pmRec.getValue('custrecord_pm_contact_not_found');
		var cont_name = pmRec.getValue('custrecord_pm_contactnotfound');
		var cont_phone = pmRec.getValue('custrecord_pm_contact_phone');
		var cont_job = pmRec.getValue('custrecord_pm_contact_title');
		if ((cont == ''||cont == null) && contact_notfound != true)
		{
			alert('You must select a Contact or check "Contact Not In The List" to enter contact details manually.');
			return false;
		}
		
		if (contact_notfound == true && (!cont_name || !cont_phone || !cont_job)){
			alert('You must enter Contact Name, Phone & Job Title in text boxes provided where "Contact Not In The List" is selected');
			return false;
		}
		
		return true;

    }
    
    // Utility Functions start here
    
    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });

        return record;
    }

    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }

    function hideField(record, field, flag){
        record.getField(field).isVisible = flag;
        return record;
    }

    function mandatoryField(record, field, flag){
        record.getField(field).isMandatory = flag;
        return record;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
