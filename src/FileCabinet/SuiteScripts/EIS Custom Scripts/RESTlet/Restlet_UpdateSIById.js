/*
 *File:  Restlet_UpdateSIById.js
 *Module Description:  When this Restlet is called it will update the specified Service Issue with the specified and appropriate fields.

 *Library Scripts Used:
 * library_constants.js -- Library Script used to reference constant values.
 * library_utility.js -- Library Script used to call the format types of fields within the Service Issue form.
 * library_serviceIssue.js -- Library Script used to pull in fields and types.

 *JSON input expected:
Required:
 * "si_id":"[siid]" --internal ID of the Service Issue
 * Ex:  {
 * "si_id": "66653",
 *   	"si_coordinatornotes" : {
 * 	    "overwrite": "T",
 *   	"value":"This will be replace existing"
 *   	}
 * }

Optional:
see fields within  library_serviceIssue.js  which have restletCanUpdate == "T"
 *
 *
 *JSON output expected:
 * Success or Failure
 * Restlet Status
 * SI ID
 *
 *Version   Date            	Author			Remarks
 *1.0.0     11/08/2018			Mackie			Initial creation/deployment of the file. See US425119 for development information.
 *1.0.1     11/08/2018			Ariana			Small fix to correct arrays recognized as Objects
 *1.0.2		11/08/2018		Mackie		Removing the 'nlapiLoadRecord' callback and assoc forEach since this would increase the number of API calls to NetSuite.
 *1.0.3		11/08/2018 		Ariana		US425118	Reformatted to use L_siParmMapObject  obj from library_serviceIssue.js
 *																		Added in extra logic to allow prepending to Array objects (multiple selects)
 *																		Added in extra catches for when non-editable fields attempt to be updated.
 * 1.0.4	10/10/2019		Ariana Hazen	  Updated for eContent Form fields. Also fixed issue with SI being updated when required fields
 *                                                   (per lib file) are not met
 * 1.0.5	12/18/2019		Ariana Hazen		Corrected missing fieldType variabvle not being populated--this was preventing any values from being appended
 */

