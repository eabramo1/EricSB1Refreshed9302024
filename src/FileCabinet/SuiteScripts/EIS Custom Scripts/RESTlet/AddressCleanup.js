/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Jun 2015     cmccormack
 *
 */

//var oStr = getAddrsToBeDeleted();

//alert(oStr);

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getAddrsToBeDeleted(datain) {
	
/*	THIS GET METHOD CURRENTLY NOT USED FOR ANYTHING
  
  	nlapiLogExecution('debug', 'RESTLET getAddrsToBeDeleted started...');
	
	var inCustId = datain.custid;
	var inAddrId = datain.addrid;
	
	nlapiLogExecution('debug', 'datain.custid=' + inCustId + '    datain.addrid ' + inAddrId);
	
	var addrfilters = new Array();
    var addrsArray = [];
    var addrObj= {};
   
    var custRecord = nlapiLoadRecord('customer', inCustId);	
    
    var custInfo = {};
	var addrInfo = {};
    
    var myaddrNum = custRecord.findLineItemValue('addressbook', 'id', inAddrId);
    var myaddr = "status: NOT FOUND";
    
    nlapiLogExecution('debug', 'myaddrNum=' + myaddrNum);
    
    if (myaddrNum>0) {
    	//myaddr = nlapiViewCurrentLine custRecord. .selectLineItem('addressbook', myaddrNum ); 
    	//custRecord.selectLineItem('addressbook', myaddrNum ); 
    	//myaddr = nlapiViewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
    	
    	addrInfo.addr1 = custRecord.getLineItemValue('addressbook', 'addr1' , myaddrNum);
    	addrInfo.addr2 = custRecord.getLineItemValue('addressbook', 'addr2' , myaddrNum);
    	addrInfo.addr3 = custRecord.getLineItemValue('addressbook', 'addr3' , myaddrNum);
    	addrInfo.addressee = custRecord.getLineItemValue('addressbook', 'addressee' , myaddrNum);
    	addrInfo.addressid = custRecord.getLineItemValue('addressbook', 'addressid' , myaddrNum);    	
	}        	

    var data = {address: addrInfo, customer: custRecord};	  
    
    nlapiLogExecution('debug', '... returning data=' + JSON.stringify(data));*/
	
	var data = "";    
    return(data);
}

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postAddrsToBeDeleted(datain) {
    /* 
     * Read array of custIds and addrIds
     * 
     * For each custId
     * 		get the customer record
     * 		look through its address book to find the addrId we want
     * 		add the addr to be deleted to response array
     * 	
     * return the response array of addrs found to be deleted
     * 
     */
	
	nlapiLogExecution('debug', 'RESTLET postAddrsToBeDeleted started...addrsin.length=' + datain.addrsin.length);

	var response = [];
	var addrin = '';
	var matchedcnt = 0;	
	
	var errReason = '';
	var matched = false;
	var matchedStr = 'NO MATCH';
	var matchedCustId = '';
	var addrType = '';
	var status = '';
	var firstKeys ='';
	
	for (var i = 0; i < datain.addrsin.length && status != 'ERROR'; i++) {	
	    addrin = datain.addrsin[i];	   
	    //nlapiLogExecution('debug', 'addrin.cust_nskey=' + addrin.cust_nskey + '    addrin.addr_nskey=' + addrin.addr_nskey);
	   	
		var inCustId = addrin.cust_nskey;
		var inAddrId = addrin.addr_nskey;
		
		if(i==0) {
			firstKeys = 'Batch cust_nskey:'+inCustId+' addr_nskey:'+inAddrId;
			nlapiLogExecution('debug', firstKeys+' started');
		}
		
		try {				
			errReason = '';
			matched = false;
			matchedStr = 'NO MATCH';
			matchedCustId = '';
			addrType = '';
			status = '';
			
			//nlapiLogExecution('debug', 'calling nlapiloadrecord for customer with custid = '+inCustId);
			//Retrieve the entire customer record (which will contain the address book as a sublist)
			var custRecord = nlapiLoadRecord('customer', inCustId);	
	
			matchedCustId = custRecord.getId();		
			var numberOfAddresses = custRecord.getLineItemCount('addressbook');
			
			//Find the index of the address we're looking for within the address book
			var myaddrNum = custRecord.findLineItemValue('addressbook', 'id', inAddrId);
		        
			//nlapiLogExecution('debug', 'total number of addrs=' + numberOfAddresses);
			//nlapiLogExecution('debug', 'address number to be removed=' + myaddrNum);
			
			//If we found the address with the given id, try to process it
			if (parseInt(myaddrNum)>0) {	
				matched = true;
				matchedStr = 'MATCH';
				
		    	//First make sure that this is NOT a main address in NetCRM, because main addrs cannot be deleted
				addrType = custRecord.getLineItemValue('addressbook', 'label' , myaddrNum) || '';		    	
				if ((addrType && addrType.length) > 0) {
					if (addrType.toUpperCase() == 'MAIN') {
						errReason = 'Cannot Delete MAIN address';
						status = 'SKIPPED';						
					}
				}
					 
			    matched = (errReason != '') ? false:true;
			    
			    if(matched) {
			    	matchedcnt = matchedcnt + 1;
			    	//Grab hold of that address subrecord from the list of addresses
					custRecord.selectLineItem('addressbook', myaddrNum);	  							//Uncomment this line to enable delete processing
			    	
			    	//Remove the address from the list of addresses
					//nlapiLogExecution('debug', 'removing this address from addrbook');
					custRecord.removeCurrentLineItemSubrecord('addressbook', 'addressbookaddress'); 	//Uncomment this line to enable delete processing
			    	
			    	//Commit the address removal
			    	//nlapiLogExecution('debug', 'committing address removal');	    	
					custRecord.commitLineItem('addressbook');											//Uncomment this line to enable delete processing
			    	
			    	//Commit the parent customer record
			    	//nlapiLogExecution('debug', 'saving customer record');		  
			    	var id = nlapiSubmitRecord(custRecord);	    										//Uncomment this line to enable delete processing
				    
				    if (id != matchedCustId) nlapiLogExecution('debug', '!!! Updated customer id does NOT equal initially retrieved id !!!');
				    else {
						status = 'DELETED';		    	
			    		//nlapiLogExecution('debug', 'CUSTOMER UPDATE SUCCESSFUL');
			   		 }

			    }	
			}
			else {
				//Given address id not found in the list of customer's addresses
				errReason = 'NS Address ID does not exist for this customer';
				status = 'SKIPPED';
			}			   	
		}
		catch ( e )
		{
			if ( e instanceof nlobjError ) {
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				if (e.getCode() == 'RCRD_DSNT_EXIST') {
					errReason = 'NS Customer does NOT exist';
					status = 'SKIPPED';
				}
				else {
					errReason = 'NS Restlet SYSTEM ERROR for custId='+inCustId+':  ' + e.getCode() + '\n' + e.getDetails();
					status = 'ERROR';
				}		
			}		
			else {
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
				errReason = 'NS Restlet UNEXPECTED ERROR for custId='+inCustId+':  ' +  e.toString();
				status = 'ERROR';
			}		
		}		
		
		 var respdata = {matched: matchedStr, status: status, errReason: errReason, addrinAddrInfo: addrin};
		    
	    //nlapiLogExecution('debug', 'respdata=' + respdata);   
		//if(i==100 || i==200 || i==300 || i==400 || i==500) nlapiLogExecution('debug', firstKeys+' processed count=' + i);
		    
	    response.push(respdata);	
	}	
			 
	 //nlapiLogExecution('debug', '... returning respdata=' + JSON.stringify(response)); 
	 
	 var dataout = {matchedCount: matchedcnt, response: response};
	
	 //response.write(JSON.stringify(data));
	 
	 nlapiLogExecution('debug', firstKeys+' completed!');
	 
	return(JSON.stringify(dataout));
}


