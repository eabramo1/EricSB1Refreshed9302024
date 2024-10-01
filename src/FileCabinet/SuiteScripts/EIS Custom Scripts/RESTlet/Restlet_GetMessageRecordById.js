/*
* PRODUCTION doc -
* File:  Restlet_GetMessageRecordById.js
*
* Module Description:  This Restlet will return Support Case message data when given a message ID.
* 
* Library Scripts Used:
		library_utility.js  -- 
		library_file_handler.js -- Library Script used to for extracting file/attachment details (namely ID)
* 
* JSON input expected:
	{
		"message_id":"[message_id]",
		"message_include_file_info": "(T/F)"   -Used to include/exclude attachment info with messages
	}
* JSON output expected:
		restlet_status
		restlet_status_details
		message_id
		message_date
		message_author
				*internalid
				*name
		message_recipient
				*internalid
				*name
		message_body
		message_cc
		message_author_email
		message_emailed
		message_hasattachment
		message_lastmodifieddate
		message_recipient_email
		message_subject
		--(if message_include_file_info = 'T')
		    file_array: [
        {
            file_id
            file_name
            file_datecreated
            file_url
            file_folder
            file_size
            file_type
        }
		]


Message:  GetMessageRecordById
* 
* Version    Date            	Author				Remarks
* 1.00       2/15/2018			Andrew Mackie		???
* 			 2/19/2018			Eric Abramo			minor changes - removed message_contact field - no data in this field
* 													also removed duplicate output of Message_date field
* 			 2/21/2018			Pat Kelleher		Moved this to SB2 and tested
*            3/28/2018			Pat Kelleher		Moved to Production
*            7/02/2018			Jeff Oliver			Adding file/attachment info to be displayed in an array
*/

function GetMessageRecordById(datain)
{
	nlapiLogExecution('debug', 'RESTLET GetMessageRecordById started'); 
	var restlet_status = 'ERROR';
	var restlet_status_details = '';

	try
	{
		// Lookup case and load it - Do I have to do this for Message or is Case needed first?
		nlapiLogExecution('debug', 'datain.message_id=' + datain.message_id);	
		
		var message = nlapiLoadRecord('message', datain.message_id);

// https://system.sandbox.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2017_2/script/record/message.html
		var message_id = datain.message_id;
		var message_date = message.getFieldValue('messagedate');
		var message_author = L_formatListFieldJSON(message, 'author');
		var message_recipient = L_formatListFieldJSON(message, 'recipient');
		var message_body = message.getFieldValue('message');
		var message_cc = message.getFieldValue('cc');
		var message_author_email = message.getFieldValue('authoremail');
		var message_emailed = message.getFieldValue('emailed');
		var message_hasattachment = message.getFieldValue('hasattachment');
		var message_lastmodifieddate = message.getFieldValue('lastmodifieddate');
		var message_recipient_email = message.getFieldValue('recipientemail');
		var message_subject = message.getFieldValue('subject');
		var message_include_file_info = 'F';
		
		
		if (datain.message_include_file_info)
		{
		
			message_include_file_info = datain.message_include_file_info;
			
		}

		//J.O. returns array of file/attachment info for the message record (if message_include_file_info == 'T')
		
		if(message_include_file_info == 'T')
		{
		
			
			if(message_hasattachment == 'T') 	
			{
				//Call the L_GetFileInfo function in library_utility script
				var file_array = L_GetFileInfo('Message', message_id)
				
				if(L_fileRetrieverMsg != 'Search Successful')
					
				{restlet_status = 'ERROR';
				restlet_status_details = 'File retrieval error:' + L_fileRetrieverMsg;
				}
				
			}
		}
		
		nlapiLogExecution('debug', 'Success Loading GetMessageRecordById',  'message_id: '+datain.message_id);
		restlet_status = 'SUCCESS';
	}

	//Catch is the error system attached to this RESTlet.
	catch ( e )
	
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'GetMessageRecordById Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'GetMessageRecordById Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
		//Dataout returns all of the case message data specified from the variables above.
		var dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, message_id: message_id, message_date: message_date,
					   message_author: message_author, message_recipient: message_recipient, message_body: message_body, message_cc: message_cc,
					   message_author_email: message_author_email, message_emailed: message_emailed, message_hasattachment: message_hasattachment,
					   message_lastmodifieddate: message_lastmodifieddate, message_recipient_email: message_recipient_email, message_subject: message_subject, file_array: file_array};

	nlapiLogExecution('debug', 'RESTLET GetMessageRecordById ended...');	
	return(dataout);
}