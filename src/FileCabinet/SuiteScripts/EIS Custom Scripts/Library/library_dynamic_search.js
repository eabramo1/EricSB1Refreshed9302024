/* **********************************************************************************************************************************************************
 * 
 * !!!!!!!!!  THIS LIBRARY SCRIPT MUST BE USED IN CONJUNCTION WITH THE SEARCH RECORD TYPE'S LIBRARY FUNCTION !!!!!!!!
 * 
 * For example, if this method will be called by a Restlet which searches for 'Customers' then the calling Restlet MUST also include 'library_customer.js'
 *
 * **********************************************************************************************************************************************************
 * 
 * Script:  library_dynamic_search
 * 
 * Function: Dynamically builds search filters for the record type passed in and then runs the search.  Any results from the search are returned in array.
 * 
 * Input: 
 * 		datain 		- required:  JSON object containing the search fields that were sent to a given Restlet and the values passed in those fields.
 * 		rectype		- required:  String which contains the type of record that will be searched for.  Possible values include 'case', 'customer', etc.
 * 		returncols	- optional:  Array containing the specific columns to be returned by the search.  If this is missing, all fields on the record are returned.
 * 		
 * Revisions:
 * 		KMccormack	02-14-18 -  US339428 - Create a common library script which can be used by ANY Restlet which performs a search.  The script 
 * 								will loop through the JSON input and dynamically create the search filters by using the specified record types parameter
 * 								mapping object.  It will also loop through the columns to be returned (if present) and create search columns. The
 * 								script will then execute the search and return the results to the calling Restlet.  
 * 
 * 		KMccormack	03-19-18 -  US352131 - Need to make this dynamic_search routine more robust to be able to handle multiple record joins when searching.  
 * 
 *  	KMccormack	03-21-18 -  Rename library variables "L_searchDone" and "L_searchMsg" to the following in order to make it clearer that these variables
 *  							are coming from this dynamic search script: new names "L_dynamicSearchDone" and "L_dynamicSearchMsg".  
 *  	JOliver		03-21-18 - 	Updated to handle Contact recordtype
 *  	CNeale		04-20-18	US326360 Updated to handle Service Issue (SI) Record type
 * 
 * **********************************************************************************************************************************************************
 */

//Initialize global variables for passing status information back to calling script
var L_dynamicSearchDone = false;    
var L_dynamicSearchMsg = '';			

