/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
/* Script:   Scheduled2_customer_folioUnset.js
 *
 * Purpose:  This script runs a SuiteQL search that searches for Customers flagged as FOLIO Customers who do NOT have an active (<90 days from expiration)
 *               Accessing Item where they are either an "Accessing Site" or "Purchasing Site" and unsets the flag.
 *
 * Created by: Jeffrey Oliver (Refactoring of Scheduled_customer_folioUnset by Christine Neale) 05-2024
 *
 * Revisions:
 *  --------------------------------------  FROM ORIGINAL SCRIPT ----------------------------------------------------------------------------------
*   CNeale			01/06/2022	US893691 Original version
*   eAbramo			09/16/2022	TA754012 (of US1010164) Fix Defects for EBSCO Connect ReArch (Setting/Unsetting the Contact's FOLIO Access Status field)
 *  --------------------------------------  FROM ORIGINAL SCRIPT ----------------------------------------------------------------------------------
 *  JOliver     05/08/2024  US1240270   Refactoring of original code + Addition of "FOLIO Hosted by EBSCO" logic
 *  ZScannell   06/14/2024  US1274656   Adjusting the search to use runSuiteQL instead of runSuiteQLPaged + changes to iterator logic to support this change. (Offers JSON parsing w/ key = fieldId)
*/

