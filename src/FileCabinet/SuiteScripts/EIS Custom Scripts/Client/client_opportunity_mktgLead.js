// Script:     client_opportunity_mktgLead.js
//
// Created by: EBSCO Information Services - eabramo (May/June 2015) 
//
// Functions:  	1. marketingLeadFormLoad() - Page initialisation 
//              2. marketingLeadFieldChange() - Field changed processing 
//				3. marketingLeadFormSave() - Save record validation
// 
//	Revisions:  
//			eabramo		2017-03-21	Added code for Marketo Integration - on Save - due to possibility of Prospects 
//				not having Address/Territory or Segment on it - and knowing that the conversion of an Opportunity to 
//				"Closed - Won" actually also converts the Stage=Prospect into Stage= Customer 
//					ENSURE CUSTOMER HAS MAIN ADDRESS 
//					ENSURE CUSTOMER HAS A TERRITORY 
//					ENSURE CUSTOMER HAS A SEGMENT
//			eabramo 	2017-03-21	Ensure that there's only one Line Item per Opportunity 
//								also remove code related to Opportunity Item Status and require Reason Lost at header level			
//			eabramo		2017-03-21	Lead Assigned To field changes:  field setting change to NOT required so MUV tool can create new Oppty
//								Use this script to make the field required
//			eabramo		2018-02-21	US192395 - Rework in preparation for CRM/WinSeR/Marketo integration project
//			eabramo		2018-02-21  US192395 - Lock fields in MLO for WinSer integration
//			eabramo		2018-02-21	US192395 - Add Validation when users selects Lead Status of 'MQL-Send to Winser'
//			kmccormack	2018-02-21	US302111 - Add logic to open a new window on Save that calls the new writeMLO suitelet if
//						the MLO needs to be written to WinSeR
//			kmccormack  2018-03-01 DEFECT - Global variable writeToWinSR needs to be reset to false EVERY time field change routine is
//						called for lead status.  Otherwise, user can set status to "send to winser" and then set it to something else
//						prior to saving and the flag will be on and write to WinSeR... this is NOT good.
//			eabramo		2018-03-27	US348248	Add code to handle setting new Lead Status to '8 - Lead Success Convert to Customer'
//													for Prospect records.  
//												also includes code to NOT allow this Lead Status to be set when Customer is already a Stage of 'Customer'
//			eabramo		2018-05-07	DE30945 Allow eBook Subscriptions into WinSeR from MLO
//			pkelleher	2019-04-18	US475216 Allow Brianna's (Itz) new role (duplicate manager) to act like a Marketing role on MLO
//			pkelleher	2020-11-20	US730039 - Create new Reason(s) Lost value of "Lead Contact Unresponsive" and inactivate the Lead-Status value of "5-Lead Contact Unresponsive" (internal id = 9) (remove from code)
//			eabramo		2021-07-22	US806481 - Do Not allow Conversion to Customer if Address is 'No Street Address Provided'
//			eAbramo		2021-08-03	US775968 - Modify Contact Form (remove code related to custentity_areaspecialty)
//			eAbramo		2022-01-14	US893888 - Product Target Push to WinSer: Modify Marketing Lead Push to WinSer
//			pKelleher	2022-06-30	US966114 - Remove Lead-Status of 1-Lead Unqualified/Nurturning and replace that with 2-Lead Qualified 
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var leadStatusOnLoad = null;
// get "Lead - Contact Date" on load
var ContactDateOnLoad = nlapiGetFieldValue('custbody_lead_init_contact_date');

//KM 02-02-18:  US302111 - Add new global variable that will indicate when the MLO needs to be written to WinSeR
var writeToWinSR = false;

