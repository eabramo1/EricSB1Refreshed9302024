//
// Script:     library_constants.js  
//
// Created by: Christine Neale, EBSCO
//
// Purpose:    This is a script file library of global constants & related functions that may be referred to in &
//             called from other scripts.
//             Global Constants and related functions should be added here. 
//
//-----------------------------------------------------------------------------------------------------------------------
// Constants:  		Added:	 	Name: 		    Description:									Functions:
// LC_Customers		1/31/18		CNeale			Global Customers Object 						IsCustSSEAnon
//																								IsCustYBPAnon
//																								IsCustEBSCOSFPush
// LC_Employees		1/31/18		CNeale			Global Employees Object 						IsEmpSSDUnassign
// LC_Departments	1/31/18		CNeale			Global Departments Object 						IsDeptDDEGlobalCustSat
//																								IsDeptSSDSupport
//																								IsDeptYBPSupport
// LC_Profiles		1/31/18		CNeale			Global Profiles Object 							IsProfileSSEUK
//																								IsProfileYBPCustSupport
//																								IsProfileDDESupport
// LC_Roles			1/31/18		CNeale			Global Roles Object 							IsRoleSFCustCreateNew
//																								IsRoleSFContactCreateNew
//																								IsRoleSFContactCreateNewOvr
//																								isRoleModifyEC_Contact (Used to be called "IsRoleECContactInvite" prior to Re-Arch of EC)
//																								IsRoleSFContactCreateNewEBSCO // Removed 06-2022
//																								IsRoleENOrdApprovSet
//																								IsRoleENOrdApprovRevoke
// LC_CaseStatus	2/22/18		CNeale			Global Case Status Object						IsCaseStatusClosed
//																								IsCaseStatusEscalated
// LC_CaseOrigin	2/22/18		CNeale			Global Case Origin Object						None
// LC_Form			3/6/18		CNeale			Global Form Object								None
// LC_SF_createNew	12/3/18		CNeale			Global Sales Force Create New constant			None
//
// LC_SvcIssueType 	12/3/18		KMcCormack		Global Service Issue Type Object				IsSFtypeSI
// LC_Default_PST_Timezone 	12/3/18		KMcCormack		Global Constant for PST timezone		None
// LC_SvcIssueSts	12/18/18	CNeale			Global Service Issue Status Object				None
// LC_glblSubsStatus	12/28/18	EAbramo		Global-Global Subscription Status				IsGlobalSubsStatusOptIn
// LC_ContactOrigin		02/06/19	EAbramo		Contact Origin									None
// LC_UnknownUser		02/25/19	CNeale		Global Unknown User Constant value				None
// LC_ContactOpCat		03/14/19	CNeale		Global Contact Ooperational Category Object		None
// LC_orphaned_cust		09/06/19	EAbramo		Internal Id of the Orphan Contact Univ customer	None
// LC_folderId			03/30/2020	AHazen		Global Attachment Folder Object					None
// LC_fileSizeLimit		03/30/2020	AHazen		Global Attachment Filesize limit				None
// LC_recordAttr		03/30/2020	AHazen		Global Record Type Attributes					None
// LC_ContactENOrdApprovSts	04/27/2020	CNeale	Contact EBSCONET Order Approver Status			IsSetAllowed
//																								IsRevokeAllowed
//																								IsInactivateAllowed
//																								IsEmailCustChgAllowed
//	LC_Segment			10/05/2020	JOliver		Global Segment constants						IsGroupSegment
//	LC_isupdated_threshold	10/26/2020	eAbramo													None
//	LC_Saved_search			10/26/2020	eAbramo	For Saved Search search IDs						None
//	LC_Email				10/29/2020	eAbramo	For Email recipient if Scheduled Job fails		None
//  LC_Transition_sts 		03/24/2021	CNeale	Status list used for EDS/eHost/Explora/Ref Center Transitions 	None
//	LC_OppFormType			02/22/2021	eAbramo	OpportunityFormTypeList							None
//	LC_Country				04/02/2021	eAbramo Added for special Country restrictions			isSalesRestricted
//	LC_EpCountry			04/02/2021	eAbramo Added for special Country restrictions			isSalesRestricted
//  LC_SfCaseDelSts			12/06/2021	CNeale	Status of Case wrt SF Deletion					None
//	LC_boomiCustMax			01/06/2022	CNeale	Max. Customers for Boomi Sync					None
//  LC_SfAccessLevel		06/30/2022	eAbramo	Added for US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//	LC_Prop_Based_Access	06/30/2022	eAbramo	Added for US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//  LC_SrpmConversionStatus	06/30/2022	eAbramo	Added for US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//
//------------------------------------------------------------------------------------------------------------------------
// Revisions:
//	1/31/2018	CNeale		US334998 Original version 
//	4/4/2018	CNeale		US326315 Added global Case Status object (LC_CaseStatus) & IsProfileDDESupport 
//							US326315 Added global Case Origin object (LC_CaseOrigin)
//	4/4/2018	CNeale		US326312 Added function IsDeptDDEGlobalCustSat, IsDeptSSDSupport & IsDeptYBPSupport 
//							to LC_Departments Global Object 
//							Added functions IsCustSSEAnon & IsCustYBPAnon to LC_Customers global object. 	
//							Added IsEmpSSDUnassign to LC_Employees global object.
//							Added global Form Object (LC_Form)
//	6/21/2018	CNeale		F24082 Expanded LC_Form values (incl. tasks for Mackie)
//	12/3/2018	CNeale		US402333 Added global Sales Force "Create New" constant (LC_SF_createNew)
//							Added functions IsRoleSFCustCreateNew & IsRoleSFContactCreateNew to LC_Roles global object
//	12-03-2018	KMcCormack	US414244 - Added global Service Issue Type object (LC_SvcIssueType)	
//							Added function IsSFtypeSI to LC_SvcIssueType global object.
//	12-03-2018	KMcCormack	US402324 -Added new constant LC_Default_PST_Timezone for use in date/time manipulation
//	12-03-2018	JOliver		US422401 - Added new LC_CaseOrigin for EBSCO Connect
//	12-03-2018	eAbramo		US452076 - Add two new roles to have ability to select the 'Send To SF' button 
//	12-03-2018  CNeale		Remove those 2 new roles from having the ability to select the "send to SF" button
//	12-18-2018	CNeale		US423877 - Added new LC_SvcIssueSts global object.
//	12-28-2018	EAbramo		US458450 - Added new LC_glblSubsStatus (global subscription status) global object and function for OptIn status
// 	01-15-2019	EAbramo		US463522 - Added WebServicesCase to LC_Form
// 	01-23-2019	EAbramo		US423866 - Added Global Portal User Status Object and function to determine if the portalUserStatusIn allows
//						an authorized user to select the 'Send Invitation Button'
//	02-06-2019	EAbramo		US473423 EBSCO Connect - Contact Origin
//	02-25-2019	CNEale		US442796 - Added new values to LC_Employees & added LC_UnknownUser
// 	02-19-2019	EAbramo		US474842 Added new function EmailChangeNotAllowed to LC_PortalUserStatus
//	03-14-2019	CNeale		US396960 Added new LC_ConatactOpCat & Contact forms to LC_Form.	
//
//  03-12-2019 (ACS) KIlaga US223210 Added role and form definitions for the porject Block the Ability to Flip Case Forms
//	03-20-2019	eAbramo		US481081 - rename function within LC_PortalUserStatus (used to be called EmailChangeRequireWarning is now called validPortalUser)
//										change made to client_contact.js as well
//	05-31-2019  EAbramo		US486003 Onboarding of AP Case Management - added new Anonymous Customer, new Department, new Profile 
//  04-18-2019  PKelleher	US475216 - Marketo: Allow Brianna's new role (EIS Mktg Sales Ops Duplicate Management) to act like a Marketing role on MLO
//  05-07-2019 JOliver		US486011 Added IsSalesCase function to LC_Form (relating to KIlaga's Flip Case Form changes on 3/12/19 (see above)
//  08-22-2019 K McCormack	US419604 - Added Opportunity form type of 'MarketingLead' to LC_Form constants
//  09-02-2019	CNeale		US530556 Adjusted LC_Roles.IsRoleSFCustCreateNew to include EP Support Administrator
//							         Adjusted LC_Roles.IsRoleSFContactCreateNew to LC_Roles.IsRoleSFContactCreateNewOvr 
//                                   & to include EP Support Administrator & EP Support Manager
//	09-06-2019	eAbramo		US487261 Added global variable LC_orphaned_cust
//
//	09-30-2019	CNeale		US547039 Re-introduced LC_Roles.IsRoleSFContactCreateNew to be used to restrict the Contact Push to SF
//                                   button. 
//	10-29-2019	CNeale		US511731 Added LC_Roles.IsRoleECContactInvite to be used to restrict the Contact Send EBSCO Connect Invite
//									 button. Now called "isRoleModifyEC_Contact" for Re-ARch of EC
//	11-13-2019	JOliver		US473352 Added EIS Accounts Payable Role and RoleWithCustPermissions(roleIn) function
//	01-23-2020	CNeale		US589464 Added:
//										LC_Roles.IsRoleSFContactCreateNewEBSCO to allow roles to send/invite EBSCO domain email to SF // Removed 06-2022
//										LC_Customers.EC_EBSCO_EIS constant for ns288673 EBSCO - EIS
//										LC_Customers.IsCustEBSCOSFPush to identify Customers where EBSCO domain emails can be sent to SF
//	03/30/2020	AHazen		Added LC_folderId, LC_fileSizeLimit, LC_recordAttr
//	03-20-2020	JOliver		TA463177 Added ECadminBOT constant to LC_CaseOrigin
//	04-23-2020	eAbramo		US630957 Semi-Automated Ordering added 'EBSCONET Order Approver' to Operational Category
//	04-27-2020	CNeale		US631219 Semi-Automated Ordering added new role functions 'IsRoleENOrdApprovSet' & 'IsRoleENOrdApprovSet' & 
//									 many sales roles to be added & added LC_ContactENOrdApprovSts 
//	06-24-2020	CNeale		Added sales roles and updated roles for IsRoleENOrdApprovSet/Revoke.
//	08-10-2020	CNeale		US672384 Added DS Case form to LC_Form
//	10-05-2020	JOliver		US701852 	Added Segments global constants
//	10-26-2020	eAbramo		US627280 	Added LC_isupdated_threshold (controls the threshold of isUpdated contacts processed in a single scheduled job run
//										Also added LC_Saved_search (stores search ID's used)
//										Also added LC_Email for recipient of Error emails and LC_Employees.MercuryAlerts as sender of error emails
//	10-28-2020	eAbramo		Deploy SAO 'ENET Order Approver Buttons' to Sales Roles
//	11-09-2020	eAbramo		US697502 Implement NetCRM Scheduled Job to find Contact relationship changes - Elim WebService Modifications and handle Merge
//	02-03-2021	JOliver		US738156	Added Job Role library constants
//	03-24-2021	CNeale		US734954	Added LC_Transition_sts - Status list used for EDS/eHost/Explora/Ref Center Transitions
//	02-22-2021	eAbramo		US765127 Script fix for Sales Case Type field.  New values in LC_Form and the IsSalesCase function.   Note also added new constant
//									LC_OppFormType to fix existing code which erroneously called LC_Form when it should have called a different constant
//	03-15-2021  PKelleher	US766484 RFP Opportunity Form - No Bid Status field to update real Status field to Closed-Lost - added objects for Sales Oppy Status values, RFP Status values, and Opportunity Item Status values
//	04/02/2021	eAbramo		US773745 and US773754 Added for special Country restrictions
//	08/03/2021	eAbramo		Added sales roles and updated roles for IsRoleENOrdApprovSet/Revoke
//	08/31/2021	eAbramo		Added SSDAUCustServ role for IsRoleENOrdApprovSet/Revoke function (per Tyler)
//	12/06/2021	CNeale		US868211 Added LC_SfCaseDelSts for EC Case deletion automation
//	01/06/2022	CNeale		US893691 Added LC_boomiCustMax and 2 new saved searches for Unset of "FOLIO Customer" flag
//	2/17/2022	PKelleher	US240546 Clean up code to remove South African Profile references (still needed in Profile list temporarily until cases get deleted) 
//	3/3/2022	PKelleher	OpsGenie Adding additional Int'l Sales roles as EBSCONET approvers
//	3/25/2022	PKelleher	OpsGenie Adding 'EIS Sales � INTERNATIONAL � Inside Sales' role as an EBSCONET approver
//	6/16/2022	JOliver		TA725390 Added Afghanistan to restricted countries under LC_Country and LC_EpCountry
//	6/27/2022	PKelleher	US935721 Adding Yes/No Only field values to accommodate changes re APA Paid Trials on LSD form (sat in SB3 for a few months waiting for go-ahead)
//	6/30/2022	eAbramo		US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
//	01/03/2023	eAbramo		TA784410 Modify NetCRM Code to prevent order creation for Sites in Russia
//  05/08/2023  PKelleher   US1096193 Added new Clinical Decisions Support role
//  05/24/2023  eAbramo     US856610 Added Clinical Decisions Case form to LC_Form - and updated LC_Departments value to Clinical Decisions Support
/*--------------------------------------------------------------------------------------------------------------------------
* Global Customers Object LC_Customers 
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Customers = {
    AnonDDESupport: '277026',		//ns000102 Anonymous Customer (DDE Support)
    AnonContLic: '1711240',			//ns268703 Anonymous Content Licensing Customer
    AnonSSEUK: '1489915',			//ns245028 Anonymous SSE (UK) Customer
    AnonSSEAU: '1503909',			//ns247436 Anonymous Customer (AU SSE Support)
    AnonSSEGerman: '1559097',		//ns255028 Anonymous German SSE Support Customer
    AnonEISProdSys: '461564',		//ns020722 EIS Product Systems Group
    AnonYBPSupport: '1582962',		//ns256597 Anonymous YBP Support Customer
    AnonYBPGOBI: '1627247',			//ns261790 Anonymous YBP GOBI Customer
    AnonYBPLTS: '1638446',			//ns263090 Anonymous YBP LTS
    AnonYBPOMG: '1619682',			//ns260656 Anonymous YBP OMG Customer
    Anon_AP:	'27108605',			//ns289746 EIS Accounts Payable Anonymous Customer
    EC_EBSCO_EIS:	'26951008',		//ns288673 EBSCO - EIS   //US589464 Customer used for internal EBSCO Connect Access
    /*Function   : IsCustSSEAnon(custIn)
     * Description: Determines whether Customer passed in is one of the SSE Support Team's Anonymous Customers
     * Input      : custIn = Customer internal Id
     * Returns    : true = SSE Anonymous Customer or false = other                             */
    IsCustSSEAnon: function (custIn) { 
        return (custIn == this.AnonSSEUK || custIn == this.AnonSSEAU || custIn == this.AnonSSEGerman) ? true : false;
    },
    /*Function   : IsCustYBPAnon(custIn)
     * Description: Determines whether Customer passed in is one of the YBP/GOBI Support Team's Anonymous Customers
     * Input      : custIn = Customer internal Id
     * Returns    : true = YBP/GOBI Anonymous Customer or false = other                             */
    IsCustYBPAnon: function (custIn) { 
        return (custIn == this.AnonYBPSupport || custIn == this.AnonYBPGOBI || custIn == this.AnonYBPLTS ||
        		 custIn == this.AnonYBPOMG) ? true : false;
    },
    /*Function   : IsCustEBSCOSFPush(custIn)     //US589464 Added function
     * Description: Determines whether Customer passed in is one where Contacts with EBSCO domain emails can be sent to SF 
     * 				& invited to EBSCO Connect
     * Input      : custIn = Customer internal Id
     * Returns    : true = EBSCO domain Customer or false = other                             */
    IsCustEBSCOSFPush: function (custIn) { 
        return (custIn == this.EC_EBSCO_EIS) ? true : false;
    }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Employees Object LC_Employees 
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Employees = {
	UnassignedDDETech: '901608',
	UnassignedSSEAUSupport: '1503907',
	UnassignedSSEAUBackOff: '1503908',
	UnassignedSSEUKSupport: '1490556',
	UnassignedSSEUKBackOff: '1491212',
	UnassignedSSEGermany: '1559122',
    UnassignedYBPCS: '1585985',
    UnassignedYBPEC: '1585987',
    UnassignedYBPGOBI: '1630874',
    UnassignedYBPLTSAccounts: '1639084',
    UnassignedYBPLTSInternal: '1639086',
    VertifyUser: '25769860',
    DellBoomiUser: '25769961',
    SystemUser: '25769963',
    MercuryAlerts: '4050413',
    /*Function   : IsEmpSSDUnassign(empIn)
     * Description: Determines whether employee passed in is one of the SSD Unassigned Users
     * Input      : empIn = employee internal Id
     * Returns    : true = SSD Unassigned Employee or false = other                             */
    IsEmpSSDUnassign: function (empIn) { 
        return (empIn == this.UnassignedSSEAUSupport || empIn == this.UnassignedSSEAUBackOff || empIn == this.UnassignedSSEUKSupport ||
        		empIn == this.UnassignedSSEUKBackOff || empIn == this.UnassignedSSEGermany) ? true : false;
    }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Departments Object LC_Departments
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Departments = {
	CorpIT: '88',							//Corp IT
		UserServices: '89',					//User Services
	CRMWebServ: '6',						//CRM Web Services
	EISDDE: '102',							//EIS DDE
		AccOrdMan: '13',					//Accounting & Order Management
		ContLicStratP: '70',				//Content Licensing & Strategic P(lanning)
		ContMngmt: '91',					//Content Management
		CustSat: '1',						//Customer Satisfaction
			CustSucc: '5',					//Customer Success (Training)
            ClinicalDecSupport: '106',		//US856610 used to be EBSCOHealth for "EBSCO Health Global Prof. Svs."
			GlobalCustSupDDE: '2',			//Global Customer Support (DDE)
				FarEastSupDDE: '95',		//Far East Support (DDE)
			GlobalSoftwareServ: '71', 		//Global Software Services
				DiscoverySolnCoord: '78',	//Discovery Solutions Coordinator
			DDEOps: '4',					//Operations
			SaaSOps:'84',					//SaaS Operations 
		TechOther: '39',					//Technology Other
		AccPay:	'112',						//Accounts Payable
	EISHR: '108',							//EIS Human Resources
	EISSSDOps: '103',						//EIS SSD Operations
		BHamAR: '104',						//B'ham Accounts Receivable
		SSDOpsOther: '73',					//Operations Other
		PubServ: '76',						//Publisher Services Worldwide
		SSESupportAUNZ: '86',				//SSE Support - AU/NZ 
		SSESupportGermany: '94',			//SSE Support - Germany
		SSESupportUKSA: '82',				//SSE Support - UK/SA
	OPF: '46',								//Operations & Finance Systems
		CRMSystems: '53',					//CRM Systems
		DevOPF: '46',						//Development - OPS & Finance
	ProdMngmt: '107',						//Product Mngmt/Bussiness Dev
		MedProdMngmt: '52',					//Medical Product Management
		Novelist: '26',						//Novelist
		ProdMngmtOther: '12',				//Product Mngmt Other
		ProdSysGrp: '81',					//Product Systems Group
	Sales: '7',								//Sales Group
		Mktg: '18',							//Marketing
	YBP: '92',								//YBP
    	YBPCustomerService: '97',			//Customer Service - YBP
    	YBPEContent: '96',					//eContent - YBP
        YBPGOBI: '101',						//GOBI - YBP 
        YBPLTS: '105',						//LTS - YBP
        YBPOMG: '100',						//OMG - YBP
        YBPSales: '93',						//Sales - YBP (CDM)
        /*Function   : IsDeptDDEGlobalCustSat(deptIn)
         * Description: Determines whether department passed in is one of the Global Customer Support DDE Departments
         * Input      : deptIn = department internal Id
         * Returns    : true = Global Customer Support DDE Department or false = other                             */
        IsDeptDDEGlobalCustSat: function (deptIn) { 
        	return (deptIn == this.GlobalCustSupDDE || deptIn == this.FarEastSupDDE) ? true : false;
        },
        /*Function   : IsDeptSSDSupport(deptIn)
         * Description: Determines whether department passed in is one of the SSD Customer Support Departments
         * Input      : deptIn = department internal Id
         * Returns    : true = SSD Support Department or false = other                             */
        IsDeptSSDSupport: function (deptIn) { 
        	return (deptIn == this.SSESupportAUNZ || deptIn == this.SSESupportGermany || deptIn == this.SSESupportUKSA) ? true : false;
        },
        /*Function   : IsDeptYBPSupport(deptIn)
         * Description: Determines whether department passed in is one of the YBP Support Departments
         * Input      : deptIn = department internal Id
         * Returns    : true = YBP Support Department or false = other                             */
        IsDeptYBPSupport: function (deptIn) { 
            return (deptIn == this.YBPCustomerService || deptIn == this.YBPEContent || deptIn == this.YBPGOBI ||
            		deptIn == this.YBPLTS || deptIn == this.YBPOMG) ? true : false;
        }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Profiles Object LC_Profiles
* 
* Functions: 	IsProfileSSEUK
* 				IsProfileYBPCustSupport
* 				IsProfileDDESupport
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Profiles = {
    DDESupportDefault: 1,
    DDEKOR: 13,
    DDESimpCHN: 15,
    DDETradCHN: 11,
    DDELatam: 31,	// US684171
    DDEBrazil:	30,	// US684171    
    EISContentLic: 27,
    EISProdMan: 3,
    EISUserServ: 19,
    SSEAU: 9,
    SSEGerman: 16,
    SSEUKEng: 2,
    SSEUKEngSwed: 8,
    SSEUKFin: 5, 
    SSEUKNorw: 6,
    SSEUKSwed: 4,
    SSEUKSwedFin: 7,
    SSEUKAfricaans: 10,
	YBPSupport: 17,
	YBPSupportFR: 26,
	YBPSupportGerman: 22,
	YBPSupportIT: 23,
	YBPSupportITES: 24,
	YBPSupportESPT: 25,
    YBPOMG: 18,
    YBPGOBI: 20,
    YBPLTS: 21,
    AccPay: 28,
    /*Function   : IsProfileSSEUK(profileIn)
    * Description: Determines whether profile passed in is one of the SSE UK profiles
    * Input      : profileIn = profile internal Id
    * Returns    : true = one of SSEUK Profiles or false = other                             */
    IsProfileSSEUK: function (profileIn) { 
    	return (profileIn == this.SSEUKEng || profileIn == this.SSEUKEngSwed || profileIn == this.SSEUKFin ||
    			profileIn == this.SSEUKNorw || profileIn == this.SSEUKSwed || profileIn == this.SSEUKSwedFin) ? true : false;
    },
    /*Function   : IsProfileYBPCustSupport(profileIn)
     * Description: Determines whether profile passed in is one of the YBP Customer Support profiles (but not eContent/OMG/LTS/GOBI)
     * Input      : profileIn = profile internal Id
     * Returns    : true = YBP Customer Support profile or false = other                             */
    IsProfileYBPCustSupport: function (profileIn) { 
        return (profileIn == this.YBPSupport || profileIn == this.YBPSupportFR || profileIn == this.YBPSupportGerman ||
        		profileIn == this.YBPSupportIT || profileIn == this.YBPSupportITES || profileIn == this.YBPSupportESPT) ? true : false;
    },
    /*Function   : IsProfileDDESupport(profileIn)
     * Description: Determines whether profile passed in is one of the DDE Customer Support profiles (but not ContentLic/ProdMan/UserServ)
     * Input      : profileIn = profile internal Id
     * Returns    : true = DDE Support profile or false = other                             */
    IsProfileDDESupport: function (profileIn) { 
        return (profileIn == this.DDESupportDefault || profileIn == this.DDEKOR || profileIn == this.DDESimpCHN ||
        		profileIn == this.DDETradCHN) ? true : false;
    },
    /*Function:		IsProfileDDELatAmBrazilSupport(profileIn)  // US684171
     * Description:	Determines whether profile passed in is DDE Latin American Support or DDE Brazil Support
     * Input:		profileIn = profile internal Id	
     * Returns    : true if DDE Latin American Support or Brazil Support or false if other */
    IsProfileDDELatAmBrazilSupport: function (profileIn) {
    	return (profileIn == this.DDELatam || profileIn == this.DDEBrazil) ? true : false;
    }
};
/*--------------------------------------------------------------------------------------------------------------------------
* Global Roles Object LC_Roles
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Roles = {
	Administrator: '3',				    //Administrator
    CDSupport: '1172',                  //Clinical Decisions Support (added 5/8/23 - US1096193)
	CustomerCenter: '14',				//Customer Center
	WebServ: '1025',					//EP Web Service 
	EPSupAdmin: '1006',					//EP Support Administrator
	EPSupMngr: '1002',					//EP Support Manager 1
	EPSupPers: '1003',					//EP Support Person 1
	SSDAUCustServ: '1085',				//SSD AU Customer Service Officer
	SSESupportGermany: '1108',			//EIS SSE German Support Rep 1
	SSESupportUK: '82',					//EIS SSE UK Support Rep 1
	YBPSupMngr: '1110',					//YBP Support Manager
	YBPSupPers: '1109',					//YBP Support Person
    YBPEContent: '1115',				//YBP eContent
    YBPGOBI: '1121',					//YBP GOBI Support
    YBPLTS: '1123',						//YBP LTS
    YBPOMG: '1120',						//YBP OMG
    EPOrdProc: '1011',					//EP Order Processing 1
    EPCompAnalysisGp: '1056',			//EP Competitive Analysis Group
    EPSalesAdmin: '1007',               //EP - Sales Administrator
    EPAccExecSales: '1005',				//EP - Account Executive Sales
    EPRegSalesMgr: '1020',				//EP - Regional Sales Manager
    EPFieldSalesRep: '1052',			//EP - Field Sales Representative
    EISSalesMedIS: '1124',				//EIS Sales - MEDICAL - Inside Sales
    EISSalesMedMngmt: '1126',			//EIS Sales - MEDICAL - Management
    EISSalesCorpGovIS: '1125',			//EIS Sales - CORP/GOV - Inside Sales
    EISSalesCorpGovMngmt: '1127',		//EIS Sales - CORP/GOV - Management    
    EISSalesAcaIS: '1146',				//EIS Sales - ACADEMIC - Inside Sales
    EISSalesAcaMngmt: '1148',			//EIS Sales - ACADEMIC - Management
    EISSalesK12PLIS: '1147',			//EIS Sales - K12/PL - Inside Sales
    EISSalesK12PLMngmt: '1149',			//EIS Sales - K-12/PL - Management
    EISSalesIntlIS:  '1157',			//EIS Sales - INTERNATIONAL - Inside Sales
	EISSalesRSMField: '1154',			//EIS Sales - RSM/FIELD Sales
    EISMktgMgr: '1008',					//EIS Mktg Manager
    EISMktgAdmin: '1009',				//EIS Mktg Administrator
    EISMktgDataMngmt: '1128',			//EIS Mktg Data Management
    EISMktgSalesOpsDupMngmt: '1129',	//EIS Mktg Sales Ops Duplicate Management
    EISMktgDupMngmtCSVImport: '1130',	//EIS Mktg Duplicate Mngmnt and Contact CSV Import
    MuvDataWebSvc: '1116',				//MuvData Web Service
    EISacctsPayable: '1165',			//EIS Accounts Payable
    EPIntlAccExec:	'1014',				//EP - INTL Account Executive
    EPIntlRSM:	'1037',					//EP - INTL Reg Sales Manager
    EPIntlDir:	'1019',					//EP - INTL Director (Sales)
    EPIntlFSR:	'1058',					//EP - INTL FSR
    EPIntlVpSales:	'1041',				//EP - INTL VP (Sales)
    EISSalesAUIS:	'1112',				//EIS Sales - AU/NZ - Inside Sales
    EISSalesAUField:	'1113',			//EIS Sales - AU/NZ - Field Sales
    EISSalesAUMngmt:	'1114',			//EIS Sales - AU/NZ - Management
    /*Function   : IsRoleSFCustCreateNew(roleIn)
     * Description: Determines whether role passed in is allowed to set "createNew" for Customer sync to Sales Force
     * Input      : roleIn = role internal Id
     * Returns    : true = Customer SF createNew sync allowed or false = other                             */
    IsRoleSFCustCreateNew: function (roleIn) { 
     	return (roleIn == this.Administrator || roleIn == this.EPSupAdmin) ? true : false;   	//US530556 Add EPSupAdmin
     },
     // US963983 and US966153 -- EA: Removed the function IsRoleSFContactCreateNewOvr    
      /*Function   : IsRoleSFContactCreateNew(roleIn)
       * Description: Determines whether role passed in is allowed to set "createNew" for Contact sync to Sales Force
       * Input      : roleIn = role internal Id
       * Returns    : true = Contact SF createNew sync allowed or false = other                             */
      // US547039 - to be used to restrict button when there is no dupe email in NetCRM
      IsRoleSFContactCreateNew: function (roleIn) { 
       	return (roleIn == this.Administrator || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr) ? true : false; 
       },
       /*Function   : isRoleModifyEC_Contact(roleIn)   //US511731 - added function IsRoleECContactInvite (but renamed in EC reArch project)
        * Description: Determines whether role passed in is allowed to Modify User Access/Send Invitation for a Contact already in Salesforce
        * Input      : roleIn = role internal Id
        * Returns    : true = Invite Contact to EBSCO Connect allowed or false = other                             */
       isRoleModifyEC_Contact: function (roleIn) { 
        	return (roleIn == this.Administrator || roleIn == this.EPSupAdmin || roleIn == this.EPSupMngr ||
        			roleIn == this.EPSupPers) ? true : false; 
        },
     // US475216 4/18/19 -- Brianna role update
     /*Function   : IsMktgRole(roleIn)
      * Description: Determines whether role passed in is a Marketing role
      * Input      : roleIn = role internal Id
      * Returns    : true = one of Mktg role or false = other                             */
      IsMktgRole: function (roleIn) { 
      	return (roleIn == this.EISMktgMgr || roleIn == this.EISMktgAdmin || roleIn == this.EISMktgDataMngmt ||
      			roleIn == this.EISMktgSalesOpsDupMngmt || roleIn == this.EISMktgDupMngmtCSVImport) ? true : false;
      },
      // US473352 11/13/19 -- function needed for disallowing prospect/leads on cases
      /*Function   : RoleWithCustPermissions(roleIn)
       * Description: Determines if role has permissions for Customer record
       * Input      : roleIn = role internal Id
       * Returns    : true = Role With Cust Permissions or false = Role without Cust Permissions                            */
       RoleWithCustPermissions: function (roleIn) { 
       	return (roleIn != this.EISacctsPayable) ? true : false;
       },
       // US631219 function needed to check which roles can request set of EBSCONET Order Approver
       /*Function   : IsRoleENOrdApprovSet(roleIn)
        * Description: Determines if role has permission to request set of EBSCONET Order Approver
        * Input      : roleIn = role internal Id
        * Returns    : true = Role With Permission or false = Role without Permission                            */
       IsRoleENOrdApprovSet: function (roleIn) { 
        	return (roleIn == this.Administrator || roleIn == this.EPSalesAdmin || roleIn == this.EPAccExecSales ||
        			roleIn == this.EPRegSalesMgr || roleIn == this.EISSalesMedIS || roleIn == this.EISSalesCorpGovIS ||
        			roleIn == this.EISSalesAcaIS || roleIn == this.EISSalesK12PLIS || roleIn == this.EPFieldSalesRep ||
        			roleIn == this.EISSalesMedMngmt || roleIn == this.EISSalesCorpGovMngmt || roleIn == this.EISSalesAcaMngmt ||
        			roleIn == this.EISSalesK12PLMngmt || roleIn == this.EISSalesRSMField || roleIn == this.EPIntlAccExec || 
        			roleIn == this.EPIntlRSM || roleIn == this.EPIntlDir || roleIn == this.EISSalesAUIS || roleIn == this.EISSalesAUField || 
        			roleIn == this.EISSalesAUMngmt || roleIn == this.SSDAUCustServ || roleIn == this.EPIntlFSR || roleIn == this.EPIntlVpSales || roleIn == this.EISSalesIntlIS) ? true : false;
        },
        // US631219 function needed to check which roles can revoke EBSCONET Order Approver
        /*Function   : IsRoleENOrdApprovRevoke(roleIn)
         * Description: Determines if role has permission to request revoke of EBSCONET Order Approver
         * Input      : roleIn = role internal Id
         * Returns    : true = Role With Permission or false = Role without Permission                            */
        IsRoleENOrdApprovRevoke: function (roleIn) { 
         	return (roleIn == this.Administrator || roleIn == this.EPSalesAdmin || roleIn == this.EPAccExecSales ||
        			roleIn == this.EPRegSalesMgr || roleIn == this.EISSalesMedIS || roleIn == this.EISSalesCorpGovIS ||
        			roleIn == this.EISSalesAcaIS || roleIn == this.EISSalesK12PLIS || roleIn == this.EPFieldSalesRep ||
        			roleIn == this.EISSalesMedMngmt || roleIn == this.EISSalesCorpGovMngmt || roleIn == this.EISSalesAcaMngmt ||
        			roleIn == this.EISSalesK12PLMngmt || roleIn == this.EISSalesRSMField || roleIn == this.EPIntlAccExec || 
        			roleIn == this.EPIntlRSM || roleIn == this.EPIntlDir || roleIn == this.EISSalesAUIS || roleIn == this.EISSalesAUField || 
        			roleIn == this.EISSalesAUMngmt || roleIn == this.SSDAUCustServ || roleIn == this.EPIntlFSR || roleIn == this.EPIntlVpSales) ? true : false;
         }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Segment Object LC_Segment
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Segment = {
	OneTwoYr: '22',	//1-2 Year
    FourYr:	'14',	//4 Year
    AmerEmbassy: '41',	//AMERICAN EMBASSY (US/CA)
    AssnBiomed: '47',	//ASSOCIATIONS - BIOMEDICAL
    AssnCorp: '46', 	//ASSOCIATIONS - CORPORATE
    CaFedGvt: '11',		//CANADIAN FEDERAL GOVERNMENT
    CaProvGvt:	'12',	//CANADIAN PROVINCIAL GOVERNMENT
    CatholicHS:	'13',	//CATHOLIC HIGH SCHOOL
    Corporate:	'10',	//CORPORATE
    CorpOther:	'51',	//CORPORATE - OTHER
    CorpHosp:	'44',	//CORPORATE HOSPITALS
    Distributor:	'15',	//DISTRIBUTOR
    Personnel:	'16',	//EBSCO Personnel-non client
    ElemSch:	'17',	//ELEMENTARY
    EPgift:	'67',	//EP Gift
    Military:	'58',	//FEDERAL GOVERNMENT - MILITARY (US/CA)
    GroupAcad:	'59',	//GROUP-ACADEMIC
    GroupGovt:	'62',	//GROUP-GOVERNMENT
    GroupMed:	'63',	//GROUP-MEDICAL
    GroupPL:	'61',	//GROUP-PUBLIC LIBRARY
    GroupSch:	'60',	//GROUP-SCHOOL
    HighSch:	'20',	//HIGH SCHOOL
    Individual:	'42',	//INDIVIDUAL
    IntlSch:	'21',	//INTERNATIONAL SCHOOL
    IntlFedGovt:	'38',	//INTL FEDERAL GOVERNMENT
    IntlStateGovt:	'39',	//INTL STATE GOVERNMENT
    MedColl:	'23',	//MEDICAL COLLEGES
    MedCorp:	'49',	//MEDICAL CORPORATE
    MedSrvs:	'64',	//MEDICAL SERVICES
    MedHosp:	'24',	//MEDICAL/HOSPITAL
    MiddleSch:	'25',	//MIDDLE/JR HIGH SCHOOL
    MilitaryMed:	'68',	//MILITARY MEDICAL (US/CA)
    MilitarySrvs:	'26',	//MILITARY SERVICE (US/CA)
    Misc:	'27',	//MISCELLANEOUS - NON CLIENT
    PrivateHS:	'29',	//PRIVATE HIGH SCHOOL
    PublicLib:	'30',	//PUBLIC LIBRARY
    Publisher:	'31',	//PUBLISHER
    SchDist:	'32',	//SCHOOL DISTRICT
    SchUnclassified:	'57',	//SCHOOL UNCLASSIFIED
    Specialty:	'70',	//SPECIALTY
    StateGovtCorp:	'65',	//STATE GOVERNMENT CORP (US/CA)
    SubsAgency:	'34',	//SUBSCRIPTION AGENCY
    UsFedGovt:	'18',	//US FEDERAL GOVERNMENT
    UsStateGovt:	'33',	//US STATE GOVERNMENT
    VetAdminHosp:	'36',	//VETERAN ADMINISTRATION HOSPITALS
    VocTechSch:	'37',	//VOC/TECH SCHOOL

	/*Function   : IsGroupSegment(segmentIn)
     * Description: Determines whether Segment passed in is one of the "Group" segments
     * Input      : segmentIn = Segment Internal ID
     * Returns    : true = is Group Segment or false = is not Group Segment                             */
    IsGroupSegment: function (segmentIn) { 
        return (segmentIn == this.GroupAcad || 
        		segmentIn == this.GroupGovt || 
        		segmentIn == this.GroupMed || 
        		segmentIn == this.GroupPL || 
        		segmentIn == this.GroupSch)? true : false;
    }
};
/*--------------------------------------------------------------------------------------------------------------------------
* Global Case Status Object LC_CaseStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_CaseStatus = {
    NotStarted: '1',				//Not Started
    InProgress: '2',				//In Progress
    Escalated: '3',					//Escalated
    ReOpened: '4',					//Re-opened
    Closed: '5',					//Closed
    AwaitReply: '6',				//Awaiting Reply
    ClosedDupe: '7',		   		//Closed - Duplicate/No Action
    OnHold: '8',					//On Hold 
    ToReview: '9',					//To Review
    ClosedUnresp: '11',				//Closed - Unresponsive
	/*Function   : IsCaseStatusClosed(statusIn)
     * Description: Determines whether Case Status passed in is one of the "Closed" statuses
     * Input      : statusIn = Case status Internal ID
     * Returns    : true = Closed or false = not closed                             */
    IsCaseStatusClosed: function (statusIn) { 
        return (statusIn == this.Closed || statusIn == this.ClosedDupe || statusIn == this.ClosedUnresp)? true : false;
    },
	/*Function   : IsCaseStatusEscalated(statusIn)
	 * Description: Determines whether Case Status passed in is an Escalated status
	 * Input      : statusIn = Case status Internal ID
	 * Returns    : true = Escalated or false = not escalated                             */
	IsCaseStatusEscalated: function (statusIn) { 
	    return statusIn == this.Escalated ? true : false;
	}	
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Opportunity Status Object LC_OppyStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_OppyStatus = {
	    QualifyCA: '7',				//1-Qualify/Collection Analysis
	    Proposal: '10',				//3-Proposal
	    Renewal: '15',				//4-Renewal
	    Develop: '18',				//2-Develop
	    ClosedLost: '22',			//7-Closed - Lost
	    GenOnlineLeads: '24',		//General Online Leads
	    VerbalAgmt: '25',		   	//5-Verbal Agreement
	    ClosedWon: '26'				//6-Closed - Won
}
    
/*--------------------------------------------------------------------------------------------------------------------------
* Global RFP Status Object LC_RFPStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_RFPStatus = {
    	InProgress: '1',			//RFP in Progress
    	DecisionPending: '2',		//Decision Pending
    	Won: '3',					//Won
    	Lost: '4',					//Lost
    	NoAward: '6',				//No award made as a result of this effort
    	NoBid: '7',					//No Bid
    	WonPartial: '8'			   	//Won Partial
    }
        
/*--------------------------------------------------------------------------------------------------------------------------
* Global Opportunity Item Status Object LC_OppyItemStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_OppyItemStatus = {
        Mktg: '1',			//01-Mktg - MLO header, matches to 1-Qualify/Collection Analysis 
        Dev: '2',			//02-Dvlp - MLO header, matches to 2-Develop
        Quote: '3',			//03-Qte - MLO header, matches to 3-Proposal
        Renewal: '4',		//04-Renewal - MLO header, matches to 4-Renewal
        PofVrb: '5',		//06-POF/VRB  - MLO header, matches to 5-Verbal Agreement
        Lost: '6',			//10-Lost - MLO header, matches to 7-Closed - Lost
        Won: '7',		   	//09-Won - MLO header, matches to 6-Closed - Won
        NoVolNoBid: '8',	//00-No volume/No Bid - MLO header, does not match to anything
        POFIn: '9',		   	//08-PLFln - MLO header, matches to 5-Verbal Agreement
        Ngtn: '10',		   	//04-Ngtn - MLO header, matches to 3-Proposal
        POFOut: '11'		//07-POFOut - MLO header, matches to 5-Verbal Agreement
    } 

        
/*--------------------------------------------------------------------------------------------------------------------------
* Global Case Origin Object LC_CaseOrigin
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_CaseOrigin = {
    Web: '-5',			//Web
    Email: '1',			//Email	
    Phone: '2',			//Phone
    Internal: '4',		//Internal	
    IntSysAnlyst: '5',	//Internal System Analyst Form
    CasePortal: '6',		//Case Portal
    EBSCOconnect: '7',			//EBSCO Connect
    ECadminBOT: '8'		//ECadminBOT (TA463177)
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Form Object LC_Form
* -- forms should be added as required 
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Form = {
	//Case Forms 
	SalesGen		:  	'67',		//EIS Sales General Case Form
	SalesTitleComp	:	'73',		//EIS Sales Title Comparison Case Form
	UserServ		:	'82',		//EIS User Services Case Form (F24082)
	ContLic			:	'105',		//Content Licensing Case Form (F24082)
    CustSatMerged	: 	'147',		//EBSCO CustSat Merged Case Form
    DSCase			:	'96',		//DS Case Form    
    YBPMerged		:	'195',		//YBP CS/EC/GOBI/LTS Case Form (F24082)
    YBPOMG			:	'201',		//YBP OMG Case Form (F24082)
    GobiEBA			:	'302',		//GOBI EBA Case Form (F24082) 
    LSDPricing      :   '74',       //EIS Sales LSD Pricing Case Form
    EbookCustom     :   '91',       //EIS Sales eBook/aBook Custom Collection
    EbookGeneral    :   '98',       //EIS Sales eBook/aBook General Case Form
    SalesLearning   :   '189',      //EIS Sales Learning Express Case Form
    DSC_Case		:	'95',		//DS Coordinator Case Form
    WebServicesCase	:	'83', 		//EP WebServices Case Form
    OPGen			:	'100',		//OP General Case Form
    OPAdjCanMid		:	'101',		//OP Adj./Canc./MidTermUpgrade Case
    AcctsPay		:	'317',		//EIS Accounts Payable Case Form
    sRWA			:	'320',		//EIS Sales Research Workflow and Archiving Case
    sFolio			:	'321',		//EIS Sales FOLIO Pricing Case Form
    sPanorama		:	'327',		//EIS Sales Panorama Pricing Case Form
    clinicalDecCase :   '335',      //Clinical Decisions Case form // added for US856610
    //Task Forms
    EPCustomTask	:	'14',		//EP Custom Task Form
    CustTrainReqTask	:	'68',		//EP Customer Training Request Form
    WebTask			:	'75',		//EP Task Form (Web Services)
    TrainReportTask	:	'99',		//EP Training Report
    //Contact Forms
    EisContact		:	'5',		//EIS Contact Form
    PubSatContact	:	'106',		//EIS PubSat Contact Form
    WebContact		:	'53',		//EIS Contact Form (WebServices)
    //Customer Forms
    EisCustomer		:	'4',		//EIS Customer Form
    LeadProsp		:	'208',		//EIS Lead/Prospect Form
    
    IsSalesCase: function (customForm) { 
        return (customForm == this.SalesGen || customForm == this.SalesTitleComp || customForm == this.LSDPricing || 
				customForm == this.EbookCustom || customForm == this.EbookGeneral || customForm == this.SalesLearning ||
				customForm == this.sRWA || customForm == this.sFolio || customForm == this.sPanorama)? true : false;
    }
    	
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Sales Force "Create New" constant (LC_SF_createNew)
* -- this variable holds "createNew" constant for use with sync to Sales Force  
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_SF_createNew = 'createNew';

/*--------------------------------------------------------------------------------------------------------------------------
* Global Service Issue Type Object LC_SvcIssueType
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_SvcIssueType = {
    SvcAvailPerformance:'2',	//Service Availability & Performance Defect
    SoftwareEnhancement:'4',	//Software Enhancement
    Duplicate:			'5',	//Duplicate
    Inquire:			'6',	//Inquiry
    SaaSQA:				'8',	//SaaS QA
    ContentChgRequest:	'9',	//Content Change Request
    SoftwareDefect:		'11',	//Software Defect
    NoError:			'12',	//No Error
    Documentation:		'14',	//Documentation
    ContentProblemRpt: 	'15',	//Content Problem Report
    PostRelIR:			'16',	//Post Release - IR
    OperationalReqest:	'23',	//Operational Request
    AddNewContentPkg:	'25',	//Add New Content Package
    /*Function   	: IsSFtypeSI(siTypeIn)
     * Description	: Determines whether SI type passed in is one of the ones that should be sent to SF for the CXP Portal
     * Input     	: siTypeIn = Service Issue Type internal id
     * Returns  	: true = type is one that SalesForce wants or false = not a SF type                              */
     IsSFtypeSI: function (siTypeIn) { 
     	return (siTypeIn == this.SoftwareDefect || 
     			siTypeIn == this.SvcAvailPerformance ||
     			siTypeIn == this.ContentProblemRpt) ? true : false;
     }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Service Issue Status Object LC_SvcIssueSts
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_SvcIssueSts = {
    NotStarted:			'2',	//Not Started
    InfoNeeded:			'4',	//Information Needed
    Deferred:			'5',	//Deferred
    Resolved:			'7',	//Resolved
    InProgress:			'8',	//In Progress
    Scheduled:			'9',	//Scheduled
    Unresolved:			'11',	//Closed Unresolved
    Triage: 			'13',	//Assigned to Triage
    PMReview:			'14'	//PM Review
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Default NetSuite Datetime Server Timezone (which is PST)
* -- this variable holds "America/Los_Angeles" constant for use as the PST Timezone for datetime manipulations
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Default_PST_Timezone = 'America/Los_Angeles';


/*--------------------------------------------------------------------------------------------------------------------------
* Global Global Subscription Status Object LC_glblSubsStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_glblSubsStatus = {
	SoftOptIn:			'1',
	SoftOptOut:			'2',
	ConfirmedOptIn:		'3',
	ConfirmedOptOut:	'4',
	/*
	 * Function		:	IsGlobalSubsStatusOptIn(glblSubsStatusIn)
	 * Description	:	Determines whether the Global Subscription Status passed in - is an OptIn
	 * Input		:	glblSubsStatusIn (Global Subscription Status Internal ID)
	 * Returns		:	true = the GSS is an 'Opt In' -or-  false = not an 'Opt In'
	*/
	IsGlobalSubsStatusOptIn: function(glblSubsStatusIn) {
		return (glblSubsStatusIn == this.SoftOptIn ||
				glblSubsStatusIn == this.ConfirmedOptIn 
				) ? true : false;
	}
}

/*--------------------------------------------------------------------------------------------------------------------------
* Global Portal User Status Object LC_PortalUserStatus
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_PortalUserStatus = {
	SendInvitation:				'1',	 
	InvitationInProgress:		'2',	 
	InvitationExpired:			'3', 
	UserActive:					'4',	 
	UserInactive:				'5',
	RegistrationInProgress:		'8',
	/*
	 * Function		:	SendInvitationAllowed(portalUserStatusIn)
	 * Description	:	Determines if the portalUserStatusIn passed in allows an authorized user to select the 'Send Invitation Button'
	 * Input		:	portalUserStatusIn (CXP Portal User Status Internal ID)
	 * Returns		:	true, Portal User Status allows 'Send Invitation' -or-  false, Portal User Status should NOT allow 'Send Invitation'
	*/
	// US943086 ReArchitect EBSCO Connect invite process.  removing SendInvitationAllowed: function
	// US963983 & US966153 -- Removed function validPortalUser.  Replaced by L_hasECPortalAccess	
}

/*--------------------------------------------------------------------------------------------------------------------------
* Global Contact Origin Object LC_ContactOrigin
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_ContactOrigin = {
	    	WebForm:		'1',	// Web Form
	    	Email:			'2',	// Email
	    	Phone:			'3',	// Phone
	    	InPersonEvent:	'4',	// In Person Event
	    	LinkedIn:		'5',	// LinkedIn
	    	Other:			'6',	// Other
	    	WebPage:		'7',	// Web Page
	    	Acquisition:	'8',	// Acquisition	 
	    	EBSCOConnect:	'9'		// EBSCO Connect
	};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Job Role Object LC_JobRole
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_JobRole = {
			SysTech:		'4',	//Systems/Technology
			HR:				'6',	//Human Resources
			Other:			'92'	// Other
	};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Contact Operational Category Object LC_ContactOpCat
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_ContactOpCat = {
	    	ECM:			'1',	// ECM Contact
	    	Marc:			'5',	// Marc Contact
	    	WOLCE:			'9',	// WOLCE Contact
	    	FlipRenew:		'11',	// Flipster Renewal Contact
	    	MISBO:			'26',	// MISBO Contact
	    	Advisory:		'6',	// Advisory Board Member
	    	EnetApprover:	'29'	// EBSCONET Order Approver
	};


/*--------------------------------------------------------------------------------------------------------------------------
* Global Unknown User Constant value
* -- this variable holds -4 which is returned if NetSuite is unable to identify the current user.
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_UnknownUser = '-4';


/*--------------------------------------------------------------------------------------------------------------------------
* Global Constant for the Orphaned Contact University Customer
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_orphaned_cust = '907124';

/*--------------------------------------------------------------------------------------------------------------------------
* Global Constants for File Uploads
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_fileSizeLimit = 5000000; // 5MB

var LC_folderId = {
	si: '89670747', 
	cases: '89670748' 
//  On First implementation & until SB refreshes need to update here		
//	si: '79935341', //sb1
// 	cases: '79935342' //sb1
//	si: '86184173', //sb2
//	cases: '86184174' //sb2
//	si: '80582592', //sb3
//	cases: '80582593' //sb3
//	si: '89670747', //live
//	cases: '89670748' //live
};

var LC_recordAttr = {
  customrecord36: {
    label:'Service Issue',
    folderid: LC_folderId.si
  },
  supportcase: {
    label:'Case',
  	folderid: LC_folderId.cases
       }
};

/*--------------------------------------------------------------------------------------------------------------------------
* Global Constant for Contact EBSCONET Order Approver Status (US631219)
*
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_ContactENOrdApprovSts = {
    Approved: '1',					//Approved
    InProgress: '2',				//In Progress
    Revoked: '3',					//Revoked
    CallFail: '4',					//Call Failure
    Requested: '5',					//Requested
    RevokeInProg: '6',		   		//Revoke In Progress
    RevokeReq: '7',					//Revoke Requested
	/*Function   : IsSetAllowed(statusIn)
     * Description: Determines whether existing EBSCONET Order Approver Status allows new request to Set 
     * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
     * Returns    : true = OK to Set or false = not Allowed                             */
    IsSetAllowed: function (statusIn) { 
        return (statusIn == this.Revoked || statusIn == this.CallFail || !statusIn)? true : false;
    },
	/*Function   : IsRevokeAllowed(statusIn)
     * Description: Determines whether existing EBSCONET Order Approver Status allows request to Revoke 
     * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
     * Returns    : true = OK to Revoke or false = not Allowed                             */
    IsRevokeAllowed: function (statusIn) { 
        return (statusIn == this.Approved)? true : false;
    },
    /*Function   : IsInactivateAllowed(statusIn)
     * Description: Determines whether Contact Inactivation allowed for existing EBSCONET Order Approver Status 
     * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
     * Returns    : true = Allowed or false = Not Allowed                             */
    IsInactivateAllowed: function (statusIn) { 
        return (statusIn == this.Revoked || statusIn == this.CallFail || statusIn == this.Requested || statusIn == this.RevokeInProg || !statusIn)? true : false;
    },
    /*Function   : IsEmailCustChgAllowed(statusIn)
     * Description: Determines whether Email or Customer change allowed for existing EBSCONET Order Approver Status 
     * Input      : statusIn = Contact EBSCONET Order Approver Status Internal ID or '' if not set
     * Returns    : true = Allowed or false = Not Allowed                             */
    IsEmailCustChgAllowed: function (statusIn) { 
        return (statusIn == this.Revoked || statusIn == this.CallFail || statusIn == this.Requested || !statusIn)? true : false;
    }
};


