// Script:     client_service_issue.js
// 			   script renamed to in July 2016 
//             was called si_client2.js and prior to that si_client.js (date of origin unknown)
// 			   
// Use with Forms:  EBSCO Service Issue form: primary SI form used by EIS DDE CustSat and Technology teams
//
// Functions:  
//       si_load - page initiation       
//       si_save - save event   
//       si_fieldChange - field change event  			
//
// Revision Log (started 05-2016)
//		K McCormack	05-09-16:  CMM - US113721 (Additions to Service Issue Form) and US112271
//                             (External Service Issue Form - Outside of NetCRM)
//      E Abramo    07-28-16:  Per Mary May: default IssueType to "Software Problem Report"
//		C Neale		01-11-17:	US173485: No longer default Interface List. 
//                              Also remove MSID/DTFORMAT/PID validation around Data Acquisition Department
// 								as this is no longer an active department.
// 		E Abramo	09-12-17	US284552 Add Risk Reduction Opportunity fields
//		E Abramo	10-04-17	US291856 Add Type parameter to function line
//		P Kelleher  11-14-19	US559988: Remove JIRA checkbox from employee record and inactivate/delete as part of clean-up process, and all other related fields/coding re: JIRA (removing all code related to JIRA here)
// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////	  


/*Global Constants*/
var constants = {	
		issueStatus_Not_Started_id: '2',
		issueStatus_Not_Started_name: 'Not Started',
		online_si_user_id: '1589038',
		online_si_user_name: 'ONLINE SI USER'
	 };

/*Global Variables*/
var closed_on_load = false;

/*Global Priority Mapping Object*/
var priorityMapping = new Array(4);
priorityMapping[0] = {priorityId: 6, busValue: 30};  /* Critical */
priorityMapping[1] = {priorityId: 3, busValue: 10};  /* High */
priorityMapping[2] = {priorityId: 4, busValue: 5};   /* Medium */
priorityMapping[3] = {priorityId: 5, busValue: 1};   /* Low */

/*Global Severity Mapping Object*/
var severityMapping =  new Array(3);
severityMapping[0] = {severityId: 2, busValue: 10};  /* High */
severityMapping[1] = {severityId: 3, busValue: 5};   /* Medium */
severityMapping[2] = {severityId: 4, busValue: 1};   /* Low */


/*Global TimeSensitivity Mapping Object*/
var timesensitivityMapping =  new Array(4);
timesensitivityMapping[0] = {timesensitivityId: 1, busValue: 1}; 	/* High */
timesensitivityMapping[1] = {timesensitivityId: 2, busValue: 2};  	/* Medium */
timesensitivityMapping[2] = {timesensitivityId: 3, busValue: 5};   	/* Low */
timesensitivityMapping[3] = {timesensitivityId: 4, busValue: 10};   /* None */


/*Global Forms Object*/
var Forms = {
		online_service_issue_form: 61,
		ebsco_service_issue_form: 150,
		web_service_si_form: 151,			
		isExternalForm: function () {  //returns true if current form being used is outside of NetSuite, i.e. user is not signed into NetSuite
			var currentForm = nlapiGetFieldValue('customform');
			return (currentForm == this.Online_service_issue_form) ? true : false;			
		}		
}


