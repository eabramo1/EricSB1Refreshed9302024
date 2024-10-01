/* Revision Log:-
 * ******************************************************************************************************************************** 
 * KMcCormack	05/09/2016	US113721:  Additions to Service Issue Form &
 * 							US112271:  Request for Form (outside of NetCRM) to Enter Internal Software Problem Reports	
 * 										Combined previously named files, server_siClosedNotice.js and server_SI_beforeLoad.js, 
 * 										into this one file, UserEvent_Service_Issue and this script file was migrated to the 
 * 										EIS Custom Scripts folder.
 * 					 
 * KMcCormack	07-22-2016	US128163:  SI - Rally Connector SI Form Logic - Remove Create/Synch Rally Checkbox Restrictions  
 * 
 * CNeale		01-11-2017	US173485:	Replace (legacy) Product, Interface, Area/Modules with new values.
 * eAbramo		11-28-2017	US305989:	Populate new 'Rally Link Date' field if Rally Number field is populated
 * eAbramo		01-29-2018	DE26996:	Auto-Close Not Setting the SI Close Date field & Backfill SI Closed Date
 * 
 * KMcCormack	12-03-2018	US414244:	CXP - CRM to SF Integration:  In support of the new SalesForce based Customer Portal (CXP),
 * 										any new, or updated, Service Issue which is associated to a Case which has been synched from
 * 										NetCRM to SalesForce should be flagged to go to SalesForce, but ONLY if the Service
 * 										Issue Type = Software Defect, Service Availablity & Performance Defect,  or Content Problem Report.
 * 										Cases which have been synched to SalesForce can be identified by the presence of non-blank
 * 										SalesForce Case ID field on the Case record associated with the Service Issue.										 
 * 
 * 								******  ADDED library_constants.js to this script record in order to call new library function: IsSFtypeSI() ******									 
 *
 *
 * Mackie		1/2/2020:				Updated the 'siClosed' generated email notification with a link to the Service Issue Detective for reopening an SI.
 * Ariana		1/2/2020:				Moved the 'si_cases_count' var up so we can use it to update the custrecord_count_linked_cases on submit. 								
 * Mackie		1/9/2020				Commented out the section of code that was hiding the 'Online SI Submitter Email' field: 'custrecord_online_si_submitter_email'.
 *
 * ********************************************************************************************************************************
 */

/*Global Constants*/
var constants = {	
		online_si_user_id: '1589038',
		online_si_user_name: 'ONLINE SI USER',
		ebsco_si_form:  '150',
		checkbox_true: 'T',
		checkbox_false: 'F'
	 };

function si_beforeLoad(type, form)
{
	var cases = nlapiGetFieldValues('custrecord_sicase');
	if (cases != null && cases != '')
	{
		var cases_count = cases.length;
		// set field to indicate if there is an attached case with an SI FollowUp Date
		var followUp = 'False';
		for ( var c=0; cases_count != null && c < cases_count && c < 100; c++ )
		{	
			var si_followUp_date = nlapiLookupField('supportcase', cases[c], 'custevent_customer_si_followup_date');
			//alert('si_followUp_date is: '+si_followUp_date);
			if (si_followUp_date != null && si_followUp_date != '') 
			{
				followUp = 'True';
				break;
			}
		}
		if ( (cases_count > 100) && (followUp == 'False') )
		{
			followUp = 'Unknown';			
		}
		nlapiSetFieldValue('custrecord_cases_need_followup', followUp);
	}
	/* [Mackie 1/9/2020] Hiding this entire section because we want the 'Online SI Submitter Email' field to always show regardless of who/what created it.
  	//05-01-16: Only show the "Online Submitter Email" field if the form was submitted online by the "ONLINE SI USER"
	var si_creator = nlapiGetFieldValue('custrecord_sicreatedby');

	if (si_creator != constants.online_si_user_id)
	{		
		form.getField('custrecord_online_si_submitter_email').setDisplayType('hidden');
		nlapiLogExecution('DEBUG', 'Hiding submitters email because NOT created by online user');
	}
    */
   
	
	//07-22-2016:  US128163 - Remove Create/Synch Rally Checkbox Restrictions. Field custrecord_linked_rally_url will
	//no longer have a set display type of 'Inline Text' in the 'EBSCO Service Issue Form', instead that url field will
	//be editable for users that have the 'custentity_allow_rally_sync' permission turned on, but ONLY if they are editting
	//an existing SI. For all new/create SIs the url link field is type 'Inline'.  For all other users without sync permission
	//this custrecord_linked_rally_url field will have a display type of 'Inline Text' and not be editable.
	if(nlapiGetFieldValue('customform') == constants.ebsco_si_form) {
		nlapiLogExecution('DEBUG', '**Form is ebsco_si_form');
		var thisUser = nlapiGetUser();
		if(nlapiLookupField('employee', thisUser, 'custentity_allow_rally_sync') == constants.checkbox_true && type != 'create') {	
			nlapiLogExecution('DEBUG', '**rally link is normal');
			form.getField('custrecord_linked_rally_url').setDisplayType('normal');
		 }
		else {
			nlapiLogExecution('DEBUG', '**rally link is inline');
			form.getField('custrecord_linked_rally_url').setDisplayType('inline');
		 }
	}	
}

