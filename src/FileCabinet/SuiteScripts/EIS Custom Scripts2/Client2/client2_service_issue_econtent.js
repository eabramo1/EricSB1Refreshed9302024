/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_service_issue_econtent.js
//Written in SuiteScript 2.0
//
//Created by:	Kaanjaree Nune 06-2022 
//
//Purpose:		Validation for the Territory record
//
//Library Scripts Used:
//
//
//  Revisions:  
//  Date            Name            Description
//  2022-06-17      KNune       	Original Creation of the Script for Refactoring (no revision history on original SS1 version) (Zach uploaded + deployed in SB2) 				
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
function (LC2Constant) {
	var closedOnLoad = false;
	function siLoad(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		
		// if loaded as closed, set variable to tell Save function to NOT reset the Si Closed Date
		if (currentRec.getValue('custrecord_sistatus') == LC2Constant.LC2_SIstatus.Resolved) 
		{
			closedOnLoad = true;
		}
		// if new SI
		if ( currentRec.getValue('id') == "" || currentRec.getValue('id') == null )
		{	// for eContent SIs set Issue Type to Content Problem Report (15)
			currentRec.setValue ({
				fieldId: 'custrecord_siissuetype',
				value: LC2Constant.LC2_SIissueType.ContentProbRpt,
				ignoreFieldChange: true
			});
		}
	}

	function siSave(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		
		siStatus = currentRec.getValue('custrecord_sistatus');
		// If SI Status = Open (6) & DeptAssignedTo = Data Acquistion (79) then require MID, DTFORMAT and PID
		// or if SI Status is 2 (Not Started), 8 (In Progress), 5 (Hold), 9 (Scheduled), 10 (Re-Opened)
		
		
		// 2012-12-29 Update the new Number of Linked Cases field
		var curLinkedCases = parseInt(currentRec.getValue('custrecord_count_linked_cases'));
		var cases = currentRec.getValue('custrecord_sicase');
		if (cases == "" || cases == null)
		{	// empty Cases field needs to be handled differently
			var casesCount = 0;
		}
		else
		{	// if Cases field isn't empty get length of Array for the actual count
			var casesCount = cases.length;		
		}
		if (casesCount != curLinkedCases)
		{	// populate cases_count into the NEW "number of Linked Cases" field
			currentRec.setValue ({
				fieldId: 'custrecord_count_linked_cases',
				value: casesCount,
				ignoreFieldChange: true
			});
		}
		
		// 2016-11-11 fixed defect to include "closed Unresolved" (11) in the qualifing statement 
	    // Set Si_Close_Date if the SI Status is set to Closed (7) or Closed Unresolved (11)... (but only if loaded as Not closed)
	    var today = new Date();
		if ((currentRec.getValue('custrecord_sistatus') == LC2Constant.LC2_SIstatus.Resolved || currentRec.getValue('custrecord_sistatus') == LC2Constant.LC2_SIstatus.ClosedUnresolved) && closedOnLoad == false) {   
	        currentRec.setValue ({
	        	fieldId: 'custrecord_si_close_date',
	        	value: today,
	        	ignoreFieldChange:true
	        });
	    }
	    return(true);
	}
	
	return {
		pageInit: siLoad,
		saveRecord: siSave
		};
});

