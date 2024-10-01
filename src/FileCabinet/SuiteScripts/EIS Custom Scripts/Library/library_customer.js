//
// Script:     library_customer.js  
//
// Created by: Christine Neale, EBSCO
// 
// Purpose:    This is a script file library of Customer script functions that may be called from other scripts.
//             Customer specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
// L_Cust_AUCeligo			5/7/19		CNeale			Added function to determine if Customer is set up for AU Celigo 
//														portal use.
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
// Pat Kelleher - 	3/15/18 -	added additional fields and search operators
// C Neale			5/8/19		US507840 Added function L_Cust_AUCeligo	
//		
//
//-------------------------------------------------------------------------------------------------------------------------

var L_customerParmMapObject = {	
		customer_name: {
			nsfieldName:	'companyname',	
			searchBy:		'any,is,haskeywords,startswith,contains,isnot,doesnotstartwith,doesnotcontain'
		},

			// confirm correct custid field because search results (System CustID (Custom)) did not give back info as expected when using this field.
		customer_custid: 	{
			nsfieldName:	'entityid',	
			searchBy:		'any,is,isempty,startswith,contains,isnot,isnotempty,doesnotstartwith,doesnotcontain'
		},
		customer_ep_territory: {
			nsfieldName:	'custentity_epterritory',	
			searchBy:		'anyof,noneof'
		},
		customer_id: 	{
			nsfieldName:	'internalid',	
			searchBy:		'anyof,noneof'
		},
		customer_market: 	{
			nsfieldName:	'custentity_market',	
			searchBy:		'anyof,noneof'
		},
		customer_segment: 	{
			nsfieldName:	'custentity_marketsegment',	
			searchBy:		'anyof,noneof'
		},
		customer_datecreated: 	{
			nsfieldName:	'datecreated',	
			searchBy:		'on,before,after,onorbefore,onorafter,within,noton,notbefore,notafter,notonorbefore,notonorafter,notwithin'
		},
		customer_cascoverage: 	{
			nsfieldName:	'custentity_cas_level',	
			searchBy:		'anyof,noneof'
		},
}


//--------------------------------------------------------------------------//
//Function: L_Cust_AUCeligo
//Determines whether Customer is set up for access to (old) Celigo Case Portal for AU SSD Team only
//Input   	: intIdIn = Customer Internal Id
//Returns 	: true - AU Celigo access
//			: false - No AU Celigo access
//
function L_Cust_AUCeligo(custIn)
{
	var au_profile = '9';  // Internal Id for "EBSCO SSE AU Support" profile on Case Portal Profile List
	
	//Retrieve Case Portal Access flag & Case Portal Profile Override setting from Customer
	var fields = ['custentity_case_portal_access', 'custentity_portal_profile_override']
	var columns = nlapiLookupField('customer', custIn, fields);
	var celigo_access = columns.custentity_case_portal_access;
	var profile_oride = columns.custentity_portal_profile_override;
	
	return (celigo_access == 'T' && profile_oride == au_profile) ? true : false;
}



