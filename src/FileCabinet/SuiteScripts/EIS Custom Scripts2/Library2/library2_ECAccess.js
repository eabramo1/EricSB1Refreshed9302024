/**
 *  library2_ECAccess.js
 *  @NApiVersion 2.0
 */

/*  Script: library2_ECAccess.js
 *
 *	Created By: Kate McCormack - Nov 2022
 *  Purpose: This is a script file library of commonly used logic pertaining to EBSCO Connect Access functionality
 *  
 *  Functions Added:                    Name:		Date and Description:
 *  CONTACT OBJECT RELATED FUNCTIONS:	KMcCormack	2022-11-15
 *		hasNoOtherNonAcademyECAccess				Determines whether a contact has Academy access approved or granted and no other access approved or granted
 *		hasCoreECAccess                				Determines whether a contact has any Core access approved or granted to it
 *  	hasAdditionalECAccess                       Determines whether a contact has any Property-based access approved or granted to it
 *  	hasECAccessApproveOrRevokeSet		        Determines whether a contact has any access currently set to Approved or Revoked
 *  	hasAnyECAccessChanged						Determines whether a contact has had any access values changed during UI editing
 *  	hasActiveUserRec							Determines whether a contact has an active User record associated with it in Salesforce
 *  	isECPortalMember							Determines whether a contact is, or was, an EBSCO Connect portal user
 *  	eligibleForRevokeCheckbox
 *  	eligibleForResendCheckbox
 *  	eligibleForGrantAllCheckbox
 * 		emailInUseAsECNSVerifiedUser
 * 		emailInUseAsSelfRegisteredUser
 * 		emailAlreadyInUseAsECUser
 * 		hasECAccessDeniedSet		        		Determines whether a contact has Case Mgt or Groups access Denied
 *
 *  CUSTOMER OBJECT RELATED FUNCTIONS:	KMcCormack	2022-11-15
 *     	isFolioCustomer                				Determines whether a Customer qualifies as a FOLIO customer
 *     	isTransitionCustomer						Determines whether a Customer qualifies as a Transition Center customer
 *  
 *  Revisions:
 *  
 *  KMcCormack	11/16/2022	US1031367 TA7769558 Created when UserEvent2-contact-before-submit code was refactored to make it easier to maintain & build upon.
 *  KMcCormack	11/22/2022	US1035778 Changes for allowing selective setting of granular accesses
 *  			12-13-2022  - cont -  	Flag ANY change of access status via UI to be picked up by Boomi for Salesforce notification
 *  									Renamed function name from 'hasECAccessUpdateForSF' to 'hasECAccessApproveOrRevokeSet'
 *  									Add new function 'hasAnyECAccessChanged'
 *  			12-22-2022	- cont - 	Added new hasAcademyOnlyECAccess function
 *  KMcCormack	02/22/2023	US1073168 Review client code email dupe checking --
 * 							TA797214 	When checking to see if an email already exists as an EBSCO Connect user, we must include
 * 										Self-Registered users as well as EC NS Verified users.  So, adding a new function called
 * 										"emailInUseAsSelfRegisteredUser" which looks for Self-Registered Portal users for a given email.
 * 										This new function, along with the existing "emailInUseAsECNSVerifiedUser", will be called by
 * 										a new all-inclusive function called "emailAlreadyInUseAsECUser" which will check for both.
 *  KMcCormack	04/12/2023	US1101144 Defect fix needed the below function to be created --
 * 							TA810792 	New hasECAccessDeniedSet() function: Checks to see if Case Mgt or Groups is Denied
 *  JOliver		5/18/2023	TA816830	Allow Clinical Decisions Support to give CD Portal Access
 *  KMcCormack	05/24/2023	US1113403	Add new property 'ClinicalDecFlag' to L2_CustomerECObj, and new function isClinicalDecCustomer()
 * 										Add new 'EC_ClinicalDecAS' to L2_ContactECObj
 * 							TA816834	Contact with Clinical Decisions EC Access granted is not eligible to have REVOKE ALL set, so
 * 										add 'EC_ClinicalDecAs' check to 'isEligibleForRevokeCheckbox' function
 * 	eAbramo		08/14/2023	US1138811	FOLIO: When a user gives EBSCO Connect case management access to a Contact belonging to a FOLIO Partner parent institution
                                        then I should see an alert reminding me that I need to associate that Contact record with all the FOLIO Partner child Institutions.
 *	eAbramo		04/24/2024	US1259509	Scripting to apply EBSCO Hosted FOLIO Access Status Part 1
 *
 * */

