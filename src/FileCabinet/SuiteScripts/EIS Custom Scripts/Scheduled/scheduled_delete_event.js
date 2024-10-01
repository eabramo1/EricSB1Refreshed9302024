/* *************************************************************************************************************************
 *	Script:     scheduled_delete_event.js
 *  SuiteScript Version:	1.00 
 *  Created:	05-06-20
 *  Author:		eabramo
 *  
 *  Description:	Script deletes Event records in NetCRM
 *  				The script depends on a txt file being placed in a file folder in the NetSuite File Cabinet.
 *  				the txt file, needs to be a single row string containing Internal ID's of the Task that will be deleted.  
 *  				Each Internal ID needs to be delimited with a comma.
 *  				It is recommended that no more than 20,000 records are placed in a single file (so that the job can be better monitored)
 *  				The file placed in the folder will get a NetSuite file ID.  The file ID needs to be placed in the parameter in the Script Deployment.
 *  				The parameter is called: Task Deletion File ID
 *  
 *  Functions:		delete_events	
 *   
 * 	Library Scripts Used:	-NONE-
 *  
 *  Revisions:		
 * 
 * ************************************************************************************************************************/

//Constant values 
var constants = {};
// EventResultsFolder is the ID of the File folder that will store the Results file that I build and save into the file cabinet
constants.EventResultsFolder = '92164852';


function delete_events(type) 
{
	// nlapiLogExecution('debug', 'STARTING delete_activities'); 
	var currInputFileID = 0;
	// Script record has one parameter for the file id 'custscript_event_file_id'
	if(nlapiGetContext().getSetting('SCRIPT', 'custscript_event_file_id') !='' && nlapiGetContext().getSetting('SCRIPT', 'custscript_event_file_id') != null)
    {
		currInputFileID = nlapiGetContext().getSetting('SCRIPT', 'custscript_event_file_id');
    }
    nlapiLogExecution('DEBUG', 'SCRIPT STARTED...', 'Scheduled Script Has Started, current Script Param : ' + currInputFileID );
	var actScriptID = '';
	var resultsArray = new Array();	
	var jsonResultsObj ='';
	var deletedCnt = 0;
			
	var infile = nlapiLoadFile(currInputFileID);
	var infilename = infile.getName();
	var infilenameNoExt = infilename.substring(0, (infilename.lastIndexOf(".")));		
	nlapiLogExecution('DEBUG', 'FILE LOAD', 'Loaded input file name is : ' + infilename );		
	var ids = infile.getValue() +',';
	var eventIds = ids.split(','); 
	nlapiLogExecution('DEBUG', 'FILE LENGTH', 'Input array of ids has a length of '+ (eventIds.length-1)); 

	for (i=0; i < eventIds.length-1; i++)
	{		
		jsonResultsObj ='';
		// errReason = '';
		status = '';
		var eventId = eventIds[i];
		try 
		{
			// nlapiLogExecution('DEBUG', 'DELETE RECORD ', 'TASK ID['+i+'] = '+eventId);
			jsonResultsObj = {"ID": eventId, "status": "SUCCESS - DELETED"}
			// nlapiLogExecution('debug', 'before delete'); 
			nlapiDeleteRecord('calendarevent', eventId);
			// nlapiLogExecution('debug', 'after delete'); 
			// nlapiLogExecution('DEBUG', 'STATUS - DELETED', 'SUCCESS');
			deletedCnt = deletedCnt + 1;
		}
		catch (e)
		{
			nlapiLogExecution('debug', '*** within CATCH ERROR ***'); 
			// nlapiLogExecution('debug', 'e.toString is: '+e.toString()); 	
			jsonResultsObj = {"ID": eventId, "status": ""} 	   
			if ( e instanceof nlobjError )
			{
				if (e.getCode() == 'RCRD_DSNT_EXIST') 
				{
					//errReason = 'NS Record does NOT exist';
					status = 'SKIPPED';
					jsonResultsObj.status = status + "  REASON: " +  e.getDetails() ;
					nlapiLogExecution('DEBUG', 'STATUS - SKIPPED', e.getCode() + ': ' + e.getDetails());
				}
				else 
				{
					//errReason = 'NS Saved Search SYSTEM ERROR for SSId='+inSSId+':  ' + e.getCode() + '\n' + e.getDetails();
					status = 'ERROR';
					jsonResultsObj.status = status + "  REASON: " +   e.getCode() + ': ' + e.getDetails();
					nlapiLogExecution('DEBUG', '*** ERROR *** at eventId: '+eventId, e.getCode() + ': ' + e.getDetails());
				}		
			}		
			else 
			{
				//nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );				
				//errReason = 'NS Restlet UNEXPECTED ERROR for SSId='+inSSId+':  ' +  e.toString() + ': actual search type is:' + stype;
				status = 'ERROR';
				jsonResultsObj.status = status + "  REASON: " +  e.getCode() + ': ' + e.getDetails();
				nlapiLogExecution('DEBUG', '*** ERROR ***', e.getCode() + ': ' + e.getDetails());
			}		
		} // end Catch		
		resultsArray.push(jsonResultsObj);
		
		// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
		// nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
		if(nlapiGetContext().getRemainingUsage() < 5500) 
		{
			nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			nlapiLogExecution('audit', '*** Yielding ***', 'at eventId: '+eventId+'. i= '+i);
			nlapiSetRecoveryPoint();
			nlapiYieldScript();
			nlapiLogExecution('audit', '*** Resuming from Yield ***', 'at eventId: '+eventId);  
		}		
	} // End For Loop on each record
	
	//var resultsFileFolder = nlapiGetContext().getSetting('SCRIPT', 'custscript_errorlog_folder');
	var resultsFileFolder = constants.EventResultsFolder;
	
	//var fileName = userId + ' - ' + (new Date()).valueOf();
	var fileName = 'RESULTS: ' + infilenameNoExt;
	// nlapiLogExecution('debug', 'Creating Results File'); 
	//var jsonStr = JSON.stringify(jsonResultsObj);
	var jsonStr = JSON.stringify(resultsArray);
	var resultsFile = nlapiCreateFile(fileName, 'JSON', jsonStr);
	// nlapiLogExecution('debug', 'File Created'); 
	resultsFile.setFolder(resultsFileFolder);
	// nlapiLogExecution('debug', 'Folder Set'); 
	nlapiSubmitFile(resultsFile);
	nlapiLogExecution('debug', 'File Submitted'); 
	nlapiLogExecution('debug', 'SUCCESS: SCRIPT ENDED', 'Final Deleted Count = ' + deletedCnt); 	
}
