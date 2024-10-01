/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_task_trainingReport.js
//				Written in SuiteScript 2.0
//
//Created by:	Eric Abramo  12-2020
//
//Purpose:		
//
//
//Library Scripts Used: 	library2_constants (linked in define statement)
//
//
//Revisions:
//		04/08/2021	eAbramo		Modifications per Allyson Zellner and Nicola Sutton feedback.  
//										1) Training fields shouldn't be required until Task marked completed
//										"Completed" means Cancelled, Completed, NoResponse OR Declined
//										Also the Training Category should apply to both Report Types not just Report type of 'Training'
//		05/10/2021	eAbramo		Addition of the isEmpty function - to detect if zero is entered that javascript doesn't treat it as empty
//		6/21/2021	PKelleher	US810150 - Add new Total Interaction Attendees (custevent_total_inter_attendees) field to Interactions section to clear field when 'Training' is chosen
//		7/22/2021	PKelleher	TA616298 - code Interactions Hours Numeric field to have it mirror the value of the Interactions Hours field on record SAVE
//
//----------------------------------------------------------------------------------------------------------------
define(['N/runtime', 'N/search' ,'/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],
		
function (runtime, search, constant) {  
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
    	var record_id = record.id;
    	var u_role = runtime.getCurrentUser().role;
    	var u_dept = runtime.getCurrentUser().department;
    	var report_type = getFieldValue(record, 'custevent_training_report_type');
    	var t_status = getFieldValue(record, 'custevent_cust_training_status');
    	var trainingDate = getFieldValue(record, 'custevent_training_date');
    	
    	
		// Newly Created Record
    	if (record_id == ''){
			// alert('this is a new Case');
			// Note we call Standard function - located below
			setFieldValue(record, 'custevent_training_task_createdby', runtime.getCurrentUser().id);
			
			//Ensure Trainer Task flag is True
			setFieldValue(record, 'custevent_is_trainer_task', true);
					
			// Ensure other Task Flags are false
			setFieldValue(record, 'custevent_ddea_task', false);
			setFieldValue(record, 'custevent_is_todo_task', false);
			setFieldValue(record, 'custevent_is_sea_call', false);
			setFieldValue(record, 'custevent_med_implement_req', false);
					
			// IF role not EP Trainer (1030), Admin (3) - disable fields
			if (u_role != constant.LC2_Role.EPTrainer && u_role != constant.LC2_Role.Administrator ){				
				// Note we call Standard function - located below
				disableField(record, 'custevent_training_report_type', true);
				disableField(record, 'custevent_cust_training_status', true);
				disableField(record, 'custevent_training_date', true);			
			}			
		}	// end code for NEW Task 	
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
        var name = scriptContext.fieldId;
	
    	if (name == 'custevent_product_interfaces_trained'){
    		setFieldValue(record, 'custevent_area_oftraining', '');
    	}
    	if (name == 'custevent_training_session_hours2'){
        	// Update Training Session Hours Numeric based on drop-down value 
        	var tsh = getFieldValue(record, 'custevent_training_session_hours2'); 		
        	if(tsh == constant.LC2_trainingSessionHours.greaterThan6){	
        	    disableField(record, 'custevent_training_sessionhours_number', false);
        	    alert('Enter the Total Training Session Hours in the Training Session Hours NUMERIC field.  Enter the value in quarter hour increments as a decimal (.00, .25, .5 and .75).  It must be greater than 6');
        	}
        	else{
        		var tsh_value = record.getText({fieldId: 'custevent_training_session_hours2'});
            	setFieldValue(record, 'custevent_training_sessionhours_number', parseFloat(tsh_value));         		
        	}		
    	}
    	if (name == 'custevent_cust_engage_hours'){
        	// Update Training Session Hours Numeric based on drop-down value 
        	var ihours = getFieldValue(record, 'custevent_cust_engage_hours'); 		
        	if(ihours== constant.LC2_trainingSessionHours.greaterThan6){	
        	    disableField(record, 'custevent_training_interactions_number', false);
        	    alert('Enter the Interaction Hours in the Interaction Hours NUMERIC field.  Enter the value in quarter hour increments as a decimal (.00, .25, .5 and .75).  It must be greater than 6');
        	}
        	else{
        		var ihours_value = record.getText({fieldId: 'custevent_cust_engage_hours'});
            	setFieldValue(record, 'custevent_training_interactions_number', parseFloat(ihours_value));         		
        	}		
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
    	var record = scriptContext.currentRecord;
    	var record_id = record.id;
    	var u_role = runtime.getCurrentUser().role;
    	var u_dept = runtime.getCurrentUser().department;
    	var report_type = getFieldValue(record, 'custevent_training_report_type');
    	var t_status = getFieldValue(record, 'custevent_cust_training_status');
    	var trainingDate = getFieldValue(record, 'custevent_training_date');
    	var t_category = getFieldValue(record, 'custevent_training_category');    	
    	
    	// Update the (true) Assignee field to match the Assigned To Trainer (custom field)
    	// Note we call Standard function - located below
    	var assign_to_trainer = getFieldValue(record, 'custevent_trainer_assignto');
    	setFieldValue(record, 'assigned', assign_to_trainer);

  	
    	// Set True Status field based on Customer Training Status field: Not Started, Completed, In Progress
	    	if (getFieldValue(record, 'status') != constant.LC2_TaskStatus.NotStarted){		
	    		// call Library function to see if the Training Status warrants categorizing the Task as Completed
	    		var realStatusNotStarted_c = constant.LC2_TrainingStatus.realStatusNotStarted(t_status);   			
	        	if (realStatusNotStarted_c == true){
	        		setFieldValue(record, 'status', constant.LC2_TaskStatus.NotStarted);
	        	}   		
	    	}	    	
	    	if (getFieldValue(record, 'status') != constant.LC2_TaskStatus.Completed){		
	    		// call Library function to see if the Training Status warrants categorizing the Task as Completed
	    		var realStatusComplete_c = constant.LC2_TrainingStatus.realStatusComplete(t_status);   			
	        	if (realStatusComplete_c == true){
	        		setFieldValue(record, 'status', constant.LC2_TaskStatus.Completed);
	        	}   		
	    	}	
	    	if (getFieldValue(record, 'status') != constant.LC2_TaskStatus.InProgress){
	    		// call Library function to see if the Training Status warrants categorizing the Task as In Progress
	    		var realStatusInProgress_c = constant.LC2_TrainingStatus.realStatusInProgress(t_status);	
	        	if (realStatusInProgress_c == true){
	        		setFieldValue(record, 'status', constant.LC2_TaskStatus.InProgress);	
	        	}    		
	    	}
    	// END Set True Status field based on Customer Training Status field: Not Started, Completed, In Progress


		// If Training Status is Completed (Includes Cancelled, Completed, NoResponse, Declined)			
    	if (constant.LC2_TrainingStatus.realStatusComplete(t_status) == true){
    		// Require Report Type
        	if (report_type == '' ){
        		alert('Report Type is required to Complete this Training Task');
        		return false;
        	}
        	// Require Training Category
    		if (t_category == ''){
    			alert('Training Category is required to Complete this Training Task');
    			return false;
    		}        	
    		// Require Training/Interaction Date
			if (trainingDate == '')
			{
				alert('In order to mark your Training Report COMPLETE, you must enter a Training/Interaction Date, and this date must be today or earlier');
				return false;
			}
			// Ensure Training Date is NOT after today
			var today = new Date();
			var mSecToDays = 1000 * 60 * 60 * 24;
			var ageInDays = (today - trainingDate) / mSecToDays
			// alert ('ageInDays  is: ' +ageInDays );
			if (ageInDays < 0)
			{
				alert('This Training Report can\'t be marked complete until on or after the Training Date');
				return false;
			}
					
			// Completed and Report Type is Training (1)
			if (report_type == constant.LC2_trainingReportType.Training){	
        		// Mandatory fields
        		var t_audience = getFieldValue(record, 'custevent_training_audience2');
        		if (t_audience == ''){
        			alert('Training Audience is required when Complete and Report Type is set to Training');
        			return false;
        		}
        		var t_prod_interfaces = getFieldValue(record, 'custevent_product_interfaces_trained');
        		if (t_prod_interfaces == ''){
        			alert('Product Interfaces is required when Complete and Report Type is set to Training');
        			return false;
        		}
        		// Area of Training is mandatory depending on existence of parent 'product interface trained'
        		//alert('t_prod_interfaces is ' +t_prod_interfaces);
        		var area_oftraining = getFieldValue(record, 'custevent_area_oftraining');
        		if (t_prod_interfaces != '' && area_oftraining == ''){
        			// call 'areaOfTrainingExists' function to determine if 'Area of Training' needs to be populated
        			if (areaOfTrainingExists(t_prod_interfaces) == true){ 
        	        	alert('Area of Training is required for this Product Interfaces Trained');
        	        	return false;
        	       	}
        		}
				var no_t_sessions = getFieldValue(record, 'custevent_no_training_sessions');
		   		if (isEmpty(no_t_sessions) == true){
	    			alert('Number of Training Sessions is required when Complete and Report Type is set to Training');
	    			return false;
	    		}
	    		var session_hours = getFieldValue(record, 'custevent_training_session_hours2');
	    		if (isEmpty(session_hours) == true){
	    			alert('Total Session Hours is required when Complete and Report Type is set to Training');
	    			return false;
	    		}   		
	    		var total_attendees = getFieldValue(record, 'custevent_no_training_attendees');
	    		if (isEmpty(total_attendees) == true){
	    			alert('Total Training Attendees is required when Complete and Report Type is set to Training');
	    			return false;
	    		}
	    		var orgs_attending = getFieldValue(record, 'custevent_no_orgs_attending');
	    		if (isEmpty(orgs_attending) == true){
	    			alert('Total Organizations Attending is required when Complete and Report Type is set to Training');
	    			return false;
	    		}
	    		// clear Interactions fields
	    		//US810150 clear Total Interaction Attendees (custevent_total_inter_attendees) field when 'Training' is chosen
	    		setFieldValue(record, 'custevent_training_int_type', '');
		    		// custevent_cust_engage_hours has FieldChange function and need to ignoreFieldChange
		    	record.setValue({
		                fieldId: 'custevent_cust_engage_hours',
		                value: '',
		                ignoreFieldChange: true
		            });
		    	setFieldValue(record, 'custevent_training_interactions_number', '0');
		    	setFieldValue(record, 'custevent_total_inter_attendees', '');
		    	// end clear Interaction fields
			}// end Completed and Report Type is Training (1)

			
			// Completed and Report Type is Customer Interaction (2)			
			if (report_type == constant.LC2_trainingReportType.CustInteraction){
        		// Mandatory fields
        		var interaction_type = getFieldValue(record, 'custevent_training_int_type');
        		if (interaction_type == ''){
        			alert('Interaction Type is required when Report Type is set to Customer Interaction');
        			return false;
        		}				
				var int_hours = getFieldValue(record, 'custevent_cust_engage_hours');				
	    		if (int_hours == ''){
	    			alert('Interactions Hours is required when Complete and Report Type is set to Customer Interaction');
	    			return false;
	    		}    		    		
	    		// clear Training fields
		    		setFieldValue(record, 'custevent_training_audience2', '');
		    		setFieldValue(record, 'custevent_product_interfaces_trained', '');
		    		setFieldValue(record, 'custevent_area_oftraining', '');
		    		setFieldValue(record, 'custevent_no_training_sessions', '');
		    		// Training Session Hours 2 -- has FieldChange function and need to ignoreFieldChange
		    		record.setValue({
		                fieldId: 'custevent_training_session_hours2',
		                value: '',
		                ignoreFieldChange: true
		            });
		    		setFieldValue(record, 'custevent_training_sessionhours_number', '0');
		    		setFieldValue(record, 'custevent_no_training_attendees', '');
		    		setFieldValue(record, 'custevent_no_orgs_attending', '');
		    		setFieldValue(record, 'custevent_training_demo_only', false);
		    		setFieldValue(record, 'custevent_paid_training', false);
		    	// End clear Training fields
			}	
    	} // end t_status == completed (5)

		// Validate the Total Session Hours Number  
    	var tsh = getFieldValue(record, 'custevent_training_session_hours2'); 		
       	var tsh_number = getFieldValue(record, 'custevent_training_sessionhours_number');
		var tsh_value = record.getText({fieldId: 'custevent_training_session_hours2'});
        if(tsh == constant.LC2_trainingSessionHours.greaterThan6){
        	if(tsh_number < 6.01){
        		alert('You\'ve selected that the Total Session Hours is greater than 6 hours.  Your Total Session Hours Number must be greater than 6');
        		return false;   		
        	}		        		
    	}    	
    	// TA616298 - Validate Training Session Hours Numeric is not empty 
		else if(isEmpty(tsh_value)== false && isEmpty(tsh_number)== true) {
        	setFieldValue(record, 'custevent_training_sessionhours_number', parseFloat(tsh_value));         		
    	}
    	
    	// Validate the Interactions Hours Number 
    	var i_hours = getFieldValue(record, 'custevent_cust_engage_hours'); 		
    	var i_hours_number = getFieldValue(record, 'custevent_training_interactions_number');
		var ihours_value = record.getText({fieldId: 'custevent_cust_engage_hours'});
    	if(i_hours == constant.LC2_trainingSessionHours.greaterThan6){
        	var i_hours_number = getFieldValue(record, 'custevent_training_interactions_number');
        	if(i_hours_number < 6.01){
        		alert('You\'ve selected that the Interaction Hours is greater than 6 hours.  Your Interaction Hours Number must be greater than 6');
        		return false;   		
        	}		        		
    	}        	
    	// TA616298 - Validate Training Interaction Hours Numeric is not empty 
    	else if(isEmpty(ihours_value)== false && isEmpty(i_hours_number)== true) {
        	setFieldValue(record, 'custevent_training_interactions_number', parseFloat(ihours_value));         		
    	}


    	
    	return true;
    }
   
   
    // Function areaOfTrainingExists:  
    // input: Product Interfaces Trained (t_prod_interfaces)
    // output: true or false
    // Purpose: Checks to see if Area of Training field should be mandatory. 
    //			It depends on if the 'Product Interfaces Trained' has a child 'Area of Training' value underneath it
    function areaOfTrainingExists(prod_int_trained){
		var areaOfTrainingSearch = search.create({
			type: search.Type.CUSTOM_RECORD + '_area_oftraining',
		    columns: ['internalid'],
		    filters: [
		    	['custrecord_product_interfaces_trained', 'anyof', prod_int_trained],
		    	'and',
		        ['isinactive', 'is', false]
		    ]
		});
		var areaOfTrainingResultSet = areaOfTrainingSearch.run().getRange(0,2);
		// alert('areaOfTrainingResultSet.length is ' + areaOfTrainingResultSet.length);
		if (areaOfTrainingResultSet.length > 0){
			return true;
        	}
		else {
			return false;
		} 	
    }
    
    
    // ******************* Begin Standard Functions ***********************
    // Function to retrieve the value of a field
    function getFieldValue(record, field){
        var value = record.getValue({
            fieldId: field
        });
        return value;
    } 

    // Function to disable a field
    function disableField(record, field, flag){
        record.getField(field).isDisabled = flag;
        return record;
    }
    
    // Function to Set field value
    function setFieldValue(record, field, val){
        record.setValue({
            fieldId: field,
            value: val
        });
        return record;
    }
    
    //  function to check for empty string
	function isEmpty(val){
	    return (val === undefined || val == null || val.length <= 0) ? true : false;
	}
    // ******************* End Standard Functions ***********************
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
