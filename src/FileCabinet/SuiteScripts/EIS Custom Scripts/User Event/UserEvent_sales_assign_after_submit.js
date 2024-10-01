//	File:  userEvent_sales_assign_after_submit.js
//
//	created by:		eAbramo
//	create date:	12/2019
//
//	Purpose of Script: After committing the SalesAssignment record to the DB, set the isUpdated flag on the associated Employee record
//	Library Scripts used:		None
//
//	Functions:	sales_assign_after_submit
//				
//
//	Amendment Log:
//				03-2020		eAbramo		DE45239	Modified to set the isUpdated flag on the Old Employee if user edits the Sales Assignments and switches the Employee
//
//
//
// **********************************************************************************************************************

function sales_assign_after_submit(type)
{
	// nlapiLogExecution('DEBUG', 'My function launched');
	if (type != 'view' && type != 'delete')
	{
		// get the value of Employee (new value)
		var newEmployee = nlapiGetNewRecord().getFieldValue('custrecord_salesassign_employee');	
		// if not creating new record need to also check old value of employee and determine if the old employee needs isUpdated set
		if (type != 'create')
		{
			var oldEmployee = nlapiGetOldRecord().getFieldValue('custrecord_salesassign_employee');
			// only need to set if the old employee is diff than new employee
			if (oldEmployee != newEmployee)
			{
				nlapiLogExecution('DEBUG', 'About to update isUpdated flag on employee with ID ', oldEmployee);
				nlapiSubmitField('employee', oldEmployee, 'custentity_isupdated', 'T', null);			
			}	
		}		
		// always set isUpdated flag on new Employee
		nlapiLogExecution('DEBUG', 'About to update isUpdated flag on employee with ID ', newEmployee);
		nlapiSubmitField('employee', newEmployee, 'custentity_isupdated', 'T', null);
	}
}