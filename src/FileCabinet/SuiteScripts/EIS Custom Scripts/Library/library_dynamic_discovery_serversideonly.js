//FOR USE WITH SERVER SIDE SCRIPTS ONLY.
//09-20-17:  Password updated for restuser@ebsco.com

//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	04-19-18	Jeff Oliver 		Hard-coded Rest End Point, username, and PW, and removed switch.  As a result of SB re-architecture,
//									all environments share the same values.
//	07-16-18	Christine Neale		US268765 Replace Rest End Point with dataCenterURLs Rest End Point. Remove Headers as no longer required.
//									Introduce Try/Catch to allow call to be tried several times on failure. 
//									Add in email alert on failure 
//  05-03-19	Christine Neale		US489444/US490649 Account specific domains - change in domain URL format for Forms.
//
//Init Global Variables
var eis_NS_systemDomain = '';
var eis_NS_restDomain = '';
var eis_NS_webservicesDomain = '';
var eis_NS_formsDomain = '';

//GetNetSuiteDomain - Returns the appropriate base url for the current NetSuite environment
//Parameter type must be one of the following: 'system'|'rest'|'webservices'|'forms'
//Example: pass parameter 'system' if you want the system domain ie 'https://system.netsuite.com' etc
//NOTE: Returns a value of '' if the URL has not been retrieved. 
function GetNetSuiteDomain(type) 
{
	// Only need to do this if global variables are unset (otherwise we already have domain info)
    if (eis_NS_systemDomain == '' || eis_NS_restDomain == '' || eis_NS_webservicesDomain == '' || eis_NS_formsDomain == '') 
    {

    	// Set the restEndPoint to be the REST dataCenterURLs Service (this does not require login)
        var acct = nlapiGetContext().getCompany();
        var restEndPoint = 'https://rest.netsuite.com/rest/datacenterurls?account=' + acct;
        var counter = 1;
        var exit = false;

        // Do/while loop attempts this 5 times in case of temporary connection issues
        do
        {
        	// try/catch to prevent script falling over due to error if nlapiRequestURL attempt fails 
        	try
        	{
		        var response = nlapiRequestURL(restEndPoint, null, null);
		        var responseArrayJSON = JSON.parse(response.getBody());
		        exit = true;
		        
//		        nlapiLogExecution('DEBUG', JSON.stringify(responseArrayJSON), JSON.stringify(responseArrayJSON));
//		        nlapiLogExecution('DEBUG', 'a', JSON.stringify(responseArrayJSON['webservicesDomain']));
		               
		
		        eis_NS_systemDomain = responseArrayJSON['systemDomain'];
		        eis_NS_restDomain = responseArrayJSON['restDomain'];
		        eis_NS_webservicesDomain = responseArrayJSON['webservicesDomain'];
		        // US490649 Forms domain has changed (& so has System domain)
//		        eis_NS_formsDomain = eis_NS_systemDomain.replace('system.', 'forms.');
		        eis_NS_formsDomain = eis_NS_systemDomain.replace('app.', 'extforms.');
        	}
        	catch(err)
        	{
        		// Attempt has failed - log it in the audit trail and then try up to 5 times in total
        		var errorcode = err.getCode();
        		nlapiLogExecution('ERROR','nlapiRequestURL Error',  'Error code = ' +errorcode);
        		counter +=1;
        	}
   
	    }
	    while (exit == false && counter < 6);


        
    	if (counter >= 6)
     	{
     		var emlSubj = 'NetCRM library_dynamic_discovery_serverside Error Alert';
     		var emlBody = 'nlapiRequestURL unsuccessful - Greater than 5 attempts to retrieve domain info.'; 
     		// Set Email Sender/Recipient to Mercury Alerts employee record
      		var emlFromTo = 4050413; 
     		nlapiSendEmail(emlFromTo, emlFromTo, emlSubj, emlBody, null, null, null, null, true);
     	}
    }
    
/*    nlapiLogExecution('DEBUG', 'counter = '+counter);
 	nlapiLogExecution('DEBUG', 'Systemdomain = ' + eis_NS_systemDomain); 
	nlapiLogExecution('DEBUG', 'Restdomain = ' + eis_NS_restDomain); 
	nlapiLogExecution('DEBUG', 'Webdomain = ' + eis_NS_webservicesDomain); 
 	nlapiLogExecution('DEBUG', 'Formsdomain = ' + eis_NS_formsDomain);  */


    switch(type) 
    {
        case 'system':
            return eis_NS_systemDomain;
        case 'forms':
            return eis_NS_formsDomain;
        case 'rest':
            return eis_NS_restDomain;
        case 'webservices':
            return eis_NS_webservicesDomain;
        default:
            return eis_NS_systemDomain;
    }
}