/*Global Fields Object*/
var Fields = {
		fldDescription: 'custrecord_sidescription',
		fldPriority: 'custrecord_sipriority',
		fldSeverity: 'custrecord993',		
		fldTimeSensitivity: 'custrecord_si_time_sensitivity',	
		fldSIBusinessValue: 'custrecord_si_business_value',
		fldPriorityBusVal: 'custrecord_sourced_priority_bus_value',		
		fldSeverityBusVal: 'custrecord_sourced_severity_bus_value',		
		fldTimeSensitivityBusVal: 'custrecord_sourced_time_sens_bus_value',	
		fldDisplayExtDeptAssignedTo: 'custrecord_display_ext_only_siassignedto',
		fldDisplayExtIssueType: 'custrecord_display_ext_only_siissuetype',
		fldPersistentLink: 'custrecord_sipersistentlook',
		isEmpty: function (fld) {  //returns true if the value of the field passed in is empty
			var currentValue = nlapiGetFieldValue(fld);
			if (currentValue === null || currentValue === undefined)
		        return true;
			currentValue = new String(currentValue);
		    return (currentValue.length == 0) || !/\S/.test(currentValue);
		}
	/*	weightValue: function (fld) {  //returns true if the value of the field passed in is empty
			var val = nlapiGetFieldValue(fld);
			var fldBusVal = 0;
			switch(fld) {
			case this.fldPriority:
				fldBusVal = nlapiLookupField('custrecord_sipriority', val, 'custrecord_priority_business_value');
				break;			
			case this.fldSeverity:
				fldBusVal = nlapiLookupField('customrecord228', val, 'custrecord_severity_business_value');
				break;
			case this.fldTimesensitivity:
				fldBusVal = nlapiLookupField('customrecord_time_sensitivity', val, 'custrecord_time_sensitivity_bus_value');
				break;
			default:
				fldBusVal = 0;
				break;
			}
			return(fldBusVal);
		}*/
}

function getURLParameterValue(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '='
			+ '([^&;]+?)(&|#|;|$)').exec(location.search) || [ , "" ])[1]
			.replace(/\+/g, '%20'))
			|| null;
}

function si_load(type)
{	
	// if loaded as closed, set variable to tell Save function to NOT reset the Si Closed Date
	if(nlapiGetFieldValue('custrecord_sistatus') == '7')
	{
		closed_on_load = true;
	}
	
	// If Support documentation SI form - then set some fields if it's brand new SI
	if (nlapiGetFieldValue('customform') == 92)
	{
		if ( nlapiGetFieldValue('id') == "" || nlapiGetFieldValue('id') == null )
		{
			// Pre-populate fields
			// Issue Type -> Documentation (14)
			nlapiSetFieldValue('custrecord_siissuetype', '14');
			// Dept Assigned To -> Sales and Marketing (13)
			nlapiSetFieldValue('custrecord_siassignedto', '13');
			// Status -> Open (6)
			nlapiSetFieldValue('custrecord_sistatus', '6');
			// Interface -> Customer Support Site (48)
			// US173485 - Interface no longer defaulted
		}
	}
	// If brand New Service ISsue
	else if ( nlapiGetFieldValue('id') == "" || nlapiGetFieldValue('id') == null )
	{	// Issue Type -> Software Problem Report (11)
		nlapiSetFieldValue('custrecord_siissuetype', '11');
	}		

	if (nlapiGetRole() != 3)
	{	// if not an administrator then disable the Case Count field
		nlapiDisableField('custrecord_count_linked_cases', true);
		// US284552 2017-09-12 Add Risk Reduction Opportunity fields - disable the description field
		nlapiDisableField('custrecord_risk_reduction_desc', true);	
	}
	
	// if SI is Closed... 
	if (nlapiGetFieldValue('custrecord_sistatus') == '7')
	{	// disable the Sync with Rally checkbox
		nlapiDisableField('custrecord_sync_rally', 'true');		
	}
	else  // else (the SI is Open)
	{
		var thisUser = nlapiGetUser();
		// if User doesn't have Permissions to sync with Rally
		if (nlapiLookupField('employee', thisUser, 'custentity_allow_rally_sync') == 'F')
		{	// disable the Sync with Rally checkbox
			nlapiDisableField('custrecord_sync_rally', 'true');
			// 07-22-2016:  US128163 -If user does NOT have synch permission, he should not be picking rally ticket type, so disable this field
			nlapiDisableField('custrecord_rally_ticket_type', 'true');
		}
		else if(type == 'create')
		// 07-22-2016:  US128163 -Even if user DOES have synch permission, ticket type field should be disabled on page init of a create (checking the sync box enables it)
			nlapiDisableField('custrecord_rally_ticket_type', 'true');
	}
	
	var actual_rally_link = nlapiGetFieldValue('custrecord_linked_rally_url');
	// if Actual Rally Link is populated then disable the Sync with Rally checkbox	
	// 07-22-2016:  US128163 -Remove Create/Synch Rally Checkbox Restrictions  
	//if (actual_rally_link != '' &&  actual_rally_link != null)
	//{
	//	nlapiDisableField('custrecord_sync_rally', 'true');
	//}
}

