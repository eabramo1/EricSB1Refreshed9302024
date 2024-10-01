/*
    Script: UserEvent_SalesOrder.js

    Created by: EBSCO Information Services

    Function:
    

    Revisions:  
    CNeale	07/16/18	US268765 Remove use of GetNetSuiteDomain() library function as domain not required. 
*/

function serverSalesOrderBeforeLoad(type, form)
{

	if (( type == 'view' || type == 'edit' ) && (nlapiGetContext().getRole() != 1025) && (nlapiGetContext().getUser() != 452592) )
	{	
	// only run if Transaction record isn't Salem Press record -- added 10-07-09
	var cur_record = nlapiGetRecordId();
	var so_department = nlapiLookupField('transaction', cur_record, 'department');
	if (so_department != '50')
		{
			var start0 = new Date();
			var currentRecord = nlapiGetNewRecord();
			var contractNo = nlapiGetFieldValue('custbody_ordernumber');

			var foreignTotal = 0;
			var foreignTotalField = form.addField('custpage_foreigntotal','currency','Non-USD Total',null,'main');


			//NON EP AMOUNT TOTAL: Sum the item level non-ep-amount and display it on the body
			var currentRecord = nlapiGetNewRecord();
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('internalid',null,'anyof',currentRecord.getId());
			filters[1] = new nlobjSearchFilter('mainline',null,'is','F');
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custcol_non_ep_amount', null, 'sum');		
			searchResults = nlapiSearchRecord('transaction', null, filters, columns);
			if(searchResults)
			{
				nlapiSetFieldValue('custbody_non_ep_amount', searchResults[0].getValue('custcol_non_ep_amount', null, 'sum'));
			}

			//GRAND TOTAL: Sum the item totals for all pages (orders) connected to this order and display it on the body
			gt_filters = new Array();
			gt_filters[0] = new nlobjSearchFilter('custbody_ordernumber', null, 'is', contractNo);
			gt_filters[1] = new nlobjSearchFilter('mainline',null,'is','F');
			//gt_filters[2] = new nlobjSearchFilter('item',null,'noneof',specialItems);
			gt_columns = new Array();
			gt_columns[0] = new nlobjSearchColumn('amount', null, 'sum'); 		
			gt_searchResults = nlapiSearchRecord('transaction', null, gt_filters, gt_columns);
			if(gt_searchResults)
			{
				// creating this variable -- this will also be used in Allocation Summary tab
				var grand_total = gt_searchResults[0].getValue('amount', null, 'sum');
				nlapiSetFieldValue('custbody_grand_total', grand_total);
			}		


			// SIBLING SALES ORDER LINKS -- search to get all transactions with this Contract Number

			if( contractNo != '' && contractNo != null )
			{	
				var sibling_filters = new Array();
				// filter based on Contract Number
				sibling_filters[0] = new nlobjSearchFilter('custbody_ordernumber', null, 'is', contractNo);
				// sibling_filters[1] = new nlobjSearchFilter('mainline',null,'is','T');
				// Result is the ID of the Sales Orders and minimum Item on the Sales Order
				var sibling_columns = new Array();
				sibling_columns [0] = new nlobjSearchColumn('internalid', null, 'group');
				sibling_columns [1] = new nlobjSearchColumn('Item', null, 'min');
				// Search Transactions
				var sibling_searchResults = nlapiSearchRecord('transaction', null, sibling_filters, sibling_columns);

				// create variables to create the links to the sibling orders
				var siblinglink = new Array()
				var allSiblings = ''
				for ( var s=0; sibling_searchResults != null && s<sibling_searchResults.length; s++ )
				{
					// get the internal id of the search results
					var siblingId = sibling_searchResults[s].getValue('internalid', null, 'group');
					// get the first 30 characters of the item in the search results
					var sibling_item = sibling_searchResults[s].getValue('Item', null, 'min').substr(0,39);
					var page = s+1;
					// if the ID from the search is the same as the current record ID set the siblinglink to not be a link
					if (siblingId == currentRecord.getId())
					{
						siblinglink[s] = 'Page '+page+': from '+sibling_item+'...<br>';
					}
					else
					{
						// GET RID OF ".sandbox." in URL STRING FOR TESTING
						// US268765 Get rid of the domain in the URL string altogether as not required for the link to work. 
					    siblinglink[s] = '<a href="/app/accounting/transactions/salesord.nl?id='+siblingId+'&submitter=Submit">Page '+page+': from '+sibling_item+'...</a><br>';
					}
					allSiblings = allSiblings + siblinglink[s];
				}
				nlapiSetFieldValue('custbody_sibling_link', allSiblings);	
			}


			// ITEM SUMMARY TAB
			var myTab = form.addTab( 'custpage_itemsummary_tab', 'Item Summary' );
			form.insertTab(myTab,'items');
			//var myField = form.addField('custpage_my_field', 'inlinehtml', 'My Field', null, 'custpage_itemsummary_tab');
			var subList = form.addSubList('custpage_itemsummary_sublist','list','Item Summary','custpage_itemsummary_tab');

			var columns = new Array();
			columns[0] = new nlobjSearchColumn('Item', null, 'group');
			columns[1] = new nlobjSearchColumn('custcol_subscriptionbegindate', null, 'group'); 
			columns[2] = new nlobjSearchColumn('custcol_subscriptionexpiredate', null, 'group');
			columns[3] = new nlobjSearchColumn('custcol_list_rate', null, 'group');
			columns[4] = new nlobjSearchColumn('amount', null, 'sum');
			columns[5] = new nlobjSearchColumn('custcol_foreign_amount', null, 'sum');
			columns[6] = new nlobjSearchColumn('custcol_no_accessing_sites', null, 'group');
			columns[7] = new nlobjSearchColumn('custcol_nl_order_no', null, 'group');					
			columns[8] = new nlobjSearchColumn('custcol_group_affiliation', null, 'group'); 
			columns[9] = new nlobjSearchColumn('custcol_pending_date', null, 'group'); 
			columns[10] = new nlobjSearchColumn('custcol_billingstatus', null, 'group'); 
			columns[11] = new nlobjSearchColumn('custcol_fiscal_date', null, 'group'); 
			columns[12] = new nlobjSearchColumn('custcol_transactioncode', null, 'group'); 
			columns[13] = new nlobjSearchColumn('custcol_databaseplatform', null, 'group');
			columns[14] = new nlobjSearchColumn('custcol_currency_code', null, 'group'); 
			columns[15] = new nlobjSearchColumn('custcol_complimentary', null, 'group'); 		

			var filters = new Array();
			filters[0] = new nlobjSearchFilter('internalid',null,'anyof',currentRecord.getId());
			filters[1] = new nlobjSearchFilter('mainline',null,'is','F');
			var specialItems = new Array();
			for( i = 0; i <= 9; i++) { specialItems[i] = -(i+1); } 
			filters[2] = new nlobjSearchFilter('item',null,'noneof',specialItems);

			searchResults = nlapiSearchRecord('transaction', null, filters, columns);	

			subList.addField('item_group_display','text','item',null);
			subList.addField('custcol_subscriptionbegindate_group','text','Begin Date',null);
			subList.addField('custcol_subscriptionexpiredate_group','text','Expire Date',null);
			subList.addField('custcol_list_rate_group','text','List Rate',null);
			subList.addField('amount_sum','currency','Amount (USD)',null);
			subList.addField('custcol_foreign_amount_sum','currency','Non-USD Amount',null);
			subList.addField('custcol_no_accessing_sites_group','text','# Accessing Sites',null);		
			subList.addField('custcol_nl_order_no_group','text','Div. Order #',null);		
			subList.addField('custcol_group_affiliation_group','text','Bought By/Thru',null);
			subList.addField('custcol_pending_date_group','text','Pending Date',null);
			subList.addField('custcol_billingstatus_group_display','text','Billing Status',null);
			subList.addField('custcol_fiscal_date_group','text','Fiscal Date',null);
			subList.addField('custcol_transactioncode_group_display','text','Transaction Code',null);
			subList.addField('custcol_databaseplatform_group_display','text','Database Platform',null);
			subList.addField('custcol_currency_code_group_display','text','Currency Code',null);
			subList.addField('custcol_complimentary_group','text','Comp.',null);

			var start1 = new Date();
			if(searchResults)
			{
				searchResults.sort(epSortByItem);

				//subList.setLineItemValues(searchResults);


				for (var x=0;x<searchResults.length;x++)
				{
					//nlapiLogExecution('DEBUG','test',searchResults[x].getValue('item_group_display'));
					subList.setLineItemValue('item_group_display',x+1,searchResults[x].getText('item',null,'group'));
					subList.setLineItemValue('custcol_subscriptionbegindate_group',x+1,searchResults[x].getValue('custcol_subscriptionbegindate', null, 'group'));
					subList.setLineItemValue('custcol_subscriptionexpiredate_group',x+1,searchResults[x].getValue('custcol_subscriptionexpiredate', null, 'group'));
					subList.setLineItemValue('custcol_list_rate_group',x+1,searchResults[x].getValue('custcol_list_rate', null, 'group'));
					subList.setLineItemValue('amount_sum',x+1,searchResults[x].getValue('amount', null, 'sum'));
					subList.setLineItemValue('custcol_foreign_amount_sum',x+1,searchResults[x].getValue('custcol_foreign_amount', null, 'sum'));
					subList.setLineItemValue('custcol_no_accessing_sites_group',x+1,searchResults[x].getValue('custcol_no_accessing_sites', null, 'group'));
					subList.setLineItemValue('custcol_nl_order_no_group',x+1,searchResults[x].getValue('custcol_nl_order_no', null, 'group'));					
					subList.setLineItemValue('custcol_group_affiliation_group',x+1,searchResults[x].getText('custcol_group_affiliation',null,'group'));
					subList.setLineItemValue('custcol_pending_date_group',x+1,searchResults[x].getValue('custcol_pending_date', null, 'group'));
					subList.setLineItemValue('custcol_billingstatus_group_display',x+1,searchResults[x].getText('custcol_billingstatus', null, 'group'));
					subList.setLineItemValue('custcol_fiscal_date_group',x+1,searchResults[x].getValue('custcol_fiscal_date', null, 'group'));
					subList.setLineItemValue('custcol_transactioncode_group_display',x+1,searchResults[x].getText('custcol_transactioncode', null, 'group'));				
					subList.setLineItemValue('custcol_databaseplatform_group_display',x+1,searchResults[x].getText('custcol_databaseplatform', null, 'group'));
					subList.setLineItemValue('custcol_currency_code_group_display',x+1,searchResults[x].getText('custcol_currency_code', null, 'group'));			
					if (searchResults[x].getValue('custcol_complimentary', null, 'group') == 'T')
					{
						subList.setLineItemValue('custcol_complimentary_group',x+1,'Yes');
					}
					else
					{
						subList.setLineItemValue('custcol_complimentary_group',x+1,'');
					}


					foreignTotal += Number(searchResults[x].getValue('custcol_foreign_amount', null, 'sum'));

					//if (x % 50 == 0)
					//{
					//	stop = new Date();
					//	nlapiLogExecution('DEBUG','Populate ' + x + ' Rows',(stop-start)/1000);
					//	start = new Date();
					//}


				}

			}
			var stop1 = new Date();

			foreignTotalField.setDefaultValue(foreignTotal);


		//ALLOCATION SUMMARY TAB		
			var allocTab = form.addTab('custpage_allocation_tab', 'Allocation Summary(all pages)' );
			//form.insertTab(allocTab);

			// the following is to build the old sublist

			var allocSubList = form.addSubList('custpage_allocation_sublist','list','Allocation Summary','custpage_allocation_tab');

			filters = new Array();
			filters[0] = new nlobjSearchFilter('custbody_ordernumber', null, 'is', contractNo);
			//filters[0] = new nlobjSearchFilter('internalid',null,'anyof',currentRecord.getId());
			filters[1] = new nlobjSearchFilter('mainline',null,'is','F');
			filters[2] = new nlobjSearchFilter('item',null,'noneof',specialItems);

			columns = new Array();
			columns[0] = new nlobjSearchColumn('custcol_allocation_segment', null, 'group');
			columns[1] = new nlobjSearchColumn('custcol_allocation_territory', null, 'group');
			columns[2] = new nlobjSearchColumn('amount', null, 'sum'); 

			searchResults = nlapiSearchRecord('transaction', null, filters, columns);
			allocSubList.addField('custcol_allocation_segment_group_display','text','Segment',null);
			allocSubList.addField('custcol_allocation_territory_group_display','text', 'Sales Territory', null);			
			allocSubList.addField('custpage_allocation_percent','percent','Allocation Percent',null);
			allocSubList.addField('amount_sum','currency','Amount',null);

			if(searchResults)
			{
				for (x=0;x<searchResults.length;x++)
				{
					allocSubList.setLineItemValue('custcol_allocation_segment_group_display',x+1,searchResults[x].getText('custcol_allocation_segment', null, 'group'));
					allocSubList.setLineItemValue('custcol_allocation_territory_group_display',x+1,searchResults[x].getText('custcol_allocation_territory', null, 'group'));
					allocSubList.setLineItemValue('amount_sum',x+1,searchResults[x].getValue('amount', null, 'sum'));			
					// utilize the field populated above called "Grand Total" (stored in variable called Grand Total)
					// to calculate the segment allocation percentage
					if ((grand_total > 0) && (searchResults[x].getValue('amount', null, 'sum') >=0))
					{
						allocSubList.setLineItemValue('custpage_allocation_percent',x+1,  Math.round( searchResults[x].getValue('amount', null, 'sum')/grand_total*10000)/100);
					}
				}
			}

			stop0 = new Date();
			nlapiLogExecution('DEBUG','Script Time','Sublist: ' + (stop1-start1)/1000 + ' Total:' + (stop0-start0)/1000);
		}
	}
}

function epSortByItem(a, b)
{
	var a1 = a.getText('item',null,'group');
	var b1 = b.getText('item',null,'group');
	//var a1 = a.getText('item',null,'group_display');
	//var b1 = b.getText('item',null,'group_display');
	var a2 = nlapiStringToDate(a.getValue('custcol_fiscal_date',null,'group'));
	var b2 = nlapiStringToDate(b.getValue('custcol_fiscal_date',null,'group'));
	
	if (a1 < b1)
	{
		return -1;
	}
	else if (a1 > b1)
	{
		return 1;
	}
	else if (a2 < b2) // first column is equal, so sort by second
	{
		return -1;
	}
	else if (a2 > b2)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}
