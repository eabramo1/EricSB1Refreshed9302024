//
// Amendment Log:-
//  C Neale		06/14/2017		US214281 Ensure YBP Support multi-language profiles are set to default YBP Support profile 
//  P Kelleher  11/14/18		US271065 OMG Case Header Change on the "YBP OMG Case Form" - Number of Items field updated so this mandatory field does not populate with a specified value
//
//Init Global Variables
var assignedAtFormLoad = -1;
var assignedDepartmentAtFormLoad = -1;

//Global Customers Object
var Customers = {
    AnonDDESupport: '277026',
    AnonSSEUK: '1489915',
    AnonSSEAU: '1503909',
    AnonSSEGerman: '1559097',
    AnonYBPSupport: '1582962',
    AnonOMG: '1619682'
};

//Global Employees Object
var Employees = {
    UnassignedYBPCS: '1585985',
    UnassignedYBPEC: '1585987',
    UnassignedOMGOrders: '1619686',
    UnassignedOMGStatusing: '1619688',
    UnassignedOMGClaims: '1619687'
};

//Global Departments Object
var Departments = {
    YBPCustomerService: 97,
    YBPEContent: 96,
    YBPOMG: 100,
    YBPGOBI: 101,
    IsAssigneeDepartmentYBP: function () { //returns true if assignee department is either ybp customer service or ybp econtent
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return (assignedDepartment == this.YBPCustomerService || assignedDepartment == this.YBPEContent) ? true : false;
        }
        return false;
    },
    IsAssigneeDepartmentYBPEContent: function () { //returns true if assignee department is ybp econtent
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return assignedDepartment == this.YBPEContent ? true : false;
        }
        return false;
    },
    IsAssigneeDepartmentYBPOMG: function () { //returns true if assignee department is ybp econtent
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return assignedDepartment == this.YBPOMG ? true : false;
        }
        return false;
    },
    IsAssigneeDepartmentYBPGOBI: function () { //returns true if assignee department is ybp gobi
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return assignedDepartment == this.YBPGOBI ? true : false;
        }
        return false;
    },
    IsAssigneeDepartmentYBPCustomerService: function () { //returns true if assignee department is ybp customer service
        var assigned = nlapiGetFieldValue('assigned');
        if (assigned != '') {
            var assignedDepartment = nlapiLookupField('employee', assigned, 'department');
            return assignedDepartment == this.YBPCustomerService ? true : false;
        }
        return false;
    },
    IsInputDepartmentYBPEContent: function (input) { //returns true if input department is ybp econtent
        return input == this.YBPEContent ? true : false;
    },
    IsInputDepartmentYBPCustomerService: function (input) { //returns true if input department is ybp customer service
        return input == this.YBPCustomerService ? true : false;
    },
    IsInputDepartmentYBPGOBI: function (input) { //returns true if input department is ybp gobi
        return input == this.YBPGOBI ? true : false;
    },
    IsUserDepartmentYBPEContent: function () { //returns true if the current netsuite user's department is ybp econtent
        var userDepartment = nlapiLookupField('employee', nlapiGetUser(), 'department');
        return userDepartment == Departments.YBPEContent ? true : false;
    },
    IsUserDepartmentYBPCustomerService: function () { //returns true if the current netsuite user's department is ybp customer service
        var userDepartment = nlapiLookupField('employee', nlapiGetUser(), 'department');
        return userDepartment == Departments.YBPCustomerService ? true : false;
    },
    IsUserDepartmentYBPGOBI: function () { //returns true if the current netsuite user's department is ybp gobi
        var userDepartment = nlapiLookupField('employee', nlapiGetUser(), 'department');
        return userDepartment == Departments.YBPGOBI ? true : false;
    }
};

//Global Profiles Object
var Profiles = {
    YBPSupport: 17,
    YBPOMG: 18,
    YBPGOBI: 20,
    IsProfileYBPSupport: function () {
        return nlapiGetFieldValue('profile') == this.YBPSupport ? true : false;
    },
    IsProfileYBPOMG: function () {
        return nlapiGetFieldValue('profile') == this.YBPOMG ? true : false;
    },
    IsProfileYBPGOBI: function () {
        return nlapiGetFieldValue('profile') == this.YBPGOBI ? true : false;
    },
    IsProfileYBPMultiLang: function () { //US214281 returns true if profile is set to any of the YBP Support Multi-language profiles, else false
    	return ybpSupportMultiLangProfileCheck(nlapiGetFieldValue('profile'));
    }
};

