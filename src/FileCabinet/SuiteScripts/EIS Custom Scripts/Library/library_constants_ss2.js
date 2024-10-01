/**
 * library_constants_ss2.js
 * @NApiVersion 2.0
 */
/* Amendment Log:
 *  CNeale	04012019	US483145 Add in EIS Sales Netsuite for Mobile role (1138) to fieldSalesRoles 
 * 
 */
define([],
    function(){

        var LC2_Role = {
            //to add roles, separate each id by comma, example: [3,123,145];
            //FOR TASK FORM

            //array of roles for each checkbox
            accountExecRoles: [1146,1154,1112,1125,1150,1147,1124,1005,1059,1014,1054,1157], //Account Exec. Call
            fieldSalesRoles: [1113,1151,1052,1058,1037,1020,1042,1105,1107,1138], //Field Sales Call
            nonSalesRoles: [1071,1064,1009,1128,1008,1056,1074,1069,1010,1033,1011,1023,1083,1013,1006,1002,1003,1030,1085,1080,1115,1121,1123,1110,1109], //Non-Sales

            //For Task Type Default
            visitRoles: [1113,1151,1052,1058,1037,1020,1042,1105,1107,1138], //Default = Visit
            phoneCallRoles: [1146,1154,1112,1125,1150,1147,1124,1005,1059,1014,1054,1157], //Default = Phone Call

            internationalReps: [1014,1019,1058,1037,1041,1157], //International Reps
            publisherRole: 1080 //Publisher Role
            //End - Task Form
        };
    	
    return {
        LC2_Role: LC2_Role
    }
});