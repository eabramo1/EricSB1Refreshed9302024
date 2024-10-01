/**
 * Module Description
 * 

 */



function echoPostedData(datain) {
	nlapiLogExecution('debug', 'RESTLET TokenTest started');

	var status = 'UNKNOWN';
	var errReason = '';
	var echotxt = '';

		try {					
			if (datain.name !== null && datain.name !== '') {
			
				nlapiLogExecution('DEBUG', 'datain.name =' + datain.name);
				
				echotxt = "Hello " + datain.name;
		    
				nlapiLogExecution('DEBUG', 'echotxt = ' + echotxt);
				
				status = 'SUCCESS';
			}
		}  			
		catch ( e )
		{
			if ( e instanceof nlobjError ) {
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
				errReason = 'Token Test Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
				status = 'ERROR';						
			}		
			else {
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
				errReason = 'Token Test Restlet UNEXPECTED ERROR:  ' +  e.toString();
				status = 'ERROR';
			}		
		}		
				
	var dataout = {status: status, errReason: errReason, echoText: echotxt};
	
	nlapiLogExecution('debug', 'RESTLET TokenTest ended...');
	
	return(dataout);
}