function UpdateSIById(datain) {
    var functionname = L_CurrentFuncName(arguments);
    nlapiLogExecution('debug', 'RESTLET ' + functionname + ' started');
    var dataout = {};
    dataout.restlet_status = 'ERROR';
    dataout.restlet_status_details = '';

    //Arrays to track fields and validity
    var updatedfields = [];
    var invalidfields = [];
    var requiredfields = [];
    var no_update = [];
    var no_change = [];

    try {
        var formid = 150;
        if (datain.si_form_id) {
            //150 = EBSCO Service Issue Form
            //80 = EIS E-Content Service Issue Form
            formid = parseInt(datain.si_form_id);
            if ((formid != 150 && formid != 80) || isNaN(formid)) {
                formid = 150;
            }
        }

        //what fields are actually required per our library
        //create array of all required fields
        //we'll remove them from this array as we validate them
        for (var k in L_siParmMapObject) {
            if (L_siParmMapObject[k].restletRequiredField == 'T' || (formid == "80" && L_siParmMapObject[k].restletRequiredField_econtent == 'T')) {
                requiredfields.push(k);
            }
        }

        //Load the Service Issue form
        nlapiLogExecution('debug', 'datain.si_id=' + datain.si_id);
        var serviceissue = nlapiLoadRecord('customrecord36', datain.si_id);

        //Gather the Service Issue ID datain value
        dataout.si_id = datain.si_id;
        //loop through datain
        for (var key in datain) {
            if (key != "si_id") { // don't try to do anything with si_id
                var field = L_siParmMapObject[key];
                var fieldname = "";
                var fieldType = "";
                var restletCanUpdate = "F";
                var overwrite = "T";
                var curr_val = "";
                var myupdate = "";
                if (!L_JSONisEmpty(field)) {
                    fieldname = field.nsfieldName;
                    fieldType = field.fieldType;
                    restletCanUpdate = field.restletCanUpdate;
                    overwrite = (field.restletDefaultOverwrite ? field.restletDefaultOverwrite : "T"); // check if we should append or replace field
                    curr_val = serviceissue.getFieldValue(fieldname);
                    if ((datain[key]).constructor == Object) { //check if the data passed in is an object
                        overwrite = datain[key].overwrite;
                        myupdate = datain[key].value;
                    } else {
                        myupdate = datain[key];
                    }
                    if (restletCanUpdate == "T") {
                        //check to make sure the current value is different than the new value
                        if (curr_val != myupdate) {
                            if (overwrite == "F") {
                                if (fieldType == "multiple") {
                                    if (curr_val) {
                                        vals = curr_val.split("|"); //current values for arrays appear to be seaparted by |
                                        myupdate = myupdate + "," + vals.join(","); // add in new values
                                        myupdate = myupdate.split(","); // rejoin with ,
                                    }
                                } else {
                                    myupdate = myupdate + " \r\n" + curr_val; //prepend new value with current value
                                }
                            }
						if((field.restletRequiredField == "T" && myupdate !="") || field.restletRequiredField != "T"){
                            serviceissue.setFieldValue(fieldname, myupdate);
                         	 updatedfields.push(key);
                        }
                          //if this was a required field and we didn't clear the field, remove it from the requiredfields array
                            if (requiredfields.indexOf(key) > -1 && myupdate !="") {
                                fieldindex = requiredfields.indexOf(key);
                                delete requiredfields[fieldindex];
                            }
                            
                        }
                    } else {
                        no_update.push(key);
                    }
                } else {
                    invalidfields.push(key);
                }
            }
        }
        //END FIELD-BY-FIELD UPDATES

        //Log of updated fields in the Service Issue
        nlapiLogExecution('debug', 'updatedfields=' + updatedfields.join(', '));

      //clear falsy values from array so we can check fields NOT sent in request
      //using delete replaces key with "undefined" (helped us by retaining original index as we looped)
      	requiredfields = requiredfields.filter(Boolean);

      //loop through remaining required fields
      //remove the fields that DO have content already
      	for (var r = 0; r < requiredfields.length; r++) {
          var fieldvalue = (L_siParmMapObject[requiredfields[r]]).nsfieldName;
            if (serviceissue.getFieldValue(fieldvalue)) {
                delete requiredfields[r];
            } 
        }
       //clear falsy values from array
       //using delete replaces key with "undefined" (helped us by retaining original index as we looped)
        requiredfields = requiredfields.filter(Boolean);

      if (requiredfields.length) {
            //If required fields not met don't create SI
            //and don't alert user about invalidfields or no_update/readonly fields
            nlapiLogExecution('debug', 'Required Fields Missing: ' + requiredfields.join(', '));
            dataout.restlet_status = 'ERROR';
            dataout.restlet_status_details = 'SI could not be updated. Required Fields Missing: ' + requiredfields.join(', ');
        } else {
            if (updatedfields.length) { //If at least one field was updated, we'll save
                nlapiLogExecution('debug', 'updatedfields=' + updatedfields.join(', '));
                updatedfields_cleaned = updatedfields.join(', ');
                // submit the updated record
                si_id = nlapiSubmitRecord(serviceissue);
                nlapiLogExecution('DEBUG', 'id =' + si_id);
                dataout.restlet_status = 'SUCCESS';
                dataout.restlet_status_details = 'Fields updated: ' + updatedfields_cleaned;
            } else {
                dataout.restlet_status = 'SUCCESS';
                nlapiLogExecution('debug', 'No changed fields to update');
                dataout.restlet_status_details = 'No changes detected to Service Issue fields.';
            }
            //tell user about any invalidfields or no_update/readonly fields
            if (invalidfields.length) {
                //if unrecognized keys were passed, append to restlet_status_details to alert user
                dataout.restlet_status_details += '~~~These fields were not recognized: ' + invalidfields.join(", ");
                nlapiLogExecution('debug', 'validData NOT true', 'invalidfields: ' + invalidfields.join(", "));
            }
            if (no_update.length) {
                //if read-only keys were passed, append to restlet_status_details to alert user that we could not update
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

    //dataout might be able to be auto-populated when we declare our datain vars
    nlapiLogExecution('debug', 'RESTLET ' + functionname + ' ended...');
    return (dataout);

} //End of function