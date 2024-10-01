/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 May 2017     cmccormack	(Reference SuiteAnswer #21047 for saved search script commands)
 * 
 * ************************************************************************************************************************************************
 * ************* NOTE:  THIS RESTLET CANNOT BE USED TO ACCESS/DELETE PRIVATE SAVED SEARCHES WHICH DO NOT HAVE AN AUDIENCE SPECIFIED    ************
 * ************* NOTE:  THIS RESTLET WILL ONLY WORK ON PUBLIC SAVED SEARCHES                                                           ************
 * ************* This is because, even though the restlet user can sign in with an admin user id and role, NetSuite does not recognize ************ 
 * ************* the admin authority and allow it to access private saved searches without an audience.... No Search Found is returned ************
 * ************************************************************************************************************************************************
 * 
 *  This restlet is passed a JSON array of old, unused Saved Searches deatials and then loads and deletes each one 
 *  of those old searches. Prior to deleting, the Saved Search's filters and return columns are output to a results file.  
 *  This will be helpful if we need to recreate a deleted search for some reason.
 *
 */

//var oStr = getAddrsToBeDeleted();

//alert(oStr);

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getSavedSearchesToBeDeleted(datain) {
	
/*	THIS GET METHOD CURRENTLY NOT USED FOR ANYTHING   */
 	
	var data = "";    
    return(data);
}

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postSavedSearchesToBeDeleted(datain) {
    /* 
     * Read array of saved searches' Id, Type, internalid, and title
     * 
     * For each SSId
     * 		get the saved search 
     * 		delete the saved search
     * 	
     * return the response array of saved searches found and deleted
     * 
     */
	
	
/*	// Load the existing search and then delete it
	var mySearch = nlapiLoadSearch('opportunity', 'customsearch_kr');
	mySearch.deleteSearch();*/
	
	nlapiLogExecution('debug', '++++ RESTLET postSavedSearchesToBeDeleted started...sslistin.length=' + datain.sslistin.length);

	var response = [];
	var savedsearchin = '';
	var matchedcnt = 0;	
	
	var errReason = '';
	var matched = false;
	var foundStr = 'NOT FOUND';
	var matchedSSId = '';
	var SSType = '';
	var status = '';
	var firstKeys ='';
	var stype = '';
	var sinternalid = '';
	var sfiltersAsStr = '';
	var scolsAsStr = '';
	
	for (var i = 0; i < datain.sslistin.length && status != 'ERROR'; i++) {	
	    savedsearchin = datain.sslistin[i];	   
	    nlapiLogExecution('debug', '***** PROCESSING INPUT REC #'+i);
	    nlapiLogExecution('debug', 'savedsearchin.ID=' + savedsearchin.ID + '    savedsearchin.type=' + savedsearchin.type);
	   	
		var inSSId = savedsearchin.ID;
		var inSStype = savedsearchin.type;
		var inSSInternalID = savedsearchin.internalID;
		
		if(i==0) {
			firstKeys = 'Batch ID:'+inSSId+' type:'+inSStype;
			nlapiLogExecution('debug', firstKeys+' started');
		}
		
		try {				
			errReason = '';
			matched = false;
			foundStr = 'NOT FOUND';
			matchedSSId = '';
			SSType = '';
			status = '';
			stype = '';
			sinternalid = '';
			var sfilters = new Array();
			var scolumns = new Array();
			sfiltersAsStr = '';
			scolsAsStr = '';
		
			nlapiLogExecution('debug', 'calling nlapiloadsearch for SSId = '+inSSId);
			//Retrieve the saved search
			//var SavedSearchRec = nlapiLoadSearch(inSStype, inSSId);
			var SavedSearchRec = nlapiLoadSearch(null, inSSInternalID);
	
			matchedSSId = SavedSearchRec.getId();		

			//If we found the saved search with the given id, try to delete it
			if (matchedSSId!=null) {	
				matched = true;
				foundStr = 'FOUND';		
			 
			    matched = (errReason != '') ? false:true;
			    
			    if(matched) {
			    	matchedcnt = matchedcnt + 1;
			    	
			    	stype = SavedSearchRec.getSearchType();
			    	sinternalid = SavedSearchRec.getScriptId();
			    	//nlapiLogExecution('debug', 'stype= '+stype+ '  ;  sinternalid= '+sinternalid);
			    	
			    	if(stype != inSStype.toLowerCase()) {
			    		status = 'MISMATCH';
			    		errReason = 'NS Saved Search type found was "'+ stype + '", NOT "'+inSStype.toLowerCase()+'"';
			    		nlapiLogExecution('debug', 'SAVED SEARCH MISMATCH TYPE -- NO DELETION'); 
			    	}
			    	else if(sinternalid != inSSId.toLowerCase()) {
			    		status = 'MISMATCH';
			    		errReason = 'NS Saved Search internalId found was "'+ sinternalid + '", NOT "'+inSSId+'"';
			    		nlapiLogExecution('debug', 'SAVED SEARCH MISMATCH INTERNALID -- NO DELETION'); 
			    	}
			    	else {
			    		sfilters = SavedSearchRec.getFilterExpression();
			    		
			    		for ( var x = 0; sfilters != null && x < sfilters.length; x++ )
			    		{
			    			var filter = sfilters[x];
			    			sfiltersAsStr = sfiltersAsStr + JSON.stringify(filter);
			    						    		
			    			nlapiLogExecution('debug', 'Saved Search filter['+x+'] = ' + JSON.stringify(filter)); 
			    		}
			    		
			    		nlapiLogExecution('debug', 'Saved Search filters as String = ' + sfiltersAsStr); 
			    		
			    		scolumns = SavedSearchRec.getColumns();
			    		for ( var y = 0; scolumns != null && y < scolumns.length; y++ )
			    		{
			    			var column = scolumns[y];
			    			var colinfo ='';
			    			//sfiltersAsStr = sfiltersAsStr + JSON.stringify(filter);
			    			
			    			colinfo = '[Return Col('+y+'): NAME=' + column.getName() + ' |  SORT='+ column.getSort() + ' | SUMMARY= '+ column.getSummary() + '] ';
			    			
			    			scolsAsStr = scolsAsStr + colinfo;
			    						    		
			    			nlapiLogExecution('debug', 'Saved Search column name['+y+'] = ' + column.getName()); 
			    			nlapiLogExecution('debug', 'Saved Search column sort['+y+'] = ' + column.getSort()); 
			    			nlapiLogExecution('debug', 'Saved Search column summary['+y+'] = ' + column.getSummary()); 
			    		}
			    		
			    		nlapiLogExecution('debug', 'Saved Search COLS as String = ' + scolsAsStr); 
			    		
			    		
			    		/***************************************/
			    		//SavedSearchRec.deleteSearch();			    	
			    		/***************************************/
			    		
						status = 'TO BE DELETED';		    	
				    	nlapiLogExecution('debug', 'SAVED SEARCH would have been SUCCESSFULLY DELETED');  		
			    	}
			    }	
			}
			else {
				//Given saved search id not found 
				errReason = 'Saved Search does NOT exist';
				status = 'SKIPPED';
			}			   	
		}
		catch ( e )
		{
			if ( e instanceof nlobjError ) {
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				if (e.getCode() == 'INVALID_SEARCH') {
					errReason = 'NS Saved Search does NOT exist';
					status = 'SKIPPED';
				} 
				else if (e.getCode() == 'INVALID_RCRD_TYPE') {
					errReason = 'NS Invalid Record type for the search: rectype=' + stype;;
					status = 'SKIPPED';
				}
				else if (e.getCode() == 'RCRD_DSNT_EXIST') {
					errReason = 'NS Record does NOT exist';
					status = 'SKIPPED';
				}
				else {
					errReason = 'NS Restlet SYSTEM ERROR for SSId='+inSSId+':  ' + e.getCode() + '\n' + e.getDetails();
					status = 'ERROR';
				}		
			}		
			else {
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );				
				errReason = 'NS Restlet UNEXPECTED ERROR for SSId='+inSSId+':  ' +  e.toString() + ': actual search type is:' + stype;
				status = 'ERROR';
			}		
		}		
		
		 var respdata = {matched: foundStr, status: status, errReason: errReason, savedsearchInfo: savedsearchin, savedsearchfilters: sfiltersAsStr, savedsearchrtncols: scolsAsStr};
		    
	    //nlapiLogExecution('debug', 'respdata=' + respdata);   
		//if(i==100 || i==200 || i==300 || i==400 || i==500) nlapiLogExecution('debug', firstKeys+' processed count=' + i);
		    
	    response.push(respdata);	
	}	
			 
	 //nlapiLogExecution('debug', '... returning respdata=' + JSON.stringify(response)); 
	 
	 var dataout = {matchedCount: matchedcnt, response: response};
	
	 //response.write(JSON.stringify(data));
	 
	 nlapiLogExecution('debug', firstKeys+' completed!');
	 
	return(JSON.stringify(dataout));
}


