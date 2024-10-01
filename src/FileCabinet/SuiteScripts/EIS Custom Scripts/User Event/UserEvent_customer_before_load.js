// Script:     UserEvent_customer_before_load.js
//
// Created by: EBSCO Information Services
//
// Function:   serverCustomerBeforeLoad	
//				
//Library Scripts Used:
// 			library_constants.js -- Library Script used to reference constant values
//          library_customers.js -- Library script used to reference Customer related functions 
//
//
//
// Revisions:  
//	CNeale	11/20/2015	Added code to suppress Address Sublist fields (function: hideAddressFields) 
//                      and to protect Address label on Address Sublist (function: protectAddressLabel)
//  CNeale	05/06/2016	US51481 Add customer Id into a session object.
//	LWeyrauch 07/25/2016 Data Center move changes
//  CNeale  08/02/2016 	US116612 Introduce Customer Address Control Record for Address Validation & Control. 
//                      Session Object no longer required.  
//	CNeale	09/06/2016	US157010 Resolve issue with Inactive Customers.
//                      Temp Removed Trial Info for SB2 only - reinstate for live.
//	eabramo	03/24/2017 	Marketo - Qualify stage is not Lead or Prospect - for a large chunk of Code
// 						Includes create/set Market fields
//						Includes all the searches and subtabs with subrecords
//	KMcCormack 05-10-17	US224763: Access Tableau Customer Usage Report directly from within the NetCRM Customer record.
//	eAbramo	06/05/2017	deprecate ODV Viewer link
//	eAbramo	08/08/2017	Add sublist for Consortium record
//
//	eAbramo 09/05-2017	US279236 - Add link to Tableau: Customer Euro Revenue Report
//	JOliver 12/21-2017	US295939 - Add link to Tableau: Subscriptions Fiscal Volume
//	CNeale	07/16-2018	US268765 - remove use of GetNetSuiteDomain() Library function and make the over 1000 EIS Accounts
//                      link domain independent
// 	eAbramo	08-21-2018	Comment out ACtive Trials subtab code due to NS Defect (Temporary fix so that Customer record renders)
//  CNeale	08-23-2018	REinstate Active Trials subtab code commented out due to NS Defect.
//	CNeale	12-03-2018	US402266 - Add "Send to SalesForce" button - View & Edit modes catered for
//	KMcCormack 12-03-2018	US402324 - Remove previously added "Send to SalesForce" button from view mode.  Button should only
//							be available when user is in edit mode.
//  PKelleher 2/21/19   Updated Biomedical section to include 5 more fields and to have them only show on the Biomedical subtab - (US479663) (Healthstream CE; Number of Physicians; Number of Providers; Number of Nurse Practitioners; Number of Physician Assistant)
//	CNeale	09/27/19	US547039 Do NOT allow "Send to SalesForce" button for AU Celigo Portal Customers.
//	JOliver	4/13/2020	US629646 Comment out link to Tableau Euro Revenue Report (originally added under US279236)
//	eAbramo	07/27/2020	US636612 clean up fields on biomedical tab (custentity_psych_beds, custentity_medicare_provider_number, custentity_ama_residents
//						custentity_er_outpatient_visits, custentity_number_hosp_employees, custentity_healthstream_ce)
//	eAbramo	8/13/2020	US671043 Academic field changes
//  PKelleher 11/11/2020  Continuous Ops PI20 I2 - add two "Forbes 2000" fields to Corporate subtab on Customer record
//	eAbramo	04/02/2021	US773754 Don't render the WinSeR button if Customer is located in Cuba
////JOliver	04/07/2021	US773745 disable OE Approval checkbox for restricted countries
//  PKelleher  6/2/21	US802999 Comment out Link to Tableau field and URL - created new custentity field that contains Link to Customer Dashboard new URL
//	CNeale	6/18/2021	US763062 Remove scripted Sales Cases Subtab/Sublist (to be replaced with OOB option)
//  CNeale	8/9/2021	US820187 Remove scripted subtab/sublist for EIS Account, GOBI Profile, Consortium & Ord Proc Cases - all to be replaced with OOB solution
//						  Also remove other redundant code already commented out.
//						  Also remove Oppty Title & Status from Active Trials Sublist	
//	PKelleher  5/8/2023	US1096193 Give user Send to SF button if the Customer has Clinical Decisions Customer checkbox already checked
//	ZScannell	07/15/2024	US1277418 - Deprecating the old WinSer button in SS1 as part of the OAuth2.0 migration
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function serverCustomerBeforeLoad(type, form)
{
	if (  nlapiGetContext().getRole() != 1025 && nlapiGetContext().getUser() != 452592 )  //EP Web Service Role & User excluded
	{
		// Territory selector field is utilized in customer form client script
		// This field needs to be server script generated in order to populate/clear via client script
		if (( type == 'create' || type == 'edit' ) && (nlapiGetContext().getUser() != 452592) && (nlapiGetContext().getUser() != 808840)) // Web Service & Web Service 2 users excluded
		{
			var territorySelector = form.addField('custpage_epterritory_selector','select','Territory Selector',null,'main');
			form.insertField(territorySelector,'custentity_epterritory');
			territorySelector.setDisplayType('disabled');
		}
		var stage = nlapiGetFieldValue('stage');
		// eabramo 03-24-2017 Marketo - qualify stage is not Lead or Prospect
		if (stage !='LEAD' && stage!='PROSPECT')	
		{
			if (type == 'create')
			{
				// fetch all the fields to unhide
				var academicCategoryField = form.getField('custentity_academic_category');
				var highestDegreeField = form.getField('custentity_highest_degree');		
				var hospServicesField = form.getField('custentity_hosp_services');
				var totalBedsField = form.getField('custentity_total_beds');
				var staffedBedsField = form.getField('custentity_staffed_beds');
				var accuteBedsField = form.getField('custentity_accute_beds');			
				var emrField = form.getField('custentity_emr_vendor');
				var comp_resField = form.getField('custentity_biomed_comp_resources');			
				var magnetHospField = form.getField('custentity_magnet_hospital');
				var numberPhysiciansField = form.getField('custentity_number_physicians');
				var numberProvidersField = form.getField('custentity_number_providers');
				var numberNursePractitionersField = form.getField('custentity_number_nurse_practitioners');
				var numberPhysicianAsstField = form.getField('custentity_number_physician_assistants');
				var industryField = form.getField('custentity_industry');
				var assocTypeField = form.getField('custentity_association_type');
				var MilitaryBranchField = form.getField('custentity_military_branch');
				var MilitaryLibTypeField = form.getField('custentity_military_library_type');
				var lowestGradeField = form.getField('custentity_lowest_grade');
				var highestGradeField = form.getField('custentity_highest_grade');
				var numberTeachersField = form.getField('custentity_number_teachers');
				var isFortune1000Field = form.getField('custentity_is_fortune_1000');
				var fortune1000RankField = form.getField('custentity_fortune_1000_rank');
				var isForbes2000Field = form.getField('custentity_is_forbes_2000');
				var forbes2000RankField = form.getField('custentity_forbes_2000_rank');
				var yearRoundSchoolField = form.getField('custentity_yearround_school');
				var apProgramField = form.getField('custentity_ap_program'); 
				var adultEdProgramField = form.getField('custentity_adulted_school');
				var vocEdProgramField = form.getField('custentity_voced_school');
				var corpRankField = form.getField('custentity_corporate_rank_list');
				var rankNumberField = form.getField('custentity_ranking_number');
				var rankDateStampField = form.getField('custentity_ranking_date_stamp');				
				var privatePublicCorpField = form.getField('custentity_private_public_co');	
				var annualRevenueField = form.getField('custentity_annual_revenue');
				var FSRkeyacctField = form.getField('custentity_fsr_key_acct');
				var EDSkeyacctField = form.getField('custentity_eds_key_acct');
				var implementationAcctField = form.getField('custentity_imp_acct');
				var atRiskRenewalField = form.getField('custentity_at_risk_renew');
				var intl_militaryField = form.getField('custentity_is_intl_military');
				var research_instField = form.getField('custentity_research_institution');		
				// unhide all the fields
				academicCategoryField.setDisplayType('normal');
				highestDegreeField.setDisplayType('normal');
				hospServicesField.setDisplayType('normal');
				totalBedsField.setDisplayType('normal');
				staffedBedsField.setDisplayType('normal');
				accuteBedsField.setDisplayType('normal');	
				emrField.setDisplayType('normal');
				comp_resField.setDisplayType('normal');			
				magnetHospField.setDisplayType('normal');	
				numberPhysiciansField.setDisplayType('normal');
				numberProvidersField.setDisplayType('normal');
				numberNursePractitionersField.setDisplayType('normal');
				numberPhysicianAsstField.setDisplayType('normal');
				industryField.setDisplayType('normal');
				assocTypeField.setDisplayType('normal');
				MilitaryBranchField.setDisplayType('normal');			
				MilitaryLibTypeField.setDisplayType('normal');
				lowestGradeField.setDisplayType('normal');
				highestGradeField.setDisplayType('normal');
				numberTeachersField.setDisplayType('normal');	
				isFortune1000Field.setDisplayType('normal');
				fortune1000RankField.setDisplayType('normal');
				isForbes2000Field.setDisplayType('normal');
				forbes2000RankField.setDisplayType('normal');
				yearRoundSchoolField.setDisplayType('normal');
				apProgramField.setDisplayType('normal');
				adultEdProgramField.setDisplayType('normal');
				vocEdProgramField.setDisplayType('normal');
				corpRankField.setDisplayType('normal');
				rankNumberField.setDisplayType('normal');
				// Note the following field is set twice, once to load it as normal and a second time to load as inline
				rankDateStampField.setDisplayType('normal');	
				rankDateStampField.setDisplayType('inline');			
				privatePublicCorpField.setDisplayType('normal');		
				annualRevenueField.setDisplayType('normal');
				FSRkeyacctField.setDisplayType('normal');
				EDSkeyacctField.setDisplayType('normal');
				implementationAcctField.setDisplayType('normal');
				atRiskRenewalField.setDisplayType('normal');
				intl_militaryField.setDisplayType('normal');
				research_instField.setDisplayType('normal');		
			} // end type = create

 		
			if (( type == 'view' || type == 'edit' ) && (nlapiGetContext().getUser() != 452592) && (nlapiGetContext().getUser() != 808840))
			{
				//nlapiLogExecution('DEBUG', 'TRACE 2', 'TRACE 2');
				var currentRecord = nlapiGetNewRecord();
				var market = currentRecord.getFieldValue('custentity_market');
				var segment = currentRecord.getFieldValue('custentity_marketsegment');	
	
				// customize tab according to Market
				// Market Data Tab is called 'custom21' in Production
				var myTab = form.getTab('custom21');	
	
				// ACADEMIC
				if (market == 1)
				{
					// rename the label
					var myLabel = myTab.setLabel('Academic');
					// fetch the fields to unhide			
					var academicCategoryField = form.getField('custentity_academic_category');
					var highestDegreeField = form.getField('custentity_highest_degree');
					// unhide the fields
					academicCategoryField.setDisplayType('normal');
					highestDegreeField.setDisplayType('normal');
				}
	
				// BIOMEDICAL
				// Under Biomedical Market
				else if (market == 2)
				{
					// rename the label
					// 2.20.19 -- Pat Kelleher - (US479663) adding 5 fields show only on Biomedical subtab (Healthstream CE; Number of Physicians; Number of Providers; Number of Nurse Practitioners; Physician Assistant)
					var myLabel = myTab.setLabel('Biomedical');
					// fetch the fields to unhide
					var hospServicesField = form.getField('custentity_hosp_services');
					var totalBedsField = form.getField('custentity_total_beds');
					var staffedBedsField = form.getField('custentity_staffed_beds');
					var accuteBedsField = form.getField('custentity_accute_beds');
					// var industryField = form.getField('custentity_industry');  US636612
					var emrField = form.getField('custentity_emr_vendor');
					var comp_resField = form.getField('custentity_biomed_comp_resources');				
					var magnetHospField = form.getField('custentity_magnet_hospital');
					var numberPhysiciansField = form.getField('custentity_number_physicians');
					var numberProvidersField = form.getField('custentity_number_providers');
					var numberNursePractitionersField = form.getField('custentity_number_nurse_practitioners');
					var numberPhysicianAsstField = form.getField('custentity_number_physician_assistants');
					// unhide the fields
					hospServicesField.setDisplayType('normal');
					totalBedsField.setDisplayType('normal');
					staffedBedsField.setDisplayType('normal');
					accuteBedsField.setDisplayType('normal');
					emrField.setDisplayType('normal');
					comp_resField.setDisplayType('normal');								
					// adding column break
					magnetHospField.setDisplayType('normal').setLayoutType('normal', 'startcol');
					// industryField.setDisplayType('normal');  industryField (JO - was this remmed out as part of US636612? Guessing yes)
					numberPhysiciansField.setDisplayType('normal');
					numberProvidersField.setDisplayType('normal');
					numberNursePractitionersField.setDisplayType('normal');
					numberPhysicianAsstField.setDisplayType('normal');
					// If the Site is a Biomedical Association Segment unhide the Association Type field (added 04-25-08 by Dustin)
					if (segment == 47)
					{
						// fetch the fields to unhide
						var assocTypeField = form.getField('custentity_association_type');			 	
						// unhide the fields
						var assocTypeHide = assocTypeField.setDisplayType('normal');
					}
				}

	
				// CORPORATE
				else if (market == 3)
				{
					// rename the label
					var myLabel = myTab.setLabel('Corporate');
	
					// if its NOT Corporate Association then unhide industry and Fortune 1000 fields
					if (segment != 46)
					{
						// fetch the fields to unhide				
						var industryField = form.getField('custentity_industry');
						var isFortune1000Field = form.getField('custentity_is_fortune_1000');
						var fortune1000RankField = form.getField('custentity_fortune_1000_rank');
						var isForbes2000Field = form.getField('custentity_is_forbes_2000');
						var forbes2000RankField = form.getField('custentity_forbes_2000_rank');
						var corpRankField = form.getField('custentity_corporate_rank_list');
						var rankNumberField = form.getField('custentity_ranking_number');
						var rankDateStampField = form.getField('custentity_ranking_date_stamp');				
						var privatePublicCorpField = form.getField('custentity_private_public_co');
						var annualRevenueField = form.getField('custentity_annual_revenue');
						var FSRkeyacctField = form.getField('custentity_fsr_key_acct');
						var EDSkeyacctField = form.getField('custentity_eds_key_acct');
						var implementationAcctField = form.getField('custentity_imp_acct');
						var atRiskRenewalField = form.getField('custentity_at_risk_renew');
						// unhide the fields
						industryField.setDisplayType('normal');
						isFortune1000Field.setDisplayType('normal');
						fortune1000RankField.setDisplayType('normal');	
						isForbes2000Field.setDisplayType('normal');
						forbes2000RankField.setDisplayType('normal');	
						corpRankField.setDisplayType('normal');
						rankNumberField.setDisplayType('normal');
						// Note the following field is set twice, once to load it as normal and a second time to load as inline
						rankDateStampField.setDisplayType('normal');
						rankDateStampField.setDisplayType('inline');			
						privatePublicCorpField.setDisplayType('normal');
						annualRevenueField.setDisplayType('normal');
						FSRkeyacctField.setDisplayType('normal');
						EDSkeyacctField.setDisplayType('normal');
						implementationAcctField.setDisplayType('normal');
						atRiskRenewalField.setDisplayType('normal');
					}		
					// If the Site is an Association Segment unhide the Association Type field (added 04-07-08)
					if (segment == 46)
					{
						// fetch the fields to unhide
						var assocTypeField = form.getField('custentity_association_type');			 	
						// unhide the fields
						assocTypeField.setDisplayType('normal');
					}
				}		
				// FED GOVT
				else if (market == 4)
				{
					// rename the label
					var myLabel = myTab.setLabel('Federal Govt');
					// fetch the fields to unhide
					var intl_militaryField = form.getField('custentity_is_intl_military');		
					var research_instField = form.getField('custentity_research_institution');		
					// unhide the fields
					intl_militaryField.setDisplayType('normal');	
					research_instField.setDisplayType('normal');			
				}
				// MILITARY
				else if (market == 5)
				{
					// rename the label
					var myLabel = myTab.setLabel('Military');
					// fetch the fields to unhide
					var MilitaryBranchField = form.getField('custentity_military_branch');
					var MilitaryLibTypeField = form.getField('custentity_military_library_type');			
					// unhide the fields
					MilitaryBranchField.setDisplayType('normal');			
					MilitaryLibTypeField.setDisplayType('normal');
				}
				// OTHER
				else if (market == 6)
				{
					// rename the label
					var myLabel = myTab.setLabel('Other');
				}
				// PUBLIC
				else if (market == 7)
				{
					// rename the label
					var myLabel = myTab.setLabel('Public Library');	
					// fetch the field to unhide
					var academicCategoryField = form.getField('custentity_academic_category');
					// unhide the fields
					academicCategoryField.setDisplayType('normal');
				}	
				// SCHOOLS
				else if ((market == 8) || (market == 10))
				{
					// rename the label
					var myLabel = myTab.setLabel('Schools');
					// fetch the fields to unhide
					var lowestGradeField = form.getField('custentity_lowest_grade');
					var highestGradeField = form.getField('custentity_highest_grade');
					var numberTeachersField = form.getField('custentity_number_teachers');
					var yearRoundSchoolField = form.getField('custentity_yearround_school');
					var apProgramField = form.getField('custentity_ap_program'); 
					var adultEdProgramField = form.getField('custentity_adulted_school');
					var vocEdProgramField = form.getField('custentity_voced_school');
					// unhide the fields
					lowestGradeField.setDisplayType('normal');
					highestGradeField.setDisplayType('normal');
					numberTeachersField.setDisplayType('normal');	
					yearRoundSchoolField.setDisplayType('normal');
					apProgramField.setDisplayType('normal');
					adultEdProgramField.setDisplayType('normal');
					vocEdProgramField.setDisplayType('normal');	
				}	
				// STATE GOVT
				else
				{
					// rename the label
					var myLabel = myTab.setLabel('Regional Govt');
				}	
	
				//nlapiLogExecution('DEBUG', 'TRACE 3', 'TRACE 3');
				// Customization Form Link  Dustin Hendrickson added 7/8/2008
				// Grab the current logged in user's name and email
				var custom_context = nlapiGetContext();
				// Get the CustID
				var custom_recordid = nlapiGetRecordId();
				var custom_custid = nlapiLookupField('customer', custom_recordid, 'entityid');
				// Build the link
				var customize_link = '<a href="http://internaltools.epnet.com/customize?custID='+custom_custid+'&name='+custom_context.name+'&email='+custom_context.email+'" target="_blank">Open Customization Form</a>';
				// Write link to UI
				nlapiSetFieldValue('custentity_customize', customize_link);					
	
	
				// Build URL to SSO Suitelet - Order Document Viewer (WSR) and WinSeR Button
				// Only Active Customers
				if (nlapiGetFieldValue('isinactive')==null || nlapiGetFieldValue('isinactive')=='' || nlapiGetFieldValue('isinactive')=='F')
				{
					// Only OE Approved Customers
					if (nlapiGetFieldValue('custentity_oeapproved')=='T')
					{	// Only Sales Reps or Support Reps
						//	US1277418 - Deprecating the old WinSer button in SS1 as part of the OAuth2.0 migration (DELETED CODE CHUNK)
														
						// 12-21-17 JO -US295939: Link to Tableau for Subscriptions Fiscal Volume
						tableau_field3 = form.addField("custpage_tableau3", "url", "", null, "custom274");
						tableau_field3.setDisplayType("inline").setLinkText( "Customer Subscriptions Fiscal Volume").setDefaultValue( "/app/site/hosting/scriptlet.nl?script=166&deploy=1&tabrpt=subscriptions&custId="+ nlapiLookupField('customer', custom_recordid, 'entityid')+"");
						tableau_field3.setHelpText("Clicking the link below will open the customer's Subscriptions Fiscal Volume.");
						//form.insertField(tableau_field3, "custentity_items_purchased_current");
					}
				}
	
				// BEGIN CODE to POPULATE SUBTAB OF CONSORTIA TRIAL INFORMATION - E Abramo
				// 08-21-2018 -- BEGIN comment out ACtive Trials subtab code due to NS Defect 08-23-2018 Reinstated
				// 07-20-2021 Oppty Title & Status removed from Sublist (& related searches)

						var today_date = new Date();
						var this_record = nlapiGetRecordId();
		
						//create Tab and create Sublist
						// var trialsTab = form.addTab('custpage_trials_tab', 'Active Trials'); // code prior to 2015 form upgrade
						// 2015 Customer Upgrade Form redesign
						var trialsTab = form.addSubTab('custpage_trials_tab', 'Active Trials', 'support');
		
						var myField = form.addField('custpage_my_field', 'text', 'Note: Does Not Include COIN, ABC-CLIO or BBR', null, 'custpage_trials_tab');
						myField.setDisplayType('disabled');
						var subList = form.addSubList('custpage_trials_sublist','list','Active Trials','custpage_trials_tab');
		
					// Create Search for NORMAL Trial info
						var nfilters = new Array();
						nfilters[0] = new nlobjSearchFilter('entity', null,'is', this_record);
						nfilters[1] = new nlobjSearchFilter('custcol_trial_end',null,'after', today_date);
						nfilters[2] = new nlobjSearchFilter('custbody_trial',null,'is', 'T');
						//nfilters[3] = new nlobjSearchFilter('type', null,'is', 'opportunity');
						var ncolumns = new Array();
						ncolumns[0] = new nlobjSearchColumn('internalid', null, null);
						ncolumns[1] = new nlobjSearchColumn('item', null, null);
						ncolumns[2] = new nlobjSearchColumn('custcol_trial_begin', null, null);
						ncolumns[3] = new nlobjSearchColumn('custcol_trial_end', null, null);
						ncolumns[4] = new nlobjSearchColumn('entity', null, null);
						ncolumns[5] = new nlobjSearchColumn('amount', null, null);
						//ncolumns[6] = new nlobjSearchColumn('title', null, null);
						//ncolumns[7] = new nlobjSearchColumn('entitystatus', null, null);
						//execute my search
						nsearchResults = nlapiSearchRecord('transaction', null, nfilters, ncolumns);		
		
					// Create a Search for Consortia Trial info
						var cfilters = new Array();
						cfilters[0] = new nlobjSearchFilter('custbody_trial_accessing_sites',null,'anyof', this_record);
						cfilters[1] = new nlobjSearchFilter('custcol_trial_end',null,'after', today_date);
						cfilters[2] = new nlobjSearchFilter('custbody_trial',null,'is', 'T');
						//filters[3] = new nlobjSearchFilter('type',null,'is', 'opportunity');
						var ccolumns = new Array();
						ccolumns[0] = new nlobjSearchColumn('internalid', null, null);
						ccolumns[1] = new nlobjSearchColumn('item', null, null);
						ccolumns[2] = new nlobjSearchColumn('custcol_trial_begin', null, null);
						ccolumns[3] = new nlobjSearchColumn('custcol_trial_end', null, null);
						ccolumns[4] = new nlobjSearchColumn('entity', null, null);
						ccolumns[5] = new nlobjSearchColumn('amount', null, null);
						//ccolumns[6] = new nlobjSearchColumn('title', null, null);
						//ccolumns[7] = new nlobjSearchColumn('entitystatus', null, null);
						//execute my search
						csearchResults = nlapiSearchRecord('transaction', null, cfilters, ccolumns);
		
					// add fields to my sublist
						subList.addField('internalid','text','ID', null);
						subList.addField('item_display','text','Item', null);
						subList.addField('custcol_trial_begin','date','Trial Begin', null);
						subList.addField('custcol_trial_end','date','Trial End', null);
						subList.addField('entity','text','Main Customer', null);
						subList.addField('amount','currency','Item Amount', null);
						//subList.addField('title','text','Oppty Title', null);
						//subList.addField('entitystatus_display','text','Oppty Status', null);
		
						// populate fields in sublist- commented out so that I can build a link to the Oppty records
						// subList.setLineItemValues(searchResults);
		
					//populate search results from NORMAL Trials
					if (nsearchResults)
					{
						var nrows = nsearchResults.length;	
						for (var x=0; nsearchResults != null && x < nsearchResults.length; x++ )
							{
								linktext = '<a href="'+nlapiResolveURL('RECORD', 'Opportunity', nsearchResults[x].getValue('internalid'))+'">View</a>'; 
								subList.setLineItemValue('internalid', x+1, linktext);
								subList.setLineItemValue('item_display', x+1, nsearchResults[x].getText('item'));
								subList.setLineItemValue('custcol_trial_begin', x+1, nsearchResults[x].getValue('custcol_trial_begin'));
								subList.setLineItemValue('custcol_trial_end', x+1, nsearchResults[x].getValue('custcol_trial_end'));
								subList.setLineItemValue('entity', x+1, nsearchResults[x].getText('entity'));
								// use nlapiLookupField to get the customer name for the retrieved customer internal id
								// subList.setLineItemValue('entity', x+1, nlapiLookupField('customer', nsearchResults[x].getValue('entity'), 'companyname'));
								subList.setLineItemValue('amount', x+1, nsearchResults[x].getValue('amount'));
								//subList.setLineItemValue('title', x+1, nsearchResults[x].getValue('title'));
								//subList.setLineItemValue('entitystatus_display', x+1, nsearchResults[x].getText('entitystatus'));
							}
					}
					else
					{
						var nrows = 0;
					}
		
					//populate search results from CONSORTIA Trials (note that I'm adding to the NORMAL trial results length in my 
					// calculation of the array number for my lineItem value)	
					if (csearchResults)
					{
						for (var x=0; csearchResults != null && x < csearchResults.length; x++ )
							{
								linktext = '<a href="'+nlapiResolveURL('RECORD', 'Opportunity', csearchResults[x].getValue('internalid'))+'">View</a>'; 
								subList.setLineItemValue('internalid', x+nrows+1, linktext);
								subList.setLineItemValue('item_display', x+nrows+1, csearchResults[x].getText('item'));
								subList.setLineItemValue('custcol_trial_begin', x+nrows+1, csearchResults[x].getValue('custcol_trial_begin'));
								subList.setLineItemValue('custcol_trial_end', x+nrows+1, csearchResults[x].getValue('custcol_trial_end'));
								subList.setLineItemValue('entity', x+nrows+1, csearchResults[x].getText('entity'));
								// use nlapiLookupField to get the customer name for the retrieved customer internal id
								// subList.setLineItemValue('entity', x+nrows+1, nlapiLookupField('customer', csearchResults[x].getValue('entity'), 'companyname'));
								subList.setLineItemValue('entityid', x+nrows+1, csearchResults[x].getValue('entityid'));					
								subList.setLineItemValue('amount', x+nrows+1, csearchResults[x].getValue('amount'));
								//subList.setLineItemValue('title', x+nrows+1, csearchResults[x].getValue('title'));
								//subList.setLineItemValue('entitystatus_display', x+nrows+1, csearchResults[x].getText('entitystatus'));
							}
					}

				// 08-21-2018 -- BEGIN comment out ACtive Trials subtab code due to NS Defect 08-23-2018 Reinstated
				// END CODE to POPULATE SUBTAB OF CONSORTIA TRIAL INFORMATION

					
					//nlapiLogExecution('DEBUG', 'TRACE 4', 'TRACE 4');
			} // End Type = view or Edit
		}	// End Stage is not LEAD or PROSPECT 03-24-2017
		else if (stage =='LEAD' || stage =='PROSPECT')	
		{
			// fetch the fields to unhide -- 2017-03-16 Fixing Defect if User selects Corporate Segment on a Lead
			var industryField = form.getField('custentity_industry');
			var assocTypeField = form.getField('custentity_association_type');	
			// unhide the fields
			industryField.setDisplayType('normal');
			assocTypeField.setDisplayType('normal');				
		}
	
		var ctx = nlapiGetContext();	
		// Hide Fields on Address Subtab
		if ((type == 'view' || type == 'edit') && ctx.getExecutionContext() == 'userinterface')
		{
				hideAddressFields();
				protectAddressLabel();
		}
		
		// Identify Main Address for Customer & Add/Update Customer Address work record
		if ((type == 'edit'|| type == 'create') && ctx.getExecutionContext() == 'userinterface')
		{
			addressProcessing(type);
		}
		
		// US402266 Add button for SF "CreateNew" functionality
		// Only add for UI context, edit mode where Customer is Active, OE approved, does not already have a SF ID and only for specific Roles
		// US402324 Button should be available in edit mode only... remove view mode availability.
		// US547039 Do NOT allow for AU Celigo Portal Customers i.e. L_Cust_AUCeligo is False
		// US1096193 Give user Send to SF button if the Customer has Clinical Decisions Customer checkbox already checked
		var CDcustomer = nlapiGetFieldValue('custentity_clinical_decisions_cust');
		if (ctx.getExecutionContext() == 'userinterface' && type == 'edit' && nlapiGetFieldValue('isinactive') != 'T' && nlapiGetFieldValue('custentity_oeapproved') == 'T' &&
				!nlapiGetFieldValue('custentity_sf_account_id') && !L_Cust_AUCeligo(nlapiGetRecordId())){
			if(LC_Roles.IsRoleSFCustCreateNew(nlapiGetRole()) || (nlapiGetRole() == LC_Roles.CDSupport && CDcustomer == 'T')){
			form.setScript('customscript_client_record_customer');
				form.addButton('custpage_SFcreateNewButton', 'Send to SalesForce', 'CR_Customer_SF_createNew_button();' );
			}
		}
		
		//US773745 disable OE Approval checkbox for restricted countries
		var countryIn = nlapiGetFieldValue('custentity_epcountry');
		if (LC_EpCountry.isSalesRestricted(countryIn))
		{	
			var OEfield = form.getField('custentity_oeapproved');
			// disable the field
			OEfield.setDisplayType('disabled');	
		}
		
	} // End specific user/role
} // End Function

