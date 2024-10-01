/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/* Script:     Scheduled_SAO_Status_Upd.js
 * 
 * Purpose:  This script checks all the "In Progress" SAO EBSCONET Order Approver Status Contacts and if now Approved updates
 * 			 both the Contact & if required the Customer 
 *
 * Created by: Christine Neale
 *
 *
 * Revisions:  
 *	CNeale  	06/16/2020	US637815 Original version
 *	
*/

define(['N/error', 
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 
        '/SuiteScripts/EIS Custom Scripts2/Library2/library2_SAO', 
        'N/email', 
        'N/search', 
        'N/record'],

function(error, LC2Constant, L2SAO, email, search, record) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	
    	log.debug('<---- Script Start: Scheduled_SAO_Status_Upd----->');
    	
        var L2_SAO_Obj = L2SAO.L2_SAO_Object;    // Global variable holding info for SAO call & responses
        var LC2_ENOASts = LC2Constant.LC2_ContactENOrdApprovSts;  // Global variable holding EBSCONET order approver status values
        var LC2_ValENOASts = LC2Constant.LC2_ContactValidateENOrdApprovSts; // Global variable holding Validate EBSCONET Order Approver Status
        var LC2_OpCat = LC2Constant.LC2_ContactOpCat;  // Global variable holding Contact Operational Category
        var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
        var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
        var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
        var contUpd = false; // Indicates whether or not the Contact being processed has been updated  
    	
    	// Run search to identify all the Contacts we need to look at:-
		var callSearch = search.load({
	        id: LC2_SS.ENOA_InProg
	    });
		log.debug('after Call Search Load');
	    var myResultSet = callSearch.run().getRange(0, 999);
	    var length = myResultSet.length;
	    log.audit('No. of results = ', length);

	    if (myResultSet.length > 0){
	    	// At least 1 "In Progress" Contact	
	    	for (var x = 0; x < myResultSet.length; x++){
	    		
	        	// Retrieve required info from search results:
	            var contFName = myResultSet[x].getValue({
	                name: 'firstname'
	            });
	            var contLName = myResultSet[x].getValue({
	                name: 'lastname'
	            });
	            var contEmail = myResultSet[x].getValue({
	                name: 'email'
	            });
	       		var custText = myResultSet[x].getText({
	                name: 'company'
	            });
	       		var custId = myResultSet[x].getValue({
	                name: 'company'
	            });
	       		var contId = myResultSet[x].id;
	       		log.debug('contId = ', contId);
	       		
	    		
	    		// Set up parameters for call to SAO API Call in validate mode
	    		SAOCallParam('v')
	    		
	    		//Next, call library script to handle the Validate call to external API
	    		try {
            	var SAOCallResult = L2SAO.handleSAOaction();
            	log.debug('SAOAPICall Validate ', SAOCallResult);
	    		} 
	    		catch(e) {
            		log.error(e.name);
            		SAOCallResult = LC2_ValENOASts.CallFail;
            		log.error('Validate Call Fail');
            	}
	    		
	    		// For Testing Purposes ONLY (Next line is meant to be active in Dev environ but nowhere else) !!!!!
	    		// SAOCallResult = LC2_ValENOASts.Approver;

        		//Handle response from the library script call
             	if(SAOCallResult == LC2_ValENOASts.Approver){ 
             		log.debug('Approver - update starts here');
             		try{
             			contUpd = true;
             			ContUpdApprover();
             		}
             		catch(e) {
             			log.error(e.name);
             			contUpd = false;
             			log.error('Contact ' +contId+ ' update failure')
             		}
             		
             		if (contUpd == true){
             			// Only do the Customer update if the Contact update has completed
             			try{
             				CustUpdApprover();
             			}
             			catch(e){
             				log.error(e.name);
                    		log.error('Customer Not Updated - Error', custId);
                    		email.send({
                                author: LC2_emp.MercuryAlerts,
                                recipients: LC2_email.CRMEscalation,
                                subject: 'Scheduled SAO Status Update - Customer ' +custId+ ' not updated',
                                body: 'Contact ' +contId+ ' was updated to EBSCONET Order Approver by Scheduled2_SAO_Status_Upd.js <BR><BR> The Customer "Active EBSCONET Order Approvers" flag did not update for Customer ' +custId+ ' ' +custText+ '<BR>Please check & correct Customer flag.'
                            });
             			}
             		}
             	}
	    	}
	    }
		    
		    
        // Function: SAOCallParam
        // Sets parameters to pass to API Call 
        // Input: Action Rquired (a = add, r = remove, v = validate) 
        function SAOCallParam(actReq){
        	log.debug('Entering SAOCallParam with action = ' + actReq);
 
    		// Now populate the API Call info
    		L2_SAO_Obj.custID			= custText.substring(0, custText.indexOf(" "));   
    		L2_SAO_Obj.contactID 		= contId;
    		L2_SAO_Obj.contactName	= contFName + ' ' + contLName;
    		L2_SAO_Obj.contactEmail	= contEmail;	
     		L2_SAO_Obj.requesterName 	= 'Team Mercury';
    		L2_SAO_Obj.requesterEmail	= LC2_email.CRMEscalation;
    		
    		switch (actReq) {
    		   case 'a': 
    			   L2_SAO_Obj.actionRequested = 'add';
    			   L2_SAO_Obj.custActReq = 'add';
    			break;
    							
    		   case 'r': 
    			   L2_SAO_Obj.actionRequested = 'remove';
    			   L2_SAO_Obj.custActReq = 'validate';
    			break;
    							
    		   default: 
    			   L2_SAO_Obj.actionRequested = 'validate';
    		   	   L2_SAO_Obj.custActReq = 'validate';	
    			break;
    		}
    		
    		log.debug('Leaving SAOCallParam with L2_SAO_Obj = ', JSON.stringify(L2_SAO_Obj)); 
    		return;
        }
        /*--------END Function SAOCallParam----------------*/
        
        
        // Function: ContUpdApprover
        // Updates the Contact to Approver status 

        
        function ContUpdApprover(){
        	log.debug('Entering ContUpdApprover' );
        	// Load the Contact and update - ENOA Status & Operational Category
        	var contRecord = record.load({
        		type: 'contact',
        		id: contId
        	});
    	
        	// Update the Operational Category 
        	var op_category = contRecord.getValue('custentity_contact_category');
        	log.debug('Op_category', op_category);
        	var enetoa_in_opCat = false;
        	var category_count = op_category.length;
        	for ( var c=0; category_count != null && c < category_count; c++ )
        	{
        		if (op_category[c] == LC2_OpCat.EnetApprover)
        		{	// Is set to EBSCONET Order Approver
        			enetoa_in_opCat = true;
        		} 
        	}
        	if (enetoa_in_opCat == false)
        	{
        		op_category.push(LC2_OpCat.EnetApprover);
        		contRecord.setValue('custentity_contact_category', op_category);
        		log.debug('Op Cat updated to ', op_category);
        	}
 		
        	// Update the ENOA Status
        	contRecord.setValue('custentity_enet_ordapprove_status', LC2_ENOASts.Approved);
        	// Update the "isUpdated" flag
        	contRecord.setValue('custentity_isupdated', true);
 		
        	// Update to the database
        	contRecord.save({
        		enableSourcing: false,
        		ignoreMandatoryFields: true
        	});
        	log.audit('Contact ' +contId+ ' Updated');
        	return;
        }
        /*--------END Function ContUpdApprover----------------*/
        
        // Function: CustUpdApprover
        // Checks the Customer EBSCONET Order APprover(s) flag and updates if required 
        
        function CustUpdApprover(){
        	log.debug('Entering CustUpdApprover' );
        	// Check whether the Customer flag is set and if not set it (& the isupdated flag)
        	var custLookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: custId,
                columns: ['custentity_enet_order_eligible']
            });
            if(custLookup.custentity_enet_order_eligible == false){
                 	record.submitFields({
                	    type: record.Type.CUSTOMER,
                	    id: custId,
                	    values: {
                	    	'custentity_enet_order_eligible': true,
                     		'custentity_isupdated': true
                	    }
             	});
                	log.audit('Customer ' +custId+ ' Updated');	
            }
        	return;
        }
        /*--------END Function ContUpdApprover----------------*/
        
    }
  
    return {
        execute: execute
    };
    
});