//Global Case Classification Object
var CaseClassifications = {
    CustomerService: 1,
    eContent: 2,
    OMG: 3,
    GOBI: 4
};

//Global Priorities Object
var Priorities = {
    High: 1,
    Medium: 2,
    Low: 3
};

//Global Level of Effort Object
var LevelsOfEffort = {
    High: 3,
    Medium: 2,
    Low: 1
};

//Global YBP Case Status Object
var YBPCaseStatus = {
    Closed: 8,
    ClosedDuplicateNoAction: 10,
    ReOpened: 9,
    SentToEContent: 4,
    EContentInProgress: 6,
    CustomerServiceInProgress: 7,
    SentToOMG: 11,
    ReturnedToCustomerService: 5,
    GOBIInProgress: 12
};

//Global OMG Case Status Object
var OMGCaseStatus = {
    Closed: 3,
    ClosedDuplicateNoAction: 7,
    ReOpened: 8,
    SentFromCustomerService: 9,
    PendingInternalInfo: 5
};

//Global Case Status Object
var Status = {
    Closed: 5,
    InProgress: 2,
    ReOpened: 4
}

//IsNewCase : Returns true if new case : else returns false
function IsNewCase() {
    return nlapiGetRecordId() == '' ? true : false;
}

//PopulateCompanyOrYBPAccount : Populates Company based on YBP Account selection | Populates YBP Account based on Company selection
function PopulateCompanyOrYBPAccount() {

//Populate company from YBP Account selection
function GetCompany() {

    var filters = new Array();
    filters[0] = new nlobjSearchFilter('internalid', null, 'is', ybpAccountId);
    filters[1] = new nlobjSearchFilter('custrecord_ybpa_customer', null, 'noneof', '@NONE@');

    var columns = new Array();
    columns[0] = new nlobjSearchColumn('custrecord_ybpa_customer', null, null);

    var results = nlapiSearchRecord('customrecord_ybp_account', null, filters, columns);

    if (results) {
        if (results.length == 1) {
            var company = results[0].getValue('custrecord_ybpa_customer', null, null);
            if (company != companyId) {
                nlapiSetFieldValue('company', '', false)
                nlapiSetFieldValue('company', company, true);
            }
        }
        else {
            alert('There are multiple Customers for this YBP Account. Please contact the CRM Systems Team.');
        }
    }
}

    //Populate YBP account from company selection (If 1:1)
    function GetYBPAccounts() {

        var filters = new Array();
        filters[0] = new nlobjSearchFilter('custrecord_ybpa_customer', null, 'is', companyId);
        filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

        var columns = new Array();
        columns[0] = new nlobjSearchColumn('name', null, null);

        var results = nlapiSearchRecord('customrecord_ybp_account', null, filters, columns);

        if ((results != null) && (results.length == 1)) {
            nlapiSetFieldText('custevent_ybp_account', results[0].getValue('name'), true);
        }
    }

    var companyId = nlapiGetFieldValue('company');
    var ybpAccountId = nlapiGetFieldValue('custevent_ybp_account');
    var companyStatusKnown = false;
    var ybpAccountStatusKnown = false;

    if (companyId != '' && companyId != null && companyId != Customers.AnonDDESupport && companyId != Customers.AnonSSEUK && companyId != Customers.AnonSSEAU && companyId != Customers.AnonSSEGerman && companyId != Customers.AnonYBPSupport && companyId != Customers.AnonOMG) {
        companyStatusKnown = true;
    }

    if (ybpAccountId != '' && ybpAccountId != null) {
        ybpAccountStatusKnown = true;
    }

    if (companyStatusKnown && !ybpAccountStatusKnown) {
        GetYBPAccounts();
    }

    if (!companyStatusKnown && ybpAccountStatusKnown) {
        GetCompany();
    }
}

