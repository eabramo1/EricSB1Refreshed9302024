/**
 *  library2_customer.js
 *  @NApiVersion 2.1
 */
//
//  Script: library2_customer.js
//
//  Created By: Zachary Scannell - June 2022
//
//  Purpose: This is a script file library of commonly used functions across many customer-related Suitescript 2.0 scripts.
//
// ----------------------------------------------------------------------------------------------------------------------------------
//  Functions Added:                Name:                   Date and Description:
//  transitionStatusChangedTo       ZScannell               2022-06-06  This function is used to determine if one of the customer's transition statuses has been changed to a specific value.
//  isECCustomer                    ZScannell               2022-06-06  This function is used to determine if one the customer is in EBSCO Connect or not.
//  isTransitionCustomer            ZScannell               2022-11-08  This function is used to determine if a customer is a Transition Customer.
//  isCeligoConsortiaHead           ZScannell               2023-08-01  This function is used to determine if a customer is a Celigo Consortia Head.
//  isFolioPartner                  ZScannell               2023-08-01  This function is used to determine if a customer is a FOLIO Partner.
//  isFOLIOconsortiaHead            JOliver                 2023-08-04  TA838825 Function used to determine if a customer is a parent customer in an EC Parent-Child record w FOLIO relationship type
// -----------------------------------------------------------------------------------------------------------------------------------
//  Revisions:
//
// -----------------------------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
    function(L2Constants, search){
    // --------------------------------------------------------------------------------------------------------
    //  Function Name: transitionStatusChangedTo
    //  Purpose:    This function is used to determine if one of the customer's transition statuses has been changed to a specific value.
    //  Input Parameters:
    //      oldRecordStatuses = A JSON of the old record's Transition Status Values
    //      newRecordStatuses = A JSON of the new record's Transition Status Values
    //      desiredValue = The desired transition status
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function transitionStatusChangedTo(oldRecordStatuses, newRecordStatuses, desiredValue){
        for (var key in oldRecordStatuses){
            if (oldRecordStatuses.hasOwnProperty(key) && newRecordStatuses.hasOwnProperty(key)){
                if (oldRecordStatuses[key] != newRecordStatuses[key] && newRecordStatuses[key] == desiredValue){
                    return true;
                    break;
                }
            }
        }
        return false;
    }

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: isTransitionCustomer
    //  Purpose:    This function is used to determine if a customer is a transition customer.
    //  Input Parameters:
    //      oldRecordStatuses = A JSON of the old record's Transition Status Values
    //      newRecordStatuses = A JSON of the new record's Transition Status Values
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isTransitionCustomer(transitionStatuses){
        var isTransition = false;
        // Seeing if Transition Statuses have changed
        for (var key in transitionStatuses){
            if (transitionStatuses.hasOwnProperty(key)){
                log.debug({
                    title: key,
                    details: transitionStatuses[key]
                });

                if (transitionStatuses[key] == L2Constants.LC2_Transition_sts.Complete || transitionStatuses[key] == L2Constants.LC2_Transition_sts.InProg){
                    isTransition = true;
                    break;
                }
            }
        }
        log.debug({
            title: 'isTransition',
            details: isTransition
        });
        return isTransition;
    };

        // --------------------------------------------------------------------------------------------------------
    //  Function Name: isECCustomer
    //  Purpose:    This function is used to determine if one the customer is in EBSCO Connect or not.
    //  Input Parameters:
    //      customerSFID : The SF Account ID on the Customer's record
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isECCustomer(customerSFID){
        return (customerSFID == null || customerSFID == '' || customerSFID == 'createNew') ? false : true;
    };

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: isCeligoConsortiaHead
    //  Purpose:    This function is used to determine if a customer is a Celigo Consortia Head.
    //  Input Parameters:
    //      companyId = The internal ID of the customer
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isCeligoConsortiaHead(companyId){
        var celigoSearch = search.create({
            type: 'customrecord_celigo_portal_acc_sites',
            filters: [
                search.createFilter({
                    name: 'custrecord_celigo_acc_site_parent',
                    operator: search.Operator.ANYOF,
                    values: companyId
                })
            ],
            columns: ['custrecord_celigo_acc_site_parent']
        }).run().getRange({start: 0, end: 1000});
        return (celigoSearch.length > 0);
    };

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: isFolioPartner (TA838825)
    //  Purpose:    This function is used to determine if a customer is a FOLIO Partner.
    //  Input Parameters:
    //      companyId = The internal ID of the customer
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isFolioPartner(companyId){
        var folioPartnerLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: companyId,
            columns: ['custentity_folio_partner']
        });
        return (folioPartnerLookup.custentity_folio_partner);
    };

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: isFOLIOconsortiaHead
    //  Purpose:    This function is used to determine if a customer is a FOLIO Consortia Head.
    //  Input Parameters:
    //      companyId = The internal ID of the customer
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isFOLIOconsortiaHead(companyId){
        var folioSearch = search.create({
            type: 'customrecord_ec_parent_child_rel',
            filters: [
                search.createFilter({
                    name: 'custrecord_ec_parent_customer',
                    operator: search.Operator.ANYOF,
                    values: companyId
                }),
                search.createFilter({
                    name: 'custrecord_ec_relationship_type',
                    operator: search.Operator.ANYOF,
                    values: L2Constants.LC2_ParentChildRelationshipType.FOLIO
                })
            ],
            columns: ['custrecord_ec_parent_customer']
        }).run().getRange({start: 0, end: 1000});
        return (folioSearch.length > 0);
    };

    return {
        transitionStatusChangedTo: transitionStatusChangedTo,
        isECCustomer: isECCustomer,
        isTransitionCustomer: isTransitionCustomer,
        isCeligoConsortiaHead: isCeligoConsortiaHead,
        isFolioPartner: isFolioPartner,
        isFOLIOconsortiaHead: isFOLIOconsortiaHead
    };
});