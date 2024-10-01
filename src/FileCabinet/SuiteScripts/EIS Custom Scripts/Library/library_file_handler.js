//
// Script:     library_file_handler.js  
//
// Created by: Jeff Oliver
//
// Purpose:    This is a script file library of attachment functions that may be called from other scripts.
//        
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
// L_fileRetrieverMsg		6/21/2018	JOliver			Stores file retriever status
// L_GetFileInfo			6/21/2018	JOliver			Library function that retrieves file/attachment id & info for Messages (Case and SI forthcoming)
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	11/08/2018			Mackie				Uncommented out the Case and SI 'fileRetrieverObject' var information.
//	3/11/2019			JOliver				TA335129 Removed embedded file_fullurl due to account-specific domain changes
//
//-------------------------------------------------------------------------------------------------------------------------


/*----------------------------------------------------------------------------------------------------------------
 * Function   : L_GetFileInfo(input_recType, input_recId) 
 * Description: Retrieves file/attachment info (notably URL) for any record type
 * Input      : record_id
 * Returns    : file_id
 * 				file_name
 * 				file_datecreated
 * 				file_url
 * 				file_folder
 * 				file_size
 * 				file_type
 *-----------------------------------------------------------------------------------------------------------------*/


//status
var L_fileRetrieverMsg = '';


//input_recType is the record type ('Message', 'Case', 'ServiceIssue'), input_recId is the internal ID of the message, case, SI, etc.
function L_GetFileInfo(input_recType, input_recId) 
{

	var fileRetrieverObject  = 
	{
			Message:{
				record_type:	'message',	
				search_id:		'customsearch_attachmentIDs_message'
			},
			Case:{
				record_type:	'supportcase',	
				search_id:		'customsearch_attachmentIDs_case'
			},
			ServiceIssue:{
				record_type:	'customrecord36',	
				search_id:		'customsearch_attachmentIDs_si'
			}
	};
	
	
	
    var file_recType  = '';
    var file_searchId = ''; 
    var file_array = [];
    
    //if an input_recType exists
    if(input_recType)
    {
    	//if an input_recId exists
             if (input_recId) 
             {
                           if(typeof fileRetrieverObject[input_recType] != 'undefined') 
                           {
                        	   			file_recType  = fileRetrieverObject[input_recType].record_type;
                        	   			file_searchId = fileRetrieverObject[input_recType].search_id; 
                           }                                        
                           else 
                           {
                        	   L_fileRetrieverMsg = 'invalid input_recType param passed in'
                           }
             }
             else {
            	 L_fileRetrieverMsg = 'error input_recId param missing'
             }                                                      
    }
    else 
    {
    		L_fileRetrieverMsg = 'error input_recType param missing'
    }
	
    if (L_fileRetrieverMsg == '')
    {
        var search_filters = new Array();
        var file_obj= {};
        search_filters[0] = new nlobjSearchFilter('internalid',null,'anyof', input_recId); 
        search_results = nlapiSearchRecord(file_recType, file_searchId, search_filters, null); //updated search internal ID to a custom ID so it would work in all environments

        if(search_results) 
        {
            for(var i=0;i<search_results.length;i++)
            {
            	file_obj = {};
    	        var file_search_result = search_results[i];
    	        var x = file_search_result.getAllColumns(); 	
    	        file_obj.file_id = file_search_result.getValue(x[0]);
    	        file_obj.file_name = file_search_result.getValue(x[1]);
    	        file_obj.file_datecreated = file_search_result.getValue(x[2]);
    	        file_obj.file_url = file_search_result.getValue(x[3]);						        
    	        file_obj.file_folder = file_search_result.getValue(x[4]);
    	        file_obj.file_size = file_search_result.getValue(x[5]);
    	        file_obj.file_type = file_search_result.getValue(x[6]);
    	        //file_obj.file_fullurl = 'https://system.netsuite.com' + file_obj.file_url (TA335129 Removed embedded file_fullurl due to account-specific domain change in 2019.1)
    	        						        
    	        file_array.push(file_obj);     
            }
            L_fileRetrieverMsg = 'Search Successful';
        } else {
          L_fileRetrieverMsg = 'No attached Files';
        }
    }
    return file_array;		        		
}