function marketingLeadFormLoad()
{
	// 2016-12-09 Display the Lead Assigned To as Mandatory
	nlapiSetFieldMandatory('custbody_lead_assigned_to', true);
	
	// if new record	
	if ( (nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null) )
	{
		// set 'Lead assigned To' to the current user
		nlapiSetFieldValue('custbody_lead_assigned_to', nlapiGetUser());
		
		// REMOVED BELOW 2 Lines of Code 02-19-2015
		// set Lead - Date Received to today		
		// var today1 = new Date();
		// nlapiSetFieldValue('custbody_lead_date_received', nlapiDateToString(today1, 'datetime'));
		
		// set the entity/Customer field to "ns231089 EBSCO Marketing Leads" 
		if (nlapiGetFieldValue('entity') == '' || nlapiGetFieldValue('entity') == null)
		{
			nlapiSetFieldValue('entity', '1387019');
		}
		// set the "Real" Opportunity Status to "1-Qualify" (7)
		nlapiSetFieldValue('entitystatus', '7');
	}
	else // this is not a new record
	{
		if (nlapiGetRole() != '3')
		{	// disable the customform field
			nlapiDisableField('customform', true);			
		}
	}
	// get the value of the lead status on load
	leadStatusOnLoad = nlapiGetFieldValue('custbody_lead_status');
	
	// US192395 Lock fields in MLO for WinSer integration
		/* The following Statuses require Lock		
			19	Won - Send to WinSeR
			10	WinSer 2-Dvlp
			11	WinSeR 3-Qte
			12	WinSer 4-Ngtn
			13	WinSer 5-Rnwl
			14	WinSer 6-POF/VRB
			15	WinSer 7-POFOut
			16	WinSer 8-POFIn
			17	WinSer 9-Won
			18	WinSer 10-Lost						
		*/
	if (leadStatusOnLoad=='19' || leadStatusOnLoad=='10' || leadStatusOnLoad=='11' || leadStatusOnLoad=='12' || leadStatusOnLoad=='13' || leadStatusOnLoad=='14' || leadStatusOnLoad=='15' || leadStatusOnLoad=='16' || leadStatusOnLoad=='17' || leadStatusOnLoad=='18')
	{
		nlapiDisableField('custbody_quote_contact', true); // Lead Contact
		nlapiDisableField('entity', true); // Customer
		nlapiDisableField('custbody_lead_status', true); // Lead Status	
		nlapiDisableLineItemField('item', 'item', true); // Item
		nlapiDisableLineItemField('item', 'amount', true); // Item Amount
		nlapiDisableField('entitystatus', true);  // Status
		nlapiDisableField('projectedtotal', true); // Projected Total
		nlapiDisableField('probability', true); // Probability
		// nlapiDisableField('weightedtotal', true);// Weighted Total (it is disabled by default)
		nlapiDisableField('expectedclosedate', true); //Expected Close Date
	}	
	
	// US475216 4.18.19
	// If user is a Marketing Role (LC_MktgRoles) or MuvData Web Service (LC_MuvDataWebSvc)
	var this_role = nlapiGetRole();
	// call function to determine whether role passed in is a Marketing role
	if(LC_Roles.IsMktgRole(this_role) || this_role == LC_Roles.MuvDataWebSvc)
	{	// and there is no Lead Status (this is a new Lead) - set Lead Status to "2-Lead Qualified)
	//	alert('leadStatusOnLoad is ' + leadStatusOnLoad);
		if (leadStatusOnLoad == '' || leadStatusOnLoad == null)
		{	// set Lead Status to 2-Lead Qualified
			nlapiSetFieldValue('custbody_lead_status', '2', false, true);
		}
		// lock down three Sales Fields
		nlapiDisableField('custbody_lead_notes_sales', true);
		nlapiDisableField('custbody_lead_init_contact_date', true);
		nlapiDisableField('custbody_lead_followup_date', true);
	}
	else
	{	// otherwise lock down Marketing Fields
		nlapiDisableField('custbody_lead_mktg_campaign_tactic', true);  
		nlapiDisableField('custbody_lead_source_marketo', true);  
		nlapiDisableField('custbody_lead_notes_mktg', true); 
	}

	// US192395 - Remove code here - regarding locking the Lead priority field
	// Disable fields that the Muv data web service needs to populate but people shouldn't populate via UI
	nlapiDisableField('salesrep', true);
	nlapiDisableField('custbody_oppty_form_type', true);
	nlapiDisableField('custbody_is_lead_oppty', true);
}