function si_save()
{
	// If SI Status = Open (6), Not Started (2), In Progress (8), Hold (5), Scheduled (9), Re-Opened (10)
	// & DeptAssignedTo = Data Acquistion (79) 
	// then require MID, DTFORMAT and PID
	// US173485 - No longer required as "Data Acquisition" (79) is no longer Active as a Department.
/*	si_status = nlapiGetFieldValue('custrecord_sistatus');
   if(nlapiGetFieldValue('custrecord_siassignedto') == '79' && (si_status == '6'||si_status == '2'||si_status =='8'||si_status=='5'||si_status=='9'||si_status=='10'))
	{ 	// MID	
		if (nlapiGetFieldValue('custrecord_simid') == '' || nlapiGetFieldValue('custrecord_simid') == null)
		{
			alert('Open SI\'s for Data Acquisition require a MSID');
			return false;
		}
		// DTFORMAT
		if (nlapiGetFieldValue('custrecord_sidtformat') == '' || nlapiGetFieldValue('custrecord_sidtformat') == null)
		{
			alert('Open SI\'s for Data Acquisition require a DTFORMAT');
			return false;
		}
		// PID
		if (nlapiGetFieldValue('custrecord8') == '' || nlapiGetFieldValue('custrecord8') == null)
		{
			alert('Open SI\'s for Data Acquisition require a PID');
			return false;
		}	
	} */

	// Set Si_Close_Date if the SI Status is set to Closed (7) or Closed Unresolved (11)... (but only if loaded as Not closed)
	if ( (nlapiGetFieldValue('custrecord_sistatus') == '7' || nlapiGetFieldValue('custrecord_sistatus') == '11') && closed_on_load == false)
	{	nlapiDisableField('custrecord_si_close_date', false);
		nlapiSetFieldValue('custrecord_si_close_date', nlapiDateToString(new Date()));
		nlapiDisableField('custrecord_si_close_date', true);
	}
	

	// 2012-12-29 Update the new Number of Linked Cases field
	var cur_linkedCases = Number(nlapiGetFieldValue('custrecord_count_linked_cases'));
	var cases = nlapiGetFieldValues('custrecord_sicase');
	if (cases == "" || cases == null)
	{	// empty Cases field needs to be handled differently
		var cases_count = 0;
	}
	else
	{	// if Cases field isn't empty get length of Array for the actual count
		var cases_count = cases.length;		
	}
	if (cases_count != cur_linkedCases)
	{	// populate cases_count into the NEW "number of Linked Cases" field
		nlapiSetFieldValue('custrecord_count_linked_cases', cases_count, false, true);
	}

	// 09-12-17	US284552 Per Mary May - if value in Risk Reduction Drop-down - and no value in Description (user Cleared it) re-populate the Description
	if (nlapiGetFieldValue('custrecord_risk_reduction_opportunity') != '' && nlapiGetFieldValue('custrecord_risk_reduction_opportunity') != null )
	{
		if (nlapiGetFieldValue('custrecord_risk_reduction_desc') == '' || nlapiGetFieldValue('custrecord_risk_reduction_desc') == null)
		{
			alert('Service Issues with a Risk Reduction Opportunity setting must have a Risk Reduction Description.  Your name and date will be added to the Description.  Please add comments to this description and then select Save again.');
			nlapiDisableField('custrecord_risk_reduction_desc', false);			
			// also pre-set it to the Name of end user plus the current Date Time  (It is okay to overwrite existing data in this field)	
			var username = nlapiLookupField('employee', nlapiGetUser(), 'entityid');
			var curr_time = nlapiDateToString(new Date(), 'datetime');
			nlapiSetFieldValue('custrecord_risk_reduction_desc', username+' '+curr_time+': ');
			return false;
		}	
	}
	
	// if Create/Sync Rally checkbox is checked and it's not currently linked
	// ensure that there's a value in "Create Rally Tickate As:" field
 	if (nlapiGetFieldValue('custrecord_sync_rally') == 'T' && (nlapiGetFieldValue('custrecord_linked_rally_url') == '' || nlapiGetFieldValue('custrecord_linked_rally_url') == null ))
 	{
 		if (nlapiGetFieldValue('custrecord_rally_ticket_type') == '' || nlapiGetFieldValue('custrecord_rally_ticket_type') == null)
 		{
 			alert('Check the Rally Information section.  You must select a value in the \"Create Rally Ticket As:\" field');
 			return false;
 		}
 	}

 	return(true);
}

