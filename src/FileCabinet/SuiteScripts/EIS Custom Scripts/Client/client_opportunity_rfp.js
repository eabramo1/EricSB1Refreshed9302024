// client_oppty_rfp.js script
// Author:  Eric Abramo
// Create Date: 2016-05-26
// Description: Client script on the RFP Opportunity form.  
	// Form Stakeholders are Jane Troller and Randall Esber. 
	// The Business Analyst is D Harrington
	// Initial Development May 2016 in SB1-refresh-2024-09-30 (D. Harrington and E Abramo)
	
// Edit Log:
	// 2016-05-26:  Created - E Abramo
	// 2016-06-09:  E Abramo added code for expected behavior around Opportunity Item Status field
	// 2016-06-29:  don't require an item - as per Tyler Bentley
	// 2016-11-03:	If not a new Opportunity and user is not an Admin - then lock the custom form field
	// 2017-07-24:	Released new fields for inclusion of RFP/SSD team - add new validation
	// 2020-02-07:  US573715 RFP Opportunity Form Status Functionality Updates
	// 2021-03-15:  PKelleher - US766484 When RFP Status of No Bid is chosen, then set TRUE Status field to Closed-Lost and button on top of form should also show as Closed-Lost
	// 2024-07-25:	PKelleher - US1294840 If RFP Status is either Lost or Won or Won Partial then make the Winning Vendor field mandatory
	//				Also updated code so all RFP statuses match a related real entity status

// page initiation
function rfpFormLoad()
{
	// if new record	
	if ( (nlapiGetFieldValue('id') == "") || (nlapiGetFieldValue('id') == null) )
	{
		// set the "Real" Opportunity Status to "1-Qualify" (7)
		nlapiSetFieldValue('entitystatus', '7');
		// set the Opportunity Form Type to RFP (8)
		nlapiSetFieldValue('custbody_oppty_form_type', '8' ,false, true);
	}
	// 2016-11-03 If this is NOT a new Opportunity then lock down the Custom Form field (if not an Administrator)
	else if (nlapiGetRole() != 3)
	{
		nlapiDisableField('customform', true);
	}	
	
	// form type field should be locked
	nlapiDisableField('custbody_oppty_form_type', true);
	// Weighted Amount field should be locked
	nlapiDisableLineItemField('item', 'custcol_oppty_item_weighted_usd', true);	
}


//Field Change function
function rfpFieldChanged(type, name)
{
	// If Item Amount changes - reset Weighted Amount fields	
	if (name == 'amount')
	{
		var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
		var weighted_usd = usAmount * item_probability;
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
	}	
	// If Item Status changes - reset Weighted Amount fields
	if (name == 'custcol_oppty_item_status')
	{
		var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
		var weighted_usd = usAmount * item_probability;
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
	}
	// // If Item Probability changes - reset Weighted Amount fields
	if (name == 'custcol_oppty_item_probability')
	{
		var usAmount = Number(nlapiGetCurrentLineItemValue('item','amount'));
		var item_probability = nlapiGetCurrentLineItemValue('item', 'custcol_oppty_item_probability');
		var weighted_usd = usAmount * item_probability;
		nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_weighted_usd' , weighted_usd, false, true);
	}
	if (name == 'item')
	{
		if (nlapiGetCurrentLineItemValue('item', 'line') == '' || nlapiGetCurrentLineItemValue('item', 'line') == null)
		{
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_status', 1, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_oppty_item_probability', '.01', true, true);				
		}
	}	
}


// OPPTY validate line item function
function opptyValidateLine(type)
{
	// Suppress "amount does not equal qty * rate" messages by setting rate = amount/qty
	var qty = Number(nlapiGetCurrentLineItemValue('item','quantity'));
	var amt = Number(nlapiGetCurrentLineItemValue('item','amount'));
	var rate = 0;
	if (!isNaN(qty) && qty !=0)
	{
		rate = amt/qty;
		nlapiSetCurrentLineItemValue('item', 'rate', rate, false, true);
	}

	// Required Item Fields
	// 2016-06-29 DON'T REQUIRE ITEM in RFP - as per Tyler Bentley
	//		if (nlapiGetCurrentLineItemValue('item','item')== '' || nlapiGetCurrentLineItemValue('item','item')== null)
	//		{
	//			alert('You must enter at an item');
	//			return false;
	//		}
	
	// Opportunity Item Status
	if (nlapiGetCurrentLineItemValue('item','custcol_oppty_item_status')== '' || nlapiGetCurrentLineItemValue('item','custcol_oppty_item_status')== null)
	{
		alert('You must enter at an Opportunity Item Status');
		return false;
	}
	return true;
}


