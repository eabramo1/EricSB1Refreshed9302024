//
// Script:     UserEvent_Task_After_submit.js (replacing UserEvent_Task.js)
//
// Created by: Krizia Ilaga (NSACS Consultant) but largely based on UserEvent_Task.js (& Revision history from previous script remains)
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
//      14Feb2019   ACS - KIlaga Updated email template, removed functions that are no longer being reference on the main entry point UserEvent_task_after_submit
//		28Feb2019	CNeale	US483145 Added code to allow call report email & subs date update code to run where old form is still associated with Task  
//		01Apr2019	CNeale	F24174 Implementation
//      03May2019	CNeale	US489444/US490649 Account specific domains - change in domain URL format for Forms - temp. solution to hard code domain in URL. 
//		14May2019	CNeale	Remove temp. solution from US489444/US490649
//		28Oct2019	CNeale	US560343 Add Date Visited to Call Report Email (& Date --> Date Entered)
//      06Sep2024	eAbram	TA926280 Changes to External Suitelet URLs for NetSuite Release 2024.2
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: UserEvent_task_after_submit
//Called:  After Submit 
//Purpose: 1. To build and send To Do assignment e-mail for To Do tasks.
//         2. To build and send Call Report email for Call tasks.
//         3. To create and maintain Calendar Event for Call tasks
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function UserEvent_task_after_submit()
{
	//---------------------------------------------------------------------------
	//  Build and send To Do assignment e-mail for To Do tasks.  
	//---------------------------------------------------------------------------

	// if the record was not deleted
	if (type != 'delete') 
	{
		// Get the current task record
		var taskRecId = nlapiGetRecordId();
		// Get the current task record
		var currentRecord = nlapiLoadRecord('task', taskRecId);
		var todoRecord = currentRecord;
	}
	else
	// Record was deleted
	{
	    todoRecord = nlapiGetOldRecord();
	}  
	


	// run for newly created records only
		if ( type == 'create' )
		{
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
	
		 

	// To Do task & send EBSCO e-mail set. 
	var todoTask = todoRecord.getFieldValue('custevent_is_todo_task');
	var sendEBSCOEmail = todoRecord.getFieldValue('custevent_ebsco_email');
	if (todoTask == 'T' && sendEBSCOEmail == 'T' && type != 'delete')
	{
		sendAssignmentEmail(todoRecord);
	}
		 
	// ACS form. 
	var acsForm = todoRecord.getFieldValue('custevent_nsacs_acsformflag');
	// New Consolidated form 
	var newTaskForm = todoRecord.getFieldValue('custevent_nsacs_acsformflag');
	// US483145 identify EIS Sales Calls (independent of form) 
	 callTask = todoRecord.getFieldValue('custevent_is_sea_call');
	// Call status is Completed.
	var callStatus = todoRecord.getFieldValue('status');
	//US483145 Do this for EIS Sales Calls even if not on new form 
	if ((newTaskForm == 'T' || callTask == 'T') && callStatus == 'COMPLETE' && type != 'delete') 
	{
		updateSubsCallDate(todoRecord);
	}
	// Send EBSCO e-mail set.

	var sendEBSCOEmail = todoRecord.getFieldValue('custevent_ebsco_email');
	nlapiLogExecution('DEBUG', 'Params', sendEBSCOEmail + " " + type);
	//US483145 Do this for EIS Sales Calls even if not on new form 
	if ((acsForm == 'T' || callTask == 'T') && sendEBSCOEmail == 'T' && type != 'delete') 
	{
		emailCallReport(todoRecord);
	}
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
   // US489444/US490649 Account specific domains - change in domain URL format for Forms  (temp. solution to hard code domain in URL removed)
    //production
    if (environment == 'PRODUCTION') {
		// TA926280 new URL for Suitelets that are Available without Login - Sept 2024
		envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875&ns-at=AAEJ7tMQuOfHn3OoRsOEy7mbLST6QLrxb4MRT9jgG8GYU8suDv4'; // external URL of deployment of suitelet
    }
    //sandbox
    else if (environment == 'SANDBOX') {
		// SB1-refresh-2024-09-30
		// TA926280 new URL for Suitelets that are Available without Login - Sept 2024
        if (nscompany == '392875_SB1') {
           envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB1&ns-at=AAEJ7tMQS1VFW7yZ9mAH7crjVp1TSX3w4m_WnNw0XbJfpZ87oiM';
        }
        //sb2
		// TA926280 new URL for Suitelets that are Available without Login - Sept 2024
        else if (nscompany == '392875_SB2') {
            envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB2&ns-at=AAEJ7tMQ9PNHpKbgU_kuoCFtE7CJ2l8Jx6Le86zZ-o8kUvH7XoM';
        }
        //sb3
		// TA926280 new URL for Suitelets that are Available without Login - Sept 2024
        else if (nscompany == '392875_SB3') {
            envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_SB3&ns-at=AAEJ7tMQfX25Ksk3fqY0ifkZokcaC0z8J8tvUn1_YnfIxkilBFU';
        }
    }
    //beta - J.O. updated URL below on 3/14/18 due to environment changes in 2018.1 upgrade
	// TA926280 new URL for Suitelets that are Available without Login - Sept 2024
    else if (environment == 'BETA') {
        envURL = formsUrl + '/app/site/hosting/scriptlet.nl?script=35&deploy=1&compid=392875_RP&ns-at=AAEJ7tMQeTkz51bodFOheoUd7o1p5Jtzw9QoV-SRU7R3FYW4QeA';
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
	var companyPMDate  = isNull(customerRecord.getFieldValue('custentity_previous_subs_call_date'));
	var companyPrmSR   = customerRecord.getFieldValue('custentity_primary_sales_rep');
	// Aug 14 - Remove  Subs Primary Sales Rep var companySubSR   = isNull(customerRecord.getFieldText('custentity_subs_primary_sales_rep'));
	var companyEPTerr  = customerRecord.getFieldText('custentity_epterritory');	
	var companyFTE     = isNull(customerRecord.getFieldValue('custentity_fte'));
	// Retrieve event fields to include in the Call Report
	var callDate       = todoRecord.getFieldValue('startdate');
	var callSubject    = todoRecord.getFieldValue('title');
	var callType       = todoRecord.getFieldText('custevent_tasktype');
	var callNotesSum   = todoRecord.getFieldValue('custevent_subs_call_notes_summary') ? todoRecord.getFieldValue('custevent_subs_call_notes_summary') : " ";
	var callNotesFD    = todoRecord.getFieldValue('custevent_subs_call_notes_further') ? todoRecord.getFieldValue('custevent_subs_call_notes_further') : " ";
	//Added by ACS - 03/07/2019
	var ybpSalesRep = customerRecord.getFieldText('custentity_teammember16') ? customerRecord.getFieldText('custentity_teammember16') : " ";
	var custServiceRep = customerRecord.getFieldText('custentity_subs_csr') ? customerRecord.getFieldText('custentity_subs_csr') : " ";
	// US560343 Add Date Visited
	var dateVisited    = todoRecord.getFieldValue('custeventdate_visited'); 	

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
	
	// Email subject - include ID - CNeale Aug2014
	var emailSubject =  'CALL REPORT From: ';
	    emailSubject += salesRepName;
	    emailSubject += ' for: ';
	    emailSubject += companyNameID; 
	
	// Email body (Heading)
	var emailBody =  '<html><head><title>EBSCO Call Report</title>';
        emailBody += '<style>';
        emailBody += '.emailheading {font-size: 14pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: center;}';
        emailBody += '.sectionheading {font-size: 12pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: left;}';
        emailBody += '.sectionsubheading {font-size: 11pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: navy; text-align: left;}';
        emailBody += '.bodylabel {font-size: 9pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: black; text-align: left;}';
        emailBody += '.bodydata {font-size: 10pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; color: black; text-align: left;}';
        emailBody += '.tableheading {font-size: 9pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; font-weight: bold; color: black;}';
        emailBody += '.tabledata {font-size: 10pt; font-family: Arial, Verdana, Geneva, Helvetica, Sans-serif; color: black;}';
        emailBody += '</style>';
        emailBody += '</head>';
	    emailBody += '<body>';
		emailBody += '<table cellspacing="2" cellpadding="2" border="0" width="95%">';
		emailBody += '<tr><td colspan=3 class="emailheading">SALES CALL/VISIT REPORT</td></tr>';
		emailBody += '<tr><td colspan=3></td></tr>';
		
        // Email body (Organisation section) - CN Aug14 Subs Primary Sales Rep removed, Territory & FTE added
		emailBody += '<tr><td colspan=3 class="sectionheading"><u>Company Information:</u></td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Company:</td><td valign="top" width="78%" class="bodydata"><a href="'+systemUrl+'/app/common/entity/custjob.nl?id='+companyId+'">'+companyNameID+'</a></td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Territory:</td><td valign="top" width="78%" class="bodydata">'+companyEPTerr+'</td></tr>';		
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Market / Segment:</td><td valign="top" width="78%" class="bodydata">'+companyMarket+' / '+companySegment+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">FTE:</td><td valign="top" width="78%" class="bodydata">'+companyFTE+'</td></tr>';		
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Previous Contact:</td><td valign="top" width="78%" class="bodydata">'+companyPMDate+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Primary Sales Rep:</td><td valign="top" width="78%" class="bodydata">'+companyPrmSR+'</td></tr>';	
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">GOBI/SSD Sales Rep:</td><td valign="top" width="78%" class="bodydata">'+ybpSalesRep+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Customer Service Rep:</td><td valign="top" width="78%" class="bodydata">'+custServiceRep+'</td></tr>';		
			
		emailBody += '<tr><td colspan=3></td></tr>';		

	    // Email body (Call section)
		emailBody += '<tr><td colspan=3 class="sectionheading"><u>Call Notes and Action Items:</u></td></tr>';
		// US560343 Add Date Visited & change "Date" to "Date Entered"
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Date Entered:</td><td valign="top" width="78%" class="bodydata">'+callDate+'</td></tr>';
		if (dateVisited)
			{	
				emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Visit Date:</td><td valign="top" width="78%" class="bodydata">'+dateVisited+'</td></tr>';
			}	
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Subject:</td><td valign="top" width="78%" class="bodydata">'+callSubject+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Type:</td><td valign="top" width="78%" class="bodydata">'+callType+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Call/Visit Notes:</td><td valign="top" width="78%" class="bodydata">'+callNotesSum+'</td></tr>';
		emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Action Items:</td><td valign="top" width="78%" class="bodydata">'+callNotesFD+'</td></tr>';

		if (callProductLines){
			for (var cpl = 0; cpl < callProductLines.length; cpl++){
				 if (cpl == 0)
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Product Line(s):</td><td valign="top" width="78%" class="bodydata">'+callProductLines[cpl]+'</td></tr>';
			 	 else
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+callProductLines[cpl]+'</td></tr>';
			}
		}

		if (callTopics){
			for (var topic = 0; topic < callTopics.length; topic++){
				 if (topic == 0)
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Topic(s):</td><td valign="top" width="78%" class="bodydata">'+callTopics[topic]+'</td></tr>';
				 else
					 emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+callTopics[topic]+'</td></tr>';
			}
		}

		emailBody += '<tr><td colspan=3></td></tr>';

		// Email body (Call notes)
		emailBody += '<tr><td colspan=3 class="sectionheading"><u>Other Information</u></td></tr>';
		
        // Organisation attendees
		for (var oAtt = 0; oAtt < orgAttDetail.length; oAtt++){
		     if (oAtt == 0)
		         emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">Company Attendees:</td><td valign="top" width="78%" class="bodydata">'+orgAttDetail[oAtt]+'</td></tr>';
		     else
			     emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+orgAttDetail[oAtt]+'</td></tr>';
		}
		// EBSCO attendees
		for (var eAtt = 0; eAtt < ebscoAtt.length; eAtt++){
		     if (eAtt == 0)
		         emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel">EBSCO Attendees:</td><td valign="top" width="78%" class="bodydata">'+ebscoAtt[eAtt]+'</td></tr>';
		     else
			     emailBody += '<tr><td width="2%"></td><td valign="top" width="20%" class="bodylabel"></td><td valign="top" width="78%" class="bodydata">'+ebscoAtt[eAtt]+'</td></tr>';
		}
		
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