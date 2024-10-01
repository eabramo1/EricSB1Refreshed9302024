/**
 * library2_constants.js
 * @NApiVersion 2.0
 */
//
// Script:     library2_constants.js
//
// Created by: Ken Seares, NS ACS
//
// Purpose:    This is a script file library of global constants & related functions that may be referred to in &
//             called from other scripts using 2.0 version.
//             Global Constants and related functions should be added here.
//
//-----------------------------------------------------------------------------------------------------------------------
// Constants:  		Added:	 	Name: 		    Description:										Functions:
// LC2_fieldList	10/21/19	kbseares		List of field filters for Field History Suitelet	LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet
//
//
//------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	10/21/19	kbseares		Original version
//	11/06/19	JOliver			Removed "Date Last Modified",  "Date Stamp", and "Last Updated".  Added "ARL Account"
//	11/14/19	JOliver			Added 7 new fieds per Tyler: SoCalis Account, Seventh-Day Adventists Account,Top 1000 Universities Ranking Date, Financial Times- Global MBA Ranking,
//								Academic Ranking of World Universities, U.S. News & World Report, 4 International Colleges & Universities
//	11/15/2019	FYap			Added Ids to LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet (relating to suitelet update to use field ID instead of field name)
//	01/03/20	EAbramo			Adding Constants for variables used for client2_case_sales_rwa.js (new Sales Case form for Sales RWA)
//	01/23/20	JOliver			Adding Constants for variables used for client2_case_folio_pricing.js (FOLIO Pricing Employee + Sales Case Type)
//	04/02/20	eAbramo			Added new field to LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet.  The field is IBM Micromedex Subscription
//	04/29/20	CNeale			Added new variable LC2_ContactENOrdApprovSts
//  05/26/20    cywang			Adding constants (YBP case profiles) and functions  for variables/functions used for
// 								userEvent2_message_get_latest_message_after_submit.js and userEvent2_case_before_submit.js
//	05/27/20	KMcCormack		Added new variable LC2_SAO_API_Endpoints
//	06/10/2020	CNeale			Added new variables LC2_ContactOpCat - Global Contact Operational Category Object
//								and LC2_SAO_API_Keys and Mercury Alerts employee & Global Email Object
//                              & Global Saved Search Object
//	06/17/20	cywang			Updated LC2_CleanMessage() to limit message to up to 3000 characters
//	09/01/2020	eAbramo			Added LC2_caseProfile object and functions - US684171 Case Profile auto-switch when Cases Created in 2 new Profiles
//	10/1/2020	joliver			Added 'New EDS UI Presented' to LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet TA522392
//	12/28/2020	eAbramo			Added EPTrainer to LC2_Role.  Added LC2_TrainingStatus.  added LC2_TaskStatus with standard list values.
//								added LC2_trainingReportType
//	01/6/2021	CNeale			US687561 Added EBSCONET Automated User to Employee, ENETAutoUsr to LC2_Email, Last_msg & ENet_reopen to LC2_SavedSearch
//								Added LC2_CaseOccupation, LC2_CaseReqTyp, LC2_CaseLevelEffort, LC2_Form, LC2_Eml_Tmplt, LC2_MaxFileSize, LC2_CaseDDEProd,
//								LC2_CaseDDEAreaSupport, LC2_CaseOrigin, LC2_CaseStatus
//	1/7/2021	JOliver			Added SI Status list (LC2_SIstatus) and SI Issue Type (LC2_SIissueType) US741113
//	2/2/2021	eAbramo			Added NoResponse to LC2_TrainingStatus
//	2/4/2021	PKelleher		US734985 New EIS Sales Panorama Pricing Case Form - added Panorama case form
//	3/15/2021	CNeale			US725157 Case delete attachments - added new object LC2_caseAttachDelSuitelet
//								& new functions isRoleCaseAttachDel & isProfileCaseAttachDel
//	3/24/2021	CNeale			US734954 Added LC2_Transition_LimitDays, LC2_Transition_Sts, added functions TransStsDte & TransDtOvr to LC2_Role & added many roles.
//								Also added in Customer Web Service Form, LC2_Transition_Show & saved searches & constant LC2_Transition_setBy
//								Also added LC2_tab
//	3/30/2021	eAbramo			More changes for Training Request form.  Added LC2_trainingSessionHours and added functions to  LC2_TrainingStatus
//	5/12/2021	CNeale			US734954 Set EDS Transition fields to show
//	05/2021		eAbramo			F52078 Many Functions added for integration with DocuSign
//	08/12/2021	PKelleher		US820968 - Added new role, anonymous customer, case form, dept and profile for Accessibility Support to script
//	09/10/2021	eAbramo			Added isClosed function to LC2_SIstatus constant (for refactoring SI client script to SS2)
//  11/03/2021	CNeale			US824125 Added LC2_SF_createNew constant (for SF sync - replicating SS1 constant).
//                              Added saved searches for Hide Case scheduled job.
//	11/09/2021	ZScannell		Added saved search for US854135 to determine who can override customer transition statuses from "Not Started" to "Complete"
//  11/23/2021	JOliver			TA657529 Added 5 new fields for Field History Suitelet (EIS Subs Target, EIS Subs Target Notes, EIS Package Target, EIS Package Target Notes, Folio Target)
//	12/1/2021	PKelleher		US856355 Added New Product Target (oppy) Sales form
//								Added Product Target Status list // Added Opportunity Status list // Added Opportunity Form Type values // Added to Emp list the Sales Ops Unassigned Rep
//								Created a new Customer object
//	12/06/2021	CNeale			US868211 Added LC2_SfCaseDelSts to store case SF delete status values
//								Added LC2_CxpNsAct to store CXP NS to SF Notification actions, plus related function delCaseAct
//	01/06/2022	CNeale			US893691 Added saved searches for FOLIO Customer scheduled job
//	2/9/2022	CNeale			TA680821 Adjust Transition Center Permissions (add EP Discovery Service Engineering role)
//	2/17/2022	PKelleher		US240546 Clean up code to remove South African Profile references (still needed in Profile list temporarily until cases get deleted)
//	2/28/2022	PKelleher		OpsGenie: Added new field info - EIS $ Volume With Competitor - for Target/Key Accounts subtab
// 	03/14/2022	eAbramo			US892776 Add ability to push the Item into WinSeR
//	3/15/2022	CNeale			US905097 Remove redundant Transition related info as follows:  TransDtOvr function, LC2_Transition_LimitDays, LC2_Transition_setBy,
//								6 x saved searches related to redundant Transition Functionality
//	03/29/2022	eAbramo			TA701381 Refactor client_sales_case_general.js to SuiteScript 2.0
//	05/19/2022	JOliver			TA714097 - Set FOLIO Access Status to Approved/Revoked
//	05/26/2022	ZScannell		US943054 LC2_ENET_OrderApprove_sts
//	06/01/2022	PKelleher		US966180 Adding values for EC Case Type field & EC User Access Case Status Reason field (Reason field deleted on 6/22/22)
//	06/10/2022	ZScannell 		US943094 TA721560 Adding values for "Closed" case stages for XEdit purposes (LC2_Closed_Case_Statuses)
//	06/22/2022	JOliver			US970744 TA721561 LC2_Access_Type_Req (Access Type Requested on case) + LC2_Access_Decision (used on EBSCO Connect Access Request cases)
//	06/30/2022	ZScannell		US931151 Added New Anywhere365 Chat Values to LC2_CaseOrigin
//	07/18/2022	ZScannell		US961740 - Added: isRoleModifyEC_Contact, IsCustEBSCOSFPush, LC2_Customer.EC_EBSCO_EIS, LC2_EC_Contact_Access_Type, LC2_SRPM_Conversion_Status, LC2_Form_subtabs
//	07/21/2022	ZScannell		Refactoring: Added LC2_OE_Case_Type, Edits to LC2_Role (Added EISBhamActRec (1122))
//	08/22/2022	PKelleher		TA744056 Add new HBCU field (created 4/25/22) to Target/Key Accounts Notes Field History button results (special system notes)
//	08/23/2022	ZScannell		Refactoring: Added ebookCoordinator (1385670) to LC2_Employee
//	08/24/2022	ZScannell		TA747142 Added IsCustSSEAnon IsCustYBPAnon to LC2_Customer
//	09/16/2022	ZScannell		TA752579 Added LicensedDBCoordinator to LC2_Employee
//	09/20/2022	ZScannell		TA754968 Added LC2_UnknownUser
//	09/30/2022	ZScannell		TA757931 Added CompetAnalysis to LC2_Employee
//	11/10/2022	PKelleher		TA769368 Origin field updates - Revised Origin value descriptions.
//	11/10/2022	PKelleher		Refactoring SS1 client2_opportunity_rfp - added RFP Statuses and Oppy Item statuses.
//	11/17/2022	ZScannell		US1035778 Added LC2_ContactOrigin + IsRoleSFContactCreateNew/IsRoleENOrdApprovRevoke/IsRoleENOrdApprovSet to LC2_Role + functions to LC2_ContactENOrdApprovSts
//										  + LC2_JobRole + LC2_globalSubscriptionStatus
//	12/13/2022	eAbramo			US1010709 Auto-default data for Tasks created through CloudExtend.  Added Saved Search called 'cloudExtendTasks_needDefault'
//	12/20/2022	PKelleher		US1044395 - New OpenAthens Pricing Case Form - add new case form
//	01/05/2022	eAbramo			TA784532 - fix for JobRole of Needs Assignment
//	1/5/2023	PKelleher		US1051405, TA784525 - Added two additional roles (IDS: 1148 and 1149) and fixed ROLE functions whose subtext was referring to SS1 subtext.
//	1/13/2023	PKelleher		US1058887 New EC Re-Architecture: Adjust roles function to remove EP Support Person 1 so they don't have ability to resend, revoke or approve access statuses.
//	1/31/2023	ZScannell		US1057768 NS: ECP2B4: Implement limited EC Access related functions for EP Support Person Role [no pre-req]]
//	2/27/2023	PKelleher		US1044394 Added new employee record for Assigned To field for the newly created OpenAthens Pricing Case form
//	05/09/2023	ZScannell		US1096154 Added CDPGroup to LC2_Role to Support Contact-based script changes
//	05/25/2023	KMcCormack		US1113403 Clinical Decisions EC Portal - New function isClinicalDecSupport added to LC2_Role to
//								identify Clinical Dec Support user to allow setting of Clinical Decision EBSCO Connect Access
//	06/02/2023	eAbramo			US856610 NS Case Scripting for Clinical Decisions Portal: Updated LC2_Departments value
// 	06/05/2023	PKelleher		US1117942 Added 'Mexico' Office value for work on new MX Quote Details subtab
//	06/15/2023	KMcCormack		US1099670 CDP - REL-04 Regression Tix Ticket
//								TA826284  Administrator does not have edit access to the Clinical Decision EC Access field on the
//										the Contact.  The "isRoleClinicalDecSupport" was updated to include "Administrator" as true
//	08/08/2023	ZScannell		US1137504	Adding new Constants object LC2_ParentChildRelationshipType
//	10/25/2023	eAbramo			US1168294 GOBI Case Survey: Move Code and Search to SB1-refresh-2024-09-30 and SB3
//	10/30/2023	eAbramo			US1122979 Update Discovery Solution Tab
//	10/30/2023	PKelleher		US115773 Updates to EIS Sales Task form. Included moving library_constants.ss2.js code over to library2_constants.js and then inactivating the ss2.js script.
//	11/06/2023	ZScannell		US1123000	Adding LC2_MosaicObjections to support new MOSAIC Custom Record client script
//	11/21/2023	PKelleher		TA857346 - Add Romie Conroy to Emp list - part of work for refactoring & updating EBC/eCollection case form
//	12/13/2023	ZScannell		US1166718 	Created LC2_YBPCaseStatuses. Added isYBPProfile to LC2_YBPProfiles
//  11/27/2023  WClark			TA853538 Part of the refactoring process, moved UnassignedOMGOrders UnassignedOMGStatusing UnassignedOMGClaims to LC2_Employee
//	12/6/2023	PKelleher		TA872986 - Add Subs Call Topics section as part of refactoring client2_task_sales.js.  Also added Subs Office Codes section (both housed on a custom record)
//								SubsCallPline:	'customsearch_nsacs_callprodline' // TA872986 Refactor client2_task_sales.js - uses this search
//	01/16/2024	PKelleher		US1094216 - New Stacks case form - add form, employee record, sales case type value
//	01/31/2024	ZScannell		US1166718 	Created LC2_YBPCaseStatuses. Added isYBPProfile to LC2_YBPProfiles
//	02/05/2024	PKelleher		US1196828 - Move New FOLIO Case Survey form and new FOLIO Survey Type value to SB3
//	2/21/2024	PKelleher		TA872986 - Add Subs Call Topics section as part of refactoring client2_task_sales.js.  Also added Subs Office Codes section (both housed on a custom record)
//								SubsCallPline:	'customsearch_nsacs_callprodline' // TA872986 Refactor client2_task_sales.js - uses this search
//	03/14/2024	PKelleher		US1238305 - Add Request Reason values :: Make Meeting Date field mandatory when 'Needed for Meeting' is chosen as a Request Reason
//	04/29/2024	eAbramo			US1240633 Scripting to apply EBSCO Hosted FOLIO Access Status Part 2
//	05/02/2024	ZScannell		TA906881	Added Task Forms to LC2_Form to support refactoring of Client_Record_Task
//	05/02/2024	JOliver			US1240270 - Additions to LC2_SavedSearch for FOLIO Hosted by EBSCO flag not set on customer
//	05/06/2024	PKelleher		TA907556 - Additions for Refactoring of client_eis_account.js script - task for moving to Production
//	05/30/2024	PKelleher		US1236099 - Field Values added for new OpenRS Pricing Case form
//	07/16/2024	eAbramo			US1277955 SuiteSignOn Replacement - WinSer MLO and Product Campaign integration
//	8/1/2024	PKelleher		US1277421 - Add eBook Quote tool Oppy form for use in SSO work
//
/****************************************************************************************************************************
 *  Objects/Constants List:
 *
 *  LC2_fieldList - List of field filters used for Field History Suitelet
 *  LC2_Employee
 *	LC2_Emp_Office - Office values from Employee record
 *  LC2_SalesCaseType
 *  LC2_Role
 *  LC2_ContactENOrdApprovSts - Global Contact EBSCONET Order Approver Status Object
 *  LC2_ContactValidateENOrdApprovSts - Global Contact Validate EBSCONET Order Approver Status Object
 *  LC2_SAO_API_Endpoints
 *  LC2_SAO_API_Keys
 *  LC2_ContactOpCat - Global Contact Operational Category Object
 *  LC2_Email - Global Alert Email Object
 *  LC2_SavedSearch - Global Saved Search Object
 *  LC2_Profiles
 *  LC2_CaseOrigin
 *  LC2_CaseStatus
 *  LC2_Departments
 *  LC2_CaseDDEAreaSupport
 *  LC2_CaseDDEProd
 *  LC2_YbpProfiles
 *  LC2_cleanMessage - Takes in a messsage from either a message record or on the case record reply section and strips off HTML tags
 *  LC2_CaseOccupation
 *  LC2_CaseReqTyp
 *  LC2_CaseLevelEffort
 *  LC2_Form
 *  LC2_Eml_Tmplt - Email template ID's
 *  LC2_MaxFileSize - Maximum File Size
 *  LC2_TrainingStatus
 *  LC2_TaskStatus
 *  LC2_trainingReportType
 *  LC2_SIstatus
 *  LC2_SIissueType
 *  LC2_Transition_Show - Indicates whether to display Transition fields for each transition type
 *  LC2_Transition_Sts - Transition Status (EDS/eHost/Explora/Ref Center)
 *  LC2_Transition_typ - Transition Type
 *  LC2_pan_data_sources
 *  LC2_yes_no_only
 *  LC2_tab - internal id's of tabs/subtabs
 *  LC2_caseAttachDelSuitelet - Case attachment delete suitelet info.
 *  LC2_schedScriptRunTime
 *  LC2_trainingSessionHours
 *  LC2_AUTH_API_Endpoints
 *  LC2_CLM_API_Endpoints
 *  LC2_DocSign_CLM_Body
 *  LC2_Integration_Token
 *  LC2_DocSign_AuthKey
 *  LC2_ClientScript_FileID
 *  LC2_SF_createNew - 'createNew' constant used for sync to SF (replicates SS1)
 *  LC2_SfCaseDelSts - stores the SF Case Delete Status list values (replicates SS1)
 *  LC2_CxpNsAct - stores the CXP NS Action list values
 *  LC2_ProdTarg_sts - stores the values from the Product Target Status field
 *  LC2_Oppy_sts - stores the Opportunity REAL statuses
 *  LC2_OppyItemStatus - stores the Opportunity Item statuses
 *  LC2_RFPStatus - stores the RFP statuses (for opportunities)
 *  LC2_OppyFormType - stores the Opportunity Form Type values
 * 	LC2_Customer - Stores the Customer values
 *  LC2_ENET_OrderApprove_sts
 * 	LC2_EC_Contact_Access_Type - Stores the values of the custom list "EC Contact Access Type"
 * 	LC2_SRPM_Conversion_Status - Stores the values of the custom list "SRPM Conversion Status"
 *	LC2_Access_Type_Req - Access Type Requested on case (relating to EBSCO Connect Access)
 *	LC2_Access_Decision - Used on EBSCO Connect Access Request cases
 * 	LC2_Form_subtabs - Stores the values of a form's subtab, used primarily in the 'N/ui/widget' module
 *  LC2_EC_Case_Type
 * 	LC2_OE_Case_Type - Stores the hard-coded values for the custom list "OE Case Type"
 * 	LC2_TaskType
 * 	LC2_IPMProgramProduct
 * 	LC2_SurveyType	- stores values of the Survey Type list
 * 	LC2_MosaicObjections - Stores the values of the MOSAIC Objections custom list
 * 	LC2_SubsCallTopics - Stores the values of the Subs Call Topics found in the custom record
 * 	LC2_SubsOfficeCodes - Stores the values of the Subs Office Codes found in the custom record
 * 	LC2_YBPCaseStatuses - Stores the values of the YBP Case Status custom list
 *	LC2_EISProdType - Stores the values of the custom record EIS Product Types list, used on the EIS Account custom record
 *	LC2_RequestReason - Stores values for the Request Reason field on the Title Comparison case form
 *
 */

