/* 
 * File:  Restlet_GetFileById.js
 * 
 * Module Description:  This Restlet accepts file/attachment internal ID as an input, and returns full details of the file/attachment (beyond just the URL)
 * 	
 *
 * JSON input expected:  {"file_id":"[file ID]"}

 * 
 * Version    	Date            	Author				Remarks
 * 1.00       	6/4/2018			Jeff Oliver	
				3/11/2019			Jeff Oliver			TA335130 Removed file_full_url due to account-specific domain change w/2019.1

 */

function GetFileById(datain)
{
	nlapiLogExecution('debug', 'RESTLET GetFileById started'); 
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
	try
	{
		// load file
		nlapiLogExecution('debug', 'datain.file_id=' + datain.file_id);	

	//  Retrieve file details
 		var file = nlapiLoadFile(datain.file_id);
 		var file_value = file.getValue()
 		var file_id = datain.file_id;
 		var file_url = file.getURL();
 		//var file_full_url = 'https://system.netsuite.com' + file_url; (TA335130)
 		var file_name = file.getName();
 		var file_folder = file.getFolder();
 		var file_extension = file_name.substring(file_name.indexOf(".") + 1);


 		

	
		nlapiLogExecution('debug', 'Success Loading GetFileById',  'file_id: '+datain.file_id);
		restlet_status = 'SUCCESS';
	}		
	catch ( e )
	
	{
		if ( e instanceof nlobjError ) 
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'GetFileById Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'GetFileId Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
		var dataout = {restlet_status: restlet_status, restlet_status_details: restlet_status_details, file_value: file_value, file_id: file_id, file_url: file_url, /*file_full_url: file_full_url, (TA335130)*/ file_name: file_name, file_folder: file_folder, file_extension: file_extension};

	nlapiLogExecution('debug', 'RESTLET GetFileById ended...');	
	return(dataout);
}
