//
// Script:     library_utility.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of utility script functions that may be called from other scripts.
//             Non-record specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
// L_formatListFieldJSON	1/29/2018	CNeale			Formats a list field suitable for use in a return JSON string.
// L_formatMSFieldJSONArray 1/31/2018	CNeale			Formats a multi-select field into an array suitable for use in a return JSON string.
// L_JSONisEmpty			2/21/2018	KMcCormack		Determines if a JSON object is empty or not
// L_IsNewRecord			6/21/2018	CNeale			Determines if a new record
// L_CurrentFuncName		11/08/2018	AHazen			Used to easily print name of current function/RESTlet to debug message
// L_isEBSCOemail			12/03/2018	CNeale			Checks for any "EBSCO" type inclusion in email
// L_createRec_CXPNSSFNotify 12/03/2018	CNeale			Creates a "CXP NS to SF Notification" custom record.	
// L_cnvrtNullToEmptyString	12/03/2018	EAbramo			Used to convert a null value to an empty string
// L_recordSearcher			12/18/2018	CNeale/Celigo 	Global Variable/Function. Used for Search - returns >1000 records in resultsd
// L_recordSearcherWithMax	12/07/2019	KMcCormack	 	Global Variable/Function. Used for Search - returns >1000 records, but no more than maximum requested, in results
// L_fileTypes				3/30/2020	AHazen 			Returns the CRM file type of a file by the extension
// L_formatFileSize			3/30/2020	AHazen 			Used to convert file size in nearest whole bit (instead of 1000 bytes, gives 1 KB)
// L_isEmpty				12/7/2020	AHazen			Used to test blank/null/undefined/empty values
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	1/29/2018	CNeale		US334998 Original version with functions L_formatListFieldJSON & L_formatMSFieldJSONArray
//
//  2/21/2018	KMcCormack	Added new function to determine if a JSON object is empty or not	
//	6/21/2018	CNeale		Added new function L_IsNewRecord
//	2018-11-08	AHazen		Added L_CurrentFuncName to easily print name of current function/RESTlet to debug message
//  2018-12-03	CNeale		US402266 Added new function to determine if email address is "EBSCO" email L_isEBSCOemail
//	2018-12-03	eAbramo		US422399 L_isEBSCOemail refinement - check only substring after the @ character
//	2018-12-03	CNeale		US430190 Added new function L_createRec_CXPNSSFNotify - creates a notification record
//	2018-12-03	eAbramo		Adding L_cnvrtNullToEmptyString - needed in CustomerBeforeSubmit U.E script as NS returns inconsistent values (null or empty string)//
//	2018-12-18	CNeale		US423877 Added new global variable/function L_recordSearcher/this.search,
//							used for scripted searching especially when >1000 rows to be returned.
//  12-07-2019	KMcCormack	Added new L_recordSearcher_withMax function which is a version of L_recordSearcer which allows you to 
//							specify a maximum number of records to be returned by the search.  Since some actual search criteria 
//  						could potentially return millions of records in certain cases, we need to limit how many we process
//  						at a time in order to avoid an SS_EXCESSIVE_MEMORY_FOOTPRINT error being thrown by the scheduled script using it.
//  						(Note:  Netsuite has a maximum script memory size of 50Mg so we need to stay under this max.)
//	3/30/2020	AHazen		Added L_fileTypes & L_formatFileSize
//	12/7/2020	AHazen		Added L_isEmpty
//	09/13/2022	AHazen		Updated L_fileTypes: added "har" and "json" as an acceptable filetype US1008951
//-------------------------------------------------------------------------------------------------------------------------

/*-------------------------------------------------------------------------------------
---------------------------
 * Function   : L_formatListFieldJSON(recordIn, fieldId)
 * Description: Formats a list field suitable for use in a return JSON string.
 * Input      : recordIn = nlobjRecord containing field to be formatted
 *              fieldId = internal ID of field to be formatted 
 * Returns    : Formatted variable suitable for use in JSON return string (with internalid & name identifiers) 
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function L_formatListFieldJSON(recordIn, fieldId)
{
	var fieldout = {internalid: '', name: ''};
	fieldout.internalid = recordIn.getFieldValue(fieldId);
	fieldout.name = recordIn.getFieldText(fieldId);
	
	return fieldout;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_formatMSFieldJSONArray(recordIn, fieldId)
 * Description: Formats a multi-select field into an array suitable for use in a return JSON string.
 * Input      : recordIn = nlobjRecord containing field to be formatted
 *              fieldId = internal ID of field to be formatted 
 * Returns    : Formatted variable suitable for use in JSON return string (with internalid & name identifiers in an array) 
 *              or '' if the field is unpopulated. 
 *-----------------------------------------------------------------------------------------------------------------*/
