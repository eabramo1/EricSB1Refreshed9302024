//
// Script:     library_message.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of Message script functions that may be called from other scripts.
//             Message specific library scripts should be added here. 
//
//------------------------------------------------------------------------------------------------------------------------
// Functions:  				Added:	 	Name: 		    Description:
// 
//
//-------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	03-19-18	Kate McCormack 		Added case_id (which uses join to case record)
//	03-20-18	Jeff Oliver			Added message_internal_only (which expects a true or false value)	
//
//-------------------------------------------------------------------------------------------------------------------------

var L_messageParmMapObject = {			
		message_id: {
			nsfieldName:	'internalid',	
			searchBy:		'anyof,noneof'
		},
		case_id: {
			nsfieldName:	'case.internalid',	
			searchBy:		'anyof,noneof',
			joinFrom:		'case'
		},
		message_internal_only: {
			nsfieldName:	'internalonly',	
			searchBy:		'is'
		}
};