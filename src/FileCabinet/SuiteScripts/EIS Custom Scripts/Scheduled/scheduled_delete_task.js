/* *************************************************************************************************************************
 *	Script:     scheduled_delete_task.js
 *  SuiteScript Version:	1.00 
 *  Created:	05-06-20
 *  Author:		eabramo
 *  
 *  Description:	Script deletes Task records in NetCRM
 *  				The script depends on a txt file being placed in a file folder in the NetSuite File Cabinet.
 *  				the txt file, needs to be a single row string containing Internal ID's of the Task that will be deleted.  
 *  				Each Internal ID needs to be delimited with a comma.
 *  				It is recommended that no more than 20,000 records are placed in a single file (so that the job can be better monitored)
 *  				The file placed in the folder will get a NetSuite file ID.  The file ID needs to be placed in the parameter in the Script Deployment.
 *  				The parameter is called: Task Deletion File ID
 *  
 *  Functions:		delete_tasks	
 *   
 * 	Library Scripts Used:	-NONE-
 *  
 *  Revisions:		
 * 
 * ************************************************************************************************************************/

//Constant values 
var constants = {};
// TaskResultsFolder is the ID of the File folder that will store the Results file that I build and save into the file cabinet
constants.TaskResultsFolder = '92164849';


function delete_tasks(type) 
{
	// nlapiLogExecution('debug', 'STARTING delete_activities'); 
	var currInputFileID = 0;
	// Script record has one parameter for the file id 'custscript_task_file_id'
	if(nlapiGetContext().getSetting('SCRIPT', 'custscript_task_file_id') !='' && nlapiGetContext().getSetting('SCRIPT', 'custscript_task_file_id') != null)
    {
		currInputFileID = nlapiGetContext().getSetting('SCRIPT', 'custscript_task_file_id');
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
	var taskIds = ids.split(','); 
	nlapiLogExecution('DEBUG', 'FILE LENGTH', 'Input array of ids has a length of '+ (taskIds.length-1)); 

	for (i=0; i < taskIds.length-1; i++)
	{		
		jsonResultsObj ='';
		// errReason = '';
		status = '';
		var taskId = taskIds[i];
		try 
		{
			// nlapiLogExecution('DEBUG', 'DELETE RECORD ', 'TASK ID['+i+'] = '+taskId);
			jsonResultsObj = {"ID": taskId, "status": "SUCCESS - DELETED"}
			// nlapiLogExecution('debug', 'before delete'); 
			nlapiDeleteRecord('task', taskId);
			// nlapiLogExecution('debug', 'after delete'); 
			// nlapiLogExecution('DEBUG', 'STATUS - DELETED', 'SUCCESS');
			deletedCnt = deletedCnt + 1;
		}
		catch (e)
		{
			// nlapiLogExecution('debug', '*** within CATCH ERROR ***'); 
			// nlapiLogExecution('debug', 'e.toString is: '+e.toString()); 	
			jsonResultsObj = {"ID": taskId, "status": ""} 	   
			if ( e instanceof nlobjError )
			{
				if (e.getCode() == 'RCRD_DSNT_EXIST') 
				{
					//errReason = 'NS Record does NOT exist';
					status = 'SKIPPED';
					jsonResultsObj.status = status + "  REASON: " +  e.getDetails() ;
					nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
					nlapiLogExecution('DEBUG', 'STATUS - SKIPPED', "taskId= "+taskId+ ': ' +e.getCode() + ': ' + e.getDetails());
				}
				else 
				{
					//errReason = 'NS Saved Search SYSTEM ERROR for SSId='+inSSId+':  ' + e.getCode() + '\n' + e.getDetails();
					status = 'ERROR';
					jsonResultsObj.status = status + "  REASON: " +   e.getCode() + ': ' + e.getDetails();
					nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
					nlapiLogExecution('DEBUG', '*** ERROR ***', "taskId= "+taskId+ ': ' +e.getCode() + ': ' + e.getDetails());
				}		
			}		
			else 
			{
				//nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );				
				//errReason = 'NS Restlet UNEXPECTED ERROR for SSId='+inSSId+':  ' +  e.toString() + ': actual search type is:' + stype;
				status = 'ERROR';
				jsonResultsObj.status = status + "  REASON: " +  e.getCode() + ': ' + e.getDetails();
				nlapiLogExecution('DEBUG', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('DEBUG', '--- ERROR ---', "taskId= "+taskId+ ': ' +e.getCode() + ': ' + e.getDetails());
			}		
		} // end Catch		
		resultsArray.push(jsonResultsObj);
		
		// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
		// nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
		if(nlapiGetContext().getRemainingUsage() < 5500) 
		{
			nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			nlapiLogExecution('audit', '*** Yielding ***', 'at taskId: '+taskId+'. i= '+i);
			nlapiSetRecoveryPoint();
			nlapiYieldScript();
			nlapiLogExecution('audit', '*** Resuming from Yield ***', 'at taskId: '+taskId);  
		}		
	} // End For Loop on each record
	
	//var resultsFileFolder = nlapiGetContext().getSetting('SCRIPT', 'custscript_errorlog_folder');
	var resultsFileFolder = constants.TaskResultsFolder;
	
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