function si_fieldChange(type, name)
{	// if user sets inactive to True and Sync with Rally is True -- ask user to confirm - if confirmed 'Sync with Rally' will unset
	if(name == 'isinactive')
	{
		if (nlapiGetFieldValue('isinactive') == 'T')
		{
			if (nlapiGetFieldValue('custrecord_sync_rally') == 'T')
			{
				if (confirm('You are inactivating a Service Issue that is flagged as synchronized with Rally. Synchronization will no longer continue.  Are you sure you want to do this?'))
				{ // user confirms "yes"
					nlapiSetFieldValue('custrecord_sync_rally', 'F')
				}
				else
				{ // user selected cancel -- set Inactive back to False
					nlapiSetFieldValue('isinactive', 'F')
				}
			}
			else	// sync with Rally is not checked - disable the field
			{
				nlapiDisableField('custrecord_sync_rally', 'true');			
			}			
		}
	}
	// if user sets Sync with Rally to True and inactive is True, don't allow Sync with Rally to be set to True	
	if(name == 'custrecord_sync_rally')
	{	// "Sync with Rally" is set to True...
		if (nlapiGetFieldValue('custrecord_sync_rally') == 'T')
		{
			// if SI is Inactive -- don't allow it and set checkbox back to False 
			if (nlapiGetFieldValue('isinactive') == 'T')
			{
				alert('You must first activate this Service Issue in order to Synchronize it to Rally')
				{
					nlapiSetFieldValue('custrecord_sync_rally', 'F')
				}
			}
			// if "Linked Rally URL" is null
			var linked_url = nlapiGetFieldValue('custrecord_linked_rally_url');
			if (linked_url == '' || linked_url == null)
			{	// enable the "Create Rally Ticket As:" field
				nlapiDisableField('custrecord_rally_ticket_type', false);
			}		
		}
		// "Sync with Rally" is set to False
		else
		{	// ensure "Create Rally Ticket As:" field is disabled
			nlapiDisableField('custrecord_rally_ticket_type', true);
			
			// change isUpdated to false if it is currently True
			if (nlapiGetFieldValue('custrecord_si_isupdated') == 'T')
			{
				nlapiSetFieldValue('custrecord_si_isupdated', 'F');
			}
			// change "Sync Email Once Per Day" to false if it is currently True
			if (nlapiGetFieldValue('custrecord_sync_email_once_day') == 'T')
			{
				nlapiSetFieldValue('custrecord_sync_email_once_day', 'F');
			}
		}
	}
	
	// US284552 2017-09-12 Add Risk Reduction Opportunity fields
	if (name == 'custrecord_risk_reduction_opportunity')
	{	// if dropdown field is set to an actual value
		if (nlapiGetFieldValue('custrecord_risk_reduction_opportunity') != '' && nlapiGetFieldValue('custrecord_risk_reduction_opportunity') != null)
		{	// enable the Risk Reduction Description field
			nlapiDisableField('custrecord_risk_reduction_desc', false);			
			// also pre-set it to the Name of end user plus the current Date Time  (It is okay to overwrite existing data in this field)	
			var username = nlapiLookupField('employee', nlapiGetUser(), 'entityid');
			var curr_time = nlapiDateToString(new Date(), 'datetime');
			nlapiSetFieldValue('custrecord_risk_reduction_desc', username+' '+curr_time+': ');
		}
		else	// if setting dropdown to null -- clear out the description field
		{
			nlapiSetFieldValue('custrecord_risk_reduction_desc', '');			
		}
	}
}