function L_dynamicSearch(datain, recordType, columnsOut) {
	nlapiLogExecution('debug', '** L_dynamicSearch library script started ***');

	L_dynamicSearchDone = false;    //Re-initialize for each search in case of multiple calls  
	L_dynamicSearchMsg = '';		 //Re-initialize for each search in case of multiple calls
	
	var validRequest = true;
	var parmMapObject = {};
	var listFields = [];
	var multiselectFields = [];
	var searchResults = null;
	
	if(recordType && recordType != null && recordType != '') {
		switch(recordType) {
		case 'customer':	
			if(typeof L_customerParmMapObject != 'undefined')
				parmMapObject = JSON.parse(JSON.stringify(L_customerParmMapObject));
			else {
				nlapiLogExecution('DEBUG', 'Missing ParmMapObject for record type ' + recordType);				
				L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: MISSING Library ParmMapObject for record type ' + recordType;
				validRequest = false;
			}
			break;
		case 'supportcase':	
			if(typeof L_caseParmMapObject != 'undefined')
				parmMapObject = JSON.parse(JSON.stringify(L_caseParmMapObject));	
			else {
				nlapiLogExecution('DEBUG', 'Missing ParmMapObject for record type ' + recordType);				
				L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: MISSING Library ParmMapObject for record type ' + recordType;
				validRequest = false;
			}
			break;
		case 'message':	
			if(typeof L_messageParmMapObject != 'undefined')
				parmMapObject = JSON.parse(JSON.stringify(L_messageParmMapObject));	
			else {
				nlapiLogExecution('DEBUG', 'Missing ParmMapObject for record type ' + recordType);				
				L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: MISSING Library ParmMapObject for record type ' + recordType;
				validRequest = false;
			}
			break;
		case 'contact':	
			if(typeof L_contactParmMapObject != 'undefined')
				parmMapObject = JSON.parse(JSON.stringify(L_contactParmMapObject));	
			else {
				nlapiLogExecution('DEBUG', 'Missing ParmMapObject for record type ' + recordType);				
				L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: MISSING Library ParmMapObject for record type ' + recordType;
				validRequest = false;
			}
			break;
		//US326360 Add in Service Issue (customrecord36)	
		case 'customrecord36':	
			if(typeof L_siParmMapObject != 'undefined')
				parmMapObject = JSON.parse(JSON.stringify(L_siParmMapObject));	
			else {
				nlapiLogExecution('DEBUG', 'Missing ParmMapObject for record type ' + recordType);				
				L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: MISSING Library ParmMapObject for record type ' + recordType;
				validRequest = false;
			}
			break;
		default:
			//ERROR UNRECOGNIZED RECORD TYPE
			validRequest = false;
			L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: Invalid recordType ' + recordType + ' requested.'
		}
	}
	else {
		//ERROR - NO RECORD TYPE PASSED IN
		validRequest = false;
		L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: RecordType parameter empty or missing.'
	}
	
	var customFilters = new Array();	
	var customColumns = new Array();
	
	try
	{	
		for (var prop in datain) {
			if(validRequest) {
				//nlapiLogExecution('debug', 'datain.prop=' + prop);	
				//nlapiLogExecution('debug', 'datain.propoperator=' + datain[prop].operator);	
				//nlapiLogExecution('debug', 'datain.propvalue=' + datain[prop].value);				
				
				if(!datain[prop].operator) {
					nlapiLogExecution('DEBUG', 'Missing operator value for: ' + prop);				
					L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: ' + prop + ' MISSING search OPERATOR criteria';
					validRequest = false;
				}
				else if(!datain[prop].value) {
					nlapiLogExecution('DEBUG', 'Missing operator value for: ' + prop);				
					L_dynamicSearchMsg = 'L_dynamicSearch Script ERROR: ' + prop + ' MISSING search VALUE criteria';
					validRequest = false;
				}
				else if(typeof parmMapObject[prop] != 'undefined') {
					nlapiLogExecution('debug', 'parmMapObject.prop=' + parmMapObject[prop].nsfieldName);
					var searchByStr = parmMapObject[prop].searchBy.toString();
					nlapiLogExecution('DEBUG', 'searchByStr: ' + searchByStr, 'index of operator is='+ searchByStr.indexOf(datain[prop].operator.toLowerCase()));	
					if(searchByStr.indexOf(datain[prop].operator.toLowerCase()) != -1) {
						//KM 03-19-18: US352131: check and see if search filter needs to be setup using "join" parameter
						if(parmMapObject[prop].joinFrom != null && parmMapObject[prop].joinFrom != '')	{									
							customFilters.push(new nlobjSearchFilter(parmMapObject[prop].nsfieldName.substring(parmMapObject[prop].nsfieldName.indexOf('.')+1),parmMapObject[prop].joinFrom,datain[prop].operator,datain[prop].value));
							}
						else {
							customFilters.push(new nlobjSearchFilter(parmMapObject[prop].nsfieldName,null,datain[prop].operator,datain[prop].value));						
						}						
					}
					else {
						nlapiLogExecution('DEBUG', 'BAD DATAIN OPERATOR: ' + prop);				
						L_dynamicSearchMsg = "L_dynamicSearch Script ERROR: Operator '" + datain[prop].operator + "' is not valid search criteria for field " + prop;
						validRequest = false;
					}
				}
				else {
					nlapiLogExecution('DEBUG', 'BAD DATAIN FIELD NAME: ' + prop);				
					L_dynamicSearchMsg = "L_dynamicSearch Script ERROR: Field '" + prop + "' is not valid " + recordType + " search criteria";
					validRequest = false;
				}
			}			
		}
				 
		if(validRequest) {
			//nlapiLogExecution('DEBUG', 'ColumnsOut.length:', columnsOut.length);
			if (columnsOut != null && columnsOut != '' && columnsOut.length > 0) {
				nlapiLogExecution('DEBUG', 'columnsOut.length = ' + columnsOut.length);
				for(var j=0; j < columnsOut.length; j++) {									
						if(typeof parmMapObject[columnsOut[j]] != 'undefined') {
							//KM 03-19-18: US352131: check and see if column needs to be setup using "join" parameter
							if(parmMapObject[columnsOut[j]].joinFrom != null && parmMapObject[columnsOut[j]].joinFrom != '')	{								
								customColumns.push(new nlobjSearchColumn(parmMapObject[columnsOut[j]].nsfieldName.substring(parmMapObject[columnsOut[j]].nsfieldName.indexOf('.')+1),parmMapObject[columnsOut[j]].joinFrom));
								}
							else {						
								customColumns.push(new nlobjSearchColumn(parmMapObject[columnsOut[j]].nsfieldName));	
							}
						}
						else {
							nlapiLogExecution('DEBUG', 'BAD RETURN COLUMN SPECIFIED: ' + columnsOut[j]);				
							L_dynamicSearchMsg = "L_dynamicSearch Script ERROR: Requested return column '" + columnsOut[j] + "' is invalid.";
							validRequest = false;
						}					
				}
			} 
			else customColumns = null;
		}
	
		if(validRequest) {			
		    var ResultsArray = [];
		    var resultObj= {};	
		    var thisRes = '';
	    	var resColArray = '';
	    	var nsfieldnameInMap = '';
		    
		    //Perform the search	   
			searchResults = nlapiSearchRecord(recordType,null,customFilters,customColumns);	    
			
		    //if specific columns were asked to be returned, we need to match up the internal ns column names to the datain name glossary
		    if(customColumns != null) {	
				
			    for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
			    {				    
			    	//KM 03-19-18: US352131: need to get the  properties of all the columns returned for each row so that we can reverse map the results
			    	//back to their datain "english" name.  Since the columns returned are the same for each row, we only have to do this for the first row.
			    	if (i == 0) {			    		
					    thisRes = searchResults[0];   //look at first result row to get return column names
				    	resColArray = thisRes.getAllColumns();						
			    	}
			    	
			    	resultObj= {};   //reset result object for each row
					    	
			    	for ( var x = 0; thisRes != null && x < resColArray.length; x++ )
				    {				    		
				    	nlapiLogExecution('DEBUG', 'searchResultsValue['+i+'].col['+x+'] = ' + searchResults[i].getValue(customColumns[x]));	
				    					    	
				    	if(resColArray[x].getJoin() != null && resColArray[x].getJoin() != '')
				    		 nsfieldnameMap = resColArray[x].getJoin() + '.' + resColArray[x].getName();		
				    	else nsfieldnameMap = resColArray[x].getName();	
				    	
				    	for(var key in parmMapObject) {
				    		if(parmMapObject[key].nsfieldName == nsfieldnameMap)
				    			resultObj[key] = searchResults[i].getValue(customColumns[x]);
				    	}
				    	
				    }
			    	
			    	ResultsArray.push(resultObj);
			    }  
		    }
		    //No specific columns requested, so just return all results in bulk
		    else ResultsArray = searchResults;
 
		    //log # of records found
		    var numRecsFound = (searchResults != null) ?  searchResults.length: 0;
		    nlapiLogExecution('DEBUG', 'After dynamic search, number of records found = ' + numRecsFound, 'SEARCH DONE!');				
		    L_dynamicSearchMsg = 'L_dynamicSearch Script SUCCESS:  ' + numRecsFound + ' records found.';
		    L_dynamicSearchDone = true;
		}
		else {
			nlapiLogExecution('DEBUG', 'INVALID REQUEST... SEARCH NOT RUN');
		}
	}		
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );	
			if(e.name=='SSS_INVALID_SRCH_OPERATOR') {
				L_dynamicSearchMsg = 'L_dynamicSearch Script SYSTEM ERROR:  ' + e.getCode() + ' -- ' + e.getDetails();
			}
			else if(e.name=='SSS_USAGE_LIMIT_EXCEEDED') {
				L_dynamicSearchMsg = 'L_dynamicSearch Script SYSTEM ERROR:  ' + e.getCode() + ' -- ' + e.getDetails();
			}
			else {							
				L_dynamicSearchMsg = 'L_dynamicSearch Script SYSTEM ERROR:  ' + e.getCode() + ' -- ' + e.getDetails();			
			}								
		}		
		else
		{			
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			L_dynamicSearchMsg = 'L_dynamicSearch Script UNEXPECTED ERROR:  ' +  e.toString();		
		}		
	}
	
	nlapiLogExecution('debug', '** L_dynamicSearch library script ended ***');

	return(ResultsArray);
}

