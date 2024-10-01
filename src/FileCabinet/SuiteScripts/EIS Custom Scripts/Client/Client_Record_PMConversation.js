// Script:     Client_Record_PMConversation.js   POC
//
// Created by: Christine Neale
//
// Functions:  	
//			
//
//Library Scripts Used: 
//		library_constants.js
//		library_pmconversation.js
//
//
// Revisions:  
//	CNeale		05-12-2020	Original version
//	CNeale		07-06-2020  US662522 Introduce "Product not on list" functionality 
/*----------------------------------------------------------------------------------------------------------------
 * 
 */
/*
 *  Global Variables
 */
var role = nlapiGetRole();
/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_PMC_init
 * Description: Form Initialisation Scripting
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_PMC_init(type)
{
	var company_id = nlapiGetFieldValue('custrecord_pm_customer');
	   		
	if (role != LC_Roles.WebServ) // Exclude Web Service Role   
	{      
		// Sort out the Item Selected Field
		var selected = nlapiGetFieldValue('custrecord_pm_product');
		var sel_set = false;
		nlapiLogExecution('debug', 'Selected: ', selected);
		var prodnf = nlapiGetFieldValue('custrecord_pm_prod_not_found');
		   
		if (company_id)
		{	  
			// Search Opportunities connected to this Customer that are within a year (currently using date created or equivalent) 
			var oppResults = CR_OppSearch(company_id);

        	  
			if (oppResults != null)
			{
				nlapiLogExecution('audit', 'Total records found by saved search:',oppResults.length);	
				for(var i = 0; oppResults != null && i < oppResults.length; i++)
				{
					var list_item = oppResults[i].getValue('internalid', 'item', 'group');
					nlapiLogExecution('debug', 'List Item: ', list_item);
					if (selected != '' && oppResults[i].getValue('internalid', 'item', 'group') == selected && prodnf != 'T'){
						nlapiInsertSelectOption('custpage_pmc_item_selector', oppResults[i].getValue('internalid', 'item', 'group'), oppResults[i].getValue('itemid', 'item', 'group'), true);
						sel_set = true;
					}
					else{
						nlapiInsertSelectOption('custpage_pmc_item_selector', oppResults[i].getValue('internalid', 'item', 'group'), oppResults[i].getValue('itemid', 'item', 'group'), false);
					}
				}
			}
			if (sel_set == false && selected != '' && prodnf != 'T'){ // If the selected value has not been added to the list add it!
				nlapiInsertSelectOption('custpage_pmc_item_selector', selected, nlapiGetFieldText('custrecord_pm_product'), true);
			}
			nlapiLogExecution('audit', 'No records found by saved search:','');
		}
		
		if (prodnf != 'T'){
			// Hide the true Product List
			nlapiGetField('custrecord_pm_product').setDisplayType('hidden');
		} 
		else {
			nlapiGetField('custpage_pmc_item_selector').setDisplayType('disabled');
		}
			
		// And Mandatory indication
		var pmType = nlapiGetFieldValue('custrecord_pm_type');
        if (pmType == L_PM_ConvType.Win || pmType == L_PM_ConvType.Loss)
        {  //Win, Loss
        	if (prodnf != 'T'){
        		nlapiSetFieldMandatory('custpage_pmc_item_selector', true);
        	}
        	else {
        		nlapiSetFieldMandatory('custrecord_pm_product', true);
        	}
        }
	}
}
/*----------------------------------------------------------------------------------------------------------------
 * Function   : CR_PMC_formSave
 * Description: Form Save Validation
 *            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_Case_formSave()
{
	// Validate that "Product Discussed" is selected where mandatory/available
	var company_id = nlapiGetFieldValue('custrecord_pm_customer');
	var pmType = nlapiGetFieldValue('custrecord_pm_type');
	var pmProd = nlapiGetFieldValue('custrecord_pm_product');

	   		
	if (role != LC_Roles.WebServ) {
		if (pmType == L_PM_ConvType.Win || pmType == L_PM_ConvType.Loss)
        {  //Win, Loss
        	if (!pmProd){  // No Product selected (US662522 no longer consider if there are any opps) 
        		alert('Please select a value for "Product Discussed"');
        		return false;
        	}
        }
	}
	
	
	return true;
}

/*----------------------------------------------------------------------------------------------------------------
* Function   : CR_PMCFieldChange(type, name)
* Description: Client Record Field Changed Scripting
*            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_PMCFieldChange(type, name)
{

	// Customer Change - this handles the product selection list build/clear
	if (name=='custrecord_pm_customer')
	{    
		// Clear the Contact to prevent display issues
		nlapiSetFieldValue('custrecord_pm_contact', '', false);
		
		// Now sort out product select list 
		var company_id = nlapiGetFieldValue('custrecord_pm_customer');
    	   		
		if (role != LC_Roles.WebServ) // Exclude Web Service Role   
		{      
			// Clear the Item Field & Select List 
			// US662522 Unset the Not in Product List Field & Hide the Full Product List 
			nlapiSetFieldValue('custrecord_pm_product', '', false, true);
			if(nlapiGetFieldValue('custrecord_pm_prod_not_found') == 'T'){
				nlapiGetField('custrecord_pm_product').setDisplayType('hidden');
				nlapiSetFieldValue('custrecord_pm_prod_not_found', 'F', false, true);
				nlapiGetField('custpage_pmc_item_selector').setDisplayType('normal');
			}	
			nlapiRemoveSelectOption('custpage_pmc_item_selector');
			// Insert a blank selection so we always have one..
			nlapiInsertSelectOption('custpage_pmc_item_selector','', '', true);
    		   
			if (company_id)
			{	  
				// Search Opportunities connected to this Customer that are within a year (currently using date created or equivalent) 
				var oppResults = CR_OppSearch(company_id);
            	  
				if (oppResults != null)
				{
					nlapiLogExecution('audit', 'Total records found by saved search:',oppResults.length);	
					for(var i = 0; oppResults != null && i < oppResults.length; i++)
					{
						nlapiInsertSelectOption('custpage_pmc_item_selector', oppResults[i].getValue('internalid', 'item', 'group'), oppResults[i].getValue('itemid', 'item', 'group'), false);
					}
				}
				nlapiLogExecution('audit', 'No records found by saved search:','');
			}
		}
	}
	
    // set the Product Discussed based on the PCM Item Selector selection 
   	if (name=='custpage_pmc_item_selector')
   	{	
   		nlapiSetFieldValue('custrecord_pm_product', nlapiGetFieldValue('custpage_pmc_item_selector'), true, true);
   	}
   	
   	// Product Not in List changed
   	if (name == 'custrecord_pm_prod_not_found')
   	{
   	// Only if not Web Services role
   		if (role != LC_Roles.WebServ)
		{
   			// Work out if Product Mandatory
   			var pmTypMand = 'F';
   			if (nlapiGetFieldValue('custrecord_pm_type') == L_PM_ConvType.Win || nlapiGetFieldValue('custrecord_pm_type') == L_PM_ConvType.Loss)
   			{
   				pmTypMand = 'T';
   			}	
   				
	   		// Change From 'F' to 'T'
	   		if (nlapiGetFieldValue('custrecord_pm_prod_not_found') == 'T'){
	 	   		nlapiSetFieldValue('custpage_pmc_item_selector', '', false, true);  // Unselect any values selected
		   		nlapiDisableField('custpage_pmc_item_selector', true);  // Protect field
		   		nlapiSetFieldValue('custrecord_pm_product', '', false, true); // Unselect any values stored
		   		nlapiGetField('custrecord_pm_product').setDisplayType('normal');
		   		if (pmTypMand == 'T'){
		   			nlapiSetFieldMandatory('custpage_pmc_item_selector', false);
		   			nlapiSetFieldMandatory('custrecord_pm_product', true);
		   		}
	   		}
	   		else{
	   			// Change from 'T' to 'F'
	   			nlapiSetFieldValue('custrecord_pm_product', '', false, true);  // Unselect any values selected
		   		nlapiGetField('custrecord_pm_product').setDisplayType('hidden');  // hide field
		   		nlapiDisableField('custpage_pmc_item_selector', false);  // Enable field
		   		if (pmTypMand == 'T'){
		   			nlapiSetFieldMandatory('custpage_pmc_item_selector', true);
		   			nlapiSetFieldMandatory('custrecord_pm_product', false);
		   		}
	   		}
		}
   	}
   	
   	// Sort out the Mandatory Flag On Product on Change of PM Type
   	if(name == 'custrecord_pm_type'){
   		// Only if not Web Services role
   		if (role != LC_Roles.WebServ)
		{
	        var pmType = nlapiGetFieldValue('custrecord_pm_type');
	        if (pmType == L_PM_ConvType.Win || pmType == L_PM_ConvType.Loss)
	        {  //Win, Loss
	        	if (nlapiGetFieldValue('custrecord_pm_prod_not_found') == 'T'){	        	
	        		nlapiSetFieldMandatory('custrecord_pm_product', true);
	        	}
	        	else{
	        	nlapiSetFieldMandatory('custpage_pmc_item_selector', true);
	        	}
	        }
	        else{
	        	if (nlapiGetFieldValue('custrecord_pm_prod_not_found') == 'T'){	        	
	        		nlapiSetFieldMandatory('custrecord_pm_product', false);
	        	}
	        	else{
	        	nlapiSetFieldMandatory('custpage_pmc_item_selector', false);
	        	}
	        } 
		}
    }
       
}

/*----------------------------------------------------------------------------------------------------------------
* Function   : CR_OppSearch(companyid)
* Description: Perform Opportunity Search used for filtering "Product Discussed" Item list 
* Input		 : Company Id
* Return	 : Search Results			
*            
 *-----------------------------------------------------------------------------------------------------------------*/
function CR_OppSearch(companyid)
{
	//	Search Opportunities connected to this Customer that are within a year (currently using date created or equivalent) 	
	var opp_filters = new Array();
	opp_filters[0] = new nlobjSearchFilter('internalid', 'customer', 'is', companyid);
	var opp_Results = nlapiSearchRecord('opportunity', 'customsearch_pm_conv_item_filter', opp_filters, null);
	
	return opp_Results;
}