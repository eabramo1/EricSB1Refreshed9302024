/**
 * library2_utility.js
 * @NApiVersion 2.0
 */
//
// Script:     library2_utility.js  
//
// Created by: Eric Abramo	July 2021.  Posted to production in Sept 2021
//
// Purpose:    This is a script file library of commonly used functions accross many SuiteScript 2.0+ scripts
//
// Rules of Standardization:		Preface all Utility functions in this library script with "LU2_"
//
//-----------------------------------------------------------------------------------------------------------------------
// Functions Added:	 			Name: 		    Date and Description:									
//	LU2_getFieldValue			EAbramo			07-29-2021	Gets the value within a field							
//	LU2_disableField			EAbramo			07-29-2021	Disables or Enables a field on a form
//	LU2_setFieldValue			EAbramo			07-29-2021	Sets the value within a field	
//	LU2_isEmpty					EAbramo			07-29-2021	Determines if a field is empty or Not Empty
//  LU2_checkPermission			ZScannell		11-09-2021	Checks if a user is given permission via saved search
//	LU2_isEBSCOemail			ZScannell		05-19-2022	Checks if a user's email is EBSCO-affiliated
//	LU2_isJSONEmpty				ZScannell		02-16-2023	US1017301 Checks if a JSON is empty
//	LU2_isProdEnvironment		EAbramo			08-21-2024	F67336 Useful check to see if the environment is production or not
//------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	2022-03-16	ZScannell	TA804885 LU2_isEmpty Fixes
//	2023-11-01	ZScannell	US1123000	LU2_isEmpty Fixes - Handling dates
//	2024-08-01	eAbramo/kMcCormack	LU2_isEmpty Fixes - errors discovered (with Garrett)
//	2024-08-21	eAbramo		Adding LU2_isProdEnvironment for F67336
// ***********************************************************************************************************************