function siAfterSubmit(type)
{
	// added condition on 01-16-10 that this is not User Services SI
	if( ((type == 'edit') || (type == 'xedit')) && nlapiGetFieldValue('custrecord_is_user_services_si') != 'T' )
	{
		// record after the edit
		var currentRecord = nlapiGetNewRecord();
		if (type == 'xedit')
		{
			// xedit does not supply all fields needed, so load record fully
			currentRecord = nlapiLoadRecord('customrecord36',currentRecord.getId())
		}
		// record before the edit
		var previousRecord = nlapiGetOldRecord();
		
		var siUpdated = false;
		var siClosed = false;
		
		// values needed to check if the SI has been closed
		var currentStatus = currentRecord.getFieldValue('custrecord_sistatus');
		var previousStatus = previousRecord.getFieldValue('custrecord_sistatus');
		
		// values needed to check if key SI fields have been updated
		var currRootCause = currentRecord.getFieldValue('custrecord_sirootcause');
		var currResolution = currentRecord.getFieldValue('custrecord_siresolution');
		var currEstFix = currentRecord.getFieldValue('custrecord_sidate');
		var currPriority = currentRecord.getFieldValue('custrecord_sipriority');
		
		var prevRootCause = previousRecord.getFieldValue('custrecord_sirootcause');
		var prevResolution = previousRecord.getFieldValue('custrecord_siresolution');
		var prevEstFix = previousRecord.getFieldValue('custrecord_sidate');
		var prevPriority = previousRecord.getFieldValue('custrecord_sipriority');
		
		// how was the SI edited?  (closed = 7 or 11)
		if((currentStatus == 7 || currentStatus == 11) && (previousStatus != 7 && previousStatus != 11))
		{
			// the SI was closed
		    siClosed = true;
		    nlapiLogExecution('DEBUG', 'siClosed', 'true');
		}
		else if( (currentStatus != 7) && (!epStrComp(currRootCause,prevRootCause) || !epStrComp(currResolution,prevResolution) || !epStrComp(currEstFix,prevEstFix) || !epStrComp(currPriority,prevPriority)) )
		{
			// key fields on the SI were updated
			siUpdated = true;
			
			// log messages used to debug
			var logMessage2 = 'Update: ';
			if(!epStrComp(currRootCause,prevRootCause))
			{
				logMessage2 = logMessage2 + '[ROOTCAUSE] C: ' + currRootCause + ' P: ' + prevRootCause + ' _ ';
			}
			if(!epStrComp(currResolution,prevResolution))
			{
				logMessage2 = logMessage2 + '[RESOLUTION] C: ' + currResolution + ' P: ' + prevResolution + ' _ ';
			}
			if(!epStrComp(currEstFix,prevEstFix))
			{
				logMessage2 = logMessage2 + '[ESTFIX] C: ' + currEstFix + ' P: ' + prevEstFix + ' _ ';
			}
			if(!epStrComp(currPriority,prevPriority))
			{
				logMessage2 = logMessage2 + '[PRIORITY] C: ' + currPriority + ' P: ' + prevPriority + ' _ ';
			}
		}
		
		if(siClosed || siUpdated)
		{
			var logCounter = 0;
			var logMessage = 'Start';
			
			// HTML Email Components
			var styleSheet = '\n\tp{font-family:arial;font-size:10pt;}';
			styleSheet += '\n\ttd{font-family:arial;font-size:10pt;vertical-align:top;}';
			styleSheet += '\n\th1{font-family:arial;font-size:10pt;font-weight:bold;text-decoration:underline;}';
			var emailHeader = '<html>\n<head>\n<style type="text/css">' + styleSheet + '\n</style>\n</head>\n<body>';
			
			// message contents
			var siSubject = currentRecord.getFieldValue('custrecord_sisynopsis');
			var siNumber = currentRecord.getFieldValue('id');
			var emailSubject = '';
			var emailBody = '';
			var siURL = GetNetSuiteDomain('system') + nlapiResolveURL('record', 'customrecord36', siNumber, false);
			var siLink = '<a href="'+siURL+'">'+siNumber+'</a>';
			var siPriority = nlapiLookupField('customrecord36',siNumber,'custrecord_sipriority',true);
			var caseDetail = '';
			
			// si detail table
			var siDetails = '\n<table>';
			siDetails += epSimpleRow('Number:',siLink);
			siDetails += epSimpleRow('Synopsis:',nlapiEscapeXML(siSubject));
			siDetails += epSimpleRow('Priority:',nlapiEscapeXML(siPriority));
			siDetails += epSimpleRow('Root&nbsp;Cause:',nlapiEscapeXML(currRootCause));
			siDetails += epSimpleRow('Resolution:',nlapiEscapeXML(currResolution));
			siDetails += epSimpleRow('Est.&nbsp;Fix&nbsp;Date:',nlapiEscapeXML(currEstFix));
			siDetails += '\n</table>';
			
			// generate email for closed or updated si
			if(siClosed)
			{
				emailSubject = 'SI Closed: ' + siNumber + ': ' + siSubject;
				emailBody = emailBody + '\n<h1>Closed Service Issue Notice</h1>';
              	emailBody = emailBody + siDetails + '\n<p>Please review the following open linked case(s) and close if applicable:</p>\n<p>If you need to reopen the Service Issue please follow the process that is outlined here: <a href="https://corptools.ebsco-gss.net/documentation/sitoolkit/#reopen">Reopening an SI</a></p>';
			}
			else // the si was updated
			{
				emailSubject = 'SI Updated: ' + siNumber + ': ' + siSubject;
				emailBody = emailBody + '\n<h1>Updated Service Issue Notice</h1>';
				emailBody = emailBody + siDetails + '\n<p>Please review the following open linked case(s) and update if applicable:</p>';
			}
			
			// prepare search query
			var siInternalId = currentRecord.getId();
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('internalid',null,'anyof',siInternalId);
			//filters[1] = needs filter to search for assigned to "is not null"
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('id',null,null);
			columns[1] = new nlobjSearchColumn('custrecord_sisynopsis',null,null);
			columns[2] = new nlobjSearchColumn('casenumber','custrecord_sicase',null);
			columns[3] = new nlobjSearchColumn('title','custrecord_sicase',null);
			columns[4] = new nlobjSearchColumn('status','custrecord_sicase',null);
			columns[5] = new nlobjSearchColumn('assigned','custrecord_sicase',null);
			columns[6] = new nlobjSearchColumn('internalid','custrecord_sicase',null);
			
			// perform search
			// filter for "is not null" is added to search created in the UI referenced here
			var searchResults = nlapiSearchRecord('customrecord36',3318,filters,columns);
			//var searchResults = nlapiSearchRecord('customrecord36',null,filters,columns);
			
			// if there are associated cases
			if(searchResults != null)
			{
				logMessage = logMessage + ', Search:' + searchResults.length;
				
				// draft a 2D array to add grouping on assignment
				// Y = users to email, X = cases to include in each email
				var groupedResults = new Array();
				for( x in searchResults)
				{
					y = searchResults[x].getValue('assigned','CUSTRECORD_SICASE');
					
					if (!groupedResults[y])
					{
						groupedResults[y] = new Array;
						logCounter++;
					}
					groupedResults[y].push(x);
				}
				
				
				logMessage = logMessage + ', Groups:' + logCounter;
				logCounter = 0;
				
				// walk through 2D array and create emails if needed
				// (for each user in grouped results...)
				for(j in groupedResults)
				{
					emailToSend = false;	
					for (k in groupedResults[j])
					{
						i = groupedResults[j][k];
						// check case status to ensure the case is not closed
						// (could add this check into the search itself)
						if(searchResults[i].getValue('status','CUSTRECORD_SICASE') != '5')
						{
							
							if(!emailToSend)
							{
								// set recipient
								var emailRecipient = searchResults[i].getValue('assigned','CUSTRECORD_SICASE');
								emailToSend = true;
								caseDetail = '';
							}
							
							if(emailToSend)
							{
								// add email detail with case info
								var caseSubject = searchResults[i].getValue('title','CUSTRECORD_SICASE');
								var caseNumber = searchResults[i].getValue('casenumber','CUSTRECORD_SICASE');
								var caseUrl = GetNetSuiteDomain('system') + nlapiResolveURL('record', 'supportcase', searchResults[i].getValue('internalid', 'CUSTRECORD_SICASE'), true);
								var caseLink = '<a href="'+caseUrl+'">'+caseNumber+'</a>';
								caseDetail = caseDetail + '\n<p>' + caseLink + ' ' + caseSubject + '</p>';
							}
						}
						var emailMessage = emailHeader + emailBody + caseDetail + '\n</body>\n</html>';
					}
					if(emailToSend)
					{
						nlapiSendEmail(nlapiGetUser(),emailRecipient,emailSubject,emailMessage,null);
						emailToSend = false;
						
						logMessage = logMessage + ', From:' + nlapiGetUser() + '-To:' + emailRecipient;
						logCounter++;
					}
				}
			}
			else
			{
				logMessage = logMessage + ', Search:NULL';
			}
			logMessage = logMessage + ', End:' + logCounter;
			nlapiLogExecution('debug','Email Delivery',logMessage);
			
			if(siUpdated)
			{
				nlapiLogExecution('debug','Updated Fields',type + ' ' + logMessage2);
			}
		}
		
		// DE26996 If SI is Closed and no close date - set SI Close Date
		if (siClosed)
		{
			if (nlapiGetFieldValue('custrecord_si_close_date') == '' || nlapiGetFieldValue('custrecord_si_close_date') == null)
			{
				nlapiSubmitField('customrecord36', currentRecord.getId(), 'custrecord_si_close_date', nlapiDateToString(new Date()));
			}
		}		
		

	    // Check if SI reopened after previously being closed
		if ((currentStatus != 7 && currentStatus != 11) && (previousStatus == 7 || previousStatus == 11))
		{
		    reOpenServiceIssue(currentRecord);
		    nlapiLogExecution('DEBUG', 'siReOpened', 'True');
		}
		
		// US305989: Populate new 'Rally Link Date' field if Rally Number field is populated
		var rally_no = currentRecord.getFieldValue('custrecord_rally_no');
		var rally_link_date = currentRecord.getFieldValue('custrecord_rally_link_date');	
		if (rally_no != '' && rally_no != null)
		{
				// nlapiLogExecution('DEBUG', 'Pass criterion 1a:', 'SI ID: '+currentRecord.getId());
				if (rally_link_date == '' || rally_link_date == null)
				{	// Write date into the Rally Linked Date field
					// nlapiLogExecution('DEBUG', 'Pass criterion 1b:', 'SI ID: '+currentRecord.getId());
					var MyDate = new Date();
					MyDate = nlapiDateToString(MyDate,'date');
					var SI_internalid = currentRecord.getId();
					nlapiSubmitField('customrecord36', SI_internalid, 'custrecord_rally_link_date', MyDate);				
				}
		}
		// US305989: Un-populate 'Rally Link Date' field if Rally Number field is No longer populated
		if (rally_link_date != '' && rally_link_date != null)
		{
			// nlapiLogExecution('DEBUG', 'Pass criterion 2a:', 'SI ID: '+currentRecord.getId());
			if (rally_no == '' || rally_no == null)
			{
				// nlapiLogExecution('DEBUG', 'Pass criterion 2b:', 'SI ID: '+currentRecord.getId());
				var SI_internalid = currentRecord.getId();
				nlapiSubmitField('customrecord36', SI_internalid, 'custrecord_rally_link_date', '');
			}
		}		
	}

	//US414244:	CXP - CRM to SF Integration: any new, or updated, Service Issue which is associated to a Case which has been synched from
	//NetCRM to SalesForce should be flagged to go to SalesForce, but ONLY if the Service Issue Type is one of the following:
	//Software Defect, Service Availablity & Performance Defect,  or Content Problem Report.
	if( (type == 'create') || (type == 'edit') || (type == 'xedit') )
	{
		var currentRec = nlapiGetNewRecord();
		
		// xedit does not supply all fields needed, so have to load record fully. In the case of create or edit, we already have the whole record.
		if (type == 'xedit')
		{				
			currentRec = nlapiLoadRecord('customrecord36',currentRec.getId());
		}
		var SI_internalid = currentRec.getId();
		var sf_si_id = currentRec.getFieldValue('custrecord_sf_si_id');
		var si_issue_type = currentRec.getFieldValue('custrecord_siissuetype');
		var si_cases = currentRec.getFieldValues('custrecord_sicase');
      //[a.hazen 1.2.2020] moved this var up so we can use it to update the custrecord_count_linked_cases on submit, if needed.
     	var si_cases_count = ((si_cases != null && si_cases != '') ? si_cases.length : 0);
      //[a.hazen 1.13.2020] Validate whether we need to update linked case count	
      var cur_linkedCases = Number(nlapiGetFieldValue('custrecord_count_linked_cases'));
       nlapiLogExecution('DEBUG', 'casecounts', 'current:'+cur_linkedCases+'; new:'+si_cases_count);
             if (si_cases_count != cur_linkedCases)
       {      // populate si_cases_count into the NEW "number of Linked Cases" field
             nlapiSubmitField('customrecord36', SI_internalid, 'custrecord_count_linked_cases', si_cases_count);
       }

		//If SI has not already been synched to SF, first see if it has any cases and if it is the appropriate issue type to send to SF
		if ((sf_si_id == null || sf_si_id == '') &&
			(si_cases_count > 0) &&
			(LC_SvcIssueType.IsSFtypeSI(si_issue_type))) {				
			var send_SI_to_SF = false;
			
			nlapiLogExecution('DEBUG', 'CXP', 'Service Issue MAY qualify for SF, so check '+si_cases_count+ ' attached case(s) for SF Id');
			
			//Loop through each associated cases checking if any one has been synched to SF. When one is found, exit the loop and set this SI to go to SF. 
			for ( var c=0; si_cases_count != null && c < si_cases_count && !send_SI_to_SF; c++ )
			{					
				var sf_case_id = nlapiLookupField('supportcase', si_cases[c], 'custevent_sf_case_id');
				nlapiLogExecution('DEBUG', 'CXP','Looping through:  si_cases['+c+'].id = '+si_cases[c]+ '    ....    si_cases['+c+'].sf_case_id = '+sf_case_id);
				if (sf_case_id != null && sf_case_id != '') 
				{
					send_SI_to_SF = true;					
				}
			}
			
			nlapiLogExecution('DEBUG', 'CXP', 'After case loop, send_SI_to_SF = '+send_SI_to_SF);
			
			//If all conditions were met, send_SI_to_SF will be true and we should trigger this SI to synch to SF by setting SF SI ID to 'createNew'
			if(send_SI_to_SF) {
				var si_Id = nlapiGetRecordId();
				nlapiSubmitField('customrecord36', si_Id, 'custrecord_sf_si_id', LC_SF_createNew, null);
			}	
		}		
	}
	
	
	//05-09-2016 If SI was submitted via new online browser form, send email confirmation of the SI number back to the submitter's email
	if( type == 'create' && nlapiGetFieldValue('custrecord_sicreatedby') == constants.online_si_user_id && nlapiGetFieldValue('customform') == constants.ebsco_si_form) {
		nlapiLogExecution('DEBUG', 'Created a SI record using online form');	
		var onlineSubmitterEmail = nlapiGetFieldValue('custrecord_online_si_submitter_email');
		if(onlineSubmitterEmail != null && onlineSubmitterEmail.length > 0) {
			nlapiLogExecution('DEBUG', 'Submitters email is = ' + onlineSubmitterEmail);
			sendOnlineSIConfirmation(onlineSubmitterEmail)
		}
	}
}