/*--------------------------------------------------------------------------------------------------------------------------
* Global Constant for isUpdated Threshold (US631219)
	--- 10-26-2020	eAbramo		US627280 	LC_isupdated_threshold controls the threshold of isUpdated contacts processed in 
	--	a single scheduled job run of the script Scheduled_contact_AddRemove.js 
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_isupdated_threshold = 5000;



/*--------------------------------------------------------------------------------------------------------------------------
* Global Constant for LC_Saved_search (US631219)
	--- 10-26-2020	eAbramo		US627280 Saved Searches used in the scheduled job for setting isUpdated flag on Contact records
	--	The script being run is Scheduled_contact_AddRemove.js 
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Saved_search = {
		con_sync_elim_1:		'customsearch_contact_add_remove_e1',
		con_sync_elim_2:		'customsearch_contact_add_remove_e2',
		con_sync_elim_3:		'customsearch_contact_add_remove_e3',
		merged_scndry_cust:		'customsearch_merged_scndry_customer_sync',
		//US893691 - following 2 searches for Scheduled_customer_folioUnset.js 
		folio_access_item: 		'customsearch_folio_accessingitem_recs',
		folio_customers:		'customsearch_folio_customers'
};


/*--------------------------------------------------------------------------------------------------------------------------
* Global Constant for LC_Email
	--- 10-29-2020	eAbramo		US627280 Used as the recipient of emails caused by errors from the scheduled script
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_Email = {
		CRMEscalation:			'CRMEscalation@ebsco.com'	// CRM Escalation
	}

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_Transition_sts - Status list used for EDS/eHost/Explora/Ref Center Transitions
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_Transition_sts = {
		NotStart: 	1,		// Not Started 
		InProg: 	2,		// In Progress
		Complete:	3		// Complete
     };

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_OppFormType - Opportunity Form Type List (a custom list used to store the Opportunity form type (not the true Transaction form)
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_OppFormType = {
		Flipster:			2,
		WinSeR:				4,
		MarketingLead:		5,
		eBookQuote:			6,
		GobiSSD:			7,
		RFP:				8
}

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_Country - stores the hard-coded netSuite country code values (Note only includes values for code that has been added since using library constants file)
 * functions: isSalesRestricted
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_Country = {
		Cuba:			'CU',
		Iran:			'IR',
		Syria:			'SY',
		Afghanistan:	'AF',
		Russia:			'RU',		// added 01/03/2023 TA784410 Modify NetCRM Code to prevent order creation for Sites in Russia
        /*Function   : isSalesRestricted(countryIn)
         * Description: Determines whether Country passed in should be restricted from Sales
         * Input      : CountryIn = NetSuite ID of the Country
         * Returns    : true if the country is restricted, false if not    */
		isSalesRestricted: function (countryIn) { 
            return (countryIn == this.Cuba || countryIn == this.Iran || countryIn == this.Syria || countryIn == this.Afghanistan || countryIn == this.Russia) ? true : false;
        }	
}

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_EpCountry - stores the hard-coded netSuite country code values (Note only includes values for code that has been added since using library constants file)
 * functions: isSalesRestricted
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_EpCountry = {
		epCuba:			'52',
		epIran:			'98',
		epSyria:		'200',
		epAfghanistan:	'1',
		epRussia:		'174',	// added 01/03/2023 TA784410 Modify NetCRM Code to prevent order creation for Sites in Russia
        /*Function   : isSalesRestricted(countryIn)
         * Description: Determines whether Country passed in should be restricted from Sales
         * Input      : CountryIn = NetSuite ID of the Country
         * Returns    : true if the country is restricted, false if not    */
		isSalesRestricted: function (countryIn) { 
            return (countryIn == this.epCuba || countryIn == this.epIran || countryIn == this.epSyria || countryIn == this.epAfghanistan || countryIn == this.epRussia) ? true : false;
        }	
}

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_SfCaseDelSts - stores the SF Case Delete Status list values
 * functions: none
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_SfCaseDelSts = {
		none:			'1',
		inProg:			'2',
		complete:		'3'
}

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_YesNoOnly - stores the Yes and No list values
 * functions: none
 *
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_YesNoOnly = {
		Yes:		'1',
		No:			'2'
}