function hideAddressFields()
{	var fields = ["defaultshipping","defaultbilling","isresidential"]; // fields to be hidden
	nlapiSelectLineItem("addressbook",1);
	var i = 0;
	for (var key in fields) 
	{
		var addressField = nlapiGetLineItemField("addressbook", fields[i], 1);
		addressField.setDisplayType('hidden');
		i++;
	}
}

function protectAddressLabel()
{
	var addressField = nlapiGetLineItemField("addressbook", "label", 1);
	addressField.setDisplayType('disabled');
}


function addressProcessing(typein)
{	var userId = nlapiGetUser();
	// Initialise variables for CAC record creation/update
	var mainState = '';
	var mainCountry = '';
	var mainZip = '';
	var mainId = '';
	var mainIntId = '';
	var mainState2 = '';
	var mainCountry2 = '';
	var mainZip2 = '';
	var mainId2 = '';
	var mainIntId2 = '';
	var mainAddCnt = 0;
	var addressCount = 0;
	var addlen = 0;
	
	var parentId = nlapiGetFieldValue('parent');
	var custInact = nlapiGetFieldValue('isinactive');
	
 	if (typein == 'edit' || (typein == 'create' && parentId))
 	{
		var custId = nlapiGetRecordId();
		addressCount = nlapiGetLineItemCount('addressbook');
		// Identify Main Address(es)		
		var addfilters = new Array();
		if (typein == 'edit')
		{
			addfilters[0] = new nlobjSearchFilter('internalid', null,'anyof', custId);
		}
		else
		{
			addfilters[0] = new nlobjSearchFilter('internalid', null,'anyof', parentId);
		}
			
		//execute my search
		addsearchResults = nlapiSearchRecord('customer', 'customsearch_main_address_search', addfilters, null);
		// if you get search results
		if (addsearchResults)
		{	
			addlen = addsearchResults.length;
			mainAddCnt = addlen;
			if (addlen == 1 || addlen == 2)
			// If we have one and only one main address set previous country/previous state	
			{
				mainState = addsearchResults[0].getValue('state', 'address');
				mainCountry = addsearchResults[0].getValue('country', 'address');	
				mainZip = addsearchResults[0].getValue('zipcode', 'address');
				mainId = addsearchResults[0].getValue('addressinternalid', 'address');
				mainIntId = addsearchResults[0].getValue('internalid', 'address');
				if (addlen == 2)
				{
					mainState2 = addsearchResults[1].getValue('state', 'address');
					mainCountry2 = addsearchResults[1].getValue('country', 'address');	
					mainZip2 = addsearchResults[1].getValue('zipcode', 'address');
					mainId2 = addsearchResults[1].getValue('addressinternalid', 'address');
					mainIntId2 = addsearchResults[1].getValue('internalid', 'address');
				}
			}
		}
 	}	
	// Locate Custom Record - Possibilities are - there is one and only one record (use)
	//                                          - there is no record (create)
	//	                                        - there are multiple records (use first, delete rest)
	var crfilters = new Array();
	if (typein == 'edit')
	{
		
		// US157010 Cater for inactive Customers
		if(custInact != 'T')
		{
			crfilters[0] = new nlobjSearchFilter('custrecord_cac_customer', null, 'anyof', custId);
		}
		else
		{
			crfilters[0] = new nlobjSearchFilter('custrecord_cac_cust_inact', null, 'is', 'T');
			crfilters[2] = new nlobjSearchFilter('custrecord_cac_cust_inact_id', null, 'is', custId); 
		}
	}
	else
	{
		crfilters[0] = new nlobjSearchFilter('custrecord_cac_new', null, 'is', 'T');
	}
	crfilters[1] = new nlobjSearchFilter('custrecord_cac_user', null, 'anyof', userId);

	var crcolumns = new Array();
	var crlen;
	crcolumns[0] = new nlobjSearchColumn('id', null, null);  
	crsearchResults = nlapiSearchRecord('customrecord_cust_add_control', null, crfilters, crcolumns);
	if (crsearchResults)
	{
		crlen = crsearchResults.length;
		for (var i = 1; crlen > 1 && i < crlen; i++) 
		{
			nlapiDeleteRecord('customrecord_cust_add_control', crsearchResults[i].getId());
		}
		cacrec = nlapiLoadRecord('customrecord_cust_add_control', crsearchResults[0].getId());
	}
	else
	{
		cacrec = nlapiCreateRecord('customrecord_cust_add_control');
		crlen = 0;
		if (typein == 'edit')
		{
			cacrec.setFieldValue('custrecord_cac_new', 'F');
			if (custInact != 'T') // US157010 now need to cater for Inactive Customer  
			{
				cacrec.setFieldValue('custrecord_cac_customer', custId);
				cacrec.setFieldValue('custrecord_cac_cust_inact', 'F');
				cacrec.setFieldValue('custrecord_cac_cust_inact_id', '');
			}
			else
			{
				cacrec.setFieldValue('custrecord_cac_customer', '');
				cacrec.setFieldValue('custrecord_cac_cust_inact', 'T');
				cacrec.setFieldValue('custrecord_cac_cust_inact_id', custId);
			}
		}
		else
		{
			cacrec.setFieldValue('custrecord_cac_customer', '');	
			cacrec.setFieldValue('custrecord_cac_new', 'T');
			cacrec.setFieldValue('custrecord_cac_cust_inact', 'F');
			cacrec.setFieldValue('custrecord_cac_cust_inact_id', '');
		}
		cacrec.setFieldValue('custrecord_cac_user', userId);
	}
	// Populate Fields Relating to Initial Situation
	cacrec.setFieldValue('custrecord_init_add_count', addressCount);
	if (mainAddCnt == 1)
	{
		cacrec.setFieldValue('custrecord_init_main_id', mainIntId);
		cacrec.setFieldValue('custrecord_init_main_ctry', mainCountry);
		cacrec.setFieldValue('custrecord_init_main_state', mainState);
		cacrec.setFieldValue('custrecord_init_main_zip', mainZip);
	}
	else
	{
		cacrec.setFieldValue('custrecord_init_main_id', '');
		cacrec.setFieldValue('custrecord_init_main_ctry', '');
		cacrec.setFieldValue('custrecord_init_main_state', '');
		cacrec.setFieldValue('custrecord_init_main_zip', '');		
	}
	cacrec.setFieldValue('custrecord_init_main_cnt', mainAddCnt);
	cacrec.setFieldValue('custrecord_curr_main_cnt', mainAddCnt);
	cacrec.setFieldValue('custrecord_curr_main_id', mainIntId);
	cacrec.setFieldValue('custrecord_curr_main_ctry', mainCountry);
	cacrec.setFieldValue('custrecord_curr_main_state', mainState);
	cacrec.setFieldValue('custrecord_curr_main_id_2', mainIntId2);
	cacrec.setFieldValue('custrecord_curr_main_ctry_2', mainCountry2);
	cacrec.setFieldValue('custrecord_curr_main_state_2', mainState2);
	cacrec.setFieldValue('custrecord_awaiting_del', 0);
	// Create/update Customer Address Control Record
	var cacId = nlapiSubmitRecord(cacrec, true);
	
	// Add Fields to form to hold Id 
	var controlRecId = form.addField('custpage_control_rec_id','select',null,'customrecord_cust_add_control','main');
	form.insertField(controlRecId,'custentity_urlbuilder');
	controlRecId.setDisplayType('hidden');
	form.setFieldValues({custpage_control_rec_id: cacId });
	
	if (mainAddCnt == 1)
	{
		nlapiSetFieldValue('custentity_disp_epterr_ctry', mainCountry);
		nlapiSetFieldValue('custentity_disp_epterr_state', mainState);
	}

}
