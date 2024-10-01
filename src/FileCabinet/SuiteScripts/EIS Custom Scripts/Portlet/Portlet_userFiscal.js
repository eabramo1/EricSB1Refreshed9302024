/*
    Script: Portlet_userFiscal.js

    Created by: EBSCO Information Services (a long long time ago)

    Function:
    
    Revisions:  
    CNeale	07/03/2018	US268765 Remove link to EP Sales Report Creator as scripting for this (Suitelet_ReportFprm.js)
    					has been disabled.

*/
function fiscalDashboard()
{
	var context = nlapiGetContext();
	var html = '';
	
	// Get search Ids
	var searchTransFytd = context.getSetting('SCRIPT','custscript_myfiscal_transfytd');
	var searchTransLastFytd = context.getSetting('SCRIPT','custscript_myfiscal_translastfytd');
	var searchPendingToday = context.getSetting('SCRIPT','custscript_myfiscal_pendtoday');
	var searchPendingYearAgo = context.getSetting('SCRIPT','custscript_myfiscal_pendyearago');
	var searchTransLastFyTotal = context.getSetting('SCRIPT','custscript_myfiscal_translastfytotal');
	var searchForecastNewUpgrade = context.getSetting('SCRIPT','custscript_myfiscal_forecast');
	var searchForecastRenewal = context.getSetting('SCRIPT','custscript_myfiscal_forecastrenewal');
	var userId = context.getUser();
	var userRole = context.getRole();
	var userOverride = context.getSetting('SCRIPT','custscript_myfiscal_useroverride');
	
	if ( (userRole == '3' || userRole == '1007') && userOverride != null && userOverride != '')
	{
		userId = userOverride;
	}
	var userName = nlapiLookupField('employee',userId,'entityid');
	portlet.setTitle('EP Sales Summary for ' + userName);
	
	
	// CSS Styles
	var sTable = "font-size:10pt;width:100%;"
	var sHead = "background-color:#7E95B9;color:white;margin-top:5pt;";
	var sName = "margin-right:2pt;";
	var sCurr = "margin-right:2pt;text-align:right;";
	var sPrev = "margin-right:2pt;text-align:right;";
	var sDiff = "margin-right:2pt;text-align:right;";
	var sPos = "color:#000000;";
	var sNeg = "color:#F00000;";
	var sTotal = "border-top: 3pt solid #7E95B9;";
	var sFooterLink = "font-size:8pt;margin:0;text-align:right;margin-top:2pt;";
	var sFilterData = "font-size: 8pt; margin:0; display:none;";
	
	// default variables
	var transCurrent = 0;
	var transPrevious = 0;
	var pendingCurrent = 0;
	var pendingPrevious = 0;
	var forecastNewUpgrade = 0;
	var forecastRenewal = 0;
	var totalPrevious = 0;
	
	// if employee type = product, search for products (and segments?) within territory
	// if employee type = standard, search for segments within territory
	//var employeeType = nlapiStringToDate(nlapiLookupField('employee',userId,'custentity_fiscal_employeetype'));
	
	filters = new Array();
	filtersForecast = new Array();
	var reportFilterText = '';
	
	
	
	// SUBORDINATE LOOK-UP DISABLED - To enable, remove this line and use the two lines below it
	//var employeeList = epGetAllSubsDisabled(userId);
	var employeeList = epGetAllSubs(userId);
	employeeList.sort(epSortByEmployeeName);
	// SUBORDINATE LOOK-UP DISABLED
	
	
	
	
	
	// get all territories and segments
	var employeeTerritory = epGetSalesTerritory(employeeList);
	var employeeSegment = epGetSalesSegment(employeeList);
	
	var buffer = '';
	for (i in employeeList)
	{
		buffer += (employeeList[i].getValue('entityid') + '; ');
	}
	reportFilterText += '<p><b>Employee/Team:</b> ' + buffer + '</p>';
	
	if (employeeTerritory)
	{
		var territoryIdArray = new Array();
		buffer = '';
		for(i in employeeTerritory)
		{
			buffer += (employeeTerritory[i].getValue('name','custentity_employee_territory','group') + '; ');
			territoryIdArray.push(employeeTerritory[i].getValue('internalid','custentity_employee_territory','group'));
		}
		// THE FOLLOWING LINE WAS INCORRECT!!!!!
		filters.push(new nlobjSearchFilter('custcol_allocation_territory', null,'anyof',territoryIdArray));
		filtersForecast.push(new nlobjSearchFilter('custentity_epterritory','customer','anyof',territoryIdArray));
		reportFilterText += '<p><b>My Territories:</b> ' + buffer + '</p>';
	}
	else
	{
		reportFilterText += '<p><b>My Territories:</b> Unknown.</p>';
	}
	
	if (employeeSegment)
	{
		var segmentIdArray = new Array();
		buffer = '';
		for(i in employeeSegment)
		{
			buffer += (employeeSegment[i].getValue('name','custentity_employee_segment','group') + '; ');
			segmentIdArray.push(employeeSegment[i].getValue('internalid','custentity_employee_segment','group'));
		}
		filters.push(new nlobjSearchFilter('custcol_allocation_segment',null,'anyof',segmentIdArray));
		filtersForecast.push(new nlobjSearchFilter('custentity_marketsegment','customer','anyof',segmentIdArray));
		
		reportFilterText += '<p><b>My Segments:</b> ' + buffer + '</p>';
	}
	else
	{
		reportFilterText += '<p><b>My Segments:</b> Unknown.</p>';
	}
	
	
	// TRANS This FYTD
	transCurrent = epGetFiscalTotal('transaction',searchTransFytd,filters,false);
	
	// TRANS Last FYTD
	transPrevious = epGetFiscalTotal('transaction',searchTransLastFytd,filters,false);
	
	// TRANS Total Last FY
	totalPrevious = epGetFiscalTotal('transaction',searchTransLastFyTotal,filters,false);
	
	// PENDING today
	pendingCurrent = epGetFiscalTotal('transaction',searchPendingToday,filters,false);
	
	// PENDING One Year Ago
	pendingPrevious = epGetFiscalTotal('transaction',searchPendingYearAgo,filters,false);
	
	// search for current opportunity data
	forecastNewUpgrade = epGetFiscalTotal('transaction',searchForecastNewUpgrade,filtersForecast,false);
	forecastRenewal = epGetFiscalTotal('transaction',searchForecastRenewal,filtersForecast,false);
	
	
	// calculate totals
	var subTotalCurrent = transCurrent + pendingCurrent;
	var subTotalPrevious = transPrevious + pendingPrevious;
	var totalCurrent = transCurrent + pendingCurrent + forecastNewUpgrade + forecastRenewal;
	
	// calculate percent change
	var transChange = epPercentChange(transCurrent,transPrevious);
	var pendingChange = epPercentChange(pendingCurrent,pendingPrevious);
	var subTotalChange = epPercentChange(subTotalCurrent,subTotalPrevious);
	var totalChange = epPercentChange(totalCurrent,totalPrevious);
	
	// format numbers for display
	var transCurrentText = '$ '+epAddCommas(transCurrent.toFixed(0));
	var transPreviousText = '$ '+epAddCommas(transPrevious.toFixed(0));
	var totalPreviousText = '$ '+epAddCommas(totalPrevious.toFixed(0));
	var pendingCurrentText = '$ '+epAddCommas(pendingCurrent.toFixed(0));
	var pendingPreviousText = '$ '+epAddCommas(pendingPrevious.toFixed(0));
	var subTotalCurrentText = '$ '+epAddCommas(subTotalCurrent.toFixed(0));
	var subTotalPreviousText = '$ '+epAddCommas(subTotalPrevious.toFixed(0));
	var totalCurrentText = '$ '+epAddCommas(totalCurrent.toFixed(0));
	var forecastNewUpgradeText = '$ '+epAddCommas(forecastNewUpgrade.toFixed(0));
	var forecastRenewalText = '$ '+epAddCommas(forecastRenewal.toFixed(0));
	
	// format percents for display
	var transChangeText = transChange + ' %';
	var pendingChangeText = pendingChange + ' %';
	var subTotalChangeText = subTotalChange + ' %';
	var totalChangeText = totalChange + ' %';
	
	// percent styles
	var sTransDiff = epPercentStyle(transChange,sDiff,sPos,sNeg);
	var sPendingDiff = epPercentStyle(pendingChange,sDiff,sPos,sNeg);
	var sSubTotalDiff = epPercentStyle(subTotalChange,sDiff,sPos,sNeg)
	var sTotalDiff = epPercentStyle(totalChange,sDiff,sPos,sNeg);
	
	// Generate HTML table and output to portlet
	html += '<td>';
	//html += js;
	html += '<table style="'+sTable+'">\n';
	
	html += epWriteTableRow( Array('Metric','Current','Previous','Change'), Array(sName+sHead,sCurr+sHead,sPrev+sHead,sDiff+sHead) );
	html += epWriteTableRow( Array('Trans: This FYTD vs. Last FYTD',transCurrentText,transPreviousText,transChangeText), Array(sName,sCurr,sPrev,sTransDiff) );
	html += epWriteTableRow( Array('Pending: Today vs. One Year Ago (Approx)',pendingCurrentText,pendingPreviousText,pendingChangeText), Array(sName,sCurr,sPrev,sPendingDiff) );
	html += epWriteTableRow( Array('Subtotal',subTotalCurrentText,subTotalPreviousText,subTotalChangeText), Array(sName+sTotal,sCurr+sTotal,sPrev+sTotal,sSubTotalDiff+sTotal) );
	html += epWriteTableRow( Array('Forecast: New/Upgrade (Weighted)',forecastNewUpgradeText,'&nbsp;','&nbsp;'), Array(sName,sCurr,sPrev,sDiff) );
	html += epWriteTableRow( Array('Forecast: Renewal (Weighted)',forecastRenewalText,'&nbsp;','&nbsp;'), Array(sName,sCurr,sPrev,sDiff) );
	html += epWriteTableRow( Array('Total vs. Last FY Total Trans',totalCurrentText,totalPreviousText,totalChangeText), Array(sName+sTotal,sCurr+sTotal,sPrev+sTotal,sTotalDiff+sTotal) );
	
	html += '</table>\n';
	//html += '<p style="'+sFooterLink+'"><a href="javascript:void(0)" onclick="epToggleDivId(\'ep_mydiv_01\')">View/Hide My Summary Criteria</a>&nbsp;&nbsp;<a href="/app/site/hosting/scriptlet.nl?script=16&deploy=1">EP Sales Report Creator</a>&nbsp;</p>\n';
//	US268765 Remove link to EP Sales Report Creator as no longer in use	
//	html += '<p style="'+sFooterLink+'"><a href="javascript:void(0)" onclick="var myDiv = document.getElementById(\'ep_mydiv_01\');(myDiv.style.display == \'none\')?myDiv.style.display = \'block\':myDiv.style.display = \'none\';">View/Hide My Territory</a>&nbsp;&nbsp;<a href="/app/site/hosting/scriptlet.nl?script=16&deploy=1">EP Sales Report Creator</a>&nbsp;</p>\n';
	html += '<p style="'+sFooterLink+'"><a href="javascript:void(0)" onclick="var myDiv = document.getElementById(\'ep_mydiv_01\');(myDiv.style.display == \'none\')?myDiv.style.display = \'block\':myDiv.style.display = \'none\';">View/Hide My Territory</a>&nbsp;</p>\n';
	html += '<div style="'+sFilterData+'" id="ep_mydiv_01">' + reportFilterText +'</div>';
	html += '</td>';
	
	portlet.setHtml(html);
}