define(['N/log', 'N/query', 'N/record', 'N/email', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
    (log, query, record, email, L2Constants) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

            log.audit('<---- Script Start: Scheduled2_customer_folioUnset----->');

            var updLimit = 1000; // Limit of no. of updates - governed by both Governance limits (10,000) and Boomi Considerations (1,000)
            var updCount = 0; // Count of no. of updates
            var emailSent = false; // Indicates whether error email sent
            var LC2_email = L2Constants.LC2_Email; // Global variable holding emails
            var LC2_emp = L2Constants.LC2_Employee;  // Global variable holding Employee IDs

            const foliocust_sql =
                // Looking for all customers with FOLIO customer flag set to true, but with no active FOLIO subs (purchasing or accessing)
                // Grab the Cust IDs (Note: Submission of SF Acct ID needed to trigger logic in UserEvent Cust After Submit TA754012 (of US1010164))
                "SELECT cust.id, cust.custentity_sf_account_id " +
                "FROM CUSTOMER cust " +
                // FOLIO Customers flag set to true
                "WHERE cust.custentity_folio_cust = 'T' " +
                // Ensure customer is not an Accessing Site on an active FOLIO accessing item
                //uses mapping table for one-to-many access site relationships
                //also joins to item to allow for wildcard search of item name
                "AND cust.id NOT IN ( " +
                "    SELECT asmap.maptwo AS customer_id " +
                "    FROM CustomRecord60 accitem, MAP_customrecord60_custrecord_ai_sites asmap, item i " +
                "    WHERE accitem.id = asmap.mapone " +
                "    AND accitem.custrecord_ai_item = i.id " +
                "    AND i.displayname LIKE '%FOLIO%' " +
                //  Accessing Item contract start is on or before today
                "    AND accitem.custrecord_ai_begin <= TRUNC(SYSDATE) " +
                //  Accessing Item contract end is greater than 3 months ago (grace period)
                "    AND accitem.custrecord_ai_end > ADD_MONTHS(TRUNC(SYSDATE), -3) " +
                ") " +
                // Ensure the customer is not a Purchasing Site on a Sales Order for a FOLIO item
                "AND cust.id NOT IN ( " +
                "   SELECT distinct trans.entity " +
                "   FROM TRANSACTION trans, item i, transactionLine tl " +
                "   WHERE  trans.id =tl.transaction " +
                "   AND tl.item = i.id " +
                "   AND i.displayname LIKE '%FOLIO%' " +
                "   AND tl.custcol_subscriptionbegindate <= TRUNC(SYSDATE) " +
                "   AND tl.custcol_subscriptionexpiredate > ADD_MONTHS(TRUNC(SYSDATE), -3) " +
                ")";

            //  For each page of results returned
            //  US1274656   -   Edits to handle runSuiteQL query method
            try {
                const queryObj_folioCust = query.runSuiteQL({
                    query: foliocust_sql
                });
                const results_folioCust = queryObj_folioCust.asMappedResults();
                results_folioCust.forEach(result => {
                    /*log.debug({
                        title: 'Customer ID to uncheck FOLIO Customer: ',
                        details: result.id
                    });
                    log.debug({
                        title: 'Customer SFID to uncheck FOLIO Customer: ',
                        details: result.custentity_sf_account_id
                    });*/
                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: result.id,
                        values:{
                            custentity_sf_account_id: result.custentity_sf_account_id,
                            custentity_folio_cust: false
                        }
                    });
                    log.audit({
                        title: 'Unchecked FOLIO Customer checkbox for',
                        details: result.id
                    });
                    updCount += 1;
                    return (updCount < updLimit)
                })
            }catch (e) {
                log.error({
                    title: 'Error: ' + e.name,
                    details: e
                });
                if (emailSent == false) {
                    email.send({
                        author: LC2_emp.MercuryAlerts,
                        recipients: LC2_email.CRMEscalation,
                        subject: 'Scheduled2 Customer FOLIO Unset Encountered an Issue Unsetting the "FOLIO Customer" flag.',
                        body: 'There was a problem unsetting the "FOLIO Customer" flag for at least one Customer (Id: ' + result.id + ') <BR><BR> Please unset the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Unset" to update any other Customers also logged in error.'
                    });
                    emailSent = true;
                }
            }
            //  End of FOLIO Customer Unset
            //  Start of EBSCO Hosted FOLIO Unset
            log.audit({
                title: "updCount",
                details: updCount
            });
            if (updCount < updLimit){
                const foliohost_sql =
                    "SELECT cust.id, cust.custentity_sf_account_id " +
                    "FROM CUSTOMER cust " +
                    "WHERE cust.custentity_folio_hosted_by_ebsco = 'T' " +
                    "AND cust.id NOT IN ( " +
                    "    SELECT asmap.maptwo AS customer_id " +
                    "    FROM CustomRecord60 accitem, MAP_customrecord60_custrecord_ai_sites asmap " +
                    "    WHERE accitem.id = asmap.mapone " +
                    "    AND accitem.custrecord_ai_item = '8691' " +
                    "    AND accitem.custrecord_ai_begin <= TRUNC(SYSDATE) " +
                    "    AND accitem.custrecord_ai_end > ADD_MONTHS(TRUNC(SYSDATE), -3) " +
                    ") " +
                    "AND cust.id NOT IN ( " +
                    "   SELECT distinct trans.entity " +
                    "   FROM TRANSACTION trans, transactionLine tl " +
                    "   WHERE trans.id =tl.transaction " +
                    "   AND tl.custcol_subscriptionbegindate <= TRUNC(SYSDATE) " +
                    "   AND tl.custcol_subscriptionexpiredate > ADD_MONTHS(TRUNC(SYSDATE), -3) " +
                    "   AND tl.item = '8691' " +
                    ")";
                //  US1274656   -   Edits to handle runSuiteQL query method
                try {
                    const queryObj = query.runSuiteQL({query: foliohost_sql});
                    const results = queryObj.asMappedResults();
                    results.forEach(result => {
                        /*log.debug({
                            title: 'Customer ID to uncheck FOLIO Hosted By EBSCO: ',
                            details: result.id
                        });
                        log.debug({
                            title: 'Customer SFID to uncheck FOLIO Hosted by EBSCO: ',
                            details: result.custentity_sf_account_id
                        });*/
                        try{
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: result.id,
                                values: {
                                    custentity_folio_hosted_by_ebsco: false,
                                    custentity_sf_account_id: result.custentity_sf_account_id
                                }
                            });
                            updCount = updCount + 1;
                            log.audit({
                                title: 'FOLIO Hosted by EBSCO flag successfully unset',
                                details: 'Customer: ' + result.id
                            });
                        }catch (e) {
                            log.error({
                                title: e.name,
                                details: e
                            });
                            log.error('FOLIO Hosted by EBSCO Flag Unset error Customer ID ', result.id);
                            // email just once if errors in run
                            if (emailSent == false) {
                                email.send({
                                    author: LC2_emp.MercuryAlerts,
                                    recipients: LC2_email.CRMEscalation,
                                    subject: 'Scheduled2 Customer FOLIO Unset Encountered an Issue Unsetting the "FOLIO Hosted by EBSCO" flag.',
                                    body: 'There was a problem unsetting the "FOLIO Hosted by EBSCO" flag for at least one Customer (Id: ' + result.id + ') <BR><BR> Please unset the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Unset" to update any other Customers also logged in error.'
                                });
                                emailSent = true;
                            }
                        }
                        return (updCount < updLimit)
                    })
                }
                catch (e) {
                    log.error({
                        title: e.name,
                        details: e
                    });
                }
            }
            log.audit('<---- Script End: Scheduled2_customer_folioUnset----->');
        }

        return {execute}

    });