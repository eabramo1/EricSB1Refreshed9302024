/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/* Script:     Client2_Record_Customer.js
 *
 * Created by: Christine Neale
 *				Eric Abramo (for 1st post to production 3/1/2020)
 *
 * Revisions:  
 *	
 *	eAbramo		02/24/2021	US763613 Don't allow User to set a Prospect as a Parent Customer
 *	CNeale  	03/25/2021	US734954 UI Transition Field processing (incl. fix for Complete Transition Status
 *							& fix for create record).
 *	CNeale		04/15/2021  US738501 Fix for In Process change & date before today
 *	ZScannell	11/05/2021	US854135 Allow select users to change the Customer Transition Status from "Not Started" to "Completed"
 *	CNeale		03/15/2022	US905097 Transition Center changes - simplification of process
 * 	JOliver		08/01/2023	TA838827 FOLIO Partner flag cannot be set on Celigo Accessing Site Head Inst
 * 	JOliver		08/04/2023	TA838825 FOLIO Partner flag cannot be unchecked if customer is FOLIO Partner Parent
 *
*/

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/record', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_customer'],

function(LC2Constant, runtime, record, search, LU2Utility, customerLib) {
	
	// Global Variables
	var G2_dateToday = null;	// Current date/time
	var G2_dateEDSin = null     // EDS Transition Date - initial value
	var G2_byEDSin = null		// EDS Transition Date set by - initial value
	var G2_dateEhostin = null   // eHost Transition Date - initial value
	var G2_byEhostin = null		// eHost Transition Date set by - initial value
	var G2_dateExplorain = null // Explora Transition Date - initial value
	var G2_byExplorain = null	// Explora Transition Date set by - initial value
	var G2_dateRefCtrin = null  // RefCtr Transition Date - initial value
	var G2_byRefCtrin = null	// RefCtr Transition Date set by - initial value
	var G2_transEdit = false;	// Indicates whether role can Edit Transition Status fields  
	var G2_webForm = false;		// Indicates whether Web Services form is being used 
	var G2_notStartTrans = null;		// Not started Status
	var G2_inProgTrans = null;			// In Progress Status
	var G2_completeTrans = null;		// Complete Status
	var G2_showEDS = false;  	// Should EDS Transition fields be shown
	var G2_showEhost = false; 	// Should eHost Transition fields be shown
	var G2_showExplora = false; // Should Explora Transition fields be shown
	var G2_showRefCtr = false;  // Should Ref Center Transition fields be shown
	var G2_parent_init = null;		// US763613 Don't allow User to set a Prospect as a Parent Customer
	var G2_createRec = false;	// US734954 Create record indicator
	var G2_user = null;			// US905097 Current user id
	
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
    	
    	log.debug('Client2_Record_Customer.js ', 'pageInit Start');
    	// US763613 Don't allow User to set a Prospect as a Parent Customer
    	G2_parent_init = scriptContext.currentRecord.getValue('parent');
    	
    	// US734954 Cater for record create
    	if(scriptContext.mode == 'create'){
    		G2_createRec = true;
    	}
    	
    	
    	// Set Global Transition Edit/Override indicators & date today  
    	// US905097 Override no longer required 
    	var role = runtime.getCurrentUser().role;
    	G2_user = runtime.getCurrentUser().id; 
    	G2_transEdit = LC2Constant.LC2_Role.TransStsDte(role);
   		G2_dateToday = new Date();
   		log.debug('G2_dateToday', G2_dateToday);
		var cus_rec = scriptContext.currentRecord;
		if (cus_rec.getValue('customform') == LC2Constant.LC2_Form.WebCustomer){
			G2_webForm = true; 
		}
		
		// Set Global Transition Statuses (US734954 move outside If)
		G2_notStartTrans = LC2Constant.LC2_Transition_sts.NotStart;		// Not started Status
		G2_inProgTrans = LC2Constant.LC2_Transition_sts.InProg;			// In Progress Status
		G2_completeTrans = LC2Constant.LC2_Transition_sts.Complete;		// Complete Status
		
		// US734954 Exclude record Create as fields not displayed 
   		if (G2_transEdit == true && G2_webForm == false && G2_createRec != true){
   			
			// Set initial values
			G2_showEDS = LC2Constant.LC2_Transition_Show.EDS;  // Should EDS Transition fields be shown
			G2_showEhost = LC2Constant.LC2_Transition_Show.eHost;  // Should eHost Transition fields be shown
			G2_showExplora = LC2Constant.LC2_Transition_Show.Explora;  // Should Explora Transition fields be shown
			G2_showRefCtr = LC2Constant.LC2_Transition_Show.RefCtr;  // Should Ref Center Transition fields be shown
    			
   	    	// Set initial Transition Values EDS
   	    	if (G2_showEDS == true){
   	    		transStsPop(cus_rec, cus_rec.getValue('custentity_eds_transition_status'), 'custentity_eds_transition_status');
   	    		G2_dateEDSin = cus_rec.getValue('custentity_eds_transition_date');
   	    		log.debug('G2_dateEDSin', G2_dateEDSin);
   	    		G2_byEDSin = cus_rec.getValue('custentity_eds_transition_dte_setby');
   	    		log.debug('G2_byEDSin', G2_byEDSin);
   	    	}
   	    	// Set initial Transition Values eHost
   	    	if (G2_showEhost == true){
   	    		transStsPop(cus_rec, cus_rec.getValue('custentity_ehost_transition_status'), 'custentity_ehost_transition_status');
   	    		G2_dateEhostin = cus_rec.getValue('custentity_ehost_transition_date');
   	    		G2_byEhostin = cus_rec.getValue('custentity_ehost_transition_dte_setby');
   	    	}
   	    	// Set initial Transition Values Explora
   	    	if (G2_showExplora == true){
   	    		transStsPop(cus_rec, cus_rec.getValue('custentity_explora_transition_status'), 'custentity_explora_transition_status');
   	    		G2_dateExplorain = cus_rec.getValue('custentity_explora_transition_date');
   	    		G2_byExplorain = cus_rec.getValue('custentity_explora_transition_dte_setby');
   	    	}
   	    	// Set initial Transition Values RefCtr
   	    	if (G2_showRefCtr == true){
   	    		transStsPop(cus_rec, cus_rec.getValue('custentity_refctr_transition_status'), 'custentity_refctr_transition_status');
   	    		G2_dateRefCtrin = cus_rec.getValue('custentity_refctr_transition_date');
   	    		G2_byRefCtrin = cus_rec.getValue('custentity_refctr_transition_dte_setby');
   	    	}

   	    	// NOTE: Which Transition fields are editable on load is handled in UE before load script 
 	
   		}
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
    	
    	var cus_rec = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        
        var statusFld = '';
        var statusValIn = '';
        var dateFld = '';
        var dateValIn = '';
        var defDateFld = '';
        var defDateValIn = '';
        var dateSelFld = '';
        var dateSetByFld = '';
        var dateSetByValIn = '';
        var txtType = '';
        
        // EDS Transition Status
        if(name == 'custentity_eds_transition_status') {
        	transStatusChange(LC2Constant.LC2_Transition_typ.EDS,G2_showEDS);
         } 
     
        // EDS Transition Date
        if(name == 'custentity_eds_transition_date') {
        	transDateChange(LC2Constant.LC2_Transition_typ.EDS, G2_showEDS);
        } 
        
        // eHost Transition Status
        if(name == 'custentity_ehost_transition_status') {
        	transStatusChange(LC2Constant.LC2_Transition_typ.eHost,G2_showEhost);
        } 

        // eHost Transition Date
        if(name == 'custentity_ehost_transition_date') {
        	transDateChange(LC2Constant.LC2_Transition_typ.eHost, G2_showEhost);
     	}	
        
        // Explora Transition Status
        if(name == 'custentity_explora_transition_status') {
        	transStatusChange(LC2Constant.LC2_Transition_typ.Explora,G2_showExplora);
        } 
        
        // Explora Transition Date
        if(name == 'custentity_explora_transition_date') {
        	transDateChange(LC2Constant.LC2_Transition_typ.Explora, G2_showExplora);
        } 
        
        // RefCtr Transition Status
        if(name == 'custentity_refctr_transition_status') {
        	transStatusChange(LC2Constant.LC2_Transition_typ.RefCtr,G2_showRefCtr)
        } 
        
        // RefCtr Transition Date
        if(name == 'custentity_refctr_transition_date') {
        	transDateChange(LC2Constant.LC2_Transition_typ.RefCtr, G2_showRefCtr);
        } 
        
        // US763613 Don't allow User to set a Prospect as a Parent Customer
        if (name == 'parent'){
        	var parent_cust = cus_rec.getValue('parent');
        	if (parent_cust != ''){
            	var parent_stage = search.lookupFields({
            		type: search.Type.CUSTOMER,
        			id: parent_cust,
        			columns: ['stage']
            	});
            	log.debug('Record modified is ', cus_rec.getValue({fieldId: 'entityid'}));           	
            	log.debug('parent_stage.stage[0].value is ', parent_stage.stage[0].value);
            	if (parent_stage.stage[0].value != 'CUSTOMER'){
            		cus_rec.setValue({
        				fieldId: 'parent',
        				value: G2_parent_init,
        				ignoreFieldChange: true});
            		alert('You cannot choose a LEAD or PROSPECT as a parent Company.  The Parent Company has been set back to its original value');
            	}            	       		
        	}
        }

		//TA838827 FOLIO Partner flag cannot be set on a Celigo Parent Inst
		//TA838825 FOLIO Partner flag cannot be unchecked if customer is FOLIO Partner Parent
		if (name == 'custentity_folio_partner') {
			var folio_partner = cus_rec.getValue('custentity_folio_partner');
			if (folio_partner == true) {
				//  FOLIO Partner CANNOT be a Celigo Consortia Head
				var custInternalID = cus_rec.getValue('id');
				//alert('the value of custInternalID is ' + custInternalID);

				if (customerLib.isCeligoConsortiaHead(custInternalID) === true) {
					cus_rec.setValue({
						fieldId: 'custentity_folio_partner',
						value: false,
						ignoreFieldChange: true});
					alert('This company cannot be a FOLIO Partner due to the fact that it is a pre-existing EBSCO Connect Consortia Head (Celigo).  Please contact CRMescalation@EBSCO.com for more information.');
				}
			}
			if (folio_partner == false) {
				//  FOLIO
				var custInternalID = cus_rec.getValue('id');
				//alert('the value of custInternalID is ' + custInternalID);

				if (customerLib.isFOLIOconsortiaHead(custInternalID) === true) {
					cus_rec.setValue({
						fieldId: 'custentity_folio_partner',
						value: true,
						ignoreFieldChange: true});
					alert('This company must remain a FOLIO Partner because it is a parent in a FOLIO parent/child relationship in EBSCO Connect.  Please contact CRMescalation@ebsco.com for more information.');
				}
			}
		}


       /*******************************************************************************************************************
        * Functions called within fieldChanged Start here
        *******************************************************************************************************************/ 
        
        /* ***********************************************************************************
         * transDateChange - Transition Date field change validation
         * Input:  Transition Type
         *         Show transition type 
         * ***********************************************************************************/

        function transDateChange(transType,show){
           	if (G2_webForm == false && show == true){
           		log.debug('Transition Date change');
           		switch (transType) {
           		case(LC2Constant.LC2_Transition_typ.EDS) :
           			dateFld = 'custentity_eds_transition_date';
           			dateValIn = G2_dateEDSin;
           			dateSetByFld = 'custentity_eds_transition_dte_setby';
           			dateSetByValIn = G2_byEDSin;
           			txtType = 'EDS';
           			statusFld = 'custentity_eds_transition_status';
           			break;
           		case(LC2Constant.LC2_Transition_typ.eHost) :
           			dateFld = 'custentity_ehost_transition_date';
           			dateValIn = G2_dateEhostin;
           			dateSetByFld = 'custentity_ehost_transition_dte_setby';
           			dateSetByValIn = G2_byEhostin;
           			txtType = 'eHost';
           			statusFld = 'custentity_ehost_transition_status';
           			break;       
           		case(LC2Constant.LC2_Transition_typ.Explora) :
           			dateFld = 'custentity_explora_transition_date';
           			dateValIn = G2_dateExplorain;
           			dateSetByFld = 'custentity_explora_transition_dte_setby';
           			dateSetByValIn = G2_byExplorain;
           			txtType = 'Explora';
           			statusFld = 'custentity_explora_transition_status';
           			break;       
           		case(LC2Constant.LC2_Transition_typ.RefCtr) :
           			dateFld = 'custentity_refctr_transition_date';
           			dateValIn = G2_dateRefCtrin;
           			dateSetByFld = 'custentity_refctr_transition_dte_setby';
           			dateSetByValIn = G2_byRefCtrin;
           			txtType = 'Ref Center';
           			statusFld = 'custentity_refctr_transition_status';
           			break;        
           		}
        	
        		var dateVal = cus_rec.getValue(dateFld);
        		var statusVal = cus_rec.getValue(statusFld);
        		var textExt = ''; 

        		// Do NOT allow dates after today to be selected (selection only available for Completed status)
        		if (statusVal == G2_completeTrans){ 
        			if (dateVal > G2_dateToday) {  
        				cus_rec.setValue({
        					fieldId: dateFld,
        					value: dateValIn,
        					ignoreFieldChange: true});
        				cus_rec.setValue({
        					fieldId: dateSetByFld,
        					value: dateSetByValIn,
        					ignoreFieldChange: true});
        				if (dateValIn){
        					textExt = ' - original date has been reset';
        				}
        				alert(txtType + ' Transition date must be on or before today - please select another date' + textExt);
        			}
        			else {
        				cus_rec.setValue({
        					fieldId: dateSetByFld,
        					value: G2_user,
        					ignoreFieldChange: true});
        			}
        		}
        		else{ // Status is not Complete - set date & setby to blank and protect date
        			us_rec.setValue({
    					fieldId: dateFld,
    					value: '',
    					ignoreFieldChange: true});
    				cus_rec.setValue({
    					fieldId: dateSetByFld,
    					value: '',
    					ignoreFieldChange: true});
    				cus_rec.getField(dateFld).isDisabled = true;
        		}
           	}
        }
        

        /* ***********************************************************************************
         * transStatusChange - Transition Status field change validation
         * Input:  Transition Type
         *         Show transition type 
         * ***********************************************************************************/
        function transStatusChange(transType,show){
        	if (G2_webForm == false && show == true){
           		log.debug('Transition Status change');
        		switch (transType) {
           		case(LC2Constant.LC2_Transition_typ.EDS) :
           			statusFld = 'custentity_eds_transition_status';
           	        dateFld = 'custentity_eds_transition_date';
           	        dateSetByFld = 'custentity_eds_transition_dte_setby';
           	        txtType = 'EDS';
           			break;
           		case(LC2Constant.LC2_Transition_typ.eHost) :
           			statusFld = 'custentity_ehost_transition_status';
           			dateFld = 'custentity_ehost_transition_date';
           			dateSetByFld = 'custentity_ehost_transition_dte_setby';
           			txtType = 'eHost';
           			break;       
           		case(LC2Constant.LC2_Transition_typ.Explora) :
           			statusFld = 'custentity_explora_transition_status';
           			dateFld = 'custentity_explora_transition_date';
           			dateSetByFld = 'custentity_explora_transition_dte_setby';
           			txtType = 'Explora';
           			break;       
           		case(LC2Constant.LC2_Transition_typ.RefCtr) :
           			statusFld = 'custentity_refctr_transition_status';
           			dateFld = 'custentity_refctr_transition_date';
           			dateSetByFld = 'custentity_refctr_transition_dte_setby';
           			txtType = 'Ref Center';
           			break;        
           		}

        		var statusVal = cus_rec.getValue(statusFld);
        		log.debug('Status', statusVal);
        		// US905097 Status changes that are allowed (badically no restrictions):
        		//     - Not Started to In Progress  
        		//     - In Progress to Complete - Date mandatory and must be on or before today
        		//     - Not Started to Complete - Date mandatory and must be on or before today
        		//     - Complete to In Progress 
        		//     - Complete to Not Started/blank   
        		//     - In progress to Not Started/blank
        		
        		// US905097 Ensure Date field is editable or protected according to status
        		if (statusVal == G2_completeTrans){
        			cus_rec.getField(dateFld).isDisabled = false;
        		}
        		else{
        			cus_rec.getField(dateFld).isDisabled = true;
        			if (cus_rec.getField(dateFld)){
        				//US905097 Clear date field if status changed to something from Completed
        				cus_rec.setValue({
        					fieldId: dateSetByFld,
        					value: '',
        					ignoreFieldChange: true});
        				cus_rec.setValue({
        					fieldId: dateFld,
        					value: '',
        					ignoreFieldChange: true});
        			}
        		}
        	}	
        }
        
        
    } // End of fieldChanged main function

    
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
    	
    	var cus_rec = scriptContext.currentRecord;
     	var edsSts = cus_rec.getValue('custentity_eds_transition_status');
    	var ehostSts = cus_rec.getValue('custentity_ehost_transition_status');
    	var exploraSts = cus_rec.getValue('custentity_explora_transition_status');
    	var refctrSts = cus_rec.getValue('custentity_refctr_transition_status');
    	
    	// Check that Transition Date is populated for Transition Status In Progress
    	if (G2_transEdit == true && G2_webForm == false){
    		if (transDateVal('EDS', G2_showEDS, edsSts, cus_rec.getValue('custentity_eds_transition_date')) == false ){
    			return false;
    		}
    		if (transDateVal('eHost', G2_showEhost, ehostSts, cus_rec.getValue('custentity_ehost_transition_date')) == false ){
    			return false;
    		}
    		if (transDateVal('Explora', G2_showExplora, exploraSts, cus_rec.getValue('custentity_explora_transition_date')) == false ){
    			return false;
    		}
    		if (transDateVal('Ref Center', G2_showRefCtr, refctrSts, cus_rec.getValue('custentity_refctr_transition_date')) == false ){
    			return false;
    		}
    	}
    	
    	// Set Transition status to Not Started if blank
    	transStsPop(cus_rec, edsSts, 'custentity_eds_transition_status');
    	transStsPop(cus_rec, ehostSts, 'custentity_ehost_transition_status');
    	transStsPop(cus_rec, exploraSts, 'custentity_explora_transition_status');
    	transStsPop(cus_rec, refctrSts, 'custentity_refctr_transition_status');
    	
    	return true;
    	
        /*******************************************************************************************************************
         * Functions called within saveRecord Start here
         *******************************************************************************************************************/ 
         
         /* ***********************************************************************************
          * transDateVal - Transition Date field validation
          * Input:  Transition Type Text
          * 		Show Transition type
          *         Transition Status
          *         Transition Date 
          * ***********************************************************************************/
         function transDateVal(typeTxt,show,sts,date){
        	 if (show == true){
         		 if (sts == G2_completeTrans && !date){
        			 alert('Please select an ' + typeTxt + ' Transition Date')
        			 return false;
        		 }
        	 }
        	 return true;
         }
         
    }// End of saveRecord
    
    /* ***********************************************************************************
     * transStsPop - Populate Transition Status to Not Started when not set
     * Input: Record 
     * 		Status
     *         Status field 
     * ***********************************************************************************/
    function transStsPop(cus_rec, sts, stsFld){
   	 if (!sts){
   		 cus_rec.setValue({
   			 fieldId: stsFld,
   			 value: G2_notStartTrans,
   			 ignoreFieldChange: true});
   	 }
   	 return;
    }
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
