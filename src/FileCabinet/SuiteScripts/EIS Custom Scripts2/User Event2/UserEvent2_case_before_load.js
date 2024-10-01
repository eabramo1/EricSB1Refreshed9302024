/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

// Script:		UserEvent2_case_before_load.js (previously UserEvent_case_beforeLoad_SS2.js)
// 		 		Written in SuiteScript 2.0
//
// Created by:	Krizia Ilaga (of NetSuite ACS)  05-2019
//
// Purpose:		For EIS Accounts Payable Case Management Onboarding to NetCRM
//				The script renders the Delete Attachment button on the AP Case Profile only
//				The script calls the script Client_Record_case_ss2.js (which in turn calls a suitelet to build the Delete Attachments form)
//				Note there is a hard-coded script ID and hard-coded profile ID in the below code
//			
//
//Library Scripts Used: 	None
//
//
// Revisions:  
//	C Neale		03/15/2021	US725157 Expand use of delete attachment button to EP Support Manager 1 role
//							Rename & move script & refactor in line with current SS2 standards
//	JOliver		05/07/2021	US788612 Alert non-U.S. Support Reps on view or edit of cases with Institution requiring US Support
//  PKelleher	05/10/2021	US757838 Display CustSat Notes if populated as an Alert when opening a case in CREATE OR EDIT or VIEW mode
//	PKelleher	09/13/2021	US820970 new Accessibility form - bring in GeoMarket field onto case form
// 	PKelleher	06/01/2022	US966180 Hide EC Case Type field if not populated.  Also hide EC User Access Case Status Reason field if if EC Case Type is not EC User Access Requested.
//	JOliver		6/15/2022	US971874 Hide EBSCO Connect Access Decision field (replacing EC User Access Case Status Reason) if if EC Case Type is is not EC User Access Requested 
//	eAbramo		08/22/2023	US1137522 Add Source Field 'Parent Partner' on NetCRM Case
//----------------------------------------------------------------------------------------------------------------

