function serverReportForm(request, response)
{
	if (request.getMethod() == 'GET')
	{
		var context = nlapiGetContext();
		var userId = context.getUser();
		var userEmail = context.getEmail();
		var userRole = context.getRole();
		
		// create a form and specify the client script
		var form = nlapiCreateForm('EP Gross Sales Report Creator');
		form.setScript('customscript17');
		
		// add tabs
		var tFilters = form.addTab('custpage_filters_tab','Filters');
		var tOptions = form.addTab('custpage_options_tab','Options');
		var tHelp = form.addTab('custpage_help_tab','Help and Notes');
		
		// add screen fields
		var fInline1 = form.addField('custpage_inline1','inlinehtml');
		var fGroupBy = form.addField('custpage_group_type','select','Sales Report');
		var fComparison = form.addField('custpage_comparison_type','select','Comparison');
		var fSendEmail = form.addField('custpage_send_email','checkbox','Send Email',null,'custpage_options_tab');
		var fEmailAddress = form.addField('custpage_email_address','multiselect','CC: Others',null,'custpage_options_tab');
		var fChange = form.addField('custpage_change_type','select','Show Change As',null,'custpage_options_tab');
		var fHelp1 = form.addField('custpage_inlinehelp1','inlinehtml',null,null,'custpage_help_tab');
		var fHelp2 = form.addField('custpage_inlinehelp2','inlinehtml',null,null,'custpage_help_tab');
		fHelp2.setLayoutType('normal','startcol');
		
		// TEMP -- DISABLE EMAIL OPTIONS 
		fSendEmail.setDefaultValue('F');
		fSendEmail.setDisplayType('disabled');
		fEmailAddress.setDisplayType('disabled');
		fEmailAddress.setPadding(1);
		
		// filter fields
		var fEmployee = form.addField('custpage_employee_filter','select','Employee/Team',null,'custpage_filters_tab');
		var fSegment = form.addField('custpage_segment_filter','multiselect','Segment',null,'custpage_filters_tab');
		var fTerritory = form.addField('custpage_territory_filter','multiselect','Territory',null,'custpage_filters_tab');
		var fProductOffering = form.addField('custpage_productoffering_filter','multiselect','Product Offering',null,'custpage_filters_tab');
		fProductOffering.setDisplaySize(0,7);
		var fMarket = form.addField('custpage_market_filter','multiselect','Market',null,'custpage_filters_tab');
		fMarket.setLayoutType('normal','startcol');
		var fGeoMarket = form.addField('custpage_geomarket_filter','multiselect','GeoMarket',null,'custpage_filters_tab');
		var fOfferingCategory = form.addField('custpage_offeringcategory_filter','multiselect','Product Offering Category',null,'custpage_filters_tab');
		
		// TEMP -- HIDE EMPLOYEE SELECTION
		if (userRole != '3' && userRole != '1001' && userRole != '1007' && userRole != '1019' && userRole != '1027' && userRole != '1034' && userRole != '1027' && userRole != '1041' && userRole != '1047' && userRole != '1053') fEmployee.setDisplayType('hidden');
		
		// specify heading to first section 
		fInline1.setDefaultValue('<h3>Select a Report:</h3>');
		fInline1.setLayoutType('startrow','startcol');
		
		// create a search for populating grouping, comparison, and filter fields
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('isinactive',null,'is','F');
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		columns[1] = new nlobjSearchColumn('name');
		
		// populate group select with values
		columns[2] = new nlobjSearchColumn('custrecord_report_default');
		searchResults = nlapiSearchRecord('customrecord72',null,filters,columns);
		for (i in searchResults)
		{
			if(searchResults[i].getValue('custrecord_report_default') == 'T')
			{
				fGroupBy.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name').replace(/product offering/gi, 'Database'),true);
			}
			else
			{
				fGroupBy.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name').replace(/product offering/gi, 'Database'));
			}
		}
		
		// populate comparison select with values
		columns[2] = new nlobjSearchColumn('custrecord_report_search_default');
		searchResults = nlapiSearchRecord('customrecord94',null,filters,columns);
		for (i in searchResults)
		{
			if(searchResults[i].getValue('custrecord_report_search_default') == 'T')
			{
				fComparison.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'),true);
			}
			else
			{			
				fComparison.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
			}
		}
		columns.pop();
		
		// populate change select with values
		fChange.addSelectOption('1','% Change');
		fChange.addSelectOption('2','$ Change (Not Available)');
		
		// search geomarkets and populate
		searchResults = nlapiSearchRecord('customrecord81',null,filters,columns);
		fGeoMarket.addSelectOption('','All GeoMarkets', true);
		for (i in searchResults)
		{
			fGeoMarket.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		// search markets and populate
		searchResults = nlapiSearchRecord('customrecord89',null,filters,columns);
		fMarket.addSelectOption('','All Markets', true);
		for (i in searchResults)
		{
			fMarket.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		
		// search offering categories and populate
		searchResults = nlapiSearchRecord('customlist10',null,filters,columns);
		fOfferingCategory.addSelectOption('','All Categories', true);
		for (i in searchResults)
		{
			fOfferingCategory.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		// search segments and populate
		searchResults = nlapiSearchRecord('customrecord1',null,filters,columns);
		fSegment.addSelectOption('','All Segments', true);
		for (i in searchResults)
		{
			fSegment.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		// search territories and populate
		searchResults = nlapiSearchRecord('customrecord83',null,filters,columns);
		fTerritory.addSelectOption('','All Territories', true);
		for (i in searchResults)
		{
			fTerritory.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		// search product offerings and populate
		filters[1] = new nlobjSearchFilter('custitem_archive',null,'is','F');
		searchResults = nlapiSearchRecord('item',null,filters,columns);
		fProductOffering.addSelectOption('','All Offerings', true);
		for (i in searchResults)
		{
			fProductOffering.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('name'));
		}
		
		
		
		// if role is admin or sales admin, show all employees
		//if (userRole == '3' || userRole == '1007')
		if (true) // TEMP -- IGNORE SUB LOOKUP -- USE ALL EMPLOYEES INSTEAD
		{
			// append search filters for employee search
			filters[1] = new nlobjSearchFilter('salesrep',null,'is','T');
			filters[2] = new nlobjSearchFilter('isinactive',null,'is','F');
			columns[1] = new nlobjSearchColumn('entityid');
			columns[2] = new nlobjSearchColumn('email');
			
			// search employees and populate
			searchResults = nlapiSearchRecord('employee',null,filters,columns);
			
			// add all employees option
			searchResults = searchResults.sort(epSortByEmployeeName);
			fEmployee.addSelectOption('','All Employees', true);
		}
		else  // show only subordinates to the logged in user
		{
			searchResults = epGetAllSubs(userId);
			searchResults = searchResults.sort(epSortByEmployeeName);
		}
		
		// look for current user and select as default if found.  Ignore default if current user role is admin (3) or sales admin (1007)
		for (i in searchResults)
		{
			if(userId == searchResults[i].getId() && userRole != '3' && userRole != '1007' )
			{
				fEmployee.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('entityid'),true);
			}
			else
			{
				fEmployee.addSelectOption(searchResults[i].getId(),searchResults[i].getValue('entityid'),false);
			}
			//fEmailAddress.addSelectOption(searchResults[i].getValue('email'),searchResults[i].getValue('entityid'),false);
		}
		
		// populate the help
		var helpHtml = nlapiLoadFile(82402);
		fHelp1.setDefaultValue(helpHtml.getValue());
		
		var helpHtml2 = nlapiLoadFile(83269);
		fHelp2.setDefaultValue(helpHtml2.getValue());
		
		// add submit button and output form
		form.addSubmitButton('Create Report');
		response.writePage(form);
	}
	
	// POST - FORM HAS BEEN SUBMITTED
	else
	{
		// some basics
		var startTime = new Date();
		var reportHeader = '';
		var reportFilterText = '';
		var reportBody = '';
		var reportFooter = '';
		var context = nlapiGetContext();
		var userId = context.getUser();
		var userEmail = context.getEmail();
		var userName = nlapiLookupField('employee',userId,'entityid');
		
		
		// click form field data
		var postSegment = '';
		var postTerritory = '';
		var postMarket = '';
		var postGeomarket = '';
		var postCategory = '';
		var postOffering = '';
		var postCountry = '';
		
		
		// get post parameters
		var reportId = request.getParameter('custpage_group_type');
		var searchMapId = request.getParameter('custpage_comparison_type');
		var change = request.getParameter('custpage_change_type');
		var geomarkets = request.getParameterValues('custpage_geomarket_filter');
		var markets = request.getParameterValues('custpage_market_filter');
		var employee = request.getParameter('custpage_employee_filter');
		var categories = request.getParameterValues('custpage_offeringcategory_filter');
		var countries = request.getParameterValues('custpage_country_filter');
		
		var segments = request.getParameterValues('custpage_segment_filter');
		var territories = request.getParameterValues('custpage_territory_filter');
		var offerings = request.getParameterValues('custpage_productoffering_filter');
		
		var sendEmail = request.getParameter('custpage_send_email');
		var emailAddress = request.getParameterValues('custpage_email_address');
		
		// data to calculate column headers
		var monthArr = new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
		var cMonth = startTime.getMonth();  // in javascript january = 0
		var cYear = startTime.getFullYear();
		var fyTime = new Date(startTime);
		fyTime.setMonth(fyTime.getMonth()+6);
		var cFYear = fyTime.getFullYear();
		var pMonth = cMonth - 1;
		if (pMonth < 0) { pMonth = pMonth + 12; }
		
		// load search map record data
		var searchMap = nlapiLoadRecord('customrecord94',searchMapId);
		var searchId = searchMap.getFieldValue('custrecord_report_searchid');
		var comparisonTitle = searchMap.getFieldValue('name');
		var moreColumns = false;
		if(searchMap.getFieldValue('custrecord_report_morecolumns') == 'T'){ moreColumns = true; }
		var columnText = new Array();
		columnText[0] = eval(searchMap.getFieldValue('custrecord_report_c1_eval'));
		columnText[1] = eval(searchMap.getFieldValue('custrecord_report_c2_eval'));
		columnText[2] = eval(searchMap.getFieldValue('custrecord_report_c3_eval'));
		
		// load report record data
		var reportRecord = nlapiLoadRecord('customrecord72',reportId);
		var reportHeading = 'EBSCO Publishing Gross Sales Report';
		var reportTitle = reportRecord.getFieldValue('name');
		var groupField = reportRecord.getFieldValue('custrecord_report_group_field');
		var groupJoin = reportRecord.getFieldValue('custrecord_report_group_join');
		var rowField = reportRecord.getFieldValue('custrecord_report_row_field');
		var rowJoin = reportRecord.getFieldValue('custrecord_report_row_join');
		var clickReportId = reportRecord.getFieldValue('custrecord_report_detailid');
		
		// specify report filters
		var filters = new Array();
		if(employee)
		{
			// employee filter set.  look up employee and get territory and segments
			// search for all subordinates
			var employeeList = epGetAllSubs(employee);
			employeeList.sort(epSortByEmployeeName);
			
			var employeeTerritory = epGetSalesTerritory(employeeList);
			var employeeSegment = epGetSalesSegment(employeeList);
			
			// filter text output
			//reportFilterText += epWriteLine('p','Employee/Team Filter Set: ' + employeeText,1);
			var buffer = '';
			for (i in employeeList)
			{
				buffer += (employeeList[i].getValue('entityid') + '; ');
			}
			reportFilterText += epWriteLine('h4','Employee/Team Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
			
			if (employeeTerritory)
			{
				var territoryIdArray = new Array();
				buffer = '';
				for(i in employeeTerritory)
				{
					//if( employeeTerritory[i].getValue('internalid','custentity_employee_territory','group') != null)
					//{
						postTerritory += employeeTerritory[i].getValue('internalid','custentity_employee_territory','group') + ',';
						buffer += (employeeTerritory[i].getValue('name','custentity_employee_territory','group') + '; ');
						territoryIdArray.push(employeeTerritory[i].getValue('internalid','custentity_employee_territory','group'));
					//}
				}
				//filters.push(new nlobjSearchFilter('custentity_epterritory','customer','anyof',territoryIdArray));
				filters.push(new nlobjSearchFilter('custcol_allocation_territory',null,'anyof', territoryIdArray)); //look for selected employees territories on records
				reportFilterText += epWriteLine('h4','Employee/Team Territory Filter Set: ',1);
				reportFilterText += epWriteLine('p',buffer,1);
			}
			
			if (employeeSegment)
			{
				var segmentIdArray = new Array();
				buffer = '';
				for(i in employeeSegment)
				{
					//if( employeeSegment[i].getValue('internalid','custentity_employee_segment','group') != null)
					//{
						postSegment += employeeSegment[i].getValue('internalid','custentity_employee_segment','group') + ',';
						buffer += (employeeSegment[i].getValue('name','custentity_employee_segment','group') + '; ');
						segmentIdArray.push(employeeSegment[i].getValue('internalid','custentity_employee_segment','group'));
					//}
				}
				filters.push(new nlobjSearchFilter('custcol_allocation_segment',null,'anyof',segmentIdArray));
				reportFilterText += epWriteLine('h4','Employee/Team Segment Allocation Filter Set:',1);
				reportFilterText += epWriteLine('p',buffer,1);
			}
		}
		
		// other filters
		if(markets)
		{
			// market filter set
			filters.push(new nlobjSearchFilter('custcol_allocation_market',null,'anyof', markets));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',markets);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customrecord89',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postMarket += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Market Allocation Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		if(geomarkets)
		{
			// geomarket filter set
			filters.push(new nlobjSearchFilter('custentity_geomarket','customer','anyof', geomarkets));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',geomarkets);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customrecord81',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postGeomarket += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','GeoMarket Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		
		if(categories)
		{
			// category filter set
			filters.push(new nlobjSearchFilter('custitem_productfamily','item','anyof', categories));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',categories);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customlist10',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postCategory += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Product Offering Category Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		
		
		if(segments)
		{
			// segment filter set
			filters.push(new nlobjSearchFilter('custcol_allocation_segment',null,'anyof', segments));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',segments);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customrecord1',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postSegment += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Segment Allocation Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		if(territories)
		{
			// terriotry filter set
			//filters.push(new nlobjSearchFilter('custentity_epterritory','customer','anyof', territories));
			filters.push(new nlobjSearchFilter('custcol_allocation_territory',null,'anyof', territories));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',territories);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customrecord83',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postTerritory += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Territory Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		if(offerings)
		{
			// offering filter set
			filters.push(new nlobjSearchFilter('item',null,'anyof', offerings));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',offerings);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('item',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postOffering += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Product Offering Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		
		if(countries)
		{
			// country filter set
			filters.push(new nlobjSearchFilter('custentity_epcountry','customer','anyof', countries));
			
			tmpFilters = new Array();
			tmpFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',countries);
			tmpColumns = new Array();
			tmpColumns[0] = new nlobjSearchColumn('name');
			
			tmpSearchResults = nlapiSearchRecord('customrecord80',null,tmpFilters,tmpColumns);
			if (tmpSearchResults)
			{
				buffer = '';
				tmpSearchResults.sort(epSortByRecordName);
				for(i in tmpSearchResults)
				{
					postCountry += tmpSearchResults[i].getId() + ',';
					buffer += tmpSearchResults[i].getValue('name') + '; ';
				}
			
			}
			reportFilterText += epWriteLine('h4','Country Filter Set:',1);
			reportFilterText += epWriteLine('p',buffer,1);
		}
		
		
		// end of filters section
		
		
		// clean up post field data
		postSegment = postSegment.substr(0,postSegment.length-1);
		postTerritory = postTerritory.substr(0,postTerritory.length-1);
		postMarket = postMarket.substr(0,postMarket.length-1);
		postGeomarket = postGeomarket.substr(0,postGeomarket.length-1);
		postCategory = postCategory.substr(0,postCategory.length-1);
		postOffering = postOffering.substr(0,postOffering.length-1);
		postCountry = postCountry.substr(0,postCountry.length-1);
		
	    	// Get system URL
	    	var systemUrl = GetNetSuiteDomain('system');

	    	// create form for posting to be used with click through links
		// form field name attributes follow that of field names in report form UI (using NetSuite custpage convention)
		// field ids follow that of NS internal field names prefixed with "ep_"
		clickForm = '';
		clickForm += '\n\t<form action="'+systemUrl+'/app/site/hosting/scriptlet.nl" method="POST" id="epReportClickForm" style="display:none">';
		clickForm += '\n\t<input type="hidden" name="script" value="16"/><br/>';
		clickForm += '\n\t<input type="hidden" name="deploy" value="1"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_group_type" value="' + reportId + '" id="ep_custpage_group_type"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_comparison_type" value="' + searchMapId + '"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_segment_filter" value="' + postSegment + '" id="ep_custcol_allocation_segment"/><br/>';
		//clickForm += '\n\t<input type="hidden" name="custpage_territory_filter" value="' + postTerritory + '" id="ep_custentity_epterritory"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_territory_filter" value="' + postTerritory + '" id="ep_custcol_allocation_territory"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_market_filter" value="' + postMarket + '" id="ep_custcol_allocation_market"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_geomarket_filter" value="' + postGeomarket + '" id="ep_custentity_geomarket"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_offeringcategory_filter" value="' + postCategory + '" id="ep_custitem_productfamily"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_productoffering_filter" value="' + postOffering + '" id="ep_item"/><br/>';
		clickForm += '\n\t<input type="hidden" name="custpage_country_filter" value="' + postCountry + '" id="ep_custentity_epcountry"/><br/>';
		clickForm += '\n\t</form><br />';
		
		// hmtl header and stylesheet
		reportHeader += epWriteHeader(reportTitle);
		reportHeader += epWriteLine('h1',reportHeading,1);
		reportHeader += epWriteLine('h2',reportTitle,1);
		reportHeader += epWriteLine('h3',comparisonTitle,1);
		reportHeader += '\t<br>\n';
		
		reportHeader += epWriteLine('p','Created: ' + startTime + ' By: ' + userName + ' (' + userEmail + ')',1);
		//reportHeader += '\t<br>\n';
		reportHeader += '\n';
		
		if (reportFilterText != '')
		{
			reportHeader += epWriteLine('p','<a href="#epFilters">Note: Filters applied. See report footer for details.</a>',1);
			reportFilterText = '<a id="epFilters"></a>' + epWriteLine('h3','Filters Applied:',1) + reportFilterText;
		}
		
		// generate report
		reportBody = grossSalesReport(groupField,groupJoin,rowField,rowJoin,searchId,moreColumns,filters,columnText,clickReportId);
		
		reportFilterText = '\n\t<br>\n' + reportFilterText;
		reportFooter += epWriteFooter();
		
		// output HTML
		response.write(reportHeader + reportBody + reportFilterText + clickForm + reportFooter);
		
		
		var stopTime = new Date();
		nlapiLogExecution('AUDIT','Report Executed','Report-' + reportId + '; Comparison-' + searchMapId + '; RunTime-' +((stopTime-startTime)/1000) + '; FilterEmp-' + employee +';');
		
		
		/*  TEMP -- DISABLE EMAIL FEATURE
		if (sendEmail == 'T')
		{
			nlapiSendEmail(userId,userId,'EBSCO Publishing Gross Sales Report',reportHeader + reportBody + reportFilterText + reportFooter,emailAddress,null,null);
		}
		*/
	}
}


function epGetAllSubs(employeeArray, n)
{
	if (!n) { n = 1; }
	if (n <= 10)  // Limit depth of recursion to 10 in case of loop
	{
		var filters = new Array();
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		columns[1] = new nlobjSearchColumn('entityid');
		
		if(typeof employeeArray == 'string' || typeof employeeArray == 'number')
		{
			// on first pass convert string id into a search object
			filters[0] = new nlobjSearchFilter('internalid',null,'anyof',employeeArray);
			employeeArray = nlapiSearchRecord('employee',null,filters,columns);
		}
		
		var idArray = new Array();
		for( var x in employeeArray)
		{
			idArray.push(employeeArray[x].getId());
		}
		filters[0] = new nlobjSearchFilter('supervisor',null,'anyof',idArray);
		filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		filters[2] = new nlobjSearchFilter('salesrep',null,'is','T');
		filters[3] = new nlobjSearchFilter('custentity_report_exclusion',null,'is','F');
		
		var searchResults = nlapiSearchRecord('employee',null,filters,columns);
		
		if(searchResults)
		{
			employeeArray = employeeArray.concat(epGetAllSubs(searchResults,n+1));
		}
	}
	return(employeeArray);
}


function epGetSalesSegment(employeeArray)
{
	var idArray = new Array();
	for( var x in employeeArray)
	{
		idArray.push(employeeArray[x].getId());
	}
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid',null,'anyof',idArray);
	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	filters[2] = new nlobjSearchFilter('salesrep',null,'is','T');
	//filters[3] = new nlobjSearchFilter('custentity_employee_segment',null,'noneof','@NONE@');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid','custentity_employee_segment','group');
	columns[1] = new nlobjSearchColumn('name','custentity_employee_segment','group');
	columns[2] = new nlobjSearchColumn('internalid',null,'count');
	
	var searchResults = nlapiSearchRecord('employee',null,filters,columns);
	searchResults.sort(epSortBySegment);
	
	// check for "none" and pull from array
	// after pull of "none", if array length is zero, set it to null
	var searchResultsFix = new Array();
	for( var y in searchResults)
	{
		if( (searchResults[y].getValue('internalid','custentity_employee_segment','group') != null) && (searchResults[y].getValue('internalid','custentity_employee_segment','group') != '') )
		{
			searchResultsFix.push(searchResults[y]);
		}
	}
	
	if (searchResultsFix.length == 0)
	{
		searchResultsFix = null;
	}
	
	return(searchResultsFix);
}


function epGetSalesTerritory(employeeArray)
{
	
	var idArray = new Array();
	for( var x in employeeArray)
	{
		idArray.push(employeeArray[x].getId());
	}
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid',null,'anyof',idArray);
	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	filters[2] = new nlobjSearchFilter('salesrep',null,'is','T');
	//filters[3] = new nlobjSearchFilter('custentity_employee_territory',null,'noneof','@NONE@');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid','custentity_employee_territory','group');
	columns[1] = new nlobjSearchColumn('name','custentity_employee_territory','group');
	columns[2] = new nlobjSearchColumn('internalid',null,'count');
	
	var searchResults = nlapiSearchRecord('employee',null,filters,columns);
	searchResults.sort(epSortByTerritory);
	
	// check for "none" and pull from array
	// after pull of "none", if array length is zero, set it to null
	var searchResultsFix = new Array();
	
	for(var y in searchResults)
	{
		if( (searchResults[y].getValue('internalid','custentity_employee_territory','group') != null) && (searchResults[y].getValue('internalid','custentity_employee_territory','group') != '') )
		{
			searchResultsFix.push(searchResults[y]);
		}
	}
	if (searchResultsFix.length == 0)
	{
		searchResultsFix = null;
	}
	
	return(searchResultsFix);
}

function epSortByEmployeeName(a, b)
{
	var a1 = a.getValue('entityid');
	var b1 = b.getValue('entityid');
	
	if (a1 < b1)
	{
		return -1;
	}
	else if (a1 > b1)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

function epSortByTerritory(a, b)
{
	var a1 = a.getValue('name','custentity_employee_territory','group');
	var b1 = b.getValue('name','custentity_employee_territory','group');
	
	if (a1 < b1)
	{
		return -1;
	}
	else if (a1 > b1)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

function epSortBySegment(a, b)
{
	var a1 = a.getValue('name','custentity_employee_segment','group');
	var b1 = b.getValue('name','custentity_employee_segment','group');
	
	if (a1 < b1)
	{
		return -1;
	}
	else if (a1 > b1)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

function epSortByRecordName(a, b)
{
	var a1 = a.getValue('name');
	var b1 = b.getValue('name');
	
	if (a1 < b1)
	{
		return -1;
	}
	else if (a1 > b1)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

// Function to disable subordinate lookup
// This function returns a search result object for the supplied user ID
function epGetAllSubsDisabled(userId)
{
	var myFilters = new Array();
	var myColumns = new Array();
	myFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',userId);
	myColumns[0] = new nlobjSearchColumn('internalid');
	myColumns[1] = new nlobjSearchColumn('entityid');
	var searchResults = nlapiSearchRecord('employee',null,myFilters,myColumns);
	return(searchResults);
}


