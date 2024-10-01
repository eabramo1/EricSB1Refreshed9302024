// Script:     UserEvent_customer_before_submit.js
//
// Created by: EBSCO Information Services  05/06/2016
//
// Functions:  serverCustomerBeforeSubmit - catch-all to update customer onto addresses when Session Object set to 'error'.    	
//				
//
// Revisions:  
//		CNeale	08/02/2016	Cust Auth US116612 changes. 
//							Identify & delete any new blank address lines.
//							Set first address as main address if new Customer with no main address.
//							Update Customer on address if not populated.
//							Throw an error if:-	
//								Addresses approved for deletion but not deleted.
//								Main address errors too many/too few.
//								EP Territory State/Country differs from Main Address.
//							Set the address label.
//                          Check default billing & default shipping set for Main address.
//		CNeale	09/06/2016	US157010 Resolve issues with Inactive Customers.
//                          Do not run script for EP Web Service role/user.
//		eAbramo	12/03/2018	US402266 - TA277770 CXP set 'SalesForce Modified Date' when certain fields are modified 
//							-- setting this date triggers SF synchronization
//		KMcCormack 12-03-18	US402324 - Correct logic to set "SalesForce Modified Date" based on users timezone
//
//							******  ADDED library_constants.js to this script record in order to use LC_Default_PST_Timezone constant ******
//		eAbramo	06/08/2020	US652366 NetCRM - New Customer Tab for SalesOps - MetaData
//		JOliver	10/29/20	US698286 update the SF Last Modified date/time stamp to use 4 new Migration Status fields
//		CNeale	01/25/21	US733867 Resolve XEdit issues
//		CNeale	03/25/21	US734954 Boomi Sync for Edit (but not XEdit) of Transition fields
//		CNeale	12/20/21	US856065 Boomi Sync for Edit of FOLIO flag
//		CNeale	03/15/2022	US905097 Transition Center changes - remove default date from Boomi sync consideration
//		ZScannell 3/1/2022 	US927406	Customer Authority Changes
//		JOliver	07/31/2023	US1137024 Boomi Sync for Edit of FOLIO Partner flag
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//US652366 - new global variables for formatting current date - used to set 'Last Updated' field to current date (depending on field)
var datetime_field_string = null;

