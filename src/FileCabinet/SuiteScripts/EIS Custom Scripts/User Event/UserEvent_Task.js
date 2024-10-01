//
// Script:     server_task.js
//
// Created by: Unknown
//
//        
//
// Function:   	1. To record the last activity date on the Customer. 
//              2. To build and send To Do assignment e-mail for To Do tasks.
//              3. To build and send Call Reports by email for Call tasks.
//				4. To create and maintain Calendar Event for Call tasks. 
//
// Revisions:  
//		13Aug2013	CNeale	Add processing to build and send To Do assignment e-mail for To Do Tasks.
//                          Change last activity date recording to use nlapiLoadRecord.
//		06Sep2013	CNeale	External URL of Suitelet in Production updated.
//	    13Sep2013   DCook  	Add processing to build and send Call Reports by e-mail for Subs Call Tasks.
//        Oct2013   CNeale	Add processing to create Event for Subs Calls.
//      15Oct2013   DCook   Add new function updateSubsCallDate to update the Last and Previous Subs Call dates on
//                          the Customer record (for Completed Subs Calls).
//		17Oct2013	CNeale	Implemented - adjusted Event Form ID for Production Environment.
//      21Oct2013 	CNeale	Temporary fix to prevent script failing where Call is deleted.
//                          O/standing is resolving issue where Call is deleted and Event exists to be deleted. 
//		21Oct2013	CNeale	Resolve issue with e-mail call report if no contact attendees. 
//		22Oct2013	CNeale	Fix to resolve issue where Call is deleted & Event exists.   
//      24Oct2013   CNeale  Fix when owner <> user & Event creation fails.
//		19Nov2013	CNeale	Fix where Contact not associated with Customer for CR e-mailing. 
//      27Nov2013   CNeale  Fix issue where text is used instead of ID for Event Status. 
//		17Dec2013	CNeale	Fix issue where Event attendee is inactive. 	
//		13Aug2014   CNeale	Merge Call Form changes.
//                          Adjust Call Report info. - add Product Lines & Customer ID, (temp) Remove Opportunities List.
//                          Remove "Schedule an Event" processing.
//                          Update SB1-refresh-2024-09-30 envURL for ToDo assignment email (SB2 will need to be updated once refreshed).
//                          Product line Flipster added. 
//      27Aug2014	CNeale	Add to Call Report:  Product line Archives, Learning, PlumX & Point of Care, EP Territory & FTE.
//                          Remove from Call Report: Subs Primary Sales Rep.
//      05Jan2015	CNeale	Adjust Product Line (Discovery Service --> Software as a Service) & alpha order position.
//		22Apr2015	CNeale	Add to Call Report: Product Line LearningExpress.
//		12Aug2015	CNeale	Add to Call Report: Product Line YBP. 
//		27Jul2016	LWeyrauch	Changes for Data Centre Move.
//		28Jul2016	CNeale		Correct GetSystemDomain() to GetNetSuiteDomain('system')
//		02Aug2016	CNeale	Add to Call Report: Product Line FOLIO.
//		31Oct2016	CNeale	US165568 Product Line Call Report code now soft coded.
//		14Mar2018	JOliver	TA234191 Updated URL to Task To Do Completed script for Preview (2018.1 upgrade environment changes)
//		19Apr2018	JOliver	TA247686 Updated URL to Task To Do Completed script - Added '_SB1' to compid of SB1-refresh-2024-09-30 environment URL to accommodate Sandbox re-architecture
//                           
//                          
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function: serverTaskAfterSubmit
// Called:  After Submit 
// Purpose: 1. To record the last activity date on the Customer.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function serverTaskAfterSubmit()
{	
	//------------------------------------------------
	// Record the last activity date on the Customer. 
	//------------------------------------------------
	
	// run for newly created records only
		if ( type == 'create' )
		{
			// Get the record id 
			var taskRecId = nlapiGetRecordId();
			// Get the current task record
			var currentRecord = nlapiLoadRecord('task', taskRecId);
			// get the company id & Support Case ID 
			var customer = currentRecord.getFieldValue('company');
			var supportcase = currentRecord.getFieldValue('supportcase');
			
			// check that customer id exists and it is not a support case
			if(customer && !supportcase)
			{
				if ( nlapiLookupField('entity', customer, 'type') == 'CustJob')
				{
					nlapiSubmitField('customer', customer, 'custentity_last_task', nlapiDateToString(new Date()));
				}
			}
		}
}
// End function serverTaskAfterSubmit
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: serverTaskToDoAfterSubmit
//Called:  After Submit 
//Purpose: 1. To build and send To Do assignment e-mail for To Do tasks.
//         2. To build and send Call Report email for Call tasks.
//         3. To create and maintain Calendar Event for Call tasks
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function serverTaskToDoAfterSubmit()
{
	//---------------------------------------------------------------------------
	//  Build and send To Do assignment e-mail for To Do tasks.  
	//---------------------------------------------------------------------------
	
	// if the record was not deleted
	if (type != 'delete') 
	{
		 // Get the current task record
		 var taskRecId = nlapiGetRecordId();
		 var todoRecord = nlapiLoadRecord('task', taskRecId);
	}
	else
	// Record was deleted
	{
	    todoRecord = nlapiGetOldRecord();
	}  	 

	// To Do task & send EBSCO e-mail set. 
	var todoTask = todoRecord.getFieldValue('custevent_is_todo_task');
	var sendEBSCOEmail = todoRecord.getFieldValue('custevent_ebsco_email');
	if (todoTask == 'T' && sendEBSCOEmail == 'T' && type != 'delete')
	{
		sendAssignmentEmail(todoRecord);
	}
		 
	// Call task. 
	var callTask = todoRecord.getFieldValue('custevent_is_sea_call');
	// Call status is Completed.
	var callStatus = todoRecord.getFieldValue('status');
	if (callTask == 'T' && callStatus == 'COMPLETE' && type != 'delete')
	{
		updateSubsCallDate(todoRecord);
	}
	// Send EBSCO e-mail set.
	var sendEBSCOEmail = todoRecord.getFieldValue('custevent_ebsco_email');
	if (callTask == 'T' && sendEBSCOEmail == 'T' && type != 'delete')
	{
		emailCallReport(todoRecord);
	}

	// Create or Maintain Subs Call Calendar Event  - Remove Schedule an Event processing - CNeale Aug 2014
//	var changeEvent = todoRecord.getFieldValue('custevent_event_sched_changed');
//	if (callTask == 'T' &&  (changeEvent == 'T' || type == 'delete'))
//	{
//		maintainEvent(todoRecord);
//	}	
}
// End function serverTaskToDoAfterSubmit 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: sendAssignmentEmail
//Called:  From within serverTaskToDoAfterSubmit  
//Purpose: 1. To build & send the assignment To Do e-mail.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sendAssignmentEmail(todoRecord)
{
	// -----------------------------------------------------------------------------
	// Sends an EBSCO Email, replacing the NetSuite email functionality / format.
	// -----------------------------------------------------------------------------

		     
   // Get the environment and set the environment path URL 
   var systemUrl = GetNetSuiteDomain('system');
   var formsUrl = GetNetSuiteDomain('forms');
   var context     = nlapiGetContext();
   var environment = context.getEnvironment();
   var nscompany   = context.getCompany();
   var envURL = '';
    //production
    if (environment == 'PRODUCTION') {
        envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875&h=f68d50dd86f6231049f8'; // external URL of deployment of suitelet
    }
    //sandbox
    else if (environment == 'SANDBOX') {
        //sb1 - J.O. Added '_SB1' to compid to accommodate Sandbox re-architecture
        if (nscompany == '392875_SB1') {
            envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB1&h=f68d50dd86f6231049f8';
        }
        //sb2
        else if (nscompany == '392875_SB2') {
            envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB2&h=be00296d6472c2e3b9fa';
        }
        //sb3
        else if (nscompany == '392875_SB3') {
            envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB3&h=a2674c85cbd33ece6d70';
        }
    }
    //beta - J.O. updated URL below on 3/14/18 due to environment changes in 2018.1 upgrade 
    else if (environment == 'BETA') {
        envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_RP&h=ba93ed04de119332bee4';
    }
		
   // Retrieve fields to include in the email
   var taskRecId = nlapiGetRecordId();
   var customer    = todoRecord.getFieldValue('company');
   var eisacc	   = todoRecord.getFieldText('custevent_todo_eis_acno');	
   var contact     = todoRecord.getFieldValue('contact');
   var transaction = todoRecord.getFieldValue('transaction');
   var owner     = todoRecord.getFieldValue('owner');
   var assigned  = todoRecord.getFieldValue('assigned');	
   var copyTo    = todoRecord.getFieldValues('custevent_copy_email_to'); 
   var title     = todoRecord.getFieldValue('title');
   var status    = todoRecord.getFieldText('status');
   var priority  = todoRecord.getFieldText('priority');
   var startDate = todoRecord.getFieldValue('startdate');  	
   var dueDate   = todoRecord.getFieldValue('duedate');
   var notes     = todoRecord.getFieldValue('message');
		
   var ownerRecord = nlapiLoadRecord('employee', owner);
   var authorName  = ownerRecord.getFieldValue('entityid');
   var ccArray     = new Array();
   ccArray[0]  = ownerRecord.getFieldValue('email');
		
    
   // If 1 or more copy to's were entered add these to the ccArray list of email addresses
   if (copyTo)
   {
	   for (var cc = 0; cc < copyTo.length; cc++)
	   {
   		 var copyToEmail  = nlapiLookupField('employee', copyTo[cc], 'email');
   		 if (copyToEmail != null)
   	 	 {
	    	var ccArrayNo = cc + 1;
	    	ccArray[ccArrayNo] = copyToEmail;
	      }
	   }
	}    
	    
    var customerName;
    if (customer)
    {
    	// Get the customer record
    	var customerRecord = nlapiLoadRecord('customer', customer);	
		// Get the customer name
    	// May need to reinstate company name and/or account number but for the minute this seems like the best bet!
		customerName  = customerRecord.getFieldValue('entityid');
    }
	else
	{
	   customerName = '<< No associated Company >>';
	}			
	     
	var contactName;
	if (contact)
    {
		// Get the contact name
		contactName = nlapiLookupField('contact', contact, 'entityid');
	}
		 
	var relatedOpportunity;
	if (transaction)
	{
    	// Get the opportunity title
    	relatedOpportunity = nlapiLookupField('opportunity', transaction, 'title');
	}
		 
	// Set the todo title
	var todoTitle;
	todoTitle = 'NetCRM To Do ';
	if (type == 'create') 
	{
		todoTitle += '(New): ';	
	}
	else
	{
		todoTitle += '(Updated): ';	
	}  
	if (customer)
	{
		todoTitle += customerName + '; ';
	}			
	todoTitle += todoRecord.getFieldValue('title');	

	// Set the todo heading
	var todoHeading;
	todoHeading = 'TO DO ASSIGNMENT ';
	if (type == 'create') 
	{
		todoHeading += '(New)';
	}
	else 
	{
		todoHeading += '(Updated)';
	}	
		
	// Create the email body
	var emailBody =  '<html><head>';
	emailBody += '<style>';
	emailBody += '.heading {font-size: 14pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: center;}';
	emailBody += '.bodylabel {font-size: 9pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: black; text-align: left;}';
	emailBody += '.bodydata {font-size: 10pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; color: blue; text-align: left;}';
	emailBody += '</style>';
	emailBody += '</head>';
	emailBody += '<body>';
	emailBody += '<table cellspacing="2" cellpadding="2" border="0" width="400px">';
	emailBody += '<tr><td colspan=2 class="heading">'+todoHeading+'</td></tr>';
	emailBody += '<tr><td>&nbsp;</td></tr>';
	emailBody += '<tr><td colspan="2" class="bodydata">The following to do has been assigned to you in NetCRM by '+authorName+'.</td></tr>';
	emailBody += '<tr><td>&nbsp;</td></tr>';
    	emailBody += '<tr><td valign="top" width="25%" class="bodylabel">Description:</td><td valign="top" width="73%" class="bodydata"><a href="'
		+ systemUrl
		+ '/app/crm/calendar/task.nl?id='
		+ taskRecId
		+ '">'
		+ title + '</a></td></tr>';
    	emailBody += '<tr><td valign="top" class="bodylabel">Company:</td><td valign="top" class="bodydata"><a href="'
		+ systemUrl
		+ '/app/common/entity/custjob.nl?id='
		+ customer
		+ '">'
		+ customerName + '</a></td></tr>';

	if (eisacc)
	{
		emailBody += '<tr><td valign="top" class="bodylabel">EIS Account:</td><td valign="top" class="bodydata">'+eisacc+'</td></tr>';
	}
	
    if (contact)
    {
        emailBody += '<tr><td valign="top" class="bodylabel">Contact:</td><td valign="top" class="bodydata"><a href="'
		+ systemUrl
		+ '/app/common/entity/contact.nl?id='
		+ contact
		+ '">' 
		+ contactName 
		+ '</a></td></tr>';
    }

    if (transaction) {
        emailBody += '<tr><td valign="top" class="bodylabel">Related Opportunity:</td><td valign="top" class="bodydata"><a href="'
		+ systemUrl
		+ '/app/accounting/transactions/opprtnty.nl?id='
		+ transaction 
		+ '">' 
		+ relatedOpportunity 
		+ '</a></td></tr>';
    }

    emailBody += '<tr><td valign="top" class="bodylabel">Priority:</td><td valign="top" class="bodydata">'+priority+'</td></tr>';
    emailBody += '<tr><td valign="top" class="bodylabel">Status:</td><td valign="top" class="bodydata">'+status+'</td></tr>';
    emailBody += '<tr><td valign="top" class="bodylabel">Start Date:</td><td valign="top" class="bodydata">'+startDate+'</td></tr>';
    emailBody += '<tr><td valign="top" class="bodylabel">Due Date:</td><td valign="top" class="bodydata">'+dueDate+'</td></tr>';

    if (notes) 
    {
    	emailBody += '<tr><td valign="top" class="bodylabel">Notes:</td><td valign="top" class="bodydata">'+notes+'</td></tr>';
    }
    emailBody += '<tr><td>&nbsp;</td></tr>';
    emailBody += '<tr><td colspan=2 valign="top" class="bodylabel"><a href="'+envURL+'&taskid='+taskRecId+'&assigned='+assigned+'">Click here to set NetCRM to do status to Completed.</a></td></tr>';		
    emailBody += '</table>';
    emailBody += '</body></html>';

    // Send the email
    nlapiSendEmail(owner, assigned, todoTitle, emailBody, ccArray, null, null);
    
    // Set the 'Send email' checkbox to false (if the to do is subsequently maintained, to stop erroneous email
    // updates being sent, the user will have to re-check the 'Send email' checkbox
    nlapiSubmitField('task', taskRecId, 'custevent_ebsco_email', 'F');
}
// End function sendAssignmentEmail
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: updateSubsCallDate
//Called:   From within serverTaskAfterSubmit  
//Purpose:  1. For Subs Calls with a Completed status, update the Previous and Last Subs Call Dates on the Customer
//             record
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateSubsCallDate(todoRecord)
{
	
	// Get the customer record
    var customer       = todoRecord.getFieldValue('company');
	var customerRecord = nlapiLoadRecord('customer', customer);
	
	// Get the task date and the Previous and Last Subs Call dates from the Customer record 
	var taskStartDate    = todoRecord.getFieldValue('startdate');
	var custPrevCallDate = customerRecord.getFieldValue('custentity_previous_subs_call_date');
	var custLastCallDate = customerRecord.getFieldValue('custentity_last_subs_call_date');
	
	// If the Last Subs Call date is later than the Previous Subs Call date (also check the Task date is later than the Last Call date), update the Previous Subs Call date
	if (nlapiStringToDate(custLastCallDate) > nlapiStringToDate(custPrevCallDate) && nlapiStringToDate(taskStartDate) > nlapiStringToDate(custLastCallDate))
	  {
	   nlapiSubmitField('customer', customer, 'custentity_previous_subs_call_date', custLastCallDate);
	  }
	
	// If the Task date is later than the Last Subs Call date, update the Last Subs Call date
	if (nlapiStringToDate(taskStartDate) > nlapiStringToDate(custLastCallDate))
	{
	   nlapiSubmitField('customer', customer, 'custentity_last_subs_call_date', taskStartDate);	   
	  }
	
} // End function updateSubsCallDate

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: emailCallReport
//Called:   From within serverTaskAfterSubmit  
//Purpose:  1. To build and send Call Report email for Subs Call tasks.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function emailCallReport(todoRecord)
{

	// ------------------------- //
	// Build & email Call Report //
	// ------------------------- //
	
	// Get the environment and set the environment path 
    var systemUrl = GetNetSuiteDomain('system');
    var context     = nlapiGetContext();
    var environment = context.getEnvironment();

    // Task record id
    var taskRecId = nlapiGetRecordId();
    
	// Get the customer record
    var customer       = todoRecord.getFieldValue('company');
	var customerRecord = nlapiLoadRecord('customer', customer);	
    
	// Retrieve fields for sending the Call Report
	var salesRep    = todoRecord.getFieldValue('assigned');
	var sendEmailTo = todoRecord.getFieldValue('custevent_send_email_to'); 
	
	var copyEmailTo = new Array();
	var copyEmailTo = todoRecord.getFieldValues('custevent_copy_email_to');
	
    // Retrieve call Sales Rep details
	var organizer      = todoRecord.getFieldValue('assigned');
	var salesRepRecord = nlapiLoadRecord('employee', organizer);
	var salesRepName   = salesRepRecord.getFieldValue('entityid');
	var salesRepEmail  = salesRepRecord.getFieldValue('email');

	// Email CC addresses
	var emailCC        = new Array();
        emailCC[0]     = salesRepEmail;

    if (copyEmailTo)
       {
    	 for (var cc = 0; cc < copyEmailTo.length; cc++)
    		 {
    		  var copyToRecord = nlapiLoadRecord('employee', copyEmailTo[cc]);
    		  var copyToEmail  = copyToRecord.getFieldValue('email');	
    		  if (copyToEmail)
    	 	 	 {
    			  var ccArrayNo = cc + 1;
    			      emailCC[ccArrayNo] = copyToEmail;
    	 	 	 }
    	     }
       }
	   
	// Retrieve customer fields to include in the Call Report - CN: Aug 2014 - companyNameID largely replaces companyName - CN: Aug2014 FTE & EP Territory Added
    var companyId      = todoRecord.getFieldValue('company');
    var companyName    = customerRecord.getFieldValue('companyname'); 
    var companyNameID  = customerRecord.getFieldValue('entityid');
    var companyMarket  = customerRecord.getFieldText('custentity_market');
    var companySegment = customerRecord.getFieldText('custentity_marketsegment');
    var companySubsOff = customerRecord.getFieldText('custentity_subs_office');
	var companyAccNo   = isNull(todoRecord.getFieldText('custevent_todo_eis_acno'));
	var companyPsptNo  = isNull(customerRecord.getFieldText('custentity_subs_prospect_no'));
	var companyPMDate  = isNull(customerRecord.getFieldValue('custentity_previous_subs_call_date'));
	var companyPrmSR   = customerRecord.getFieldValue('custentity_primary_sales_rep');
	// Aug 14 - Remove  Subs Primary Sales Rep var companySubSR   = isNull(customerRecord.getFieldText('custentity_subs_primary_sales_rep'));
	var companyASM     = customerRecord.getFieldText('custentity_subs_asm');
	var companyCSR     = customerRecord.getFieldText('custentity_subs_csr');
	var companyConNme  = isNull(customerRecord.getFieldValue('custentity_subs_contract_name'));
	var companyConRnw  = isNull(customerRecord.getFieldValue('custentity_subs_contract_renew_due'));
	var companySrlBgt  = isNull(customerRecord.getFieldValue('custentity_subs_serials_budget'));
	var companyEPTerr  = customerRecord.getFieldText('custentity_epterritory');	
	var companyFTE     = isNull(customerRecord.getFieldValue('custentity_fte'));
	// Retrieve event fields to include in the Call Report
	var callDate       = todoRecord.getFieldValue('startdate');
	var callSubject    = todoRecord.getFieldValue('title');
	var callType       = todoRecord.getFieldText('custevent_tasktype');
	var callNotesSum   = todoRecord.getFieldValue('custevent_subs_call_notes_summary');
	var callNotesFD    = todoRecord.getFieldValue('custevent_subs_call_notes_further');
	
	// Topics
	var callTopics    = new Array();
	    callTopics    = todoRecord.getFieldTexts('custevent_subs_call_topics');
	    
	// Product Lines - Added Aug 2014 - CEN  & reordered + new added 26 Aug 2014
	    // 04-22-2015 Added LearningExpress
	    // 08-12-2015 Added YBP
	    // 08-02-2016 Added Folio
	// US165568 Now soft coded and retrieved directly from custevent_ms_prod_line    
	var callProductLines	= new Array();
	callProductLines = todoRecord.getFieldTexts('custevent_ms_prod_line');

	// Organisation attendees - but only if any are specified!
	var i = 0;    
	var callOrgAtt  = new Array();
		callOrgAtt  = todoRecord.getFieldValues('custevent_subs_con_att');
			
	var orgAtt      = new Array();
	if (todoRecord.getFieldValue('contact'))
		{
		orgAtt[0]   = todoRecord.getFieldValue('contact');
		var i = 1; 
		}
		    
	if (callOrgAtt)
	   {
	    for (var oAtt = 0; oAtt < callOrgAtt.length; oAtt++)
	        {
	    	 var orgAttendee = callOrgAtt[oAtt];
	    	 if (orgAttendee)
	    	 	{
	    	     var callOrgAttNo = oAtt + i;	    		 
    			 orgAtt[callOrgAttNo] = orgAttendee	    		 
	    	 	}
	        }
	   }
	
	var orgAttDetail = new Array();
	for (var oAtt = 0; oAtt < orgAtt.length; oAtt++)
		{
		 var callOrgName    = nlapiLookupField('contact', orgAtt[oAtt], 'firstname') + ' ' + nlapiLookupField('contact', orgAtt[oAtt], 'lastname');
		 var callOrgTitle   = nlapiLookupField('contact', orgAtt[oAtt], 'title');
		 var callOrgCompNo  = nlapiLookupField('contact', orgAtt[oAtt], 'company');
		 if  (callOrgCompNo)
		 {
			 var callOrgCompNme = nlapiLookupField('customer', callOrgCompNo, 'companyname');
		 }
		 else
		 {
			 var callOrgCompNme = '';
		 }
	
		 if (callOrgName)
			{
		     orgAttDetail[oAtt] =  callOrgName;
			}
		 if (callOrgTitle || callOrgCompNme)
		    {
			 orgAttDetail[oAtt] += ' (';
			 if (callOrgTitle)
			    {
			     orgAttDetail[oAtt] += callOrgTitle;
			    }
		     if (callOrgCompNme)
			    {
		    	 if (callOrgTitle)
		    		{
		    		 orgAttDetail[oAtt] += ', ';
		    		}
			     orgAttDetail[oAtt] += callOrgCompNme;
			    }
		     orgAttDetail[oAtt] += ')';
		    }
		}    		 
	    
	// EBSCO attendees
	var callEBSCOAtt  = new Array();
		callEBSCOAtt  = todoRecord.getFieldTexts('custevent_add_ebsco_attendees');
		
	var ebscoAtt      = new Array();
	    ebscoAtt[0]   = salesRepName;
	    
	if (callEBSCOAtt)
       {
    	 for (var eAtt = 0; eAtt < callEBSCOAtt.length; eAtt++)
    		 {
    		  var ebscoAttendee = callEBSCOAtt[eAtt];
    		  if (ebscoAttendee)
    	 	 	 {
    			  var callEBSCOAttNo = eAtt + 1;
    			      ebscoAtt[callEBSCOAttNo] = ebscoAttendee;
    	 	 	 }
    	     }
       }
	
	// Build html table of Opportunities
	// Temporarily removed following WSR deployment - CNeale Aug2014
//	var opportunityTable = buildOpportunityTable(customer);
	
	// Build html table of ToDo's
	var todoTable = buildToDoTable(customer);
	
	// Email subject - include ID - CNeale Aug2014
	var emailSubject =  'CALL REPORT From: ';
	    emailSubject += salesRepName;
	    emailSubject += ' for: ';
	    emailSubject += companyNameID; 
	// Account number OR prospect number
	if (companyAccNo)
	   {
		emailSubject += ' (Subs EIS Account: ';
		emailSubject += companyAccNo;
		emailSubject += ')';
	   }
	else if (companyPsptNo)
	   {
		emailSubject += ' (Subs Prospect No: ';
		emailSubject += companyPsptNo;
		emailSubject += ')';
	   }
	
	// Email body (Heading)
	var emailBody =  '<html><head><title>EBSCO Call Report</title>';
        emailBody += '<style>';
        emailBody += '.emailheading {font-size: 14pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: center;}';
        emailBody += '.sectionheading {font-size: 12pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: left;}';
        emailBody += '.sectionsubheading {font-size: 11pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: left;}';
        emailBody += '.bodylabel {font-size: 9pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: black; text-align: left;}';
        emailBody += '.bodydata {font-size: 10pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; color: blue; text-align: left;}';
        emailBody += '.tableheading {font-size: 9pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: black;}';
        emailBody += '.tabledata {font-size: 10pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; color: blue;}';
        emailBody += '</style>';
        emailBody += '</head>';
	    emailBody += '<body>';
		emailBody += '<table cellspacing="2" cellpadding="2" border="0" width="95%">';
		emailBody += '<tr><td colspan=3 class="emailheading">CALL REPORT</td></tr>';
		emailBody += '<tr><td colspan=3></td></tr>';
		
        // Email body (Organisation section) - CN Aug14 Subs Primary Sales Rep removed, Territory & FTE added
		emailBody += '<tr><td colspan=3 class="sectionheading">1) The Organisation</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Organisation:</td><td valign="top" width="78%" class="bodydata"><a href="'+systemUrl+'/app/common/entity/custjob.nl?id='+companyId+'">'+companyNameID+'</a></td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Territory:</td><td valign="top" width="78%" class="bodydata">'+companyEPTerr+'</td></tr>';		
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Market / Segment:</td><td valign="top" width="78%" class="bodydata">'+companyMarket+' / '+companySegment+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">FTE:</td><td valign="top" width="78%" class="bodydata">'+companyFTE+'</td></tr>';		
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Subs EIS Account:</td><td valign="top" width="78%" class="bodydata">'+companyAccNo+'</td></tr>';		
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Previous Contact:</td><td valign="top" width="78%" class="bodydata">'+companyPMDate+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Primary Sales Rep:</td><td valign="top" width="78%" class="bodydata">'+companyPrmSR+'</td></tr>';			
			
		// Email body (Organisation section: ASM, CSR & Tender / Contract) - Not for Publishers
		if (companySubsOff != 'PS' && isPublisherRole() != 'T')
		   {
			emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Account Service Manager:</td><td valign="top" width="78%" class="bodydata">'+companyASM+'</td></tr>';	
			emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Customer Service Rep:</td><td valign="top" width="78%" class="bodydata">'+companyCSR+'</td></tr>';
			emailBody += '<tr><td width="2%"></td><td colspan=2 class="sectionsubheading">Tender/Contract</td></tr>';			
		    emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Contract Name:</td><td valign="top" width="78%" class="bodydata">'+companyConNme+'</td></tr>';
		    emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Contract Renew/Due Date:</td><td valign="top" width="78%" class="bodydata">'+companyConRnw+'</td></tr>';
		    emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Serials Budget:</td><td valign="top" width="78%" class="bodydata">'+companySrlBgt+'</td></tr>';
		   }
		emailBody += '<tr><td colspan=3></td></tr>';		

	    // Email body (Call section)
		emailBody += '<tr><td colspan=3 class="sectionheading">2) The Call</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Date:</td><td valign="top" width="78%" class="bodydata">'+callDate+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Subject:</td><td valign="top" width="78%" class="bodydata">'+callSubject+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Type:</td><td valign="top" width="78%" class="bodydata">'+callType+'</td></tr>';
		if (callTopics)
		   {
			for (var topic = 0; topic < callTopics.length; topic++)
			 	{
				 if (topic == 0)
			 		{
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Topic(s):</td><td valign="top" width="78%" class="bodydata">'+callTopics[topic]+'</td></tr>';
			 		}
				 else
				 	{
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+callTopics[topic]+'</td></tr>';
				 	}
			    }
		   }
		// Call Product Lines - CNeale Aug2014
		if (callProductLines)
		   {
			for (var cpl = 0; cpl < callProductLines.length; cpl++)
			 	{
				 if (cpl == 0)
			 		{
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Product Line(s):</td><td valign="top" width="78%" class="bodydata">'+callProductLines[cpl]+'</td></tr>';
			 		}
				 else
				 	{
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+callProductLines[cpl]+'</td></tr>';
				 	}
			    }
		   }
        // Organisation attendees
		for (var oAtt = 0; oAtt < orgAttDetail.length; oAtt++)
		    {
		     if (oAtt == 0)
			    {
		         emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Organisation Attendees:</td><td valign="top" width="78%" class="bodydata">'+orgAttDetail[oAtt]+'</td></tr>';
			    }
		     else
			    {
			     emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+orgAttDetail[oAtt]+'</td></tr>';
			    }
		    }
		// EBSCO attendees
		for (var eAtt = 0; eAtt < ebscoAtt.length; eAtt++)
		    {
		     if (eAtt == 0)
			    {
		         emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">EBSCO Attendees:</td><td valign="top" width="78%" class="bodydata">'+ebscoAtt[eAtt]+'</td></tr>';
			    }
		     else
			    {
			     emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+ebscoAtt[eAtt]+'</td></tr>';
			    }
		    }
		emailBody += '<tr><td colspan=3></td></tr>';

	    // Email body (Call notes)
		emailBody += '<tr><td colspan=3 class="sectionheading">3) Call Notes</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Summary:</td><td valign="top" width="78%" class="bodydata">'+callNotesSum+'</td></tr>';
		if (callNotesFD)
		   {
			emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Further Detail:</td><td valign="top" width="78%" class="bodydata">'+callNotesFD+'</td></tr>';
		   }

	    // Email body (Opportunities) - Temp removed - Aug 2014
//		emailBody += '<tr><td colspan=3 class="sectionheading">4) Open and Closed (in the last 12 months) Opportunities</td></tr>';
//		emailBody += '<tr><td width="2%"></td><td colspan=2 valign="top">'+opportunityTable+'</td></tr>';

	    // Email body (ToDo's)
		emailBody += '<tr><td colspan=3 class="sectionheading">4) Open ToDos</td></tr>';
		emailBody += '<tr><td width="2%"></td><td colspan=2 valign="top">'+todoTable+'</td></tr>';		
		
		// Send the email
	    nlapiSendEmail(organizer, sendEmailTo, emailSubject, emailBody, emailCC, null, null);
	    
	    // Set the 'Send Email' checkbox to false (if the to do is subsequently maintained, to stop erroneous email
	    // updates being sent, the user will have to re-check the 'Send email' checkbox
	    nlapiSubmitField('task', taskRecId, 'custevent_ebsco_email', 'F');
	    
	    // Set the 'Subs Call Report Sent' to true, so the Sales Rep can be credited with sending a call report in
	    // the Sales Activity Statistics
	    nlapiSubmitField('task', taskRecId, 'custevent_subs_call_report_sent', 'T');
}	    
// end: function emailCallReport	

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: buildOpportunityTable
//Called:   From within serverTaskAfterSubmit by emailCallReport function  
//Purpose:  1. To build an html table of Opportunities for the Customer, to be included in the email Call Report 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function buildOpportunityTable(customer)
{

	var oppFilters    = new Array();
	    oppFilters[0] = new nlobjSearchFilter('entity', null, 'anyof', customer);

	var oppColumns = new Array();
  	    oppColumns.push(new nlobjSearchColumn('title'));
  	    oppColumns.push(new nlobjSearchColumn('entitystatus'));
  	    oppColumns.push(new nlobjSearchColumn('projectedtotal'));
  	    oppColumns.push(new nlobjSearchColumn('probability'));
  	    oppColumns.push(new nlobjSearchColumn('custbody_subs_revenue_year'));
  	    oppColumns.push(new nlobjSearchColumn('expectedclosedate'));
  	    oppColumns.push(new nlobjSearchColumn('lastmodifieddate'));

  	// Get all Opportunities for the customer record
  	var opportunities = nlapiSearchRecord('opportunity', null, oppFilters, oppColumns);

  	var oppTable;
  	    oppTable =  '<table>';
  	    oppTable += '<tr>';
  	    oppTable += '<td class="tableheading" align="left">Title</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="left">Status</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="right">Value</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="right">Prob.</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="center">Rev.Yr.</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="center">Exp. Close</td><td>&nbsp;</td>';
  	    oppTable += '<td class="tableheading" align="center">Actual Close</td>';
  	    oppTable += '</tr>';
  	
  	var today = new Date();
  	var oppCount = 0;

  	// If at least one Opportunity was read
  	if (opportunities)
  	   {
  		for (opp = 0; opp < opportunities.length; opp++) 
  		    {
  			 // By default, set Opportunity inclusion variable to "T"rue
  			var includeOpportunity = "T";
  			
  			// If the Opportunity Status is Closed, use the Last Modified Date as the Closed Date (minus the time part).  Otherwise, it is Null
  			if (opportunities[opp].getText('entitystatus').indexOf('Closed') != -1)
  			   {
  				var oppClosed    = "T";
  				var dateEnds     = opportunities[opp].getValue('lastmodifieddate').indexOf(' ');
  				var oppCloseDate = opportunities[opp].getValue('lastmodifieddate').substring(0, dateEnds);
  				// For Closed Opportunities, check whether it has been Closed (Updated) within the last year, and exclude it if it is older
  				var oppCloseDateAdvanced = nlapiAddDays(nlapiStringToDate(oppCloseDate), 365);
  			    if (oppCloseDateAdvanced < today) 
  			       {
  			        includeOpportunity = "F";
  			       }
  			   }
  			else
  			   {
  				oppClosed    = "F";
  				oppCloseDate = '';
  			   }
 
             // Include in the list of Opportunities if the variable is still "T"rue
	         if (includeOpportunity == "T") 
	            {
	        	 oppCount++;
 	
 	             oppTable += '<tr>';
 	             oppTable += '<td class="tabledata" align="left">'+opportunities[opp].getValue('title')+'</td><td></td>';
 	             oppTable += '<td class="tabledata" align="left">'+opportunities[opp].getText('entitystatus')+'</td><td></td>';
 	             oppTable += '<td class="tabledata" align="right">'+opportunities[opp].getValue('projectedtotal')+'</td><td></td>';
 	             oppTable += '<td class="tabledata" align="right">'+opportunities[opp].getValue('probability')+'</td><td></td>';
 	             oppTable += '<td class="tabledata" align="center">'+opportunities[opp].getText('custbody_subs_revenue_year')+'</td><td></td>';
 	             oppTable += '<td class="tabledata" align="center">'+opportunities[opp].getValue('expectedclosedate')+'</td><td></td>';
                 oppTable += '<td class="tabledata" align="center">'+oppCloseDate+'</td>';
 	             oppTable += '</tr>';
                }
	         
            } // end: for loop
    } // end: If at least one Opportunity was read

	// If no Opportunities were included			
	if (oppCount == 0) 
	   {
        oppTable += '<tr>';
        oppTable += '<td colspan = 7 class="tabledata" align="left">No open or recently closed opportunities exist.</td><td></td>';
        oppTable += '</tr>';
       }
		
	oppTable += '</table>'
	
	// Return the html Opportunity Table
	return oppTable;
	
} // end: function buildOpportunityTable

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: buildToDoTable
//Called:   From within serverTaskAfterSubmit by emailCallReport function  
//Purpose:  1. To build an html table of open ToDo's for the Customer, to be included in the email Call Report 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function buildToDoTable(customer)
{

    var todoFilters    = new Array();
        todoFilters[0] = new nlobjSearchFilter('company', null, 'anyof', customer);
        todoFilters[1] = new nlobjSearchFilter('status', null, 'noneof', 'COMPLETE'); // Status is not Complete
        todoFilters[2] = new nlobjSearchFilter('custevent_is_todo_task', null, 'is', 'T'); // Task is a todo
        
    var todoColumns = new Array();
        todoColumns.push(new nlobjSearchColumn('title'));
        todoColumns.push(new nlobjSearchColumn('assigned'));
        todoColumns.push(new nlobjSearchColumn('duedate'));
        todoColumns.push(new nlobjSearchColumn('status'));
        todoColumns.push(new nlobjSearchColumn('priority'));
        todoColumns.push(new nlobjSearchColumn('message'));

    // Get all Open ToDo's for the customer record
    var todos = nlapiSearchRecord('task', null, todoFilters, todoColumns);

    var todoTable;
        todoTable =  '<table>';
        todoTable += '<tr>';
        todoTable += '<td class="tableheading" align="left">Title</td><td>&nbsp;</td>';
        todoTable += '<td class="tableheading" align="left">Assigned</td><td>&nbsp;</td>';
        todoTable += '<td class="tableheading" align="center">Due Date</td><td>&nbsp;</td>';
        todoTable += '<td class="tableheading" align="left">Status</td><td>&nbsp;</td>';
        todoTable += '<td class="tableheading" align="center">Priority</td><td>&nbsp;</td>';
        todoTable += '<td class="tableheading" align="left">Notes</td><td>&nbsp;</td>';
        todoTable += '</tr>';

    // If at least one ToDo was read
    if (todos)
       {
        // Sort the results in ascending order by due date
    	todos.sort(dueDateSort);
    	
    	for (todo = 0; todo < todos.length; todo++)
    		{
             todoTable += '<tr>';
             todoTable += '<td class="tabledata" align="left">'+todos[todo].getValue('title')+'</td><td></td>';
             todoTable += '<td class="tabledata" align="left">'+todos[todo].getText('assigned')+'</td><td></td>';
             todoTable += '<td class="tabledata" align="center">'+todos[todo].getValue('duedate')+'</td><td></td>';
             todoTable += '<td class="tabledata" align="left">'+todos[todo].getText('status')+'</td><td></td>';
             todoTable += '<td class="tabledata" align="center">'+todos[todo].getText('priority')+'</td><td></td>';
             todoTable += '<td class="tabledata" align="left">'+todos[todo].getValue('message')+'</td><td></td>';
             todoTable += '</tr>';    		
    		} // end: for loop

       } // end: If at least one ToDo was read
    
    // If no ToDo's were read			
    else
       {
        todoTable += '<tr>';
        todoTable += '<td colspan = 6 class="tabledata" align="left">No open to dos exist.</td><td></td>';
        todoTable += '</tr>';
       } // end: No ToDo's were read

    todoTable += '</table>'

    // Return the html ToDo Table
    return todoTable;

} // end: function buildToDoTable


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: dueDateSort
//Called:   From within serverTaskAfterSubmit by buildToDoTable function  
//Purpose:  1. Sort ToDo's in ascending order by due date 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function dueDateSort(a, b)
{
	var dueDate1dmy = a.getValue('duedate')	
    var dueDate2dmy = b.getValue('duedate')

    // -----------------------------------
    // Reformat dmy due date 1 as yyyymmdd 	 
    // -----------------------------------
    // dd/mm/yyyy
    if (dueDate1dmy.indexOf("/") == 2 && dueDate1dmy.lastIndexOf("/") == 5)
       {  
        var dueDate1ymd = dueDate1dmy.substring(6) + dueDate1dmy.substring(3,5) + dueDate1dmy.substring(0,2);
       }	 
    // d/mm/yyyy
    else if (dueDate1dmy.indexOf("/") == 1 && dueDate1dmy.lastIndexOf("/") == 4)
       {  
        var dueDate1ymd = dueDate1dmy.substring(5) + dueDate1dmy.substring(2,4) + "0" + dueDate1dmy.substring(0,1);
       }	 
    // dd/m/yyyy
    else if (dueDate1dmy.indexOf("/") == 2 && dueDate1dmy.lastIndexOf("/") == 4)
       {  
        var dueDate1ymd = dueDate1dmy.substring(5) + "0" + dueDate1dmy.substring(3,4) + dueDate1dmy.substring(0,2);
       }	 
    // d/m/yyyy
    else if (dueDate1dmy.indexOf("/") == 1 && dueDate1dmy.lastIndexOf("/") == 3)
       {  
        var dueDate1ymd = dueDate1dmy.substring(4) + "0" + dueDate1dmy.substring(2,3) + "0" + dueDate1dmy.substring(0,1);
       }	 	 
	 
    // -----------------------------------
    // Reformat dmy due date 2 as yyyymmdd 	 
    // ----------------------------------- 	 
    // dd/mm/yyyy
    if (dueDate2dmy.indexOf("/") == 2 && dueDate2dmy.lastIndexOf("/") == 5)
       {  
        var dueDate2ymd = dueDate2dmy.substring(6) + dueDate2dmy.substring(3,5) + dueDate2dmy.substring(0,2);
       }	 
    // d/mm/yyyy
    else if (dueDate2dmy.indexOf("/") == 1 && dueDate2dmy.lastIndexOf("/") == 4)
       {  
        var dueDate2ymd = dueDate2dmy.substring(5) + dueDate2dmy.substring(2,4) + "0" + dueDate2dmy.substring(0,1);
       }	 
    // dd/m/yyyy
    else if (dueDate2dmy.indexOf("/") == 2 && dueDate2dmy.lastIndexOf("/") == 4)
       {  
        var dueDate2ymd = dueDate2dmy.substring(5) + "0" + dueDate2dmy.substring(3,4) + dueDate2dmy.substring(0,2);
       }	 
    // d/m/yyyy
    else if (dueDate2dmy.indexOf("/") == 1 && dueDate2dmy.lastIndexOf("/") == 3)
       {  
        var dueDate2ymd = dueDate2dmy.substring(4) + "0" + dueDate2dmy.substring(2,3) + "0" + dueDate2dmy.substring(0,1);
       }	 
	 
    // -----------------
    // test the 2 values	 
    // -----------------
    if (dueDate1ymd < dueDate2ymd)
       {
	    return -1;
       }
    else if (dueDate1ymd > dueDate2ymd)
       {
	    return 1;
       }
    else
       {
	    return 0;
       }

} // end: function dueDateSort


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: maintainEvent
//Called:   From within serverTaskAfterSubmit   
//Purpose:  1. To create or maintain Calendar Event for Subs Call 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function maintainEvent(todoRecord)
{
	// Find Calendar Event ID & set variable to indicate if Event to update/delete or add
	var schedEvent = todoRecord.getFieldValue('custevent_sched_event');
	var eventId = searchCalEvent(todoRecord);
	var updEvent = 'N';
	if (eventId != '0')
	{
		var updEvent = 'Y';
	}

	// Calendar Event Record Not Required (& confirmed match to Event record)
	if ((schedEvent == 'F' && updEvent == 'Y') || (type == 'delete' && updEvent == 'Y')) 
	{
		nlapiDeleteRecord('calendarevent', eventId);
	}
	
	// Calendar Event Required (either update existing or create new)	
	if(schedEvent == 'T' && type != 'delete')
	{
		// Reset all fields even if update (as don't know what has changed)
		// 120 = EIS Subscriptions Skeleton Event Form in Production Environment
		var customForm = 120;  
		var timeZone = todoRecord.getFieldValue('timezone');
		var date = todoRecord.getFieldValue('duedate');
		var reserveTime = todoRecord.getFieldValue('timedevent');
		var startTime;
		var endTime;
		if (reserveTime == 'T')
		{
			var startTime = todoRecord.getFieldValue('starttime');
			var endTime = todoRecord.getFieldValue('endtime');
		}
		
		var callStatus  = todoRecord.getFieldValue('custevent_subs_call_status');
		switch (callStatus)
		{
		case '1':
			status = 'CONFIRMED';
			break;
		case '3':
			status = 'CANCELLED';
			break;
		case '4':
			status = 'COMPLETE';
			break;
		default:
			status = 'TENTATIVE';
		break;
		}
	
		var organizer = todoRecord.getFieldValue('assigned');
		var owner = todoRecord.getFieldValue('owner');
		var assocCall = nlapiGetRecordId();
		var assocCallText = todoRecord.getFieldValue('title');
		var title = 'Calendar Event for Subs Call: ' + assocCallText;
		var customer = todoRecord.getFieldText('company');
		var message = 'This Calendar Event relates to Customer: ' + customer + ', Subs Call: ' + assocCallText;
		var user = nlapiGetUser();
	
		if(updEvent == 'N')
		{		
			// Create Calendar Event 
			recordCreated = nlapiCreateRecord('calendarevent', {recordmode: 'dynamic'});
		}
		else
		{
			// Access existing calendar event
			recordCreated = nlapiLoadRecord('calendarevent', eventId, {recordmode: 'dynamic'});
		}
		 
		// Set Calendar Event Details
		recordCreated.setFieldValue('customform', customForm);
		recordCreated.setFieldValue('timezone', timeZone);
		recordCreated.setFieldValue('startdate', date);
		if (reserveTime == 'T')
		{
			recordCreated.setFieldValue('timedevent', 'T');
			recordCreated.setFieldValue('starttime', startTime);
			recordCreated.setFieldValue('endtime', endTime);
		}
		else
		{
			recordCreated.setFieldValue('timedevent', 'F');
		}	
		recordCreated.setFieldValue('status', status);  
		recordCreated.setFieldValue('organizer', organizer);
		recordCreated.setFieldValue('owner', organizer);
		recordCreated.setFieldValue('custevent_subs_assoc_call', assocCall);
		recordCreated.setFieldValue('custevent_sub_assoc_call_text', assocCall);
		recordCreated.setFieldValue('title', title);
		recordCreated.setFieldValue('message', message);
		recordCreated.setFieldValue('accesslevel', 'PUBLIC');
		recordCreated.setFieldValue('custevent_event_type', 5);  // Set to 'Other'
		
		// Now sort out EBSCO attendees into sublist
		var callEBSCOAtt  = new Array();
		callEBSCOAtt  = todoRecord.getFieldValues('custevent_add_ebsco_attendees');
			
		if (updEvent == 'Y')
		// Remove existing attendees - they will be re-added	
		{
			var lincnt = recordCreated.getLineItemCount('attendee');
			
			if (lincnt > 0)
			// Remove existing attendees
			{
				var i = lincnt + 1;
				for (var dAtt = 1; dAtt <= lincnt; dAtt++)
				{
					var i = i - 1;
//					var name = recordCreated.getLineItemValue('attendee', 'attendee', i);
//					if (name != user)
//					{
						recordCreated.removeLineItem('attendee', i);
//					}
				}
			}
		}	
			
		if (callEBSCOAtt)
		{
			for (var eAtt = 0; eAtt < callEBSCOAtt.length; eAtt++)
			{
				var ebscoAttendee = callEBSCOAtt[eAtt];
				if (ebscoAttendee && ebscoAttendee != organizer)
				{
					if (updEvent == 'N' && ebscoAttendee == user)
					{
						// Create Event & attendee = user - User will be added automatically
					}
					else
					{
						if (nlapiLookupField('employee', ebscoAttendee, 'isinactive')== 'F')
						{
							recordCreated.selectNewLineItem('attendee');
							recordCreated.setCurrentLineItemValue('attendee', 'attendee', ebscoAttendee);
							recordCreated.commitLineItem('attendee');
						}
					}
				}
			}
		}
		// Add the Organizer (but only if not the same as the Owner!)
		if (updEvent == 'Y' || organizer != user )
		{
			recordCreated.selectNewLineItem('attendee');
			recordCreated.setCurrentLineItemValue('attendee', 'attendee', organizer);
			recordCreated.commitLineItem('attendee');
		}
		// Submit the Event Record
		nlapiSubmitRecord(recordCreated, true);
	}
    // Finally reset the "Event schedule changed" flag on the Task
	if (type != 'delete')
	{
		nlapiSubmitField('task', nlapiGetRecordId(), 'custevent_event_sched_changed', 'F');
	}
}

//---------------------------------------------------------------------------------------------------------//
//Function: searchCalEvent      
//Parameters: Input: None
//       Return: Calendar Event Record ID or 0 if not found 
//Called: 
//Purpose:	1. To locate Calendar Event for Subs Call Task 
//---------------------------------------------------------------------------------------------------------//
function searchCalEvent(todoRecord)
{
	// set return variable to 0
	var eventId = 0;	
	// retrieve Subs Call ID 
	var callID = todoRecord.getId();
	
	// define search filter
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'custevent_sub_assoc_call_text', null, 'is', callID);
	filters[1] = new nlobjSearchFilter('custevent_event_type', null, 'is', 5); 
	
	// return Event ID
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custevent_sub_assoc_call_text');
	
	// execute the search, passing all filters and return columns
	var searchresults = nlapiSearchRecord( 'calendarevent', null, filters, columns );
	
	// loop through the results
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
	{
		// get result values
		var eventId = searchresults[i].getId();
	}
	
	return eventId;	
//End searchCalEvent Function	
}	
