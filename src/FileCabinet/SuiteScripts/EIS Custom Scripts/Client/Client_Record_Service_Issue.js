//05-09-16:  CMM - US113721 (Additions to Service Issue Form) and US112271 (External Service Issue Form - Outside of NetCRM)

/*Global Fields Object*/
var Fields = {
		fldPriority: 'custrecord_sipriority',
		fldSeverity: 'custrecord993',		
		fldTimeSensitivity: 'custrecord_si_time_sensitivity',	
		fldSIBusinessValue: 'custrecord_si_business_value',
		fldPriorityBusVal: 'custrecord_sourced_priority_bus_value',		
		fldSeverityBusVal: 'custrecord_sourced_severity_bus_value',		
		fldTimeSensitivityBusVal: 'custrecord_sourced_time_sens_bus_value',	
		isEmpty: function (fld) {  //returns true if the value of the field passed in is empty
			var currentValue = nlapiGetFieldValue(fld);
			if (currentValue === null || currentValue === undefined)
		        return true;
			currentValue = new String(currentValue);
		    return (currentValue.length == 0) || !/\S/.test(currentValue);
		}
}

// recordid

function si_postSourcing(type, name)
{		
	if(name == Fields.fldPriority || name == Fields.fldSeverity || name == Fields.fldTimeSensitivity)
	{
		update_si_business_value();
	}
}


function update_si_business_value()
{
	if (Fields.isEmpty(Fields.fldPriorityBusVal) || Fields.isEmpty(Fields.fldSeverityBusVal) || Fields.isEmpty(Fields.fldTimeSensitivityBusVal))
	{
		nlapiSetFieldValue(Fields.fldSIBusinessValue, '', true, '');
	}
	else
		{	
			var busValSI = 0;
			var busValP = parseInt(nlapiGetFieldValue(Fields.fldPriorityBusVal));
			var busValS = parseInt(nlapiGetFieldValue(Fields.fldSeverityBusVal));
			var busValT = parseInt(nlapiGetFieldValue(Fields.fldTimeSensitivityBusVal));
			//alert('busValP = ' + busValP + '  ||  busValS = ' + busValS + '  ||  '+'busValT = ' + busValT);
			busValSI = (busValP + busValS) / busValT;
			nlapiSetFieldValue(Fields.fldSIBusinessValue, busValSI, null, true);
		} 
}