// Handles when a case has been reopened after being closed.
function reOpenServiceIssue(record)
{
    //load record for edit
    var rec = nlapiLoadRecord(record.getRecordType(), record.getId());

    //get current date
    var newCloseDate = nlapiDateToString(new Date());
    nlapiLogExecution('DEBUG', 'newCloseDate', newCloseDate);

    //get previous close date
    var previousCloseDate = record.getFieldValue('custrecord_si_close_date');
    nlapiLogExecution('DEBUG', 'previousCloseDate', previousCloseDate);

    //update fields (record time stamping)
    rec.setFieldValue('custrecord_si_last_reopened_date', newCloseDate);
    rec.setFieldValue('custrecord_si_last_closed_date', previousCloseDate);
    rec.setFieldValue('custrecord_si_close_date', null);

    //commit changes
    var id = nlapiSubmitRecord(rec);
    nlapiLogExecution('DEBUG', 'id', id);
}

// This function writes a table row <tr> with two <td>'s
function epSimpleRow(col1,col2)
{
	var htmlRow = '\n\t<tr>';
	htmlRow = htmlRow + '\n\t\t<td>' + col1 + '</td>';
	htmlRow = htmlRow + '\n\t\t<td>' + col2 + '</td>';
	htmlRow = htmlRow + '\n\t</tr>';
	return(htmlRow);
}