function L_formatMSFieldJSONArray(recordIn, fieldId)
{
	var fieldin_id = new Array();
	var fieldin_name = new Array();
	fieldin_id = recordIn.getFieldValues(fieldId);
	fieldin_name = recordIn.getFieldTexts(fieldId);
	
	if (fieldin_id) // Multi-select field populated
	{	
		var result_array = new Array();
		var resultObj = {};
		
		for(var j = 0; fieldin_id && j < fieldin_id.length; j++) 
		{    
			resultObj = {};
			resultObj.internalid = fieldin_id[j];
			resultObj.name = fieldin_name[j];
			result_array.push(resultObj);
		}
		return result_array;
	}
	// Multi-select field empty
	return '';
}
/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_JSONisEmpty(obj)
 * Description: Checks to see if a JSON object is truly empty
 * Input      : obj = JSON object
 * Returns    : true if the object is empty
 * 				false if the object is NOT empty
 *-----------------------------------------------------------------------------------------------------------------*/
function L_JSONisEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_IsNewRecord()
 * Description: Checks to see if a new record
 * Input      : None
 * Returns    : true if the record is New
 * 				false if the record is NOT New
 *-----------------------------------------------------------------------------------------------------------------*/
function L_IsNewRecord() {
    return (nlapiGetRecordId() == ''||nlapiGetRecordId() == null) ? true : false;
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_isEBSCOemail(emailIn)
 * Description: Checks for the presence of an "EBSCO" identifier string in input email
 * Input      : emailIn = email to be checked
 * Note       : Assumes emailIn is valide email containing @ sign
 * US422399 - Only searches the domain string of the email (not the full email string)
 * Returns    : true if "EBSCO" email
 *              false if not "EBSCO" email 
 *-----------------------------------------------------------------------------------------------------------------*/
function L_isEBSCOemail(emailIn)
{
	var emailIn_lc = emailIn.toLowerCase();
	var emailIn_lc_domain = emailIn_lc.substring(emailIn_lc.indexOf('@'));		
	return (emailIn_lc_domain.indexOf('ebsco') == -1 && emailIn_lc_domain.indexOf('ybp') == -1 && 
			emailIn_lc_domain.indexOf('epnet') == -1) ? false : true;
}

/* US430190 CXP: Function to write Custom Record for reporting purposes 
 * Function: L_createRec_CXPNSSFNotify(inp_typ, inp_sfid, inp_recid, inp_case, inp_cust, inp_prevcust, inp_casenum, inp_subject, inp_act)
 * Input:	Type (inp_typ) 
 * 			Case SalesForce Id (inp_sfid)
 * 			Record Id (inp_recid)
 *          Case Id (inp_case)
 *          Customer Id (inp_cust) 
 *          Previous Customer Id (inp_prevcust)
 *          Case Number (inp_casenum)
 *          Case Subject (inp_subject) 
 * 			Action Type (inp_act)
 * */

function L_createRec_CXPNSSFNotify(inp_typ, inp_sfid, inp_recid, inp_case, inp_cust, inp_prevcust, inp_casenum, inp_subject, inp_act)
{
	var report_rec = nlapiCreateRecord('customrecord_cxp_nssf_notify');
	report_rec.setFieldValue('custrecord_nssf_rec_type',inp_typ );  // 1 = Case
	report_rec.setFieldValue('custrecord_nssf_sf_id', inp_sfid); // Case SF Id
	report_rec.setFieldValue('custrecord_nssf_ns_id', inp_recid); // NS internal ID
	report_rec.setFieldValue('custrecord_nssf_case_no', inp_casenum); //NS Case number
	report_rec.setFieldValue('custrecord_nssf_case_subject', inp_subject); //NS Case Subject
	report_rec.setFieldValue('custrecord_nssf_case', inp_case); //NS Case
	report_rec.setFieldValue('custrecord_nssf_curr_cust', inp_cust);//NS Customer
	report_rec.setFieldValue('custrecord_nssf_prev_cust', inp_prevcust);//NS Previous Customer
	report_rec.setFieldValue('custrecord_nssf_action', inp_act);// Action 

	// Now save the report record 
	nlapiSubmitRecord(report_rec);
		
}

/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_CurrentFuncName()
 * Description: Returns name of currently running function/RESTlet
 * Input      : arg (use the JS constant arguments when calling, ex:  L_CurrentFuncName(arguments) )
 * Returns    : name of current function
 *-----------------------------------------------------------------------------------------------------------------*/
 function L_CurrentFuncName(arg){
    return (arg.callee.toString().match(/function\s+([^\s\(]+)/))[1];
}
 
 /*----------------------------------------------------------------------------------------------------------------
  * Function   : L_cnvrtNullToEmptyString(value)
  * Description: Takes a value, if the value is null returns an empty string
  * 			- otherwise just return the value
  * Input      : value = the value that you want to convert to a an empty string if it is null
  * Returns    : the value (if the value is not null) but '' if the value is null        
  *-----------------------------------------------------------------------------------------------------------------*/
 function L_cnvrtNullToEmptyString(value)
 {
	 return (value == null) ? "" : value;
 }
 
 /*----------------------------------------------------------------------------------------------------------------
  * Global Variable: L_recordSearcher
  * Function   : L_recordSearcher.search(recordType, savedSearch, filters, columns)
  * Description: Performs a scripted search (think of in terms of nlapiSearchRecord) and can return > 1000 rows
  *            : Code lifted from Celigo.custom.ebsco.lib.RecordSearcher.js
  * Input      : recordType = record type internal ID being searched (optional)
  *            : savedSearch = internal ID or script ID for the saved search (optional - required if recordType not specified)
  *            : filters = nlobjSearchFilter/nlobjSearchFilter[] (optional)
  *            : columns = nlobjSearchColumn/nlobjSearchColumn[] (optional)
  * Returns    : Array of nlobjSearchResult objects 
  * Note	   : Example code to use this function/utility:-
  *					var that = this;
  *					this.recordSearcher = new L_recordSearcher();
  *					var searchResults = that.recordSearcher.search('recordid', null, filters, columns);	      
  *-----------------------------------------------------------------------------------------------------------------*/
 
 var L_recordSearcher = function() {

		this.searchFactory = function(recordType, savedSearch, filters, columns) {
			var search;

			if (savedSearch) {
				search = nlapiLoadSearch(recordType, savedSearch);

				if (filters) {
					if (!(filters instanceof nlobjSearchFilter)
							&& filters.length > 0
							&& !(filters[0] instanceof nlobjSearchFilter)) {
						search.setFilterExpression(filters);
					} else {
						search.addFilters(filters);
					}
				}

				if (columns) {
					search.addColumns(columns);
				}
			} else {
				search = nlapiCreateSearch(recordType, filters, columns);
			}

			return search;
		};

		this.search = function(recordType, savedSearch, filters, columns) {
			var search = this.searchFactory(recordType, savedSearch, filters, columns);

			var resultSet = search.runSearch();

			var results = [];
			var offset = 0;
			do {
				var page = resultSet.getResults(offset, offset + 1000);

				results = results.concat(page);

				offset += 1000;

			} while (page.length === 1000);

			return results;
		};
	};

	 /*----------------------------------------------------------------------------------------------------------------
	  * Global Variable: L_recordSearcher_withMax
	  * Function   : L_recordSearcher_withMax.search(recordType, savedSearch, filters, columns)
	  * Description: Performs a scripted search (think of in terms of nlapiSearchRecord) and can return > 1000 rows
	  *            : Code lifted from Celigo.custom.ebsco.lib.RecordSearcher.js
	  * Input      : recordType = record type internal ID being searched (optional)
	  *            : savedSearch = internal ID or script ID for the saved search (optional - required if recordType not specified)
	  *            : filters = nlobjSearchFilter/nlobjSearchFilter[] (optional)
	  *            : columns = nlobjSearchColumn/nlobjSearchColumn[] (optional)
	  *            : maxRecords = maximum number of records to be returned by the search 
	  * Returns    : Array of nlobjSearchResult objects 
	  * Note	   : Example code to use this function/utility:-
	  *					var that = this;
	  *					this.recordSearcher = new L_recordSearcher();
	  *					var searchResults = that.recordSearcher.search('recordid', null, filters, columns);	      
	  *-----------------------------------------------------------------------------------------------------------------*/
	 
	 var L_recordSearcher_withMax = function() {

			this.searchFactory = function(recordType, savedSearch, filters, columns, maxRecords) {
				var search;

				if (savedSearch) {
					search = nlapiLoadSearch(recordType, savedSearch);

					if (filters) {
						if (!(filters instanceof nlobjSearchFilter)
								&& filters.length > 0
								&& !(filters[0] instanceof nlobjSearchFilter)) {
							search.setFilterExpression(filters);
						} else {
							search.addFilters(filters);
						}
					}

					if (columns) {
						search.addColumns(columns);
					}
				} else {
					search = nlapiCreateSearch(recordType, filters, columns);
				}

				return search;
			};

			this.search = function(recordType, savedSearch, filters, columns, maxRecords) {
				var search = this.searchFactory(recordType, savedSearch, filters, columns);

				var resultSet = search.runSearch();

				var results = [];
				var offset = 0;
				do {
					var page = resultSet.getResults(offset, offset + 1000);

					results = results.concat(page);

					offset += 1000;

				} while (page.length === 1000 && offset < maxRecords);

				return results;
			};
		};

/*----------------------------------------------------------------------------------------------------------------
  * Function   : L_fileTypes(file_extension) 
  * Description: Returns the CRM file type of a file by the extension
  * Input      : file_extension = extension of file being uploaded WITHOUT period
  * Returns    : CRM file type value
  * Note	   : Example code to use this function/utility:
  *				      var filetype = L_fileTypes("xls");
  * *-----------------------------------------------------------------------------------------------------------------*/

function L_fileTypes(file_extension) {
		var file_type = "";

		switch (file_extension.toLowerCase()) {
		case 'doc':
		case 'docx':
			file_type = 'WORD';
			break;
		case 'pdf':
			file_type = 'PDF';
			break;
		case 'rtf':
			file_type = 'RTF';
			break;
		case 'xls':
		case 'xlsx':
			file_type = 'EXCEL';
			break;
		case 'ppt':
		case 'pptx':
			file_type = 'POWERPOINT';
			break;
		case 'zip':
			file_type = 'ZIP';
			break;
		case 'gif':
			file_type = 'GIFIMAGE';
			break;
		case 'jpg':
		case 'jpeg':
			file_type = 'JPGIMAGE';
			break;
		case 'png':
			file_type = 'PNGIMAGE';
			break;
		case 'bmp':
			file_type = 'BMPIMAGE';
			break;
		case 'eml':
			file_type = 'MESSAGERFC';
			break;
		case 'csv':
			file_type = 'CSV';
			break;
		case 'txt':
			file_type = 'PLAINTEXT';
			break;
		case 'xml':
			file_type = 'XMLDOC';
			break;
        case 'har':
        case 'json':
			file_type = 'JSON';
			break;
		default:
			file_type='';
			break;
		}
	return file_type;
	}

/*---------------------------------------------------------------------------------------------------------
  * Function   : L_formatFileSize(bytes, decimals = 2)
  * Description: Returns the CRM file type of a file by the extension
  * Input      : bytes
  * Returns    : file size in nearest whole bit (instead of 1000 bytes, gives 1 KB)
  * Note	   : Example code to use this function/utility:
  *				      var filesize = L_formatFileSize(1024);
  *----------------------------------------------------------------------------------------------------------
  */
function L_formatFileSize(bytes,decimals) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}		
/*---------------------------------------------------------------------------------------------------------
  * Function   : L_isEmpty(str)
  * Description: Returns true for multiple conditions to test for empty string
  * Input      : string
  * Returns    : boolean
  * Note	   : Example code to use this function/utility:
  *				      if(!L_isEmpty(someval)){
  *						//do something because someval is not an empty value
  *						}
  *----------------------------------------------------------------------------------------------------------
  */
function L_isEmpty(str) {
	return (str === null || typeof str === "undefined" || str === undefined || str === "" || str.length === 0 );
}