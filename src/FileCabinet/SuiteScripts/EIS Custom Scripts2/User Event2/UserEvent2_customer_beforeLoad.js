/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*
    Script: UserEvent2_customer_beforeLoad.js

    Created by: NS ACS

    Function: Button that redirects to Target/Key Account Notes Field History Suitelet
    
	Library Scripts Used:  library2_constants

    Revisions:
    kbseares	10/21/2019	Script created
    JOliver		11/25/2019	Released to Prod with Prod Clinet_script_file_id
    eAbramo		09/21/2020 	US671615 Only display MDR Sublist if there are MDR records under this CustID (JO - released on 6/2/2021)
    JOliver		12/25/2020	US739974 Only display Definitive Sublist if there are Definitive records under this CustID
    CNeale		03/25/2021	US734954 Transition fields - display & date selector 
    eAbramo		06/17/2021	US785373 DocuSign: Configure and Implement the Authentication for back-end call to DocLauncher API (PART 1)
    eAbramo		06/17/2021	US785080 DocuSign: Limit who can see DocuSign Button on Customer (for just Licensed Employees)
    eAbramo		06/17/2021	DocuSign - add Library Constants for Client File Ids
    eAbramo		09/29/2021	TA639823 Update the label of the 'Create New DocuSign Contract' button to 'Create Contract'
   	CNeale		03/15/2022	US905097 Transition Center changes - simplification of process
   	JOliver		05/06/2022	US942001 Only display Marshall Breeding Sublist if there are Marshall Breeding records under this CustID
	ZScannell	08/04/2022	US980702 Create custom sublist that contains Customer's tasks and messages
	eAbramo		05/09/2023	US1082642 Fix 'Tasks and Messages' sublist, the 'Has Attachment' column should show in view-mode
	CNeale		11/02/2023	US1163273 Only display Definitive Health Contacts Sublist if there are records for this Customer
	ZScannell	07/16/2024	US1277418 - Adding WinSer button using OAuth2.0	(Re-positioned in script so it is the first button on page)
*/


