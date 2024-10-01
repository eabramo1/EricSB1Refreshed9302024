/* ****************************************************************************************************************** */
/* INCLUDE THIS LIBRARY SCRIPT IN ANY FORM PROCESSING THAT HAS CONDITIONAL LOGIC BASED ON THE ENVIRONMENT IT RUNS IN  */
/* ****************************************************************************************************************** */

/* Revision Log:-
 * ******************************************************************************************************************************** 
 * KMcCormack	06/02/2015	US131761:  NetCRM Sandbox Automation/PI - Internal NetCRM
 * 										- Create this new library script which can be used by any form's client side script when
 * 										there is a reason for different values or logic based on the current environment.  This 
 * 										will remove the need for recoding of these values/scripts when a sandbox is refreshed and 
 * 										also when future changes are migrated from dev to QA to prod environments.
 * CNeale		12/19/2016	US167245	Adjust SANDBOX Case statement.
 * JOliver		4/18/2018	TA247195	Update base_url and base_url_with_account for SB1-refresh-2024-09-30, SB2, SB3 and Preview
 * JOliver		3/5/19	TA335128		Update base_url and base_url_with_account to use the new account-specific domain
 *    
 * ********************************************************************************************************************************
 */

/*Global Environment Object*/
var CurrentEnvironment = {
		name: "",
		base_url: "",	
		base_url_with_account: "",	
		isProd: false			
}

/* Global constants */
var productionSettings = {	
		name: "PRODUCTION",
		base_url: "https://392875.app.netsuite.com",	
		base_url_with_account: "https://392875.app.netsuite.com/c.392875",		
		isProd: true
	 };
var sandbox1Settings = {
		name: "SANDBOX1",
		base_url: "https://392875-sb1.app.netsuite.com",		
		base_url_with_account: "https://392875-sb1.app.netsuite.com/c.392875_SB1",	
		isProd: false
	 };
var sandbox2Settings = {	
		name: "SANDBOX2",
		base_url: "https://392875-sb2.app.netsuite.com",		
		base_url_with_account: "https://392875-sb2.app.netsuite.com/c.392875_SB2",
		isProd: false
	 };
var sandbox3Settings = {
		name: "SANDBOX3",
		base_url: "https://392875-sb3.app.netsuite.com",	
		base_url_with_account: "https://392875-sb3.app.netsuite.com/c.392875_SB3",	
		isProd: false
	 };
var previewSettings = {	
		name: "PREVIEW",
		base_url: "https://392875-rp.app.netsuite.com",	
		base_url_with_account: "https://392875-rp.app.netsuite.com/c.392875_RP",	
		isProd: false
	 };


var currContext = nlapiGetContext();
var currAcct = currContext.getCompany();
//alert('DEBUG: currAcct = ' + currAcct);
var currEnv = currContext.getEnvironment();
//alert('DEBUG: currEnv = ' + currEnv);
	
switch(currEnv) {
	case "PRODUCTION":
		populateValues(productionSettings);
		break;
	case "SANDBOX":
		if(currAcct.indexOf("_SB2") != -1)
		{
			populateValues(sandbox2Settings);
		}
		else if(currAcct.indexOf("_SB3") != -1)
		{
			populateValues(sandbox3Settings);
		}
		else
		{
			populateValues(sandbox1Settings);
		}
		break;
	case "BETA":
		populateValues(previewSettings);
		break;
	default:
		alert('ERROR: currEnv = ' + currEnv);
}

/* alert('DEBUG: CurrentEnvironment Object: ' + '\n' +
 		'name					= ' + CurrentEnvironment.name + '\n' +
 		'base_url				= ' + CurrentEnvironment.base_url + '\n' +
 		'base_url_with_account	= ' + CurrentEnvironment.base_url_with_account + '\n' +
 		'isProd					= ' + CurrentEnvironment.isProd);
*/
function populateValues(envConstantsObject)
{
	CurrentEnvironment.name = envConstantsObject.name;	
	CurrentEnvironment.base_url = envConstantsObject.base_url;	
	CurrentEnvironment.base_url_with_account = envConstantsObject.base_url_with_account;	
	CurrentEnvironment.isProd = envConstantsObject.isProd;			
}

