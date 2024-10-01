//
// Script:     client_case_contentLicensing.js (renamed from client_case_pubSat.js)
//
// Created by: EBSCO Information Services
//
//    
//
// Revisions:  
//	CNeale	11/07/2017	US253375 Renamed & adjusted for Content Licensing use of form.            


//Global Departments Object
var Departments = {
    ContentLic: '70',  
    IsAssigneeDepartmentCL: function () { //returns true if assignee department is Content Licensing
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return (assignedDepartment == this.ContentLic) ? true : false;
        }
        return false;
    }
}

//Global Profiles Object
var Profiles = {
    ContentLic: '27' 
}

function caseFormLoad(type)
{
	// If a New PubSat Case

	if (!nlapiGetRecordId())
	{
		//set assigned rep to current user
		nlapiSetFieldValue('assigned', nlapiGetUser());	
	
		//set profile to Content Licensing
		nlapiSetFieldValue('profile', Profiles.ContentLic);
		
		//set Content Licensing flag
		nlapiSetFieldValue('custevent_contentlicensing_case', 'T');
	}
}
    
function caseFormSave()
{
	// Need to recheck setting CL flag to catch those cases with blank assignee &/or assignee changes
	if (nlapiGetFieldValue('custevent_contentlicensing_case') != 'T' && Departments.IsAssigneeDepartmentCL())
	{	
		//set Content Licensing flag
		nlapiSetFieldValue('custevent_contentlicensing_case', 'T');
		
		//set profile to Content Licensing
		nlapiSetFieldValue('profile', Profiles.ContentLic);
	}
	
	return true;
}

//Field Changed Event
function caseFieldChanged(type, name) 
{
	   
	//Publisher Selector field changed
    if (name == 'custpage_publisher_select') 
    {

        var partnerFieldValue = nlapiGetFieldValue('custpage_publisher_select');

        if (partnerFieldValue)
        {
        	nlapiSetFieldValue('company', partnerFieldValue);
        	nlapiSetFieldValue('custpage_publisher_select', '', false, true);
        }
    }
}



