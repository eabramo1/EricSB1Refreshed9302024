/*
 * PRODUCTION doc -
 * File:  Restlet_GetCaseRecordById.js
 * 
 * NAME UPDATED 1/31/18 FROM Restlet_GetCaseById.js to Restlet_GetCaseRecordById.js
 *
 * Module Description:  This Restlet exposes selected case fields to the application that
 *			is calling the Restlet.  
 
 *
 * JSON input expected:  {"case_id":"[caseid]"}
 * Jason Jeitler provided a list of fields (below) that he expects to view with this RESTlet.
 *			The Assumption is that the Application will call the Restlet with Login Credential
 *			and also with the case fields that it wants to read as follows: 

	case_id
	case_number
	case_subject
	case_assignee (assigned to)
	case_priority
	case_status
	case_origin
	case_status_comment
	case_institution
	case_eis_account
	case_contact
	case_email (Customer�s E-mail)
	case_phone
	case_inbound_email
	case_followup_date
	case_dde_req_type
	case_prod_interface (Product/Interface)
	case_area_support
	case_support_task
	case_occupation
	case_effort_level
	case_custsat_hours (CustSat Actual Hours)
	case_last_modified (Last Modified Date)
	case_last_message_date
	case_date_created
	case_date_closed
	Message:  GetMessageById (the plan is to return all message IDs using another Restlet)
	
	****** Below fields added in Sept. 2019 **************
	case_ds_category
	case_product_code
	case_linking_issue
	case_conversion_status
	case_questionnaire_rec
	case_ds_phase
	case_originating_team

 * 
 * 		Date            	Author			Remarks
 * 		1/21/2018		Pat Kelleher 
 * 		3/27/2018		Pat Kelleher		Moved to Production	
 * 		3/30/2018		Pat Kelleher		updated field id custevent_contact to contact for correction
 *		09/16/2019		j.Proctor (eabramo)	Added 7 DS Case fields
 *
 *
 */


function GetCaseRecordById(datain)
{
	nlapiLogExecution('debug', 'RESTLET GetCaseRecordById started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	try
	{
		// Lookup case and load it
		nlapiLogExecution('debug', 'datain.case_id=' + datain.case_id);	
		
		var supportcase = nlapiLoadRecord('supportcase', datain.case_id);

		var case_id = datain.case_id 
		var case_number = supportcase.getFieldValue('casenumber');
		var case_subject = supportcase.getFieldValue('title');
		var case_status_comment = supportcase.getFieldValue('custevent_status_comment');
		var case_email = supportcase.getFieldValue('email');
		var case_phone = supportcase.getFieldValue('phone');
		var case_inbound_email = supportcase.getFieldValue('inboundemail');
		var case_followup_date = supportcase.getFieldValue('custevent_customer_si_followup_date');
		var case_custsat_hours = supportcase.getFieldValue('custevent_custsat_actual_hours');
		var case_last_modified = supportcase.getFieldValue('lastmodifieddate');
		var case_last_message_date = supportcase.getFieldValue('lastmessagedate');
		var case_date_created = supportcase.getFieldValue('createddate');
		var case_date_closed = supportcase.getFieldValue('enddate');
		var case_product_code = supportcase.getFieldValue('custevent_product_code');
		var case_questionnaire_rec = supportcase.getFieldValue('custevent_questionnaire_rec');
		
		
	// library_utility script function called to format company name & id
		var case_assignee = L_formatListFieldJSON(supportcase, 'assigned');
		var case_priority = L_formatListFieldJSON(supportcase, 'priority');
		var case_status = L_formatListFieldJSON(supportcase, 'status');
		var case_origin = L_formatListFieldJSON(supportcase, 'origin');
		var case_institution = L_formatListFieldJSON(supportcase, 'company');
		var case_eis_account = L_formatListFieldJSON(supportcase, 'custevent_eis_account');
		var case_contact = L_formatListFieldJSON(supportcase, 'contact');
		var case_dde_req_type = L_formatListFieldJSON(supportcase, 'category');
		var case_prod_interface = L_formatListFieldJSON(supportcase, 'custevent_dde_prod_int');
		var case_area_support = L_formatListFieldJSON(supportcase, 'custevent_dde_area_suppt');
		var case_support_task = L_formatListFieldJSON(supportcase, 'custevent_dde_suppt_task');
		var case_occupation = L_formatListFieldJSON(supportcase, 'custevent_occupationtextfield');
		var case_effort_level = L_formatListFieldJSON(supportcase, 'custevent_level_of_effort');
		var case_ds_category = L_formatListFieldJSON(supportcase, 'custevent_ds_category');
		var case_linking_issue = L_formatListFieldJSON(supportcase, 'custevent_linkingissue');
		var case_conversion_status = L_formatListFieldJSON(supportcase, 'custevent_ekb_conv');
		var case_ds_phase = L_formatListFieldJSON(supportcase, 'custevent_ehis_stage');
		var case_originating_team = L_formatListFieldJSON(supportcase, 'custevent_ds_originating_team');
		
		nlapiLogExecution('debug', 'Success Loading GetCaseRecordById',  'case_id: '+datain.case_id);
		restlet_status = 'SUCCESS';
	}		
	catch ( e )
	
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'GetCaseRecordById Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'GetCaseRecordById Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
		var dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, case_id: case_id, case_number: case_number, case_status: case_status, case_subject: case_subject, case_assignee: case_assignee, case_priority: case_priority, case_origin: case_origin, case_status_comment: case_status_comment, case_institution: case_institution, case_eis_account: case_eis_account, case_contact: case_contact, case_email: case_email, case_phone: case_phone, case_inbound_email: case_inbound_email, case_followup_date: case_followup_date, case_dde_req_type: case_dde_req_type, case_prod_interface: case_prod_interface, case_area_support: case_area_support, case_support_task: case_support_task, case_occupation: case_occupation, case_effort_level: case_effort_level, case_custsat_hours: case_custsat_hours, case_last_modified: case_last_modified, case_last_message_date: case_last_message_date, case_date_created: case_date_created, case_date_closed: case_date_closed, case_product_code: case_product_code, case_questionnaire_rec: case_questionnaire_rec, case_ds_category: case_ds_category, case_linking_issue: case_linking_issue, case_conversion_status: case_conversion_status, case_ds_phase: case_ds_phase, case_originating_team: case_originating_team};

	nlapiLogExecution('debug', 'RESTLET GetCaseRecordById ended...');	
	return(dataout);
} 