define(function(){

	/*--------------------------------------------------------------------------------------------------------------------------
    * LC2_fieldList - List of field filters used for Field History Suitelet
    *
    *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet = [
		{ name: "- All -", id:""},
		{ name: "4 International Colleges &amp Universities", id:"custentity_intlcollegesanduniv" },
		{ name: "Academic Ranking of World Universities", id: "custentity_acarankofworlduniv"},
		{ name: "ARL Account", id:"custentity_arl"},
		{ name: "Contract Attached", id:"custentity33"},
		{ name: "Coutts Top 100", id:"custentity29"},
		{ name: "EIS Cox Account", id:"custentity_eis_cox_acct"},
		{ name: "EIS Package Target", id:"custentity_eis_package_target"},
		{ name: "EIS Package Target Notes", id:"custentity_eis_package_target_notes"},
		{ name: "EIS Priority Cox Account", id:"custentity_eis_priority_cox"},
		{ name: "EIS Subs Target", id:"custentity_eis_subs_target"},
		{ name: "EIS Subs Target Notes", id:"custentity_eis_subs_target_notes"},
		{ name: "EIS $ Volume With Competitor", id:"custentity_eis_dollar_vol_with_competito"}, // added 2/28/22 per Tyler
		{ name: "Financial Times- Global MBA Ranking", id:"custentity_ftgmbaranking"},
		{ name: "Folio Target", id:"custentity_folio_target"},
		{ name: "FY'17 Public Library Flipster Targets", id:"custentity36"},
		{ name: "HBCU", id:"custentity_tka_hbcu"}, // TA744056 8/22/22
		{ name: "IBM Micromedex Subscription", id:"custentity_ibm_micromedex"},
		{ name: "K-12 EDS Target Accounts", id:"custentity6"},
		{ name: "Key Account", id:"custentitykey_account"},
		{ name: "LEX - Top FTE 2 Year Colleges", id:"custentity25"},
		{ name: "MISBO Account", id:"custentity39"},
		{ name: "MLA/MLA w FT Prospects List", id:"custentity24"},
		{ name: "New EDS UI Presented", id:"custentity_new_eds_ui_presented"},
		{ name: "Novelist Notes", id:"custentity_novelist_notes"},
		{ name: "NOVELIST PROSPECT", id:"custentity34"},
		{ name: "Seventh-Day Adventists Account", id:"custentity_seventh_day_adventists_acct"},
		{ name: "Shanghai 300", id:"custentity_shanghai_300"},
		{ name: "SoCalis Account", id:"Field ID: custentity_socalis_account"},
		{ name: "Statewide/Countrywide Deal", id:"custentity_statewide_countrywide_deal"},
		{ name: "Target Replacement Package", id:"custentity_tgt_replacement_package"},
		{ name: "Top 1000 Universities", id:"custentity30"},
		{ name: "Top 1000 Universities Ranking Date", id:"custentity_top_univ_ranking_date"},
		{ name: "Top International Business Schools", id:"custentity11"},
		{ name: "Top Private Schools", id:"custentity40"},
		{ name: "Top U.S. Business Schools", id:"custentity10"},
		{ name: "UK GOBI Academic CPC Member", id:"custentity42"},
		{ name: "UK GOBI Academic SUPC Member", id:"custentity41"},
		{ name: "U.S. News &amp World Report", id:"custentity_usnewsworldreport"},
		{ name: "YBP - GOBI Sales Demo Target", id:"custentity35"},
		{ name: "YBP 15% Credit", id:"custentity26"},
		{ name: "YBP Medical Targets", id:"custentity28"},
		{ name: "YBP Regional Competitor", id:"custentity9"}
	];

	/*--------------------------------------------------------------------------------------------------------------------------
       * LC2_Employee
       *
    *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_Employee = {
		UnassignedDDETech: '901608',
		UnassignedSSEAUSupport: '1503907',
		UnassignedSSEAUBackOff: '1503908',
		UnassignedSSEUKSupport: '1490556',
		UnassignedSSEUKBackOff: '1491212',
		UnassignedSSEGermany: '1559122',
		UnassignedYBPCS: '1585985',
		UnassignedYBPEC: '1585987',
		UnassignedYBPGOBI: '1630874',
		UnassignedYBPLTSAccounts: '1639084',
		UnassignedYBPLTSInternal: '1639086',
		VertifyUser: '25769860',
		DellBoomiUser: '25769961',
		SystemUser: '25769963',
		SalesSystemAdmin: '461925', 		// 03/29/2022 eAbramo	Move client_case_salesGeneral.js from SS1.0 to SS2.0
		SalesOpsUnassignedRep: '1660879',
		Sales_Panorama: '32576286', 		// internal ID belongs to PROD Panorama Case Coordinator emp record
		Sales_RWA:	'27974649',
		StacksPricingCoord:  '35820419',	// Stacks Pricing Coordinator PROD id to be used to populate Assigned To field on case creation :: US1094253 added 1/30/24
		FOLIO_Pricing: '28169701',
		OpenAthens_Pricing: '35196828',		// employee record for new OA Pricing Case form created early 2023
		MercuryAlerts: '4050413',
		EBSCONETAutoUser: '32072121',
		ebookCoordinator: '1385670',			//	2022-08-23	ZScannell: Refactoring client_case_salesEbAbCustom and client_case_salesEbAbGen
		LearnExpSalesOps: '1527600',			//	2022-08-23	ZScannell: Refactoring client_case_salesEbAbCustom and client_case_salesEbAbGen
		MichelleKelley: '1383622',				//	2022-08-23	ZScannell: Refactoring client_case_salesEbAbCustom and client_case_salesEbAbGen
		LicensedDBCoordinator: '1385665',		// 	2022-09-19	ZScannell: Refactoring client_case_salesLSDPricing
		CompetAnalysis: '537869',				//	2022-10-03	ZScannell: Refactoring client_case_salesTitleComp
		RomieConroy: '1580963',			// TA857346 - set Assigned To to Romie Conroy on all new EBC/eCollection cases
		UnassignedOMGOrders: '1619686',			//  10/17/2023 WClark: Refactoring client_case_ybp_omg
		UnassignedOMGStatusing: '1619688',		//  10/17/2023 WClark: Refactoring client_case_ybp_omg
		UnassignedOMGClaims: '1619687',			//  10/17/2023 WClark: Refactoring client_case_ybp_omg
		OpenRSPricingCoord: '36118489'			//	US1236099 OpenRS Pricing Coord - PROD id
	};


	/*--------------------------------------------------------------------------------------------------------------------------
       * LC2_Emp_Office
       *
    *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_Emp_Office = {
		Mexico: 		'18' 	// US1117942
	};


	/*--------------------------------------------------------------------------------------------------------------------------
      * LC2_SalesCaseType
      *
    *---------------------------------------------------------------------------------------------------------------------------*/
	LC2_SalesCaseType = {
		SalesAdmin:			'1',
		TitleComparison:	'2',
		LSD: 				'3',
		eBaBCustom:			'5',
		eBaBGeneral:		'6',
		EDSAnalysis:		'7',
		OpenAthens:			'9', // left as is when new form was created from old web form - US1044395	 // also reactivated and renamed value in NetCRM list
		PlumX:				'10',
		RWA:				'11',
		FolioPricing:		'12',
		Panorama:			'13',
		Stacks:				'14',   // US1094253 added 1/30/24
		OpenRS:				'15'	// US1236099 - PROD id

	}

	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Role
     *
     *---------------------------------------------------------------------------------------------------------------------------*/    
    LC2_Role = {
			Administrator: 				'3',			//Administrator
			CustomerCenter: 			'14',			//Customer Center
			WebServ: 					'1025',			//EP Web Service 
			EPSupAdmin: 				'1006',			//EP Support Administrator
			EPSupMngr: 					'1002',			//EP Support Manager 1
			EPSupPers: 					'1003',			//EP Support Person 1
			EPDscSrvEng:				'1074',			//EP Discovery Service Engineering
			EPTrainer:					'1030',			//EP Trainer
			SSDAUCustServ: 				'1085',			//SSD AU Customer Service Officer
			SSEOffices:					'1042',			//EP SSE Offices
			SSESupportGermany: 			'1108',			//EIS SSE German Support Rep 1
			SSESupportUK: 				'82',			//EIS SSE UK Support Rep 1
			SSEUKSuppRep:				'1028',			//EIS SSE UK Support Rep 1
			GOBSSDRegSalesMgr:			'1105',			//GOBI/SSD Regional Sales Manager
			YBPCollectDevMgr:			'1107',			//YBP - Collection Development Manager
			YBPSupMngr: 				'1110',			//YBP Support Manager
			YBPSupPers: 				'1109',			//YBP Support Person
		    YBPEContent: 				'1115',			//YBP eContent
		    YBPGOBI: 					'1121',			//YBP GOBI Support
		    YBPLTS: 					'1123',			//YBP LTS
		    YBPOMG: 					'1120',			//YBP OMG
			EPDiscSolutionsSup:			'1069',			//EP Discovery Solutions Support
			EPMarketDev:				'1033',			//EP Market Development
		    EPOrdProc: 					'1011',			//EP Order Processing 1
			EPProductMngmt:				'1023',			//EP Product Management
			EPProductSystemGroup:		'1083',			//EP Product System Group
			EPSICoordinator:			'1013',			//EP Service Issues Coordinator
		    EISAccess:  				'1168',			//EIS Accessibility Support
			EISContentLic:				'1071',			//EIS Content Licensing
			EISeContentSiCoord:			'1064',			//EIS e-Content SI Coordinator
		    EPSalesAdmin: 				'1007',         //EP - Sales Administrator
		    EISMktgMgr: 				'1008',			//EIS Mktg Manager
		    EISMktgAdmin: 				'1009',			//EIS Mktg Administrator
		    EISMktgDataMngmt: 			'1128',			//EIS Mktg Data Management
		    EISMktgSalesOpsDupMngmt: 	'1129',			//EIS Mktg Sales Ops Duplicate Management
		    EISMktgDupMngmtCSVImport: 	'1130',			//EIS Mktg Duplicate Mngmnt and Contact CSV Import
		    MuvDataWebSvc: 				'1116',			//MuvData Web Service
		    EISacctsPayable: 			'1165',			//EIS Accounts Payable
		    SalesAcaMngmt: 				'1148',			// EIS Sales - ACADEMIC - Management
		    SalesAnalyst:				'1053',			// EP - Sales Analyst
		    SalesOpsMngr: 				'1057',			// EP Sales Operations Manager
		    SalesOpsDir: 				'1065',			// EP Sales Operations Director
		    SalesInsideDir: 			'1001',			// EP - Inside Sales Dircetors
		    SalesAE: 					'1005',			// EP Account Executive (Sales)
		    SalesIntlAE: 				'1014',			// EP - INTL Account Executive
		    SalesIntlDir: 				'1019',			// EP - INTL Director (Sales)
		    SalesRSM: 					'1020',			// EP - Regional Sales Manager	
		    SalesDir: 					'1027',			// EP - Director (Sales)
		    SalesVP: 					'1034',			// EP - Vice President (Sales)
		    SalesIntlRSM: 				'1037',			// EP - INTL Reg Sales Manager
		    SalesIntlVP: 				'1041',			// EP - INTL VP (Sales)		
		    SalesFSR: 					'1052',			// EP - Field Sales Representative
		    SalesIntlFSR: 				'1058',			// EP - INTL FSR
		    SalesMgr: 					'1072',			// EP - Sales Manager
		    SalesAUNZInside:			'1112',			// EIS Sales - AU/NZ - Inside Sales
		    SalesAUNZField:				'1113',			// EIS Sales - AU/NZ - Field
		    SalesAUNZMngmt:				'1114',			// EIS Sales - AU/NZ - Management
		    SalesMedInside:				'1124',			// EIS Sales - MEDICAL - Inside Sales	
		    SalesCorpGovInside:			'1125',			// EIS Sales - CORP/GOV - Inside Sales
		    SalesMedMngmt:				'1126',			// EIS Sales - MEDICAL - Management
		    SalesCorpGovMngmt:			'1127',			// EIS Sales - CORP/GOV - Management
			SalesNSMobile:				'1138',			// EIS Sales for NetSuite Mobile
		    SalesAcdmcInside:			'1146',			// EIS Sales - ACADEMIC - Inside Sales
		    SalesK12PLInside:			'1147',			// EIS Sales - K12/PL - Inside Sales	
		    SalesK12PLMngmt: 			'1149',			// EIS Sales - K-12/PL - Management
		    SalesJpnAE:					'1150',			// EIS Sales - Japan Account Executive
		    SalesJpnField:				'1151',			// EIS Sales - Japan Field
		    SalesJpnMngmt:				'1152',			// EIS Sales - Japan Management
		    SalesRSMF:					'1154',			// EIS Sales - RSM/FIELD Sales	
		    SalesIntlInside:			'1157',			// EIS Sales - INTERNATIONAL - Inside Sales
			SubscPubServices:			'1080',			// Subsc - Publisher Services
		    CompetAnalysis:				'1056',			// EP - Competitive Analysis Group
		    EISBHamActRec:				'1122',			// EIS B'ham Accts Receivable
			CDSupport:					'1172',			// Clinical Decisions Support Group

			// US1157773 EIS Sales Task for edits, combined with refactoring (inactivating library_constants_ss2.js)
			/* Function: isRoleNonSales // function used in library_constants_ss2.js before it was inactivated
			* Description: Determines whether roles passed in are Non-Sales roles
			* Input      : roleIn = role internal Id
			* Returns    : true = Role With Permission or false = Role without Permission
			* */
			IsRoleNonSales: function (roleIn) {
				return (roleIn == this.EISContentLic || roleIn == this.EISeContentSiCoord || roleIn == this.EISMktgAdmin  || roleIn == this.EISMktgDataMngmt  ||
				roleIn == this.EISMktgMgr  ||  roleIn == this.CompetAnalysis || roleIn == this.EPDscSrvEng || roleIn == this.EPDiscSolutionsSup  ||
				roleIn == this.EPMarketDev  ||  roleIn == this.EPOrdProc  || roleIn == this.EPProductMngmt  || roleIn == this.EPProductSystemGroup  ||
				roleIn == this.EPSICoordinator  ||  roleIn == this.EPSupAdmin  || roleIn == this.EPSupMngr  || roleIn == this.EPSupPers  ||
				roleIn == this.EPTrainer  ||  roleIn == this.SSDAUCustServ  || roleIn == this.SubscPubServices  || roleIn == this.YBPEContent  || roleIn == this.YBPGOBI ||
				roleIn == this.YBPLTS  ||  roleIn == this.YBPSupMngr) || roleIn == this.YBPSupPers  ? true : false;
			},
			// US1157773 EIS Sales Task for edits, combined with refactoring (inactivating library_constants_ss2.js)
			/* Function: isRoleIntlSalesRep // function used in library_constants_ss2.js before it was inactivated
			* Description: Determines whether roles passed in are International Sales Rep roles
			* Input      : roleIn = role internal Id
			* Returns    : true = Role With Permission or false = Role without Permission
			* */
			IsRoleIntlSalesRep: function (roleIn) {
				return (roleIn == this.SalesIntlAE || roleIn == this.SalesIntlDir || roleIn == this.SalesIntlFSR || roleIn == this.SalesIntlRSM ||
				roleIn == this.SalesIntlVP  ||  roleIn == this.SalesIntlInside) ? true : false;
			},
			// US1157773 EIS Sales Task for edits, combined with refactoring (inactivating library_constants_ss2.js)
			/* Function: isRoleFieldSalesAndVisit // function used in library_constants_ss2.js before it was inactivated
			* Description: Determines whether roles passed in are Field Sales and Visit roles
			* Input      : roleIn = role internal Id
			* Returns    : true = Role With Permission or false = Role without Permission
			* */
		//********** PK: check to confirm that (1) sseoffices & (2) YBP Collection Dev Mgr - belongs in this function **************** //
			IsRoleFieldSalesAndVisit: function (roleIn) {
				return (roleIn == this.SalesAUNZField || roleIn == this.SalesJpnField || roleIn == this.SalesJpnMngmt  || roleIn == this.SalesFSR || roleIn == this.SalesIntlFSR  ||
				roleIn == this.SalesIntlRSM ||  roleIn == this.SalesRSM || roleIn == this.SSEOffices  || roleIn == this.GOBSSDRegSalesMgr  ||
				roleIn == this.YBPCollectDevMgr  || roleIn == this.SalesNSMobile) ? true : false;
			},
			// US1157773 EIS Sales Task for edits, combined with refactoring (inactivating library_constants_ss2.js)
		   /* Function: isRoleAcctExecAndPhone // function used in library_constants_ss2.js before it was inactivated
		   * Description: Determines whether roles passed in are Account Executive and Phone Call roles
		   * Input      : roleIn = role internal Id
		   * Returns    : true = Role With Permission or false = Role without Permission
		   * */
			IsRoleAcctExecAndPhone: function (roleIn) {
				return (roleIn == this.SalesAcdmcInside || roleIn == this.SalesRSMF || roleIn == this.SalesAUNZInside  || roleIn == this.SalesCorpGovInside ||
						roleIn == this.SalesJpnAE  ||  roleIn == this.SalesK12PLInside || roleIn == this.SalesMedInside  || roleIn == this.SalesAE  ||
						roleIn == this.SalesIntlAE  || roleIn == this.SalesIntlInside) ? true : false;
			},
		    /*Function:		TransStsDte(roleIn)  // US734954
		     * Description:	Determines whether role passed in can edit EDS/eHost/Explora/Ref Ctr Transition fields on Customer
		     * Input:		roleIn = role internal Id	
		     * Returns    : true if allowed to edit or false if other */
		    // TA680821 Added EP Discovery Service Engineering role
		    TransStsDte: function (roleIn) {
		    	return (roleIn == this.Administrator || roleIn == this.WebServ || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr ||
		    			roleIn == this.EPSupPers || roleIn == this.EPSalesAdmin || roleIn == this.SalesDir || roleIn == this.SalesVP ||
		    			roleIn == this.SalesInsideDir || roleIn == this.SalesOpsDir || roleIn == this.SalesOpsMngr || roleIn == this.SalesMgr ||
		    			roleIn == this.SalesRSM || roleIn == this.SalesFSR || roleIn == this.SalesAE || roleIn == this.SalesIntlAE ||
		    			roleIn == this.SalesIntlDir || roleIn == this.SalesIntlRSM || roleIn == this.SalesIntlVP || roleIn == this.SalesIntlFSR ||
		    			roleIn == this.SalesAUNZInside || roleIn == this.SalesAUNZField || roleIn == this.SalesAUNZMngmt || roleIn == this.SalesMedInside ||
		    			roleIn == this.SalesCorpGovInside || roleIn == this.SalesMedMngmt || roleIn == this.SalesCorpGovMngmt || roleIn == this.SalesAcdmcInside ||
		    			roleIn == this.SalesK12PLInside || roleIn == this.SalesJpnAE || roleIn == this.SalesJpnField || roleIn == this.SalesJpnMngmt ||
		    			roleIn == this.SalesRSMF || roleIn == this.SalesIntlInside || this.EPDscSrvEng) ? true : false;
		    },
		    /*Function:		isRoleCaseAttachDel(roleIn)  // US725157
		     * Description:	Determines whether role passed in can delete case attachments (via Suitelet utility)
		     * Input:		roleIn = role internal Id	
		     * Returns    : true if allowed to delete or false if other */
		    isRoleCaseAttachDel: function (roleIn) {
		    	return (roleIn == this.EPSupMngr ) ? true : false;
		    },	    
		    /*Function:		isRoleSalesCaseAdmin(roleIn)  // Move client_case_salesGeneral.js from SS1.0 to SS2.0
		     * Description:	Determines if role passed in can modify all the fields on the Sales General Case form
		     * Input:		roleIn = role internal Id	
		     * Returns    : true if allowed to modify all fields or false if other role */	    
		    isRoleSalesCaseAdmin: function (roleIn) {
		    	return (roleIn == this.EPSalesAdmin || roleIn == this.Administrator || roleIn == this.SalesInsideDir || roleIn == this.SalesOpsMngr ||
		    			roleIn == this.EPOrdProc || roleIn == this.SalesAnalyst || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr || 
		    			roleIn == this.EPSupPers || roleIn == this.CompetAnalysis || roleIn == this.SalesOpsDir) ? true : false;
		    },
		    // US961740 - Recreated from library_constants for new version of UserEvent_Contact_Before_Loaded needed to display matched SRPM
		    /* Function		: isRoleModifyEC_Contact(roleIn)
		     * Description	: Determines whether role passed in is allowed to invite a Contact to EBSCO Connect
		     * Input		: roleIn = role internal Id
		     * Returns		: true = Invite Contact to EBSCO Connect allowed, false = other
		     */
		    isRoleModifyEC_Contact: function(roleIn){
		    	return (roleIn == this.Administrator || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr) ? true : false;
		    },
			// US1057768
			/* Function		: isRoleResendInvitationECContact(roleIn)
			 * Description	: Determines whether role passed in is allowed to resend an invitation a Contact to EBSCO Connect
			 * Input		: roleIn = role internal Id
			 * Returns		: true = Invite Contact to EBSCO Connect allowed, false = other
			 */
			isRoleResendInvitationECContact: function(roleIn){
				return (roleIn == this.EPSupPers) ? true : false;
			},
			// US1113403 - TA816830  Identify Clinical Decision Role for access setting validations
			// US1099670 - TA826284	 Add "Administrator" as a role recognized to have Clinical Dec Support privileges
			/* Function		: isRoleClinicalDecSupport(roleIn)
			 * Description	: Determines whether role passed in is allowed to update Clinical Dec Access for Contact to EBSCO Connect
			 * Input		: roleIn = role internal Id
			 * Returns		: true = Update EBSCO Connect Clinical Decision allowed, false = other
			 */
			isRoleClinicalDecSupport: function(roleIn){
				return (roleIn == this.CDSupport || roleIn == this.Administrator) ? true : false;
			},
			/* Function: isRoleSFContactCreateNew
			* Description: Determines whether role passed in is allowed to set "createNew" for Contact sync to Sales Force
			* Input      : roleIn = role internal Id
       		* Returns    : true = Contact SF createNew sync allowed or false = other
			* */
			IsRoleSFContactCreateNew: function (roleIn) {
				return (roleIn == this.Administrator || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr) ? true : false;
			},
			/*Function   : IsRoleENOrdApprovRevoke(roleIn)
			 * Description: Determines if role has permission to request revoke of EBSCONET Order Approver
			 * Input      : roleIn = role internal Id
			 * Returns    : true = Role With Permission or false = Role without Permission                            */
			IsRoleENOrdApprovRevoke: function (roleIn) {
				return (roleIn == this.Administrator || roleIn == this.EPSalesAdmin || roleIn == this.SalesAE ||
					roleIn == this.SalesRSM || roleIn == this.SalesMedInside || roleIn == this.SalesCorpGovInside ||
					roleIn == this.SalesAcdmcInside || roleIn == this.SalesK12PLInside || roleIn == this.SalesFSR ||
					roleIn == this.SalesMedMngmt || roleIn == this.SalesCorpGovMngmt || roleIn == this.SalesAcaMngmt ||
					roleIn == this.SalesK12PLMngmt || roleIn == this.SalesRSMF || roleIn == this.SalesIntlAE ||
					roleIn == this.SalesIntlRSM || roleIn == this.SalesIntlDir || roleIn == this.SalesAUNZInside || roleIn == this.SalesAUNZField ||
					roleIn == this.SalesAUNZMngmt || roleIn == this.SSDAUCustServ || roleIn == this.SalesIntlFSR || roleIn == this.SalesIntlVP) ? true : false;
			},
			// US631219 function needed to check which roles can request set of EBSCONET Order Approver
			/*Function   : IsRoleENOrdApprovSet(roleIn)
			 * Description: Determines if role has permission to request set of EBSCONET Order Approver
			 * Input      : roleIn = role internal Id
			 * Returns    : true = Role With Permission or false = Role without Permission                            */
			IsRoleENOrdApprovSet: function (roleIn) {
				return (roleIn == this.Administrator || roleIn == this.EPSalesAdmin || roleIn == this.SalesAE ||
					roleIn == this.SalesRSM || roleIn == this.SalesMedInside || roleIn == this.SalesCorpGovInside ||
					roleIn == this.SalesAcdmcInside || roleIn == this.SalesK12PLInside || roleIn == this.SalesFSR ||
					roleIn == this.SalesMedMngmt || roleIn == this.SalesCorpGovMngmt || roleIn == this.SalesAcaMngmt ||
					roleIn == this.SalesK12PLMngmt || roleIn == this.SalesRSMF || roleIn == this.SalesIntlAE ||
					roleIn == this.SalesIntlRSM || roleIn == this.SalesIntlDir || roleIn == this.SalesAUNZInside || roleIn == this.SalesAUNZField ||
					roleIn == this.SalesAUNZMngmt || roleIn == this.SSDAUCustServ || roleIn == this.SalesIntlFSR || roleIn == this.SalesIntlVP || roleIn == this.SalesIntlInside) ? true : false;
			},
			/*Function   : IsMktgRole(roleIn)
			 * Description: Determines whether role passed in is a Marketing role -- added as part of US1277955
			 * Input      : roleIn = role internal Id
			 * Returns    : true = one of Mktg role or false = other                             */
			IsMktgRole: function (roleIn) {
				return (roleIn == this.EISMktgMgr || roleIn == this.EISMktgAdmin || roleIn == this.EISMktgDataMngmt ||
					roleIn == this.EISMktgSalesOpsDupMngmt || roleIn == this.EISMktgDupMngmtCSVImport) ? true : false;
				}
	}
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_ContactENOrdApprovSts - Global Contact EBSCONET Order Approver Status Object
     *
     *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_ContactENOrdApprovSts = {
			Approved: '1',					//Approved
		    InProgress: '2',				//In Progress
		    Revoked: '3',					//Revoked
		    CallFail: '4',					//Call Failure
		    Requested: '5',					//Requested
		    RevokeInProg: '6',				//Revoke In Progress
		    RevokeReq: '7',					//Revoke Requested
			/*Function   : IsSetAllowed(statusIn)
			 * Description: Determines whether existing EBSCONET Order Approver Status allows new request to Set
			 * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
			 * Returns    : true = OK to Set or false = not Allowed                             */
			IsSetAllowed: function (statusIn) {
				return (statusIn == this.Revoked || statusIn == this.CallFail || !statusIn)? true : false;
			},
			/*Function   : IsRevokeAllowed(statusIn)
			 * Description: Determines whether existing EBSCONET Order Approver Status allows request to Revoke
			 * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
			 * Returns    : true = OK to Revoke or false = not Allowed                             */
			IsRevokeAllowed: function (statusIn) {
				return (statusIn == this.Approved)? true : false;
			},
			/*Function   : IsInactivateAllowed(statusIn)
			 * Description: Determines whether Contact Inactivation allowed for existing EBSCONET Order Approver Status
			 * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
			 * Returns    : true = Allowed or false = Not Allowed                             */
			IsInactivateAllowed: function (statusIn) {
				return (statusIn == this.Revoked || statusIn == this.CallFail || statusIn == this.Requested || statusIn == this.RevokeInProg || !statusIn)? true : false;
			},
			/*Function   : IsEmailCustChgAllowed(statusIn)
			 * Description: Determines whether Email or Customer change allowed for existing EBSCONET Order Approver Status
			 * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
			 * Returns    : true = Allowed or false = Not Allowed                             */
			IsEmailCustChgAllowed: function (statusIn) {
				return (statusIn == this.Revoked || statusIn == this.CallFail || statusIn == this.Requested || !statusIn)? true : false;
			}
    }
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_ContactValidateENOrdApprovSts - Global Contact Validate EBSCONET Order Approver Status Object
     *
     *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_ContactValidateENOrdApprovSts = {
			Approver: 'Approver',					//Approved  
		    NotApprover: 'Not Approver',			//Not Approver
		    CallFail: '4'							//Call Fail - value must match LC2_ContactENOrdApprovSts.CallFail
    }
	
	 /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SAO_API_Endpoints 
     * 
     *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_SAO_API_Endpoints = {
			production: {
				 url: "https://ebsconet.com/databases/validation/validatecustomer"				
			},
			test: {
				 url: "https://demo.ebsconet.com/databases/validation/validatecustomer"
			}
    }
	
	 /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SAO_API_Keys 
     * 
     *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_SAO_API_Keys = {
			production: {
				 key: "4d2510b5314a486a8e59e5a4627ea11c"
			},
			test: {
				 key: "4d2510b5314a486a8e59e5a4627ea11c"
			}
    }
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_ContactOpCat - Global Contact Operational Category Object 
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_ContactOpCat = {
		    	ECM:			'1',	// ECM Contact
		    	Marc:			'5',	// Marc Contact
		    	WOLCE:			'9',	// WOLCE Contact
		    	FlipRenew:		'11',	// Flipster Renewal Contact
		    	MISBO:			'26',	// MISBO Contact
		    	Advisory:		'6',	// Advisory Board Member
		    	EnetApprover:	'29'	// EBSCONET Order Approver
		};
    
	
/* Pat added here as one block for ACS hover over 6.23.2020
 */

    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_YbpProfiles
     *
     *---------------------------------------------------------------------------------------------------------------------------*/  
	LC2_YbpProfiles = {
		YBPGOBI: '20',							//YBP GOBI 
		YBPLTS: '21',							//YBP LTS
		YBPOMG: '18',							//YBP OMG
		YBPSup: '17',							//YBP Support 
		YBPSupFrench: '26',						//YBP Support French
		YBPSupGerman: '22',						//YBP Support German
		YBPSupItalian: '23',					//YBP Support Italian
		YBPSupItalianSpanish: '24',				//YBP Support Italian-Spanish
		YBPSupSpanishPortuguese: '25',			//YBP Support Spanish-Portuguese
		//	US1166718
		isYBPProfile: function(profileIn){
			for (var key in this){
				if (this[key] == profileIn){
					return true;
				}
			}
			return false;
		}
	}
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_cleanMessage
     * Takes in a messsage from either a message record or on the case record reply section and strips off HTML tags
     *---------------------------------------------------------------------------------------------------------------------------*/  
	function LC2_cleanMessage(message, source) {
		var cleanMessage = message;
		cleanMessage = cleanMessage.replace(/<style([\s\S]*?)<\/style>/gi, '')
		cleanMessage = cleanMessage.replace(/<script([\s\S]*?)<\/script>/gi, '');

		if (source == 'message') {
			// For Gmail messages, also need to replace <div> as they nest divs
			var gmailCheck = cleanMessage.match(new RegExp('<div dir="ltr">' + "(.|\n|\r)*?" + '<div>'));
			log.debug('gmailcheck', gmailCheck);
			if (gmailCheck != null) {
				cleanMessage = cleanMessage.replace(/<div>/ig, '\n');
			}
		}
		cleanMessage = cleanMessage.replace(/<li>/ig, '  *  ');
		cleanMessage = cleanMessage.replace(/<\/li>/ig, '\n');
		cleanMessage = cleanMessage.replace(/<\/ul>/ig, '\n');
		cleanMessage = cleanMessage.replace(/<\/ol>/ig, '\n');
		cleanMessage = cleanMessage.replace(/<\/div>/ig, '\n');
		cleanMessage = cleanMessage.replace(/<\/h\d>/g, "\n");
		cleanMessage = cleanMessage.replace(/<\/p>/ig, '\n');
		cleanMessage = cleanMessage.replace(/<\/td>/ig, "\t");
		cleanMessage = cleanMessage.replace(/<\/th>/ig, "\t");
		cleanMessage = cleanMessage.replace(/<\/tr>/ig, "\n");
		cleanMessage = cleanMessage.replace(/<\/table>/ig, "\n");
		cleanMessage = cleanMessage.replace(/<br\s*[\/]?>/gi, "\n");
		cleanMessage = cleanMessage.replace(/<hr\s*[\/]?>/gi, "\n\n");
		cleanMessage = cleanMessage.replace(/<[^>]+>/ig, '');

		// Limit to 3000 Characters due to text area limit of 4000 characters
		if (cleanMessage.length > 3000) 
		{
			cleanMessage = cleanMessage.slice(0, 3000);
		}	
		return cleanMessage;
	}

/* block ended for hover over work */

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_AlertEmail - Global Alert Email Object 
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_Email = {
		    	CRMEscalation:			'CRMEscalation@ebsco.com',	// CRM Escalation
		    	ENETAutoUsr:			'ebsconetsupport@ebsco.com' // EBSCONET Automated User email used for notifications
		}
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_SavedSearch - Global Saved Search Object 
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SavedSearch = {
		    	ENOA_InProg:	'customsearch_contact_enet_approv_inprog',	// ID: 55442, Used by Scheduled2_SAO_Status_Upd.js
		    	Last_msg: 'customsearch_get_last_msgid_2',	// ID: 57219, Used by UserEvent2_case_after_submit.js & Scheduled2_case_reopen_enetauto.js
		    	ENet_reopen: 'customsearch_enet_auto_reopened', 	// ID: 57231, Used by Scheduled2_case_reopen_enetauto.js
		    	eC_mssg_added:	'customsearch_econnect_messages_added2',		// ID: xxxx, Used by Scheduled2_messg_added_email.js  US515868
		    	eC_mssg_count:	'customsearch_mssg_count',  // ID: xxxx, Used by Scheduled2_messg_added_email.js  US515868
		    	cxp_hide_handled:  'customsearch_cxp_case_notify_handled', // ID: 58702 Used by Scheduled2_cxpNotify_casesHide.js
		    	cxp_hide_createNew: 'customsearch_cxp_case_notify_createnew',  //  ID: 58703 Used by Scheduled2_cxpNotify_casesHide.js
		    	custFolio_accessSite: 'customsearch_folio_access_sites_notset', // ID: xxxxx Used by Scheduled2_customer_folioSet.js
		    	custFolio_purchasing: 'customsearch_folio_purchase_sites',  // ID: xxxxx Used by Scheduled2_customer_folioSet.js
		    	RevokeFolioCustAccess: 'customsearch_revokefoliocustomeraccess',  // TA714097 Revoke/Approve FOLIO Customer Access
		    	ApproveFolioCustAccess: 'customsearch_approvefoliocustomeraccess',  // TA714097 Revoke/Approve FOLIO Customer Access
		    	findCloudExtendTasks:	'customsearch_ce_tasks_need_ceflag', // US1010709 Auto-default data for Tasks created through CloudExtend
				SubsCallPline:	'customsearch_nsacs_callprodline', // TA872986 Refactor client2_task_sales.js - uses this search
				RevokeFolioHostedByEBSCO:	'customsearch_revokefoliohostedbyebsco_co', // US1240633
				ApproveFolioHostedByEBSCO:	'customsearch_approve_fohostedbyebsco_co', // US1240633
				custFolioHosted_accessSite:	'customsearch_folio_host_acc_sites_notset', // US1240270
				custFolioHosted_purchasing:	'customsearch_folio_host_purchsite_notset' // US1240270

		};
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Profiles Object LC2_Profiles
	* 
	* Functions: 	IsProfileSSEUK
	* 				IsProfileYBPCustSupport
	* 				IsProfileDDESupport
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_Profiles = {
	    DDESupportDefault: 1,
	    DDEKOR: 13,
	    DDESimpCHN: 15,
	    DDETradCHN: 11,     	
		DDEJapanese: 12,  //  new profile in use as of June 2024
	    DDELatam: 31,	// US684171
	    DDEBrazil:	30,	// US684171
		EISAccess:  32, // US820968
	    EISContentLic: 27,
	    EISProdMan: 3,
	    EISUserServ: 19,
	    FOLIOSupport: 29,
	    SSEAU: 9,
	    SSEGerman: 16,
	    SSEUKEng: 2,
	    SSEUKEngSwed: 8,
	    SSEUKFin: 5, 
	    SSEUKNorw: 6,
	    SSEUKSwed: 4,
	    SSEUKSwedFin: 7,
	    SSEUKAfricaans: 10,
		YBPSupport: 17,
		YBPSupportFR: 26,
		YBPSupportGerman: 22,
		YBPSupportIT: 23,
		YBPSupportITES: 24,
		YBPSupportESPT: 25,
	    YBPOMG: 18,
	    YBPGOBI: 20,
	    YBPLTS: 21,
	    AccPay: 28,
	    /*Function   : IsProfileSSEUK(profileIn)
	    * Description: Determines whether profile passed in is one of the SSE UK profiles
	    * Input      : profileIn = profile internal Id
	    * Returns    : true = one of SSEUK Profiles or false = other                             */
	    IsProfileSSEUK: function (profileIn) { 
	    	return (profileIn == this.SSEUKEng || profileIn == this.SSEUKEngSwed || profileIn == this.SSEUKFin ||
	    			profileIn == this.SSEUKNorw || profileIn == this.SSEUKSwed || profileIn == this.SSEUKSwedFin) ? true : false;
	    },
	    /*Function   : IsProfileYBPCustSupport(profileIn)
	     * Description: Determines whether profile passed in is one of the YBP Customer Support profiles (but not eContent/OMG/LTS/GOBI)
	     * Input      : profileIn = profile internal Id
	     * Returns    : true = YBP Customer Support profile or false = other                             */
	    IsProfileYBPCustSupport: function (profileIn) { 
	        return (profileIn == this.YBPSupport || profileIn == this.YBPSupportFR || profileIn == this.YBPSupportGerman ||
	        		profileIn == this.YBPSupportIT || profileIn == this.YBPSupportITES || profileIn == this.YBPSupportESPT) ? true : false;
	    },
	    /*Function   : IsProfileDDESupport(profileIn)
	     * Description: Determines whether profile passed in is one of the DDE Customer Support profiles (but not ContentLic/ProdMan/UserServ)
	     * Input      : profileIn = profile internal Id
	     * Returns    profileIn = profile internal Id                          */
	    IsProfileDDESupport: function (profileIn) { 
	        return (profileIn == this.DDESupportDefault || profileIn == this.DDEKOR || profileIn == this.DDESimpCHN ||
	        		profileIn == this.DDETradCHN || profileIn == this.DDELatam || profileIn == this.DDEBrazil) ? true : false;
	    },
	    /*Function:		IsProfileDDELatAmBrazilSupport(profileIn)  // US684171
	     * Description:	Determines whether profile passed in is DDE Latin American Support or DDE Brazil Support
	     * Input:		profileIn = profile internal Id	
	     * Returns    : true if DDE Latin American Support or Brazil Support or false if other */
	    IsProfileDDELatAmBrazilSupport: function (profileIn) {
	    	return (profileIn == this.DDELatam || profileIn == this.DDEBrazil) ? true : false;
	    },
	    /*Function:		isProfileCaseAttachDel(profileIn)  // US725157
	     * Description:	Determines whether profile passed in can delete case attachments (via Suitelet utility)
	     * Input:		profileIn = profile internal Id	
	     * Returns    : true if allowed to delete or false if other */
	    isProfileCaseAttachDel: function (profileIn) {
	    	return (profileIn == this.AccPay) ? true : false;
	    }
	};
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Case Origin Object LC2_CaseOrigin
	* 
	*---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_CaseOrigin = {
    	    Web: '-5',						// Web
    	    Email: '1',						// Email	
    	    Phone: '2',						// Phone
    	    Internal: '4',					// Internal	
    	    IntSysAnlyst: '5',				// Internal System Analyst Form	(TA769368 - inactivated 11/10/22)
    	    CasePortal: '6',				// Case Portal - Celigo (TA769368 - renamed in NetCRM 11/10/22)
    	    EBSCOconnect: '7',				// EBSCO Connect
    	    ECadminBOT: '8',				// ECadminBOT (TA463177)
    	    ChatFAQ: '9',					// Chat - FAQ
    	    ChatLive: '10'					// Chat Live
        };
    
    /*--------------------------------------------------------------------------------------------------------------------------
    * Global Case Status Object LC2_CaseStatus
    *
    *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_CaseStatus = {
        NotStarted: '1',				//Not Started
        InProgress: '2',				//In Progress
        Escalated: '3',					//Escalated
        ReOpened: '4',					//Re-opened
        Closed: '5',					//Closed
        AwaitReply: '6',				//Awaiting Reply
        ClosedDupe: '7',		   		//Closed - Duplicate/No Action
        OnHold: '8',					//On Hold 
        ToReview: '9',					//To Review
        ClosedUnresp: '11',				//Closed - Unresponsive
        /*	Function: isClosedStage(statusIn)	US943094 TA721560
         * 	Description: Determines whether a case is closed or not
         * 	Input:	statusIn = Case Status
         * 	Returns: True if closed, False if not 
         * */
        isClosedStage: function (statusIn) {
        	return (statusIn == this.Closed || statusIn == this.ClosedUnresp || statusIn == this.ClosedDupe) ? true:false;
        }
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
    * Global Departments Object LC2_Departments
    *
    *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Departments = {
    	CorpIT: '88',							//Corp IT
    		UserServices: '89',					//User Services
    	CRMWebServ: '6',						//CRM Web Services
    	EISDDE: '102',							//EIS DDE
    		AccOrdMan: '13',					//Accounting & Order Management
    		ContLicStratP: '70',				//Content Licensing & Strategic P(lanning)
    		ContMngmt: '91',					//Content Management
    		CustSat: '1',						//Customer Satisfaction
    			CustSucc: '5',					//Customer Success (Training)
				ClinicalDecSupport: '106',		//Clinical Decisions Support - US856610 (used to be called EBSCOHealth for "EBSCO Health Global Prof. Svs.")
    			GlobalCustSupDDE: '2',			//Global Customer Support (DDE)
    				FarEastSupDDE: '95',		//Far East Support (DDE)
    			GlobalSoftwareServ: '71', 		//Global Software Services
    				DiscoverySolnCoord: '78',	//Discovery Solutions Coordinator
    			DDEOps: '4',					//Operations
    			SaaSOps:'84',					//SaaS Operations 
    		TechOther: '39',					//Technology Other
    		AccPay:	'112',						//Accounts Payable
    	EISHR: '108',							//EIS Human Resources
    	EISSSDOps: '103',						//EIS SSD Operations
    		BHamAR: '104',						//B'ham Accounts Receivable
    		SSDOpsOther: '73',					//Operations Other
    		PubServ: '76',						//Publisher Services Worldwide
    		SSESupportAUNZ: '86',				//SSE Support - AU/NZ 
    		SSESupportGermany: '94',			//SSE Support - Germany
    		SSESupportUKSA: '82',				//SSE Support - UK/SA
    	OPF: '46',								//Operations & Finance Systems
    		CRMSystems: '53',					//CRM Systems
    		DevOPF: '46',						//Development - OPS & Finance
    	ProdMngmt: '107',						//Product Mngmt/Business Dev
    		Access:  '113',						//Accessibility US820968
    		MedProdMngmt: '52',					//Medical Product Management
    		Novelist: '26',						//Novelist
    		ProdMngmtOther: '12',				//Product Mngmt Other
    		ProdSysGrp: '81',					//Product Systems Group
    	Sales: '7',								//Sales Group
    		Mktg: '18',							//Marketing
    	YBP: '92',								//YBP
        	YBPCustomerService: '97',			//Customer Service - YBP
        	YBPEContent: '96',					//eContent - YBP
            YBPGOBI: '101',						//GOBI - YBP 
            YBPLTS: '105',						//LTS - YBP
            YBPOMG: '100',						//OMG - YBP
            YBPSales: '93',						//Sales - YBP (CDM)
            /*Function   : IsDeptDDEGlobalCustSat(deptIn)
             * Description: Determines whether department passed in is one of the Global Customer Support DDE Departments
             * Input      : deptIn = department internal Id
             * Returns    : true = Global Customer Support DDE Department or false = other                             */
            IsDeptDDEGlobalCustSat: function (deptIn) { 
            	return (deptIn == this.GlobalCustSupDDE || deptIn == this.FarEastSupDDE) ? true : false;
            },
            /*Function   : IsDeptSSDSupport(deptIn)
             * Description: Determines whether department passed in is one of the SSD Customer Support Departments
             * Input      : deptIn = department internal Id
             * Returns    : true = SSD Support Department or false = other                             */
            IsDeptSSDSupport: function (deptIn) { 
            	return (deptIn == this.SSESupportAUNZ || deptIn == this.SSESupportGermany || deptIn == this.SSESupportUKSA) ? true : false;
            },
            /*Function   : IsDeptYBPSupport(deptIn)
             * Description: Determines whether department passed in is one of the YBP Support Departments
             * Input      : deptIn = department internal Id
             * Returns    : true = YBP Support Department or false = other                             */
            IsDeptYBPSupport: function (deptIn) { 
                return (deptIn == this.YBPCustomerService || deptIn == this.YBPEContent || deptIn == this.YBPGOBI ||
                		deptIn == this.YBPLTS || deptIn == this.YBPOMG) ? true : false;
            }
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Case DDE Area of Support Object LC2_CaseDDEAreaSupport
     *
     *---------------------------------------------------------------------------------------------------------------------------*/

    var LC2_CaseDDEAreaSupport = {
            ForwardToSSE: 342
        };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Case DDE Product Object LC2_CaseDDEProd
     *
     *---------------------------------------------------------------------------------------------------------------------------*/

    var LC2_CaseDDEProd = {
    		EbscoNet: 19
        };
        
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Case Occupation Object LC2_CaseOccupation
     *
     *---------------------------------------------------------------------------------------------------------------------------*/

    var LC2_CaseOccupation = {
    		Admin: 			41,				// Administration
    		Author: 		23,				// Author
    		ConsortiaHD: 	33,				// Consortia Help Desk
    		CorpUsr:		8,				// Corporate User
    		EbscoEmp:		40,				// EBSCO Employee
    		Editor:			24,				// Editor
    		Faculty:		32,				// Faculty
    		IndividSub:		42,				// Individual Subscriber
    		Librarian:		5,	    		// Librarian
    		MktgProf:		34,				// Marketing Professional
    		MedLibrn:		29,				// Medical Librarian
    		MedProf:		9,				// Medical Professional
    		Nurse:			30,				// Nurse
    		Patron:			2,				// Patron
    		Student:		3,	    		// Student
    		TechCont:		11,				// Technical Contact
    		WebDesign:		10				// Web designer
        };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Case Request Type Object LC2_CaseReqTyp
     *
     *---------------------------------------------------------------------------------------------------------------------------*/

    var LC2_CaseReqTyp = {
    		Support: 	8,		// Support Case
    		Enhance: 	3,		// Enhancement
    		ServIss: 	2		// Service Issue	
        };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Case Level of Effort Object LC2_CaseLevelEffort
     *
     *---------------------------------------------------------------------------------------------------------------------------*/

    var LC2_CaseLevelEffort = {
    		XSmall:		4,		// 1-X-Small
    		Small:		1,		// 2-Small
    		Medium:		2,		// 3-Medium
    		Large:		3,		// 4-Large
    		XLarge:		5,		// 5-XLarge
    		XXLarge:	6		// 6-XXLarge
        };
    
    /*--------------------------------------------------------------------------------------------------------------------------
    * Global Form Object LC2_Form
    * -- forms should be added as required 
    *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Form = {
    	//Case Forms 
    	SalesGen		:  	'67',		//EIS Sales General Case Form
    	SalesTitleComp	:	'73',		//EIS Sales Title Comparison Case Form
    	UserServ		:	'82',		//EIS User Services Case Form (F24082)
    	ContLic			:	'105',		//Content Licensing Case Form (F24082)
        CustSatMerged	: 	'147',		//EBSCO CustSat Merged Case Form
        DSCase			:	'96',		//DS Case Form    
        YBPMerged		:	'195',		//YBP CS/EC/GOBI/LTS Case Form (F24082)
        YBPOMG			:	'201',		//YBP OMG Case Form (F24082)
        GobiEBA			:	'302',		//GOBI EBA Case Form (F24082) 
        LSDPricing      :   '74',       //EIS Sales LSD Pricing Case Form
        EbookCustom     :   '91',       //EIS Sales eBook/aBook Custom Collection
        EbookGeneral    :   '98',       //EIS Sales eBook/aBook General Case Form
        SalesLearning   :   '189',      //EIS Sales Learning Express Case Form
        DSC_Case		:	'95',		//DS Coordinator Case Form
        WebCase			:	'83',		//EP Web Services Case Form
        Panorama		:	'327',		//EIS Sales Panorama Pricing Case Form
        Access			:	'330',		//EIS Accessibility Case Form / US820968
        OpenAthensPCF	:	'334',		//EIS Sales OpenAthens Pricing Case Form / US1044395
		StacksPricing	:	'341',		//EIS Sales Stacks Pricing Case form / US1094216 added 1/16/24
		OpenRSPricing	:	'343',		//EIS Sales OpenRS Pricing Case Form / PROD id / US1236099
        //Task Forms
        EPCustomTask	:	'14',		//EP Custom Task Form
        CustTrainReqTask	:	'68',		//EP Customer Training Request Form
        WebTask			:	'75',		//EP Task Form (Web Services)
        TrainReportTask	:	'99',		//EP Training Report
        WebServicesCase	:	'83', 		//EP WebServices Case Form
		EISSalesTask: '315',			//	EIS Sales Task Form
		EISToDoTask: '114',				//	EIS To Do Task Form
		EISASMTask: '158',				//	EIS ASM Task Form
        //Contact Forms
        EisContact		:	'5',		//EIS Contact Form
        PubSatContact	:	'106',		//EIS PubSat Contact Form
        WebContact		:	'53',		//EIS Contact Form (WebServices)
        //Opportunity Forms
		eBookQuoteTool	:	'130',		//US1277421 - eBook Quote Tool Oppy form
        MarketingLead	:	'5',		//EIS MLO Form
        ProductTarget	:	'150',		//Product Target (Sales)
        //Customer Forms
        WebCustomer		:	'54',		//EP Customer Form (Web Service)
        CloudExtTask	:	'333',		//CloudExtend Task Form (US1010709)
		EbSurveyRslts	:	'322',		// US1168294 EBSCO DDE Case Survey
		GoSurveyRslts	:	'337',		// US1168294 GOBI Case Survey
		FolSurveyRslts	:	'342',		// US1196828 FOLIO Case Survey (regular form, not the online form)

        IsSalesCase: function (customForm) { 
            return (customForm == this.SalesGen || customForm == this.SalesTitleComp || customForm == this.LSDPricing || 
    				customForm == this.EbookCustom || customForm == this.EbookGeneral || customForm == this.SalesLearning)? true : false;
        }
    };

 
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Email Template Object LC2_Eml_Tmplt
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Eml_Tmplt = {
    		EnetAutoCase:			3789,		// EBSCONET Automated User Assigned Cases - notification
    		eC_mssg_added_tmplt:	3803		// US515868 EBSCO Connect Message Added Assignee Alert - notification template
        };

    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global Max File Size Object LC2_MaxFileSize
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_MaxFileSize = {
    		Total_20MB: 	20971520,		// 20MB in bytes
    		Individ_10MB: 	10485760		// 10MB in bytes
        };

    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_TrainingStatus 
     *	for custom list: customlist_customer_engagement_status
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_TrainingStatus = {
    		NotStarted:			1,
    		TrainingOffered:	2,
    		TrainingScheduled:	3,
    		Cancelled:			4,
    		Completed:			5,
    		NoResponse:			6,
    		Declined:			7,
    		InProgress:			8,
		    /*Function:		realStatusInProgress(trainingStatusIn)  
		     * Description:	Determines whether Customer Training Status passed in warrants changing the true Task Status to In Progress
		     * Input:		trainingStatusIn = Customer Training Status internal ID	
		     * Returns    : true if warrants updating true Task status to 'In Progress' or false if not */
            realStatusInProgress: function (trainingStatusIn) { 
                return (trainingStatusIn == this.TrainingOffered || trainingStatusIn == this.TrainingScheduled ||
                trainingStatusIn == this.InProgress)? true : false;
            }, 
		    /*Function:		realStatusComplete(trainingStatusIn)  
		     * Description:	Determines whether Customer Training Status passed in warrants changing the true Task Status to Complete
		     * Input:		trainingStatusIn = Customer Training Status internal ID	
		     * Returns    : true if warrants updating true Task status to 'Complete' or false if not */
		    realStatusComplete: function (trainingStatusIn) { 
		        return (trainingStatusIn == this.Cancelled || trainingStatusIn == this.Completed || trainingStatusIn == this.NoResponse ||
		        trainingStatusIn == this.Declined)? true : false;
		    },
		    /*Function:		realStatusNotStarted(trainingStatusIn)  
		     * Description:	Determines whether Customer Training Status passed in warrants changing the true Task Status to Not Started
		     * Input:		trainingStatusIn = Customer Training Status internal ID	
		     * Returns    : true if warrants updating true Task status to 'Not Started' or false if not */
            realStatusNotStarted: function (trainingStatusIn) { 
                return (trainingStatusIn == this.NotStarted)? true : false;
            }           
    };

    
    /*--------------------------------------------------------------------------------------------------------------------------
     * Global LC2_TaskStatus
     *	Standard Task Status values
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_TaskStatus = {
    	NotStarted:		'NOTSTART',
    	InProgress:		'PROGRESS',
    	Completed:		'COMPLETE'
    };
    
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_trainingReportType  
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_trainingReportType = {
    	Training:			1,
    	CustInteraction:	2
    };	
 
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_trainingSessionHours  
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_trainingSessionHours = {
    	greaterThan6:			25
    };    
    
    
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SIstatus
     *	for custom list: customlist15
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_SIstatus = {
    		NotStarted:			2,
    		InfoNeeded:			3,
    		Deferred:			5,
    		Resolved:			7,
    		InProgress:			8,
    		Scheduled:			9,
    		ClosedUnresolved:	11,
    		AssignToTriage:		13,
    		PMreview:			14,   		
		    /*Function   : IsClosed(si_statusIn)
			    * Description: Determines whether si_status passed in is closed
			    * Input      : si_statusIn = si_status internal Id
			    * Returns    : true or false */
			IsClosed: function (si_statusIn) { 
			    	return (si_statusIn == this.ClosedUnresolved || si_statusIn == this.Resolved) ? true : false;
			    }		
    	};
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SIissueType
     *	for custom list: customrecord20
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_SIissueType = {
    		SrvsAvailDef:		2,
    		SoftwareEnh:		4,
    		Duplicate:			5,
    		SaasQA:				8,
    		ContentChangeRqt:	9,
    		SoftwareDef:		11,
    		NoError:			12,
    		Documentation:		14,
    		ContentProbRpt:		15,
    		PostReleaseIR:		16,
    		OperationalRqt:		23
    	};
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Transition_Show - Indicates whether to display Transition fields for each transition type
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Transition_Show = {
    		EDS: 	true,		// EDS Transition fields 
    		eHost: 	false,		// eHost Transition fields
    		Explora: false,		// Explora Transition fields
    		RefCtr: false		// Reference Center Transition fields
        };
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Transition_sts - Status list used for EDS/eHost/Explora/Ref Center Transitions
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Transition_sts = {
    		NotStart: 	1,		// Not Started 
    		InProg: 	2,		// In Progress
    		Complete:	3		// Complete
         };
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Transition_typ - Transition Type
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Transition_typ = {
    		EDS: 	'1',		// EDS Transition 
    		eHost: 	'2',		// eHost Transition
    		Explora:'3',		// Explora Transition
    		RefCtr: '4'			// Reference Center Transition
         };
    
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_pan_data_sources - Panorama Pricing case form - Pan Data Sources field values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_pan_data_sources = {
    		Authentication: 	 3,		 
    		Counter: 			 2,
    		ILS:				 1,
    		StudentInfoSystem:   4
        };
  
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_yes_no_only - Yes No Only field values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_yes_no_only = {
    		Yes:	1,
    		No:		2
    	};
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_tab - Internal Id of Tab/sub-tab
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_tab = {
    		entityTransition:	305   // Transition sub-tab defined for Entity type records (Customer/Contact etc)
    	};

    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_caseAttachDelSuitelet - Case attachment delete suitelet info. (Suitelet2_case_deleteAttachment.js)
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_caseAttachDelSuitelet = {
    		scriptId:	'customscript_suitelet2_case_del_attach',   	// Script record Id
    		deployId:	'customdeploy_suitelet2_case_del_attach',		// Deployment Id 
    		functionId: 'redirectToCaseAttachDelSuitelet',				// Related Client Function
    		functionScriptFileId: 94523063  // Internal ID of related Client Script (Client2_record_case.js Id in the file cabinet)
    	};    	

    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_schedScriptRunTime - Internal ID of a Scheduled Script Runtime record
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_schedScriptRunTime = {
    		eCmssgAddedtoCase:  '6'		// Used in Scheduled2_mssg_added_email.js - 
    }; 

        
    
	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_AUTH_API_Endpoints 
     * 		For DocuSign: Endpoints for the Authorization Grant request (the pre-request to get Access Token for true DocuSign request)
    *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_AUTH_API_Endpoints = {
			production: {
				 url: "https://account.docusign.com/oauth/token"				
			},
			test: {
				 url: "https://account-d.docusign.com/oauth/token"
			}
    }    

	
	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_CLM_API_Endpoints 
     *    	For DocuSign: Endpoints for the CLM DocLauncher Task request
    *---------------------------------------------------------------------------------------------------------------------------*/    
	LC2_CLM_API_Endpoints = {
			production: {
				 url: "https://apina11.springcm.com/v2/35528e3d-0397-4640-a4fa-e886de353fcb/doclaunchertasks"				 
			},
			test: {
				 url: "https://apiuatna11.springcm.com/v2/601c1d97-f09a-435c-93f3-660de08be1eb/doclaunchertasks"
			}
    }


	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_DocSign_CLM_Body
     * 		For DocuSign: Stores information for the DocLauncher Task CLM API Call to DocuSign
     * 			-- ds_account_id:		ID given to us by Spaulding Ridge partners representing our Account
     * 			-- folder_id:  			ID given to us by Spaulding Ridge partners representing the Folder where the documents are stored
     * 			-- docgen_config_id:	ID given to us by Spaulding Ridge partners representing a configuration key
    *---------------------------------------------------------------------------------------------------------------------------*/
	LC2_DocSign_CLM_Body = {
			ds_account_id_test: '601c1d97-f09a-435c-93f3-660de08be1eb',
			ds_account_id:		'35528e3d-0397-4640-a4fa-e886de353fcb',
			folder_id_test: 	'7ace4299-9a9c-eb11-b818-48df378a7098',
			folder_id: 			'f8347d96-0ad8-eb11-9c3f-b4b52f39b0f9',
			docgen_config_id_test: '85600531-301c-428f-8957-57528ba9d19a',
			docgen_config_id:	'ed6f8af0-8546-4b0b-a766-c27cbcb048f4'
	}

	
	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Integration_Token
     * 		Stores the record ID for each custom Integration Token - created as a custom record
    *---------------------------------------------------------------------------------------------------------------------------*/
	LC2_Integration_Token = {
			DocSign_refresh_token: '1'
	}
	
	
	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_DocSign_AuthKey
     * 		For DocuSign: Stores Authorization Key for the Auth Code Request
    *---------------------------------------------------------------------------------------------------------------------------*/
	LC2_DocSign_AuthKey = {
			base64Key_test: 'Basic NTRhMTYyMjgtMzI0Yi00MWVkLTlmMjctMmMzMzNhYjlhNmFlOmU1ZjBjYzY2LTU3YTAtNDQwYS05NjZjLTUzOWFkNmI2ZmEzNw==',
			base64Key:		'Basic NTRhMTYyMjgtMzI0Yi00MWVkLTlmMjctMmMzMzNhYjlhNmFlOjVkZDNjM2I4LTZhMGEtNDc3ZC05MDk5LWJiNWRmN2JiNjYzMg=='
	}


	
	/*--------------------------------------------------------------------------------------------------------------------------
     * LC2_DocSign_Client_FileID
     * 		Stores the File ID of the client Script which is associated to the DocuSign Suitelet.  The Client Script has simple
     * 		page_init functions which just takes the end user to the DocuSign URL.
    *---------------------------------------------------------------------------------------------------------------------------*/
	LC2_ClientScript_FileID = {
			TargetKeyAccount_client_file: '82725110'
	}
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Sales Force "Create New" constant (LC2_SF_createNew)
	* -- this variable holds "createNew" constant for use with sync to Sales Force & replicates SS1 constant 
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SF_createNew = 'createNew';
	
	/*--------------------------------------------------------------------------------------------------------------------------
	 * LC2_SfCaseDelSts - stores the SF Case Delete Status list values
	 * functions: none
	 *
	 *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SfCaseDelSts = {
			none:			'1',
			inProg:			'2',
			complete:		'3'
	};
	
	/*--------------------------------------------------------------------------------------------------------------------------
	 * LC2_CxpNsAct - stores the CXP NS Action list values
	 *
	 *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_CxpNsAct = {
			Case_del:			'1',
			Case_nonSfCust:		'2',
			Case_cNewCust:		'3',
			Case_othForm:		'5',
			Case_hide:			'6',
			
			/*Function:		delCaseAct(actIn)  
		     * Description:	Determines whether the Action relates to Case Deletion (excludes Case Hide)
		     * Input:		actIn = CXP NS to SF Notification Action	
		     * Returns    : true if relates to Case Deletion or false if not */
            delCaseAct: function (actIn) { 
                return (actIn == this.Case_del || actIn == this.Case_nonSfCust || actIn == this.Case_cNewCust || 
                		actIn == this.Case_othForm)? true : false;
            }          
	}

    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_ProdTarg_sts - Status list used for Product Target Oppy form
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_ProdTarg_sts = {
    		Dev: 			'1',	// Developed
    		Contacted:		'2',	// Contacted
    		Succ:			'3',	// Successful
    		Unsucc:  		'4',	// Unsuccessful
    		SendtoWinSeR:	'5',	// Send to WinSeR -- added for US892776	 
    		Sent:			'6',		// Sent to WinSeR -- added for US892776	
    		
			/*Function:		changeNotAllowed(ptstatusIn)  
			 * added for US892776
		     * Description:	Determines whether an Opportunities' Product Target Status should cause fields on the form
		     * 				(Product Target Status, Company, Item) to be disabled/never changed.  Used in Page Init client script
		     * Input:		ptstatusIn = the Product Target Status on the Opportunity	
		     * Returns    : true if specified fields should NOT be changed, false if specified fields CAN be changed */
    		changeNotAllowed: function (ptstatusIn) { 
                return (ptstatusIn == this.Succ || ptstatusIn == this.SendtoWinSeR || ptstatusIn == this.Sent)? true : false;
            }	
         };

	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Oppy_sts - Opportunity Status field values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Oppy_sts = {
    		GenOnlineLeads: 		'24',	// General Online Leads
    		QualCollectAnalysis:	'7',	// 1-Qualifying/Collection Analysis
    		Dev:					'18',	// 2-Develop
    		Prop:  					'10',	// 3-Proposal
    		Renew:					'15', 	// 4-Renewal
    		VerbalAgmt: 			'25', 	// 5-Verbal Agreement
    		ClosedLost:				'22', 	// 7-Closed - Lost
    		ClosedWon:				'26' 	// 6-Closed - Won
         };


    /*--------------------------------------------------------------------------------------------------------------------------
    * LC2_OppyItemStatus - Opportunity Item Status values
    *
    *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_OppyItemStatus = {
            Mktg: '1',			//01-Mktg - MLO header, matches to 1-Qualify/Collection Analysis
            Dev: '2',			//02-Dvlp - MLO header, matches to 2-Develop
            Quote: '3',			//03-Qte - MLO header, matches to 3-Proposal
            Renewal: '4',		//04-Renewal - MLO header, matches to 4-Renewal
            PofVrb: '5',		//06-POF/VRB  - MLO header, matches to 5-Verbal Agreement
            Lost: '6',			//10-Lost - MLO header, matches to 7-Closed - Lost
            Won: '7',		   	//09-Won - MLO header, matches to 6-Closed - Won
            NoVolNoBid: '8',	//00-No volume/No Bid - MLO header, does not match to anything
            POFIn: '9',		   	//08-PLFln - MLO header, matches to 5-Verbal Agreement
            Ngtn: '10',		   	//04-Ngtn - MLO header, matches to 3-Proposal
            POFOut: '11'		//07-POFOut - MLO header, matches to 5-Verbal Agreement
        };


    /*--------------------------------------------------------------------------------------------------------------------------
    * LC2_RFPStatus - RFP Status values
    *
    *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_RFPStatus = {
        	InProgress: '1',			//RFP in Progress
        	DecisionPending: '2',		//Decision Pending
        	Won: '3',					//Won
        	Lost: '4',					//Lost
        	NoAward: '6',				//No award made as a result of this effort
        	NoBid: '7',					//No Bid
        	WonPartial: '8'			   	//Won Partial
        };


    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_OppyFormType - Opportunity Form Type values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_OppyFormType = {
    		WSR: 		'1',	// WSR
    		Flipster:	'2',	// Flipster
    		SubscRenew:	'3',	// Subscriptions Renewal
    		WinSer:  	'4',	// WinSer
    		MktgLead:	'5', 	// Marketing Lead
    		ebookQuote: '6', 	// eBook Quote
    		GobiSSD:	'7', 	// GOBI/SSD
    		RFP:		'8', 	// RFP
    		ProdTarg:	'9'		// Product Target
         };


    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Customer - customers
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Customer = {
		AnonDDESupport: '277026',		//ns000102 Anonymous Customer (DDE Support)
	    AnonContLic: '1711240',			//ns268703 Anonymous Content Licensing Customer
	    AnonSSEUK: '1489915',			//ns245028 Anonymous SSE (UK) Customer
	    AnonSSEAU: '1503909',			//ns247436 Anonymous Customer (AU SSE Support)
	    AnonSSEGerman: '1559097',		//ns255028 Anonymous German SSE Support Customer
	    AnonEISProdSys: '461564',		//ns020722 EIS Product Systems Group
	    AnonYBPSupport: '1582962',		//ns256597 Anonymous YBP Support Customer
	    AnonYBPGOBI: '1627247',			//ns261790 Anonymous YBP GOBI Customer
	    AnonYBPLTS: '1638446',			//ns263090 Anonymous YBP LTS
	    AnonYBPOMG: '1619682',			//ns260656 Anonymous YBP OMG Customer
	    Anon_AP:	'27108605',			//ns289746 EIS Accounts Payable Anonymous Customer
	    EbscoMktgLeads: '1387019',		//ns231089 EBSCO Marketing Leads
    	EC_EBSCO_EIS: '26951008',		//ns288673 EBSCO - EIS	//US961740
    	Anonymous:	'277026',			//ns000102 Anonymous Customer (DDE Support)
    	/*Function   : IsCustEBSCOSFPush(custIn)     //US961740 Added function
         * Description: Determines whether Customer passed in is one where Contacts with EBSCO domain emails can be sent to SF 
         * 				& invited to EBSCO Connect
         * Input      : custIn = Customer internal Id
         * Returns    : true = EBSCO domain Customer or false = other                             */
        IsCustEBSCOSFPush: function (custIn) { 
            return (custIn == this.EC_EBSCO_EIS) ? true : false;
        },
        /*Function   : IsCustSSEAnon(custIn)
         * Description: Determines whether Customer passed in is one of the SSE Support Team's Anonymous Customers
         * Input      : custIn = Customer internal Id
         * Returns    : true = SSE Anonymous Customer or false = other                             */
        IsCustSSEAnon: function (custIn) { 
            return (custIn == this.AnonSSEUK || custIn == this.AnonSSEAU || custIn == this.AnonSSEGerman) ? true : false;
        },
        /*Function   : IsCustYBPAnon(custIn)
         * Description: Determines whether Customer passed in is one of the YBP/GOBI Support Team's Anonymous Customers
         * Input      : custIn = Customer internal Id
         * Returns    : true = YBP/GOBI Anonymous Customer or false = other                             */
        IsCustYBPAnon: function (custIn) { 
            return (custIn == this.AnonYBPSupport || custIn == this.AnonYBPGOBI || custIn == this.AnonYBPLTS ||
            		 custIn == this.AnonYBPOMG) ? true : false;
        }
    };
	
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SF_EcAccessLevels_sts - EBSCO Connect Access Level list values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_SF_EcAccessLevels_sts = {
    		Req: '1',		// Requested
    		NeedsRev: '2',	// Needs Review
    		Approved: '3',	// Approved
    		Inact: '4',		// Inactivated
    		Granted: '5',	// Granted
    		Denied: '6',	// Denied
    		Revoked: '7',	// Revoked
    		Removed: '8',	// Removed
    		/*Function   : IsValidUISelection(statusIn)
             * Description: Determines whether the status value can be set using NetCRM UI during Contact edit
             * Input      : statusIn = Status Value
             * Returns    : true = value can be set/chosen via UI or false = value entered via UI not allowed                             */
            IsValidUISelection: function (statusIn) { 
                return (statusIn == '' || statusIn == this.Approved || statusIn == this.Denied || statusIn == this.Revoked) ? true : false;
            }
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SF_EcAccessLevels_sts - EBSCO Connect Access Level list names
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    const LC2_SF_EcAccessNames_sts = [
    		"Requested",		
    		"Needs Review",	
    		"Approved",		
    		"Inactivated",	
    		"Granted",		
    		"Denied",		
    		"Revoked",		
    		"Removed"		
    ];
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Property_based_Access - SF EC Property Based Access Level list values
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Property_based_Access = {
    		Approved: '1',	// Approved
    		Granted: '2',	// Granted
    		Revoked: '3',	// Revoked
    		Inactive: '4',	// Inactivated
    		Removed: '5',   // Removed
    		/*Function   : IsValidUISelection(statusIn)
             * Description: Determines whether the status value can be set using NetCRM UI during Contact edit
             * Input      : statusIn = Status Value
             * Returns    : true = value can be set/chosen via UI or false = value entered via UI not allowed                             */
            IsValidUISelection: function (statusIn) { 
                return (statusIn == '' || statusIn == this.Approved || statusIn == this.Revoked) ? true : false;
            },
    };

    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SF_PortalUser_sts - EBSCO Connect Portal User statuses
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_SF_PortalUser_sts = {
    		SendInv: '1',	// Send Invitation
    		InvInProg: '2',	// Invitation in Progress
    		InvExpir: '3',	// Invitation Expired
    		UserAct: '4',	// User Active
    		UserInact: '5',	// User Inactive
    		RegInProg: '8'	// Registration in Progress
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_ENET_OrderApprove_sts - EBSCONET Order Approver Statuses
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_ENET_OrderApprove_sts = {
    		Approver: '1',			// Approver
    		InProg: '2',			// In Progress
    		Revoked: '3',			// Revoked
    		CallFailure: '4',		// Call Failure
    		Requested: '5',			// Requested
    		RevokeInProgress: '6',	// Revoke In Progress
    		RevokeRequested: '7' 	// Revoke Requested
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_EC_Contact_Access_Type - EC Contact Access Type
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_EC_Contact_Access_Type = {
    		SelfRegistered: '1', 	// Self-Registered
    		ECNSVerified: '2'		// EC NS Verified
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_SRPM_Conversion_Status - Self-Registered Portal Member Conversion Status
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_SRPM_Conversion_Status = {
    		Converted: '1'		// Converted
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Access_Type_Req - Access Type Requested (used on EBSCO Connect Access request cases) 
     *
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_Access_Type_Req = {
    	    Academy: {
    	    	id: '1', 
    	    	srpmFieldId: 'custrecord_academy_access_status', 
    	    	contactFieldId: 'custentity_sf_academy_access_status'},    // Academy
    	    CaseMgmt: {
    	    	id: '2', 
    	    	srpmFieldId: 'custrecord_case_mgmt_access_status', 
    	    	contactFieldId: 'custentity_sf_case_mngmt_access_status'},  // Case Management
    	    DiscussGrps: {
    	    	id: '3', 
    	    	srpmFieldId: 'custrecord_groups_access_status', 
    	    	contactFieldId: 'custentity_sf_groups_access_status'}       // Discussion Groups
    	};
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Access_Decision - Access Decision (used on EBSCO Connect Access request cases)
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Access_Decision = {
    		Approved: '1',
    		Denied: '2', 
    		PartialApprove: '3'		// Only Partially Approved
    };
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Form_subtabs - Internal IDs for Subtabs on the various forms 
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_Form_subtabs = {
			contact_ebscoConnect: 'custom288'
	};

	// US966180 Adding values for EC Case Type field & EC User Access Case Status Reason field
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_EC_Case_Type - EC Case Type
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_EC_Case_Type = {
    		EC_UA_Request: '1', 	// EC User Access Request
    		EC_SR_AccessIssue: '2'	// EC SR Access Issue
    };
		  
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Country - stores the hard-coded netSuite country code values (Note only includes values for code that has been added since using library constants file)
     *
     *---------------------------------------------------------------------------------------------------------------------------*/
    var LC2_Country = {
    		cuba:			'52',
    		iran:			'98',
    		syria:			'200',
    		afghanistan:	'1',
			russia:			'174',
            /*Function   : isSalesRestricted(countryIn)
             * Description: Determines whether EP Country passed in should be restricted from Sales
             * Input      : CountryIn = NetSuite ID of the Country
             * Returns    : true if the country is restricted, false if not    */
    		isSalesRestricted: function (countryIn) {
    			return (countryIn == this.cuba || countryIn == this.iran || countryIn == this.syria || countryIn == this.afghanistan || countryIn == this.russia) ? true : false;
    		}
    }
    
    var LC2_Segment = {
    		OneTwoYr: '22',	//1-2 Year
    	    FourYr:	'14',	//4 Year
    	    AmerEmbassy: '41',	//AMERICAN EMBASSY (US/CA)
    	    AssnBiomed: '47',	//ASSOCIATIONS - BIOMEDICAL
    	    AssnCorp: '46', 	//ASSOCIATIONS - CORPORATE
    	    CaFedGvt: '11',		//CANADIAN FEDERAL GOVERNMENT
    	    CaProvGvt:	'12',	//CANADIAN PROVINCIAL GOVERNMENT
    	    CatholicHS:	'13',	//CATHOLIC HIGH SCHOOL
    	    Corporate:	'10',	//CORPORATE
    	    CorpOther:	'51',	//CORPORATE - OTHER
    	    CorpHosp:	'44',	//CORPORATE HOSPITALS
    	    Distributor:	'15',	//DISTRIBUTOR
    	    Personnel:	'16',	//EBSCO Personnel-non client
    	    ElemSch:	'17',	//ELEMENTARY
    	    EPgift:	'67',	//EP Gift
    	    Military:	'58',	//FEDERAL GOVERNMENT - MILITARY (US/CA)
    	    GroupAcad:	'59',	//GROUP-ACADEMIC
    	    GroupGovt:	'62',	//GROUP-GOVERNMENT
    	    GroupMed:	'63',	//GROUP-MEDICAL
    	    GroupPL:	'61',	//GROUP-PUBLIC LIBRARY
    	    GroupSch:	'60',	//GROUP-SCHOOL
    	    HighSch:	'20',	//HIGH SCHOOL
    	    Individual:	'42',	//INDIVIDUAL
    	    IntlSch:	'21',	//INTERNATIONAL SCHOOL
    	    IntlFedGovt:	'38',	//INTL FEDERAL GOVERNMENT
    	    IntlStateGovt:	'39',	//INTL STATE GOVERNMENT
    	    MedColl:	'23',	//MEDICAL COLLEGES
    	    MedCorp:	'49',	//MEDICAL CORPORATE
    	    MedSrvs:	'64',	//MEDICAL SERVICES
    	    MedHosp:	'24',	//MEDICAL/HOSPITAL
    	    MiddleSch:	'25',	//MIDDLE/JR HIGH SCHOOL
    	    MilitaryMed:	'68',	//MILITARY MEDICAL (US/CA)
    	    MilitarySrvs:	'26',	//MILITARY SERVICE (US/CA)
    	    Misc:	'27',	//MISCELLANEOUS - NON CLIENT
    	    PrivateHS:	'29',	//PRIVATE HIGH SCHOOL
    	    PublicLib:	'30',	//PUBLIC LIBRARY
    	    Publisher:	'31',	//PUBLISHER
    	    SchDist:	'32',	//SCHOOL DISTRICT
    	    SchUnclassified:	'57',	//SCHOOL UNCLASSIFIED
    	    Specialty:	'70',	//SPECIALTY
    	    StateGovtCorp:	'65',	//STATE GOVERNMENT CORP (US/CA)
    	    SubsAgency:	'34',	//SUBSCRIPTION AGENCY
    	    UsFedGovt:	'18',	//US FEDERAL GOVERNMENT
    	    UsStateGovt:	'33',	//US STATE GOVERNMENT
    	    VetAdminHosp:	'36',	//VETERAN ADMINISTRATION HOSPITALS
    	    VocTechSch:	'37',	//VOC/TECH SCHOOL

    		/*Function   : IsGroupSegment(segmentIn)
    	     * Description: Determines whether Segment passed in is one of the "Group" segments
    	     * Input      : segmentIn = Segment Internal ID
    	     * Returns    : true = is Group Segment or false = is not Group Segment                             */
    	    IsGroupSegment: function (segmentIn) { 
    	        return (segmentIn == this.GroupAcad || 
    	        		segmentIn == this.GroupGovt || 
    	        		segmentIn == this.GroupMed || 
    	        		segmentIn == this.GroupPL || 
    	        		segmentIn == this.GroupSch)? true : false;
    	    }
    	};
    
    /*--------------------------------------------------------------------------------------------------------------------------
     * LC2_Currency - stores the hard-coded netSuite Currency Values.  This is the Custom Record called 'Currency'
     *---------------------------------------------------------------------------------------------------------------------------*/    
    var LC2_Currency = {
    		AusDollar:	'1',
    		CanDollar:	'2',
    		Euro:		'3',
    		Pound:		'4',
    		USDollar:	'5'
    };
    
    /*-----------------------------------------------------------------------------------------------------------------------------
     * LC2_OE_Case_Type - Stores the hard-coded values for the custom list 
     * ----------------------------------------------------------------------------------------------------------------------------*/
    var LC2_OE_Case_Type = {
    		General: '1',
    		AdjCancelMT: '2'
    };
    
    /*
     * LC2_UnknownUser - Stores the hardcoded value for the Unknown User
     * */
    
    var LC2_UnknownUser = '-4';

	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Contact Origin Object LC_ContactOrigin
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_ContactOrigin = {
		WebForm:		'1',	// Web Form
		Email:			'2',	// Email
		Phone:			'3',	// Phone
		InPersonEvent:	'4',	// In Person Event
		LinkedIn:		'5',	// LinkedIn
		Other:			'6',	// Other
		WebPage:		'7',	// Web Page
		Acquisition:	'8',	// Acquisition
		EBSCOConnect:	'9'		// EBSCO Connect
	};
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Job Role Object LC_JobRole
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_JobRole = {
		SysTech:		'4',	//Systems/Technology
		HR:				'6',	//Human Resources
		Other:			'92',	// Other
		NeedsAssign:	'31'	// Needs Assignment	
	};
	
	/*--------------------------------------------------------------------------------------------------------------------------
	* Global Global Subscription Status Object LC_glblSubsStatus
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
		var LC2_globalSubscriptionStatus = {
			SoftOptIn:			'1',
			SoftOptOut:			'2',
			ConfirmedOptIn:		'3',
			ConfirmedOptOut:	'4',
			/*
			 * Function		:	IsGlobalSubsStatusOptIn(glblSubsStatusIn)
			 * Description	:	Determines whether the Global Subscription Status passed in - is an OptIn
			 * Input		:	glblSubsStatusIn (Global Subscription Status Internal ID)
			 * Returns		:	true = the GSS is an 'Opt In' -or-  false = not an 'Opt In'
			*/
			IsGlobalSubsStatusOptIn: function(glblSubsStatusIn) {
				return (glblSubsStatusIn == this.SoftOptIn || glblSubsStatusIn == this.ConfirmedOptIn) ? true : false;
			}
		};
		
	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_TaskType - EIS Sales Task Type values
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_TaskType = {
			AdminTask:			'12',
	    	ColdCallPhone:		'7',
	    	ColdCallPhoneEmail:	'11',
	    	Complaint:			'18',
	    	ConfEBSCOevent:		'15',
	    	Email:				'5',
	    	InformationEntry:	'6',
	    	PhoneCall:			'1',
	    	PhoneEmail:			'10',
	    	VideoCall30:		'24',
	    	VideoCall60:		'25',
	    	Visit:				'2'
	     };   
     
	/*
	*	Function: LC2_RemoveEmoji
	*
	* */
	function LC2_RemoveEmoji(inputString){
		var emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g;
		return (inputString.replace(emojiRegex, ''));
	}

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_ParentChildRelationshipType - EBSCO Connect Parent Child Relationship Type
	*
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_ParentChildRelationshipType = {
		FOLIO: '1'
	};

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_IPMProgramProduct - IPM Program Product list
	*		US1122979
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_IPMProgramProduct = {
		Acce5:			'1',
		BiblioGraph:	'2',
		EBSCOSSO:		'3',
		EDS:			'4',
		EDSCatIR:		'5',
		FacultySelect:	'6',
		FOLIO:			'7',
		FullTextFinder: '8',
		Locate:			'9',
		OPenAthens:		'10',
		Panorama:		'11',
		Stacks:			'12',
		Other:			'13'
	};

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_SurveyType - Stores value sof the Survey Type list
	*				// Added as part of US1168294 GOBI Case Survey
	* 				// US1196828 - added as part of new FOLIO Case Survey
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SurveyType = {
		DDE: 	'1',
		GOBI:	'2',
		FOLIO:	'3'
	};

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_MosaicObjections - Stores values of the MOSAIC Objections custom list
	*				// Added as part of US1123000
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_MosaicObjections = {
		MultiSelect : '1',
		ApprovalPlans : '2',
		Profiling : '3',
		DeDuplicationControl : '4',
		ImportingExporting : '5',
		PrintOrdering : '6',
		TechnicalServices : '7',
		DDA : '8',
		EBA : '9',
		eCollections : '10',
		Other : '11'
	};

	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_SubsCallTopics - Stores the values of the Subs Call Topics found in the custom record
	*				// Added as part of TA872986 - refactoring client2_task_sales.js
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SubsCallTopics = {
		AmaJama: 	'39',		// AMA/JAMA (inactive on task form)
		MaHealth: 	'40',		// MA Health (inactive on task form)
		Aaas	: 	'150',		// AAAS (inactive on task form)
		Sage:	 	'151',		// Training (inactive on task form)
		Training: 	'216'		// Training
	};


	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_SubsOfficeCodes - Stores the values of the Subs Office Codes found in the custom record
	*		// Added as part of TA872986 - refactoring client2_task_sales.js
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_SubsOfficeCodes = {
		PubServices: 	'17'		// Publisher Services
	};


	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_EISProdType - Stores the values of the EIS Product Types list found in its custom record
	*		// Added as part of TA907556 - refactoring client_eis_account.js
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_EISProdType = {
		AtoZ:				'1',	// A to Z
		UserSvsUnknownEIS: 	'7'		// User Services/Unknown EIS Customer ID
	};


	/*--------------------------------------------------------------------------------------------------------------------------
	* LC2_RequestReason - SStores values for the Request Reason field on the Title Comparison case form
	*		// Added for US1238305
	*---------------------------------------------------------------------------------------------------------------------------*/
	var LC2_RequestReason = {
		NeededForMtg:		'1'		// Needed For Meeting
	};


	/* ----------------------------------------------------------
	* LC2_YBPCaseStatuses - Supports the YBP Case Status field
	* US1166718
	*--------------------------------------------------------------*/
	var LC2_YBPCaseStatuses = {
		WaitingOnInternalInfo : 1,
		WaitingOnCustomer : 2,
		WaitingOnVendor : 3,
		SentToEContent : 4,
		ReturnedToCustomerService : 5,
		EContentInProgress : 6,
		CustomerServiceInProgress : 7,
		Closed : 8,
		ReOpened: 9,
		ClosedDuplicateNoAction : 10,
		SentToOMG : 11,
		GOBIInProgress : 12,
		LTSInProgress : 13,
		SentToGOBIServiceIssues : 14,
		DoNotReassign : 15,
		ReassignedCase : 16,
		NotStarted : 17
	}



	return {
        LC2_fieldList: LC2_fieldList_targetKeyAccountNotesFieldHistorySuitelet,
        LC2_Employee: LC2_Employee,
		LC2_Emp_Office: LC2_Emp_Office,
        LC2_SalesCaseType: LC2_SalesCaseType,
        LC2_Role: LC2_Role,
        LC2_ContactENOrdApprovSts:LC2_ContactENOrdApprovSts,
        LC2_ContactValidateENOrdApprovSts: LC2_ContactValidateENOrdApprovSts,
        LC2_SAO_API_Endpoints: LC2_SAO_API_Endpoints,
        LC2_SAO_API_Keys: LC2_SAO_API_Keys,
        LC2_ContactOpCat: LC2_ContactOpCat,
		LC2_YbpProfiles: LC2_YbpProfiles,
		LC2_cleanMessage: LC2_cleanMessage,
        LC2_Email: LC2_Email,
        LC2_SavedSearch: LC2_SavedSearch,
        LC2_Profiles: LC2_Profiles,
        LC2_CaseOrigin: LC2_CaseOrigin,
        LC2_CaseStatus: LC2_CaseStatus,
        LC2_Departments: LC2_Departments,
        LC2_CaseDDEAreaSupport: LC2_CaseDDEAreaSupport, 
        LC2_CaseDDEProd: LC2_CaseDDEProd,
        LC2_CaseOccupation: LC2_CaseOccupation,
        LC2_CaseReqTyp: LC2_CaseReqTyp,
        LC2_CaseLevelEffort: LC2_CaseLevelEffort,
        LC2_Form: LC2_Form,
        LC2_Eml_Tmplt: LC2_Eml_Tmplt,
        LC2_MaxFileSize: LC2_MaxFileSize,
        LC2_TrainingStatus:  LC2_TrainingStatus,
        LC2_TaskStatus: LC2_TaskStatus,
        LC2_trainingReportType: LC2_trainingReportType,
        LC2_trainingSessionHours: LC2_trainingSessionHours,
        LC2_SIstatus: LC2_SIstatus,
        LC2_SIissueType: LC2_SIissueType,
        LC2_Transition_Show: LC2_Transition_Show,
        LC2_Transition_sts: LC2_Transition_sts,
        LC2_Transition_typ: LC2_Transition_typ,
        LC2_pan_data_sources: LC2_pan_data_sources,
        LC2_yes_no_only: LC2_yes_no_only,
        LC2_tab: LC2_tab,
        LC2_caseAttachDelSuitelet: LC2_caseAttachDelSuitelet,
        LC2_schedScriptRunTime: LC2_schedScriptRunTime,
        LC2_AUTH_API_Endpoints: LC2_AUTH_API_Endpoints,
        LC2_CLM_API_Endpoints: LC2_CLM_API_Endpoints,
        LC2_DocSign_CLM_Body: LC2_DocSign_CLM_Body,
        LC2_Integration_Token: LC2_Integration_Token,
        LC2_DocSign_AuthKey: LC2_DocSign_AuthKey,
        LC2_ClientScript_FileID: LC2_ClientScript_FileID,
        LC2_SF_createNew: LC2_SF_createNew,
        LC2_SfCaseDelSts: LC2_SfCaseDelSts,
        LC2_CxpNsAct: LC2_CxpNsAct,
        LC2_ProdTarg_sts: LC2_ProdTarg_sts,
        LC2_Oppy_sts: LC2_Oppy_sts,
        LC2_OppyItemStatus: LC2_OppyItemStatus,
        LC2_RFPStatus: LC2_RFPStatus,
        LC2_OppyFormType: LC2_OppyFormType,
        LC2_Customer: LC2_Customer,
        LC2_SF_EcAccessLevels_sts: LC2_SF_EcAccessLevels_sts,
        LC2_SF_PortalUser_sts: LC2_SF_PortalUser_sts,
        LC2_Property_based_Access: LC2_Property_based_Access,
        LC2_ENET_OrderApprove_sts: LC2_ENET_OrderApprove_sts,
        LC2_EC_Contact_Access_Type: LC2_EC_Contact_Access_Type,
        LC2_SRPM_Conversion_Status: LC2_SRPM_Conversion_Status,
        LC2_Access_Type_Req: LC2_Access_Type_Req,
        LC2_Access_Decision: LC2_Access_Decision,
        LC2_Form_subtabs: LC2_Form_subtabs,
        LC2_EC_Case_Type: LC2_EC_Case_Type,
        LC2_Country: LC2_Country,
        LC2_Segment: LC2_Segment,
        LC2_Currency: LC2_Currency,
        LC2_OE_Case_Type: LC2_OE_Case_Type,
        LC2_UnknownUser: LC2_UnknownUser,
		LC2_ContactOrigin: LC2_ContactOrigin,
		LC2_JobRole: LC2_JobRole,
		LC2_globalSubscriptionStatus: LC2_globalSubscriptionStatus,
		LC2_TaskType: LC2_TaskType,
		LC2_RemoveEmoji: LC2_RemoveEmoji,
		LC2_ParentChildRelationshipType: LC2_ParentChildRelationshipType,
		LC2_IPMProgramProduct: LC2_IPMProgramProduct,
		LC2_SurveyType: LC2_SurveyType,
		LC2_MosaicObjections: LC2_MosaicObjections,
		LC2_YBPCaseStatuses : LC2_YBPCaseStatuses,
		LC2_SubsCallTopics: LC2_SubsCallTopics,
		LC2_SubsOfficeCodes:  LC2_SubsOfficeCodes,
		LC2_EISProdType: LC2_EISProdType,
		LC2_RequestReason: LC2_RequestReason
    }

});
