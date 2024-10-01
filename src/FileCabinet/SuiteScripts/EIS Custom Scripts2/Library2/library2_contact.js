/**
 *  library2_contact.js
 *  @NApiVersion 2.0
 */
//
//  Script: library2_contact.js
//
//  Created By: Zachary Scannell - June 2022
//
//  Purpose: This is a script file library of commonly used functions across many contact-related Suitescript 2.0 scripts.
//
// ----------------------------------------------------------------------------------------------------------------------------------
//  Functions Added:                    Name:                   Date and Description:
//  hasApprovedECAccess                 ZScannell               2022-06-06  Determines whether a contact is currently Approved for EC Access.
//  givenECAccess                       ZScannell               2022-06-06  Determines whether a contact has been gratned access to EC.
//  isParentCompanyTransitionCustomer   ZScannell               2022-06-06  Determines whether a contact's parent company is a Transition Customer.
// -----------------------------------------------------------------------------------------------------------------------------------
//  Revisions:
//	ZScannell	08/09/2022	US994721 - Fixing defects with isParentCompanyTransitionCustomer (added InProg)
//	ZScannell	09/19/2022	TA754301 - Updated givenECAccess to includ LC2_SF_PortalUser_sts.InvExpir
// -----------------------------------------------------------------------------------------------------------------------------------

define(['N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
function(search, LC2Constant){

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: hasApprovedECAccess
    //  Purpose:    This function is used to determine whether the contact has a status of "User Active" for the 
    //              EC User Status or "Approved" for the Academy Access/Discussion Groups Access/Case Management 
    //              Access Statuses.
    //  Input Parameters:
    //      ecUserStatus - Contact's EBSCO Connect User Status
    //      acadAccStatus - Contact's Academy Access Status
    //      caseManStatus - Contact's Case Management Status 
    //      discGroupsAccStatus - Contact's Discussion Group Access Status
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function hasApprovedECAccess(ecUserStatus, acadAccStatus, caseManStatus, discGroupsAccStatus){
         return (ecUserStatus == LC2Constant.LC2_SF_PortalUser_sts.UserAct || acadAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved || 
            caseManStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved || discGroupsAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved) ? true : false;
    }

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: givenECAccess
    //  Purpose:    This function is used to determine whether the contact has been given access to EC by the 
    //              EBSCO Connect User Status has changed to "User Active" or "Invitation in Progress" OR one
    //              of the Academy Access Status/Case Management Access Status/Discussion Groups Access Status
    //              has changed to "Approved" or "Granted".
    //  Input Parameters:
    //      ecUserStatus - Contact's EBSCO Connect User Status
    //      acadAccStatus - Contact's Academy Access Status
    //      caseManStatus - Contact's Case Management Status 
    //      discGroupsAccStatus - Contact's Discussion Group Access Status
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function givenECAccess(ecUserStatus, acadAccStatus, caseManStatus, discGroupsAccStatus){
        return (ecUserStatus == LC2Constant.LC2_SF_PortalUser_sts.UserAct || ecUserStatus == LC2Constant.LC2_SF_PortalUser_sts.InvInProg || ecUserStatus == LC2Constant.LC2_SF_PortalUser_sts.SendInv || ecUserStatus == LC2Constant.LC2_SF_PortalUser_sts.InvExpir ||
            acadAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved || acadAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Granted || 
            caseManStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved || caseManStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Granted || 
            discGroupsAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Approved || discGroupsAccStatus == LC2Constant.LC2_SF_EcAccessLevels_sts.Granted) ? true : false;
    }

    // --------------------------------------------------------------------------------------------------------
    //  Function Name: isParentCompanyTransitionCustomer
    //  Purpose:    This function is used to determine whether the contact's parent company is an existing transition
    //              customer or not.
    //  Input Parameters:
    //      parentCompany - Contact's Parent Company Internal ID
    //  Returns:    True/False
    // ---------------------------------------------------------------------------------------------------------
    function isParentCompanyTransitionCustomer(parentCompany){
        var custLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: parentCompany,
            columns: ['custentity_refctr_transition_status', 'custentity_explora_transition_status', 'custentity_ehost_transition_status', 'custentity_eds_transition_status']
        });
        for (var key in custLookup){
            if (custLookup.hasOwnProperty(key)){
                var array = custLookup[key];
                // Filtering out unset transition statuses
                if (array.length != 0){
                    var value = array[0].value;
                    if (value == LC2Constant.LC2_Transition_sts.Complete || value == LC2Constant.LC2_Transition_sts.InProg){
                        return true;
                        break;
                    }
                }
            }
        }
        return false;
    }

    return {
        hasApprovedECAccess: hasApprovedECAccess,
        givenECAccess: givenECAccess,
        isParentCompanyTransitionCustomer: isParentCompanyTransitionCustomer
    }
})