function epStrComp(str1,str2)
{
	//converts null to empty string before comparison and returns true if equal
	if (str1 == null){ str1 = ''};
	if (str2 == null){ str2 = ''};
	if (str1 == str2)
	{
		return(true)
	}
	else
	{
		return(false)
	}
}

function sendOnlineSIConfirmation(submitterEmail) {
	// HTML Email Components
	nlapiLogExecution('debug','Entering sendOnlineFormConfirmation');
	var styleSheet = '\n\tp{font-family:arial;font-size:10pt;}';
	styleSheet += '\n\ttd{font-family:arial;font-size:10pt;vertical-align:top;}';
	styleSheet += '\n\th1{font-family:arial;font-size:12pt;font-weight:bold;}';
	var emailHeader = '<html>\n<head>\n<style type="text/css">' + styleSheet + '\n</style>\n</head>\n<body>';
	
	var currentRecord = nlapiGetNewRecord();
	currentRecord = nlapiLoadRecord('customrecord36',currentRecord.getId())
		
	// message contents
	var siSynopsis = currentRecord.getFieldValue('custrecord_sisynopsis');
	var siNumber = currentRecord.getFieldValue('id');	
	var siURL = GetNetSuiteDomain('system') + nlapiResolveURL('record', 'customrecord36', siNumber, false);
	var siLink = '<a href="'+siURL+'">'+siNumber+'</a>';
	var siPriority = nlapiLookupField('customrecord36',siNumber,'custrecord_sipriority',true);
	var siSeverity = nlapiLookupField('customrecord36',siNumber,'custrecord993',true);
	var siTimeSensitivity = nlapiLookupField('customrecord36',siNumber,'custrecord_si_time_sensitivity',true);
	var siBusValue = currentRecord.getFieldValue('custrecord_si_business_value');
	var siCreatedDate = currentRecord.getFieldValue('created');
	var siSubmitter = currentRecord.getFieldValue('custrecord_online_si_submitter_email');
	var siStatus = nlapiLookupField('customrecord36',siNumber,'custrecord_sistatus',true);
	var siCustomerType = nlapiLookupField('customrecord36',siNumber,'custrecord_si_customertype',true);
// US173485 Reference new fields for Interface, Area/Module & Product	
	var siInterface = nlapiLookupField('customrecord36',siNumber,'custrecord_si_interface_si',true);
	var siAreasModules = nlapiLookupField('customrecord36',siNumber,'custrecord_si_area_module_si',true);
	var siProducts = nlapiLookupField('customrecord36',siNumber,'custrecord_si_product_si',true);
	var siBrowser = nlapiLookupField('customrecord36',siNumber,'custrecord_sibrowser',true);
	var siPlatform = nlapiLookupField('customrecord36',siNumber,'custrecord_siplatform',true);
	var siPersistentLink = currentRecord.getFieldValue('custrecord_sipersistentlook') || '';
	var siIssueType = nlapiLookupField('customrecord36',siNumber,'custrecord_siissuetype',true);
	var siDeptAssignedTo = nlapiLookupField('customrecord36',siNumber,'custrecord_siassignedto',true);
	var siDescription = currentRecord.getFieldValue('custrecord_sidescription');
	
	var emailSubject = '';
	var emailBody = '';
	
	// si detail table
	var siDetails = '\n<table>';
	siDetails += epSimpleRow('SI Number:',siLink);
	siDetails += epSimpleRow('Synopsis:',nlapiEscapeXML(siSynopsis));
	siDetails += epSimpleRow('Status:',siStatus);
	siDetails += epSimpleRow('Customer Type:',siCustomerType);
	siDetails += epSimpleRow('Priority:',nlapiEscapeXML(siPriority));
	siDetails += epSimpleRow('Severity:',nlapiEscapeXML(siSeverity));
	siDetails += epSimpleRow('Time Sensitivity:',nlapiEscapeXML(siTimeSensitivity));	
	siDetails += epSimpleRow('Business Value:',siBusValue);
	siDetails += epSimpleRow('Interface:',siInterface);
	siDetails += epSimpleRow('Areas/Modules:',siAreasModules);
	siDetails += epSimpleRow('Products:',siProducts);
	siDetails += epSimpleRow('Browser:',siBrowser);
	siDetails += epSimpleRow('Platform:',siPlatform);
	siDetails += epSimpleRow('Persistent Link:',siPersistentLink);
	siDetails += epSimpleRow('Issue Type:',siIssueType);
	siDetails += epSimpleRow('Dept. Assigned To:',siDeptAssignedTo);	
	siDetails += '\n</table>';
	
	// message contents
	var emailRecipient = submitterEmail;
	var emailSenderId = 1589038;   //ID of 'ONLINE SI USER' employee
	
	emailSubject = 'Service Issue Created #' + siNumber;
	emailBody = emailBody + '\n<h1>Service Issue Created Notification</h1>';
	emailBody = emailBody + siDetails + '\n<p>Submitted '+siCreatedDate+' by '+siSubmitter+'.</p>';

	var emailMessage = emailHeader + emailBody + '\n</body>\n</html>' + 'Description & Steps To Replicate:\n\n' + siDescription;
				
	nlapiSendEmail(emailSenderId,emailRecipient,emailSubject,emailMessage,null);
	
	var logMessage ='From:' + emailSenderId + '-To:' + emailRecipient;
	nlapiLogExecution('debug','Email Delivery',logMessage);
}