function serverCustomerBeforeSubmit(type)
{
	var custRecId = nlapiGetRecordId();
	var ctx = nlapiGetContext();
	var addressCount = nlapiGetLineItemCount('addressbook');
	var mainCnt = 0;
	var mainId;
	var mainCtry;
	var mainState;
	var inact;
	
// US157010 - Exclude EP Web Service role (1025) & EP Web Service user (452592) from executing script (inline with before load script). 	
	if ((type == 'edit' || type == 'create') && ctx.getExecutionContext()== 'userinterface' && ctx.getRole() != 1025 && ctx.getUser() != 452592)
	{
			// Determine if relates to Inactive Customer
			inact = nlapiLookupField('customrecord_cust_add_control', nlapiGetFieldValue('custpage_control_rec_id'), 'custrecord_cac_cust_inact');

			// Run through all addresses - identify any blank addresses, any addresses awaiting delete, main address details
			// Update Address Label
			for (var a = 1; a <= addressCount; a++)
			{		
				nlapiSelectLineItem('addressbook', a);
				var commitInd = false;
				
				// Retrieve Address Lines 1, 2 & City
				var addad1 = nlapiGetCurrentLineItemValue('addressbook', 'addr1');
				var addad2 = nlapiGetCurrentLineItemValue('addressbook', 'addr2');
				
				// Exclude any addresses that have no address details entered via the address form & delete them 
				// Check Address line 1, 2 & City to eliminate possibility of incorrectly formatted address being deleted
				if (!addad1 && !addad2 && !nlapiGetCurrentLineItemValue('addressbook', 'city'))
				{

					//Delete the Blank Line in the Address Book
					
						nlapiRemoveCurrentLineItemSubrecord('addressbook', 'addressbookaddress'); 
						nlapiCommitLineItem('addressbook');
						nlapiRemoveLineItem('addressbook', a);
						a = a-1;
						addressCount = addressCount - 1;

						nlapiLogExecution('DEBUG','<Before Submit> Blank Line Delete, Customer Id: '+custRecId);

					continue;
				}
				
				//Retrieve further Address Record details		
				var subrecadd = nlapiViewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
				var addCust = subrecadd.getFieldValue('custrecord_address_customer');
				var addMain = subrecadd.getFieldValue('custrecord_main_add');
				var addBill = subrecadd.getFieldValue('custrecord_is_billto');
				var addShip = subrecadd.getFieldValue('custrecord_is_shipto');
				var listLabel = nlapiGetCurrentLineItemValue('addressbook', 'label');

				// Count no. of Main addresses & store Main State & Country for latest
				if (addMain == 'T')
				{
					mainCnt = mainCnt + 1;
					mainState = subrecadd.getFieldValue('state');
					mainCtry = subrecadd.getFieldValue('country');
					// Also set default Billing & Shipping indicators if not already set
					if (subrecadd.getFieldValue('defaultbilling') != 'T')
					{
						nlapiSetCurrentLineItemValue('addressbook', 'defaultbilling', 'T', false, true);
						commitInd = true;
					}
					if (subrecadd.getFieldValue('defaultshipping') != 'T')
					{
						nlapiSetCurrentLineItemValue('addressbook', 'defaultshipping', 'T', false, true);
						commitInd = true;
					}	
				}
	
				// Calculate address label & update if necessary
				var addLabel = setAddressLabel(addMain,addBill,addShip,addad1,addad2);
				
				if(addLabel != listLabel)
				{
					nlapiSetCurrentLineItemValue('addressbook', 'label', addLabel, false, true);
					commitInd = true;
				}	
				
				// Check whether Customer update is required
				if (type == 'edit' && custRecId != addCust)
				{
					//US157010 Cater for Inactive Customer (that cannot populate to Custrecord_address_customer).
					if (inact != 'T')
					{
						var subrecordedit = nlapiEditCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
						subrecordedit.setFieldValue('custrecord_address_customer', custRecId);
						subrecordedit.commit();
						commitInd = true;
					}
					else
					{
						if (addCust != '')
						{
							var subrecordedit = nlapiEditCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
							subrecordedit.setFieldValue('custrecord_address_customer', '');
							subrecordedit.commit();
							commitInd = true;
						}
					}
				}	
				
				if (type == 'create' && addCust)
				// New Customers with Address Customer populated = inherited from Parent - so cleardown any values that might be pop.	
				{
					var subrecordedit = nlapiEditCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
					subrecordedit.setFieldValue('custrecord_address_customer', '');
					
					subrecordedit.commit();
					commitInd = true;
				}	
				

				// If this line item has been updated then commit changes
				if(commitInd == true) 
				{
					nlapiCommitLineItem('addressbook');
				}
			}
			
			if (mainCnt == 0 && type == 'create')
			{
				if (addressCount >= 1)
				{
					// New Customer with no Main Address - set first address line = "Main" & update label
					nlapiSelectLineItem('addressbook', 1);
					var subrecordedit = nlapiEditCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
					subrecordedit.setFieldValue('custrecord_main_add', 'T');
					mainCnt = mainCnt + 1;
					mainState = subrecordedit.getFieldValue('state');
					mainCtry = subrecordedit.getFieldValue('country');
					subrecordedit.commit();
					nlapiSetCurrentLineItemValue('addressbook', 'defaultbilling', 'T', false, true);
					nlapiSetCurrentLineItemValue('addressbook', 'defaultshipping', 'T', false, true);
					nlapiSetCurrentLineItemValue('addressbook', 'label', setAddressLabel('T',addBill,addShip,addad1,addad2), false, true);
					nlapiCommitLineItem('addressbook');
				}
			}
			
			if (mainCnt == 1)
			{
				//Check that main details match what's stored in the form fields i.e. what was actually used to set the territory....

				var formCtry = nlapiGetFieldValue('custentity_disp_epterr_ctry');
				var formState = nlapiGetFieldValue('custentity_disp_epterr_state');
				
				if (formCtry != mainCtry || formState != mainState)
				{
					nlapiLogExecution('AUDIT','<Before Submit> Territory Error, Customer Id: '+custRecId);
					throw nlapiCreateError('ERROR1', 'Major Error - there has been a problem with the territory for this Customer/Address update, your changes have not been saved. Please make your changes again.', true);
				}

			}
			else
			{
				nlapiLogExecution('AUDIT','<Before Submit> Main Address Error, Customer Id: '+custRecId);
				throw nlapiCreateError('ERROR2', 'Major Error - there has been a problem with assigning the Main Address, your changes have not been saved. Please make your changes again.', true);
			}
			
			
			
			// US652366 NetCRM - New Customer Tab for SalesOps - MetaData
			// Set the two new 'Last Modified Date' fields when fields are set
			// If Type = 'Create' there is no Old Record
			var old_lib_budget_pchange = 0;
			var old_coll_aqs_pchange = 0;
			if (type != 'create')
			{
				var oldRecord = nlapiGetOldRecord();
				old_lib_budget_pchange = oldRecord.getFieldValue('custentity_budget_percent_change');
				// handle null and blank values as zero so they can be compared accurately
				if(old_lib_budget_pchange == null || old_lib_budget_pchange == '')
				{
					old_lib_budget_pchange = 0;
				}
				old_coll_aqs_pchange = oldRecord.getFieldValue('custentity_coll_aqs_budget_percent_chang');
				// handle null and blank values as zero so they can be compared accurately
				if(old_coll_aqs_pchange == null || old_coll_aqs_pchange == '')
				{
					old_coll_aqs_pchange = 0;
				}
			}
			var newRecord = nlapiGetNewRecord();
			var new_lib_budget_pchange = newRecord.getFieldValue('custentity_budget_percent_change');
			// handle null and blank values as zero so they can be compared accurately
			if(new_lib_budget_pchange == null || new_lib_budget_pchange == '')
			{
				new_lib_budget_pchange = 0;
			}			
			nlapiLogExecution('DEBUG', 'old_lib_budget_pchange is '+old_lib_budget_pchange, 'new_lib_budget_pchange is '+new_lib_budget_pchange);
			if (old_lib_budget_pchange != new_lib_budget_pchange)
			{
				nlapiLogExecution('DEBUG', 'Trigger Library Budget Last Modified', 'old_lib_budget_pchange is '+old_lib_budget_pchange+' and new_lib_budget_pchange is '+new_lib_budget_pchange);
				// Call function to set date time value for the field I want to update with current date
				datetime_field_string = 'custentity_lib_budget_change_lastupdated';
				set_date_time_value(datetime_field_string);
			}

			var new_coll_aqs_pchange  = newRecord.getFieldValue('custentity_coll_aqs_budget_percent_chang');
			// handle null and blank values as zero so they can be compared accurately
			if(new_coll_aqs_pchange == null || new_coll_aqs_pchange == '')
			{
				new_coll_aqs_pchange = 0;
			}
			if (old_coll_aqs_pchange != new_coll_aqs_pchange)
			{
				nlapiLogExecution('DEBUG', 'Trigger Collections/Aquist Budget Last Modified', 'old_coll_aqs_pchange is '+old_coll_aqs_pchange+' and new_coll_aqs_pchange is '+new_coll_aqs_pchange);
				// Call function to set date time value for the field I want to update with current date
				datetime_field_string = 'custentity_coll_aqs_chg_lastupdated';
				set_date_time_value(datetime_field_string);
			}
	}
	
	// US402266 - TA277770 CXP set 'SalesForce Modified Date' when certain fields are modified 
	// US733867 - Make adjustments for xedit where fields are not changed the new record will return "null" for the field
	if (type == 'edit' || type == 'xedit')
	{
		// set SF_Sync_trigger variable -- assume field is NOT updated
		var SF_Sync_trigger = false;
		var oldRecord = nlapiGetOldRecord();
		var newRecord = nlapiGetNewRecord();
		
		// US733867 Determine SFID
		var SFID = newRecord.getFieldValue('custentity_sf_account_id');
		if (type == 'xedit' && SFID == null){
			// US733867 SFID has not been set via xedit therefore look at old value
			SFID = oldRecord.getFieldValue('custentity_sf_account_id');
			nlapiLogExecution('DEBUG', 'xedit SFID unchanged ', 'SFID: '+SFID);
		}
	
		// only run code if Customer has a SF ID
		if (SFID)
		{
				nlapiLogExecution('DEBUG', 'This customer has a SF ID', 'Customer Id: '+custRecId);
				
				// Detect a change to at least one of these fields		
				// 1) Site Name
				var oldSiteName = oldRecord.getFieldValue('companyname');
				var newSiteName  = newRecord.getFieldValue('companyname');	
				if (type == 'xedit' && newSiteName == null){newSiteName = oldSiteName;}// US733867
				if (oldSiteName != newSiteName)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Site Name', 'oldSiteName is '+oldSiteName+' and newSiteName is '+newSiteName);
					SF_Sync_trigger = true;
				}			
				// 2) Billing Address block
				var oldAddress = oldRecord.getFieldValue('defaultaddress');
				var oldModifiedAddress = oldAddress.replace(/\s+/g, "");
				var newAddress  = newRecord.getFieldValue('defaultaddress');
				if (type == 'xedit' && newAddress == null){newAddress = oldAddress;}// US733867
				var newModifiedAddress = newAddress.replace(/\s+/g, "");
				if (oldModifiedAddress != newModifiedAddress)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Address', 'oldAddress is '+oldModifiedAddress+' and newAddress is '+newModifiedAddress);
					SF_Sync_trigger = true;
				}		
				// 3) Customer Satisfaction  
				var oldcustSat = oldRecord.getFieldValue('custentity_customer_satisfaction');
				var newcustSat = newRecord.getFieldValue('custentity_customer_satisfaction');
				if (type == 'xedit' && newcustSat == null){newcustSat = oldcustSat;}// US733867
				// convert null value to string (due to inconsistency of null vs empty string being returned from NS)
				// oldcustSat = (oldcustSat == null ? "" : oldcustSat);
				// newcustSat = (newcustSat == null ? "" : newcustSat);	
				oldcustSat = L_cnvrtNullToEmptyString(oldcustSat);
				newcustSat = L_cnvrtNullToEmptyString(newcustSat);
				if (oldcustSat != newcustSat)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger custSat', 'oldcustSat is '+oldcustSat+' and newcustSat  is '+newcustSat );
					SF_Sync_trigger = true;
				}			
				// 4) CAS Level  
				var oldcasLevel = oldRecord.getFieldValue('custentity_cas_level');
				var newcasLevel  = newRecord.getFieldValue('custentity_cas_level');	
				if (type == 'xedit' && newcasLevel == null){newcasLevel = oldcasLevel;}// US733867
				// convert null value to string (due to inconsistency of null vs empty string being returned from NS)
				oldcasLevel = L_cnvrtNullToEmptyString(oldcasLevel);
				newcasLevel = L_cnvrtNullToEmptyString(newcasLevel);			
				if (oldcasLevel != newcasLevel)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger CAS Level', 'oldcasLevel is '+oldcasLevel+' and newcasLevel is '+newcasLevel);
					SF_Sync_trigger = true;
				}						
				// 5) Market 
				var oldMarket = oldRecord.getFieldValue('custentity_market');
				var newMarket  = newRecord.getFieldValue('custentity_market');	
				if (type == 'xedit' && newMarket == null){newMarket = oldMarket;}// US733867
				if (oldMarket != newMarket)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Market', 'oldMarket is '+oldMarket+' and newMarket is '+newMarket);
					SF_Sync_trigger = true;
				}						
				// 6) Segment 
				var oldSegment = oldRecord.getFieldValue('custentity_marketsegment');
				var newSegment  = newRecord.getFieldValue('custentity_marketsegment');
				if (type == 'xedit' && newSegment == null){newSegment = oldSegment;}// US733867
				if (oldSegment != newSegment)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Segment', 'oldSegment is '+oldSegment+' and newSegment is '+newSegment);
					SF_Sync_trigger = true;
				}
				
				// US734954 Handle UI Edit but NOT XEdit of Transition fields (Status, Date, Default Date) US905097 remove Default Date
				// XEDIT is not permitted - this is handled in UserEvent2_customer_before_submit.js script
				if (type == 'edit'){
				 
					// 7) EDS Transition Status (US698286)
					var oldEDSstatus = oldRecord.getFieldValue('custentity_eds_transition_status');
					if (!oldEDSstatus){
						oldEDSstatus = LC_Transition_sts.NotStart;
					}
					var newEDSstatus  = newRecord.getFieldValue('custentity_eds_transition_status');	
					nlapiLogExecution('DEBUG','CXP: B4 Trigger EDS Migration Status', 'oldEDSstatus is '+oldEDSstatus+' and newEDSstatus is '+newEDSstatus);
					if ((oldEDSstatus || newEDSstatus) && oldEDSstatus != newEDSstatus)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger EDS Migration Status', 'oldEDSstatus is '+oldEDSstatus+' and newEDSstatus is '+newEDSstatus);
						SF_Sync_trigger = true;
					}
					// 7)a) EDS Transition Date 
					var oldEDSdate = oldRecord.getFieldValue('custentity_eds_transition_date');
					var newEDSdate  = newRecord.getFieldValue('custentity_eds_transition_date');	
					nlapiLogExecution('DEBUG','CXP: B4 Trigger EDS Transition Date', 'oldEDSdate is '+oldEDSdate+' and newEDSdate is '+newEDSdate);
					if ((oldEDSdate || newEDSdate) && oldEDSdate != newEDSdate)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger EDS Transition Date', 'oldEDSdate is '+oldEDSdate+' and newEDSdate is '+newEDSdate);
						SF_Sync_trigger = true;
					}
					// 8) eHost Transition Status (US698286)
					var oldEhostStatus = oldRecord.getFieldValue('custentity_ehost_transition_status');
					if (!oldEhostStatus){
						oldEhostStatus = LC_Transition_sts.NotStart;
					}
					var newEhostStatus  = newRecord.getFieldValue('custentity_ehost_transition_status');		
					if ((oldEhostStatus || newEhostStatus) && oldEhostStatus != newEhostStatus)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger eHost Transition Status', 'oldEhostStatus is '+oldEhostStatus+' and newEhostStatus is '+newEhostStatus);
						SF_Sync_trigger = true;
					}
					// 8)a) eHost Transition Date 
					var oldEhostdate = oldRecord.getFieldValue('custentity_ehost_transition_date');
					var newEhostdate  = newRecord.getFieldValue('custentity_ehost_transition_date');	
					if ((oldEhostdate || newEhostdate) && oldEhostdate != newEhostdate)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger eHost Transition Date', 'oldEhostdate is '+oldEhostdate+' and newEhostdate is '+newEhostdate);
						SF_Sync_trigger = true;
					}
					// 9) Explora Migration Status (US698286)
					var oldExploraStatus = oldRecord.getFieldValue('custentity_explora_transition_status');
					if (!oldExploraStatus){
						oldExploraStatus = LC_Transition_sts.NotStart;
					}
					var newExploraStatus  = newRecord.getFieldValue('custentity_explora_transition_status');		
					if ((oldExploraStatus || newExploraStatus) && oldExploraStatus != newExploraStatus)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger Explora Transition Status', 'oldExploraStatus is '+oldExploraStatus+' and newExploraStatus is '+newExploraStatus);
						SF_Sync_trigger = true;
					}
					// 9)a) Explora Transition Date 
					var oldExploradate = oldRecord.getFieldValue('custentity_explora_transition_date');
					var newExploradate  = newRecord.getFieldValue('custentity_explora_transition_date');	
					if ((oldExploradate || newExploradate) && oldExploradate != newExploradate)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger Explora Transition Date', 'oldExploradate is '+oldExploradate+' and newExploradate is '+newExploradate);
						SF_Sync_trigger = true;
					}
					// 10) Ref Center Transition Status (US698286)
					var oldRefCtrStatus = oldRecord.getFieldValue('custentity_refctr_transition_status');
					if (!oldRefCtrStatus){
						oldRefCtrStatus = LC_Transition_sts.NotStart;
					}
					var newRefCtrStatus  = newRecord.getFieldValue('custentity_refctr_transition_status');		
					if ((oldRefCtrStatus || newRefCtrStatus) && oldRefCtrStatus != newRefCtrStatus)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger Ref Center Transition Status', 'oldRefCtrStatus is '+oldRefCtrStatus+' and newRefCtrStatus is '+newRefCtrStatus);
						SF_Sync_trigger = true;
					}
					// 10)a) Ref Center Transition Date 
					var oldRefCtrdate = oldRecord.getFieldValue('custentity_refctr_transition_date');
					var newRefCtrdate  = newRecord.getFieldValue('custentity_refctr_transition_date');	
					if ((oldRefCtrdate || newRefCtrdate) && oldRefCtrdate != newRefCtrdate)
					{
						nlapiLogExecution('DEBUG','CXP: Trigger Ref Center Transition Date', 'oldRefCtrdate is '+oldRefCtrdate+' and newRefCtrdate is '+newRefCtrdate);
						SF_Sync_trigger = true;
					}
				}
				
				// 11) FOLIO Customer flag (US856065) 
				var oldFolio = oldRecord.getFieldValue('custentity_folio_cust');
				var newFolio  = newRecord.getFieldValue('custentity_folio_cust');
				if (type == 'xedit' && newFolio == null){newFolio = oldFolio;}
				if (oldFolio != newFolio)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Segment', 'oldFolio is '+oldFolio+' and newFolio is '+newFolio);
					SF_Sync_trigger = true;
				}
				
				// 12) FOLIO Partner flag (US1137024)
				var oldFolioPartner = oldRecord.getFieldValue('custentity_folio_partner');
				var newFolioPartner  = newRecord.getFieldValue('custentity_folio_partner');
				if (type == 'xedit' && newFolioPartner == null){newFolioPartner = oldFolioPartner;}
				if (oldFolioPartner != newFolioPartner)
				{
					nlapiLogExecution('DEBUG','CXP: Trigger Segment', 'oldFolioPartner is '+oldFolioPartner+' and newFolioPartner is '+newFolioPartner);
					SF_Sync_trigger = true;
				}

				// SalesForce Account ID  is create new -- NOTE DIFFERENT REQUIREMENT HERE
				var newSFid  = newRecord.getFieldValue('custentity_sf_account_id');
				if (newSFid == 'createNew')
				{
					nlapiLogExecution('DEBUG','CXP: Trigger SalesForce Account ID', 'newSFid is '+newSFid);
					SF_Sync_trigger = true;
				}					
	
				// SET SF Modified DATE
				if (SF_Sync_trigger == true)
				{
					nlapiLogExecution('DEBUG','CXP: SF_Sync_trigger: '+SF_Sync_trigger, 'Customer Id: '+custRecId);
					//US402324 - Correct logic so that datetime value set for custentity_sf_modified_date takes into account
					//the current users timezone.  (See Suite Answer #37276 for an example of timezone manipulation.)

					// Call function to set date time value for the field I want to update with current date
					datetime_field_string = 'custentity_sf_modified_date';
					set_date_time_value(datetime_field_string);		
				}
		}		
	}
}
	
