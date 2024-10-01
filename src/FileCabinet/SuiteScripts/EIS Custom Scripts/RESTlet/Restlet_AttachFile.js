/* Restlet_AttachFile.js
 *
 * Module Description:  When this Restlet is called it will allow the user to create a file and then attach it to an artifact within NetCRM--right now just 'customrecord36' and 'supportcase'
 * Inspired by: https://riptutorial.com/netsuite/example/28034/restlet---store-and-attach-file
 * 	Library Scripts Used:
 * 		library_constants.js -- Library Script used to reference constant values
 * 		library_utility.js -- Library Script used for various functions

 * JSON input expected: {
	record_type:"customrecord36",
	internal_id: "si_id",
	file_name: "filename",
	file_content: "file content" [anything BUT plaintext/CSV should be base64 encoded]
}

 *  JSON output expected:
 *   {
 *  	"restlet_status": "SUCCESS",
 *    	"restlet_status_details": "excel_some_text_upload_from_restlet__1582735861136.txt attached to Service Issue 295791",
 *   	"filesize": "31 Bytes",
 *   	"file_name": "excel_some_text_upload_from_restlet__1582735861136.txt",
 *   	"file_id": 77028353
 *   }
 *
 *  Link to Documentation:
 *
 *
 *
 * Version    Date            	Author			Remarks
 * 1.00     02/13/2020			Ariana Hazen	RESTlet Created
 * 1.01		03/30/2020			Ariana Hazen	RESTlet Updated to use Constants and not limited to just SIs
 * 1.02		09/13/2022			Ariana Hazen	"har" and "json" as an acceptable filetypes in error message (US1008951)
 * */

function Restlet_AttachFile(datain) {
    var functionname = L_CurrentFuncName(arguments);
    nlapiLogExecution('debug', 'RESTLET ' + functionname + ' started');
    var dataout = {};
    dataout.restlet_status = 'ERROR';
    dataout.restlet_status_details = '';

    try {
        var internal_id = datain.internal_id;
        var file_name = datain.file_name;
        var file_content = datain.file_content;
        var record_type = datain.record_type;
        var record_lbl = LC_recordAttr[record_type].label;
      	var folderId = LC_recordAttr[record_type].folderid;
        dataout.filesize = 0;
        var file_size = 0;
        const filemax = LC_fileSizeLimit; // 5MB -- too big == too long to load
        //the below will be appended to filename to prevent overwriting.
        var timestamp = new Date().getTime();

        if (record_type && record_lbl) {
            if (internal_id && file_name && file_content) {
                //check for record exists, so we don't upload files without adding them to the right location
                //performance wise nlapiSearchRecord is better than nlapiLoadRecord
                var check_internal_id = nlapiSearchRecord(record_type, null, ['internalid', 'is', internal_id],null);
                if (check_internal_id) {
                    //split up filename to get extension and to add timestamp
                    var file_n = file_name.split(".");
                    var ext = file_n[file_n.length - 1];
                    file_n.pop(); //remove ext from array
                    file_n = file_n.join("_");
                    //sanitize filename
                    file_n = file_n.replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase() + "_" + timestamp + "." + ext;
                    dataout.file_name = file_n;
                    var file_type = L_fileTypes(ext);
                    var contentCopy = datain.file_content;
                    if (file_type == 'CSV' || file_type == 'PLAINTEXT' || file_type=='JSON') {
                        //encrypting to check size
                        contentCopy = nlapiEncrypt(contentCopy, 'base64');
                    }
                    var contentPadding = (contentCopy.substr(-2) === "==" ? 2 : (contentCopy.substr(-1) === "=" ? 1 : 0));
                    file_size = (contentCopy.length * (3 / 4)) - contentPadding;
                    dataout.filesize = L_formatFileSize(file_size);
                    if (file_type == '') {
                        dataout.restlet_status = "ERROR";
                        dataout.restlet_status_details = "Your file type is not recognized. Please check your file extension and try again. Possible extensions are: bmp,csv,doc,docx,eml,gif,jpeg,jpg,pdf,png,ppt,pptx,rtf,txt,xls,xlsx,xml,zip,har,json";
                    } else if (file_size <= 0) {
                        dataout.restlet_status = "ERROR";
                        dataout.restlet_status_details = "Your file is empty.";
                    } else if (file_size >= filemax) {
                        dataout.restlet_status = "ERROR";
                        dataout.restlet_status_details = "Your file exceeds the maximum filesize of " + L_formatFileSize(filemax);
                    } else {
                        var uplFile = nlapiCreateFile(file_n, file_type, file_content);
                        uplFile.setFolder(folderId);
                        var file_id = nlapiSubmitFile(uplFile);

                        if (file_id) {
                            dataout.file_id = file_id;
                            dataout.restlet_status = "SUCCESS";
                            nlapiAttachRecord('file', file_id, record_type, internal_id);
                            dataout.restlet_status_details = dataout.file_name + " attached to " + record_lbl +" "+ internal_id;
                        } else {
                            dataout.restlet_status = "ERROR";
                            dataout.restlet_status_details = "Error uploading file.";
                        }
                    }
                } else {
                    dataout.restlet_status = "ERROR";
                    dataout.restlet_status_details = "That Internal ID does not exist!";
                }
            } else {
                dataout.restlet_status = "ERROR";
                dataout.restlet_status_details = "Some or all Required fields were not passed into the request.";
            }
        } else {
				dataout.restlet_status = "ERROR";
                dataout.restlet_status_details = "The requested record type is not configured for uploads.";
		}
    } catch (e) {
        if (e instanceof nlobjError) {
            nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n' + e.getDetails());
            dataout.restlet_status_details = functionname + ' Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
            dataout.restlet_status = 'ERROR';
        } else {
            nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
            dataout.restlet_status_details = functionname + ' Restlet UNEXPECTED ERROR:  ' + e.toString();
            dataout.restlet_status = 'ERROR';
        }
    }
    nlapiLogExecution('debug', 'RESTLET ' + functionname + ' ended...');
    return dataout;
}