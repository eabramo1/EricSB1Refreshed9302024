/*
 * ******************************************************************************************************************************** 
 * Script file name: 		client_opportunity_wsr_retired.js
 * 
 *			New client script created in September of 2019 with goal to retire the WSR Opportunity form
 *
 *			Why needed?  Because even with the WSR Opportunity form inactivated (inactivated in 09/2019), users still 
 * 			have the ability to get to the form if they open an opportunity which was previously created in the WSR 
 *			Opportunity form - and then click edit.  Code in this client script is simple - don't allow a save
 *
 *
 *
 *
 * ********************************************************************************************************************************
 */

function opptyFormWSRInit()
{
	if (nlapiGetRole() != LC_Roles.Administrator)
	{
		alert('This Opportunity was created in a deprecated form.  You will not be able to save.  If you need to edit this Opportunity please change the form or contact the EBSCO Sales Operations team.');
	}
	else if (nlapiGetRole() == LC_Roles.Administrator)
	{
		alert('Administrator Role warning: All WSR Opportunity form validation has been removed.  Save this record at your own risk');
	}		
}



function oppty_wsrSave()
{
	if (nlapiGetRole() != LC_Roles.Administrator)
	{
		alert('Error: This Opportunity was created in a deprecated form.  This record will not be saved.  If you need to edit this Opportunity please change the form or contact the EBSCO Sales Operations team.');
		return false;
	}
	else
	{
		return true;
	}		
}