define(['N/record', 'N/runtime', 'N/ui/serverWidget', 'N/url', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/format', 'N/config'],

	function(record, runtime, serverWidget, url, search, LC2Constant, format, config) {

		/**
		 * Function definition to be triggered before record is loaded.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {string} scriptContext.type - Trigger type
		 * @param {Form} scriptContext.form - Current form
		 * @Since 2015.2
		 */
		function customerBeforeLoad(scriptContext) {
			log.debug('Start of CustomerBeforeLoad UE2_customer_beforeLoad.js')

			// set Variables to store Customer Object and Customer Internal ID
			var cust_rec = scriptContext.newRecord;   // Current record
			var cust_id  = cust_rec.getValue({fieldId: 'id'});
			// log.debug('cust_id is ', cust_id);
			var form = scriptContext.form;

			// US734954 Define variables
			var role = runtime.getCurrentUser().role;   // User role
			var user_id = runtime.getCurrentUser().id	// User Employee ID  // US785080
			var transEdit = LC2Constant.LC2_Role.TransStsDte(role);  // Role allowed to Edit Transition fields
			// US905097 No longer require Transition Date Override functionality
			var webForm = false;  // Web Form indicator
			if (cust_rec.getValue('customform') == LC2Constant.LC2_Form.WebCustomer){
				webForm = true;
				log.debug('webForm', webForm)
			}
			var showEDS = LC2Constant.LC2_Transition_Show.EDS;  // Should EDS Transition fields be shown
			log.debug('showEDS ', showEDS);
			var showeHost = LC2Constant.LC2_Transition_Show.eHost;  // Should eHost Transition fields be shown
			var showExplora = LC2Constant.LC2_Transition_Show.Explora;  // Should Explora Transition fields be shown
			var showRefCtr = LC2Constant.LC2_Transition_Show.RefCtr;  // Should Ref Center Transition fields be shown

			var SWhidden = serverWidget.FieldDisplayType.HIDDEN; // Display type hidden for use with UI server widget
			var SWinline = serverWidget.FieldDisplayType.INLINE; // Display type inline for use with UI server widget
			var SWdisabled = serverWidget.FieldDisplayType.DISABLED; // Display type disabled for use with UI server widget


			// log.debug('runtime.executionContext is ', runtime.executionContext);
			if (runtime.executionContext != runtime.ContextType.WEBSERVICES)  //Add Web Service Role exclusion to this code
			{
				if(scriptContext.type=='edit' || scriptContext.type=='view')
				{
					//	US1277418 - Adding WinSer button using OAuth2.0	(Re-positioned in script so it is the first button on page)
					//	Must be active
					if (cust_rec.getValue({fieldId: 'isinactive'}) == false) {
						//	Must be OE Approved
						if (cust_rec.getValue({fieldId: 'custentity_oeapproved'}) == true) {
							//	User must be either a Sales or Support Rep
							var employeeLookup = search.lookupFields({
								type: search.Type.EMPLOYEE,
								id: user_id,
								columns: ['issupportrep', 'issalesrep']
							});
							if (employeeLookup.issupportrep == true || employeeLookup.issalesrep == true) {
								//	Don't render if in Cuba (or another Sales Restricted country)
								var epCountry = cust_rec.getValue({fieldId: 'custentity_epcountry'});
								if (LC2Constant.LC2_Country.isSalesRestricted(epCountry) == false) {
									form.addButton({
										id: 'custpage_oidcWinserButton',
										label: 'WinSeR',
										functionName: "sendWinSRRequest()"
									});
								}
							}
						}
					}
					//Create button that redirects to Target/Key Account Notes Field History Suitelet
					var CLIENT_SCRIPT_FILE_ID = LC2Constant.LC2_ClientScript_FileID.TargetKeyAccount_client_file;
					form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
					form.addButton({
						id:'custpage_button1',
						label:'Target/Key Account Notes Field History',
						functionName:"openSuitelet()"
					}); // end Target/Key Account Notes button

					// US785373 Create Button that opens Suitelet that triggers call to DocuSign APIs
					// US785080 -- only create button if the Employee has a DocuSign License
					var employee_lookup1 = search.lookupFields({
						type: search.Type.EMPLOYEE,
						id: user_id,
						columns: ['custentity_has_docusign_license']
					});

					if(employee_lookup1.custentity_has_docusign_license == true){
						form.addButton({
							id:'custpage_new_docusign_contract',
							label:'Create Contract',  	// TA639823 Updated label 9-29-21
							functionName:"openDocuSignSuitelet()"
						});
					}


					// BEGIN US671615 Only display MDR Sublist if there are MDR records under this CustID
					var mdr_Search = search.create({
						type: search.Type.CUSTOM_RECORD + '_mdr_education',
						columns: ['internalid'],
						filters: ['custrecord_mdr_customer', 'anyof', cust_id]
					});
					var mdrResultSet = mdr_Search.run().getRange(0,50);
					// log.debug('mdrResultSet', mdrResultSet);
					if (mdrResultSet == '')
					{
						// log.debug('no results in the search mdrResultSet.');
						var mdr_sublist = form.getSublist({id: 'recmachcustrecord_mdr_customer'});
						if (mdr_sublist) // if user doesn't have permissions to the sublist it won't exist - next line yields an error
						{
							mdr_sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
						}
					};
					// END code to determine if to display the MDR Sublist - only display if there are MDR records under this CustID

					// BEGIN US671615 Only display Definitive Health Sublist if there are Definitive records under this CustID
					// US1163273 Expand to only display Definitive Health Contacts Sublist if there are any present under this CustID
					var dhResultSet_Con; //US1163273 declare def health contact search results
					var dh_Search = search.create({
						type: search.Type.CUSTOM_RECORD + '_definitive_health',
						columns: ['internalid'],
						filters: ['custrecord_dh_customer', 'anyof', cust_id]
					});
					var dhResultSet = dh_Search.run().getRange(0,50);
					if (dhResultSet == '') {  // No Definitive Health Records so do NOT display sub-tab
						var dh_sublist = form.getSublist({id: 'recmachcustrecord_dh_customer'});
						if (dh_sublist)  // if user doesn't have permissions to the sublist it won't exist - next line yields an error
						{
							dh_sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
						}
					} else {
						// US1163273 Definitive Health Customer exists so check for Contacts
						var dh_Search_Con = search.create({
							type: search.Type.CUSTOM_RECORD + '_definitive_health_contacts',
							columns: ['internalid'],
							filters: ['custrecord_dhc_ns_customer', 'anyof', cust_id]
						});
						dhResultSet_Con = dh_Search_Con.run().getRange(0,50);
					}
					// US1163273 If there's no DH Customer or there is but there are no DH Contacts then don't display the DH Contact sublist
					if (dhResultSet == '' || (dhResultSet != '' && dhResultSet_Con == '')) {
						var dh_sublist_Con = form.getSublist({id: 'recmachcustrecord_dhc_ns_customer'});
						if (dh_sublist_Con)  // if user doesn't have permissions to the sublist it won't exist - next line yields an error
						{
							dh_sublist_Con.displayType = serverWidget.SublistDisplayType.HIDDEN;
						}
					}
					// END code to determine if to display the Definitive Health Sublist & Definitive Health Contacts Sublist

					// BEGIN US942001 Only display Marshall Breeding Sublist if there are Marshall Breeding records under this CustID
					var mb_Search = search.create({
						type: search.Type.CUSTOM_RECORD + '_marshall_breeding',
						columns: ['internalid'],
						filters: ['custrecord_mb_customer', 'anyof', cust_id]
					});
					var mbResultSet = mb_Search.run().getRange(0,50);
					if (mbResultSet == '')
					{
						var mb_sublist = form.getSublist({id: 'recmachcustrecord_mb_customer'});
						if (mb_sublist)  // if user doesn't have permissions to the sublist it won't exist - next line yields an error
						{
							mb_sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
						}
					};
					// END code to determine if to display the Marshall Breeding Sublist
				};	// end type is Edit or View

				/*********************************************************************************************************************
				 * Transition Field Processing
				 **********************************************************************************************************************/
				log.debug('Start of Transition Processing', 'cust_id = '+cust_id);

				handleTransFields(LC2Constant.LC2_Transition_typ.EDS, showEDS);
				handleTransFields(LC2Constant.LC2_Transition_typ.eHost, showeHost);
				handleTransFields(LC2Constant.LC2_Transition_typ.Explora, showExplora);
				handleTransFields(LC2Constant.LC2_Transition_typ.RefCtr, showRefCtr);

				/*********** Transition Field Processing End ****************************************************************/
				/*****************************************************************************************************
				 * 	US980702 - Code to create a custom subtab + sublist that will contain the customer's messages and
				 *	tasks for the Outlook/NetCRM integration.
				 ****************************************************************************************************/

				// Only run if existing customer + not the Web Service Form
				if ((cust_id != '' && cust_id != null) && form != LC2Constant.LC2_Form.WebCustomer){
					log.debug({
						title: 'Start of US980702 Code'
					});
					var today = new Date();
					var today2 = new Date();
					var oneYearAgo = toNSSearchableDate(new Date(today2.setMonth(today2.getMonth() - 12)));
					today = toNSSearchableDate(today);
					log.debug({
						title: 'today',
						details: today
					});
					log.debug({
						title: 'oneYearAgo',
						details: oneYearAgo
					})

					// Run search to look for tasks (within 1 year) associated with the customer
					var taskSearch = search.create({
						type: search.Type.TASK,
						columns: ['internalid', 'title', 'custevent_tasktype', 'message', search.createColumn({name: 'startdate', sort: search.Sort.DESC}), 'duedate', 'status', 'assigned'],
						filters: [
							search.createFilter({
								name: 'company',
								operator: search.Operator.IS,
								values: cust_id
							}),
							search.createFilter({
								name: 'startdate',
								operator: search.Operator.WITHIN,
								values: [oneYearAgo, today]
							})
						]
					}).run().getRange({start: 0, end: 1000});

					// Run search to look for messages (within 1 year) associated with the customer
					var messageSearch = search.create({
						type: search.Type.MESSAGE,
						columns: ['internalid', 'subject', 'message', search.createColumn({name: 'messagedate', sort: search.Sort.DESC}), 'recipient', 'author', 'recipientemail', 'authoremail', 'hasattachment'],
						filters: [
							search.createFilter({			// Join on Customer to get Internal ID
								name: 'internalid',
								join: 'customer',
								operator: search.Operator.IS,
								values: cust_id
							}),
							search.createFilter({
								name: 'messageDate',
								operator: search.Operator.WITHIN,
								values: [oneYearAgo, today]
							}),
							search.createFilter({					//Remove comment when Outlook integration is live, NetCRM created messages have no externalId
								name: 'externalidstring',
								operator: search.Operator.ISNOT,
								values: ''
							})
						]
					}).run().getRange({start: 0, end: 1000});

					log.debug({
						title: 'taskSearch',
						details: taskSearch
					});
					log.debug({
						title: 'messageSearch',
						details: messageSearch
					});


					var combinedSearchResults = taskSearch.concat(messageSearch);	// Combine search results
					combinedSearchResults.sort(customSort);		// Use function customsort to sort in reverse chronological order
					log.debug({
						title: 'combinedSearchResults',
						details: combinedSearchResults
					});


					// Create Subtab
					var outlookSubtab = form.addSubtab({
						id: 'custpage_outlooksubtab',
						label: 'Tasks and Messages'
					});
					form.insertSubtab({			// Insert subtab before the "Tasks (Excluding Messages)" subtab as per request
						subtab: outlookSubtab,
						nextsub: 'opportunities'
					});
					// Create Sublist
					var outlookSublist = form.addSublist({
						id: 'custpage_outlooksublist',
						label: 'Tasks and Messages',
						tab: 'custpage_outlooksubtab',
						type: serverWidget.SublistType.STATICLIST
					});
					// Loop through Tasks to add to Sublist

					var fieldList = {										// JSON containing the information to create and populate the fields
						internalid: {
							taskId: 'internalid',
							messageId: 'internalid',
							sublistFieldId: 'custpage_internalid',
							label: 'ID',
							type: serverWidget.FieldType.TEXT
						},
						title: {
							taskId: 'title',
							messageId: 'subject',
							sublistFieldId: 'custpage_title',
							label: 'Title',
							type: serverWidget.FieldType.TEXT
						},
						taskType: {
							taskId: 'custevent_tasktype',
							messageId: null,
							sublistFieldId: 'custpage_type',
							label: 'Type',
							type: serverWidget.FieldType.TEXT
						},
						notes: {
							taskId: 'message',
							messageId: 'message',
							sublistFieldId: 'custpage_preview',
							label: 'Preview',
							type: serverWidget.FieldType.TEXT
						},
						startDate: {
							taskId: 'startdate',
							messageId: 'messagedate',
							sublistFieldId: 'custpage_date',
							label: 'Date Message Received',
							type: serverWidget.FieldType.DATE
						},
						dueDate: {
							taskId: 'duedate',
							messageId: null,
							sublistFieldId: 'custpage_followupdate',
							label: 'Follow-Up Date',
							type: serverWidget.FieldType.DATE
						},
						status: {
							taskId: 'status',
							messageId: null,
							sublistFieldId: 'custpage_status',
							label: 'Task Status',
							type: serverWidget.FieldType.TEXT
						},
						assigned: {
							taskId: 'assigned',
							messageId: 'recipient',
							sublistFieldId: 'custpage_assignedrecipient',
							label: 'Assigned or Recipient',
							type: serverWidget.FieldType.TEXT
						},
						recipientEmail: {
							taskId: null,
							messageId: 'recipientemail',
							sublistFieldId: 'custpage_assignedrecipientemail',
							label: 'Recipient Email',
							type: serverWidget.FieldType.TEXT
						},
						// Add recipient Email
						sender: {
							taskId: null,
							messageId: 'author',
							sublistFieldId: 'custpage_sender',
							label: 'Sender',
							type: serverWidget.FieldType.TEXT
						},
						// Add Author Email
						senderEmail: {
							taskId: null,
							messageId: 'authoremail',
							sublistFieldId: 'custpage_senderemail',
							label: 'Sender Email',
							type: serverWidget.FieldType.TEXT
						},
						// Add Has Files
						hasAttachment: {
							taskId: null,
							messageId: 'hasattachment',
							sublistFieldId: 'custpage_hasattachment',
							label: 'Has Attachment',
							type: serverWidget.FieldType.TEXT // US1082642 used to be serverWidget.FieldType.CHECKBOX
						}
					};
					// Create fields for Sublist
					for (var field in fieldList){
						outlookSublist.addField({
							id: fieldList[field].sublistFieldId,
							type: fieldList[field].type,
							label: fieldList[field].label
						});
					}

					// Loop through the combined results
					for (var i = 0; i < combinedSearchResults.length; i++){
						var result = combinedSearchResults[i];
						// If it's a task
						if (result.recordType == 'task'){
							// Set the proper fields for Tasks only
							for (var field in fieldList){
								var fieldValue = null;
								if (fieldList[field].taskId != null){	// Only set those fields necessary for the task record
									fieldValue = result.getText({name: fieldList[field].taskId});
									if (fieldValue == null){
										fieldValue = result.getValue({name: fieldList[field].taskId});
									}
									if (fieldList[field].type == serverWidget.FieldType.DATE){	// Format Dates properly
										var fieldValue_A = format.parse({value: fieldValue, type: format.Type.DATE});	// "Grabbing the value of a date field returns a string" - Gale Cortez, NetSuite Support Rep 2022-08-18
										fieldValue = format.format({value: fieldValue_A, type:format.Type.DATE});
									}
									if (fieldList[field].taskId == 'internalid'){	// Create View button
										fieldValue = '<a href="'+ url.resolveRecord({recordType: 'task', recordId: fieldValue, isEditMode: false}) +'">View</a>'
									}
									if (fieldList[field].taskId == 'message'){
										fieldValue = LC2Constant.LC2_cleanMessage(fieldValue)
										fieldValue = fieldValue.replace(/[\r\n]+/gm, '\n');
										fieldValue = fieldValue.slice(0, 298);
									}
									if (fieldValue != null && fieldValue != ''){
										outlookSublist.setSublistValue({
											id: fieldList[field].sublistFieldId,
											line: i,
											value: fieldValue
										});
									}
								}
							}
						}
						else{	// Else it's a message
							// Set the proper fields for Messages
							// Set the proper fields for Tasks only
							for (var field in fieldList){
								var fieldValue = null;
								if (fieldList[field].messageId != null){	// Only set those fields necessary for the task record
									fieldValue = result.getText({name: fieldList[field].messageId});
									if (fieldValue == null){
										fieldValue = result.getValue({name: fieldList[field].messageId});
									}
									if (fieldList[field].type == serverWidget.FieldType.DATE){	// Format Dates properly
										var fieldValue_B = format.parse({value: fieldValue, type: format.Type.DATE});
										fieldValue = format.format({value: fieldValue_B, type:format.Type.DATE});
									}
									if (fieldList[field].messageId == 'internalid'){	// Create View button
										fieldValue = '<a href="'+ url.resolveRecord({recordType: 'message', recordId: fieldValue, isEditMode: false}) +'">View</a>'
									}
									if (fieldList[field].messageId == 'message'){
										fieldValue = LC2Constant.LC2_cleanMessage(fieldValue)
										fieldValue = fieldValue.replace(/[\r\n]+/gm, '\n');
										fieldValue = fieldValue.slice(0, 298);
									}
									if (fieldList[field].messageId == 'hasattachment'){
										if (fieldValue == true){
											fieldValue = 'Yes'; // US1082642 used to be 'T'
										}
										else{
											fieldValue = 'No'; // US1082642 used to be 'F'
										}
									}
									if (fieldValue != null && fieldValue != ''){
										outlookSublist.setSublistValue({
											id: fieldList[field].sublistFieldId,
											line: i,
											value: fieldValue
										});
									}
								}
							}
							outlookSublist.setSublistValue({	// Hardcode in "MESSAGE" for Type column
								id: 'custpage_type',
								line: i,
								value: 'Message'
							});
						}

					}
				}

				/*****************************************************************************************************
				 * 											End of US980702 										 *
				 ****************************************************************************************************/
			};// end web services execution context exclusion

			/*********************************************************************************************************************
			 * Additional Functions (within customerBeforeLoad function) Start Here
			 **********************************************************************************************************************/
			/* *************************************************************************************************************************
                Handles the main Transition field processing - displaying/protecting fields & building date selector
                Input: Transition Type
                       Transition Type to be shown
            ****************************************************************************************************************************/
			function handleTransFields(transType, showTrans) {
				// US905097 No longer used: Default Transition Date & Transition Cohort
				//                          Transition Date Selector
				//          All processing related to these removed

				var status ='';
				var statusFld ='';
				var dateFld = '';
				var dateSetByFld = '';
				var searchName = '';

				switch (transType) {
					case(LC2Constant.LC2_Transition_typ.EDS) :
						statusFld = 'custentity_eds_transition_status';
						dateFld = 'custentity_eds_transition_date';
						dateSetByFld = 'custentity_eds_transition_dte_setby';
						break;
					case(LC2Constant.LC2_Transition_typ.eHost) :
						statusFld = 'custentity_ehost_transition_status';
						dateFld = 'custentity_ehost_transition_date';
						dateSetByFld = 'custentity_ehost_transition_dte_setby';
						break;
					case(LC2Constant.LC2_Transition_typ.Explora) :
						statusFld = 'custentity_explora_transition_status';
						dateFld = 'custentity_explora_transition_date';
						dateSetByFld = 'custentity_explora_transition_dte_setby';
						break;
					case(LC2Constant.LC2_Transition_typ.RefCtr) :
						statusFld = 'custentity_refctr_transition_status';
						dateFld = 'custentity_refctr_transition_date';
						dateSetByFld = 'custentity_refctr_transition_dte_setby';
						break;
				}

				status = cust_rec.getValue(statusFld);

				if (scriptContext.type == scriptContext.UserEventType.CREATE || showTrans == false ) {
					form.getField({id: statusFld}).updateDisplayType({displayType : SWhidden});
					form.getField({id: dateFld}).updateDisplayType({displayType : SWhidden});
					form.getField({id: dateSetByFld}).updateDisplayType({displayType : SWhidden});
				}

				if((scriptContext.type == scriptContext.UserEventType.EDIT && transEdit == false) && webForm == false && showTrans == true)
				{
					form.getField({id: statusFld}).updateDisplayType({displayType : SWinline});
					form.getField({id: dateFld}).updateDisplayType({displayType : SWinline});
					form.getField({id: dateSetByFld}).updateDisplayType({displayType : SWinline});
				}

				// US734954 In Edit mode if the role is allowed to update Transition Fields then build out date selector lists and add to form as required
				// US905907 No longer use date selector or want to restrict setting Status field
				if(scriptContext.type == scriptContext.UserEventType.EDIT && transEdit == true && webForm == false && showTrans == true){
					// US905097 Protect Date Set by field & protect Date field if status is not Complete
					form.getField({id: dateSetByFld}).updateDisplayType({displayType : SWdisabled});
					if (status != LC2Constant.LC2_Transition_sts.Complete){
						form.getField({id: dateFld}).updateDisplayType({displayType : SWdisabled});
					}
				}
			}

			/*	Name: toNSSearchableDate
             * 	Input: Date
             * 	Returns: Formatted Date
             * 	Notes: Stolen from StackOverflow as others were having an issue where NetSuite date searches reject DateTime obj and wants it as mm/dd/yyyy
             * */
			function toNSSearchableDate(date) {
				var formatted = format.format({ value: date, type: format.Type.DATE});
				return formatted.replace(/(:\d{2}):\d{1,2}\b/, '$1');
			}
			/*	Name: customSort
             * 	Input: a, b
             * 	Returns: Date Object
             * 	Notes:
             * */
			function customSort(a, b){
				if (a.recordType == 'task'){
					var date1_parse = format.parse({value: a.getValue({name: 'startdate'}), type: format.Type.DATE});
				}
				else{
					var date1_parse = format.parse({value: a.getValue({name: 'messagedate'}), type: format.Type.DATE});
				}
				if (b.recordType == 'task'){
					var date2_parse = format.parse({value: b.getValue({name: 'startdate'}), type: format.Type.DATE});
				}
				else{
					var date2_parse = format.parse({value: b.getValue({name: 'messagedate'}), type: format.Type.DATE});
				}
				log.debug({
					title: 'date1_parse',
					details: date1_parse
				});
				log.debug({
					title: 'date2_parse',
					details: date2_parse
				});
				log.debug({
					title: '(date1_parse - date2_parse) * -1',
					details: JSON.stringify((date1_parse - date2_parse) * -1)
				});


				return (date1_parse - date2_parse) * -1; // Using format.parse returns a date object
			}

		} // End of beforeLoad function


		return {
			beforeLoad: customerBeforeLoad,
		};

	});