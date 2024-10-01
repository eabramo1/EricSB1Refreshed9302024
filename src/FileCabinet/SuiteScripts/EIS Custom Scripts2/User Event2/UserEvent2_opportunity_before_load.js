/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
//
// Script:		UserEvent2_opportunity_before_load.js
// 		 		Written in SuiteScript 2.1
//
// Created by:	Pat Kelleher - July 2024
//
// Purpose:		Before Load UserEvent function
//				Renders eBook Quote Tool button and eBook Quote Tools Subject Set button
//
// Revisions:   08/23/2024  eAbramo     US1277423 SSO Replacement Defect fixes
//
define(['N/record', 'N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{dialog} dialog
 * @param{serverWidget} serverWidget
 */
    function(record, runtime, search, constant, L2Utility) {
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

            var record = scriptContext.newRecord; // current record
            var oppyFormType = record.getValue('custbody_oppty_form_type');
            var form = scriptContext.form;
            var salesOppyCust = record.getValue({fieldId: 'entity'});
            var user_id = runtime.getCurrentUser().id

            log.debug('1 runtime.executionContext is ', runtime.executionContext);

            // BEGIN Code to Render the eBook Quote Tools button using OAuth2.0 as part of Noreaster SSO project
            //Do not run code if Web Service Context
            if (runtime.executionContext != runtime.ContextType.WEBSERVICES)
            {
                log.debug('2 oppyFormType is ', oppyFormType);
                if(oppyFormType == constant.LC2_OppyFormType.ebookQuote) {
                    log.debug('3 salesOppyCust is ', salesOppyCust);
                    // Run through code if there is a Customer in the Customer field
                    if (L2Utility.LU2_isEmpty(salesOppyCust) == false){

                        if (scriptContext.type == 'view') {
                            var custlookup = search.lookupFields({
                                type: search.Type.CUSTOMER,
                                id: salesOppyCust,
                                columns: ['custentity_oeapproved', 'custentity_epCountry']
                            });

                            // TA929013 // below two If statements were all in one but separated into two separate if statements
                            // yielded "Cannot read property 'value' of undefined" due to the fact that custlookup.custentity_epCountry[0].value
                            // couldn't even be handled.  So by putting in two separate 'if' statements you won't get to the custlookup.custentity_epCountry[0].value
                            // line if you don't pass the first check which is OE Approval (as there can be no situation where a Customer would be OE approved
                            // and without an actual EP Country

                            // if (custlookup.custentity_oeapproved == true && constant.LC2_Country.isSalesRestricted(custlookup.custentity_epCountry[0].value) == false) {
                            // small change for US1277423 -- nesting of isSalesRestricted goes inside OE Approved because of code failure when there's NO EP Country
                            if (custlookup.custentity_oeapproved == true){
                                log.debug('custlookup.custentity_epCountry[0].value is '+custlookup.custentity_epCountry[0].value);
                                //	Must be OE Approved and in countries allowed by Sales
                                if (constant.LC2_Country.isSalesRestricted(custlookup.custentity_epCountry[0].value) == false) {
                                    //	Search to see if User is either a Sales or Support Rep
                                    var employeeLookup = search.lookupFields({
                                        type: search.Type.EMPLOYEE,
                                        id: user_id,
                                        columns: ['issupportrep', 'issalesrep']
                                    });
                                    log.debug('5 user_id is '+user_id , 'employeeLookup.issupportrep is '+employeeLookup.issupportrep+'. employeeLookup.issalesrep is '+employeeLookup.issalesrep);
                                    // Must be Sales or Support rep to get Quote Tool buttons
                                    if (employeeLookup.issupportrep == true || employeeLookup.issalesrep == true) {
                                        form.addButton({
                                            id: 'custpage_quoteTools',
                                            label: 'eBook Quote Tools',
                                            functionName: "sendQuoteToolRequest('"+salesOppyCust+"')" // must match function name in client2_Record_opportunity
                                        }); // end add first button
                                        form.clientScriptModulePath = 'SuiteScripts/EIS Custom Scripts2/Client2/Client2_Record_opportunity.js';

                                        // Build CRMIds subject set parameter for eBook Quote Tools Application to iterate through our line items and build the crm_ids query parameter
                                        var numItems = record.getLineCount({sublistId: 'item'});
                                        log.debug('6 numItems is '+numItems);
                                        if (numItems > 0) {	//	If items exist
                                            //	Init. crmIds
                                            var crmIds = "";
                                            for (var i = 0; i < numItems; i++) {
                                                var crmId = record.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    line: i
                                                });
                                                // for first time in loop crmIds is blank, just add the new crmId. For all other times add vertical bar to crmIds then then new crmId
                                                crmIds += (crmIds ? "|" : "") + crmId;
                                            } // end for loop
                                            // prevent error:  If over 3999 characters there's a suiteScript error
                                            crmIds = crmIds.substring(0, 3999);
                                            log.debug('9b crmIds is ' + crmIds);
                                            form.addButton({
                                                id: 'custpage_quoteToolsSubjectSet',
                                                label: 'eBook Quote Tools Subject Set',
                                                functionName: 'sendQuoteToolSubjectSetRequest("' + salesOppyCust + '","' + crmIds + '")'
                                                // functionName: `sendQuoteToolSubjectSetRequest(${salesOppyCust}, ${crmIds})`
                                            }); // end add second button
                                            form.clientScriptModulePath = 'SuiteScripts/EIS Custom Scripts2/Client2/Client2_Record_opportunity.js';
                                        } // end IF stmt numItems > 0
                                    } // employee lookup if stmt
                                } // EP Country is not Sales Restricted
                            } // custentity_oeapproved true
                        } // edit and view if stmt
                    } // utility function for salesOppyCust (existence of customer
                } // if ebook quote tool opportunity Form Type
            } // end if Web Svs Context
        } // end beforeLoad function


        return {
            beforeLoad: beforeLoad
        };

    });

