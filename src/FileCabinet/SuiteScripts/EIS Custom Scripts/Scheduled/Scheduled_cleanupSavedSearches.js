/*
 * Script:     Scheduled_cleanupSavedSearches.js
 * 
 * Created by: Kate McCormack
 * 
 * Functions:  	
 * 	Using the input_file_id, this script reads in an csv file of old, unused Saved Searches ids and then loads and deletes each one 
 *  of those old searches. Prior to deleting, the Saved Search's filters and return columns are output to a results file.  
 *  This will be helpful if we need to recreate a deleted search for some reason.
 *  
 *  Revisions: 
 *  05-31-2017	Kate M.	--- Create Date
 */ 

	//Constant values 
	var constants = {};
	
	//Variables whose values are the same across environments
	constants.True = 'true';	 
	constants.False = 'false';	
	constants.SSFileFolder = '44344522';
	

function cleanupSavedSearches( type )
{
	//nlapiLogExecution('debug', 'STARTING cleanupSavedSearches'); 
	
	var currInputFileID = 0;
	
	if(nlapiGetContext().getSetting('SCRIPT', 'custscript_input_file_id') !='' && nlapiGetContext().getSetting('SCRIPT', 'custscript_input_file_id') != null)
    {
		currInputFileID = nlapiGetContext().getSetting('SCRIPT', 'custscript_input_file_id');
    }

    nlapiLogExecution('DEBUG', 'SCRIPT STARTED...', 'Scheduled Script Has Started, current Script Param : ' + currInputFileID );
	
	
	 //only execute when run from the scheduler 
	/*	if ( type != 'scheduled' && type != 'skipped' )
		{
			return; 
		}*/

	var sfiltersAsStr = '';
	var scolsAsStr = '';
	var sscriptID = '';
	var resultsArray = new Array();	
	var jsonResultsObj ='';
	var deletedCnt = 0;
	
	//var resultsArrayX = new Array();   For Excel File which doesnt work
		
	var infile = nlapiLoadFile(currInputFileID);
	
		var infilename = infile.getName();
		var infilenameNoExt = infilename.substring(0, (infilename.lastIndexOf(".")));
		
		nlapiLogExecution('DEBUG', 'FILE LOAD', 'Loaded input file name is : ' + infilename );		
	  var ids = infile.getValue() +',';

	  
	    var ssIds = ids.split(','); 
	   
	    nlapiLogExecution('DEBUG', 'FILE LENGTH', 'Input array of ids has a length of '+ (ssIds.length-1)); 

	    

	    //Looping through each result of the Search
	  for (i=0; i < ssIds.length-1; i++){
		 
			var sfilters = new Array();
			var scolumns = new Array();			
			jsonResultsObj ='';
			sfiltersAsStr = '';
			scolsAsStr = '';
			sscriptID = '';
			errReason = '';
			status = '';
		
			 var ssID = ssIds[i];

		try {
			nlapiLogExecution('DEBUG', 'ATTEMPTING TO LOAD AND REMOVE SEARCH', 'SS ID['+i+'] = '+ssID);
		  
	
		   //load each search
		  var SavedSearchRec =  nlapiLoadSearch(null , ssID);
		 
		   sscriptID = SavedSearchRec.getScriptId();
		
		   sfilters = SavedSearchRec.getFilterExpression();
				   
		   for ( var x = 0; sfilters != null && x < sfilters.length; x++ )
	   		{
	   			var filter = sfilters[x];
	   			sfiltersAsStr = sfiltersAsStr + JSON.stringify(filter);				    	
	   		}
	   		
		   //nlapiLogExecution('debug', 'Saved Search filters as String = ' + sfiltersAsStr); 
   		
		    
	   		scolumns = SavedSearchRec.getColumns();
	   	
	   		
	   		for ( var y = 0; scolumns != null && y < scolumns.length; y++ )
	   		{
	   			var column = scolumns[y];
	   			var colinfo ='';
	   			//sfiltersAsStr = sfiltersAsStr + JSON.stringify(filter);
	   			
	   			colinfo = '[Return Col('+y+'): NAME=' + column.getName() + ' |  SORT='+ column.getSort() + ' | SUMMARY= '+ column.getSummary() + '] ';
	   			
	   			scolsAsStr = scolsAsStr + colinfo;
	   		}
	   		
	   		//nlapiLogExecution('debug', 'Saved Search results columns as String = ' + scolsAsStr);	   				

/*		   if(!SavedSearchRec.getIsPublic()) {
			   nlapiLogExecution('debug', 'search is not public so set it'); 
			   SavedSearchRec.setIsPublic(true);
			   var scriptid = search.getScriptId();
			   //save the search
			   SavedSearchRec.saveSearch();
			   nlapiLogExecution('debug', 'search saved as public'); 
		   }*/
		   
		   jsonResultsObj = {"ID": ssID, 
				   "scriptID": sscriptID,
				   "isPublic": SavedSearchRec.getIsPublic(),
				    "filters": sfiltersAsStr,
				    "columns": scolsAsStr,
				    "status": "SUCCESS - DELETED"} 
		   
		   //nlapiLogExecution('debug', 'before delete'); 
   		/***************************************/
   		SavedSearchRec.deleteSearch();			    	
   		/***************************************/
   		//nlapiLogExecution('debug', 'after delete'); 
   		nlapiLogExecution('DEBUG', 'STATUS - DELETED', 'SUCCESS');
   		
		   deletedCnt = deletedCnt + 1;
	  }
		catch ( e )
		{
			//nlapiLogExecution('debug', '*** within CATCH ERROR ***'); 
			//nlapiLogExecution('debug', 'e.toString is: '+e.toString()); 
			
			   jsonResultsObj = {"ID": ssID, 
					   "scriptID": sscriptID,
					   "isPublic": "",
					    "filters": sfiltersAsStr,
					    "columns": scolsAsStr,
					    "status": ""} 
			   
			if ( e instanceof nlobjError ) {
				//nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + ': ' + e.getDetails() );
				if (e.getCode() == 'INVALID_SEARCH') {
					//errReason = 'NS Saved Search does NOT exist';
					status = 'SKIPPED';
					jsonResultsObj.status = status + "  REASON: " +  e.getDetails() ;
					 nlapiLogExecution('DEBUG', 'STATUS - SKIPPED', e.getCode() + ': ' + e.getDetails());
				} 
				else if (e.getCode() == 'INVALID_RCRD_TYPE') {
					//errReason = 'NS Invalid Record type for the search: rectype=' +  ': ' + e.getDetails();;
					status = 'SKIPPED';
					jsonResultsObj.status = status + "  REASON: " +  e.getDetails() ;
					nlapiLogExecution('DEBUG', 'STATUS - SKIPPED', e.getCode() + ': ' + e.getDetails());
				}
				else if (e.getCode() == 'RCRD_DSNT_EXIST') {
					//errReason = 'NS Record does NOT exist';
					status = 'SKIPPED';
					jsonResultsObj.status = status + "  REASON: " +  e.getDetails() ;
					nlapiLogExecution('DEBUG', 'STATUS - SKIPPED', e.getCode() + ': ' + e.getDetails());
				}
				else {
					//errReason = 'NS Saved Search SYSTEM ERROR for SSId='+inSSId+':  ' + e.getCode() + '\n' + e.getDetails();
					status = 'ERROR';
					jsonResultsObj.status = status + "  REASON: " +   e.getCode() + ': ' + e.getDetails();
					nlapiLogExecution('DEBUG', '*** ERROR ***', e.getCode() + ': ' + e.getDetails());
				}		
			}		
			else {
				//nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );				
				//errReason = 'NS Restlet UNEXPECTED ERROR for SSId='+inSSId+':  ' +  e.toString() + ': actual search type is:' + stype;
				status = 'ERROR';
				jsonResultsObj.status = status + "  REASON: " +  e.getCode() + ': ' + e.getDetails();
				nlapiLogExecution('DEBUG', '*** ERROR ***', e.getCode() + ': ' + e.getDetails());
			}		
		}
				
		 resultsArray.push(jsonResultsObj);
	  }
	  
	
	 //var resultsFileFolder = nlapiGetContext().getSetting('SCRIPT', 'custscript_errorlog_folder');
	  var resultsFileFolder = constants.SSFileFolder;
	  
	  //var fileName = userId + ' - ' + (new Date()).valueOf();
	  var fileName = 'RESULTS: ' + infilenameNoExt;
	  nlapiLogExecution('debug', 'Creating Results File'); 
	  //var jsonStr = JSON.stringify(jsonResultsObj);
	  var jsonStr = JSON.stringify(resultsArray);
	  var resultsFile = nlapiCreateFile(fileName, 'JSON', jsonStr);
	  nlapiLogExecution('debug', 'File Created'); 
	  resultsFile.setFolder(resultsFileFolder);
	  nlapiLogExecution('debug', 'Folder Set'); 
	  nlapiSubmitFile(resultsFile);
	  nlapiLogExecution('debug', 'File Submitted'); 
			

/*	  nlapiLogExecution('debug', 'resultsArrayX.toString = ' + resultsArrayX.toString()); 	  
	  var fileNameX = 'TEST RESULTS EXCEL';
	  nlapiLogExecution('debug', 'Creating FileX'); 
	  var resultsFileX = nlapiCreateFile(fileNameX, 'EXCEL', nlapiEncrypt(resultsArrayX.toString(), 'base64'));
	  nlapiLogExecution('debug', 'FileX Created'); 
	  resultsFileX.setFolder(resultsFileFolder);
	  nlapiLogExecution('debug', 'Folder Set'); 
	  nlapiSubmitFile(resultsFileX);
	  nlapiLogExecution('debug', 'FileX Submitted'); */
	  
	  	  	  
	nlapiLogExecution('debug', 'SUCCESS: SCRIPT ENDED', 'Final Deleted Count = ' + deletedCnt); 	
		
	
	//Setting up TEST Datainput
	/*	var jsonobj = {"ID": "customsearch6376", 
    "type": "contact",
    "internalID": "6376", 
    "title": "TEST",
    "access": "Public"}*/

/*	var jsonobj = {"ID": "customsearch4416", 
"type": "customer",
"internalID": "4416", 
"title": "TEST PRIVATE",
"access": "Private"}

var jobjs = [];
jobjs.push(jsonobj);
var datain = {"sslistin": jobjs}*/
	
	
	/*	  var text = ids.split(',');
	  nlapiLogExecution('debug', 'infile loadsearch ids0: '+text[0]); 
	  var search = nlapiLoadSearch(null , text[0]);
	  nlapiLogExecution('debug', 'infile loadsearch ids1: '+text[1]); 
	  var search2 = nlapiLoadSearch(null , text[1]);*/
	  
	  
/*		  nlapiLogExecution('debug', 'try hardcoded load'); 
			var search = nlapiLoadSearch(null ,'5863');
			
			nlapiLogExecution('debug', 'try string variable load'); 
			var idStr = '5863';
			var search2 = nlapiLoadSearch(null ,idStr);*/

	
   // var filters = new Array();
   // filters[0] = new nlobjSearchFilter('internalid',null,'anyof', caseId);
   // var searchResults = nlapiSearchRecord('supportcase', constants.caseSearch, filters, null);   //Saved search created in the UI to retrieve the case
 /*   var searchResults = nlapiSearchRecord('customer', 'customsearch40882', null, null);   //Saved search created in the UI to retrieve the case
    var searchResultsArray = [], fileResultObj=null;
    
    if(searchResults) {
    	nlapiLogExecution('debug', 'nlapiSearchRecord call returned '+ searchResults.length + ' saved searches.' ); 
    }*/
    	
/*        for(var i=0;i<searchResults.length;i++)
        {
	        var searchresult = searchResults[i];
	        var b = searchresult.getAllColumns(); 				        
	        var fileid = searchresult.getValue(b[0]);
	        var filename = searchresult.getValue(b[1]);
	        var fileurl = searchresult.getValue(b[2]);
	        var filepath = searchresult.getValue(b[3]);
	        
	        fileResultObj = {};
	        fileResultObj.fileid = fileid;		
	        fileResultObj.filename = filename;
	        fileResultObj.fileurl = fileurl;
	        fileResultObj.filepath = filepath;
	        searchResultsArray.push(fileResultObj);
        }
    }	       
    
    //var data = {caseInfo: caseInfo, caseFAV: casefav, caseMsgResults: caseMessagesResults, messages: caseMessagesArray};
    var data = {caseInfo: caseInfo, fileInfo: searchResultsArray, messages: caseMessagesArray};*/
	
	


		
}
	