function marketingLeadFieldChange(type, name)
{
	// if User changes Lead - Sales Notes field
	if (name == 'custbody_lead_notes_sales')
	{	// if the Lead Contact Date isn't populated
		if (nlapiGetFieldValue('custbody_lead_init_contact_date') == ''|| nlapiGetFieldValue('custbody_lead_init_contact_date')==null)
		{
			if (nlapiGetFieldValue('custbody_lead_notes_sales') != '' && nlapiGetFieldValue('custbody_lead_notes_sales') != null)
			{	// and if Sales Comments are Added, then set the Lead Contact Date to today	
				var today = new Date();
				today_string = nlapiDateToString(today);
				nlapiSetFieldValue('custbody_lead_init_contact_date', today_string, false, true);
			}
		}
		// If Follow Up Date isn't populated
		if (nlapiGetFieldValue('custbody_lead_followup_date') == ''|| nlapiGetFieldValue('custbody_lead_followup_date')==null)
		{		
			if (nlapiGetFieldValue('custbody_lead_notes_sales') != '' && nlapiGetFieldValue('custbody_lead_notes_sales') != null)
			{	// and if Sales Comments are Added, then set the Follow Up Date to 7 days from today	
				var today2 = new Date();
				today2.setDate(today2.getDate()+7);
				var fDate= nlapiDateToString(today2);
				nlapiSetFieldValue('custbody_lead_followup_date', fDate, false, true);
			}
		}
	}

	//If user changes Lead Status
	if (name == 'custbody_lead_status')
	{	
		//MUST reset for EACH field change
		writeToWinSR = false;
		
		var lead_status = nlapiGetFieldValue('custbody_lead_status');
		// US192395: Don't Allow User to set Lead - Status to any SQL Statuses
		/*
			WinSer 2-Dvlp	10
			WinSeR 3-Qte	11
			WinSer 4-Ngtn	12
			WinSer 5-Rnwl	13
			WinSer 6-POF/VRB	14
			WinSer 7-POFOut	15
			WinSer 8-POFIn	16
			WinSer 9-Won	17
			WinSer 10-Lost	18
		*/
		if (lead_status=='10' || lead_status=='11' || lead_status=='12' || lead_status=='13' || lead_status=='14' || lead_status=='15' || lead_status=='16' || lead_status=='17' || lead_status=='18')
		{
			nlapiSetFieldValue('custbody_lead_status', leadStatusOnLoad, false, true);
			alert('Users are not allowed to set the Lead Status to a WinSeR value. The Lead Status has been reset to its original value');
		}

		// 2018-03-05 If Stage of Customer is Customer don't allow Lead Status
		// to 'Convert Prospect to Customer'
		if (lead_status == '21')
		{
			var customer = nlapiGetFieldValue('entity');
			var customer_stage = nlapiLookupField('customer', customer, 'stage');
			if (customer_stage == 'CUSTOMER')
			{
				nlapiSetFieldValue('custbody_lead_status', leadStatusOnLoad, false, true);
				alert('Lead Status of \'8 - Lead Success: Convert to Customer\' is reserved for Prospect Customers only. The Lead Status has been reset to its original value');
			}
			//2021-07-22 US806481 -- warning if address is still "[no street address provided]"
			var cust_addr = nlapiLookupField('customer', customer, 'address');
			if(cust_addr.indexOf('[no street address provided]') > 0)
			{
				alert('This Prospect\'s address is listed as "[no street address provided]" because it arrived through EBSCO.com.  Prior to saving this Opportunity as \'8 - Lead Success Convert to Customer\' you will need to edit the Prospect Customer and provide a valid address.');
			}			
		}

		// If user is a Marketing Role (LC_MktgRoles) or MuvData Web Service (LC_MuvDataWebSvc)
		// call function to determine whether role passed in is a Marketing role
		// US730039 - Lead - Status value of 5-Lead Contact Unresponsive internal id = 9 removed from code - value inactivated in NetCRM
		var this_role = nlapiGetRole();
		if (LC_Roles.IsMktgRole(this_role) || this_role == LC_Roles.MuvDataWebSvc)
		{
			// If user sets Lead Status to (4, 5, or 6) "4-Contacted", "8-Closed-Successful", "6-Closed-Unsuccessful/Lost"		
			// US192395 add (19, 20) "Won - Send to WinSeR", "Won (Books and Flipster)"
			if (lead_status == '4' || lead_status == '5' || lead_status == '6' || lead_status == '19' || lead_status == '20')
			{	// Give user error and set Lead Status back to original value
				alert('Marketing Roles cannot set the Lead Status to this value. The Lead Status has been reset to its original value')
				nlapiSetFieldValue('custbody_lead_status', leadStatusOnLoad, false, true);
			}
			// If User sets Lead Status to a 2 ("2-Qualified")
			if (lead_status == '2')
			{	// and if the customer is known
				var customer = nlapiGetFieldValue('entity');
				// and customer is not '1387019' (EBSCO Marketing Unqualified Leads customer)
				if (customer != '1387019' && (customer != '' && customer != null) )
				{	// set the "Lead Assigned To" field to be equal to the Sales Rep on the Customer and tell User Assign To changed
					var sales_rep = nlapiGetFieldValue('salesrep');
					// alert('sales_rep is: '+sales_rep);
					if (sales_rep != '' && sales_rep != null )
					{
						nlapiSetFieldValue('custbody_lead_assigned_to', sales_rep, false, true);
						var salesrepname = nlapiLookupField('employee', sales_rep, 'entityid');
						alert('This Lead has been assigned to the Primary Sales Rep of: '+salesrepname+'. This happens when a Marketing role changes a Lead to 2-Qualified and the EBSCO Customer is known');
					}
				}
				// but if the company is unknown - tell user to assign the Lead to the appropriate Sales Rep
				else
				{
					alert('The EBSCO Customer is unknown, please assign this Lead to the appropriate Sales Rep')
				}
			}
		}

		//	US192395 - Add Validation when user selects Lead Status of 'Won -Send to Winser'
		if (lead_status == '19')
		{	// DE30945 RE-DO all code around Send To WinSeR
			var OkaytoSendToWinSer = true;
			var cannotSendToWinSeR_Reason = ', '
			// 1) Do Not Allow 'Send To WinSeR' if Opportunity hasn't been Saved Yet
				//KM 02-02-18:  US302111 - Check to make sure that the MLO has been previously saved and therefore has an opptyId, before we allow it to be written to WinSeR
				var opptyId = nlapiGetFieldValue('id');
				if (opptyId == '' || opptyId == null)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Marketing Lead Opportunity must first be saved. ';			
				} 			
			// 2) Do Not Allow 'Send To WinSeR' if There is No Customer
				var customer = nlapiGetFieldValue('entity');
				if (customer == '' || customer == null)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Marketing Lead Opportunity must have a valid Customer. ';						
				}
				else
				{
					// 3) Do Not Allow 'Send To WinSeR' if Customer is Stage Lead, Prospect 
					// Capture When Customer is Stage Prospect or Lead
					var customer_stage = nlapiLookupField('customer', customer, 'stage');
					if (customer_stage == 'PROSPECT' || customer_stage == 'LEAD')
					{
						OkaytoSendToWinSer = false;
						cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Prospect/Lead must first be converted to a Customer.  You can convert the Prospect to a Customer by updating the Lead Status to \'8 - Lead Success: Convert to Customer\'.  The customer must also be Approved by DDE Order Processing. ';	
					}
					// 4) if Customer isn't OE Approved
					else if (customer_stage == 'CUSTOMER')
					{
						var oe_approved = nlapiLookupField('customer', customer, 'custentity_oeapproved');
						if (oe_approved == 'F')
						{
							OkaytoSendToWinSer = false;
							cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This Customer does not yet exist in WinSer.  Once the customer is approved by DDE Order Processing this Marketing Lead item can be sent to WinSeR. ';	
						}
					}					
				}	
		
			// 5) Do Not Allow 'Send To WinSeR' if There is more than one Product on the Marketing Lead Opportunity
				var itemCount = nlapiGetLineItemCount('item');
				if (itemCount > 1)
				{
					OkaytoSendToWinSer = false;
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' There is more than one Item in this Marketing Lead Opportunity. ';						
				}			
			// Item level validation
				if (itemCount == 1)
				{
					for (var k = 1; k <= itemCount; k++)
					{
						var business_line = nlapiGetLineItemValue('item', 'custcol_sourced_business_line', k);
						// 6) Do Not Allow 'Send To WinSeR' if Prod Offering is DDE Not a Sellable Item
						if (business_line == 'Not a DDE Sellable Item')
						{
							OkaytoSendToWinSer = false;
							cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This item isn\'t supported in WinSeR. ';
						}
						// 7) Do Not Allow 'Send To WinSeR' if Prod Offering is Flipster 
						if (business_line == 'Flipster')
						{
							OkaytoSendToWinSer = false;
							cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' Flipster items aren\'t supported in WinSeR. ';							
						}
						// 8) Do Not Allow 'Send To WinSeR' if Prod Offering is eBook Perpetual	
						var isPerpetual = nlapiGetLineItemValue('item', 'custcol_sourced_isperpetual', k);
						if (business_line == 'NL - NetLibrary' && isPerpetual == 'T')
						{
							OkaytoSendToWinSer = false;
							cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' eBook Perpetual items aren\'t supported in WinSeR. '
						}
					}
				}		
			// Otherwise set writeToWinSR = true;
				if (OkaytoSendToWinSer == true)
				{
					writeToWinSR = true;					
				}
				else
				{
					nlapiSetFieldValue('custbody_lead_status', leadStatusOnLoad, false, true);
					cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason.substring(2);
					alert('You cannot set the Lead Status to \'8 - Lead Success: Send to WinSeR\': '+cannotSendToWinSeR_Reason);	
				}
		}
	}
	
	//If user changes "Lead - Contact Date"
	if (name == 'custbody_lead_init_contact_date')
	{	
		var newContactDate = nlapiStringToDate(nlapiGetFieldValue('custbody_lead_init_contact_date'));
		var today3 = new Date();	
		var mSecToHrs = 1000 * 60 * 60;
		var ageInHrs = (today3 - newContactDate) / mSecToHrs;
		ageInHrs = Math.round(ageInHrs);
		// alert('ageInHrs is: '+ageInHrs);
		if (ageInHrs > 24)
		{	// If date is more than 24 hours in past then set Lead Contact Date to Contact Date on load - and tell user
			nlapiSetFieldValue('custbody_lead_init_contact_date', ContactDateOnLoad, false, true);
			alert('Error: Lead - Contact Date cannot be in the past');
		}
	}

	// If User Changes the Customer field
	if (name == 'entity')
	{
		var lead_status = nlapiGetFieldValue('custbody_lead_status');
		if (lead_status == '2')
		{	
			var customer = nlapiGetFieldValue('entity');
			// alert('customer is: '+customer);
			if (customer != '' && customer != null)
			{	// and Customer field is not null
				var sales_rep = nlapiGetFieldValue('salesrep');
				// set the "Lead - Assigned To" to equal to the Sales Rep on the Customer record - and tell the User
				nlapiSetFieldValue('custbody_lead_assigned_to', sales_rep, false, true);
				var salesrepname = nlapiLookupField('employee', sales_rep, 'entityid');
				alert('This Lead has been assigned to the Primary Sales Rep of: '+salesrepname);
			}
		}
	}
}

