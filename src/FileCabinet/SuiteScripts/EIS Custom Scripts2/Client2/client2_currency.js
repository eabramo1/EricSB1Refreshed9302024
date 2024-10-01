/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

 define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime'],
 function(LC2Constants, runtime){
     function pageInit(scriptContext){
         var currentRec = scriptContext.currentRecord;
         var userObj = runtime.getCurrentUser();
         currentRec.getField({fieldId: 'custrecord_currency_exchangerate'}).isDisabled = false;
         // If not the Administrator role and not the Web Services role then lock the OPS Code field
         if (userObj.role != LC2Constants.LC2_Role.Administrator || userObj.role != LC2Constants.LC2_Role.WebServ){
             currentRec.getField({fieldId: 'custrecord_currency_opscode'}).isDisabled = true;
         }
     }

     function fieldChanged(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var fieldId = scriptContext.fieldId;
        if (fieldId == 'custrecord_currency_isinactive'){
            currentRec.setValue({
                fieldId: 'inactive',
                value: false,
                ignoreFieldChanged: true
            });
        }
     }

     function saveRecord(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var epCurrency = currentRec.id;
        var exchangeRate = currentRec.getValue({fieldId: 'custrecord_currency_exchangerate'});

        // Don't allow the exchange rate to change on US Dollar
        if (epCurrency == LC2Constants.LC2_Currency.USDollar && exchangeRate != '1'){
            alert('You cannot change the exchange rate on the US Dollar Currency');
		    return false
        }

        currentRec.setValue({
            fieldId: 'custrecord_currency_isupdated',
            value: true,
            ignoreFieldChanged: true
        });
        return true;
     }
 
 return {
     pageInit: pageInit,
     fieldChanged: fieldChanged,
     saveRecord: saveRecord
 };
})