function si_online_fieldChange(type, name)
{	
	if(name == Fields.fldPriority || name == Fields.fldSeverity || name == Fields.fldTimeSensitivity)
	{		
		si_online_update_business_value();	
	}
}

function si_online_update_business_value()
{
	if (Fields.isEmpty(Fields.fldPriority) || Fields.isEmpty(Fields.fldSeverity) || Fields.isEmpty(Fields.fldTimeSensitivity))
	{
		nlapiSetFieldValue(Fields.fldSIBusinessValue, '', true, '');
	}
	else
		{	
			var pId = nlapiGetFieldValue(Fields.fldPriority);
			var pBusValue = 0;
			for(var i=0; i<priorityMapping.length; i++) {
				if(priorityMapping[i].priorityId == pId)
	        	{
					pBusValue = priorityMapping[i].busValue;
	        	}
	        }
			var sId = nlapiGetFieldValue(Fields.fldSeverity);
			var sBusValue = 0;
			for(var j=0; j<severityMapping.length; j++) {
				if(severityMapping[j].severityId == sId)
	        	{
					sBusValue = severityMapping[j].busValue;
	        	}
	        }
			var tId = nlapiGetFieldValue(Fields.fldTimeSensitivity);
			var tBusValue = 0;
			for(var k=0; k<timesensitivityMapping.length; k++) {
				if(timesensitivityMapping[k].timesensitivityId == tId)
	        	{
					tBusValue = timesensitivityMapping[k].busValue;
	        	}
	        }
			//alert('pBusValue = ' + pBusValue + '  ||  sBusValue = ' + sBusValue + '  ||  '+'tBusValue = ' + tBusValue);
			var busValSI = (pBusValue + sBusValue) / tBusValue;
			nlapiSetFieldValue(Fields.fldSIBusinessValue, busValSI, null, true);

		} 
}

/*04-14-2016:  Add logic to support online service issue form*/

function si_online_load()
{	
	var isConfirm = getURLParameterValue('confirm');
	
	if(isConfirm != null) {				
		alert('Your Request Has Been Submitted.');
		window.history.go(-2);
	}
		
	// Currently, when online SI is being created, certain fields which are normally selectable will,instead, be pre-populated and will NOT be updateable
	
	// Status -> Not Started (2)
	nlapiSetFieldValue('custrecord_sistatus', constants.issueStatus_Not_Started_name);	
	nlapiDisableField('custrecord_sistatus', true);	
}

function si_online_save()
{
	//Set value of Created By field to the dummy 'ONLINE SI USER' 
	nlapiSetFieldValue('custrecord_sicreatedby', constants.online_si_user_id);
	//Store value of Dept Assigned To in the actual SI field 
	nlapiSetFieldValue('custrecord_siassignedto', nlapiGetFieldText(Fields.fldDisplayExtDeptAssignedTo));
	//Store value of Issue Type in the actual SI field 
	nlapiSetFieldValue('custrecord_siissuetype', nlapiGetFieldText(Fields.fldDisplayExtIssueType));
	
	var pLink = document.getElementById("pLink").value;

	if(pLink != null && pLink != '' && pLink.length > 0) {		
		if(si_online_isvalid_url(pLink)) {
			nlapiSetFieldValue('custrecord_sipersistentlook', pLink);
		}			
	}			

	return(true);
}

function si_online_isvalid_url(plink) {
	var val = trim(plink.toLowerCase());  
    if (!(val.indexOf('/') == 0 || val.indexOf('http://') == 0 || val.indexOf('https://') == 0 || val.indexOf('ftp://') == 0 || val.indexOf('file://') == 0))
    {
       return false;
    }
    else {
    	return true;    	
    }
};