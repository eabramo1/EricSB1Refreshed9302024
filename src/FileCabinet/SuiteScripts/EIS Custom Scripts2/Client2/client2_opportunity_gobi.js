/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_opportunity_gobi.js
//				Written in SuiteScript 2.0
//
//Created by:	Eric Abramo 06-2022
//
//Purpose:		Refactoring code from SuiteScript 1 client script that is used for the GOBI/SSD Opportunity form
//
//Library Scripts Used: library2_constants (linked in define statement)
//
//
//Revisions:	
// 8/24/23	PKelleher	US1117942 Make new GOBI MX RSM field on New MX Quote Details subtab mandatory when using this subtab
//    
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/format'],
		
function(runtime, record, search, constant, format) {
    
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
    	var record = scriptContext.currentRecord;
    	var mode = scriptContext.mode;
    	
    	if (runtime.executionContext != runtime.ContextType.WEBSERVICES){	
    		if (mode == 'create'){
    			var userId = runtime.getCurrentUser().id;  			
                var isSalesRep = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: userId,
                    columns: ['issalesrep']
                });   
    			// If User is a Sales Rep - set the Sales Rep field to this User
                if (isSalesRep.issalesrep == true)
    			{
        			record.setValue({
        				fieldId: 'salesrep',
        				value: userId,
        				ignoreFieldChange: true,
        				forceSyncSourcing: false					
        			})
    			}
                // Not Sales Rep - set SalesRep to the Gobi/SSD Regional Sales Manager
    			else{
    				var this_customer = record.getValue({
    					fieldId: 'entity'
    				})
    				if (this_customer){
    					// call function to lookup and set the GOBI Rep
    					lookupAndSetGobiRep(record, this_customer);
    	                // else the SalesRep will just default to the SalesRep on the Customer record
    				}		
    			}
                
    			// Always set currency to USD
                record.setValue({
    				fieldId: 'custbody_currency_code',
    				value: constant.LC2_Currency.USDollar,
    				ignoreFieldChange: true,
    				forceSyncSourcing: false					
    			})    			
    			
    			
    			// Set the expected close date
    			// Note:  In Javascript, January = 0, Feb = 1, etc.
    			var tDate = new Date()
    			if (tDate.getMonth() <= 5)	// If today is before June 30 - use June 30 of THIS year
    			{
            		var june30 = new Date(tDate.getFullYear(),5,30);
    				var june30_parsed = format.parse({
            			value: june30,
            			type: format.Type.DATE
            		});
            		// alert('the value of fmt_june30 is '+fmt_june30)
    				//fiscal year = calendar year (Jan-June)
                    record.setValue({
        				fieldId: 'expectedclosedate',
        				value: june30_parsed,
        				ignoreFieldChange: true,
        				forceSyncSourcing: false					
        			})    
    			}
    			else{ // If today is after June 30 - use June 30 of NEXT year
    				//fiscal year = calendar year + 1 (July-Dec)
    				var nextJune30 = new Date(tDate.getFullYear()+1,5,30);
    				var nextJune30_parsed = format.parse({
            			value: nextJune30,
            			type: format.Type.DATE
            		});
                    record.setValue({
        				fieldId: 'expectedclosedate',
        				value: nextJune30_parsed,
        				ignoreFieldChange: true,
        				forceSyncSourcing: false					
        			})
    			}		
    		}	// end 'create'	
    		// Not a new Opportunity 
    		// and User is not Admin role Disable the Custom Form field
    		else if (runtime.getCurrentUser().role != constant.LC2_Role.Administrator)
    		{
    			record.getField({fieldId: 'customform'}).isDisabled = true;
    		}
    	}	// end not runtime.executionContext != runtime.ContextType.WEBSERVICES
    }	// end pageInit

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
    	var record = scriptContext.currentRecord;
    	var fieldName = scriptContext.fieldId;
    	
    	if (fieldName == 'entity')
    	{
    		var this_customer = record.getValue({
    			fieldId: 'entity'
    		});	
    		if (this_customer)
    		{
                // call function lookupAndSetGobiRep()
    			lookupAndSetGobiRep(record, this_customer);
    		}		// end this_customer
    	}			// end change of Entity field  	
    }


    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    	var record = scriptContext.currentRecord;
    	
    	// Suppress "amount does not equal qty * rate" messages by setting rate = amount/qty	
		// var record_id = record.id;		
    	var qty = record.getCurrentSublistValue({
    		sublistId: 'item',
    		fieldId: 'quantity'
    		});
    	var amt = record.getCurrentSublistValue({
    		sublistId: 'item',
    		fieldId: 'amount'
    		});    	
    	var rate = 0;
    	if (!isNaN(qty) && qty !=0)
    	{
    		rate = amt/qty;
    		record.setCurrentSublistValue({
    			sublistId: 'item',
    			fieldId: 'rate',
    			value: rate,
    			ignoreFieldChange: true
    			});
    	}	
    	return true;
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
		var record = scriptContext.currentRecord;
		// var record_id = record.id;
		
		// Require at least one line item
    	var itemLineCount = record.getLineCount({
    		sublistId: 'item'
    		});	
    	if(itemLineCount < 1)
    	{
    		alert("You must enter at least one item for this opportunity.");
    		return false;
    	}

    	// If closed Lost Require at least one Reason Lost
    	var oppty_status = record.getValue({
    			fieldId: 'entitystatus'
    		})
    	if (oppty_status == constant.LC2_Oppy_sts.ClosedLost)
    	{
    		var reasons_lost = record.getValue({
    			fieldId: 'custbody_winser_reasonslost'
    		})
    		if (!reasons_lost)
    		{
    			alert('To set your Opportunity to Closed-Lost, you must provide a Reason Lost');
    			return false;
    		}
    	}  	

    	// Don't allow Expected Close too far into future
    	var today2 = new Date();
    	var expected_close_unparsed = record.getValue({
			fieldId: 'expectedclosedate'
		})
		var expected_close_parsed = format.parse({
            value: expected_close_unparsed,
            type: format.Type.DATE
		})			
    	// get difference in seconds
    	var diff_seconds = expected_close_parsed - today2;
    	// convert seconds into days
    	var SecToDays = 1000 * 60 * 60 * 24;
    	var diff = diff_seconds / SecToDays;
    	// 1095 days (3 years) as the limit
    	if (diff > 1095)
    	{
    		alert('Expected Close Date is too far into the future, Please correct');
    		return false;
    	}

		// US1117942 GOBI MX RSM field on New MX Quote Details subtab is mandatory if Office field on Employee record = Mexico
		var mx_rsm = record.getValue({fieldId: 'custbody_gobi_mx_rsm'})
		var userID = runtime.getCurrentUser().id;

		if ((mx_rsm == '' || mx_rsm == null)) {
			// Do lookup on dropdown field to see if EMPLOYEE record has Office field as Mexico
			var isMexOfficeEmp = search.lookupFields({
				type: search.Type.EMPLOYEE,
				id: userID,
				columns: ['custentity_employee_office']
			});
			var isMexOfficeEmp_obj = isMexOfficeEmp.custentity_employee_office;
			var userMexOffice = isMexOfficeEmp_obj[0].value;

			// alert('The value of UserMexOffice is = ' + userMexOffice);

			if (userMexOffice == constant.LC2_Emp_Office.Mexico) {
				alert('Please populate the GOBI MX RSM field on the MX Quote Details subtab.');
				return false;
			}
		}

		// set the "Opportunity Form Type" field appropriately (YBP/GOBI)
		var form_type = record.getValue({
			fieldId: 'custbody_oppty_form_type'
		})
		if (form_type != constant.LC2_OppyFormType.GobiSSD)
		{
			record.setValue({
				fieldId: 'custbody_oppty_form_type',
				value: constant.LC2_OppyFormType.GobiSSD,
				ignoreFieldChange: true,
				forceSyncSourcing: false
			})
		}

		return true;
    }	// end Save Function

    
