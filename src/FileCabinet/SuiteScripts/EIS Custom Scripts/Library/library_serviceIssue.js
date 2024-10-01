//
// Script:     library_serviceIssue.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of Service Issue script functions that may be called from other scripts.
//             Service Issue specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
// 
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	04/20/2018	Christine Neale		US326360 Added Global Object L_siParmMapObject
//	11-08-2018	Ariana				Added 'si_date_created', 'si_last_closed_date' , 'si_issue_type', and 'si_dept_assigned_to',
//	11/08/2018	Ariana Hazen		US425118 Added many more values and added new attributes for looping in RESTlet-- moved si_id to top so it's printed first 
//									in response
//	11/14/2018	Ariana Hazen		US450595 Updated 'restletCanUpdate' property for si_rally_no & si_rally_url  AND removed 'restletDefaultOverwrite' for 
//									si_employee_assigned_to
//	01/10/2019	Ariana Hazen		US467289 Updated 'restletCanUpdate' property for si_case & si_number_linked_cases  AND added si_issn, si_pid, si_mid, si_dtformat 
//	08/05/2019	Ariana Hazen		Added new objects for si_tagline, si_user_email
//	10/10/2019	Ariana Hazen		Updated for eContent Form fields and added form_id
//	12/26/2019  Ariana Hazen		Add new si_sid_url field and removed req from status (as CRM defaults to Not Started when blank)
//	1/30/2020 Mackie				Removed the following fields from this Library Script: si_rally_priority, si_rally_schedule_state, si_rally_defect_state, si_rally_release, si_rally_assignee, si_rally_iteration, and si_rally_project.
//-------------------------------------------------------------------------------------------------------------------------
// US326360 The following parameter mapping object is REQUIRED to perform dynamic case search building using library_dynamic_search.js
//
var L_siParmMapObject = {
	si_id: {
		nsfieldName:	'internalid',	
		searchBy: 'anyof,noneof',
		fieldType:		'number',
		restletCanUpdate: 'F'
		},
	si_status: {
		nsfieldName:	'custrecord_sistatus',	
		searchBy: 'anyof,noneof',
		fieldType: 'select',
		restletCanUpdate: 'T'
		},
	si_case: {
		nsfieldName:	'custrecord_sicase',	
		searchBy: 'anyof,allof,noneof,notallof,is',
		fieldType: 'multiple',
		restletCanUpdate: 'T',
		restletDefaultOverwrite: 'F'
		},
	case_number: {
		nsfieldName: 'custrecord_sicase.casenumber',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		joinFrom: 'custrecord_sicase',	
		fieldType: 'textarea',
		restletCanUpdate: 'F'
		},
	si_date_created: {
		nsfieldName: 'created',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},
	si_last_closed_date: {
		nsfieldName: 'custrecord_si_last_closed_date',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},
	si_issue_type: {
		nsfieldName: 'custrecord_siissuetype',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T',
		restletRequiredField:'T'
		},
	si_dept_assigned_to: {
		nsfieldName: 'custrecord_siassignedto',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_interface: {
		nsfieldName: 'custrecord_si_interface_si',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'		
		},
	si_product: {
		nsfieldName: 'custrecord_si_product_si',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'		
		},
	si_areamodule: {
		nsfieldName: 'custrecord_si_area_module_si',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'		
		},
	si_issue_experienced: {
		nsfieldName: 'custrecord_si_issue_experienced',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T'
		},
	si_synopsis: {
		nsfieldName: 'custrecord_sisynopsis',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T',
		restletRequiredField: 'T'
		},
	si_priority: {
		nsfieldName: 'custrecord_sipriority',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T',
		restletRequiredField:'T'
		},
	si_description: {
		nsfieldName: 'custrecord_sidescription',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T',
      	restletRequiredField:'T'
		},
	si_sales_description: {
		nsfieldName: 'custrecord_sales_description',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_customer_type: {
		nsfieldName: 'custrecord_si_customertype',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},	
	si_severity: {
		nsfieldName: 'custrecord993',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_time_sensitivity: {
		nsfieldName: 'custrecord_si_time_sensitivity',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_businessvalue: {
		nsfieldName: 'custrecord_si_business_value',
		searchBy:  'any,equalto,lessthan,greaterthan,lessthanorequalto,greaterthanorequalto,between,notequalto,notlessthan,notgreaterthan,notlessthanorequalto,notgreaterthanorequalto,notbetween',
		fieldType:	'number',
		restletCanUpdate: 'T'
		},
	si_employee_assigned_to: {
		nsfieldName:	'custrecord2',	
		searchBy:		'anyof,allof,noneof,notallof,is',
		fieldType:		'multiple',
		restletCanUpdate: 'T'
		},
	si_profile_string: {
		nsfieldName:	'custrecord_sidomainlogin',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_username: {
		nsfieldName:	'custrecord_eis_username',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_browser: {
		nsfieldName: 'custrecord_sibrowser',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_platform: {
		nsfieldName: 'custrecord_siplatform',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_persistentlink: {
		nsfieldName:	'custrecord_sipersistentlook',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_number_linked_cases: {
		nsfieldName: 'custrecord_count_linked_cases',
		searchBy:  'any,equalto,lessthan,greaterthan,lessthanorequalto,greaterthanorequalto,between,notequalto,notlessthan,notgreaterthan,notlessthanorequalto,notgreaterthanorequalto,notbetween',
		fieldType:	'number',
		restletCanUpdate: 'T'
		},
	si_riskreductionopportunity: {
		nsfieldName: 'custrecord_risk_reduction_opportunity',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_riskreductiondesc: {
		nsfieldName:	'custrecord_risk_reduction_desc',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_created_by: {
		nsfieldName:	'custrecord_sicreatedby',	
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'F'
		},
	si_last_modified_date: {
		nsfieldName: 'lastmodified',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},
	si_last_modified_by: {
		nsfieldName:	'lastmodifiedby',	
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'F'
		},
	si_closed_date: {
		nsfieldName: 'custrecord_si_close_date',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},	
	si_last_reopened_date: {
		nsfieldName: 'custrecord_si_last_reopened_date',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},
	si_pm_disposition: {
		nsfieldName:	'custrecord_sipm_disposition',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_coordinatornotes: {
		nsfieldName: 'custrecord1',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T',
		restletDefaultOverwrite: 'F'
		},
	si_estimated_fix_date: {
		nsfieldName: 'custrecord_sidate',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'T'
		},
	si_resolution: {
		nsfieldName: 'custrecord_siresolution',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T'
		},
	si_rootcause: {
		nsfieldName: 'custrecord_sirootcause',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T',
		restletDefaultOverwrite: 'F'
		},
	si_rootcausetype: {
		nsfieldName: 'custrecord5',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_rootcausedept: {
		nsfieldName: 'custrecord4',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_prevention_plan: {
		nsfieldName: 'custrecord_sipreventionplan',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T',
		restletDefaultOverwrite: 'F'
		},
	si_sync_rally: {
		nsfieldName: 'custrecord_sync_rally',
		searchBy: 'anyof,noneof',
		fieldType:	'boolean',
		restletCanUpdate: 'T'
		},
	si_rally_ticket_type: {
		nsfieldName: 'custrecord_rally_ticket_type',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_rally_component: {
		nsfieldName:	'custrecord_rally_component',	
		searchBy:		'anyof,allof,noneof,notallof,is',
		fieldType:		'multiple',
		restletCanUpdate: 'T'
		},
	si_rally_no: {
		nsfieldName:	'custrecord_rally_no',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_rally_link_date: {
		nsfieldName: 'custrecord_rally_link_date',
		searchBy: 'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin',
		fieldType:	'date',
		restletCanUpdate: 'F'
		},
	si_rally_id: {
		nsfieldName:	'custrecord_rally_formated_id',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_rally_url: {
		nsfieldName:	'custrecord_linked_rally_url',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_database_short_name: {
		nsfieldName:	'custrecordprodcode',	
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_issn: {
		nsfieldName:	'custrecord_eis_issn',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_mid: {
		nsfieldName:	'custrecord_simid',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_pid: {
		nsfieldName:	'custrecord8',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_dtformat: {
		nsfieldName:	'custrecord_sidtformat',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_tagline: {
		nsfieldName:	'custrecord996',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
 	si_user_email: {
		nsfieldName:	'custrecord_online_si_submitter_email',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_category:{
		nsfieldName :   'custrecord_eis_content_category',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T',
		restletRequiredField_econtent:'T'
		},
	si_econtent_product:{
		nsfieldName :   'custrecord_eis_econtent_product',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T',
		restletRequiredField_econtent:'T'
		},
	si_econtent_publisher:{
		nsfieldName :   'custrecord_eis_publisher',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T',
		restletRequiredField_econtent:'T'
		},
  si_econtent_provider:{
		nsfieldName :   'custrecord_eis_provider_si',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_substatus:{
		nsfieldName :   'custrecord9',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
	si_econtent_journalname:{
		nsfieldName :   'custrecord_eis_journalname',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_journalid:{
		nsfieldName :   'custrecord_eis_journalid',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_volume:{
		nsfieldName :   'custrecord_eis_volume',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_issue:{
		nsfieldName :   'custrecord_eis_issue',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_articlename:{
		nsfieldName :   'custrecord_eis_articlename',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_pagenumbers:{
		nsfieldName :   'custrecord_eis_pagenumbers',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_rid:{
		nsfieldName :   'custrecord_eis_publid',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_relevantlinks:{
		nsfieldName :   'custrecord_eis_relevantlinks',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'text',
		restletCanUpdate: 'T'
		},
	si_econtent_addtid:{
		nsfieldName :   'custrecord_eis_titleassoced',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T'
		},
	si_econtent_removetid:{
		nsfieldName :   'custrecord_eis_disassociated_titles',
		searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
		fieldType:	'textarea',
		restletCanUpdate: 'T'
		},
	si_econtent_rootcause:{
		nsfieldName :   'custrecord3',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
		},
  si_form_id:{
		nsfieldName :   'customform',
		searchBy: 'anyof,noneof',
		fieldType:	'select',
		restletCanUpdate: 'T'
	},
  si_sid_url: {
        nsfieldName:    'custrecord_sid_url',
        searchBy: 'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain',
        fieldType:    'text',
        restletCanUpdate: 'T'
        }

};