/*
    Script: UserEvent_Case_BeforeLoad.js

    Created by: EBSCO Information Services

    Function:
    
	Library Scripts Used:
 	library_constants.js -- Library Script used to reference constant values
 	library_script.js -- multilanguage profile check

    Revisions:  
    CNeale	09/21/2016	US151877 Suppress SpamLock Button for all roles except Administrator & EP Support Administrator.
    LW      11/22/2016  Added support for OMG profile.
    JOliver 05/06/2017  2017.1 Release - hide QuickNote field
 	CNeale	06/14/2017	US214281 Include consideration of YBP multi-language profiles
 	JOliver 08/16/2017  Remmed out code that hides QuickNote field (since all case forms are now upgraded)
 	CNeale	11/07/2017	US253375 Content Licensing Publisher Selector Field added
 	CNeale	06/21/2018	F24082 Changes for GOBI EBA....
 						Added Library_constants for Custom Form values
 						Adjusted positioning of YBP Account selector field
 						Added assignee selector field
	CNeale	07/16/2018	US268765 Remove use of GetNetSuiteDomain() library function as domain not required. 
	PKelleher  11/14/23 TA857346 - Remove scripted field (Select Assignee from List field) that is housed on EBC and eCollection Case form - no longer needed
*/

function serverCaseBeforeLoad(type, form)
{
    var user = nlapiGetContext().getUser();
	var role = nlapiGetRole();
	
    // User Web Service = 452592 User Web Service 2 = 808840
	// US151877 Do not perform Case Before Load for Customer Center role = 14
	if (user != 452592 && user != 808840 && role != 14)
	{
		// US151877 For all roles except Administrator (3) and EP Support Administrator (1006) suppress Spam Lock functionality
		if (role != 1006 && role != 3 && (type == 'view' || type == 'edit'))
		{
			form.removeButton('setSpamLock');
		}
		if (type == 'create' || type == 'edit')
		{
			var custform = nlapiGetFieldValue('customform'); //F24082 
			
			// 2016-02-24 New Code - EIS Account Selector is for DDE/SSD Cases and YBP Account Selector is for YBP Cases
			// Custom Form IDs: 82 (User Services Case Form)  and 147 (Merged Case Form
			if (custform == LC_Form.UserServ || custform == LC_Form.CustSatMerged)  //F24082
			{
				// EIS Account Selector field is utilized in case form client script
				// This field needs to be server script generated in order to populate/clear via client script
				// add the EIS Account Selector field onto the case form
				var EisAccountSelector = form.addField('custpage_eis_account_selector','select','EIS Account Selector',null,'main');
				form.insertField(EisAccountSelector,'custevent_eis_account');
				EisAccountSelector.setDisplayType('disabled');

				// if company is known then set the search link value so that EIS Account Searches can be limited to this customer
				var company_id = nlapiGetFieldValue('company');
				if (company_id != '' && company_id != null && company_id != '277026')
				{
					// US268765 Remove use of GetNetSuiteDomain() library function as domain not required. 
//                  nlapiSetFieldValue('custevent_eis_account_search_link', '<a href="' + GetNetSuiteDomain('system') + '/app/common/search/searchresults.nl?searchid=10519&CUSTRECORD_EIS_ACCOUNT_CUSTOMER=' + company_id + '&submitter=Submit"target="_blank">Search EIS Accounts under this EP Company</a>');
					nlapiSetFieldValue('custevent_eis_account_search_link', '<a href="' + '/app/common/search/searchresults.nl?searchid=10519&CUSTRECORD_EIS_ACCOUNT_CUSTOMER=' + company_id + '&submitter=Submit"target="_blank">Search EIS Accounts under this EP Company</a>');
                }
            }
			//F24082 Adding in GOBI EBA Case Form (302)  
			if (custform == LC_Form.YBPMerged || custform == LC_Form.YBPOMG || // YBP EC/CS Case Form = 195 && YBP OMG Case Form = 201
				custform == LC_Form.GobiEBA) 
			{
			    var YbpSearchByAccountNum = form.addField('custpage_ybp_search_by_acctnum', 'integer', 'Search By Account #', null, 'main');
			    if (custform == LC_Form.YBPMerged)
		    	{
			        form.insertField(YbpSearchByAccountNum, 'custevent_ybp_account_number');
		    	}    
			    else if (custform == LC_Form.YBPOMG)
			    {	
			        form.insertField(YbpSearchByAccountNum, 'custevent_ybp_account');
			    }    
			    else if (custform == LC_Form.GobiEBA) 
			    {	
			    	form.insertField(YbpSearchByAccountNum, 'custevent_ybp_account_number_integer');
			    }
			}
			
			//US253375 Add Publisher Selector field for Content Licensing Form
			if (custform == LC_Form.ContLic) // Content Licensing Case Form = 105
			{
			    var PubSelector = form.addField('custpage_publisher_select', 'select', 'Select Publisher From List', 'partner', 'main');
			    form.insertField(PubSelector, 'custevent_pubsat_create_partner_link');
			}
        }
		if (type == 'view' || type == 'edit')
		{	
			// if the Profile is YBP
			// US214281 Include YBP multi-language profiles as well
			var case_profile = nlapiGetFieldValue('profile');
				// NOTE THAT YOU CANNOT fetch the value of the CUSTOM-FORM field in a BEFORELOAD script for TYPE = 'view'
			if (case_profile == '17' || ybpSupportMultiLangProfileCheck(case_profile))
			{
				// Prod search Id = 37890
				var bus_days_searchid = '37890';
				var bus_days_filters = new Array();
				bus_days_filters[0] = new nlobjSearchFilter('internalid', null,'is', nlapiGetRecordId());
				var bus_days_columns = new Array();
				bus_days_columns[0] = new nlobjSearchColumn('internalid', null, null);
				bus_days_columns[1] = new nlobjSearchColumn('formulatext', null, null);
				// var bus_days_searchid = '';
				var searchresults = nlapiSearchRecord('supportcase', bus_days_searchid, bus_days_filters, bus_days_columns);
				var formulatext = '';
				for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
				{
					var searchresult = searchresults[ i ];
					formulatext = searchresult.getValue('formulatext');
					nlapiSetFieldValue('custevent_case_age_formula', formulatext);
				}
			}
		}
	}
}