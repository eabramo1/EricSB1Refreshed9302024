/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_pm_conversation.js
//Written in SuiteScript 2.0
//
//Created by:	Eric Abramo  10-2019
//
//Purpose:		Validation for the PM Customer Conversation form
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
 
define([], function () {
	/**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */	
	
	function onlineSaveRecord(scriptContext) {
		var winLossRecord = scriptContext.currentRecord;
		
		// Validate Date of Conversation is not in the future  ****************************** 
		var today = new Date();
		// get difference in seconds
		var diff_seconds = today - winLossRecord.getValue('custrecord_pm_conversation_date');
		// convert seconds into days
		var SecToDays = 1000 * 60 * 60 * 24;
		var diff = diff_seconds / SecToDays;
		// alert('diff is '+diff);		
		if (diff < 0)
		{
			alert('The Date of Conversation cannot be in the future');
			return false;
		}
		
		// Validate Contact or Contact Name(If Not found) is populated ******************************
		var contact = winLossRecord.getValue('custrecord_pm_contact');
		var contact_notfound = winLossRecord.getValue('custrecord_pm_contactnotfound');
		if (!contact && ! contact_notfound)
		{
			alert('You must enter a Contact or a Contact Name(if not found)');
			return false;
		}
		
		return true;
	}
	
	return {
		saveRecord: onlineSaveRecord
	};
});

