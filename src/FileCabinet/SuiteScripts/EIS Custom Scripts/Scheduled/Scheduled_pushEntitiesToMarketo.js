/*
 * Script:     Scheduled_newEntityPushToMarketo.js
 * 
 * Created by: Kate McCormack
 * 
 * Functions:  	
 * Looks for new entity records (contact or customer) created via MuvTool API calls and sets their "MUV SYNC FIELD LAST MODIFIED" in order
 * to force these records to sync back to Marketo with their new internal ids
 * 
 * Library Scripts Used:	library_utility.js		
 * 
 *  Revisions: 
 *  04-02-2017	Kate M.	--- When setting custentity_muv_synfield_lastmodified, use current timestamp (plus one minute), NOT the record's lastmodifieddate because this could be up to 15 minutes in
 *  						the past and collection may already have run again in the mean time. 
 *  
 *  04-16-2019 	Kate M. ---	US487576:  Defect - Muv Sync Field Last Modified is not updating for contacts
 *  						This scheduled script runs every fifteen minutes and looks for any new Customers or Contacts that have a Vertify pushTimestamp within 
 *  						the last 35 minutes (previous run time 15 minutes ago plus 20 minute additional buffer); in other words, these Customer and Contacs 
 *  						were newly created from a Marketo Lead. There is a problem which occurs, however, when there’s a long delay between the time 
 *  						Vertify converts the record internally (and sets the pushToMarketo timestamep) and the time that the Contact is actually created 
 *  						in NetSuite.  (This delay may be due to slow movement in Vertify, schedules being turned off, or errors).  By the time the Contact
 *  						actually gets created in NetSuite (says 90 minutes later) the scheduled script runs and looks backwards 35 minutes and NEVER picks
 *  						up this new Contact (or Customer) as one that needs to be pushed back to Marketo.
 *  
 *  						SOLUTION: Simplify this scheduled script to look for any Customers or Contacts that have custentity_push_marketo_date set and
 *  						custentity_muv_syncfield_lastmodified NOT set.  (We cannot rely on using exact retrieve time comparisons because there are too many
 *  						Vertify delays and problems which could mess up this "happy path" design).  Look back six month for any candidates.
 *  
 *  						Also, added library_utility.js to allow for script to yield and to return over 1000 records.  
 *  				
 */ 
      
//Temp vars used to set global variable below
//First assign current EST timestamp
var today = new Date();
today.setHours(today.getHours() + 3);         //Note: Add 3 hours to NetSuite PST in order to get it to current EST time
var myDate = nlapiDateToString(today);
var myTime = nlapiDateToString(today, 'timeofday');              

//GLOBAL VARIABLES
var DEFAULT_CURRENT_DATE_TIME = myDate + ' ' + myTime;   
var ADD_MINUTES_SYNC_DATETIME = 1;
var AMOUNT_OF_TIME_TO_LOOK_BACK = 'monthsAgo01';


