/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_Record_Case.js
//Written in SuiteScript 2.0
//
//Created by:	Eric Abramo 09-2020
//
//Purpose:		Validation for the Case

//
//
//Library Scripts Used: 	library2_constants
//
//
//Revisions:  
// 				Orig creation of script for: US684171 Handle Case Profile auto-switch when Cases Created in 2 new Profiles
//	1/18/2021	CNeale		US687561 Processing to support setting field values on change of assignee to EBSCONET Automated User
//							& to prevent Assignee/Status change while assigned to EBSCONET Automated User & Re-Opened status.
//	3/15/2021	CNeale		US725157 Move in redirectToSuitelet function from ACS script (renamed to redirectToCaseAttachDelSuitelet function)
//	5/7/2021	JOliver		US788612 Alert non-U.S. Support Reps on field change + form save for cases with Institution requiring US Support
//  5/10/2021	P Kelleher	US757838 Display CustSat Notes alert if populated when adding customer to a case
//	11/3/2021	CNeale		US824125 Do not allow Hide Case to be set if SFID = createNew or unset if SFID. 
//	2/18/22		PKelleher	US240546 Add code to not allow the South African Profile and FOLIO Profile to be used
//	5/17/2022	ZScannell	US931151 Do NOT allow Users to select "Chat - FAQ" or "Chat - Live" for Case Origin via UI
//	6/6/2022	JOliver		US943094 NetCRM Case Scripting to Update SRPM Record With "Denied" Status
//	12/12/2022	CNeale		US1017308 Revise alerts/logic for EC "User Access Request" cases & prevent change of Contact in some scenarios
//	1/3/2022	CNeale		US1051405/TA784079&TA784080 EC "User Access Request" cases - prevent change of Customer & Contact for user access            
//                          request cases where there's no SRPMID (& it's not Admin or Web Services roles)
//	2/16/2023	JOliver		US1019718 Do not allow case save for Approved/Part. Approved SRPMs when contact access level = 'Needs Review'
//	2/27/2023	ZScannell	US1078039 Fine tune messaging displayed during Case closure for Self-Reg Access Request Cases
//	3/13/2023	ZScannell	TA803229 Only Partially Approved Fixes - Do NOT allow all approved/granted and/or denied
//	5/23/2023	eAbramo		US856610 CDP: NS-05 - Case Scripting
//
//----------------------------------------------------------------------------------------------------------------

