/* Restlet_CreateSI.js
 *
 * Module Description:  When this Restlet is called it will allow the user to create a Service Issue artifact within NetCRM.

 * 	Library Scripts Used:
library_serviceIssue.js  -- Library Script functions will be called for field validation for all relevant fields.
library_constants.js -- Library Script used to reference constant values
library_utility.js -- Library Script used for various functions

 * JSON input expected: {
restletRequiredField
 *
Additional fields:
 *
}

 *  JSON output expected:
 *
 *
 *  Link to Documentation: https://ebscoind.sharepoint.com/:w:/s/EISOPFMercury/EetxtR3iwElKj0cFcfcck9QBfU3RvocKMQaWEwtqONlV4A?e=ttQbtK
 *
 * Version    Date            	Author			Remarks
 * 1.00     9-27-2018		Mackie			I am remarking.
 * 1.0.1	11-27-2018		Ariana Hazen	Refactoring to use new Library Script
 * 1.0.2	12/10/2018		Mackie			Deployed script to SB3 and updated the documentation: https://ebscoind.sharepoint.com/:w:/s/EISOPFMercury/EetxtR3iwElKj0cFcfcck9QBfU3RvocKMQaWEwtqONlV4A?e=RO2iLj
 * 1.0.3	1/2/2019		Ariana Hazen	Modified with extra error catching
 * 1.0.4	10/10/2019		Ariana Hazen	Updated for eContent Form fields. Also fixed issue with SI being created when required fields (per lib file)
 */

function CreateSI(datain) {
    var functionname = L_CurrentFuncName(arguments);
    nlapiLogExecution('debug', 'RESTLET ' + functionname + ' started');
    var dataout = {};
    dataout.restlet_status = 'ERROR';
    dataout.restlet_status_details = '';
    // Set Global Variables
    // parameters to track validity of data -- assume valid
    //Arrays to track fields and validity
    var updatedfields = [];
    var invalidfields = [];
    var requiredfields = [];
    var no_update = [];

    var si_id = '';

    try {
        // Create the Service Issue
        var si = nlapiCreateRecord('customrecord36');
		//different required fields for content si form
		var formid = 150;
		nlapiLogExecution('debug', 'formid: ' + datain.si_form_id);
		if(datain.si_form_id){
			//150 = EBSCO Service Issue Form
			//80 = EIS E-Content Service Issue Form
			formid = parseInt(datain.si_form_id);
			
			if((formid != 150 && formid !=80) || isNaN(formid) ){
				formid = 150;
			}
		}
	
	//what fields are actually required per our library
      for (var k in L_siParmMapObject) {
        if(L_siParmMapObject[k].restletRequiredField == 'T' || (formid == "80" && L_siParmMapObject[k].restletRequiredField_econtent == 'T')){
          requiredfields.push(k);
          }
      }

        //Specify the values for each relevant field
        for (var key in datain) {
                var field = L_siParmMapObject[key];
                var fieldname = null;
                var restletCanUpdate = "F";
                if (!L_JSONisEmpty(field)) {
                  //if datain field/key was found in L_siParmMapObject
                    fieldname = field.nsfieldName;
                    restletCanUpdate = field.restletCanUpdate;
					
                    if (restletCanUpdate == "T") { //make sure we are able to modify this field!
                        if (datain[key] != null && datain[key] != '') {
                            si.setFieldValue(fieldname, datain[key]);
							if(requiredfields.indexOf(key) > -1 ){
								var fieldindex = requiredfields.indexOf(key);
								delete requiredfields[fieldindex];
							}
                            updatedfields.push(key);
                        } 
                    } else {
                        no_update.push(key);
                    }
                } else {
                  //if field was NOT found in L_siParmMapObject
                    invalidfields.push(key);
                }
        }
		 //clear falsy values from array 
         //using delete replaces key with "undefined" (helped us by retaining original index as we looped)
		requiredfields = requiredfields.filter(Boolean);
		
		if(requiredfields.length){
          //If required fields not met, don't create SI
          //and don't alert user about invalidfields or no_update/readonly fields
			nlapiLogExecution('debug', 'Required Fields Missing: ' + requiredfields.join(', '));
          	dataout.restlet_status = 'ERROR';
            dataout.restlet_status_details = 'SI could not be created. Required Fields Missing: ' + requiredfields.join(', ');
		} else {
          if (updatedfields.length) { //If at least one field was updated, we'll save
            nlapiLogExecution('debug', 'updatedfields=' + updatedfields.join(', '));
            updatedfields_cleaned = updatedfields.join(', ');
            // submit the updated record
            si_id = nlapiSubmitRecord(si);
            nlapiLogExecution('DEBUG', 'id =' + si_id);
            dataout.restlet_status = 'SUCCESS';
            dataout.restlet_status_details = 'Service Issue Created: ' + si_id;
            dataout.restlet_status_details += '~~~Fields included during create: ' + updatedfields_cleaned;
            } else {
                dataout.restlet_status = 'ERROR';
                nlapiLogExecution('debug', 'No valid fields were sent.');
                dataout.restlet_status_details = 'SI could not be created. No valid fields were sent.';
            }
          //tell user about any invalidfields or no_update/readonly fields
			if (invalidfields.length) {
				//if unrecognized params were passed, append to restlet_status_details to alert user
				dataout.restlet_status_details += '~~~These fields were not recognized: ' + invalidfields.join(", ");
				nlapiLogExecution('debug', 'validData NOT true', 'invalidfields: ' + invalidfields.join(", "));
			}
			if (no_update.length) {
				//if read-only params were passed, append to restlet_status_details to alert user that we could not update
				dataout.restlet_status_details += '~~~These fields are read-only: ' + no_update.join(", ");
			}
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
    return (dataout);
} // End of function CreateSI
