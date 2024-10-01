/* 
 * File:  Restlet_SearchRecords.js
 *
 * Module Description:  Allows user to either return results from a UI created Saved Search, or to construct a search through JSON. Allows for maximum of 10,000 results to be returned.
 *
 * JSON Input Expected:
 * {    "record_type":'recordtype',
 * 		"search_id":'searchid'
 * }  OR
 * {    "record_type":'recordtype',
 * 		"filters":[{
 * 		   {"fieldName":'nsfieldName',
 *          "operator":'anyof',
 *          "values":['somevalue']}
 *		 }],
 * 		"columns" :['columntoreturn','columntoreturn2']
 * }
 * 
 * Optional JSON Input
 * 
 * Return JSON Object Parameters:
 *	Array of columns specified in request, or those specified in the saved search
 * 
 * Version	Date			Author(s)	    Remarks
 * 1.00		12/1/2020		Ariana Hazen    Initial creation of the restlet file.
 * 1.1		01/15/2021		Ariana Hazen	Updated to allow for maxRecords and sortBy
 * 1.2		02/05/2021		Ariana Hazen	Updated columns to accept objects notation to join records
 * 1.3		02/09/2021		Ariana Hazen	Updated columns to accept formula (workaround to allow for same name fields within columns when joining)
 */

function getSearch(datain) {
    //datain.search_id
    //datain.record_type
    nlapiLogExecution('debug', 'RESTLET getSearch started');
    var dataout = {};
    var search_id = datain.search_id || null;
    var record_type = datain.record_type || null;
    var columns = datain.columns || (L_isEmpty(search_id) ? ["internalid"] : null); //make sure we always have at least internalid as a column
    var filters = datain.filters || null;
    var sortBy = datain.sortBy || (L_isEmpty(search_id) ? { "fieldName": "internalid", "direction": "desc" } : null); //internalid desc as sort default
    var dataCheck = true;
    var maxRecords = datain.maxRecords || 5000;
    dataout.restlet_status = 'ERROR';
    dataout.restlet_status_details = '';
    dataout.searchResults = [];

    try {
        if (L_isEmpty(search_id) && L_isEmpty(record_type)) {
            //something is missing!
            dataCheck = false;
            dataout.restlet_status_details = 'Required data input is missing! Request should contain search_id and record_type.';
            dataout.restlet_status = 'ERROR';
        } else if (L_isEmpty(search_id) && L_isEmpty(filters)) {
            dataCheck = false;
            dataout.restlet_status_details = 'Required data input is missing! Request should contain filters when no search_id is passed.';
            dataout.restlet_status = 'ERROR';
        }

        if (dataCheck) {
            var that = this;

            if (!L_isEmpty(filters)) {
                var search_filters = [];
                for (var i = 0; i < filters.length; i++) {
                    var fields = filters[i]["fieldName"];
                    if (fields.constructor === Object) { //check for complex filter e.g. case.internalid
                        for (var prop in fields) {
                            search_filters.push(new nlobjSearchFilter(fields[prop]["fieldName"], prop, fields[prop]["operator"], fields[prop]["values"]));
                        }
                    } else {
                        search_filters.push(new nlobjSearchFilter(fields, null, filters[i]["operator"], filters[i]["values"]));
                    }
                }

                if (search_filters.length > 0) {
                    filters = search_filters;
                }
            }
            if (!L_isEmpty(columns)) {
                var search_columns = [];
                for (var i = 0; i < columns.length; i++) {
                    var thiscol = columns[i];
                    var joined = null;
                    var formula = null;
                    var sortCheck = columns[i];
                    var isformula = Array.isArray(thiscol) ? "T" : "F";
                    if (isformula==="T") {
                        formula = thiscol[1] || "";
                        thiscol = thiscol[0] || "";
                        sortCheck = thiscol;
                    }

                    if (thiscol.indexOf(".") > -1) {
                        thiscol = thiscol.split(".");
                        joined = thiscol[0];
                        thiscol = thiscol[1];
                    }
                  if(!L_isEmpty(thiscol)){
                     var newcol = new nlobjSearchColumn(thiscol, joined);

                    if (isformula==="T") {
                        newcol.setFormula(formula);
                    }
                    if (!L_isEmpty(sortBy) && sortBy.fieldName === sortCheck) {
                        newcol.setSort(sortBy.direction === "desc" ? true : false);
                    }
                    search_columns.push(newcol);
                     }
                }

                if (search_columns.length > 0) {
                    columns = search_columns;
                }
            }

            this.recordSearcher = new L_recordSearcher_withMax();
            dataout.searchResults = that.recordSearcher.search(record_type, search_id, filters, columns, maxRecords);

            if (dataout.searchResults) {
                dataout.restlet_status_details = 'getSearch returned: ' + dataout.searchResults.length + ' results.';
                dataout.restlet_status = 'SUCCESS';
            } else {
                dataout.restlet_status_details = 'getSearch returned no results.';
                dataout.restlet_status = 'ERROR';
            }
        }
    }   
    catch (e) {
        if (e instanceof nlobjError) {
            nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n' + e.getDetails());
            // 1143947 is Internal ID for Ariana Hazen Employee Record
            nlapiSendEmail(1143947, 1143947, 'SearchRecords ERROR', e.getDetails()+'<BR><BR>'+JSON.stringify(datain));
            dataout.restlet_status_details = 'SearchRecords Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
            dataout.restlet_status = 'ERROR';
        } else {
            nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
            nlapiSendEmail(1143947, 1143947, 'SearchRecords ERROR', e.toString()+'<BR><BR>'+JSON.stringify(datain));
            dataout.restlet_status_details = 'SearchRecords Restlet UNEXPECTED ERROR:  ' + e.toString();
            dataout.restlet_status = 'ERROR';
        }
    } 
      
    nlapiLogExecution('DEBUG', 'restlet_status', dataout.restlet_status);
    nlapiLogExecution('DEBUG', 'restlet_status_details', dataout.restlet_status_details);
    nlapiLogExecution('debug', 'RESTLET getSearch ended...');
    return (dataout);
}