/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_opportunity_productTarget.js
//				Written in SuiteScript 2.0
//
//Created by:	Pat Kelleher 12-2021
//
//Purpose:		New Product Target form created for Sales 
//
//Library Scripts Used: library2_constants (linked in define statement)
//
//
//Revisions:   
//				02-14-2022	eAbramo		US892776 Add ability to push the Item into WinSeR
//				10/31/2022	PKelleher	US1004491 Make Product Target Reason(s) Closed field disabled unless Product Target Status is Unsuccessful, then enable
//				07/24/2024	eAbramo		US1277955 SuiteSign On Replacement - MLO and Campaign ID
//
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
		
function(runtime, record, search, constant, utility) {

	// Global Variables 
	var G2_writeToWinSR = false; 	// US892776 - Indicate when the Product Target needs to be written to WinSeR
	var G2_init_pt_status = null;	// US892776 - Used to reset Product Target Status for various validation reasons
	
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
		var record_id = record.id;
		var sales_rep = record.getValue({
			fieldId: 'salesrep'
		});		
		var cust = record.getValue({
			fieldId: 'entity'
		});
		var opp_form_type = record.getValue({
			fieldId: 'custbody_oppty_form_type'
		});
		G2_init_pt_status = record.getValue({
			fieldId: 'custbody_pt_status'
		});

		if (!opp_form_type){
			// If (Oppy) Form Type is empty, then populate with the value of Product Target
			record.setValue({
				fieldId: 'custbody_oppty_form_type',
				value: constant.LC2_OppyFormType.ProdTarg,
				ignoreFieldChange: true, 
				forceSyncSourcing: false	
				})
		}

		if (cust == constant.LC2_Customer.EbscoMktgLeads){
			// Clear Customer field when a form switches from a Mktg Lead form to a Product Target form. Automatically clears the SalesRep field also, so no need to code for that.
			// If Customer is ns231089 EBSCO Marketing Leads, then clear the field
			record.setValue({
				fieldId: 'entity',
				value: '',
				ignoreFieldChange: false 
				})
		}

		// Fields are enabled to accommodate csv update on form but coded here to disable 
		disableField(record, 'custbody_oppty_form_type', true);
		disableField(record, 'projectedtotal', true);
		disableField(record, 'entitystatus', true);			
		disableField(record, 'custbody_pt_date_received', true);

		// US1004491 Disable Product Target Reason(s) Closed field if Product Target Status is NOT Unsuccessful
		if (G2_init_pt_status != constant.LC2_ProdTarg_sts.Unsucc){
			disableField(record, 'custbody_pt_reasons_lost', true);
		}
		
		// US892776 Add ability to push the Item into WinSeR
		// if Product Target Status = Already Sent to WinSer" - or "Send to WinSer" or "Successful" then disable the following fields:
			//	Product Target Status
			// 	Customer
			// 	Item
		if (constant.LC2_ProdTarg_sts.changeNotAllowed(G2_init_pt_status) == true){
			disableField(record, 'custbody_pt_status', true);
			disableField(record, 'entity', true);		
			// Need to get the Sublist field to disable it			
			var pt_itemField = record.getSublistField({
				sublistId: 'item',
				fieldId: 'item',
				line: 0
			});				
			pt_itemField.isDisabled = true;
		}
		
    } // end Page Init Function

    
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
    	var record_id = record.id;
    	var name = scriptContext.fieldId;
		var pt_status = record.getValue({
			fieldId: 'custbody_pt_status'
		});
		var pt_reasons_lost = record.getValue({
			fieldId: 'custbody_pt_reasons_lost'
		});
		var pt_contact_date = record.getValue({
			fieldId: 'custbody_pt_contact_date_sales_rep'
		});

    	// Product Target Status:
        if(name == 'custbody_pt_status') {
        	
        	G2_writeToWinSR = false;
        	
        	// US892776 Prevent Users changing the status to Sent
        	if(pt_status == constant.LC2_ProdTarg_sts.Sent){
    			record.setValue({
    				fieldId: 'custbody_pt_status',
    				value: G2_init_pt_status,
    				ignoreFieldChange: false
    			})
            	alert('"Successful - Already Sent to WinSer" is not valid.  The Product Target Status has been restored to its original value'); 	
        	}
        	
       		// US892776 - Begin Send to WinSeR Validation on field Change
       		if (pt_status == constant.LC2_ProdTarg_sts.SendtoWinSeR){
    			var OkaytoSendToWinSer = true;
    			var cannotSendToWinSeR_Reason = ', ';
       			// 1) The Product Target must first be saved
    			if(!record_id)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Product Target must first be saved. ';			
				}				
           		// 2) The  Product Target must have a valid Customer
				var customer = record.getValue({
					fieldId: 'entity'
				});
				if (customer == '' || customer == null)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Product Target must have a valid Customer. ';						
				}          		
				// Else there IS a Customer
				else{
					// 3) If it's Stage is Prospect/Lead - it must first be converted to a Customer
					var customer_lkup = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: customer,
						columns: ['stage', 'custentity_oeapproved']
					})
					var customer_stage = customer_lkup.stage[0].value;
					var oe_approved = customer_lkup.custentity_oeapproved;
					// alert('value of customer_stage  is '+customer_stage+'. The value of oe_approved is '+oe_approved);
					if (customer_stage == 'PROSPECT' || customer_stage == 'LEAD'){
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This Product Target Customer is still a Prospect/Lead.  In order to send this Product Target to WinSer please contact Sales Operations to convert the Prospect/Lead to a Customer.  The customer must also be Approved by DDE Order Processing. ';
					}
					// 4) if Customer isn't OE Approved					
					if (customer_stage == 'CUSTOMER' && oe_approved == false){
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This Customer does not yet exist in WinSer.  Once the customer is approved by DDE Order Processing this Product Target item can be sent to WinSeR. ';	
					}				
				}	// End Else there IS a Customer			
           		// 5) There is more than one Item in this Product Target - or zero items
		        var itemCount = record.getLineCount({
		        	 sublistId: 'item'
		        	});
				if (itemCount > 1)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' There is more than one Item in this Product Target. ';						
				}
				if (itemCount < 1)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' You need at least one Item in this Product Target. ';						
				}
				// Item level validation
				if (itemCount == 1){				
					var business_line = record.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_sourced_business_line',
						line: 0
						});
					// 6) Do Not Allow 'Send To WinSeR' if Prod Offering is DDE Not a Sellable Item
					if (business_line == 'Not a DDE Sellable Item')
					{
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This item isn\'t supported in WinSeR. ';
					}
					// 7) Do Not Allow 'Send To WinSeR' if Prod Offering is Flipster 
					if (business_line == 'FLIPSTER')
					{
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' Flipster items aren\'t supported in WinSeR. ';							
					}
					// 8) Do Not Allow 'Send To WinSeR' if Prod Offering is eBook Perpetual	
					var isPerpetual = record.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_sourced_isperpetual',
						line: 0
						});					
					if (business_line == 'NL - NetLibrary' && isPerpetual == true)
					{
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' eBook Perpetual items aren\'t supported in WinSeR. '
					}
				}
				// Otherwise set G2_writeToWinSR = true;
				if (OkaytoSendToWinSer == true)
				{
					G2_writeToWinSR = true;					
				}
				else
				{
					record.setValue({
	    				fieldId: 'custbody_pt_status',
	    				value: G2_init_pt_status,
	    				ignoreFieldChange: false
	    			})
					// nlapiSetFieldValue('custbody_lead_status', leadStatusOnLoad, false, true);
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason.substring(2);
					alert('You cannot set the Product Target Status to "Successful - Send to WinSeR": '+cannotSendToWinSeR_Reason+'  Your Product Target Status has been reset to its original value');	
				}				
       		} // End SendToWinSer Validation
       	
        	// if Product Target Status is Unsuccessful:
        	if (pt_status == constant.LC2_ProdTarg_sts.Unsucc){

        		// US1004491 Enable Product Target Reason(s) Closed field if Product Target Status is Unsuccessful
        		disableField(record, 'custbody_pt_reasons_lost', false);

        		// If Status is Unsuccessful and has no contact date but has a Reasons Lost value:
        		// alert('pt_reasons_lost is '  +  pt_reasons_lost  +   ' ---- pt_contact_date is' +  pt_contact_date);       		
        		if (!pt_contact_date && pt_reasons_lost != '')
            		{
            			alert('A Product Target Initial Contact Date is required if the Product Target Status is Unsuccessful.');
            		}
    			// If Status is Unsuccessful and has no Reasons Lost value but has a contact date:
        		if (pt_contact_date != '' && !pt_reasons_lost)
        		{
        			alert('A Product Target Reason(s) Lost value is required if the Product Target Status is Unsuccessful.');
        		}
        		// If Status is Unsuccessful with no Reasons Lost value and no contact date:
        		if (!pt_contact_date && !pt_reasons_lost)
        		{
        			alert('Both a Product Target Initial Contact Date and a Product Target Reason(s) Lost value are required if the Product Target Status is Unsuccessful.');
        		}
        	}
 
        	// US1004491 If Product Target status changes from Unsuccessful to something else, then disable and clear Reasons Lost field
            if (pt_status != constant.LC2_ProdTarg_sts.Unsucc){
           		disableField(record, 'custbody_pt_reasons_lost', true);
           		record.setValue({
            	fieldId: 'custbody_pt_reasons_lost',
            	value: '',
            	ignoreFieldChange: false 
            	})
            }
        		
           	// If Product Target Status is Contacted or Successful then send alert to populate Product Target Initial Contact Date
        	// Modified for US892776
       		if (!pt_contact_date){
       			if (pt_status == constant.LC2_ProdTarg_sts.Contacted || pt_status == constant.LC2_ProdTarg_sts.Succ || pt_status == constant.LC2_ProdTarg_sts.SendtoWinSeR || pt_status == constant.LC2_ProdTarg_sts.Sent){
       				alert('A Product Target Initial Contact Date is required if the Product Target Status is "Contacted" or "Successful."');
       			}      			
       		}     		
        } // end modification to Product Target Status

    } // end Field Change Function

    
    
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
		var record_id = record.id;
		var pt_status = record.getValue({
			fieldId: 'custbody_pt_status'
		});
		var pt_contact_date = record.getValue({
			fieldId: 'custbody_pt_contact_date_sales_rep'
		});
		var pt_reasons_lost = record.getValue({
			fieldId: 'custbody_pt_reasons_lost'
		});
		var sales_rep = record.getValue({
			fieldId: 'salesrep'
		});
		var oppty_formtype = record.getValue({
			fieldId: 'custbody_oppty_form_type'
		});

		// When Reasons Lost becomes mandatory (Product Target Status changes to 'Unsuccessful'), make field mandatory and give alert and return false
		if(pt_status == constant.LC2_ProdTarg_sts.Unsucc){
			// If Status is Unsuccessful, then make Product Target Initial Contact Date AND Product Target Reasons Lost mandatory			
			// Require Product Target Initial Contact Date
			if (pt_contact_date == '' )
			{
				alert('Product Target Initial Contact Date is mandatory when Product Target Status is Unsuccessful.');
				return false;
			}
			// Require Product Target Reason(s) Lost
			if (pt_reasons_lost == '')
			{
				alert('A Product Target Reason(s) Lost value is mandatory when Product Target Status is Unsuccessful.');
				return false;
			}        	
		}

		// When Product Target Status is Contacted or Successful, make Product Target Initial Contact Date field mandatory and give alert and return false 
		// Modified for US892776
		if(pt_status == constant.LC2_ProdTarg_sts.Contacted || pt_status == constant.LC2_ProdTarg_sts.Succ || pt_status == constant.LC2_ProdTarg_sts.SendtoWinSeR || pt_status == constant.LC2_ProdTarg_sts.Sent){
			// Require Product Target Initial Contact Date
			if (pt_contact_date == '' )
			{
				alert('Product Target Initial Contact Date is mandatory when Product Target Status is Contacted or Successful.');
				return false;
			}
		}
		
		// Do Not Allow more than 1 Item to be saved on a Product Target form
        var itemCount = record.getLineCount({
        	 sublistId: 'item'
        	});
        //  alert ('itemCount =' +   itemCount);
        if (itemCount > 1) {
        	alert ('Only one Item is allowed per Product Target form.  Please highlight the item to be removed and hit the remove button.');						
        	return false;
        }			
        if (itemCount < 1) {
        	alert ('This form requires one Item to be included.  Please add one before saving.');						
        	return false;
        }			
    
		// If Product Target Status is Successful or Unsuccessful and there's a dollar amount on the Item, clear dollar amount field on Items subtab
		var amt = record.getSublistValue({ 
			 sublistId: 'item',
			 fieldId: 'amount',
			 line: 0
			});
		// modified for US892776
		if(amt > 0){
			if(pt_status == constant.LC2_ProdTarg_sts.Unsucc || pt_status == constant.LC2_ProdTarg_sts.Succ || pt_status == constant.LC2_ProdTarg_sts.SendtoWinSeR || pt_status == constant.LC2_ProdTarg_sts.Sent){
				var lineNum = record.selectLine({
					sublistId: 'item',
					line: 0
				});

				record.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'amount',
					value: '0',
					ignoreFieldChange: true
				});

				record.commitLine({
					sublistId: 'item'
				});	
			}
		}

		// If Product Target Status is Developed or Contacted, then set the real Status to 2-Develop
		if (pt_status == constant.LC2_ProdTarg_sts.Dev || pt_status == constant.LC2_ProdTarg_sts.Contacted){
			record.setValue({
				fieldId: 'entitystatus',
				value: constant.LC2_Oppy_sts.Dev,
				ignoreFieldChange: false
			})
		}
		// If Product Target Status is Successful, then set the real Status to 6-Closed - Won
		// modified for US892776
		if (pt_status == constant.LC2_ProdTarg_sts.Succ || pt_status == constant.LC2_ProdTarg_sts.SendtoWinSeR || pt_status == constant.LC2_ProdTarg_sts.Sent){
			record.setValue({
				fieldId:	'entitystatus',
				value: 		constant.LC2_Oppy_sts.ClosedWon,
				ignoreFieldChange: false
			})
		}
		// If Product Target Status is Unsuccessful, then set the real Status to 7-Closed - Lost
		if (pt_status == constant.LC2_ProdTarg_sts.Unsucc){
			record.setValue({
				fieldId: 'entitystatus',
				value: constant.LC2_Oppy_sts.ClosedLost,
				ignoreFieldChange: false
			})
		}

		// TA929293 Defect fix - set the Opportunity form Type field
		if(oppty_formtype != constant.LC2_OppyFormType.ProdTarg){
			record.setValue({
				fieldId: 'custbody_oppty_form_type',
				value: constant.LC2_OppyFormType.ProdTarg,
				ignoreFieldChange: true
			})
		}

		// EA 02-18-2022:  US892776 Add logic to open a new window on Save that calls the writeMLO suitelet
		if (G2_writeToWinSR) {		
			// BEGIN Re-apply validation for Send to Winser *******************************************************************	
       		// The  Product Target must have a valid Customer
			var customer = record.getValue({
				fieldId: 'entity'
			});
			if (customer == '' || customer == null){
				alert('The Product Target must have a valid Customer');
				return false;
			} 		
			else{
				// If it's Stage is Prospect/Lead - it must first be converted to a Customer
				var customer_lkup = search.lookupFields({
					type: search.Type.CUSTOMER,
					id: customer,
					columns: ['stage', 'custentity_oeapproved']
				})
				var customer_stage = customer_lkup.stage[0].value;
				var oe_approved = customer_lkup.custentity_oeapproved;
				if (customer_stage == 'PROSPECT' || customer_stage == 'LEAD'){
					alert('This Product Target Customer is still a Prospect/Lead.  In order to send this Product Target to WinSer please contact Sales Operations to convert the Prospect/Lead to a Customer.  The customer must also be Approved by DDE Order Processing');
					return false;
				}					
				if (customer_stage == 'CUSTOMER' && oe_approved == false){
					alert('This Customer does not yet exist in WinSer.  Once the customer is approved by DDE Order Processing this Product Target item can be sent to WinSeR');	
					return false;
				}				
			}	
			// Item level validation
			if (itemCount == 1){				
				var business_line = record.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_sourced_business_line',
					line: 0
					});
				// 6) Do Not Allow 'Send To WinSeR' if Prod Offering is DDE Not a Sellable Item
				if (business_line == 'Not a DDE Sellable Item'){
					alert(' This item isn\'t supported in WinSeR');
					return false;
				}
				// 7) Do Not Allow 'Send To WinSeR' if Prod Offering is Flipster 
				if (business_line == 'FLIPSTER'){
					alert('Flipster items aren\'t supported in WinSeR');
					return false;
				}
				// 8) Do Not Allow 'Send To WinSeR' if Prod Offering is eBook Perpetual	
				var isPerpetual = record.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_sourced_isperpetual',
					line: 0
					});					
				if (business_line == 'NL - NetLibrary' && isPerpetual == true){
					alert('eBook Perpetual items aren\'t supported in WinSeR');
					return false;
				}
			}
			// END Re-apply validation for Send to Winser *******************************************************************			
			
			// Begin Code to Push Item into WinSer
			var cust_nskey = record.getValue({
				fieldId: 'entity'
				});
			// alert('cust_nskey is '+cust_nskey);
			var opptyId = record.getValue({
				fieldId: 'id'
				});
			// alert('opptyId is '+opptyId);
			var customer_lkup2 = search.lookupFields({
				type: search.Type.CUSTOMER,
				id: cust_nskey,
				columns: ['entityid']
			})
			var cust = customer_lkup2.entityid;
			// alert('cust is '+cust);
			var itemId = null;
	        var itemCount = record.getLineCount({
	        	 sublistId: 'item'
	        	});
			if (itemCount == 1){
				itemId = record.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: 0
				});
			}
			// alert('itemId is '+itemId);		
			var prdOffId = nlapiLookupField('item', itemId, 'custitem_productoffering_code', null);
			var item_lkup = search.lookupFields({
				type: search.Type.ITEM,
				id: itemId,
				columns: ['custitem_productoffering_code']
			})
			var prdOffId = item_lkup.custitem_productoffering_code;
			// alert('prdOffId is '+prdOffId);
			// US1277955 SuiteSign On Replacement - MLO and Campaign ID
				// window.open('/app/site/hosting/scriptlet.nl?script=1011&deploy=1&cid='+cust+'&opptyId='+opptyId+'&prdOffId='+prdOffId+'&idType=campaignId');  //old URL
			var url = "";
			//alert('crmIdsIn is ' + crmIdsIn);
			if(utility.LU2_isProdEnvironment(runtime.envType) === true){
				url = "https://wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
			}
			else{
				url = "https://qa-wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
			}
			window.open(url+cust+'&prdOffId='+prdOffId+'&&campaignId='+opptyId);

			record.setValue({
				fieldId: 'custbody_pt_status',
				value: constant.LC2_ProdTarg_sts.Sent,
				ignoreFieldChange: true
			})
			// End Code to Push Item into WinSer
		}
		
        return true;
   				
    } // ends saveRecord function

 
    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
/*    function validateField(scriptContext) {
    	
    }*/

 
    
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
	    	var rate = 0; 
			var amt = record.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'amount'
			});
			var qty = record.getCurrentSublistValue({
	       		sublistId: 'item',
				fieldId: 'quantity'
			});
	       	
	       	// Code below is to eliminate the 'Rate does not Equal Quantity' error alert that would otherwise pop up 
	       	if (!isNaN(qty) && qty !=0){
	       		rate = amt/qty;
		       	} 
	 //      	alert('amt = ' + amt + '.  qty = ' + qty + '.  rate = ' + rate);
	       	
			record.setCurrentSublistValue({
	       		sublistId: 'item',
	       		fieldId:  'rate',
	       		value: rate,
	       		ignoreFieldChange: true
			});
       
 		return true;

	} // end validateLine function
    
       // Function to disable a field
    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        saveRecord: saveRecord
    };
    
}); // ends entire script