function pushEntity( )
{
	nlapiLogExecution('audit', '+++ START SCRIPT +++');	
	
	// Required for Library script function call
	var that = this;
	this.recordSearcherCustomer = new L_recordSearcher();	
	this.recordSearcherContact = new L_recordSearcher();		

	// FIRST PUSH ANY CUSTOMERS THAT NEED TO SYNC WITH MARKETO	
    // search returns any Customer record flagged for syncing to Marketo that has a PUSH TO MARKETO DATE populated, but MUV SYNC FIELD LAST MODIFIED is empty   
    var custcols = new Array();
     
    var custfilterExp = [ ['custentity_customer_sync_to_marketo','is','T'], 'AND',
                          ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                          ['custentity_push_marketo_date','onorafter', AMOUNT_OF_TIME_TO_LOOK_BACK],'AND',
                          ['custentity_muv_syncfield_lastmodified','isempty', null]  ];
            
    custcols.push( new nlobjSearchColumn('internalid').setSort(false));
    custcols.push( new nlobjSearchColumn('entityid'));
    custcols.push( new nlobjSearchColumn('companyname'));
    custcols.push( new nlobjSearchColumn('custentity_push_marketo_date'));
   
    //var customerResults = nlapiSearchRecord('customer', null, custfilterExp, custcols);
    var customerResults = that.recordSearcherCustomer.search('customer', null, custfilterExp, custcols);
    nlapiLogExecution('audit', '... LOOKING FOR CUSTOMERS WITH PUSH DATES WITHIN ' + AMOUNT_OF_TIME_TO_LOOK_BACK);	

    if(customerResults != null)
    {
    	 nlapiLogExecution('audit', 'Customer(s) Found To Be Pushed. Number of Records:', customerResults.length);

         for (var j = 0; customerResults != null && j < customerResults.length; j++)
         {  
        	var custresultCols = customerResults[j].getAllColumns();
            var customerInternalId = customerResults[j].getValue(custresultCols[0]);
            var customerName = customerResults[j].getValue(custresultCols[1]);
            var customerCompany = customerResults[j].getValue(custresultCols[2]);           
            var customerPushMKTOdate = customerResults[j].getValue(custresultCols[3]).toString();
            customerPushMKTOdate = nlapiStringToDate(customerPushMKTOdate);
            customerPushMKTOdate = nlapiDateToString(customerPushMKTOdate,'datetimetz');
             
            nlapiLogExecution('debug', 'Customer('+j+') ID: ' + customerInternalId + ' Name: "'+ customerName + '" Company: "'+ customerCompany + '" ===> PushtoMKTO Date: ' + customerPushMKTOdate );
            nlapiLogExecution('audit', 'Customer('+j+') ID: ' + customerInternalId + ' ... Name: "'+ customerName + ' '+ customerCompany + '"');
            
            var newdate = DEFAULT_CURRENT_DATE_TIME;
            newdate = nlapiStringToDate(newdate);
			newdate.setMinutes(newdate.getMinutes()+ADD_MINUTES_SYNC_DATETIME);
			newdate = nlapiDateToString(newdate,'datetimetz');
			
			nlapiLogExecution('debug', 'Setting Customers muv_syncfield_lastmodified to:', newdate);
			nlapiSubmitField('customer',customerResults[j].getId(),'custentity_muv_syncfield_lastmodified',newdate);
			
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding Customer ***', customerInternalId);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', customerInternalId);
			}	
         }
    }
    else {
    	nlapiLogExecution('audit', 'NO CUSTOMER RECORDS FOUND TO BE PUSHED');
    }
	
	
	// NEXT PUSH ANY CONTACTS THAT NEED TO SYNC WITH MARKETO	  
    // search returns any Contact record flagged for syncing to Marketo that has a PUSH TO MARKETO DATE populated, but MUV SYNC FIELD LAST MODIFIED is empty
    var cols = new Array();
    
    var filterExp = [ ['custentity_sync_to_marketo','is','T'], 'AND',
                      ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                      ['custentity_push_marketo_date','onorafter', AMOUNT_OF_TIME_TO_LOOK_BACK],'AND',
                      ['custentity_muv_syncfield_lastmodified','isempty', null] ];
 
   
    cols.push( new nlobjSearchColumn('internalid').setSort(false));
    cols.push( new nlobjSearchColumn('entityid'));
    cols.push( new nlobjSearchColumn('company'));
    cols.push( new nlobjSearchColumn('custentity_push_marketo_date'));   
    
    //var contactResults = nlapiSearchRecord('contact', null, filterExp, cols);
    var contactResults = that.recordSearcherContact.search('contact', null, filterExp, cols);
    nlapiLogExecution('audit', '... LOOKING FOR CONTACTS WITH PUSH DATES WITHIN ' + AMOUNT_OF_TIME_TO_LOOK_BACK);	

    if(contactResults != null)
    {
    	 nlapiLogExecution('audit', 'Contact(s) Found To Be Pushed. Number of Records:', contactResults.length);

         for (var i = 0; contactResults != null && i < contactResults.length; i++)
         {  
        	var resultCols = contactResults[i].getAllColumns();
            var contactInternalId = contactResults[i].getValue(resultCols[0]);
            var contactName = contactResults[i].getValue(resultCols[1]);
            var contactCompany = contactResults[i].getValue(resultCols[2]);           
            var contactPushMKTOdate = contactResults[i].getValue(resultCols[3]).toString();
            contactPushMKTOdate = nlapiStringToDate(contactPushMKTOdate);
            contactPushMKTOdate = nlapiDateToString(contactPushMKTOdate,'datetimetz');
             
            nlapiLogExecution('DEBUG', 'Contact('+i+') ID: ' + contactInternalId + ' Name: "'+ contactName + '" CompanyID: '+ contactCompany + ' ===> PushtoMKTO Date: ' + contactPushMKTOdate );
            nlapiLogExecution('audit', 'Contact('+i+') ID: ' + contactInternalId + ' ... Name: "'+ contactName + '"');
            
            
            //var currentDateTime = new Date();
            var newdate = DEFAULT_CURRENT_DATE_TIME;
            newdate = nlapiStringToDate(newdate);
			newdate.setMinutes(newdate.getMinutes()+ADD_MINUTES_SYNC_DATETIME);
			newdate = nlapiDateToString(newdate,'datetimetz');
			
			nlapiLogExecution('DEBUG', 'Setting Contact muv_syncfield_lastmodified to:', newdate);            
			nlapiSubmitField('contact',contactResults[i].getId(),'custentity_muv_syncfield_lastmodified',newdate);        
			
			// This section handles checking the governance and resumes at the same spot if we are running out of governance... 
			nlapiLogExecution('debug', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 100) 
			{
				nlapiLogExecution('audit', 'Remaining usage: ', nlapiGetContext().getRemainingUsage());
				nlapiLogExecution('audit', '*** Yielding Contact ***', contactInternalId);
				nlapiSetRecoveryPoint();
				nlapiYieldScript();
				nlapiLogExecution('audit', '*** Resuming from Yield ***', contactInternalId);
			}	
         }
    }
    else {
    	nlapiLogExecution('audit', 'NO CONTACT RECORDS FOUND TO BE PUSHED');
    }
    
    nlapiLogExecution('audit', '--- END SCRIPT ---', 'SUCCESS');	
      
}
/*
//Temp vars used to set global variable below
//First assign current EST timestamp
var today = new Date();
today.setHours(today.getHours() + 3);         //Note: Add 3 hours to MUVdate set in order to get it to current EST time
today.setMinutes(today.getMinutes());   	  //Note: Subtract 20 minutes from current EST time to look backwards for any entities to push
var myDate = nlapiDateToString(today);
var myTime = nlapiDateToString(today, 'timeofday');              

//Second assign current EST timestamp minus 20 minutes for back retrieval
var retrieve = new Date();
retrieve.setHours(retrieve.getHours() + 3);           //Note: Add 3 hours to MUVdate set in order to get it to current EST time
retrieve.setMinutes(retrieve.getMinutes() - 20);   	  //Note: Subtract 20 minutes from current EST time to look backwards for any entities to push
var retrieveDate = nlapiDateToString(retrieve);
var retrieveTime = nlapiDateToString(retrieve, 'timeofday');

//GLOBAL VARIABLES
var DEFAULT_CURRENT_DATE_TIME = myDate + ' ' + myTime;      			//This should be twenty minutes less than current time
var DEFAULT_RETRIEVAL_DATE_TIME = retrieveDate + ' ' + retrieveTime;    //This should be twenty minutes less than current time
var ADD_MINUTES_SYNC_DATETIME = 1;

function OLDpushEntity ( )
{
	nlapiLogExecution('DEBUG', 'Entering pushNewEntityToMarketo');
	var context = nlapiGetContext();
	
	var retrieveTime = DEFAULT_RETRIEVAL_DATE_TIME;
	
	var scriptParmField = 'custscript_pushretrievetime';
	var scriptParmTimeStr = nlapiGetContext().getSetting('SCRIPT', scriptParmField);	
	
	if(scriptParmTimeStr != null) {
		var scriptParmTime = nlapiStringToDate(scriptParmTimeStr, 'datetimetz');
		var scriptDate = nlapiDateToString(scriptParmTime);
		var scriptTime = nlapiDateToString(scriptParmTime, 'timeofday'); 
		var scriptDateTime = scriptDate + ' ' + scriptTime;
		
		retrieveTime = scriptDateTime;
	}
	
	//var retrieveTimeStr = nlapiDateToString(retrieveTime, 'datetimetz');
	
	nlapiLogExecution('DEBUG', 'Retrieve Time Parameter Value:', scriptParmTimeStr);
	nlapiLogExecution('DEBUG', 'Retrieve Time To Use:', retrieveTime);
	//nlapiLogExecution('DEBUG', 'Retrieve Time Str:', retrieveTimeStr);
	
	// FIRST PUSH ANY CUSTOMERS THAT NEED TO SYNC WITH MARKETO
	
    // search returns any Contact record flagged for syncing to Marketo that has a PUSH TO MARKETO DATE populated, but MUV SYNC FIELD LAST MODIFIED is empty   
    var custcols = new Array();
     
    var custfilterExp = [ ['custentity_customer_sync_to_marketo','is','T'], 'AND',
                          ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                          ['custentity_push_marketo_date','isnotempty', null],'AND',
                          [['custentity_muv_syncfield_lastmodified','isempty', null],'OR',
                           ['custentity_push_marketo_date','after', DEFAULT_DATE_TIME]]  ];
    
    var custfilterExp = [ ['custentity_customer_sync_to_marketo','is','T'], 'AND',
                          ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                          ['custentity_push_marketo_date','isnotempty', null],'AND',
                          ['custentity_push_marketo_date','after', retrieveTime]  ];
    
    
    custcols.push( new nlobjSearchColumn('internalid').setSort(false));
    custcols.push( new nlobjSearchColumn('entityid'));
    custcols.push( new nlobjSearchColumn('companyname'));
    custcols.push( new nlobjSearchColumn('lastmodifieddate'));
   
    var customerResults = nlapiSearchRecord('customer', null, custfilterExp, custcols);

    if(customerResults != null)
    {
    	 nlapiLogExecution('DEBUG', 'Customer(s) Found To Be Pushed. Number of Records:', customerResults.length);

         for (var j = 0; customerResults != null && j < customerResults.length; j++)
         {  
        	var custresultCols = customerResults[j].getAllColumns();
            var customerInternalId = customerResults[j].getValue(custresultCols[0]);
            var customerName = customerResults[j].getValue(custresultCols[1]);
            var customerCompany = customerResults[j].getValue(custresultCols[2]);           
            var customerLastModified = customerResults[j].getValue(custresultCols[3]).toString();
            customerLastModified = nlapiStringToDate(customerLastModified);
            customerLastModified = nlapiDateToString(customerLastModified,'datetimetz');
             
            nlapiLogExecution('DEBUG', 'Customer('+j+') ID: ' + customerInternalId + ' Name: '+ customerName + ' Company: '+ customerCompany + ' LastModified: ' + customerLastModified );
            
            //var currentDateTime = new Date();
			//nlapiSubmitField('customer',customerResults[j].getId(),'custentity_muv_syncfield_lastmodified',customerLastModified);       
            var newdate = DEFAULT_CURRENT_DATE_TIME;
            newdate = nlapiStringToDate(newdate);
			newdate.setMinutes(newdate.getMinutes()+ADD_MINUTES_SYNC_DATETIME);
			newdate = nlapiDateToString(newdate,'datetimetz');
			
			nlapiLogExecution('DEBUG', 'Setting muv_syncfield_lastmodified to:', newdate);
            nlapiSubmitField('customer',customerResults[j].getId(),'custentity_muv_syncfield_lastmodified',newdate);
         }
    }
    else {
    	nlapiLogExecution('DEBUG', 'NO CUSTOMER RECORDS FOUND TO BE PUSHED');
    }
	
	
	// NEXT PUSH ANY CONTACTS THAT NEED TO SYNC WITH MARKETO
	  
    // search returns any Contact record flagged for syncing to Marketo that has a PUSH TO MARKETO DATE populated, but MUV SYNC FIELD LAST MODIFIED is empty
    var cols = new Array();
    
    var filterExp = [ ['custentity_sync_to_marketo','is','T'], 'AND',
                      ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                      ['custentity_push_marketo_date','isnotempty', null],'AND',
                      ['custentity_muv_syncfield_lastmodified','isempty', null],'AND',
                      ['custentity_push_marketo_date', 'onorafter', 'hoursago01'] ];
    
    var filterExp = [ ['custentity_sync_to_marketo','is','T'], 'AND',
                      ['custentity_muv_marketoleadid','isnotempty', null],'AND', 
                      ['custentity_push_marketo_date','isnotempty', null],'AND',
                      ['custentity_push_marketo_date','after', retrieveTime]  ];
    
    cols.push( new nlobjSearchColumn('internalid').setSort(false));
    cols.push( new nlobjSearchColumn('entityid'));
    cols.push( new nlobjSearchColumn('company'));
    cols.push( new nlobjSearchColumn('lastmodifieddate'));   
    
    var contactResults = nlapiSearchRecord('contact', null, filterExp, cols);

    if(contactResults != null)
    {
    	 nlapiLogExecution('DEBUG', 'Contact(s) Found To Be Pushed. Number of Records:', contactResults.length);

         for (var i = 0; contactResults != null && i < contactResults.length; i++)
         {  
        	var resultCols = contactResults[i].getAllColumns();
            var contactInternalId = contactResults[i].getValue(resultCols[0]);
            var contactName = contactResults[i].getValue(resultCols[1]);
            var contactCompany = contactResults[i].getValue(resultCols[2]);           
            var contactLastModified = contactResults[i].getValue(resultCols[3]).toString();
			contactLastModified = nlapiStringToDate(contactLastModified);
			contactLastModified = nlapiDateToString(contactLastModified,'datetimetz');
             
            nlapiLogExecution('DEBUG', 'Contact('+i+') ID: ' + contactInternalId + ' Name: '+ contactName + ' Company: '+ contactCompany + ' LastModified: ' + contactLastModified );
            
            //var currentDateTime = new Date();
            var newdate = DEFAULT_CURRENT_DATE_TIME;
            newdate = nlapiStringToDate(newdate);
			newdate.setMinutes(newdate.getMinutes()+ADD_MINUTES_SYNC_DATETIME);
			newdate = nlapiDateToString(newdate,'datetimetz');
			
			nlapiLogExecution('DEBUG', 'Setting muv_syncfield_lastmodified to:', newdate);            
			nlapiSubmitField('contact',contactResults[i].getId(),'custentity_muv_syncfield_lastmodified',newdate);            
         }
    }
    else {
    	nlapiLogExecution('DEBUG', 'NO CONTACT RECORDS FOUND TO BE PUSHED');
    }
    
    nlapiLogExecution('DEBUG', 'Leaving pushNewEntityToMarketo');
}

function HOLDpushEntity( )
{
	nlapiLogExecution('DEBUG', 'Entering pushNewEntityToMarketo');
	var context = nlapiGetContext();
	  
    // search returns any Contact record flagged for syncing to Marketo that has a PUSH TO MARKETO DATE populated, but MUV SYNC FIELD LAST MODIFIED is empty
    var flts = new Array();
    var cols = new Array();
    flts.push (new nlobjSearchFilter('custentity_sync_to_marketo',null, 'is',  true));
    flts.push( new nlobjSearchFilter('custentity_push_marketo_date',null, 'isnotempty'));
    flts.push( new nlobjSearchFilter('custentity_muv_syncfield_lastmodified',null, 'isempty'));
   
    cols.push( new nlobjSearchColumn('internalid').setSort(false));
    cols.push( new nlobjSearchColumn('entityid'));
    cols.push( new nlobjSearchColumn('company'));
    cols.push( new nlobjSearchColumn('lastmodifieddate'));
   
    var contactResults = nlapiSearchRecord('contact', null, flts, cols);

    if(contactResults != null)
    {
    	 nlapiLogExecution('DEBUG', 'Contact(s) Found To Be Pushed. Number of Records:', contactResults.length);

         for (var i = 0; contactResults != null && i < contactResults.length; i++)
         {  
        	var resultCols = contactResults[i].getAllColumns();
            var contactInternalId = contactResults[i].getValue(resultCols[0]);
            var contactName = contactResults[i].getValue(resultCols[1]);
            var contactCompany = contactResults[i].getValue(resultCols[2]);           
            var contactLastModified = contactResults[i].getValue(resultCols[3]).toString();
			contactLastModified = nlapiStringToDate(contactLastModified);
			contactLastModified = nlapiDateToString(contactLastModified,'datetimetz');
             
            nlapiLogExecution('DEBUG', 'Contact('+i+') ID: ' + contactInternalId + ' Name: '+ contactName + ' Company: '+ contactCompany + ' LastModified: ' + contactLastModified );
            
            //var currentDateTime = new Date();
			nlapiSubmitField('contact',contactResults[i].getId(),'custentity_muv_syncfield_lastmodified',contactLastModified);            
         }
    }
    else {
    	nlapiLogExecution('DEBUG', 'NO CONTACT RECORDS FOUND TO BE PUSHED');
    }
    
    nlapiLogExecution('DEBUG', 'Leaving pushNewEntityToMarketo');
      
}*/