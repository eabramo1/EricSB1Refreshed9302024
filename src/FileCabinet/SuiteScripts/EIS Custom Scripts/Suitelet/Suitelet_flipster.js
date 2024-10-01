function flipsterOrderSuitelet(request, response)
{
            if ( request.getMethod() == 'GET' )
            {
                        //Create a form.
                        var form = nlapiCreateForm('Send Flipster Order To Customer');
                        // var label = form.addField('custpage_quote_label', 'inlinehtml', 'Test Flipster Order); 
			// label.setDefaultValue ('<b>Check out my SSO Suitelet for Flipster</b>');                     
                        var url = nlapiOutboundSSO('customsso_flp_order');
                        var optyId = request.getParameter('opportunityId');
                        url = url + '&opportunityId=' + optyId;
                        var content = '<iframe src="'+url+'" align="center" style="width: 1400px; height: 2000px; margin:0; border:0; padding:0"></iframe>';
                        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'Adding SSO Field 1 to Form');
                        iFrame.setDefaultValue (content);
                        iFrame.setLayoutType('outsidebelow', 'startcol');
                        response.writePage( form );
            }
}
