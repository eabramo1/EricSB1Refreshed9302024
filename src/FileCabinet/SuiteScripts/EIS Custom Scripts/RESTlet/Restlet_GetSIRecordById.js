/* 
 * File:  Restlet_GetSIRecordById.js
 * 
 * Module Description:  This Restlet exposes service issue fields to the application that
 *			is calling the Restlet.  
 *
 *Library Scripts Used:
 * library_constants.js -- Library Script used to reference constant values.
 * library_utility.js -- Library Script used to call the format types of fields within the Service Issue form.
 * library_serviceIssue.js -- Libarry Script used to isolate returned field values and types
 * library_file_handler.js -- Library Script used to return attached files
 *
 * JSON input expected:  {"si_id":"[siid]"}
 * JSON Optional input:  "si_include_file_info": "[T/F]"
 * List of fields to be returned can be found in library_serviceIssue.js.
 *			The Assumption is that the Application will call the Restlet with Login Credential
 *			
 * 
 * 
 * Version    Date            	Author				Remarks
 * 1.00 		2/5/2018			Pat Kelleher 	
 * 1.00		3/14/2018			Mackie				Added in the following fields again: si_case, si_businessvalue, and si_riskreductionopportunity
 *				3/29/2018         Pat Kelleher	         Moved to Production
 * 1.01		4/20/2018			Mackie				Added in the 'si_coordinatornotes' [custrecord1] field into the dataout of the API
 * 1.02		5/10/2018		Mackie				Added in the 'si_persistentlink' [custrecord_sipersistentlook], 'si_rootcause' [custrecord_sirootcause] field into the dataout of the API
 * 1.03		11/08/2018		Ariana Hazen	US425118	Converted script to use list of fields from library_serviceIssue.js. 
 *																	Updated dataout to store propertied and values all in one step. 
 * 																Added file retrieval script (borrowed from GetMessageById) 
 */

function GetSIRecordById(datain)
{
	var functionname = L_CurrentFuncName(arguments);
	nlapiLogExecution('debug', 'RESTLET '+functionname+' started'); 
	var dataout = {};
	var varName="", fieldName="", fieldtype="";
	dataout.restlet_status = 'ERROR';
	dataout.restlet_status_details = '';
	try
	{
		// Lookup service issues and load 
		nlapiLogExecution('debug', 'datain.si_id=' + datain.si_id);	

	//  replaced the word "si" below with "customrecord36" because this is the record ID for service issues.  See page 157 of the NS Developer & Reference Guide - this page links to the Supported Records page where most record IDs can be found, except for SI because it's not a standard record type.  This "customrecord36" was found by going in NS to customization / list record fields / record type, then pull the ID from Service Issue.	
 		var si = nlapiLoadRecord('customrecord36', datain.si_id);

		//iterate through L_siParmMapObject (from library_serviceIssue.js) to create dataout properties per variable names in getData array
		for (var key in L_siParmMapObject) {
			// clear vars for each loop
			varName="";
			fieldName="";
			fieldtype="";
			if (L_siParmMapObject.hasOwnProperty(key)){
			 varName = L_siParmMapObject[key];
			 fieldName = varName.nsfieldName;
			 fieldType = varName.fieldType;
			switch (fieldType) {
						case "select":
						case "sourced":
							dataout[key] = L_formatListFieldJSON(si, fieldName);
							break;
						case "multiple":
							dataout[key] = L_formatMSFieldJSONArray(si, fieldName);
							break;
						default:
							dataout[key] = si.getFieldValue(fieldName);
							break;
					}
		}
		}
		dataout.si_id = datain.si_id;
		//check for file attachments
		var si_include_file_info = 'F';
		if (datain.si_include_file_info) {
			si_include_file_info = datain.si_include_file_info;
		}
		if (si_include_file_info == 'T') {
				//Call the L_GetFileInfo function in library_utility script
				dataout.file_array = L_GetFileInfo('ServiceIssue', datain.si_id);
					if (L_fileRetrieverMsg != 'Search Successful' && L_fileRetrieverMsg != 'No attached Files') {
						dataout.restlet_status = 'ERROR';
						dataout.restlet_status_details = 'File retrieval error:' + L_fileRetrieverMsg;
					}
		}
		/* var si_id = si.getFieldValue('recordid');
		var si_synopsis = si.getFieldValue('custrecord_sisynopsis');
		var si_description = si.getFieldValue('custrecord_sidescription');
		var si_number_linked_cases = si.getFieldValue('custrecord_count_linked_cases');
		var si_date_created = si.getFieldValue('created');
		var si_last_modified_date = si.getFieldValue('lastmodified');
		var si_last_closed_date = si.getFieldValue('custrecord_si_last_closed_date');
		var si_resolution = si.getFieldValue('custrecord_siresolution');
		var si_businessvalue = si.getFieldValue('custrecord_si_business_value');
		var si_riskreductionopportunity = si.getFieldValue('custrecord_risk_reduction_opportunity');
		var si_coordinatornotes = si.getFieldValue('custrecord1');

		// library_utility script function called to format drop down values
		var si_priority = L_formatListFieldJSON(si, 'custrecord_sipriority');
		var si_status = L_formatListFieldJSON(si, 'custrecord_sistatus');
		var si_interface = L_formatListFieldJSON(si, 'custrecord_si_interface_si');
		var si_area_module = L_formatListFieldJSON(si, 'custrecord_si_area_module_si');
		var si_product = L_formatListFieldJSON(si, 'custrecord_si_product_si');
		var si_issue_type = L_formatListFieldJSON(si, 'custrecord_siissuetype');
		var si_case = L_formatMSFieldJSONArray(si, 'custrecord_sicase'); */
	
		nlapiLogExecution('debug', 'Success Loading '+functionname+',  si_id: '+datain.si_id);
		dataout.restlet_status = 'SUCCESS';
	}		
	catch ( e )
	
	{
		if ( e instanceof nlobjError ) 
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			dataout.restlet_status_details = functionname+' Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			dataout.restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = functionname+' Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	


	nlapiLogExecution('debug', 'RESTLET '+functionname+' ended...');	
	return(dataout);
} 