// US652366 NetCRM - New Customer Tab for SalesOps - MetaData
// New Function set_date_time_value - a function to set the Current Date/Time (uses User Preference)
//	Input:  field_string (string representing the NS field ID that you want to set to the Current Date Time)
//  Output:  - NONE-
function set_date_time_value(datetime_field_string)
{
	// ************************** BEGIN SET DATE TIME FIELD *********************************************
	//the current users timezone.  (See Suite Answer #37276 for an example of timezone manipulation.)
				
	//load User Preferences configuration page so we can get the users timezone
	var userPrefInfo = nlapiLoadConfiguration('userpreferences');
	var userTZ = userPrefInfo.getFieldValue('TIMEZONE');
	nlapiLogExecution('DEBUG','Retrieved user preferences', 'Preferred timezone is: '+userTZ);

	//Get todays date and put it in string format
	var today = new Date();
	var curr_date_string = nlapiDateToString(today, 'datetimetz');
	// nlapiLogExecution('DEBUG', 'default PST current datetime from NS server ', 'curr_date_string: '+curr_date_string);
	
	//The current date and time captured within the server is set to PST that is why we need to set it first to "America/Los_Angeles"
	nlapiSetDateTimeValue(datetime_field_string, curr_date_string, LC_Default_PST_Timezone);		
	//Once the current date and time default timezone is set, it can then be changed to coincide with the current users timezone
	nlapiSetDateTimeValue(datetime_field_string, nlapiGetDateTimeValue(datetime_field_string), userTZ);
	return;
}

