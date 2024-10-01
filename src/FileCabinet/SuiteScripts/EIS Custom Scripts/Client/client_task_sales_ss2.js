/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
  //uses library_constants_ss2.js
define(['N/search', 'N/runtime', 'N/format', '/SuiteScripts/EIS Custom Scripts/Library/library_constants_ss2'],
/**
 * @param {record} record
 * @param {search} search
 */
/**
 * * Created by: Krizia Ilaga (NSACS Consultant)
 * 
 * Consolidation of two script files: client_task_EIS_toDo.js and client_task_ep.js
 * 
 * Library Files used:  library_constants_ss2.js
 * 
 * * Revision History:
 * K Ilaga (NSACS Consultant)		02-28-2019	Original version
 * C Neale							04-01-2019  F24174 implementation
 * P Kelleher						03.15.2021  US931667 - removing code re Task Type = Training ('8') b/c its being moved to Call Topics Other and adding similar code under Call Topics

 */
function(search, runtime, format, constant) {

    var roles = constant.LC2_Role;
    
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
        var taskRecord = scriptContext.currentRecord;
        var user = runtime.getCurrentUser();
        var subscriptionFlag = false; //flag to check the Subscriptions product line
        var subscriptionTopics = new Array();

        hideField(taskRecord, 'custevent_subs_call_topics', false);
        if(getFieldValue(taskRecord, 'custevent_ddea_task') == true && getFieldValue(taskRecord, 'custevent_nsacs_acsformflag') == false){
            setFieldValue(taskRecord, 'custevent_nsacs_acsformflag', true);
            setFieldValue(taskRecord, 'custevent_subs_call_notes_summary', getFieldValue(taskRecord, 'message'));

            //if(getFieldValue(taskRecord, 'custevent_pline_subscriptions_ddea') == false){
            if(getFieldValue(taskRecord, 'custevent_pline_aaas', true))
                subscriptionTopics.push(150); //AAAS
            if(getFieldValue(taskRecord, 'custevent_pline_ama_jama', true))
                subscriptionTopics.push(39); //AMA/JMA
            if(getFieldValue(taskRecord, 'custevent_pline_mahealth', true))
                subscriptionTopics.push(40); //MA Health/ Mark Allen
            if(getFieldValue(taskRecord, 'custevent_pline_sage', true))
                subscriptionTopics.push(151); //SAGE

            if(getFieldValue(taskRecord, 'custevent_pline_subscriptions_ddea') == false && subscriptionTopics.length > 0){
                setFieldValue(taskRecord, 'custevent_pline_subscriptions_ddea', true);
                subscriptionFlag = true;
            }
        }

        if(getFieldValue(taskRecord, 'custevent_is_sea_call') == true && getFieldValue(taskRecord, 'custevent_nsacs_acsformflag') == false){
            setFieldValue(taskRecord, 'custevent_nsacs_acsformflag', true);
        }

        if(scriptContext.mode == 'create' || scriptContext.mode == 'copy'){
            setFieldValue(taskRecord, 'custevent_nsacs_acsformflag', true);
            setFieldValue(taskRecord, 'status', 'PROGRESS');

            //checkbox flags
            if(containsFunction(roles.nonSalesRoles, user.role))
                setFieldValue(taskRecord, 'custevent_nscas_nonsales', true);
            else if(containsFunction(roles.accountExecRoles, user.role))
                setFieldValue(taskRecord, 'custevent_ddea_task', true);
            else if(containsFunction(roles.fieldSalesRoles, user.role))
                setFieldValue(taskRecord, 'custevent_is_sea_call', true);

            //Task Type default based on role
            if(containsFunction(roles.visitRoles, user.role))
                setFieldValue(taskRecord, 'custevent_tasktype', 2);
            else if(containsFunction(roles.phoneCallRoles, user.role))
                setFieldValue(taskRecord, 'custevent_tasktype', 1);

            //Follow-up date set to two weeks from date today
            var dateToday = new Date();
            dateToday.setDate(dateToday.getDate()+14);
            setFieldValue(taskRecord, 'duedate', dateToday);
        }
        else{
            var employeeLookup = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: user.id,
                columns: ['issalesrep']
            });

            if(employeeLookup.issalesrep == true && user.role != 3){
                // determine age of task in hours
                var dateCreated = getFieldValue(taskRecord, 'createddate');
                var today = new Date();
                var mSecToHrs = 1000 * 60 * 60;
                var ageInHrs = (today - dateCreated) / mSecToHrs;

                //For international reps, lock fields after 7 days
                if(containsFunction(roles.internationalReps, user.role)){
                    console.log(ageInHrs);
                    if(ageInHrs > 168){
                        disableField(taskRecord, 'title', true);
                        disableField(taskRecord, 'message', true);
                        disableField(taskRecord, 'custevent_tasktype', true);
                        disableField(taskRecord, 'custeventdate_visited', true);
                        disableField(taskRecord, 'custevent_subs_call_notes_summary', true);
                        disableField(taskRecord, 'custevent_subs_call_notes_further', true);
                    }
                }
                else{ //For domestic reps, lock fields after 36 hours
                    if(ageInHrs > 36){
                        disableField(taskRecord, 'title', true);
                        disableField(taskRecord, 'message', true);
                        disableField(taskRecord, 'custevent_tasktype', true);
                        disableField(taskRecord, 'custeventdate_visited', true);
                        disableField(taskRecord, 'custevent_subs_call_notes_summary', true);
                        disableField(taskRecord, 'custevent_subs_call_notes_further', true);
                    }
                }
            }
        }

        // US165568 Work out if multiselect Product Line has already been populated - only perform processing if not populated. 
        // This code populates the multiselect Product Line for "old" tasks where it has not previously been populated & the No Store Topics
        var varPline = getFieldValue(taskRecord, 'custevent_ms_prod_line');
        var initTopics = getFieldValue(taskRecord, 'custevent_subs_call_topics');
        if(scriptContext.mode == 'copy' || scriptContext.mode == 'edit'){
            if(!varPline[0] || varPline.length == 0 || subscriptionFlag == true){
                // Work through all the Topics and check they relate to checked off Product Lines - if not check off. 
                var it_len = initTopics.length;
                for( var i = 0; i < it_len; i++){
                    if (initTopics[i] != ''){
                        var tpline = search.lookupFields({
                            type: 'customrecord_subs_call_topics',
                            id: initTopics[i],
                            columns: ['custrecord_sct_product_line']
                        });
                        
                        if(tpline.length > 0){
                            if (tpline[0].value){
                                var tpline_id = search.lookupFields({
                                    type: 'customrecord_call_prod_line',
                                    id: tpline,
                                    columns: ['custrecord_cpl_script_id']
                                });
                                if (getFieldValue(taskRecord, tpline_id) != true)
                                    setFieldValue(taskRecord, tpline_id, true);
                            }
                        }
                    }
                }

                // Work through all the Product Lines and if checked off move into array 
                var initPline = new Array();
                var callProdLineSearch = search.load({
                    id: 'customsearch_nsacs_callprodline'
                });

                var crsearchResults = callProdLineSearch.run().getRange(0, 100);

                if (crsearchResults.length > 0){
                    for (var x = 0; x < crsearchResults.length; x++){
                        var fieldId = crsearchResults[x].getValue({
                            name: 'custrecord_cpl_script_id'
                        });
                        if (getFieldValue(taskRecord, fieldId) == true)
                            initPline.push(crsearchResults[x].id);
                    }
                }

                if(initPline.length > 0){
                    var fieldChangeFlag = true;
                    if(getFieldValue(taskRecord, 'custevent_ddea_task') == true)
                        fieldChangeFlag = false;
                    taskRecord.setValue({
                        fieldId: 'custevent_ms_prod_line',
                        value: initPline,
                        ignoreFieldChange: fieldChangeFlag,
                        fireSlavingSync: true
                    });
                }
            }
        }

        var initTopics = initTopics.concat(subscriptionTopics);

        taskRecord.setValue({
            fieldId: 'custevent_no_store_topic',
            value: initTopics,
            ignoreFieldChange: false,
            fireSlavingSync: true
        });
        
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
        var taskRecord = scriptContext.currentRecord;
        var name = scriptContext.fieldId;

        // US931667 - 3.15.21 removing code re Task Type = Training ('8') b/c its being moved to Call Topics Other and being coded there
        if(name == 'custevent_tasktype'){
            var taskType = getFieldValue(taskRecord, 'custevent_tasktype');
            if(taskType == 2) //Visit
                mandatoryField(taskRecord, 'custeventdate_visited', true);
            else
                mandatoryField(taskRecord, 'custeventdate_visited', false);
        }
        else if(name == 'status'){
            var status = getFieldValue(taskRecord, 'status');
            if(status == 'COMPLETE'){
                var today = new Date();
                setFieldValue(taskRecord, 'duedate', today);
            }
        }

        if (name == 'custevent_pline_archives' || name == 'custevent_pline_learningexpress' || name == 'custevent_pline_discovery_service' ||
            name == 'custevent_pline_databases' || name == 'custevent_pline_ebook_audiobook' || name == 'custevent_pline_pointofcare' ||
            name == 'custevent_pline_oslsp' || name == 'custevent_pline_learning' || name == 'custevent_pline_plumx' || name == 'custevent_pline_flipster' ||
            name == 'custevent_pline_subscriptions_ddea' || name == 'custevent_pline_ybp' || name == 'custevent_pline_other'){
            var noStoreTopic = getFieldValue(taskRecord, 'custevent_no_store_topic');
            var msProdLine = getFieldValue(taskRecord, 'custevent_ms_prod_line');
            var flag = getFieldValue(taskRecord, name);

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
                var callProdLineSearch = search.load({
                    id: 'customsearch_nsacs_callprodline'
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

            taskRecord.setValue({
                fieldId: 'custevent_ms_prod_line',
                value: msProdLine,
                ignoreFieldChange: false,
                fireSlavingSync: true
            });
            taskRecord.setValue({
                fieldId: 'custevent_no_store_topic',
                value: noStoreTopic,
                ignoreFieldChange: false,
                fireSlavingSync: true
            });

        }
    }

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
       var taskRecord = scriptContext.currentRecord;
       var user = runtime.getCurrentUser();

       // Ensure Follow Up Dates aren't too far in future (CN Aug2014 - Added)
        var today = new Date();
        // get difference in seconds
        var diff_seconds = getFieldValue(taskRecord, 'duedate') - today;
        // convert seconds into days
        var SecToDays = 1000 * 60 * 60 * 24;
        var diff = diff_seconds / SecToDays;
        // 545 days (1 1/2 years) as the limit
        if (diff > 730)
        {
            alert('Follow Up Date is too far into the future, Please correct.');
            return false;
        }

        // US931667 - 3.15.21 removing code re Task Type = Training ('8') b/c its being moved to Call Topics Other and being coded there
        // Force Date Visited for type Visit (Task Type ID 2)
        var dateVisited = getFieldValue(taskRecord, 'custeventdate_visited');
        var taskType = getFieldValue(taskRecord, 'custevent_tasktype');
        var ProdLineOther = getFieldValue(taskRecord, 'custevent_pline_other');

        if (dateVisited == "" && taskType == 2){
            alert("Please enter a Date Visited for this task.  Tasks that are type 'Visit' MUST have a Date Visited");
            return false;
        }

        // Validate "Product Line Discussed" & "Call Topic" - mandatory except for Publisher Role or PS Subs Office code
        var customer_id = getFieldValue(taskRecord, 'company');
        if(!customer_id){
            alert('Please enter a Customer.');
            return false;
        }
        var callTopics = getFieldValue(taskRecord, 'custevent_no_store_topic');

        var companySubsOffLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customer_id,
            columns: ['custentity_subs_office']
        });
        console.log(companySubsOffLookup.custentity_subs_office);
        if(companySubsOffLookup.custentity_subs_office.length > 0 )
            var companySubsOff = companySubsOffLookup.custentity_subs_office[0].value;
        else
            var companySubsOff = 0;

            if(companySubsOff != '17' && roles.publisherRole != user.role){
                console.log(companySubsOff);
                var saveProductLine = false;

                // US165568 Work through all the Product Lines to check at least one is checked off  (replaces check of each individual field) 
                var callProdLineSearch = search.load({
                    id: 'customsearch_nsacs_callprodline'
                });

                var searchResult = callProdLineSearch.run().getRange(0, 100);

                if(searchResult.length > 0){
                    for(var i = 0; i < searchResult.length; i++){
                        var fieldId = searchResult[i].getValue({
                            name: 'custrecord_cpl_script_id'
                        });
                        if(getFieldValue(taskRecord, fieldId) == true){
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
                setFieldValue(taskRecord, 'custevent_subs_call_topics', callTopics);
            }
            
       // US931667 - make Date Visited mandatory when Training (id = 216) is chosen as a Call Topic Discussed
       if (dateVisited == ""){
    	   if (ProdLineOther){
 //   		   alert('callTopics.length is ' +callTopics.length);
               for(var i = 0; i < callTopics.length; i++){
                   var thisCallTopic = callTopics[i];
//             	   alert('thisCallTopic is ' +thisCallTopic  +  'the value of i is ' +i);
               	   if(thisCallTopic == 216){
           	       		alert("Please enter a Date Visited for this task.  Tasks with a Call Topic(s) Discussed of 'Training' must have a Date Visited");
        	       		return false;
             	   }
               }
    	   }    	   
       }
       
        var sendEmail    = getFieldValue(taskRecord, 'custevent_ebsco_email');
        var sendEmailTo  = getFieldValue(taskRecord, 'custevent_send_email_to');

        // Send Email To is required when the Send Call Report checkbox is set
        if(sendEmail == true && sendEmailTo == ""){
            alert ("ERROR: Sending a call report by email has been checked, but no 'send email to' has been entered.");
            return false;
        }

        // US252194 - Validate Call Type of Complaint only used by CustSat roles or Administrator here
        if (taskType == 18 && user.role != 3 && user.roleCenter != 'SUPPORTCENTER'){   
             alert('A Call Type of "Complaint" can only be used by CustSat');
             return false;
        }

        //Call Topics discussed should be mandatory for Sales Rep except Admin or Publisher Role
        var employeeLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: user.id,
            columns: ['issalesrep']
        });

        if(user.role != roles.publisherRole && user.role != 3){
            if(employeeLookup.issalesrep == true){
                if(callTopics == "" || callTopics == null){
                    alert('Call Topic(s) Discussed is mandatory.');
                    return false;
                }
            }
        }

        // Populate Transaction field with the value in the Open Opps field
        var oppenOpportunity = getFieldValue(taskRecord, 'custevent_task_openopportunity');
        if(oppenOpportunity != '' && oppenOpportunity != null)
            setFieldValue(taskRecord, 'transaction', oppenOpportunity);

        // Store Call Notes Summary in Message field with HTML stripped
        var callnotes = getFieldValue(taskRecord, 'custevent_subs_call_notes_summary');
        setFieldValue(taskRecord, 'message', stripHTML(callnotes));

        // Store Call Date (StartDate)
        setFieldValue(taskRecord, 'custevent_call_date_disp', getFieldValue(taskRecord, 'startdate'));

        return true;
    }

    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });

        return record;
    }

    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });

        return value;
    }

    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }

    function hideField(record, field, flag){
        record.getField(field).isVisible = flag;
        return record;
    }

    function mandatoryField(record, field, flag){
        record.getField(field).isMandatory = flag;
        return record;
    }

    function containsFunction(arr, val) {
        for(i = 0; i < arr.length; i++)
            if (arr[i] === val)
                return true;
        return false;
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
