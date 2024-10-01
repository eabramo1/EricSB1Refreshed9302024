/*
 * **********************************************************************************************************************************************************
 * 
 * Script:  Suitelet_wsr
 * 
 * Function: Handles SuiteSignOn Integration Displays into Nor'Easter applications
 * 
 * Revisions:
 * 		KMccormack	02-21-18 -  US302111 - Add new method wsrWriteMLOSuitelet() which will call a WSR rest endpoint to add the existing MLO item into
 * 								WinSeR. The rest endpoint then redirects internally to the Customer Item Activity page which is then returned and displayed
 * 								to the NetCRM user in an iframe. A new SuiteSignOn setup called "WinSeR Write MLO" was created for this authenticated integration.  
 * 		eAbramo		01-28-22 -  US856349 - Product Target Push to WinSer: Modify Request/Suitelet that pushes PTC and MLO Item into WinSer
 * 
 * **********************************************************************************************************************************************************
 */

/*
 * function wsrQuoteSuitelet deprecated September 2019
function wsrQuoteSuitelet(request, response)
{
            if ( request.getMethod() == 'GET' )

            {
                        //Create a form.
                        var form = nlapiCreateForm('WSR - Make Quote');
                        //var label = form.addField('custpage_quote_label', 'inlinehtml', 'Test WSR Label Make Quote'); 
                       // label.setDefaultValue ('<b>Check out my SSO Suitelet for WSR! THIS IS FOR QUOTES</b>');    
                       
                        var url = nlapiOutboundSSO('customsso_wsr_quote');
                        var optyId = request.getParameter('opportunityId');
                        url = url + '&opportunityId=' + optyId;
                        var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
                        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 1 to Form');
                        iFrame.setDefaultValue (content);
                        iFrame.setLayoutType('outsidebelow', 'startcol');
                        response.writePage( form );
            }
}
*/

/*
 *  function  wsrOrderSuitelet deprecated September 2019
function wsrOrderSuitelet(request, response)
{
            if ( request.getMethod() == 'GET' )

            {
                        //Create a form.
                        var form = nlapiCreateForm('WSR - Start Order');
                        //var label = form.addField('custpage_order_label', 'inlinehtml', 'Test WSR Label Start Order'); 
                        //label.setDefaultValue ('<b>Check out my SSO Suitelet for WSR! THIS IS FOR ORDERS</b>');    
                        var url = nlapiOutboundSSO('customsso_wsr_order');
                        var optyId = request.getParameter('opportunityId');
                        url = url + '&opportunityId=' + optyId;
                        var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
                        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 2 to Form');
                        iFrame.setDefaultValue (content);
                        iFrame.setLayoutType('outsidebelow', 'startcol');
                        response.writePage( form );
            }
}
*/

/*
 * function wsrOdvSuitelet deprecated September 2019
function wsrOdvSuitelet(request, response)
{
            if ( request.getMethod() == 'GET' )

            {
                        //Create a form.
                        var form = nlapiCreateForm('WSR - Order Document Viewer');
                       // var label = form.addField('custpage_odv_label', 'inlinehtml', 'Test WSR Label Order Document Viewer'); 
                       // label.setDefaultValue ('<b>Check out my SSO Suitelet for WSR! This is the Order Document Viewer</b>');    
                        var url = nlapiOutboundSSO('customsso_wsr_odv');                      
                        var custId =  request.getParameter('custId');
                        url = url + '&custId=' + custId;                        
                        var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
                        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 3 to Form');
                        iFrame.setDefaultValue (content);
                        iFrame.setLayoutType('outsidebelow', 'startcol');
                        response.writePage( form );
            }
}
*/

function wsrCiaSuitelet(request, response)
{
            if ( request.getMethod() == 'GET' )

            {          
                        //Create a form.
                        var form = nlapiCreateForm('WinSeR');
                       // var label = form.addField('custpage_odv_label', 'inlinehtml', 'Test WSR Label Customre Item Activity'); 
                       // label.setDefaultValue ('<b>Check out my SSO Suitelet for WSR! This is the Customer Item Activity</b>');    
                        var url = nlapiOutboundSSO('customsso_customer_item_activity');                      
                        var custId =  request.getParameter('cid');
                        url = url + '&cid=' + custId;                        
                        var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
                        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 4 to Form');
                        iFrame.setDefaultValue (content);
                        iFrame.setLayoutType('outsidebelow', 'startcol');
                        response.writePage( form );
                             
            }
}


function wsrWriteMLOSuitelet(request, response)
{       
		//US302111 - KM - 02-02-18: Add new method wsrWriteMLOSuitelet() which will call a WSR rest endpoint to add the existing MLO item into
		//WinSeR. The rest endpoint then redirects internally to the Customer Item Activity page which is then returned and displayed to the NetCRM user in an iframe. 
			if ( request.getMethod() == 'GET' )			
			{  			
					nlapiLogExecution('debug', 'Starting wsrWriteMLOSuitelet');      
             
		        	//Create a form.
		            var form = nlapiCreateForm('WinSeR');
		            var url = nlapiOutboundSSO('customsso_winser_write_mlo');
		            
		            nlapiLogExecution('debug', 'initial outboundSSO url', url);        
		           
		            var opptyId = request.getParameter('opptyId');
		            var customerId = request.getParameter('cid');
		            var prdOffId = request.getParameter('prdOffId');
		            var idType = request.getParameter('idType'); // Added US856349 01-28-22

		            // The format of the returned nlapiOutboundSSO link is: 
		            // 		https://qa-wsr.epnet.com/WSR/api/item/createItem/?oauth_token=..&cpt=wnsrmlo&dc=..&env=SANDBOX
		            // But, we need the REST endpoint URL that we're going to call in the format of:
		            // Prior to 01-28-2022 (prior to US856349) this was:
		            //			https://qa-wsr.epnet.com/WSR/api/item/createItem/{customerId}/{prdOffId}/{opptyId}?oauth_token=..&cpt=wnsrmlo&dc=..&env=SANDBOX   
		            // As of 02-28-2022 (with US856349 changes) the idType parameter has been added in (with value of either mloId or campaignId):
		            //			https://qa-wsr.epnet.com/WSR/api/item/createItem/{customerId}/{prdOffId}/idType/{opptyId}?oauth_token=..&cpt=wnsrmlo&dc=..&env=SANDBOX
		            // So we need to do some reformatting of the url string.
		            var parmStartIndex = url.indexOf('?');
		            var urlValue = url.substring(0, parmStartIndex);
		            var parmsValue = url.substring(parmStartIndex);
		            
		            //nlapiLogExecution('debug', 'parmStartIndex', parmStartIndex);
		            //nlapiLogExecution('debug', 'urlValue', urlValue);
		            //nlapiLogExecution('debug', 'parmsValue', parmsValue);            
	            
		            var endPointUrl = urlValue + '/' + customerId + '/' + prdOffId + '/' + idType + '/' + opptyId + parmsValue + '&cid=' + customerId;
		            url = endPointUrl;
		           
		            nlapiLogExecution('debug', 'iframe mlo src url', url);          
		            
		            /*****************************************************************************/
		            /* CALL THE WSR REST ENDPOINT FROM THE BROWSER - IFRAME                      */
		            /*****************************************************************************/
		            var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
		            var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 5 to Form');
		            iFrame.setDefaultValue (content);
		            iFrame.setLayoutType('outsidebelow', 'startcol');
		            response.writePage( form );
		            /*****************************************************************************/
         	
		            nlapiLogExecution('debug', 'Leaving wsrWriteMLOSuitelet');
            }
}