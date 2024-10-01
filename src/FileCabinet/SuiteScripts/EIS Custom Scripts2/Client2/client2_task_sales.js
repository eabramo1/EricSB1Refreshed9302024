/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/runtime', 'N/format', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],

    /* *  Originally created by: Krizia Ilaga (NSACS Consultant) 2/28/2019 - SS2 script that was housed in the SS1 folder structure and was calling the now inactive library_constants_ss2.js script.
 *      Consolidation of two script files: client_task_EIS_toDo.js and client_task_ep.js

    Recreated and partially refactored (mostly Roles) by Pat Kelleher 11/2/2023 in SS2 folder - inactivated original script.  Completed refactoring Dec 2023 by PKelleher.

  * Library Files used:  library2_constants.js
 *
 * Revision History:
 * C Neale				04-01-2019  F24174 implementation
 * P Kelleher			03.15.2021  US931667 - removing code re Task Type = Training ('8') b/c its being moved to Call Topics Other and adding similar code under Call Topics
 * P Kelleher           10.26.2023  US115773 Make DATE VISITED mandatory when CONFERENCE/EBSCO EVENT Task Type is chosen (Visit was already coded to be mandatory)
 *                                  Also moved library_constants.ss2.js code over to library2_constants.js,  replaced functions below and removed old script in define statement
 *                                  including updating all ROLES using new ss2 functions
 * P Kelleher           11.3.2023   US1187134 Give Sales Admin role ability to update all task fields at any time and do not make the Date Visited field mandatory for Sales Admin & Admin roles*
 * P Kelleher           12.4.2023 thru 2/21/24 - TA872986 Refactor remainder of script (role refactoring done with US115773)
 * P Kelleher           02.16.2024  US1227761 Make CONFERENCE field mandatory when CONFERENCE/EBSCO EVENT Task Type is chosen
 */
 function(search, runtime, format, constant) {
 var role;
    
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
        var record = scriptContext.currentRecord;
        var user = runtime.getCurrentUser();
        var subscriptionFlag = false; //flag to check the Subscriptions product line
        var subscriptionTopics = new Array();
        var mode = scriptContext.mode;
        role = runtime.getCurrentUser().role;

        record.getField({fieldId: 'custevent_subs_call_topics'}).isVisible = false; // values in subs call topics box

        var ddeTask = getFValue(record, 'custevent_ddea_task'); // used on old task form
        var isTaskForm = getFValue(record, 'custevent_nsacs_acsformflag');
        var message = getFValue(record, 'message');
        var pLineSubDdea = getFValue(record, 'custevent_pline_subscriptions_ddea'); // SSD Products checkbox (Product Line)
        var pLineAaas = getFValue(record, 'custevent_pline_aaas');
        var pLineAmaJama = getFValue(record, 'custevent_pline_ama_jama');
        var pLineMaHealth = getFValue(record, 'custevent_pline_mahealth');
        var pLineSage = getFValue(record, 'custevent_pline_sage');

            if(ddeTask == true && isTaskForm == false){
                // setting hidden Is Sales Task Form checkbox to True - set flag if it was on only form and not on this one
                setFValue(record, 'custevent_nsacs_acsformflag', true);
                // setting Call/Visit Notes field with text in hidden Message field
                setFValue(record, 'custevent_subs_call_notes_summary', message); // Call/Visit Notes field  // message field is hidden COMMENTS field on Task form - use Web Svs form to see field
                // Note: the 4 PLine values below are inactive on form but kept here to account for old task forms being opened
                if(pLineAaas == true){
                    subscriptionTopics.push(constant.LC2_SubsCallTopics.Aaas);
                }
                if(pLineAmaJama == true){
                    subscriptionTopics.push(constant.LC2_SubsCallTopics.AmaJama);
            }
                if(pLineMaHealth == true){
                    subscriptionTopics.push(constant.LC2_SubsCallTopics.MaHealth);
                }
                if(pLineSage == true){
                    subscriptionTopics.push(constant.LC2_SubsCallTopics.Sage);
                }
                if(pLineSubDdea == false && subscriptionTopics.length > 0){
                    setFValue(record, pLineSubDdea, true);
            }
        }

            var fsCall = getFValue(record, 'custevent_is_sea_call'); // Field Sales Call checkbox
            if(fsCall == true && isTaskForm == false){
                setFValue(record, 'custevent_nsacs_acsformflag', true); // hidden Is Sales Task Form checkbox
        }

            // setting Is Sales Form checkbox and Status
            if(mode == 'create' || mode == 'copy'){
                setFValue(record, 'custevent_nsacs_acsformflag', true);
                setFValue(record, 'status', constant.LC2_TaskStatus.InProgress); // the 'real' Task Status field

                // setting checkbox flags
            if(constant.LC2_Role.IsRoleNonSales(role)){
                setFValue(record, 'custevent_nscas_nonsales', true) // Non-Sales checkbox
            }
            else if(constant.LC2_Role.IsRoleAcctExecAndPhone(role)){
                setFValue(record, 'custevent_ddea_task', true); // Account Exec. Call checkbox
            }
            else if(constant.LC2_Role.IsRoleFieldSalesAndVisit(role)){
                setFValue(record, 'custevent_is_sea_call', true); // Field Sales Call checkbox
            }

            //Task Type default based on role
            if(constant.LC2_Role.IsRoleFieldSalesAndVisit(role)){
                    setFValue(record, 'custevent_tasktype', constant.LC2_TaskType.Visit);
            }
            else if(constant.LC2_Role.IsRoleAcctExecAndPhone(role)){
                    setFValue(record, 'custevent_tasktype', constant.LC2_TaskType.PhoneCall);
            }

            //Follow-up date set to two weeks from date today
            var dateToday = new Date();
            dateToday.setDate(dateToday.getDate()+14);
                setFValue(record, 'duedate', dateToday);
            } // end mode is 'create or copy' section

        else{
            var employeeLookup = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: user.id,
                columns: ['issalesrep']
            });

            // US1187134 Give Sales Admin role ability to update all task fields at any time and do not make the Date Visited field mandatory for Sales Admin & Admin roles
            if(employeeLookup.issalesrep == true && (role != constant.LC2_Role.Administrator && role != constant.LC2_Role.EPSalesAdmin)){
                // determine age of task in hours
                var dateCreated = getFValue(record, 'createddate');
                // alert(`dateCreated: ${dateCreated}`);
                var today = new Date();
                var mSecToHrs = 1000 * 60 * 60;
                var ageInHrs = (today - dateCreated) / mSecToHrs;

                //For international reps, lock fields after 7 days
                if(constant.LC2_Role.IsRoleIntlSalesRep(role)){
                    console.log(ageInHrs);
                    if(ageInHrs > 168){
                            record.getField('title').isDisabled = true;
                            record.getField('message').isDisabled = true
                            record.getField('custevent_tasktype').isDisabled = true;
                            record.getField('custeventdate_visited').isDisabled = true;
                            record.getField('custevent_subs_call_notes_summary').isDisabled = true; // Call/Visit Notes field
                            record.getField('custevent_subs_call_notes_further').isDisabled = true; // Action Items field
                    }
                }
                    else{ //For domestic reps, lock fields after 36 hours / 1.5 days
                    if(ageInHrs > 36){
                        record.getField('title').isDisabled = true;
                        record.getField('message').isDisabled = true;
                        record.getField('custevent_tasktype').isDisabled = true;
                        record.getField('custeventdate_visited').isDisabled = true;
                        record.getField('custevent_subs_call_notes_summary').isDisabled = true; // Call/Visit Notes field
                        record.getField('custevent_subs_call_notes_further').isDisabled = true; // Action Items field
                    }
                }
            }
        }

        // US165568 Work out if multiselect Product Line has already been populated - only perform processing if not populated
        // This code populates the multiselect Product Line for "old" tasks where it has not previously been populated & the No Store Topics
            var varPline = getFValue(record, 'custevent_ms_prod_line'); // hidden field called MULTI SELECT PRODUCT LINE
            var initTopics = getFValue(record, 'custevent_subs_call_topics'); // values on subs call topics
            if(mode == 'copy' || mode == 'edit'){
            if(!varPline[0] || varPline.length == 0 || subscriptionFlag == true){
                // Work through all the Topics and check that they relate to checked off Product Lines - if not check off.
                var it_len = initTopics.length;
                for( var i = 0; i < it_len; i++){
                    if (initTopics[i] != ''){
                        var tpline = search.lookupFields({
                            type: 'customrecord_subs_call_topics',
                            id: initTopics[i],
                            columns: ['custrecord_sct_product_line']  // doing a lookup on the custom record to get the related product line - field id found when opening a call topic
                        });

                        if(tpline.length > 0){
                            if (tpline[0].value){
                                var tpline_id = search.lookupFields({
                                    type: 'customrecord_call_prod_line',
                                    id: tpline,
                                    columns: ['custrecord_cpl_script_id']
                                });
                                    if(getFValue(record, tpline_id) != true)
                                        setFValue(record, tpline_id, true); // this is going to the Call Topic Product Line custom record scriptID and pulling the name and then matching the name with the NS custevent field id
                            }
                        }
                    }
                }

                // Work through all the Product Lines and if checked off move into array
                var initPline = new Array();
                var callProdLineSearch = search.load({
                    id: constant.LC2_SavedSearch.SubsCallPline
                });

                var crsearchResults = callProdLineSearch.run().getRange(0, 100);

                if (crsearchResults.length > 0){
                    for (var x = 0; x < crsearchResults.length; x++){
                        var fieldId = crsearchResults[x].getValue({
                                name: 'custrecord_cpl_script_id'});

                        if (getFValue(record, fieldId) == true)
                            initPline.push(crsearchResults[x].id);
                    }
                }

                if(initPline.length > 0){
                    var fieldChangeFlag = true;
                    if(getFValue(record, 'custevent_ddea_task') == true)
                        fieldChangeFlag = false;
                    record.setValue({
                        fieldId: 'custevent_ms_prod_line',
                        value: initPline,
                        ignoreFieldChange: fieldChangeFlag,
                        fireSlavingSync: true
                    });
                }
            }
        }  // end 'mode is edit or create' section

        var initTopics = initTopics.concat(subscriptionTopics);

        record.setValue({
            fieldId: 'custevent_no_store_topic',
            value: initTopics,
            ignoreFieldChange: false,
            fireSlavingSync: true
        });

    } // end pageInit function

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
        var name = scriptContext.fieldId;

        // US931667 - 3.15.21 removing code re Task Type = Training ('8') b/c its being moved to Call Topics Other and being coded there
        // US115773 Make DATE VISITED mandatory when CONFERENCE/EBSCO EVENT Task Type is chosen (Visit was already coded to be mandatory)
        // US1227761 Make CONFERENCE field mandatory when CONFERENCE/EBSCO EVENT Task Type is chosen
        switch(name){
            case'custevent_tasktype': // field change code below sets the red asterisk on the field
                var taskType = getFValue(record, 'custevent_tasktype');
                if(taskType == constant.LC2_TaskType.ConfEBSCOevent){
                    record.getField('custeventdate_visited').isMandatory = true
                    record.getField('custevent_conferences').isMandatory = true
                }
                else if (taskType == constant.LC2_TaskType.Visit){
                    record.getField('custeventdate_visited').isMandatory = true
                    record.getField('custevent_conferences').isMandatory = false
            }
            else {
                    record.getField('custeventdate_visited').isMandatory = false
                    record.getField('custevent_conferences').isMandatory = false
            }
                break;

            case 'status':
                var status = getFValue(record, 'status'); // real Task status
                if(status == constant.LC2_TaskStatus.Completed) {
                var today = new Date();
                    setFValue(record, 'duedate', today);
            }
                break;

            // 12/7/23 - kept in inactive PLs (aaas, amajama, mahealth, sage) and added in Learning Express PL
            case 'custevent_pline_archives':
            case 'custevent_pline_archives':
            case 'custevent_pline_learningexpress':
            case 'custevent_pline_discovery_service':
            case 'custevent_pline_databases':
            case 'custevent_pline_ebook_audiobook':
            case 'custevent_pline_pointofcare':
            case 'custevent_pline_oslsp':
            case 'custevent_pline_learning':
            case 'custevent_pline_flipster':
            case 'custevent_pline_subscriptions_ddea':
            case 'custevent_pline_ybp':
            case 'custevent_pline_other':
            case 'custevent_pline_learningexpress':
            case 'custevent_pline_aaas':
            case 'custevent_pline_ama_jama':
            case 'custevent_pline_mahealth':
            case 'custevent_pline_sage':

            var noStoreTopic = getFValue(record, 'custevent_no_store_topic'); // block that stores values under 'call topic(s) discussed ?
            var msProdLine = getFValue(record, 'custevent_ms_prod_line'); // maybe hidden field multi select
            var flag = getFValue(record, name);

            if(flag == false){
                // Remove Product Line from Multi-Select Product Line Field
                for(i = 0; i < msProdLine.length; i++){
                    if(msProdLine[i] != ''){
                        var callProdLookup = search.lookupFields({
                            type: 'customrecord_call_prod_line',
                            id: msProdLine[i],
                            columns: ['custrecord_cpl_script_id']
                        });

                        if(callProdLookup.custrecord_cpl_script_id == name){
                            msProdLine[i] = '';
                            break;
                        }
                    }
                }
            }
            else{
                // link to search in SB1-refresh-2024-09-30 -  https://392875-sb1.app.netsuite.com/app/common/search/search.nl?id=52299&e=T&cu=T&whence=
                var callProdLineSearch = search.load({
                    id: constant.LC2_SavedSearch.SubsCallPline
                });

                var filter = search.createFilter({
                    name: 'custrecord_cpl_script_id',
                    operator: search.Operator.IS,
                    values: name
                });

                callProdLineSearch.filters.push(filter);

                var searchResult = callProdLineSearch.run().getRange(0, 1);

                if(searchResult.length > 0){
                    msProdLine.push(searchResult[0].id);
                }
            }
            record.setValue({
                fieldId: 'custevent_ms_prod_line',
                value: msProdLine,
                ignoreFieldChange: false,
                fireSlavingSync: true
            });
            record.setValue({
                fieldId: 'custevent_no_store_topic',
                value: noStoreTopic,
                ignoreFieldChange: false,
                fireSlavingSync: true
            });
            break; // previously end of pline bracket end
        } // switch statement ends
    } // end fieldChanged

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        var record= scriptContext.currentRecord;
        var user = runtime.getCurrentUser();

        // Ensure Follow Up Dates aren't too far in future (CN Aug2014 - Added)
        var today = new Date();
        // get difference in seconds
        var diff_seconds = getFValue(record, 'duedate') - today;
        // convert seconds into days
        var SecToDays = 1000 * 60 * 60 * 24;
        var diff = diff_seconds / SecToDays;
        // 545 days (1 1/2 years) as the limit
        if (diff > 730)
        {
            alert('Follow Up Date is too far into the future, please correct.');
            return false;
        }

        // US115773 10.26.23 Make DATE VISITED mandatory when either VISIT or CONFERENCE/EBSCO EVENT Task Type is chosen
        // US1227761 Make CONFERENCE field mandatory when CONFERENCE/EBSCO EVENT Task Type is chosen
        var dateVisited = getFValue(record, 'custeventdate_visited');
        var taskType = getFValue(record, 'custevent_tasktype');
        var ProdLineOther = getFValue(record, 'custevent_pline_other');
        var Conf = getFValue(record, 'custevent_conferences');

        if (dateVisited == "" && (taskType == constant.LC2_TaskType.ConfEBSCOevent || taskType == constant.LC2_TaskType.Visit) && (role != constant.LC2_Role.Administrator && role != constant.LC2_Role.EPSalesAdmin)){
            alert("Please enter a Date Visited for this task.  Task types of 'Visit' or 'Conference/EBSCO Event' require a Date Visited.");
            return false;
        }
        if ((Conf == "" || Conf == null) && taskType == constant.LC2_TaskType.ConfEBSCOevent && (role != constant.LC2_Role.Administrator && role != constant.LC2_Role.EPSalesAdmin)){
            alert("Please select at least one Conference value for this task.  Task types of 'Conference/EBSCO Event' require a Conferences type.");
                return false;
            }

        // Validate "Product Line Discussed" & "Call Topic"
        var customer_id = getFValue(record, 'company');
        if(!customer_id){
            alert('Please enter a Customer.');
            return false;
        }

        var callTopics = getFValue(record, 'custevent_no_store_topic');
        var companySubsOffLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customer_id,
            columns: ['custentity_subs_office'] // found on Customer record
        });
        console.log(companySubsOffLookup.custentity_subs_office);
        if(companySubsOffLookup.custentity_subs_office.length > 0 )
            var companySubsOff = companySubsOffLookup.custentity_subs_office[0].value;
        else
            var companySubsOff = 0;

        // Make "Product Line Discussed" & "Call Topic" mandatory except for Publisher Role or PS Subs Office code (PS = their office code in NS)
        if(companySubsOff != constant.LC2_SubsOfficeCodes.PubServices && role != constant.LC2_Role.SubscPubServices){  // added Subs Office Codes list (custom record) to LC2
            console.log(companySubsOff);
            var saveProductLine = false; // this thru line 463 is declaring that on Save, Product Line is not mandatory for these roles

            // 12.28.23 PK Added code to fix defect so  SubsPub Svs role is not forced to choose Call Topic even though they're not required to choose a Product Line
            var saveCallTopics = false;

            // US165568 Work through all the Product Lines to check at least one is checked off  (replaces check of each individual field)
            var callProdLineSearch = search.load({
                id: constant.LC2_SavedSearch.SubsCallPline
            });

            var searchResult = callProdLineSearch.run().getRange(0, 100);

            if(searchResult.length > 0){
                for(var i = 0; i < searchResult.length; i++){
                    var fieldId = searchResult[i].getValue({
                        name: 'custrecord_cpl_script_id'
                    });
                    if(getFValue(record, fieldId) == true){
                        console.log(fieldId);
                        saveProductLine = true;
                        break;
                    }
                }
            }

            if (saveProductLine == false){
                alert("ERROR: There must be at least one Product Line Discussed selected.");
                return false;
            }
            setFValue(record, 'custevent_subs_call_topics', callTopics);
        } // end making PLine and Call Topics mandatory

        // US931667 - make Date Visited mandatory when Training is chosen as a Call Topic Discussed
        if (dateVisited == ""){
            if (ProdLineOther){
                //   		   alert('callTopics.length is ' +callTopics.length);
                for(var i = 0; i < callTopics.length; i++){
                    var thisCallTopic = callTopics[i];
//             	   alert('thisCallTopic is ' +thisCallTopic  +  'the value of i is ' +i);
                    if(thisCallTopic == constant.LC2_SubsCallTopics.Training){ // TRAINING Call Topic found under PL "Other"
                        alert("Please enter a Date Visited for this task.  Tasks with a Call Topic(s) Discussed of 'Training' must have a Date Visited.");
                        return false;
                    }
                }
            }
        }
            var sendEmail = getFValue(record, 'custevent_ebsco_email');
            var sendEmailTo = getFValue(record, 'custevent_send_email_to');

        // Send Email To is required when the Send Call Report checkbox is set
        if(sendEmail == true && sendEmailTo == ""){
                alert ("Sending a call report by email has been checked, but no 'send email to' has been entered. Please enter one.");
            return false;
        }

            // US252194 - Validate Call Type of Complaint to only be used by CustSat roles or Administrator
            if (taskType == constant.LC2_TaskType.Complaint && role != constant.LC2_Role.Administrator && user.roleCenter != 'SUPPORTCENTER'){ // ACS code - leave as is.  No IDs available to add to library2_constants
            alert('A Call Type of "Complaint" can only be used by CustSat');
            return false;
        }

        //Call Topics discussed should be mandatory for Sales Rep except Admin or Publisher Role
        var employeeLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: user.id,
            columns: ['issalesrep']
        });

        if(role != constant.LC2_Role.SubscPubServices && role != constant.LC2_Role.Administrator){
            if(employeeLookup.issalesrep == true){
                if(callTopics == "" || callTopics == null){
                    alert('Call Topic(s) Discussed is mandatory.');
                    return false;
                }
            }
        }

        // Populate Transaction field with the value in the Open Oppy field
        var openOppy = getFValue(record, 'custevent_task_openopportunity');  // Open Opportunty field on Related Records subtab
        if(openOppy != '' && openOppy != null)
            setFValue(record, 'transaction', openOppy);  // Transaction field located under Open Oppy field on Related Records subtab

        // Store Call Notes Summary in Message field with HTML stripped
        var callnotes = getFValue(record, 'custevent_subs_call_notes_summary');
        setFValue(record, 'message', stripHTML(callnotes));  // ACS code that uses their stripHTML function

        // Store Call Date (StartDate)
        setFValue(record, 'custevent_call_date_disp', getFValue(record, 'startdate'));

        return true;

    }  // end saveRecord function



    function setFValue(record, field, val){
         record.setValue({
             fieldId: field,
             value: val
         });

         return record;
     }


    function getFValue(record, field){
         var value = record.getValue({
             fieldId: field
         });

         return value;
     }


     function stripHTML(oldString){
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

     return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
