/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*
    Script: UserEvent2_salesorder_before_load.js

    Created by: Will Clark
    Function: Script that runs before the Sales Order page is loaded
              As of creation, this is just a button that redirects to the Supporting Documents page

	Library Scripts Used:  N/A

    Revisions:
    wClark  	8/8/2024	Script created
*/


define(['N/search', 'N/runtime', 'N/ui/serverWidget', 'N/log'], // Include the N/log module
    function (search, runtime, serverWidget, log) {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        function beforeLoad(scriptContext) {
            let form = scriptContext.form;
            let newRecord = scriptContext.newRecord;

            // Get the value of EBSCO Contract #
            let orderNumber = newRecord.getValue({ fieldId: 'custbody_ordernumber' });

            
            if (runtime.executionContext != runtime.ContextType.WEBSERVICES)  //Add Web Service context exclusion to this code
            {
                if (scriptContext.type == 'edit' || scriptContext.type == 'view') { // Only add the button if the record is in view or edit mode
                    form.addButton({
                        id: 'custpage_send_to_supporting_docs',
                        label: 'Supporting Documents',
                        functionName: "accessSuppDocs('" + orderNumber + "')"
                    });
                    form.clientScriptModulePath = 'SuiteScripts/EIS Custom Scripts2/Client2/Client2_Record_sales_order.js'; // Add the path to the client script, has to be after adding button
                }
            }
        }

        return {beforeLoad: beforeLoad};
    });