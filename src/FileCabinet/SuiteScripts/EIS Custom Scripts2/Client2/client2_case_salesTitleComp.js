/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
//----------------------------------------------------------------------------------------------------------------
//Script:		client2_case_salesTitleComp.js
//				Written in SuiteScript 2.1
//
//Created by:	Zachary Scannell 09/2022
//Revisions:  
//  3/14/2024   Pat Kelleher    US1238305 Make Meeting Date field mandatory when 'Needed for Meeting' is chosen as a Request Reason. Also brought in Utility function in two additional areas.
//
//
//----------------------------------------------------------------------------------------------------------------
define(['N/runtime', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_case', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility'],
function(runtime, L2Constants, L2Case, L2Utility) {
    
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
       const currentRec = scriptContext.currentRecord;
       const currentUser = runtime.getCurrentUser();
       // US1238305 While in code PK updated code below to bring in utility function
       if (L2Utility.LU2_isEmpty(currentRec.getValue({fieldId: 'id'})) == true){
            // Assign to the Competitive Analysis Group
            // Set "Employee" field to currentUser
            // Set "Send Email" checkbox and "Internal Only" Checkbox
            // look at company field - if it's populated (with a REAL company), then set the customer + set Company field to current user
            L2Case.L2_initialize_newSalesCase(record_in = currentRec, assignee_in = L2Constants.LC2_Employee.CompetAnalysis, user_in = currentUser.id, scase_customer_in = currentRec.getValue({fieldId: 'custevent_case_customer_list'}));
            
            // Set Help Desk flag
            currentRec.setValue({
                fieldId: 'helpdesk',
                value: true,
                ignoreFieldChange: true
            });

            // US929531 change target date from two weeks out to one week out & make field uneditable by all except EP - Competitive Analysis Group (id=1056) & Sales Admin (id=1007) & Admin (id=3) roles
		    // set target date to two weeks out 
            let myDate = new Date();
            myDate.setDate(myDate.getDate() + 7);
            currentRec.setValue({                   
                fieldId: 'custevent_target_date',
                value: myDate,
                ignoreFieldChange: true
            });
       }    // End of new Case logic

       // Set Sales Admin Case type to "Title Comparison" (2)
       currentRec.setValue({
           fieldId: 'custevent31',
           value: L2Constants.LC2_SalesCaseType.TitleComparison,
           ignoreFieldChange: true
       });
       // Set the Help Desk flag if it's not populated
       // US1238305 While in code PK updated code below to bring in utility function
       if (L2Utility.LU2_isEmpty(currentRec.getValue({fieldId: 'helpdesk'})) == true){
            currentRec.setValue({
                fieldId: 'helpdesk',
                value: true,
                ignoreFieldChange: true
            });           
       }
       // Disable the Created By field
       currentRec.getField({fieldId: 'custeventcustsat_prj_emp'}).isDisabled = true;

        if (L2Constants.LC2_Role.isRoleSalesCaseAdmin(currentUser.role) == false){
            currentRec.getField({fieldId: 'assigned'}).isDisabled = true;
            currentRec.getField({fieldId: 'status'}).isDisabled = true;
            currentRec.getField({fieldId: 'priority'}).isDisabled = true;
            currentRec.getField({fieldId: 'custeventcustsat_prj_days'}).isDisabled = true;
            currentRec.getField({fieldId: 'company'}).isDisabled = true;
            currentRec.getField({fieldId: 'outgoingmessage'}).isDisabled = true;
            currentRec.getField({fieldId: 'custevent24'}).isDisabled = true;    // Comparison Type
        }

        // US929531 - Make Need By Date field uneditable by all except EP - Competitive Analysis Group (1056), Sales Admin (1007), & Admin (3) roles
        if (currentUser.role != L2Constants.LC2_Role.CompetAnalysis && currentUser.role != L2Constants.LC2_Role.EPSalesAdmin && currentUser.role != L2Constants.LC2_Role.Administrator){
            currentRec.getField({fieldId: 'custevent_target_date'}).isDisabled = true;
        }
    } // end pageInit


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
        var record = scriptContext.currentRecord;
        var reqReason = record.getValue({fieldId: 'custevent23'});
        var meetDate = record.getValue({fieldId: 'custevent49'});


        // US1238305 Make Meeting Date field mandatory when 'Needed for Meeting' is chosen as a Request Reason
        if(reqReason == L2Constants.LC2_RequestReason.NeededForMtg && L2Utility.LU2_isEmpty(meetDate) == true){
            alert ('When Needed for Meeting is chosen as a Request Reason, an Upcoming Meeting Date is required. Please populate this date field.');
            return false;
        }

        return true;

    } // end saveRecord function


    // Library function needs to be housed inside of another function. If passed directly in the return statement, it runs on pageLoad. If anyone can think of another solution please feel free to change me!
	function copyOriginalMessage(){
		L2Case.L2_copyMessageButton()
	}

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        copyOriginalMessage: copyOriginalMessage
    };
    
});