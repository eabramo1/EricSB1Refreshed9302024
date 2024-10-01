/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
/* Script:   Scheduled2_customer_folioSet.js
 * 
 * Purpose:  This script finds all Accessing sites where the FOLIO Customer flag is not set and all Purchasing Sites
 *           for FOLIO products and sets the Customer FOLIO flag if not already set.
 *           It does not handle unsetting the FOLIO Customer flag. 
 *           It controls the no. of updates at any one time to a limit that can be handled by Boomi (& does not consider
 *           governance levels as the Boomi handling is the limiting factor).  It relies on subsequent runs to handle records
 *           beyond this limit.
 * 			 As of 5/1/24, it also finds all Accessing/Purchasing sites where FOLIO Hosted by EBSCO customer flag is not set
 * 			 and customer has an active sub for 'FOLIO EBSCO Hosting'
 * 
 * Created by: Christine Neale
 *
 * Revisions:  
 *	CNeale		01/06/2022	Original version
 *	eAbramo		09/16/2022	TA754012 (of US1010164) Fix Defects for EBSCO Connect ReArch (Setting/Unsetting the Contact's FOLIO Access Status field)							
 *	eAbramo		11/1/2022	DE73393 Scheduled FOLIO Set script setting SF Account ID to "- None-"
 * 	JOliver		5/1/2024	US1240270 add logic for setting FOLIO Hosted by EBSCO checkbox on customer
*/
define(['N/error', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/email'],

function(error, record, search, LC2Constant, runtime, email) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	log.audit('<---- Script Start: Scheduled2_customer_folioSet----->');
    	
    	var LC2_SS = LC2Constant.LC2_SavedSearch; // Global variable holding saved search IDs
    	var LC2_email = LC2Constant.LC2_Email; // Global variable holding emails
    	var LC2_emp = LC2Constant.LC2_Employee;  // Global variable holding Employee IDs
    	
    	var updLimit = 1000; // Limit of no. of updates - governed by both Governance limits (10,000) and Boomi Considerations (1,000)
    	var updCount = 0; // Count of no. of updates
    	var emailSent = false; // Indicates whether error email sent 
    	
    	// Accessing Sites //
    	
    	// Run search to identify all accessing sites for FOLIO Products that do NOT have FOLIO flag set
    	// and loop through results to update Customer
		var s1 = search.load({
	        id: LC2_SS.custFolio_accessSite
	    }); 

		s1.run().each(function(result){
			log.debug('Access Site Each', 'Remaining Usage: ' + runtime.getCurrentScript().getRemainingUsage());
			var custId = result.getValue(result.columns[0]);
			var SFAccountId = result.getValue(result.columns[1]);
			if(SFAccountId == '- None -'){ // DE73393
				SFAccountId = '';
			}
			log.debug('Logging ACC Search variables','custId is '+custId+' and SFAccountId is '+SFAccountId);
			// Note: Submission of SFAccountID is needed to trigger logic in UserEvent Customer After Submit
			try{
				var id = record.submitFields({
					type: record.Type.CUSTOMER,
					id: custId,
					values: {
						'custentity_folio_cust': true,
						'custentity_sf_account_id': SFAccountId
					}
				});

				log.audit('Accessing Site ' +custId+ ' Updated');
				updCount = updCount + 1;
			}
			catch(e){
            	log.error(e.name);
	           	log.error('Accessing Site FOLIO Flag Set error Customer ID ', custId);
	           	// email just once if errors in run
	           	if (emailSent == false){
	           		email.send({
	           			author: LC2_emp.MercuryAlerts,
	           			recipients: LC2_email.CRMEscalation,
	           			subject: 'Scheduled2 Customer FOLIO Set Encountered an Issue Setting the "FOLIO Customer" flag.',
	           			body: 'There was a problem setting the "FOLIO Customer" flag for at least one Customer (Id: ' +custId+ ') <BR><BR> Please set the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Set" to update any other Customers also logged in error.'
	           		});
	           		emailSent = true;
	           	}
            }
			if (updCount >= updLimit){
				return false;
				}
			else{
				return true;
			}
		});
		
		// Purchasing Sites		

	   	// Run search to identify all purchasing sites for FOLIO Products that do NOT have FOLIO flag set
    	// and loop through results to update Customer where needed
		
		if (updCount < updLimit){
			var s2 = search.load({
				id: LC2_SS.custFolio_purchasing
			});
		
			s2.run().each(function(result){
				log.debug('Purchase Site each', 'Remaining Usage: ' + runtime.getCurrentScript().getRemainingUsage());
				var custId = result.getValue(result.columns[0]);
				var SFAccountId = result.getValue(result.columns[1]);	
				log.debug('Logging Purch Search variables','custId is '+custId+' and SFAccountId is '+SFAccountId);
				if(SFAccountId == '- None -'){ //DE73393
					SFAccountId = '';
				}
				// Note: Submission of SFAccountID is needed to trigger logic in UserEvent Customer After Submit				
				try{
					var id = record.submitFields({
						type: record.Type.CUSTOMER,
						id: custId,
						values: {
							'custentity_folio_cust': true,
							'custentity_sf_account_id': SFAccountId
						}
					});

					log.audit('Purchasing Site ' +custId+ ' Updated');
					updCount = updCount + 1;
				}
				catch(e){
					log.error(e.name);
					log.error('Purchasing Site FOLIO Flag Set error Customer ID ', custId);
					
		           	// email just once if errors in run
		           	if (emailSent == false){
		           		email.send({
		           			author: LC2_emp.MercuryAlerts,
		           			recipients: LC2_email.CRMEscalation,
		           			subject: 'Scheduled2 Customer FOLIO Set Encountered an Issue Setting the "FOLIO Customer" flag.',
		           			body: 'There was a problem setting the "FOLIO Customer" flag for at least one Customer (Id: ' +custId+ ') <BR><BR> Please set the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Set" to update any other Customers also logged in error.'
		           		});
		           		emailSent = true;
		           	}
				}
			
				if (updCount >= updLimit){
					return false;
				}
				else{
					return true;
				}
			});
		}


		// Accessing Sites for FOLIO Hosted by EBSCO

		// Run search to identify all accessing sites for product 'FOLIO EBSCO Hosting' that do NOT have 'FOLIO Hosted by EBSCO' Customer Flag Set
		// and loop through results to update Customer
		if (updCount < updLimit) {
			var s3 = search.load({
				id: LC2_SS.custFolioHosted_accessSite
			});

			s3.run().each(function (result) {
				log.debug('Access Site (FOLIO Hosted by EBSCO) Each', 'Remaining Usage: ' + runtime.getCurrentScript().getRemainingUsage());
				var custId = result.getValue(result.columns[0]);
				var SFAccountId = result.getValue(result.columns[1]);
				if (SFAccountId == '- None -') { // DE73393
					SFAccountId = '';
				}
				log.debug('Logging ACC Search variables (FOLIO Hosted by EBSCO)', 'custId is ' + custId + ' and SFAccountId is ' + SFAccountId);
				// Note: Submission of SFAccountID is needed to trigger logic in UserEvent Customer After Submit
				try {
					var id = record.submitFields({
						type: record.Type.CUSTOMER,
						id: custId,
						values: {
							'custentity_folio_hosted_by_ebsco': true,
							'custentity_sf_account_id': SFAccountId
						}
					});

					log.audit('Accessing Site (FOLIO Hosted by EBSCO)' + custId + ' Updated');
					updCount = updCount + 1;
				} catch (e) {
					log.error(e.name);
					log.error('Accessing Site FOLIO Hosted by EBSCO Flag Set error Customer ID ', custId);
					// email just once if errors in run
					if (emailSent == false) {
						email.send({
							author: LC2_emp.MercuryAlerts,
							recipients: LC2_email.CRMEscalation,
							subject: 'Scheduled2 Customer FOLIO Set Encountered an Issue Setting the "FOLIO Hosted by EBSCO" flag.',
							body: 'There was a problem setting the "FOLIO Hosted by EBSCO" flag for at least one Customer (Id: ' + custId + ') <BR><BR> Please set the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Set" to update any other Customers also logged in error.'
						});
						emailSent = true;
					}
				}
				if (updCount >= updLimit) {
					return false;
				} else {
					return true;
				}
			});
		}

		// Purchasing Sites of 'FOLIO EBSCO Hosting'

		// Run search to identify all purchasing sites for product FOLIO EBSCO Hosting that do NOT have 'FOLIO Hosted by EBSCO' flag set
		// and loop through results to update Customer where needed

		if (updCount < updLimit){
			var s4 = search.load({
				id: LC2_SS.custFolioHosted_purchasing
			});

			s4.run().each(function(result){
				log.debug('Purchase Site (FOLIO Hosted by EBSCO) each', 'Remaining Usage: ' + runtime.getCurrentScript().getRemainingUsage());
				var custId = result.getValue(result.columns[0]);
				var SFAccountId = result.getValue(result.columns[1]);
				log.debug('Logging Purch Search variables (FOLIO Hosted by EBSCO)','custId is '+custId+' and SFAccountId is '+SFAccountId);
				if(SFAccountId == '- None -'){ //DE73393
					SFAccountId = '';
				}
				// Note: Submission of SFAccountID is needed to trigger logic in UserEvent Customer After Submit
				try{
					var id = record.submitFields({
						type: record.Type.CUSTOMER,
						id: custId,
						values: {
							'custentity_folio_hosted_by_ebsco': true,
							'custentity_sf_account_id': SFAccountId
						}
					});

					log.audit('Purchasing Site (FOLIO Hosted by EBSCO)' +custId+ ' Updated');
					updCount = updCount + 1;
				}
				catch(e){
					log.error(e.name);
					log.error('Purchasing Site FOLIO Hosted by EBSCO Flag Set error Customer ID ', custId);

					// email just once if errors in run
					if (emailSent == false){
						email.send({
							author: LC2_emp.MercuryAlerts,
							recipients: LC2_email.CRMEscalation,
							subject: 'Scheduled2 Customer FOLIO Set Encountered an Issue Setting the "FOLIO Hosted by EBSCO" flag.',
							body: 'There was a problem setting the "FOLIO Hosted by EBSCO" flag for at least one Customer (Id: ' +custId+ ') <BR><BR> Please set the flag for this Customer and also check error logs for "Scheduled2 Customer FOLIO Set" to update any other Customers also logged in error.'
						});
						emailSent = true;
					}
				}

				if (updCount >= updLimit){
					return false;
				}
				else{
					return true;
				}
			});
		}

		log.audit('Remaining Usage: ' + runtime.getCurrentScript().getRemainingUsage(), 'Records Updated: ' + updCount);
		
		log.audit('<---- Script End: Scheduled2_customer_folioSet----->');
		
    }

    return {
        execute: execute
    };
    
});
