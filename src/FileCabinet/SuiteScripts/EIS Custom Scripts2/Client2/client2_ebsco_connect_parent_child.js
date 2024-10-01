/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*
*   Script:     client2_ebsco_connect_parent_child.js
*   Creator:    ZScannell (US1137504)
*   Revisions:
*   DATE        NAME        US + DESC
*   ------------------------------------------------------------------------
*   2023-08-10  ZScannell   US1137504 Created to support EC Parent Child Relationship Record
*   2023-09-21  ZScannell   TA852205  Handling creation of ECPC Record directly from non-SF Customer
*
* */
define(['N/runtime', 'N/search', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_utility', '/SuiteScripts/EIS Custom Scripts2/Library2/library2_customer'],
    function(runtime, search, constants, utility, customerLib) {

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

            const currentRecord = scriptContext.currentRecord;
            if (scriptContext.mode === 'create') {
                currentRecord.setValue({fieldId: 'custrecord_ec_relationship_type', value: constants.LC2_ParentChildRelationshipType.FOLIO});
            }
            currentRecord.getField({fieldId: 'custrecord_ec_relationship_type'}).isDisabled = true;
            let parent = currentRecord.getValue({fieldId: 'custrecord_ec_parent_customer'});
            let child = currentRecord.getValue({fieldId: 'custrecord_ec_child_customer'});
            let relationshipType = currentRecord.getValue({fieldId: 'custrecord_ec_relationship_type'});
            //  TA852205 - Added in logic to handle the creation directly from a customer record where the Customer doesn't meet criteria
            let valid = isValidParentCustomer(parent, child, relationshipType);
            if(valid !== 'VALID'){
                alert(valid + '\n\nThis customer cannot be set as a Parent Customer. You will be redirected to the Customer\'s page.')
                window.history.back();
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

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
            const currentRec = scriptContext.currentRecord;
            const fieldIdChanged = scriptContext.fieldId;

            switch (fieldIdChanged){
                //  Field Name: Parent Customer
                case 'custrecord_ec_parent_customer': {
                    let parent = currentRec.getValue({fieldId: fieldIdChanged});
                    let child = currentRec.getValue({fieldId: 'custrecord_ec_child_customer'});
                    let relationshipType = currentRec.getValue({fieldId:'custrecord_ec_relationship_type'});
                    let valid = isValidParentCustomer(parent, child, relationshipType);
                    if (valid !== 'VALID') {
                        alert(valid + '\n\nThe "Parent Customer" field has been reset to the original value.');
                        return false;
                    }
                    break;
                }

                //  Field Name: Child Customer
                case 'custrecord_ec_child_customer': {
                    let child = currentRec.getValue({fieldId: fieldIdChanged});
                    let parent = currentRec.getValue({fieldId: 'custrecord_ec_parent_customer'});

                    if (utility.LU2_isEmpty(child) === false) {
                        //  Ensure Parent != Child
                        if (utility.LU2_isEmpty(parent) === false && child === parent) {
                            alert('You cannot select the same Customer for both the "Parent Customer" and the "Child Customer".');
                            return false;
                        }
                        //  Ensure the company is in SF
                        let childSFlookup = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: child,
                            columns: ['custentity_sf_account_id']
                        });
                        let childSFId = childSFlookup.custentity_sf_account_id;
                        if (customerLib.isECCustomer(childSFId) === false) {
                            alert("For a company to be set as the 'Child Customer' it must be in SalesForce.");
                            return false;
                        }

                        //  Ensure Child Customer has only one Parent-Child relationship per Relationship Type
                        let relationshipType = currentRec.getValue({fieldId: 'custrecord_ec_relationship_type'});
                        if (utility.LU2_isEmpty(relationshipType) === false) {
                            let relationshipSearch = search.create({
                                type: 'customrecord_ec_parent_child_rel',
                                filters: [
                                    search.createFilter({
                                        name: 'custrecord_ec_child_customer',
                                        operator: search.Operator.ANYOF,
                                        values: child
                                    }),
                                    search.createFilter({
                                        name: 'custrecord_ec_relationship_type',
                                        operator: search.Operator.ANYOF,
                                        values: relationshipType
                                    })
                                ],
                                columns: ['custrecord_ec_child_customer']
                            }).run().getRange({start: 0, end: 1000});
                            if (relationshipSearch.length > 0) {
                                alert(`This 'Child Customer' already has a EBSCO Connect Parent-Child Relationship with a relationship type of ${currentRec.getText({fieldId: 'custrecord_ec_relationship_type'})}. Only one ` +
                                    `EBSCO Connect Parent-Child Relationship is allowed per Relationship Type.`);
                                return false;
                            }
                        }

                        //  Ensure Child Customer is not a Parent Customer on another EBSCO Connect Parent-Child Relationship record
                        let parentSearch = search.create({
                            type: 'customrecord_ec_parent_child_rel',
                            filters: [
                                search.createFilter({
                                    name: 'custrecord_ec_parent_customer',
                                    operator: search.Operator.ANYOF,
                                    values: child
                                })
                            ],
                            columns: ['custrecord_ec_child_customer']
                        }).run().getRange({start: 0, end: 1000});
                        if (parentSearch.length > 0) {
                            let result = parentSearch[0].getText({name: 'custrecord_ec_child_customer'});
                            alert(`This customer cannot be set as a Child Customer as it is already a Parent Customer for the company ${result} on another EBSCO Connect Parent-Child Relationship record.`);
                            return false;
                        }
                    }
                    break;
                }

                /*//  Field Name: Relationship Type
                case 'custrecord_ec_relationship_type': {
                    //  If choosing Relationship type of FOLIO, ensure Parent Company is FOLIO Partner
                    let newRelationshipType = currentRec.getValue({fieldId: 'custrecord_ec_relationship_type'});
                    let parentPartner = currentRec.getValue({fieldId: 'custrecord_ec_parent_customer'});
                    if (newRelationshipType === '1' && (utility.LU2_isEmpty(parentPartner) !== false)) {
                        if (customerLib.isFolioPartner(parentPartner) === false) {
                            alert('A Relationship Type of "FOLIO" can only be selected when the "Parent Partner" is a FOLIO Partner.');
                            return false;
                        }
                    }
                    break;
                }*/
            }
            return true;
        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            return true;
        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {
            return true
        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {
            return true;
        }

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
            const currentRec = scriptContext.currentRecord;
            let relationship = currentRec.getValue({fieldId: 'custrecord_ec_relationship_type'});
            let childCustomer = currentRec.getValue({fieldId: 'custrecord_ec_child_customer'});
            let parentPartner = currentRec.getValue({fieldId: 'custrecord_ec_parent_customer'});
            if(utility.LU2_isEmpty(parentPartner) === true){
                alert('You must set a Parent Customer on this record before saving.');
                return false;
            }
            if(utility.LU2_isEmpty(childCustomer) === true){
                alert('You must set a Child Customer on this record before saving.');
                return false;
            }
            //  Ensure Parent != Child
            if (childCustomer === parentPartner){
                alert('You cannot have the same company set as the "Parent Customer" and the "Child Customer".');
                return false;
            }
            //  Ensure it's the only record w/ this Relationship Type per child customer
            if (utility.LU2_isEmpty(relationship) === false){
                let relationshipSearch = search.create({
                    type: 'customrecord_ec_parent_child_rel',
                    filters: [
                        search.createFilter({
                            name: 'custrecord_ec_child_customer',
                            operator: search.Operator.ANYOF,
                            values: childCustomer
                        }),
                        search.createFilter({
                            name: 'custrecord_ec_relationship_type',
                            operator: search.Operator.ANYOF,
                            values: relationship
                        }),
                        search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: parseInt(currentRec.id)
                        })
                    ],
                    columns: ['custrecord_ec_child_customer']
                }).run().getRange({start: 0, end: 1000});
                if (relationshipSearch.length > 0){
                    alert(`This 'Child Customer' already has a EBSCO Connect Parent-Child Relationship with a relationship type of ${currentRec.getText({fieldId: 'custrecord_ec_relationship_type'})}. Only one ` +
                        `EBSCO Connect Parent-Child Relationship is allowed per Relationship Type.`);
                    return false;
                }
            }
            //  Ensure Customer is in SF
            //  Ensure the company is in SF
            let companySFlookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: parentPartner,
                columns: ['custentity_sf_account_id']
            });
            let parentSFId = companySFlookup.custentity_sf_account_id;
            if (customerLib.isECCustomer(parentSFId) === false) {
                alert("For a company to be set as the 'Parent Customer' it must be in SalesForce.");
                return false;
            }
            return true;
        }

        function isValidParentCustomer(parent, child, relationshipType){
            if (utility.LU2_isEmpty(parent) === false) {
                //  Ensure Parent != Child
                if (utility.LU2_isEmpty(child) === false && child === parent) {
                    return 'You cannot select the same Customer for both the "Parent Customer" and the "Child Customer".';
                }

                //  Ensure the company is in SF
                let companySFlookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: parent,
                    columns: ['custentity_sf_account_id']
                });
                let parentSFId = companySFlookup.custentity_sf_account_id;
                if (customerLib.isECCustomer(parentSFId) === false) {
                    return "For a company to be set as the 'Parent Customer' it must be in SalesForce.";
                }

                //  Ensure the Parent w/ relationship type "FOLIO" is a FOLIO Partner
                if (relationshipType === constants.LC2_ParentChildRelationshipType.FOLIO && customerLib.isFolioPartner(parent) === false) {
                    return "The 'Relationship Type' field is currently set to 'FOLIO'. In order to set a Parent-Child Relationship with a relationship type of FOLIO " +
                        " the 'Parent Customer' must be a FOLIO Partner.";
                }

                //  Parent Partner CANNOT be a Celigo Consortia Head
                if (customerLib.isCeligoConsortiaHead(parent) === true) {
                    return "This company cannot be selected as a 'Parent Customer' due to the fact that it is an EBSCO Connect Consortia Head.";
                }

                //  Ensure this Parent is not a Child on another EC Parent-Child Relationship record
                let childSearch = search.create({
                    type: 'customrecord_ec_parent_child_rel',
                    filters: [
                        search.createFilter({
                            name: 'custrecord_ec_child_customer',
                            operator: search.Operator.ANYOF,
                            values: parent
                        })
                    ],
                    columns: ['custrecord_ec_parent_customer']
                }).run().getRange({start: 0, end: 1000});
                if (childSearch.length > 0) {
                    let result = childSearch[0].getText({name: 'custrecord_ec_parent_customer'});
                    return `This Customer cannot be set as a Parent Customer as it is a Child Customer to ${result} on another EBSCO Connect Parent-Child Relationship record.`
                }
                return 'VALID';
            }
            else {
                return 'VALID';
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