define(['N/search'], function(search){
	
	// 	-------------------------------------------------------------------------------------------
	//	Function Name: 	LU2_getFieldValue
	//	Purpose:		Retrieves the value of a field
	//	Input Parameters:
	//		record:		The record object which holds the field that you want to retrieve
	//		field:		The field Id of the field that you want to retrieve
	//	Returns:		the value of the field
    // --------------------------------------------------------------------------------------------
    function LU2_getFieldValue(record_in, field){
        var value = record_in.getValue({
            fieldId: field
        });
        return value;
    } 

    
	// 	-------------------------------------------------------------------------------------------
	//	Function Name: 	LU2_disableField
	//	Purpose:		Disables or Enables a field on a form
	//	Input Parameters:
	//		record:		The record object which holds the field that you want to enable or disable
	//		field:		The field Id of the field that you want to enable or disable
    //		flag:		true (to disable the field) or  false(to enable the field)
	//	Returns:		the record object as enabled or disabled
    // --------------------------------------------------------------------------------------------    
    function LU2_disableField(record_in, field_in, flag){
        record_in.getField(field_in).isDisabled = flag;
        return record_in;
    }

    
	// 	-------------------------------------------------------------------------------------------
	//	Function Name: 	LU2_setFieldValue
	//	Purpose:		Sets a field to a specified value
	//	Input Parameters:
	//		record:		The record object which holds the field that you want to set
	//		field:		The field Id of the field that you want to set
    //		value:		The value that you want to set the field to
	//	Returns:		The record object with its new value
    // --------------------------------------------------------------------------------------------
    function LU2_setFieldValue(record_in, field_in, val_in){
        record_in.setValue({
            fieldId: field_in,
            value: val_in
        });
        return record_in;
    }

    
	// 	-------------------------------------------------------------------------------------------
	//	Function Name: 	LU2_isEmpty
	//	Purpose:		Checks to see if a String is Empty using various Javascript methods
	//	Input Parameters:
	//		val:		A string
	//	Returns:		True if the string value is empty,  False if the string value is not empty
    // --------------------------------------------------------------------------------------------   
	function LU2_isEmpty(val_in){
		//	Test data type of input
		switch (typeof val_in){
			case "string":
	    		return (val_in === undefined || val_in === null || val_in === '' || val_in.trim() === '');
			case "object":
				//	Handle Arrays
				if(Array.isArray(val_in)){
					switch (val_in.length) {
						case 0:
							return true;
						case 1:
							switch (typeof val_in[0]) {
								case "string":
									return (val_in[0] === '' || val_in[0] === undefined || val_in[0].trim() === '');
								case "object":
									return (Object.keys(val_in[0]).length === 0);
								default:
									return true;
							}
						default:
							return false;
					}
				}
				//	Handle Dates
				else if (val_in instanceof Date){
					return false;
				}
				//	Handle Objects
				else{
					return (Object.keys(val_in).length === 0);
				}
			case "number":
				//	All numbers are non-empty
					return false
			//	Undefined/Null
			default:
				return true
		}

	}
	
	//--------------------------------------------------------------------------------------------------
	// Function Name: LU2_checkPermission
	// Purpose: Checks to see if a User is on a Saved Search that is acting as a list of people who have permission to a feature 
	//          (reserved for capabilities that CANNOT be broken down by role) 
	// Input Parameters:
	// 		user: User's internal id
	//		savedSearch: Saved Search containing the list of users with access to a feature
	// Returns:		True if the user is on the list + has permission, False if they are not located on the list.
	//---------------------------------------------------------------------------------------------------
	function LU2_checkPermission(user, savedSearch){
		var authorizedUsers = [];
		var s = search.load({
			id: savedSearch
		});
		s.run().each(function(result){
			authorizedUsers.push(result.getValue(result.columns[0]));
			return true;
		});
		log.error({
			title: 'Internal IDs of Users that are authorized',
			details: JSON.stringify(authorizedUsers)
		});
		if (authorizedUsers.includes(JSON.stringify(user))){
			return true;
		}else{
			return false;
		}
	};
	
	/*----------------------------------------------------------------------------------------------------------------
	 * Function   : LU2_isEBSCOemail(emailIn)
	 * Description: Checks for the presence of an "EBSCO" identifier string in input email
	 * Input      : emailIn = email to be checked
	 * Note       : Assumes emailIn is valid email containing @ sign
	 * US961740 - Recreated from library_utility
	 * Returns    : true if "EBSCO" email
	 *              false if not "EBSCO" email 
	 *-----------------------------------------------------------------------------------------------------------------*/
	function LU2_isEBSCOemail(emailIn){
		var emailIn_lc = emailIn.toLowerCase();
		var emailIn_lc_domain = emailIn_lc.substring(emailIn_lc.indexOf('@'));
		return (emailIn_lc_domain.indexOf('ebsco') == -1 && emailIn_lc_domain.indexOf('ybp') == -1 && 
				emailIn_lc_domain.indexOf('epnet') == -1) ? false : true;
	}
	
	/*----------------------------------------------------------------------------------------------------------------
	 * Function   : LU2_isJSONEmpty(obj)
	 * Description: Checks to see if a JSON object is truly empty
	 * Input      : obj = JSON object
	 * Returns    : true if the object is empty
	 * 				false if the object is NOT empty
	 *-----------------------------------------------------------------------------------------------------------------*/
	function LU2_isJSONEmpty(obj){
		for (var key in obj){
			if (Object.hasOwn(obj, key) && (obj[key] != [] && obj[key].length != 0)){
				return false;
			}
		}
		return true
	}

	/*----------------------------------------------------------------------------------------------------------------
	 * Function   : LU2_isProdEnvironment()
	 * Description: Checks to see if the runtime environment passed in is Production
	 * Input      : environ_in
	 * Returns    : true if environ_in is Production, false if not
	 *-----------------------------------------------------------------------------------------------------------------*/
	function LU2_isProdEnvironment(environ_in){
		log.audit('entering function: LU2_isProdEnvironment');
		if(environ_in !== 'PRODUCTION') {
			return false;
		}
		else{
			return true;
		}
	}



	return {
		LU2_getFieldValue: LU2_getFieldValue,
		LU2_disableField: LU2_disableField,
		LU2_setFieldValue: LU2_setFieldValue,
		LU2_isEmpty: LU2_isEmpty,
		LU2_checkPermission: LU2_checkPermission,
		LU2_isEBSCOemail: LU2_isEBSCOemail,
		LU2_isJSONEmpty: LU2_isJSONEmpty,
		LU2_isProdEnvironment: LU2_isProdEnvironment
	}
	
	
});