//Form Load Event
function FormLoad(type) {

    //NEW cases
    if (IsNewCase()) {

        //default origin to phone for new cases
        nlapiSetFieldText('origin', 'E-mail');

        //default priority to 'Low' for new cases
        nlapiSetFieldValue('priority', Priorities.Low);

        //default request type to inquiry for new cases
        nlapiSetFieldText('custevent_ybp_request_type', 'Inquiry');
    }

    //EXISTING cases
    else {

        //EA: disable origin field if value = 'case portal' or 'phone'
        if ((nlapiGetFieldText('origin') == 'Case Portal') || (nlapiGetFieldText('origin') == 'Phone')) {
            nlapiDisableField('origin', true);
        }

        //Set assignedAtFormLoad & assignedDepartmentAtFormLoad
        assignedAtFormLoad = nlapiGetFieldValue('assigned');
        if (assignedAtFormLoad != '')
            assignedDepartmentAtFormLoad = nlapiLookupField('employee', nlapiGetFieldValue('assigned'), 'department');
        
        // US214281: Call library function to check for multi-language YBP Support profile & if found default to YBP Support
        if (Profiles.IsProfileYBPMultiLang()){
    		nlapiSetFieldValue('profile', Profiles.YBPSupport, false, true);
    	}
    }

    //ALL cases

    //change ybp accountnumber search box color
    document.getElementById('custpage_ybp_search_by_acctnum_formattedValue').style.backgroundColor = '#EFFFEF';

    //set assigned to current user if unassigned or if assigned to any of the 3 unassigned OMG users
    if (nlapiGetFieldValue('assigned') == '' || nlapiGetFieldValue('assigned') == Employees.UnassignedOMGOrders || nlapiGetFieldValue('assigned') == Employees.UnassignedOMGClaims || nlapiGetFieldValue('assigned') == Employees.UnassignedOMGStatusing) {
        nlapiSetFieldValue('assigned', nlapiGetUser());
    }

    //default 'Request Type' to 'Inquiry' if not populated
    if (nlapiGetFieldValue('custevent_ybp_request_type') == '') {
        nlapiSetFieldText('custevent_ybp_request_type', 'Inquiry');
    }

    //default 'Case Classification' to 'OMG' if not populated
    if (nlapiGetFieldValue('custevent_ybp_case_classification') == '') {
        nlapiSetFieldValue('custevent_ybp_case_classification', CaseClassifications.OMG);
    }

    //default 'Priority' to 'Low' if not populated
    if (nlapiGetFieldValue('priority') == '') {
        nlapiSetFieldValue('priority', Priorities.Low);
    }

    //default 'Level of Effort' (Complexity) to 'Low' if not populated
    if (nlapiGetFieldValue('custevent_ybp_level_of_effort') == '') {
        nlapiSetFieldValue('custevent_ybp_level_of_effort', LevelsOfEffort.Low);
    }

/* 	Commented out 11/14/18 - OMG does not want this mandatory "Number of Items" field to populate with any default value on the YBP OMG Case Form     
 * 
 * //default 'Number of Items' to 0 if not populated
    if (nlapiGetFieldValue('custevent_ybp_omg_number_of_items') == '') {
        nlapiSetFieldValue('custevent_ybp_omg_number_of_items', 0);
    }
*/
    
    //handle pre-populated company scenario, populate YBP account
    PopulateCompanyOrYBPAccount();
}

//Form Save Event
function FormSave() {

    //Validate escalatee populated if status is escalated
    if (nlapiGetFieldText('status') == 'Escalated') {
        if (nlapiGetLineItemCount('escalateto') == 0) {
            alert('A case in an Escalated status needs at least one Escalatee. Change your status to something other than Escalated or visit the \'Escalate\' subtab to add an Escalatee');
            return false;
        }
    }
    
    //US214281 Ensure Profile set to "YBPSupport" if Multilanguage profile selected
	if (Profiles.IsProfileYBPMultiLang()){
		nlapiSetFieldValue('profile', Profiles.YBPSupport, false, true);
		alert('Alert: Profile has been set to main YBP Support profile');
	}

    return true;
}

