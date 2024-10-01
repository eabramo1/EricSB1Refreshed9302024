/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
/*
    Script: client2_suitelet_targetKeyAccountFieldHistoryForm.js

    Created by: kseares NS ACS

    Function: validation and search function on the Target/Key account notes Field History Suitelet
    
	Library Scripts Used:

    Revisions:
    kbseares	10/21/2019	script created
    FYap		11/15/2019	Added fieldId variable (relating to suitelet update to use field ID instead of field name)
*/

define(['N/url', 'N/currentRecord'],
    function(url, currentRecord) {

        function fieldChanged(context) {
          // Navigate to selected page
          if (context.fieldId == 'custpage_pageid') {
            var pageId = context.currentRecord.getValue({
              fieldId: 'custpage_pageid'
            });

            pageId = parseInt(pageId.split('_')[1]);

            document.location = url.resolveScript({
              scriptId: getParameterFromURL('script'),
              deploymentId: getParameterFromURL('deploy'),
              params: {
                'index': pageId
              }
            });
          }
          
        }
  		//Search field history using the selected filters
  		function doSearch(suiteletScriptId, suiteletDeploymentId) {
          var rec = currentRecord.get();
          //alert(suiteletScriptId);
          var dateFrom = rec.getValue({
            fieldId: 'custpage_date_from'
          });

          var dateTo = rec.getValue({
            fieldId: 'custpage_date_to'
          });
          var from = new Date(dateFrom);
          var to = new Date(dateTo);

          if(from > to){
            alert('Date To must be greater than Date From');
          }
          else{
            var rec = currentRecord.get();
            var customer = rec.getValue('custpage_customer');
            var field = rec.getText('custpage_field');
			var fieldId = rec.getValue('custpage_field')
            var dateFrom = rec.getText('custpage_date_from');
            var dateTo = rec.getText('custpage_date_to');
            var employee = rec.getValue('custpage_emp');
           	window.onbeforeunload = null;
            document.location = url.resolveScript({
                      scriptId : suiteletScriptId,
                      deploymentId : suiteletDeploymentId,
                      params : {
                          'customerId' : customer,
                          'field' : fieldId,
                          'dateFrom' : dateFrom,
                          'dateTo' : dateTo,
                          'employeeId' : employee,
                      }
                  });

          }
          
        }

        function getParameterFromURL(param) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return (false);
        }

        return {
            fieldChanged: fieldChanged,
            doSearch: doSearch
        };

    });