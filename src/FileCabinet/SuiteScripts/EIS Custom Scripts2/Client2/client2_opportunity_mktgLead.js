/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_opportunity_mktgLead.js
//				Written in SuiteScript 2.1
//
//Created by:	Eric Abramo 07-2024
//
//Purpose:		Refactoring code from SuiteScript 1 client script that is used for the Marketing Lead Opportunity form
//              This was all a part of US1277955:  SuiteSign-On Replacement for NetCRM as OIDC Provider and OAuth2.0
//
//Library Scripts Used: library2_constants, library2_utility (linked in define statement)
//
//
//Revisions:
//          08/22/2024  eAbramo     US1277423 SSO Replacement Defect Fixes
//          09/11/2024  eAbramo     TA933073 Sept 2024 Code Fix - Lori Reed needs to save MLO's with bad addresses
//
//----------------------------------------------------------------------------------------------------------------

define(['N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],

function(runtime, search, lconstant, utility) {

    // Global Variables
    //KM 02-02-18:  US302111 - Add new global variable that will indicate when the MLO needs to be written to WinSeR
    let writeToWinSR = false;
    var leadStatusOnLoad = null;
    var contactDateOnLoad = null;
    var customer_onLoad = null;
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        // alert('PageInit function');

        var record = scriptContext.currentRecord;
        var mode = scriptContext.mode;
        contactDateOnLoad = record.getValue('custbody_lead_init_contact_date');
        leadStatusOnLoad = record.getValue({ fieldId: 'custbody_lead_status' });
        customer_onLoad = record.getValue({ fieldId: 'entity' });
        var thisRole = runtime.getCurrentUser().role;

        // 2016-12-09 Display the Lead Assigned To as Mandatory
        record.getField({ fieldId: 'custbody_lead_assigned_to' }).isMandatory = true;

        // if new record
        if (mode === 'create') {
            // set 'Lead assigned To' to the current user
            record.setValue({
                fieldId: 'custbody_lead_assigned_to',
                value: runtime.getCurrentUser().id
            });
            // set the "Real" Opportunity Status to "1-Qualify" (7)
            record.setValue({
                fieldId: 'entitystatus',
                value: lconstant.LC2_Oppy_sts.QualCollectAnalysis
            });

            // set the entity/Customer field to "ns231089 EBSCO Marketing Leads"
            if (utility.LU2_isEmpty(customer_onLoad) === true){
                record.setValue({
                    fieldId: 'entity',
                    value: lconstant.LC2_Customer.EbscoMktgLeads
                });
            }
        } else { // this is not a new record
            if (runtime.getCurrentUser().role != lconstant.LC2_Role.Administrator) {
                // disable the customform field
                record.getField({ fieldId: 'customform' }).isDisabled = true;
            }
        }

        // US192395 Lock fields in MLO for WinSer integration
        if (g_LeadStatus.LockLeadStatusField(leadStatusOnLoad) === true) {
            record.getField({ fieldId: 'custbody_quote_contact' }).isDisabled = true; // Lead Contact
            record.getField({ fieldId: 'entity' }).isDisabled = true; // Customer
            record.getField({ fieldId: 'custbody_lead_status' }).isDisabled = true; // Lead Status
            record.getField({ fieldId: 'entitystatus' }).isDisabled = true; // Status
            record.getField({ fieldId: 'projectedtotal' }).isDisabled = true; // Projected Total
            record.getField({ fieldId: 'probability' }).isDisabled = true; // Probability
            record.getField({ fieldId: 'expectedclosedate' }).isDisabled = true; // Expected Close Date
            // Note two sublist fields below rather than body fields
            record.getSublistField({sublistId: 'item', fieldId: 'item', line: '0'}).isDisabled = true; //Item Name
            record.getSublistField({sublistId: 'item', fieldId: 'amount', line: '0'}).isDisabled = true; // Item Amount
        }

        // US475216 4.18.19
        // If user is a Marketing Role (LC_MktgRoles) or MuvData Web Service (LC_MuvDataWebSvc)
        // call function to determine whether role passed in is a Marketing role
        if (lconstant.LC2_Role.IsMktgRole(thisRole) || thisRole === lconstant.LC2_Role.MuvDataWebSvc) {
            // and there is no Lead Status (this is a new Lead) - set Lead Status to "2-Lead Qualified"
            if (utility.LU2_isEmpty(leadStatusOnLoad) === true) {
                record.setValue({
                    fieldId: 'custbody_lead_status',
                    value: g_LeadStatus.Qualified,
                    ignoreFieldChange: true
                });
            }
            // lock down three Sales Fields
            record.getField({ fieldId: 'custbody_lead_notes_sales' }).isDisabled = true;
            record.getField({ fieldId: 'custbody_lead_init_contact_date' }).isDisabled = true;
            record.getField({ fieldId: 'custbody_lead_followup_date' }).isDisabled = true;
        } else {
            // otherwise lock down Marketing Fields
            record.getField({ fieldId: 'custbody_lead_mktg_campaign_tactic' }).isDisabled = true;
            record.getField({ fieldId: 'custbody_lead_source_marketo' }).isDisabled = true;
            record.getField({ fieldId: 'custbody_lead_notes_mktg' }).isDisabled = true;
        }

        // Disable fields that the Muv data web service needs to populate but people shouldn't populate via UI
        record.getField({ fieldId: 'salesrep' }).isDisabled = true;
        record.getField({ fieldId: 'custbody_oppty_form_type' }).isDisabled = true;
        record.getField({ fieldId: 'custbody_is_lead_oppty' }).isDisabled = true;

    } // End PageInit



    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
        // Tried this code but it doesn't work -- I don't want to allow for unset of Customer field
        /*
        const record = scriptContext.currentRecord;
        switch (scriptContext.fieldId){
            // US1277423 SSO Replacement Defect Fixes
            case 'entity':
                var customer = record.getValue({ fieldId:'entity'});
                // US1277423 SSO Replacement Defect Fixes
                if(utility.LU2_isEmpty(customer) === true){
                    // alert('The Customer CAN be changed however it cannot be cleared out.  The customer has been reset to its original value');
                    return false;
                }
        }
        */
        return true;
    }


    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        var record = scriptContext.currentRecord;
        var fieldName = scriptContext.fieldId;


        switch(fieldName) {
            case 'custbody_lead_notes_sales':
                //alert('fieldChange on custbody_lead_notes_sales');
                var lead_sales_notes = record.getValue({fieldId: 'custbody_lead_notes_sales'});
                var lead_initContactDate = record.getValue({fieldId: 'custbody_lead_init_contact_date'})
                // if Lead Sales Notes is populated and Lead Contact Date isn't populated - auto-set the date
                if(utility.LU2_isEmpty(lead_sales_notes) != true && utility.LU2_isEmpty(lead_initContactDate) === true){
                    let myDate = new Date();
                    record.setValue({
                        fieldId: 'custbody_lead_init_contact_date',
                        value: myDate,
                        ignoreFieldChange: true
                    })
                }
                // If Follow Up Date isn't populated - set it to 7 days out
                var lead_FollowUpDate = record.getValue({fieldId: 'custbody_lead_followup_date'})
                if(utility.LU2_isEmpty(lead_sales_notes) != true && utility.LU2_isEmpty(lead_FollowUpDate) === true){
                    let myDate = new Date();
                    myDate.setDate(myDate.getDate()+7);
                    record.setValue({
                        fieldId: 'custbody_lead_followup_date',
                        value: myDate,
                        ignoreFieldChange: true
                    })
                }
                break;

            case 'custbody_lead_init_contact_date':
                //alert('fieldChange on custbody_lead_init_contact_date');

                var newContactDate = record.getValue({fieldId: 'custbody_lead_init_contact_date'})
                var today3 = new Date();
                var mSecToHrs = 1000 * 60 * 60;
                var ageInHrs = (today3 - newContactDate) / mSecToHrs;
                ageInHrs = Math.round(ageInHrs);
                // alert('ageInHrs is: '+ageInHrs);
                if (ageInHrs > 24)
                {	// If date is more than 24 hours in past then set Lead Contact Date to Contact Date on load - and tell user
                    record.setValue({
                        fieldId: 'custbody_lead_init_contact_date',
                        value: contactDateOnLoad,
                        ignoreFieldChange: true
                    })
                    alert('Error: Lead - Contact Date cannot be in the past');
                }
                break;

            case('entity'):
                //alert('fieldChange on entity');
                var customer = record.getValue({ fieldId:'entity'});
                var leadStatus = record.getValue({ fieldId:'custbody_lead_status'});
                // If User Changes the Customer field
                if (leadStatus === g_LeadStatus.Qualified && utility.LU2_isEmpty(customer) != true) {
                    var sales_rep = record.getValue({ fieldId:'salesrep'});
                    // Call function to set the Lead AssignedTo field and tell end-user that it's being reassigned
                    setLeadAssignedTo(record, sales_rep);
                }
                // US1277423 SSO Replacement Defect Fixes
                if(utility.LU2_isEmpty(customer) === true){
                    record.setValue({
                        fieldId: 'entity',
                        value: customer_onLoad,
                        ignoreFieldChange: true
                    })
                    alert('The Customer CAN be changed however it cannot be cleared out.  The customer has been reset to its original value');
                }
               break;

            case('custbody_lead_status') :
                //alert('fieldChange on custbody_lead_status');
                writeToWinSR = false;
                var leadStatus = record.getValue({ fieldId:'custbody_lead_status'});
                var customer = record.getValue({ fieldId:'entity'});
                // US192395: Don't Allow User to set Lead Status to any WinSer Statuses
                if(g_LeadStatus.NotAllowedinUI(leadStatus) === true){
                    record.setValue({
                        fieldId: 'custbody_lead_status',
                        value: leadStatusOnLoad,
                        ignoreFieldChange: true
                    })
                    alert('Users are not allowed to set the Lead Status to a WinSeR value. The Lead Status has been reset to its original value');
                    break;
                }
                // 2018-03-05 If Stage of Customer is Customer don't allow Lead Status
                // to 'Convert Prospect to Customer'
                if (leadStatus === g_LeadStatus.SuccessConvert) {
                    var lkup_cust = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: customer,
                        columns: ['stage', 'address']
                    })
                    var customer_stage = lkup_cust.stage[0].value;
                    var cust_addr = lkup_cust.address;
                    //alert('customer_stage is '+customer_stage);
                    if (customer_stage === 'CUSTOMER') {
                        record.setValue({
                            fieldId: 'custbody_lead_status',
                            value: leadStatusOnLoad,
                            ignoreFieldChange: true
                        })
                        alert('Lead Status of \'8 - Lead Success: Convert to Customer\' is reserved for Prospect Customers only. The Lead Status has been reset to its original value');
                        break;
                    }
                    //2021-07-22 US806481 -- warning if address is still "[no street address provided]"
                    if(cust_addr.indexOf('[no street address provided]') > 0)
                    {
                        alert('This Prospect\'s address is listed as "[no street address provided]" because it arrived through EBSCO.com.  Prior to saving this Opportunity as \'8 - Lead Success Convert to Customer\' you will need to edit the Prospect Customer and provide a valid address.');
                        break;
                    }
                }
                // If user is a Marketing Role (LC_MktgRoles) or MuvData Web Service (LC_MuvDataWebSvc)
                // call function to determine whether role passed in is a Marketing role
                // US730039 - Lead - Status value of 5-Lead Contact Unresponsive internal id = 9 removed from code - value inactivated in NetCRM
                var this_role = runtime.getCurrentUser().role;
                //alert('this_role is '+this_role);
                //alert('lconstant.LC2_Role.MuvDataWebSvc is '+lconstant.LC2_Role.MuvDataWebSvc);
                if (lconstant.LC2_Role.IsMktgRole(this_role) === true || String(this_role) === lconstant.LC2_Role.MuvDataWebSvc) {
                    // If user sets Lead Status to (4, 5, or 6) "4-Contacted", "8-Closed-Successful", "6-Closed-Unsuccessful/Lost"
                    // US192395 add (19, 20) "Won - Send to WinSeR", "Won (Books and Flipster)"
                    if (g_LeadStatus.NotAllowedforMarketingRole(leadStatus) === true) {
                        record.setValue({
                            fieldId: 'custbody_lead_status',
                            value: leadStatusOnLoad,
                            ignoreFieldChange: true
                        })
                        alert('Marketing Roles cannot set the Lead Status to this value. The Lead Status has been reset to its original value');
                        break;
                    }
                    if (leadStatus === g_LeadStatus.Qualified) {
                        if (utility.LU2_isEmpty(customer) != true && customer != lconstant.LC2_Customer.EbscoMktgLeads) {
                            var sales_rep = record.getValue({fieldId: 'salesrep'});
                            // Call function to set the Lead AssignedTo field and tell end-user that it's being reassigned
                            if (utility.LU2_isEmpty(sales_rep) != true) {
                                // Set Lead Assigned To and tell the User
                                setLeadAssignedTo(record, sales_rep);
                            }
                        } else {
                            alert('The EBSCO Customer is unknown, please assign this Lead to the appropriate Sales Rep')
                        }
                    }
                }   // end isMarketing Role or MuvDataWebSvc
                //	US192395 - Add Validation when user selects Lead Status of 'Won -Send to Winser'
                if (leadStatus === g_LeadStatus.SuccessSendtoWinSeR) {	// DE30945 RE-DO all code around Send To WinSeR
                    // alert('changing LeadStatus to SuccessSendtoWinSeR');
                    var OkaytoSendToWinSer = true;
                    var cannotSendToWinSeR_Reason = ', '
                    // 1) Do Not Allow 'Send To WinSeR' if Opportunity hasn't been Saved Yet
                    //KM 02-02-18:  US302111 - Check to make sure that the MLO has been previously saved and therefore has an opptyId, before we allow it to be written to WinSeR
                    var opptyId = record.getValue({ fieldId:'id'});
                    if (utility.LU2_isEmpty(opptyId) === true) {
                        OkaytoSendToWinSer = false;
                        cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Marketing Lead Opportunity must first be saved. ';
                    }
                    // 2) Do Not Allow 'Send To WinSeR' if There is No Customer
                    if (utility.LU2_isEmpty(customer) === true) {
                        OkaytoSendToWinSer = false;
                        cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Marketing Lead Opportunity must have a valid Customer. ';
                    }
                    else {
                        // 3) Do Not Allow 'Send To WinSeR' if Customer is Stage Lead, Prospect
                        var lkup_cust = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: customer,
                            columns: ['stage','custentity_oeapproved']
                        })
                        var customer_stage = lkup_cust.stage[0].value;
                        var oe_approved = lkup_cust.custentity_oeapproved;
                        if (customer_stage === 'PROSPECT' || customer_stage === 'LEAD')
                        {
                            OkaytoSendToWinSer = false;
                            cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' The Prospect/Lead must first be converted to a Customer.  You can convert the Prospect to a Customer by updating the Lead Status to \'8 - Lead Success: Convert to Customer\'.  The customer must also be Approved by DDE Order Processing. ';
                        }
                        // 4) if Customer isn't OE Approved
                        else if (customer_stage === 'CUSTOMER' && oe_approved === false){
                            OkaytoSendToWinSer = false;
                            cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This Customer does not yet exist in WinSer.  Once the customer is approved by DDE Order Processing this Marketing Lead item can be sent to WinSeR. ';
                        }
                    }
                    // 5) Do Not Allow 'Send To WinSeR' if There is more than one Product on the Marketing Lead Opportunity
                    var itemCount = record.getLineCount({sublistId: 'item'});
                    if (itemCount > 1) {
                        OkaytoSendToWinSer = false;
                        cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' There is more than one Item in this Marketing Lead Opportunity. ';
                    }
                    // Item level validation
                    else if (itemCount === 1) {
                        //for (var k = 1; k <= itemCount; k++) {
                        var business_line = record.getSublistValue({
                            sublistId: 'item',
                            fieldId:'custcol_sourced_business_line',
                            line: 0
                        })
                        var isPerpetual = record.getSublistValue({
                            sublistId: 'item',
                            fieldId:'custcol_sourced_isperpetual',
                            line: 0
                        })
                        // 6) Do Not Allow 'Send To WinSeR' if Prod Offering is DDE Not a Sellable Item
                        if (business_line === 'Not a DDE Sellable Item'){
                            OkaytoSendToWinSer = false;
                            cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' This item isn\'t supported in WinSeR. ';
                        }
                        // 7) Do Not Allow 'Send To WinSeR' if Prod Offering is Flipster
                        else if (business_line === 'FLIPSTER') {
                            OkaytoSendToWinSer = false;
                            cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' Flipster items aren\'t supported in WinSeR. ';
                        }
                        // 8) Do Not Allow 'Send To WinSeR' if Prod Offering is eBook Perpetual
                        if (business_line === 'NL - NetLibrary' && isPerpetual === true) {
                            OkaytoSendToWinSer = false;
                            cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason + ' eBook Perpetual items aren\'t supported in WinSeR. '
                        }
                        //}   // end for loop
                    }
                    // Otherwise set writeToWinSR = true;
                    if (OkaytoSendToWinSer === true) {
                        writeToWinSR = true;
                    }
                    else {
                        record.setValue({
                            fieldId: 'custbody_lead_status',
                            value: leadStatusOnLoad,
                            ignoreFieldChange: true
                        })
                        cannotSendToWinSeR_Reason = cannotSendToWinSeR_Reason.substring(2);
                        alert('You cannot set the Lead Status to \'8 - Lead Success: Send to WinSeR\': '+cannotSendToWinSeR_Reason);
                    }
                } // end set Lead Status to 'Won -Send to Winser'
            break;
        } // end switch fieldName


    } // end fieldChanged




    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        // alert('you just clicked save');
        var record = scriptContext.currentRecord;
        var numLines = record.getLineCount({sublistId: 'item'});
        var leadAssignedTo = record.getValue({fieldId: 'custbody_lead_assigned_to'});
        var customer = record.getValue({ fieldId: 'entity'});
        var contact = record.getValue({ fieldId:'custbody_quote_contact'});
        var leadStatus = record.getValue({ fieldId:'custbody_lead_status'});
        // alert('leadStatus is '+leadStatus);
        if(utility.LU2_isEmpty(customer) != true){
            var cust_lkup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customer,
                columns: ['address', 'custentity_epterritory', 'custentity_marketsegment']
            })
            var cust_addr = cust_lkup.address;
            var ep_terr = cust_lkup.custentity_epterritory;
            //var ep_terr = cust_lkup.custentity_epterritory[0].value;
            var mkt_segment = cust_lkup.custentity_marketsegment;
        }
        else{
            alert("Customer is required for a Lead");
            return false;
        }
        var lead_close_date = record.getValue({ fieldId:'custbody_lead_close_date'});
        var lead_sales_notes = record.getValue({ fieldId:'custbody_lead_notes_sales'});
        var lead_initContactDate = record.getValue({ fieldId:'custbody_lead_init_contact_date'});
        var oppty_status = record.getValue({ fieldId: 'entitystatus'});
        var lead_priority = record.getValue({ fieldId: 'custbody_lead_priority'});
        var is_lead = record.getValue({ fieldId: 'custbody_is_lead_oppty'});
        var oppty_formtype = record.getValue({ fieldId: 'custbody_oppty_form_type'});
        // alert('oppty_status is '+oppty_status);

        // Require at least one line item
        if(numLines < 1) {
            alert("You must enter at least one item for this Lead");
            return false;
        }
        if(numLines > 1) {
            alert("You cannot have more than one line item in a Marketing Lead Opportunity");
            return false;
        }

        // 2016-12-09 Lead Assigned To is Mandatory (can't be set as Mandatory on form because of MUV tool
        if (utility.LU2_isEmpty(leadAssignedTo) === true) {
            alert("Please enter a value for: Lead - Assigned To");
            return false;
        }
        // If Setting Lead Status to "Success" Require Customer and contact value
        if(g_LeadStatus.SuccessAll(leadStatus) === true){
            if(utility.LU2_isEmpty(customer) === true || customer === lconstant.LC2_Customer.EbscoMktgLeads){
                alert('Customer is required for Leads with a Status of "Success".  The \'EBSCO Marketing Unqualified Leads\' customer cannot be used');
                return false;
            }
            if(utility.LU2_isEmpty(contact) === true){
                alert('Contact is required for Leads with a Status of "Success"');
                return false;
            }
            // TA933073 Sept 2024 Code Fix - Lori Reed needs to save MLO's with bad addresses
            //          Below 4 "if" statements need to be nested into "g_LeadStatus.SuccessAll(leadStatus) === true" logic
            // US806481 additional check on Street Address
            if (cust_addr.indexOf('[no street address provided]') > 0) {
                alert('This Prospect\'s address is listed as "[no street address provided]" because it arrived through EBSCO.com.  Please edit the Prospect customer and provide a valid address.');
                return false;
            }
            if (utility.LU2_isEmpty(cust_addr) === true){
                alert('In order to move this lead to "Success" the Customer/Prospect needs a Main Address and a Territory');
                return false;
            }
            // 2016-10-10 Marketo Integration - ensure customer has TERRITORY
            if (utility.LU2_isEmpty(ep_terr) === true) {
                alert('In order to move this lead to "Success" the Customer/Prospect needs a Main Address and a Territory');
                return false;
            }
            // 2016-10-10 Marketo Integration - ensure customer has SEGMENT
            if (utility.LU2_isEmpty(mkt_segment) === true){
                alert('In order to move this lead to "Success" the Customer/Prospect needs a Market Segment');
                return false;
            }
        }

        // Set Lead Close Date value when closing Lead
        if (g_LeadStatus.UnsuccessOrSuccess(leadStatus) === true) {
            if (utility.LU2_isEmpty(lead_close_date) === true) {
                let myDate = new Date();
                record.setValue({
                    fieldId: 'custbody_lead_close_date',
                    value: myDate,
                    ignoreFieldChange: true
                })
            }
        }
        else if (g_LeadStatus.QualifyInfoContacted(leadStatus) === true) {
            // if not Closed Lost nor Closed-Won and lead close date IS populated - then clear it
            if(utility.LU2_isEmpty(lead_close_date) === false) {
                record.setValue({
                    fieldId: 'custbody_lead_close_date',
                    value: '',
                    ignoreFieldChange: true
                })
            }
        }

        // 2016-10-31 Ensure there's a Reason Lost if this lead is Closed-Unsuccessful
        // if Lead Status = "6 - Closed Unsuccessful" - but Lead Status on load was different
        if (leadStatus === g_LeadStatus.Unsuccessful && leadStatusOnLoad != g_LeadStatus.Unsuccessful) {
            var reasons_lost = record.getValue({fieldId: 'custbody_winser_reasonslost'});
            if (utility.LU2_isEmpty(reasons_lost) === true) {
                alert('In order to save this Lead Opportunity you must select a Reason Lost');
                return false;
            }
        }
        // Require "Lead - Sales Notes" to be populated when Contacted - or Successful or Unsuccessful
        if (leadStatus === g_LeadStatus.Contacted || g_LeadStatus.UnsuccessOrSuccess(leadStatus) === true ){
            if(utility.LU2_isEmpty(lead_sales_notes) === true){
                alert('Lead - Sales Notes is required if the Lead Status is "Contacted", "Closed" or "Success"');
                return false;
            }
            if(utility.LU2_isEmpty(lead_initContactDate) === true){
                alert('Lead - Initial Contact Date is required if the Lead Status is "Contacted", "Closed" or "Success"');
                return (false);
            }
        }

        // Priority is required for UI Edits
        if (utility.LU2_isEmpty(lead_priority) === true){
            alert('Lead Priority is required');
            return false;
        }

        // set the is Lead Oppty flag
        if (utility.LU2_isEmpty(is_lead) === true){
            record.setValue({
                fieldId: 'custbody_is_lead_oppty',
                value: true,
                ignoreFieldChange: true
            })
        }
        // set the Opportunity form Type field
        if(oppty_formtype != lconstant.LC2_OppyFormType.MktgLead){
            record.setValue({
                fieldId: 'custbody_oppty_form_type',
                value: lconstant.LC2_OppyFormType.MktgLead,
                ignoreFieldChange: true
            })
        }

        // BEGIN SET ENTITYSTATUS FIELD
        // 	US192395 If Lead Status indicates not in WinSer but in progress 2,3,4
        if(g_LeadStatus.QualifyInfoContacted(leadStatus) === true){
            if(oppty_status != lconstant.LC2_Oppy_sts.Dev){
                record.setValue({
                    fieldId: 'entitystatus',
                    value: lconstant.LC2_Oppy_sts.Dev,
                    ignoreFieldChange: false
                })
            }
        }
        else if(g_LeadStatus.proposalNegotiation(leadStatus) === true){
            if(oppty_status != lconstant.LC2_Oppy_sts.Prop){
                record.setValue({
                    fieldId: 'entitystatus',
                    value: lconstant.LC2_Oppy_sts.Prop,
                    ignoreFieldChange: false
                })
            }
        }
        else if(g_LeadStatus.won(leadStatus) === true){
            if(oppty_status != lconstant.LC2_Oppy_sts.ClosedWon){
                record.setValue({
                    fieldId: 'entitystatus',
                    value: lconstant.LC2_Oppy_sts.ClosedWon,
                    ignoreFieldChange: false
                })
            }
        }
        else if(leadStatus === g_LeadStatus.Unsuccessful || leadStatus === g_LeadStatus.WinSerLost){
            if(oppty_status != lconstant.LC2_Oppy_sts.ClosedLost){
                record.setValue({
                    fieldId: 'entitystatus',
                    value: lconstant.LC2_Oppy_sts.ClosedLost,
                    ignoreFieldChange: false
                })
            }
        }
        // END SET ENTITYSTATUS FIELD (so that NetCRM displays it correctly as lost/won etc)

        //KM 02-02-18:  US302111 - Add logic to open a new window on Save that calls the new writeMLO suitelet if the MLO needs to be written to WinSeR
        if (writeToWinSR) {
            // customer
            //alert('checking to see if this code fires');
            var lkup_cust = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customer,
                columns: ['entityid']
            })
            var cust = lkup_cust.entityid;
            var opptyId = record.getValue({fieldId: 'id'})
            // alert('opptyId is '+opptyId);
            var itemId = '';
            var itemCount = record.getLineCount({sublistId: 'item'});
            if (itemCount === 1) {
                itemId = record.getSublistValue({
                    sublistId: 'item',
                    fieldId:'item',
                    line: 0
                })
            }
            else{
                alert('Error: You can only have one item in this Marketing Lead');
                return false
            }
            var item_lkup = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['custitem_productoffering_code']
            })
            var prdOffId = item_lkup.custitem_productoffering_code;
            // alert('prdOffId is '+prdOffId);
            // US893888 Modify Marketing Lead Push to WinSer - added idType parameter of 'MLO' to URL (01-14-2022)
            //window.open('/app/site/hosting/scriptlet.nl?script=1011&deploy=1&cid='+cust+'&opptyId='+opptyId+'&prdOffId='+prdOffId+'&idType=mloId');
            // US1277955  SuiteSign-On Replacement - MLO and Campaign ID - NEW URL TO CALL
            // US1277423 SSO Replacement Defect Fixes - make it environment agnostic
            var url = "";
            //alert('crmIdsIn is ' + crmIdsIn);
            if(utility.LU2_isProdEnvironment(runtime.envType) === true){
                url = "https://wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
            }
            else{
                url = "https://qa-wsr.epnet.com/WSR/api/homeForWinser/oauth2?cid=";
            }
            window.open(url+cust+'&prdOffId='+prdOffId+'&mloId='+opptyId);
        }


        return true;
    } // end saveRecord

    /**
     * Function setNewAssignedTo
     *      Purpose:    Set the Lead Assigned To field and tells the user that the Lead has been assigned to Rep X
     *      Input:
     *              record_in:      The MLO record object
     *              sales_rep_in:   The Internal ID of the Sales Rep that this MLO will be assigned to
     *      Returns:    N/A
     * */

    function setLeadAssignedTo(record_in, sales_rep_in){
        // alert('I am now in the setLeadAssignedTo function');
        var lkup_salesrep = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: sales_rep_in,
            columns: ['entityid']
        })
        var salesrepname = lkup_salesrep.entityid;
        // set the "Lead - Assigned To" to equal to the Sales Rep on the Customer record
        // and tell the User
        record_in.setValue({
            fieldId: 'custbody_lead_assigned_to',
            value: sales_rep_in,
            ignoreFieldChange: false
        })
        alert('This Lead has been assigned to the Primary Sales Rep of: '+salesrepname);
    }

    
    /* ----------------------------------------------------------
    * g_LeadStatus object - Supports the Lead Status list
    * 		US1277955
    *--------------------------------------------------------------*/
    var g_LeadStatus = {
        Qualified :				'2',
        Informational :			'3',
        Contacted :				'4',
        Unsuccessful :			'6',
        WinSerDvlp :			'10',
        WinSerQte :				'11',
        WinSerNgtn :			'12',
        WinSerRnwl :			'13',
        WinSerPOFVRB :			'14',
        WinSerPOFOut :			'15',
        WinSerPOFIn :			'16',
        WinSerWon :				'17',
        WinSerLost :			'18',
        SuccessSendtoWinSeR :	'19',
        SuccessOther :			'20',
        SuccessConvert :		'21',
        /*
         * Function		:	LockLeadStatusField(LeadStatusIn)
         * Description	:	Determines whether the Lead Status field should be locked on the MLO form during Page Init
         * Input		:	LeadStatusIn
         * Returns		:	true = Lock the Lead Status field -or-  false = Do Not Lock the Lead Status field
        */
        LockLeadStatusField: function(LeadStatusIn) {
            return (LeadStatusIn == this.WinSerDvlp || LeadStatusIn == this.WinSerQte ||
                LeadStatusIn == this.WinSerNgtn || LeadStatusIn == this.WinSerRnwl || LeadStatusIn == this.WinSerPOFVRB ||
                LeadStatusIn == this.WinSerPOFOut || LeadStatusIn == this.WinSerPOFIn  || LeadStatusIn == this.WinSerWon ||
                LeadStatusIn == this.WinSerLost || LeadStatusIn == this.SuccessSendtoWinSeR) ? true : false;
        },
        /*
         * Function		:	NotAllowedinUI(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses that are NOT allowed to be set in the UI
         * Input		:	LeadStatusIn
         * Returns		:	true = Lead Status is Not allowed to be set.  False it is allowed
         * 	*/
        NotAllowedinUI: function(LeadStatusIn){
            return (LeadStatusIn == this.WinSerDvlp || LeadStatusIn == this.WinSerQte ||
                LeadStatusIn == this.WinSerNgtn || LeadStatusIn == this.WinSerRnwl || LeadStatusIn == this.WinSerPOFVRB ||
                LeadStatusIn == this.WinSerPOFOut || LeadStatusIn == this.WinSerPOFIn  || LeadStatusIn == this.WinSerWon ||
                LeadStatusIn == this.WinSerLost) ? true : false;
        },
        /*
         * Function		:	NotAllowedforMarketingRole(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses that are NOT allowed to be set in the UI
         * Input		:	LeadStatusIn
         * Returns		:	true = Lead Status is Not allowed to be set.  False it is allowed
         * 	*/
        NotAllowedforMarketingRole: function(LeadStatusIn){
            return (LeadStatusIn == this.Contacted || LeadStatusIn == this.Unsuccessful ||
                LeadStatusIn == this.SuccessSendtoWinSeR || LeadStatusIn == this.SuccessOther) ? true : false;
        },
        /*
         * Function		:	SuccessAll(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses where a Cusotmer and Contact are Required
         * Input		:	LeadStatusIn
         * Returns		:	true = Lead Status where Customer and contact are required otherwise False
         * 	*/
        SuccessAll: function(LeadStatusIn){
            return(LeadStatusIn == this.SuccessSendtoWinSeR || LeadStatusIn == this.SuccessOther ||
                LeadStatusIn == this.SuccessConvert) ? true : false;
        },
        /*
         * Function		:	UnsuccessOrSuccess(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses where a LeadCloseDate needs to be set
         * Input		:	LeadStatusIn
         * Returns		:	true = Lead Status where a LeadCloseDate needs to be set otherwise False
         * 	*/
        UnsuccessOrSuccess: function(LeadStatusIn){
            return(LeadStatusIn == this.Unsuccessful || LeadStatusIn == this.SuccessSendtoWinSeR ||
                LeadStatusIn == this.SuccessOther || LeadStatusIn == this.SuccessConvert) ? true : false;
        },
        /*
         * Function		:	QualifyInfoContacted(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses where a Lead CloseDate gets cleared out
         * Input		:	LeadStatusIn
         * Returns		:	true = Lead Status where the Lead CloseDate gets cleared out otherwise False
         * 	*/
        QualifyInfoContacted: function(LeadStatusIn){
            return(LeadStatusIn == this.Qualified || LeadStatusIn == this.Informational ||
                LeadStatusIn == this.Contacted) ? true : false;
        },
        /*
         * Function		:	proposalNegotiation(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses which are in Negotiation
         * Input		:	LeadStatusIn
         * Returns		:	true = in Negotiation Status
         * 	*/
        proposalNegotiation: function(LeadStatusIn){
            return (LeadStatusIn == this.WinSerDvlp || LeadStatusIn == this.WinSerQte ||
                LeadStatusIn == this.WinSerNgtn || LeadStatusIn == this.WinSerRnwl || LeadStatusIn == this.WinSerPOFVRB ||
                LeadStatusIn == this.WinSerPOFOut || LeadStatusIn == this.WinSerPOFIn  ||
                LeadStatusIn == this.SuccessSendtoWinSeR) ? true : false;
        },
        /*
         * Function		:	won(LeadStatusIn)
         * Description	:	Returns true for Lead Statuses which are in Negotiation
         * Input		:	LeadStatusIn
         * Returns		:	true = in Negotiation Status
         * 	*/
        won: function(LeadStatusIn){
            return (LeadStatusIn == this.SuccessOther || LeadStatusIn == this.WinSerWon ||
                LeadStatusIn == this.SuccessConvert) ? true : false;
        }
    }
    
    
    
    return {
        pageInit: pageInit,
        validateField, validateField,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});