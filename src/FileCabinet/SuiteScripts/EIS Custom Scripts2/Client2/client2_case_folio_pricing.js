/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_folio_pricing.js
//				Written in SuiteScript 2.0
//
//Created by:	Jeff Oliver  01-2020
//
//Purpose:		Pre-Populate and disable fields in Edit Mode upon Page Init function
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//
//
//Revisions:  
//ACS - Louie Magbanua - lmagbanua@netsuite.com 09/15/2020
//  - Added logic in folio_pricing_case_init function for disabling and enabling of field for field "IF YES, PLEASE SELECT A PARTNER"
//  - Added new variable fo_partner_checkbox in folio_pricing_case_init function
//  - Added logic in fieldChanged for disabling and enabling of field for field "IF YES, PLEASE SELECT A PARTNER"
//  - Added logic in saveRecord to display an alert when the field "ARE YOU REQUESTING A QUOTE FROM A FOLIO PARTNER?" is checked but field "IF YES, PLEASE SELECT A PARTNER" is empty.
//  - Added new variables fo_partner_checkbox and fo_partner_list to saveRecord function
//	8/3/2021	PKelleher	US825203 - Remove code related to 4 inactivated/deleted fields requested by Susan Pavliscak
//	6/14/2022	PKelleher	US971480 FOLIO form enhancements - make two fields mandatory (FOLIO List Each Customer and ID && FOLIO How Do These Libraries Operate together...) when YES is chosen on the field FOLIO Does this Quote Include Accessing Sites or Additional Libraries?
//	7/26/2022	PKelleher	US980911 If 'Does this quote include accessing sites or additional libraries' field is NO then disable two fields ('If Yes, then list Each Customer and ID' and 'If Yes, then explain how these libraries operate together, for example...)
//	12/7/2022	PKelleher	TA778439 If 'Does the site require additional Panorama licenses?  There is a charge for additional licenses.' is NO then disable the 'How many Explorer & How many Viewer licenses needed fields.  If YES, then make the two 'How many...' fields enabled and mandatory
//	12/7/2022	PKelleher	Removed all old commented-out code related to US825203 above (Stacks & Open Athens fields and their subscription fees)
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'], function (runtime, constant) {
	
	/**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	

	
	function folio_pricing_case_Init(scriptContext) {		
		var record = scriptContext.currentRecord;	
		var record_id = record.id;	
		// Load Library Constant objects
		var emp_c = constant.LC2_Employee;
		var caseType_c = constant.LC2_SalesCaseType;
		var role_c = constant.LC2_Role;
    	var fo_ftf = getFieldValue(record, 'custevent_fo_ftf');
    	var fo_ftf_sale_type = getFieldValue(record, 'custevent_fo_ftf_sale_type');
        var fo_partner_checkbox = getFieldValue(record, 'custevent_fo_partner_checkbox');

		// if FTF Checkbox empty, lock FTF Sale Type
		if(!fo_ftf){
			var ftf_saletype_field = record.getField({
			fieldId: 'custevent_fo_ftf_sale_type'
			})			
			ftf_saletype_field.isDisabled = true;			
        }
        
        // if Requesting a quote from a folio partner Checkbox empty, lock partner selection field
		if(!fo_partner_checkbox){
			var partner_list_field = record.getField({
			fieldId: 'custevent_fo_partner_list'
			})			
			partner_list_field.isDisabled = true;			
		}
		
		// Newly Created Record
		if (!record_id){
			// alert('this is a new Case');
			record.setValue({
				fieldId: 'assigned',
				value: emp_c.FOLIO_Pricing,
				ignoreFieldChange: true,
				forceSyncSourcing: false					
			})
			// Pre-populate Title field
			record.setValue({
				fieldId: 'title',
				value: 'EIS Sales FOLIO Pricing Case Form',
				ignoreFieldChange: true,
				forceSyncSourcing: false
			})
			
			// sales_case_customer field
			var sales_case_customer = getFieldValue(record, 'custevent_case_customer_list');						
			// if sales_case_customer empty
			if(!sales_case_customer){
				// get real company
				var company = record.getValue({
					fieldId: 'company'
				})
			}

			// if real company
			if(company){
				// then set the sales case customer to the value in the real company
				record.setValue({
					fieldId: 'custevent_case_customer_list',
					value: company,
					ignoreFieldChange: false,
					forceSyncSourcing: true					
				})	
			}

			// NOW set company field to the current user
			var user_id = runtime.getCurrentUser().id
			// alert('user_id is '+user_id);
			record.setValue({
				fieldId: 'company',
				value: user_id,
				ignoreFieldChange: true					
			})	
		} // end code for NEW Case 

		// Set Sales Admin Case type to "FOLIO Pricing"
		record.setValue({
			fieldId: 'custevent31',
			value: caseType_c.FolioPricing,
			ignoreFieldChange: true					
		})

		var helpdesk_case = record.getValue({
			fieldId: 'helpdesk'
		})
		if (!helpdesk_case){
			record.setValue({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: true		
			})
		}	

		var role = runtime.getCurrentUser().role;	
		// if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
		// 	then lock down certain fields
		if(role != role_c.EPSalesAdmin && role != role_c.Administrator && role != role_c.SalesOpsMngr && role != role_c.SalesOpsDir){	
			record.getField({fieldId: 'assigned'}).isDisabled = true;
			record.getField({fieldId: 'status'}).isDisabled = true;
			record.getField({fieldId: 'company'}).isDisabled = true;
			record.getField({fieldId: 'outgoingmessage'}).isDisabled = true;			
		}

        // US980911 If 'Does this quote include accessing sites or additional libraries' field is NO then disable two fields ('If Yes, then list Each Customer and ID' and 'If Yes, then explain how these libraries operate together, for example...)
		var fo_accsite_addlibr = getFieldValue(record, 'custevent_fo_quote_incl_as_al');

        if(fo_accsite_addlibr == constant.LC2_yes_no_only.No)
        {
           	disableField(record, 'custevent_fo_list_cust_and_ids', true);
          	disableField(record, 'custevent_fo_explain_lib_operate_togeth', true);
        }

        if(fo_accsite_addlibr == constant.LC2_yes_no_only.Yes)
        {
			disableField(record, 'custevent_fo_list_cust_and_ids', false); 
         	mandatoryField(record, 'custevent_fo_list_cust_and_ids', true);

           	disableField(record, 'custevent_fo_explain_lib_operate_togeth', false);
           	mandatoryField(record, 'custevent_fo_explain_lib_operate_togeth', true);
        }

        // TA778439 If 'Does the site require additional Panorama licenses?...' is NO then disable the 'How many Explorer and Viewer licenses needed? field.  If YES, then make 'How many...' field enabled and mandatory
        var fo_needAddlLicenses = getFieldValue(record, 'custevent_fo_site_req_addl_pan_lic');
        
        if(fo_needAddlLicenses == constant.LC2_yes_no_only.No)
        {
          	disableField(record, 'custevent_fo_explorer_licenses', true);
          	disableField(record, 'custevent_fo_viewer_licenses', true);
        }

        if(fo_needAddlLicenses == constant.LC2_yes_no_only.Yes)
        {
			disableField(record, 'custevent_fo_explorer_licenses', false); 
         	mandatoryField(record, 'custevent_fo_explorer_licenses', true);
			disableField(record, 'custevent_fo_viewer_licenses', false); 
         	mandatoryField(record, 'custevent_fo_viewer_licenses', true);
 
        }

	} // end page init
	
    
    function fieldChanged(scriptContext) {
        var foRecord = scriptContext.currentRecord;
        var name = scriptContext.fieldId;

        if(name == 'custevent_fo_ftf'){        	
            var fo_ftf = getFieldValue(foRecord, 'custevent_fo_ftf');            
            if(fo_ftf == true){
            	disableField(foRecord, 'custevent_fo_ftf_sale_type', false);
            }
            else
            {
            	setFieldValue(foRecord, 'custevent_fo_ftf_sale_type', '');
            	disableField(foRecord, 'custevent_fo_ftf_sale_type', true);
            }
        }

        // if requesting for a quote from a folio partner checkbox has changed
        if(name == 'custevent_fo_partner_checkbox'){
        	
            var fo_partner_checkbox = getFieldValue(foRecord, 'custevent_fo_partner_checkbox');
            if(fo_partner_checkbox == true){
            	disableField(foRecord, 'custevent_fo_partner_list', false);
            }
            else
            {
            	setFieldValue(foRecord, 'custevent_fo_partner_list', '');
            	disableField(foRecord, 'custevent_fo_partner_list', true);
            }	
        }

        // US971480 FOLIO form enhancements - When FOLIO Does this Quote Include Accessing Sites or Additional Libraries? is YES, make FOLIO List Each Customer and ID && FOLIO How Do These Libraries Operate together... mandatory   
        // US980911 If 'Does this quote include accessing sites or additional libraries' field is NO then disable two fields ('If Yes, then list Each Customer and ID' and 'If Yes, then explain how these libraries operate together, for example...)
        if(name == 'custevent_fo_quote_incl_as_al'){        	
            var fo_accsite_addlibr = getFieldValue(foRecord, 'custevent_fo_quote_incl_as_al');
            var fo_listCustAndIDs = getFieldValue(foRecord, 'custevent_fo_list_cust_and_ids');
            var fo_howLibOperTogether = getFieldValue(foRecord, 'custevent_fo_explain_lib_operate_togeth');
            
            if(fo_accsite_addlibr == constant.LC2_yes_no_only.No){
            	disableField(foRecord, 'custevent_fo_list_cust_and_ids', true);
            	mandatoryField(foRecord, 'custevent_fo_list_cust_and_ids', false);
            	setFieldValue(foRecord, 'custevent_fo_list_cust_and_ids', '');

            	disableField(foRecord, 'custevent_fo_explain_lib_operate_togeth', true);
            	mandatoryField(foRecord, 'custevent_fo_explain_lib_operate_togeth', false);
            	setFieldValue(foRecord, 'custevent_fo_explain_lib_operate_togeth', '');
            }
            if(fo_accsite_addlibr == constant.LC2_yes_no_only.Yes)
            {
            	disableField(foRecord, 'custevent_fo_list_cust_and_ids', false);
            	mandatoryField(foRecord, 'custevent_fo_list_cust_and_ids', true);
            	
            	disableField(foRecord, 'custevent_fo_explain_lib_operate_togeth', false);
               	mandatoryField(foRecord, 'custevent_fo_explain_lib_operate_togeth', true);

	        	if(!fo_listCustAndIDs || !fo_howLibOperTogether)
	        	{ // US971480 - see above the IF stmt
	        		alert('If this Quote includes Accessing Sites or Additional Libraries, you must populate both the List Each Customer and ID field and the How Do These Libraries Operate Together..." field.');
	        	}
            }
        }

        // TA778439 If 'Does the site require additional Panorama licenses?...' is NO then disable the 'How many Explorer and Viewer licenses needed? field.  If YES, then make 'How many...' field enabled and mandatory & give alert
        if(name == 'custevent_fo_site_req_addl_pan_lic'){        	
            var fo_needAddlLicenses = getFieldValue(foRecord, 'custevent_fo_site_req_addl_pan_lic');
            var fo_totalExpLic = getFieldValue(foRecord, 'custevent_fo_explorer_licenses');
            var fo_totalViewerLic = getFieldValue(foRecord, 'custevent_fo_viewer_licenses');
            
            if(fo_needAddlLicenses == constant.LC2_yes_no_only.No){
            	disableField(foRecord, 'custevent_fo_explorer_licenses', true);
            	mandatoryField(foRecord, 'custevent_fo_explorer_licenses', false);
            	setFieldValue(foRecord, 'custevent_fo_explorer_licenses', '');

            	disableField(foRecord, 'custevent_fo_viewer_licenses', true);
            	mandatoryField(foRecord, 'custevent_fo_viewer_licenses', false);
            	setFieldValue(foRecord, 'custevent_fo_viewer_licenses', '');
            }
            if(fo_needAddlLicenses == constant.LC2_yes_no_only.Yes)
            {
            	disableField(foRecord, 'custevent_fo_explorer_licenses', false);
            	mandatoryField(foRecord, 'custevent_fo_explorer_licenses', true);

            	disableField(foRecord, 'custevent_fo_viewer_licenses', false);
            	mandatoryField(foRecord, 'custevent_fo_viewer_licenses', true);

      			alert('If additional Panorama licenses are required, the "How Many Explorer Licenses?" and "How Many Viewer Licenses?" fields are required.');
            }
        }
    
    } // end fieldChanged
    
    
    function folio_saveRecord(scriptContext) 
    {    	
        var folioCase = scriptContext.currentRecord;
    	var fo_ftf = getFieldValue(folioCase, 'custevent_fo_ftf');
    	var fo_ftf_sale_type = getFieldValue(folioCase, 'custevent_fo_ftf_sale_type');
      	var fo_partner_checkbox = getFieldValue(folioCase, 'custevent_fo_partner_checkbox');
      	var fo_partner_list = getFieldValue(folioCase, 'custevent_fo_partner_list');
		var fo_accsite_addlibr = getFieldValue(folioCase, 'custevent_fo_quote_incl_as_al');
		var fo_cust_and_id = getFieldValue(folioCase, 'custevent_fo_list_cust_and_ids');
		var fo_lib_operate_together = getFieldValue(folioCase, 'custevent_fo_explain_lib_operate_togeth');
        var fo_needAddlLicenses = getFieldValue(folioCase, 'custevent_fo_site_req_addl_pan_lic');
        var fo_totalExpLic = getFieldValue(folioCase, 'custevent_fo_explorer_licenses');
        var fo_totalViewerLic = getFieldValue(folioCase, 'custevent_fo_viewer_licenses');
    	
        //If FTF is checked, validate that FTF Sale Type is populated
    	if (fo_ftf && !fo_ftf_sale_type)
    	{       
			alert('You have indicated that this is a FTF customer.  Please populate the FTF Sale Type.');
	
			return false;
    	} 

      	//If requesting a quote from a folio partner is checked, validate that partner list is populated
      	if(fo_partner_checkbox && !fo_partner_list) {
        	alert('You have indicated that you are requesting a quote from a FOLIO partner.  Please populate the Partner field.');
	
			return false;
        }

        // US971480 FOLIO form enhancements - When FOLIO Does this Quote Include Accessing Sites or Additional Libraries? is YES, make FOLIO List Each Customer and ID && FOLIO How Do These Libraries Operate together... mandatory & don't allow save if not populated
    	if (fo_accsite_addlibr == constant.LC2_yes_no_only.Yes && (!fo_cust_and_id || !fo_lib_operate_together))
    	{       
			alert('Because this Quote includes Accessing Sites or Additional Libraries, you must populate both the List Each Customer and ID field and the How Do These Libraries Operate Together..." field.');
	
			return false;
    	} 
    
        // TA778439 If 'Does the site require additional Panorama licenses?...' is NO then disable the 'How many Explorer and Viewer licenses needed? field.  If YES, then make 'How many...' field enabled and mandatory & give alert
    	// using code below so spaces do not qualify as text
    	if (fo_needAddlLicenses == constant.LC2_yes_no_only.Yes && (fo_totalExpLic + fo_totalViewerLic == 0))
    	{       
			alert('If additional Panorama licenses are required, the "How Many Explorer Licenses?" and "How Many Viewer Licenses?" fields are required.');
	
			return false;
    	} 
    
    	return true;
        
    } // end saveRecord function
    
    // Function to retrieve the value of a field
    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });

        return value;
    }
    
    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }

    function mandatoryField(record, field, flag){
        record.getField(field).isMandatory = flag;
        return record;
    }

    //Uses default values for ignoreFieldChange and forceSyncSourcing, can't be used where default values need to be changed
    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });

        return record;
    }
		
	
	return {
		pageInit: folio_pricing_case_Init,
        fieldChanged: fieldChanged,
        saveRecord: folio_saveRecord

	}
})

