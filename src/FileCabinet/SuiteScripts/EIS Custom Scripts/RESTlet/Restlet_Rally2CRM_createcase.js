/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 March 2017	  Jeff Oliver
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */

var CONSTANTS = {
		customform: 111, //DS Engineer Case Form
		profile: 1, //EBSCO Information Services (DDE Support)
		priority: 2 //Medium (hard code this)
		
	};



function createCaseUsingPostedData(datain) {
	nlapiLogExecution('debug', 'RESTLET createCase started');

	var status = 'UNKNOWN';
	var errReason = '';
	var validData = true;
	var employee_ID = '';
	var issupportrep = true;
	var missingfields = '';
	var missingfields_cleaned = '';
	var id = '';

		try {				
			errReason = '';			
			
			//Check and see if all required fields have been passed in with data
			
			if (datain.title == null || datain.title == '') {
				validData = false;
				missingfields = ', Title';
			}
			
			if (datain.activityType == null || datain.activityType == '') {
				validData = false;
				missingfields = missingfields + ', Activity Type';
			}
			if (datain.area1 == null || datain.area1 == '') {
				validData = false;
				missingfields = missingfields + ', Area 1';
			}
			if (datain.status == null || datain.status == '') {
				validData = false;
				missingfields = missingfields + ', Status';
			}
			if (datain.company == null || datain.company == '') {
				validData = false;
				missingfields = missingfields + ', Company';
			}
			
			if (missingfields != null && missingfields != '') {
				missingfields_cleaned = missingfields.substring(2);
			}
			
			
			
			if (validData == true) {
	

			
			//Lookup employee info
			
			var emp_employee = datain.empEmail;
			nlapiLogExecution('debug', 'datain.empID=' + datain.empEmail);

		    //Define search criteria
		    var filters = new Array();
		    filters[0] = new nlobjSearchFilter('email',null,'is', emp_employee);
		    //filters[1] = new nlobjSearchFilter('isSupportRep',null,'is','T');
		    //filters[2] = new nlobjSearchFilter('email',null,'is', emp_employee); JO check to see if employee needs to be active

		    //Define result columns to be returned
		    var columns = new Array();
		    columns[0] = new nlobjSearchColumn('firstname');
		    columns[1] = new nlobjSearchColumn('lastname');
		    columns[2] = new nlobjSearchColumn('department');
		    columns[3] = new nlobjSearchColumn('issupportrep');
		    columns[4] = new nlobjSearchColumn('giveaccess');
		    
		    nlapiLogExecution('DEBUG', 'Before employee search, filters[0] email =' + emp_employee);

		    //Perform the search
		    var employeeRec = nlapiSearchRecord('employee',null,filters,columns);
		    
		    if(employeeRec != null)  nlapiLogExecution('DEBUG', 'After employee search, employeeRec results length =' + employeeRec.length);

		    //Loop through the results
		    for ( var i = 0; employeeRec != null && i < employeeRec.length; i++ )
		    {
		    var empId = employeeRec[i].getId();
		    var empFirstname = employeeRec[i].getValue('firstname');
		    var empLastname = employeeRec[i].getValue('lastname');
		    var empDepartment = employeeRec[i].getValue('department');
		    var isSuppRep = employeeRec[i].getValue('issupportrep');
		    
		    nlapiLogExecution('DEBUG', 'employeeRec['+i+'] empId = ' + empId);
		    nlapiLogExecution('DEBUG', 'employeeRec['+i+'] empFirstname = ' + empFirstname);
		    nlapiLogExecution('DEBUG', 'employeeRec['+i+'] empLastname = ' + empLastname);
		    nlapiLogExecution('DEBUG', 'employeeRec['+i+'] empDepartment = ' + empDepartment);
		    
		    employee_ID = empId
		    
			if (isSuppRep != 'T') {
				issupportrep = false;
			}
			
		    
		    }   
		    
			if(employee_ID!='' && issupportrep == true) {
				status = 'SUCCESS'
					
					
				nlapiLogExecution('DEBUG', 'Entering createRecord');
				nlapiLogExecution('DEBUG', 'Profile =' + CONSTANTS.profile);
				
				
				var ca = nlapiCreateRecord('supportcase');
				ca.setFieldValue('customform',CONSTANTS.customform);
				ca.setFieldValue('profile',CONSTANTS.profile);
				ca.setFieldValue('title',datain.title);
				ca.setFieldValue('custevent_dse_activity_type',datain.activityType);
				ca.setFieldValue('custevent_dse_area',datain.area1);
				ca.setFieldValue('custevent_dse_area2',datain.area2);
				ca.setFieldValue('priority',CONSTANTS.priority);
				ca.setFieldValue('status',datain.status);
				ca.setFieldValue('assigned', employee_ID);
				ca.setFieldValue('company', datain.company);
				ca.setFieldValue('custevent_dse_pre_post_sales', datain.prePostSales);
				ca.setFieldValue('custevent_itemproduct', datain.itemProduct);
				ca.setFieldValue('custevent_interface', datain.dseInterface);
				ca.setFieldValue('incomingmessage', datain.incomingmessage);
				
				
				id = nlapiSubmitRecord( ca );
				nlapiLogExecution('DEBUG', 'id =' + id);
				
			}
	
			else {
				if(issupportrep == false){
					errReason = 'Employee doesnt have Support Rep box checked';
					status = 'ERROR';
				}
				else {
				errReason = 'Invalid Employee email address';
				status = 'ERROR';
				}
			}
			

		
			
			//var id = nlapiSubmitRecord(obj);
			
		    nlapiLogExecution('DEBUG', 'Leaving createRecord');
		      
							
		    
			}
			else {
				//Required fields missing
				errReason = 'Missing the following required fields: ' + missingfields_cleaned;
				status = 'ERROR';
				
			}
		}  
			
			
		catch ( e )
		{
			if ( e instanceof nlobjError ) {
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
				errReason = 'NS createCase Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
				status = 'ERROR';						
			}		
			else {
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
				errReason = 'NS createCase Restlet UNEXPECTED ERROR:  ' +  e.toString();
				status = 'ERROR';
			}		
		}		
				
	var dataout = {status: status, errReason: errReason, caseID: id};
	
	nlapiLogExecution('debug', 'RESTLET createCase ended...');
	
	return(dataout);
}