define(['N/record', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/url', 'N/search'],	

function(record, LC2Constant, runtime, url, search) {
	
	// Global Variable
 	var assigneeOnLoad2 = null;  //US687561
 	var statusOnLoad2 = null;    //US687561
 	var prevAssignee2 = null;	 //US687561
 	var hideOnLoad2 = null; 	 //US824125 
 	var g_init_case_profile = null;	// US240546 
	var g_companyOnLoad = null; 	//US856610

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
    	log.debug('Client2_Record_Case.js ', 'pageInit Start');
		// Get Profile - if 'DDE Latin America' or 'DDE Brazil' then reset the Profile to standard 'DDE Support' profile
		var case_rec = scriptContext.currentRecord;
		g_init_case_profile = case_rec.getValue({fieldId: 'profile'});
		
		// Load Library Constant object
		var IsProfileDDELatAmBrazilSupport_c = LC2Constant.LC2_Profiles.IsProfileDDELatAmBrazilSupport(g_init_case_profile);
		// US684171 Handle Case Profile auto-switch when Cases Created in 2 new Profiles
		if (IsProfileDDELatAmBrazilSupport_c == true){
			case_rec.setValue({
				fieldId: 'profile', 
				value: LC2Constant.LC2_Profiles.DDESupportDefault,
				ignoreFieldChange:true
			})
		};
		
		// Store Original Assignee
 		assigneeOnLoad2 = case_rec.getValue({fieldId: 'assigned'}); 
 		prevAssignee2 = assigneeOnLoad2;
		// Store Original Status
 		statusOnLoad2 = case_rec.getValue({fieldId: 'status'});
 		hideOnLoad2 = case_rec.getValue({fieldId: 'custevent_hide_case_cxp'});
 		
 		//US1051405 Do not allow Contact or Customer to be edited on User Access Request without a SRPMID
		var userRole = runtime.getCurrentUser().role;
   		if (userRole != LC2Constant.LC2_Role.WebServ && userRole != LC2Constant.LC2_Role.Administrator){	
			// If it's an EBSCO Connect User Access Request Case and the SRPM record id is empty
			if (case_rec.getValue({fieldId: 'custevent_sf_ec_case_type'}) == LC2Constant.LC2_EC_Case_Type.EC_UA_Request && !case_rec.getValue({fieldId: 'custevent_sf_srpm_id'})){
				case_rec.getField({fieldId: 'company'}).isDisabled = true;
				case_rec.getField({fieldId: 'contact'}).isDisabled = true;
			}
		}

		// US856610 need value of the company for fieldChange logic
		g_companyOnLoad = case_rec.getValue('company');
    };

    
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
    function fieldChanged(scriptContext){
    	log.debug('Client2_Record_Case.js ', 'fieldChanged Start');
    	var case_rec = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
    	  	
    	if (name == 'profile'){	
    		// var case_id = case_rec.getValue({fieldId: 'id'});
    		var case_profile = case_rec.getValue({fieldId: 'profile'});
    		var IsProfileDDELatAmBrazilSupport_x = LC2Constant.LC2_Profiles.IsProfileDDELatAmBrazilSupport(case_profile);
    		// US684171 Handle Case Profile auto-switch when Cases Created in 2 new Profiles
    		if (IsProfileDDELatAmBrazilSupport_x == true){
    			case_rec.setValue({
    				fieldId: 'profile', 
    				value: LC2Constant.LC2_Profiles.DDESupportDefault,
    				ignoreFieldChange:	true
    			}) 			
    		}; 		

	    	// US240546 Revert back to initial Profile if the South African or the FOLIO Profile are chosen
	    	if (case_profile == LC2Constant.LC2_Profiles.SSEUKAfricaans || case_profile == LC2Constant.LC2_Profiles.FOLIOSupport){
	    		case_rec.setValue({
	    			fieldId: 'profile', 
	    			value: g_init_case_profile,
	    			ignoreFieldChange:	true
	    		}) 			
	    		alert('This profile is not in use.  The field has been reset back to its original Profile.')
	    	}; 
    	};     	
    	
    	if (name == 'assigned'){	
    		var case_assignee = case_rec.getValue({fieldId: 'assigned'});
    		var case_form = case_rec.getValue({fieldId: 'customform'});
    		var case_prof = case_rec.getValue({fieldId: 'profile'});
    		// US687561 EBSCONET Automated User assignee actions
    		// Restrict to CustSat Merged Case Form
    		// Default the following fields: Status = Closed, Occupation = Librarian, Level of Effort = XSmall,
    		// DDE Request Type = Support Case, Product/Interface = EBSCONET, Area of Support = Forward to SSE,
    		// Support Task = unset
    		if (case_assignee == LC2Constant.LC2_Employee.EBSCONETAutoUser){
    			if (case_form == LC2Constant.LC2_Form.CustSatMerged && LC2Constant.LC2_Profiles.IsProfileDDESupport(case_prof) == true){
	    			// Status
	    			case_rec.setValue({
	    				fieldId: 'status', 
	    				value: LC2Constant.LC2_CaseStatus.Closed,
	    				ignoreFieldChange:	true
	    			})
	    			// Occupation
	    			case_rec.setValue({
	    				fieldId: 'custevent_occupationtextfield', 
	    				value: LC2Constant.LC2_CaseOccupation.Librarian,
	    				ignoreFieldChange:	true
	    			})
	    			// Level of Effort
	    			case_rec.setValue({
	    				fieldId: 'custevent_level_of_effort', 
	    				value: LC2Constant.LC2_CaseLevelEffort.XSmall,
	    				ignoreFieldChange:	true
	    			}) 
	    			//DDE Request Type
	    			case_rec.setValue({
	    				fieldId: 'category', 
	    				value: LC2Constant.LC2_CaseReqTyp.Support,
	    				ignoreFieldChange:	true
	    			})
	    			// Product/Interface  
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_prod_int', 
	    				value: LC2Constant.LC2_CaseDDEProd.EbscoNet,
	    				ignoreFieldChange:	false
	    			})
	    			// Area of Support
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_area_suppt', 
	    				value: LC2Constant.LC2_CaseDDEAreaSupport.ForwardToSSE,
	    				ignoreFieldChange:	false
	    			})
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_suppt_task', 
	    				value: '',
	    				ignoreFieldChange:	true
	    			}) 
    			}
    			else 
    			{
    				alert('This Assignee is not valid for selection from this form/profile, original value will be reset.');
    				case_rec.setValue({
	    				fieldId: 'assigned', 
	    				value: assigneeOnLoad2,
	    				ignoreFieldChange:	true
	    			}) 
    			}	
    		}; 
    		// US687561 Also prevent change of assignee from EBSCONET Automated User if Status originally Re-opened
    		if (assigneeOnLoad2 == LC2Constant.LC2_Employee.EBSCONETAutoUser && statusOnLoad2 == LC2Constant.LC2_CaseStatus.ReOpened 
    				&& runtime.getCurrentUser().role != LC2Constant.LC2_Role.Administrator){
    			alert('The Assignee cannot be changed while the status is "Re-opened", original value will be reset - this case will be closed by a scheduled job.');
				case_rec.setValue({
    				fieldId: 'assigned', 
    				value: assigneeOnLoad2,
    				ignoreFieldChange:	true
    			}) 
    		};
    		
    		// US687561 Add warning if changing assignee from EBSCONET Automated User 
    		if (prevAssignee2 == LC2Constant.LC2_Employee.EBSCONETAutoUser && assigneeOnLoad2 != LC2Constant.LC2_Employee.EBSCONETAutoUser){
    			alert('Warning: You are changing assignee from EBSCONET Automated User, the following fields have already been defaulted for this assignee and should be checked: Status, Occupation, Level of Effort, Request Type,Product/Interface, Area of Support');
     		};
    		
    		// US687561 Store Assignee just set
    		prevAssignee2 = case_rec.getValue({fieldId: 'assigned'});
    	};
    	
       	//US788612 check US-BASED SUPPORT on field change for assigned to or company
    	if (name == 'assigned' || name == 'company'){	
    		var case_assignee = case_rec.getValue({fieldId: 'assigned'});
    		var case_company = case_rec.getValue({fieldId: 'company'});
    		var case_prof = case_rec.getValue({fieldId: 'profile'});
    		var folio_impact = case_rec.getValue({fieldId:  'custevent_ec_folio_impact'});
    		
    		//run when both assigned to and company are populated on specified forms 
    		if (case_assignee && case_company && LC2Constant.LC2_Profiles.IsProfileDDESupport(case_prof) == true && folio_impact != true)
    		{
    			
            	//check to see if assigned on case is US-based support
            	var employeeLookup = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: case_assignee,
                    columns: ['custentity_is_us_based_support']
                });
            	
            	//check to see if customer on case requires US-based support
            	var customerLookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: case_company,
                    columns: ['custentity_us_tech_supp']
                });
            	
            	if(employeeLookup.custentity_is_us_based_support == false && customerLookup.custentity_us_tech_supp == true)
            	{
        			alert('The Institution on this case requires U.S based support.  Please update either the Institution or the Assigned To.');
						
            	}
    		}
    	}
 
       	//US757838 Display CustSat Notes alert if populated when adding customer to a case
    	if (name == 'company'){	
    		var case_company = case_rec.getValue({fieldId: 'company'});
    		var case_prof = case_rec.getValue({fieldId: 'profile'});
    		
    		//run when DDE Profile & Customer has DDE Cust Notes field populated  
    		if (case_company && LC2Constant.LC2_Profiles.IsProfileDDESupport(case_prof) == true)
    		{
    			
            	//check to see if assigned on case is US-based support
		    	var ddeCustLookup = search.lookupFields({
		    		type: search.Type.CUSTOMER,
		    		id: case_company,
		    		columns: ['custentity_dde_custsat_notes']
		    	});
		    	log.debug('The value of customer lookup is = ' + ddeCustLookup.custentity_dde_custsat_notes);
	
		    	if(case_company && ddeCustLookup.custentity_dde_custsat_notes)
		    	{
		    		alert('This case contains special handling instructions. The DDE CustSat Notes are: '+ ddeCustLookup.custentity_dde_custsat_notes);
		    	}

				// US856610 Give user warning when Changing Company field and Case is in EBSCO Connect and old Company was on EBSCO Connect
				if(g_companyOnLoad){
					var ecLookup = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: g_companyOnLoad,
						columns: ['custentity_sf_account_id', 'companyname']
					});
					var sf_case_id = case_rec.getValue('custevent_sf_case_id');
					if(sf_case_id != '' && ecLookup.custentity_sf_account_id != ''){
						// Present warning to end-user
						if(!confirm('Warning: This case is currently visible to customer '+ecLookup.companyname+' on EBSCO Connect.  ' +
							'By changing the customer it will no longer be visible under the old customer and may be visible to the new customer ' +
							'if the new customer has access to EBSCO Connect. Select \'OK\' if you want to continue and change the customer' +
							' or \'Cancel\' to set the customer back to its original value.')){
							//  Changing the Customer will cause EBSCO Connect users to lose visibility, -
							case_rec.setValue({
								fieldId: 'company',
								value: g_companyOnLoad,
								ignoreFieldChange:	true
							})
						}
    		}
    	}
    		}

    	}

    	if (name == 'status'){	
    		var case_status = case_rec.getValue({fieldId: 'status'});
    		var user = runtime.getCurrentUser();
     		// US687561 EBSCONET Automated User Do not allow status change from Re-opened via UI (except for Administrator)
     		if ((case_assignee == LC2Constant.LC2_Employee.EBSCONETAutoUser || assigneeOnLoad2 == LC2Constant.LC2_Employee.EBSCONETAutoUser) 
     				&& user.role != LC2Constant.LC2_Role.Administrator) {
     			if (statusOnLoad2 == LC2Constant.LC2_CaseStatus.ReOpened){
					alert('Status cannot be changed from "Re-opened" for cases assigned to EBSCONET Automated User - this case will be closed by a scheduled job.');
					case_rec.setValue({
	    				fieldId: 'status', 
	    				value: statusOnLoad2,
	    				ignoreFieldChange:	true
	    			})
     			}
     		}; 		
    	}; 
    	
    	// US824125 Do NOT allow Case Hide to be unchecked if SFID present or to be checked if SFID = createNew (but allow override for Web Services role)
    	if (name == 'custevent_hide_case_cxp'){	
    		var case_hide = case_rec.getValue({fieldId: 'custevent_hide_case_cxp'});
    		var case_sfid = case_rec.getValue({fieldId: 'custevent_sf_case_id'});
    		var user = runtime.getCurrentUser();
      		if (hideOnLoad2 != case_hide && user.role != LC2Constant.LC2_Role.WebServ && 
      				((case_sfid == LC2Constant.LC2_SF_createNew && case_hide == true)|| case_hide == false && case_sfid)){
     			if (case_hide == false){
					alert('Case hide in EBSCO Connect is in process - please wait until this is complete (SF Case ID will be removed) before unhiding Case.');
     			}
     			else{
     				alert('Case creation in EBSCO Connect is in process - please wait until this is complete (SF Case ID will be populated with SF case reference) before hiding Case.');
     			}
					case_rec.setValue({
	    				fieldId: 'custevent_hide_case_cxp', 
	    				value: hideOnLoad2,
	    				ignoreFieldChange:	true
	    			})
     		}; 		
    	}; 
    	
    	// US931151 Do NOT allow Users to select "Chat - FAQ" or "Chat - Live" for Case Origin via UI
    	if (name == 'origin'){
    		var user = runtime.getCurrentUser();
    		var userRole = user.role;
    		// If not the Web Service User (1025) or Admin (3)
    		if (userRole != LC2Constant.LC2_Role.WebServ && userRole != LC2Constant.LC2_Role.Administrator){
    			var originVal = case_rec.getValue({fieldId: 'origin'});
    			switch (originVal){
    				// If setting to one of the Anywhere365 Chat bot values, show alert + set the value to blank
    				// "Chat - FAQ"
    				case LC2Constant.LC2_CaseOrigin.ChatFAQ:
    					alert('A user cannot set the Origin field to "Chat - FAQ" via UI. This status is reserved for cases set by the EBSCO Connect AnyWhere365 chat bot. Setting Origin to blank.')
    					case_rec.setValue({
    						fieldId: 'origin',
    						value: '',
    						ignoreFieldChange: true
    					});
    					break;
    				// "Chat - Live"
    				case LC2Constant.LC2_CaseOrigin.ChatLive:
    					alert('A user cannot set the Origin field to "Chat - Live" via UI. This status is reserved for cases set by the EBSCO Connect AnyWhere365 chat bot. Setting Origin to blank.')
    					case_rec.setValue({
    						fieldId: 'origin',
    						value: '',
    						ignoreFieldChange: true
    					});
    					break;
    			}
    		}
    	}
   };
   
   /**
    * Validation function to be executed when record is saved.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @returns {boolean} Return true if record is valid
    *
    * @since 2015.2
    */
   function saveRecord2(scriptContext) {
	   log.debug('Client2_Record_Case.js ', 'SaveRecord Start');
 	    var case_rec = scriptContext.currentRecord;	   
  		var case_assignee = case_rec.getValue({fieldId: 'assigned'});
		var case_form = case_rec.getValue({fieldId: 'customform'});
		var case_company = case_rec.getValue({fieldId: 'company'});
		var case_prof = case_rec.getValue({fieldId: 'profile'});
		var folio_impact = case_rec.getValue({fieldId:  'custevent_ec_folio_impact'});
		var ec_casetype = case_rec.getValue({fieldId: 'custevent_sf_ec_case_type'});
		var case_stage = case_rec.getValue({fieldId: 'stage'});
		var ec_access_decision = case_rec.getValue({fieldId: 'custevent_ec_access_decision'});
		var ec_contact_type = case_rec.getValue({fieldId: 'custevent_sf_ec_contact_type'});
		var srpm_id = case_rec.getValue({fieldId: 'custevent_sf_srpm_id'});
		var case_contact = case_rec.getValue({fieldId: 'contact'});
		var access_type_requested = case_rec.getValue({fieldId: 'custevent_sf_access_type_requested'});
		var contactToUse = '';
		var srpmConversionStatus = '';
		var srpmMatchedContact = '';
		
		//------------------------------------------
		// US943094 Case Type is EC User Access Request and Stage = Closed
		if(ec_casetype ==  LC2Constant.LC2_EC_Case_Type.EC_UA_Request && case_stage == 'CLOSED') 
		{
			//TA721556 If no Decision given, enforce selection of an EC User Access Decision
			if (!ec_access_decision)
			{
				alert('Please populate the EBSCO Connect Access Decision field before closing this case');
	        	return false;	
			}
		//---------------------------------------
		// If Self-Registered and SRPM not converted
			
			else if (srpm_id) // Confirm there a SRPM record associated with the case
			{
				// Lookup the Conversion Status and Matched Contact on the SRPM associated with the case
				var srpmLookup = search.lookupFields({
			        //type: search.Type.CUSTOM_RECORD + '_sr_portal_member',
					type: 'customrecord_sr_portal_member',
			        id: srpm_id,
			        columns: ['custrecord_srpm_conversion_status', 'custrecord_matched_contact']
			    });
			    	
			    	//log.debug('SRPM Conversion Status before try catch', srpmConversionStatus);
			    	//log.debug('SRPM Matched Contact before try catch', srpmMatchedContact);
			    	
		        	// Set the conversion status when a value is available.  There is currently only 1 option for the conversion status (Converted)
		        	try{
		        		srpmConversionStatus = srpmLookup.custrecord_srpm_conversion_status[0].value;
		        	}
		        	catch(e){
		        		srpmConversionStatus = '';
		        	}
			        
		        	// Set the matched contact when a value is available.  
		        	try{
		        		srpmMatchedContact = srpmLookup.custrecord_matched_contact[0].value;
		        	}
		        	catch(e){
		        		srpmMatchedContact = '';
		        	}
			        
			    				    	
			    	//log.debug('SRPM Conversion Status after try catch', srpmConversionStatus);
			    	//log.debug('SRPM Matched Contact after try catch', srpmMatchedContact);
			    	
				//Self-Registered, SRPM present, STATUS IS NOT CONVERTED (needed blank to prevent undefined error)
				if (ec_contact_type == LC2Constant.LC2_EC_Contact_Access_Type.SelfRegistered && (srpmConversionStatus == '' || srpmConversionStatus != LC2Constant.LC2_SRPM_Conversion_Status.Converted))
				{
					//TA721561  If decision Denied (expected), trigger an alert that we are logging the decision (i.e. UserEvent2_case_after_submit is updating SRPM to denied)
					if (ec_access_decision == LC2Constant.LC2_Access_Decision.Denied)
					{
						alert('Denied decision will be logged for this Academy only user.');
					}
	  
					//TA721558 Unconverted SRPM, if case decision NOT denied, trigger an error to fix the SRPM
	        		else
	        		{
						alert('Please follow normal EBSCO Connect escalation process in order to handle approval or partial approval of access before closing this case.');
			        	return false;
	        			
	        		}
				} 
			}
    	//---------------------------------------	        	
		//Setting the contactToUse for comparing Access Requested to Access Statuses (on contact or SRPM)
			

        	// If the case has an SRPM and the SRPM is converted then its the Contact on the SRPM that should be used (even if one has been added to the case).
        	if (srpmConversionStatus == LC2Constant.LC2_SRPM_Conversion_Status.Converted)
        	{
        		if (srpmMatchedContact != '')
    			{
	        		// set contactToUse to the SRPM's matched contact
	        		contactToUse = srpmMatchedContact;
        		}
    		
        		else
    			{
					alert('Please notify CRMescalation@ebsco.com to let them know that this case has a converted SRPM record that is missing the Matched Contact');
		        	return false;
    			}
    		
    		}
        	
        	// If the case does not have an SRPM then its the Contact on the Case that should be used. 
        	else if (!srpm_id && case_contact)
        	{
        		contactToUse = case_contact;
        	}
				
									
        	log.debug('Contact To Use', contactToUse);
			
        	// Have to have this non-empty check to accommodate when a SRPM is non-converted with decision of denied, as SRPM should be updated not a contact.
        	if (contactToUse != '' && contactToUse != null)
        	{
        		// Load whichever contact we have decided to use (the SRPM matched contact or the case contact)
        		var contactRecord = record.load({
	        	    type: search.Type.CONTACT,
	        	    id: contactToUse,
	        	});
				var approvedFound = false;
				var deniedFound = false;
	        	// For every type of Access Type that a user can request (stored in LC2_Constants.LC2_Access_Type_Req)
	        	for (x in LC2Constant.LC2_Access_Type_Req)
	        	{
	        	    // Match the Access Type Requested to the proper value in LC2_Access_Type_Req + Check it is NOT Academy
	        	    if (access_type_requested.includes(LC2Constant.LC2_Access_Type_Req[x].id) == true && LC2Constant.LC2_Access_Type_Req[x].id != LC2Constant.LC2_Access_Type_Req.Academy.id){
	        	        // Check if that Access Type's field on the Contact matches the Decision on the case, if not, Alert!
	        	        // if the CaseECAccessDecision is Denied and (CaseContact for X access status is not Denied)
	        	        if (ec_access_decision == LC2Constant.LC2_Access_Decision.Denied && (contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) != LC2Constant.LC2_SF_EcAccessLevels_sts.Denied)){
							alert('Please follow normal EBSCO Connect escalation process in order to handle denial of access before closing the case.');
							return false;
	        	        }
	        	    	// if the CaseECAccessDecision is Approved and (CaseContact for X access status is not Approved and CaseContact for X access status is not Granted)
	        	        else if (ec_access_decision == LC2Constant.LC2_Access_Decision.Approved && (contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) != LC2Constant.LC2_SF_EcAccessLevels_sts.Approved && contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) != LC2Constant.LC2_SF_EcAccessLevels_sts.Granted)){
							alert('Please follow normal EBSCO Connect escalation process in order to handle approval of access before closing the case.');
							return false;
	        	        }
						//	if the Cases' EC Access Decision is "Only Partially Approved"
	        	        else if (ec_access_decision == LC2Constant.LC2_Access_Decision.PartialApprove){
							if (contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) == LC2Constant.LC2_SF_EcAccessLevels_sts.NeedsRev){
								alert('Please follow normal EBSCO Connect escalation process in order to handle partial approval of access before closing this case.');
								return false;
							}
							else if (contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) == LC2Constant.LC2_SF_EcAccessLevels_sts.Granted || contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved){
								approvedFound = true;
	        	        }
							else if (contactRecord.getValue({fieldId: LC2Constant.LC2_Access_Type_Req[x].contactFieldId}) == LC2Constant.LC2_SF_EcAccessLevels_sts.Denied){
								deniedFound = true;
							}
	        	    }
	        	}	        	
	        	}
				if (ec_access_decision == LC2Constant.LC2_Access_Decision.PartialApprove && (approvedFound == false || deniedFound == false)){
					alert('Please follow normal EBSCO Connect escalation process in order to handle partial approval of access before closing this case.');
					return false;
		        }
        	}
        	// US1017308 Double check if additional access request case and no SRPM record that the case has a Contact (missing contacts should not happen).
        	else if (!srpm_id){
        		alert('Please reinstate the original Contact, this can be found in the System Notes, on this EBSCO Connect Additional Access Request case.');
	        	return false;
        	}
		}
				

		//US788612 disallow case save when assignee is non-US rep but institution requires US Support Rep
		if (case_assignee && case_company && LC2Constant.LC2_Profiles.IsProfileDDESupport(case_prof) == true && folio_impact != true)
		{
			
        	//check to see if assigned on case is US-based support
        	var employeeLookup = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: case_assignee,
                columns: ['custentity_is_us_based_support']
            });
        	
        	//check to see if customer on case requires US-based support
        	var customerLookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: case_company,
                columns: ['custentity_us_tech_supp']
            });
        	
        	if(employeeLookup.custentity_is_us_based_support == false && customerLookup.custentity_us_tech_supp == true)
        	{
    			alert('The Institution on this case requires U.S based support.  Please update either the Institution or the Assigned To.');
            	return false;	
        	}

		}
        	
         // US687561 Ensure EBSCONET Automated User defaults are not reset before record saved (on first set of assignee)    
		if (case_assignee == LC2Constant.LC2_Employee.EBSCONETAutoUser && assigneeOnLoad2 != LC2Constant.LC2_Employee.EBSCONETAutoUser){
			if (case_form == LC2Constant.LC2_Form.CustSatMerged){
    			// Status
				if (case_rec.getValue({fieldId: 'status'}) != LC2Constant.LC2_CaseStatus.Closed){
	    			case_rec.setValue({
	    				fieldId: 'status', 
	    				value: LC2Constant.LC2_CaseStatus.Closed,
	    				ignoreFieldChange:	true
	    			})
				}
    			// Occupation
				if (case_rec.getValue({fieldId: 'custevent_occupationtextfield'}) != LC2Constant.LC2_CaseOccupation.Librarian){
	    			case_rec.setValue({
	    				fieldId: 'custevent_occupationtextfield', 
	    				value: LC2Constant.LC2_CaseOccupation.Librarian,
	    				ignoreFieldChange:	true
	    			})
				}
    			// Level of Effort
				if (case_rec.getValue({fieldId: 'custevent_custevent_level_of_effort'}) != LC2Constant.LC2_CaseLevelEffort.XSmall){
	    			case_rec.setValue({
	    				fieldId: 'custevent_level_of_effort', 
	    				value: LC2Constant.LC2_CaseLevelEffort.XSmall,
	    				ignoreFieldChange:	true
	    			}) 
				}
    			//DDE Request Type
				if (case_rec.getValue({fieldId: 'category'}) != LC2Constant.LC2_CaseReqTyp.Support){
	    			case_rec.setValue({
	    				fieldId: 'category', 
	    				value: LC2Constant.LC2_CaseReqTyp.Support,
	    				ignoreFieldChange:	true
	    			})
				}
    			// Product/Interface 
 				if (case_rec.getValue({fieldId: 'custevent_dde_prod_int'}) != LC2Constant.LC2_CaseDDEProd.EbscoNet){
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_prod_int', 
	    				value: LC2Constant.LC2_CaseDDEProd.EbscoNet,
	    				ignoreFieldChange:	false
	    			})
				}
    			// Area of Support
				if (case_rec.getValue({fieldId: 'custevent_dde_area_suppt'}) != LC2Constant.LC2_CaseDDEAreaSupport.ForwardToSSE){
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_area_suppt', 
	    				value: LC2Constant.LC2_CaseDDEAreaSupport.ForwardToSSE,
	    				ignoreFieldChange:	false
	    			})
				}
				if (case_rec.getValue({fieldId: 'custevent_dde_suppt_task'})){
	    			case_rec.setValue({
	    				fieldId: 'custevent_dde_suppt_task', 
	    				value: '',
	    				ignoreFieldChange:	true
	    			})
				} 
			}
		}
		
		return true;
   }
   
   /**
    * Function to redirect to Suitlet for Case Attachment Deletion  (US725157)
    **/
   function redirectToCaseAttachDelSuitelet(caseId) {
	   log.debug('Client2_Record_Case.js ', 'redirectToCaseAttachDelSuitelet start, Case Id = ' +caseId);
       var suitelet = url.resolveScript({
           scriptId: LC2Constant.LC2_caseAttachDelSuitelet.scriptId,
           deploymentId: LC2Constant.LC2_caseAttachDelSuitelet.deployId,
           params: {
         	   'custparam_caseId': caseId
            }
       });
       window.location = suitelet;

   }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord2,
        redirectToCaseAttachDelSuitelet: redirectToCaseAttachDelSuitelet
    };
    
});