function epGetFiscalTotal(searchType,searchId,myFilters,log)
{
	var myField = 'amount';
	if (searchType == 'opportunity') {myField = 'weightedtotal';}
	var myColumns = new Array();
	myColumns[0] = new nlobjSearchColumn(myField,null,'sum');
	var myTotal = 0;
	
	if (log) { myStart = new Date(); }
	var mySearchResults = nlapiSearchRecord(searchType,searchId,myFilters,myColumns);
	if (log) { myStop = new Date(); nlapiLogExecution('DEBUG','Fiscal Portlet Search',searchType + ' ' + searchId + ' ' + ((myStop-myStart)/1000)); }
	
	if(mySearchResults)
	{
		if (mySearchResults[0].getValue(myField, null, 'sum') != null)
		{
			myTotal = Number(mySearchResults[0].getValue(myField, null, 'sum'));
		}
	}
	return myTotal;
}


// This function writes a table <tr> including all <td>'s defined in an array
function epWriteTableRow(tdTextArr, tdClassArr)
{
	var htmlRow = '\n\t<tr>';
	for (tdIndex in tdTextArr)
	{
		htmlRow = htmlRow + epWriteTableCell(tdTextArr[tdIndex],tdClassArr[tdIndex]);
	}
	
	htmlRow = htmlRow + '\n\t</tr>';
	return(htmlRow);
}

