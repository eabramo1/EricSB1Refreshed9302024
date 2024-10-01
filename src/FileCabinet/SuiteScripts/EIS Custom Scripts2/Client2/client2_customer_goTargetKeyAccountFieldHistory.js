/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
    Script: client2_customer_goTargetKeyAccountFieldHistory.js

    Created by: kseares NS ACS

    Function: client script to redirect to Targey/Key Account Notes Field History Suitelet
    
	Library Scripts Used:

    Revisions:
    kbseares	10/21/2019	script created
    eAbramo		05/27/2021	Added Function for DocuSign project US785373 DocuSign: Configure and Implement the Authentication for 
    				back-end call to DocLauncher API (PART 1)
    ZScannell	07/15/2024	US1277418 Develop SuiteScirpt for WinSer Customer Button

*/


define(['N/record', 'N/runtime', 'N/search', 'N/url', 'N/currentRecord', 'N/ui/dialog', 'N/ui/message', 'N/https', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

function(record, runtime, search, url, currentRecord, dialog, msg, https, utility) {
    
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

    }
	//Open the Field History Suitlet and submit Customer Id
    function openSuitelet(){
    	var rec = currentRecord.get();
    	var id = rec.id;
      	console.log('id: '+id);
		var param = {
			customerId: id
		};
		
    	var suiteletURL = url.resolveScript({
			scriptId: 'customscript_nsacs_field_history_form',
			deploymentId: 1,
			params:param
		});
    	console.log(suiteletURL);
    	
    	var oldWindow = window.open(suiteletURL, '_blank');
		oldWindow.focus();    	
    }
    

    //US785373 DocuSign
    function openDocuSignSuitelet(){
		log.debug('Entering the openDocuSignSuitelet function');
	   
		var options = {
	            title: "Confirm Docusign Task Generation",
	            message: "Are you sure you would like to create a DocuSign Task using this customer's information?"
	        };	

    	var record = currentRecord.get();
    	var id = record.id;
      	var cust_params = {
    			customerId: id
          	};
				
	    function success(result) {
	        if (result == true) {
	            // Define Suitelet
	            var docSuiteletURL = url.resolveScript({
	    			scriptId: 'customscript_suitelet2_docusign',
	    			deploymentId: 'customdeploy_suitelet2_docusign',
	    			params: cust_params
	            });

	            // Call Suitelet - receive back response
   	            var response = https.get({
	            	url: docSuiteletURL
	            	});
	            	if(response.body) {
	            		// alert('response.body is '+response.body);          		
	    	            var parsed_response = JSON.parse(response.body);
		            	if (parsed_response.urlvalue){
		            		// Take User to the DocuSign Task
			            	window.open(parsed_response.urlvalue);		            		
		            	}
		            	else{
		            		alert(parsed_response.error+'. '+'Response Code is '+parsed_response.code);
		            	}
		            	
	            	}
	            	else{
	            		alert('Error in Receiving Response from DocuSign.  No response.body');
	            	}
	        }
	        return result;
	    }		
	    
	    function failure(reason) {
	        alert('Error encountered in DocuSign Integration.  Please send a screenshot of this page to CrmEscalation@ebsco.com and a ticket will be opened so that this issue can be investigated. NetCRM DocuSign Suitelet Failed to Run.');
	    }

	    
	  
	   dialog.confirm(options).then(success).catch(failure);
    }

	//	US1277418 -	Follow-up/completion of work started in US1279872
	function sendWinSRRequest() {
		var rec = currentRecord.get();
		let entityLookup = search.lookupFields({
			type: search.Type.CUSTOMER,
			id: rec.id,
			columns: ['entityid']
		});
		let entityId = entityLookup.entityid;

		var url = "";
		if(utility.LU2_isProdEnvironment(runtime.envType) === true){
				url = "https://wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
			}
			else{
				url = "https://qa-wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
			}
		console.log('url: ' + url);
		window.open(url+entityId, '_blank');
	}

    return {
        pageInit: pageInit,
        openSuitelet: openSuitelet,
        openDocuSignSuitelet: openDocuSignSuitelet,
		sendWinSRRequest: sendWinSRRequest
    };
    
});

