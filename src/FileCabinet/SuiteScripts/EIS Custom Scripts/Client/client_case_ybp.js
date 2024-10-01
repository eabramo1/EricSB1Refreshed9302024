//
// Amendment Log:-
//  C Neale		06/14/2017		US214281 Ensure YBP Support multi-language profiles are set to default YBP Support profile 
//  C Neale		08/21/2017 		US266415 Sort out required fields for eContent, specifically set required fields on Case load
//								and introduce sub-category as a required field if at least one exists for the parent category.
//                              Also set required flag for the required fields for other teams when passing cases to eContent. 
//	C Neale		11/17/2017		US307774 Introduce new eContent sub-category.  
//								Replace Names with ID's for eContent category/sub-category processing.	
//	J Oliver	10/1/19			US550810/TA406378 Updated EC Category Label from Package to Collection
//								US550810/TA406379 Updated EC SubCategory Label (under DDA category) from Setup/Change to 'Setup', and added new EC SubCategory 'Change'
//								US550810/TA406377 Make Cust URL field no longer mandatory
//	JOliver		3/30/22			US937213 Update status to 'Customer Service In Progress' when reassigning cases to NES YBP Support + fix 'assigned' script error
//  ZScannell   11/27/23        US1166718   New cases should receive case status of "Not Started" when created
//  ZScannell   02/0124         TA885967    Fixing YBP Case Status of "Not Started" to change based on which department it is routed to
//                                      --- Removed code for US1166718 revolving setting Reassignment statuses' to Not Started and reset to original values
//	PKelleher   05/14/24        US1094652 Change Product Type, CS Category & CS Subcategory fields from mandatory on case change to mandatory on case close
//
//
//-----------------------------------------------------------------------------------------------------------------------------------------//
//
//Global Customers Object
var Customers = {
    AnonDDESupport: '277026',
    AnonSSEUK: '1489915',
    AnonSSEAU: '1503909',
    AnonSSEGerman: '1559097',
    AnonYBPSupport: '1582962'
};

//Global Employees Object
var Employees = {
    UnassignedYBPCS: '1585985',
    UnassignedYBPEC: '1585987',
    UnassignedYBPGOBI: '1630874',
    UnassignedYBPLTSAccounts: '1639084',
    UnassignedYBPLTSInternal: '1639086',
    NES_YBP_Support: '1589859' //US937213
};

//Global Departments Object
var Departments = {
    YBPCustomerService: '97',
    YBPEContent: '96',
    YBPOMG: '100',
    YBPGOBI: '101',
    YBPLTS: '105', 
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
    },
    GetCurrentUserDepartment: function() {
        return nlapiLookupField('employee', nlapiGetUser(), 'department');
    },
    GetCurrentAssigneeDepartment: function() {
        var assigned = nlapiGetFieldValue('assigned');
        //US937213 accommodate empty assigned
        if (assigned != '')
        {	
        return nlapiLookupField('employee', assigned, 'department');
        }
    },
    IsUserAndAssigneeSameDepartment: function() {
        return nlapiLookupField('employee', nlapiGetFieldValue('assigned'), 'department') == nlapiLookupField('employee', nlapiGetUser(), 'department');
    }
};

