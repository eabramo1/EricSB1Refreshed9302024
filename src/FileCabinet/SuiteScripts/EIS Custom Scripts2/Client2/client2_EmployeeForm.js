/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

//----------------------------------------------------------------------------------------------------------------
//Script:		client2_EmployeeForm.js
//Written in SuiteScript 2.0
//
//Created by:	Zachary Scannell 03-2022
//
//Purpose:		Validation for the Employee
//
//
//Library Scripts Used: 	library2_constants
//
//Revisions:  
// 		03-2022		Orig creation of script for refactoring
//      10/18/2023  eAbramo    US1177049 GOBI Case Survey: Add Filter for GOBI Customer Service Cases using Assignee
//
//----------------------------------------------------------------------------------------------------------------

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/runtime', 'N/search', 'N/ui/dialog'],

function(LC2Constant, runtime, search, dialog) {

    function pageInit(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var userObj = runtime.getCurrentUser();
        
        // EA - Is field used still?
        if (userObj.role != '3'){
            currentRec.getField('custentity_allow_rally_sync').isDisabled = true;
        }

    }

    function fieldChanged(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var fieldId = scriptContext.fieldId;
        switch (fieldId){
            case 'custentity_isinactive':
            currentRec.setValue({
                fieldId: 'isinactive',
                value: false,
                ignoreFieldChange: true
            });
            // US1177049 uncheck cases_trigger_gobisurvey
            if(currentRec.getValue({fieldId: 'custentity_isinactive'}) == true){
                checkForUnsetOfCasesTriggerGobiSurvey(currentRec);
        }
            break;

            case 'custentity_eis_separated':
            if (currentRec.getValue({fieldId: 'custentity_eis_separated'}) == true){
                currentRec.setValue({
                    fieldId: 'releaseDate',
                    value: new Date(),
                    ignoreFieldChange: true
                });
                // US1177049 uncheck cases_trigger_gobisurvey
                checkForUnsetOfCasesTriggerGobiSurvey(currentRec);
            }
            else{
                currentRec.setValue({
                    fieldId: 'releaseDate',
                    value: '',
                    ignoreFieldChange: true
                });
            }
                break;

            case 'giveaccess':
            if (currentRec.getValue({fieldId: 'giveaccess'}) == false){
                if(currentRec.getValue({fieldId: 'custentity_has_docusign_license'}) == true){
                    currentRec.setValue({
                        fieldId: 'custentity_has_docusign_license',
                        value: false,
                        ignoreFieldChange: true
                    });
                }
                // US1177049 uncheck cases_trigger_gobisurvey
                checkForUnsetOfCasesTriggerGobiSurvey(currentRec);
            }
                break;

            case 'issupportrep':
                if (currentRec.getValue({fieldId: 'issupportrep'}) == false){
                    checkForUnsetOfCasesTriggerGobiSurvey(currentRec);
                }
                break;
        }
    }

    function saveRecord(scriptContext){
        var currentRec = scriptContext.currentRecord;
        var employeeId = currentRec.id;
        var employeeName = currentRec.getText({fieldId: 'entityid'});
        var markInactive = currentRec.getValue({fieldId: 'custentity_isinactive'});
        var salesRep = currentRec.getValue({fieldId: 'issalesrep'});
        var firstName1 = currentRec.getValue({fieldId: 'firstname'}).toUpperCase();
        var lastName1 = currentRec.getValue({fieldId: 'lastname'}).toUpperCase();
        var empTeam = currentRec.getValue({fieldId: 'custentity_employee_team'});
        var hasLoginAccess = currentRec.getValue({fieldId: 'giveaccess'});  //US1177049 code cleanup moved line up here from lower spot
        var gobiSurveyTrigger = currentRec.getValue({fieldId:'custentity_cases_trigger_gobisurvey'}); //US1177049
        var isSupportRep = currentRec.getValue({fieldId:'issupportrep'});   //US1177049
        var nsInactive = currentRec.getValue({fieldId:'isinactive'});       //US1177049
        var deptId = currentRec.getValue({fieldId: 'department'}); //US1177049 moved this line up

        // Prevent Save if firstName1 is empty
        if ((firstName1 == '')||(firstName1 == null)){
            alert('Please enter a First Name for this Employee.');
            return false;
        }

        // Prevent Save if lastName1 is empty
        if ((lastName1 == '')||(lastName1 == null)){
            alert('Please enter a Last Name for this Employee.');
            return false;
        }

        // 2015-08-24 Last Name needs to be less than 24 characters due to "Login" field in OPS database
        if (lastName1.length > 24){
            alert('Employee Last Name must not exceed 24 characters');
		    return false;
        }

        // Active Sales Rep Validations
        if ((salesRep == true) && (markInactive == false)){
            if ((currentRec.getValue({fieldId: 'custentity_employee_title'}) == '')|| (currentRec.getValue({fieldId: 'custentity_employee_title'}) == null)){
                alert('Sales Representatives need a value for Employee Title, Phone, Team, Office and Supervisor.  Please enter values for each of these fields');
			    return false;
            }

            else if ((currentRec.getValue({fieldId: 'phone'}) == '') || (currentRec.getValue({fieldId: 'phone'}) == null)){
                alert('Sales Representatives need a value for Phone, Team, Office and Supervisor.  Please enter values for each of these fields');
                return false;
            }

            else if ((currentRec.getValue({fieldId: 'custentity_employee_team'}) == '')||(currentRec.getValue({fieldId: 'custentity_employee_team'}) == null)){
                alert('Sales Representatives need a value for Team, Office and Supervisor.  Please enter values for each of these fields');
			    return false;
            }

            else if ((currentRec.getValue({fieldId: 'custentity_employee_office'}) == '')||(currentRec.getValue({fieldId: 'custentity_employee_office'}) == null)){
                alert('Sales Representatives need a value for Office and Supervisor.  Please enter values for each of these fields');
			    return false;
            }

            else if ((currentRec.getValue({fieldId: 'supervisor'}) == '')||(currentRec.getValue({fieldId: 'supervisor'}) == null)){
                alert('Sales Representatives need a Supervisor.  Please go to Human Resources section and add a Supervisor');
			    return false;
            }
        }

        // 2017-07-13 If active Employee with Login Access, the Department field must be an active department value
        // 2022-04-14 ZS - We don't offer inactive departments via drop-down, can we remove this code?
        if (markInactive == false && hasLoginAccess == true){
            var departmentInactive = search.lookupFields({
                type: search.Type.DEPARTMENT,
                id: deptId,
                columns: 'isinactive'
            });
            if (departmentInactive == true){
                alert("This employee's Department has been inactivated and is not valid.  Please select a valid Department.");
			    return false;
            }
        }
		
        // INACTIVE EMPLOYEE
        if (markInactive == true){
            if(employeeId){
                // Call the function hasActiveSalesAssignment (US557792)
                if (hasActiveSalesAssignment(employeeId) == true){
                    alert('Only active Sales Reps should have Assigned Territories and Segments.  You can make the Employee an active Sales Rep or Inactivate/modify the attached Sales Assignment record');
				    return false;
                }
            }
            
            // Prevent Save if employee is the manager of another employee
            var resultsLength_subordinates = search.create({
                type: search.Type.EMPLOYEE,
                filters:[
                    search.createFilter({
                        name: 'supervisor',
                        operator: search.Operator.IS,
                        values: employeeId
                    })
                ],
                columns: [
                    search.createColumn({name: 'internalid', label: 'Internal ID'})
                ]
            }).run().getRange({start: 0, end: 1000}).length;

            if(resultsLength_subordinates > 0){
                alert("Sorry, you can't inactivate an employee who manages other employees.  You will need to change the supervisor on these employee records before inactivating this employee.  The Human Resources tab shows all subordinates under this supervisor");
			    return false;
            }

            // Set the real inactive to false even if the EP one is true
		    // so that OPS can write back to this record
            currentRec.setValue({
                fieldId: 'isinactive',
                value: false,
                ignoreFieldChange: true
            });

            // remove the Sales Rep and Support Rep checkbox, remove the supervisor and remove the team

            currentRec.setValue({
                fieldId: 'issupportrep',
                value: false,
                ignoreFieldChange: true
            });

            currentRec.setValue({
                fieldId: 'issalesrep',
                value: false,
                ignoreFieldChange: true
            });

            currentRec.setValue({
                fieldId: 'custentity_employee_team',
                value: '',
                ignoreFieldChange: true
            });
        }

        // Non-Sales Employee Validation
        if (salesRep == false){
            if (employeeId){
                if (hasActiveSalesAssignment(employeeId) == true){
                    alert('Only active Sales Reps should have Assigned Territories and Segments.  You can make the Employee an active Sales Rep or Inactivate/modify the attached Sales Assignment record');
				    return false;
                }
            }
            if (empTeam != ''){
                alert ('Only active Sales Reps should have a Team.  Please remove the Team or make this Employee an active Sales Rep');
			    return false;
            }
        }

        
        // US785383 Do Not allow Save If User Login Access is unchecked and if 'User Has DocuSign License' is checked
        if (hasLoginAccess == false && currentRec.getValue({fieldId: 'custentity_has_docusign_license'}) == true){
            alert("Only Employees with Login Access should have the 'User Has DocuSign License' checked.  Either uncheck the 'User Has Docusign License' checkbox or ensure this Employee has Login Access");
		    return false
        }

        // US1177049 Validation on "User's Cases can generate GOBI Case Survey" field:
        // User can only check this box and Save if the employee is Active, has login Access, the Support Rep checkbox is checked
        // and Department is one of the various YBP Support Departments.
        if(gobiSurveyTrigger == true){
            var gobiSurveyInvalid = false
            var gobiSurveyInvalidReason = '';
            if(nsInactive == true){
                gobiSurveyInvalid = true;
                gobiSurveyInvalidReason = ', the employee is inactive';
            }
            if(markInactive == true){
                gobiSurveyInvalid = true;
                gobiSurveyInvalidReason = gobiSurveyInvalidReason+', the employee has been marked as inactive';
            }
            if(hasLoginAccess == false){
                gobiSurveyInvalid = true;
                gobiSurveyInvalidReason = gobiSurveyInvalidReason+', the employee does not have login access';
            }
            if(isSupportRep == false){
                gobiSurveyInvalid = true;
                gobiSurveyInvalidReason = gobiSurveyInvalidReason+', the employee is not flagged as a support rep';
            }
            // Department must be YBP/GOBI support
            if(LC2Constant.LC2_Departments.IsDeptYBPSupport(deptId) == false){
                gobiSurveyInvalid = true;
                gobiSurveyInvalidReason = gobiSurveyInvalidReason+', the employee department does not qualify as YBP Support';
            }
            // Alert to end-user
            if(gobiSurveyInvalid == true){
                gobiSurveyInvalidReason = gobiSurveyInvalidReason.substring(2,1000);

                alert('The field \'User\'s Cases can generate GOBI Case Survey\' cannot be true if '+gobiSurveyInvalidReason+'.  Please update the appropriate field(s) to save this record.');
                return false;

                // Zach suggested the following instead...  commenting it out because it has some errors
                /*
                alert.dialog({
                    title: "Validate GOBI Case Survey Eligibility",
                    message: "The field \'User\'s Cases can generate GOBI Case Survey\' cannot be true if '+gobiSurveyInvalidReason+'.  Please update the appropriate field(s) to save this record."
                }).then((result) => {console.log(`Result: ${return false}`)}).catch( (error) => {console.log(`Error: ${return false}`)})
                */
            }
        }

        currentRec.setValue({
            fieldId: 'custentity_isupdated',
            value: true,
            ignoreFieldChange: true
        });

        return true;
    }



    // Create the function hasActiveSalesAssignment 12/4/2019 (US557792)
    function hasActiveSalesAssignment(employee_in){
        var results = search.create({
            type: 'CUSTOMRECORD_SALES_ASSIGNMENT',
            filters:[
                search.createFilter({
                    name: 'custrecord_salesassign_employee',
                    operator: search.Operator.ANYOF,
                    values: employee_in
                }),
                search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: false
                })
            ],
            columns:[
                search.createColumn({name: 'internalid', label: 'Internal ID'})
            ]
        }).run().getRange({start: 0, end: 1000}).length;
        if (results > 0){
            return true;
        }
        else{
            return false;
        }
    }


    // Function checkForUnsetOfCasesTriggerGobiSurvey -- US1177049
    // Descriptions:   This function checks to see if the 'Users Cases can generate GOBI Case Survey' field is populated as true,
    //                and if so it sets the field to false
    //      currentRecIn passed into function
    //      Nothing Returned
    function checkForUnsetOfCasesTriggerGobiSurvey(currentRecIn){
        if(currentRecIn.getValue({fieldId: 'custentity_cases_trigger_gobisurvey'}) == true){
            currentRecIn.setValue({
                fieldId: 'custentity_cases_trigger_gobisurvey',
                value: false,
                ignoreFieldChange: true
            });
        }
    }



    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    };
})