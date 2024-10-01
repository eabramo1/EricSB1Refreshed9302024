/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_territory.js
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
//  2022-06-15      KNune       	Original Creation of the Script for Refactoring (no revision history on original SS1 version) (Zach uploaded + deployed in SB2) 				
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
function (LC2Constant, search) {
	
	
	function fieldChanged(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;
		
		if (fieldId == 'custrecord_epterritory_isinactive') 
		{ // if true check for active customers
			if (currentRec.getValue('custrecord_epterritory_isinactive') == true) 
			{
				var recordId = currentRec.getValue({fieldId: 'recordid'});
				
				myFilters = new Array();
				myFilters[0] = search.createFilter ({
					name: 'custentity_epterritory',
					operator: search.Operator.ANYOF,
					values: recordId
				});
				myColumns = new Array();
				myColumns[0] = search.createColumn ({
					name: 'internalid'
				});
				mySearchResults = search.create ({
					type: search.Type.CUSTOMER,
					columns: myColumns,
					filters: myFilters
				}).run().getRange({start:0, end: 1000});
				if (mySearchResults.length > 0)
				{ // if true check for active customers
					alert('Notice: This territory has ' + mySearchResults.length + ' sites and cannot be inactivated until all sites have been updated with a new territory.');
					//clear ep inactive flag
					currentRec.setValue ({
						fieldId: 'custrecord_epterritory_isinactive',
						value: false,
						ignoreFieldChange: true
					});
				}
				else 
				{	// else set isinactive to false
					// alert('Debug: EP IsInactive = ' + nlapiGetFieldValue('custrecord_epterritory_isinactive'));
					currentRec.setValue ({
						fieldId: 'isinactive',
						value: false,
						ignoreFieldChange: true
					});
				}
				
			}
			
			if (fieldId == 'custrecord_ep_territory_sales_group')
			{
				// clear out the Global Region field (because we had to fake sourcing for Global region via Before Load script)
				
				// Not blanking out, but does re-source on save.
				currentRec.setValue ({
					fieldId: 'custrecord_terr_global_region_prefill',
					value: '',
					ignoreFieldChange: true
				});
			}
		}
	}
	
	
	function saveRecord (scriptContext) {
		var currentRec = scriptContext.currentRecord;
		
		
		if (currentRec.getValue('name').length > 100)
		{
			alert('Please limit the Territory name to be within 100 characters');
			return false;
		}
		
		currentRec.setValue ({
			fieldId: 'custrecord_epterritory_isupdated',
			value: true,
			ignoreFieldChange:true
		});
		return true;
	}
	
	return {
		saveRecord: saveRecord,
		fieldChanged: fieldChanged
	};
});