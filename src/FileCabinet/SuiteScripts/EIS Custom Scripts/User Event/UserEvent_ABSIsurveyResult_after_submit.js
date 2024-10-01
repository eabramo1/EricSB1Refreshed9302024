function afterSubmit(type){

	if(type=='create' || type=='edit'){

		var recordID = nlapiGetRecordId();
        var companyID = nlapiGetFieldValue('custrecord_surveycompany');
        var optOut = nlapiGetFieldValue('custrecord_survey_optout');

	    nlapiLogExecution('DEBUG', 'recordID', 'recordID: ' + recordID);
	    nlapiLogExecution('DEBUG', 'companyID', 'companyID: ' + companyID);
	    nlapiLogExecution('DEBUG', 'optOut', 'optOut: ' + optOut);

	    if(companyID!=null && companyID!=''){

        	var salesVP = nlapiLookupField('entity', companyID, 'custentity_teammember5');
	    	nlapiLogExecution('DEBUG', 'salesVP', 'salesVP: ' + salesVP);

            nlapiSubmitField('customrecord_surveyresult', recordID, 'custrecord_surveycompany_custentity_team', salesVP, false);

	    }

	    if(optOut!=null && optOut!=''){

	    	var contactID = nlapiGetFieldValue('custrecord_surveycontact');
	   		nlapiLogExecution('DEBUG', 'contactID', 'contactID: ' + contactID);

            nlapiSubmitField('contact', contactID, 'custentity_absi_entity_exclude_survey', 'T', false);
	    }
	}
}