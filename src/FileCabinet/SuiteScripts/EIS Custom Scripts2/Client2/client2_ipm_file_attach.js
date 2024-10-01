/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_ipm_file_attach.js
//				Written in SuiteScript 2.0
//				Purpose:  Form-level client script for the IPM File Attach (custom record) form
//
//Created by:	Eric Abramo  09-11-2023
//

//
//Library Scripts Used: 	-NONE-
//
//
//Revisions: 	09/2023		File Created
//
//----------------------------------------------------------------------------------------------------------------
define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
    function(constants) {

        function saveRecord(scriptContext) {
            var record = scriptContext.currentRecord;

            // if 'Other' is selected in the IPM Program Product field validate that 'Other IPM Product' field is populated
            var ipm_products = record.getValue({
                fieldId: 'custrecord_ipm_program_product'
            })
            if(ipm_products.includes(constants.LC2_IPMProgramProduct.Other) == true){
                var other_ipm_product = record.getValue({
                    fieldId: 'custrecord_other_ipm_prod'
                })
                //alert('other_ipm_product value is '+other_ipm_product)
                if(other_ipm_product == '' || other_ipm_product == null){
                    alert('Other IPM Product is mandatory when \'Other\' is selected in IPM Program Product');
                    return false;
                }
            }

            return true;
        }



        return {
            saveRecord: saveRecord
        };
    });