/*
 * File:  Restlet_CreateCase.js 
 *
 * Module Description:  When this Restlet is called it will allow the user to create a case within NetCRM
 
 * 		Library Scripts Used:
 			library_case.js  -- Library Script functions will be called for field validation for all relevant fields.
 			library_constants.js -- Library Script used to reference constant values		
 
 * JSON input expected: 
 			Required (for all cases)
 				
 				{
				"case_profile":"[profile ID]",
				"case_subject":"[subject line of case]",
				"case_incomingmessage":"[message from customer]",
				"case_institution":"[customer internal ID]",
				"case_origin":"[origin ID'",
			
  			  	Additional fields:
  				
  				///Specifically For BasicCase = 'T' (basic case-capture-like cases)///
  				
				"case_contact":"[contact internal ID]",
				"case_email":"[email]",
				"case_priority":"[priority internal ID]",
				"basicCase":"[T/F]"
				}


																					
 *  JSON output expected: 
				"restlet_status": "SUCCESS",
				"case_id": "[case ID]",
				"case_number": "[case number]",
				"restlet_status_details": "Case Created: [case ID]"

 * 
 *  Link to Documentation: 
 *  
 * Version    Date            	Author				Remarks
 * 1.00       05/14/2018		Jeff Oliver			US333773 RESTlet - Create Restlet for Create Case
	
 * 
 */



//- Global Variables ---------------------------------------------------------------//

	// Restlet Status Global Variables
	var restlet_status = 'ERROR'; 
	var restlet_status_details = '';
//----------------------------------------------------------------------------------//	
	
function CreateCase(datain)  
{
	nlapiLogExecution('debug', 'RESTLET CreateCase started'); 
	
	// Set Global Variables (defined in library_case.js)
	// parameters to track validity of data -- assume valid
	L_case_validData = true;
	L_case_invalidfields = ''; 


	// parameters to clean invalid field details
	var invalidFields_cleaned = ''; //trims off the lead comma
	var case_id = '';
	var case_number = '';


	
	try
	
	{  	
		
		// Create the Case.  
		var ca = nlapiCreateRecord('supportcase');
		
		//-------------------------------------------------------------------------//
		//------------------Required Fields (all case forms)-----------------------//
		//-------------------------------------------------------------------------//
		
		//--Profile-------------------------------------------
		
		if (datain.case_profile == null || datain.case_profile == '') 
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', missing Profile';
		}
		else 
		{
			ca.setFieldValue('profile',datain.case_profile);
		}
		
		//--Title---------------------------------------------
		
		if (datain.case_subject == null || datain.case_subject == '') 
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', missing Subject';
		}
		else 
		{
			ca.setFieldValue('title',datain.case_subject);
		}
		
		//--Customer------------------------------------------
		
		if (datain.case_institution == null || datain.case_institution == '') 
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', missing Institution';
		}
		else 
		{
			ca.setFieldValue('company',datain.case_institution);
		}
		
		//--Origin--------------------------------------------
		
		if (datain.case_origin == null || datain.case_origin == '') 
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', missing Origin';
		}
		else 
		{
			ca.setFieldValue('origin',datain.case_origin);
		}
		
		//--Incoming Message---------------------------------------
		
		if (datain.case_incomingmessage == null || datain.case_incomingmessage == '') 
		{
			L_case_validData = false;
			L_case_invalidfields = L_case_invalidfields + ', missing Incomingmessage';
		}
		else 
		{
			ca.setFieldValue('incomingmessage', datain.case_incomingmessage);
			ca.setFieldValue('messagenew', 'T');
		}
	
			//-------------------------------------------------------------------------//
			//------------------basic case capture-type cases--------------------------//
			//-------------------------------------------------------------------------//
			
			
			if (datain.basicCase == 'T')
			{

				
				//--Contact------------------------------------------------
				
				if (datain.case_contact != null && datain.case_contact != '') 
				{
					ca.setFieldValue('contact', datain.case_contact);
				}
				
				//--Contact email-- (we are allowing input to set email to blank)------------------
				
				if (datain.case_email != null) 
				{
					ca.setFieldValue('email', datain.case_email);
				}
				
				//--Priority------------------------------------------------
				
				if (datain.case_priority != null && datain.case_priority != '') 
				{
					ca.setFieldValue('priority', datain.case_priority);
				}
				
				//--Status------------------------------------------------
				
				ca.setFieldValue('status',LC_CaseStatus.NotStarted); 
			}
			
			else
			//not a basic case, currently not handling
			{		L_case_validData = false;
					L_case_invalidfields = '  Restlet only supports BasicCases at the moment';
					
			}
		
			
			
		if (L_case_validData == true)
		{
			case_id = nlapiSubmitRecord( ca );
			case_number = nlapiLookupField('supportcase', case_id, 'casenumber')
			nlapiLogExecution('DEBUG', 'id =' + case_id);
			restlet_status = 'SUCCESS';
			restlet_status_details = 'Case Created: ' + case_id;
		}
		
		else 
		{
			if (L_case_invalidfields)
			{
				invalidFields_cleaned = L_case_invalidfields.substring(2);
				nlapiLogExecution('debug', 'validData NOT true',  'invalidfields: '+invalidFields_cleaned);
				//Required fields missing
				restlet_status = 'ERROR';
				restlet_status_details = 'Field errors: ' + invalidFields_cleaned;	
			}		
		}
	}	
	
		
	
	catch ( e )
	{
		if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				
			restlet_status_details = 'CreateCase Restlet SYSTEM ERROR:  ' + e.getCode() + '\n' + e.getDetails();
			restlet_status = 'ERROR';						
		}		
		else
		{
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			restlet_status_details = 'CreateCase Restlet UNEXPECTED ERROR:  ' +  e.toString();
			restlet_status = 'ERROR';
		}		
	}		
	
	var dataOut = {restlet_status: restlet_status, case_id: case_id, case_number: case_number, restlet_status_details: restlet_status_details};
	nlapiLogExecution('debug', 'RESTLET CreateCase ended...');	
	return(dataOut);
	

} // End of function CreateCase