// This function writes a single table <td> cell and included class
function epWriteTableCell(tdText, tdClass)
{
	var htmlCell = '\n\t\t<td';
	if (tdClass != '')
	{
		// NOTE:  THIS VERSION WRITES A STYLE PROPERTY, NOT CLASS
		htmlCell = htmlCell + ' style="' + tdClass + '"';
	}
	htmlCell = htmlCell + '>' + tdText + '</td>';
	return(htmlCell);
}


// This function returns CSS for positive, neutral, or negative change
function epPercentStyle(myValue,stdStyle,posStyle,negStyle)
{
	myStyle = stdStyle;
	if (myValue > 0) 
	{ 
		myStyle = myStyle + posStyle;
	}
	else if (myValue < 0)
	{ 
		myStyle = myStyle + negStyle;
	}
	return myStyle;
}

function epProgressStyle(currProgres,baseProgress,stdStyle,posStyle,negStyle)
{
	myStyle = stdStyle;
	baseSwing = 0.05;
	
	if ((currProgres > (baseProgress + baseSwing ) ) || (currProgres >= 1))
	{ 
		myStyle = myStyle + posStyle;
	}
	else if (currProgres < (baseProgress - baseSwing ) )
	{ 
		myStyle = myStyle + negStyle;
	}
	return myStyle;
	
}

// This function calculates the percent change rounded to the tenths
function epPercentChange(newVal,oldVal)
{
	var change = 0;
	if (oldVal != 0)
		if (oldVal < 0)
			{
				change = Math.round( ((Math.abs(newVal-oldVal))/Math.abs(oldVal))*1000 )/10;
			}
		else
			{
				change = Math.round( ((newVal-oldVal)/oldVal)*1000 )/10;
			}	
	return change;
}

function epPercentProgress(currVal,prevVal)
{
	var progress = 0;
	if (prevVal != 0)
	{
		progress = Math.round( (currVal/prevVal)*1000 )/10;
	}
	return progress;
}


// This function formats a number with commas
function epAddCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}
