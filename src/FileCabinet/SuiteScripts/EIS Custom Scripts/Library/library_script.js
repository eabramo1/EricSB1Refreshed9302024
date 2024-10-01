//
// Script:     script_library.js  
//
// Created by: Christine Neale, EBSCO, September 2013.  (Implemented 17Oct13)
//
// Purpose:    This is a script file library of utility script functions that may be called from other scripts.
//
//--------------------------------------------------------------------------------------------------------------
// Functions:  	Added:	 	Name: 		       	Description:
//				13Sep13		isPublisherRole		Returns T/F if current user is/is not using a Publisher Role.
//				13Sep13		stripHTML			Removes HTML from a text string.
//				13Sep13		isNull				Tests field for Null and returns field value or '' if null. 
//				20Sep15		setAddressLabel		Sets address label based on address type indicators and address lines 1 & 2
//              06May16     addApprover 		Determines whether current role is allowed to approve addresses.
//				06May16	 	trim				Trims an input string of leading and trailing blanks
//				14Jun17		ybpSupportMultiLangProfileCheck  US214281 Checks for one of the multi-language variants of the main YBP Support case profile
//
//
// Revisions:
//	17Oct2013	CNeale	Implemented & adjusted Publisher Role ID for Production Environment.
//		
//
//
//

//--------------------------------------------------------------------------//
//Function: isPublisherRole                                                 //
//Input   : None.                       									//
//Returns : T = Publisher Role, F = Not Publisher Role.						//
// Checks for:                                                              //
//				1080 = Subsc - Publisher Service	(Production role)	    //
//--------------------------------------------------------------------------//
function isPublisherRole()
{
	// Get Current Role
	var userRole = nlapiGetRole();

	if (userRole == 1080)
		{
		 return 'T';
		}
	else
		{
		 return 'F';
		}

//end: function isPublisherRole
}		

//-----------------------------------------------------------------------------//
// Function:	stripHTML
// Input:		Text string
// Returns:		Text string with HTML removed
//
//Purpose: 1. To remove an HTML from a text string	
//-----------------------------------------------------------------------------//
function stripHTML(oldString)
{
var newString = "";
var inTag = false;

for (var i = 0; i < oldString.length; i++) 
	 {
	  if (oldString.charAt(i) == '<') 
		 inTag = true;
	  if (oldString.charAt(i) == '>') 
	     {
		  if (oldString.charAt(i + 1) == "<") 
		     {
			  //Do nothing
			 }
		  else 
		     {
			  inTag = false;
			  i++;
			 }
		 }
		
	  if (!inTag) 
		 newString += oldString.charAt(i);	
	 }
return newString;
}

//--------------------------------------------------------------------------//
//Function: isNull                                                         //
//Input   : Field that needs to be tested for null.                        //
//Returns : Field value if field is not null.  Otherwise, an empty string. //
//--------------------------------------------------------------------------//
function isNull(fieldValue)
{
	
	if (fieldValue != null)
		{
		 return fieldValue;
		}
	else
		{
		 return '';
		}

//end: function isNull
}	

//--------------------------------------------------------------------------//
//Function: setAddressLabel													//
//Input   : main address indicator					                        //
//          billTo address indicator
//			shipTo address indicator
//			address line 1
// 			address line 2
//Returns : Address Label 													 //
//--------------------------------------------------------------------------//

function setAddressLabel(ismain,isbill,isship,addr1,addr2)
{
    var addlabel; 
	var i = 0;
	
	if (ismain == 'T' || isbill == 'T' || isship == 'T')
	{
		if (ismain == 'T')
		{
			addlabel = 'Main';
			i = i+1;
		}
		if (isbill == 'T')
		{
			if (i > 0)
			{
				addlabel = addlabel + ', BillTo';
			}
			else
			{
				addlabel = 'BillTo';
			}
			i = i+1;
		}
		if (isship == 'T')
		{
			if (i > 0)
			{
				addlabel = addlabel + ', ShipTo';
			}
			else
			{
				addlabel = 'ShipTo';
			}
		}
	}
	else
	{
		if (addr1)
		{
			addlabel = addr1;
		}
		else
		{
			addlabel = addr2;
		}
	}
 	
	return addlabel;
}

function addApprover()
//Checks whether current role is Address Approver role
//Returns true if role is SSD Approver (1100) or Administrator (3) or SSD Manager (1096)
{
	var role = nlapiGetRole();
	if (role == 3||role == 1100||role == 1096)
	{
		return true;
	}
	return false;
}


/* ----------------------------------------------------------------------------------------------------------------
*	
Function:	trim

Functionality:
Removes the leading and the trailing spaces from the input parameter

Deployment:
The script can be deployed on any form.

Event triggering the script:
	1) Can be used as function in any script.
*------------------------------------------------------------------------------------------------------------------
*/

function trim ( str ) 
{
    // Remove the leading spaces
	str = str.replace ( /^(\s)*/, "" ) ;

	// Remove the trailing spaces
	str = str.replace ( /(\s)*$/, "" ) ;

	// Return the trimmed string
	return str ;
}

/* ----------------------------------------------------------------------------------------------------------------
*	
Function:	ybpSupportMultiLangProfileCheck

Functionality:
Checks if profile is a YBP Support multi-language profile

Input: Profile id
Output: True = YBP multi-language profile, False <> YBP multi-language profile		
*------------------------------------------------------------------------------------------------------------------
*/
// US214281 YBP Multi-language profile changes

function ybpSupportMultiLangProfileCheck ( profileid ) 
{
	switch (profileid) {
    case '22':  			// YBP Support German
    case '23':				// YBP Support Italian
    case '24':				// YBP Support Italian/Spanish
    case '25':				// YBP Support Spanish/Portuguese
    case '26':				// YBP Support French
    	return true;
	}

	return false;
}