define(['/SuiteScripts/EIS Custom Scripts2/Library2/library2_constants', 'N/search'],
		
function(L2Constants, search) {

	/* ******************************************************************************************************************************** 
	 *  Global Variable holding certain Contact field values that we care about
	 * ****************************************************************************************************************************** */
	 function L2_ContactECObj() {    		 
		 this.EC_CaseMgtAS 				= null;		//	EBSCO Connect Case Mgt Access Status
		 this.EC_DiscGroupsAS			= null;		//	EBSCO Connect Discussion Group Access Status
		 this.EC_AcademyAS				= null;		//	EBSCO Connect Academy Access Status
		 this.EC_ClinicalDecAS			= null;		//	EBSCO Connect Clinical Decisions Access Status (TA816830)
		 this.EC_FolioCustAS			= null;		//	EBSCO Connect FOLIO Access Status
		 this.EC_TransCustAS			= null;		//	EBSCO Connect Transition Access Status
		 this.EC_EnetOrderAS			= null;		//	EBSCO Connect ENET Approver Access Status
		 this.EC_FoHostedByEbscoAS		= null;		//  EBSCO Connect EBSCO Hosted FOLIO Access Status (US1259509)
		 this.EC_PUS					= null;		//	EBSCO Connect Portal User Status
		 this.EBSCONetApproverStatus	= null;		//	EBSCONet Order Approver Status
		 this.EC_SFContactID			= null;		//	SalesForce Contact ID
		 this.Email						= null;		//  Email for this Contact
		 this.InternalId				= null;		//  InternalId for this Contact
		 
		 /* Function	: hasCorECAccess 
	     * Description	: 
	     * Input		:
	     * Returns		: 
	     */
	    this.hasCoreECAccess	= function() {		    	
	    	return (this.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved		|| this.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted ||
	    			this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved	|| this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted ||
	    			this.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Approved		|| this.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Granted) ? true : false;
	    };

	    /* Function	: hasNonAcademyECAccess
	     * Description	: 
	     * Input		:
	     * Returns		: 
	     */
	    this.hasNonAcademyECAccess	= function() {		    	
	    	return (this.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved		|| this.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted 	 ||
	    			this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved	|| this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Granted ||
	/*TA816830*/	this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Granted ||
	    			this.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Approved 	|| this.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Granted  ||
	   				this.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Granted  ||
	/*US1259509*/	this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Approved || 	this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Granted ||
	   				this.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Approved 	|| this.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Granted) ? true:false;

	    };

		 /* Function	: hasAdditionalECAccess
		  * Description	:
		  * Input		:
		  * Returns		:
		  */
		 this.hasAdditionalECAccess = function(){
			 return (this.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Approved || this.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Granted ||
				 	 this.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Approved || this.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Granted ||
				 	 this.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Approved || this.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Granted ||
	 /*US1259509*/	 this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Approved ||  this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Granted ||
	 /*TA816830*/	 this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Approved || this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Granted) ? true:false;
		 };

		 /* Function	: hasECAccessApproveOrRevokeSet
		     * Description	: 
		     * Input		:
		     * Returns		: 
		     */
		 this.hasECAccessApproveOrRevokeSet	= function() {		    	
	    	return (this.EC_CaseMgtAS	 == L2Constants.LC2_SF_EcAccessLevels_sts.Approved	|| this.EC_CaseMgtAS == L2Constants.LC2_SF_EcAccessLevels_sts.Revoked ||
	    			this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Approved	|| this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Revoked ||
	    			this.EC_AcademyAS	 == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Revoked ||
	/*TA816830*/	this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_ClinicalDecAS == L2Constants.LC2_Property_based_Access.Revoked ||
	    			this.EC_FolioCustAS	 == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_FolioCustAS == L2Constants.LC2_Property_based_Access.Revoked ||
	    			this.EC_TransCustAS  == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_TransCustAS == L2Constants.LC2_Property_based_Access.Revoked ||
	/*US1259509*/	this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_FoHostedByEbscoAS == L2Constants.LC2_Property_based_Access.Revoked ||
					this.EC_EnetOrderAS  == L2Constants.LC2_Property_based_Access.Approved	|| this.EC_EnetOrderAS == L2Constants.LC2_Property_based_Access.Revoked ) ? true : false;
		    };

		/* Function	: hasECAccessDeniedSet
        * Description	:
        * Input		:
        * Returns		:
        */
		 this.hasECAccessDeniedSet	= function() {
			 return (this.EC_CaseMgtAS	 == L2Constants.LC2_SF_EcAccessLevels_sts.Denied ||
					 this.EC_DiscGroupsAS == L2Constants.LC2_SF_EcAccessLevels_sts.Denied ) ? true : false;
		 };

	    /* Function	: hasAnyECAccessChanged
	     * Description	: Compares all access status update fields between two objects to see if any values have changed
	     * Input		:
	     * Returns		: 
	     */
	    this.hasAnyECAccessChanged	= function(thatContactObj) {		    	
	    	return (this.EC_CaseMgtAS 	 	!= thatContactObj.EC_CaseMgtAS		||
	    			this.EC_DiscGroupsAS 	!= thatContactObj.EC_DiscGroupsAS 	||
	    			this.EC_AcademyAS		!= thatContactObj.EC_AcademyAS 		||
	/*TA816830*/	this.EC_ClinicalDecAS	!= thatContactObj.EC_ClinicalDecAS 	||
	    			this.EC_FolioCustAS 	!= thatContactObj.EC_FolioCustAS 	||
	    			this.EC_TransCustAS 	!= thatContactObj.EC_TransCustAS 	||
	/*US1259509*/	this.EC_FoHostedByEbscoAS	!= thatContactObj.EC_FoHostedByEbscoAS ||
				this.EC_EnetOrderAS 	!= thatContactObj.EC_EnetOrderAS 	) ? true : false;
	    };
	    
	    /* Function		: hasActiveUserInEC - PUS Based
	     * Description	: 
	     * Input		: 
	     * Returns		: 
	     */
	    this.hasActiveUserRec	= function() {		    	
	    	return (this.EC_PUS != '' && this.EC_PUS != L2Constants.LC2_SF_PortalUser_sts.UserInact && this.EC_PUS != L2Constants.LC2_SF_PortalUser_sts.InvExpir) ? true : false;
	    };
	    
	    /* Function		: isECPortalMember - PUS Based
	     * Description	: 
	     * Input		: 
	     * Returns		: 
	     */
	    this.isECPortalMember 	= function() {		    	
	    	return (this.EC_PUS != '') ? true : false;
	    };

		 /* Function	: eligibleForRevokeCheckbox
          * Description	:
          * Input		:
          * Returns		:
          */
		 this.eligibleForRevokeCheckbox = function(){
			 return (this.EC_AcademyAS == L2Constants.LC2_Property_based_Access.Granted &&
				    this.hasECAccessApproveOrRevokeSet() == false &&
	/*TA816834*/	this.EC_ClinicalDecAS != L2Constants.LC2_Property_based_Access.Granted) ? true : false;
		 };

		 /* Function	: eligibleForResendCheckbox
          * Description	:
          * Input		:
          * Returns		:
          */
		 this.eligibleForResendCheckbox = function(){
			 return (this.hasCoreECAccess() == true && this.hasECAccessApproveOrRevokeSet() == false &&
				 	(this.EC_PUS == L2Constants.LC2_SF_PortalUser_sts.InvInProg || this.EC_PUS == L2Constants.LC2_SF_PortalUser_sts.InvExpir)) ? true : false;
		 };
		 
		 /* Function	: eligibleForGrantAllCheckbox
          * Description	:
          * Input		:
          * Returns		:
          */
		 this.eligibleForGrantAllCheckbox = function(){
			 return (this.EC_AcademyAS != L2Constants.LC2_Property_based_Access.Granted && this.EC_CaseMgtAS != L2Constants.LC2_SF_EcAccessLevels_sts.Granted && 
					 this.EC_DiscGroupsAS != L2Constants.LC2_SF_EcAccessLevels_sts.Granted && this.hasECAccessApproveOrRevokeSet() == false) ? true : false;
		 };
		 
		 /* Function	: emailAlreadyInUseInEC
          * Description	:
          * Input		:
          * Returns		:
          */
		 this.emailAlreadyInUseInEC = function(){
			//alert ('entering emailAlreadyInUseInEC');
            // If no internal ID passed in, set to default value of "1" so that we can still run the search
            if (this.InternalId == '' || this.InternalId == null){
                this.InternalId = '1';
            }
            var dupECEmailFound = false;
            
			//alert ('this.emailInUseAsECNSVerifiedUser() = ' + this.emailInUseAsECNSVerifiedUser());
			if (this.emailInUseAsECNSVerifiedUser() == true) {
				//alert ('setting dupECEmailFound == true;');
				dupECEmailFound = true;
			}
			else if (this.emailInUseAsSelfRegisteredUser() == true) {
				//alert ('setting dupECEmailFound == true;');
				dupECEmailFound = true;
			}

			 //alert ('returning emailAlreadyInUseInEC = ' + dupECEmailFound);
           	 return (dupECEmailFound);
		 };
            
		/* Function	: emailInUseAsECNSVerifiedUser
		 * Description	:
		 * Input		:
		 * Returns		:
		 */
		this.emailInUseAsECNSVerifiedUser = function(){
			//alert ('entering emailInUseAsECNSVerifiedUser');
			// If no internal ID passed in, set to default value of "1" so that we can still run the search
			if (this.InternalId == '' || this.InternalId == null){
				this.InternalId = '1';
			}
			var dupECNSEmailFound = false;

			 //alert('this.InternalId = ' + this.InternalId + '\n' +
			 //	   'this.Email = ' + this.Email);

            if (this.Email.length != 0){
                //  US943087 - Removed qualifying code of "NOT EBSCO email domain"
                var contactSearchResults = search.create({
                    type: search.Type.CONTACT,
                    filters: [
                        search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: [this.InternalId]
                        }),
                        search.createFilter({
                            name: 'formulatext',
                            formula: 'LOWER({email})',
                            operator: search.Operator.IS,
                            values: this.Email
                        }),
                        search.createFilter({
                            name: 'custentity_sf_contact_id',
                            operator: search.Operator.ISNOT,
                            values: ''
                        })
                    ],
                    columns: ['custentity_sf_contact_id']
                }).run().getRange({start: 0, end: 1000});
                if (contactSearchResults.length > 0){
					dupECNSEmailFound = true;
                }
            };
			//alert ('returning emailInUseAsECNSVerifiedUser = ' + dupECNSEmailFound);
			return (dupECNSEmailFound);
		 };

		/* Function	: emailInUseAsSelfRegisteredUser
		* Description	:
		* Input		:
		* Returns		:
		*/
		this.emailInUseAsSelfRegisteredUser = function(){
			//alert ('entering emailInUseAsSelfRegisteredUser');
			// If no internal ID passed in, set to default value of "1" so that we can still run the search
			//if (this.InternalId == '' || this.InternalId == null){
			//	this.InternalId = '1';
			//}
			var dupECSREmailFound = false;

			if (this.Email.length != 0){
				var ecSrpmSearchResults = search.create({
					type: 'customrecord_sr_portal_member',
					filters: [
						search.createFilter({
							name: 'formulatext',
							formula: 'LOWER({custrecord_sr_email})',
							operator: search.Operator.IS,
							values: this.Email
						}),
						search.createFilter({
							name: 'custrecord_srpm_conversion_status',
							operator: search.Operator.NONEOF,
							values: [L2Constants.LC2_SRPM_Conversion_Status.Converted]
						}),
						search.createFilter({
							name: 'isinactive',
							operator: search.Operator.IS,
							values: false
						})
					],
					columns: ['internalid']
				}).run().getRange({start: 0, end: 1000});
				if (ecSrpmSearchResults.length > 0){
					dupECSREmailFound = true;
				}
	 };
			//alert ('returning emailInUseAsSelfRegisteredUser = ' + dupECSREmailFound);
			return (dupECSREmailFound);
		};
	};
		
	/* ******************************************************************************************************************************** 
  	 *  Global Variable holding certain parent Customer field values that we care about
  	 * ****************************************************************************************************************************** */
	 var L2_CustomerECObj = {      	
			 FolioFlag		: null,		//Folio Flag
		 	 ClinicalDecFlag	: null,		//Clinical Decisions Customer Flag - added for US1113403
			 EDSTrans		: null,		//EDS Transition Status
			 EhostTrans		: null,		//eHost Transition Status
			 RefCtrTrans	: null,		//Ref Center Transition Status    			 
			 ExploraTrans	: null,		//Explora Transition Status 
		     FolioPartner		: null, 	// US1138811 FOLIO Partner flag validation
		 	 FoHostedByEBSCO	: null,		// US1259509 EBSCO Hosted FOLIO Access Status

		    /* Function		: isFolioCustomer
		     * Description	: Determines whether role passed in is allowed to invite a Contact to EBSCO Connect
		     * Input		: roleIn = role internal Id
		     * Returns		: true = Invite Contact to EBSCO Connect allowed, false = other
		     */
		    isFolioCustomer: function() {
		    	return (this.FolioFlag);
		    },
		    
		   /* Function		: isClinicalDecCustomer - New function added for US1113403
		 	* Description	: Determines whether role passed in is allowed to invite a Contact to EBSCO Connect
		 	* Input			: roleIn = role internal Id
		 	* Returns		: true = Invite Contact to EBSCO Connect allowed, false = other
			*/
		   isClinicalDecCustomer: function() {
			 	return (this.ClinicalDecFlag);
		   },

		    /* Function		: isTransitionCustomer
		     * Description	: Determines whether role passed in is allowed to invite a Contact to EBSCO Connect
		     * Input		: roleIn = role internal Id
		     * Returns		: true = Invite Contact to EBSCO Connect allowed, false = other
		     */
		    isTransitionCustomer: function() {		    	
		    	return (this.EDSTrans == L2Constants.LC2_Transition_sts.InProg 		|| this.EDSTrans == L2Constants.LC2_Transition_sts.Complete ||
		    			this.EhostTrans == L2Constants.LC2_Transition_sts.InProg 	|| this.EhostTrans == L2Constants.LC2_Transition_sts.Complete ||
		    			this.RefCtrTrans == L2Constants.LC2_Transition_sts.InProg 	|| this.RefCtrTrans == L2Constants.LC2_Transition_sts.Complete ||
		    			this.ExploraTrans == L2Constants.LC2_Transition_sts.InProg 	|| this.ExploraTrans == L2Constants.LC2_Transition_sts.Complete) ? true : false;
		    },

			 /* Function	: isFolioPartner		// New function added for US1138811
			 * Description	: Determines if the Customer is a FOLIO Partner
			 * Input		: N/A
			 * Returns		: true = Customer is a FOLIO Partner, false = Customer Not a FOLIO Partner
			 */
		 	isFolioPartner: function(){
				return (this.FolioPartner);
		    },
		 	// US1259509	Scripting to apply EBSCO Hosted FOLIO Access Status Part 1
		 	isFolioHostedByEBSCO: function() {
				return (this.FoHostedByEBSCO);
			}
  	  };


    return {
    	L2_ContactECObj:	L2_ContactECObj,
    	L2_CustomerECObj:	L2_CustomerECObj
     }
});