define(['N/record', 'N/runtime', 'N/ui/serverWidget', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'], 

function(record, runtime, serverWidget, LC2Constant, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	
        var rec = scriptContext.newRecord; // current record
        var recordForm = scriptContext.form;  
        var caseProfile = rec.getValue({fieldId: 'profile'});
        var role = runtime.getCurrentUser().role; //US725157 Retrieve role
        var customer_id = rec.getValue({fieldId:  'company'});
        var folio_impact = rec.getValue({fieldId:  'custevent_ec_folio_impact'});
        var case_form = rec.getValue({fieldId: 'customform'});
        var eccase_type = rec.getValue({fieldId: 'custevent_sf_ec_case_type'}); // EC Case Type field
   		var ECCTdisabled = serverWidget.FieldDisplayType.DISABLED;
   		var ECCThidden = serverWidget.FieldDisplayType.HIDDEN;
	    var ec_casetypeField = recordForm.getField({id: 'custevent_sf_ec_case_type'});
	    var ec_access_decision = recordForm.getField({id: 'custevent_ec_access_decision'});
		var webForm = false;  // Web Form indicator
		var caseForm = rec.getValue('customform'); // added for US1137522
		if (caseForm == LC2Constant.LC2_Form.WebCase){ // *** PK took from Customer before load code & updated LC2 to WebCase
			webForm = true; 
			log.debug('webForm', webForm)
		}
		log.debug('The case_form is ' + case_form);

		if (webForm == false){ // run all code below through the end if not Web Services form 
		
        //US788612 Alert non-U.S. Support Reps on view, edit or creation of cases with Institution requiring US Support
			if(scriptContext.type == 'view' || scriptContext.type == 'edit' || scriptContext.type == 'create') {
		    	    	
		    	if (customer_id && LC2Constant.LC2_Profiles.IsProfileDDESupport(caseProfile) == true) {
	
			    	//check to see if current user is US-based support
			    	var userID = runtime.getCurrentUser().id;
			    	//log.debug('My internal ID is = ' + userID);
		        	var employeeLookup = search.lookupFields({
		                type: search.Type.EMPLOYEE,
		                id: userID,
		                columns: ['custentity_is_us_based_support']
		            });
		        	
		        	//check to see if customer on case requires US-based support
		        	var customerLookup = search.lookupFields({
		                type: search.Type.CUSTOMER,
		                id: customer_id,
		                columns: ['custentity_us_tech_supp']
		            });
		        	
		        	if(employeeLookup.custentity_is_us_based_support == false && customerLookup.custentity_us_tech_supp == true  && folio_impact != true)
		        	{
				        var message = 'The customer on this case requires U.S. Only support.  Please do not make any updates to this case.';
				        var html = '<script language="JavaScript" type="text/javascript">alert("' + message + '");</script>';
				        var field = recordForm.addField({
				        	id: 'custpage_alertfield',
				        	label: 'Alert_Field',
				        	type: 'INLINEHTML'
				        });
				        field.defaultValue = html;
				        
		        	}
		    	}
	
				// US1137522 Add Source Field 'Parent Partner' on NetCRM Case (if one exists)
				// Ensure Case has a Company AND PROFILE IS DDE Support and (Case Form is CustSat Merged or you're in VIEW Mode ) - ADDED because The Caes Form isn't available to Script if you're in VIEW mode
				if(customer_id  && LC2Constant.LC2_Profiles.IsProfileDDESupport(caseProfile) == true && (caseForm == LC2Constant.LC2_Form.CustSatMerged || scriptContext.type == 'view' )){
					var parentChildSearch = search.create({
						type: search.Type.CUSTOM_RECORD + '_ec_parent_child_rel',
						filters: [
							search.createFilter({
								name: 'custrecord_ec_child_customer',
								operator: search.Operator.ANYOF,
								values: customer_id
							}),
							search.createFilter({
								name: 'isinactive',
								operator: search.Operator.IS,
								values: false
							}),
							search.createFilter({
								name: 'custrecord_ec_relationship_type',
								operator: search.Operator.ANYOF,
								values: LC2Constant.LC2_ParentChildRelationshipType.FOLIO
							})
						],
						columns: ['custrecord_ec_parent_customer']
					});
					var parentChildSearchResultSet = parentChildSearch.run().getRange(0, 999);
					if (parentChildSearchResultSet.length > 0){
						var parentId = parentChildSearchResultSet[0].getValue({name: 'custrecord_ec_parent_customer'});
						log.debug('parentId is ',parentId);
						// Lookup the CustID and Company name from the internal ID
						var EntityNameLookup = search.lookupFields({
							type: search.Type.CUSTOMER,
							id: parentId,
							columns: ['entityid', 'companyname']
						})
						var EntityName = EntityNameLookup.entityid + ' ' + EntityNameLookup.companyname;
						log.debug('EntityName is: ', EntityName);

						// render the new Case Parent Parnter field on DDE Subtab
						var caseParentPartner = recordForm.addField({
							id:'custpage_case_parent_partner',
							label:'FOLIO Partner',
							type:serverWidget.FieldType.TEXT
						});
						recordForm.insertField({field: caseParentPartner, nextfield : 'custevent_hide_case_cxp'});
						rec.setValue({
							fieldId: 'custpage_case_parent_partner',
							value: EntityName,
							ignoreFieldChange: true
						});
						// Disable the new field
						recordForm.getField({id: 'custpage_case_parent_partner'}).updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
					}
				} //end US1137522





		    	//US757838 Give alert to user when CustSat Notes field is populated in View, Edit or Create mode
		    	// Get Profile - if a DDE Support profile then run code to show alert for DDE CustSat Notes field if that field is populated
		    	// Load Library Constant object
				if (customer_id && LC2Constant.LC2_Profiles.IsProfileDDESupport(caseProfile) == true){
			    	// pulling customer record b/c case form has this field as being sourced from the customer record
			    	// look up DDE CustSat Notes field to see if populated			
			    	var ddeCustLookup = search.lookupFields({
			    		type: search.Type.CUSTOMER,
			    		id: customer_id,
			    		columns: ['custentity_dde_custsat_notes']
			    	});
			    	log.debug('The value of ddeCustLookup.custentity_dde_custsat_notes is = ' + ddeCustLookup.custentity_dde_custsat_notes);

			    	if(customer_id && ddeCustLookup.custentity_dde_custsat_notes)
			    	{
						log.debug('The value of customer_id is = ' + customer_id);
			    		var message = 'This case contains special handling instructions. The DDE CustSat Notes are: '+ ddeCustLookup.custentity_dde_custsat_notes;
			    		var html = '<script language="JavaScript" type="text/javascript">alert("' + message + '");</script>';
			    		var field = recordForm.addField({
			    			id: 'custpage_alertfield1',
			    			label: 'Alert_Field1',
			    			type: 'INLINEHTML'
			    		});
			    		field.defaultValue = html;
			    	}
			    }
	
				
				// US820970 - code to bring in GeoMarket field from customer record onto Accessibility Form - qualifies if Company is populated and Profile is Accessibility
				if (customer_id && caseProfile == LC2Constant.LC2_Profiles.EISAccess){
					// The 'Company' field could store a Customer or an Employee.  Lookup Entity Type to ensure that the value is actually a Customer and NOT an Employee
					var typeLookup = search.lookupFields({
		                type: search.Type.ENTITY,
		                id: customer_id,
		                columns: ['type']
		            });
					var entity_type = typeLookup.type[0].value;
					log.debug('entity_type', entity_type);
					// Continue only if the entity in the 'Company' field is a customer
					if (entity_type == 'CustJob'){
						var custLookup = search.lookupFields({
			                type: search.Type.CUSTOMER,
			                id: customer_id,
			                columns: ['custentity_epterritory']
			            });
						
				    	var custTerrLookup = search.lookupFields({
				    		type: search.Type.CUSTOMER,
				    		id: customer_id,
				    		columns: ['custentity_epterritory']
				    	});
				    	log.debug('custTerrLookup.custentity_epterritory.value', custTerrLookup.custentity_epterritory.value);
						var terr = custLookup.custentity_epterritory[0].value;
			        	log.debug('the value of terr is ', terr);
			        	
						// get the Customer GeoMarket
			        	var terrLookup = search.lookupFields({
			                type: search.Type.CUSTOM_RECORD + '83',
			                id: terr,
			                columns: ['custrecord_territory_geomarket_sourced']
			            });
			        	var geomarket = terrLookup.custrecord_territory_geomarket_sourced[0].text;
			        	log.debug('the value of geomarket is ', geomarket);
			        	        		        				
			        	var CustGeoMarket = recordForm.addField({
								id:'custpage_custgeomarket', 
								label:'Customer GeoMarket',
								type:serverWidget.FieldType.TEXT 
						});
			        	
						recordForm.insertField({field: CustGeoMarket, nextfield : 'contact'});
						rec.setValue({
							fieldId: 'custpage_custgeomarket',
							value: geomarket,
							ignoreFieldChange: true
						});
						// Disable the GeoMarket field
						var GMdisabled = serverWidget.FieldDisplayType.DISABLED;
						recordForm.getField({id: 'custpage_custgeomarket'}).updateDisplayType({displayType : GMdisabled});
					}
	
				}
		    }
		    
		    // US966180 Hide EC Case Type field if not populated. Also hide EC User Access Case Status Reason field if EC Case Type is not EC User Access Requested 
			// US971874 JO - Replacing the Reason field with Decision field in the validation detailed above
		    // Expose EC Case Type field if field value is not blank - fieldId: custevent_sf_ec_case_type
		    // ALLOW WEB SERVICE FORM TO EDIT VALUES (done at beginning of script to cover all code here)
	
	    	log.debug('the value of eccase_type is ', eccase_type);
	    	
	    	
	    	//US971874 Hide EC CaseType and EC Access Decision on Create or when EC CaseType is not populated
            if(scriptContext.type =='create' || eccase_type == '')
            {
                  ec_casetypeField.updateDisplayType({displayType : ECCThidden});
                  ec_access_decision.updateDisplayType({displayType : ECCThidden});
            }
     
            // If EC Case Type is not EC User Access Request, hide EBSCO Connect Access Decision
            else if (eccase_type != LC2Constant.LC2_EC_Case_Type.EC_UA_Request)
            {
                 ec_access_decision.updateDisplayType({displayType : ECCThidden});
            }

	    			    	
		    // Render Delete Attachments button for allowed Profiles &/or Roles (currently EIS Accounts Payable Profile = 28 & role = EP Support Manager 1) (US725157)
	       	if(LC2Constant.LC2_Profiles.isProfileCaseAttachDel(caseProfile) == true || LC2Constant.LC2_Role.isRoleCaseAttachDel(role) == true){
	            scriptContext.form.clientScriptFileId = LC2Constant.LC2_caseAttachDelSuitelet.functionScriptFileId;
	            scriptContext.form.addButton({
	                id : 'custpage_deletebutton',
	                label : 'Delete Attachments',
	                functionName: LC2Constant.LC2_caseAttachDelSuitelet.functionId +"('" + rec.id + "')"
	             });
	        } 
	
    	} // end run code if not WebServices form
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
