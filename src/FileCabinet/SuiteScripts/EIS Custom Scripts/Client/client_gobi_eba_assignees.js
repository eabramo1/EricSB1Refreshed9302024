/*
 * Script:  client_gobi_eba_assignees.js 
 *
 * Description:  Form script for GOBI EBA Case Assignee Custom Record Form
 * 		
 * 		Library Scripts Used:
 * 			None
 */
//
// Amendment Log:-
//  C Neale		06/21/2018		F24082 Initial version.
//  	
//
//-----------------------------------------------------------------------------------------------------------------------------------------//
////Field Changed Event
function FormFieldChanged(type, name) 
{

    //assignee field changed - set Name = value
    if (name == 'custrecord_gobi_eba_case_assign_assignee') 
    {
        var assigneeFieldText = nlapiGetFieldText('custrecord_gobi_eba_case_assign_assignee');
        nlapiSetFieldValue('name', assigneeFieldText);
    }
}