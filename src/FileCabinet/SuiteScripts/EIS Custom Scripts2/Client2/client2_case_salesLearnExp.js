/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		Client2_case_salesLearnExp.js
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
//	2023-09-26		JOliver			TA854124 Updated L2_initialize_newSalesCase to use correct company internal ID for scase_customer_in
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case'],
function (LC2Constant, search, runtime, L2Case) {
	
	function caseFormLoad(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var fieldId = scriptContext.fieldId;
		
		// If a New Sales Case General
		if (currentRec.getValue('id') == "" || currentRec.getValue('id') == null )
		{
			// Use library function to initialize the Sales Case
			L2Case.L2_initialize_newSalesCase(record_in = currentRec, assignee_in = LC2Constant.LC2_Employee.LearnExpSalesOps, user_in = runtime.getCurrentUser().id, scase_customer_in = currentRec.getValue('custevent_case_customer_list'));
			//set Help Desk flag
			currentRec.setValue ({
				fieldId: 'helpdesk',
				value: true,
				ignoreFieldChange: true
			});
			
			// set target date to two weeks out -- AMIE REMOVED THE FOLLOWING CODE DEC 2010
			//var myDate=new Date();
			//myDate.setDate(myDate.getDate()+14);
			//var fDate= nlapiDateToString(myDate);
			//nlapiSetFieldValue('custevent_target_date', fDate)

		}
		// Set Sales Admin Case type to "Sales Admin" (1)
		currentRec.setValue ({
			fieldId: 'custevent31',
			value: LC2Constant.LC2_SalesCaseType.SalesAdmin,
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
		
		var role = nlapiGetRole();	
		// if not an Administrator then disable the customform field -- we used to do this
		//	if (role != '3')
		//	{
		//		nlapiDisableField('customform',true);
		//	}
			
		// if current user's role role is not Sales Administrator (1007) or Administrator (3) or Sales Manager (1001) 
		// or Sales Operations Mngr (1057) or Order Entry (1011) or Sales Analyst (1053) or Sales Operations Director (1065)
		// or Cust Sat Roles (1006, 1002, 1003) then lock down and hide certain fields
		if(role != LC2Constant.LC2_Role.EPSalesAdmin && role != LC2Constant.LC2_Role.Administrator && role!= LC2Constant.LC2_Role.SalesInsideDir && role!= LC2Constant.LC2_Role.SalesOpsMngr && role!= LC2Constant.LC2_Role.EPOrdProc && role != LC2Constant.LC2_Role.SalesAnalyst && role != LC2Constant.LC2_Role.SalesOpsDir && role != LC2Constant.LC2_Role.EPSupAdmin && role != LC2Constant.LC2_Role.EPSupMngr && role != LC2Constant.LC2_Role.EPSupPers && role != LC2Constant.LC2_Role.CompetAnalysis)
		{
			currentRec.getField('status').isDisabled = true;
			currentRec.getField('priority').isDisabled = true;
			currentRec.getField('custeventcustsat_prj_days').isDisabled = true;
			//nlapiDisableField('custevent_target_date',true); REMMED OUT BY JEFF O on 3/23, PER JOANNE G AND LEAH G	
			currentRec.getField('company').isDisabled = true;
			currentRec.getField('outgoingmessage').isDisabled = true;
			// Not Competitive Analysis/ EP Director then disable assigned to field
			if (role != LC2Constant.LC2_Role.CompetAnalysis && role != LC2Constant.LC2_Role.SalesDir)
			{
				currentRec.getField('assigned').isDisabled = true;
			}
		}
		return true;
	}
	
	
	// 04-14-2006
	// copies message text from original to outgoing boxes
	function copyOriginalMessage(){
		L2Case.L2_copyMessageButton()
	}

	
	return	{
		pageInit: caseFormLoad,
		copyOriginalMessage: copyOriginalMessage
	}
})