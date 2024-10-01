/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*
    Script: Client2_Record_sales_order.js

    Created by: Will Clark
    Function: Button that redirects to the Supporting Documents page

	Library Scripts Used:  N/A

    Revisions:
    wClark  	8/8/2024	Script created
*/

define(['N/https', 'N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
    /**
     * @param{https} https
     */
    function (https, runtime, L2Utility) {
        function accessSuppDocs(orderNum) {
            let url = '';
            if(L2Utility.LU2_isProdEnvironment(runtime.envType) === true){
                url = 'https://sdapp.epnet.com/SDApp/api/homeForSDApp/oauth2?type=SO&id=';
            }
            else{
                url = 'https://qa-sdapp.epnet.com/SDApp/api/homeForSDApp/oauth2?type=SO&id=';
            }
            let fullUrl = url.concat(orderNum);
            window.open(fullUrl, '_blank'); //we want to open this in a new tab
        }
        return {
            accessSuppDocs: accessSuppDocs
        };
    });