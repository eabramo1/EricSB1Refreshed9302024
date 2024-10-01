// Script:    Suitelet_Access_Tableau.js
// 
//
// Created by:  Kate McCormack (unknown date - though probably in 2018)
//
// Purpose:  This suitelet allows NetCRM to open a new iFrame Browser tab and render an embedded Tableau report
//			The Suitelet can handle opening different Tableau reports using the rptname parameter
//      	This suitelet can accommodate different customer/account paramters to be passed to Tableau through the URL
//
//Library Scripts Used:   None
//
//
// Revisions:  
//		10-2019		eAbramo		Added Tableau report link for GOBI FY Revenue - at the GOBI Account level
//								Note that this URL seems to relate to FY20 only - and will likely have to change for the next FY
//		4/13/2020	joliver		US629646 Comment out link to Tableau Euro Revenue Report (originally added under US279236)
//  	6/2/21		PKelleher	US802999 Comment out code re Link to Tableau field and URL - created new custentity field that contains Link to Customer Dashboard new URL
//
//
//----------------------------------------------------------------------------------------------------------------

function custTableauSuitelet(request, response)
{
	if ( request.getMethod() == 'GET' )  {
		
		nlapiLogExecution('debug', 'Starting GET custTableauSuitelet');
	    
		//Initialize variables
	    var form = '';
	    var url = '';
	    
	    // Get the CustID from the parameter string
		var custid = request.getParameter('custId');
		var gobiid = request.getParameter('gobiAcct');
		
		// Get the Tableau report name from the parameter string
		var rptname = request.getParameter('tabrpt');
		
		nlapiLogExecution('debug', 'Requested custId= ' + custid + ' ;  reportName = '+ rptname); 
		
		/*US802999 Comment out code re Link to Tableau field and URL - created new custentity field that contains Link to Customer Dashboard new URL
		//Set the form title and Tableau url variables according to which report was requested
		// Tableau Customer Usage Report
		if (rptname == 'usage') {
			form = nlapiCreateForm('Customer Product Usage Report');
	        url = 'https://tableau.epnet.com/views/CustomerProductUsageReport/CustomerProductUsageReport?:embed=yes&Custid='+custid;
	        nlapiLogExecution('debug', 'Embed: ' + url.substring(31) ); 
		}   end Comment out for Link to Tableau code US802999      */
		
		/*  US629646 joliver commenting out the following:  
		//Tableau Euro Revenue Report -- US279236 eabramo added 9-05-2017
		if (rptname == 'eurorevenue') {
			form = nlapiCreateForm('Customer Euro Revenue Report'); 
	        url = 'https://tableau.epnet.com/views/Mainframeorders-Euroinvoices/MainFrameorders-Euro?:embed=yes&CustID='+custid; 
	        nlapiLogExecution('debug', 'Embed: ' + url.substring(31) ); 
		}
		*/
		// Tableau Subscriptions Fiscal Volume Report -- US295939 joliver added 12-13-2017
		if (rptname == 'subscriptions') {
			form = nlapiCreateForm('Subscriptions Fiscal Volume Report');
	        url = 'https://tableau.epnet.com/views/SSDHistoricSales/SSDHistoricSales?:embed=yes&Net%20CRMID='+custid;
	        nlapiLogExecution('debug', 'Embed: ' + url.substring(31) );
	       	}
	  // Tableau GOBI FYTD Volume Report used the parameter GOBIrev
		if (rptname == 'GOBIrev') {
			form = nlapiCreateForm('GOBI Fiscal Year To Date Report');
	        url = 'https://tableau.epnet.com/views/GOBISalesFYTD20/GOBISalesDashboardFYTD20?:embed=yes&Customer%20Base%20Acct='+gobiid;
	        nlapiLogExecution('debug', 'Embed: ' + url.substring(31) );
		}
		
	    var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
	    var iFrame = form.addField('custpage_tableau_connect', 'inlinehtml', 'Adding connection Field to Form');
	    
	    iFrame.setDefaultValue (content);
	    iFrame.setLayoutType('outsidebelow', 'startcol');
	    response.writePage( form );
	    
	    nlapiLogExecution('debug', 'Leaving custTableauSuitelet');
	}
}

