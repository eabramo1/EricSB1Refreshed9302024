/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//-------------------------------------------------------------------------------------
// Script:                  client2_eis_account.js
//
// Library File(s) used:    library2_constants.js, library2_utility.js
//
// Purpose:                 This script is used for the EIS Account custom record which shows on the Customer record's EIS Account subtab.
//                          Note: there are 4 custom forms:  (1) Administrator EIS Custom form used by Administrator role // (2) Advanced EIS Custom Form used by both
//                          Support Admin & Support Manager roles // (3) Custom EIS Account form, used by those other roles allowed to edit a few fields on the
//                          EIS Account record // (4) Custom WebServices EIS Account Form.  Each form has different fields available to that specific role.
//
// Refactored by Pat Kelleher March 2024 - original client_eis_account.js script to be inactivated.
//
// Revision History:
//
//
//-------------------------------------------------------------------------------------


define(['N/record', 'N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

function(record, runtime, search, constant, utility) {

     var allowSave = true;

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

        var role = runtime.getCurrentUser().role;
        var record = scriptContext.currentRecord;
        var EisProduct = record.getValue({fieldId: 'custrecord_eis_product'});
        var user = runtime.getCurrentUser();
        var mode = scriptContext.mode;


        // Note: only a few roles can create an EIS account by going to Lists > Custom > EIS Acct (for admins).  Otherwise, all EIS accounts are created via an SSD automated data feed.
        if(mode == 'create'){
            // set EIS Product to User Services/Unknown EIS Customer ID (id=7)
            // if mode is create and role is not the following, do not allow creation of EIS Account records:
            if(role != constant.LC2_Role.Administrator && role != constant.LC2_Role.EPSalesAdmin && role != constant.LC2_Role.EPSupAdmin && role != constant.LC2_Role.EPSupMngr && role != constant.LC2_Role.SSEOffices && role != constant.LC2_Role.SSEUKSuppRep){
                alert('Your role is not authorized to create new EIS Account records.  Please contact a Support Manager or Sales Operations.  You will not be able to save this record' );
                allowSave = false;
            }
            else{
                record.setValue({fieldId: 'custrecord_eis_product', value: constant.LC2_EISProdType.UserSvsUnknownEIS});
            }
            // If role is not EP Support Manager or Admin, then lock EIS Product field on create
            if(role != constant.LC2_Role.EPSupMngr && role != constant.LC2_Role.Administrator){
                record.getField({fieldId: 'custrecord_eis_product'}).isDisabled = true;
            }
        } // end if mode is create section

        else if(mode != 'create'){
            // then lock down these 3 fields for everyone including Admin and Support Mgr roles
            record.getField({fieldId: 'custrecord_eis_account_no'}).isDisabled = true;
            record.getField({fieldId: 'custrecord_eis_customer_id'}).isDisabled = true;
            record.getField({fieldId: 'custrecord_eis_product'}).isDisabled = true;

        }
    } // end pageInit function

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

        if(allowSave == false){
            alert('Your role cannot create new EIS Account records.  Please contact Sales Operations or a Support Manager for assistance.');
            return false;
        }
        var record = scriptContext.currentRecord;
        var EPCust = record.getValue({fieldId: 'custrecord_eis_account_customer'}); // EP Customer field
        var EPCustText = record.getText({fieldId: 'custrecord_eis_account_customer'});
        var prodType = record.getValue({fieldId: 'custrecord_eis_product'});
        var EISCustId = record.getValue({fieldId: 'custrecord_eis_customer_id'});
        var EISAcctNo = record.getValue({fieldId: 'custrecord_eis_account_no'});
        var recordId = scriptContext.currentRecord.id;
        var EPInactive = record.getValue({fieldId: 'custrecord_eis_ep_inactive'});
        var fieldID = scriptContext.fieldId;
        // utility function used to set the record id to zero to handle null during create
        if (utility.LU2_isEmpty(recordId) == true) {
            recordId = 0};

        // Require the EIS Product Customer ID if the ProductType is not User Services Mainframe (7) & EIS Customer ID is empty
        if(prodType != constant.LC2_EISProdType.UserSvsUnknownEIS && utility.LU2_isEmpty(EISCustId) == true){
            alert('EIS Account records for AtoZ, EBSCONET, EJS, EBS, and Marketplace require an EIS Product Customer ID and EIS Account Number.');
            return false;
        }

        //Require an EIS Account Number if the ProductType is not User Services Mainframe (7) & EIS Account # is empty
        if(prodType != constant.LC2_EISProdType.UserSvsUnknownEIS && utility.LU2_isEmpty(EISAcctNo) == true){
            alert('EIS Account records for AtoZ, EBSCONET, EJS, EBS, and Marketplace require an EIS Product Customer ID and EIS Account Number.');
            return false;
        }

        // Making isInactive flag to true because the data loader doesn't pick up this record when the Product Type is User Services Unknown
        if(EPInactive == true && prodType == constant.LC2_EISProdType.UserSvsUnknownEIS){
            record.setValue ({fieldId: 'isinactive', value: true});
        }

        // Only run through following code (which includes IsUpdated flag!!!!) if Product Type is not empty and not User Svs/Unknown
        if (utility.LU2_isEmpty(prodType) == false && prodType != constant.LC2_EISProdType.UserSvsUnknownEIS){  // beginning of Main IF stmt
            // If Product Type is AtoZ, and Company fields are populated, and AtoZ id is populated then verify that only one EP Customer is mapped to all EIS Accounts having the same AtoZ ID
            if (prodType == constant.LC2_EISProdType.AtoZ && utility.LU2_isEmpty(EPCust) == false && utility.LU2_isEmpty(EISCustId) == false){ // start inside IF statement
                // search all EIS Account Records with this AtoZ ID - different EP Customer
                // SEARCH to use - https://392875-sb1.app.netsuite.com/app/common/search/search.nl?cu=T&e=T&id=62446 to get EIS Acct for testing Error A
                // PURPOSE OF ERROR A :: WHEN EIS PRODUCT = AtoZ, then EP Customer & EIS Customer ID has to be 1-1 (meaning have to match NO MATTER how many records there are, i.e. the EP Customer & EP Customer ID has to be the exact same all the time)
                var AtoZeisAcctSearch = search.create({
                    type: 'customrecord_eis_account',
                    filters:[
                        search.createFilter({name: 'custrecord_eis_customer_id', operator: search.Operator.IS, values: EISCustId}),
                        search.createFilter({name: 'id', operator: search.Operator.NOTEQUALTO, values: recordId}),
                        search.createFilter({name: 'custrecord_eis_account_customer', operator: search.Operator.NONEOF, values: EPCust}),
                        search.createFilter({name: 'custrecord_eis_product', operator: search.Operator.ANYOF, values: constant.LC2_EISProdType.AtoZ}),
                        search.createFilter({name: 'custrecord_eis_account_customer', operator: search.Operator.NONEOF, values: '@NONE@'})
                    ],
                    columns: [
                        search.createColumn({name: 'id', label: 'Internal ID'})
                    ]
                }).run().getRange({start: 0, end: 2}).length;
                // If there are results...
                if(AtoZeisAcctSearch > 0)
                {
                    alert('Error A: This record\'s EP Customer must match the EP Customer of all other EIS Accounts with an AtoZ ID of: '+EISCustId+'. Search for all EIS Accounts with this AtoZ ID and use the same EP Customer.  This record will not be saved.');
                    return false;
                } // END AtoZeisAcctSearch search section

                // ALSO search all EIS Account Records with this EP Customer - different AtoZ ID
                // To test, find an EIS Account customer that has an A-Z product type, get the EP Cust ID associated to that and then get the A-Z ID associated to that.
                // then Create a new EIS acct (created id=1792879) with Product Type = A-Z.  Put the same EP customer on it (benedict) as above and then a different A-Z ID (i.e. different EIS Cust ID) and error should populate.
                var EPCustDiffAtoZid = search.create({
                    type: 'customrecord_eis_account',
                    filters:[
                        search.createFilter({name: 'custrecord_eis_account_customer', operator: search.Operator.ANYOF, values: EPCust}),
                        search.createFilter({name: 'id', operator: search.Operator.NOTEQUALTO, values: recordId}),
                        search.createFilter({name: 'custrecord_eis_product', operator: search.Operator.ANYOF, values: constant.LC2_EISProdType.AtoZ}),
                        search.createFilter({name: 'custrecord_eis_customer_id', operator: search.Operator.ISNOT, values: EISCustId})
                    ],
                    columns: [
                        search.createColumn({name: 'id', label: 'Internal ID'})
                    ]
                }).run().getRange({start: 0, end: 2}).length;

                if(EPCustDiffAtoZid > 0)
                {
                    alert('Error B: There can only be one EP Customer per AtoZ ID.  The EP Customer '+EPCustText+' matches an EIS Account with a different AtoZ ID.  You must map this record to different EP Customer or create a new EP Customer.  This record will not be saved');
                    return false;
                } // end EPCustDiffAtoZid search section

            }  // end inside IF statement

            // If EIS Accounts already exist with same three Primary Key fields, don't allow save
            // Test by creating a new EIS Account record with same EIS CustID, same EIS Product and same EP Customer as an existing one and save.  Should return error.
            var EISAcctSamePrimary = search.create({
                type: 'customrecord_eis_account',
                filters:[
                    search.createFilter({name: 'custrecord_eis_customer_id', operator: search.Operator.IS, values: EISCustId}),
                    search.createFilter({name: 'custrecord_eis_product', operator: search.Operator.ANYOF, values: prodType}),
                    search.createFilter({name: 'custrecord_eis_account_no', operator: search.Operator.IS, values: EISAcctNo}),
                    search.createFilter({name: 'id', operator: search.Operator.NOTEQUALTO, values: recordId})
                ],
                columns: [
                    search.createColumn({name: 'id', label: 'Internal ID'})
                ]
            }).run().getRange({start: 0, end: 2}).length;

            // If there are results...
            if(EISAcctSamePrimary > 0) {
                alert('You cannot create this record because it is a duplicate. Another EIS Account exists with the same Account Number, EIS Product and EIS Customer ID');
                return false;
            } // end EISAcctSamePrimary search section

            // If EP Inactive is true and Product Type is not empty and is not Unknown User Services then make main isInactive flag false so that data loader can set it to true
            if(EPInactive == true){
                record.setValue ({fieldId: 'isinactive', value: false});
            }
            // Set the isUpdated flag to True.
            record.setValue({fieldId: 'custrecord_eis_isupdated', value: true});

        }  // end Main IF stmt

        return true;

    } // end saveRecord function

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
    
});