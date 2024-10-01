// script: 		userEvent_opportunity_before_load.js
// Created by: EBSCO Information Services - Date Unknown 
//
// Functions:  	serverOpptyBeforeLoad(type, form) - Before Load UserEvent function
//
// Features:
//				Builds bridge to the eBook Quote Tool in eBook Quote Opportunity
//				Builds bridge to WSR application in the WSR Opportunity -- RETIRED WSR in 2014, 2015 or 2016
//				Builds bridge to Flipster Order Link in the Flipster Opportunity
//				Foreign Currency Code from the olden days (WSR Opportunity) -- RETIRED WSR in 2014, 2015 or 2016
//
//	Revisions: 
//		eabramo		2016-11-21	US179957 Add code so that Flipster Order Link isn't available to six Segments
//		eabramo		2018-10-15	DE34951		Update Quote Tools does not work with multiple subject sets (change delimiter)
//		K McCormack	2019-08-15  US419604 - Marketo - Add additional information to the Marketo Activity record in NetCRM (Phase 1)
//								Add logic to parse the MKTO Activity number out of the custbody_inferred_lead_data field 
//								and perform a search for the associated Marketo Activity record to get its internal id so 
//								we can build a direct link to that record
//		K McCormack	2019-08-28  US543798 - Marketo - Add additional information to the Marketo Activity record in NetCRM (Phase 2)
//								Follow-up to US419604: Marketing has identified that the Marketo Activity record which we display
//								a link to on the MLO should be determined by the following criteria, and NOT from the Interesting Moment
//								which caused the MLO creation:
//									find the most recent Marketo activity (prior to the Opportunity's creation) for the associated MKTO Lead
//									with an Activity type of "Fill Out Form" and AssetName which begins "FT" 
//		eAbramo		2021-02-22	US765127 Script fix for Sales Case Type field.  Found error with US419604/US543798 code in using LC_Forms
//									constant instead of separate constant representing the OpportunityFormType field.  Added LC_OppFormType
//		eAbramo		2024-07-29	US1277419 SuiteSign-On Deprecation and use NS as OIDC provider - Authenticate using OAUTH 2.0 for Flipster link
//								also deprecating the WSR code which has NOT been used since 2014,2015 or 2016
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function serverOpptyBeforeLoad(type, form)
{
	// Functional scoped variables
	var cust_nskey = nlapiGetFieldValue("entity");
	var modeField = null;
	var usChange = 0;
	var usChangeString = '';
	var usPrev = null;
	var usProjected = null;
	var formType = nlapiGetFieldValue('custbody_oppty_form_type');
	var flip_status = nlapiGetFieldValue('custbody_flp_oppty_status');
	// Constants added for US1277419
	var flipsterOpptyStatus = {
		InProgress:		'1',
		Submitted:		'2'
	}

	/*
	* Currently transaction column fields do not support "inline text" field display. As such links created with
	* formulas display raw HTML when viewed in edit mode. custpage_hidden_mode is hidden field added to the form with a
	* default value equal to type (the mode in which the form is viewed). This field is then read in the sales order
	* link formula field to alter formula output depending if type = "view". Otherwise formula is suppressed to avoid
	* seeing raw HTML
	*/
	if ((type == "view") || (type == "create") || (type == "edit"))
	{
		modeField = form.addField("custpage_hidden_mode", "text", "Mode", null, "main");
		modeField.setDefaultValue(type);
		modeField.setDisplayType("hidden");
	}



	// BEGIN BRIDGE TO  FLIPSTER
		// formType of 1 = WSR - If the Flipster Opportunity Status has a value then it's a Flipster
	// if (formType == '1' || flip_status == '1' || flip_status == '2')
	// US1277419 changing above line to next line
	if (flip_status == flipsterOpptyStatus.InProgress || flip_status == flipsterOpptyStatus.Submitted) {
		if (type == "view")
		{
			// BRIDGE TO FLIPSTER CHECK 1-  Only run if user is a Sales Rep
			if (nlapiLookupField('employee', nlapiGetUser(), 'issalesrep') == 'T')
			{
				// BRIDGE TO FLIPSTER CHECK 02 - Customer must be OE Approved
				if (nlapiGetFieldValue('custbody_parent_oeapproved') == 'T')
				{
					// US1277419 SuiteScripts for OIAPP Buttons (Flipster link)
					// WSR was retired in 2014, 2015 or 2016 -- custcol_includein_quote_order has not been on any valid Opportunity form in many years

					// BRIDGE TO FLIPSTER CHECK 3 - Must be In Progress
					// Begin Flipster code - Render "Send Flipster Order Tool to Customer" link
					// if Flipster Opportunity Status is "In Progress" (1)
					// else if (flip_status == 1) //US1277419 - replace with below if statement
					if (flip_status == flipsterOpptyStatus.InProgress) {
						// 2016-11-21 US179957 Add verification that Customer is not in one of these 6 Segments)
						// Check 4 - Exclude certain Segments
						var segment = nlapiLookupField('customer', cust_nskey, 'custentity_marketsegment');
						// if (segment=='32'||segment=='59'|| segment=='62'||segment=='63'||segment=='61'||segment=='60' ) // updated code as part of US1277419
						if(segment == LC_Segment.SchDist || LC_Segment.IsGroupSegment(segment) == true) {
							flipster_link_field = form.addField("custpage_flipsterlink", "text", "Link to Send Flipster Order", null, "main");
							flipster_link_field.setDefaultValue("The Flipster Order Link cannot be sent out to Customers under a Group Segment or under the School District segment");
							form.insertField(flipster_link_field, "custbody_oppty_form_type");								
						}
						// Check 5 - Verify contact has email address
						else if(nlapiGetFieldValue('custbody_quote_contact_email') != '' && nlapiGetFieldValue('custbody_quote_contact_email') != null)
						{
							// Check 6 verify valid non-zero FTE
							if (nlapiGetFieldValue('custbody_sourced_fte') > 0)
							{	// Render Flipster URL
								flipster_link_field = form.addField("custpage_flipsterlink", "url", "Link to Send Flipster Order", null, "main");
								// US1277419 SuiteScripts for OIAPP Buttons (Flipster link) -- commenting out original Flipster Order Link.  Adding new link
									// flipster_link_field.setDisplayType("inline").setLinkText("Send Flipster Order Form").setDefaultValue( "/app/site/hosting/scriptlet.nl?script=91&deploy=1&opportunityId="+nlapiGetFieldValue('id'));
								var this_environment = nlapiGetContext().getEnvironment();
								var url = "";
								nlapiLogExecution('DEBUG','this_environment is ', this_environment);
								if(this_environment == 'PRODUCTION'){
									url = "https://oi.epnet.com/OIApp/api/homeForOIApp/oauth2?opportunityId=";
								}
								else{
									url = "https://qa-oi.epnet.com/OIApp/api/homeForOIApp/oauth2?opportunityId=";
								}
								flipster_link_field.setDisplayType("inline").setLinkText("Send Flipster Order Form").setDefaultValue(url+nlapiGetFieldValue('id'));
								form.insertField(flipster_link_field, "custbody_oppty_form_type");
							}
							else
							{	// FTE is null or zero
								flipster_link_field = form.addField("custpage_flipsterlink", "text", "Link to Send Flipster Order", null, "main");
								flipster_link_field.setDefaultValue("In order to send this customer the Flipster Order Form the Customer must have a non-zero FTE value");
								form.insertField(flipster_link_field, "custbody_oppty_form_type");						
							}
						}
						else
						{	// Contact doesn't have email address
							flipster_link_field = form.addField("custpage_flipsterlink", "text", "Link to Send Flipster Order", null, "main");
							flipster_link_field.setDefaultValue("In order to send this customer the Flipster Order Form the Flipster Contact selected must have an email address.  Edit the Contact record and add an email address");
							form.insertField(flipster_link_field, "custbody_oppty_form_type");					
						}
					} // End FlipStatus is InProgress
				} // end OE Approved
				else
				{	// Customer not OE Approved
					make_quote_field = form.addField("custpage_makequote", "text", "Link to Send Flipster Order", null, "main");
					make_quote_field.setDefaultValue("This customer must be approved by Order Processing");
					form.insertField(make_quote_field, "custbody_oppty_form_type");		
				}
			} // end user is Sales Rep
			else
			{	// Not a Sales Rep
				make_quote_field = form.addField("custpage_makequote", "text", "Link to Send Flipster Order", null, "main");
				make_quote_field.setDefaultValue("Only sales reps can create quotes/orders, or send Flipster Order forms");
				form.insertField(make_quote_field, "custbody_oppty_form_type");		
			}
		} // end type = view
	}	// END fLIPSTER OPPORTUNITY

	nlapiSetFieldValue('custbody_change_usd', 'pooh', false, true);


	if ((type == "view") || (type == "edit"))
	{	// calculate percent change to populate 'custbody_change_usd'
		usProjected = Number(nlapiGetFieldValue("projectedtotal"));
		usPrev = Number(nlapiGetFieldValue("custbody_previous_usd"));
		nlapiLogExecution('DEBUG','usProjected is '+usProjected+'. usPrev is '+usPrev);
		// calculate % US change
		if (!isNaN(usPrev) && (usPrev != 0)) {
			usChange = Math.round(((usProjected - usPrev) / usPrev) * 100 * 10) / 10;
		}
		// formats the % change
		if (usChange > 0) {
			usChangeString = "+" + usChange + "%";
		}
		else if (usChange < 0) {
			usChangeString = usChange + "%";
		}
		else {
			usChangeString = null;
		}
		nlapiLogExecution('DEBUG','usChangeString is '+usChangeString);
		nlapiSetFieldValue('custbody_change_usd', usChangeString, false, true);

		// Hide the standard field called Projected Total
		// if the Opportunity Form Type is WSR (1) or Winser (4)
		// if (formType == '1' || formType == '4') //US1277419 remove formType == 1 // VERY old code replaced by below
		if (formType == LC_OppFormType.WinSeR) {
			var hideProjectedTotal = nlapiGetField('projectedtotal');
			hideProjectedTotal.setDisplayType('hidden');
		}

	} // end type = view or edit
	
	//08-15-19 CMM - US419604: If this MLO was generated from some Marketo Activity, we want to build a link to that Activity record.
	//08-28-19 CMM - US543798: (Phase 2) If this MLO was generated from some Marketo Activity, use new logic to build a link to the most recent "Fill Out Form" Activity record
	//				 which has an assetName starting with "FT"
	if (formType == LC_OppFormType.MarketingLead)  	// US765127 Fixed Constant name
	{		
		//read LeadID and LeadDateReceived info from the Oppty record. 
		var MKTOLeadID = nlapiGetFieldValue('custbody_mkto_lead_id');
		var MKTOInfoToDisplay = '';  //default is to show empty activity link field
		
		nlapiLogExecution('DEBUG','var MKTOLeadID='+MKTOLeadID);
				
		if(MKTOLeadID && MKTOLeadID != null) {
			var validDate = true;
			var leadRecvd1 = nlapiGetFieldValue('custbody_lead_date_received');
			nlapiLogExecution('DEBUG','var leadRecvd1', leadRecvd1);
			
			var leadRecvd2 = nlapiStringToDate(leadRecvd1,'datetimetz');
			nlapiLogExecution('DEBUG','var leadRecvd2', leadRecvd2);
			
			var MKTOLeadRecvdTimeStamp = '';
			try {
				MKTOLeadRecvdTimeStamp = nlapiDateToString(leadRecvd2, 'datetime');
			}
			catch(e) {
				validDate = false;
				nlapiLogExecution('DEBUG','*** MKTOLeadRecvdTimeStamp cannot be correctly formatted so bypass search for Mkto activity');
			}
			if(validDate) {
				//var MKTOLeadRecvdTimeStamp = nlapiDateToString(nlapiStringToDate(nlapiGetFieldValue('custbody_lead_date_received'),'datetimetz'), 'datetime');	
				nlapiLogExecution('DEBUG','var MKTOLeadRecvdTimeStamp='+MKTOLeadRecvdTimeStamp);
			
				//Build a search which will return Marketo Activity records for this LeadID (with the necessary activity type and asset name) which occurred BEFORE this 
				//particular MLO was kicked off from Marketo.  The results are sorted in descending timestamp order, so most recent activity prior to this MLO appears first.
				var filters = new Array();			
				filters.push(new nlobjSearchFilter('custrecord_muv_marketoleadid', null, 'is', MKTOLeadID));
				filters.push(new nlobjSearchFilter('custrecord_muv_activitydatetime', null, 'before', MKTOLeadRecvdTimeStamp));
				filters.push(new nlobjSearchFilter('custrecord_muv_activitytype', null, 'is', 'Fill Out Form'));
				filters.push(new nlobjSearchFilter('custrecord_muv_assetname', null, 'startswith', 'FT'));
				
				var columns = new Array();
				var column_internalid = new nlobjSearchColumn('internalid');
				var column_mktoactid = new nlobjSearchColumn('custrecord_muv_marketoactivityid');
				var column_activitydt = new nlobjSearchColumn('custrecord_muv_activitydatetime').setSort(true);		//This causes results to be ordered by DESCENDING activitydatetime
				columns.push(column_internalid);
				columns.push(column_mktoactid);
				columns.push(column_activitydt);
				
				nlapiLogExecution('DEBUG','Searching for Marketo Activities');
				var actresults = nlapiSearchRecord('customrecord_muv_marketoactivity',null,filters,columns);
				
				if(actresults)
				{	
					//following loop is for debug-troubleshooting purposes only to display contents of search results
					for(var z=0; z < actresults.length; z++)
					   {
					    var result=actresults[z];
					    var resultColumns=result.getAllColumns();			
					    // get the data from this search result row
						var actInternalID = result.getValue(resultColumns[0]);
						var actid = result.getValue(resultColumns[1]);
						var actDatetime = result.getValue(resultColumns[2]);														
						nlapiLogExecution('debug', 'result('+z+').Activity Internal and MKTO IDs:', actInternalID + ' ' + actid);							
						nlapiLogExecution('debug', 'result('+z+').Activity DateTime:', actDatetime);
					   }	
					
					//Take the first MKTO Activity record that fits our criteria because this one occurred just prior to the MLO being generated
					nlapiLogExecution('DEBUG','Found recent MKTO FT Activity, its ID is: ' + actresults[0].getId());
					//MKTOInfoToDisplay = '<a href="/app/common/custom/custrecordentry.nl?rectype=504&id='+actresults[0].getId()+'">Marketo Activity #'+ actresults[0].getValue('custrecord_muv_marketoactivityid')+'</a>';		
					MKTOInfoToDisplay = '<a href="/app/common/custom/custrecordentry.nl?rectype=504&id='+actresults[0].getId()+'">Marketo Activity ID '+actresults[0].getId()+'</a>';
					
				}
				else nlapiLogExecution('DEBUG','Cannot build link cuz MKTO Activity Rec search returned zero results.');		
			
				try {
					nlapiLogExecution('DEBUG','Setting genActLink on MLO',MKTOInfoToDisplay);
					nlapiSetFieldValue('custbody_mkto_oppty_gen_activity_link', MKTOInfoToDisplay);																
				}
				catch(e)
				{
					nlapiLogExecution('DEBUG','after finding MKTO Activity InternalID','error setting MKTO Activity Link field for this opportunity');
				}					
			}		
		}
	}	// end formType == LC_OppFormType.MarketingLead
}	// End serverOpptyBeforeLoad