//On Save
function rfpFormSave()
{
	// Originally we required at least one line item
	// 2016-06-29 As per Tyler - Item isn't required for RFP Opportunity
	//	if( nlapiGetLineItemCount('item') < 1)
	//	{
	//		alert("You must enter at least one item for this RFP");
	//		return false;
	//	}
	
	// Winning Vendor Other is required if Winning Vendor field = "Other"(3)
	var win_vendor = nlapiGetFieldValue('custbody_rfp_winning_vendor');
	var win_vendor_other = nlapiGetFieldValue('custbody_rfp_win_vendor_other');
	if (win_vendor == '3' && (win_vendor_other == '' || win_vendor_other == null))
	{
		alert('Winning Vendor Other is required when \'Other\' is entered into Winning Vendor');
		return false;
	}

	// 2017-07-24 -- deprecate code - EDS Offer Via is no longer going to be on the form
	// EDS Offer Via Other is required if ESD Offer Via field = "Other"(7) - note Multiselect field
	/*
		var eds_offer = nlapiGetFieldValues('custbody_rfp_eds_offer_via');
		var eds_offer_other = nlapiGetFieldValue('custbody_rfp_eds_off_other');
		if (eds_offer_other == '' || eds_offer_other == null)
		{	// loop through array of Multiselect values to find "Other" (7)
			for(i = 0; i < eds_offer.length; i++)
			{
				if (eds_offer[i] == '7')
				{
					alert('EDS Offer Via Other is required when \'Other\' is entered into EDS Offer Via');
					return false;
				}
			}
		}
	*/

	// 2017-07-24 -- CODE REWORK due to change of Single Select to MultiSelect field
	// Reason Won/Lost Other is required if Reason Won/Lost field = "Other"(7)
	var reason_wonloss = nlapiGetFieldValues('custbody_rfp_reason_wonloss');
	var reason_wonloss_other = nlapiGetFieldValue('custbody_rfp_reason_wl_other');
	var rfpStatus = nlapiGetFieldValue('custbody_rfp_status')

	if (reason_wonloss_other == '' || reason_wonloss_other == null)
	{	// loop through array of Multiselect values to find "Other" (7)
		for(i = 0; i < reason_wonloss.length; i++)
		{
			if (reason_wonloss[i] == '7')
			{
				alert('Reasons Won/Lost Other is required when \'Specify your own Value (Other)\' is selected as a Reasons Won/Lost');
				return false;
			}
		}
	}	
	

	// If MultiYear - require RFP Years of Agreement
	if (nlapiGetFieldValue('custbody_rfp_multi_year') == 'T')
	{
		if (nlapiGetFieldValue('custbody_rfp_years_of_agreement') == '' || nlapiGetFieldValue('custbody_rfp_years_of_agreement') == null)
		{
			alert('Years of Agreement is required when Multiyear Agreement is checked');
			return false;		
		}
	}
	
	// US1294840 If RFP Status is either Lost or Won or Won Partial then make the Winning Vendor field mandatory
	if (rfpStatus == LC_RFPStatus.Won || rfpStatus == LC_RFPStatus.Lost || rfpStatus == LC_RFPStatus.WonPartial){
		if (!win_vendor){  // No Winning Vendor selected
			alert('Because the RFP Status is either Won, Lost or Won/Partial, please populate the Winning Vendor field.');
			return false;
		}
	}

	// US1294840 - have RFP status match the real entity status
	// If RFP Status is RFP In Progress or Decision Pending then set real entity status to IN PROGRESS
	if (rfpStatus == LC_RFPStatus.InProgress || rfpStatus == LC_RFPStatus.DecisionPending) {
		// If real entity status is not IN PROGRESS (or any status from 1-99) - set the real entity status to Develop(2)
		// NOTE: NS automatically sets the real entity status to IN PROGRESS when any of the real statuses have a probability of between 1 and 99 which Develop does which is why it is used below
		if (nlapiGetFieldValue('entitystatus') != LC_OppyStatus.Develop) {
			nlapiSetFieldValue('entitystatus', LC_OppyStatus.Develop);
		}
	}

	// If the RFP Status is set to Lost(4) or No award made as a result of this effort(6)
	if (rfpStatus == LC_RFPStatus.Lost || rfpStatus == LC_RFPStatus.NoAward)
	{
		// If real entity status is not ClosedLost(22) - set the real entity status to ClosedLost(22)
		if (nlapiGetFieldValue('entitystatus') != LC_OppyStatus.ClosedLost)
		{
			nlapiSetFieldValue('entitystatus', LC_OppyStatus.ClosedLost);
		}
		// also set the Item Status field for all line items to Lost (6) if it isn't already	
		var lineCount = nlapiGetLineItemCount('item');
		for (var w = 1; w <= lineCount; w++)
		{
			var item_status = nlapiGetLineItemValue('item', 'custcol_oppty_item_status', w);
			if (item_status != LC_OppyItemStatus.Lost)
			{			
				nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, LC_OppyItemStatus.Lost);
				nlapiSetLineItemValue('item', 'custcol_oppty_item_probability', w, '0');
				nlapiSetLineItemValue('item', 'custcol_oppty_item_weighted_usd' , w, '0');		
			}
		}
	}

	// 2021-03-15: PKelleher - US766484 When RFP Status of No Bid is chosen, then set TRUE Status field to Closed-Lost and button on top of form should also show as Closed-Lost
	// US573715 2020-02-07 - RFP Opportunity Form Status Functionality Updates for No Bid - updating oppy item status to No Volume No Bid
	if (nlapiGetFieldValue('custbody_rfp_status') == LC_RFPStatus.NoBid)
	{
		// If real entity status is not Lost(22) - set the real entity status to Lost(22)
		if (nlapiGetFieldValue('entitystatus') != LC_OppyStatus.ClosedLost)
		{
			nlapiSetFieldValue('entitystatus', LC_OppyStatus.ClosedLost);
		}
			var lineCount = nlapiGetLineItemCount('item');
			for (var w = 1; w <= lineCount; w++)
			{
				var item_status = nlapiGetLineItemValue('item', 'custcol_oppty_item_status', w);
				if (item_status != LC_OppyItemStatus.NoVolNoBid)
				{			
					nlapiSetLineItemValue('item', 'custcol_oppty_item_status', w, LC_OppyItemStatus.NoVolNoBid);
				}
			}
	}
	
	// If the RFP Status is set to Won(3) or WonPartial(8)
	if (rfpStatus == LC_RFPStatus.Won || rfpStatus == LC_RFPStatus.WonPartial)
	{
		// If real entity status is not ClosedWon(26) - set the real entity status to ClosedWon(26)
		if (nlapiGetFieldValue('entitystatus') != LC_OppyStatus.ClosedWon)
		{
			nlapiSetFieldValue('entitystatus', LC_OppyStatus.ClosedWon, true, true);
		
		}
    		// Validate that you have no Item Statuses left in an 'In Progress' state (they all have to be either Lost or Won)
    		// Validate that you have at least one Item with a Status of 'Won'
		var lineCount = nlapiGetLineItemCount('item');
		var atLeastOneIsInProgress = false;
		var atLeastOneIsWon = false;
		for (var w = 1; w <= lineCount; w++)
		{
			// 6 = 7-Closed - Lost Item 
			// 7 = 6-Closed - Won Item 		
			var item_status = nlapiGetLineItemValue('item', 'custcol_oppty_item_status', w);
			if (item_status != LC_OppyItemStatus.Won && item_status != LC_OppyItemStatus.Lost)
			{			
				atLeastOneIsInProgress = true;
			}
			if (item_status == LC_OppyItemStatus.Won)
			{			
				atLeastOneIsWon = true;
			}			
		}
		if (atLeastOneIsInProgress == true)
		{
			alert('In order to mark your RFP as "Won" all of your items need an Item Status of either "Won" or "Lost" and at least one must be marked as "Won"');
			return false;
		}
		if (atLeastOneIsWon == false)
		{
			alert('In order to mark your RFP as "Won" at least one item must have an Item Status of "Won"');
			return false;
		}
	}
	
	
	// Set the Opportunity Form type to RFP (8)
	if (nlapiGetFieldValue('custbody_oppty_form_type') != '8')
	{
		nlapiSetFieldValue('custbody_oppty_form_type', '8' ,false, true);
	}	
	
	
	return(true);
}