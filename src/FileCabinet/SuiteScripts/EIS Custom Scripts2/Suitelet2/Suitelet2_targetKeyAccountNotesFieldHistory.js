/**
* @NApiVersion 2.0
* @NScriptType Suitelet
* @NModuleScope SameAccount
*/
/*
    Script: UserEvent2_customer_beforeLoad.js

    Created by: NS ACS

    Function: Suitelet that tracks Target/Key Account Notes Field History with customized filters
    
	Library Scripts Used:

    Revisions:
    kbseares	10/21/2019	script created
    fyap 11/15 script revised to use IDs for searches
*/


define(['N/ui/serverWidget', 'N/search','/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants'],

function(ui, search, LC2_constants) {
  
  	var CLIENT_SCRIPT_FILE_ID = 82725111;
  
	function onRequest(context) {
		if (context.request.method == 'GET') {
			
			log.debug('fieldList',LC2_constants.LC2_fieldList);
			var fields = LC2_constants.LC2_fieldList;
			var scriptId = context.request.parameters.script;
			var deploymentId = context.request.parameters.deploy;

			var customerId = context.request.parameters.customerId;
			var field = context.request.parameters.field;
			var dateFrom = context.request.parameters.dateFrom;
			var dateTo = context.request.parameters.dateTo;
			var employeeId = context.request.parameters.employeeId;
			
			//
			var form = ui.createForm({
				title: 'Field System Notes'
			});
			form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;

			var customerField = form.addField({
				id: 'custpage_customer',
				type: ui.FieldType.SELECT,
				label: 'Customer',
				source: 'customer'
			});

			var fieldField = form.addField({
				id: 'custpage_field',
				type: ui.FieldType.SELECT,
				label: 'Field'
			});
			
			fields.forEach(function(entry) {
				if(entry.id == field){
					log.debug('selected field',field);
					fieldField.addSelectOption({
						value: entry.id,
						text: entry.name,
						isSelected: true
					});
				}
				else{
					fieldField.addSelectOption({
						value: entry.id,
						text: entry.name
					});
				}
				
			});


			var dateFromField = form.addField({
				id: 'custpage_date_from',
				type: ui.FieldType.DATE,
				label: 'Date From'
			});
			
			var dateToField = form.addField({
				id: 'custpage_date_to',
				type: ui.FieldType.DATE,
				label: 'Date To'
			});

			var empField = form.addField({
				id: 'custpage_emp',
				type: ui.FieldType.SELECT,
				label: 'Updated By',
				source: 'employee'
			});

			var sysnotes = form.addSublist({
				id: 'custpage_sysnotes',
				type: ui.SublistType.STATICLIST,
				label: 'System Notes'
			});
			
			if (customerId) {
				customerField.defaultValue = customerId;
			}
			if (dateFrom) {
				dateFromField.defaultValue = dateFrom;
			}
			if (dateTo) {
				dateToField.defaultValue = dateTo;
			}
			if (employeeId) {
				empField.defaultValue = employeeId;
			}
						
			

			var filters = [
				search.createFilter({
					name: 'recordtype',
					operator: search.Operator.ANYOF,
					values: -9
				}),
				search.createFilter({
					name: 'recordid',
					operator: search.Operator.EQUALTO,
					values: customerId
				})
			];
			//if(field && field!='- All -' ){
			if(field && field!='' ){
				log.debug('filter field',field);
				var filter = search.createFilter({
					//name: 'formulanumeric',
					name: 'field',
					operator: search.Operator.ANYOF,
					values: [field.toUpperCase()]//,
					//formula: 'CASE WHEN {field}=\''+field.replace("'", "''") + '\' THEN 0 ELSE 1 END'
				});
				filters.push(filter);
				log.debug('filter',filter);
			}else{
				var fieldFilter = new Array()
				fields.forEach(function(entry,index) {
					log.debug('entry.name',entry.name);
					log.debug('entry.id',entry.id);
					log.debug('index',index);
					fieldFilter.push(entry.id.toUpperCase())
				});
				//var fieldFilts = fieldFilter.split(",")
				fieldFilter.splice(0, 1)
                log.debug('fieldFilter',fieldFilter);
				var filter = search.createFilter({
					name: 'field',
					operator: search.Operator.ANYOF,
					values: fieldFilter
				});
				filters.push(filter);
				log.debug('filter',filter);
			}
			/*else{
				
				var formula = 'CASE WHEN ';
				
				fields.forEach(function(entry,index) {
					//log.debug('entry.name',entry.name);
					//log.debug('index',index);
					if(index > 0){
						formula += 'OR '
					}
					formula+= "{field}=" + "'" + String(entry.name).replace("'", "''") + "' ";
					
					
				});
				formula+= ' THEN 0 ELSE 1 END';
				log.debug('formula',formula);
				var filter = search.createFilter({
					name: 'formulanumeric',
					operator: search.Operator.EQUALTO,
					values: 0,
					formula: formula
				});
				filters.push(filter);
				log.debug('filter',filter);
			}*/
			
			if(dateFrom && dateTo){
				var filter = search.createFilter({
					name: 'date',
					operator: search.Operator.WITHIN,
					values: [dateFrom,dateTo]
				});
				filters.push(filter);
				log.debug('filter',filter);
			}
			
			if(employeeId){
				var filter = search.createFilter({
					name: 'name',
					operator: search.Operator.ANYOF,
					values: employeeId
				});
				filters.push(filter);
				log.debug('filter',filter);
			}
			
			
			log.debug("SYS NOTES:", search.Type.SYSTEM_NOTE)
			var systemNotesSearch = search.create({
				type: search.Type.SYSTEM_NOTE,
				columns: [
					search.createColumn({
						name: "name",
						label: "Set by"
					}),
					search.createColumn({
						name: "date",
						label: "Last Updated",
                      	sort: search.Sort.DESC
					}),
					search.createColumn({
						name: "context",
						label: "Context"
					}),
					search.createColumn({
						name: "type",
						label: "Type"
					}),
					search.createColumn({
						name: "field",
						label: "Field"
					}),
					search.createColumn({
						name: "oldvalue",
						label: "Old Value"
					}),
					search.createColumn({
						name: "newvalue",
						label: "New Value"
					}),
				],
				filters: filters
			});

			var result = systemNotesSearch.run();
			var columns = result.columns;
			//log.debug('columns',columns)
			for (var i = 0; i < columns.length; i++) {
				var sysnotesfield = sysnotes.addField({
					id: 'custpage_' + columns[i].name,
					label: columns[i].label,
					type: ui.FieldType.TEXT
				});
				//log.debug('name', columns[i].name);
				//log.debug('label', columns[i].label);
			}
			var searchResultCount = systemNotesSearch.runPaged().count;
			log.debug('searchResultCount', searchResultCount);
			var linenum = 0;
			systemNotesSearch.run().each(function(result) {
				for (var j = 0; j < columns.length; j++) {
					var value = result.getValue({
						name: columns[j].name
					});
                  	var txt = result.getText({
                      name: columns[j].name
                    });
                  	var val = result.getValue({
                      name: columns[j].name
                    });
                    
					if (columns[j].name == 'name' || columns[j].name == 'field' || value == '') {
						var t = result.getText({
							name: columns[j].name
						});
						
						var v = result.getValue({
							name: columns[j].name
						});

						sysnotes.setSublistValue({
							id: 'custpage_' + columns[j].name,
							line: linenum,
							value: t
						});
					}
					else {
						var v = result.getValue({
							name: columns[j].name
						});
						if(v == ''){
							sysnotes.setSublistValue({
								id: 'custpage_' + columns[j].name,
								line: linenum,
								value: ' '
							});
						}
						else{
							sysnotes.setSublistValue({
								id: 'custpage_' + columns[j].name,
								line: linenum,
								value: v
							});
							
						}
						
					}
				}
				linenum++;

				return true;
			});
			
			form.addButton({
				id: 'custpage_search',
				label: 'Search',
				functionName: 'doSearch(' + scriptId + ', ' + deploymentId + ')'
			});
			
			
			context.response.writePage(form);
		}
	}

	return {
		onRequest: onRequest
	};

});