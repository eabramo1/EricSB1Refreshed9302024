/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_case_salesEbAbCustom.js
//Written in SuiteScript 2.0
//
//Created by:	Kaanjaree Nune 08-2022 
//
//Library Scripts Used:
//
//
//  Revisions:  
//  Date            Name            Description
//  2022-08-03      KNune       	Original Creation of the Script for Refactoring (no revision history on original SS1 version) (Zach uploaded + deployed in SB2)
//  2023-09-26    	JOliver			TA854124 Updated L2_initialize_newSalesCase to use correct company internal ID for scase_customer_in
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case'],
function (LC2Constant, search, runtime, L2Case) {
	
	// Not brought into L2Constant as it is the ONLY reference to these fields in our ENTIRE codebase
	var customCollectionType = {
			NonPDA: '1',
			PDA: '2'
	};
	// Not brought into L2Constant as it is the ONLY reference to these fields in our ENTIRE codebase
	var pdaLimitType = {
			PDABudget: '1',
			PDATitles: '2'
	};
	
	function caseFormLoad(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;
		
		// If a New Sales Case General
		if (currentRec.getValue('id') == "" || currentRec.getValue('id') == null )
		{
			// Use library function to initialize the Sales Case
			L2Case.L2_initialize_newSalesCase(record_in = currentRec, assignee_in = LC2Constant.LC2_Employee.ebookCoordinator, user_in = runtime.getCurrentUser().id, scase_customer_in = currentRec.getValue('custevent_case_customer_list'));
			//set Help Desk flag
			currentRec.setValue ({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: true
			});
			
			// set target date to two weeks out
			
	/*  8.23.18 - Pat Kelleher disenabled the below code that sets date to +14 days - now this field is left blank, but still a mandatory field)
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+14);
			var fDate= nlapiDateToString(myDate);
			nlapiSetFieldValue('custevent_target_date', fDate)
	*/
		}
		// set Sales Case type to EbAb Custom Collection  (5)
		currentRec.setValue ({
			fieldId: 'custevent31',
			value: LC2Constant.LC2_SalesCaseType.eBaBCustom,
			ignoreFieldChange: true
		});

		//set Help Desk flag if it's not populated
		if (currentRec.getValue('helpdesk') == '' || currentRec.getValue('helpdesk') == null)
		{
			currentRec.setValue ({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: true
			});
		}
		
		var role = runtime.getCurrentUser().role;	

			
		// if current user's role role is not Sales Administrator (1007) or Administrator (3) or Sales Manager (1001) 
		// or Sales Operations Mngr (1057) or Order Entry (1011) or Sales Analyst (1053) or Sales Operations Director (1065)
		// or Cust Sat Roles (1006, 1002, 1003) 
		// or EP - Competitive Analysis Group (1056) then lock down and hide certain fields
		if(role != LC2Constant.LC2_Role.EPSalesAdmin && role != LC2Constant.LC2_Role.Administrator && role!= LC2Constant.LC2_Role.SalesInsideDir && role!= LC2Constant.LC2_Role.SalesOpsMngr && role!= LC2Constant.LC2_Role.EPOrdProc && role != LC2Constant.LC2_Role.SalesAnalyst && role != LC2Constant.LC2_Role.SalesOpsDir && role != LC2Constant.LC2_Role.EPSupAdmin && role != LC2Constant.LC2_Role.EPSupMngr && role != LC2Constant.LC2_Role.EPSupPers && role != LC2Constant.LC2_Role.CompetAnalysis)
		{
			currentRec = L2Case.L2_disableNonAdminSalesCaseFields(currentRec);
			currentRec.getField('custeventcustsat_prj_days').isDisabled = true;
			//nlapiDisableField('custevent_target_date',true); --removed on 12/12/11 per Leah Griffin
		}
		// If Sales Analyst (1053) -- disable the company field only
		if (role == LC2Constant.LC2_Role.SalesAnalyst)
		{
			currentRec.getField('company').isDisabled = true;
		}
		return true;
	}
	
	
	function caseFormSave(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId; 
		
		// If Non-PDA Custom Collection (id = 1) is selected then require a Non-PDA Budget field
		if (currentRec.getValue('custevent_nlr_customcollection_type') == customCollectionType.NonPDA)
		{
			if(currentRec.getValue('custevent_nlr_nonpda_budgetlimit') == '' || currentRec.getValue('custevent_nlr_nonpda_budgetlimit') == null)
			{
				alert('You must specify a Non-PDA Budget that is $5,000 or greater');
				return false;
			}
			if (currentRec.getValue('custevent_nlr_nonpda_budgetlimit') < 5000.00)
			{
				alert('You must specify a Non-PDA Budget that is $5,000 or greater');
				return false;		
			}
			// set all the PDA fields to blank
			currentRec.setValue ({
				fieldId: 'custevent_nlr_pda_limit_type',
				value: '',
				ignoreFieldChange: true
			});
			currentRec.setValue ({
				fieldId: 'custevent_nlr_pda_budget_limit',
				value: '',
				ignoreFieldChange: true
			});
			currentRec.setValue ({
				fieldId: 'custevent_nlr_title_limit',
				value: '',
				ignoreFieldChange: true
			});
		}
		
		// If PDA Custom Collection (id = 2) is selected then require a Limit Type and Limit fields
		if (currentRec.getValue('custevent_nlr_customcollection_type') == customCollectionType.PDA)
		{	// Require Limit Type
			if(currentRec.getValue('custevent_nlr_pda_limit_type') == '' || currentRec.getValue('custevent_nlr_pda_limit_type') == null)
			{
				alert('You must specify a PDA Limit Type and a Limit (either Budget or Title)');
				return false;
			}
			// if PDA Limit type is PDA Budget (id = 1)
			if(currentRec.getValue('custevent_nlr_pda_limit_type') == pdaLimitType.PDABudet)
			{	//Require PDA Budget Limit 
				if(currentRec.getValue('custevent_nlr_pda_budget_limit') == '' || currentRec.getValue('custevent_nlr_pda_budget_limit') == null)
				{
					alert('You must specify a PDA Budget Limit Amount that is $2,500 or greater');
					return false;	
				}		
				//  PDA Budget Limit must be Greater than $2,500
				if(currentRec.getValue('custevent_nlr_pda_budget_limit') < 2500)
				{
					alert('You must specify a PDA Budget Limit Amount that is $2,500 or greater');
					return false;
				}
				// set PDA Title Limit field to blank
				currentRec.setValue ({
					fieldId: 'custevent_nlr_title_limit',
					value: '',
					ignoreFieldChange: true
				});
			}
			// if PDA Limit type is PDA Titles
			if(currentRec.getValue('custevent_nlr_pda_limit_type') == pdaLimitType.PDATitles)
			{
				if (currentRec.getValue('custevent_nlr_title_limit') == '' || currentRec.getValue('custevent_nlr_title_limit') == null)
				{	//require PDA Title Limit
					alert('You must specify a PDA Title Limit');
					return false;			
				}
				// set PDA Budget Limit field to blank
				currentRec.setValue ({
					fieldId: 'custevent_nlr_pda_budget_limit',
					value: '',
					ignoreFieldChange: true
				});
			}
			// set Non-PDA Budget Limit to blank
			currentRec.setValue ({
				fieldId: 'custevent_nlr_nonpda_budgetlimit',
				value: '',
				ignoreFieldChange: true
			});
		}
		return true;
	}
	
	
	// Library function needs to be housed inside of another function. If passed directly in the return statement, it runs on pageLoad. If anyone can think of another solution please feel free to change me!
	function copyOriginalMessage(){
		L2Case.L2_copyMessageButton()
	}
	
	return{
		pageInit: caseFormLoad,
		saveRecord: caseFormSave,
		copyOriginalMessage: copyOriginalMessage
	}
})