//Global Profiles Object
var Profiles = {
    YBPSupport: 17,
    YBPOMG: 18,
    YBPGOBI: 20,
    YBPLTS: 21,
    IsProfileYBPSupport: function () { //returns true if profile is set to YBPSupport, else false
        return nlapiGetFieldValue('profile') == this.YBPSupport ? true : false;
    },
    IsProfileYBPOMG: function () { //returns true if profile is set to YBPOMG, else false
        return nlapiGetFieldValue('profile') == this.YBPOMG ? true : false;
    },
    IsProfileYBPGOBI: function () { //returns true if profile is set to YBPGOBI, else false
        return nlapiGetFieldValue('profile') == this.YBPGOBI ? true : false;
    },
    IsProfileYBPLTS: function () { //returns true if profile is set to YBPLTS, else false
        return nlapiGetFieldValue('profile') == this.YBPLTS ? true : false;
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
    GOBI: 4,
    LTS: 5
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
    GOBIInProgress: 12,
    LTSInProgress: 13,
    //  US1166718 - Support addition of "Not Started" case status
    NotStarted: 17
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
    ReOpened: 4,
    //  US1166718 - Support addition of "Not Started" case status
    NotStarted: 1
}

//Global Team Re-Assignment Object
var TeamAssignment = {
    //US1094652 Removed Product Type, CS Category & CS Subcategory fields from mandatory on case change to allow for mandatory on case close (part of Dept=CS)
    CustomerService: {
        CaseClassification: CaseClassifications.CustomerService,
        Profile: Profiles.YBPSupport,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.ReturnedToCustomerService,
        ReAssignmentOMGCaseStatus: null,
        MandatoryFields: [
            { FieldName: 'custevent_ybp_request_type', FieldValidation: 'Please enter a value for required field Request Type' }
        ],

        //US1094652 Change Product Type, CS Category & CS Subcategory fields from mandatory on case change to mandatory on case close
        // removed MANDATORY checkbox from case form for the cs case category field (CS subtab)
        MandatoryFieldsOnCaseCloseYBPCS: [
            { FieldName: 'custevent_ybp_case_product_type', FieldValidation: 'Please enter a value for required field Product Type on the YBP Customer Service tab' },
            { FieldName: 'custevent_ybp_cs_case_category', FieldValidation: 'Please enter a value for required field CS Category on the YBP Customer Service tab' },
            { FieldName: 'custevent_ybp_cs_case_subcategory', FieldValidation: 'Please enter a value for required field CS Subcategory on the YBP Customer Service tab' }
        ],

        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted
    },

    //US1094652 Removed Product Type, CS Category & CS Subcategory fields from mandatory on case change to allow for mandatory on case close (part of Dept=CS)
    //US937213 Separated NES YBP Support (employee record) from Customer Service to change ReAssignment rule
    NES_YBP_Support: {
        CaseClassification: CaseClassifications.CustomerService,
        Profile: Profiles.YBPSupport,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.CustomerServiceInProgress,
        ReAssignmentOMGCaseStatus: null,
        MandatoryFields: [
            { FieldName: 'custevent_ybp_request_type', FieldValidation: 'Please enter a value for required field Request Type' }
        ],
        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted
    },
    EContent: {
        CaseClassification: CaseClassifications.eContent,
        Profile: Profiles.YBPSupport,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.SentToEContent,
        ReAssignmentOMGCaseStatus: null,
        MandatoryFields: [
            { FieldName: 'custevent_ybp_ec_case_category', FieldValidation: 'Please enter a value for required field EC Category on the YBP eContent tab' },
            { FieldName: 'custevent_ybp_summary_of_issue', FieldValidation: 'Please enter a value for required field Summary of Issue on the YBP eContent tab' }
        ],
        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted,
        MandatoryFieldsForOtherTeams: [
            { FieldName: 'custevent_ybp_ec_case_category', FieldValidation: '' },
            { FieldName: 'custevent_ybp_sub_account', FieldValidation: '' },
            { FieldName: 'custevent_ybp_vendor', FieldValidation: '' },
            { FieldName: 'custevent_ybp_order_key', FieldValidation: '' },
            { FieldName: 'custevent_ybp_eisbn', FieldValidation: '' },
            { FieldName: 'custevent_ybp_title', FieldValidation: '' },
            { FieldName: 'custevent_ybp_summary_of_issue', FieldValidation: '' }
        ],
// US266415        
        MandatorySubCategoryField: [
            {FieldName: 'custevent_ybp_ec_case_subcategory', FieldValidation: ''}                        
                                    ]
    },
    OMG: {
        CaseClassification: CaseClassifications.OMG,
        Profile: Profiles.YBPOMG,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.SentToOMG,
        ReAssignmentOMGCaseStatus: OMGCaseStatus.SentFromCustomerService,
        MandatoryFields: [],
        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted
    },
    GOBI: {
        CaseClassification: CaseClassifications.GOBI,
        Profile: Profiles.YBPGOBI,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.GOBIInProgress,
        ReAssignmentOMGCaseStatus: null,
        MandatoryFields: [
            { FieldName: 'custevent_ybp_gobi_origin', FieldValidation: 'Please enter a value for Gobi Origin' },
            { FieldName: 'custevent_ybp_gobi_parent_category', FieldValidation: 'Please enter a value for Gobi Parent Category' },
            { FieldName: 'custevent_ybp_gobi_subcategory', FieldValidation: 'Please enter a value for Gobi Subcategory' }
        ],
        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted
    },
    LTS: {
        CaseClassification: CaseClassifications.LTS,
        Profile: Profiles.YBPLTS,
        ReAssignmentYBPCaseStatus: YBPCaseStatus.LTSInProgress,
        ReAssignmentOMGCaseStatus: null,
        MandatoryFields: [
            { FieldName: 'custevent_ybp_lts_complexity', FieldValidation: 'Please enter a value for Complexity on the LTS sub tab' },
            { FieldName: 'custevent_ybp_lts_services', FieldValidation: 'Please enter a value for Services on the LTS sub tab' },
            { FieldName: 'custevent_ybp_lts_parent_category', FieldValidation: 'Please enter a value for Parent Category on the LTS sub tab' },
            { FieldName: 'custevent_ybp_lts_subcategory', FieldValidation: 'Please enter a value for Subcategory on the LTS sub tab' }
        ],
        //  US1166718 - Support addition of "Not Started" case status
        DefaultNewCaseStatus: YBPCaseStatus.NotStarted
    },
    AssignTeamToCase: function(team) { //sets profile and classification for input team
        nlapiSetFieldValue('profile', team.Profile, false, true); //US214281 Added firefieldchanged 
        nlapiSetFieldValue('custevent_ybp_case_classification', team.CaseClassification);
    },
    SetTeamStatuses: function(team) { //sets case status for input team
        nlapiSetFieldValue('custevent_ybp_waiting_on', team.ReAssignmentYBPCaseStatus);
        if (team.ReAssignmentOMGCaseStatus != null) {
            nlapiSetFieldValue('custevent_ybp_omg_case_status', team.ReAssignmentOMGCaseStatus);
        }
    },
    SetNewCaseDefaultStatus: function(status) { //sets team default new case status on new cases
        nlapiSetFieldValue('custevent_ybp_waiting_on', status);
    },
    ReAssignTeam: function (team) { //sets profile, classification, statuses for input team during team reassignment
        this.AssignTeamToCase(team);
        this.SetTeamStatuses(team);
    },
    SetMandatoryFieldsForCurrentUser: function() { //sets the mandatory fields for the current logged in user
        switch (nlapiLookupField('employee', nlapiGetUser(), 'department')) {
            case Departments.YBPCustomerService:
                this.SetMandatoryTeamFields(this.CustomerService.MandatoryFields);
                break;
            case Departments.YBPEContent:
                this.SetMandatoryTeamFields(this.EContent.MandatoryFields);
                break;
            case Departments.YBPGOBI:
                this.SetMandatoryTeamFields(this.GOBI.MandatoryFields);
                break;
            case Departments.YBPLTS:
                this.SetMandatoryTeamFields(this.LTS.MandatoryFields);
                break;
        }
    },
    SetMandatoryTeamFields: function(fields) { //unsets any current mandatory fields, then sets mandatory fields for current user
        this.UnSetMandatoryTeamFields(this.CustomerService.MandatoryFields);
        this.UnSetMandatoryTeamFields(this.EContent.MandatoryFields);
 //US266415 - EC Sub-category & EC other Team fields also included here 
        this.UnSetMandatoryTeamFields(this.EContent.MandatoryFieldsForOtherTeams);
        this.UnSetMandatoryTeamFields(this.EContent.MandatorySubCategoryField);
        this.UnSetMandatoryTeamFields(this.GOBI.MandatoryFields);
        fields.forEach(function (field) {
            nlapiSetFieldMandatory(field.FieldName, true);
        });
    },
    UnSetMandatoryTeamFields: function(fields) { //unsets fields marked as required
        fields.forEach(function (field) {
            nlapiSetFieldMandatory(field.FieldName, false);
        });
    },
    SetMandatoryTeamFieldsNoUnset: function(fields) { //sets mandatory fields as required but no unset (US266415)
        fields.forEach(function (field) {
            nlapiSetFieldMandatory(field.FieldName, true);
        });
    },
    ValidateMandatoryTeamFields: function (fields, displayValidationMessages) { //checks fields are valid, returns if fields valid, else false
        var fieldsValid = true;
        fields.forEach(function(field) {
            if (nlapiGetFieldValue(field.FieldName) == '') {
                if (displayValidationMessages) {
                    alert(field.FieldValidation);
                }
                fieldsValid = false;
            }
        });
        return fieldsValid;
    }
}

//IsNewCase : Returns true if new case : else returns false
function IsNewCase() {
    return nlapiGetRecordId() == '' ? true : false;
}

//US266415 CheckEContentSubCategoryField : Check to see if eContent Category has one or more sub-categories
function CheckEContentSubCategoryField() {
    // Does the parent category have any sub-categories? 
    var ec_catId = nlapiGetFieldValue('custevent_ybp_ec_case_category')
    if (ec_catId) {
    	var crfilters = new Array();
    	crfilters[0] = new nlobjSearchFilter('custrecord_ec_parent_category', null, 'anyof', ec_catId);
    	crfilters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
    	var crcolumns = new Array();
    	crcolumns[0] = new nlobjSearchColumn('custrecord_ec_parent_category', null, null);  
    	crsearchResults = nlapiSearchRecord('customrecord_ybp_ec_subcategories', null, crfilters, crcolumns);
    	if (crsearchResults)
    	{
    		return true;
    	}
    }
    return false;
}

//US266415 SetMandatoryEContentSubCategoryField : Conditionally flag eContent Sub-Category field as mandatory based on category selection
function SetMandatoryEContentSubCategoryField() {
	//unset
    nlapiSetFieldMandatory('custevent_ybp_ec_case_subcategory', false);

    // Does the parent category have any sub-categories? 
    if (CheckEContentSubCategoryField())
    {
    	// Sub-category found so make field Mandatory
    	nlapiSetFieldMandatory('custevent_ybp_ec_case_subcategory', true);
    }
}

//SetAdditionalEContentFields : Conditionally flag eContent fields as mandatory based on category/subcategory selections
function SetAdditionalMandatoryEContentFields() {

    function SetMode1() {
        nlapiSetFieldMandatory('custevent_ybp_sub_account', true);
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
        nlapiSetFieldMandatory('custevent_ybp_order_key', true);
        nlapiSetFieldMandatory('custevent_ybp_eisbn', true);
        //nlapiSetFieldMandatory('custevent_ybp_cust_url_needed_access', true);  TA406377 Make URL field no longer mandatory
        nlapiSetFieldMandatory('custevent_ybp_screenshot_needed_access', true);
    }

    function SetMode2() {
        nlapiSetFieldMandatory('custevent_ybp_sub_account', true);
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
    }

    function SetMode3() {
        nlapiSetFieldMandatory('custevent_ybp_sub_account', true);
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
        nlapiSetFieldMandatory('custevent_ybp_eisbn', true);
        //nlapiSetFieldMandatory('custevent_ybp_cust_url_needed_access', true);  TA406377 Make URL field no longer mandatory
    }

    function SetMode4() {
        nlapiSetFieldMandatory('custevent_ybp_sub_account', true);
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
        nlapiSetFieldMandatory('custevent_ybp_order_key', true);
        nlapiSetFieldMandatory('custevent_ybp_eisbn', true);
    }

    function SetMode5() {
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
    }

    function SetMode6() {
        nlapiSetFieldMandatory('custevent_ybp_order_key', true);
        nlapiSetFieldMandatory('custevent_ybp_eisbn', true);
    }

    function SetMode7() {
        nlapiSetFieldMandatory('custevent_ybp_sub_account', true);
        nlapiSetFieldMandatory('custevent_ybp_vendor', true);
        nlapiSetFieldMandatory('custevent_ybp_order_key', true);
        nlapiSetFieldMandatory('custevent_ybp_eisbn', true);
    }

    //unset
    nlapiSetFieldMandatory('custevent_ybp_sub_account', false);
    nlapiSetFieldMandatory('custevent_ybp_vendor', false);
    nlapiSetFieldMandatory('custevent_ybp_order_key', false);
    nlapiSetFieldMandatory('custevent_ybp_eisbn', false);
    //nlapiSetFieldMandatory('custevent_ybp_cust_url_needed_access', false);  TA406377 Make URL field no longer mandatory
    nlapiSetFieldMandatory('custevent_ybp_screenshot_needed_access', false);

    //set
    // US307774 Use ID's not Text names 
    switch (nlapiGetFieldValue('custevent_ybp_ec_case_category') + '|' + nlapiGetFieldValue('custevent_ybp_ec_case_subcategory')) {
        case '1|':    //Access|                     
            SetMode1();
            break;
        case '2|27': // Account Maintenance|General (FTE, IP Range, etc)
            SetMode2();
            break;
        case '101|104': //Credit|Customer Ordered in Error 
            SetMode7();
            break;
        case '101|102': //Credit|Metadata
            SetMode7();
            break;
        case '101|106': //Credit|Order generated by vendor in error
            SetMode7();
            break;
        case '101|103': //Credit|Price Difference
            SetMode7();
            break;
        case '101|107': //Credit|Title Not Sellable by Vendor / Open Access
            SetMode7();
            break;
        case '101|101': //Credit|Upgrade
            SetMode7();
            break;
        case '101|108': //Credit|Vendor Unable to Fix in a Timely Fashion
            SetMode7();
            break;
        case '101|105': //Credit|YBP ordered in error
            SetMode7();
            break;
        case '6|1': //DDA|Access
            SetMode3();
            break;
        case '6|18': //DDA|Discovery
            SetMode2();
            break;
        case '6|36': //DDA|Order/Invoice
            SetMode2();
            break;
        case '6|46': //DDA|Setup
            SetMode2();
            break;
        //TA406379 New Subcategory
        case '6|123': //DDA|Change
            SetMode2();
            break;
        case '6|109': //DDA|Shutdown
            SetMode2();
            break;
        case '6|51': //DDA|Title Add
            SetMode2();
            break;
        case '6|52': //DDA|Title Remove
            SetMode2();
            break;
        case '7|': //Licensing|
            SetMode2();
            break;
        case '9|110': //Metadata|Content Issue
            SetMode4();
            break;
        case '9|111': //Metadata|Error on Platform
            SetMode4();
            break;
        case '10|112': //Orders|Cancellation Request
            SetMode4();
            break;
        case '10|25': //Orders|General
            SetMode4();
            break;
        case '10|114': //Orders|Training
            SetMode4();
            break;    
        // US3307774 New sub-category    
        case '10|122': //Orders|Upgrades
            SetMode4();
            break;    
        case '102|115': //Collection|Access
            SetMode2();
            break;
        case '102|116': //Collection|Metadata
            SetMode2();
            break;
        case '102|118': //Collection|Orders
            SetMode2();
            break;
        case '102|117': //Collection|Pricing/Availability
            SetMode2();
            break;
        case '12|22': //Pricing|General (note:inactive)
            SetMode2();
            break;
        case '12|41': //Pricing|Package (note:inactive)
            SetMode2();
            break;
        case '12|47': //Pricing|Single Title Purchase (note:inactive)
            SetMode2();
            break;
        case '13|': //Pricing/Availability|
            SetMode2();
            break;
        case '18|120': //Training|Vendor Issue (note:inactive)
            SetMode5();
            break;
    }
}

//MandatoryEContentSubCategoryFieldValid : Valid eContent SubCategory Field that was set based on parent Category (US266415)
function MandatoryEContentSubCategoryFieldValid() {
	var ecSubCatValid = true;
	// Does the parent category have any sub-categories? 
	if (CheckEContentSubCategoryField()) {
		// Sub-category found so validate
		if (nlapiGetFieldValue('custevent_ybp_ec_case_subcategory') == '') {
			alert('Please enter a value for required field Sub Category on the YBP eContent tab.');
			ecSubCatValid = false;
		}
	}
    return ecSubCatValid;
}

//AdditionalMandatoryEContentFieldsValid : Valid additional econtent fields that were set based on category/subcategory selections
function AdditionalMandatoryEContentFieldsValid() {

    function ValidateMode1() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_sub_account') == '') {
            alert('Please enter a value for required field Sub Account on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_order_key') == '') {
            alert('Please enter a value for required field YBP Order Key on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_eisbn') == '') {
            alert('Please enter a value for required field EISBN on the YBP eContent tab.');
            isValid = false;
        }
        /* TA406377 Make URL field no longer mandatory
        if (nlapiGetFieldValue('custevent_ybp_cust_url_needed_access') == '') {
            alert('Please enter a value for required field Customer URL Needed For URL Access on the YBP eContent tab.');
            isValid = false;
        }*/
        if (nlapiGetFieldValue('custevent_ybp_screenshot_needed_access') == '') {
            alert('Please enter a value for required field YBP Screenshot Needed For Access on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    function ValidateMode2() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_sub_account') == '') {
            alert('Please enter a value for required field Sub Account on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    function ValidateMode3() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_sub_account') == '') {
            alert('Please enter a value for required field Sub Account on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_eisbn') == '') {
            alert('Please enter a value for required field EISBN on the YBP eContent tab.');
            isValid = false;
        }
        /* TA406377 Make URL field no longer mandatory
        if (nlapiGetFieldValue('custevent_ybp_cust_url_needed_access') == '') {
            alert('Please enter a value for required field Customer URL Needed For URL Access on the YBP eContent tab.');
            isValid = false;
        }*/

        return isValid;
    }

    function ValidateMode4() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_sub_account') == '') {
            alert('Please enter a value for required field Sub Account on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_order_key') == '') {
            alert('Please enter a value for required field YBP Order Key on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_eisbn') == '') {
            alert('Please enter a value for required field EISBN on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    function ValidateMode5() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    function ValidateMode6() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_order_key') == '') {
            alert('Please enter a value for required field YBP Order Key on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_eisbn') == '') {
            alert('Please enter a value for required field EISBN on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    function ValidateMode7() {
        var isValid = true;

        if (nlapiGetFieldValue('custevent_ybp_sub_account') == '') {
            alert('Please enter a value for required field Sub Account on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_vendor') == '') {
            alert('Please enter a value for required field YBP Vendor on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_order_key') == '') {
            alert('Please enter a value for required field YBP Order Key on the YBP eContent tab.');
            isValid = false;
        }
        if (nlapiGetFieldValue('custevent_ybp_eisbn') == '') {
            alert('Please enter a value for required field EISBN on the YBP eContent tab.');
            isValid = false;
        }

        return isValid;
    }

    var ecFieldsValid = true;
 
    //validate
    // US307774 Use ID's not Text names 
    switch (nlapiGetFieldValue('custevent_ybp_ec_case_category') + '|' + nlapiGetFieldValue('custevent_ybp_ec_case_subcategory')) {
    	case '1|':    //Access|
            ecFieldsValid = ValidateMode1();
            break;
        case '2|27': // Account Maintenance|General (FTE, IP Range, etc)        	
            ecFieldsValid = ValidateMode2();
            break;
        case '101|104': //Credit|Customer Ordered in Error
            ecFieldsValid = ValidateMode7();
            break;
        case '101|102': //Credit|Metadata
            ecFieldsValid = ValidateMode7();
            break;
        case '101|106': //Credit|Order generated by vendor in error
            ecFieldsValid = ValidateMode7();
            break;
        case '101|103': //Credit|Price Difference
            ecFieldsValid = ValidateMode7();
            break;
        case '101|107': //Credit|Title Not Sellable by Vendor / Open Access
            ecFieldsValid = ValidateMode7();
            break;
        case '101|101': //Credit|Upgrade
            ecFieldsValid = ValidateMode7();
            break;
        case '101|108': //Credit|Vendor Unable to Fix in a Timely Fashion
            ecFieldsValid = ValidateMode7();
            break;
        case '101|105': //Credit|YBP ordered in error
            ecFieldsValid = ValidateMode7();
            break;
        case '6|1': //DDA|Access
            ecFieldsValid = ValidateMode3();
            break;
        case '6|18': //DDA|Discovery
            ecFieldsValid = ValidateMode2();
            break;
        case '6|36': //DDA|Order/Invoice
            ecFieldsValid = ValidateMode2();
            break;
        case '6|46': //DDA|Setup
            ecFieldsValid = ValidateMode2();
            break;
        //TA406379 New EC SubCategory
        case '6|123': //DDA|Change
            ecFieldsValid = ValidateMode2();
            break;
        case '6|109': //DDA|Shutdown
            ecFieldsValid = ValidateMode2();
            break;
        case '6|51': //DDA|Title Add
            ecFieldsValid = ValidateMode2();
            break;
        case '6|52': //DDA|Title Remove
            ecFieldsValid = ValidateMode2();
            break;
        case '7|': //Licensing|
            ecFieldsValid = ValidateMode2();
            break;
        case '9|110': //Metadata|Content Issue
            ecFieldsValid = ValidateMode4();
            break;
        case '9|111': //Metadata|Error on Platform
            ecFieldsValid = ValidateMode4();
            break;
        case '10|112': //Orders|Cancellation Request
            ecFieldsValid = ValidateMode4();
            break;
        case '10|25': //Orders|General
            ecFieldsValid = ValidateMode4();
            break;
        case '10|114': //Orders|Training
            ecFieldsValid = ValidateMode4();
            break;
            // US3307774 New sub-category    
        case '10|122': //Orders|Upgrades
        	ecFieldsValid = ValidateMode4();
            break;            
        case '102|115': //Collection|Access
            ecFieldsValid = ValidateMode2();
            break;
        case '102|116': //Collection|Metadata
            ecFieldsValid = ValidateMode2();
            break;
        case '102|118': //Collection|Orders
            ecFieldsValid = ValidateMode2();
            break;
        case '102|117': //Collection|Pricing/Availability
            ecFieldsValid = ValidateMode2();
            break;
        case '12|22': //Pricing|General (note:inactive)
            ecFieldsValid = ValidateMode2();
            break;
        case '12|41': //Pricing|Package (note:inactive)
            ecFieldsValid = ValidateMode2();
            break;
        case '12|47': //Pricing|Single Title Purchase (note:inactive)
            ecFieldsValid = ValidateMode2();
            break;
        case '13|': //Pricing/Availability|
            ecFieldsValid = ValidateMode2();
            break;
        case '18|120': //Training|Vendor Issue (note:inactive)
            ecFieldsValid = ValidateMode5();
            break;
    }

    return ecFieldsValid;
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

    if (companyId != '' && companyId != null && companyId != Customers.AnonDDESupport && companyId != Customers.AnonSSEUK && companyId != Customers.AnonSSEAU && companyId != Customers.AnonSSEGerman && companyId != Customers.AnonYBPSupport) {
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

    //[NEW CASES]
    if (IsNewCase()) {

        //default origin to phone
        nlapiSetFieldText('origin', 'Phone');

        //default gobi origin to Gobi3 Email
        nlapiSetFieldText('custevent_ybp_gobi_origin', 'Gobi3 Email');

        //set team profile & classification based on current user's department
        switch (nlapiLookupField('employee', nlapiGetUser(), 'department')) {
            case Departments.YBPCustomerService:
                TeamAssignment.AssignTeamToCase(TeamAssignment.CustomerService);
                TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.CustomerService.DefaultNewCaseStatus);
                break;
            case Departments.YBPEContent:
                TeamAssignment.AssignTeamToCase(TeamAssignment.EContent);
                TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.EContent.DefaultNewCaseStatus);
                break;
            case Departments.YBPGOBI:
                TeamAssignment.AssignTeamToCase(TeamAssignment.GOBI);
                TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.GOBI.DefaultNewCaseStatus);
                break;
            case Departments.YBPLTS:
                TeamAssignment.AssignTeamToCase(TeamAssignment.LTS);
                TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.LTS.DefaultNewCaseStatus);
                break;
        }
    }

    //[EXISTING CASES]
    else {

        //EA: disable origin field if value = 'case portal' or 'phone'
        if ((nlapiGetFieldText('origin') == 'Case Portal') || (nlapiGetFieldText('origin') == 'Phone')) {
            nlapiDisableField('origin', true);
        }
        // US214281: Call library function to check for multi-language YBP Support profile & if found default to YBP Support
        if (Profiles.IsProfileYBPMultiLang()){
    		nlapiSetFieldValue('profile', Profiles.YBPSupport, false, true);
    	}
    }

    //[ALL CASES]
    //set assigned to current user if unassigned or if assigned to the CS or EC or GOBI default user
    if (nlapiGetFieldValue('assigned') == '' || nlapiGetFieldValue('assigned') == Employees.UnassignedYBPCS || nlapiGetFieldValue('assigned') == Employees.UnassignedYBPEC || nlapiGetFieldValue('assigned') == Employees.UnassignedYBPGOBI || nlapiGetFieldValue('assigned') == Employees.UnassignedYBPLTSAccounts || nlapiGetFieldValue('assigned') == Employees.UnassignedYBPLTSInternal) {
        nlapiSetFieldValue('assigned', nlapiGetUser());
    }

    //change ybp accountnumber search box color
    document.getElementById('custpage_ybp_search_by_acctnum_formattedValue').style.backgroundColor = '#EFFFEF';

    //set mandatory fields for current logged in user
    TeamAssignment.SetMandatoryFieldsForCurrentUser();
    