// On Save
function marketingLeadFormSave()
{
	// Require at least one line item
	if(nlapiGetLineItemCount('item') < 1)
	{
		alert("You must enter at least one item for this Lead");
		return false;
	}
	if(nlapiGetLineItemCount('item') > 1)
	{
		alert("You can no longer have more than one line item in a Marketing Lead Opportunity");
		return false;
	}

	// 2016-12-09 Lead Assigned To is Mandatory (can't be set as Mandatory on form because of MUV tool
	if (nlapiGetFieldValue('custbody_lead_assigned_to')== '' || nlapiGetFieldValue('custbody_lead_assigned_to')== null)
	{
		alert("Please enter a value for: Lead - Assigned To");
		return false;		
	}
	
	var customer = nlapiGetFieldValue('entity');
	var contact = nlapiGetFieldValue('custbody_quote_contact');
	var lead_status = nlapiGetFieldValue('custbody_lead_status');
	// If Lead Status = "5 - Closed Successful"
	// Require Customer and Contact Information (in the REAL Customer/contact fields)
	// US192395 adding 19 and 20 - "Won - Send to WinSeR", "Won (Books and Flipster)"
	// US806481 adding 21 "8 - Lead Success Convert to Customer"
	if (lead_status == '5' || lead_status == '19' || lead_status == '20' || lead_status == '21')
	{	
		// if customer field is null or Customer is "Marketing Leads" fake customer
		// Give User Error - don't allow save
		if ((customer == '' || customer == null) || customer == '1387019') 
		{
			alert('Customer is required for Leads with a Status of "Success".  The \'EBSCO Marketing Unqualified Leads\' customer cannot be used');
			return (false);
		}
		// If Contact field is null
		// Give User Error - don't allow save		
		if (contact == '' || contact == null)
		{
			alert('Contact is required for Leads with a Status of "Success"');
			return (false);
		}
		var cust_addr = nlapiLookupField('customer', customer, 'address');
		// US806481 additional check on Street Address
		if (cust_addr.indexOf('[no street address provided]') > 0)
		{
			alert('This Prospect\'s address is listed as "[no street address provided]" because it arrived through EBSCO.com.  Please edit the Prospect customer and provide a valid address.');
			return false;
		}
		// 2016-10-10 Marketo Integration - ensure customer has MAIN ADDRESS
		if (cust_addr == '' || cust_addr == null)
		{
			alert('In order to move this lead to "Success" the Customer/Prospect needs a Main Address and a Territory');
			return false;
		}	
		// 2016-10-10 Marketo Integration - ensure customer has TERRITORY
		var ep_terr = nlapiLookupField('customer', customer, 'custentity_epterritory');
		if (ep_terr == '' || ep_terr == null)
		{
			alert('In order to move this lead to "Success" the Customer/Prospect needs a Main Address and a Territory');
			return false;
		}
		// 2016-10-10 Marketo Integration - ensure customer has SEGMENT
		var mkt_segment = nlapiLookupField('customer', customer, 'custentity_marketsegment');
		if (mkt_segment == '' || mkt_segment == null)
		{
			alert('In order to move this lead to "Success" the Customer/Prospect needs a Market Segment');
			return false;
		}
	}
		
	// if Lead Status is either closed won (5) or closed Lost (6) -- set lead close date (custom field)
	// 	US192395 Add 19 and 20 ('Won - Send to WinSeR' 'Won (Books and Flipster)')
	if (lead_status == '5' || lead_status == '6' || lead_status == '19' || lead_status == '20')
	{
		if(nlapiGetFieldValue('custbody_lead_close_date') == '' || nlapiGetFieldValue('custbody_lead_close_date') == null)
		{
			var cdate = new Date();
			cdate_string = nlapiDateToString(cdate);
			nlapiSetFieldValue('custbody_lead_close_date', cdate_string, false, true);
		}
	}
	else if (lead_status == '2' || lead_status == '3' || lead_status == '4')
	{	// if not Closed Lost nor Closed-Won and lead close date IS populated - then clear it
		if(nlapiGetFieldValue('custbody_lead_close_date') != '' && nlapiGetFieldValue('custbody_lead_close_date') != null)
		{
			nlapiSetFieldValue('custbody_lead_close_date', '', false, true);
		}
	}

	// if Lead Status = "6 - Closed Unsuccessful"
	if (lead_status == '6')
	{
		// 2016-10-31 Ensure there's a Reason Lost if this lead is Closed-Unsuccessful
		// However only check if page loaded with different Lead Status
		if (leadStatusOnLoad != '6')
		{
			var reasons_lost = nlapiGetFieldValue('custbody_winser_reasonslost');
			if (reasons_lost == '' || reasons_lost ==  null)
			{
				alert('In order to save this Lead Opportunity you must select a Reason Lost');
				return false;			
			}	
		}
	}
	
	// If Lead Status = "4 - Contacted", "8 - Closed - Successful", "6 - Closed - Unsuccessful/Lost"
	// 	US192395 Add 19 and 20	
	if (lead_status == '4' || lead_status == '5' || lead_status == '6' ||lead_status == '19' || lead_status == '20')
	{	// Require "Lead - Sales Notes" to be populated
		if (nlapiGetFieldValue('custbody_lead_notes_sales')=='' || nlapiGetFieldValue('custbody_lead_notes_sales')==null)
		{
			alert('Lead - Sales Notes is required if the Lead Status is "Contacted", "Closed" or "Success"');
			return (false);
		}
		// Require "Initial Contact Date" to be populated
		if (nlapiGetFieldValue('custbody_lead_init_contact_date') == '' || nlapiGetFieldValue('custbody_lead_init_contact_date') == null)
		{
			alert('Lead - Initial Contact Date is required if the Lead Status is "Contacted", "Closed" or "Success"');
			return (false);
		}
	}
	
	// BEGIN SET ENTITYSTATUS FIELD (so that NetCRM displays it correctly as lost/won etc)
	
	// 	US192395 If Lead Status indicates not in WinSer but in progress 2,3,4 
	// US730039 - Lead - Status value of 5-Lead Contact Unresponsive internal id = 9 removed from code - value inactivated in NetCRM
	if (lead_status == '2' || lead_status == '3' || lead_status == '4')
	{	// And the real Opportunity Status is not "2-Develop"
		if (nlapiGetFieldValue('entitystatus') != '18')	
		{	// then set Opportunity Status to "2-Develop"
			nlapiSetFieldValue('entitystatus', '18', false, true);
		}
	}

	// 	US192395 If Lead Status indicates in WinSeR and in progress (5, 19 and 10 through 16)
	if (lead_status == '5' || lead_status == '19' || lead_status == '10' || lead_status == '11' || lead_status == '12' || lead_status == '13' || lead_status == '14' || lead_status == '15' || lead_status == '16')
	{	// And the real Opportunity Status is not "3-Proposal/Negotiation"
		if (nlapiGetFieldValue('entitystatus') != '10')	
		{	// then set Opportunity Status to "3-Proposal/Negotiation"
			nlapiSetFieldValue('entitystatus', '10', false, true);
		}
	}
	
	// 	US192395 If Lead Status is WON (20,17)	
	if (lead_status == '20' || lead_status == '17')
	{
		// if NS Opportunity Status is NOT "Closed Won" (26)
		var ns_oppty_status = nlapiGetFieldValue('entitystatus');
		if (ns_oppty_status != 26)
		{	// set NS Opportunity Status to Closed Won (26)
			nlapiSetFieldValue('entitystatus', '26', false, true);
		}		
	}

	// 	US192395 If Lead Status is LOST (6, 18)	
	if (lead_status == '6' || lead_status == '18')
	{
		// if NS Opportunity Status is NOT 22 "Closed Lost"
		var ns_oppty_status = nlapiGetFieldValue('entitystatus');		
		if (ns_oppty_status != 22)
		{	// set NS Opportunity Status to Closed LOST
			nlapiSetFieldValue('entitystatus', '22', false, true);
		}
	}
	// US348248 If Lead Status is 8 - Lead Success: Convert to Customer
	// NEEDED TO CONVERT PROSPECTS INTO CUSTOMERS (if it came from Marketo)
	if (lead_status == '21')
	{
		var ns_oppty_status = nlapiGetFieldValue('entitystatus');
		if (ns_oppty_status != 26)
		{	// set NS Opportunity Status to Won
			nlapiSetFieldValue('entitystatus', '26', false, true);
		}		
	}
	// END SET ENTITYSTATUS FIELD (so that NetCRM displays it correctly as lost/won etc)
	// If Real Customer field is null or Customer is "Marketing Leads" fake customer
	if ( (customer == '' || customer == null) || customer == '1387019' )
	{	// require Lead - Institution Name - give User Error and prevent Save
		if (nlapiGetFieldValue('custbody_lead_unknown_cust_name')=='' || nlapiGetFieldValue('custbody_lead_unknown_cust_name')==null)
		{
			alert('If the EBSCO Customer isn\'t known, please visit the Institution/Contact Information section, Lead - Institution Name is required');
			return(false);
		}
	}
	
	// If Real Contact field is null, 5 of the Lead Contact free-text fields must be populated	
	if (contact == '' || contact == null)
	{	// require 5 free text fields to be populated - give User Error and prevent Save
			// Lead - Contact Name
			// Lead - Email  OR  Lead - Phone
		if (nlapiGetFieldValue('custbody_lead_unknown_contactname')=='' || nlapiGetFieldValue('custbody_lead_unknown_contactname')==null)
		{
			alert('If the EBSCO Contact isn\'t known, please visit the Institution/Contact Information section, Lead - Contact Name is required');
			return(false);
		}
		var lead_email = nlapiGetFieldValue('custbody_lead_contact_email');
		var lead_phone = nlapiGetFieldValue('custbody_lead_contact_phone');
		if ((lead_email==''||lead_email==null) && (lead_phone ==''||lead_phone==null))
			{
				alert('If the EBSCO Contact isn\'t known, please visit the Institution/Contact Information section, either a Lead - Email Address OR a Lead Phone Number is required');
				return(false);
			}
	}
	// Priority is required if Lead Status is 2,3,4,5 or 6
	if (nlapiGetFieldValue('custbody_lead_priority') == '' || nlapiGetFieldValue('custbody_lead_priority') == null)
	{
		if (lead_status == '2' ||lead_status == '3'|| lead_status == '4'|| lead_status == '5'|| lead_status == '6')
		{
			alert('Lead Priority is required if the Lead Status is 2, 3, 4, 5 or 6');
			return(false);
		}
	}
	
	// BEGIN Block code -- Load Contact Data into Lead - Contact fields if the Contact is known and the Lead contact fields are empty
	var this_contact = nlapiGetFieldValue('custbody_quote_contact'); 
	// and if it's not null		
	if (this_contact != '' && this_contact != null)
	{	// add one more clause
		// only run this code if the Lead Contact Name field is null
		if (nlapiGetFieldValue('custbody_lead_unknown_contactname') == '' || nlapiGetFieldValue('custbody_lead_unknown_contactname') == null)
		{
			// Populate the Marketing Lead Contact Metadata fields
			// but only if the relevent field is empty
			// these are the Contact record field IDs (from Contact record)
				// entityid (id of contact name)
				// email
				// phone
				// custentity_jobarea
			var contact_fields = ['entityid', 'email', 'phone', 'custentity_jobarea']
			var columns = nlapiLookupField('contact', this_contact, contact_fields);
			var contact_name = columns.entityid;
			var contact_email = columns.email;
			var contact_phone = columns.phone;
			var contact_jobarea = columns.custentity_jobarea;
			// For each field in the Marketing Lead Contact Meta data - If null then load value from Contact record into it
			// Contact Name  (no need for if statement)
			nlapiSetFieldValue('custbody_lead_unknown_contactname', contact_name, false, true);
			// email
			if (nlapiGetFieldValue('custbody_lead_contact_email') == '' || nlapiGetFieldValue('custbody_lead_contact_email') == null)
			{	
				nlapiSetFieldValue('custbody_lead_contact_email', contact_email, false, true);
			}
			// phone
			if (nlapiGetFieldValue('custbody_lead_contact_phone') == '' || nlapiGetFieldValue('custbody_lead_contact_phone') == null)
			{	
				nlapiSetFieldValue('custbody_lead_contact_phone', contact_phone, false, true);
			}
		}
	}
	// END Block code -- Load Contact Data into Lead


	// BEGIN Block code -- Load Customer Data into Lead fields
	var this_customer = nlapiGetFieldValue('entity');
	// "ns231089 EBSCO Marketing Leads" Customer is 1387019 - If it isn't set to this Fake customer

	if (this_customer != '' && this_customer != null && this_customer != '1387019')
	{
		// If the Lead institution Name field is null then perform all this code
		if (nlapiGetFieldValue('custbody_lead_unknown_cust_name') == '' || nlapiGetFieldValue('custbody_lead_unknown_cust_name') == null)
		{
			// field IDs Customer level fields
					// entityid + companyname 
					// custentity_market
					// custentity_marketsegment
					// custentity_industry	
			var cust_fields = ['entityid', 'companyname', 'custentity_market', 'custentity_marketsegment', 'custentity_industry']
			var cust_columns = nlapiLookupField('customer', this_customer, cust_fields);
			var cust_id = cust_columns.entityid;
			var cust_name = cust_columns.companyname;
			var cust_market = cust_columns.custentity_market;
			var cust_segment = cust_columns.custentity_marketsegment;
			var cust_industry = cust_columns.custentity_industry;
			// For each NULL field in the Marketing Lead CustomerMeta data - Load value from Customer record into it
			//Lead - Institution Name  -- concatenates two variables together into one string (cust_idD + cust_name)
			nlapiSetFieldValue('custbody_lead_unknown_cust_name', cust_id+' '+ cust_name, false, true);
			//Lead - Market
			if (nlapiGetFieldValue('custbody_lead_market') == '' || nlapiGetFieldValue('custbody_lead_market') == null)
			{
				nlapiSetFieldValue('custbody_lead_market', cust_market, false, true);
			}
			//Lead - Segment
			if (nlapiGetFieldValue('custbody_lead_segment') == '' || nlapiGetFieldValue('custbody_lead_segment') == null)
			{
				nlapiSetFieldValue('custbody_lead_segment', cust_segment, false, true);
			}
			//Lead - Industry	
			if (nlapiGetFieldValue('custbody_lead_industry') == '' || nlapiGetFieldValue('custbody_lead_industry') == null)
			{
				nlapiSetFieldValue('custbody_lead_industry', cust_industry, false, true);
			}
			// Address level fields Are more difficult to retrieve
			// Load customer record and then loop through the address book to get the Default Billing Address and use it 
			var cust_rec = nlapiLoadRecord('customer', this_customer);
			var address_count = cust_rec.getLineItemCount('addressbook');
			var indexBilling = null;
			for (var a = 1; a <= address_count; a++)
			{	
				cust_rec.selectLineItem('addressbook', a);
				if (cust_rec.getCurrentLineItemValue('addressbook', 'defaultbilling') == 'T')
				{
					indexBilling = a;
					break;
				}
			}			
			// now load the variables from the loaded record object
			var addr1 = cust_rec.getLineItemValue('addressbook','addr1', indexBilling);			
			var addr2 = cust_rec.getLineItemValue('addressbook','addr2', indexBilling);
			var city = cust_rec.getLineItemValue('addressbook','city', indexBilling);
			var state = cust_rec.getLineItemValue('addressbook','state', indexBilling);
			var zip = cust_rec.getLineItemValue('addressbook','zip', indexBilling);
			var country = cust_rec.getLineItemValue('addressbook','country', indexBilling);
			// alert('all the variables loaded are: '+addr1+' '+addr2+' '+city+' '+state+' '+zip+' '+country);			
			// For each NULL field in the Marketing Lead CustomerMeta data - Load value from Address record into it
			// addr1
			if (addr1 != null)
			{
				if (nlapiGetFieldValue('custbody_lead_address1') == '' || nlapiGetFieldValue('custbody_lead_address1') == null)
				{
					nlapiSetFieldValue('custbody_lead_address1', addr1, false, true);			
				}
			}		
			// addr2
			if (addr2 != null)
			{
				if (nlapiGetFieldValue('custbody_lead_address2') == '' || nlapiGetFieldValue('custbody_lead_address2') == null)
				{
					nlapiSetFieldValue('custbody_lead_address1', addr2, false, true);
				}
			}
			// city
			if (city != null)
			{
				if (nlapiGetFieldValue('custbody_lead_city') == '' || nlapiGetFieldValue('custbody_lead_city') == null)
				{
					nlapiSetFieldValue('custbody_lead_city', city, false, true);
				}
			}		
			// state
			if (state != null)
			{
				if (nlapiGetFieldValue('custbody_lead_state') == '' || nlapiGetFieldValue('custbody_lead_state') == null)
				{				
					var state_filter = new nlobjSearchFilter('custrecord_epstate_shortname', null,'is', state);
					var state_column = new nlobjSearchColumn('internalid', null, null);
					// search EP State record (customrecord82) to get the record id
					state_search_results = nlapiSearchRecord('customrecord82', null, state_filter, state_column);
					if (state_search_results)
					{
						for (var x=0; state_search_results != null && x < state_search_results.length; x++)
						{
							var new_state = state_search_results[x].getId();
							// alert('new_state = '+ new_state);
						}
					}
					nlapiSetFieldValue('custbody_lead_state', new_state, false, true);
				}
			}
			// zip
			if (zip != null)
			{			
				if (nlapiGetFieldValue('custbody_lead_postal_code') == '' || nlapiGetFieldValue('custbody_lead_postal_code') == null)
				{
					nlapiSetFieldValue('custbody_lead_postal_code', zip, false, true);
				}
			}	
			// country
			if (country != null)
			{			
				if (nlapiGetFieldValue('custbody_lead_country') == '' || nlapiGetFieldValue('custbody_lead_country') == null)
				{	
					var c_filter = new nlobjSearchFilter('custrecord_epcountry_code', null,'is', country);
					var c_column = new nlobjSearchColumn('internalid', null, null);
					// search EP Country record (customrecord80) to get the record id
					c_search_results = nlapiSearchRecord('customrecord80', null, c_filter, c_column);
					if (c_search_results)
					{
						for (var x=0; c_search_results != null && x < c_search_results.length; x++)
						{
							var new_country = c_search_results[x].getId();
							// alert('new_country = '+ new_country);
						}
					}
					nlapiSetFieldValue('custbody_lead_country', new_country, false, true);
				}
			}

		}
	}
	// END Block code -- Load Customer Data into Lead

	// set the is Lead Oppty flag
	if (nlapiGetFieldValue('custbody_is_lead_oppty') == 'F')
	{
		nlapiSetFieldValue('custbody_is_lead_oppty', 'T', false, true);
	}
	if (nlapiGetFieldValue('custbody_oppty_form_type') != '5')
	{
		nlapiSetFieldValue('custbody_oppty_form_type', '5' ,false, true);
	}
	
	//KM 02-02-18:  US302111 - Add logic to open a new window on Save that calls the new writeMLO suitelet if the MLO needs to be written to WinSeR
	if (writeToWinSR) {
		var cust_nskey = nlapiGetFieldValue("entity");
		var cust = nlapiLookupField('customer', cust_nskey, 'entityid');	
		var opptyId = nlapiGetFieldValue('id');
		numItems = nlapiGetLineItemCount("item");
		var itemId = '';
		for (i = 1; i <= numItems; i++) 
		{
			if (i == 1)
			{
				itemId = nlapiGetLineItemValue("item", "item", i);
			}
		}
		var prdOffId = nlapiLookupField('item', itemId, 'custitem_productoffering_code', null);
		// US893888 Modify Marketing Lead Push to WinSer - added idType parameter of 'MLO' to URL (01-14-2022)
		window.open('/app/site/hosting/scriptlet.nl?script=1011&deploy=1&cid='+cust+'&opptyId='+opptyId+'&prdOffId='+prdOffId+'&idType=mloId');
	}
	
	return(true);
}

//OPPTY validate line item function
function opptyValidateLine(type)
{
	if (nlapiGetCurrentLineItemIndex('item') > 1)
	{
		alert('Error: You are now only allowed to add one item to a Marketing Lead Opportunity, if there is interest in more than one item you must create a new Marketing Lead Opportunity');
		return false;
	}
	// Users should not be allowed to create a second Line Item - Mktg Lead Opportunities can only have one
	return true;
}

