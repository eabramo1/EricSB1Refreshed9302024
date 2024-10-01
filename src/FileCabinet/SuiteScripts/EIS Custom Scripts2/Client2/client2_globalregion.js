/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_globalregion.js
//Written in SuiteScript 2.0
//
//Created by:	Kaanjaree Nune 06-2022 
//
//Purpose:		Validation for the Global Region record
//
//Library Scripts Used:
//
//
//  Revisions:  
//  Date            Name            Description
//  2022-06-16      KNune       	Original Creation of the Script for Refactoring (no revision history on original SS1 version) (Zach uploaded + deployed in SB2) 				
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
function (LC2Constant, search) {
	
	function pageInit(scriptContext) {
		var currentRec = scriptContext.currentRecord;
	}
	
	function fieldChanged(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;
		
		if (fieldId == 'custrecord_globalreg_inactive')
		{
			currentRec.setValue ({
				fieldId: 'isinactive',
				value: false,
				ignoreFieldChange: false
			});
		}
	}
	
	function saveRecord(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var thisRecord = currentRec.id;
		
		// Validate that Global Region Name is Unique
		var grName = currentRec.getValue('name');
		var filter = new Array();
		filter[0] = search.createFilter ({
			name: 'name',
			operator: search.Operator.IS,
			values: grName 
		});
		filter[1] = search.createFilter ({
			name: 'id',
			operator: search.Operator.NOTEQUALTO,
			values: thisRecord
		});
		var column = search.createColumn ({
			name: 'id'
		});
		// perform the search
		var mySearchResults = search.create ({
			type: 'CUSTOMRECORD_GLOBAL_REGION',
			columns: column,
			filters: filter
		}).run().getRange({start: 0, end: 1000});
		if (mySearchResults.length > 0) {
			alert('Error: this Global Region already exists');
			return false;
		}
		
		// validate that the name is within 100 chars
		if (currentRec.getValue('name').length > 100)
		{
			alert('Please limit the Global Region name to be within 100 characters');
			return false;
		}
		
		// Validate that Global Region Code is Unique
		var gr_code = currentRec.getValue('custrecord_global_region_code');
		var grFilter = new Array();
		grFilter[0] = search.createFilter ({
			name: 'custrecord_global_region_code',
			operator: search.Operator.IS,
			values: gr_code
		});
		grFilter[1] = search.createFilter ({
			name: 'id',
			operator: search.Operator.NOTEQUALTO,
			values: thisRecord
		});
		var grColumn = search.createColumn ({
			name: 'id'
		});
		
		// perform the search
		var grSearchResult = search.create ({
			type: 'CUSTOMRECORD_GLOBAL_REGION',
			columns: grColumn,
			filters: grFilter
		}).run().getRange({start: 0, end:1000});
		
		if(grSearchResult.length > 0)
		{
			alert('Please enter a different Global Region Code. Another Global Region already uses the Code entered');
			return(false);
		}
		
		// Validate that no inactive child records exist -- child record is Geo Market (customrecord81)
		// only check when this record isn't brand new
		if (thisRecord != "" && thisRecord != null)
		{	// alert ('the value of thisRecord is: '+thisRecord)
			var setto_inactive = currentRec.getValue('custrecord_globalreg_inactive');
			if (setto_inactive == true)
			{
				//alert('alert 1');
				var grFilter2 = new Array();
				grFilter2[0] = search.createFilter ({
					name: 'custrecord_geomarket_global_region',
					operator: search.Operator.ANYOF,
					values: thisRecord
				});
				grFilter2[1] = search.createFilter ({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				});
				var grColumn2 = search.createColumn ({
					name: 'id'
				});
				// perform the search
				var grSearchResult2 = search.create ({
					type: 'CUSTOMRECORD81',
					columns: grColumn2,
					filters: grFilter2
				}).run().getRange({start: 0, end: 1000});
				if(grSearchResult2)
				{
					alert('You cannot inactivate a Global Region until all child Geo Market records are moved to another Global Region or are inactivated.');
					return(false);
				}
			}
		}
		
		currentRec.setValue ({
			name: 'custrecord_globalreg_isupdated',
			value: true,
			ignoreFieldChange: false
		});
		return(true);
	}
	
	return {
		pageInit: pageInit,
		saveRecord: saveRecord,
		fieldChanged: fieldChanged
	};
});