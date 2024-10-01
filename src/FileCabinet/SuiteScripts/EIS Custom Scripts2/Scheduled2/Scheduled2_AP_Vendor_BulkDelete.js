/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const idsToDelete = [
                '21748',
                '22614',
                '5811',
                '21716',
                '21721',
                '10048',
                '22725',
                '21736',
                '23103',
                '23403',
                '21701',
                '22011',
                '22017',
                '22023',
                '21770',
                '21778',
                '22055',
                '21823',
                '22086',
                '22609',
                '22616',
                '22642',
                '22664',
                '22670',
                '22676',
                '23019',
                '22905',
                '22831',
                '22832',
                '23701',
                '23771',
                '23702'
            ];
            //  Loop through the set of IDs
            try {
                idsToDelete.forEach((function (id) {
                    try {
                        record.delete({
                            type: 'customrecord_ns_acs_apvendor',
                            id: id
                        });
                        log.audit({
                            title: 'Record Deleted',
                            details: 'ID: ' + id
                        });
                    } catch (e) {
                        log.error({
                            title: 'Error Deleting Record, ID: ' + id,
                            details: "Error: " + e.message
                        });
                    }
                }))
            } catch (e) {
                log.error({title: 'Error', details: e.message});
            }
        }

        return {execute}

    });
