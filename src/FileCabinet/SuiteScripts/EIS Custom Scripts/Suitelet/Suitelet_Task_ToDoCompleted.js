//
// Script:     task_ToDoCompleted.js
//
// Created by: Christine Neale, EBSCO, August 2013.  Based on todoCompleted.js by David Cook.
//
// Function:   1. This suitelet will complete a todo and is designed to be called from
//                an email originally sent by the script server_task.
//
// Notes:   1.  Completed e-mail is not sent from Sandbox environment.  
//
//
// Revisions: 
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function: todoCompleted
//Called:  From email originally sent by the script server_task. 
//Purpose: 1. To complete a To Do task and send completion e-mail.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function todoCompleted(request, response)
{
	// Get the parameters passed in the URL
	var parmTaskId = request.getParameter("taskid");
	var parmAssigned = request.getParameter("assigned");
 
	// Get the current task record & cater for situation where task record cannot be retrieved.
	try
	{
		var taskRecord = nlapiLoadRecord('task', parmTaskId);
	}
	catch (ex)
	{
		//log the error information
		  nlapiLogExecution('ERROR', ex.getCode(), ex.getDetails());
		  //log the task id if an error occurred
		  nlapiLogExecution('ERROR', 'taskid', parmTaskId);
		  //inform the user that an error occurred
		  response.write('The To Do has not been updated. Reason: ' + ex.getDetails());
	}
	
	if (taskRecord)
	{
		var taskId     = taskRecord.getFieldValue('id'); 
		var assigned   = taskRecord.getFieldValue('assigned');
		var status     = taskRecord.getFieldValue('status');
    
		// If the details match up, update the status & send an email to the person who originally assigned the to do
		if (taskId == parmTaskId && assigned == parmAssigned && status != 'COMPLETE') 
		{
			nlapiSubmitField('task', taskId, 'status', 'COMPLETE');  
			response.write('The to do has been set to status Completed.');  
	
		    // Get the environment and set the environment path URL 
			var systemUrl = GetNetSuiteDomain('system');
	
			// Get additional task details to include on the email
			var owner       = taskRecord.getFieldValue('owner');
			var copyTo      = taskRecord.getFieldValues('custevent_copy_email_to'); 
			var title       = taskRecord.getFieldValue('title');
			var priority    = taskRecord.getFieldText('priority');
			var startDate   = taskRecord.getFieldValue('startdate');  	
			var dueDate     = taskRecord.getFieldValue('duedate');
			var notes       = taskRecord.getFieldValue('message');
			var customer    = taskRecord.getFieldValue('company');
			var contact     = taskRecord.getFieldValue('contact');
			var transaction = taskRecord.getFieldValue('transaction');
			var eisacc	    = taskRecord.getFieldText('custevent_todo_eis_acno');
			
			var ownerRecord = nlapiLoadRecord('employee', owner);
			var authorName  = ownerRecord.getFieldValue('entityid');
			var authorEmail = ownerRecord.getFieldValue('email');
	
			var assignedRecord = nlapiLoadRecord('employee', assigned);
			var assignedName   = assignedRecord.getFieldValue('entityid');
	
			// If 1 or more copy to's were entered add these to the ccArray list of email addresses
			var ccArray = new Array();
			if (copyTo)
			{
				for (var cc = 0; cc < copyTo.length; cc++)
				{
					var copyToEmail  = nlapiLookupField('employee', copyTo[cc], 'email');
					if (copyToEmail)
					{
						ccArray[cc] = copyToEmail;
					}
				}
			}    	
	
			var customerName;
			if (customer)
			{
				// Get the customer record
				var customerRecord = nlapiLoadRecord('customer', customer);	
				// Get the customer name & account number
				customerName  = customerRecord.getFieldValue('entityid');
				// accountNumber = customerRecord.getFieldValue('custentity_accountnumber');
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
			todoTitle = 'NetCRM To Do (Completed): ';
	
			if (customer)
			{
				todoTitle += customerName + '; ';
			}			
			todoTitle += taskRecord.getFieldValue('title');	
	
			// Set the todo heading
			var todoHeading;
			todoHeading = 'TO DO ASSIGNMENT (Completed)';
		
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
			emailBody += '<tr><td colspan="2" class="bodydata">The following to do originally assigned by you in NetCRM to '+assignedName+' has been Completed.</td></tr>';
			emailBody += '<tr><td>&nbsp;</td></tr>';
			emailBody += '<tr><td valign="top" width="25%" class="bodylabel">Description:</td><td valign="top" width="73%" class="bodydata"><a href="'+systemUrl+'/app/crm/calendar/task.nl?id='+taskId+'">'+title+'</a></td></tr>';
			emailBody += '<tr><td valign="top" class="bodylabel">Company:</td><td valign="top" class="bodydata"><a href="'+systemUrl+'/app/common/entity/custjob.nl?id='+customer+'">'+customerName+'</a></td></tr>';
	
			if (eisacc)
			{
				emailBody += '<tr><td valign="top" class="bodylabel">EIS Account:</td><td valign="top" class="bodydata">'+eisacc+'</td></tr>';
			}
			
			if (contact)
			{
				emailBody += '<tr><td valign="top" class="bodylabel">Contact:</td><td valign="top" class="bodydata"><a href="'+systemUrl+'/app/common/entity/contact.nl?id='+contact+'">'+contactName+'</a></td></tr>';
			}
	
			if (transaction)
			{
				emailBody += '<tr><td valign="top" class="bodylabel">Related Opportunity:</td><td valign="top" class="bodydata"><a href="'+systemUrl+'/app/accounting/transactions/opprtnty.nl?id='+transaction+'">'+relatedOpportunity+'</a></td></tr>';
			}
	
			emailBody += '<tr><td valign="top" class="bodylabel">Priority:</td><td valign="top" class="bodydata">'+priority+'</td></tr>';
			emailBody += '<tr><td valign="top" class="bodylabel">Status:</td><td valign="top" class="bodydata">COMPLETE</td></tr>';
			emailBody += '<tr><td valign="top" class="bodylabel">Start Date:</td><td valign="top" class="bodydata">'+startDate+'</td></tr>';
			emailBody += '<tr><td valign="top" class="bodylabel">Due Date:</td><td valign="top" class="bodydata">'+dueDate+'</td></tr>';
			emailBody += '<tr><td valign="top" class="bodylabel">Notes:</td><td valign="top" class="bodydata">'+notes+'</td></tr>';
			emailBody += '</table>';
	        emailBody += '</body></html>';
	
	        // Send the email
	        nlapiSendEmail(assigned, owner, todoTitle, emailBody, ccArray, null, null);	
		}
		else if (taskId != parmTaskId)
		{
			response.write('The to do has not been updated, the taskid is invalid.');  
		}
		else if (assigned != parmAssigned)
		{
			response.write('The to do has not been updated, the assigned details do not match.');  
		}  
		else if (status == 'COMPLETE')
		{	
			response.write('The to do has not been updated, the status was already set to Completed.');
		}   
	}
}
// End function todoCompleted  