//  US266415 Also if not a new case need to set mandatory those other EContent fields (otherwise they don't get set on form entry)
    if(Departments.IsUserDepartmentYBPEContent() && !IsNewCase())
    	{
     	            SetMandatoryEContentSubCategoryField(); 
    	            SetAdditionalMandatoryEContentFields();
    	}
    // US266415 Also need those MandatoryFieldsForotherTeams set..... 
    if(!Departments.IsUserDepartmentYBPEContent() && Departments.IsAssigneeDepartmentYBPEContent() && !IsNewCase())
    	{
    		SetMandatoryEContentSubCategoryField();
    		TeamAssignment.SetMandatoryTeamFieldsNoUnset(TeamAssignment.EContent.MandatoryFieldsForOtherTeams);
    	}

    //attempt to populate YBP account if company was already populated during case capture
    PopulateCompanyOrYBPAccount();
}

//Form Save Event
function FormSave() {

    //Validate mandatory fields for current user (cs/ec/gobi)
    var teamFieldsValid = true;
    switch (Departments.GetCurrentUserDepartment()) {
        case Departments.YBPCustomerService:
            teamFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.CustomerService.MandatoryFields, true);

            //US1094652 Change Product Type, CS Category & CS Subcategory fields from mandatory on case change to mandatory on case close
            if(nlapiGetFieldValue('custevent_ybp_waiting_on') == YBPCaseStatus.Closed){
                teamFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.CustomerService.MandatoryFieldsOnCaseCloseYBPCS, true);
            }
            break;
        case Departments.YBPEContent:
            teamFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.EContent.MandatoryFields, true);
 // US266415 Sub-category validation inserted here   
            if (teamFieldsValid) {
            	teamFieldsValid = MandatoryEContentSubCategoryFieldValid();
            }
            if (teamFieldsValid) {
                teamFieldsValid = AdditionalMandatoryEContentFieldsValid();
            }    
            break;
        case Departments.YBPGOBI:
            teamFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.GOBI.MandatoryFields, true);
            break;
        case Departments.YBPLTS:
            teamFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.LTS.MandatoryFields, true);
            break;
    }
    if (!teamFieldsValid)
        return false;

    //econtent needs other teams to populte econtent fields when passing them a case
    if (Departments.IsAssigneeDepartmentYBPEContent() && !Departments.IsUserDepartmentYBPEContent()) {
        var eContentFieldsValid = TeamAssignment.ValidateMandatoryTeamFields(TeamAssignment.EContent.MandatoryFieldsForOtherTeams, false);
        if (!eContentFieldsValid) {
            alert('Please be sure to complete the following eContent fields on the eContent sub tab before saving this case: Category, Sub-Account, Vendor, YBP Order Key, eISBN, Title, Summary of Issue');
            return false;
        }
    	// US266415 Insert sub-category validation here
    	if (!MandatoryEContentSubCategoryFieldValid()) {
     		return false;
    	}
    }

    //Validate escalatee populated if status is escalated
    if (nlapiGetFieldText('status') == 'Escalated') {
        if (nlapiGetLineItemCount('escalateto') == 0) {
            alert('A case in an Escalated status needs at least one Escalatee. Change your status to something other than Escalated or visit the \'Escalate\' subtab to add an Escalatee');
            return false;
        }
    }
    
    // US214281 Ensure YBP MultiLanguage Profile set to YBPSupport
    if (Profiles.IsProfileYBPMultiLang()){
    	nlapiSetFieldValue('profile', Profiles.YBPSupport, false, true);
		alert('Alert: Profile has been set to main YBP Support profile');
    }

    //  US1166718 - If being saved with a Status of "Not Started", set the YBP Case Status to "Not Started"
    if (nlapiGetFieldValue('status') == Status.NotStarted){
        nlapiSetFieldValue('custevent_ybp_waiting_on', YBPCaseStatus.NotStarted, false);
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
    	
    	var assigned = nlapiGetFieldValue('assigned');

    	//handle team assignment 
        switch (Departments.GetCurrentAssigneeDepartment()) {
            case Departments.YBPCustomerService:
                if (IsNewCase() && Departments.IsUserAndAssigneeSameDepartment()) {
                    TeamAssignment.AssignTeamToCase(TeamAssignment.CustomerService);
                    TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.CustomerService.DefaultNewCaseStatus);
                }
                //US937213 set team reassignment rules for NES_YBP_Support employee
                else if (assigned == Employees.NES_YBP_Support){
                    TeamAssignment.ReAssignTeam(TeamAssignment.NES_YBP_Support);
                }
                else {
                	TeamAssignment.ReAssignTeam(TeamAssignment.CustomerService);
                }
                break;
            case Departments.YBPEContent:
                if (IsNewCase() && Departments.IsUserAndAssigneeSameDepartment()) {
                    TeamAssignment.AssignTeamToCase(TeamAssignment.EContent);
                    TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.EContent.DefaultNewCaseStatus);
                }
                else {
                    TeamAssignment.ReAssignTeam(TeamAssignment.EContent);
                }
                
                break;
            case Departments.YBPGOBI:
                if (IsNewCase() && Departments.IsUserAndAssigneeSameDepartment()) {
                    TeamAssignment.AssignTeamToCase(TeamAssignment.GOBI);
                    TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.GOBI.DefaultNewCaseStatus);
                }
                else {
                    TeamAssignment.ReAssignTeam(TeamAssignment.GOBI);
                }
                break;
            case Departments.YBPLTS:
                if (IsNewCase() && Departments.IsUserAndAssigneeSameDepartment()) {
                    TeamAssignment.AssignTeamToCase(TeamAssignment.LTS);
                    TeamAssignment.SetNewCaseDefaultStatus(TeamAssignment.LTS.DefaultNewCaseStatus);
                }
                else {
                    TeamAssignment.ReAssignTeam(TeamAssignment.LTS);
                }
                break;
            case Departments.YBPOMG:
                TeamAssignment.ReAssignTeam(TeamAssignment.OMG);
                break;
        }

        //populate 'cs user' field for cases being passed from customer service to another team
        if (Departments.IsUserDepartmentYBPCustomerService() && !Departments.IsAssigneeDepartmentYBPCustomerService()) {
            nlapiSetFieldValue('custevent_ybp_cs_user', nlapiGetUser());
        }
        
        //US266415 - Sort out Mandatory fields for EContent : Only need to do this where the User is Not eContent
        if (!Departments.IsUserDepartmentYBPEContent())
        	{
        		if (Departments.IsAssigneeDepartmentYBPEContent())
        			{
        			SetMandatoryEContentSubCategoryField();
        			TeamAssignment.SetMandatoryTeamFieldsNoUnset(TeamAssignment.EContent.MandatoryFieldsForOtherTeams);
        			}
        		else {
        			TeamAssignment.UnSetMandatoryTeamFields(TeamAssignment.EContent.MandatoryFieldsForOtherTeams);
        			TeamAssignment.UnSetMandatoryTeamFields(TeamAssignment.EContent.MandatorySubCategoryField);
        		}
        	
        	}
    }

    //ybp case status field changed
    if (name == 'custevent_ybp_waiting_on') {

        //keep 'status' in sync with 'ybp case status'
        if (nlapiGetFieldValue('custevent_ybp_waiting_on') == YBPCaseStatus.Closed || nlapiGetFieldValue('custevent_ybp_waiting_on') == YBPCaseStatus.ClosedDuplicateNoAction) {

            //close 'status' and 'omg case status' when CS/EC/GOBI case is closed
            nlapiSetFieldValue('status', Status.Closed, false);
            nlapiSetFieldValue('custevent_ybp_omg_case_status', OMGCaseStatus.Closed, false);
        }
        else if (nlapiGetFieldValue('custevent_ybp_waiting_on') == YBPCaseStatus.ReOpened) {
            nlapiSetFieldValue('status', Status.ReOpened, false);
        }
        //  US1166718 - Support addition of "Not Started" case status
        else if (nlapiGetFieldValue('custevent_ybp_waiting_on') == YBPCaseStatus.NotStarted){
            nlapiSetFieldValue('status', Status.NotStarted, false);
        }
        else {
            nlapiSetFieldValue('status', Status.InProgress, false);
        }
    }

    //ec category field changed
    if (name == 'custevent_ybp_ec_case_category') {
        if(Departments.IsUserDepartmentYBPEContent()){
        	// US266415 Also set EC SubCategory here & consider where needs to be unset also...
        	SetMandatoryEContentSubCategoryField();
            SetAdditionalMandatoryEContentFields();}
        else if(Departments.IsAssigneeDepartmentYBPEContent()){
        	SetMandatoryEContentSubCategoryField();
        }
        else {
        	TeamAssignment.UnSetMandatoryTeamFields(TeamAssignment.EContent.MandatorySubCategoryField);
        }
    }

    //ec subcategory field changed
    if (name == 'custevent_ybp_ec_case_subcategory') {
        if (Departments.IsUserDepartmentYBPEContent())
            SetAdditionalMandatoryEContentFields();
    }
}