// Function lookupAndSetGobiRep()
// Description:				:	This function looks up the GOBI/SSD Sales Rep for a specified Customer and sets the Opportunity Sales Rep field
//     							to that of the looked Up GOBI/SSD Sales Rep (if present)
// Input:
//    	record_in	:	The record object
//    	customer_in	:	The Internal ID of the Customer to lookup
// Returns:	N/A
// 								Note - it is possible there is NO GOBI Rep under a customer
// *************************************************************************************
function lookupAndSetGobiRep(record_in, customer_in){
    var cust_lookup = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customer_in,
        columns: ['custentity_teammember16']
    });    	                
    var gobi_rep_obj = cust_lookup.custentity_teammember16;
    if(gobi_rep_obj != ''){
    	var this_gobi_rep = gobi_rep_obj[0].value;   	
    	var recordid = record_in.id;
    	// Only alert the User if this is not a Create Record (there is a record id)
    	if(recordid){
    		alert('By changing the Customer, the Sales Rep on this Opportunity should be set to the GOBI/SSD Sales Rep');
    	}
    	record_in.setValue({
			fieldId: 'salesrep',
			value: this_gobi_rep,
			ignoreFieldChange: true,
			forceSyncSourcing: false					
		})
    }
}

    
    
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        saveRecord: saveRecord
    };
    
});