//Field Changed Event
function FormFieldChanged(type, name) {

    //ybp account field changed
    if (name == 'custevent_ybp_account') {

        var ybpAccountFieldValue = nlapiGetFieldValue('custevent_ybp_account');

        if (ybpAccountFieldValue != '') {

            var ybpAccountRecord = nlapiLoadRecord('customrecord_ybp_account', ybpAccountFieldValue);

            if (ybpAccountRecord.getFieldValue('custrecord_ybpa_customer') != nlapiGetFieldValue('company')) {
                nlapiSetFieldValue('company', '');
                nlapiSetFieldValue('custpage_ybp_search_by_acctnum', '');
                PopulateCompanyOrYBPAccount();
            }
        }
    }

    //ybp account number search field
    if (name == 'custpage_ybp_search_by_acctnum') {

        var ybpAccountNumber = nlapiGetFieldValue('custpage_ybp_search_by_acctnum');

        if (ybpAccountNumber.length >= 4) {

            var filters = new Array();
            filters[0] = new nlobjSearchFilter('custrecord_ybpa_account_number_integer', null, 'equalto', ybpAccountNumber);
            filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

            var columns = new Array();
            columns[0] = new nlobjSearchColumn('name', null, null);

            var results = nlapiSearchRecord('customrecord_ybp_account', null, filters, columns);

            if ((results != null) && (results.length == 1)) {
                nlapiSetFieldText('custevent_ybp_account', results[0].getValue('name'), true);
            }
        }
    }

    //company field changed
    if (name == 'company') {
        PopulateCompanyOrYBPAccount();
    }

    //assignee field changed
    if (name == 'assigned') {

        //conditionally set profile to YBP OMG
        //when assignee changes to an OMG employee, but the profile isn't OMG yet
        if(Departments.IsAssigneeDepartmentYBPOMG() && !Profiles.IsProfileYBPOMG()) {
            nlapiSetFieldValue('profile', Profiles.YBPOMG, false, true); //US214281
        }

        //handle when assignee changes to a customer service employee
        if (Departments.IsAssigneeDepartmentYBPCustomerService()) {
            //1)change classification to 'customer service'
            nlapiSetFieldValue('custevent_ybp_case_classification', CaseClassifications.CustomerService);
            //2)change profile to 'ybp support'
            nlapiSetFieldValue('profile', Profiles.YBPSupport, false, true); //US214281
            //3)set CS status to 'returned to customer service'
            nlapiSetFieldValue('custevent_ybp_waiting_on', YBPCaseStatus.ReturnedToCustomerService);
            //4)set OMG status to 'pending internal info'
            nlapiSetFieldValue('custevent_ybp_omg_case_status', OMGCaseStatus.PendingInternalInfo);
        }

        //handle when assignee changes to a GOBI employee
        if (Departments.IsAssigneeDepartmentYBPGOBI()) {
            //1)change classification to 'GOBI'
            nlapiSetFieldValue('custevent_ybp_case_classification', CaseClassifications.GOBI);
            //2)change profile to 'ybp gobi'
            nlapiSetFieldValue('profile', Profiles.YBPGOBI, false, true); //US214281
            //3)set CS status to 'GOBI In Progress'
            nlapiSetFieldValue('custevent_ybp_waiting_on', YBPCaseStatus.GOBIInProgress);
            //4)set OMG status to 'pending internal info'
            nlapiSetFieldValue('custevent_ybp_omg_case_status', OMGCaseStatus.PendingInternalInfo);
        }
    }

    //ybp omg case status field changed
    if (name == 'custevent_ybp_omg_case_status') {

        //keep 'status' in sync with 'omg case status'
        if (nlapiGetFieldValue('custevent_ybp_omg_case_status') == OMGCaseStatus.Closed || nlapiGetFieldValue('custevent_ybp_omg_case_status') == OMGCaseStatus.ClosedDuplicateNoAction) {

            //set 'status' and 'ybp case status' to closed when OMG case is closed
            nlapiSetFieldValue('status', Status.Closed, false);
            nlapiSetFieldValue('custevent_ybp_waiting_on', YBPCaseStatus.Closed, false);
        }
        else if (nlapiGetFieldValue('custevent_ybp_omg_case_status') == OMGCaseStatus.ReOpened) {
            nlapiSetFieldValue('status', Status.ReOpened, false);
        } 
        else {
            nlapiSetFieldValue('status', Status.InProgress, false);
        }
    }
}