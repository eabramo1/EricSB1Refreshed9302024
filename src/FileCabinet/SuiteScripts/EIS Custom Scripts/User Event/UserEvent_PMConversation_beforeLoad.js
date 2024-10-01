/*
    Script: UserEvent_PMConversation_beforeLoad.js

    Created by: Christine Neale

    Function:  Before load actions for PM Customer Conversation Form
    
	Library Scripts Used:  library_constants.js
 	

    Revisions:  
    CNeale	05/12/2020	Original version
    CNeale	06/29/2020	US662522 Introduce "Product not on list" functionality

*/

function serverPMConBeforeLoad(type, form)
{
	var role = nlapiGetRole();
	
    // UI Context & not Web Services role
	if (nlapiGetContext().getExecutionContext() == 'userinterface' && role != LC_Roles.WebServ)
	{
		// Add Selector field to Form
		if (type == 'create' || type == 'edit')
		{
			// Item Selector Field - this field is populated/cleared via the Client Script
			var PMCItemSelector = form.addField('custpage_pmc_item_selector','select','Product Discussed',null,'main');
			form.insertField(PMCItemSelector,'custrecord_pm_prod_not_found');
 		}
		
		// Sort out fields to display/hide in View Mode
		if (type == 'view')
		{
			nlapiGetField('custrecord_pm_emp_not_found').setDisplayType('hidden');
			// Conducted By
    		if (nlapiGetFieldValue('custrecord_pm_emp_not_found') != 'T'){
    			nlapiGetField('custrecord_pm_conducted_by').setDisplayType('hidden');
    		}
    		else{
    			nlapiGetField('custrecord_pm_conducted_by_list').setDisplayType('hidden');
    		}

    		// Contact Fields
    		nlapiGetField('custrecord_pm_contact_not_found').setDisplayType('hidden'); // Contact not found
    		if (nlapiGetFieldValue('custrecord_pm_contact_not_found')!= 'T'){
    			nlapiGetField('custrecord_pm_contactnotfound').setDisplayType('hidden'); // Contact text field
    			nlapiGetField('custrecord_pm_contact_phone').setDisplayType('hidden');   // Contact text phone
    			nlapiGetField('custrecord_pm_contact_title').setDisplayType('hidden');   // Contact text title
    		}
    		else if(!nlapiGetFieldValue('custrecord_pm_contact')){
    			nlapiGetField('custrecord_pm_contact').setDisplayType('hidden'); // Contact 
    		}

    		// Product Discussed
    		if (!nlapiGetFieldValue('custrecord_pm_product')){
    			nlapiGetField('custrecord_pm_product').setDisplayType('hidden');  // Product Discussed
    			nlapiGetField('custrecord_pm_prod_not_found').setDisplayType('hidden'); // US662522 Product Not Found
    		}
    	}
	}
}