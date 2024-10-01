// Script:    UserEvent_GobiAcct_before_load.js
// 
// Created by:  Eric Abramo		10-2019
//
// Purpose:  This beforeLoad script renders a new URL field in the GOBI Account record:  GOBI Sales FYTD Report
// 			The new field calls the Suitelet Suitelet_Access_Tableau which allows NetCRM to open a new iFrame Browser tab 
//			and will render an embedded Tableau report.  The paramter passed through the URL to the Suitelet - and subseq. to Tableau
//			is the GOBI Account Number
//
//
//	Library Scripts Used:   None
//
//
// Revisions: 
//
//----------------------------------------------------------------------------------------------------------------

function GobiAcct_BeforeLoad(type, form)
{
	if (type != 'create' && type != 'delete')
	{
		var this_record = nlapiGetRecordId();
		// lookup the GOBI BASE Account ID
		var gobiid = nlapiLookupField('customrecord_ybp_account', this_record, 'custrecord_ybpa_account_number_integer');
		// 10-04-19 EA: US543371 Link to Tableau for GOBI Revenue
		tableau_field4 = form.addField("custpage_tableau4", "url", "", null, null);
		tableau_field4.setDisplayType("inline").setLinkText( "GOBI Sales FYTD Report").setDefaultValue( "/app/site/hosting/scriptlet.nl?script=166&deploy=1&tabrpt=GOBIrev&gobiAcct="+gobiid+"");
		tableau_field4.setHelpText("Clicking the link below will open the GOBI Account's GOBI Fiscal-Year-To-Date Report.");
		form.insertField(tableau_field4, 'custrecord_ybpa_website');
	}
}