/*--------------------------------------------------------------------------------------------------------------------------
* LC_boomiCustMax - Stores the max. no. of Customer records to automatically be passed through Boomi Sync
*---------------------------------------------------------------------------------------------------------------------------*/
var LC_boomiCustMax = 1000;

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_SfAccessLevel - stores the SF EBSCO Connect Access Level list values 
 * 
 *		added as part of US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_SfAccessLevel = {
	Req: '1',		// Requested
	NeedsRev: '2',	// Needs Review
	Approved: '3',	// Approved
	Inact: '4',		// Inactivated
	Granted: '5',	// Granted
	Denied: '6',	// Denied
	Revoked: '7',	// Revoked
	Removed: '8',	// Removed
    /*Function   : notAllowed_viaUI(access_level_in)
         * Description: Determines whether EBSCO Connect Access Level passed in is one that Users are NOT allowed to set through the User-Interface
         * Input      : access_level_in = Id of the EBSCO Connect Access Level
         * Returns    : true = Not Allowed in UI -OR- false = allowed in UI */
	notAllowed_viaUI: function (access_level_in) { 
		return (access_level_in == this.Granted || access_level_in == this.Inact || access_level_in == this.NeedsRev || 
       	access_level_in == this.Req || access_level_in == this.Removed)? true : false;
	},
	/*Function   : validPortalUser(access_level_in)
	 * Description: Determines whether EBSCO Connect Access Level passed in indicates the Contact is a Valid Portal User
	 * Input      : access_level_in = Id of the EBSCO Connect Access Level
	 * Returns    : true -OR- false */
	validPortalUser: function(access_level_in) {
		return (access_level_in == this.Approved ||  access_level_in == this.Granted)? true : false;
	} 
};

/*--------------------------------------------------------------------------------------------------------------------------
 * LC_Prop_Based_Access - SF EC Property Based Access Level list values
 *
 *		added as part of US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_Prop_Based_Access = {
		Approved: '1',		// Approved
		Granted: '2',	// Granted
		Revoked: '3',	// Revoked
		Inactive: '4',		// Inactivated
		Removed: '5',		// Removed
		/*Function   : validPortalUser(access_level_in)
		 * Description: Determines whether EBSCO Connect Access Level passed in indicates the Contact is a Valid Portal User
		 * Input      : access_level_in = Id of the EBSCO Connect Access Level
		 * Returns    : true -OR- false */		
		validPortalUser: function(access_level_in) {
			return (access_level_in == this.Approved ||  access_level_in == this.Granted)? true : false;
		}
};


/*--------------------------------------------------------------------------------------------------------------------------
 * LC_SrpmConversionStatus - SRPM Conversion Status  list values
 *
 *		added as part of US963983 and US966153 EC ReArch: Contact Record Related Validation & Scripting
 *---------------------------------------------------------------------------------------------------------------------------*/
var LC_SrpmConversionStatus = {
		converted:	'1'		// Converted
}

