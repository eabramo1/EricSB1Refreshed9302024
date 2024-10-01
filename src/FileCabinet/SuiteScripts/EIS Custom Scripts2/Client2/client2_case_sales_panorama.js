/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_sales_panorama.js
//				Written in SuiteScript 2.0
//
//Created by:	Pat Kelleher 02-2021
//
//Purpose:		Pre-Populate and disable fields in Edit Mode upon Page Init function
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//
//
//Revisions:  
//
//	2023-07-05	ZScannell	US1122568 - Logic to enable New Integration Description + re-doing the Pan Data Sources logic
//
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
	function panorama_case_Init(scriptContext) {		
		var record = scriptContext.currentRecord;	
		var record_id = record.id;	
		// Load Library Constant objects
		var emp_c = constant.LC2_Employee;
		var caseType_c = constant.LC2_SalesCaseType;
		var role_c = constant.LC2_Role;
		var newIntegration = record.getValue({fieldId: 'custevent_new_integration_one'});

		// Newly Created Record  - currently being assigned to Donald Brown (SaaS)
		if (!record_id){
			// alert('this is a new Case');
			record.setValue({
				fieldId: 'assigned',
				value: emp_c.Sales_Panorama,
				ignoreFieldChange: false,
				forceSyncSourcing: true					
			})
			// Pre-populate Title field
			record.setValue({
				fieldId: 'title',
				value: 'EIS Sales Panorama Pricing Case',
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})
			// sales_case_customer field
			var sales_case_customer = record.getValue({
				fieldId: 'custevent_case_customer_list'
			})
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
				ignoreFieldChange: false,
				forceSyncSourcing: true	
			})	
		} // end code for NEW Case 

		// Set Sales Admin Case type to "Panorama Pricing Case"
		record.setValue({
			fieldId: 'custevent31',
			value: caseType_c.Panorama,
			ignoreFieldChange: false,
			forceSyncSourcing: true	
		})

		var helpdesk_case = record.getValue({
			fieldId: 'helpdesk'
		})
		if (!helpdesk_case){
			record.setValue({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: false,
				forceSyncSourcing: true
			})
		}	

		var role = runtime.getCurrentUser().role;	
		// if role is not Sales Administrator (1007) or Administrator (3) or Sales Operations Manager (1057) or Sales Operations Director (1065)
		// 	then lock down certain fields
		if(role != role_c.EPSalesAdmin && role != role_c.Administrator && role != role_c.SalesOpsMngr && role != role_c.SalesOpsDir){	
			// alert('Your role means that we need to disable a bunch of fields');
			var assigned_field = record.getField({
				fieldId: 'assigned'
			})
			var status_field = record.getField({
				fieldId: 'status'
			})
			var company_field = record.getField({
				fieldId: 'company' // this is the field called Requested By on the form
			})
			var out_message_field = record.getField({
				fieldId: 'outgoingmessage'
			})			
			assigned_field.isDisabled = true;
			status_field.isDisabled = true;
			company_field.isDisabled = true;
			out_message_field.isDisabled = true;	
		}

		//	US1122568	Enable New Integration Description on load
		if (newIntegration == true){
			record.getField({fieldId: 'custevent_new_integration_desc'}).isDisabled = false;
			currentRec.getField({fieldId: 'custevent_new_integration_desc'}).isMandatory = true;
		}

	}
	
	function panorama_saveRecord(scriptContext) {
		var record = scriptContext.currentRecord;
// get all four values of Data Source field
		//	var pan_data_sources = getFieldValue(record, 'custevent_pan_data_sources');
		var pan_authentication = getFieldValue(record, 'custevent_pan_authentication');
		var pan_counter = getFieldValue(record, 'custevent_pan_counter');
		var pan_ils = getFieldValue(record, 'custevent_pan_ils');
		var pan_tableau_licenses = getFieldValue(record, 'custevent_pan_addl_tableau_license_need');
		var pan_explorer_licenses = getFieldValue(record, 'custevent_pan_nbr_addl_explorer_license');
		var pan_viewer_licenses = getFieldValue(record, 'custevent_pan_nbr_addl_viewer_licenses');


		//	US1122568 - Commenting out due to field deprecation
		// alert('the value of PAN Data Sources is '+ pan_data_sources);
		// if Data Sources is Authentication, COUNTER and/or ILS, and any of those fields are not populated, then alert and return false	
			/*var pan_ds_length = pan_data_sources.length;
//			alert('The value of pan_ds_length is '+pan_ds_length);
			for ( var c=0; pan_ds_length != null && c < pan_ds_length; c++ )
			{
//				alert('this is in the foreloop and the value of c is' +c);
				if (pan_data_sources[c] == constant.LC2_pan_data_sources.Authentication && !pan_authentication) 
					{
						alert ('If Authentication is chosen in the Data Sources field, then you must choose an Authentication value');
						return false;
					}

				if (pan_data_sources[c] == constant.LC2_pan_data_sources.Counter && pan_counter == '')
					{
						alert ('If COUNTER is chosen in the Data Sources field, then you must choose a COUNTER value');
						return false;
					}

				if (pan_data_sources[c] == constant.LC2_pan_data_sources.ILS && !pan_ils)
					{
						alert ('If ILS is chosen in the Data Sources field, then you must choose an ILS value');
						return false;
					}
			}*/


	// If Yes is chosen for Tableau licenses needed, and either the Explorer or Viewer field is not populated, then alert and return false 
		if(pan_tableau_licenses == constant.LC2_yes_no_only.Yes && !pan_explorer_licenses && !pan_viewer_licenses) {
			alert ('Please add number of Explorer and/or Viewer licenses needed');
			return false;
		}

		return true;
	}

	function panorama_fieldChanged(scriptContext){
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;

		switch(fieldId){
			case 'custevent_new_integration_one':
				if (currentRec.getValue({fieldId: 'custevent_new_integration_one'}) == true){
					currentRec.getField({fieldId: 'custevent_new_integration_desc'}).isDisabled = false;
					currentRec.getField({fieldId: 'custevent_new_integration_desc'}).isMandatory = true;
				}else{
					currentRec.getField({fieldId: 'custevent_new_integration_desc'}).isDisabled = true;
					currentRec.getField({fieldId: 'custevent_new_integration_desc'}).isMandatory = false;
				}
				break;
		}
	}



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

	return {
		pageInit: panorama_case_Init,
		saveRecord: panorama_saveRecord,
		fieldChanged: panorama_fieldChanged
	};
});

